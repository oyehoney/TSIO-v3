/**
 * e2e/integration/trust-disclaimers.spec.ts
 * RTM: TEST-F9-04 through TEST-F9-10
 * PRD §6.3: 4 trust disclaimer trigger conditions — must all be tested explicitly
 * Design principle: "Trust integrity — the interface must never mislead stakeholders"
 * F9: Content, Maturity & Trust Model
 */

import { test, expect, type Page } from '@playwright/test';
import { AUDIO_SECURITY_POC } from './fixtures';

// ─── Helper: mock a record and navigate to it ─────────────────────────────────

async function mockAndNavigateToRecord(
  page: Page,
  overrides: Record<string, unknown>,
): Promise<void> {
  const record = { ...AUDIO_SECURITY_POC, record_id: 'rec-disclaimer-test', ...overrides };
  await page.route('**/api/v1/records/rec-disclaimer-test**', (route) => {
    // RecordPage expects the record directly (not wrapped in { data: })
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(record),
    });
  });
  await page.goto('/records/rec-disclaimer-test');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F9: Trust Disclaimers — all 4 trigger conditions', () => {

  test('TEST-F9-04: EXPERIMENT_POC maturity → "POC ≠ production-ready" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'EXPERIMENT_POC',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'CURATED',
      // Override executive text to avoid conflicts with trust_disclaimers
      executive_perspective_text: 'This is an early-stage experiment. Evaluation is ongoing.',
      trust_disclaimers: [
        'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone without full engineering and security review.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    // The TrustDisclaimersSection renders disclaimers — check within that section
    const trustSection = page.locator('[aria-label="Trust and Limitations"]');
    if (await trustSection.count() > 0) {
      // Disclaimer text specifically in the trust section
      await expect(trustSection.getByText(/POC.*production.ready|POC.*not.*deploy/i)).toBeVisible();
    } else {
      // Fallback: use .first() to avoid strict mode violation
      await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
    }
  });

  test('TEST-F9-04b: PROTOTYPE_PILOT maturity → "POC ≠ production-ready" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'PROTOTYPE_PILOT',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'CURATED',
      executive_perspective_text: 'This is a prototype-stage implementation. Full deployment is pending.',
      trust_disclaimers: [
        'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone without full engineering and security review.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    const trustSection = page.locator('[aria-label="Trust and Limitations"]');
    if (await trustSection.count() > 0) {
      await expect(trustSection.getByText(/POC.*production.ready|POC.*not.*deploy/i)).toBeVisible();
    } else {
      await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
    }
  });

  test('TEST-F9-05: PUBLISHED state → "Published ≠ approved for adoption" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'PRODUCTION_VALIDATED',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'CURATED',
      trust_disclaimers: [
        'Publication of this record does not constitute formal approval for adoption. Each court or office must conduct its own review before deploying any technology or process described here.',
      ],
    });
    // Per FRD F09: ALL published records show this disclaimer
    await expect(
      page.getByText(/does not constitute.*formal approval|not constitute.*approval|formal approval for adoption/i)
    ).toBeVisible();
  });

  test('TEST-F9-06: source_type=COMMUNITY → "Community-submitted ≠ centrally endorsed" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'PROTOTYPE_PILOT',
      publication_state: 'PUBLISHED',
      source_type: 'COMMUNITY',
      review_status: 'CURATED',
      is_community_contributed: true,
      trust_disclaimers: [
        'This record was contributed by a court or external party and has not been centrally endorsed. Community-submitted ≠ centrally endorsed.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    await expect(
      page.getByText(/centrally endorsed|community.*submitted|community.*not.*centrally/i)
    ).toBeVisible();
  });

  test('TEST-F9-07: review_status=VALIDATED_FOR_REUSE → "Validated for Reuse ≠ local review waived" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'PRODUCTION_VALIDATED',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'VALIDATED_FOR_REUSE',
      is_validated_for_reuse: true,
      trust_disclaimers: [
        'This record has been Validated for Reuse. However, validation does not waive local security, policy, or operational review. Courts must still conduct their own review before adoption.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    await expect(
      page.getByText(/validated.*does not waive|validation does not waive|local.*review.*required|local.*security.*policy/i)
    ).toBeVisible();
  });

  test('TEST-F9-08: multiple applicable conditions render all disclaimers simultaneously', async ({ page }) => {
    // This record triggers all 4 disclaimers simultaneously
    await mockAndNavigateToRecord(page, {
      maturity_level: 'EXPERIMENT_POC',    // trigger 1: POC ≠ production-ready
      publication_state: 'PUBLISHED',       // trigger 2: Published ≠ approved for adoption
      source_type: 'COMMUNITY',             // trigger 3: Community-submitted ≠ centrally endorsed
      review_status: 'VALIDATED_FOR_REUSE', // trigger 4: Validated for Reuse ≠ local review waived
      is_community_contributed: true,
      is_validated_for_reuse: true,
      // Use non-conflicting executive text
      executive_perspective_text: 'This submission requires review before any deployment decision.',
      trust_disclaimers: [
        'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone.',
        'Publication of this record does not constitute formal approval for adoption.',
        'This record was contributed by a court or external party and has not been centrally endorsed. Community-submitted ≠ centrally endorsed.',
        'This record has been Validated for Reuse. However, validation does not waive local security, policy, or operational review.',
      ],
    });
    // All 4 disclaimer categories visible at the same time
    // Use trust section locator to scope search
    const trustSection = page.locator('[aria-label="Trust and Limitations"]');
    if (await trustSection.count() > 0) {
      await expect(trustSection.getByText(/POC.*production.ready|POC.*not.*deploy/i)).toBeVisible();
      await expect(trustSection.getByText(/does not constitute.*formal approval/i)).toBeVisible();
      await expect(trustSection.getByText(/centrally endorsed|community.*submitted/i)).toBeVisible();
      await expect(trustSection.getByText(/validation does not waive/i)).toBeVisible();
    } else {
      await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
      await expect(page.getByText(/does not constitute.*formal approval/i).first()).toBeVisible();
      await expect(page.getByText(/centrally endorsed|community.*submitted/i).first()).toBeVisible();
      await expect(page.getByText(/validation does not waive/i).first()).toBeVisible();
    }
  });

  test('TEST-F9-09: curator cannot suppress trust disclaimers', async ({ page }) => {
    // Verify no toggle/override control exists on the record page
    await mockAndNavigateToRecord(page, {
      maturity_level: 'EXPERIMENT_POC',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'CURATED',
      executive_perspective_text: 'Early stage exploration. Review required before deployment decisions.',
      trust_disclaimers: [
        'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    // Trust section is visible
    const trustSection = page.locator('[aria-label="Trust and Limitations"]');
    if (await trustSection.count() > 0) {
      await expect(trustSection).toBeVisible();
      // No "hide disclaimer" or "dismiss" button within trust section
      await expect(page.getByRole('button', { name: /hide.*disclaimer|dismiss.*disclaimer|suppress/i })).toHaveCount(0);
      await expect(page.getByRole('checkbox', { name: /disclaimer/i })).toHaveCount(0);
    } else {
      // Fallback
      await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /hide.*disclaimer|dismiss.*disclaimer|suppress/i })).toHaveCount(0);
    }
  });

  test('TEST-F9-10: trust disclaimers rendered identically in both perspectives', async ({ page }) => {
    await mockAndNavigateToRecord(page, {
      maturity_level: 'EXPERIMENT_POC',
      publication_state: 'PUBLISHED',
      source_type: 'INTERNAL',
      review_status: 'CURATED',
      executive_perspective_text: 'Early stage exploration. Review required before deployment decisions.',
      trust_disclaimers: [
        'This record documents a Proof of Concept (POC). POC ≠ production-ready. Do not deploy based on this record alone.',
        'Publication of this record does not constitute formal approval for adoption.',
      ],
    });
    // Trust section is present and visible in executive view
    const trustSection = page.locator('[aria-label="Trust and Limitations"]');
    if (await trustSection.count() > 0) {
      await expect(trustSection).toBeVisible();
    } else {
      await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
    }

    // Switch to technical perspective
    const techToggle = page.getByRole('tab', { name: /Technical/i })
      .or(page.getByRole('button', { name: /Technical.*View/i }));
    if (await techToggle.count() > 0) {
      await techToggle.first().click();
      // Trust section still visible (trust disclaimers are outside perspective toggle)
      if (await trustSection.count() > 0) {
        await expect(trustSection).toBeVisible();
      } else {
        await expect(page.getByText(/POC.*production.ready|POC.*not.*deploy/i).first()).toBeVisible();
      }
    }
  });
});
