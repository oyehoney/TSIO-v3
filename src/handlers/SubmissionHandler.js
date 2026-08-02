'use strict';
// src/handlers/SubmissionHandler.js
const SubmissionService = require('../services/SubmissionService');

/**
 * Map service errors to HTTP responses per FRD error catalog.
 * err.status — HTTP status code (default 500)
 * err.code — machine-readable error code
 * err.fields — validation field errors (optional)
 */
function handleServiceError(res, err) {
  const status = err.status || 500;
  const body = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message } };
  if (err.fields) body.error.fields = err.fields;
  return res.status(status).json(body);
}

/**
 * POST /api/v1/opportunity-submissions
 * Public endpoint (rate-limited by submissionLimiter).
 * Returns 201 with full OpportunitySubmission object on success.
 * Returns 422 on CAPTCHA_INVALID or VALIDATION_ERROR.
 */
async function postOpportunitySubmission(req, res) {
  try {
    const submission = await SubmissionService.createOpportunitySubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

/**
 * GET /api/v1/admin/opportunity-submissions
 * CURATOR-protected. Returns paginated list ordered by submitted_at DESC.
 */
async function getOpportunitySubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listOpportunitySubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

/**
 * PATCH /api/v1/admin/opportunity-submissions/:id
 * CURATOR-protected. Updates disposition + optional linked_record_id + internal_note.
 * reviewed_by_user_id sourced from req.user.user_id (not request body — T-07-05).
 */
async function patchOpportunityDisposition(req, res) {
  try {
    const updated = await SubmissionService.updateOpportunityDisposition(
      req.params.id,
      req.body,
      req.user.user_id
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

/**
 * POST /api/v1/contribution-submissions
 * Public endpoint (rate-limited by submissionLimiter).
 * Returns 201 with full ContributionSubmission object on success.
 * Returns 422 on CAPTCHA_INVALID, VALIDATION_ERROR, ARTIFACT_URL_REQUIRED, INVALID_ARTIFACT_URL.
 */
async function postContributionSubmission(req, res) {
  try {
    const submission = await SubmissionService.createContributionSubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

/**
 * GET /api/v1/admin/contribution-submissions
 * CURATOR-protected. Returns paginated list ordered by submitted_at DESC.
 */
async function getContributionSubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listContributionSubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

/**
 * PATCH /api/v1/admin/contribution-submissions/:id
 * CURATOR-protected. Updates disposition + optional fields.
 * reviewed_by_user_id sourced from req.user.user_id (not request body — T-07-05).
 */
async function patchContributionDisposition(req, res) {
  try {
    const updated = await SubmissionService.updateContributionDisposition(
      req.params.id,
      req.body,
      req.user.user_id
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
};
