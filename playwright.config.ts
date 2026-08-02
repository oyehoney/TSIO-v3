import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e configuration for TSIO Innovation Hub.
 *
 * Tests run against the Express dev server on http://localhost:3000.
 * The webServer config auto-starts the server if not already running.
 *
 * Backend (database) is required for integration tests; unit-level tests
 * use route interception (page.route()) to mock API calls.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Auto-start Express dev server if not already running
  // TEST_MOCK_SEARCH=true activates in-memory mock fixtures in searchPageHandler.js
  // so e2e tests run without a live PostgreSQL database (Wave 7 uses real data).
  webServer: {
    command: 'node src/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      PORT: '3000',
      NODE_ENV: 'test',
      TEST_MOCK_SEARCH: 'true',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://tsio:tsio@localhost:5432/tsio_hub',
    },
  },
});
