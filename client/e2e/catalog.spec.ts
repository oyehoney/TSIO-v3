import { test, expect } from '@playwright/test';
import type { PaginatedCatalogResponse, CatalogFilters } from '../src/types/catalog';

// ─── Mock data helpers ────────────────────────────────────────────────────────

const mockCatalogCard = (overrides: Partial<{
  record_id: string;
  title: string;
  maturity_level: string;
  review_status: string;
  is_community_contributed: boolean;
  is_validated_for_reuse: boolean;
}> = {}) => ({
  record_id: overrides.record_id ?? 'test-record-001',
  title: overrides.title ?? 'Audio Security Proof of Concept',
  short_summary: 'Explores feasibility of GPU/CPU audio separation for courtroom recording in Azure Government Cloud environments.',
  maturity_level: overrides.maturity_level ?? 'EXPERIMENT_POC',
  maturity_label: 'Experiment / POC',
  review_status: overrides.review_status ?? 'CURATED',
  review_status_label: 'Curated',
  reuse_potential: 'MEDIUM',
  source_type: overrides.is_community_contributed ? 'COMMUNITY' : 'I_AND_R',
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure'],
  engagement_options: ['REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION'],
  is_validated_for_reuse: overrides.is_validated_for_reuse ?? false,
  is_community_contributed: overrides.is_community_contributed ?? false,
  published_at: '2026-07-01T00:00:00Z',
});

const mockCatalogResponse = (cards: ReturnType<typeof mockCatalogCard>[], page = 1): PaginatedCatalogResponse => ({
  data: cards,
  pagination: { page, page_size: 12, total_count: cards.length, total_pages: 1 },
});

const mockFilters: CatalogFilters = {
  maturity_levels: ['EXPERIMENT_POC', 'PROTOTYPE_PILOT'],
  review_statuses: ['CURATED', 'TECHNICALLY_REVIEWED'],
  contributing_offices: ['TSIO I&R'],
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure', 'AI/ML'],
  reuse_potentials: ['MEDIUM', 'HIGH'],
};

// ─── Test setup: intercept API calls with mocks ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setupCatalogMocks(page: any, cards: ReturnType<typeof mockCatalogCard>[] = [mockCatalogCard()]) {
  await page.route('**/api/v1/catalog/filters', (route: any) =>
    route.fulfill({ json: mockFilters, status: 200 })
  );
  await page.route('**/api/v1/catalog?**', (route: any) =>
    route.fulfill({ json: mockCatalogResponse(cards), status: 200 })
  );
  // Also intercept without query string
  await page.route('**/api/v1/catalog', (route: any) =>
    route.fulfill({ json: mockCatalogResponse(cards), status: 200 })
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('CatalogPage', () => {

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

  test.describe('CatalogCard structure', () => {
    test('renders a catalog card with maturity badge, title, summary, and View Record link', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const card = page.getByTestId('catalog-card').first();
      await expect(card).toBeVisible();
      await expect(card.getByTestId('maturity-badge')).toBeVisible();
      await expect(card.getByTestId('review-status-badge')).toBeVisible();
      await expect(card).toContainText('Audio Security Proof of Concept');
      await expect(card).toContainText('GPU/CPU audio separation');
      await expect(card.getByTestId('view-record-link')).toBeVisible();
    });

    test('CatalogCard View Record → link points to /records/{id}', async ({ page }) => {
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
      // Amber color class for EXPERIMENT_POC (per UX-Mockup color system)
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
  });

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
      await setupCatalogMocks(page, [mockCatalogCard({ is_validated_for_reuse: true, review_status: 'VALIDATED_FOR_REUSE' })]);
      await page.goto('/catalog');

      await expect(page.getByTestId('reuse-badge')).toBeVisible();
      await expect(page.getByTestId('reuse-badge')).toContainText('Validated for Reuse');
    });
  });

  test.describe('FilterPanel', () => {
    test('filter panel renders with maturity and review status options', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const panel = page.getByTestId('filter-panel');
      await expect(panel).toBeVisible();
      // Maturity level checkbox for EXPERIMENT_POC
      await expect(page.getByTestId('filter-maturity-EXPERIMENT_POC')).toBeVisible();
    });

    test('checking a maturity filter updates the URL search params', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      await page.getByTestId('filter-maturity-EXPERIMENT_POC').check();
      await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);
    });

    test('active filter chip renders after applying a filter', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      await page.getByTestId('filter-maturity-EXPERIMENT_POC').check();
      await expect(page.getByTestId('filter-chip').first()).toBeVisible();
      await expect(page.getByTestId('filter-chip').first()).toContainText('Experiment / POC');
    });

    test('clicking × on active filter chip removes that filter', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC');

      // Chip should be visible
      const chip = page.getByTestId('filter-chip').first();
      await expect(chip).toBeVisible();

      // Click the remove × button inside the chip
      await chip.getByRole('button').click();

      // URL should no longer contain the maturity_level param
      await expect(page).not.toHaveURL(/maturity_level=EXPERIMENT_POC/);
    });

    test('Clear All Filters button removes all active filters', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog?maturity_level=EXPERIMENT_POC&review_status=CURATED');

      await page.getByTestId('clear-all-filters-bar').click();
      await expect(page).not.toHaveURL(/maturity_level/);
      await expect(page).not.toHaveURL(/review_status/);
    });
  });

  test.describe('SortControls', () => {
    test('sort dropdown defaults to Most Recent', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const sortSelect = page.getByTestId('sort-select');
      await expect(sortSelect).toHaveValue('recent');
    });

    test('changing sort to Maturity updates URL ?sort=maturity', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      await page.getByTestId('sort-select').selectOption('maturity');
      await expect(page).toHaveURL(/sort=maturity/);
    });
  });

  test.describe('Pagination', () => {
    test('Next button advances to page 2 (?page=2)', async ({ page }) => {
      // Mock 2 pages of results — use separate patterns to avoid catalog/filters conflict
      const twoPageResponse = {
        data: [mockCatalogCard()],
        pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
      };
      await page.route('**/api/v1/catalog/filters', (route: any) =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog?**', (route: any) =>
        route.fulfill({ json: twoPageResponse, status: 200 })
      );
      await page.route(/\/api\/v1\/catalog$/, (route: any) =>
        route.fulfill({ json: twoPageResponse, status: 200 })
      );

      await page.goto('/catalog');
      const nextBtn = page.getByTestId('pagination-next');
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
      await expect(page).toHaveURL(/page=2/);
    });

    test('Previous button is disabled on page 1', async ({ page }) => {
      const twoPageResponse = {
        data: [mockCatalogCard()],
        pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
      };
      await page.route('**/api/v1/catalog/filters', (route: any) =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog?**', (route: any) =>
        route.fulfill({ json: twoPageResponse, status: 200 })
      );
      await page.route(/\/api\/v1\/catalog$/, (route: any) =>
        route.fulfill({ json: twoPageResponse, status: 200 })
      );

      await page.goto('/catalog');
      await expect(page.getByTestId('pagination-prev')).toBeDisabled();
    });
  });

  test.describe('Empty state', () => {
    async function setupEmptyMocks(page: any) {
      const emptyResponse = { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 1 } };
      await page.route('**/api/v1/catalog/filters', (route: any) =>
        route.fulfill({ json: mockFilters, status: 200 })
      );
      await page.route('**/api/v1/catalog?**', (route: any) =>
        route.fulfill({ json: emptyResponse, status: 200 })
      );
      await page.route(/\/api\/v1\/catalog$/, (route: any) =>
        route.fulfill({ json: emptyResponse, status: 200 })
      );
    }

    test('empty state renders when catalog returns zero results', async ({ page }) => {
      await setupEmptyMocks(page);
      await page.goto('/catalog');
      await expect(page.getByTestId('catalog-empty-state')).toBeVisible();
      await expect(page.getByTestId('catalog-empty-state')).toContainText('No records found');
    });

    test('empty state CTA links to /submit-opportunity', async ({ page }) => {
      await setupEmptyMocks(page);
      await page.goto('/catalog');
      const cta = page.getByTestId('empty-state-submit-cta');
      await expect(cta).toBeVisible();
      const href = await cta.getAttribute('href');
      expect(href).toContain('/submit-opportunity');
    });
  });

  test.describe('Accessibility', () => {
    test('maturity badge has aria-label with maturity name', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const badge = page.getByTestId('maturity-badge').first();
      const ariaLabel = await badge.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Maturity:/);
    });

    test('result count aria-live region is present', async ({ page }) => {
      await setupCatalogMocks(page);
      await page.goto('/catalog');

      const liveRegion = page.locator('[aria-live="polite"]').first();
      await expect(liveRegion).toBeVisible();
    });
  });

});
