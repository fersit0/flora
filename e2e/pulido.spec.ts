// Fase 5: "mis ligas" en los ajustes, el detalle del bloque en su hoja y el alto corto de iOS.

import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirHoja, revisarQueCabe } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'
// Su semana (inventada), todavía sin la liga del planeador
const SIN_PLANEADOR = JSON.stringify({ ...ejemplo, ligas: { planeador: '', correo: 'message://' } })

async function pegarSuSemana(page: Page, texto = SIN_PLANEADOR) {
  await page.clock.setFixedTime(new Date(MIERCOLES))
  await page.goto('./')
  await page.getByRole('textbox', { name: 'tu semana' }).fill(texto)
  await page.getByRole('button', { name: 'listo' }).click()
  await expect(page.locator('.bloque').first()).toBeVisible()
}

async function abrirAjustes(page: Page) {
  await page.getByRole('button', { name: 'ajustes' }).click()
  const hoja = page.getByRole('dialog')
  await expect(hoja.getByRole('heading', { level: 2 })).toHaveText('ajustes')
  await page.waitForTimeout(250)
  return hoja
}

async function cerrar(page: Page) {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
}

test('la hoja dice el detalle del bloque que se tocó', async ({ page }) => {
  await abrir(page, MIERCOLES)
  let hoja = await abrirHoja(page, 'editar Velas')
  await expect(hoja.locator('.hoja-detalle')).toHaveText('los dos videos de la semana')
  await cerrar(page)
  // Un bloque sin detalle no deja un renglón vacío
  hoja = await abrirHoja(page, 'grabar Velas')
  await expect(hoja.locator('.hoja-detalle')).toHaveCount(0)
})

test('mis ligas: ella pega su liga y el bloque la abre, y se queda guardada', async ({ page }) => {
  await pegarSuSemana(page)
  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveCount(0)

  const hoja = await abrirAjustes(page)
  const campo = hoja.getByRole('textbox', { name: 'crear lo mío · subir videos' })
  await expect(campo).toHaveValue('')
  await expect(hoja.getByRole('textbox', { name: 'correos' })).toHaveValue('message://')
  await campo.fill('https://example.com/mi-plan')
  await campo.press('Enter')
  await cerrar(page)

  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveAttribute('href', 'https://example.com/mi-plan')
  await expect(page.getByRole('link', { name: 'subir videos' })).toHaveAttribute('href', 'https://example.com/mi-plan')
  await page.reload()
  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveAttribute('href', 'https://example.com/mi-plan')
})

test('mis ligas: lo que no es una liga lo dice y no cambia nada', async ({ page }) => {
  await pegarSuSemana(page)
  const hoja = await abrirAjustes(page)
  const campo = hoja.getByRole('textbox', { name: 'crear lo mío · subir videos' })
  await campo.fill('mi planeador')
  await campo.press('Enter')
  await expect(hoja.getByText('esa liga no la pude leer.')).toBeVisible()
  await cerrar(page)
  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveCount(0)
})

test('mis ligas: dejarla vacía hace que el bloque ya no se pueda tocar', async ({ page }) => {
  await pegarSuSemana(page)
  await expect(page.getByRole('link', { name: 'correos' })).toBeVisible()
  const hoja = await abrirAjustes(page)
  const campo = hoja.getByRole('textbox', { name: 'correos' })
  await campo.fill('')
  await campo.press('Enter')
  await cerrar(page)
  await expect(page.locator('.bloque', { hasText: 'correos' })).not.toHaveRole('link')
})

test('pegar una semana nueva no borra la liga que ella puso', async ({ page }) => {
  await pegarSuSemana(page)
  let hoja = await abrirAjustes(page)
  const campo = hoja.getByRole('textbox', { name: 'crear lo mío · subir videos' })
  await campo.fill('https://example.com/mi-plan')
  await campo.press('Enter')

  // La semana nueva trae el planeador vacío (como la que le manda Fer)
  await hoja.getByRole('button', { name: 'pegar semana nueva' }).click()
  await hoja.getByRole('textbox', { name: 'tu semana nueva' }).fill(SIN_PLANEADOR.replace('"caminar"', '"yoga"'))
  await hoja.getByRole('button', { name: 'listo' }).click()
  await expect(hoja).toBeHidden()

  await expect(page.locator('.bloque', { hasText: 'yoga' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveAttribute('href', 'https://example.com/mi-plan')
  hoja = await abrirAjustes(page)
  await expect(hoja.getByRole('textbox', { name: 'crear lo mío · subir videos' })).toHaveValue('https://example.com/mi-plan')
})

test('en la semana de ejemplo no se cambian ligas', async ({ page }) => {
  await abrir(page, MIERCOLES)
  const hoja = await abrirAjustes(page)
  await expect(hoja.getByRole('heading', { name: 'mis ligas' })).toHaveCount(0)
})

test('con el alto corto de iOS, el horario usa el espacio de la barrita de inicio', async ({ page }) => {
  await abrir(page, MIERCOLES)
  const medir = () =>
    page.evaluate(() => ({
      finde: document.querySelector('.finde')!.getBoundingClientRect().bottom,
      hora: document.querySelector('.bloque')!.getBoundingClientRect().height,
      alto: innerHeight,
    }))
  const antes = await medir()
  // Así queda instalada cuando iOS le da menos alto que la pantalla
  await page.evaluate(() => document.documentElement.classList.add('instalada', 'corta'))
  const despues = await medir()
  expect(despues.alto - despues.finde, 'sábado y domingo bajan casi hasta el borde').toBeLessThanOrEqual(8.5)
  expect(despues.hora, 'los bloques crecen').toBeGreaterThan(antes.hora)
  await revisarQueCabe(page)
})
