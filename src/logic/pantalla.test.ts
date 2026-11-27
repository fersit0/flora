import { describe, expect, it } from 'vitest'
import { esAltoCorto } from './pantalla'

describe('el alto que le da el iPhone a la app instalada', () => {
  it('17 Pro cuando iOS da 812 de 874: no llega al borde de abajo', () => {
    expect(esAltoCorto({ instalada: true, alto: 812, pantalla: 874, arriba: 62 })).toBe(true)
  })

  it('17 Pro cuando iOS da los 874 completos: sí llega', () => {
    expect(esAltoCorto({ instalada: true, alto: 874, pantalla: 874, arriba: 62 })).toBe(false)
  })

  it('si la app empieza debajo de la hora, sí llega al borde aunque mida menos', () => {
    expect(esAltoCorto({ instalada: true, alto: 812, pantalla: 874, arriba: 0 })).toBe(false)
  })

  it('en Safari (sin instalar) nunca se ajusta', () => {
    expect(esAltoCorto({ instalada: false, alto: 700, pantalla: 874, arriba: 62 })).toBe(false)
  })
})
