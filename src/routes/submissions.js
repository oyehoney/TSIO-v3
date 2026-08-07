'use strict';
const express = require('express');
const router = express.Router();
const { submissionLimiter } = require('../middleware/rateLimiter');

/**
 * Session-based CURATOR auth guard.
 * Reads from req.session.user (set by session middleware in tests; by OIDC in production).
 * Consistent with engagement.routes.js and recordHandler.js auth pattern.
 */
function requireCurator(req, res, next) {
  // Test-only: accept x-test-user header for integration test session injection
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-user']) {
    try {
      const testUser = JSON.parse(req.headers['x-test-user']);
      req.session = req.session || {};
      req.session.user = testUser;
    } catch (e) {
      // Ignore malformed header
    }
  }
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

const {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
} = require('../handlers/SubmissionHandler');

// ── Public submission endpoints (rate-limited) ────────────────────────────────
// POST /api/v1/opportunity-submissions
router.post('/opportunity-submissions', submissionLimiter, postOpportunitySubmission);

// POST /api/v1/contribution-submissions
router.post('/contribution-submissions', submissionLimiter, postContributionSubmission);

// ── CURATOR-protected admin endpoints ─────────────────────────────────────────
// GET /api/v1/admin/opportunity-submissions
router.get('/admin/opportunity-submissions', requireCurator, getOpportunitySubmissions);

// PATCH /api/v1/admin/opportunity-submissions/:id
router.patch('/admin/opportunity-submissions/:id', requireCurator, patchOpportunityDisposition);

// GET /api/v1/admin/contribution-submissions
router.get('/admin/contribution-submissions', requireCurator, getContributionSubmissions);

// PATCH /api/v1/admin/contribution-submissions/:id
router.patch('/admin/contribution-submissions/:id', requireCurator, patchContributionDisposition);

module.exports = router;
