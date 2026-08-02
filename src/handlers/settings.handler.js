'use strict';

/**
 * settings.handler.js
 *
 * HTTP handlers for SettingsService endpoints.
 * Maps service results and errors to HTTP responses per TechArch §4.1 error envelope:
 *   { "error": { "code": "...", "message": "..." } }
 *
 * Endpoints:
 *   GET /api/v1/admin/settings — CURATOR (auth at route level)
 *   PUT /api/v1/admin/settings — CURATOR (auth at route level)
 *
 * Both routes are CURATOR-gated (T-08-06 — hub_settings never exposed on public endpoints).
 */

const settingsService = require('../services/settings.service');

/**
 * Error code → HTTP status map.
 */
const ERROR_STATUS_MAP = {
  INVALID_EMAIL: 422,
  VALIDATION_ERROR: 422,
};

/**
 * Map a service-layer error to an HTTP response.
 *
 * @param {Error} err
 * @param {import('express').Response} res
 */
function handleError(err, res) {
  if (err && err.code && ERROR_STATUS_MAP[err.code] !== undefined) {
    const status = err.status || ERROR_STATUS_MAP[err.code];
    return res.status(status).json({
      error: { code: err.code, message: err.message || err.code },
    });
  }

  console.error('Unhandled settings service error:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}

/**
 * GET /api/v1/admin/settings — CURATOR only
 *
 * Returns all hub_settings rows as an array.
 * T-08-06: Route is CURATOR-gated — hub_settings never exposed on public endpoints.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getAllSettings(req, res) {
  try {
    const settings = await settingsService.getAllSettings(req.db);
    return res.status(200).json({ data: settings });
  } catch (err) {
    return handleError(err, res);
  }
}

/**
 * PUT /api/v1/admin/settings — CURATOR only (bulk update)
 *
 * Body: { settings: Array<{ setting_key: string, setting_value: string }> }
 * Returns: { data: HubSetting[] } for all keys in the request
 *
 * curator user_id is sourced from req.user (session), never from request body.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateSettings(req, res) {
  // req.user is set by app.js session→user mapping; fall back to req.session.user for safety
  const curatorUserId = (req.user || (req.session && req.session.user) || {}).user_id || null;

  try {
    const updatedSettings = await settingsService.updateSettings(
      req.db,
      req.body,
      curatorUserId,
    );
    return res.status(200).json({ data: updatedSettings });
  } catch (err) {
    return handleError(err, res);
  }
}

module.exports = {
  getAllSettings,
  updateSettings,
};
