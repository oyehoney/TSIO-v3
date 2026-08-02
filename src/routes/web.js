'use strict';

/**
 * Web routes for server-side rendered pages.
 * These routes serve EJS templates for the public-facing UI.
 *
 * Routes:
 *   GET /          → redirect to /catalog
 *   GET /catalog   → CatalogPage (EJS template with initial server-side data)
 *   GET /submit-opportunity → placeholder stub
 *   GET /share-innovation   → placeholder stub
 *   GET /search             → placeholder stub
 *   GET /records/:id        → RecordPage (EJS template — Wave 4c, Plan 11)
 */

const express = require('express');
const { getDb } = require('../db');
const { listCatalog, getFilterOptions } = require('../services/CatalogService');

const MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

const REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

/**
 * Parse a query param that may be a single string or an array of strings.
 * Always returns an array.
 */
function parseMulti(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Build active filter state from request query params.
 * @param {object} query - req.query
 * @returns {object} ActiveFilters
 */
function parseActiveFilters(query) {
  return {
    maturity_level: parseMulti(query.maturity_level),
    review_status: parseMulti(query.review_status),
    contributing_office: parseMulti(query.contributing_office),
    mission_area: parseMulti(query.mission_area),
    technology_area: parseMulti(query.technology_area),
    reuse_potential: query.reuse_potential || '',
    sort: ['recent', 'maturity', 'relevance'].includes(query.sort) ? query.sort : 'recent',
    page: Math.max(1, parseInt(query.page, 10) || 1),
  };
}

/**
 * Check whether any filter is active.
 * @param {object} filters
 * @returns {boolean}
 */
function hasActiveFilters(filters) {
  return (
    filters.maturity_level.length > 0 ||
    filters.review_status.length > 0 ||
    filters.contributing_office.length > 0 ||
    filters.mission_area.length > 0 ||
    filters.technology_area.length > 0 ||
    Boolean(filters.reuse_potential)
  );
}

/**
 * Web router factory.
 * @param {function} getPool - returns pg.Pool
 * @returns {express.Router}
 */
function webRouter(getPool) {
  const router = express.Router();

  // GET / → redirect to /catalog
  router.get('/', (req, res) => {
    // Preserve query params when redirecting (e.g., ?maturity_level=...)
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, '/catalog' + qs);
  });

  // GET /catalog — CatalogPage
  router.get('/catalog', async (req, res) => {
    try {
      const activeFilters = parseActiveFilters(req.query);
      const pagination = {
        page: activeFilters.page,
        page_size: 12,
      };

      // Fetch data in parallel: catalog records + filter options
      const [catalogResult, filterOptions] = await Promise.all([
        listCatalog(getPool(), activeFilters, pagination).catch(() => ({
          data: [],
          pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
        })),
        getFilterOptions(getPool()).catch(() => ({
          maturity_levels: [],
          review_statuses: [],
          contributing_offices: [],
          mission_area_tags: [],
          technology_area_tags: [],
          reuse_potentials: [],
        })),
      ]);

      res.render('catalog', {
        pageTitle: 'Innovation Catalog',
        cards: catalogResult.data,
        pagination: catalogResult.pagination,
        filterOptions,
        activeFilters,
        hasActiveFilters: hasActiveFilters(activeFilters),
        maturityLabels: MATURITY_LABELS,
        reviewStatusLabels: REVIEW_STATUS_LABELS,
      });
    } catch (err) {
      console.error('CatalogPage render error:', err);
      res.status(500).render('catalog', {
        pageTitle: 'Innovation Catalog',
        cards: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
        filterOptions: null,
        activeFilters: parseActiveFilters(req.query),
        hasActiveFilters: false,
        maturityLabels: MATURITY_LABELS,
        reviewStatusLabels: REVIEW_STATUS_LABELS,
        error: 'The catalog is temporarily unavailable. Please try again shortly.',
      });
    }
  });

  // GET /submit-opportunity — stub placeholder (Wave 5)
  router.get('/submit-opportunity', (req, res) => {
    res.render('placeholder', { pageTitle: 'Submit a Mission Problem' });
  });

  // GET /share-innovation — stub placeholder (Wave 5)
  router.get('/share-innovation', (req, res) => {
    res.render('placeholder', { pageTitle: 'Share Your Innovation Work' });
  });

  // GET /search — SearchPage (Wave 4b, Plan 10)
  const { handleSearchPage } = require('../handlers/searchPageHandler');
  router.get('/search', handleSearchPage);

  // GET /records/:id — Innovation Record page (Wave 4c, Plan 11)
  // Fetches record from recordService and renders EJS template with PerspectiveToggle,
  // TrustDisclaimersSection, ArtifactLinks, and NextActionPanel.
  // Security: T-11-03 — ?view= param validated against allowlist before use.
  // Security: T-11-02 — 404 from recordService renders record-not-found.ejs with no record data.
  const recordService = require('../services/recordService');

  router.get('/records/:id', async (req, res) => {
    const { id } = req.params;

    // T-11-03: Validate ?view= param against allowlist — any other value defaults to 'executive'
    const rawView = req.query.view;
    const currentView = (rawView === 'technical') ? 'technical' : 'executive';

    try {
      // PUBLIC role — non-published records return 404 from recordService
      const record = await recordService.getRecord(getDb(), id, 'PUBLIC');

      res.render('record', {
        pageTitle: record.title,
        record,
        currentView,
      });
    } catch (err) {
      if (err && err.code === 'RECORD_NOT_FOUND') {
        return res.status(404).render('record-not-found', {});
      }
      // Unexpected error — render 404 page (no internal error details exposed)
      console.error('RecordPage render error:', err);
      return res.status(404).render('record-not-found', {});
    }
  });

  return router;
}

module.exports = webRouter;
