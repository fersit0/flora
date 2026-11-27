import { describe, expect, it } from 'vitest'
import ejemplo from '../datos/semana-ejemplo.json?raw'
import { cambiarLiga, conservarLigas, ligasDeLaSemana } from './ligas'
import { direccionDeLiga, leerSemana, type Semana } from './semana'

function lee(texto: string): Semana {
  const r = leerSemana(texto)
  if (!r.ok) throw new Error(r.motivo)
  return r.semana
}

function conLigas(ligas: Record<string, string>): string {
  return JSON.stringify({ ...JSON.parse(ejemplo), ligas }, null, 1)
}

describe('las ligas de la semana', () => {
  it('dice qué bloques abren cada liga, en el orden de la semana', () => {
    const ligas = ligasDeLaSemana(lee(ejemplo))
    expect(ligas).toEqual([
      { clave: 'planeador', bloques: ['crear lo mío', 'subir videos'], valor: 'https://example.com/' },
      { clave: 'correo', bloques: ['correos'], valor: 'message://' },
    ])
  })

  it('una liga que ningún bloque abre no se enlista', () => {
    const ligas = ligasDeLaSemana(lee(conLigas({ planeador: '', correo: '', sobra: 'https://example.com' })))
    expect(ligas.map((l) => l.clave)).toEqual(['planeador', 'correo'])
  })
})

describe('cambiar una liga', () => {
  it('pegar una dirección hace que el bloque la abra', () => {
    const texto = cambiarLiga(conLigas({ planeador: '', correo: '' }), 'planeador', '  https://example.com/mi-plan ')
    expect(texto).not.toBeNull()
    expect(direccionDeLiga(lee(texto!), { liga: 'planeador' })).toBe('https://example.com/mi-plan')
  })

  it('dejarla vacía la quita', () => {
    const texto = cambiarLiga(ejemplo, 'correo', '')
    expect(direccionDeLiga(lee(texto!), { liga: 'correo' })).toBeNull()
  })

  it('lo que no es una dirección no se guarda', () => {
    expect(cambiarLiga(ejemplo, 'planeador', 'mi planeador')).toBeNull()
    expect(cambiarLiga(ejemplo, 'planeador', 'javascript:alert(1)')).toBeNull()
  })

  it('no toca nada más de la semana', () => {
    const antes = JSON.parse(ejemplo)
    const despues = JSON.parse(cambiarLiga(ejemplo, 'planeador', 'https://example.com/otro')!)
    expect({ ...despues, ligas: antes.ligas }).toEqual(antes)
  })
})

describe('pegar una semana nueva conserva sus ligas', () => {
  const suya = conLigas({ planeador: 'https://example.com/mi-plan', correo: 'message://' })

  it('las que vienen vacías o no vienen se quedan como ella las tenía', () => {
    const nueva = JSON.stringify({ ...JSON.parse(ejemplo), ligas: { planeador: '' } })
    const s = lee(conservarLigas(nueva, suya))
    expect(s.ligas).toEqual({ planeador: 'https://example.com/mi-plan', correo: 'message://' })
  })

  it('las que vienen con dirección ganan', () => {
    const nueva = conLigas({ planeador: 'https://example.com/nuevo', correo: '' })
    expect(lee(conservarLigas(nueva, suya)).ligas.planeador).toBe('https://example.com/nuevo')
  })

  it('si no hay nada que conservar, el texto nuevo queda igual', () => {
    const nueva = conLigas({ planeador: 'https://example.com/a', correo: 'message://' })
    expect(conservarLigas(nueva, conLigas({ planeador: '', correo: '' }))).toBe(nueva)
  })
})
