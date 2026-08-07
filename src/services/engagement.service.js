'use strict';

/**
 * engagement.service.js
 *
 * Business logic for engagement request creation, listing, and status updates.
 * Implements F7: Engagement Routing per FRD §F07 and TechArch §2.1.
 *
 * Guard order for createEngagementRequest:
 *   1. Rate limit check (IP-based, 10/hr) — enforced at route layer via engagementLimiter
 *   2. CAPTCHA validation — CaptchaService.validate()
 *   3. Input validation — Zod schema
 *   4. Record existence + PUBLISHED guard — 404 for non-existent or non-PUBLISHED
 *   5. Engagement type configured-on-record guard — 422 INVALID_ENGAGEMENT_TYPE
 *   6. Persist to engagement_requests
 *   7. EmailService trigger (non-fatal)
 */

const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');
const CaptchaService = require('./CaptchaService');
const EmailService = require('./EmailService');
const EngagementRepository = require('../repositories/engagement.repository');
const logger = require('../utils/logger');

// Valid engagement request types per FRD §F07 (public form exposes 4 engagement types)
const VALID_ENGAGEMENT_TYPES = [
  'REQUEST_DEMO',
  'REQUEST_ADOPTION_DISCUSSION',
  'REQUEST_TECHNICAL_GUIDANCE',
  'REQUEST_BRIEFING',
];

// Valid status values for updateEngagementRequestStatus
const VALID_STATUSES = ['SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'];

// Zod schema for createEngagementRequest input
const engagementRequestSchema = z.object({
  record_id: z.string().uuid({ message: 'record_id must be a valid UUID.' }),
  request_type: z.enum(VALID_ENGAGEMENT_TYPES, {
    errorMap: () => ({ message: `request_type must be one of: ${VALID_ENGAGEMENT_TYPES.join(', ')}.` }),
  }),
  requestor_name: z.string().min(2, 'requestor_name must be at least 2 characters.').max(200, 'requestor_name must be at most 200 characters.'),
  requestor_email: z.string().email({ message: 'requestor_email must be a valid email address.' }),
  requestor_office: z.string().min(2, 'requestor_office must be at least 2 characters.').max(200, 'requestor_office must be at most 200 characters.'),
  requestor_title: z.string().max(200).optional(),
  description_of_interest: z.string().min(20, 'description_of_interest must be at least 20 characters.').max(2000, 'description_of_interest must be at most 2000 characters.'),
  desired_next_step: z.string().max(2000).optional(),
  captcha_token: z.string().optional(),
});

/**
 * Strip HTML from a string value.
 * @param {string} val
 * @returns {string}
 */
function stripHtml(val) {
  if (typeof val !== 'string') return val;
  return sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });
}

/**
 * Sanitize all string fields in the body.
 * @param {object} body
 * @returns {object}
 */
function sanitizeBody(body) {
  const result = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      result[key] = stripHtml(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Create a new engagement request (PUBLIC endpoint).
 *
 * Guards (in order):
 *   1. Rate limit — enforced at route layer (express-rate-limit middleware)
 *   2. CAPTCHA validation
 *   3. Input validation (Zod)
 *   4. Record PUBLISHED guard
 *   5. Engagement type configured-on-record guard
 *   Then: persist, email (non-fatal), return
 *
 * @param {import('knex').Knex} db
 * @param {object} body - Raw request body
 * @param {string} ipAddress - Client IP address (for logging)
 * @returns {Promise<object>} Created EngagementRequest row
 * @throws {{ status: number, code: string, message: string }}
 */
async function createEngagementRequest(db, body, ipAddress) {
  // Guard 2: CAPTCHA validation
  const captchaToken = body.captcha_token;
  const captchaResult = await CaptchaService.validate(captchaToken);
  if (!captchaResult.valid) {
    throw {
      status: 422,
      code: 'CAPTCHA_INVALID',
      message: 'CAPTCHA verification failed. Please try again.',
    };
  }

  // Sanitize HTML from all string fields before validation and persistence
  const sanitized = sanitizeBody(body);

  // Guard 3: Input validation via Zod
  // Note: Zod v4 uses .issues (not .errors) for the array of validation errors
  const parseResult = engagementRequestSchema.safeParse(sanitized);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const firstIssue = issues[0];
    throw {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: firstIssue ? firstIssue.message : 'Validation failed.',
    };
  }

  const validated = parseResult.data;

  // Guard 4: Record existence + PUBLISHED guard
  // Per TechArch §T-08-03: return 404 for both non-existent AND non-PUBLISHED records
  // to prevent enumeration of draft record IDs.
  const publicationState = await EngagementRepository.getRecordPublicationState(db, validated.record_id);
  if (!publicationState || publicationState !== 'PUBLISHED') {
    throw {
      status: 404,
      code: 'RECORD_NOT_FOUND',
      message: 'The requested record was not found.',
    };
  }

  // Guard 5: Engagement type configured-on-record guard
  // Per FRD §F07 §Validation: "request_type must be one of the engagement options configured
  // for the target record."
  const configuredOptions = await EngagementRepository.getConfiguredOptions(db, validated.record_id);
  if (!configuredOptions.includes(validated.request_type)) {
    throw {
      status: 422,
      code: 'INVALID_ENGAGEMENT_TYPE',
      message: 'This engagement option is not available for the selected record.',
    };
  }

  // Persist engagement request (exclude captcha_token from persistence)
  const { captcha_token: _captchaToken, ...insertData } = validated;
  const engagementRequest = await EngagementRepository.insertEngagementRequest(db, insertData);

  // Email notification (non-fatal per TechArch §2.1)
  // "Failure is non-fatal: logs error, submission/request record remains persisted"
  // EmailService reads engagement_routing_email from hub_settings at send time (not cached at startup)
  // per TechArch §2.1: "Read routing address at send time (not cached at startup)"
  try {
    await EmailService.sendRoutingNotification('engagement_request', engagementRequest);
  } catch (err) {
    logger.error('[EngagementService] EmailService failed for engagement request', {
      request_id: engagementRequest.request_id,
      err: err.message,
    });
    // Do NOT re-throw — email failure must not roll back the persisted request
  }

  return engagementRequest;
}

/**
 * List engagement requests with optional filters (CURATOR only — enforced at route level).
 *
 * @param {import('knex').Knex} db
 * @param {{ record_id?: string, request_type?: string, status?: string,
 *            from_date?: string, to_date?: string,
 *            page?: number, page_size?: number }} filters
 * @returns {Promise<{ data: object[], pagination: { page, page_size, total_count, total_pages } }>}
 */
async function listEngagementRequests(db, filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const page_size = Math.min(100, Math.max(1, parseInt(filters.page_size, 10) || 20));

  const { page: _p, page_size: _ps, ...queryFilters } = filters;

  const { data, total_count } = await EngagementRepository.listEngagementRequests(
    db,
    queryFilters,
    page,
    page_size
  );

  const total_pages = Math.ceil(total_count / page_size) || 1;

  return {
    data,
    pagination: {
      page,
      page_size,
      total_count,
      total_pages,
    },
  };
}

/**
 * Update an engagement request's status and optional curator_note (CURATOR only).
 *
 * @param {import('knex').Knex} db
 * @param {string} requestId - UUID of the engagement request
 * @param {{ status: string, curator_note?: string|null }} body
 * @param {string} curatorUserId - UUID of the curator making the update
 * @returns {Promise<object>} Updated EngagementRequest row
 * @throws {{ status: number, code: string, message: string }}
 */
async function updateEngagementRequestStatus(db, requestId, body, curatorUserId) {
  const { status, curator_note } = body;

  // Validate status is a valid EngagementRequestStatus
  if (!status || !VALID_STATUSES.includes(status)) {
    throw {
      status: 422,
      code: 'INVALID_STATUS',
      message: `status must be one of: ${VALID_STATUSES.join(', ')}.`,
    };
  }

  const updated = await EngagementRepository.updateEngagementRequestStatus(
    db,
    requestId,
    status,
    curator_note !== undefined ? curator_note : null,
    curatorUserId
  );

  if (!updated) {
    throw {
      status: 404,
      code: 'ENGAGEMENT_REQUEST_NOT_FOUND',
      message: 'Engagement request not found.',
    };
  }

  return updated;
}

module.exports = {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
};
