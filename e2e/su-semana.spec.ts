// Revisa que SU semana real entre con su liga de instalación y que quepa sin deslizar en su teléfono.
// Solo corre en la compu donde existe privado/ (en GitHub se salta).
// Su semana se lee al momento de correr: no se escribe aquí ni se toman capturas.

import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { armarRespaldoInicial } from '../scripts/liga.mjs'
import { abrirConLiga, revisarQueCabe } from './ayuda'

const ruta = join(import.meta.dirname, '..', 'privado', 'semana.json')

test.skip(!existsSync(ruta), 'solo corre donde está la carpeta privado/')

// Su teléfono: iPhone 17 Pro (402 × 874). La de ejemplo se revisa en las otras dos medidas.
test.use({ viewport: { width: 402, height: 874 } })

test('su semana real se pega, cabe sin deslizar y ningún bloque corta su texto', async ({ page }) => {
  test.skip(test.info().project.name !== '440x956', 'con una vez basta: la medida es la de su teléfono')
  // Igual que ella: abre su liga de instalación (con su semana y sus listas)
  await abrirConLiga(page, armarRespaldoInicial(join(ruta, '..')))
  await revisarQueCabe(page)
})
