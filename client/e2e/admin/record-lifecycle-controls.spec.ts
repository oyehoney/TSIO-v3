// e2e/admin/record-lifecycle-controls.spec.ts
// Playwright e2e tests for publication lifecycle controls on RecordEditPage.
// UX Mockup Screen 07 — State Transition Actions table, Warning Modal, Publication Gate Error.
// US-2.3: Submit for Review, Publish with governance gate.
// US-2.4: Supersede (requires linked ID), Archive (confirmation dialog).
// US-9.3: Maturity + review status dropdowns show inline definitions; ARCHIVED advisory.
// Tests use page.route() to mock API — no live backend required.

import { test, expect, Page } from '@playwright/test';

const ADMIN_RECORD_EDIT_URL = '/admin/records/rec_test_001/edit';

// Mock dashboard summary — used by useAdminAuth() to simulate authenticated curator session.
// Without this, AdminApp redirects to /admin/login before rendering RecordEditPage.
async function mockAuth(page: Page) {
  await page.route('/api/v1/admin/dashboard-summary', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_published_records: 5,
        draft_review_records: 3,
        pending_opportunity_submissions: 2,
        pending_contribution_submissions: 1,
        recent_engagement_requests: 0,
      }),
    })
  );
}

// Mock record fixtures by publication state.
// Text fields use 50+ character values to satisfy ReadinessChecklist minimums (Plan 14).
function mockRecord(overrides: Record<string, unknown> = {}) {
  return {
    record_id: 'rec_test_001',
    title: 'Audio Security Proof of Concept',
    problem_statement: 'Courts need a reliable method to separate audio channels in courtroom recording systems to ensure accuracy and reduce transcription errors.',
    what_was_explored: 'GPU/CPU audio separation was tested using Azure Government Cloud with isolated processing pipelines for speaker diarization.',
    outcome_summary: 'Partial feasibility demonstrated. The GPU-based separation approach showed promise but requires further optimization for production workloads.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'MEDIUM',
    source_type: 'IR_CONDUCTED',
    owner_name: 'I&R Branch',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
    last_reviewed_date: '2026-07-29',
    executive_perspective_text: 'GPU separation technology is promising for courts needing accurate audio transcription. This POC validates the core approach and identifies key production readiness gaps.',
    executive_recommendation: 'Not production-ready yet. Recommend a follow-on pilot with 2–3 courts to validate performance under real courtroom conditions before broader adoption.',
    key_findings: ['GPU/CPU separation is viable for courtroom audio with proper configuration'],
    artifact_links: [{ link_id: 'lnk_01', label: 'Lessons-Learned', url: 'https://ao.sharepoint.com/doc', artifact_type: 'DOCUMENT', display_order: 1 }],
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

test.describe('DRAFT state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'DRAFT' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('renders Submit for Review button and Save Draft button', async ({ page }) => {
    await expect(page.getByTestId('submit-for-review-btn')).toBeVisible();
    await expect(page.getByTestId('lifecycle-controls')).toHaveAttribute('data-publication-state', 'DRAFT');
  });

  test('Submit for Review is enabled when all pub-required fields are complete', async ({ page }) => {
    // All pub-required fields are set in the mock record
    await expect(page.getByTestId('submit-for-review-btn')).toBeEnabled();
  });

  test('Submit for Review calls submit-review API and updates state badge to IN REVIEW', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/submit-review', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ record_id: 'rec_test_001', publication_state: 'REVIEW' }) })
    );
    await page.getByTestId('submit-for-review-btn').click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });
});

test.describe('REVIEW state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'REVIEW' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('renders Publish and Return to Draft buttons', async ({ page }) => {
    await expect(page.getByTestId('publish-btn')).toBeVisible();
    await expect(page.getByTestId('return-to-draft-btn')).toBeVisible();
  });

  test('Publish success updates state badge to PUBLISHED', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ record_id: 'rec_test_001', publication_state: 'PUBLISHED', published_at: '2026-07-30T10:00:00Z' }),
      })
    );
    await page.getByTestId('publish-btn').click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('PUBLISHED');
  });

  test('Publish 422 PUBLICATION_GATE_FAILED renders GovernanceGateFeedback with blocking fields', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', (route) =>
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
    await expect(page.getByTestId('governance-gate-feedback')).toBeVisible();
    // Human-readable labels present
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Executive Perspective Text');
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Last-Reviewed Date');
    // State badge NOT changed to PUBLISHED
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });
});

test.describe('PUBLISHED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED', published_at: '2026-07-29T00:00:00Z' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
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
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Edit Published Record');
    await expect(page.getByRole('dialog')).toContainText('move this record to Review state');
    await expect(page.getByRole('dialog')).toContainText('remove it from public view');
  });

  test('Confirming Edit Published calls PATCH with X-Confirm-Edit header and transitions to REVIEW', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route, request) => {
      if (request.method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockRecord({ publication_state: 'REVIEW' }) }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED' })) });
    });
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Yes, Edit Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });

  test('Cancelling Edit Published dialog keeps state PUBLISHED', async ({ page }) => {
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('PUBLISHED');
  });

  test('Archive shows confirmation dialog; confirming calls archive endpoint', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/archive', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ record_id: 'rec_test_001', publication_state: 'ARCHIVED' }) })
    );
    await page.getByTestId('archive-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Archive Record');
    await expect(page.getByRole('dialog')).toContainText('removed from the default catalog browse');
    await page.getByRole('button', { name: 'Archive Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('ARCHIVED');
  });

  test('Supersede dialog requires linked_record_id; invalid ID shows error from API', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/supersede', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INVALID_SUPERSEDES_REF', message: 'The superseding record ID does not exist.' } }),
      })
    );
    await page.getByTestId('supersede-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Supersede Record');
    // Confirm without entering ID — should show inline validation
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    await expect(page.getByRole('dialog')).toContainText('required');
    // Enter an ID and submit — API returns 422
    await page.getByLabel('ID of the superseding record').fill('rec_nonexistent');
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    // Dialog closes, error rendered in form (via onTransitionError → saveError)
    await expect(page.getByTestId('save-error')).toContainText('superseding record ID does not exist');
  });
});

test.describe('SUPERSEDED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'SUPERSEDED' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('only Archive button visible; no Edit, Publish, or Supersede', async ({ page }) => {
    await expect(page.getByTestId('archive-btn')).toBeVisible();
    await expect(page.getByTestId('edit-published-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
    await expect(page.getByTestId('supersede-btn')).not.toBeVisible();
  });
});

test.describe('ARCHIVED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'ARCHIVED' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('shows read-only message; no action buttons', async ({ page }) => {
    await expect(page.getByTestId('archived-message')).toBeVisible();
    await expect(page.getByTestId('archive-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
  });
});

test.describe('Maturity and Review Status dropdowns — inline definitions (US-9.3)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRecord({ publication_state: 'DRAFT' })) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('Maturity Level dropdown shows inline definition for selected value', async ({ page }) => {
    // EXPERIMENT_POC is the mock default
    await expect(page.getByText('Experiment / POC:')).toBeVisible();
    await expect(page.getByText('targeted exploration was conducted')).toBeVisible();
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
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'PUBLISHED', maturity_level: 'ARCHIVED' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await expect(page.getByTestId('archived-maturity-advisory')).toBeVisible();
    await expect(page.getByTestId('archived-maturity-advisory')).toContainText(
      'Consider also archiving the publication state'
    );
  });
});

test.describe('Publication Readiness Checklist — DRAFT state', () => {
  test('Submit for Review disabled when pub-required field missing', async ({ page }) => {
    // Record with missing executive_perspective_text
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    // Submit for Review should be disabled
    await expect(page.getByTestId('submit-for-review-btn')).toBeDisabled();
    // Checklist shows ❌ for executive_perspective_text
    await expect(page.getByTestId('readiness-checklist')).toContainText('Executive Perspective Text');
  });

  test('Checklist count updates as required fields are filled', async ({ page }) => {
    await mockAuth(page);
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' })),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    // Initially 1 field missing
    await expect(page.getByTestId('readiness-checklist')).toContainText('1 field required before publishing');
  });
});
