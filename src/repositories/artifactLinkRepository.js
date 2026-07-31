'use strict';

/**
 * artifactLinkRepository.js
 *
 * Parameterized DB queries for record_artifact_links table.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql):
 *   - link_id UUID PK
 *   - record_id UUID FK ON DELETE CASCADE
 *   - label VARCHAR(200) CHECK (LENGTH >= 2)
 *   - url TEXT CHECK (url LIKE 'https://%')
 *   - artifact_type CHECK IN ('DOCUMENT','CODE_REPOSITORY','VIDEO','DIAGRAM','OTHER')
 *   - display_order INTEGER DEFAULT 0
 *   - created_at TIMESTAMPTZ DEFAULT NOW()
 *
 * SECURITY: URL validation (https:// prefix) enforced at DB level via CHECK constraint
 * and at service layer (governanceGateService, recordService) before any INSERT.
 * The Hub never fetches artifact URLs — they are stored as display strings only (TechArch §7.6).
 */

/**
 * Find all artifact links for a record, ordered by display_order.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<Array<{ link_id, label, url, artifact_type, display_order }>>}
 */
async function findByRecordId(db, recordId) {
  return db('record_artifact_links')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('link_id', 'label', 'url', 'artifact_type', 'display_order');
}

/**
 * Replace all artifact links for a record.
 * DELETEs existing links, then INSERTs new ones (within a transaction if caller provides one).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {Array<{ label: string, url: string, artifact_type: string, display_order?: number }>} links
 * @returns {Promise<Array>} Inserted rows
 */
async function replaceForRecord(db, recordId, links) {
  // Delete existing links for this record
  await db('record_artifact_links')
    .where({ record_id: recordId })
    .delete();

  if (!links || links.length === 0) {
    return [];
  }

  const rows = links.map((link, idx) => ({
    record_id: recordId,
    label: link.label,
    url: link.url,
    artifact_type: link.artifact_type,
    display_order: link.display_order !== undefined ? link.display_order : idx,
  }));

  return db('record_artifact_links')
    .insert(rows)
    .returning(['link_id', 'label', 'url', 'artifact_type', 'display_order']);
}

module.exports = {
  findByRecordId,
  replaceForRecord,
};
