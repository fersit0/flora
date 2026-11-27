// La voz de los textos (DISENO.md): sin emojis de la app (solo su estrella ☆; los emojis
// de los bloques vienen de los datos de su semana) y sin signos de admiración.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const carpetas = ['pantallas', 'componentes'].map((c) => join(import.meta.dirname, c))
const archivos = carpetas.flatMap((c) => readdirSync(c).filter((f) => f.endsWith('.tsx')).map((f) => join(c, f)))

/** Lo que se ve en pantalla: el texto entre etiquetas y las frases entre comillas, sin comentarios */
function textosDe(archivo: string): string[] {
  const codigo = readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$|\{\/\*[\s\S]*?\*\/\}/gm, '')
  return [...codigo.matchAll(/>([^<>{}]+)</g), ...codigo.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)]
    .map((m) => (m[1] ?? m[2] ?? '').trim())
    .filter(Boolean)
}

describe('la voz de los textos', () => {
  it('la app no pone emojis propios: solo la estrella ☆', () => {
    const conEmoji = archivos.flatMap((a) => textosDe(a).filter((t) => /\p{Extended_Pictographic}/u.test(t.replace(/☆/g, ''))))
    expect(conEmoji).toEqual([])
  })

  it('sin signos de admiración (nada de frases para animarla)', () => {
    const conAdmiracion = archivos.flatMap((a) => textosDe(a).filter((t) => /¡/.test(t)))
    expect(conAdmiracion).toEqual([])
  })
})
