'use strict';

/**
 * engagement.repository.js
 *
 * Parameterized DB queries for engagement_requests and record_engagement_options.
 * Per TechArch §3.2 DDL (001_core_content_tables.sql and 001_supporting_tables.sql).
 *
 * SECURITY:
 * - No raw SQL string interpolation — all queries use Knex parameterized bindings.
 * - PUBLISHED guard: getRecordPublicationState returns null for non-existent or deleted records.
 * - getConfiguredOptions returns the configured types per record (not a global enum).
 */

/**
 * Get configured engagement option types for a record.
 * Used by EngagementService to validate that request_type is configured on the target record.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<string[]>} Array of option_type strings (e.g. ['REQUEST_DEMO', 'REQUEST_BRIEFING'])
 */
async function getConfiguredOptions(db, recordId) {
  const rows = await db('record_engagement_options')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('option_type');

  return rows.map((r) => r.option_type);
}

/**
 * Get publication_state for a record. Returns null if the record does not exist
 * or has been soft-deleted (deleted_at IS NOT NULL).
 *
 * Used by EngagementService PUBLISHED guard:
 *   - null → 404 RECORD_NOT_FOUND
 *   - non-'PUBLISHED' → 404 RECORD_NOT_FOUND (public users must not know non-published records exist)
 *   - 'PUBLISHED' → proceed
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @returns {Promise<string|null>} publication_state or null if not found/deleted
 */
async function getRecordPublicationState(db, recordId) {
  const row = await db('innovation_records')
    .where({ record_id: recordId })
    .whereNull('deleted_at')
    .select('publication_state')
    .first();

  return row ? row.publication_state : null;
}

/**
 * Insert a new engagement request. Returns the full inserted row.
 *
 * @param {import('knex').Knex} db
 * @param {Object} data
 * @param {string} data.record_id
 * @param {string} data.request_type
 * @param {string} data.requestor_name
 * @param {string} data.requestor_email
 * @param {string} data.requestor_office
 * @param {string} [data.requestor_title]
 * @param {string} data.description_of_interest
 * @param {string} [data.desired_next_step]
 * @returns {Promise<Object>} Inserted engagement_request row
 */
async function insertEngagementRequest(db, data) {
  const insertData = {
    record_id: data.record_id,
    request_type: data.request_type,
    requestor_name: data.requestor_name,
    requestor_email: data.requestor_email,
    requestor_office: data.requestor_office,
    description_of_interest: data.description_of_interest,
    status: 'SUBMITTED',
  };

  if (data.requestor_title !== undefined && data.requestor_title !== null) {
    insertData.requestor_title = data.requestor_title;
  }
  if (data.desired_next_step !== undefined && data.desired_next_step !== null) {
    insertData.desired_next_step = data.desired_next_step;
  }

  const [row] = await db('engagement_requests')
    .insert(insertData)
    .returning('*');

  return row;
}

/**
 * List engagement requests with optional filters + pagination.
 * Orders by submitted_at DESC.
 *
 * @param {import('knex').Knex} db
 * @param {Object} filters
 * @param {string} [filters.record_id]
 * @param {string} [filters.request_type]
 * @param {string} [filters.status]
 * @param {string} [filters.from_date] - ISO date string, submitted_at >=
 * @param {string} [filters.to_date]   - ISO date string, submitted_at <=
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: Object[], total_count: number }>}
 */
async function listEngagementRequests(db, filters = {}, page = 1, pageSize = 20) {
  let query = db('engagement_requests');

  if (filters.record_id) {
    query = query.where('record_id', filters.record_id);
  }
  if (filters.request_type) {
    query = query.where('request_type', filters.request_type);
  }
  if (filters.status) {
    query = query.where('status', filters.status);
  }
  if (filters.from_date) {
    query = query.where('submitted_at', '>=', filters.from_date);
  }
  if (filters.to_date) {
    query = query.where('submitted_at', '<=', filters.to_date);
  }

  // Count total matching rows
  const countResult = await query.clone().count('request_id as count').first();
  const totalCount = parseInt(countResult.count, 10);

  // Paginated data
  const offset = (page - 1) * pageSize;
  const data = await query
    .clone()
    .orderBy('submitted_at', 'desc')
    .limit(pageSize)
    .offset(offset)
    .select('*');

  return { data, total_count: totalCount };
}

/**
 * Update engagement request status and optional curator_note.
 * Also sets updated_at = NOW() and updated_by_user_id.
 *
 * @param {import('knex').Knex} db
 * @param {string} requestId
 * @param {string} status
 * @param {string|null} curatorNote
 * @param {string} updatedByUserId
 * @returns {Promise<Object|null>} Updated row, or null if not found
 */
async function updateEngagementRequestStatus(db, requestId, status, curatorNote, updatedByUserId) {
  const updateData = {
    status,
    updated_at: db.fn.now(),
    updated_by_user_id: updatedByUserId,
  };

  // Allow explicit null to clear curator_note
  updateData.curator_note = curatorNote !== undefined ? curatorNote : null;

  const [row] = await db('engagement_requests')
    .where({ request_id: requestId })
    .update(updateData)
    .returning('*');

  return row || null;
}

module.exports = {
  getConfiguredOptions,
  getRecordPublicationState,
  insertEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
};
