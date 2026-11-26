// Lo que tiene que ver con la hora: qué día es hoy, dónde va la línea de "ahora"
// y cómo se escribe cada hora a la izquierda del horario.

import { DIAS, type Dia } from './semana'

export type Hoy = { tipo: 'semana'; dia: Dia } | { tipo: 'finde'; dia: 'sab' | 'dom' }

/** Qué día de la semana tipo es la fecha (domingo = 0 en JavaScript). */
export function queDiaEs(fecha: Date): Hoy {
  const n = fecha.getDay()
  if (n === 0) return { tipo: 'finde', dia: 'dom' }
  if (n === 6) return { tipo: 'finde', dia: 'sab' }
  return { tipo: 'semana', dia: DIAS[n - 1] }
}

/** La hora como número: 12:30 → 12.5 */
export function horaDecimal(fecha: Date): number {
  return fecha.getHours() + fecha.getMinutes() / 60
}

/** Cómo se escribe la hora a la izquierda: 8, 9 … 12, 1, 2 … (sin am/pm, como su imagen) */
export function etiquetaHora(h: number): string {
  const doce = h % 12
  return String(doce === 0 ? 12 : doce)
}

/** Dónde va algo en la cuadrícula, en porcentaje del alto: de dónde empieza y cuánto mide. */
export function posicion(de: number, a: number, inicio: number, fin: number): { arriba: number; alto: number } {
  const total = fin - inicio
  return { arriba: ((de - inicio) / total) * 100, alto: ((a - de) / total) * 100 }
}

/** Si la hora cae dentro del horario dibujado, en qué porcentaje va la línea. Si no, null. */
export function lineaAhora(hora: number, inicio: number, fin: number): number | null {
  if (hora < inicio || hora >= fin) return null
  return ((hora - inicio) / (fin - inicio)) * 100
}
