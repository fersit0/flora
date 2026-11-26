// Revisa que SU semana real también quepa sin deslizar.
// Solo corre en la compu donde existe privado/ (en GitHub se salta).
// Su semana se lee al momento de correr: no se escribe aquí ni se toman capturas.

import { test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrir, revisarQueCabe } from './ayuda'

const ruta = join(import.meta.dirname, '..', 'privado', 'semana.json')

test.skip(!existsSync(ruta), 'solo corre donde está la carpeta privado/')

test('su semana real cabe sin deslizar y ningún bloque corta su texto', async ({ page }) => {
  const suSemana = readFileSync(ruta, 'utf8')
  // En lugar del archivo de ejemplo, la app recibe su semana (solo en esta prueba)
  await page.route(
    (url) => url.pathname.endsWith('/semana-ejemplo.json'),
    (ruta) => ruta.fulfill({ contentType: 'text/javascript', body: `export default ${JSON.stringify(suSemana)}` }),
  )
  await abrir(page, '2026-11-25T12:30:00-06:00')
  await revisarQueCabe(page)
})
