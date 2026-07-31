'use strict';

/**
 * innovationRecordRepository.js
 *
 * Parameterized DB queries for the innovation_records table.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql).
 *
 * ALL queries include AND deleted_at IS NULL unless explicitly retrieving deleted records.
 * All column names match TechArch §3.2 DDL exactly.
 *
 * SECURITY:
 * - No raw SQL string interpolation — all queries use Knex parameterized bindings.
 * - Soft-delete pattern: deleted_at IS NULL guard on all active-record queries.
 * - Hard-delete only called from recordService.deleteRecord() after lifecycle gate confirms DRAFT state.
 */

const keyFindingRepository = require('./keyFindingRepository');
const artifactLinkRepository = require('./artifactLinkRepository');
const tagRepository = require('./tagRepository');
const engagementOptionsRepository = require('./engagementOptionsRepository');

/**
 * Find a record by ID (active record only unless includeDeleted is true).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {{ includeDeleted?: boolean }} options
 * @returns {Promise<Object|null>}
 */
async function findById(db, recordId, { includeDeleted = false } = {}) {
  let query = db('innovation_records').where({ record_id: recordId });
  if (!includeDeleted) {
    query = query.whereNull('deleted_at');
  }
  const row = await query.first();
  return row || null;
}

/**
 * Find a record by ID with all related child records joined as arrays.
 * Returns null if not found or soft-deleted.
 *
 * Assembles:
 *   - key_findings: string[]
 *   - artifact_links: [{ link_id, label, url, artifact_type, display_order }]
 *   - mission_area_tags: string[]
 *   - technology_area_tags: string[]
 *   - engagement_options: string[]
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<Object|null>}
 */
async function findByIdWithRelations(db, recordId) {
  const record = await findById(db, recordId);
  if (!record) return null;

  const [keyFindings, artifactLinks, tags, engagementOptions] = await Promise.all([
    keyFindingRepository.findByRecordId(db, recordId),
    artifactLinkRepository.findByRecordId(db, recordId),
    tagRepository.findByRecordId(db, recordId),
    engagementOptionsRepository.findByRecordId(db, recordId),
  ]);

  return {
    ...record,
    key_findings: keyFindings,
    artifact_links: artifactLinks,
    mission_area_tags: tags.mission_area_tags,
    technology_area_tags: tags.technology_area_tags,
    engagement_options: engagementOptions,
  };
}

/**
 * Insert a new innovation record row and return the created row.
 *
 * @param {import('knex').Knex} db
 * @param {Object} fields - Scalar fields for the innovation_records row
 * @returns {Promise<Object>} Created row
 */
async function create(db, fields) {
  const [row] = await db('innovation_records')
    .insert(fields)
    .returning('*');
  return row;
}

/**
 * Update mutable scalar fields on an innovation record.
 * Always sets updated_at = NOW() via Knex.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {Object} fields - Scalar fields to update (partial; undefined keys not touched)
 * @returns {Promise<Object>} Updated row
 */
async function update(db, recordId, fields) {
  const updatePayload = {
    ...fields,
    updated_at: db.fn.now(),
  };

  const [row] = await db('innovation_records')
    .where({ record_id: recordId })
    .whereNull('deleted_at')
    .update(updatePayload)
    .returning('*');

  return row;
}

/**
 * Soft-delete a record (sets deleted_at = NOW()).
 * Record remains in DB for audit integrity; all queries exclude it by default.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<void>}
 */
async function softDelete(db, recordId) {
  await db('innovation_records')
    .where({ record_id: recordId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });
}

/**
 * Hard-delete a record and all cascade children.
 * ONLY called from recordService.deleteRecord() after lifecycle gate confirms DRAFT state.
 * CASCADE DELETE on child tables handles key_findings, artifact_links, tags, engagement_options.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<void>}
 */
async function hardDelete(db, recordId) {
  await db('innovation_records')
    .where({ record_id: recordId })
    .delete();
}

module.exports = {
  findById,
  findByIdWithRelations,
  create,
  update,
  softDelete,
  hardDelete,
};
