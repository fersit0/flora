// Fase 6: abre con su semana desde la primera vez (su liga de instalación la trae adentro)
// y ella la edita desde la app: cambiar, agregar y borrar bloques, y sábado y domingo.
// "Su semana" aquí es la de ejemplo (inventada), como si fuera la suya.

import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrirConLiga, abrirHoja, revisarQueCabe, revisarQueNoHayRojo } from './ayuda'

const LISTA = '☕CAFÉ LIRIO ABRIL☕\nSemana 1\nFotos terraza 2/04 ✅\nReel de latte art 4/04'
const CON_LISTAS = JSON.stringify({ ...ejemplo, hojas: { cafe: { pendientes: [], contenidos: LISTA, ideas: [] } } })

async function editarMiSemana(page: Page) {
  const hoja = await abrirHoja(page, 'ajustes')
  await hoja.getByRole('button', { name: 'editar mi semana' }).click()
  await expect(hoja).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('editando')
}

/** Abre un bloque (o un hueco) del modo edición y espera a que suba su hoja */
async function abrirParaEditar(page: Page, nombre: string) {
  return abrirHoja(page, nombre)
}

async function cerrarEditor(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'listo' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

const bloqueEn = (page: Page, dia: string, nombre: string) =>
  page.locator(`.columna[data-dia="${dia}"] .bloque`, { hasText: nombre })

test.describe('su liga de instalación', () => {
  test('abre con su semana y sus listas desde la primera vez, sin pegar nada', async ({ page }) => {
    await abrirConLiga(page, CON_LISTAS)
    await expect(page.locator('.bloque')).toHaveCount(Object.values(ejemplo.dias).flat().length)
    const cafe = await abrirHoja(page, 'Café Lirio')
    await expect(cafe.locator('.lista-titulo')).toHaveText('☕CAFÉ LIRIO ABRIL☕')
    await page.keyboard.press('Escape')
    // Ya es suya: ajustes trae "editar mi semana" y su respaldo
    const ajustes = await abrirHoja(page, 'ajustes')
    await expect(ajustes.getByRole('button', { name: 'editar mi semana' })).toBeVisible()
    await expect(ajustes.getByRole('button', { name: 'copiar respaldo' })).toBeVisible()
  })

  test('abrirla otra vez no pisa lo que ella ya cambió', async ({ page }) => {
    await abrirConLiga(page)
    await editarMiSemana(page)
    const hoja = await abrirParaEditar(page, 'caminar')
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('yoga')
    await cerrarEditor(page)
    await expect(bloqueEn(page, 'lun', 'yoga')).toBeVisible()

    // Vuelve a abrir la misma liga (o la app instalada desde ella)
    await abrirConLiga(page)
    await expect(bloqueEn(page, 'lun', 'yoga')).toBeVisible()
    await expect(bloqueEn(page, 'lun', 'caminar')).toHaveCount(0)
  })
})

test.describe('editar su semana', () => {
  test.beforeEach(async ({ page }) => {
    await abrirConLiga(page)
  })

  test('el modo edición se nota, y con "listo" todo funciona igual que antes', async ({ page }) => {
    await editarMiSemana(page)
    await expect(page.locator('.hueco').first()).toBeVisible()
    await revisarQueNoHayRojo(page)
    await revisarQueCabe(page)
    await page.getByRole('button', { name: 'listo' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Flora')
    await expect(page.locator('.hueco')).toHaveCount(0)
    // Tocar un bloque vuelve a abrir su hoja, como siempre
    const hoja = await abrirHoja(page, 'editar Velas')
    await expect(hoja.getByRole('heading', { level: 2 })).toContainText('Velas Marea')
  })

  test('cambiar un bloque: nombre, emoji, de qué es, día y hora; se guarda solo y sobrevive a cerrar y abrir', async ({
    page,
  }) => {
    await editarMiSemana(page)
    const hoja = await abrirParaEditar(page, 'caminar')
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('yoga')
    await hoja.getByRole('textbox', { name: 'emoji' }).fill('🧘')
    // Se ve al momento en su semana, atrás de la hoja
    await expect(bloqueEn(page, 'lun', 'yoga')).toBeVisible()
    await hoja.getByRole('button', { name: 'Velas Marea' }).click()
    await expect(bloqueEn(page, 'lun', 'yoga')).toHaveClass(/color-rosa/)
    await hoja.getByRole('button', { name: 'mar', exact: true }).click()
    await hoja.getByRole('combobox', { name: 'empieza' }).selectOption('14')
    await hoja.getByRole('combobox', { name: 'acaba' }).selectOption('15')
    await expect(hoja.getByRole('status')).toHaveText('')
    await cerrarEditor(page)
    // Lo demás de la semana no se movió
    await expect(bloqueEn(page, 'mar', 'Café Lirio')).toBeVisible()
    await expect(page.locator('.bloque', { hasText: 'yoga' })).toHaveCount(1)
    await expect(bloqueEn(page, 'mar', 'yoga')).toBeVisible()

    await page.reload()
    await expect(bloqueEn(page, 'lun', 'yoga')).toHaveCount(0)
    const yoga = bloqueEn(page, 'mar', 'yoga')
    await expect(yoga).toContainText('🧘')
    // Ahora es de Velas Marea: abre su hoja
    await yoga.click()
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toContainText('Velas Marea')
    await page.keyboard.press('Escape')
    await revisarQueCabe(page)
  })

  test('agregar un bloque en un hueco, y borrarlo', async ({ page }) => {
    await editarMiSemana(page)
    let hoja = await abrirParaEditar(page, 'agregar el lun a las 7')
    await expect(hoja.getByRole('heading', { level: 2 })).toHaveText('bloque nuevo')
    await expect(hoja.getByRole('textbox', { name: 'nombre' })).toBeFocused()
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('leer')
    await cerrarEditor(page)
    await expect(bloqueEn(page, 'lun', 'leer')).toBeVisible()
    await revisarQueCabe(page)

    hoja = await abrirParaEditar(page, 'leer')
    await hoja.getByRole('button', { name: 'borrar este bloque' }).click()
    // Pide un segundo toque, para que no se borre sin querer
    await expect(bloqueEn(page, 'lun', 'leer')).toBeVisible()
    await page.waitForTimeout(350)
    await hoja.getByRole('button', { name: 'toca otra vez para borrarlo' }).click()
    await expect(hoja).toBeHidden()
    await expect(bloqueEn(page, 'lun', 'leer')).toHaveCount(0)
  })

  test('un bloque nuevo sin nombre no se agrega', async ({ page }) => {
    await editarMiSemana(page)
    const antes = await page.locator('.bloque').count()
    await abrirParaEditar(page, 'agregar el lun a las 7')
    await cerrarEditor(page)
    await expect(page.locator('.bloque')).toHaveCount(antes)
  })

  test('si el nombre no cabe o se encima con otro, lo dice amable y no lo guarda', async ({ page }) => {
    await editarMiSemana(page)
    const hoja = await abrirParaEditar(page, 'caminar')
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('caminar por el parque grande con mis perritas')
    await expect(hoja.getByRole('status')).toHaveText('ese nombre no cabe en el bloque: prueba uno más corto.')
    await expect(bloqueEn(page, 'lun', 'caminar')).toHaveText(/caminar$/)
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('caminar')
    await expect(hoja.getByRole('status')).toHaveText('')
    await hoja.getByRole('combobox', { name: 'acaba' }).selectOption('10')
    await expect(hoja.getByRole('status')).toHaveText('se encima con «Agencia».')
    await cerrarEditor(page)
    await page.reload()
    // Se quedó lo último que sí quedaba bien
    await expect(bloqueEn(page, 'lun', 'caminar')).toHaveCSS('height', await bloqueEn(page, 'mié', 'caminar').evaluate((b) => getComputedStyle(b).height))
    await revisarQueNoHayRojo(page)
  })

  test('sábado y domingo se pueden cambiar', async ({ page }) => {
    await editarMiSemana(page)
    const hoja = await abrirParaEditar(page, 'sábado')
    await hoja.getByRole('textbox', { name: 'lo que se ve en tu semana' }).fill('playa 🌊')
    await hoja.getByRole('textbox', { name: 'lo que sale al tocarlo' }).fill('playa con mis primas')
    await cerrarEditor(page)
    await page.getByRole('button', { name: 'listo' }).click()
    await expect(page.locator('.finde-dia', { hasText: 'sábado' })).toContainText('playa 🌊')
    const sabado = await abrirHoja(page, 'sábado')
    await expect(sabado.locator('.finde-largo')).toHaveText('playa con mis primas')
  })

  test('lo que cambia entra en su respaldo', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await editarMiSemana(page)
    const hoja = await abrirParaEditar(page, 'caminar')
    await hoja.getByRole('textbox', { name: 'nombre' }).fill('yoga')
    await cerrarEditor(page)
    await page.getByRole('button', { name: 'listo' }).click()
    const ajustes = await abrirHoja(page, 'ajustes')
    await ajustes.getByRole('button', { name: 'copiar respaldo' }).click()
    await expect(ajustes.getByText('copiado ☆ pégalo en tu WhatsApp')).toBeVisible()
    const respaldo = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))
    expect(respaldo.dias.lun[0].nombre).toBe('yoga')
  })
})
