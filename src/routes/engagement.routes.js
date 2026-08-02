'use strict';

/**
 * engagement.routes.js
 *
 * Route registration for EngagementService endpoints.
 *
 * Routes:
 *   POST   /api/v1/engagement-requests           — PUBLIC (rate-limited)
 *   GET    /api/v1/admin/engagement-requests      — CURATOR (auth-gated)
 *   PATCH  /api/v1/admin/engagement-requests/:id — CURATOR (auth-gated)
 *
 * Auth middleware: authenticateOidc + requireCurator from Wave 3a (plan 06).
 * Rate limiting: engagementLimiter from Wave 3b (plan 07) — 10 requests/hour per IP.
 *
 * NOTE: For test environments that set req.session.user directly (not req.user),
 * the handler falls back to req.session.user for curatorUserId extraction.
 * In production, authenticateOidc populates req.user from the validated session.
 */

const { Router } = require('express');
const { engagementLimiter } = require('../middleware/rateLimiter');
const { authenticateOidc } = require('../middleware/auth');
const requireCurator = require('../middleware/requireCurator');
const {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
} = require('../handlers/engagement.handler');

const router = Router();

// ── Public endpoint (no auth, rate-limited) ───────────────────────────────────
// POST /api/v1/engagement-requests
// Rate limit: 10 requests/hour per IP (T-08-07 mitigation)
// CAPTCHA validation is enforced inside EngagementService (T-08-01 mitigation)
router.post(
  '/engagement-requests',
  engagementLimiter,
  createEngagementRequest,
);

// ── CURATOR-gated endpoints ───────────────────────────────────────────────────
// T-08-04: Both admin engagement routes require CURATOR role (401/403 enforcement)

// GET /api/v1/admin/engagement-requests — paginated list with filters
router.get(
  '/admin/engagement-requests',
  authenticateOidc,
  requireCurator,
  listEngagementRequests,
);

// PATCH /api/v1/admin/engagement-requests/:request_id — update status + curator_note
router.patch(
  '/admin/engagement-requests/:request_id',
  authenticateOidc,
  requireCurator,
  updateEngagementRequestStatus,
);

module.exports = router;
