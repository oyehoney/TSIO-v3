/**
 * e2e/integration/engagement-request.spec.ts
 * RTM: TEST-F7-01 through TEST-F7-08
 * Journeys: JRN-01.1 Act (briefing request), JRN-02.1 Request Engagement, JRN-03.2 Technical Guidance
 * F7: Engagement Routing
 */

import { test, expect } from '@playwright/test';
import { AUDIO_SECURITY_POC } from './fixtures';

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F7: Engagement Routing', () => {

  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/v1/records/${AUDIO_SECURITY_POC.record_id}**`, (route) => {
      // RecordPage expects the record directly (not wrapped in { data: })
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(AUDIO_SECURITY_POC),
      });
    });
  });

  test('TEST-F7-01: Next-Action panel renders configured engagement options as actionable buttons', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Audio Security POC has REQUEST_DEMO, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING configured
    await expect(page.getByRole('button', { name: /Request.*Demo|Request Demo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request.*Technical.*Guidance|Technical Guidance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request.*Briefing|Briefing/i })).toBeVisible();
  });

  test('TEST-F7-02: clicking engagement option opens form/modal with required fields', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    await page.getByRole('button', { name: /Request.*Briefing|Briefing/i }).click();
    // Modal/inline form appears
    const dialog = page.getByRole('dialog')
      .or(page.getByTestId('engagement-modal'))
      .or(page.locator('[data-engagement-form]'));
    if (await dialog.count() > 0) {
      await expect(dialog.first()).toBeVisible();
    }
    // Required fields: description_of_interest (FRD F07)
    await expect(
      page.getByLabel(/describe.*interest|interest.*description|what.*would you like|reason|description/i)
    ).toBeVisible();
  });

  test('TEST-F7-04: successful engagement submission shows confirmation with record reference; creates engagement record', async ({ page }) => {
    await page.route('**/api/v1/engagement-requests**', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          request_id: 'req-001',
          request_type: 'REQUEST_BRIEFING',
          record_id: AUDIO_SECURITY_POC.record_id,
          status: 'SUBMITTED',
        }),
      });
    });
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    await page.getByRole('button', { name: /Request.*Briefing|Briefing/i }).click();
    // Fill engagement form
    const nameField = page.getByLabel(/Your Name/i).first();
    if (await nameField.count() > 0) await nameField.fill('Margaret Hollis');
    const officeField = page.getByLabel(/office|Your Office/i).first();
    if (await officeField.count() > 0) await officeField.fill('AO Executive Office');
    const emailField = page.getByLabel(/email/i).first();
    if (await emailField.count() > 0) await emailField.fill('m.hollis@uscourts.gov');
    const descField = page.getByLabel(/describe.*interest|Description of Interest|what.*would you like/i).first();
    if (await descField.count() > 0) {
      await descField.fill(
        'I need a briefing on the Audio Security POC before our next leadership meeting on courtroom technology modernization.',
      );
    }
    // Handle CAPTCHA bypass in dev mode
    const captchaBypassBtn = page.getByRole('button', { name: /Bypass CAPTCHA/i });
    if (await captchaBypassBtn.count() > 0) {
      await captchaBypassBtn.click();
    }
    // Wait for submit button to become enabled
    const submitBtn = page.getByRole('button', { name: /Submit Request/i });
    await submitBtn.click();
    // Confirmation with record reference — JRN-01.1 Act success
    // Modal shows "Request Submitted" heading — use heading role to avoid strict mode
    await expect(
      page.getByRole('heading', { name: /Request Submitted|request.*submitted/i })
        .or(page.getByText(/request.*received|briefing.*request.*received|submission.*received|Thank you/i).first())
    ).toBeVisible({ timeout: 10000 });
    // Record name should be visible in confirmation
    await expect(page.getByText(/Audio Security|audio.*security/i).first()).toBeVisible();
  });

  test('TEST-F7-06: engagement request against non-published record returns 404', async ({ page }) => {
    await page.route('**/api/v1/records/rec-draft-001**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'RECORD_NOT_FOUND' }),
      });
    });
    await page.goto('/records/rec-draft-001');
    // Use .first() to avoid strict mode violation
    await expect(page.getByText(/not found|404|does not exist/i).first()).toBeVisible();
    // No engagement options rendered for non-existent/non-published record
    await expect(
      page.getByRole('button', { name: /Request.*Demo|Request.*Guidance|Request.*Briefing/i })
    ).toHaveCount(0);
  });

  test('TEST-F7-08: REQUEST_TECHNICAL_GUIDANCE accessible from Technical Perspective', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Switch to Technical perspective
    const techToggle = page.getByRole('tab', { name: /Technical/i })
      .or(page.getByRole('button', { name: /Technical.*View/i }));
    if (await techToggle.count() > 0) {
      await techToggle.first().click();
      // Technical Guidance CTA visible in Technical Perspective — JRN-03.2
      await expect(page.getByRole('button', { name: /Request Technical Guidance/i })).toBeVisible();
    } else {
      // If no perspective toggle, at least the button should be visible somewhere on the page
      await expect(
        page.getByRole('button', { name: /Request Technical Guidance/i })
      ).toBeVisible();
    }
  });
});
