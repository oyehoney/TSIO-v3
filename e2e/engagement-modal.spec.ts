/**
 * engagement-modal.spec.ts — Playwright e2e tests for Engagement Request Modal.
 *
 * Tests cover Screen 03 (Engagement Request Modal) and Flow 03 (Engagement Request Flow)
 * from UX-Mockup-TSIO-Innovation-Hub.md.
 *
 * UserStories: US-7.1, US-7.2
 * Feature: F7 — Engagement Routing
 * Plan: 13-PLAN.md (Wave 5 / W5-b)
 *
 * Strategy:
 * 1. A PUBLISHED innovation record is seeded via POST /api/v1/test-seed/published-record
 *    before tests run (same seed pattern as record-page.spec.ts from Plan 11).
 * 2. POST /api/v1/engagement-requests is intercepted via page.route() for error state tests
 *    so tests are not blocked on a live database or CAPTCHA provider.
 * 3. Tests that exercise the happy path use the dev CAPTCHA bypass button
 *    (rendered by CaptchaWidget when NEXT_PUBLIC_CAPTCHA_SITE_KEY is absent in test env).
 *
 * Test server: playwright.config.ts starts `node src/server.js` with NODE_ENV=test
 * and TEST_MOCK_SEARCH=true. The test-seed API is available under NODE_ENV=test.
 */

import { test, expect } from '@playwright/test';

// ─── Mock success response shape from POST /api/v1/engagement-requests ───────
const MOCK_SUCCESS_RESPONSE = {
  request_id: 'test-request-uuid-001',
  record_id: 'seeded-record-for-modal-tests',
  request_type: 'REQUEST_DEMO',
  requestor_name: 'Margaret Hollis',
  requestor_email: 'margaret@uscourts.gov',
  requestor_office: 'Eastern District of Virginia',
  description_of_interest:
    'We are evaluating this for our court and would like a live demo to see it in action.',
  status: 'SUBMITTED',
  submitted_at: '2026-07-30T14:14:00Z',
};

// ─── Helper: fill the engagement form with valid test data ───────────────────
async function fillEngagementForm(page: import('@playwright/test').Page) {
  await page.fill('#requestorName', 'Margaret Hollis');
  await page.fill('#requestorOffice', 'Eastern District of Virginia');
  await page.fill('#requestorEmail', 'margaret@uscourts.gov');
  await page.fill(
    '#descriptionOfInterest',
    'We are evaluating this for our court and would like a live demo to see it in action.'
  );
}

// ─── Helper: click the dev CAPTCHA bypass if present ────────────────────────
async function bypassCaptcha(page: import('@playwright/test').Page) {
  const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
  if (await bypassBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bypassBtn.click();
  }
}

// ─── Seeded record state ─────────────────────────────────────────────────────
let seededRecordId: string;
let recordPath: string;

test.beforeAll(async ({ request }) => {
  // Seed a PUBLISHED record with all required fields including all 4 engagement options.
  // Uses the same test-seed endpoint as record-page.spec.ts (gated on NODE_ENV !== 'production').
  const seedRes = await request.post('/api/v1/test-seed/published-record', {
    data: {
      title: 'Audio Security Proof of Concept — Modal Test Record',
      problem_statement:
        'Courts need reliable audio separation between participants in sensitive proceedings ' +
        'to prevent accidental recording of attorney-client communications.',
      what_was_explored:
        'Explored GPU/CPU audio separation architecture in Azure Government Cloud ' +
        'using ML-based speaker diarization.',
      outcome_summary:
        'The POC demonstrated partial feasibility. GPU-based separation works in controlled ' +
        'conditions but deployment constraints prevent full production rollout at this time.',
      key_findings: [
        '95% speaker identification accuracy in controlled conditions',
        'Azure Government Cloud network segmentation limits GPU cluster throughput',
        'ML model requires court-specific fine-tuning for accented speech',
      ],
      maturity_level: 'EXPERIMENT_POC',
      owner_name: 'AO I&R Team',
      owner_office: 'AO IT/SISA',
      contributing_office: 'District Court Operations',
      source_type: 'COMMUNITY',
      reuse_potential: 'MEDIUM',
      engagement_options: [
        'REQUEST_DEMO',
        'REQUEST_ADOPTION_DISCUSSION',
        'REQUEST_TECHNICAL_GUIDANCE',
        'REQUEST_BRIEFING',
      ],
    },
  });

  if (!seedRes.ok()) {
    // If seed endpoint not available (e.g. running against production accidentally), skip gracefully
    console.warn(
      `[engagement-modal.spec.ts] Seed endpoint returned ${seedRes.status()} — tests may be skipped or use fallback`
    );
    seededRecordId = 'seed-unavailable';
    recordPath = '/records/seed-unavailable';
    return;
  }

  const seedData = await seedRes.json() as { record_id: string };
  seededRecordId = seedData.record_id;
  recordPath = `/records/${seededRecordId}`;
});

test.afterAll(async ({ request }) => {
  // Clean up seeded record
  if (seededRecordId && seededRecordId !== 'seed-unavailable') {
    await request
      .delete(`/api/v1/test-seed/records/${seededRecordId}`)
      .catch(() => { /* cleanup is best-effort */ });
  }
});

// ─── Test suite ──────────────────────────────────────────────────────────────
test.describe('Engagement Request Modal — F7 (US-7.1, US-7.2)', () => {

  // ── Modal open / title / pre-population ──────────────────────────────────

  test('clicking "Request a Demo" button opens modal with correct title and pre-populated record', async ({ page }) => {
    await page.goto(recordPath);
    // Click the "Request a Demo" engagement button in the Next-Action panel
    await page.click('button[aria-label="Request a Demo"]');
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Modal title should reflect the request type
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request a Demo');
    // Record reference should be pre-populated (read-only display)
    await expect(page.locator('[role="dialog"]')).toContainText('a demo for:');
    // CAPTCHA widget should be present
    await expect(page.locator('[aria-label="CAPTCHA verification"]')).toBeVisible();
  });

  test('clicking "Request Technical Guidance" opens modal with correct title', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request Technical Guidance"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request Technical Guidance');
    await expect(page.locator('[role="dialog"]')).toContainText('technical guidance for:');
  });

  test('clicking "Request Adoption Discussion" opens modal with correct title', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request Adoption Discussion"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request Adoption Discussion');
    await expect(page.locator('[role="dialog"]')).toContainText('an adoption discussion for:');
  });

  test('clicking "Request a Briefing" opens modal with correct title', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Briefing"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request a Briefing');
    await expect(page.locator('[role="dialog"]')).toContainText('a briefing for:');
  });

  // ── Modal close behaviors ─────────────────────────────────────────────────

  test('modal can be closed with the × button; focus returns to trigger (WCAG 2.1 AA)', async ({ page }) => {
    await page.goto(recordPath);
    const trigger = page.locator('button[aria-label="Request a Demo"]').first();
    await trigger.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    // Focus should return to the trigger button (WCAG 2.1 AA focus management)
    await expect(trigger).toBeFocused();
  });

  test('modal can be closed with Cancel button', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  // ── CAPTCHA / submit state ────────────────────────────────────────────────

  test('Submit button is disabled until CAPTCHA is completed', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await fillEngagementForm(page);
    // Submit should still be disabled — CAPTCHA not yet completed
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeDisabled();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  test('happy path: fill form, bypass CAPTCHA (dev), submit successfully, see confirmation', async ({ page }) => {
    // Intercept the API to return mock success (avoids DB dependency in e2e)
    await page.route('**/api/v1/engagement-requests', (route) => {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await fillEngagementForm(page);

    // Complete the dev CAPTCHA bypass (CaptchaWidget renders bypass button when no site key)
    await bypassCaptcha(page);

    // Submit button should now be enabled
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Confirmation state should appear (form replaced by EngagementConfirmation)
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toContainText(
      'Your request has been sent to the I&R team.'
    );
    await expect(page.locator('[role="dialog"]')).toContainText('Demo');
    await expect(page.locator('button:has-text("Close")')).toBeVisible();
  });

  test('closing confirmation modal closes entire modal', async ({ page }) => {
    await page.route('**/api/v1/engagement-requests', (route) => {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await fillEngagementForm(page);
    await bypassCaptcha(page);
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Close")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  // ── Inline validation ─────────────────────────────────────────────────────

  test('inline validation: required fields show errors on blur', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    // Click Name field then blur without entering value
    await page.click('#requestorName');
    await page.press('#requestorName', 'Tab');
    await expect(page.locator('#requestorName-error')).toBeVisible();
    await expect(page.locator('#requestorName-error')).toContainText('Name is required.');
  });

  test('inline validation: email format error shown on blur', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await page.fill('#requestorEmail', 'not-a-valid-email');
    await page.press('#requestorEmail', 'Tab');
    await expect(page.locator('#requestorEmail-error')).toBeVisible();
    await expect(page.locator('#requestorEmail-error')).toContainText('valid email address');
  });

  test('inline validation: description too short shows error', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await page.fill('#descriptionOfInterest', 'Too short');
    await page.press('#descriptionOfInterest', 'Tab');
    await expect(page.locator('#descriptionOfInterest-error')).toBeVisible();
    await expect(page.locator('#descriptionOfInterest-error')).toContainText('at least 20 characters');
  });

  // ── Error states ──────────────────────────────────────────────────────────

  test('rate limit (429) shows error banner at top of form', async ({ page }) => {
    await page.route('**/api/v1/engagement-requests', (route) => {
      void route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please wait before submitting again.',
          },
        }),
      });
    });

    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await fillEngagementForm(page);
    await bypassCaptcha(page);
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Too many requests');
    // Modal should stay open so user can see the error
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('server error (500) shows error banner', async ({ page }) => {
    await page.route('**/api/v1/engagement-requests', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
        }),
      });
    });

    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    await fillEngagementForm(page);
    await bypassCaptcha(page);
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Unable to submit at this time');
    // Modal should stay open so user can retry
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  // ── Character count ───────────────────────────────────────────────────────

  test('character count display starts at 0 / 2000 and updates live', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    // Initially 0 / 2000
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText('0 / 2000');
    const testText = 'Hello world description text here.';
    await page.fill('#descriptionOfInterest', testText);
    // Count should update to reflect new length
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText(
      `${testText.length} / 2000`
    );
  });

  // ── ARIA / accessibility structure ────────────────────────────────────────

  test('modal has correct ARIA roles and attributes (WCAG 2.1 AA)', async ({ page }) => {
    await page.goto(recordPath);
    await page.click('button[aria-label="Request a Demo"]');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'engagement-modal-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'engagement-modal-desc');
  });

});
