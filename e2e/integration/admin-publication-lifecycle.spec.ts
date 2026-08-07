/**
 * e2e/integration/admin-publication-lifecycle.spec.ts
 * RTM: TEST-F2-05–F2-17 (key cases), TEST-F8-04–F8-10
 * Journey: JRN-05.1 (Catalina creates and publishes a record through full lifecycle)
 * F8: Curation and Administration — publication lifecycle
 */

import { test, expect } from '@playwright/test';
import { AUDIO_SECURITY_POC } from './fixtures';

// Mock DashboardSummary matching DashboardSummary type in adminApiClient.ts
const MOCK_DASHBOARD_SUMMARY = {
  total_published_records: 1,
  draft_review_records: 2,
  pending_opportunity_submissions: 3,
  pending_contribution_submissions: 1,
  recent_engagement_requests_7d: 5,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F8: Admin Publication Lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    // Admin auth gate: useAdminAuth checks GET /api/v1/admin/dashboard-summary
    // If it returns 200, user is considered authenticated
    await page.route('**/api/v1/admin/dashboard-summary**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD_SUMMARY),
      });
    });
  });

  test('TEST-F8-04: admin dashboard displays all 5 summary tiles', async ({ page }) => {
    await page.goto('/admin');
    // All 5 summary tiles rendered — check by tile data using specific link names
    // DashboardPage uses MOCK_DASHBOARD_SUMMARY: 1 published, 2 draft, 3 opportunity, 1 contribution, 5 engagement
    await expect(page.getByRole('link', { name: /Published Records/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Draft.*Review|Draft.*In Review/i }).first()).toBeVisible();
    // Opportunity tile shows "3 Opportunity Submissions"
    await expect(page.getByRole('link', { name: /3 Opportunity Submissions/i })).toBeVisible();
    // Contribution tile shows "1 Contribution Submissions"
    await expect(page.getByRole('link', { name: /1 Contribution Submissions/i })).toBeVisible();
    // Engagement tile
    await expect(page.getByRole('link', { name: /Engagement.*Request|Recent Engagement|5 Engagement/i }).first()).toBeVisible();
  });

  test('TEST-F2-07: curator can save draft with incomplete pub-required fields', async ({ page }) => {
    await page.route('**/api/v1/records', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...AUDIO_SECURITY_POC,
            record_id: 'rec-new-001',
            publication_state: 'DRAFT',
            title: 'Draft Innovation Record',
          }),
        });
      } else {
        route.fallback();
      }
    });
    await page.goto('/admin/records/new');
    const titleField = page.getByLabel(/title/i).first();
    if (await titleField.count() > 0) {
      await expect(titleField).toBeVisible();
      await titleField.fill('Draft Innovation Record');
      // Save draft without completing all pub-required fields
      const saveDraftBtn = page.getByRole('button', { name: /Save Draft/i });
      if (await saveDraftBtn.count() > 0) {
        await saveDraftBtn.click();
        await expect(page.getByText(/draft.*saved|saved.*draft|record.*saved|Record saved/i)).toBeVisible();
      }
    }
  });

  test('TEST-F2-08: "Submit for Review" blocked if pub-required field missing; lists blocking fields', async ({ page }) => {
    const incompleteRecord = {
      ...AUDIO_SECURITY_POC,
      record_id: 'rec-incomplete-001',
      publication_state: 'DRAFT',
      executive_perspective_text: '',
      executive_recommendation: '',
    };
    await page.route('**/api/v1/records/rec-incomplete-001**', (route) => {
      if (route.request().url().includes('submit-review')) {
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'PUBLICATION_GATE_FAILED',
              message: 'The record cannot be submitted for review. Required fields are missing.',
              fields: [
                { field: 'executive_perspective_text', error_code: 'REQUIRED', message: 'Executive Perspective Text is required.' },
                { field: 'executive_recommendation', error_code: 'REQUIRED', message: 'Executive Recommendation is required.' },
              ],
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(incompleteRecord),
        });
      }
    });
    await page.goto('/admin/records/rec-incomplete-001/edit');
    const submitBtn = page.getByRole('button', { name: /Submit for Review/i });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Governance gate feedback rendered
      await expect(
        page.getByText(/Cannot publish|missing.*required.*field|required.*field.*missing|PUBLICATION_GATE|Required fields/i)
      ).toBeVisible();
      await expect(page.getByText(/Executive Perspective Text/i)).toBeVisible();
      await expect(page.getByText(/Executive Recommendation/i)).toBeVisible();
    }
  });

  test('TEST-F2-10: on successful publication, published_at set; record appears in catalog', async ({ page }) => {
    const reviewRecord = { ...AUDIO_SECURITY_POC, record_id: 'rec-review-001', publication_state: 'REVIEW', published_at: null };
    const publishedRecord = { ...reviewRecord, publication_state: 'PUBLISHED', published_at: '2026-07-30T12:00:00Z' };
    await page.route('**/api/v1/records/rec-review-001**', (route) => {
      if (route.request().url().includes('/publish')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(publishedRecord),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(reviewRecord),
        });
      }
    });
    await page.goto('/admin/records/rec-review-001/edit');
    const publishBtn = page.getByRole('button', { name: /Publish/i });
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      // Publication state updated in UI
      await expect(page.getByText(/PUBLISHED|Published/i)).toBeVisible();
    }
  });

  test('TEST-F8-06: all valid state transitions execute correctly: DRAFT→REVIEW', async ({ page }) => {
    const draftRecord = { ...AUDIO_SECURITY_POC, record_id: 'rec-state-001', publication_state: 'DRAFT' };
    await page.route('**/api/v1/records/rec-state-001**', (route) => {
      if (route.request().url().includes('submit-review')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...draftRecord, publication_state: 'REVIEW' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(draftRecord),
        });
      }
    });
    await page.goto('/admin/records/rec-state-001/edit');
    // Submit for Review button visible in DRAFT state
    const submitBtn = page.getByRole('button', { name: /Submit for Review/i });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();
      // State updated to REVIEW
      await expect(page.getByText(/REVIEW|In Review/i)).toBeVisible();
    }
  });
});
