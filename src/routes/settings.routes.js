'use strict';

/**
 * settings.routes.js
 *
 * Route registration for hub settings endpoints (all CURATOR-gated):
 *   GET /api/v1/admin/settings (CURATOR)
 *   PUT /api/v1/admin/settings (CURATOR — bulk update)
 *
 * TechArch §5.4: hub_settings is only exposed on CURATOR-authenticated routes.
 * TechArch §5.2: CURATOR role required for all /admin/* endpoints.
 */

const express = require('express');
const { getAllSettings, updateSettings } = require('../handlers/settings.handler');

const router = express.Router();

/**
 * Session-based CURATOR auth guard (mirrors requireCurator in recordHandler.js).
 * Reads from req.session.user (set by session middleware in tests and by OIDC in production).
 */
function requireCurator(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }
  const { role } = req.session.user;
  if (role !== 'CURATOR' && role !== 'ADMIN') {
    return res.status(403).json({
      error: { code: 'ACCESS_DENIED', message: 'CURATOR or ADMIN role required.' },
    });
  }
  return next();
}

// GET /api/v1/admin/settings — CURATOR only (TechArch §5.4 §T-08-06)
router.get('/admin/settings', requireCurator, getAllSettings);

// PUT /api/v1/admin/settings — CURATOR only (TechArch §T-08-05)
router.put('/admin/settings', requireCurator, updateSettings);

module.exports = router;
