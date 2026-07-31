'use strict';

/**
 * tagRepository.js
 *
 * Parameterized DB queries for record_tags table.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql):
 *   - tag_id UUID PK
 *   - record_id UUID FK ON DELETE CASCADE
 *   - tag_type CHECK IN ('MISSION_AREA', 'TECHNOLOGY_AREA')
 *   - tag_value VARCHAR(100) CHECK (LENGTH >= 1)
 *   - display_order INTEGER DEFAULT 0
 */

/**
 * Find all tags for a record, split into mission_area_tags and technology_area_tags arrays.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<{ mission_area_tags: string[], technology_area_tags: string[] }>}
 */
async function findByRecordId(db, recordId) {
  const rows = await db('record_tags')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('tag_type', 'tag_value');

  const mission_area_tags = rows
    .filter((r) => r.tag_type === 'MISSION_AREA')
    .map((r) => r.tag_value);

  const technology_area_tags = rows
    .filter((r) => r.tag_type === 'TECHNOLOGY_AREA')
    .map((r) => r.tag_value);

  return { mission_area_tags, technology_area_tags };
}

/**
 * Replace all tags for a record.
 * DELETEs existing tags, then INSERTs new ones.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {{ mission_area_tags?: string[], technology_area_tags?: string[] }} tags
 * @returns {Promise<void>}
 */
async function replaceForRecord(db, recordId, { mission_area_tags = [], technology_area_tags = [] } = {}) {
  await db('record_tags')
    .where({ record_id: recordId })
    .delete();

  const rows = [];

  (mission_area_tags || []).forEach((value, idx) => {
    rows.push({
      record_id: recordId,
      tag_type: 'MISSION_AREA',
      tag_value: value,
      display_order: idx,
    });
  });

  (technology_area_tags || []).forEach((value, idx) => {
    rows.push({
      record_id: recordId,
      tag_type: 'TECHNOLOGY_AREA',
      tag_value: value,
      display_order: idx,
    });
  });

  if (rows.length > 0) {
    await db('record_tags').insert(rows);
  }
}

module.exports = {
  findByRecordId,
  replaceForRecord,
};
