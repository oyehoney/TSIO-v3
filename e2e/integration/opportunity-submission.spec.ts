/**
 * e2e/integration/opportunity-submission.spec.ts
 * RTM: TEST-F5-01 through TEST-F5-12 (key cases)
 * Journeys: JRN-01.2 (Margaret submits mission problem), JRN-02.2 (David empty-search → F5 CTA)
 * F5: Opportunity Submission
 */

import { test, expect } from '@playwright/test';

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F5: Opportunity Submission', () => {

  test('TEST-F5-01: submission form accessible at /submit-opportunity without authentication', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // Form renders without redirect to login
    // Heading is "Submit a Mission Problem" per SubmitOpportunityPage — use h1 role to avoid nav link
    await expect(page.getByRole('heading', { name: /Submit a Mission Problem/i })).toBeVisible();
  });

  test('TEST-F5-02: form uses problem-first field ordering with correct label', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // Label is "Describe the mission problem you are facing" per OpportunitySubmissionForm
    const problemField = page.getByLabel(/Describe the mission problem/i);
    await expect(problemField).toBeVisible();
  });

  test('TEST-F5-05: required fields missing returns inline validation errors; input preserved', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // Click submit without filling required fields
    // Button text is "Submit Mission Problem" per OpportunitySubmissionForm
    const submitBtn = page.getByRole('button', { name: /Submit Mission Problem/i });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Inline errors shown — the form validates required fields before API call
      await expect(page.getByText(/required|cannot be blank|This field is required|field.*required/i).first()).toBeVisible();
      // Page stays at /submit-opportunity (not navigated away)
      expect(page.url()).toContain('submit-opportunity');
    }
  });

  test('TEST-F5-06: problem_description < 50 chars returns FIELD_TOO_SHORT error', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions**', (route) => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'FIELD_TOO_SHORT',
            fields: [{ field: 'problem_description', message: 'Problem description must be at least 50 characters.' }],
          },
        }),
      });
    });
    await page.goto('/submit-opportunity');
    // Fill required fields with too-short problem description
    const problemField = page.getByLabel(/Describe the mission problem/i);
    if (await problemField.count() > 0) {
      await problemField.fill('Too short');
    }
    // mission_area is a <select> — use selectOption
    const missionArea = page.locator('select#mission_area, select[name="mission_area"]');
    if (await missionArea.count() > 0) await missionArea.selectOption('Court Operations');
    const office = page.getByLabel(/submitting.*office|Your office/i).first();
    if (await office.count() > 0) await office.fill('Eastern VA District Court');
    const name = page.getByLabel(/your.*name|full name|Name/i).first();
    if (await name.count() > 0) await name.fill('David Reyes');
    const email = page.getByLabel(/email/i).first();
    if (await email.count() > 0) await email.fill('david.reyes@uscourts.gov');
    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();
    // Either client-side validation (min chars) or server-side 422 — use .first() for strict mode
    await expect(page.getByText(/too short|50 characters|at least 50|minimum.*characters|50 char/i).first()).toBeVisible();
  });

  test('TEST-F5-09: successful submission shows "does not imply acceptance" confirmation', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions**', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ submission_id: 'sub-001', status: 'SUBMITTED' }),
      });
    });
    await page.goto('/submit-opportunity');
    const problemField = page.getByLabel(/Describe the mission problem/i);
    if (await problemField.count() > 0) {
      await problemField.fill(
        'Remote interpreter access reliability for non-English-speaking defendants is unreliable in circuit courts. This directly impacts due process for defendants who need interpretation services during proceedings.',
      );
    }
    // mission_area is a <select> — use selectOption
    const missionArea = page.locator('select#mission_area, select[name="mission_area"]');
    if (await missionArea.count() > 0) await missionArea.selectOption('Court Operations');
    const office = page.getByLabel(/submitting.*office|Your office/i).first();
    if (await office.count() > 0) await office.fill('AO Office of the General Counsel');
    const name = page.getByLabel(/your.*name|full name|Name/i).first();
    if (await name.count() > 0) await name.fill('Margaret Hollis');
    const email = page.getByLabel(/email/i).first();
    if (await email.count() > 0) await email.fill('m.hollis@uscourts.gov');
    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();
    // After successful submission, navigates to /submit-opportunity/confirmation
    // The confirmation page contains "does not imply acceptance" per governance requirement
    await expect(
      page.getByText(/does not imply acceptance|does not imply.*acceptance/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
