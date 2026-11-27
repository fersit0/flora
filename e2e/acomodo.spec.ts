// Pulido, ronda 2: cada pantalla se lee y queda bien acomodada a 375, 393, 402 (su iPhone 17 Pro)
// y 430 de ancho. Con la semana de ejemplo (inventada).

import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrirHoja, revisarQueNoSeMueveDeLado, revisarQueSeLee, revisarQueSeToca } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'
const ANCHOS = [
  { width: 375, height: 812 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
]
// Pendientes de que Fer y ella decidan (cambian DISENO.md):
// - lo hecho y las ideas usadas van "a media opacidad" (contraste 2.8);
// - los bloques de una hora miden un poco menos de 44 de alto en los teléfonos de 393 a 402.
const LO_HECHO = '.renglon.hecho .renglon-texto, .renglon.usada .renglon-texto'
const BLOQUES = '.bloque'

async function revisarTodo(page: Page) {
  await revisarQueNoSeMueveDeLado(page)
  await revisarQueSeLee(page, { aparte: LO_HECHO })
  await revisarQueSeToca(page, { aparte: BLOQUES })
}

// Las medidas van dentro de cada prueba: con un solo proyecto basta
test.beforeEach(() => {
  test.skip(test.info().project.name !== '393x852', 'las medidas van dentro de la prueba')
})

for (const tamano of ANCHOS) {
  test(`a ${tamano.width} de ancho todas las pantallas se leen, se tocan fácil y no se mueven de lado`, async ({ page }) => {
    await page.setViewportSize(tamano)
    await page.clock.setFixedTime(new Date(MIERCOLES))

    // La primera vez
    await page.goto('./')
    await page.getByRole('textbox', { name: 'tu semana' }).waitFor()
    await revisarTodo(page)

    // Su semana (la de ejemplo pegada como si fuera la suya) y sus ajustes
    await page.getByRole('textbox', { name: 'tu semana' }).fill(JSON.stringify(ejemplo))
    await page.getByRole('button', { name: 'listo' }).click()
    await page.locator('.bloque').first().waitFor()
    await revisarTodo(page)
    await page.getByRole('button', { name: 'ajustes' }).click()
    await page.waitForTimeout(350)
    await page.getByRole('button', { name: 'pegar un respaldo' }).click()
    await revisarTodo(page)
    await page.getByRole('button', { name: 'pegar semana nueva' }).click()
    await revisarTodo(page)
    await page.keyboard.press('Escape')

    // Las hojas del ejemplo, que traen de todo: pendientes, hechos, listas e ideas
    await page.goto('?demo=1')
    for (const bloque of ['Agencia', 'editar Velas', 'ideas', 'sábado', 'ajustes']) {
      await abrirHoja(page, bloque)
      await revisarTodo(page)
      if (bloque === 'editar Velas') {
        await page.getByRole('button', { name: 'editar', exact: true }).click()
        await revisarTodo(page)
      }
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
    }
  })
}

test('el aviso de versión nueva se ve chiquito pero se toca en 44 de alto', async ({ page }) => {
  await page.goto('?demo=1')
  // El aviso solo sale cuando hay versión nueva; aquí se pone igualito para medirlo
  await page.evaluate(() => {
    const aviso = document.createElement('button')
    aviso.className = 'aviso-version'
    aviso.innerHTML = '<span>algo nuevo · toca aquí</span>'
    document.body.append(aviso)
  })
  const boton = (await page.locator('.aviso-version').boundingBox())!
  const pastilla = (await page.locator('.aviso-version span').boundingBox())!
  expect(boton.height).toBeGreaterThanOrEqual(44)
  expect(pastilla.height, 'la pastilla sigue chiquita').toBeLessThan(32)
  await revisarQueSeLee(page)
})
