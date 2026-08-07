'use strict';

/**
 * engagement.routes.js
 *
 * Route registration for engagement endpoints:
 *   POST /api/v1/engagement-requests (PUBLIC + rate limiter)
 *   GET /api/v1/admin/engagement-requests (CURATOR-gated)
 *   PATCH /api/v1/admin/engagement-requests/:request_id (CURATOR-gated)
 *
 * Auth is session-based (req.session.user) consistent with Wave 2c record routes.
 * TechArch §5.2: CURATOR role required for admin endpoints.
 */

const express = require('express');
const { engagementLimiter } = require('../middleware/rateLimiter');
const {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
} = require('../handlers/engagement.handler');

const router = express.Router();

/**
 * Session-based CURATOR auth guard (mirrors requireCurator in recordHandler.js).
 * Reads from req.session.user (set by session middleware in tests and by OIDC in production).
 *
 * Returns:
 *   401 UNAUTHORIZED if no session
 *   403 ACCESS_DENIED if role is not CURATOR or ADMIN
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

// POST /api/v1/engagement-requests — PUBLIC (no auth required)
// Rate limited to 10 requests/hour per IP (TechArch T-08-07, FRD §F07 §Validation)
router.post('/engagement-requests', engagementLimiter, createEngagementRequest);

// GET /api/v1/admin/engagement-requests — CURATOR only
router.get('/admin/engagement-requests', requireCurator, listEngagementRequests);

// PATCH /api/v1/admin/engagement-requests/:request_id — CURATOR only
router.patch('/admin/engagement-requests/:request_id', requireCurator, updateEngagementRequestStatus);

module.exports = router;
