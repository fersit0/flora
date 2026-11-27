// Guardado en el teléfono (IndexedDB, con la librería idb).
// - "espacios": lo que escribió en cada hoja (pendientes, lista e ideas), bajo el id del espacio.
// - "semana": el texto de su semana, tal cual se leyó al pegarlo.
//
// Hay dos guardados separados: el de su semana ("flora") y el de la semana de ejemplo
// ("flora-ejemplo"). Así jugar con el ejemplo nunca toca lo que ella escribió.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { espacioVacio, leerDatosEspacio, type DatosEspacio } from '../logic/espacio'
import type { Hojas } from '../logic/respaldo'

interface Esquema extends DBSchema {
  espacios: { key: string; value: DatosEspacio }
  semana: { key: string; value: string }
}

const SEMANA = 'actual'

export interface Guardado {
  /** "flora" o "flora-ejemplo" */
  nombre: string
  leer(id: string): Promise<DatosEspacio>
  guardar(id: string, datos: DatosEspacio): Promise<void>
  /** El texto de su semana, o `null` si todavía no la pega */
  leerSemana(): Promise<string | null>
  /** Todo lo que escribió, hoja por hoja (para el respaldo) */
  leerHojas(): Promise<Hojas>
  /**
   * Guarda una semana nueva y, si viene de un respaldo, lo que traía escrito.
   * Va todo junto: si algo falla, no se guarda nada y queda lo que había.
   * Las hojas que el respaldo no trae se quedan como estaban.
   */
  guardarDatos(textoSemana: string, hojas: Hojas | null): Promise<void>
}

let yaSePidio = false
/** Le pide al teléfono que no borre lo guardado aunque le falte espacio. */
function pedirQueNoSeBorre() {
  if (yaSePidio) return
  yaSePidio = true
  navigator.storage?.persist?.().catch(() => {})
}

/**
 * @param nombre  "flora" para su semana, "flora-ejemplo" para la de ejemplo
 * @param inicial lo que trae un espacio que nunca se ha abierto (solo el ejemplo trae algo)
 */
export function abrirGuardado(nombre: string, inicial: Record<string, DatosEspacio> = {}): Guardado {
  let base: Promise<IDBPDatabase<Esquema>> | undefined
  const abrir = () =>
    (base ??= openDB<Esquema>(nombre, 1, {
      upgrade(db) {
        // El guardado del ejemplo existe desde la fase 2 solo con "espacios";
        // no le hace falta "semana" porque la semana de ejemplo viene en la app.
        db.createObjectStore('espacios')
        db.createObjectStore('semana')
      },
    }))

  return {
    nombre,
    async leer(id) {
      const deInicio = () => structuredClone(inicial[id] ?? espacioVacio())
      try {
        const guardado = await (await abrir()).get('espacios', id)
        return guardado === undefined ? deInicio() : leerDatosEspacio(guardado)
      } catch {
        return deInicio()
      }
    },
    async guardar(id, datos) {
      pedirQueNoSeBorre()
      await (await abrir()).put('espacios', datos, id)
    },
    async leerSemana() {
      try {
        return (await (await abrir()).get('semana', SEMANA)) ?? null
      } catch {
        return null
      }
    },
    async leerHojas() {
      const db = await abrir()
      const tx = db.transaction('espacios')
      const hojas: Hojas = {}
      for (let c = await tx.store.openCursor(); c; c = await c.continue()) {
        hojas[c.key] = leerDatosEspacio(c.value)
      }
      return hojas
    },
    async guardarDatos(textoSemana, hojas) {
      pedirQueNoSeBorre()
      const tx = (await abrir()).transaction(['semana', 'espacios'], 'readwrite')
      const pendientes: Promise<unknown>[] = [tx.objectStore('semana').put(textoSemana, SEMANA)]
      for (const [id, datos] of Object.entries(hojas ?? {})) pendientes.push(tx.objectStore('espacios').put(datos, id))
      await Promise.all([...pendientes, tx.done])
    },
  }
}
