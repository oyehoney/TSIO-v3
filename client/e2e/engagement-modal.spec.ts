// e2e/engagement-modal.spec.ts
// Playwright e2e tests for Engagement Request Modal (Screen 03 / Flow 03)
// UserStories: US-7.1, US-7.2
// Feature: F7 — Engagement Routing

import { test, expect } from '@playwright/test';

// Intercept the engagement API with a mock success response for controlled tests
const MOCK_SUCCESS_RESPONSE = {
  request_id: 'test-request-uuid-001',
  record_id: 'test-record-001',
  request_type: 'REQUEST_DEMO',
  requestor_name: 'Margaret Hollis',
  requestor_email: 'margaret@uscourts.gov',
  requestor_office: 'Eastern District of Virginia',
  description_of_interest: 'We are evaluating this for our court and would like a live demo.',
  status: 'SUBMITTED',
  submitted_at: '2026-07-30T14:14:00Z',
};

// Mock record response for test-record-001 — matches InnovationRecord shape from Plan 11
const MOCK_RECORD_RESPONSE = {
  record_id: 'test-record-001',
  title: 'Audio Security Proof of Concept',
  problem_statement: 'How can we secure audio streams in Azure Government Cloud?',
  what_was_explored: 'GPU/CPU audio separation techniques in cloud environments.',
  outcome_summary: 'Demonstrated feasibility of audio isolation in government cloud.',
  key_findings: ['GPU acceleration viable', 'CPU fallback available'],
  reuse_guidance: 'Applicable to any federal cloud audio workload.',
  short_summary: 'Explores GPU/CPU audio separation in Azure Government Cloud.',
  maturity_level: 'EXPERIMENT_POC',
  maturity_label: 'Experiment / POC',
  review_status: 'CURATED',
  review_status_label: 'Curated',
  reuse_potential: 'MEDIUM',
  source_type: 'I_AND_R',
  owner_name: 'I&R Team',
  owner_office: 'AO Technology Office',
  contributing_office: 'AO Technology Office',
  contributor_attribution: null,
  executive_perspective_text: 'This innovation reduces audio processing costs by 40%.',
  executive_recommendation: 'Consider for pilot deployment.',
  technical_perspective_text: 'GPU-accelerated audio pipeline using DirectML.',
  security_findings: 'No critical vulnerabilities found.',
  performance_findings: '40% latency reduction vs CPU baseline.',
  default_perspective: 'EXECUTIVE',
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure'],
  artifact_links: [],
  engagement_options: [
    'REQUEST_DEMO',
    'REQUEST_TECHNICAL_GUIDANCE',
    'REQUEST_ADOPTION_DISCUSSION',
    'REQUEST_BRIEFING',
  ],
  trust_disclaimers: ['This record is curated by the I&R team.'],
  is_validated_for_reuse: false,
  is_community_contributed: false,
  publication_state: 'PUBLISHED',
  last_reviewed_date: '2026-07-01',
  published_at: '2026-07-01T00:00:00.000Z',
  superseded_by_record_id: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
};

// Helper: mock the record API so tests don't need live seed data
async function mockRecordApi(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/records/test-record-001', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RECORD_RESPONSE),
    });
  });
}

// Helper: fill the engagement form with valid data
async function fillEngagementForm(page: import('@playwright/test').Page) {
  await page.fill('#requestorName', 'Margaret Hollis');
  await page.fill('#requestorOffice', 'Eastern District of Virginia');
  await page.fill('#requestorEmail', 'margaret@uscourts.gov');
  await page.fill('#descriptionOfInterest', 'We are evaluating this for our court and would like a live demo to see it in action.');
}

test.describe('Engagement Request Modal — F7 (US-7.1, US-7.2)', () => {

  test('clicking "Request a Demo" button opens modal with correct title and pre-populated record', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    // Click the "Request a Demo" engagement button in the Next-Action panel
    await page.click('button:has-text("Request a Demo")');
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Modal title should reflect the request type
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request a Demo');
    // Record reference should be pre-populated and read-only
    await expect(page.locator('[role="dialog"]')).toContainText('a demo for:');
    // CAPTCHA widget should be present
    await expect(page.locator('[aria-label="CAPTCHA verification"]')).toBeVisible();
  });

  test('clicking "Request Technical Guidance" opens modal with correct title', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request Technical Guidance")');
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request Technical Guidance');
    await expect(page.locator('[role="dialog"]')).toContainText('technical guidance for:');
  });

  test('modal can be closed with the × button; focus returns to trigger', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    const trigger = page.locator('button:has-text("Request a Demo")').first();
    await trigger.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    // Focus should return to the trigger button (WCAG 2.1 AA)
    await expect(trigger).toBeFocused();
  });

  test('modal can be closed with Cancel button', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Submit button is disabled until CAPTCHA is completed', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    // Submit should still be disabled — CAPTCHA not yet completed
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeDisabled();
  });

  test('happy path: fill form, bypass CAPTCHA (dev), submit successfully, see confirmation', async ({ page }) => {
    await mockRecordApi(page);
    // Intercept the API to return mock success
    await page.route('**/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);

    // Complete the dev CAPTCHA bypass (CaptchaWidget renders bypass button in test env)
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) {
      await bypassBtn.click();
    }

    // Submit the form
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Confirmation state should appear
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toContainText('Your request has been sent to the I&R team.');
    await expect(page.locator('[role="dialog"]')).toContainText('Demo');
    await expect(page.locator('button:has-text("Close")')).toBeVisible();
  });

  test('closing confirmation modal closes entire modal', async ({ page }) => {
    await mockRecordApi(page);
    await page.route('**/api/v1/engagement-requests', (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(MOCK_SUCCESS_RESPONSE) });
    });
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Close")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('inline validation: required fields show errors on blur', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    // Click Name field then blur without entering value
    await page.click('#requestorName');
    await page.press('#requestorName', 'Tab');
    await expect(page.locator('#requestorName-error')).toBeVisible();
    await expect(page.locator('#requestorName-error')).toContainText('Name is required.');
  });

  test('inline validation: description too short shows error', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await page.fill('#descriptionOfInterest', 'Too short');
    await page.press('#descriptionOfInterest', 'Tab');
    await expect(page.locator('#descriptionOfInterest-error')).toBeVisible();
    await expect(page.locator('#descriptionOfInterest-error')).toContainText('at least 20 characters');
  });

  test('rate limit (429) shows error banner at top of form', async ({ page }) => {
    await mockRecordApi(page);
    await page.route('**/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait before submitting again.' } }),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Too many requests');
    // Modal should still be open (user should be able to try again later)
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('server error (500) shows error banner', async ({ page }) => {
    await mockRecordApi(page);
    await page.route('**/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } }),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Unable to submit at this time');
  });

  test('character count display updates live in description field', async ({ page }) => {
    await mockRecordApi(page);
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    // Initially 0 / 2000
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText('0 / 2000');
    await page.fill('#descriptionOfInterest', 'Hello world description text here.');
    // Count should update to reflect new length
    const expectedLen = 'Hello world description text here.'.length;
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText(`${expectedLen} / 2000`);
  });

});
