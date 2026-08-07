import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/uat',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  reporter: [['json', { outputFile: 'playwright-results.json' }], ['list']],
});
