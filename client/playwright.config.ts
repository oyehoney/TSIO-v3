import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  // Run tests sequentially to avoid race conditions with seeded records
  workers: 1,
  // Timeout for each test
  timeout: 30000,
  // Reporter
  reporter: 'list',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
