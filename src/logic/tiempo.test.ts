import { describe, expect, it } from 'vitest'
import { etiquetaHora, horaDecimal, lineaAhora, posicion, queDiaEs } from './tiempo'

// Fechas con hora local (sin zona), para que la prueba no dependa de dónde corre
const fecha = (dia: number, h = 12, m = 0) => new Date(2026, 10, dia, h, m) // noviembre 2026

describe('qué día es hoy', () => {
  it('lunes a viernes son días del horario', () => {
    expect(queDiaEs(fecha(23))).toEqual({ tipo: 'semana', dia: 'lun' })
    expect(queDiaEs(fecha(25))).toEqual({ tipo: 'semana', dia: 'mié' })
    expect(queDiaEs(fecha(27))).toEqual({ tipo: 'semana', dia: 'vie' })
  })

  it('sábado y domingo son fin de semana', () => {
    expect(queDiaEs(fecha(28))).toEqual({ tipo: 'finde', dia: 'sab' })
    expect(queDiaEs(fecha(29))).toEqual({ tipo: 'finde', dia: 'dom' })
  })
})

describe('horas', () => {
  it('escribe las horas como en su imagen', () => {
    expect([8, 9, 10, 11, 12, 13, 14, 21].map(etiquetaHora)).toEqual(['8', '9', '10', '11', '12', '1', '2', '9'])
    expect(etiquetaHora(0)).toBe('12')
  })

  it('convierte la hora en número', () => {
    expect(horaDecimal(fecha(25, 12, 30))).toBe(12.5)
    expect(horaDecimal(fecha(25, 8, 15))).toBe(8.25)
  })

  it('calcula dónde va cada bloque en el alto del horario', () => {
    expect(posicion(8, 22, 8, 22)).toEqual({ arriba: 0, alto: 100 })
    expect(posicion(15, 22, 8, 22)).toEqual({ arriba: 50, alto: 50 })
  })

  it('la línea de ahora solo aparece dentro del horario', () => {
    expect(lineaAhora(15, 8, 22)).toBe(50)
    expect(lineaAhora(8, 8, 22)).toBe(0)
    expect(lineaAhora(7.9, 8, 22)).toBeNull()
    expect(lineaAhora(22, 8, 22)).toBeNull()
    expect(lineaAhora(23.5, 8, 22)).toBeNull()
  })
})
