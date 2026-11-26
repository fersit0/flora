// El respaldo es su semana más todo lo que escribió en cada hoja, en un solo texto
// que puede guardar en su WhatsApp. La semana y el respaldo usan el mismo formato:
// una semana sola es un respaldo sin "hojas". Así se le puede instalar la app
// ya con sus listas cargadas, pegando un solo texto.
//
//   { "version": 1, "horas": …, "espacios": …, "dias": …, "hojas": { "velas": {…} } }

import { leerDatosEspacio, type DatosEspacio } from './espacio'
import { leerSemana, type Semana } from './semana'

/** Lo que escribió en cada hoja, por id de espacio */
export type Hojas = Record<string, DatosEspacio>

export type LecturaDatos =
  | {
      ok: true
      semana: Semana
      /** La semana sola (sin hojas), lista para guardarse en el teléfono */
      textoSemana: string
      /** Lo que traía escrito, o `null` si el texto era una semana sola */
      hojas: Hojas | null
    }
  | { ok: false; motivo: string }

function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/**
 * Lee lo que ella pegó: una semana sola o un respaldo. Nunca lanza error.
 * Si al copiarlo de WhatsApp se pegó algo antes o después (la fecha, su nombre),
 * se ignora: cuenta lo que va de la primera { a la última }.
 */
export function leerDatos(texto: string): LecturaDatos {
  const desde = texto.indexOf('{')
  const hasta = texto.lastIndexOf('}')
  if (desde === -1 || hasta < desde) return { ok: false, motivo: 'no es texto de datos (JSON)' }

  let crudo: unknown
  try {
    crudo = JSON.parse(texto.slice(desde, hasta + 1))
  } catch {
    return { ok: false, motivo: 'no es texto de datos (JSON)' }
  }
  if (!esObjeto(crudo)) return { ok: false, motivo: 'no tiene la forma de una semana' }

  const { hojas: hojasCrudas, ...soloSemana } = crudo
  const textoSemana = JSON.stringify(soloSemana, null, 1)
  const lectura = leerSemana(textoSemana)
  if (!lectura.ok) return lectura

  if (hojasCrudas === undefined) return { ok: true, semana: lectura.semana, textoSemana, hojas: null }
  if (!esObjeto(hojasCrudas)) return { ok: false, motivo: 'lo escrito en las hojas no tiene la forma correcta' }
  const hojas: Hojas = {}
  for (const [id, datos] of Object.entries(hojasCrudas)) hojas[id] = leerDatosEspacio(datos)
  return { ok: true, semana: lectura.semana, textoSemana, hojas }
}

/** Arma el respaldo: la semana tal cual se guardó, más lo que escribió en cada hoja. */
export function armarRespaldo(textoSemana: string, hojas: Hojas): string {
  return JSON.stringify({ ...JSON.parse(textoSemana), hojas }, null, 1)
}
