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
  await page.waitForTimeout(250) // lo que dura la animación
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
