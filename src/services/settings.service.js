'use strict';

/**
 * settings.service.js
 *
 * Business logic for hub settings management.
 * Implements F8: Curation and Administration per FRD §F08b and TechArch §2.1.
 *
 * Key design decision (TechArch §2.1):
 *   getSettingByKey() is exported and callable at send time (not cached at startup).
 *   EmailService calls this at email send time to get the current routing address.
 */

const SettingsRepository = require('../repositories/settings.repository');

// Email validation regex (RFC 5321 compatible)
// Validates: local@domain.tld with common characters
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a setting value for a given key.
 * Throws { status: 422, code, message } on validation failure.
 *
 * Per-key validation rules (FRD §F08b §Validation + TechArch §2.1 SettingsService):
 *   engagement_routing_email: non-blank, valid email
 *   catalog_default_page_size: integer 6-50
 *   contact_display_email: if non-blank, valid email
 *   default_perspective: EXECUTIVE or TECHNICAL
 *   Other keys: pass through without extra validation
 *
 * @param {string} key
 * @param {string} value
 * @throws {{ status: 422, code: string, message: string }}
 */
function validateSetting(key, value) {
  switch (key) {
    case 'engagement_routing_email': {
      if (value === '' || value === null || value === undefined) {
        throw {
          status: 422,
          code: 'VALIDATION_ERROR',
          message: 'Routing email must not be blank.',
        };
      }
      if (!EMAIL_REGEX.test(value.trim())) {
        throw {
          status: 422,
          code: 'INVALID_EMAIL',
          message: 'Routing email must be a valid email address.',
        };
      }
      break;
    }
    case 'catalog_default_page_size': {
      const num = parseInt(value, 10);
      if (isNaN(num) || String(num) !== String(value) || num < 6 || num > 50) {
        throw {
          status: 422,
          code: 'VALIDATION_ERROR',
          message: 'Page size must be between 6 and 50.',
        };
      }
      break;
    }
    case 'contact_display_email': {
      // Only validate if non-blank
      if (value && value.trim() !== '') {
        if (!EMAIL_REGEX.test(value.trim())) {
          throw {
            status: 422,
            code: 'INVALID_EMAIL',
            message: 'Contact display email must be a valid email address.',
          };
        }
      }
      break;
    }
    case 'default_perspective': {
      if (value && !['EXECUTIVE', 'TECHNICAL'].includes(value)) {
        throw {
          status: 422,
          code: 'VALIDATION_ERROR',
          message: "default_perspective must be 'EXECUTIVE' or 'TECHNICAL'.",
        };
      }
      break;
    }
    default:
      // Other keys pass through without additional validation (forward-compatible)
      break;
  }
}

/**
 * Get all hub settings.
 *
 * @param {import('knex').Knex} db
 * @returns {Promise<Array<{ setting_key, setting_value, description, updated_at }>>}
 */
async function getAllSettings(db) {
  return SettingsRepository.getAllSettings(db);
}

/**
 * Bulk update hub settings.
 * Validates each key-value pair before persisting any.
 * All validations run first, then all upserts execute (fail-fast on first invalid).
 *
 * @param {import('knex').Knex} db
 * @param {{ settings: Array<{ setting_key: string, setting_value: string }> }} body
 * @param {string|null} updatedByUserId - UUID of the curator or null
 * @returns {Promise<Array<object>>} Updated HubSetting[] for all keys in the request
 * @throws {{ status: 422, code: string, message: string }} on validation failure
 */
async function updateSettings(db, body, updatedByUserId) {
  const { settings } = body;

  if (!Array.isArray(settings) || settings.length === 0) {
    throw {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'settings must be a non-empty array of { setting_key, setting_value } objects.',
    };
  }

  // Validate all settings first (fail-fast: throw on first validation error)
  for (const { setting_key, setting_value } of settings) {
    if (!setting_key || typeof setting_key !== 'string') {
      throw {
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Each setting must have a non-empty setting_key.',
      };
    }
    // setting_value must be a string (may be empty for non-email fields)
    if (typeof setting_value !== 'string') {
      throw {
        status: 422,
        code: 'VALIDATION_ERROR',
        message: `setting_value for '${setting_key}' must be a string.`,
      };
    }
    validateSetting(setting_key, setting_value);
  }

  // Persist all validated settings
  const updatedRows = [];
  for (const { setting_key, setting_value } of settings) {
    const row = await SettingsRepository.upsertSetting(db, setting_key, setting_value, updatedByUserId);
    updatedRows.push(row);
  }

  return updatedRows;
}

/**
 * Get a single setting value by key.
 * Called by EmailService at send time — NOT cached at startup per TechArch §2.1.
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @returns {Promise<string|null>}
 */
async function getSettingByKey(db, settingKey) {
  return SettingsRepository.getSettingByKey(db, settingKey);
}

module.exports = {
  getAllSettings,
  updateSettings,
  getSettingByKey,
};
