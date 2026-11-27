// Una versión nueva de Flora: avisa, al tocar el aviso se actualiza y no se pierde nada.
// Aquí se arma la app de verdad (con su service worker) y se sirven dos versiones:
// la "a" que ella tiene abierta y la "b" que sale después.

import { execFileSync } from 'node:child_process'
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { esperarGuardado } from './ayuda'

const PUERTO = 5191
const TIPOS: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

let carpeta = ''
let raiz = ''
let servidor: Server

test.beforeAll(async () => {
  test.skip(test.info().project.name !== '393x852', 'con una medida basta')
  carpeta = mkdtempSync(join(tmpdir(), 'flora-version-'))
  execFileSync('npx', ['vite', 'build', '--outDir', join(carpeta, 'a'), '--emptyOutDir', '--logLevel', 'error'])
  cpSync(join(carpeta, 'a'), join(carpeta, 'b'), { recursive: true })
  appendFileSync(join(carpeta, 'b', 'sw.js'), '\n// versión b\n')
  raiz = join(carpeta, 'a')
  servidor = createServer((pedido, respuesta) => {
    let ruta = decodeURIComponent(new URL(pedido.url!, 'http://x').pathname).replace(/^\/flora\//, '')
    if (!ruta || ruta.endsWith('/')) ruta += 'index.html'
    try {
      const cuerpo = readFileSync(join(raiz, ruta))
      respuesta.writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' })
      respuesta.end(cuerpo)
    } catch {
      respuesta.writeHead(404).end()
    }
  })
  await new Promise<void>((listo) => servidor.listen(PUERTO, listo))
})

test.afterAll(async () => {
  if (!carpeta) return
  await new Promise((listo) => servidor.close(listo))
  rmSync(carpeta, { recursive: true, force: true })
})

/** Ella tiene la versión "a" abierta, con su semana y un pendiente escrito */
async function abrirVersionA(page: Page) {
  raiz = join(carpeta, 'a')
  await page.goto(`http://localhost:${PUERTO}/flora/`)
  await page.getByRole('textbox', { name: 'tu semana' }).fill(JSON.stringify(ejemplo))
  await page.getByRole('button', { name: 'listo' }).click()
  await page.getByRole('button', { name: 'editar Velas' }).click()
  await page.waitForTimeout(350)
  const campo = page.getByRole('textbox', { name: '+ escribe un pendiente…' })
  await campo.fill('llamar a la imprenta')
  await campo.press('Enter')
  await esperarGuardado(page, 'velas', 'llamar a la imprenta', 'flora')
  await page.keyboard.press('Escape')
  // La primera vez el service worker se instala; desde la siguiente vez que abre, ya la atiende él
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await esperarGuardado(page, 'velas', 'llamar a la imprenta', 'flora')
}

/** Sale la versión "b" y ella regresa a la app */
async function saleVersionB(page: Page) {
  raiz = join(carpeta, 'b')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
}

async function revisarQueSeActualiza(page: Page) {
  const aviso = page.getByRole('button', { name: 'algo nuevo · toca aquí' })
  await expect(aviso).toBeVisible({ timeout: 15_000 })
  const recarga = page.waitForEvent('load', { timeout: 6000 })
  await aviso.click()
  await recarga
  await expect(aviso).toHaveCount(0)
  await esperarGuardado(page, 'velas', 'llamar a la imprenta', 'flora')
  // Lo que escribió sigue ahí
  await page.getByRole('button', { name: 'editar Velas' }).click()
  await expect(page.getByRole('button', { name: 'llamar a la imprenta', exact: true })).toBeVisible()
}

test('una versión nueva avisa; al tocar el aviso se actualiza y no se pierde nada', async ({ page }) => {
  await abrirVersionA(page)
  await saleVersionB(page)
  await revisarQueSeActualiza(page)
})

test('en el iPhone (que no avisa cuando la versión nueva toma el control) tocar el aviso también actualiza', async ({
  page,
}) => {
  // Como en iOS: el aviso de "ya tomó el control" no llega
  await page.addInitScript(() => {
    const original = ServiceWorkerContainer.prototype.addEventListener
    ServiceWorkerContainer.prototype.addEventListener = function (
      this: ServiceWorkerContainer,
      tipo: string,
      ...resto: [EventListenerOrEventListenerObject, (boolean | AddEventListenerOptions)?]
    ) {
      if (tipo === 'controllerchange') return
      return original.call(this, tipo, ...resto)
    } as typeof original
  })
  await abrirVersionA(page)
  await saleVersionB(page)
  await revisarQueSeActualiza(page)
})
