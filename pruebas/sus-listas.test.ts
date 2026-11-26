// Sus listas reales, tal como las lleva hoy en WhatsApp, tienen que entrar y salir idénticas.
// Solo corre en la compu donde existe privado/ (en GitHub se salta). Lee las listas al
// momento de correr y nunca imprime su texto: si algo falla, solo dice el número de renglón.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leerLista, marcarRenglon } from '../src/logic/lista'

const ruta = join(import.meta.dirname, '..', 'privado', 'CONTENIDO.md')
const hayPrivado = existsSync(ruta)

function susListas(): string[] {
  const md = readFileSync(ruta, 'utf8')
  return [...md.matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1])
}

describe.skipIf(!hayPrivado)('sus listas reales', () => {
  it('hay listas para revisar', () => {
    expect(susListas().length).toBeGreaterThan(0)
  })

  it('se lee su título, cada "Semana n" y cada contenido con su fecha', () => {
    for (const [n, lista] of susListas().entries()) {
      const renglones = leerLista(lista)
      const lineasConTexto = lista.split('\n').filter((l) => l.trim()).length
      const semanas = lista.split('\n').filter((l) => /^semana \d+\s*$/i.test(l)).length
      const cosas = renglones.filter((r) => r.tipo === 'cosa')
      expect(renglones.length, `lista ${n + 1}: se perdió algún renglón`).toBe(lineasConTexto)
      expect(renglones[0].tipo, `lista ${n + 1}: no reconoció el título`).toBe('titulo')
      expect(renglones.filter((r) => r.tipo === 'semana').length, `lista ${n + 1}: semanas`).toBe(semanas)
      const sinFecha = cosas.filter((c) => !c.fecha).map((c) => c.linea + 1)
      expect(sinFecha, `lista ${n + 1}: renglones sin fecha`).toEqual([])
    }
  })

  it('marcar cualquier renglón solo le cambia ese ✅, y desmarcarlo la deja idéntica', () => {
    for (const [n, lista] of susListas().entries()) {
      for (const r of leerLista(lista)) {
        if (r.tipo !== 'cosa') continue
        const marcada = marcarRenglon(lista, r.linea)
        const antes = lista.split('\n')
        const despues = marcada.split('\n')
        const distintas = despues.map((l, i) => (l !== antes[i] ? i : -1)).filter((i) => i >= 0)
        expect(distintas, `lista ${n + 1}, renglón ${r.linea + 1}`).toEqual([r.linea])
        const sinPalomita = (l: string) => l.replace(/\s*✅\s*$/, '').trimEnd()
        expect(sinPalomita(despues[r.linea]) === sinPalomita(antes[r.linea]), `lista ${n + 1}, renglón ${r.linea + 1}`).toBe(true)
        expect(marcarRenglon(marcada, r.linea) === lista, `lista ${n + 1}, renglón ${r.linea + 1}: no regresó igual`).toBe(true)
      }
    }
  })
})
