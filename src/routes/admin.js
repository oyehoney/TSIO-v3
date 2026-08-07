// AdminHandler — CURATOR-protected admin API routes
// TechArch §4.3 CURATOR-Protected Endpoints: all /api/v1/admin/* routes
// FRD §F08 API Surface: all admin endpoints
//
// Mounted in app.js at /api/v1/admin — so route paths here are relative
// (e.g. router.get('/records') handles GET /api/v1/admin/records).
//
// NOTE: submissions/engagement/settings admin routes are handled by their
// dedicated routers (submissions.js, engagement.routes.js, settings.routes.js)
// to keep concerns separated and avoid duplicate route registration.
// This router covers: dashboard-summary, records list, content model reference,
// and create-record-from-contribution.

'use strict';

const { Router } = require('express');
const { getDb }  = require('../db');

const router = Router();

// ── Auth guard ───────────────────────────────────────────────────────────────
// Reads from req.session.user (set by buildSessionMiddleware + OIDC callback).
// TechArch §5.2: All /admin/* routes require authenticated CURATOR session.
function requireCurator(req, res, next) {
  // Test shim: accept x-test-user header for integration test session injection
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-user']) {
    try {
      const testUser = JSON.parse(req.headers['x-test-user']);
      req.session = req.session || {};
      req.session.user = testUser;
    } catch (_) { /* ignore malformed header */ }
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

// Apply CURATOR role check to all routes in this router.
router.use(requireCurator);

// ── Content model reference data ─────────────────────────────────────────────
// TechArch §3.2 CHECK constraints — exact enum values from DDL.

const MATURITY_LEVELS = [
  {
    value: 'IDEA',
    label: 'Idea',
    definition: 'Concept stage — no implementation or testing has occurred. Problem is identified; approach is hypothesized.',
    order: 1,
  },
  {
    value: 'EXPERIMENT_POC',
    label: 'Experiment / POC',
    definition: 'A time-boxed exploration or proof-of-concept has been run. Early findings exist but the approach has not been validated at scale.',
    order: 2,
  },
  {
    value: 'PROTOTYPE_PILOT',
    label: 'Prototype / Pilot',
    definition: 'A working prototype or limited-scope pilot has been built and tested with real users or data. Key risks are understood.',
    order: 3,
  },
  {
    value: 'PRODUCTION_VALIDATED',
    label: 'Production / Validated Pattern',
    definition: 'The solution has been deployed in a production-like environment and validated through real use. Reuse guidance is available.',
    order: 4,
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    definition: 'Work was stopped or superseded. Findings are preserved for institutional memory but the approach is not recommended for new adoption.',
    order: 5,
  },
];

const REVIEW_STATUSES = [
  {
    value: 'SUBMITTED',
    label: 'Submitted',
    definition: 'Record has been submitted for curation review. Not yet curated or published.',
    order: 1,
  },
  {
    value: 'CURATED',
    label: 'Curated',
    definition: 'I&R team has reviewed and structured the record. Content is complete and accurate.',
    order: 2,
  },
  {
    value: 'TECHNICALLY_REVIEWED',
    label: 'Technically Reviewed',
    definition: 'A technical SME has reviewed the architecture, tools, and technical claims. Findings are verified.',
    order: 3,
  },
  {
    value: 'SECURITY_REVIEWED',
    label: 'Security Reviewed',
    definition: 'A security review has been completed covering the approach, dependencies, and any known vulnerabilities or constraints.',
    order: 4,
  },
  {
    value: 'POLICY_REVIEWED',
    label: 'Policy Reviewed',
    definition: 'Policy and legal review has been completed. Use constraints and compliance considerations are documented.',
    order: 5,
  },
  {
    value: 'VALIDATED_FOR_REUSE',
    label: 'Validated for Reuse',
    definition: 'The record has passed all required reviews and is validated for reuse consideration. Local review by the adopting court is still required.',
    order: 6,
  },
  {
    value: 'SUPERSEDED_RETIRED',
    label: 'Superseded / Retired',
    definition: 'This review status applies to records that have been superseded by a newer effort or retired from active consideration.',
    order: 7,
  },
];

// ── Dashboard ────────────────────────────────────────────────────────────────
// GET /api/v1/admin/dashboard-summary
// Returns summary counts for the admin dashboard.
// FRD §F08: DashboardSummary shape.
// Also used by useAdminAuth.ts to verify a valid CURATOR session (200 = authenticated).
router.get('/dashboard-summary', async (req, res) => {
  const db = req.db || getDb();
  try {
    const [
      publishedResult,
      draftReviewResult,
      pendingOppsResult,
      pendingContribsResult,
      recentEngagementsResult,
    ] = await Promise.all([
      // Published records
      db('innovation_records')
        .whereNull('deleted_at')
        .where('publication_state', 'PUBLISHED')
        .count('record_id as count')
        .first(),

      // Draft + under-review records (curator workload)
      db('innovation_records')
        .whereNull('deleted_at')
        .whereIn('publication_state', ['DRAFT', 'UNDER_REVIEW'])
        .count('record_id as count')
        .first(),

      // Pending opportunity submissions (not yet actioned)
      db('opportunity_submissions')
        .where('disposition', 'PENDING')
        .count('submission_id as count')
        .first(),

      // Pending contribution submissions (not yet actioned)
      db('contribution_submissions')
        .where('disposition', 'PENDING')
        .count('submission_id as count')
        .first(),

      // Engagement requests in last 7 days
      db('engagement_requests')
        .where('submitted_at', '>=', db.raw("NOW() - INTERVAL '7 days'"))
        .count('request_id as count')
        .first(),
    ]);

    return res.status(200).json({
      published_records:                  parseInt(publishedResult.count,           10) || 0,
      draft_review_records:               parseInt(draftReviewResult.count,         10) || 0,
      pending_opportunity_submissions:    parseInt(pendingOppsResult.count,         10) || 0,
      pending_contribution_submissions:   parseInt(pendingContribsResult.count,     10) || 0,
      recent_engagement_requests_7d:      parseInt(recentEngagementsResult.count,   10) || 0,
    });
  } catch (err) {
    console.error('dashboard-summary error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard summary.' } });
  }
});

// ── Records (admin view — all states) ────────────────────────────────────────
// GET /api/v1/admin/records?page=1&page_size=20&state=DRAFT&maturity=...&q=...
// Lists ALL records regardless of publication state (including DRAFT, UNDER_REVIEW,
// SUPERSEDED, ARCHIVED). Curators see everything.
// FRD §F08b: "Curator can view all records in all publication states."
router.get('/records', async (req, res) => {
  const db = req.db || getDb();
  try {
    const page     = Math.max(1, parseInt(req.query.page      || '1',  10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const offset   = (page - 1) * pageSize;

    let query = db('innovation_records')
      .whereNull('deleted_at')
      .select(
        'record_id',
        'title',
        'short_description',
        'publication_state',
        'maturity_level',
        'review_status',
        'contributing_office',
        'owner_name',
        'last_reviewed_date',
        'created_at',
        'updated_at',
        'published_at'
      )
      .orderBy('updated_at', 'desc');

    // Optional filters
    if (req.query.state)   query = query.where('publication_state', req.query.state);
    if (req.query.maturity) query = query.where('maturity_level', req.query.maturity);
    if (req.query.review_status) query = query.where('review_status', req.query.review_status);

    // Simple keyword filter on title + short_description
    if (req.query.q) {
      const term = `%${req.query.q}%`;
      query = query.where(function () {
        this.where('title', 'ilike', term).orWhere('short_description', 'ilike', term);
      });
    }

    // Total count for pagination
    const countQuery = query.clone().clearSelect().clearOrder().count('record_id as count').first();
    const [{ count: total }, rows] = await Promise.all([
      countQuery,
      query.limit(pageSize).offset(offset),
    ]);

    return res.status(200).json({
      data:       rows,
      pagination: {
        page,
        page_size: pageSize,
        total:     parseInt(total, 10) || 0,
        total_pages: Math.ceil((parseInt(total, 10) || 0) / pageSize),
      },
    });
  } catch (err) {
    console.error('admin/records error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to load records.' } });
  }
});

// ── Content Model Reference ──────────────────────────────────────────────────
// GET /api/v1/admin/maturity-reference
// Returns all maturity level definitions for the content model reference page.
// FRD §F09: 5 maturity levels with definitions.
router.get('/maturity-reference', (_req, res) => {
  return res.status(200).json({ data: MATURITY_LEVELS });
});

// GET /api/v1/admin/review-status-reference
// Returns all review status definitions for the content model reference page.
// FRD §F09: 7 review statuses with definitions.
router.get('/review-status-reference', (_req, res) => {
  return res.status(200).json({ data: REVIEW_STATUSES });
});

// ── Create Record from Contribution Submission ───────────────────────────────
// POST /api/v1/admin/contribution-submissions/:id/create-record
// Creates a new Innovation Record pre-populated with data from the contribution
// submission. Record starts in DRAFT state. Disposition updated to LINKED_TO_RECORD.
// FRD §F06c, US-6.3: "Curator creates a structured record from a contribution submission."
router.post('/contribution-submissions/:id/create-record', async (req, res) => {
  const db = req.db || getDb();
  const submissionId = req.params.id;
  const curatorUserId = req.session.user.user_id;

  try {
    // 1. Fetch the contribution submission
    const submission = await db('contribution_submissions')
      .where('submission_id', submissionId)
      .first();

    if (!submission) {
      return res.status(404).json({
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Contribution submission not found.' },
      });
    }

    if (submission.disposition === 'LINKED_TO_RECORD') {
      return res.status(409).json({
        error: { code: 'ALREADY_LINKED', message: 'A record has already been created from this submission.' },
      });
    }

    // 2. Build initial record fields from submission data
    // Map submission fields to innovation_records columns (all required governance fields
    // start empty — curator will complete them via RecordEditPage).
    const recordFields = {
      title:               submission.innovation_title     || submission.title     || '',
      short_description:   submission.short_description    || submission.description || '',
      problem_statement:   submission.problem_statement    || '',
      // Submitter-provided maturity assessment (may be adjusted by curator)
      maturity_level:      submission.self_assessed_maturity || 'EXPERIMENT_POC',
      review_status:       'SUBMITTED',
      publication_state:   'DRAFT',
      contributing_office: submission.submitting_office    || submission.organization || '',
      owner_name:          submission.contact_name         || '',
      owner_email:         submission.contact_email        || '',
      // Governance fields — curator must complete before publication
      summary:             '',
      outcome_evidence:    '',
      reuse_guidance:      '',
      // Attribution
      created_by_user_id:  curatorUserId,
      updated_by_user_id:  curatorUserId,
    };

    // 3. Insert the new record in a transaction
    const [newRecord] = await db.transaction(async (trx) => {
      // Create the innovation record
      const [record] = await trx('innovation_records')
        .insert(recordFields)
        .returning('*');

      // If the submission included artifact URLs, create artifact_link rows
      const artifactUrls = Array.isArray(submission.artifact_urls)
        ? submission.artifact_urls
        : (submission.artifact_urls ? JSON.parse(submission.artifact_urls) : []);

      if (artifactUrls.length > 0) {
        const artifactRows = artifactUrls.map((url, idx) => ({
          record_id:     record.record_id,
          url,
          label:         `Source artifact ${idx + 1}`,
          artifact_type: 'OTHER',
          display_order: idx + 1,
        }));
        await trx('record_artifact_links').insert(artifactRows);
      }

      // Update submission disposition to LINKED_TO_RECORD
      await trx('contribution_submissions')
        .where('submission_id', submissionId)
        .update({
          disposition:           'LINKED_TO_RECORD',
          linked_record_id:      record.record_id,
          reviewed_by_user_id:   curatorUserId,
          reviewed_at:           trx.fn.now(),
        });

      // Write audit log entry
      await trx('audit_log').insert({
        record_id:         record.record_id,
        changed_by_user_id: curatorUserId,
        change_type:       'CREATE',
        previous_state:    null,
        new_state:         'DRAFT',
        change_summary:    `Record created from contribution submission ${submissionId}`,
      });

      return [record];
    });

    return res.status(201).json({
      record_id:     newRecord.record_id,
      title:         newRecord.title,
      publication_state: newRecord.publication_state,
      message:       'Record created in DRAFT state. Complete required fields before publication.',
    });
  } catch (err) {
    console.error('create-record-from-contribution error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create record from submission.' },
    });
  }
});

module.exports = router;
