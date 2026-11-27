// Pulido, ronda 4: que se sienta como app de verdad. Los botones responden al presionarlos,
// nada se mueve cuando sale un aviso, la página no rebota ni se selecciona al tocar,
// cada campo trae su teclado y marcar algo se siente en el dedo (háptico).

import { expect, test, type Locator, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirHoja } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'

async function pegarSuSemana(page: Page) {
  await page.clock.setFixedTime(new Date(MIERCOLES))
  await page.goto('./')
  await page.getByRole('textbox', { name: 'tu semana' }).fill(JSON.stringify(ejemplo))
  await page.getByRole('button', { name: 'listo' }).click()
  await page.locator('.bloque').first().waitFor()
}

async function abrirAjustes(page: Page) {
  await page.getByRole('button', { name: 'ajustes' }).click()
  await page.waitForTimeout(350)
  return page.getByRole('dialog')
}

const caja = async (l: Locator) => {
  const c = (await l.boundingBox())!
  return { x: Math.round(c.x), y: Math.round(c.y), w: Math.round(c.width), h: Math.round(c.height) }
}

/** Cómo se ve algo mientras el dedo lo presiona (y cómo se ve sin presionar) */
async function alPresionar(page: Page, l: Locator) {
  const ver = () => l.evaluate((el) => {
    const s = getComputedStyle(el)
    const dibujo = el.querySelector('.circulo-dibujo, span')
    const d = dibujo ? getComputedStyle(dibujo) : s
    return [s.transform, s.opacity, s.backgroundColor, d.transform, d.opacity, d.backgroundColor].join(' ')
  })
  const antes = await ver()
  const c = (await l.boundingBox())!
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(200)
  const presionado = await ver()
  await page.mouse.up()
  return { antes, presionado }
}

test.describe('nada se mueve cuando sale un aviso', () => {
  test('"copiar respaldo": el aviso de copiado no mueve lo de abajo', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await pegarSuSemana(page)
    const hoja = await abrirAjustes(page)
    const pegar = hoja.getByRole('button', { name: 'pegar un respaldo' })
    const copiar = hoja.getByRole('button', { name: 'copiar respaldo' })
    const [antesPegar, antesCopiar] = [await caja(pegar), await caja(copiar)]
    await copiar.click()
    await expect(hoja.getByText('copiado ☆ pégalo en tu WhatsApp')).toBeVisible()
    expect(await caja(pegar)).toEqual(antesPegar)
    expect(await caja(hoja.locator('.boton').first())).toEqual(antesCopiar)
  })

  test('"copiar" la lista: "editar" no se recorre cuando dice "copiado"', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await abrir(page, MIERCOLES)
    const hoja = await abrirHoja(page, 'editar Velas')
    const editar = hoja.getByRole('button', { name: 'editar', exact: true })
    const antes = await caja(editar)
    await hoja.getByRole('button', { name: 'copiar' }).click()
    await expect(hoja.getByRole('button', { name: 'copiado' })).toBeVisible()
    expect(await caja(editar)).toEqual(antes)
  })

  test('pegar algo que no sirve: el aviso sale sin mover "listo" ni lo de abajo, y se va igual', async ({ page }) => {
    await page.goto('./')
    const campo = page.getByRole('textbox', { name: 'tu semana' })
    const listo = page.getByRole('button', { name: 'listo' })
    const ejemploLiga = page.getByRole('link', { name: 'ver ejemplo' })
    await campo.fill('hola')
    const antes = [await caja(listo), await caja(ejemploLiga)]
    await listo.click()
    await expect(page.getByText('ese texto no lo pude leer.')).toBeVisible()
    expect([await caja(listo), await caja(ejemploLiga)]).toEqual(antes)
    await campo.fill('hola de nuevo')
    await expect(page.getByText('ese texto no lo pude leer.')).toHaveCount(0)
    expect([await caja(listo), await caja(ejemploLiga)]).toEqual(antes)
  })

  test('una liga que no sirve: el aviso no mueve la liga de abajo', async ({ page }) => {
    await pegarSuSemana(page)
    const hoja = await abrirAjustes(page)
    const primera = hoja.getByRole('textbox', { name: 'crear lo mío · subir videos' })
    const segunda = hoja.getByRole('textbox', { name: 'correos' })
    const antes = await caja(segunda)
    await primera.fill('mi planeador')
    await primera.press('Enter')
    await expect(hoja.getByText('esa liga no la pude leer.')).toBeVisible()
    expect(await caja(segunda)).toEqual(antes)
  })
})

test.describe('se siente como app', () => {
  test('cada botón cambia al presionarlo', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const enHorario = [
      page.getByRole('button', { name: 'editar Velas' }),
      page.getByRole('button', { name: 'sábado' }),
      page.getByRole('button', { name: 'ajustes' }),
    ]
    for (const boton of enHorario) {
      const { antes, presionado } = await alPresionar(page, boton)
      expect(presionado, (await boton.textContent()) ?? '').not.toBe(antes)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
    }
    const hoja = await abrirHoja(page, 'editar Velas')
    const enHoja = [
      hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' }),
      hoja.getByRole('button', { name: 'pedir el logo en alta', exact: true }),
      hoja.getByRole('button', { name: 'editar', exact: true }),
    ]
    for (const boton of enHoja) {
      const nombre = (await boton.getAttribute('aria-label')) ?? (await boton.textContent()) ?? ''
      const { antes, presionado } = await alPresionar(page, boton)
      expect(presionado, nombre).not.toBe(antes)
      // Al soltar, el texto se pone a editar: Escape deja de editar y la hoja se queda abierta
      if (await hoja.locator('input.renglon-texto').count()) await page.keyboard.press('Escape')
      await page.waitForTimeout(350)
      await expect(hoja).toBeVisible()
    }
    await page.goto('./')
    await page.getByRole('textbox', { name: 'tu semana' }).fill('algo')
    const { antes, presionado } = await alPresionar(page, page.getByRole('button', { name: 'listo' }))
    expect(presionado, 'listo').not.toBe(antes)
  })

  test('la página no rebota y en el horario nada se selecciona al dejar el dedo', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const estilos = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).overscrollBehaviorY,
      body: getComputedStyle(document.body).overscrollBehaviorY,
      horario: getComputedStyle(document.querySelector('.pantalla')!).userSelect,
      bloque: getComputedStyle(document.querySelector('button.bloque')!).userSelect,
    }))
    expect(estilos).toEqual({ html: 'none', body: 'none', horario: 'none', bloque: 'none' })
    const hoja = await abrirHoja(page, 'editar Velas')
    const enHoja = await hoja.evaluate((h) =>
      [...h.querySelectorAll('button')].map((b) => getComputedStyle(b).userSelect).filter((u) => u !== 'none'),
    )
    expect(enHoja, 'botones de la hoja que se seleccionan').toEqual([])
  })

  test('cada campo trae el teclado que le toca', async ({ page }) => {
    await pegarSuSemana(page)
    const hoja = await abrirAjustes(page)
    const liga = hoja.getByRole('textbox', { name: 'correos' })
    await expect(liga).toHaveAttribute('type', 'url')
    await expect(liga).toHaveAttribute('autocapitalize', 'off')
    await hoja.getByRole('button', { name: 'pegar un respaldo' }).click()
    const respaldo = hoja.getByRole('textbox', { name: 'tu respaldo' })
    for (const [atributo, valor] of [['autocapitalize', 'off'], ['autocorrect', 'off'], ['spellcheck', 'false']]) {
      await expect(respaldo).toHaveAttribute(atributo, valor)
    }
    await page.keyboard.press('Escape')
    const suHoja = await abrirHoja(page, 'editar Velas')
    // Escribir un pendiente es texto normal, con corrector, y Enter lo agrega
    const agregar = suHoja.getByRole('textbox', { name: '+ escribe un pendiente…' })
    await expect(agregar).toHaveAttribute('enterkeyhint', 'enter')
    await expect(agregar).not.toHaveAttribute('autocorrect', 'off')
  })
})

test.describe('háptico: marcar algo se siente en el dedo', () => {
  /** Cuenta las veces que la app pide el "tic" del iPhone (el truco del interruptor) */
  async function contarTics(page: Page) {
    await page.evaluate(() => {
      const w = window as Window & { tics?: number }
      w.tics = 0
      // Como en el iPhone: Safari no tiene vibración
      Object.defineProperty(Navigator.prototype, 'vibrate', { value: undefined, configurable: true })
      const original = HTMLLabelElement.prototype.click
      HTMLLabelElement.prototype.click = function (this: HTMLLabelElement) {
        if (this.querySelector('input[type="checkbox"][switch]')) w.tics!++
        return original.call(this)
      }
    })
    return () => page.evaluate(() => (window as Window & { tics?: number }).tics)
  }

  test('marcar un pendiente, un renglón de la lista, "ya la usé" y borrar los hechos dan un tic', async ({ page }) => {
    await abrir(page, MIERCOLES)
    const tics = await contarTics(page)
    let hoja = await abrirHoja(page, 'editar Velas')
    expect(await tics(), 'abrir una hoja no da tic').toBe(0)
    await hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' }).click()
    expect(await tics()).toBe(1)
    await page.waitForTimeout(350)
    await hoja.getByRole('button', { name: 'hecho: Video largo Primavera' }).click()
    expect(await tics()).toBe(2)
    await page.waitForTimeout(350)
    await hoja.getByRole('button', { name: 'borrar' }).click()
    expect(await tics()).toBe(3)
    await page.keyboard.press('Escape')
    hoja = await abrirHoja(page, 'ideas')
    await hoja.getByRole('button', { name: 'ya la usé' }).first().click()
    expect(await tics()).toBe(4)
    // Escribir no da tic
    await hoja.getByRole('textbox', { name: '+ anota una idea…' }).fill('una idea')
    await hoja.getByRole('textbox', { name: '+ anota una idea…' }).press('Enter')
    expect(await tics()).toBe(4)
  })
})
