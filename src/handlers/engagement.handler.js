'use strict';

/**
 * engagement.handler.js
 *
 * HTTP handlers for EngagementService endpoints.
 * Maps service results and errors to HTTP responses per TechArch §4.1 error envelope:
 *   { "error": { "code": "...", "message": "..." } }
 *
 * Endpoints:
 *   POST   /api/v1/engagement-requests           — PUBLIC (no auth)
 *   GET    /api/v1/admin/engagement-requests      — CURATOR (auth at route level)
 *   PATCH  /api/v1/admin/engagement-requests/:id — CURATOR (auth at route level)
 */

const engagementService = require('../services/engagement.service');

/**
 * Error code → HTTP status map.
 * Drives the handleError utility below.
 */
const ERROR_STATUS_MAP = {
  RECORD_NOT_FOUND: 404,
  ENGAGEMENT_REQUEST_NOT_FOUND: 404,
  INVALID_ENGAGEMENT_TYPE: 422,
  CAPTCHA_INVALID: 422,
  VALIDATION_ERROR: 422,
  RATE_LIMIT_EXCEEDED: 429,
};

/**
 * Map a service-layer error to an HTTP response.
 * Falls back to 500 for unknown errors.
 *
 * @param {Error} err
 * @param {import('express').Response} res
 */
function handleError(err, res) {
  if (err && err.code && ERROR_STATUS_MAP[err.code] !== undefined) {
    const status = err.status || ERROR_STATUS_MAP[err.code];
    const body = { error: { code: err.code, message: err.message || err.code } };
    if (err.fields) {
      body.error.fields = err.fields;
    }
    return res.status(status).json(body);
  }

  // Unknown error — log and return 500
  console.error('Unhandled engagement service error:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}

/**
 * POST /api/v1/engagement-requests — PUBLIC (no auth required)
 *
 * Extracts IP from X-Forwarded-For (proxy) or req.ip.
 * Rate limiting is handled by engagementLimiter middleware at the route level.
 * On 429 from rate limiter, the middleware handles the response directly (not this handler).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createEngagementRequest(req, res) {
  // Extract real IP — handle proxy headers (X-Forwarded-For may be comma-separated list)
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = forwarded
    ? String(forwarded).split(',')[0].trim()
    : req.ip || '0.0.0.0';

  try {
    const engagementRequest = await engagementService.createEngagementRequest(
      req.db,
      req.body,
      ipAddress,
    );
    return res.status(201).json(engagementRequest);
  } catch (err) {
    return handleError(err, res);
  }
}

/**
 * GET /api/v1/admin/engagement-requests — CURATOR only
 *
 * Query parameters:
 *   record_id, request_type, status, from_date, to_date, page, page_size
 *
 * Returns: PaginatedResponse<EngagementRequest>
 *   { data: [...], pagination: { page, page_size, total_count, total_pages } }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listEngagementRequests(req, res) {
  const filters = {
    record_id: req.query.record_id || undefined,
    request_type: req.query.request_type || undefined,
    status: req.query.status || undefined,
    from_date: req.query.from_date || undefined,
    to_date: req.query.to_date || undefined,
    page: req.query.page,
    page_size: req.query.page_size,
  };

  try {
    const result = await engagementService.listEngagementRequests(req.db, filters);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

/**
 * PATCH /api/v1/admin/engagement-requests/:request_id — CURATOR only
 *
 * Body: { status: EngagementRequestStatus, curator_note?: string | null }
 * Returns updated EngagementRequest on success; 404 if request_id not found.
 *
 * curator user_id is sourced from req.user (session), never from request body.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateEngagementRequestStatus(req, res) {
  const { request_id } = req.params;
  // req.user is set by authenticateOidc middleware; fall back to req.session.user for tests
  const curatorUserId = (req.user || req.session.user || {}).user_id;

  try {
    const updated = await engagementService.updateEngagementRequestStatus(
      req.db,
      request_id,
      req.body,
      curatorUserId,
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleError(err, res);
  }
}

module.exports = {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
};
