'use strict';

/**
 * engagement.handler.js
 *
 * HTTP request handlers for engagement endpoints:
 *   POST /api/v1/engagement-requests (PUBLIC)
 *   GET /api/v1/admin/engagement-requests (CURATOR)
 *   PATCH /api/v1/admin/engagement-requests/:request_id (CURATOR)
 *
 * Maps service results and errors to HTTP responses per TechArch §4.1 error envelope:
 *   { "error": { "code": "...", "message": "..." } }
 */

const EngagementService = require('../services/engagement.service');

/**
 * Extract client IP address from request.
 * Handles X-Forwarded-For (proxy/load balancer) and falls back to req.ip.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the first (leftmost) address
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '127.0.0.1';
}

/**
 * Map service error to HTTP status code.
 * @param {{ status?: number, code?: string }} err
 * @returns {number}
 */
function getErrorStatus(err) {
  if (err && err.status) return err.status;
  const CODE_TO_STATUS = {
    RECORD_NOT_FOUND: 404,
    INVALID_ENGAGEMENT_TYPE: 422,
    CAPTCHA_INVALID: 422,
    VALIDATION_ERROR: 422,
    INVALID_STATUS: 422,
    ENGAGEMENT_REQUEST_NOT_FOUND: 404,
    RATE_LIMIT_EXCEEDED: 429,
  };
  if (err && err.code && CODE_TO_STATUS[err.code]) {
    return CODE_TO_STATUS[err.code];
  }
  return 500;
}

/**
 * POST /api/v1/engagement-requests — PUBLIC (no auth required)
 * Rate limiter applied at route level (engagementLimiter: 10/hr per IP).
 */
async function createEngagementRequest(req, res) {
  const ipAddress = getClientIp(req);
  const { db } = req;
  try {
    const engagementRequest = await EngagementService.createEngagementRequest(db, req.body, ipAddress);
    return res.status(201).json(engagementRequest);
  } catch (err) {
    const status = getErrorStatus(err);
    const errorBody = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' } };

    // Set rate limit headers on 429 responses
    if (status === 429) {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      res.set('X-RateLimit-Limit', '10');
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(resetTime));
      res.set('Retry-After', '3600');
    }

    if (status === 500) {
      console.error('[EngagementHandler] Unhandled error:', err);
    }

    return res.status(status).json(errorBody);
  }
}

/**
 * GET /api/v1/admin/engagement-requests — CURATOR (auth middleware applied at route level)
 * Query params: record_id, request_type, status, from_date, to_date, page, page_size
 */
async function listEngagementRequests(req, res) {
  const { db } = req;
  const filters = {
    record_id: req.query.record_id || undefined,
    request_type: req.query.request_type || undefined,
    status: req.query.status || undefined,
    from_date: req.query.from_date || undefined,
    to_date: req.query.to_date || undefined,
    page: req.query.page || undefined,
    page_size: req.query.page_size || undefined,
  };

  // Remove undefined keys
  Object.keys(filters).forEach((key) => {
    if (filters[key] === undefined) delete filters[key];
  });

  try {
    const result = await EngagementService.listEngagementRequests(db, filters);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[EngagementHandler] listEngagementRequests error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
}

/**
 * PATCH /api/v1/admin/engagement-requests/:request_id — CURATOR
 * Body: { status: EngagementRequestStatus, curator_note?: string | null }
 */
async function updateEngagementRequestStatus(req, res) {
  const { db } = req;
  const { request_id } = req.params;
  const curatorUserId = req.session && req.session.user ? req.session.user.user_id : null;

  try {
    const updated = await EngagementService.updateEngagementRequestStatus(
      db,
      request_id,
      req.body,
      curatorUserId
    );
    return res.status(200).json(updated);
  } catch (err) {
    const status = getErrorStatus(err);
    if (status === 500) {
      console.error('[EngagementHandler] updateEngagementRequestStatus error:', err);
    }
    return res.status(status).json({
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' },
    });
  }
}

module.exports = {
  createEngagementRequest,
  listEngagementRequests,
  updateEngagementRequestStatus,
};
