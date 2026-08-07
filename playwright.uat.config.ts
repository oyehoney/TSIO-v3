import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e/uat',
  timeout: 30000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  reporter: [['json', { outputFile: 'playwright-results.json' }], ['list']],
});
