'use strict';

/**
 * keyFindingRepository.js
 *
 * Parameterized DB queries for record_key_findings table.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql):
 *   - finding_id UUID PK
 *   - record_id UUID FK ON DELETE CASCADE
 *   - finding_text TEXT CHECK (LENGTH >= 10 AND LENGTH <= 1000)
 *   - display_order INTEGER DEFAULT 0
 *   - created_at TIMESTAMPTZ DEFAULT NOW()
 */

/**
 * Find all key findings for a record, ordered by display_order.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<string[]>} Array of finding_text strings
 */
async function findByRecordId(db, recordId) {
  const rows = await db('record_key_findings')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('finding_text');

  return rows.map((r) => r.finding_text);
}

/**
 * Replace all key findings for a record.
 * DELETEs existing findings, then INSERTs new ones.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string[]} findings - Array of finding_text strings
 * @returns {Promise<void>}
 */
async function replaceForRecord(db, recordId, findings) {
  await db('record_key_findings')
    .where({ record_id: recordId })
    .delete();

  if (!findings || findings.length === 0) {
    return;
  }

  const rows = findings.map((text, idx) => ({
    record_id: recordId,
    finding_text: text,
    display_order: idx,
  }));

  await db('record_key_findings').insert(rows);
}

module.exports = {
  findByRecordId,
  replaceForRecord,
};
