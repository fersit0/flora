import { expect, test, type Page } from '@playwright/test'
import ejemplo from '../src/datos/semana-ejemplo.json' with { type: 'json' }
import { abrir, abrirHoja, esperarGuardado, revisarQueCabe, revisarQueNoHayRojo } from './ayuda'

const MIERCOLES = '2026-11-25T12:30:00-06:00'

// Una lista inventada, en el formato que ella usa en WhatsApp
const LISTA = [
  '☕CAFÉ LIRIO ABRIL☕',
  'Semana 1',
  'Fotos terraza 2/04 ✅',
  'Reel de latte art 4/04',
  '',
  'Semana 2 ',
  'Carrusel Regalos 9/04',
  'Video corto 11/04',
].join('\n')

async function tocarFuera(page: Page) {
  // Arriba de la hoja, sobre el velo
  await page.mouse.click(200, 40)
}

test.beforeEach(async ({ page }) => {
  await abrir(page, MIERCOLES)
})

test('tocar un bloque abre su hoja, que deja ver un pedazo del horario', async ({ page }) => {
  const hoja = await abrirHoja(page, 'grabar Velas')
  await expect(hoja.getByRole('heading', { level: 2 })).toHaveText('🕯️Velas Marea')
  await expect(hoja.locator('.pastilla')).toHaveText('lun · mié · vie')
  await expect(hoja.locator('.hoja-resumen')).toHaveText('lunes grabo, miércoles edito, viernes entrego.')

  const [caja, dias] = [await page.locator('.hoja').boundingBox(), await page.locator('.dias').boundingBox()]
  expect(caja!.y, 'la hoja tapa los días').toBeGreaterThan(dias!.y + dias!.height)

  // En el iPhone, tocar un div solo avisa si tiene cursor de mano (sin esto, tocar fuera no cerraba)
  await expect(page.locator('.velo')).toHaveCSS('cursor', 'pointer')
  await tocarFuera(page)
  await expect(hoja).toBeHidden()
  await revisarQueCabe(page)
})

test('varios bloques abren la misma hoja', async ({ page }) => {
  for (const bloque of ['grabar Velas', 'editar Velas', 'entrega']) {
    const hoja = await abrirHoja(page, bloque)
    await expect(hoja.getByRole('heading', { level: 2 })).toContainText('Velas Marea')
    await tocarFuera(page)
    await expect(hoja).toBeHidden()
  }
})

test('solo se pueden tocar los bloques que abren algo: su hoja o su liga', async ({ page }) => {
  const bloques = Object.values(ejemplo.dias).flat()
  const conHoja = bloques.filter((b) => b.abre && 'espacio' in b.abre).length
  const conLiga = bloques.filter((b) => b.abre && 'liga' in b.abre).length
  await expect(page.locator('button.bloque')).toHaveCount(conHoja)
  await expect(page.locator('a.bloque')).toHaveCount(conLiga)
  // Las comidas (llegan después) y los que no abren nada no se pueden tocar
  for (const nombre of ['caminar', 'comida', 'lo suelto']) {
    await expect(page.locator('.bloque', { hasText: nombre }).first()).not.toHaveRole('button')
    await expect(page.locator('.bloque', { hasText: nombre }).first()).not.toHaveRole('link')
  }
})

test('pendientes: escribir y Enter, marcar, editar y borrar los hechos', async ({ page }) => {
  const hoja = await abrirHoja(page, 'Agencia')
  const campo = hoja.getByPlaceholder('+ escribe un pendiente…')
  const faltan = hoja.locator('.seccion-pendientes .renglon:not(.hecho)')
  const hechos = hoja.locator('.seccion-pendientes .renglon.hecho')
  await expect(faltan).toHaveText(['revisar el brief de la campaña de enero'])
  await expect(hechos).toHaveText(['mandar las tarjetas de navidad'])

  // Escribir y Enter: entra al final y el campo queda listo para el siguiente
  await campo.fill('llamar a la imprenta')
  await campo.press('Enter')
  await expect(faltan).toHaveText(['revisar el brief de la campaña de enero', 'llamar a la imprenta'])
  await expect(campo).toHaveValue('')
  await expect(campo).toBeFocused()

  // Tocar el círculo lo manda a "hechos"
  await hoja.getByRole('button', { name: 'hecho: llamar a la imprenta' }).click()
  await expect(hechos).toHaveText(['mandar las tarjetas de navidad', 'llamar a la imprenta'])

  // Tocar el texto lo edita
  await hoja.getByRole('button', { name: 'revisar el brief de la campaña de enero', exact: true }).click()
  const editar = hoja.getByRole('textbox', { name: 'editar: revisar el brief de la campaña de enero' })
  await expect(editar).toBeFocused()
  await editar.fill('revisar el brief de febrero')
  await editar.press('Enter')
  await expect(faltan).toHaveText(['revisar el brief de febrero'])

  // Borrar los hechos
  await hoja.getByRole('button', { name: 'borrar' }).click()
  await expect(hechos).toHaveCount(0)
  await expect(hoja.getByText('hechos', { exact: true })).toHaveCount(0)
  await expect(faltan).toHaveText(['revisar el brief de febrero'])
})

test('pegar varios renglones en el campo agrega uno por cada renglón', async ({ page }) => {
  const hoja = await abrirHoja(page, 'Agencia')
  await hoja.getByPlaceholder('+ escribe un pendiente…').evaluate((campo) => {
    const datos = new DataTransfer()
    datos.setData('text/plain', 'comprar tinta\n\n  pagar el dominio \n')
    campo.dispatchEvent(new ClipboardEvent('paste', { clipboardData: datos, bubbles: true, cancelable: true }))
  })
  await expect(hoja.locator('.seccion-pendientes .renglon:not(.hecho)')).toHaveText([
    'revisar el brief de la campaña de enero',
    'comprar tinta',
    'pagar el dominio',
  ])
})

test('sin pendientes, la hoja lo dice bonito', async ({ page }) => {
  const hoja = await abrirHoja(page, 'Café Lirio')
  await expect(hoja.getByText('aquí van tus pendientes de Café Lirio ☆')).toBeVisible()
})

test('lista de contenidos: pegar, marcar y copiar regresa el mismo texto con solo ese ✅', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const hoja = await abrirHoja(page, 'Café Lirio')

  // Pegar la lista completa
  await hoja.getByRole('button', { name: 'editar' }).click()
  await hoja.getByRole('textbox', { name: 'tu lista de contenidos' }).fill(LISTA)
  await hoja.getByRole('button', { name: 'listo' }).click()

  // Se dibuja bonito: título, semanas, cada renglón con su fecha
  await expect(hoja.locator('.lista-titulo')).toHaveText('☕CAFÉ LIRIO ABRIL☕')
  await expect(hoja.locator('.lista-semana')).toHaveText(['Semana 1', 'Semana 2'])
  await expect(hoja.locator('.lista .renglon-texto')).toHaveText(['Fotos terraza', 'Reel de latte art', 'Carrusel Regalos', 'Video corto'])
  await expect(hoja.locator('.lista .fecha')).toHaveText(['2/04', '4/04', '9/04', '11/04'])
  await expect(hoja.locator('.lista .renglon.hecho .renglon-texto')).toHaveText(['Fotos terraza'])

  // Marcar un renglón y copiar
  await hoja.getByRole('button', { name: 'hecho: Carrusel Regalos' }).click()
  await hoja.getByRole('button', { name: 'copiar' }).click()
  await expect(hoja.getByRole('button', { name: 'copiado' })).toBeVisible()
  const copiado = await page.evaluate(() => navigator.clipboard.readText())
  expect(copiado).toBe(LISTA.replace('Carrusel Regalos 9/04', 'Carrusel Regalos 9/04 ✅'))

  // Desmarcarlo la deja idéntica
  await hoja.getByRole('button', { name: 'hecho: Carrusel Regalos' }).click()
  await hoja.getByRole('button', { name: 'copiar' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LISTA)
})

test('ideas: la nueva va arriba y "ya la usé" la manda al final', async ({ page }) => {
  const hoja = await abrirHoja(page, 'anotar ideas')
  const nuevas = hoja.locator('.renglon.idea:not(.usada) .renglon-texto')
  const usadas = hoja.locator('.renglon.idea.usada .renglon-texto')

  const campo = hoja.getByPlaceholder('+ anota una idea…')
  await campo.fill('mis 3 cafés favoritos')
  await campo.press('Enter')
  await expect(nuevas.first()).toHaveText('mis 3 cafés favoritos')

  await hoja.locator('.renglon.idea', { hasText: 'mis 3 cafés favoritos' }).getByRole('button', { name: 'ya la usé' }).click()
  await expect(usadas.last()).toHaveText('mis 3 cafés favoritos')
  await expect(nuevas).not.toContainText(['mis 3 cafés favoritos'])
})

test('lo guardado sobrevive a cerrar y volver a abrir', async ({ page }) => {
  let hoja = await abrirHoja(page, 'grabar Velas')
  const campo = hoja.getByPlaceholder('+ escribe un pendiente…')
  await campo.fill('mandar factura')
  await campo.press('Enter')
  await hoja.getByRole('button', { name: 'hecho: pedir el logo en alta' }).click()
  await hoja.getByRole('button', { name: 'hecho: Video largo Primavera' }).click()
  await expect(hoja.locator('.lista .renglon.hecho')).toHaveCount(4)
  // Un toque tarda unas milésimas en guardarse; nadie cierra la app tan rápido, la prueba sí
  await esperarGuardado(page, 'velas', 'Primavera 12/03 ✅')

  await page.reload()
  await page.locator('.bloque').first().waitFor()
  hoja = await abrirHoja(page, 'grabar Velas')
  await expect(hoja.locator('.seccion-pendientes .renglon:not(.hecho)')).toHaveText(['confirmar los aromas nuevos', 'mandar factura'])
  await expect(hoja.locator('.seccion-pendientes .renglon.hecho')).toHaveText(['pedir el logo en alta'])
  await expect(hoja.locator('.lista .renglon.hecho')).toHaveCount(4)
})

test('el ejemplo se guarda aparte: no toca lo guardado de su semana', async ({ page }) => {
  const hoja = await abrirHoja(page, 'Agencia')
  const campo = hoja.getByPlaceholder('+ escribe un pendiente…')
  await campo.fill('algo de prueba')
  await campo.press('Enter')
  await expect(hoja.getByText('algo de prueba')).toBeVisible()
  const bases = await page.evaluate(async () => (await indexedDB.databases()).map((b) => b.name))
  expect(bases).toEqual(['flora-ejemplo'])
})

test('el gesto de atrás cierra la hoja y sigues en tu semana', async ({ page }) => {
  const hoja = await abrirHoja(page, 'grabar Velas')
  await page.evaluate(() => history.back())
  await expect(hoja).toBeHidden()
  await expect(page).toHaveURL(/\?demo=1$/)
  await expect(page.locator('h1')).toHaveText('Flora')
})

test('jalar el asa hacia abajo cierra la hoja; jalarla poquito no', async ({ page }) => {
  const hoja = await abrirHoja(page, 'grabar Velas')
  const asa = (await page.locator('.asa').boundingBox())!
  const x = asa.x + asa.width / 2
  const y = asa.y + asa.height / 2

  // Poquito: regresa a su lugar
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 20, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  await expect(hoja).toBeVisible()

  // Hasta abajo: se cierra
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 250, { steps: 10 })
  await page.mouse.up()
  await expect(hoja).toBeHidden()
})

test('nada regaña en las hojas: sin rojo', async ({ page }) => {
  await abrirHoja(page, 'grabar Velas')
  await revisarQueNoHayRojo(page)
})
