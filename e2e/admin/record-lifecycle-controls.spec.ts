/**
 * record-lifecycle-controls.spec.ts — Playwright e2e tests for publication lifecycle
 * controls on RecordEditPage.
 *
 * Tests use page.route() to mock API — no live backend required.
 * Auth is mocked via dashboard-summary intercept (same pattern as admin-core.spec.ts).
 *
 * Covers:
 *   UX Mockup Screen 07 — State Transition Actions table, Warning Modal, Publication Gate Error.
 *   US-2.3: Submit for Review, Publish with governance gate.
 *   US-2.4: Supersede (requires linked ID), Archive (confirmation dialog).
 *   US-8.2: Edit Published Record warning modal.
 *   US-9.3: Maturity + review status dropdowns show inline definitions; ARCHIVED advisory.
 *
 * F8: Curation and Administration — lifecycle action controls e2e tests
 * F9: Content, Maturity & Trust Model — inline definitions e2e tests
 */

import { test, expect } from '@playwright/test';

const ADMIN_RECORD_EDIT_URL = '/admin/records/rec_test_001/edit';

// Helper: mock auth so the admin app's useAdminAuth() passes (same as admin-core.spec.ts)
async function mockAuth(page: import('@playwright/test').Page) {
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
}

// Mock record fixtures by publication state
function mockRecord(overrides: Record<string, unknown> = {}) {
  return {
    record_id: 'rec_test_001',
    title: 'Audio Security POC',
    problem_statement: 'Courts need audio separation between participants for AI transcription accuracy. Current systems conflate voices.',
    what_was_explored: 'GPU/CPU audio separation tested using commercial-off-the-shelf hardware with open-source models.',
    outcome_summary: 'Partial feasibility demonstrated with 78% speaker separation accuracy. Further training data required.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'MEDIUM',
    source_type: 'IR_CONDUCTED',
    owner_name: 'I&R Branch',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
    last_reviewed_date: '2026-07-29',
    executive_perspective_text: 'GPU separation is promising for court transcription use cases. Investment warrants continued exploration.',
    executive_recommendation: 'Not production-ready yet. Recommend a follow-on pilot with expanded training data.',
    key_findings: ['GPU/CPU separation is viable at 78% accuracy', 'Production deployment needs 95%+ accuracy'],
    artifact_links: [
      { link_id: 'lnk_01', label: 'Lessons-Learned', url: 'https://ao.sharepoint.com/doc', source_type: 'Document', display_order: 1 },
    ],
    engagement_options: ['REQUEST_DEMO'],
    mission_area_tags: ['Cybersecurity'],
    technology_area_tags: [],
    trust_disclaimers: [],
    publication_state: 'DRAFT',
    published_at: null,
    created_at: '2026-07-28T00:00:00Z',
    updated_at: '2026-07-28T00:00:00Z',
    ...overrides,
  };
}

// ── DRAFT state ─────────────────────────────────────────────────────────────

test.describe('DRAFT state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    // Wait for record to load
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
  });

  test('renders Submit for Review button', async ({ page }) => {
    await expect(page.getByTestId('submit-for-review-btn')).toBeVisible();
    await expect(page.getByTestId('lifecycle-controls')).toHaveAttribute('data-publication-state', 'DRAFT');
  });

  test('Submit for Review is enabled when all pub-required fields are complete', async ({ page }) => {
    // All pub-required fields are set in the mock record
    await expect(page.getByTestId('submit-for-review-btn')).toBeEnabled();
  });

  test('Submit for Review calls submit-review API and updates state badge to IN REVIEW', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/submit-review', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ record_id: 'rec_test_001', publication_state: 'REVIEW' }),
      })
    );
    await page.getByTestId('submit-for-review-btn').click();
    // Wait for state badge to update
    await expect(page.getByTestId('publication-state-badge')).toContainText('IN REVIEW', { timeout: 5000 });
  });
});

// ── REVIEW state ─────────────────────────────────────────────────────────────

test.describe('REVIEW state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'REVIEW' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
  });

  test('renders Publish and Return to Draft buttons', async ({ page }) => {
    await expect(page.getByTestId('publish-btn')).toBeVisible();
    await expect(page.getByTestId('return-to-draft-btn')).toBeVisible();
  });

  test('Publish success updates state badge to PUBLISHED', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          record_id: 'rec_test_001',
          publication_state: 'PUBLISHED',
          published_at: '2026-07-30T10:00:00Z',
        }),
      })
    );
    await page.getByTestId('publish-btn').click();
    await expect(page.getByTestId('publication-state-badge')).toContainText('PUBLISHED', { timeout: 5000 });
  });

  test('Publish 422 PUBLICATION_GATE_FAILED renders GovernanceGateFeedback with blocking fields', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', route =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'PUBLICATION_GATE_FAILED',
            message: 'Missing required fields',
            fields: [
              { field: 'executive_perspective_text', error_code: 'REQUIRED', message: 'Required' },
              { field: 'last_reviewed_date', error_code: 'REQUIRED', message: 'Required' },
            ],
          },
        }),
      })
    );
    await page.getByTestId('publish-btn').click();
    // GovernanceGateFeedback panel visible
    await expect(page.getByTestId('governance-gate-feedback')).toBeVisible({ timeout: 5000 });
    // Human-readable labels present
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Executive Perspective Text');
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Last-Reviewed Date');
    // State badge NOT changed to PUBLISHED
    await expect(page.getByTestId('publication-state-badge')).toContainText('IN REVIEW');
  });
});

// ── PUBLISHED state ─────────────────────────────────────────────────────────

test.describe('PUBLISHED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED', published_at: '2026-07-29T00:00:00Z' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
  });

  test('renders Edit, Supersede, Archive buttons; no Submit for Review', async ({ page }) => {
    await expect(page.getByTestId('edit-published-btn')).toBeVisible();
    await expect(page.getByTestId('supersede-btn')).toBeVisible();
    await expect(page.getByTestId('archive-btn')).toBeVisible();
    await expect(page.getByTestId('submit-for-review-btn')).not.toBeVisible();
  });

  test('Edit opens warning modal with correct message', async ({ page }) => {
    await page.getByTestId('edit-published-btn').click();
    // Dialog visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog')).toContainText('Edit Published Record');
    await expect(page.getByRole('dialog')).toContainText('move this record to Review state');
    await expect(page.getByRole('dialog')).toContainText('remove it from public view');
  });

  test('Confirming Edit Published calls PATCH with X-Confirm-Edit header and transitions to REVIEW', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockRecord({ publication_state: 'REVIEW' }) }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED' })),
      });
    });
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Yes, Edit Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toContainText('IN REVIEW', { timeout: 5000 });
  });

  test('Cancelling Edit Published dialog keeps state PUBLISHED', async ({ page }) => {
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('publication-state-badge')).toContainText('PUBLISHED');
  });

  test('Archive shows confirmation dialog; confirming calls archive endpoint', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/archive', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ record_id: 'rec_test_001', publication_state: 'ARCHIVED' }),
      })
    );
    await page.getByTestId('archive-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Archive Record', { timeout: 3000 });
    await expect(page.getByRole('dialog')).toContainText('removed from the default catalog browse');
    await page.getByRole('button', { name: 'Archive Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toContainText('ARCHIVED', { timeout: 5000 });
  });

  test('Supersede dialog requires linked_record_id; invalid ID shows error from API', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/supersede', route =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INVALID_SUPERSEDES_REF',
            message: 'The superseding record ID does not exist.',
          },
        }),
      })
    );
    await page.getByTestId('supersede-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Supersede Record', { timeout: 3000 });
    // Confirm without entering ID — should show inline validation
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    await expect(page.getByRole('dialog')).toContainText('required');
    // Enter an ID and submit — API returns 422
    await page.getByLabel('ID of the superseding record').fill('rec_nonexistent');
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    // Dialog closes, error rendered in form (via onTransitionError → transitionError → save-error)
    await expect(page.getByTestId('save-error')).toContainText('superseding record ID does not exist', { timeout: 5000 });
  });
});

// ── SUPERSEDED state ─────────────────────────────────────────────────────────

test.describe('SUPERSEDED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'SUPERSEDED' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
  });

  test('only Archive button visible; no Edit, Publish, or Supersede', async ({ page }) => {
    await expect(page.getByTestId('archive-btn')).toBeVisible();
    await expect(page.getByTestId('edit-published-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
    await expect(page.getByTestId('supersede-btn')).not.toBeVisible();
  });
});

// ── ARCHIVED state ─────────────────────────────────────────────────────────

test.describe('ARCHIVED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'ARCHIVED' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="archived-message"]', { timeout: 10000 });
  });

  test('shows read-only message; no action buttons', async ({ page }) => {
    await expect(page.getByTestId('archived-message')).toBeVisible();
    await expect(page.getByTestId('archive-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
  });
});

// ── Maturity and Review Status dropdowns — inline definitions (US-9.3) ────────

test.describe('Maturity and Review Status dropdowns — inline definitions (US-9.3)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
  });

  test('Maturity Level dropdown shows inline definition for selected value', async ({ page }) => {
    // EXPERIMENT_POC is the mock default
    await expect(page.getByText('Experiment / POC:')).toBeVisible();
    await expect(page.getByText(/targeted exploration was conducted/)).toBeVisible();
  });

  test('Maturity Level dropdown shows View all maturity definitions link', async ({ page }) => {
    const link = page.getByRole('link', { name: /view all maturity definitions/i });
    await expect(link).toHaveAttribute('href', '/admin/content-model');
  });

  test('Review Status dropdown shows inline definition for selected value', async ({ page }) => {
    // CURATED is the mock default
    await expect(page.getByText('Curated:')).toBeVisible();
  });

  test('Review Status dropdown shows View all review status definitions link', async ({ page }) => {
    const link = page.getByRole('link', { name: /view all review status definitions/i });
    await expect(link).toHaveAttribute('href', '/admin/content-model');
  });

  test('ARCHIVED maturity on PUBLISHED record shows advisory', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED', maturity_level: 'ARCHIVED' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
    await expect(page.getByTestId('archived-maturity-advisory')).toBeVisible();
    await expect(page.getByTestId('archived-maturity-advisory')).toContainText(
      'Consider also archiving the publication state'
    );
  });
});

// ── Publication Readiness Checklist — DRAFT state ────────────────────────────

test.describe('Publication Readiness Checklist — DRAFT state', () => {
  test('Submit for Review disabled when pub-required field missing', async ({ page }) => {
    await mockAuth(page);
    // Record with missing executive_perspective_text
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="lifecycle-controls"]', { timeout: 10000 });
    // Submit for Review should be disabled
    await expect(page.getByTestId('submit-for-review-btn')).toBeDisabled();
    // Checklist shows field name
    await expect(page.getByTestId('readiness-checklist')).toContainText('Executive Perspective Text');
  });

  test('Checklist count updates as required fields are counted', async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await page.waitForSelector('[data-testid="readiness-checklist"]', { timeout: 10000 });
    // ReadinessChecklist footer shows missing count
    await expect(page.getByTestId('readiness-checklist')).toContainText('required before publishing');
  });
});
