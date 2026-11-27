// Fase 3: pegar su semana, copiar y pegar el respaldo, y los ajustes.
// "Su semana" aquí es la de ejemplo (inventada), pegada como si fuera la suya.

import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirHoja, revisarQueCabe, revisarQueNoHayRojo } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'
const SEMANA = JSON.stringify(ejemplo, null, 2)
const TOTAL_BLOQUES = Object.values(ejemplo.dias).reduce((n, dia) => n + dia.length, 0)
const ERROR = 'ese texto no lo pude leer. Tu semana sigue igual.'

/** Abre la app sin ?demo=1, como la abriría ella */
async function abrirLaSuya(page: Page) {
  await page.clock.setFixedTime(new Date(MIERCOLES))
  await page.goto('./')
  await page.evaluate(() => document.fonts.ready)
}

async function pegarPrimeraVez(page: Page, texto: string) {
  await page.getByRole('textbox', { name: 'tu semana' }).fill(texto)
  await page.getByRole('button', { name: 'listo' }).click()
}

async function abrirAjustes(page: Page) {
  await page.getByRole('button', { name: 'ajustes' }).click()
  const hoja = page.getByRole('dialog')
  await expect(hoja.getByRole('heading', { level: 2 })).toHaveText('ajustes')
  await page.waitForTimeout(350) // lo que dura la animación, y los primeros toques que se ignoran (doble toque)
  return hoja
}

async function agregarPendiente(page: Page, bloque: string, texto: string) {
  const hoja = await abrirHoja(page, bloque)
  const campo = hoja.getByPlaceholder('+ escribe un pendiente…')
  await campo.fill(texto)
  await campo.press('Enter')
  await expect(hoja.getByText(texto, { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(hoja).toBeHidden()
}

/** Lo que dice el guardado de su semana ("flora") sobre un espacio */
async function guardadoDe(page: Page, espacio: string) {
  return page.evaluate(
    (id) =>
      new Promise<string>((listo) => {
        const abrir = indexedDB.open('flora')
        abrir.onsuccess = () => {
          const leer = abrir.result.transaction('espacios').objectStore('espacios').get(id)
          leer.onsuccess = () => {
            listo(JSON.stringify(leer.result ?? null))
            abrir.result.close()
          }
        }
      }),
    espacio,
  )
}

test('la primera vez pide pegar su semana; al pegarla se ve su horario y se queda guardado', async ({ page }) => {
  await abrirLaSuya(page)
  await expect(page.getByRole('heading', { name: 'pega aquí tu semana' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'listo' })).toBeDisabled()
  await revisarQueNoHayRojo(page)

  await pegarPrimeraVez(page, SEMANA)
  await expect(page.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
  await revisarQueCabe(page)

  // Cerrar y volver a abrir: abre directo en su horario
  await page.reload()
  await expect(page.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
  await expect(page.getByRole('heading', { name: 'pega aquí tu semana' })).toHaveCount(0)
})

test('pegar algo que no sirve lo dice en una frase y no cambia nada', async ({ page }) => {
  await abrirLaSuya(page)
  for (const malo of ['hola', 'Semana 1\nVideo largo 3/03', '{"version": 1}', SEMANA.slice(0, 300)]) {
    await pegarPrimeraVez(page, malo)
    await expect(page.getByText('ese texto no lo pude leer.')).toBeVisible()
    await expect(page.locator('.bloque')).toHaveCount(0)
  }
  // Al cambiar el texto, la frase se va
  await page.getByRole('textbox', { name: 'tu semana' }).fill('')
  await expect(page.getByText('ese texto no lo pude leer.')).toHaveCount(0)

  // Ya con su semana, pegar algo malo en ajustes tampoco cambia nada
  await pegarPrimeraVez(page, SEMANA)
  await agregarPendiente(page, 'Agencia', 'llamar al dentista')
  const hoja = await abrirAjustes(page)
  await hoja.getByRole('button', { name: 'pegar semana nueva' }).click()
  await hoja.getByRole('textbox', { name: 'tu semana nueva' }).fill('{"version": 1, "dias": "nada"}')
  await hoja.getByRole('button', { name: 'listo' }).click()
  await expect(hoja.getByText(ERROR)).toBeVisible()
  await hoja.getByRole('button', { name: 'pegar un respaldo' }).click()
  await hoja.getByRole('textbox', { name: 'tu respaldo' }).fill('esto no es un respaldo')
  await hoja.getByRole('button', { name: 'listo' }).click()
  await expect(hoja.getByText(ERROR)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(hoja).toBeHidden()
  await page.reload()
  await expect(page.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
  const agencia = await abrirHoja(page, 'Agencia')
  await expect(agencia.getByText('llamar al dentista')).toBeVisible()
})

test('el solecito es el botón de ajustes y se puede tocar fácil', async ({ page }) => {
  await abrirLaSuya(page)
  await pegarPrimeraVez(page, SEMANA)
  const sol = page.getByRole('button', { name: 'ajustes' })
  const caja = (await sol.boundingBox())!
  expect(caja.width).toBeGreaterThanOrEqual(44)
  expect(caja.height).toBeGreaterThanOrEqual(44)
  const hoja = await abrirAjustes(page)
  await revisarQueNoHayRojo(page)
  // Se cierra igual que las hojas: con el gesto de atrás
  await page.evaluate(() => history.back())
  await expect(hoja).toBeHidden()
  await revisarQueCabe(page)
})

test('copiar el respaldo y pegarlo en un teléfono nuevo regresa todo', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await abrirLaSuya(page)
  await pegarPrimeraVez(page, SEMANA)
  await agregarPendiente(page, 'Agencia', 'llamar al dentista')

  // Una lista con emojis, espacios al final y renglones vacíos
  const lista = '☕CAFÉ LIRIO ABRIL☕\nSemana 1 \nFotos terraza 2/04 ✅\n\nSemana 2\nReel 9/04  '
  let hoja = await abrirHoja(page, 'Café Lirio')
  await hoja.getByRole('button', { name: 'editar' }).click()
  await hoja.getByRole('textbox', { name: 'tu lista de contenidos' }).fill(lista)
  await page.keyboard.press('Escape')
  await expect(hoja).toBeHidden()
  await expect.poll(() => guardadoDe(page, 'cafe')).toContain('Reel 9/04  ')

  hoja = await abrirAjustes(page)
  await hoja.getByRole('button', { name: 'copiar respaldo' }).click()
  await expect(hoja.getByText('copiado ☆ pégalo en tu WhatsApp')).toBeVisible()
  const respaldo = await page.evaluate(() => navigator.clipboard.readText())
  const datos = JSON.parse(respaldo)
  expect(datos.version).toBe(1)
  expect(datos.hojas.cafe.contenidos).toBe(lista)

  // Otro teléfono, sin nada guardado: pega el respaldo (con lo que WhatsApp le agrega)
  const nuevo = await browser.newContext({ viewport: page.viewportSize(), isMobile: true, hasTouch: true })
  await nuevo.grantPermissions(['clipboard-read', 'clipboard-write'])
  const otro = await nuevo.newPage()
  await abrirLaSuya(otro)
  await pegarPrimeraVez(otro, `[26/11/26, 9:14 p.m.] Fer: ${respaldo}`)
  await expect(otro.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
  const agencia = await abrirHoja(otro, 'Agencia')
  await expect(agencia.getByText('llamar al dentista')).toBeVisible()
  await otro.keyboard.press('Escape')
  const cafe = await abrirHoja(otro, 'Café Lirio')
  await expect(cafe.locator('.lista-titulo')).toHaveText('☕CAFÉ LIRIO ABRIL☕')
  await cafe.getByRole('button', { name: 'copiar' }).click()
  expect(await otro.evaluate(() => navigator.clipboard.readText())).toBe(lista)
  await otro.keyboard.press('Escape')
  await expect(cafe).toBeHidden()

  // Ida y vuelta completa: el respaldo que sale del teléfono nuevo es idéntico al primero
  const ajustes = await abrirAjustes(otro)
  await ajustes.getByRole('button', { name: 'copiar respaldo' }).click()
  await expect(ajustes.getByText('copiado ☆ pégalo en tu WhatsApp')).toBeVisible()
  expect(await otro.evaluate(() => navigator.clipboard.readText())).toBe(respaldo)
  await nuevo.close()
})

test('pegar un respaldo regresa lo que tenía ese respaldo', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await abrirLaSuya(page)
  await pegarPrimeraVez(page, SEMANA)
  await agregarPendiente(page, 'Agencia', 'antes del respaldo')

  let hoja = await abrirAjustes(page)
  await hoja.getByRole('button', { name: 'copiar respaldo' }).click()
  await expect(hoja.getByText('copiado ☆ pégalo en tu WhatsApp')).toBeVisible()
  const respaldo = await page.evaluate(() => navigator.clipboard.readText())
  await page.keyboard.press('Escape')
  await expect(hoja).toBeHidden()

  await agregarPendiente(page, 'Agencia', 'después del respaldo')

  hoja = await abrirAjustes(page)
  await hoja.getByRole('button', { name: 'pegar un respaldo' }).click()
  await hoja.getByRole('textbox', { name: 'tu respaldo' }).fill(respaldo)
  await hoja.getByRole('button', { name: 'listo' }).click()
  await expect(hoja).toBeHidden()

  const agencia = await abrirHoja(page, 'Agencia')
  await expect(agencia.getByText('antes del respaldo')).toBeVisible()
  await expect(agencia.getByText('después del respaldo')).toHaveCount(0)
})

test('pegar semana nueva cambia el horario y lo que escribió se queda', async ({ page }) => {
  await abrirLaSuya(page)
  await pegarPrimeraVez(page, SEMANA)
  await agregarPendiente(page, 'Agencia', 'llamar al dentista')
  await expect(page.locator('.bloque', { hasText: 'caminar' })).not.toHaveCount(0)

  // La misma semana, pero lo de las 8 ahora es yoga
  const nueva = JSON.stringify(ejemplo).replaceAll('"caminar"', '"yoga"')
  const hoja = await abrirAjustes(page)
  await hoja.getByRole('button', { name: 'pegar semana nueva' }).click()
  await expect(hoja.getByText('lo que escribiste en cada hoja se queda.')).toBeVisible()
  await hoja.getByRole('textbox', { name: 'tu semana nueva' }).fill(nueva)
  await hoja.getByRole('button', { name: 'listo' }).click()
  await expect(hoja).toBeHidden()

  await expect(page.locator('.bloque', { hasText: 'caminar' })).toHaveCount(0)
  await expect(page.locator('.bloque', { hasText: 'yoga' })).not.toHaveCount(0)
  const agencia = await abrirHoja(page, 'Agencia')
  await expect(agencia.getByText('llamar al dentista')).toBeVisible()

  // Y se queda así al volver a abrir
  await page.reload()
  await expect(page.locator('.bloque', { hasText: 'yoga' })).not.toHaveCount(0)
})

test('"ver ejemplo" abre la semana de ejemplo sin tocar la suya, y de ahí se regresa', async ({ page }) => {
  await abrirLaSuya(page)
  await pegarPrimeraVez(page, SEMANA)
  await agregarPendiente(page, 'Agencia', 'lo mío')

  await page.goto('?demo=1')
  await agregarPendiente(page, 'Agencia', 'solo del ejemplo')
  const hoja = await abrirAjustes(page)
  await expect(hoja.getByText('esta es la semana de ejemplo.', { exact: false })).toBeVisible()
  await expect(hoja.getByRole('button', { name: 'copiar respaldo' })).toHaveCount(0)
  await hoja.getByRole('link', { name: 'ir a mi semana' }).click()

  await expect(page).not.toHaveURL(/demo/)
  const agencia = await abrirHoja(page, 'Agencia')
  await expect(agencia.getByText('lo mío')).toBeVisible()
  await expect(agencia.getByText('solo del ejemplo')).toHaveCount(0)
})

test('desde la primera pantalla, "ver ejemplo" lleva a la semana de ejemplo', async ({ page }) => {
  await abrirLaSuya(page)
  await page.getByRole('link', { name: 'ver ejemplo' }).click()
  await expect(page).toHaveURL(/\?demo=1$/)
  await expect(page.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
})

test('la semana de ejemplo sigue abriendo directo, como antes', async ({ page }) => {
  await abrir(page, MIERCOLES)
  await expect(page.locator('.bloque')).toHaveCount(TOTAL_BLOQUES)
})
