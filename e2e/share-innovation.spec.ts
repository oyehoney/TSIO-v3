// e2e/share-innovation.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Share Innovation Form (/share-innovation)', () => {

  test('Top nav "Share Your Innovation Work" link is reachable from catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    const navLink = page.getByRole('link', { name: 'Share Your Innovation Work' });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/share-innovation/);
    await expect(page.getByRole('heading', { name: /Share Your Innovation Work/i })).toBeVisible();
  });

  test('Form renders with curation-review governance notice before all fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    const notice = page.getByText(/Submissions enter I&R curation review/i);
    await expect(notice).toBeVisible();
    // Publication not guaranteed language
    await expect(page.getByText(/Publication is not guaranteed/i)).toBeVisible();
  });

  test('ARCHIVED is NOT present as a maturity option', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    // ARCHIVED should not appear in the maturity radio options
    // This is governance-critical — ARCHIVED is excluded per F6 spec
    const archivedOption = page.getByRole('radio', { name: /archived/i });
    await expect(archivedOption).toHaveCount(0);
  });

  test('All four valid maturity options are present', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    await expect(page.getByRole('radio', { name: /Idea/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Experiment/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Prototype/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Production/i })).toBeVisible();
  });

  test('Artifact URL 1 is required — empty submit shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();
    await expect(page.getByText(/at least one artifact URL is required/i)).toBeVisible();
  });

  test('Artifact URL with non-https:// value shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    const urlInput = page.getByLabel(/Artifact URL 1/i);
    await urlInput.fill('http://example.com/document');
    await urlInput.blur();
    await expect(page.getByText(/must begin with https/i)).toBeVisible();
  });

  test('"+ Add another artifact URL" button reveals URL 2 field', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    // Initially only URL 1 visible
    await expect(page.getByLabel(/Artifact URL 2/i)).toHaveCount(0);
    // Click add button
    await page.getByRole('button', { name: /Add another artifact URL/i }).click();
    // URL 2 should now be visible
    await expect(page.getByLabel(/Artifact URL 2/i)).toBeVisible();
  });

  test('Happy path: successful submission navigates to confirmation page', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          submission_id: 'test-uuid-contribution',
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/share-innovation`);

    await page.getByLabel(/Describe the mission problem your team addressed/i).fill(
      'Courts needed a way to track digital evidence integrity across cloud-based storage systems without relying on vendor proprietary tools that create lock-in risks.'
    );
    await page.getByLabel(/Describe what your team built or explored/i).fill(
      'We built a lightweight metadata fingerprinting service using open-source tooling that attaches cryptographic hashes to evidence files at ingest time and verifies them on retrieval.'
    );
    await page.getByLabel(/Outcome Summary/i).fill(
      'Prototype validated in a single district court environment. Requires additional security review. Fingerprint verification adds under 200ms latency at tested volumes.'
    );
    await page.getByRole('radio', { name: /Prototype/i }).click();
    await page.getByLabel(/Artifact URL 1/i).fill('https://sharepoint.ao.dcn/sites/evidence-integrity-poc');
    await page.getByLabel(/Contributing Team Name/i).fill('Eastern District IT Innovation Team');
    await page.getByLabel(/Contributing Office/i).fill('Eastern District of Virginia');
    await page.getByLabel(/Contact Name/i).fill('Marcus Webb');
    await page.getByLabel(/Contact Email Address/i).fill('marcus.webb@uscourts.gov');

    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();

    await expect(page).toHaveURL(/share-innovation\/confirmation/);
    await expect(page.getByText(/Your submission has been received/i)).toBeVisible();
  });

  test('Confirmation page contains curation steps and attribution notice', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation/confirmation`);
    // Curation steps
    await expect(page.getByText(/I&R curators review/i)).toBeVisible();
    await expect(page.getByText(/attribution/i)).toBeVisible();
    // Does not guarantee publication
    await expect(page.getByText(/does not guarantee publication/i)).toBeVisible();
  });

  test('Confirmation page "Return to Innovation Catalog" link navigates to /catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation/confirmation`);
    const returnLink = page.getByRole('link', { name: /Return to Innovation Catalog/i });
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('Rate limit response (429) shows RateLimitErrorBanner', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '3600' },
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many submissions.' } }),
      });
    });

    await page.goto(`${BASE_URL}/share-innovation`);

    await page.getByLabel(/Describe the mission problem your team addressed/i).fill(
      'Courts needed a way to track digital evidence integrity across cloud-based storage systems without relying on vendor proprietary tools that create lock-in risks.'
    );
    await page.getByLabel(/Describe what your team built or explored/i).fill(
      'We built a lightweight metadata fingerprinting service using open-source tooling that attaches cryptographic hashes to evidence files at ingest time and verifies them on retrieval.'
    );
    await page.getByLabel(/Outcome Summary/i).fill(
      'Prototype validated in a single district court environment. Requires additional security review. Fingerprint verification adds under 200ms latency at tested volumes.'
    );
    await page.getByRole('radio', { name: /Prototype/i }).click();
    await page.getByLabel(/Artifact URL 1/i).fill('https://sharepoint.ao.dcn/sites/evidence-integrity-poc');
    await page.getByLabel(/Contributing Team Name/i).fill('Eastern District IT Innovation Team');
    await page.getByLabel(/Contributing Office/i).fill('Eastern District of Virginia');
    await page.getByLabel(/Contact Name/i).fill('Marcus Webb');
    await page.getByLabel(/Contact Email Address/i).fill('marcus.webb@uscourts.gov');

    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();

    await expect(page.getByText(/Too many submissions from this location/i)).toBeVisible();
  });

});
