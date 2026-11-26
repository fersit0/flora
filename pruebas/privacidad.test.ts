// Regla que no se rompe: nada de la carpeta privado/ entra a lo que se sube.
// Esta prueba solo corre en la compu donde existe privado/ (en GitHub se salta,
// porque ahí esa carpeta no existe). Lee los datos privados al momento de correr:
// aquí no se escribe ninguno.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const raiz = join(import.meta.dirname, '..')
const rutaSemana = join(raiz, 'privado', 'semana.json')
const rutaContenido = join(raiz, 'privado', 'CONTENIDO.md')
const hayPrivado = existsSync(rutaSemana)

/** Todos los textos de un JSON, recorriéndolo completo */
function textos(x: unknown, fuera: Set<string> = new Set(['titulo'])): string[] {
  if (typeof x === 'string') return [x]
  if (Array.isArray(x)) return x.flatMap((y) => textos(y, fuera))
  if (x && typeof x === 'object')
    return Object.entries(x).flatMap(([k, v]) => (fuera.has(k) ? [] : textos(v, fuera)))
  return []
}

/** Frases y nombres propios de su semana y de sus listas que no deben aparecer en ningún lado */
function loQueNoDebeSalir(): string[] {
  const suyo = textos(JSON.parse(readFileSync(rutaSemana, 'utf8')))
  // Frases de dos o más palabras (ej. el nombre largo de un bloque, un detalle)
  const frases = suyo.filter((t) => t.trim().includes(' ') && t.trim().length >= 8)
  // Nombres propios (4 letras o más): un nombre suelto con mayúscula, o una palabra
  // con mayúscula a media frase. La mayúscula al inicio de una oración no cuenta.
  const nombres = suyo.flatMap((t) => [
    ...(/^\p{Lu}\p{L}{3,}$/u.test(t.trim()) ? [t.trim()] : []),
    ...(t.match(/(?<=[\p{L},] )\p{Lu}\p{L}{3,}/gu) ?? []),
  ])
  // Los renglones de sus listas en CONTENIDO.md (dentro de los bloques ```)
  const renglones: string[] = []
  if (existsSync(rutaContenido)) {
    const md = readFileSync(rutaContenido, 'utf8')
    for (const bloque of md.match(/```[\s\S]*?```/g) ?? []) {
      for (const r of bloque.split('\n').map((l) => l.trim())) {
        if (r.length >= 8 && !r.startsWith('```') && !/^Semana \d+$/.test(r)) renglones.push(r)
      }
    }
  }
  return [...new Set([...frases, ...nombres, ...renglones])]
}

/** Los archivos que se suben (los que git no ignora), menos los documentos que escribe Fer */
function archivosQueSeSuben(): string[] {
  const salida = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: raiz,
    encoding: 'utf8',
  })
  return salida
    .split('\n')
    .filter(Boolean)
    .filter((f) => !/\.(woff2|png|jpg|ico)$/.test(f))
    .filter((f) => f !== 'package-lock.json')
    .filter((f) => !['BRIEF.md', 'DISENO.md', 'CLAUDE.md'].includes(f))
}

describe.skipIf(!hayPrivado)('privacidad', () => {
  it('privado/ está fuera de lo que se sube', () => {
    expect(archivosQueSeSuben().filter((f) => f.startsWith('privado/'))).toEqual([])
  })

  it('ningún dato suyo aparece en el código, las pruebas ni los ejemplos', () => {
    const prohibido = loQueNoDebeSalir()
    expect(prohibido.length).toBeGreaterThan(5)
    const encontrados: string[] = []
    for (const archivo of archivosQueSeSuben()) {
      const contenido = readFileSync(join(raiz, archivo), 'utf8')
      for (const p of prohibido) {
        const esPalabra = !p.includes(' ')
        const aparece = esPalabra ? new RegExp(`(?<![\\p{L}])${p}(?![\\p{L}])`, 'u').test(contenido) : contenido.includes(p)
        // Solo se muestra en qué archivo, no el dato, para que no quede escrito en ningún reporte
        if (aparece) encontrados.push(archivo)
      }
    }
    expect([...new Set(encontrados)]).toEqual([])
  })
})
