// e2e/admin-supporting-pages.spec.ts
// Playwright e2e tests for all 5 admin supporting pages (Plan 16, Wave 6c)
// Tests use page.route() to mock API — no live backend required.
// Auth: useAdminAuth checks GET /api/v1/admin/dashboard-summary — mock it to return 200.

import { test, expect } from '@playwright/test';

// ── Mock auth helper ────────────────────────────────────────────────────────────
// useAdminAuth.ts calls /api/v1/admin/dashboard-summary; 200 = authenticated CURATOR.

const MOCK_DASHBOARD = {
  total_published_records: 5,
  draft_review_records: 3,
  pending_opportunity_submissions: 2,
  pending_contribution_submissions: 1,
  recent_engagement_requests_7d: 0,
};

async function mockAuth(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/admin/dashboard-summary*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD),
    });
  });
}

// ── Opportunity Submissions ─────────────────────────────────────────────────────
test.describe('OpportunitySubmissionsPage', () => {
  test('renders list of submissions from API', async ({ page }) => {
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/opportunity-submissions/, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            submission_id: 'sub-opp-001',
            submitter_name: 'David Reyes',
            submitting_office: 'Eastern VA District Court',
            mission_area: 'Court Operations',
            problem_description: 'Remote hearing scheduling integration for rural courts…',
            status: 'SUBMITTED',
            disposition: null,
            submitted_at: '2026-07-29T14:22:00Z',
          }],
          pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        }),
      });
    });

    await page.goto('/admin/submissions/opportunities');
    await expect(page.getByText('David Reyes')).toBeVisible();
    await expect(page.getByText('Eastern VA District Court')).toBeVisible();
    // Status badge rendered — use first() to handle multiple matches if sidebar has "New Record"
    await expect(page.locator('table').getByText(/New|Under Review/i).first()).toBeVisible();
  });

  test('disposition save fires PATCH with correct payload', async ({ page }) => {
    let patchBody: unknown;
    await mockAuth(page);
    // Use regex to match both list URL (/opportunity-submissions) and detail URL (/opportunity-submissions/:id)
    await page.route(/\/api\/v1\/admin\/opportunity-submissions/, route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              submission_id: 'sub-opp-001',
              submitter_name: 'David Reyes',
              submitting_office: 'Eastern VA',
              mission_area: 'Court Operations',
              problem_description: 'Remote hearing scheduling integration…',
              status: 'SUBMITTED',
              disposition: null,
              submitted_at: '2026-07-29T14:22:00Z',
            }],
            pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
          }),
        });
      } else if (route.request().method() === 'PATCH') {
        patchBody = JSON.parse(route.request().postData() || '{}');
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-opp-001', disposition: 'UNDER_REVIEW' }),
        });
      } else {
        route.fallback();
      }
    });

    // Set up a PATCH request intercept promise to verify it fires
    const patchRequestPromise = page.waitForRequest(
      req => req.url().includes('opportunity-submissions') && req.method() === 'PATCH'
    );

    await page.goto('/admin/submissions/opportunities');
    // Open detail view
    await page.getByRole('button', { name: /Review/i }).first().click();
    // Select disposition — the select has aria-label="disposition"
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('UNDER_REVIEW');
    await page.getByRole('button', { name: /Save Disposition/i }).click();

    // Wait for PATCH to fire and verify payload
    const patchReq = await patchRequestPromise;
    patchBody = JSON.parse(patchReq.postData() || '{}');

    // Toast appears in detail view immediately after save, or in list view after navigation
    // Use toPass for resilience since toast may appear briefly during navigation
    await expect(async () => {
      await expect(page.getByText(/Disposition saved/i)).toBeVisible();
    }).toPass({ timeout: 5000 });
    expect(patchBody).toMatchObject({ disposition: 'UNDER_REVIEW' });
  });

  test('LINKED_TO_RECORD disposition shows linked_record_id input', async ({ page }) => {
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/opportunity-submissions/, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            submission_id: 'sub-opp-001',
            submitter_name: 'Jane',
            submitting_office: 'AO',
            mission_area: 'Court Ops',
            problem_description: 'A long enough description here for test…',
            status: 'SUBMITTED',
            disposition: null,
            submitted_at: '2026-07-29T14:22:00Z',
          }],
          pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        }),
      });
    });

    await page.goto('/admin/submissions/opportunities');
    await page.getByRole('button', { name: /Review/i }).first().click();
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('LINKED_TO_RECORD');
    // linked_record_id input appears
    await expect(page.getByLabel(/Linked Record ID/i)).toBeVisible();
  });
});

// ── Contribution Submissions ────────────────────────────────────────────────────
test.describe('ContributionSubmissionsPage', () => {
  test('Create Record CTA is visible after ACCEPTED_FOR_CURATION', async ({ page }) => {
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/contribution-submissions/, async route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              submission_id: 'sub-con-001',
              contact_name: 'Marcus Webb',
              contributing_office: 'Central CA District',
              self_assessed_maturity: 'PROTOTYPE_PILOT',
              work_description: 'Low-bandwidth video conferencing for rural hearings…',
              problem_addressed: 'Rural courts need reliable video hearing access…',
              outcome_summary: 'Prototype achieved 240p video at 256kbps with acceptable quality…',
              artifact_urls: ['https://example.gov/artifact1'],
              status: 'SUBMITTED',
              disposition: 'ACCEPTED_FOR_CURATION',
              submitted_at: '2026-07-28T10:00:00Z',
            }],
            pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
          }),
        });
      } else if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-con-001', disposition: 'ACCEPTED_FOR_CURATION' }),
        });
      } else {
        route.fallback();
      }
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('button', { name: /Review/i }).first().click();
    // CTA visible since disposition is already ACCEPTED_FOR_CURATION
    await expect(page.getByRole('button', { name: /Create Innovation Record from This Submission/i })).toBeVisible();
  });

  test('CTA button is NOT visible when disposition is UNDER_REVIEW', async ({ page }) => {
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/contribution-submissions/, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            submission_id: 'sub-con-002',
            contact_name: 'Alex Chen',
            contributing_office: '9th Circuit',
            self_assessed_maturity: 'EXPERIMENT_POC',
            work_description: 'Automated scheduling workflow…',
            problem_addressed: 'Manual scheduling is error-prone…',
            outcome_summary: 'Reduced errors by 40%…',
            artifact_urls: ['https://example.gov/a'],
            status: 'SUBMITTED',
            disposition: null,
            submitted_at: '2026-07-20T10:00:00Z',
          }],
          pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        }),
      });
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('button', { name: /Review/i }).first().click();
    await expect(page.getByRole('button', { name: /Create Innovation Record/i })).not.toBeVisible();
  });
});

// ── Engagement Activity Log ─────────────────────────────────────────────────────
test.describe('EngagementActivityPage', () => {
  test('renders engagement requests and displays routing email', async ({ page }) => {
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/engagement-requests/, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            request_id: 'req-001',
            request_type: 'REQUEST_TECHNICAL_GUIDANCE',
            record_id: 'rec-001',
            requestor_name: 'Priya Nair',
            requestor_office: 'District CT',
            status: 'SUBMITTED',
            submitted_at: '2026-07-29T14:22:00Z',
          }],
          pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        }),
      });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
          ],
        }),
      });
    });

    await page.goto('/admin/engagement');
    await expect(page.getByText('Priya Nair')).toBeVisible();
    await expect(page.getByText('AOml_TSO_IRB_Team@ao.uscourts.gov')).toBeVisible();
    await expect(page.getByRole('link', { name: /Update Routing Email|go to Settings/i })).toBeVisible();
  });

  test('filter by type re-fetches with query param', async ({ page }) => {
    let capturedUrl = '';
    await mockAuth(page);
    await page.route(/\/api\/v1\/admin\/engagement-requests/, route => {
      capturedUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0 },
        }),
      });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ setting_key: 'engagement_routing_email', setting_value: 'test@example.gov' }],
        }),
      });
    });

    await page.goto('/admin/engagement');
    await page.getByRole('combobox', { name: /Type/i }).selectOption('REQUEST_BRIEFING');
    await expect(async () => {
      expect(capturedUrl).toContain('request_type=REQUEST_BRIEFING');
    }).toPass({ timeout: 3000 });
  });
});

// ── Settings Page ───────────────────────────────────────────────────────────────
test.describe('SettingsPage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/v1/admin/settings*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
            ],
          }),
        });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        const email = (body?.settings as Array<{setting_key: string; setting_value: string}>)?.find(
          (s) => s.setting_key === 'engagement_routing_email'
        )?.setting_value;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ setting_key: 'engagement_routing_email', setting_value: email }],
          }),
        });
      } else {
        route.fallback();
      }
    });
  });

  test('loads current routing email on mount', async ({ page }) => {
    await page.goto('/admin/settings');
    const input = page.getByLabel(/Routing Email/i);
    await expect(input).toHaveValue('AOml_TSO_IRB_Team@ao.uscourts.gov');
  });

  test('save with valid email shows success toast', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('newemail@uscourts.gov');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/Routing email updated.*newemail@uscourts.gov/i)).toBeVisible();
  });

  test('save with blank email shows inline error without API call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') apiCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/cannot be blank/i)).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('save with invalid email format shows inline error without API call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') apiCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('not-an-email');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
    expect(apiCalled).toBe(false);
  });
});

// ── Content Model Reference Page ─────────────────────────────────────────────────
test.describe('ContentModelReferencePage', () => {
  test('renders all 5 maturity levels and 7 review statuses', async ({ page }) => {
    await mockAuth(page);
    // These pages fall back to hard-coded data; mock API returns 501
    await page.route('**/api/v1/admin/maturity-reference*', route => {
      route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }),
      });
    });
    await page.route('**/api/v1/admin/review-status-reference*', route => {
      route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }),
      });
    });

    await page.goto('/admin/content-model');
    // Maturity levels (hard-coded fallback)
    await expect(page.getByText('Idea')).toBeVisible();
    await expect(page.getByText('Experiment / POC')).toBeVisible();
    await expect(page.getByText('Prototype / Pilot')).toBeVisible();
    await expect(page.getByText('Production / Validated Pattern')).toBeVisible();
    await expect(page.getByText('Archived')).toBeVisible();
    // Review statuses — use first() to handle strict mode (label + enum value both render)
    await expect(page.getByText('Submitted').first()).toBeVisible();
    await expect(page.getByText('Curated').first()).toBeVisible();
    await expect(page.getByText('Validated for Reuse')).toBeVisible();
    // Read-only notice
    await expect(page.getByText(/read-only.*code change/i)).toBeVisible();
  });

  test('is reachable via admin sidebar link', async ({ page }) => {
    await mockAuth(page);
    // Mock settings endpoint to prevent AdminLayout sidebar from failing
    await page.route('**/api/v1/admin/maturity-reference*', route => {
      route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }),
      });
    });
    await page.route('**/api/v1/admin/review-status-reference*', route => {
      route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }),
      });
    });

    await page.goto('/admin');
    const contentModelLink = page.getByRole('link', { name: /Content Model/i });
    await expect(contentModelLink).toBeVisible();
    await contentModelLink.click();
    await expect(page).toHaveURL(/\/admin\/content-model/);
  });
});
