'use strict';

const knex = require('knex');

let db;

/**
 * Returns a Knex instance connected to the test DATABASE_URL.
 * Creates a new connection on first call; reuses for subsequent calls.
 */
function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for integration tests');
    }
    db = knex({
      client: 'pg',
      connection: connectionString,
      pool: { min: 1, max: 5 },
    });
  }
  return db;
}

/**
 * Create a test curator user in the users table.
 * Uses ON CONFLICT to be idempotent.
 *
 * @param {import('knex').Knex} db
 * @param {string} [emailSuffix] - Optional suffix to make unique users per test suite
 * @returns {Promise<string>} user_id UUID
 */
async function createTestCurator(db, emailSuffix = '') {
  const email = `test-curator${emailSuffix}@ao.uscourts.gov`;
  // db.raw() returns { rows: [...], rowCount, ... } — not directly iterable
  const result = await db.raw(`
    INSERT INTO users (email, display_name, role)
    VALUES (?, 'Test Curator', 'CURATOR')
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING user_id
  `, [email]);
  return result.rows[0].user_id;
}

/**
 * Hard-delete test records and their audit log entries after each test.
 * Respects FK order: audit_log first, then cascade handles child tables, then innovation_records.
 *
 * @param {import('knex').Knex} db
 * @param {string[]} recordIds - UUIDs to clean up
 */
async function cleanupRecords(db, recordIds) {
  if (!recordIds || recordIds.length === 0) return;
  await db('audit_log').whereIn('record_id', recordIds).delete();
  // Child tables cascade-delete with innovation_records via ON DELETE CASCADE
  await db('innovation_records').whereIn('record_id', recordIds).delete();
}

/**
 * Build a valid object with ALL pub-required fields populated.
 * Used by governance gate tests and publish flow tests.
 * Includes min-1 arrays for key_findings, artifact_links, engagement_options, mission_area_tags.
 *
 * @returns {Object} Full record data with all publication-required fields
 */
function buildFullRecord(userId) {
  return {
    title: 'Audio Security POC — Innovation Hub Test Record',
    problem_statement: 'Courtroom audio systems lack automated security monitoring, creating risk of unauthorized recording and evidence tampering in federal proceedings.',
    what_was_explored: 'Explored AI-based anomaly detection for courtroom audio streams, testing three commercial ML platforms against known threat signatures in a simulated courtroom environment.',
    outcome_summary: 'Proof-of-concept demonstrated 94% detection accuracy for known threat signatures. Integration with existing court AV infrastructure is technically feasible within 6 months.',
    reuse_guidance: 'Reusable for any district with existing IP-based audio infrastructure. Requires local security assessment before deployment.',
    short_summary: 'AI anomaly detection POC for courtroom audio security with 94% accuracy.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'SUBMITTED',
    reuse_potential: 'HIGH',
    source_type: 'I_AND_R',
    owner_name: 'John Smith',
    owner_office: 'TSIO',
    contributing_office: 'TSIO Innovation & Research',
    contributor_attribution: 'TSIO I&R Team',
    executive_perspective_text: 'This proof-of-concept validates that AI-based audio security monitoring is technically feasible for federal courtroom environments. The 94% detection accuracy exceeds our minimum threshold for further investment consideration.',
    executive_recommendation: 'Recommend proceeding to pilot phase in 2-3 volunteer districts with dedicated AV staff to validate operational integration.',
    technical_perspective_text: 'The POC used a transformer-based anomaly detection model fine-tuned on courtroom audio signatures. Latency averaged 120ms, within acceptable bounds for real-time monitoring without impacting courtroom operations.',
    security_findings: 'No significant vulnerabilities identified in POC architecture. Full security assessment required before pilot deployment.',
    performance_findings: 'Processing 8 simultaneous audio streams at 120ms average latency on commodity hardware (8-core, 32GB RAM).',
    default_perspective: 'EXECUTIVE',
    last_reviewed_date: new Date().toISOString().split('T')[0], // today
    created_by_user_id: userId,
    updated_by_user_id: userId,
    key_findings: [
      '94% detection accuracy for known threat signatures in simulated environment.',
      'Integration with existing IP-based AV infrastructure is technically feasible.',
      'Processing latency of 120ms allows real-time monitoring without operational impact.',
    ],
    artifact_links: [
      {
        label: 'POC Technical Report',
        url: 'https://example.ao.uscourts.gov/reports/audio-security-poc-2024.pdf',
        artifact_type: 'DOCUMENT',
        display_order: 0,
      },
    ],
    mission_area_tags: ['Courtroom Technology', 'Security'],
    technology_area_tags: ['AI/ML', 'Audio Processing'],
    engagement_options: ['REQUEST_DEMO', 'REQUEST_TECHNICAL_GUIDANCE'],
  };
}

module.exports = {
  getDb,
  createTestCurator,
  cleanupRecords,
  buildFullRecord,
};
