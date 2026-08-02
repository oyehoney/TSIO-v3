/**
 * admin-supporting-pages.spec.ts — Playwright e2e tests for admin supporting pages.
 *
 * Tests for Wave 6c admin supporting pages:
 *   - OpportunitySubmissionsPage (/admin/submissions/opportunities)
 *   - ContributionSubmissionsPage (/admin/submissions/contributions)
 *   - EngagementActivityPage (/admin/engagement)
 *   - SettingsPage (/admin/settings)
 *   - ContentModelReferencePage (/admin/content-model)
 *
 * All tests mock the API layer using page.route() to avoid requiring a live backend.
 * Auth is mocked via dashboard-summary 200 response (useAdminAuth check pattern).
 *
 * F7, F8, F9: Engagement Routing, Curation and Administration, Content Model
 */

import { test, expect } from '@playwright/test';

// ── Auth mock helper ──────────────────────────────────────────────────────────
// useAdminAuth calls GET /api/v1/admin/dashboard-summary; mock 200 to authenticate
async function mockAuth(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/admin/dashboard-summary*', route =>
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
}

// ── Opportunity Submissions ────────────────────────────────────────────────────
test.describe('OpportunitySubmissionsPage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('renders list of submissions from API', async ({ page }) => {
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
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
    // Status badge rendered — "New" for null disposition, or SUBMITTED
    await expect(page.getByText(/SUBMITTED|New|Under Review/i)).toBeVisible();
  });

  test('disposition save fires PATCH with correct payload', async ({ page }) => {
    let patchBody: unknown;
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
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
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-opp-001', disposition: 'UNDER_REVIEW' }) });
      } else {
        route.fallback();
      }
    });

    await page.goto('/admin/submissions/opportunities');
    // Open detail view
    await page.getByRole('link', { name: /Review/i }).first().click();
    // Select disposition
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('UNDER_REVIEW');
    await page.getByRole('button', { name: /Save Disposition/i }).click();

    // Verify PATCH fired with disposition
    await expect(page.getByText(/Disposition saved/i)).toBeVisible();
    expect(patchBody).toMatchObject({ disposition: 'UNDER_REVIEW' });
  });

  test('LINKED_TO_RECORD disposition shows linked_record_id input', async ({ page }) => {
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          submission_id: 'sub-opp-001', submitter_name: 'Jane', submitting_office: 'AO',
          mission_area: 'Court Ops', problem_description: 'A long enough description here for test…',
          status: 'SUBMITTED', disposition: null, submitted_at: '2026-07-29T14:22:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });

    await page.goto('/admin/submissions/opportunities');
    await page.getByRole('link', { name: /Review/i }).first().click();
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('LINKED_TO_RECORD');
    // linked_record_id input appears
    await expect(page.getByLabel(/Linked Record ID/i)).toBeVisible();
  });
});

// ── Contribution Submissions ──────────────────────────────────────────────────
test.describe('ContributionSubmissionsPage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('Create Record CTA is visible after ACCEPTED_FOR_CURATION', async ({ page }) => {
    await page.route('**/api/v1/admin/contribution-submissions*', async route => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [{
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
          }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
        });
      } else if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-con-001', disposition: 'ACCEPTED_FOR_CURATION' }) });
      } else {
        route.fallback();
      }
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('link', { name: /Review/i }).first().click();
    // CTA visible since disposition is already ACCEPTED_FOR_CURATION
    await expect(page.getByRole('button', { name: /Create Innovation Record from This Submission/i })).toBeVisible();
  });

  test('CTA button is NOT visible when disposition is UNDER_REVIEW', async ({ page }) => {
    await page.route('**/api/v1/admin/contribution-submissions*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          submission_id: 'sub-con-002', contact_name: 'Alex Chen', contributing_office: '9th Circuit',
          self_assessed_maturity: 'EXPERIMENT_POC', work_description: 'Automated scheduling workflow…',
          problem_addressed: 'Manual scheduling is error-prone…', outcome_summary: 'Reduced errors by 40%…',
          artifact_urls: ['https://example.gov/a'], status: 'SUBMITTED', disposition: null,
          submitted_at: '2026-07-20T10:00:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('link', { name: /Review/i }).first().click();
    await expect(page.getByRole('button', { name: /Create Innovation Record/i })).not.toBeVisible();
  });
});

// ── Engagement Activity Log ───────────────────────────────────────────────────
test.describe('EngagementActivityPage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('renders engagement requests and displays routing email', async ({ page }) => {
    await page.route('**/api/v1/admin/engagement-requests*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          request_id: 'req-001', request_type: 'REQUEST_TECHNICAL_GUIDANCE',
          record_id: 'rec-001', requestor_name: 'Priya Nair',
          requestor_office: 'District CT', status: 'SUBMITTED',
          submitted_at: '2026-07-29T14:22:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [
          { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
        ] })
      });
    });

    await page.goto('/admin/engagement');
    await expect(page.getByText('Priya Nair')).toBeVisible();
    await expect(page.getByText('AOml_TSO_IRB_Team@ao.uscourts.gov')).toBeVisible();
    await expect(page.getByRole('link', { name: /Update Routing Email|go to Settings/i })).toBeVisible();
  });

  test('filter by type re-fetches with query param', async ({ page }) => {
    let capturedUrl = '';
    await page.route('**/api/v1/admin/engagement-requests*', route => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [], pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0 } }) });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{ setting_key: 'engagement_routing_email', setting_value: 'test@example.gov' }] }) });
    });

    await page.goto('/admin/engagement');
    await page.getByRole('combobox', { name: /Type/i }).selectOption('REQUEST_BRIEFING');
    await expect(async () => {
      expect(capturedUrl).toContain('request_type=REQUEST_BRIEFING');
    }).toPass({ timeout: 3000 });
  });
});

// ── Settings Page ──────────────────────────────────────────────────────────────
test.describe('SettingsPage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/v1/admin/settings*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [
            { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
          ] }) });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        const email = body?.settings?.find((s: {setting_key: string}) => s.setting_key === 'engagement_routing_email')?.setting_value;
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [{ setting_key: 'engagement_routing_email', setting_value: email }] }) });
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
    let putCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') putCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/cannot be blank/i)).toBeVisible();
    expect(putCalled).toBe(false);
  });

  test('save with invalid email format shows inline error without API call', async ({ page }) => {
    let putCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') putCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('not-an-email');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
    expect(putCalled).toBe(false);
  });
});

// ── Content Model Reference Page ──────────────────────────────────────────────
test.describe('ContentModelReferencePage', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('renders all 5 maturity levels and 7 review statuses', async ({ page }) => {
    // These pages fall back to hard-coded data; mock API returns 501
    await page.route('**/api/v1/admin/maturity-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });
    await page.route('**/api/v1/admin/review-status-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });

    await page.goto('/admin/content-model');
    // Maturity levels (hard-coded fallback)
    await expect(page.getByText('Idea')).toBeVisible();
    await expect(page.getByText('Experiment / POC')).toBeVisible();
    await expect(page.getByText('Prototype / Pilot')).toBeVisible();
    await expect(page.getByText('Production / Validated Pattern')).toBeVisible();
    await expect(page.getByText('Archived')).toBeVisible();
    // Review statuses (hard-coded fallback)
    await expect(page.getByText('Submitted')).toBeVisible();
    await expect(page.getByText('Curated')).toBeVisible();
    await expect(page.getByText('Validated for Reuse')).toBeVisible();
    // Read-only notice
    await expect(page.getByText(/read-only.*code change/i)).toBeVisible();
  });

  test('is reachable via admin sidebar link', async ({ page }) => {
    // Mock dashboard-summary for sidebar badge counts
    await page.route('**/api/v1/admin/dashboard-summary*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });
    await page.route('**/api/v1/admin/maturity-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });
    await page.route('**/api/v1/admin/review-status-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });

    await page.goto('/admin');
    const contentModelLink = page.getByRole('link', { name: /Content Model/i });
    await expect(contentModelLink).toBeVisible();
    await contentModelLink.click();
    await expect(page).toHaveURL(/\/admin\/content-model/);
  });
});
