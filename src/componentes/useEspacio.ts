// Lo que hay dentro de un espacio, leído del teléfono. Cada cambio se guarda al momento.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Guardado } from '../datos/guardado'
import type { DatosEspacio } from '../logic/espacio'

export type Cambiar = (cambio: (d: DatosEspacio) => DatosEspacio) => void

export function useEspacio(guardado: Guardado, id: string): [DatosEspacio | null, Cambiar] {
  const [datos, setDatos] = useState<DatosEspacio | null>(null)
  const actual = useRef<DatosEspacio | null>(null)

  useEffect(() => {
    let sigue = true
    guardado.leer(id).then((d) => {
      if (!sigue) return
      actual.current = d
      setDatos(d)
    })
    return () => {
      sigue = false
    }
  }, [guardado, id])

  const cambiar = useCallback<Cambiar>(
    (cambio) => {
      if (!actual.current) return
      const nuevo = cambio(actual.current)
      if (nuevo === actual.current) return
      actual.current = nuevo
      setDatos(nuevo)
      guardado.guardar(id, nuevo).catch(() => {})
    },
    [guardado, id],
  )

  return [datos, cambiar]
}

/** Un id único para cada pendiente o idea */
export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
