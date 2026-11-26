import { describe, expect, it } from 'vitest'
import { leerLista, marcarRenglon } from './lista'

// Lista inventada, con todo lo que trae su formato real:
// título con emojis, "Semana n" con espacio al final, renglones sin tema,
// dos contenidos en una semana, fecha día/mes y el ✅ al final.
const LISTA = [
  '🕯️VELAS MAREA🕯️',
  'Semana 1',
  'Video largo Aromas 3/03 ✅',
  'Video corto Mechas 5/03 ✅',
  '',
  'Semana 2 ',
  'Carrusel Regalos 10/03',
  'Video largo Primavera 12/03',
  '',
  'Semana 3',
  'Video corto 19/03',
].join('\n')

describe('leer la lista', () => {
  it('reconoce el título, las semanas y cada contenido', () => {
    const r = leerLista(LISTA)
    expect(r.map((x) => x.tipo)).toEqual([
      'titulo', 'semana', 'cosa', 'cosa', 'semana', 'cosa', 'cosa', 'semana', 'cosa',
    ])
    expect(r[0]).toEqual({ tipo: 'titulo', linea: 0, texto: '🕯️VELAS MAREA🕯️' })
    expect(r[4]).toEqual({ tipo: 'semana', linea: 5, texto: 'Semana 2' })
  })

  it('separa el texto, la fecha y si ya está hecho', () => {
    const cosas = leerLista(LISTA).filter((x) => x.tipo === 'cosa')
    expect(cosas[0]).toEqual({ tipo: 'cosa', linea: 2, texto: 'Video largo Aromas', fecha: '3/03', hecho: true })
    expect(cosas[2]).toEqual({ tipo: 'cosa', linea: 6, texto: 'Carrusel Regalos', fecha: '10/03', hecho: false })
    // Renglón sin tema: solo el tipo y la fecha
    expect(cosas.at(-1)).toMatchObject({ texto: 'Video corto', fecha: '19/03', hecho: false })
  })

  it('un renglón sin fecha no inventa una', () => {
    expect(leerLista('Semana 1\nIdea de reel con perrito')[1]).toMatchObject({
      tipo: 'cosa',
      texto: 'Idea de reel con perrito',
      fecha: '',
    })
  })

  it('sin "Semana n", la primera línea es un contenido más, no un título', () => {
    const r = leerLista('Video largo 3/03\nVideo corto 5/03')
    expect(r.map((x) => x.tipo)).toEqual(['cosa', 'cosa'])
  })

  it('el ✅ solo cuenta al final del renglón', () => {
    expect(leerLista('Semana 1\nVideo ✅ de prueba 3/03')[1]).toMatchObject({ hecho: false, fecha: '3/03' })
    expect(leerLista('Semana 1\nVideo 3/03✅')[1]).toMatchObject({ hecho: true, fecha: '3/03', texto: 'Video' })
  })

  it('una lista vacía no tiene renglones', () => {
    expect(leerLista('')).toEqual([])
    expect(leerLista('\n  \n')).toEqual([])
  })
})

describe('ida y vuelta: lo que entra es lo que sale', () => {
  it('marcar un renglón solo le agrega ese ✅', () => {
    const marcado = marcarRenglon(LISTA, 6)
    const antes = LISTA.split('\n')
    const despues = marcado.split('\n')
    expect(despues).toHaveLength(antes.length)
    despues.forEach((linea, i) => {
      if (i === 6) expect(linea).toBe('Carrusel Regalos 10/03 ✅')
      else expect(linea).toBe(antes[i])
    })
  })

  it('marcar y desmarcar regresa el texto idéntico', () => {
    for (const r of leerLista(LISTA)) {
      if (r.tipo !== 'cosa') continue
      expect(marcarRenglon(marcarRenglon(LISTA, r.linea), r.linea)).toBe(LISTA)
    }
  })

  it('desmarcar quita el ✅ y su espacio', () => {
    expect(marcarRenglon(LISTA, 2).split('\n')[2]).toBe('Video largo Aromas 3/03')
  })

  it('respeta los espacios al final y los saltos de línea de Windows', () => {
    const texto = 'Semana 1 \r\nVideo largo 3/03  \r\nVideo corto 5/03\r\n'
    const marcado = marcarRenglon(texto, 1)
    expect(marcado).toBe('Semana 1 \r\nVideo largo 3/03 ✅  \r\nVideo corto 5/03\r\n')
    expect(marcarRenglon(marcado, 1)).toBe(texto)
  })

  it('no toca títulos, semanas ni renglones vacíos', () => {
    for (const linea of [0, 1, 4, 5, 99]) expect(marcarRenglon(LISTA, linea)).toBe(LISTA)
  })
})
