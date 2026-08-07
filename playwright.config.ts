/**
 * playwright.config.ts
 * Root-level Playwright configuration for TSIO Innovation Hub integration test suite
 * Plan 18 — Wave 7b: End-to-end integration validation
 */

import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    // Don't fail on navigation errors — some tests mock 404 pages
    ignoreHTTPSErrors: true,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    // Start the Vite dev server from the client directory
    command: path.join(__dirname, 'client/node_modules/.bin/vite') + ' --config ' + path.join(__dirname, 'client/vite.config.ts'),
    cwd: path.join(__dirname, 'client'),
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
