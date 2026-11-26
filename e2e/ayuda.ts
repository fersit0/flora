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

  // Un elemento corta su texto si su contenido mide más que su caja
  const cortados = await page.$$eval('.bloque, .bloque .nombre, .finde-dia, .finde-dia p, .dia', (els) =>
    els
      .filter((e) => e.scrollHeight > e.clientHeight + 0.5 || e.scrollWidth > e.clientWidth + 0.5)
      .map((e) => `${e.closest('[data-dia]')?.getAttribute('data-dia') ?? ''} ${e.className}`.trim()),
  )
  expect(cortados, 'hay textos cortados').toEqual([])
}
