// e2e/submit-opportunity.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Opportunity Submission Form (/submit-opportunity)', () => {

  test('Top nav "Submit a Mission Problem" link is reachable from catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    const navLink = page.getByRole('link', { name: 'Submit a Mission Problem' });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/submit-opportunity/);
    await expect(page.getByRole('heading', { name: /Submit a Mission Problem/i })).toBeVisible();
  });

  test('Form renders with non-commitment disclaimer visible before any fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    // Non-commitment disclaimer must be visible before interacting with any field
    const disclaimer = page.getByText(/does not imply acceptance/i);
    await expect(disclaimer).toBeVisible();
    // Form heading
    await expect(page.getByRole('heading', { name: /Submit a Mission Problem/i })).toBeVisible();
    // First field (problem-first ordering) must be problem description
    const problemField = page.getByLabel(/Describe the mission problem/i);
    await expect(problemField).toBeVisible();
  });

  test('Problem description: too short shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    const problemField = page.getByLabel(/Describe the mission problem/i);
    await problemField.fill('Too short');
    await problemField.blur();
    await expect(page.getByText(/at least 50 characters/i)).toBeVisible();
  });

  test('Submit with empty required fields shows error summary', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();
    // Error summary should appear
    await expect(page.getByText(/Please fix the following errors/i)).toBeVisible();
  });

  test('Submitter email: invalid format shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    const emailField = page.getByLabel(/Your Email Address/i);
    await emailField.fill('not-an-email');
    await emailField.blur();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test('Happy path: successful submission navigates to confirmation page', async ({ page }) => {
    // Intercept the API call and mock a 201 response
    await page.route('**/api/v1/opportunity-submissions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          submission_id: 'test-uuid-opportunity',
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/submit-opportunity`);

    // Fill required fields in problem-first order
    await page.getByLabel(/Describe the mission problem/i).fill(
      'Courts are struggling to reliably authenticate digital evidence across proceedings due to fragmented systems and no standard chain-of-custody protocol for cloud-stored recordings affecting case integrity.'
    );
    await page.getByLabel(/Mission Area/i).selectOption('Court Operations');
    await page.getByLabel(/Submitting Office/i).fill('District Court of DC');
    await page.getByLabel(/Your Name/i).fill('Margaret Hollis');
    await page.getByLabel(/Your Email Address/i).fill('margaret.hollis@uscourts.gov');

    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();

    // Should navigate to confirmation page
    await expect(page).toHaveURL(/submit-opportunity\/confirmation/);
    await expect(page.getByText(/Your submission has been received/i)).toBeVisible();
  });

  test('Confirmation page contains non-commitment language', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity/confirmation`);
    await expect(page.getByText(/does not imply acceptance/i)).toBeVisible();
  });

  test('Confirmation page "Return to Innovation Catalog" link navigates to /catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity/confirmation`);
    const returnLink = page.getByRole('link', { name: /Return to Innovation Catalog/i });
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('Rate limit response (429) shows RateLimitErrorBanner', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '3600' },
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many submissions.' } }),
      });
    });

    await page.goto(`${BASE_URL}/submit-opportunity`);

    await page.getByLabel(/Describe the mission problem/i).fill(
      'Courts are struggling to reliably authenticate digital evidence across proceedings due to fragmented systems and no standard chain-of-custody protocol for cloud-stored recordings affecting case integrity.'
    );
    await page.getByLabel(/Mission Area/i).selectOption('Court Operations');
    await page.getByLabel(/Submitting Office/i).fill('District Court of DC');
    await page.getByLabel(/Your Name/i).fill('Test User');
    await page.getByLabel(/Your Email Address/i).fill('test@uscourts.gov');

    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();

    await expect(page.getByText(/Too many submissions from this location/i)).toBeVisible();
  });

});
