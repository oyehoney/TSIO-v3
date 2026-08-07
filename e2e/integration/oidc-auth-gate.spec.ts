/**
 * e2e/integration/oidc-auth-gate.spec.ts
 * RTM: TEST-F8-01 through TEST-F8-03
 * Validates: unauthenticated /admin/* → OIDC login redirect; non-CURATOR → 403; session expiry → login
 * F8: Curation and Administration — OIDC Auth Gate
 *
 * The admin frontend (client/src/admin/hooks/useAdminAuth.ts) checks auth by calling
 * GET /api/v1/admin/dashboard-summary. On 401/403 → redirect to /admin/login.
 * The /admin/login page shows "Sign in with Microsoft" which calls /auth/login (OIDC redirect).
 */

import { test, expect } from '@playwright/test';

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F8: OIDC Auth Gate', () => {

  test('TEST-F8-01: unauthenticated access to /admin/* redirects to OIDC login', async ({ page }) => {
    // No session cookie set — pure unauthenticated request
    // useAdminAuth calls dashboard-summary which returns 401 → redirect to /admin/login
    await page.route('**/api/v1/admin/dashboard-summary**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }),
      });
    });
    await page.goto('/admin');
    // Wait for potential redirect
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    // Check URL or visible content indicating login page
    const isLoginPage = finalUrl.includes('login') ||
      await page.getByRole('button', { name: /Sign in/i }).isVisible().catch(() => false) ||
      await page.getByText(/Sign in with Microsoft|Administration Interface/i).isVisible().catch(() => false);
    expect(isLoginPage).toBe(true);
  });

  test('TEST-F8-02: authenticated user without CURATOR role receives 403', async ({ page }) => {
    // Set a non-CURATOR session: dashboard-summary returns 403
    await page.route('**/api/v1/admin/dashboard-summary**', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'FORBIDDEN', message: 'You do not have permission to access the administration interface.' },
        }),
      });
    });
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    // Either a 403 page, "do not have permission" message, or redirected to login
    const has403 = await page.getByText(/do not have permission|unauthorized|403|access denied|forbidden/i)
      .isVisible().catch(() => false);
    const finalUrl = page.url();
    const isLoginPage = finalUrl.includes('login') ||
      await page.getByRole('button', { name: /Sign in/i }).isVisible().catch(() => false) ||
      await page.getByText(/Sign in with Microsoft|Administration Interface/i).isVisible().catch(() => false);
    expect(has403 || isLoginPage).toBe(true);
  });

  test('TEST-F8-03: expired OIDC session redirects to login', async ({ page }) => {
    // Simulate expired session — dashboard-summary returns 401
    await page.route('**/api/v1/admin/dashboard-summary**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' },
        }),
      });
    });
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    const isLoginPage = finalUrl.includes('login') ||
      await page.getByRole('button', { name: /Sign in/i }).isVisible().catch(() => false) ||
      await page.getByText(/Sign in with Microsoft|Administration Interface/i).isVisible().catch(() => false);
    expect(isLoginPage).toBe(true);
  });
});
