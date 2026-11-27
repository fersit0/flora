// Fase 4: sábado y domingo (al tocarlos, el texto largo) y los bloques que abren una liga.

import { expect, test } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirConLiga, revisarQueCabe, revisarQueNoHayRojo } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'

test('sábado y domingo: al tocarlos sube su texto largo', async ({ page }) => {
  await abrir(page, MIERCOLES)
  for (const [nombre, texto] of [
    ['sábado', ejemplo.finde.sab],
    ['domingo', ejemplo.finde.dom],
  ] as const) {
    await page.getByRole('button', { name: nombre }).click()
    const hoja = page.getByRole('dialog')
    await expect(hoja.getByRole('heading', { level: 2 })).toHaveText(nombre)
    await expect(hoja.locator('.finde-largo')).toHaveText(texto.largo)
    await page.waitForTimeout(350) // lo que dura la animación, y los primeros toques que se ignoran (doble toque)
    await revisarQueNoHayRojo(page)
    // Se cierra como las otras hojas: tocando fuera
    await page.mouse.click(200, 40)
    await expect(hoja).toBeHidden()
  }
  await revisarQueCabe(page)
})

test('sábado y domingo se pueden tocar fácil', async ({ page }) => {
  await abrir(page, MIERCOLES)
  for (const nombre of ['sábado', 'domingo']) {
    const caja = (await page.getByRole('button', { name: nombre }).boundingBox())!
    expect(caja.height).toBeGreaterThanOrEqual(44)
  }
})

test('un bloque con liga lleva a su dirección: una página o una app', async ({ page }) => {
  await abrir(page, MIERCOLES)
  await expect(page.getByRole('link', { name: 'crear lo mío' })).toHaveAttribute('href', ejemplo.ligas.planeador)
  await expect(page.getByRole('link', { name: 'subir videos' })).toHaveAttribute('href', ejemplo.ligas.planeador)
  await expect(page.getByRole('link', { name: 'correos' })).toHaveAttribute('href', ejemplo.ligas.correo)
})

test('tocar una liga de página la abre', async ({ page }) => {
  // En la prueba no se sale a internet: la página de la liga se contesta aquí mismo
  await page.route('https://example.com/**', (ruta) => ruta.fulfill({ contentType: 'text/html', body: '<h1>planeador</h1>' }))
  await abrir(page, MIERCOLES)
  await page.getByRole('link', { name: 'crear lo mío' }).click()
  await expect(page).toHaveURL('https://example.com/')
})

test('una liga sin dirección, o con una que no sirve, no se puede tocar', async ({ page }) => {
  await page.clock.setFixedTime(new Date(MIERCOLES))
  // Su semana tal cual, pero sin la liga del planeador y con una del correo que no es dirección
  const semana = { ...ejemplo, ligas: { planeador: '', correo: 'javascript:alert(1)' } }
  await abrirConLiga(page, JSON.stringify(semana))
  await expect(page.locator('.bloque').first()).toBeVisible()
  await expect(page.locator('a.bloque')).toHaveCount(0)
  for (const nombre of ['crear lo mío', 'correos', 'subir videos']) {
    await expect(page.locator('.bloque', { hasText: nombre })).not.toHaveRole('link')
    await expect(page.locator('.bloque', { hasText: nombre })).not.toHaveRole('button')
  }
})
