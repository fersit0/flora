// Su liga de instalación real: tiene que traer su semana y sus listas sin cambiar ni una letra.
// Solo corre en la compu donde existe privado/ (en GitHub se salta). Nunca imprime su texto.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { armarLiga, armarRespaldoInicial } from '../scripts/liga.mjs'
import { leerLiga } from '../src/logic/liga'
import { leerDatos } from '../src/logic/respaldo'

const carpeta = join(import.meta.dirname, '..', 'privado')
const hayPrivado = existsSync(join(carpeta, 'semana.json'))

describe.skipIf(!hayPrivado)('su liga real', () => {
  it('trae su semana y la lista de cada cliente, idénticas', async () => {
    const respaldo = armarRespaldoInicial(carpeta)
    const liga = armarLiga(respaldo)
    expect(liga.length, 'la liga es demasiado larga').toBeLessThan(8000)
    const vuelta = await leerLiga(new URL(liga).search)
    expect(vuelta === respaldo, 'la liga no regresa lo mismo').toBe(true)
    const lectura = leerDatos(vuelta!)
    expect(lectura.ok, 'su semana no se pudo leer desde la liga').toBe(true)
    if (!lectura.ok) return
    const clientes = lectura.semana.espacios.filter((e) => e.tipo === 'cliente')
    for (const [n, c] of clientes.entries()) {
      expect(lectura.hojas?.[c.id]?.contenidos.trim().length ?? 0, `el cliente ${n + 1} no trae su lista`).toBeGreaterThan(0)
    }
  })
})
