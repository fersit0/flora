import { describe, expect, it } from 'vitest'
import ejemplo from '../datos/semana-ejemplo.json?raw'
import { DIAS, diasDeEspacio, direccionDeLiga, leerSemana, resumenDeEspacio, type Semana } from './semana'

function lee(texto: string): Semana {
  const r = leerSemana(texto)
  if (!r.ok) throw new Error(`no se leyó: ${r.motivo}`)
  return r.semana
}

/** El ejemplo como objeto, para descomponerlo a propósito en cada prueba */
function base(): Record<string, any> {
  return JSON.parse(ejemplo)
}

describe('leer la semana', () => {
  it('lee la semana de ejemplo completa', () => {
    const s = lee(ejemplo)
    expect(s.horas).toEqual({ inicio: 8, fin: 22 })
    expect(s.espacios.map((e) => e.id)).toEqual(['agencia', 'velas', 'cafe', 'ideas'])
    for (const dia of DIAS) expect(s.dias[dia].length).toBeGreaterThan(0)
    expect(s.finde.sab.corto).not.toBe('')
    expect(s.finde.dom.corto).not.toBe('')
  })

  it('conserva lo que abre cada bloque', () => {
    const s = lee(ejemplo)
    const lun = s.dias.lun
    expect(lun.find((b) => b.nombre === 'caminar')?.abre).toBeNull()
    expect(lun.find((b) => b.nombre === 'Agencia')?.abre).toEqual({ espacio: 'agencia' })
    expect(lun.find((b) => b.nombre === 'comida')?.abre).toEqual({ comida: 'comida' })
    expect(s.dias.mar.find((b) => b.nombre === 'crear lo mío')?.abre).toEqual({ liga: 'planeador' })
  })

  it('acepta una liga marcada como por confirmar', () => {
    const d = base()
    d.dias.vie[4].abre = { liga: 'planeador', porConfirmar: true }
    expect(lee(JSON.stringify(d)).dias.vie.find((b) => b.nombre === 'subir videos')?.abre).toEqual({
      liga: 'planeador',
      porConfirmar: true,
    })
  })

  it('ordena los bloques de cada día por hora aunque vengan revueltos', () => {
    const d = base()
    d.dias.lun.reverse()
    const horas = lee(JSON.stringify(d)).dias.lun.map((b) => b.de)
    expect(horas).toEqual([...horas].sort((a, b) => a - b))
  })

  it('acepta medias horas', () => {
    const d = base()
    d.dias.lun[5].a = 21.5
    expect(lee(JSON.stringify(d)).dias.lun.at(-1)?.a).toBe(21.5)
  })

  it('rellena lo opcional: nombre largo, detalle y días sin bloques', () => {
    const d = base()
    delete d.dias.lun[0].nombreLargo
    delete d.dias.lun[0].detalle
    delete d.dias.vie
    const s = lee(JSON.stringify(d))
    expect(s.dias.lun[0].nombreLargo).toBe('caminar')
    expect(s.dias.lun[0].detalle).toBe('')
    expect(s.dias.vie).toEqual([])
  })
})

describe('pegar datos malos no rompe nada', () => {
  const malos: [string, (d: Record<string, any>) => unknown][] = [
    ['otra versión', (d) => (d.version = 2)],
    ['sin horas', (d) => delete d.horas],
    ['horas al revés', (d) => (d.horas = { inicio: 22, fin: 8 })],
    ['sin días', (d) => delete d.dias],
    ['un color que no existe', (d) => (d.dias.lun[0].color = 'azul')],
    ['un bloque que termina antes de empezar', (d) => (d.dias.lun[0].a = 7)],
    ['un bloque fuera del horario', (d) => (d.dias.lun[5].a = 23)],
    ['dos bloques encimados', (d) => (d.dias.lun[1].a = 15)],
    ['un bloque que abre un espacio que no existe', (d) => (d.dias.lun[1].abre = { espacio: 'otro' })],
    ['un espacio de tipo desconocido', (d) => (d.espacios[0].tipo = 'agenda')],
    ['dos espacios con el mismo id', (d) => (d.espacios[1].id = 'agencia')],
    ['un bloque sin nombre', (d) => delete d.dias.mar[0].nombre],
  ]

  it.each(malos)('rechaza %s', (_, descomponer) => {
    const d = base()
    descomponer(d)
    const r = leerSemana(JSON.stringify(d))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo.length).toBeGreaterThan(0)
  })

  it.each(['', 'hola', '{', '[]', 'null', '42', '"texto"'])('rechaza texto que no es una semana: %j', (texto) => {
    expect(leerSemana(texto).ok).toBe(false)
  })
})

describe('lo que va en la hoja de cada espacio', () => {
  it('los días en que toca cada espacio, de lunes a viernes', () => {
    const s = lee(ejemplo)
    expect(diasDeEspacio(s, 'velas')).toEqual(['lun', 'mié', 'vie'])
    expect(diasDeEspacio(s, 'cafe')).toEqual(['mar', 'jue'])
    expect(diasDeEspacio(s, 'ideas')).toEqual(['vie'])
    expect(diasDeEspacio(s, 'otro')).toEqual([])
  })

  it('la línea "por cada cosa" de cada espacio', () => {
    const s = lee(ejemplo)
    const velas = s.espacios.find((e) => e.id === 'velas')!
    expect(resumenDeEspacio(s, velas)).toBe('lunes grabo, miércoles edito, viernes entrego.')
    expect(resumenDeEspacio({ ...s, porCadaCosa: [] }, velas)).toBe('')
  })
})

describe('a dónde lleva cada liga', () => {
  function conLigas(ligas: Record<string, string>): Semana {
    return lee(JSON.stringify({ ...base(), ligas }))
  }

  it('una liga con dirección abre esa dirección: una página, el correo o una app', () => {
    const s = conLigas({ planeador: 'https://example.com/mi-plan', correo: 'message://', agenda: 'mailto:hola@example.com' })
    expect(direccionDeLiga(s, { liga: 'planeador' })).toBe('https://example.com/mi-plan')
    expect(direccionDeLiga(s, { liga: 'correo' })).toBe('message://')
    expect(direccionDeLiga(s, { liga: 'agenda' })).toBe('mailto:hola@example.com')
  })

  it('por confirmar no cambia nada: si tiene dirección, abre', () => {
    const s = conLigas({ planeador: 'https://example.com' })
    expect(direccionDeLiga(s, { liga: 'planeador', porConfirmar: true })).toBe('https://example.com/')
  })

  it('sin dirección, con una que no existe o con espacios nada más, no abre nada', () => {
    const s = conLigas({ planeador: '', correo: '   ' })
    expect(direccionDeLiga(s, { liga: 'planeador' })).toBeNull()
    expect(direccionDeLiga(s, { liga: 'correo' })).toBeNull()
    expect(direccionDeLiga(s, { liga: 'no-existe' })).toBeNull()
  })

  it('lo que no es una dirección, o es peligroso, no abre nada', () => {
    const s = conLigas({
      a: 'mi planeador',
      b: 'javascript:alert(1)',
      c: ' JavaScript:alert(1)',
      d: 'java\tscript:alert(1)',
      e: 'data:text/html,hola',
      f: 'file:///etc/passwd',
    })
    for (const liga of ['a', 'b', 'c', 'd', 'e', 'f']) expect(direccionDeLiga(s, { liga }), liga).toBeNull()
  })

  it('los bloques que no son liga no tienen dirección', () => {
    const s = conLigas({ planeador: 'https://example.com' })
    expect(direccionDeLiga(s, null)).toBeNull()
    expect(direccionDeLiga(s, { espacio: 'agencia' })).toBeNull()
    expect(direccionDeLiga(s, { comida: 'cena' })).toBeNull()
  })
})
