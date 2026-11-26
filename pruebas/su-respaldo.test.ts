// Su semana real y sus listas reales tienen que pasar por el respaldo sin cambiar ni una letra.
// Solo corre en la compu donde existe privado/ (en GitHub se salta). Lee sus datos al
// momento de correr y nunca imprime su texto: si algo falla, solo dice qué parte.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { espacioVacio } from '../src/logic/espacio'
import { armarRespaldo, leerDatos, type Hojas } from '../src/logic/respaldo'

const carpeta = join(import.meta.dirname, '..', 'privado')
const hayPrivado = existsSync(join(carpeta, 'semana.json')) && existsSync(join(carpeta, 'CONTENIDO.md'))

describe.skipIf(!hayPrivado)('su respaldo real', () => {
  it('su semana se lee, y con sus listas adentro el respaldo regresa todo idéntico', () => {
    const semana = leerDatos(readFileSync(join(carpeta, 'semana.json'), 'utf8'))
    expect(semana.ok, 'su semana no se pudo leer').toBe(true)
    if (!semana.ok) return

    const listas = [...readFileSync(join(carpeta, 'CONTENIDO.md'), 'utf8').matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1])
    const clientes = semana.semana.espacios.filter((e) => e.tipo === 'cliente')
    expect(listas.length, 'no encontré sus listas').toBeGreaterThan(0)
    const hojas: Hojas = {}
    clientes.forEach((c, i) => {
      hojas[c.id] = { ...espacioVacio(), contenidos: listas[i % listas.length] }
    })

    const vuelta = leerDatos(armarRespaldo(semana.textoSemana, hojas))
    expect(vuelta.ok, 'el respaldo no se pudo leer').toBe(true)
    if (!vuelta.ok) return
    expect(vuelta.semana, 'la semana cambió al pasar por el respaldo').toEqual(semana.semana)
    for (const c of clientes) {
      expect(vuelta.hojas?.[c.id]?.contenidos === hojas[c.id].contenidos, `la lista del espacio ${clientes.indexOf(c) + 1} cambió`).toBe(true)
    }
  })
})
