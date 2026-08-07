// devAuthBypass.js — Preview / development auth bypass middleware
//
// When DEV_AUTH_BYPASS=true AND NODE_ENV !== 'production', injects a synthetic
// CURATOR session into every request so all CURATOR-gated endpoints work without
// a real Azure AD OIDC configuration.
//
// This is safe because:
//   1. The guard is double-gated: env var AND non-production NODE_ENV.
//   2. The synthetic user_id is a fixed well-known UUID (not a real user).
//   3. This file is never imported in production (createApp skips it unless flag is set).
//
// To enable: set DEV_AUTH_BYPASS=true in docker-compose or .env (non-prod only).

'use strict';

const DEV_CURATOR_USER = {
  user_id:      '00000000-0000-0000-0000-000000000001',
  email:        'preview-curator@tsio.example',
  display_name: 'Preview Curator',
  role:         'CURATOR',
  is_active:    true,
};

/**
 * Returns Express middleware that injects a synthetic CURATOR session.
 * No-op in production regardless of env var.
 */
function devAuthBypass() {
  if (process.env.NODE_ENV === 'production') {
    // Safety net: always a no-op in production even if env var is set
    return (_req, _res, next) => next();
  }

  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return (_req, _res, next) => next();
  }

  return (req, _res, next) => {
    // Ensure session object exists (may be a real session store or empty object)
    if (!req.session) req.session = {};
    // Only inject if no real session user already present
    if (!req.session.user) {
      req.session.user = DEV_CURATOR_USER;
    }
    // Also set req.user for middleware that reads from there
    if (!req.user) {
      req.user = req.session.user;
    }
    next();
  };
}

module.exports = { devAuthBypass, DEV_CURATOR_USER };
