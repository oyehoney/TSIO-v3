'use strict';

/**
 * engagement.repository.js
 *
 * Parameterized DB queries for engagement-related tables:
 *   - engagement_requests (CRUD for F7 engagement routing)
 *   - record_engagement_options (read-only here: validate configured types)
 *   - innovation_records (read publication_state for PUBLISHED guard)
 *
 * All queries use parameterized placeholders via Knex — no raw SQL string interpolation.
 * Per TechArch §3.2 DDL and FRD §F07.
 */

/**
 * Get the configured engagement option types for a given record.
 *
 * SELECT option_type FROM record_engagement_options WHERE record_id = $1
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId - UUID of the innovation record
 * @returns {Promise<string[]>} Array of EngagementOptionType strings (e.g. ['REQUEST_DEMO'])
 */
async function getConfiguredOptions(db, recordId) {
  const rows = await db('record_engagement_options')
    .where({ record_id: recordId })
    .orderBy('display_order', 'asc')
    .select('option_type');
  return rows.map((r) => r.option_type);
}

/**
 * Get the publication_state for a record.
 * Returns null if the record does not exist or has been soft-deleted.
 *
 * SELECT publication_state FROM innovation_records
 *   WHERE record_id = $1 AND deleted_at IS NULL
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId - UUID of the innovation record
 * @returns {Promise<string|null>} publication_state string or null if not found
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
 * Insert a new engagement request.
 *
 * INSERT INTO engagement_requests (...) VALUES (...) RETURNING *
 *
 * @param {import('knex').Knex} db
 * @param {{ record_id: string, request_type: string, requestor_name: string,
 *            requestor_email: string, requestor_office: string,
 *            requestor_title?: string, description_of_interest: string,
 *            desired_next_step?: string }} data
 * @returns {Promise<object>} Full engagement_requests row
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

  const [row] = await db('engagement_requests').insert(insertData).returning('*');
  return row;
}

/**
 * List engagement requests with optional filters and pagination.
 * Filters: record_id, request_type, status, from_date (submitted_at >=), to_date (submitted_at <=)
 * Ordered by submitted_at DESC with LIMIT/OFFSET pagination.
 *
 * @param {import('knex').Knex} db
 * @param {{ record_id?: string, request_type?: string, status?: string,
 *            from_date?: string, to_date?: string }} filters
 * @param {number} page - 1-indexed page number (default: 1)
 * @param {number} pageSize - items per page (default: 20)
 * @returns {Promise<{ data: object[], total_count: number }>}
 */
async function listEngagementRequests(db, filters = {}, page = 1, pageSize = 20) {
  const query = db('engagement_requests').where((builder) => {
    if (filters.record_id) builder.where('record_id', filters.record_id);
    if (filters.request_type) builder.where('request_type', filters.request_type);
    if (filters.status) builder.where('status', filters.status);
    if (filters.from_date) builder.where('submitted_at', '>=', filters.from_date);
    if (filters.to_date) builder.where('submitted_at', '<=', filters.to_date);
  });

  const countResult = await query.clone().count('request_id as total_count').first();
  const total_count = parseInt(countResult.total_count, 10) || 0;

  const offset = (page - 1) * pageSize;
  const data = await query
    .clone()
    .orderBy('submitted_at', 'desc')
    .limit(pageSize)
    .offset(offset)
    .select('*');

  return { data, total_count };
}

/**
 * Update engagement request status and optional curator_note.
 *
 * UPDATE engagement_requests
 *   SET status = $1, curator_note = $2, updated_at = NOW(), updated_by_user_id = $3
 *   WHERE request_id = $4 RETURNING *
 *
 * @param {import('knex').Knex} db
 * @param {string} requestId - UUID of the engagement request
 * @param {string} status - New status (SUBMITTED|IN_PROGRESS|COMPLETED|NO_ACTION)
 * @param {string|null} curatorNote - Optional curator note
 * @param {string} updatedByUserId - UUID of the curator making the update
 * @returns {Promise<object|null>} Updated row or null if not found
 */
async function updateEngagementRequestStatus(db, requestId, status, curatorNote, updatedByUserId) {
  const updateData = {
    status,
    updated_at: db.fn.now(),
    updated_by_user_id: updatedByUserId,
  };

  if (curatorNote !== undefined) {
    updateData.curator_note = curatorNote;
  }

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
