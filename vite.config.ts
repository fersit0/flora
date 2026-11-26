/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// El repo se llama "flora", así que la página vive en /flora/
const base = '/flora/'

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
  ],
  test: {
    include: ['src/**/*.test.ts', 'pruebas/**/*.test.ts'],
  },
})
