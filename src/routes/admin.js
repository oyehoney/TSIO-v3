// AdminHandler — CURATOR-protected admin API routes
// TechArch §4.3 CURATOR-Protected Endpoints: all /api/v1/admin/* routes
// FRD §F08 API Surface: all admin endpoints
//
// Wave 3b (SubmissionService) and Wave 3c (EngagementService/SettingsService) will
// replace the 501 stubs for their respective route groups.
// Wave 6 (admin frontend) will build UI against these route contracts.

'use strict';

const { Router } = require('express');
const requireCurator = require('../middleware/requireCurator');

const router = Router();

// Apply CURATOR role check to all routes in this router
// TechArch §5.2: "All /admin/* routes require authenticated CURATOR session"
router.use(requireCurator);

const NOT_IMPLEMENTED = (req, res) =>
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'This endpoint is not yet implemented.' } });

// ── Records (admin view) ─────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/records — List all records (all states) — CURATOR
router.get('/records', NOT_IMPLEMENTED);

// ── Dashboard ────────────────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/dashboard-summary — Return dashboard summary counts — CURATOR
// Returns DashboardSummary: { published_records, draft_review_records,
//   pending_opportunity_submissions, pending_contribution_submissions,
//   recent_engagement_requests_7d }
router.get('/dashboard-summary', NOT_IMPLEMENTED);

// ── Opportunity Submissions ──────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/opportunity-submissions — List opportunity submissions — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/opportunity-submissions/:id — Update submission disposition — CURATOR
// disposition values: UNDER_REVIEW | ACCEPTED_FOR_CONSIDERATION | DECLINED | LINKED_TO_RECORD
router.get('/opportunity-submissions', NOT_IMPLEMENTED);
router.patch('/opportunity-submissions/:id', NOT_IMPLEMENTED);

// ── Contribution Submissions ─────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/contribution-submissions — List contribution submissions — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/contribution-submissions/:id — Update contribution disposition — CURATOR
// TechArch §4.3: POST /api/v1/admin/contribution-submissions/:id/create-record — Create Innovation Record from contribution — CURATOR
router.get('/contribution-submissions', NOT_IMPLEMENTED);
router.patch('/contribution-submissions/:id', NOT_IMPLEMENTED);
router.post('/contribution-submissions/:id/create-record', NOT_IMPLEMENTED);

// ── Engagement Requests ──────────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/engagement-requests — List all engagement requests — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/engagement-requests/:id — Update engagement request status — CURATOR
// status values: SUBMITTED | IN_PROGRESS | COMPLETED | NO_ACTION
router.get('/engagement-requests', NOT_IMPLEMENTED);
router.patch('/engagement-requests/:id', NOT_IMPLEMENTED);

// ── Hub Settings ─────────────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/settings — Get all Hub settings — CURATOR
// TechArch §4.3: PUT /api/v1/admin/settings — Update Hub settings (bulk) — CURATOR
// HubSettingsBulkUpdateRequest: { settings: [{ setting_key, setting_value }] }
router.get('/settings', NOT_IMPLEMENTED);
router.put('/settings', NOT_IMPLEMENTED);

// ── Content Model Reference ──────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/maturity-reference — Get maturity level definitions — CURATOR
// TechArch §4.3: GET /api/v1/admin/review-status-reference — Get review status definitions — CURATOR
// FRD §F09: 5 maturity levels + 7 review statuses with definitions
router.get('/maturity-reference', NOT_IMPLEMENTED);
router.get('/review-status-reference', NOT_IMPLEMENTED);

module.exports = router;
