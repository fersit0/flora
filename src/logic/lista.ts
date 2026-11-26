// La lista de contenidos se guarda como el texto que ella ya escribe en WhatsApp:
//
//   Semana 1
//   Video largo Velas 3/03 ✅
//   Video corto Tazas 5/03
//
// Este archivo solo la lee para dibujarla bonito, y pone o quita el ✅ de un renglón.
// Nunca reescribe el texto: lo que entra es lo que sale, espacio por espacio.

export type Renglon =
  | { tipo: 'titulo'; linea: number; texto: string }
  | { tipo: 'semana'; linea: number; texto: string }
  | { tipo: 'cosa'; linea: number; texto: string; fecha: string; hecho: boolean }

const SEMANA = /^\s*semana\s+\d+\s*$/i
const HECHO = /✅️?\s*$/
const FECHA = /(?:^|\s)(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)$/

function esSemana(linea: string) {
  return SEMANA.test(linea)
}

/** Lee el texto renglón por renglón. Los renglones vacíos no se dibujan. */
export function leerLista(texto: string): Renglon[] {
  const lineas = texto.split('\n')
  // La primera línea es su título (con emojis) solo si la lista trae "Semana n" más abajo
  const primeraSemana = lineas.findIndex(esSemana)
  const primeraConTexto = lineas.findIndex((l) => l.trim() !== '')
  const lineaTitulo = primeraSemana > primeraConTexto ? primeraConTexto : -1

  const renglones: Renglon[] = []
  lineas.forEach((linea, i) => {
    if (linea.trim() === '') return
    if (i === lineaTitulo) {
      renglones.push({ tipo: 'titulo', linea: i, texto: linea.trim() })
    } else if (esSemana(linea)) {
      renglones.push({ tipo: 'semana', linea: i, texto: linea.trim() })
    } else {
      const hecho = HECHO.test(linea)
      const sinPalomita = linea.replace(HECHO, '').trim()
      const fecha = sinPalomita.match(FECHA)?.[1] ?? ''
      const texto = fecha ? sinPalomita.slice(0, -fecha.length).trim() : sinPalomita
      renglones.push({ tipo: 'cosa', linea: i, texto, fecha, hecho })
    }
  })
  return renglones
}

/**
 * Pone o quita el ✅ al final de un renglón (por su número de línea).
 * Lo demás del texto queda idéntico, incluidos espacios y saltos de línea.
 */
export function marcarRenglon(texto: string, linea: number): string {
  const lineas = texto.split('\n')
  const renglon = leerLista(texto).find((r) => r.linea === linea)
  if (!renglon || renglon.tipo !== 'cosa') return texto

  const actual = lineas[linea]
  if (renglon.hecho) {
    // Quita el ✅ y el espacio que lo separaba; respeta lo que haya después (espacios, \r)
    lineas[linea] = actual.replace(/ ?✅️?(\s*)$/, '$1')
  } else {
    const [, contenido, final] = actual.match(/^(.*?)(\s*)$/s)!
    lineas[linea] = `${contenido} ✅${final}`
  }
  return lineas.join('\n')
}
