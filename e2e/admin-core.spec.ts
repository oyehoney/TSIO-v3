/**
 * admin-core.spec.ts — Playwright e2e tests for admin interface.
 *
 * Tests: auth gate, login page, dashboard, records list, record edit form,
 * inline governance definitions, readiness checklist, sidebar nav.
 *
 * NOTE: Tests that require authentication use cookie injection with a test_session
 * cookie. The app auth check (useAdminAuth) calls /api/v1/admin/dashboard-summary;
 * tests intercept this request and mock a 200 response.
 *
 * F8: Curation and Administration — admin interface e2e validation
 */

import { test, expect } from '@playwright/test';

// Helper: mock auth so useAdminAuth() passes
async function mockAuth(page: import('@playwright/test').Page) {
  // Intercept the auth-check call made by useAdminAuth
  await page.route('/api/v1/admin/dashboard-summary', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_published_records: 3,
        draft_review_records: 5,
        pending_opportunity_submissions: 2,
        pending_contribution_submissions: 1,
        recent_engagement_requests_7d: 7,
      }),
    })
  );
  // Also intercept admin records list (used by RecordsListPage)
  await page.route('/api/v1/admin/records*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0 },
      }),
    })
  );
}

// ── Auth gate tests ────────────────────────────────────────────────────────

test('unauthenticated /admin redirects to /admin/login', async ({ page }) => {
  // Do NOT mock auth — useAdminAuth will fail and redirect
  await page.route('/api/v1/admin/dashboard-summary', route =>
    route.fulfill({ status: 401, body: '{"error":{"code":"UNAUTHORIZED"}}' })
  );
  await page.goto('/admin');
  // Should end up at /admin/login (via client-side redirect from useAdminAuth)
  await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
});

// ── Login page tests ───────────────────────────────────────────────────────

test('/admin/login shows sign-in button', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
  // Page title
  await expect(page).toHaveTitle(/Administration.*TSIO Innovation Hub/i);
});

test('/admin/login with error=access_denied shows access denied message', async ({ page }) => {
  await page.goto('/admin/login?error=access_denied');
  await expect(page.getByText('You do not have permission')).toBeVisible();
});

// ── Dashboard tests ────────────────────────────────────────────────────────

test('Admin Dashboard renders 5 summary tiles', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin');
  // Wait for dashboard tiles to render
  await expect(page.getByText('Published Records')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Draft / In Review')).toBeVisible();
  await expect(page.getByText('Opportunity Submissions')).toBeVisible();
  await expect(page.getByText('Contribution Submissions')).toBeVisible();
  await expect(page.getByText(/Recent Engagements/i)).toBeVisible();
});

// ── AdminSidebar navigation tests ─────────────────────────────────────────

test('AdminSidebar contains all navigation links', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin');

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('link', { name: 'All Records' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Opportunities/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contributions/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Activity Log/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Content Model/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Hub Settings/i })).toBeVisible();
});

// ── RecordsListPage tests ─────────────────────────────────────────────────

test('RecordsListPage renders table with column headers', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records');

  // Table headers per UX-Mockup Screen 08
  await expect(page.getByRole('columnheader', { name: /Title/i })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('columnheader', { name: /Maturity/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /State/i })).toBeVisible();
});

test('RecordsListPage has filter controls and + New Record button', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records');

  await expect(page.getByPlaceholder(/Search titles/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('link', { name: '+ New Record' })).toBeVisible();
});

// ── RecordEditPage tests ───────────────────────────────────────────────────

test('/admin/records/new renders all form sections', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  // Section headings per UX-Mockup Screen 07
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/GOVERNANCE.*CLASSIFICATION/i)).toBeVisible();
  await expect(page.getByText(/PERSPECTIVES/i)).toBeVisible();
  await expect(page.getByText(/ARTIFACT LINKS/i)).toBeVisible();
  await expect(page.getByText(/ENGAGEMENT OPTIONS/i)).toBeVisible();

  // Publication Readiness Checklist
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();
});

test('maturity level dropdown shows inline definition', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  // Wait for form to load
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });

  // Select EXPERIMENT_POC
  await page.selectOption('[name="maturity_level"]', 'EXPERIMENT_POC');
  await expect(page.getByText('targeted exploration was conducted to test feasibility')).toBeVisible({ timeout: 5000 });
});

test('review_status dropdown shows inline definition', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });

  // Select CURATED
  await page.selectOption('[name="review_status"]', 'CURATED');
  await expect(page.getByText(/I&R curator has structured/i)).toBeVisible({ timeout: 5000 });
});

test('GovernanceGate shows missing fields on Submit for Review', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });

  // Click Submit for Review without filling fields
  const submitBtn = page.getByRole('button', { name: /Submit for Review/i });
  // Button should be disabled when no fields filled
  await expect(submitBtn).toBeDisabled({ timeout: 5000 });

  // Fill title only to make it partially complete, then verify checklist still shows missing items
  await page.fill('[name="title"]', 'Test Record Title 123');

  // Still disabled — many required fields missing
  await expect(submitBtn).toBeDisabled();

  // Readiness checklist should show red items
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();

  // At least one checklist item should show ❌ or "REQUIRED"
  const requiredMark = page.getByText(/REQUIRED|❌/i).first();
  await expect(requiredMark).toBeVisible();
});

test('RecordEditPage renders all pub-required fields', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });

  // Check for pub-required field labels
  await expect(page.getByText(/Problem Statement/i).first()).toBeVisible();
  await expect(page.getByText(/What Was Explored/i).first()).toBeVisible();
  await expect(page.getByText(/Outcome Summary/i).first()).toBeVisible();
  await expect(page.getByText(/Executive Perspective Text/i).first()).toBeVisible();
  await expect(page.getByText(/Executive Recommendation/i).first()).toBeVisible();
  await expect(page.getByText(/Last Reviewed Date/i).first()).toBeVisible();
  await expect(page.getByText(/Mission Area Tags/i).first()).toBeVisible();
});

test('RecordEditPage has Save Draft button always visible', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/admin/records/new');

  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
});

test('RecordEditPage ARCHIVED maturity advisory shown for published records', async ({ page }) => {
  await mockAuth(page);

  // Mock a record in PUBLISHED state
  await page.route('/api/v1/admin/records/test-pub-id', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        record_id: 'test-pub-id',
        title: 'Published Test Record',
        publication_state: 'PUBLISHED',
        maturity_level: '',
        review_status: '',
        // ... other fields
      }),
    })
  );

  await page.goto('/admin/records/test-pub-id/edit');
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible({ timeout: 8000 });

  // Select ARCHIVED maturity — advisory should appear
  await page.selectOption('[name="maturity_level"]', 'ARCHIVED');

  await expect(page.getByText(/currently published.*Setting maturity to Archived/i)).toBeVisible({ timeout: 5000 });
});
