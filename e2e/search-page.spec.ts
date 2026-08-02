/**
 * Search Page e2e tests — TSIO Innovation Hub
 *
 * Tests cover all SearchPage states and interactions per UX Mockup Screen 01,
 * User Stories US-1.1, US-1.2, US-1.3.
 *
 * Architecture: Express + EJS server-side rendered at GET /search.
 * Test fixture mode: searchPageHandler uses in-memory mock fixtures when
 * TEST_MOCK_SEARCH=true (set in playwright.config.ts webServer.env).
 * This allows tests to run without a live PostgreSQL database.
 *
 * Mock behavior (controlled by query content in TEST_MOCK_SEARCH mode):
 *   - q='audio security'     → 1 result card with mock data
 *   - q='audio' (multi page) → 25 results, 3 pages (use q='multi audio')
 *   - q='xyzzy'              → zero results → empty state
 *   - q='remote hearing ...' → zero results → empty state
 *   - blank q                → blank query prompt
 *   - q > 500 chars          → inline error (handled before mock lookup)
 *   - q='unavailable...'     → 503 error banner
 *
 * Wave 7 integration tests run against the real database with real data.
 */

import { test, expect } from '@playwright/test';

// ── Happy path ────────────────────────────────────────────────────────────────

test('Search page renders result cards for a valid query', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // Query echo in page header
  await expect(page.getByText(/search results for/i)).toBeVisible();
  await expect(page.getByText('audio security')).toBeVisible();

  // Result count
  await expect(page.getByText(/1 record found/i)).toBeVisible();

  // Result card
  await expect(page.locator('[data-testid="result-card"]')).toBeVisible();
  await expect(page.getByText('Audio Security Proof of Concept')).toBeVisible();
});

test('Result card displays maturity badge with correct label', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // Maturity badge (EXPERIMENT_POC → 'Experiment / POC')
  const maturityBadge = page.locator('[data-testid="maturity-badge"]').first();
  await expect(maturityBadge).toBeVisible();
  await expect(maturityBadge).toContainText('Experiment / POC');
});

test('Result card displays review status badge', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  const reviewBadge = page.locator('[data-testid="review-status-badge"]').first();
  await expect(reviewBadge).toBeVisible();
  await expect(reviewBadge).toContainText('Curated');
});

test('Result card renders highlight_snippet with <mark> tags as highlighted text', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // The highlight snippet contains <mark>audio</mark> — EJS renders it via <%- %>
  const markEl = page.locator('[data-testid="highlight-snippet"] mark').first();
  await expect(markEl).toBeVisible();

  const markText = await markEl.textContent();
  expect(['audio', 'security']).toContain(markText?.toLowerCase());
});

test('Result card "View →" link navigates to /records/{id}', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  const viewLink = page.locator('[data-testid="view-record-link"]').first();
  await expect(viewLink).toBeVisible();
  await expect(viewLink).toHaveAttribute('href', /records\/test-record-001/);
});

// ── Blank query ───────────────────────────────────────────────────────────────

test('Blank query on /search shows "Enter a search term" prompt', async ({ page }) => {
  await page.goto('/search?q=');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
  // No result cards rendered
  await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0);
});

test('Whitespace-only query shows blank query prompt', async ({ page }) => {
  await page.goto('/search?q=   ');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
});

// ── Query too long ─────────────────────────────────────────────────────────────

test('Query > 500 chars shows inline error message', async ({ page }) => {
  const longQuery = 'a'.repeat(501);
  await page.goto(`/search?q=${longQuery}`);

  await expect(page.getByText(/search query is too long/i)).toBeVisible();
  await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0);
});

// ── Zero results ──────────────────────────────────────────────────────────────

test('Zero results renders empty state with CTA to /submit-opportunity', async ({ page }) => {
  // 'remote hearing scheduling' triggers empty state in mock
  await page.goto('/search?q=remote+hearing+scheduling');

  await expect(page.getByText(/no records found/i)).toBeVisible();

  // CTA link to submit-opportunity
  const ctaLink = page.locator('[data-testid="submit-opportunity-cta"]');
  await expect(ctaLink).toBeVisible();
  await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
});

test('Zero results empty state includes secondary link to /catalog', async ({ page }) => {
  await page.goto('/search?q=xyzzy');

  const catalogLink = page.locator('[data-testid="catalog-link"]');
  await expect(catalogLink).toBeVisible();
  await expect(catalogLink).toHaveAttribute('href', /catalog/);
});

// ── Filters ───────────────────────────────────────────────────────────────────

test('Filter panel is visible on search results page', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // Filter panel heading
  await expect(page.getByRole('heading', { name: /refine results/i })).toBeVisible();

  // Maturity checkboxes
  await expect(page.getByRole('checkbox', { name: /experiment.*poc/i })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /prototype.*pilot/i })).toBeVisible();

  // Reuse potential radio
  await expect(page.getByRole('radio', { name: /^high$/i })).toBeVisible();
});

test('Checking a maturity filter updates the URL', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // Check the "Experiment / POC" checkbox — form auto-submits on change
  await page.getByRole('checkbox', { name: /experiment.*poc/i }).check();

  // URL should now contain maturity_level=EXPERIMENT_POC
  await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);
});

test('Active filter chip is visible when filter applied', async ({ page }) => {
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Active filter chip with the value
  await expect(page.getByTestId('active-filters')).toBeVisible();
  await expect(page.locator('.filter-chip').first()).toContainText('EXPERIMENT_POC');

  // Clear all filters button
  await expect(page.getByTestId('clear-all-filters')).toBeVisible();
});

test('Removing a filter chip updates URL and removes the chip', async ({ page }) => {
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Click the × remove button on the chip
  await page.getByRole('button', { name: /remove maturity filter.*experiment_poc/i }).click();

  // maturity_level no longer in URL
  await expect(page).not.toHaveURL(/maturity_level/);
});

// ── 503 error ─────────────────────────────────────────────────────────────────

test('503-like error shows unavailability error banner', async ({ page }) => {
  // 'unavailable' in query triggers SEARCH_UNAVAILABLE mock
  await page.goto('/search?q=unavailable+service');

  await expect(page.getByTestId('search-unavailable-banner')).toBeVisible();
  await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();

  // Catalog fallback link
  await expect(page.getByRole('link', { name: /browsing the catalog/i })).toBeVisible();
});

// ── Navigation: reachable from app shell search bar ───────────────────────────

test('Global search bar in app shell navigates to /search?q=...', async ({ page }) => {
  // Visit catalog page (any page with the top nav)
  await page.goto('/catalog');

  // Locate the global search bar in the header
  const searchInput = page.locator('[data-testid="global-search-input"]');
  await expect(searchInput).toBeVisible();

  await searchInput.fill('audio security');
  await page.getByTestId('global-search-submit').click();

  // Should navigate to search page with q= param
  await expect(page).toHaveURL(/\/search\?q=audio/);
});

test('Global search bar is pre-filled with current query on /search page', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // The global search input should be pre-filled with the current query
  const searchInput = page.locator('[data-testid="global-search-input"]');
  await expect(searchInput).toHaveValue('audio security');
});

// ── Pagination ────────────────────────────────────────────────────────────────

test('Pagination controls are shown when total_pages > 1', async ({ page }) => {
  // 'multi' in query triggers 25 results (3 pages) in mock
  await page.goto('/search?q=multi+page+audio');

  const paginationNav = page.locator('[data-testid="pagination"]');
  await expect(paginationNav).toBeVisible();

  // "Next" link should be visible on page 1 with 3 total pages
  await expect(page.getByRole('link', { name: /next/i })).toBeVisible();
});

test('Clicking page 2 updates URL with page=2', async ({ page }) => {
  await page.goto('/search?q=multi+page+audio');

  await page.getByRole('link', { name: 'Page 2' }).click();
  await expect(page).toHaveURL(/page=2/);
});

// ── Engagement indicators ─────────────────────────────────────────────────────

test('Result card shows engagement option indicators', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // MOCK_SEARCH_RESULT has REQUEST_DEMO
  await expect(page.getByText(/demo available/i)).toBeVisible();
});

// ── Tags ──────────────────────────────────────────────────────────────────────

test('Result card shows mission area and technology area tags', async ({ page }) => {
  await page.goto('/search?q=audio+security');

  // Tags from mock result
  await expect(page.getByText(/cybersecurity/i)).toBeVisible();
  await expect(page.getByText(/cloud infrastructure/i)).toBeVisible();
});
