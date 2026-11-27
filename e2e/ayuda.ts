import { expect, type Page } from '@playwright/test'

/** Abre la app con la semana de ejemplo, a la fecha y hora indicadas (hora de CDMX). */
export async function abrir(page: Page, fecha: string) {
  await page.clock.setFixedTime(new Date(fecha))
  await page.goto('?demo=1')
  await page.locator('.bloque').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}

/**
 * Regla 2 del BRIEF: el horario completo se ve sin deslizar
 * y ningún bloque corta su texto.
 */
export async function revisarQueCabe(page: Page) {
  const medida = await page.evaluate(() => ({
    altoPagina: document.documentElement.scrollHeight,
    anchoPagina: document.documentElement.scrollWidth,
    altoPantalla: window.innerHeight,
    anchoPantalla: window.innerWidth,
    finDelFinde: document.querySelector('.finde')!.getBoundingClientRect().bottom,
  }))
  expect(medida.altoPagina, 'la página mide más que la pantalla').toBeLessThanOrEqual(medida.altoPantalla)
  expect(medida.anchoPagina, 'la página es más ancha que la pantalla').toBeLessThanOrEqual(medida.anchoPantalla)
  expect(medida.finDelFinde, 'sábado y domingo se salen de la pantalla').toBeLessThanOrEqual(medida.altoPantalla)

  // Se mide dónde quedó cada letra de verdad: tiene que caber completa dentro de su caja
  // (bloque, sábado, domingo o día), y ninguna palabra se puede partir en dos renglones.
  // El reporte dice el día y el número de bloque, nunca el texto (así sirve también con su semana real).
  const cortados = await page.$$eval('.bloque, .finde-dia, .dia', (cajas) => {
    const problemas: string[] = []
    const tolerancia = 1 // px, por redondeo
    for (const caja of cajas) {
      const c = caja.getBoundingClientRect()
      const s = getComputedStyle(caja)
      const adentro = {
        arriba: c.top + parseFloat(s.borderTopWidth),
        abajo: c.bottom - parseFloat(s.borderBottomWidth),
        izquierda: c.left + parseFloat(s.borderLeftWidth),
        derecha: c.right - parseFloat(s.borderRightWidth),
      }
      const columna = caja.closest('[data-dia]')
      const cual = columna
        ? `${columna.getAttribute('data-dia')}, bloque ${[...columna.querySelectorAll('.bloque')].indexOf(caja) + 1}`
        : caja.className
      const rango = document.createRange()
      const textos = document.createTreeWalker(caja, NodeFilter.SHOW_TEXT)
      for (let nodo = textos.nextNode(); nodo; nodo = textos.nextNode()) {
        const texto = nodo.textContent ?? ''
        if (!texto.trim()) continue
        rango.selectNodeContents(nodo)
        for (const r of rango.getClientRects()) {
          const fuera =
            r.bottom > adentro.abajo + tolerancia ||
            r.top < adentro.arriba - tolerancia ||
            r.right > adentro.derecha + tolerancia ||
            r.left < adentro.izquierda - tolerancia
          if (fuera) problemas.push(`${cual}: texto cortado`)
        }
        // Cada palabra debe quedar en un solo renglón
        let desde = 0
        for (const palabra of texto.split(' ')) {
          if (palabra) {
            rango.setStart(nodo, desde)
            rango.setEnd(nodo, desde + palabra.length)
            const renglones = new Set([...rango.getClientRects()].map((r) => Math.round(r.top)))
            if (renglones.size > 1) problemas.push(`${cual}: palabra partida`)
          }
          desde += palabra.length + 1
        }
      }
    }
    return [...new Set(problemas)]
  })
  expect(cortados, 'hay textos cortados').toEqual([])
}

/** Regla 5: nada regaña. Ningún texto, fondo ni borde rojo en lo que se ve. */
export async function revisarQueNoHayRojo(page: Page) {
  const rojos = await page.$$eval('*', (els) =>
    els
      .map((e) => getComputedStyle(e))
      .flatMap((s) => [s.color, s.backgroundColor, s.borderTopColor])
      .filter((c) => {
        const m = c.match(/\d+(\.\d+)?/g)
        if (!m) return false
        const [r, g, b] = m.map(Number)
        return r > 180 && g < 80 && b < 80
      }),
  )
  expect(rojos, 'hay algo rojo en la pantalla').toEqual([])
}

/** Toca el bloque con ese nombre y espera a que su hoja termine de subir. */
export async function abrirHoja(page: Page, bloque: string) {
  await page.getByRole('button', { name: bloque }).first().click()
  const hoja = page.getByRole('dialog')
  await expect(hoja).toBeVisible()
  await page.waitForTimeout(350) // lo que dura la animación, y los primeros toques que se ignoran (doble toque)
  return hoja
}

/** Espera a que lo que se ve ya esté guardado en el teléfono (IndexedDB del ejemplo). */
export async function esperarGuardado(page: Page, espacio: string, contiene: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (id) =>
            new Promise<string>((listo) => {
              const abrir = indexedDB.open('flora-ejemplo')
              abrir.onsuccess = () => {
                const leer = abrir.result.transaction('espacios').objectStore('espacios').get(id)
                leer.onsuccess = () => {
                  listo(JSON.stringify(leer.result ?? null))
                  abrir.result.close()
                }
              }
            }),
          espacio,
        ),
      { message: 'no se terminó de guardar' },
    )
    .toContain(contiene)
}

/**
 * Todo el texto que se ve se lee: contraste de 4.5 o más contra lo que tiene detrás
 * (también el texto guía de los campos). No cuenta lo que está tapado por una hoja
 * ni los botones apagados. Regresa lo que no se lee, sin el texto (sirve con su semana real).
 */
export async function revisarQueSeLee(page: Page, { aparte = '' }: { aparte?: string } = {}) {
  const bajos = await page.evaluate((aparte) => {
    type Color = { r: number; g: number; b: number; a: number }
    const leer = (c: string): Color => {
      const [r, g, b, a = 1] = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number)
      return { r, g, b, a }
    }
    const luz = ({ r, g, b }: Color) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const encima = (arriba: Color, abajo: Color): Color => ({
      r: arriba.r * arriba.a + abajo.r * (1 - arriba.a),
      g: arriba.g * arriba.a + abajo.g * (1 - arriba.a),
      b: arriba.b * arriba.a + abajo.b * (1 - arriba.a),
      a: 1,
    })
    const cadena = (el: Element) => {
      const lista: Element[] = []
      for (let e: Element | null = el; e; e = e.parentElement) lista.unshift(e)
      return lista
    }
    const opacidad = (el: Element) => cadena(el).reduce((o, e) => o * parseFloat(getComputedStyle(e).opacity), 1)
    const fondo = (el: Element) =>
      cadena(el).reduce<Color>((bg, e) => {
        const c = leer(getComputedStyle(e).backgroundColor)
        return c.a > 0 ? encima({ ...c, a: c.a * opacidad(e) }, bg) : bg
      }, { r: 255, g: 255, b: 255, a: 1 })
    const contraste = (texto: Color, el: Element) => {
      const bg = fondo(el)
      const [a, b] = [luz(encima(texto, bg)), luz(bg)]
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }
    const problemas: string[] = []
    for (const el of document.querySelectorAll('body *')) {
      const caja = el.getBoundingClientRect()
      if (!caja.width || !caja.height || el.closest('[inert]') || el.matches(':disabled')) continue
      if (aparte && el.matches(aparte)) continue
      const s = getComputedStyle(el)
      const conTexto = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())
      if (conTexto) {
        const c = leer(s.color)
        const valor = contraste({ ...c, a: c.a * opacidad(el) }, el)
        if (valor < 4.5) problemas.push(`${el.tagName.toLowerCase()}.${el.className}: ${valor.toFixed(2)}`)
      }
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.placeholder) {
        const valor = contraste(leer(getComputedStyle(el, '::placeholder').color), el)
        if (valor < 4.5) problemas.push(`texto guía de ${el.getAttribute('aria-label')}: ${valor.toFixed(2)}`)
      }
    }
    return [...new Set(problemas)]
  }, aparte)
  expect(bajos, 'hay texto con poco contraste').toEqual([])
}

/** Todo lo que se toca mide al menos 44 × 44 (lo que está tapado por una hoja no cuenta). */
export async function revisarQueSeToca(page: Page, { aparte = '' }: { aparte?: string } = {}) {
  const chicos = await page.$$eval(
    'button, a[href], input, textarea, select',
    (els, aparte) =>
      els
        .filter((el) => !el.closest('[inert]') && !(aparte && el.matches(aparte)))
        .map((el) => [el, el.getBoundingClientRect()] as const)
        .filter(([, r]) => r.width > 0 && r.height > 0 && (r.width < 43.5 || r.height < 43.5))
        .map(([el, r]) => `${el.tagName.toLowerCase()}.${el.className}: ${Math.round(r.width)}×${Math.round(r.height)}`),
    aparte,
  )
  expect(chicos, 'hay cosas que se tocan y miden menos de 44 × 44').toEqual([])
}

/** Nada se sale de lado: ni la página ni lo de adentro de una hoja se mueve a los lados. */
export async function revisarQueNoSeMueveDeLado(page: Page) {
  const medida = await page.evaluate(() => {
    const hoja = document.querySelector('.hoja-contenido')
    return {
      pagina: document.documentElement.scrollWidth - innerWidth,
      hoja: hoja ? hoja.scrollWidth - hoja.clientWidth : 0,
    }
  })
  expect(medida, 'algo se sale de lado').toEqual({ pagina: 0, hoja: 0 })
}
