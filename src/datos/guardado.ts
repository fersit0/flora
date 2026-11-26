// Guardado en el teléfono (IndexedDB, con la librería idb).
// Cada espacio se guarda completo bajo su id: sus pendientes, su lista y sus ideas.
//
// Hay dos guardados separados: el de su semana ("flora") y el de la semana de ejemplo
// ("flora-ejemplo"). Así jugar con el ejemplo nunca toca lo que ella escribió.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { espacioVacio, leerDatosEspacio, type DatosEspacio } from '../logic/espacio'

interface Esquema extends DBSchema {
  espacios: { key: string; value: DatosEspacio }
}

export interface Guardado {
  leer(id: string): Promise<DatosEspacio>
  guardar(id: string, datos: DatosEspacio): Promise<void>
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
        db.createObjectStore('espacios')
      },
    }))

  return {
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
  }
}
