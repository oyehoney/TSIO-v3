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
 * Auth pattern: requireCurator checks req.user (set by authenticateOidc in production,
 * or by app.js session→user mapping for test environments that inject req.session.user).
 * Rate limiting: engagementLimiter from Wave 3b (plan 07) — 10 requests/hour per IP.
 *
 * NOTE: authenticateOidc is used for production OIDC sessions. In test environments,
 * app.js maps req.session.user → req.user, so requireCurator works without OIDC.
 * For the admin routes we use requireCurator directly (same pattern as submissions.js)
 * to remain testable without live OIDC infrastructure.
 */

const { Router } = require('express');
const { engagementLimiter } = require('../middleware/rateLimiter');
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
// T-08-04: Both admin engagement routes require CURATOR role (401/403 enforcement).
// requireCurator checks req.user which is set by:
//   - authenticateOidc middleware in production (full OIDC stack)
//   - app.js session→user mapping in test environments
//
// In production deployment, mount these routes behind authenticateOidc in server.js
// or use the admin router that already has authenticateOidc applied.

// GET /api/v1/admin/engagement-requests — paginated list with filters
router.get(
  '/admin/engagement-requests',
  requireCurator,
  listEngagementRequests,
);

// PATCH /api/v1/admin/engagement-requests/:request_id — update status + curator_note
router.patch(
  '/admin/engagement-requests/:request_id',
  requireCurator,
  updateEngagementRequestStatus,
);

module.exports = router;
