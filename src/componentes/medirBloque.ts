// ¿Cabe este nombre en el bloque? Se mide de verdad: se pone un bloque invisible igualito
// en su día, con el alto que tendría en el horario, y se revisa que cada letra quede adentro
// y que ninguna palabra se parta en dos renglones (lo mismo que revisan las pruebas).

import type { Color, Dia } from '../logic/semana'

interface Medida {
  dia: Dia
  de: number
  a: number
  emoji: string
  nombre: string
  color: Color
  /** Cuántas horas tiene su horario */
  horas: number
}

export function cabeEnElBloque({ dia, de, a, emoji, nombre, color, horas }: Medida): boolean {
  const columna = document.querySelector(`.columna[data-dia="${dia}"]`)
  const cuadricula = document.querySelector('.cuadricula')
  if (!columna || !cuadricula) return true
  const raiz = getComputedStyle(document.documentElement)
  // En Safari (sin instalar) la página se estira para que cada hora mida al menos eso
  const minima = document.documentElement.classList.contains('instalada')
    ? 0
    : parseFloat(raiz.getPropertyValue('--hora-minima')) || 0
  const hora = Math.max(cuadricula.getBoundingClientRect().height / horas, minima)
  const entre = parseFloat(raiz.getPropertyValue('--entre-bloques')) || 0

  const prueba = document.createElement('div')
  prueba.className = `bloque color-${color}`
  prueba.style.cssText = `top:0;height:${(a - de) * hora - entre}px;visibility:hidden`
  const parte = (clase: string, texto: string) => {
    const span = document.createElement('span')
    span.className = clase
    span.textContent = texto
    prueba.append(span)
  }
  if (emoji) parte('emoji', emoji)
  parte('nombre', nombre)
  columna.append(prueba)
  try {
    const c = prueba.getBoundingClientRect()
    const s = getComputedStyle(prueba)
    const abajo = c.bottom - parseFloat(s.borderBottomWidth)
    const derecha = c.right - parseFloat(s.borderRightWidth)
    const rango = document.createRange()
    for (const span of prueba.querySelectorAll('span')) {
      const texto = span.firstChild
      if (!texto) continue
      rango.selectNodeContents(texto)
      for (const r of rango.getClientRects()) if (r.bottom > abajo + 1 || r.right > derecha + 1) return false
      let desde = 0
      for (const palabra of (texto.textContent ?? '').split(' ')) {
        if (palabra) {
          rango.setStart(texto, desde)
          rango.setEnd(texto, desde + palabra.length)
          if (new Set([...rango.getClientRects()].map((r) => Math.round(r.top))).size > 1) return false
        }
        desde += palabra.length + 1
      }
    }
    return true
  } finally {
    prueba.remove()
  }
}
