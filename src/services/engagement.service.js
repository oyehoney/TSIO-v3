'use strict';

/**
 * engagement.service.js
 *
 * Business logic layer for EngagementService.
 * Implements F7: Engagement Routing per FRD §F07 and TechArch §2.1.
 *
 * Guards enforced in createEngagementRequest (in order):
 *   1. Rate limit (10/hour per IP) — enforced at route level via express-rate-limit
 *   2. CAPTCHA validation — CaptchaService.validate(captcha_token)
 *   3. Input validation — Zod schema with HTML-stripped text fields
 *   4. PUBLISHED guard — 404 RECORD_NOT_FOUND for non-existent or non-PUBLISHED records
 *   5. Engagement type guard — 422 INVALID_ENGAGEMENT_TYPE if request_type not in record's configured options
 *
 * EmailService trigger is NON-FATAL per TechArch §2.1:
 *   "Failure is non-fatal: logs error, submission/request record remains persisted."
 *
 * SECURITY:
 *   - All requestor text fields HTML-stripped via sanitize-html before validation + persistence (T-08-02)
 *   - PUBLISHED guard returns identical 404 for non-existent and non-published records (T-08-03)
 *   - changed_by_user_id always from session (curatorUserId param), never from request body
 */

const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');
const engagementRepository = require('../repositories/engagement.repository');
const CaptchaService = require('./CaptchaService');
const EmailService = require('./EmailService');
const logger = require('../utils/logger');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const VALID_ENGAGEMENT_TYPES = [
  'REQUEST_DEMO',
  'REQUEST_ADOPTION_DISCUSSION',
  'REQUEST_TECHNICAL_GUIDANCE',
  'REQUEST_BRIEFING',
];

// All 5 DB-allowed types (SUBMIT_RELATED_PROBLEM is valid at DB layer but not exposed
// on the public engagement form per FRD §F07 §Validation)
const ALL_DB_ENGAGEMENT_TYPES = [
  ...VALID_ENGAGEMENT_TYPES,
  'SUBMIT_RELATED_PROBLEM',
];

const VALID_STATUS = ['SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'];

/**
 * Zod schema for EngagementRequestCreateRequest.
 * Text fields are HTML-stripped before schema validation.
 */
const createRequestSchema = z.object({
  record_id: z.string().uuid({ message: 'record_id must be a valid UUID.' }),
  request_type: z.enum(VALID_ENGAGEMENT_TYPES, {
    message: 'request_type must be one of: REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING.',
  }),
  requestor_name: z.string()
    .min(2, 'requestor_name must be at least 2 characters.')
    .max(200, 'requestor_name must be at most 200 characters.'),
  requestor_email: z.string().email({ message: 'requestor_email must be a valid email address.' }),
  requestor_office: z.string()
    .min(2, 'requestor_office must be at least 2 characters.')
    .max(200, 'requestor_office must be at most 200 characters.'),
  requestor_title: z.string().max(200).optional().nullable(),
  description_of_interest: z.string()
    .min(20, 'description_of_interest must be at least 20 characters.')
    .max(2000, 'description_of_interest must be at most 2000 characters.'),
  desired_next_step: z.string().optional().nullable(),
  captcha_token: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUS, {
    message: 'status must be one of: SUBMITTED, IN_PROGRESS, COMPLETED, NO_ACTION.',
  }),
  curator_note: z.string().optional().nullable(),
});

// ─── HTML Sanitizer ───────────────────────────────────────────────────────────

const STRIP_ALL_HTML_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Strip HTML from a string field. Returns empty string for null/undefined.
 * @param {string|null|undefined} value
 * @returns {string}
 */
function stripHtml(value) {
  if (value === null || value === undefined) return '';
  return sanitizeHtml(String(value), STRIP_ALL_HTML_OPTIONS);
}

// ─── Error Factories ──────────────────────────────────────────────────────────

function makeError(status, code, message, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.message = message;
  Object.assign(err, extra);
  return err;
}

// ─── createEngagementRequest ──────────────────────────────────────────────────

/**
 * Create a new engagement request.
 *
 * Guards in order (per plan spec):
 *   1. Rate limit — handled at route level via engagementLimiter middleware
 *   2. CAPTCHA validation — CaptchaService.validate(captcha_token)
 *   3. Input validation — Zod schema with HTML-stripped fields
 *   4. PUBLISHED guard — 404 RECORD_NOT_FOUND for non-existent or non-PUBLISHED
 *   5. Engagement type guard — 422 INVALID_ENGAGEMENT_TYPE if not configured on record
 *
 * @param {import('knex').Knex} db
 * @param {Object} body - Raw request body (EngagementRequestCreateRequest)
 * @param {string} ipAddress - Requestor IP address
 * @returns {Promise<Object>} Created engagement_request row
 */
async function createEngagementRequest(db, body, ipAddress) {
  // ── 2. CAPTCHA validation ────────────────────────────────────────────────
  const captchaResult = await CaptchaService.validate(body.captcha_token || '');
  if (!captchaResult.valid) {
    throw makeError(
      422,
      'CAPTCHA_INVALID',
      'CAPTCHA verification failed. Please try again.',
    );
  }

  // ── 3. Input validation ──────────────────────────────────────────────────
  // HTML-strip all text fields before validation and persistence (T-08-02)
  const sanitizedBody = {
    record_id: body.record_id,
    request_type: body.request_type,
    captcha_token: body.captcha_token,
    requestor_name: stripHtml(body.requestor_name),
    requestor_email: body.requestor_email ? String(body.requestor_email).trim() : '',
    requestor_office: stripHtml(body.requestor_office),
    requestor_title: body.requestor_title != null ? stripHtml(body.requestor_title) : null,
    description_of_interest: stripHtml(body.description_of_interest),
    desired_next_step: body.desired_next_step != null ? stripHtml(body.desired_next_step) : null,
  };

  const parseResult = createRequestSchema.safeParse(sanitizedBody);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw makeError(422, 'VALIDATION_ERROR', firstIssue.message, {
      fields: parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const validated = parseResult.data;

  // ── 4. PUBLISHED guard ───────────────────────────────────────────────────
  // T-08-03: Return identical 404 for non-existent AND non-PUBLISHED records.
  // Public users must not know that non-published records exist.
  const publicationState = await engagementRepository.getRecordPublicationState(db, validated.record_id);
  if (!publicationState || publicationState !== 'PUBLISHED') {
    throw makeError(
      404,
      'RECORD_NOT_FOUND',
      'The requested record was not found.',
    );
  }

  // ── 5. Engagement type configured-on-record guard ────────────────────────
  // Per FRD §F07 §Validation: request_type must be configured on the target record.
  // This is distinct from the global enum — a record may only have 1-2 types configured.
  const configuredOptions = await engagementRepository.getConfiguredOptions(db, validated.record_id);
  if (!configuredOptions.includes(validated.request_type)) {
    throw makeError(
      422,
      'INVALID_ENGAGEMENT_TYPE',
      'This engagement option is not available for the selected record.',
    );
  }

  // ── Persist ──────────────────────────────────────────────────────────────
  const requestData = {
    record_id: validated.record_id,
    request_type: validated.request_type,
    requestor_name: validated.requestor_name,
    requestor_email: validated.requestor_email,
    requestor_office: validated.requestor_office,
    requestor_title: validated.requestor_title || null,
    description_of_interest: validated.description_of_interest,
    desired_next_step: validated.desired_next_step || null,
  };

  const request = await engagementRepository.insertEngagementRequest(db, requestData);

  // ── Email (NON-FATAL) ─────────────────────────────────────────────────────
  // TechArch §2.1: "Failure is non-fatal: logs error, submission/request record remains persisted."
  // Routing email is read from hub_settings AT SEND TIME (not cached at startup) per TechArch §2.1.
  try {
    await EmailService.sendRoutingNotification('engagement_request', request);
  } catch (err) {
    logger.error('EmailService failed for engagement request', {
      request_id: request.request_id,
      error: err.message,
    });
    // Do NOT re-throw — email failure is non-fatal
  }

  return request;
}

// ─── listEngagementRequests ───────────────────────────────────────────────────

/**
 * List engagement requests with optional filters + pagination.
 * CURATOR-only (enforced at route level).
 *
 * @param {import('knex').Knex} db
 * @param {Object} filters
 * @param {string} [filters.record_id]
 * @param {string} [filters.request_type]
 * @param {string} [filters.status]
 * @param {string} [filters.from_date]
 * @param {string} [filters.to_date]
 * @param {number} [filters.page=1]
 * @param {number} [filters.page_size=20]
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
async function listEngagementRequests(db, filters = {}) {
  const page = parseInt(filters.page, 10) || 1;
  const pageSize = Math.min(parseInt(filters.page_size, 10) || 20, 100);

  const { data, total_count } = await engagementRepository.listEngagementRequests(
    db,
    {
      record_id: filters.record_id,
      request_type: filters.request_type,
      status: filters.status,
      from_date: filters.from_date,
      to_date: filters.to_date,
    },
    page,
    pageSize,
  );

  const totalPages = Math.ceil(total_count / pageSize);

  return {
    data,
    pagination: {
      page,
      page_size: pageSize,
      total_count,
      total_pages: totalPages,
    },
  };
}

// ─── updateEngagementRequestStatus ───────────────────────────────────────────

/**
 * Update an engagement request's status and optional curator_note.
 * CURATOR-only (enforced at route level).
 *
 * @param {import('knex').Knex} db
 * @param {string} requestId
 * @param {Object} body - { status: EngagementRequestStatus, curator_note?: string | null }
 * @param {string} curatorUserId - From session, never from request body
 * @returns {Promise<Object>} Updated engagement_request row
 */
async function updateEngagementRequestStatus(db, requestId, body, curatorUserId) {
  // Validate status enum
  const parseResult = updateStatusSchema.safeParse(body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    throw makeError(422, 'VALIDATION_ERROR', firstIssue.message);
  }

  const { status, curator_note } = parseResult.data;

  const updated = await engagementRepository.updateEngagementRequestStatus(
    db,
    requestId,
    status,
    curator_note !== undefined ? curator_note : null,
    curatorUserId,
  );

  if (!updated) {
    throw makeError(
      404,
      'ENGAGEMENT_REQUEST_NOT_FOUND',
      'Engagement request not found.',
    );
  }

  return updated;
}

module.exports = {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
};
