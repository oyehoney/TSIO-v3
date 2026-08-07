import { test, expect, Page } from '@playwright/test';

// Mock response for successful search — matches SearchResultCard shape from 04-PLAN.md
const MOCK_SEARCH_RESULT = {
  record_id: 'test-record-001',
  title: 'Audio Security Proof of Concept',
  short_summary: 'Explores GPU/CPU audio separation in Azure Government Cloud.',
  maturity_level: 'EXPERIMENT_POC',
  maturity_label: 'Experiment / POC',
  review_status: 'CURATED',
  review_status_label: 'Curated',
  reuse_potential: 'MEDIUM',
  source_type: 'I_AND_R',
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure'],
  engagement_options: ['REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION'],
  is_validated_for_reuse: false,
  is_community_contributed: false,
  published_at: '2026-07-01T00:00:00.000Z',
  relevance_score: 0.92,
  highlight_snippet: 'Explores <mark>audio</mark> <mark>security</mark> in cloud environments.',
};

const MOCK_PAGINATION = { page: 1, page_size: 12, total_count: 1, total_pages: 1 };

async function mockSearchSuccess(page: Page, results = [MOCK_SEARCH_RESULT]) {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: results, pagination: MOCK_PAGINATION }),
    });
  });
}

async function mockSearchEmpty(page: Page, query = 'xyzzy') {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
        message: `No records found for '${query}'. Try different keywords, or submit a mission problem.`,
      }),
    });
  });
}

async function mockSearch503(page: Page) {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable. Try browsing the catalog.' } }),
    });
  });
}

// ── Happy path ──────────────────────────────────────────────────────────────

test('Search page renders result cards for a valid query', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Query echo in page header
  await expect(page.getByText(/search results for/i)).toBeVisible();
  await expect(page.getByText('audio security', { exact: true })).toBeVisible();

  // Result count
  await expect(page.getByText(/1 record found/i)).toBeVisible();

  // Result card
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByText('Audio Security Proof of Concept')).toBeVisible();
});

test('Result card displays maturity badge with correct label', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Maturity badge (EXPERIMENT_POC → 'Experiment / POC')
  await expect(page.getByText('● Experiment / POC')).toBeVisible();
});

test('Result card displays review status badge', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  await expect(page.getByText('Curated')).toBeVisible();
});

test('Result card renders highlight_snippet with <mark> tags as bold text', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // The highlight snippet contains <mark>audio</mark> — Playwright can detect the <mark> element
  const markEl = page.locator('mark').first();
  await expect(markEl).toBeVisible();
  // The <mark> element should contain one of the query terms
  const markText = await markEl.textContent();
  expect(['audio', 'security']).toContain(markText?.toLowerCase());
});

test('Result card "View →" link navigates to /records/{id}', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // "View →" uses Unicode right arrow (→) character
  const viewLink = page.getByRole('link', { name: /view/i }).filter({ hasText: /→|→/ }).first();
  await expect(viewLink).toBeVisible();
  await expect(viewLink).toHaveAttribute('href', /records\/test-record-001/);
});

// ── Blank query ──────────────────────────────────────────────────────────────

test('Blank query on /search shows "Enter a search term" prompt', async ({ page }) => {
  await page.goto('/search?q=');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
  // No result cards rendered
  await expect(page.locator('[role="article"]')).toHaveCount(0);
});

test('Whitespace-only query shows blank query prompt', async ({ page }) => {
  await page.goto('/search?q=   ');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
});

// ── Query too long ────────────────────────────────────────────────────────────

test('Query > 500 chars shows inline error message', async ({ page }) => {
  const longQuery = 'a'.repeat(501);
  await page.goto(`/search?q=${longQuery}`);

  await expect(page.getByText(/search query is too long/i)).toBeVisible();
  await expect(page.locator('[role="article"]')).toHaveCount(0);
});

// ── Zero results ──────────────────────────────────────────────────────────────

test('Zero results renders empty state with CTA to /submit-opportunity', async ({ page }) => {
  await mockSearchEmpty(page, 'remote hearing scheduling');
  await page.goto('/search?q=remote+hearing+scheduling');

  // Use the heading to avoid strict mode violation (both h2 and p contain "No records found")
  await expect(page.getByRole('heading', { name: /no records found/i })).toBeVisible();

  // CTA link to submit-opportunity
  const ctaLink = page.getByRole('link', { name: /submit a mission problem/i });
  await expect(ctaLink).toBeVisible();
  await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
});

test('Zero results empty state includes secondary link to /catalog', async ({ page }) => {
  await mockSearchEmpty(page, 'xyzzy');
  await page.goto('/search?q=xyzzy');

  const catalogLink = page.getByRole('link', { name: /view innovation catalog/i });
  await expect(catalogLink).toBeVisible();
  await expect(catalogLink).toHaveAttribute('href', /catalog/);
});

// ── Filters ──────────────────────────────────────────────────────────────────

test('Filter panel is visible on search results page', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Filter panel heading
  await expect(page.getByRole('heading', { name: /refine results/i })).toBeVisible();

  // Maturity checkboxes
  await expect(page.getByRole('checkbox', { name: /experiment.*poc/i })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /prototype.*pilot/i })).toBeVisible();

  // Reuse potential radio
  await expect(page.getByRole('radio', { name: /high/i })).toBeVisible();
});

test('Checking a maturity filter updates the URL', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Check the "Experiment / POC" checkbox
  await page.getByRole('checkbox', { name: /experiment.*poc/i }).check();

  // URL should now contain maturity_level=EXPERIMENT_POC
  await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);
});

test('Active filter chip is visible when filter applied', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Active filter chip with the value
  await expect(page.getByText('EXPERIMENT_POC').first()).toBeVisible();

  // Clear all filters button
  await expect(page.getByRole('button', { name: /clear all filters/i })).toBeVisible();
});

test('Removing a filter chip updates URL and removes the chip', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Click the × on the chip
  await page.getByRole('button', { name: /remove maturity filter.*experiment_poc/i }).click();

  // maturity_level no longer in URL
  await expect(page).not.toHaveURL(/maturity_level/);
});

// ── 503 error ────────────────────────────────────────────────────────────────

test('503 from search API shows unavailability error banner', async ({ page }) => {
  await mockSearch503(page);
  await page.goto('/search?q=audio+security');

  await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
  // Catalog fallback link
  await expect(page.getByRole('link', { name: /browsing the catalog/i })).toBeVisible();
});

// ── Navigation: reachable from app shell search bar ──────────────────────────

test('Global search bar in app shell navigates to /search?q=...', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/catalog');

  // Locate the global search bar in the header
  const searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"], input[placeholder*="search" i]')).first();
  await expect(searchInput).toBeVisible();

  await searchInput.fill('audio security');
  await searchInput.press('Enter');

  // Should navigate to search page with q= param
  await expect(page).toHaveURL(/\/search\?q=audio/);
});

// ── Pagination ────────────────────────────────────────────────────────────────

test('Pagination controls are shown when total_pages > 1', async ({ page }) => {
  // Mock multi-page response
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [MOCK_SEARCH_RESULT],
        pagination: { page: 1, page_size: 12, total_count: 25, total_pages: 3 },
      }),
    });
  });

  await page.goto('/search?q=audio');

  const nav = page.getByRole('navigation', { name: /pagination/i });
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
});

test('Clicking page 2 updates URL with page=2', async ({ page }) => {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [MOCK_SEARCH_RESULT],
        pagination: { page: 1, page_size: 12, total_count: 25, total_pages: 3 },
      }),
    });
  });

  await page.goto('/search?q=audio');
  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect(page).toHaveURL(/page=2/);
});
