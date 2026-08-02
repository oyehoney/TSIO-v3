'use strict';

/**
 * searchPageHandler.js — Server-side handler for GET /search
 *
 * Renders the Search Results page (EJS template: src/views/search.ejs).
 * Calls searchService.js directly (JS equivalent of SearchService.ts) using
 * the Knex DB instance attached to req.db by app.js middleware.
 *
 * Architecture: server-side rendered, URL is source of truth for all state.
 * Filter changes = form submit → new URL → re-render from server.
 *
 * States rendered:
 *   - blank     : q missing or whitespace → show "Enter a search term" prompt
 *   - error     : QUERY_TOO_LONG or SEARCH_UNAVAILABLE or generic
 *   - empty     : valid q, zero results → empty state with CTAs
 *   - results   : valid q, results found → ranked result cards + filter panel
 *
 * Security:
 *   - highlight_snippet is ts_headline output from PostgreSQL containing ONLY
 *     <mark> tags (StartSel=<mark> StopSel=</mark> per searchService.js).
 *     Rendered via EJS <%- %> (unescaped). The DB search query guarantees
 *     only <mark> appears here (T-04-04 / T-10-01).
 *   - Query string is echoed via EJS <%= %> (HTML-escaped) in page headers —
 *     prevents reflected XSS (T-10-02).
 *   - All filter params are validated against enum whitelists before use (T-10-03).
 *
 * Test fixture mode (NODE_ENV=test + TEST_MOCK_SEARCH=true):
 *   When TEST_MOCK_SEARCH is set, the handler uses in-memory mock fixtures
 *   instead of querying the database. This allows Playwright e2e tests to run
 *   without a live PostgreSQL database. The mock simulates all search states:
 *     - q containing 'empty'/'xyzzy'/'no results' → empty state
 *     - q containing 'unavailable' → SEARCH_UNAVAILABLE error
 *     - multi-page: q containing 'multi' → 25 total results (3 pages)
 *     - all other non-blank q → 1 result (MOCK_SEARCH_RESULT fixture)
 */

const { search: searchService } = require('../services/searchService');

// ── Test fixture data (activated by TEST_MOCK_SEARCH=true) ────────────────────

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

/**
 * Return mock search results for e2e tests (no DB required).
 * Activated when TEST_MOCK_SEARCH=true.
 *
 * @param {string} q - search query
 * @param {string[]} maturityLevel - filter values
 * @returns {{ data: object[], pagination: object }|null} null means "empty"
 */
function getMockResults(q, maturityLevel) {
  const lq = q.toLowerCase();

  // Simulate unavailability error
  if (lq.includes('unavailable')) {
    throw new Error('SEARCH_UNAVAILABLE_MOCK');
  }

  // Simulate zero results
  if (lq.includes('xyzzy') || lq.includes('empty') || lq.includes('no results') ||
      lq.includes('remote hearing scheduling')) {
    return { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 } };
  }

  // Simulate multi-page results
  if (lq.includes('multi')) {
    return {
      data: [MOCK_SEARCH_RESULT],
      pagination: { page: 1, page_size: 12, total_count: 25, total_pages: 3 },
    };
  }

  // Default: return one result (filtered if maturity filter active and doesn't match)
  if (maturityLevel.length > 0 && !maturityLevel.includes(MOCK_SEARCH_RESULT.maturity_level)) {
    return { data: [], pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 } };
  }

  return {
    data: [MOCK_SEARCH_RESULT],
    pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
  };
}

const VALID_MATURITY = [
  'IDEA',
  'EXPERIMENT_POC',
  'PROTOTYPE_PILOT',
  'PRODUCTION_VALIDATED',
  'ARCHIVED',
];

const VALID_REVIEW_STATUS = [
  'SUBMITTED',
  'CURATED',
  'TECHNICALLY_REVIEWED',
  'SECURITY_REVIEWED',
  'POLICY_REVIEWED',
  'VALIDATED_FOR_REUSE',
  'SUPERSEDED_RETIRED',
];

const VALID_REUSE_POTENTIAL = ['HIGH', 'MEDIUM', 'LOW'];

/**
 * Normalize a single string or array of strings to an array.
 * @param {string|string[]|undefined} v
 * @returns {string[]}
 */
function toArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Filter array of strings to only valid enum values.
 * @param {string[]} values
 * @param {string[]} valid
 * @returns {string[]}
 */
function filterValidEnum(values, valid) {
  return values.filter(function(v) { return valid.includes(v); });
}

/**
 * GET /search — render the search results page.
 */
async function handleSearchPage(req, res) {
  const rawQ = (req.query.q || '').trim();

  // Parse filter params from URL
  const maturityLevel = filterValidEnum(
    toArray(req.query.maturity_level),
    VALID_MATURITY
  );
  const reviewStatus = filterValidEnum(
    toArray(req.query.review_status),
    VALID_REVIEW_STATUS
  );
  const contributingOffice = toArray(req.query.contributing_office);
  const reusePotential = VALID_REUSE_POTENTIAL.includes(req.query.reuse_potential || '')
    ? req.query.reuse_potential
    : '';

  let page = parseInt(req.query.page || '1', 10);
  if (isNaN(page) || page < 1) page = 1;

  // Common template locals
  const filters = {
    maturity_level: maturityLevel,
    review_status: reviewStatus,
    contributing_office: contributingOffice,
    reuse_potential: reusePotential,
    page,
  };

  const baseLocals = {
    q: rawQ,
    filters,
    results: [],
    pagination: null,
    state: 'blank',
    errorCode: null,
    errorMessage: null,
  };

  // Blank/whitespace query — render prompt
  if (!rawQ) {
    return res.render('search', { ...baseLocals, state: 'blank' });
  }

  // Query too long — early rejection (mirrors SearchHandler.ts T-04-03)
  if (rawQ.length > 500) {
    return res.render('search', {
      ...baseLocals,
      state: 'error',
      errorCode: 'QUERY_TOO_LONG',
      errorMessage: 'Your search query is too long. Please shorten it to 500 characters or fewer.',
    });
  }

  // ── Test fixture mode ─────────────────────────────────────────────────────
  // When TEST_MOCK_SEARCH=true (set in playwright.config.ts for e2e tests),
  // bypass DB and return deterministic mock data based on query content.
  const useMockSearch = process.env.TEST_MOCK_SEARCH === 'true';

  if (useMockSearch) {
    try {
      const result = getMockResults(rawQ, maturityLevel);

      if (!result.data || result.data.length === 0) {
        return res.render('search', { ...baseLocals, state: 'empty' });
      }

      return res.render('search', {
        ...baseLocals,
        state: 'results',
        results: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      if (err.message === 'SEARCH_UNAVAILABLE_MOCK') {
        return res.render('search', {
          ...baseLocals,
          state: 'error',
          errorCode: 'SEARCH_UNAVAILABLE',
          errorMessage: 'Search is temporarily unavailable. Try browsing the catalog.',
        });
      }
      return res.render('search', {
        ...baseLocals,
        state: 'error',
        errorCode: 'UNKNOWN',
        errorMessage: 'An unexpected error occurred.',
      });
    }
  }
  // ── End test fixture mode ──────────────────────────────────────────────────

  // Get Knex DB from req (injected by app.js middleware)
  const db = req.db;
  if (!db) {
    console.error('[SearchPage] No DB instance on req — database not configured');
    return res.render('search', {
      ...baseLocals,
      state: 'error',
      errorCode: 'SEARCH_UNAVAILABLE',
      errorMessage: 'Search is temporarily unavailable. Try browsing the catalog.',
    });
  }

  try {
    const result = await searchService(
      {
        q: rawQ,
        maturity_level: maturityLevel.length > 0 ? maturityLevel : undefined,
        review_status: reviewStatus.length > 0 ? reviewStatus : undefined,
        contributing_office: contributingOffice.length > 0 ? contributingOffice : undefined,
        reuse_potential: reusePotential || undefined,
        page,
        page_size: 12,
      },
      'PUBLIC', // Search page is always public-facing
      db
    );

    // Zero results
    if (!result.data || result.data.length === 0) {
      return res.render('search', { ...baseLocals, state: 'empty' });
    }

    // Success — results found
    return res.render('search', {
      ...baseLocals,
      state: 'results',
      results: result.data,
      pagination: result.pagination,
    });

  } catch (err) {
    console.error('[SearchPage] Search service error:', err && err.message);

    // DB connection errors and other service errors → SEARCH_UNAVAILABLE
    return res.render('search', {
      ...baseLocals,
      state: 'error',
      errorCode: 'SEARCH_UNAVAILABLE',
      errorMessage: 'Search is temporarily unavailable. Try browsing the catalog.',
    });
  }
}

module.exports = { handleSearchPage };
