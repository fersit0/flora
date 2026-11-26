// Arma los PNG del ícono y de la pantalla de arranque desde public/icono.svg.
// Se corre a mano cuando cambia el ícono:  node scripts/iconos.mjs
// (usa el navegador de las pruebas de pantalla; no agrega nada a la app)

import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/icono.svg', 'utf8')
const MARFIL = '#FAF5E6'

const navegador = await chromium.launch()
const pagina = await navegador.newPage()

// El ícono: el de la pantalla de inicio del iPhone (180) y los que pide el manifiesto (192 y 512)
for (const [archivo, lado] of [
  ['apple-touch-icon.png', 180],
  ['icono-192.png', 192],
  ['icono-512.png', 512],
]) {
  await pagina.setViewportSize({ width: lado, height: lado })
  await pagina.setContent(`<style>html,body{margin:0}svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`)
  await pagina.screenshot({ path: `public/${archivo}` })
}

// La pantalla de arranque es marfil, a la medida exacta de cada iPhone (en pixeles reales, ×3):
// su 17 Pro (402 × 874) y las dos medidas de las pruebas (440 × 956 y 393 × 852)
for (const [ancho, alto] of [
  [1206, 2622],
  [1320, 2868],
  [1179, 2556],
]) {
  await pagina.setViewportSize({ width: ancho, height: alto })
  await pagina.setContent(`<style>html,body{margin:0;height:100%;background:${MARFIL}}</style>`)
  await pagina.screenshot({ path: `public/arranque-${ancho}x${alto}.png` })
}

await navegador.close()
console.log('listo: íconos y pantallas de arranque en public/')
