'use strict';

/**
 * engagementOptionsRepository.js
 *
 * Parameterized DB queries for record_engagement_options table.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql):
 *   - option_id UUID PK
 *   - record_id UUID FK ON DELETE CASCADE
 *   - option_type CHECK IN ('REQUEST_DEMO','REQUEST_ADOPTION_DISCUSSION',
 *       'REQUEST_TECHNICAL_GUIDANCE','REQUEST_BRIEFING','SUBMIT_RELATED_PROBLEM')
 *   - display_order INTEGER DEFAULT 0
 *   - UNIQUE(record_id, option_type)
 */

/**
 * Find all engagement option types for a record, ordered by display_order.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<string[]>} Array of option_type strings
 */
async function findByRecordId(db, recordId) {
  const rows = await db('record_engagement_options')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('option_type');

  return rows.map((r) => r.option_type);
}

/**
 * Replace all engagement options for a record.
 * DELETEs existing options, then INSERTs new ones.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string[]} options - Array of option_type strings
 * @returns {Promise<void>}
 */
async function replaceForRecord(db, recordId, options) {
  await db('record_engagement_options')
    .where({ record_id: recordId })
    .delete();

  if (!options || options.length === 0) {
    return;
  }

  const rows = options.map((optionType, idx) => ({
    record_id: recordId,
    option_type: optionType,
    display_order: idx,
  }));

  await db('record_engagement_options').insert(rows);
}

module.exports = {
  findByRecordId,
  replaceForRecord,
};
