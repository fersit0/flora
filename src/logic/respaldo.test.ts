import { describe, expect, it } from 'vitest'
import ejemplo from '../datos/semana-ejemplo.json?raw'
import { armarRespaldo, leerDatos, type Hojas } from './respaldo'
import { leerSemana } from './semana'

// Lo que escribió en sus hojas (inventado), con lo difícil de su formato:
// emojis, espacios al final, renglones vacíos y saltos de línea de Windows.
const HOJAS: Hojas = {
  velas: {
    pendientes: [
      { id: 'p1', texto: 'pedir el logo en alta', hecho: false },
      { id: 'p2', texto: 'mandar "el catálogo" 🕯️', hecho: true },
    ],
    contenidos: '🕯️VELAS MAREA🕯️\nSemana 1 \nVideo largo Aromas 3/03 ✅\r\n\nSemana 2\nCarrusel Regalos 10/03  ',
    ideas: [],
  },
  ideas: {
    pendientes: [],
    contenidos: '',
    ideas: [{ id: 'i1', texto: 'fotos con la luz de la tarde', usada: true }],
  },
}

function lee(texto: string) {
  const r = leerDatos(texto)
  if (!r.ok) throw new Error(`no se leyó: ${r.motivo}`)
  return r
}

describe('leer lo que pega', () => {
  it('una semana sola se lee igual que con leerSemana, sin hojas', () => {
    const r = lee(ejemplo)
    const directo = leerSemana(ejemplo)
    expect(directo.ok && r.semana).toEqual(directo.ok && directo.semana)
    expect(r.hojas).toBeNull()
  })

  it('lo que se guarda de la semana no lleva las hojas', () => {
    const r = lee(armarRespaldo(lee(ejemplo).textoSemana, HOJAS))
    expect(JSON.parse(r.textoSemana)).not.toHaveProperty('hojas')
    expect(JSON.parse(r.textoSemana)).toEqual(JSON.parse(ejemplo))
  })

  it('ignora lo que WhatsApp pegue antes o después', () => {
    const respaldo = armarRespaldo(lee(ejemplo).textoSemana, HOJAS)
    const r = lee(`[26/11/26, 9:14 p.m.] Fer: ${respaldo}\n\nEnviado desde mi iPhone`)
    expect(r.hojas).toEqual(HOJAS)
  })

  it('si no sirve, dice por qué y no lanza error', () => {
    const malos = ['', 'hola', 'Semana 1\nVideo 3/03', '{', '{}', '[1, 2]', '{"version": 1}', ejemplo.slice(0, 500)]
    for (const texto of malos) {
      const r = leerDatos(texto)
      expect(r.ok, texto.slice(0, 30)).toBe(false)
      if (!r.ok) expect(r.motivo).not.toBe('')
    }
  })

  it('unas hojas que no son hojas no se aceptan', () => {
    const semana = JSON.parse(ejemplo)
    for (const hojas of ['texto', [1], null, 3]) {
      expect(leerDatos(JSON.stringify({ ...semana, hojas })).ok).toBe(false)
    }
  })

  it('dentro de cada hoja, lo que no tiene la forma correcta se ignora y lo demás se queda', () => {
    const semana = JSON.parse(ejemplo)
    const r = lee(
      JSON.stringify({
        ...semana,
        hojas: {
          velas: { pendientes: [{ id: 'p1', texto: 'sirve', hecho: true }, { texto: 'sin id' }, 7], contenidos: 3 },
          cafe: 'no es una hoja',
        },
      }),
    )
    expect(r.hojas!.velas).toEqual({ pendientes: [{ id: 'p1', texto: 'sirve', hecho: true }], contenidos: '', ideas: [] })
    expect(r.hojas!.cafe).toEqual({ pendientes: [], contenidos: '', ideas: [] })
  })
})

describe('ida y vuelta del respaldo', () => {
  it('armar y leer regresa la misma semana y exactamente lo que escribió', () => {
    const { textoSemana, semana } = lee(ejemplo)
    const r = lee(armarRespaldo(textoSemana, HOJAS))
    expect(r.semana).toEqual(semana)
    expect(r.hojas).toEqual(HOJAS)
    // Su lista, letra por letra
    expect(r.hojas!.velas.contenidos).toBe(HOJAS.velas.contenidos)
  })

  it('un respaldo de un respaldo es el mismo texto', () => {
    const respaldo = armarRespaldo(lee(ejemplo).textoSemana, HOJAS)
    const r = lee(respaldo)
    expect(armarRespaldo(r.textoSemana, r.hojas!)).toBe(respaldo)
  })

  it('sin nada escrito, el respaldo lleva las hojas vacías y se lee bien', () => {
    const r = lee(armarRespaldo(lee(ejemplo).textoSemana, {}))
    expect(r.hojas).toEqual({})
  })
})
