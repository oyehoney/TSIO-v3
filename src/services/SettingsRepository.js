'use strict';
// src/services/SettingsRepository.js
const { getDb } = require('../db');

/**
 * Get a single setting value by key from hub_settings table.
 * @param {string} key - The setting_key to look up
 * @returns {Promise<string|null>} The setting_value, or null if not found
 */
async function getSettingValue(key) {
  const db = getDb();
  const row = await db('hub_settings').where({ setting_key: key }).first();
  return row ? row.setting_value : null;
}

/**
 * Get all settings from hub_settings table.
 * @returns {Promise<Array>} All settings ordered by setting_key
 */
async function getAllSettings() {
  const db = getDb();
  return db('hub_settings').select('*').orderBy('setting_key');
}

/**
 * Update a setting value in hub_settings table.
 * @param {string} key - The setting_key to update
 * @param {string} value - New value
 * @param {string} updatedByUserId - UUID of the curator making the change
 * @returns {Promise<string|null>} The new setting value
 */
async function updateSetting(key, value, updatedByUserId) {
  const db = getDb();
  await db('hub_settings')
    .where({ setting_key: key })
    .update({
      setting_value: value,
      updated_at: new Date(),
      updated_by_user_id: updatedByUserId
    });
  return getSettingValue(key);
}

module.exports = { getSettingValue, getAllSettings, updateSetting };
