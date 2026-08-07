'use strict';
const { getDb } = require('../db');

/**
 * Get the value of a hub_settings key.
 * @param {string} key - The setting_key to look up
 * @returns {Promise<string|null>} - The setting_value or null if not found
 */
async function getSettingValue(key) {
  const db = getDb();
  const row = await db('hub_settings').where({ setting_key: key }).first();
  return row ? row.setting_value : null;
}

/**
 * Get all hub settings.
 * @returns {Promise<Array>}
 */
async function getAllSettings() {
  const db = getDb();
  return db('hub_settings').select('*').orderBy('setting_key');
}

/**
 * Update a hub setting value.
 * @param {string} key - The setting_key to update
 * @param {string} value - The new value
 * @param {string} updatedByUserId - The user_id of the curator making the change
 * @returns {Promise<string|null>} - The updated setting_value
 */
async function updateSetting(key, value, updatedByUserId) {
  const db = getDb();
  await db('hub_settings')
    .where({ setting_key: key })
    .update({ setting_value: value, updated_at: new Date(), updated_by_user_id: updatedByUserId });
  return getSettingValue(key);
}

module.exports = { getSettingValue, getAllSettings, updateSetting };
