'use strict';

/**
 * settings.repository.js
 *
 * Parameterized DB queries for hub_settings table.
 * Per TechArch §3.2 DDL (001_supporting_tables.sql).
 *
 * DESIGN CONTRACT:
 *   getSettingByKey is called at send time by EmailService — NOT cached at startup.
 *   This allows curators to change engagement_routing_email without restarting the app.
 *   (TechArch §2.1 SettingsService spec, plan spec key_links §EmailService)
 *
 * SECURITY:
 *   - All queries use Knex parameterized bindings — no raw SQL interpolation.
 *   - updated_by_user_id is always sourced from session (curator user_id), never request body (T-08-05).
 */

/**
 * Get all hub_settings rows ordered by setting_key.
 *
 * @param {import('knex').Knex} db
 * @returns {Promise<Array<{setting_key: string, setting_value: string, description: string|null, updated_at: Date}>>}
 */
async function getAllSettings(db) {
  return db('hub_settings').select('*').orderBy('setting_key', 'asc');
}

/**
 * Get a single setting value by key.
 * Called by EmailService at send time (not cached at startup — per TechArch §2.1).
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @returns {Promise<string|null>} The setting_value, or null if key not found
 */
async function getSettingByKey(db, settingKey) {
  const row = await db('hub_settings')
    .where({ setting_key: settingKey })
    .select('setting_value')
    .first();

  return row ? row.setting_value : null;
}

/**
 * Upsert a setting key-value pair.
 * Uses INSERT ... ON CONFLICT (setting_key) DO UPDATE for forward-compatible new keys.
 * Also sets updated_at = NOW() and records the curator who made the change.
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @param {string} settingValue
 * @param {string|null} updatedByUserId - Curator user_id from session (T-08-05 audit)
 * @returns {Promise<Object>} Updated hub_settings row
 */
async function upsertSetting(db, settingKey, settingValue, updatedByUserId) {
  const [row] = await db.raw(
    `INSERT INTO hub_settings (setting_key, setting_value, updated_at, updated_by_user_id)
     VALUES (?, ?, NOW(), ?)
     ON CONFLICT (setting_key)
     DO UPDATE SET
       setting_value = EXCLUDED.setting_value,
       updated_at = NOW(),
       updated_by_user_id = EXCLUDED.updated_by_user_id
     RETURNING *`,
    [settingKey, settingValue, updatedByUserId],
  ).then((result) => result.rows);

  return row;
}

module.exports = {
  getAllSettings,
  getSettingByKey,
  upsertSetting,
};
