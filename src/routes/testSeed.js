'use strict';

/**
 * testSeed.js — Test-only seed routes for Playwright e2e tests
 *
 * SECURITY: These routes are gated on NODE_ENV !== 'production'.
 * They MUST NEVER be active in the production build (T-11-07).
 *
 * Provides:
 *   POST /api/v1/test-seed/published-record
 *     Accepts a record shape, creates + submits-for-review + publishes the record
 *     Returns { record_id }
 *
 *   DELETE /api/v1/test-seed/records/:id
 *     Hard-deletes a record by ID (bypasses lifecycle for test cleanup)
 */

const express = require('express');
const router = express.Router();
const recordService = require('../services/recordService');

/**
 * POST /api/v1/test-seed/published-record
 * Creates a full PUBLISHED record for Playwright e2e tests.
 * Requires NODE_ENV === 'test' (enforced by caller in app.js).
 */
router.post('/published-record', async (req, res) => {
  const db = req.db;
  if (!db) {
    return res.status(500).json({ error: { code: 'NO_DB', message: 'DB not available on req' } });
  }

  // Create a system test user ID for seeding
  let testUserId;
  try {
    const result = await db.raw(`
      INSERT INTO users (email, display_name, role)
      VALUES ('playwright-seed@test.local', 'Playwright Test Seed', 'CURATOR')
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING user_id
    `);
    testUserId = result.rows[0].user_id;
  } catch (err) {
    return res.status(500).json({ error: { code: 'SEED_USER_FAILED', message: err.message } });
  }

  const body = req.body;

  // Build the record fields from the request body with defaults for optional fields
  const fields = {
    title: body.title || 'Test Record Title',
    problem_statement: body.problem_statement || 'Test problem statement that is long enough to satisfy the minimum length check constraint requirement for this field.',
    what_was_explored: body.what_was_explored || 'Test exploration approach that is long enough to satisfy the minimum length check constraint requirement for this field.',
    outcome_summary: body.outcome_summary || 'Test outcome summary that is long enough to satisfy the minimum length check constraint requirement for this field.',
    key_findings: body.key_findings || ['Test finding that is long enough to satisfy constraints'],
    reuse_guidance: body.reuse_guidance || 'Test reuse guidance.',
    short_summary: body.short_summary || 'Test short summary.',
    maturity_level: body.maturity_level || 'EXPERIMENT_POC',
    review_status: body.review_status || 'CURATED',
    reuse_potential: body.reuse_potential || 'MEDIUM',
    source_type: body.source_type || 'I_AND_R',
    owner_name: body.owner_name || 'Test Owner',
    owner_office: body.owner_office || 'TSIO',
    contributing_office: body.contributing_office || 'TSIO I&R',
    contributor_attribution: body.contributor_attribution || null,
    executive_perspective_text: body.executive_perspective_text || 'Test executive perspective text for this record.',
    executive_recommendation: body.executive_recommendation || 'Test recommendation for this record.',
    technical_perspective_text: body.technical_perspective_text || null,
    security_findings: body.security_findings !== undefined ? body.security_findings : null,
    performance_findings: body.performance_findings || null,
    last_reviewed_date: body.last_reviewed_date || new Date().toISOString().slice(0, 10),
    default_perspective: body.default_perspective || 'EXECUTIVE',
    mission_area_tags: body.mission_area_tags || ['Test Mission Area'],
    technology_area_tags: body.technology_area_tags || ['Test Technology Area'],
    artifact_links: body.artifact_links || [
      { label: 'Test Document', url: 'https://example.gov/test-doc', artifact_type: 'DOCUMENT' }
    ],
    engagement_options: body.engagement_options || ['REQUEST_BRIEFING', 'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION', 'REQUEST_TECHNICAL_GUIDANCE'],
  };

  let record;
  try {
    // Step 1: Create the record (DRAFT state)
    record = await recordService.createRecord(db, fields, testUserId);
  } catch (err) {
    return res.status(500).json({ error: { code: 'CREATE_FAILED', message: err.message } });
  }

  try {
    // Step 2: Submit for review (DRAFT → REVIEW)
    await recordService.submitForReview(db, record.record_id, testUserId);
  } catch (err) {
    // If already in REVIEW or later state, ignore
    if (err.code !== 'INVALID_STATE_TRANSITION') {
      return res.status(500).json({ error: { code: 'SUBMIT_REVIEW_FAILED', message: err.message } });
    }
  }

  try {
    // Step 3: Publish the record (REVIEW → PUBLISHED)
    const published = await recordService.publishRecord(db, record.record_id, testUserId);
    return res.status(201).json({ record_id: published.record_id || record.record_id });
  } catch (err) {
    return res.status(500).json({ error: { code: 'PUBLISH_FAILED', message: err.message, details: err.fields } });
  }
});

/**
 * DELETE /api/v1/test-seed/records/:id
 * Hard-deletes a test record for cleanup after Playwright e2e tests.
 */
router.delete('/records/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  if (!db) {
    return res.status(500).json({ error: { code: 'NO_DB', message: 'DB not available on req' } });
  }

  try {
    // Hard-delete audit log entries first
    await db('audit_log').where({ record_id: id }).delete();
    // Hard-delete the record (cascades to child tables via FK ON DELETE CASCADE)
    const deleted = await db('innovation_records').where({ record_id: id }).delete();
    if (deleted === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: { code: 'DELETE_FAILED', message: err.message } });
  }
});

module.exports = router;
