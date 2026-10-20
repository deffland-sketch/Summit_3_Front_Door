import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: /(e2e|tests\/scenarios)\/.*\.spec\.ts$/,
  testIgnore: [/node_modules/, /dist/],
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
