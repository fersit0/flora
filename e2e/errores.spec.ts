// Pulido, ronda 1: errores escondidos. Doble toque, irse a otra app a la mitad de algo,
// que iOS cierre la app sin avisar y volver horas después.

import { expect, test, type Locator, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirHoja, esperarGuardado } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'

/** Se va a otra app (o bloquea el cel): iOS avisa que la app ya no se ve */
async function irAOtraApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

/** Regresa a la app (sin que iOS la haya cerrado) */
async function volverALaApp(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

/**
 * iOS cerró la app sin avisar y ella la vuelve a abrir: la página de antes ya no hace nada
 * (ni siquiera suelta el campo) y se abre una nueva con lo que ya estaba guardado.
 */
async function abrirDeNuevo(page: Page, url = '?demo=1') {
  const nueva = await page.context().newPage()
  await nueva.clock.setFixedTime(new Date(MIERCOLES))
  await nueva.goto(url)
  await nueva.locator('.bloque').first().waitFor()
  return nueva
}

/** Pone el cursor al final de lo escrito */
async function alFinal(campo: Locator) {
  await campo.evaluate((c: HTMLInputElement) => c.setSelectionRange(c.value.length, c.value.length))
}

test.describe('doble toque', () => {
  test('en un bloque: la hoja se abre y se queda abierta', async ({ page }) => {
    await abrir(page, MIERCOLES)
    await page.getByRole('button', { name: 'editar Velas' }).dblclick()
    await page.waitForTimeout(500)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('en el solecito: los ajustes se abren y se quedan abiertos', async ({ page }) => {
    await abrir(page, MIERCOLES)
    await page.getByRole('button', { name: 'ajustes' }).dblclick()
    await page.waitForTimeout(500)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('fuera de la hoja: se cierra una sola vez y sigues en tu semana', async ({ page }) => {
    // Llegó a Flora desde otra página (en Safari): un "atrás" de más la sacaría de la app
    await page.goto('about:blank')
    await abrir(page, MIERCOLES)
    await abrirHoja(page, 'editar Velas')
    await page.mouse.dblclick(200, 40)
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/demo=1/)
    await expect(page.locator('.bloque').first()).toBeVisible()
  })

  test('en el círculo de un pendiente: solo se marca ese, no el que se recorre a su lugar', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' }).dblclick()
    await page.waitForTimeout(400)
    await expect(hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' })).toHaveAttribute('aria-pressed', 'true')
    await expect(hoja.getByRole('button', { name: 'hecho: confirmar los aromas nuevos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('en "ya la usé": solo se va esa idea, no la que se recorre a su lugar', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'ideas')
    const nuevas = hoja.locator('.renglon.idea:not(.usada)')
    await expect(nuevas).toHaveCount(2)
    await nuevas.first().getByRole('button', { name: 'ya la usé' }).dblclick()
    await page.waitForTimeout(400)
    await expect(nuevas).toHaveCount(1)
  })

  test('en "borrar" los hechos: no se abre lo que queda debajo', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' }).click()
    await page.waitForTimeout(400)
    await hoja.getByRole('button', { name: 'borrar' }).dblclick()
    await page.waitForTimeout(400)
    await expect(hoja.getByRole('textbox', { name: 'tu lista de contenidos' })).toHaveCount(0)
    await expect(hoja.getByRole('button', { name: 'editar' })).toBeVisible()
  })

  test('Enter dos veces seguidas agrega el pendiente una sola vez', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    const campo = hoja.getByRole('textbox', { name: '+ escribe un pendiente…' })
    await campo.fill('comprar mechas')
    await campo.press('Enter')
    await campo.press('Enter')
    await expect(hoja.getByRole('button', { name: 'comprar mechas', exact: true })).toHaveCount(1)
  })
})

test.describe('irse a otra app a la mitad de algo', () => {
  test('editando un pendiente: lo escrito se guarda aunque iOS cierre la app', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('button', { name: 'pedir el logo en alta', exact: true }).click()
    await hoja.getByRole('textbox', { name: 'editar: pedir el logo en alta' }).fill('pedir el logo en grande')
    await irAOtraApp(page)
    await esperarGuardado(page, 'velas', 'pedir el logo en grande')

    const nueva = await abrirDeNuevo(page)
    const otra = await abrirHoja(nueva, 'editar Velas')
    await expect(otra.getByRole('button', { name: 'pedir el logo en grande', exact: true })).toBeVisible()
  })

  test('editando un pendiente: si regresa sin que se cierre, sigue editando donde iba', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('button', { name: 'pedir el logo en alta', exact: true }).click()
    await hoja.getByRole('textbox', { name: 'editar: pedir el logo en alta' }).fill('pedir el logo en grande')
    await irAOtraApp(page)
    await volverALaApp(page)
    const campo = hoja.locator('input.renglon-texto')
    await expect(campo).toBeFocused()
    await alFinal(campo)
    await campo.pressSequentially(' y en negro')
    await campo.press('Enter')
    await expect(hoja.getByRole('button', { name: 'pedir el logo en grande y en negro', exact: true })).toBeVisible()
  })

  test('a medio escribir un pendiente nuevo: al volver a abrir su hoja, ahí sigue lo que escribió', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('textbox', { name: '+ escribe un pendiente…' }).fill('llevar las ve')
    await irAOtraApp(page)

    const nueva = await abrirDeNuevo(page)
    const otra = await abrirHoja(nueva, 'editar Velas')
    const campo = otra.getByRole('textbox', { name: '+ escribe un pendiente…' })
    await expect(campo).toHaveValue('llevar las ve')
    // Al agregarlo, el campo queda vacío y ya no regresa
    await campo.fill('llevar las velas')
    await campo.press('Enter')
    await expect(campo).toHaveValue('')
    await esperarGuardado(nueva, 'velas', 'llevar las velas')
    await nueva.reload()
    const otraVez = await abrirHoja(nueva, 'editar Velas')
    await expect(otraVez.getByRole('textbox', { name: '+ escribe un pendiente…' })).toHaveValue('')
    await expect(otraVez.getByRole('button', { name: 'llevar las velas', exact: true })).toBeVisible()
  })

  test('a medio escribir una idea: al volver a abrir la hoja, ahí sigue', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'ideas')
    await hoja.getByRole('textbox', { name: '+ anota una idea…' }).fill('video del taller')
    await irAOtraApp(page)
    const nueva = await abrirDeNuevo(page)
    const otra = await abrirHoja(nueva, 'ideas')
    await expect(otra.getByRole('textbox', { name: '+ anota una idea…' })).toHaveValue('video del taller')
  })

  test('lo que escribe en una hoja de la semana de ejemplo no aparece en la de su semana', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    await hoja.getByRole('textbox', { name: '+ escribe un pendiente…' }).fill('solo del ejemplo')
    await irAOtraApp(page)
    const suya = await page.context().newPage()
    await suya.goto('./')
    await suya.getByRole('textbox', { name: 'tu semana' }).fill(JSON.stringify(ejemplo))
    await suya.getByRole('button', { name: 'listo' }).click()
    const suHoja = await abrirHoja(suya, 'editar Velas')
    await expect(suHoja.getByRole('textbox', { name: '+ escribe un pendiente…' })).toHaveValue('')
  })

  test('pegando una liga en "mis ligas": se guarda aunque iOS cierre la app', async ({ page }) => {
    await page.clock.setFixedTime(new Date(MIERCOLES))
    await page.goto('./')
    await page
      .getByRole('textbox', { name: 'tu semana' })
      .fill(JSON.stringify({ ...ejemplo, ligas: { planeador: '', correo: 'message://' } }))
    await page.getByRole('button', { name: 'listo' }).click()
    await page.getByRole('button', { name: 'ajustes' }).click()
    await page.waitForTimeout(350)
    await page.getByRole('textbox', { name: 'crear lo mío · subir videos' }).fill('https://example.com/mi-plan')
    await irAOtraApp(page)

    const nueva = await abrirDeNuevo(page, './')
    await expect(nueva.getByRole('link', { name: 'crear lo mío' })).toHaveAttribute('href', 'https://example.com/mi-plan')
  })
})

test('al volver a la app horas después, el día de hoy y la línea de ahora están al día', async ({ page }) => {
  await abrir(page, MIERCOLES)
  await expect(page.locator('.dia.hoy')).toHaveText('mié')
  await irAOtraApp(page)
  // Bloqueó el cel el miércoles a mediodía y lo desbloquea el jueves a las 9:15
  await page.clock.setFixedTime(new Date('2026-11-26T09:15:00-06:00'))
  await volverALaApp(page)
  await expect(page.locator('.dia.hoy')).toHaveText('jue')
  const { inicio, fin } = ejemplo.horas
  const esperado = ((9.25 - inicio) / (fin - inicio)) * 100
  const linea = page.locator('.columna.hoy[data-dia="jue"] .ahora')
  await expect(linea).toHaveAttribute('style', new RegExp(`top: ${esperado.toFixed(1)}`))
})
