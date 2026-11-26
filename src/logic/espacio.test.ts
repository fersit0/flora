import { describe, expect, it } from 'vitest'
import {
  agregarIdea,
  agregarPendiente,
  borrarHechos,
  cambiarContenidos,
  editarIdea,
  editarPendiente,
  espacioVacio,
  leerDatosEspacio,
  marcarPendiente,
  usarIdea,
  type DatosEspacio,
} from './espacio'

function conPendientes(...textos: string[]): DatosEspacio {
  return textos.reduce((d, t, i) => agregarPendiente(d, t, `p${i + 1}`), espacioVacio())
}

describe('pendientes', () => {
  it('agrega al final, sin espacios de sobra', () => {
    const d = conPendientes('  comprar tela ', 'llamar a la imprenta')
    expect(d.pendientes).toEqual([
      { id: 'p1', texto: 'comprar tela', hecho: false },
      { id: 'p2', texto: 'llamar a la imprenta', hecho: false },
    ])
  })

  it('no agrega un pendiente vacío', () => {
    const d = espacioVacio()
    expect(agregarPendiente(d, '   ', 'x')).toBe(d)
  })

  it('tocar el círculo lo marca y volver a tocarlo lo desmarca', () => {
    const d = marcarPendiente(conPendientes('uno', 'dos'), 'p1')
    expect(d.pendientes.map((p) => p.hecho)).toEqual([true, false])
    expect(marcarPendiente(d, 'p1').pendientes.map((p) => p.hecho)).toEqual([false, false])
  })

  it('editar cambia el texto; dejarlo vacío lo quita', () => {
    const d = conPendientes('uno', 'dos')
    expect(editarPendiente(d, 'p2', ' dos y medio ').pendientes[1].texto).toBe('dos y medio')
    expect(editarPendiente(d, 'p2', '').pendientes.map((p) => p.id)).toEqual(['p1'])
  })

  it('borrar los hechos deja solo lo que falta', () => {
    const d = marcarPendiente(marcarPendiente(conPendientes('a', 'b', 'c'), 'p1'), 'p3')
    expect(borrarHechos(d).pendientes.map((p) => p.texto)).toEqual(['b'])
  })
})

describe('lista de contenidos', () => {
  it('se guarda idéntica, con todo y espacios', () => {
    const texto = '☀️LISTA☀️\nSemana 1 \nVideo 3/03 ✅\n\n'
    expect(cambiarContenidos(espacioVacio(), texto).contenidos).toBe(texto)
  })
})

describe('ideas', () => {
  it('la más nueva va arriba', () => {
    const d = agregarIdea(agregarIdea(espacioVacio(), 'primera', 'i1'), 'segunda', 'i2')
    expect(d.ideas.map((i) => i.texto)).toEqual(['segunda', 'primera'])
  })

  it('"ya la usé" la manda al final', () => {
    let d = espacioVacio()
    for (const [t, id] of [['a', 'i1'], ['b', 'i2'], ['c', 'i3']]) d = agregarIdea(d, t, id)
    d = usarIdea(d, 'i3')
    // Antes: c, b, a (la más nueva arriba). Después de usar la "c": b, a, c
    expect(d.ideas.map((i) => [i.texto, i.usada])).toEqual([
      ['b', false],
      ['a', false],
      ['c', true],
    ])
  })

  it('editar cambia el texto; dejarla vacía la quita', () => {
    const d = agregarIdea(espacioVacio(), 'reel', 'i1')
    expect(editarIdea(d, 'i1', 'reel de otoño').ideas[0].texto).toBe('reel de otoño')
    expect(editarIdea(d, 'i1', '  ').ideas).toEqual([])
  })
})

describe('leer lo guardado', () => {
  it('lee lo que se guardó', () => {
    const d = agregarIdea(marcarPendiente(conPendientes('uno'), 'p1'), 'idea', 'i1')
    const guardado = JSON.parse(JSON.stringify(cambiarContenidos(d, 'Semana 1\nVideo')))
    expect(leerDatosEspacio(guardado)).toEqual(cambiarContenidos(d, 'Semana 1\nVideo'))
  })

  it('lo que no tiene forma se ignora y no rompe nada', () => {
    for (const x of [undefined, null, 42, 'hola', [], { pendientes: 'no' }]) {
      expect(leerDatosEspacio(x)).toEqual(espacioVacio())
    }
    expect(leerDatosEspacio({ pendientes: [{ id: 'a', texto: 'ok' }, { texto: 'sin id' }, null] }).pendientes).toEqual([
      { id: 'a', texto: 'ok', hecho: false },
    ])
  })
})
