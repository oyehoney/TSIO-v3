/**
 * CatalogPage e2e tests
 *
 * Tests cover:
 * - Catalog loads at / (redirects) and /catalog (200, heading visible)
 * - CatalogCard structure: maturity badge, review status badge, title, summary, tags, "View Record →" link
 * - MaturityBadge color class present (EXPERIMENT_POC = amber class)
 * - CommunityBadge renders on community card
 * - ReuseBadge renders on validated-for-reuse card
 * - Filter checkbox applies filter (URL updates without page reload)
 * - Sort dropdown changes sort (?sort=maturity in URL)
 * - Pagination next button sets ?page=2
 * - Empty state message and CTA when no records match filters
 * - Active filter chip (×) remove works
 * - Clear all filters button removes all filter params
 * - TopNav links render: Catalog, Submit a Mission Problem, Share Your Innovation Work
 * - TopNav links navigate to correct routes (no dead anchors)
 * - Global search bar submits to /search?q=...
 * - aria-live region announces result count (WCAG 2.1 AA)
 *
 * Strategy: All tests use page.route() to intercept /api/v1/catalog and
 * /api/v1/catalog/filters calls with mock data. This means tests pass without
 * a live database and run fast in CI.
 *
 * The Express server serves the EJS page; the AJAX API calls are intercepted.
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Mock data helpers ────────────────────────────────────────────────────────

interface MockCardOverrides {
  record_id?: string;
  title?: string;
  maturity_level?: string;
  maturity_label?: string;
  review_status?: string;
  review_status_label?: string;
  is_community_contributed?: boolean;
  is_validated_for_reuse?: boolean;
}

function mockCatalogCard(overrides: MockCardOverrides = {}) {
  return {
    record_id: overrides.record_id ?? 'test-record-001',
    title: overrides.title ?? 'Audio Security Proof of Concept',
    short_summary:
      'Explores feasibility of GPU/CPU audio separation for courtroom recording in Azure Government Cloud environments.',
    maturity_level: overrides.maturity_level ?? 'EXPERIMENT_POC',
    maturity_label: overrides.maturity_label ?? 'Experiment / POC',
    review_status: overrides.review_status ?? 'CURATED',
    review_status_label: overrides.review_status_label ?? 'Curated',
    reuse_potential: 'MEDIUM',
    source_type: overrides.is_community_contributed ? 'COMMUNITY' : 'I_AND_R',
    mission_area_tags: ['Cybersecurity', 'Court Operations'],
    technology_area_tags: ['Cloud Infrastructure'],
    engagement_options: ['REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION'],
    is_validated_for_reuse: overrides.is_validated_for_reuse ?? false,
    is_community_contributed: overrides.is_community_contributed ?? false,
    published_at: '2026-07-01T00:00:00Z',
  };
}

function mockCatalogResponse(
  cards: ReturnType<typeof mockCatalogCard>[],
  page = 1,
  totalPages = 1
) {
  return {
    data: cards,
    pagination: {
      page,
      page_size: 12,
      total_count: cards.length,
      total_pages: totalPages,
    },
  };
}

const mockFilters = {
  maturity_levels: ['EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED', 'IDEA', 'ARCHIVED'],
  review_statuses: ['CURATED', 'TECHNICALLY_REVIEWED', 'SUBMITTED', 'VALIDATED_FOR_REUSE'],
  contributing_offices: ['TSIO I&R'],
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure', 'AI/ML'],
  reuse_potentials: ['MEDIUM', 'HIGH', 'LOW'],
};

// ─── Test setup: intercept API calls with mocks ───────────────────────────────

async function setupCatalogMocks(
  page: Page,
  cards: ReturnType<typeof mockCatalogCard>[] = [mockCatalogCard()],
  totalPages = 1
) {
  // Mock filter options endpoint
  await page.route('**/api/v1/catalog/filters', route =>
    route.fulfill({ json: mockFilters, status: 200 })
  );
  // Mock catalog endpoint (with and without query string)
  await page.route('**/api/v1/catalog**', route =>
    route.fulfill({ json: mockCatalogResponse(cards, 1, totalPages), status: 200 })
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('CatalogPage', () => {

  // ── Page load and navigation ──────────────────────────────────────────────

  test.describe('Page load and navigation', () => {
    test('loads at /catalog and renders the Innovation Catalog heading', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');
      await expect(page.getByText('Innovation Catalog')).toBeVisible();
    });

    test('root / redirects to /catalog', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/');
      await expect(page).toHaveURL('/catalog');
    });

    test('TopNav renders all required navigation links', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const nav = page.getByTestId('top-nav');
      await expect(nav.getByTestId('nav-catalog')).toBeVisible();
      await expect(nav.getByTestId('nav-submit-opportunity')).toBeVisible();
      await expect(nav.getByTestId('nav-share-innovation')).toBeVisible();
    });

    test('TopNav Catalog link navigates to /catalog', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');
      await page.getByTestId('nav-catalog').click();
      await expect(page).toHaveURL('/catalog');
    });

    test('TopNav Submit a Mission Problem link navigates to /submit-opportunity', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');
      await page.getByTestId('nav-submit-opportunity').click();
      await expect(page).toHaveURL('/submit-opportunity');
    });

    test('TopNav Share Your Innovation Work link navigates to /share-innovation', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');
      await page.getByTestId('nav-share-innovation').click();
      await expect(page).toHaveURL('/share-innovation');
    });

    test('global search bar submits to /search?q=...', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');
      await page.getByTestId('global-search-input').fill('audio security');
      await page.getByTestId('global-search-submit').click();
      await expect(page).toHaveURL(/\/search\?q=audio/);
    });
  });

  // ── CatalogCard structure ─────────────────────────────────────────────────

  test.describe('CatalogCard structure', () => {
    test('renders a catalog card with maturity badge, title, summary, and View Record link', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      // Wait for card grid (server-side rendered)
      const card = page.getByTestId('catalog-card').first();
      await expect(card).toBeVisible();
      await expect(card.getByTestId('maturity-badge')).toBeVisible();
      await expect(card.getByTestId('review-status-badge')).toBeVisible();
      await expect(card).toContainText('Audio Security Proof of Concept');
      await expect(card).toContainText('GPU/CPU audio separation');
      await expect(card.getByTestId('view-record-link')).toBeVisible();
    });

    test('CatalogCard "View Record →" link points to /records/{id}', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const viewLink = page.getByTestId('view-record-link').first();
      const href = await viewLink.getAttribute('href');
      expect(href).toMatch(/\/records\/test-record-001/);
    });

    test('MaturityBadge shows EXPERIMENT_POC with amber color class', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const badge = page.getByTestId('maturity-badge').first();
      await expect(badge).toHaveAttribute('data-maturity', 'EXPERIMENT_POC');
      await expect(badge).toContainText('Experiment / POC');
      // Verify amber CSS class is applied (per UX-Mockup color system)
      const className = await badge.getAttribute('class');
      expect(className).toContain('amber');
    });

    test('engagement indicators render on card', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const card = page.getByTestId('catalog-card').first();
      await expect(card).toContainText('Demo Available');
      await expect(card).toContainText('Adoption Discussion');
    });

    test('mission area and technology area tags render as chips', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const card = page.getByTestId('catalog-card').first();
      await expect(card).toContainText('Cybersecurity');
      await expect(card).toContainText('Cloud Infrastructure');
    });

    test('short summary truncated to 280 characters', async ({ page }) => {
      const longCard = mockCatalogCard({
        title: 'Long Summary Record',
      });
      longCard.short_summary = 'A'.repeat(300); // exceeds 280 chars
      await setupCatalogMocks(page, [longCard]);
      await page.goto('/catalog');

      const card = page.getByTestId('catalog-card').first();
      const summaryText = await card.locator('.catalog-card__summary').textContent();
      // Should be truncated to 280 chars (277 + '…')
      expect(summaryText?.length).toBeLessThanOrEqual(285); // a little buffer for whitespace
      expect(summaryText).toContain('…');
    });
  });

  // ── Community and Reuse badges ────────────────────────────────────────────

  test.describe('Community and Reuse badges', () => {
    test('CommunityBadge renders on COMMUNITY source_type card', async ({ page }) => {
      await setupCatalogMocks(page, [mockCatalogCard({ is_community_contributed: true })]);
      await page.goto('/catalog');

      await expect(page.getByTestId('community-badge')).toBeVisible();
      await expect(page.getByTestId('community-badge')).toContainText('COMMUNITY');
    });

    test('CommunityBadge does NOT render on I_AND_R source_type card', async ({ page }) => {
      await setupCatalogMocks(page, [mockCatalogCard({ is_community_contributed: false })]);
      await page.goto('/catalog');

      await expect(page.getByTestId('community-badge')).not.toBeVisible();
    });

    test('ReuseBadge renders on VALIDATED_FOR_REUSE card', async ({ page }) => {
      await setupCatalogMocks(page, [
        mockCatalogCard({ is_validated_for_reuse: true, review_status: 'VALIDATED_FOR_REUSE', review_status_label: 'Validated for Reuse' }),
      ]);
      await page.goto('/catalog');

      await expect(page.getByTestId('reuse-badge')).toBeVisible();
      await expect(page.getByTestId('reuse-badge')).toContainText('Validated for Reuse');
    });

    test('ReuseBadge does NOT render when is_validated_for_reuse is false', async ({ page }) => {
      await setupCatalogMocks(page, [mockCatalogCard({ is_validated_for_reuse: false })]);
      await page.goto('/catalog');

      await expect(page.getByTestId('reuse-badge')).not.toBeVisible();
    });
  });

  // ── FilterPanel ───────────────────────────────────────────────────────────

  test.describe('FilterPanel', () => {
    test('filter panel renders with maturity and review status options', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const panel = page.getByTestId('filter-panel');
      await expect(panel).toBeVisible();
      // Maturity level checkbox for EXPERIMENT_POC (server-rendered)
      await expect(page.getByTestId('filter-maturity-EXPERIMENT_POC')).toBeVisible();
    });

    test('checking a maturity filter updates the URL search params (no page reload)', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      // Intercept the AJAX request triggered by filter change
      const [request] = await Promise.all([
        page.waitForRequest(req => req.url().includes('/api/v1/catalog')),
        page.getByTestId('filter-maturity-EXPERIMENT_POC').check(),
      ]);

      // URL should reflect the filter
      await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);
      // API was called (AJAX, not full reload)
      expect(request.url()).toContain('/api/v1/catalog');
    });

    test('active filter chip renders after applying a maturity filter', async ({ page }) => {
      await setupCatalogMocks(page);
      // Navigate with filter already in URL (server renders the chip)
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC');

      await expect(page.getByTestId('filter-chip').first()).toBeVisible();
      await expect(page.getByTestId('filter-chip').first()).toContainText('Experiment / POC');
    });

    test('clicking × on active filter chip removes that filter from URL', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC');

      // Chip should be visible (server-rendered)
      const chip = page.getByTestId('filter-chip').first();
      await expect(chip).toBeVisible();

      // Click the remove × button inside the chip
      await chip.getByRole('button').click();

      // URL should no longer contain the maturity_level param
      await expect(page).not.toHaveURL(/maturity_level=EXPERIMENT_POC/);
    });

    test('Clear All Filters button removes all active filter params from URL', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC&review_status=CURATED');

      // Clear all via the bar button (server-rendered)
      await page.getByTestId('clear-all-filters-bar').click();

      await expect(page).not.toHaveURL(/maturity_level/);
      await expect(page).not.toHaveURL(/review_status/);
    });

    test('Clear All Filters button in sidebar also clears all active filters', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC');

      await page.getByTestId('clear-all-filters').click();

      await expect(page).not.toHaveURL(/maturity_level/);
    });
  });

  // ── SortControls ─────────────────────────────────────────────────────────

  test.describe('SortControls', () => {
    test('sort dropdown is visible and defaults to Most Recent', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const sortSelect = page.getByTestId('sort-select');
      await expect(sortSelect).toBeVisible();
      await expect(sortSelect).toHaveValue('recent');
    });

    test('changing sort to Maturity updates URL ?sort=maturity', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      await page.getByTestId('sort-select').selectOption('maturity');
      await expect(page).toHaveURL(/sort=maturity/);
    });

    test('changing sort to Relevance updates URL ?sort=relevance', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      await page.getByTestId('sort-select').selectOption('relevance');
      await expect(page).toHaveURL(/sort=relevance/);
    });

    test('URL ?sort=maturity pre-selects Maturity in the sort dropdown', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?sort=maturity');

      await expect(page.getByTestId('sort-select')).toHaveValue('maturity');
    });
  });

  // ── PaginationControls ────────────────────────────────────────────────────

  test.describe('Pagination', () => {
    test('Next button advances to page 2 (?page=2 in URL)', async ({ page }) => {
      // Mock 2 pages of results
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: {
            data: [mockCatalogCard()],
            pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
          },
          status: 200,
        })
      );

      await page.goto('/catalog');
      const nextBtn = page.getByTestId('pagination-next');
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
      await expect(page).toHaveURL(/page=2/);
    });

    test('Previous button is disabled on page 1', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: {
            data: [mockCatalogCard()],
            pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
          },
          status: 200,
        })
      );

      await page.goto('/catalog');
      await expect(page.getByTestId('pagination-prev')).toBeDisabled();
    });

    test('Next button is disabled on the last page', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: {
            data: [mockCatalogCard()],
            pagination: { page: 2, page_size: 12, total_count: 13, total_pages: 2 },
          },
          status: 200,
        })
      );

      await page.goto('/catalog?page=2');
      await expect(page.getByTestId('pagination-next')).toBeDisabled();
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  test.describe('Empty state', () => {
    test('empty state renders when catalog returns zero results', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 } },
          status: 200,
        })
      );

      await page.goto('/catalog');
      await expect(page.getByTestId('catalog-empty-state')).toBeVisible();
      await expect(page.getByTestId('catalog-empty-state')).toContainText('No records found');
    });

    test('empty state CTA links to /submit-opportunity', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 } },
          status: 200,
        })
      );

      await page.goto('/catalog');
      const cta = page.getByTestId('empty-state-submit-cta');
      await expect(cta).toBeVisible();
      const href = await cta.getAttribute('href');
      expect(href).toContain('/submit-opportunity');
    });

    test('empty state with filters shows helpful message', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 } },
          status: 200,
        })
      );

      // Navigate with filter active
      await page.goto('/catalog?maturity_level=ARCHIVED');
      await expect(page.getByTestId('catalog-empty-state')).toBeVisible();
      // Should show "No records match your current filters"
      await expect(page.getByTestId('catalog-empty-state')).toContainText('No records match');
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('maturity badge has aria-label with maturity name', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const badge = page.getByTestId('maturity-badge').first();
      const ariaLabel = await badge.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Maturity:/);
    });

    test('result count aria-live="polite" region is present (WCAG 2.1 AA)', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const liveRegion = page.locator('[aria-live="polite"]').first();
      await expect(liveRegion).toBeVisible();
      await expect(liveRegion).toContainText('Showing');
    });

    test('filter panel has aria-label for screen readers', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const panel = page.getByTestId('filter-panel');
      const ariaLabel = await panel.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('pagination nav has aria-label', async ({ page }) => {
      await page.route('**/api/v1/catalog/filters', route =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog**', route =>
        route.fulfill({
          json: {
            data: [mockCatalogCard()],
            pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
          },
          status: 200,
        })
      );

      await page.goto('/catalog');
      const paginationNav = page.getByTestId('pagination');
      const ariaLabel = await paginationNav.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('review status badge has aria-label', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const badge = page.getByTestId('review-status-badge').first();
      const ariaLabel = await badge.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Review status:/);
    });

    test('community badge has aria-label when rendered', async ({ page }) => {
      await setupCatalogMocks(page, [mockCatalogCard({ is_community_contributed: true })]);
      await page.goto('/catalog');

      const badge = page.getByTestId('community-badge').first();
      const ariaLabel = await badge.getAttribute('aria-label');
      expect(ariaLabel).toContain('Community');
    });
  });

  // ── Badge colors (CSS classes) ────────────────────────────────────────────

  test.describe('Badge color system', () => {
    const maturityColorTests: Array<[string, string, string]> = [
      ['IDEA', 'Idea', 'maturity-idea'],
      ['EXPERIMENT_POC', 'Experiment / POC', 'maturity-experiment'],
      ['PROTOTYPE_PILOT', 'Prototype / Pilot', 'maturity-prototype'],
      ['PRODUCTION_VALIDATED', 'Production / Validated Pattern', 'maturity-production'],
      ['ARCHIVED', 'Archived', 'maturity-archived'],
    ];

    for (const [level, label, cssKey] of maturityColorTests) {
      test(`${level} badge has correct CSS color class (${cssKey})`, async ({ page }) => {
        await setupCatalogMocks(page, [
          mockCatalogCard({ maturity_level: level, maturity_label: label }),
        ]);
        await page.goto('/catalog');

        const badge = page.getByTestId('maturity-badge').first();
        await expect(badge).toHaveAttribute('data-maturity', level);
        const className = await badge.getAttribute('class');
        expect(className).toContain(cssKey);
      });
    }
  });

  // ── URL state persistence ─────────────────────────────────────────────────

  test.describe('URL state persistence', () => {
    test('filters in URL are reflected in filter panel checkboxes on load', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC&review_status=CURATED');

      // Checkboxes should be checked (server-rendered state)
      await expect(page.getByTestId('filter-maturity-EXPERIMENT_POC')).toBeChecked();
      await expect(page.getByTestId('filter-review-CURATED')).toBeChecked();
    });

    test('sort in URL pre-selects the sort dropdown on load', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?sort=maturity');

      await expect(page.getByTestId('sort-select')).toHaveValue('maturity');
    });

    test('filter+sort+page state is preserved in URL (bookmarkable)', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      // Apply a filter
      await page.getByTestId('filter-maturity-EXPERIMENT_POC').check();
      await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);

      // Change sort
      await page.getByTestId('sort-select').selectOption('maturity');
      await expect(page).toHaveURL(/sort=maturity/);
    });
  });

});
