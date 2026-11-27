import { describe, expect, it } from 'vitest'
import { semanaDeEjemplo } from '../datos/ejemplo'
import {
  borrarBloque,
  cambiarFinde,
  horaTexto,
  huecos,
  ponerBloque,
  textoDeSemana,
  tipoDeBloque,
  tiposDeBloque,
  type Cambio,
} from './editar'
import { leerSemana } from './semana'

const semana = semanaDeEjemplo()

/** Lo que hay hoy en ese lugar, como punto de partida para cambiarlo */
function cambioDe(dia: 'lun' | 'mar' | 'mié' | 'jue' | 'vie', indice: number, mas: Partial<Cambio> = {}): Cambio {
  const b = semana.dias[dia][indice]
  return { nombre: b.nombre, emoji: b.emoji, detalle: b.detalle, tipo: tipoDeBloque(b), dia, de: b.de, a: b.a, ...mas }
}

describe('de qué es cada bloque', () => {
  it('salen de su semana, con nombres que ella reconoce', () => {
    const tipos = tiposDeBloque(semana)
    const etiqueta = (clave: string) => tipos.find((t) => t.clave === clave)?.etiqueta
    expect(etiqueta('espacio:agencia')).toBe('Agencia Nube')
    expect(etiqueta('espacio:velas')).toBe('Velas Marea')
    expect(etiqueta('comida:cena')).toBe('cena')
    expect(etiqueta('nada:papel')).toBe('para mí')
    expect(etiqueta('nada:rayado')).toBe('pendientes sueltos')
    expect(etiqueta('liga:planeador')).toBe('crear lo mío · subir videos')
    // Cada tipo una sola vez
    expect(new Set(tipos.map((t) => t.clave)).size).toBe(tipos.length)
  })
})

describe('cambiar un bloque', () => {
  it('el nombre y el emoji; lo demás se queda', () => {
    const r = ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { nombre: 'yoga', emoji: '🧘' }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.semana.dias.lun[0]).toMatchObject({ nombre: 'yoga', nombreLargo: 'yoga', emoji: '🧘', de: 8, a: 9, color: 'papel' })
    expect(r.semana.dias.mar).toBe(semana.dias.mar)
  })

  it('de qué es: cambia su color y lo que abre', () => {
    const r = ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { tipo: 'espacio:velas' }))
    expect(r.ok && r.semana.dias.lun[0]).toMatchObject({ color: 'rosa', abre: { espacio: 'velas' } })
  })

  it('la hora y el día: se acomoda en orden', () => {
    const r = ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { dia: 'mar', de: 14, a: 15 }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.semana.dias.lun.map((b) => b.nombre)).not.toContain('caminar')
    expect(r.semana.dias.mar.map((b) => b.nombre)).toEqual(['desayuno', 'crear lo mío', 'comida', 'caminar', 'Café Lirio', 'cena', 'baile'])
    expect(r.lugar).toEqual({ dia: 'mar', indice: 3 })
  })

  it('si se encima con otro, lo dice y no cambia nada', () => {
    const r = ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { a: 10 }))
    expect(r).toEqual({ ok: false, motivo: 'se encima con «Agencia».' })
  })

  it('sin nombre, al revés o fuera de su horario, lo dice', () => {
    expect(ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { nombre: '  ' }))).toEqual({ ok: false, motivo: 'ponle un nombre.' })
    expect(ponerBloque(semana, { dia: 'lun', indice: 0 }, cambioDe('lun', 0, { de: 9, a: 8 })).ok).toBe(false)
    expect(ponerBloque(semana, { dia: 'lun', indice: 5 }, cambioDe('lun', 5, { de: 21, a: 23 }))).toEqual({
      ok: false,
      motivo: 'tu horario va de 8 a 10.',
    })
  })

  it('lo que sale sigue siendo una semana que se puede pegar y leer', () => {
    const r = ponerBloque(semana, { dia: 'vie', indice: 5 }, cambioDe('vie', 5, { nombre: 'lo de hoy', de: 17.5 }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const otraVez = leerSemana(textoDeSemana(r.semana))
    expect(otraVez.ok && otraVez.semana).toEqual(r.semana)
  })
})

describe('agregar y borrar', () => {
  it('agregar un bloque en un hueco', () => {
    const r = ponerBloque(semana, null, { nombre: 'leer', emoji: '📖', detalle: '', tipo: 'nada:papel', dia: 'lun', de: 19, a: 20 })
    expect(r.ok && r.semana.dias.lun.map((b) => b.nombre)).toEqual(['caminar', 'Agencia', 'comida', 'Agencia', 'grabar Velas', 'leer', 'cena'])
  })

  it('borrar un bloque', () => {
    const nueva = borrarBloque(semana, { dia: 'mar', indice: 5 })
    expect(nueva.dias.mar.map((b) => b.nombre)).not.toContain('baile')
    expect(nueva.dias.mar).toHaveLength(semana.dias.mar.length - 1)
  })

  it('los huecos de un día, en pedazos de una hora', () => {
    // lun: caminar 8–9, Agencia 9–13, comida 13–14, Agencia 14–17, grabar 17–19, cena 20–21
    expect(huecos(semana, 'lun')).toEqual([
      { de: 19, a: 20, hasta: 20 },
      { de: 21, a: 22, hasta: 22 },
    ])
    // mar empieza a las 9 y tiene libre de 14 a 15
    expect(huecos(semana, 'mar')).toEqual([
      { de: 8, a: 9, hasta: 9 },
      { de: 14, a: 15, hasta: 15 },
      { de: 18, a: 19, hasta: 19 },
      { de: 21, a: 22, hasta: 22 },
    ])
  })

  it('un hueco que empieza a la media hora se parte en la hora siguiente', () => {
    const r = ponerBloque(semana, { dia: 'lun', indice: 4 }, cambioDe('lun', 4, { a: 18.5 }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(huecos(r.semana, 'lun').slice(0, 2)).toEqual([
      { de: 18.5, a: 19, hasta: 20 },
      { de: 19, a: 20, hasta: 20 },
    ])
  })
})

describe('sábado, domingo y las horas', () => {
  it('cambiar el texto de sábado', () => {
    const nueva = cambiarFinde(semana, 'sab', { corto: 'playa', largo: 'playa con mis primas' })
    expect(nueva.finde.sab).toEqual({ corto: 'playa', largo: 'playa con mis primas' })
    expect(nueva.finde.dom).toBe(semana.finde.dom)
  })

  it('las horas se escriben como en su horario', () => {
    expect([8, 9.5, 12, 13, 13.5, 22].map(horaTexto)).toEqual(['8', '9:30', '12', '1', '1:30', '10'])
  })
})
