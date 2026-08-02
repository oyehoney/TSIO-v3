'use strict';
// src/routes/submissions.js
const express = require('express');
const router = express.Router();
const { submissionLimiter } = require('../middleware/rateLimiter');
const requireCurator = require('../middleware/requireCurator');
const {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
} = require('../handlers/SubmissionHandler');

// ── Public submission endpoints (rate-limited by submissionLimiter: 5/hr per IP) ────
// Rate limiter applied as FIRST middleware on public POST routes — T-07-02 mitigation
// POST /api/v1/opportunity-submissions
router.post('/opportunity-submissions', submissionLimiter, postOpportunitySubmission);

// POST /api/v1/contribution-submissions
router.post('/contribution-submissions', submissionLimiter, postContributionSubmission);

// ── CURATOR-protected admin endpoints ─────────────────────────────────────────
// T-07-06: All admin endpoints require CURATOR or ADMIN role via requireCurator middleware

// GET /api/v1/admin/opportunity-submissions — paginated list, submitted_at DESC
router.get('/admin/opportunity-submissions', requireCurator, getOpportunitySubmissions);

// PATCH /api/v1/admin/opportunity-submissions/:id — update disposition
router.patch('/admin/opportunity-submissions/:id', requireCurator, patchOpportunityDisposition);

// GET /api/v1/admin/contribution-submissions — paginated list, submitted_at DESC
router.get('/admin/contribution-submissions', requireCurator, getContributionSubmissions);

// PATCH /api/v1/admin/contribution-submissions/:id — update disposition
router.patch('/admin/contribution-submissions/:id', requireCurator, patchContributionDisposition);

module.exports = router;
