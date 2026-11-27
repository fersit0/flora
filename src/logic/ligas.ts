// Las ligas de su semana: cuáles hay y qué bloques las usan, y cambiarlas desde los ajustes
// (así ella misma pega la liga de su planeador). Viven en el texto de su semana.

import { DIAS, direccionValida, type Semana } from './semana'

export interface LigaDeSemana {
  clave: string
  /** Los nombres de los bloques que la abren, en el orden de la semana */
  bloques: string[]
  valor: string
}

/** Las ligas que abre algún bloque, en el orden en que aparecen de lunes a viernes. */
export function ligasDeLaSemana(semana: Semana): LigaDeSemana[] {
  const porClave = new Map<string, string[]>()
  for (const dia of DIAS) {
    for (const b of semana.dias[dia]) {
      if (b.abre === null || !('liga' in b.abre)) continue
      const nombres = porClave.get(b.abre.liga) ?? []
      if (!nombres.includes(b.nombre)) nombres.push(b.nombre)
      porClave.set(b.abre.liga, nombres)
    }
  }
  return [...porClave].map(([clave, bloques]) => ({ clave, bloques, valor: semana.ligas[clave] ?? '' }))
}

/**
 * Pone una liga en el texto de la semana. Vacía, la quita (el bloque deja de abrir algo).
 * Si no es una dirección que se pueda abrir, regresa `null` y no cambia nada.
 */
export function cambiarLiga(textoSemana: string, clave: string, valor: string): string | null {
  const limpio = valor.trim()
  if (limpio && !direccionValida(limpio)) return null
  const datos = JSON.parse(textoSemana)
  datos.ligas = { ...(datos.ligas ?? {}), [clave]: limpio }
  return JSON.stringify(datos, null, 1)
}

/**
 * Al pegar una semana nueva, cada liga que viene vacía conserva la que ella ya había puesto:
 * lo que ella escribió no se pierde por pegar una semana.
 */
export function conservarLigas(textoNuevo: string, textoAnterior: string): string {
  const nuevo = JSON.parse(textoNuevo)
  const anterior = JSON.parse(textoAnterior)
  let cambio = false
  for (const [clave, valor] of Object.entries(anterior.ligas ?? {})) {
    if (typeof valor !== 'string' || !valor.trim()) continue
    const nueva = nuevo.ligas?.[clave]
    if (typeof nueva === 'string' && nueva.trim()) continue
    nuevo.ligas = { ...(nuevo.ligas ?? {}), [clave]: valor }
    cambio = true
  }
  return cambio ? JSON.stringify(nuevo, null, 1) : textoNuevo
}
