import { expect, test } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, revisarQueCabe, revisarQueNoHayRojo } from './ayuda'

// Fechas de prueba (noviembre 2026, hora de CDMX)
const MIERCOLES_MEDIODIA = '2026-11-25T12:30:00-06:00'
const MIERCOLES_NOCHE = '2026-11-25T23:10:00-06:00'
const SABADO = '2026-11-28T11:00:00-06:00'
const DOMINGO = '2026-11-29T18:00:00-06:00'

test('abrir es ver: directo en el horario, con título y los cinco días', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  await expect(page.locator('h1')).toHaveText('Flora')
  await expect(page.locator('.dia')).toHaveText(['lun', 'mar', 'mié', 'jue', 'vie'])
  await expect(page.locator('.finde-nombre')).toHaveText(['sábado', 'domingo'])
})

test('cabe sin deslizar y ningún bloque corta su texto', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  await revisarQueCabe(page)
})

test('dibuja todos los bloques desde los datos, en su día y a su hora', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  const total = Object.values(ejemplo.dias).reduce((n, dia) => n + dia.length, 0)
  await expect(page.locator('.bloque')).toHaveCount(total)

  // El primer bloque del lunes (8 a 9) va arriba de todo, el de 9 a 13 justo abajo
  const lunes = page.locator('[data-dia="lun"] .bloque')
  await expect(lunes.first()).toContainText('caminar')
  const [primero, segundo] = [await lunes.nth(0).boundingBox(), await lunes.nth(1).boundingBox()]
  expect(segundo!.y).toBeGreaterThan(primero!.y + primero!.height)
  // Un bloque de 4 horas mide cerca de 4 veces uno de 1 hora
  expect(segundo!.height / primero!.height).toBeGreaterThan(3.5)
  expect(segundo!.height / primero!.height).toBeLessThan(4.5)
})

test('las horas van de 8 a 9 de la noche, como en su imagen', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  await expect(page.locator('.hora')).toHaveText(['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
})

test('entre semana: la columna de hoy se resalta y la línea marca la hora', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  await expect(page.locator('.dia.hoy')).toHaveText('mié')
  await expect(page.locator('.columna.hoy')).toHaveAttribute('data-dia', 'mié')
  await expect(page.locator('.finde-dia.hoy')).toHaveCount(0)

  const linea = page.locator('.columna.hoy .ahora')
  await expect(linea).toBeVisible()
  // 12:30 está a 4.5 de las 14 horas del horario
  const [caja, cuadricula] = [await linea.boundingBox(), await page.locator('.cuadricula').boundingBox()]
  const proporcion = (caja!.y + caja!.height / 2 - cuadricula!.y) / cuadricula!.height
  expect(proporcion).toBeCloseTo(4.5 / 14, 2)
})

test('fuera del horario no hay línea, pero el día sigue resaltado', async ({ page }) => {
  await abrir(page, MIERCOLES_NOCHE)
  await expect(page.locator('.dia.hoy')).toHaveText('mié')
  await expect(page.locator('.ahora')).toHaveCount(0)
})

test('sábado: no hay columna de hoy y se resalta el recuadro del sábado', async ({ page }) => {
  await abrir(page, SABADO)
  await expect(page.locator('.columna.hoy')).toHaveCount(0)
  await expect(page.locator('.dia.hoy')).toHaveCount(0)
  await expect(page.locator('.ahora')).toHaveCount(0)
  await expect(page.locator('.finde-dia.hoy .finde-nombre')).toHaveText('sábado')
  await expect(page.locator('.finde-dia.hoy .finde-corto')).toHaveText(ejemplo.finde.sab.corto)
})

test('domingo: se resalta el recuadro del domingo', async ({ page }) => {
  await abrir(page, DOMINGO)
  await expect(page.locator('.finde-dia.hoy .finde-nombre')).toHaveText('domingo')
  await revisarQueCabe(page)
})

test('nada regaña: sin rojo en la pantalla', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  await revisarQueNoHayRojo(page)
})

test('los nombres nunca se parten con guion (Safari lo hacía: "Ve-las")', async ({ page }) => {
  await abrir(page, MIERCOLES_MEDIODIA)
  const conGuion = await page.$$eval('.bloque .nombre', (nombres) =>
    nombres.filter((n) => getComputedStyle(n).hyphens === 'auto').length,
  )
  expect(conGuion).toBe(0)
})

test('el ícono y la pantalla de arranque están y son imágenes', async ({ page, request }) => {
  await page.goto('?demo=1')
  const ligas = await page.$$eval('link[rel="apple-touch-icon"], link[rel="apple-touch-startup-image"], link[rel="icon"]', (ls) =>
    ls.map((l) => l.getAttribute('href')!),
  )
  expect(ligas.length).toBe(5) // ícono, ícono del iPhone y tres pantallas de arranque
  for (const liga of ligas) {
    const respuesta = await request.get(liga)
    expect(respuesta.ok(), liga).toBe(true)
    expect(respuesta.headers()['content-type'], liga).toMatch(/^image\//)
  }
})
