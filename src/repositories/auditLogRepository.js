'use strict';

/**
 * auditLogRepository.js
 *
 * INSERT-only repository for the audit_log table.
 * Per TechArch §5.6 and FRD F02b: audit rows are append-only.
 *
 * SECURITY: No UPDATE or DELETE methods are exposed by this repository.
 * The application DB user should have INSERT + SELECT only on audit_log.
 *
 * All queries use parameterized placeholders (via Knex) — no raw string interpolation.
 */

/**
 * Insert a single audit log entry (append-only).
 *
 * @param {import('knex').Knex} db - Knex database instance
 * @param {Object} entry
 * @param {string} entry.record_id
 * @param {string} entry.changed_by_user_id
 * @param {string} entry.event_type
 * @param {string|null} entry.field_changed
 * @param {string|null} entry.old_value
 * @param {string|null} entry.new_value
 * @param {string|null} entry.state_transition
 * @returns {Promise<Object>} The inserted audit_log row
 */
async function insert(db, entry) {
  const [row] = await db('audit_log')
    .insert({
      record_id: entry.record_id,
      changed_by_user_id: entry.changed_by_user_id,
      event_type: entry.event_type,
      field_changed: entry.field_changed || null,
      old_value: entry.old_value || null,
      new_value: entry.new_value || null,
      state_transition: entry.state_transition || null,
    })
    .returning('*');
  return row;
}

/**
 * Find audit log entries for a record, paginated, reverse-chronological.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {{ page?: number, pageSize?: number }} pagination
 * @returns {Promise<{ data: Object[], total: number, page: number, pageSize: number, totalPages: number }>}
 */
async function findByRecordId(db, recordId, { page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;

  const [countResult] = await db('audit_log')
    .where({ record_id: recordId })
    .count('audit_id as count');

  const total = parseInt(countResult.count, 10);

  const rows = await db('audit_log')
    .where({ record_id: recordId })
    .orderBy('changed_at', 'desc')
    .limit(pageSize)
    .offset(offset)
    .select('*');

  return {
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

module.exports = {
  insert,
  findByRecordId,
};
