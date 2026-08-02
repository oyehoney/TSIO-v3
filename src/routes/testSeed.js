'use strict';

/**
 * testSeed.js — Test-only seed routes for Playwright e2e tests.
 *
 * SECURITY: T-11-07 — These routes MUST ONLY be registered when
 * process.env.NODE_ENV !== 'production'. They are registered in app.js
 * inside `if (process.env.NODE_ENV !== 'production')`.
 *
 * This file is never loaded in production.
 *
 * Endpoints:
 *   POST /api/v1/test-seed/published-record
 *     → Creates a PUBLISHED Innovation Record with all relations for e2e testing.
 *     → Returns { record_id }
 *
 *   DELETE /api/v1/test-seed/records/:id
 *     → Hard-deletes the record (bypasses publication lifecycle for cleanup).
 *     → Returns 204 No Content
 */

const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

/**
 * POST /api/v1/test-seed/published-record
 *
 * Creates a full PUBLISHED Innovation Record for Playwright e2e testing.
 * Accepts a record shape and creates + publishes the record in one step
 * (bypasses normal curator lifecycle for test speed).
 *
 * Returns: { record_id: string }
 */
router.post('/published-record', async (req, res) => {
  const db = getDb();

  try {
    const {
      title,
      problem_statement,
      what_was_explored,
      outcome_summary,
      maturity_level = 'EXPERIMENT_POC',
      review_status = 'CURATED',
      reuse_potential = 'MEDIUM',
      source_type = 'COMMUNITY',
      owner_name,
      owner_office,
      contributing_office,
      executive_perspective_text = null,
      executive_recommendation = null,
      technical_perspective_text = null,
      security_findings = null,
      performance_findings = null,
      reuse_guidance = null,
      key_findings = [],
      artifact_links = [],
      engagement_options = [],
      mission_area_tags = [],
      technology_area_tags = [],
      default_perspective = 'EXECUTIVE',
      short_summary = null,
      contributor_attribution = null,
    } = req.body;

    // Insert record directly in PUBLISHED state (bypasses lifecycle for test speed)
    const [record] = await db('innovation_records')
      .insert({
        title,
        problem_statement,
        what_was_explored,
        outcome_summary,
        short_summary,
        maturity_level,
        review_status,
        reuse_potential,
        source_type,
        owner_name,
        owner_office,
        contributing_office,
        contributor_attribution,
        executive_perspective_text,
        executive_recommendation,
        technical_perspective_text,
        security_findings,
        performance_findings,
        reuse_guidance,
        default_perspective,
        publication_state: 'PUBLISHED',
        published_at: new Date().toISOString(),
        last_reviewed_date: new Date().toISOString().split('T')[0],
        created_by_user_id: null,
        updated_by_user_id: null,
      })
      .returning('record_id');

    const record_id = record.record_id || record;

    // Insert key_findings
    if (key_findings && key_findings.length > 0) {
      await db('key_findings').insert(
        key_findings.map((text, i) => ({
          record_id,
          finding_text: text,
          display_order: i + 1,
        }))
      );
    }

    // Insert artifact_links
    if (artifact_links && artifact_links.length > 0) {
      await db('record_artifact_links').insert(
        artifact_links.map((link, i) => ({
          record_id,
          label: link.label,
          url: link.url,
          artifact_type: link.artifact_type || 'DOCUMENT',
          display_order: link.display_order || i + 1,
        }))
      );
    }

    // Insert engagement_options
    if (engagement_options && engagement_options.length > 0) {
      await db('record_engagement_options').insert(
        engagement_options.map((opt_type) => ({
          record_id,
          option_type: opt_type,
        }))
      );
    }

    // Insert mission_area_tags
    if (mission_area_tags && mission_area_tags.length > 0) {
      const missionTagRows = mission_area_tags.map((tag) => ({
        record_id,
        tag_name: tag,
        tag_type: 'MISSION_AREA',
      }));
      await db('record_tags').insert(missionTagRows);
    }

    // Insert technology_area_tags
    if (technology_area_tags && technology_area_tags.length > 0) {
      const techTagRows = technology_area_tags.map((tag) => ({
        record_id,
        tag_name: tag,
        tag_type: 'TECHNOLOGY_AREA',
      }));
      await db('record_tags').insert(techTagRows);
    }

    return res.status(201).json({ record_id });
  } catch (err) {
    console.error('[testSeed] POST /published-record error:', err);
    return res.status(500).json({
      error: { code: 'SEED_ERROR', message: err.message || 'Seed failed' },
    });
  }
});

/**
 * DELETE /api/v1/test-seed/records/:id
 *
 * Hard-deletes a test record (bypasses lifecycle for cleanup).
 * Returns 204 No Content.
 */
router.delete('/records/:id', async (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    // Delete child tables first (FK constraints)
    await db('key_findings').where({ record_id: id }).delete();
    await db('record_artifact_links').where({ record_id: id }).delete();
    await db('record_engagement_options').where({ record_id: id }).delete();
    await db('record_tags').where({ record_id: id }).delete();
    await db('record_audit_log').where({ record_id: id }).delete().catch(() => {}); // ignore if table doesn't exist

    // Delete the record itself
    await db('innovation_records').where({ record_id: id }).delete();

    return res.status(204).send();
  } catch (err) {
    console.error('[testSeed] DELETE /records/:id error:', err);
    return res.status(500).json({
      error: { code: 'SEED_DELETE_ERROR', message: err.message || 'Delete failed' },
    });
  }
});

module.exports = router;
