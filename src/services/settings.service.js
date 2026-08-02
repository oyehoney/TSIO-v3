'use strict';

/**
 * settings.service.js
 *
 * Business logic layer for SettingsService.
 * Implements F8: Administration (hub_settings CRUD) per FRD §F08 and TechArch §2.1.
 *
 * Per-key validation rules (FRD §F08b §Validation + TechArch §2.1 SettingsService):
 *   engagement_routing_email:
 *     - Must be non-blank (422 VALIDATION_ERROR if blank)
 *     - Must be valid email format (422 INVALID_EMAIL if invalid format)
 *   catalog_default_page_size:
 *     - Must be integer 6–50 (422 VALIDATION_ERROR if out of range)
 *   contact_display_email:
 *     - If provided and non-blank, must be valid email format (422 INVALID_EMAIL)
 *   default_perspective:
 *     - If provided, must be 'EXECUTIVE' or 'TECHNICAL' (422 VALIDATION_ERROR)
 *   Other keys: pass through without additional validation (forward-compatible)
 *
 * DESIGN CONTRACT:
 *   getSettingByKey is exported so EmailService can call it at send time without caching.
 *   Routing email must be readable by EmailService at send time (per TechArch §2.1).
 *
 * SECURITY:
 *   - engagement_routing_email validated for email format before persistence (T-08-05)
 *   - updated_by_user_id always from session (curatorUserId param), never from request body
 */

const settingsRepository = require('../repositories/settings.repository');

// ─── Email Validation ─────────────────────────────────────────────────────────

// RFC 5321-compatible email regex (same pattern used in recordHandler + engagementService)
// Covers the vast majority of valid email addresses including .gov domains
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Check if a string is a valid email address.
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

// ─── Error Factory ────────────────────────────────────────────────────────────

function makeError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// ─── Per-Key Validation ───────────────────────────────────────────────────────

/**
 * Validate a single hub_settings key-value pair.
 * Throws on invalid values.
 *
 * @param {string} key
 * @param {string} value
 */
function validateSettingItem(key, value) {
  switch (key) {
    case 'engagement_routing_email': {
      // Must be non-blank
      if (value === null || value === undefined || value.trim() === '') {
        throw makeError(422, 'VALIDATION_ERROR', 'Routing email must not be blank.');
      }
      // Must be valid email format
      if (!isValidEmail(value)) {
        throw makeError(422, 'INVALID_EMAIL', 'Routing email must be a valid email address.');
      }
      break;
    }

    case 'catalog_default_page_size': {
      // Must be integer 6–50
      const num = Number(value);
      if (!Number.isInteger(num) || num < 6 || num > 50) {
        throw makeError(
          422,
          'VALIDATION_ERROR',
          'Page size must be between 6 and 50.',
        );
      }
      break;
    }

    case 'contact_display_email': {
      // If provided and non-blank, must be valid email format
      if (value !== null && value !== undefined && value.trim() !== '') {
        if (!isValidEmail(value)) {
          throw makeError(422, 'INVALID_EMAIL', 'Contact display email must be a valid email address.');
        }
      }
      break;
    }

    case 'default_perspective': {
      // If provided, must be EXECUTIVE or TECHNICAL
      if (value !== null && value !== undefined && value.trim() !== '') {
        if (!['EXECUTIVE', 'TECHNICAL'].includes(value.trim())) {
          throw makeError(
            422,
            'VALIDATION_ERROR',
            "Default perspective must be 'EXECUTIVE' or 'TECHNICAL'.",
          );
        }
      }
      break;
    }

    default:
      // Other keys: pass through without additional validation (forward-compatible)
      break;
  }
}

// ─── getAllSettings ───────────────────────────────────────────────────────────

/**
 * Get all hub_settings rows as an array of HubSetting objects.
 *
 * @param {import('knex').Knex} db
 * @returns {Promise<Array<{setting_key: string, setting_value: string, description: string|null, updated_at: Date}>>}
 */
async function getAllSettings(db) {
  return settingsRepository.getAllSettings(db);
}

// ─── updateSettings ───────────────────────────────────────────────────────────

/**
 * Bulk update hub_settings. Validates each key-value pair, then persists.
 *
 * @param {import('knex').Knex} db
 * @param {Object} body - { settings: Array<{ setting_key: string, setting_value: string }> }
 * @param {string|null} updatedByUserId - Curator user_id from session (T-08-05)
 * @returns {Promise<Array>} Updated HubSetting[] for all keys in request
 */
async function updateSettings(db, body, updatedByUserId) {
  if (!body || !Array.isArray(body.settings)) {
    throw makeError(422, 'VALIDATION_ERROR', 'Request body must contain a settings array.');
  }

  // Validate all items before writing any (fail-fast — all-or-nothing per request)
  for (const item of body.settings) {
    if (!item.setting_key || typeof item.setting_key !== 'string') {
      throw makeError(422, 'VALIDATION_ERROR', 'Each setting must have a setting_key string.');
    }
    if (item.setting_value === undefined || item.setting_value === null) {
      throw makeError(422, 'VALIDATION_ERROR', `setting_value is required for key '${item.setting_key}'.`);
    }
    validateSettingItem(item.setting_key, String(item.setting_value));
  }

  // Persist all validated items
  const updatedRows = [];
  for (const item of body.settings) {
    const row = await settingsRepository.upsertSetting(
      db,
      item.setting_key,
      String(item.setting_value),
      updatedByUserId,
    );
    updatedRows.push(row);
  }

  return updatedRows;
}

// ─── getSettingByKey ──────────────────────────────────────────────────────────

/**
 * Get a single setting value by key.
 * Called by EmailService at send time (not cached at startup — per TechArch §2.1).
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @returns {Promise<string|null>}
 */
async function getSettingByKey(db, settingKey) {
  return settingsRepository.getSettingByKey(db, settingKey);
}

module.exports = {
  getAllSettings,
  updateSettings,
  getSettingByKey,
};
