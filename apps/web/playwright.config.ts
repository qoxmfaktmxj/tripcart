import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3202',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'cmd /c "pnpm exec next build && pnpm exec next start --port 3202"',
    url: 'http://127.0.0.1:3202',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  reporter: [['list']],
})
