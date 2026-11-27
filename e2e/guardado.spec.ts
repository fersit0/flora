// Pulido, ronda 6: que nunca se pierdan datos. El teléfono no debe borrar lo guardado,
// lo escrito con versiones viejas se sigue leyendo, y si iOS corta la conexión con el
// guardado (pasa cuando la app estuvo mucho tiempo en segundo plano), se vuelve a conectar.

import { expect, test } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirConLiga, abrirHoja, esperarGuardado } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'

test('al abrir, le pide al teléfono que no borre lo guardado aunque le falte espacio', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as Window & { pedidos?: number }
    w.pedidos = 0
    StorageManager.prototype.persist = async () => {
      w.pedidos!++
      return true
    }
  })
  await page.goto('./')
  await page.locator('.bloque').first().waitFor()
  // Todavía no guarda nada y ya lo pidió
  await expect.poll(() => page.evaluate(() => (window as Window & { pedidos?: number }).pedidos)).toBe(1)
})

test('lo escrito con la versión de la fase 2 (un guardado más viejo) se sigue leyendo y guardando', async ({ page }) => {
  // Una página del mismo sitio que no abre la app, para dejar el guardado como lo dejaba la fase 2:
  // solo con "espacios", y renglones sin todos sus datos
  await page.goto('icono.svg')
  await page.evaluate(
    () =>
      new Promise<void>((listo) => {
        const abrir = indexedDB.open('flora-ejemplo', 1)
        abrir.onupgradeneeded = () => abrir.result.createObjectStore('espacios')
        abrir.onsuccess = () => {
          const tx = abrir.result.transaction('espacios', 'readwrite')
          tx.objectStore('espacios').put(
            { pendientes: [{ id: 'v1', texto: 'de la versión vieja' }], contenidos: 'Semana 1\nVideo viejo 1/03 ✅' },
            'velas',
          )
          tx.oncomplete = () => {
            abrir.result.close()
            listo()
          }
        }
      }),
  )
  await abrir(page, MIERCOLES)
  const hoja = await abrirHoja(page, 'editar Velas')
  await expect(hoja.getByRole('button', { name: 'de la versión vieja', exact: true })).toBeVisible()
  await expect(hoja.getByText('Video viejo')).toBeVisible()
  const campo = hoja.getByRole('textbox', { name: '+ escribe un pendiente…' })
  await campo.fill('uno nuevo')
  await campo.press('Enter')
  await esperarGuardado(page, 'velas', 'uno nuevo')
  await esperarGuardado(page, 'velas', 'de la versión vieja')
})

test('si iOS corta la conexión con el guardado, lo que escribe se guarda igual y nada se ve vacío', async ({ page }) => {
  // Guarda cada conexión que abre la app, para poder cortarlas como lo hace iOS
  await page.addInitScript(() => {
    const w = window as Window & { conexiones?: IDBDatabase[]; cortar?: () => void }
    w.conexiones = []
    const original = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (this: IDBFactory, ...args: Parameters<typeof original>) {
      const pedido = original.apply(this, args)
      pedido.addEventListener('success', () => w.conexiones!.push(pedido.result))
      return pedido
    }
    w.cortar = () => {
      for (const c of w.conexiones!) {
        c.close()
        c.dispatchEvent(new Event('close'))
      }
    }
  })
  // Su semana (la de ejemplo, con su liga, como si fuera la suya): sus hojas empiezan vacías
  await abrirConLiga(page)
  let hoja = await abrirHoja(page, 'editar Velas')
  let campo = hoja.getByRole('textbox', { name: '+ escribe un pendiente…' })
  await campo.fill('antes del corte')
  await campo.press('Enter')
  await esperarGuardado(page, 'velas', 'antes del corte', 'flora')
  await page.keyboard.press('Escape')
  await expect(hoja).toBeHidden()

  await page.evaluate(() => (window as Window & { cortar?: () => void }).cortar!())

  // Lo que ya tenía se sigue viendo (no una hoja vacía)…
  hoja = await abrirHoja(page, 'editar Velas')
  await expect(hoja.getByRole('button', { name: 'antes del corte', exact: true })).toBeVisible()
  // …y lo nuevo se guarda
  campo = hoja.getByRole('textbox', { name: '+ escribe un pendiente…' })
  await campo.fill('después del corte')
  await campo.press('Enter')
  await esperarGuardado(page, 'velas', 'después del corte', 'flora')
  await page.reload()
  hoja = await abrirHoja(page, 'editar Velas')
  await expect(hoja.getByRole('button', { name: 'antes del corte', exact: true })).toBeVisible()
  await expect(hoja.getByRole('button', { name: 'después del corte', exact: true })).toBeVisible()
})

test('si al abrir no se pudo leer su semana, no le pide pegarla otra vez: la lee al volver a la app', async ({
  page,
  context,
}) => {
  // Su semana (con otro nombre en un bloque, para distinguirla de la de ejemplo)
  await abrirConLiga(page, JSON.stringify(ejemplo).replace('"caminar"', '"yoga"'))

  // La vuelve a abrir y la primera vez el guardado no responde (como cuando iOS lo corta)
  const otra = await context.newPage()
  await otra.addInitScript(() => {
    let fallas = 2 // en desarrollo React lo lee dos veces al empezar
    const original = IDBFactory.prototype.open
    IDBFactory.prototype.open = function (this: IDBFactory, ...args: Parameters<typeof original>) {
      if (fallas-- > 0) throw new DOMException('se perdió la conexión', 'UnknownError')
      return original.apply(this, args)
    }
  })
  await otra.clock.setFixedTime(new Date(MIERCOLES))
  await otra.goto('./')
  await otra.waitForTimeout(500)
  // Ni le pide pegarla ni le enseña la de ejemplo como si no tuviera
  await expect(otra.locator('.bloque')).toHaveCount(0)
  await otra.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(otra.locator('.bloque', { hasText: 'yoga' }).first()).toBeVisible()
})
