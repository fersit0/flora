import texto from './semana-ejemplo.json?raw'
import { leerSemana, type Semana } from '../logic/semana'

/** La semana de ejemplo (inventada). Se lee igual que el texto que ella pega. */
export function semanaDeEjemplo(): Semana {
  const lectura = leerSemana(texto)
  if (!lectura.ok) throw new Error(`La semana de ejemplo no se pudo leer: ${lectura.motivo}`)
  return lectura.semana
}
