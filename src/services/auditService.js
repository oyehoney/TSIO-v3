'use strict';

/**
 * auditService.js
 *
 * Append-only writer to the audit_log table.
 * Per TechArch §5.6 and FRD F02b: audit rows are NEVER updated or deleted.
 *
 * SECURITY: changed_by_user_id MUST come from authenticated session context
 * passed by the caller. It is NEVER accepted from the request body.
 * This is enforced by the service interface — callers pass userId from session.
 *
 * Used by recordService for all material events (create, state transitions, field edits, delete).
 * Used by Wave 6 admin interface for AuditHistoryPanel via GET /records/:id/audit.
 */

const auditLogRepository = require('../repositories/auditLogRepository');

/**
 * Valid event_type values (from DB CHECK constraint in 001_core_content_tables.sql).
 */
const VALID_EVENT_TYPES = ['FIELD_EDIT', 'STATE_TRANSITION', 'RECORD_CREATED', 'RECORD_DELETED'];

/**
 * Append one audit log entry for a material event on an Innovation Record.
 *
 * @param {import('knex').Knex} db - Knex database instance
 * @param {Object} params
 * @param {string} params.record_id - UUID of the Innovation Record
 * @param {string} params.changed_by_user_id - UUID of the acting user (from session, never request body)
 * @param {string} params.event_type - One of: FIELD_EDIT | STATE_TRANSITION | RECORD_CREATED | RECORD_DELETED
 * @param {string|null} [params.field_changed] - Field name for FIELD_EDIT events; null otherwise
 * @param {string|null} [params.old_value] - Previous value for FIELD_EDIT events; null otherwise
 * @param {string|null} [params.new_value] - New value for FIELD_EDIT events; null otherwise
 * @param {string|null} [params.state_transition] - e.g. 'DRAFT->REVIEW'; null for FIELD_EDIT events
 * @returns {Promise<void>}
 * @throws If DB INSERT fails (caller handles rollback if needed)
 */
async function logEvent(db, {
  record_id,
  changed_by_user_id,
  event_type,
  field_changed = null,
  old_value = null,
  new_value = null,
  state_transition = null,
}) {
  if (!VALID_EVENT_TYPES.includes(event_type)) {
    throw new Error(`Invalid event_type: ${event_type}. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  await auditLogRepository.insert(db, {
    record_id,
    changed_by_user_id,
    event_type,
    field_changed,
    old_value: old_value !== null && old_value !== undefined ? String(old_value) : null,
    new_value: new_value !== null && new_value !== undefined ? String(new_value) : null,
    state_transition,
  });
}

module.exports = {
  logEvent,
  VALID_EVENT_TYPES,
};
