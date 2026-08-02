'use strict';

/**
 * settings.routes.js
 *
 * Route registration for SettingsService endpoints.
 *
 * Routes:
 *   GET /api/v1/admin/settings — CURATOR (auth-gated)
 *   PUT /api/v1/admin/settings — CURATOR (auth-gated)
 *
 * Both routes require CURATOR authentication per TechArch §5.4:
 *   "hub_settings (including routing email) is CURATOR-only — never exposed on public endpoints."
 *
 * Auth pattern: requireCurator checks req.user (set by authenticateOidc in production,
 * or by app.js session→user mapping for test environments that inject req.session.user).
 * Using requireCurator directly (same pattern as submissions.js) to remain testable
 * without live OIDC infrastructure.
 *
 * T-08-06 mitigation: requireCurator applied to both routes.
 * T-08-05 mitigation: engagement_routing_email is validated in SettingsService
 *                     before persistence (email format + non-blank checks).
 */

const { Router } = require('express');
const requireCurator = require('../middleware/requireCurator');
const { getAllSettings, updateSettings } = require('../handlers/settings.handler');

const router = Router();

// ── CURATOR-gated endpoints ───────────────────────────────────────────────────
// requireCurator checks req.user which is set by:
//   - authenticateOidc middleware in production (full OIDC stack)
//   - app.js session→user mapping in test environments
//
// In production deployment, mount these routes behind authenticateOidc in server.js.

// GET /api/v1/admin/settings — returns all hub_settings rows (CURATOR-only, T-08-06)
router.get(
  '/admin/settings',
  requireCurator,
  getAllSettings,
);

// PUT /api/v1/admin/settings — bulk update settings (CURATOR-only, T-08-05)
router.put(
  '/admin/settings',
  requireCurator,
  updateSettings,
);

module.exports = router;
