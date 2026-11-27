// Un solo sistema de diseño (DISENO.md), revisado en el archivo de estilos:
// colores y letras en variables, sin degradados ni rebotes, y todo lo que se mueve
// respeta "reducir movimiento" del iPhone.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(import.meta.dirname, 'estilos.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const raiz = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')) + 1)
const fuera = css.replace(raiz, '')
const inicioCalma = fuera.indexOf('@media (prefers-reduced-motion: reduce)')
const calma = fuera.slice(inicioCalma, fuera.indexOf('\n}', inicioCalma))

/** Las reglas de un pedazo de CSS: [selectores, declaraciones] */
function reglas(texto: string): [string[], string][] {
  return [...texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [
    m[1].split(',').map((s) => s.replace(/@media[^{]*/, '').trim()).filter(Boolean),
    m[2],
  ])
}

describe('un solo sistema de diseño', () => {
  it('cada tamaño de letra sale de la escala de variables', () => {
    const sueltos = [...fuera.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]).filter((v) => !/^var\(--letra-|^inherit$/.test(v))
    expect(sueltos).toEqual([])
  })

  it('cada color sale de las variables', () => {
    expect(fuera.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? []).toEqual([])
  })

  it('sin degradados: solo los cuadros vichy de la franja y las rayas del bloque de pendientes sueltos', () => {
    const conDegradado = reglas(fuera)
      .filter(([, decl]) => decl.includes('gradient('))
      .flatMap(([sel]) => sel)
    expect(conDegradado.sort()).toEqual(['.color-rayado', '.franja'])
    // Y son dibujos de orillas duras, no colores que se funden: cada color empieza
    // justo donde acaba el anterior ("rosa 50%, transparente 50%")
    for (const [, cuerpo] of fuera.matchAll(/linear-gradient\(((?:[^()]|\([^()]*\))*)\)/g)) {
      const paradas = cuerpo
        .split(/,(?![^(]*\))/)
        .map((p) => p.trim())
        .filter((p) => !/deg$|^to /.test(p))
        .map((p) => p.replace(/var\([^)]*\)|transparent/, '').trim().split(/\s+/))
      for (let i = 1; i < paradas.length; i++) {
        expect(paradas[i][0], cuerpo).toBe(paradas[i - 1].at(-1))
      }
    }
  })
})

describe('movimiento', () => {
  it('solo se mueven las hojas al subir y bajar (200 ms, sin rebote)', () => {
    const animaciones = [...fuera.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
    expect(animaciones.sort()).toEqual(['aparecer', 'bajar', 'desaparecer', 'subir'])
    for (const [, nombre, ms] of fuera.matchAll(/animation:\s*([\w-]+)\s+(\d+)ms/g)) {
      expect(Number(ms), nombre).toBe(200)
    }
    expect(fuera).not.toMatch(/cubic-bezier/)
  })

  it('lo que cambia al presionarlo responde rápido (120 ms) y sin rebote', () => {
    for (const [, ms] of fuera.matchAll(/transition:\s*[\w-]+\s+(\d+)ms\s+ease-out/g)) {
      expect(Number(ms)).toBeLessThanOrEqual(200)
    }
  })

  it('todo lo que se mueve se queda quieto si el iPhone pide reducir movimiento', () => {
    expect(inicioCalma).toBeGreaterThan(0)
    const quietos = new Set(reglas(calma).flatMap(([sel]) => sel))
    const seMueven = reglas(fuera.replace(calma, ''))
      .filter(([, decl]) => /(?:^|;|\s)(?:transition|animation)\s*:(?!\s*none)/.test(decl))
      .flatMap(([sel]) => sel)
    expect(seMueven.filter((s) => !quietos.has(s))).toEqual([])
  })
})
