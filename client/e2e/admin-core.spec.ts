// e2e/admin-core.spec.ts — Playwright e2e tests for admin interface (Plan 14, Wave 6a)
// Tests: OIDC auth gate, DashboardPage, RecordsListPage, RecordEditPage (29 fields).
// Uses page.route() to mock API responses — no live backend required.
// Per UX-Mockup Screen 06 (Admin Dashboard), Screen 07 (Record Edit), Screen 08 (Records List).

import { test, expect, Page } from '@playwright/test';

// ── Auth mock helper ─────────────────────────────────────────────────────────
// useAdminAuth() calls GET /api/v1/admin/dashboard-summary to check session.
// Mock it to return 200 (authenticated) or 401 (unauthenticated).

async function mockAuthSuccess(page: Page) {
  await page.route('/api/v1/admin/dashboard-summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_published_records: 12,
        draft_review_records: 4,
        pending_opportunity_submissions: 3,
        pending_contribution_submissions: 2,
        recent_engagement_requests_7d: 7,
      }),
    })
  );
}

async function mockAuthFail(page: Page) {
  await page.route('/api/v1/admin/dashboard-summary', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":{"code":"UNAUTHORIZED"}}' })
  );
}

async function mockAdminRecordsList(page: Page) {
  await page.route('/api/v1/admin/records*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            record_id: 'rec_test_001',
            title: 'Audio Security Proof of Concept',
            maturity_level: 'EXPERIMENT_POC',
            review_status: 'CURATED',
            publication_state: 'PUBLISHED',
            owner_name: 'Jane Smith',
            owner_office: 'AO I&R',
            updated_at: '2026-07-01T00:00:00.000Z',
          },
        ],
        pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
      }),
    })
  );
}

// ── Test: Unauthenticated /admin redirects to /admin/login ───────────────────

test('unauthenticated /admin redirects to /admin/login', async ({ page }) => {
  await mockAuthFail(page);
  await page.goto('/admin');
  // Should end up at /admin/login (via client-side redirect from useAdminAuth)
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 8000 });
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
});

// ── Test: /admin/login renders correctly ─────────────────────────────────────

test('/admin/login shows sign-in button', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
  // Page title
  await expect(page).toHaveTitle(/Administration.*TSIO Innovation Hub/i);
});

// ── Test: /admin/login with error=access_denied shows 403 message ────────────

test('/admin/login with error=access_denied shows access denied message', async ({ page }) => {
  await page.goto('/admin/login?error=access_denied');
  await expect(page.getByText('You do not have permission')).toBeVisible();
  // Should also show "Access Denied" text
  await expect(page.getByText(/Access Denied/i)).toBeVisible();
});

// ── Test: DashboardPage shows 5 summary tiles ────────────────────────────────

test('DashboardPage renders 5 summary tiles with data', async ({ page }) => {
  await mockAuthSuccess(page);
  await page.goto('/admin');
  // Wait for dashboard to load
  await expect(page.getByText('Published Records').first()).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Draft / In Review').first()).toBeVisible();
  await expect(page.getByText('Opportunity Submissions').first()).toBeVisible();
  await expect(page.getByText('Contribution Submissions').first()).toBeVisible();
  await expect(page.getByText(/Recent Engagements/i).first()).toBeVisible();
  // Quick Actions
  await expect(page.getByText('+ New Innovation Record')).toBeVisible();
});

// ── Test: RecordsListPage renders table with column headers ──────────────────

test('RecordsListPage renders table with column headers', async ({ page }) => {
  await mockAuthSuccess(page);
  await mockAdminRecordsList(page);
  await page.goto('/admin/records');
  // Table headers per UX-Mockup Screen 08
  await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('columnheader', { name: 'Maturity' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /State/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Review Status/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Owner/i })).toBeVisible();
});

// ── Test: RecordEditPage at /admin/records/new renders all major sections ─────

test('/admin/records/new renders all form sections', async ({ page }) => {
  await mockAuthSuccess(page);
  await page.goto('/admin/records/new');
  // Section headings per UX-Mockup Screen 07
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/GOVERNANCE.*CLASSIFICATION/i)).toBeVisible();
  await expect(page.getByText(/PERSPECTIVES/i)).toBeVisible();
  await expect(page.getByText(/ARTIFACT LINKS/i).first()).toBeVisible();
  await expect(page.getByText(/ENGAGEMENT OPTIONS/i).first()).toBeVisible();
  // Publication Readiness Checklist
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();
});

// ── Test: Maturity dropdown shows inline definition ──────────────────────────

test('maturity level dropdown shows inline definition', async ({ page }) => {
  await mockAuthSuccess(page);
  await page.goto('/admin/records/new');
  // Wait for page to load
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });
  // Select EXPERIMENT_POC
  await page.selectOption('[name="maturity_level"]', 'EXPERIMENT_POC');
  await expect(page.getByText('targeted exploration was conducted to test feasibility')).toBeVisible();
});

// ── Test: Missing pub-required fields show GovernanceGate error ──────────────

test('GovernanceGate shows missing fields on Submit for Review', async ({ page }) => {
  await mockAuthSuccess(page);
  await page.goto('/admin/records/new');
  // Wait for page to load
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });
  // Click Submit for Review without filling fields
  const submitBtn = page.getByRole('button', { name: /Submit for Review/i });
  // Button should be disabled when no fields filled
  await expect(submitBtn).toBeDisabled();
  // Fill title only to make it partially complete, then verify checklist still shows missing items
  await page.fill('[name="title"]', 'Test Record Title 123');
  // Still disabled — many required fields missing
  await expect(submitBtn).toBeDisabled();
  // Readiness checklist should show red items
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();
  // At least one checklist item should show ❌ or "REQUIRED"
  await expect(page.getByText(/REQUIRED|❌/i).first()).toBeVisible();
});

// ── Test: AdminSidebar navigation links are present and point to real routes ──

test('AdminSidebar contains all navigation links', async ({ page }) => {
  await mockAuthSuccess(page);
  await page.goto('/admin');
  // Wait for dashboard
  await expect(page.getByText('Published Records')).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'All Records' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Opportunities/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contributions/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Activity Log/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Content Model/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Hub Settings/i })).toBeVisible();
});
