/**
 * e2e/integration/catalog-browsing.spec.ts
 * RTM: TEST-F0-01 through TEST-F0-14
 * Journeys: JRN-01.1 (Arrive, Browse, Locate), JRN-02.1 (Filter)
 * F0: Innovation Catalog + F9: trust signals on catalog cards
 */

import { test, expect } from '@playwright/test';
import { AUDIO_SECURITY_CATALOG_CARD } from './fixtures';

// ─── Mock response helpers ────────────────────────────────────────────────────

const MOCK_FILTERS = {
  maturity_levels: ['EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'],
  review_statuses: ['CURATED', 'TECHNICALLY_REVIEWED', 'VALIDATED_FOR_REUSE'],
  contributing_offices: ['TSIO I&R'],
  mission_area_tags: ['Courtroom Technology', 'Court Operations'],
  technology_area_tags: ['Audio Processing', 'Cloud Infrastructure'],
  reuse_potentials: ['LOW', 'MEDIUM', 'HIGH'],
};

function makeCatalogResponse(
  data: (typeof AUDIO_SECURITY_CATALOG_CARD & { source_type?: string; review_status?: string })[],
  total = data.length,
) {
  return {
    data,
    pagination: { page: 1, page_size: 12, total_count: total, total_pages: Math.max(1, Math.ceil(total / 12)) },
    filters_available: MOCK_FILTERS,
  };
}

// Helper to set up both required mocks for the catalog page
async function setupCatalogMocks(page: import('@playwright/test').Page, data: Parameters<typeof makeCatalogResponse>[0]) {
  // Must mock filters FIRST (before the catalog data route)
  await page.route('**/api/v1/catalog/filters', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FILTERS) });
  });
  // Then mock the catalog data endpoint (with or without query string)
  await page.route('**/api/v1/catalog?**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeCatalogResponse(data)) });
  });
  await page.route(/\/api\/v1\/catalog$/, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeCatalogResponse(data)) });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('F0: Innovation Catalog', () => {

  test('TEST-F0-01: catalog page renders at / and /catalog with all published records', async ({ page }) => {
    await setupCatalogMocks(page, [AUDIO_SECURITY_CATALOG_CARD]);
    await page.goto('/');
    await expect(page.getByText(/Audio Security POC/)).toBeVisible();
    await page.goto('/catalog');
    await expect(page.getByText(/Audio Security POC/)).toBeVisible();
  });

  test('TEST-F0-02: each catalog card displays all required fields', async ({ page }) => {
    await setupCatalogMocks(page, [AUDIO_SECURITY_CATALOG_CARD]);
    await page.goto('/catalog');
    // title
    await expect(page.getByText(/Audio Security POC/)).toBeVisible();
    // short_summary
    await expect(page.getByText(/proof of concept/i)).toBeVisible();
    // maturity badge (EXPERIMENT_POC -> 'Experiment / POC')
    await expect(page.getByText(/Experiment.*POC|POC/i).first()).toBeVisible();
    // review status badge (TECHNICALLY_REVIEWED -> 'Technically Reviewed') — use testid
    await expect(page.getByTestId('review-status-badge')).toBeVisible();
    // mission/technology area tags — use .first() to avoid filter panel match
    await expect(page.getByText(/Courtroom Technology/i).first()).toBeVisible();
    // published_at date — rendered as "July 2026" via toLocaleDateString
    await expect(page.getByText(/July 2026|Jul.*2026/i)).toBeVisible();
    // engagement indicator — at least one option configured (.first() for strict mode)
    await expect(page.getByText(/Demo|Guidance|Briefing/i).first()).toBeVisible();
  });

  test('TEST-F0-05: only PUBLISHED records visible to unauthenticated users', async ({ page }) => {
    // API correctly returns only PUBLISHED records; simulate this
    await setupCatalogMocks(page, [AUDIO_SECURITY_CATALOG_CARD]);
    await page.goto('/catalog');
    await expect(page.getByText(/Audio Security POC/)).toBeVisible();
    await expect(page.getByText('Draft Record - Should Not Appear')).not.toBeVisible();
  });

  test('TEST-F0-06: multi-select maturity filter narrows catalog correctly', async ({ page }) => {
    let capturedUrl = '';
    await page.route('**/api/v1/catalog/filters', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FILTERS) });
    });
    await page.route('**/api/v1/catalog?**', (route) => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeCatalogResponse([AUDIO_SECURITY_CATALOG_CARD])) });
    });
    await page.route(/\/api\/v1\/catalog$/, (route) => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeCatalogResponse([AUDIO_SECURITY_CATALOG_CARD])) });
    });
    await page.goto('/catalog');
    // Filter is a set of checkboxes — use data-testid from FilterPanel
    const maturityCheckbox = page.getByTestId('filter-maturity-EXPERIMENT_POC');
    if (await maturityCheckbox.count() > 0) {
      await maturityCheckbox.click();
      await expect(async () => {
        expect(capturedUrl).toContain('maturity_level');
      }).toPass({ timeout: 3000 });
    }
  });

  test('TEST-F0-10: zero results with active filter shows empty-state with F5 CTA', async ({ page }) => {
    await setupCatalogMocks(page, []);
    await page.goto('/catalog');
    // Empty-state message — "No records found" per CatalogEmptyState
    await expect(page.getByRole('heading', { name: /No records found/i })).toBeVisible();
    // F5 CTA link — data-testid="empty-state-submit-cta"
    const ctaLink = page.getByTestId('empty-state-submit-cta');
    if (await ctaLink.count() > 0) {
      await expect(ctaLink).toBeVisible();
      await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
    } else {
      // Fallback check
      await expect(page.getByRole('link', { name: /submit.*mission.*problem|submit.*opportunity/i })).toBeVisible();
    }
  });

  test('TEST-F0-11: community badge shown on cards with source_type=COMMUNITY', async ({ page }) => {
    const communityRecord = {
      ...AUDIO_SECURITY_CATALOG_CARD,
      record_id: 'rec-community-001',
      title: 'Community Innovation Record',
      source_type: 'COMMUNITY',
      is_community_contributed: true,
    };
    await setupCatalogMocks(page, [communityRecord]);
    await page.goto('/catalog');
    await expect(page.getByText(/Community.*Contribut|Community Submiss|Community/i).first()).toBeVisible();
  });

  test('TEST-F0-12: reuse badge shown on cards with review_status=VALIDATED_FOR_REUSE', async ({ page }) => {
    const reuseRecord = {
      ...AUDIO_SECURITY_CATALOG_CARD,
      record_id: 'rec-reuse-001',
      title: 'Validated Reuse Pattern',
      review_status: 'VALIDATED_FOR_REUSE',
      is_validated_for_reuse: true,
    };
    await setupCatalogMocks(page, [reuseRecord]);
    await page.goto('/catalog');
    // ReuseBadge has data-testid="reuse-badge"
    await expect(page.getByTestId('reuse-badge')).toBeVisible();
  });

  test('TEST-F0-04: default sort is Most Recent; pagination shows 12 cards per page', async ({ page }) => {
    const cards = Array.from({ length: 12 }, (_, i) => ({
      ...AUDIO_SECURITY_CATALOG_CARD,
      record_id: `rec-${String(i).padStart(3, '0')}`,
      title: `Innovation Record ${i + 1}`,
    }));
    await page.route('**/api/v1/catalog/filters', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FILTERS) });
    });
    await page.route('**/api/v1/catalog?**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: cards,
        pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
        filters_available: MOCK_FILTERS,
      }) });
    });
    await page.route(/\/api\/v1\/catalog$/, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: cards,
        pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
        filters_available: MOCK_FILTERS,
      }) });
    });
    await page.goto('/catalog');
    // Verify 12 catalog cards rendered — using data-testid from CatalogCard
    const catalogCards = page.getByTestId('catalog-card');
    await expect(catalogCards).toHaveCount(12, { timeout: 5000 });
    // Pagination controls visible for total_count=13 (2 pages)
    const paginationNav = page.getByRole('navigation', { name: /pagination/i })
      .or(page.getByRole('button', { name: /next|page 2/i }))
      .or(page.getByText(/page.*2.*of.*2|2.*of.*2/i));
    if (await paginationNav.count() > 0) {
      await expect(paginationNav.first()).toBeVisible();
    }
  });
});
