/// <reference types="vitest/config" />
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// El repo se llama "flora", así que la página vive en /flora/
const base = '/flora/'

// Su liga de instalación (?semana=…): al agregar a inicio, el iPhone instala la app en la
// dirección del manifiesto (/flora/) y su semana se quedaría fuera (lo vimos en el simulador).
// Sin manifiesto, el iPhone la instala en la dirección de la página, con su semana adentro.
// Por eso el manifiesto solo se pone cuando la página no se abrió con su liga.
const manifiestoSinSuLiga: Plugin = {
  name: 'flora-manifiesto-sin-su-liga',
  apply: 'build',
  enforce: 'post',
  // Al final de todo: el plugin de la PWA pone su <link rel="manifest"> casi al terminar
  writeBundle(opciones) {
    const archivo = join(opciones.dir ?? 'dist', 'index.html')
    const html = readFileSync(archivo, 'utf8')
    const conScript = html.replace(
      /<link rel="manifest" href="([^"]+)"[^>]*>/,
      (_, href: string) =>
        `<script>if(!/[?&]semana=/.test(location.search)){var m=document.createElement('link');m.rel='manifest';m.href=${JSON.stringify(href)};document.head.appendChild(m)}</script>`,
    )
    if (conScript === html) throw new Error('no encontré el manifiesto en index.html')
    writeFileSync(archivo, conScript)
  },
}

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Flora',
        short_name: 'Flora',
        description: 'Mi semana en una pantalla',
        lang: 'es-MX',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF5E6',
        theme_color: '#F7D3E0', // rosa claro de la franja: el color detrás de la hora
        // El sol con carita sobre vino (public/icono.svg; los PNG salen de scripts/iconos.mjs)
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
    manifiestoSinSuLiga,
  ],
  test: {
    include: ['src/**/*.test.ts', 'pruebas/**/*.test.ts'],
  },
})
