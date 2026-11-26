import { defineConfig } from '@playwright/test'

// Pruebas de pantalla a las dos medidas: su iPhone (440 × 956) y uno más chico (393 × 852).
const puerto = 5180
const telefono = { isMobile: true, hasTouch: true, deviceScaleFactor: 3 }

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${puerto}/flora/`,
    browserName: 'chromium',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    screenshot: 'off',
    trace: 'off',
  },
  projects: [
    { name: '440x956', use: { ...telefono, viewport: { width: 440, height: 956 } } },
    { name: '393x852', use: { ...telefono, viewport: { width: 393, height: 852 } } },
  ],
  webServer: {
    command: `npx vite --port ${puerto} --strictPort`,
    url: `http://localhost:${puerto}/flora/`,
    reuseExistingServer: !process.env.CI,
  },
})
