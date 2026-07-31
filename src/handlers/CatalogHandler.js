'use strict';
const { listCatalog, getFilterOptions } = require('../services/CatalogService');

/**
 * Parse a query param that may be a single string or an array of strings.
 * Always returns an array (empty if undefined).
 */
function parseMulti(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * handleList — GET /api/v1/catalog
 */
async function handleList(pool, req, res) {
  try {
    const filters = {
      maturity_level: parseMulti(req.query.maturity_level),
      review_status: parseMulti(req.query.review_status),
      contributing_office: parseMulti(req.query.contributing_office),
      mission_area: parseMulti(req.query.mission_area),
      technology_area: parseMulti(req.query.technology_area),
      reuse_potential: req.query.reuse_potential || undefined,
      sort: req.query.sort || 'recent',
    };

    const pagination = {
      page: req.query.page,
      page_size: req.query.page_size,
    };

    const result = await listCatalog(pool, filters, pagination);
    return res.json(result);
  } catch (err) {
    console.error('CatalogHandler.handleList error:', err);
    return res.status(503).json({
      error: {
        code: 'CATALOG_UNAVAILABLE',
        message: 'The catalog is temporarily unavailable. Please try again shortly.',
      },
    });
  }
}

/**
 * handleFilters — GET /api/v1/catalog/filters
 */
async function handleFilters(pool, req, res) {
  try {
    const filters = await getFilterOptions(pool);
    return res.json(filters);
  } catch (err) {
    console.error('CatalogHandler.handleFilters error:', err);
    return res.status(503).json({
      error: {
        code: 'CATALOG_UNAVAILABLE',
        message: 'The catalog is temporarily unavailable. Please try again shortly.',
      },
    });
  }
}

module.exports = { handleList, handleFilters };
