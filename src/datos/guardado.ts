// Guardado en el teléfono (IndexedDB, con la librería idb).
// - "espacios": lo que escribió en cada hoja (pendientes, lista e ideas), bajo el id del espacio.
// - "semana": el texto de su semana, tal cual se leyó al pegarlo.
//
// Hay dos guardados separados: el de su semana ("flora") y el de la semana de ejemplo
// ("flora-ejemplo"). Así jugar con el ejemplo nunca toca lo que ella escribió.
//
// iOS a veces corta la conexión con el guardado cuando la app pasó mucho tiempo en segundo
// plano. Si pasa, se vuelve a conectar y se intenta otra vez: nunca se muestra una hoja vacía
// ni se pierde lo que escribe.

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
  /** El texto de su semana, o `null` si todavía no la pega. Si no se pudo leer, falla. */
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
  // Desde que abre la app, no solo hasta que guarda algo
  pedirQueNoSeBorre()

  let base: Promise<IDBPDatabase<Esquema>> | undefined
  const abrir = () =>
    (base ??= openDB<Esquema>(nombre, 1, {
      upgrade(db) {
        // El guardado del ejemplo existe desde la fase 2 solo con "espacios";
        // no le hace falta "semana" porque la semana de ejemplo viene en la app.
        db.createObjectStore('espacios')
        db.createObjectStore('semana')
      },
      // iOS cortó la conexión: la próxima vez se abre una nueva
      terminated() {
        base = undefined
      },
    }).catch((e: unknown) => {
      base = undefined
      throw e
    }))

  /** Usa el guardado; si la conexión ya no sirve, se vuelve a conectar y lo intenta otra vez */
  async function conBase<T>(hacer: (db: IDBPDatabase<Esquema>) => Promise<T>): Promise<T> {
    const db = await abrir()
    try {
      return await hacer(db)
    } catch {
      if (base) {
        const actual = await base.catch(() => null)
        if (actual === db) {
          base = undefined
          db.close()
        }
      }
      return hacer(await abrir())
    }
  }

  return {
    nombre,
    async leer(id) {
      const deInicio = () => structuredClone(inicial[id] ?? espacioVacio())
      const guardado = await conBase((db) => db.get('espacios', id))
      return guardado === undefined ? deInicio() : leerDatosEspacio(guardado)
    },
    async guardar(id, datos) {
      await conBase((db) => db.put('espacios', datos, id))
    },
    async leerSemana() {
      return (await conBase((db) => db.get('semana', SEMANA))) ?? null
    },
    async leerHojas() {
      return conBase(async (db) => {
        const tx = db.transaction('espacios')
        const hojas: Hojas = {}
        for (let c = await tx.store.openCursor(); c; c = await c.continue()) {
          hojas[c.key] = leerDatosEspacio(c.value)
        }
        return hojas
      })
    },
    async guardarDatos(textoSemana, hojas) {
      await conBase(async (db) => {
        const tx = db.transaction(['semana', 'espacios'], 'readwrite')
        const pendientes: Promise<unknown>[] = [tx.objectStore('semana').put(textoSemana, SEMANA)]
        for (const [id, datos] of Object.entries(hojas ?? {})) pendientes.push(tx.objectStore('espacios').put(datos, id))
        await Promise.all([...pendientes, tx.done])
      })
    },
  }
}
