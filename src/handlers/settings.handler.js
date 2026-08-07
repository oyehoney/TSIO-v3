'use strict';

/**
 * settings.handler.js
 *
 * HTTP request handlers for settings endpoints:
 *   GET /api/v1/admin/settings (CURATOR)
 *   PUT /api/v1/admin/settings (CURATOR — bulk update)
 *
 * Maps service results and errors to HTTP responses per TechArch §4.1 error envelope:
 *   { "error": { "code": "...", "message": "..." } }
 */

const SettingsService = require('../services/settings.service');

/**
 * GET /api/v1/admin/settings — CURATOR
 * Returns all hub_settings rows as an array of HubSetting objects.
 * Response: { data: HubSetting[] }
 */
async function getAllSettings(req, res) {
  const { db } = req;
  try {
    const settings = await SettingsService.getAllSettings(db);
    return res.status(200).json({ data: settings });
  } catch (err) {
    console.error('[SettingsHandler] getAllSettings error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
}

/**
 * PUT /api/v1/admin/settings — CURATOR (bulk update)
 * Body: { settings: [{ setting_key: string, setting_value: string }, ...] }
 * Response: { data: HubSetting[] } for all updated keys
 * Errors: 422 with { error: { code, message } } on validation failure
 */
async function updateSettings(req, res) {
  const { db } = req;
  const curatorUserId = req.session && req.session.user ? req.session.user.user_id : null;

  try {
    const updatedSettings = await SettingsService.updateSettings(db, req.body, curatorUserId);
    return res.status(200).json({ data: updatedSettings });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) {
      console.error('[SettingsHandler] updateSettings error:', err);
    }
    return res.status(status).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred.',
      },
    });
  }
}

module.exports = {
  getAllSettings,
  updateSettings,
};
