// Revisa que SU semana real se pueda pegar y que quepa sin deslizar en su teléfono.
// Solo corre en la compu donde existe privado/ (en GitHub se salta).
// Su semana se lee al momento de correr: no se escribe aquí ni se toman capturas.

import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { revisarQueCabe } from './ayuda'

const ruta = join(import.meta.dirname, '..', 'privado', 'semana.json')

test.skip(!existsSync(ruta), 'solo corre donde está la carpeta privado/')

// Su teléfono: iPhone 17 Pro (402 × 874). La de ejemplo se revisa en las otras dos medidas.
test.use({ viewport: { width: 402, height: 874 } })

test('su semana real se pega, cabe sin deslizar y ningún bloque corta su texto', async ({ page }) => {
  test.skip(test.info().project.name !== '440x956', 'con una vez basta: la medida es la de su teléfono')
  await page.clock.setFixedTime(new Date('2026-11-25T12:30:00-06:00'))
  await page.goto('./')
  // Igual que ella: pega el texto de su semana y toca "listo"
  await page.getByRole('textbox', { name: 'tu semana' }).fill(readFileSync(ruta, 'utf8'))
  await page.getByRole('button', { name: 'listo' }).click()
  await expect(page.locator('.bloque').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await revisarQueCabe(page)
})
