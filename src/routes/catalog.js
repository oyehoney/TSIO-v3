'use strict';
const express = require('express');
const { handleList, handleFilters } = require('../handlers/CatalogHandler');

/**
 * Catalog router factory.
 * Accepts getPool function so pool is lazily initialized.
 * @param {function} getPool
 * @returns {express.Router}
 */
function catalogRouter(getPool) {
  const router = express.Router();

  // GET /api/v1/catalog/filters  (must come before /:id style routes to avoid ambiguity)
  router.get('/filters', async (req, res) => {
    await handleFilters(getPool(), req, res);
  });

  // GET /api/v1/catalog
  router.get('/', async (req, res) => {
    await handleList(getPool(), req, res);
  });

  return router;
}

module.exports = catalogRouter;
