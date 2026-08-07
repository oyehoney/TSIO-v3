'use strict';

/**
 * settings.repository.js
 *
 * Parameterized DB queries for hub_settings table.
 * Per TechArch §3.2 DDL and FRD §F08 §Hub Settings.
 *
 * hub_settings schema:
 *   setting_key         VARCHAR(100)  PRIMARY KEY
 *   setting_value       TEXT          NOT NULL
 *   description         TEXT
 *   updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
 *   updated_by_user_id  UUID          REFERENCES users(user_id)
 *
 * Seeded with 4 rows:
 *   engagement_routing_email, contact_display_email,
 *   catalog_default_page_size, default_perspective
 */

/**
 * Get all hub settings ordered by setting_key.
 *
 * SELECT * FROM hub_settings ORDER BY setting_key
 *
 * @param {import('knex').Knex} db
 * @returns {Promise<Array<{ setting_key: string, setting_value: string,
 *                           description: string|null, updated_at: string }>>}
 */
async function getAllSettings(db) {
  return db('hub_settings').select('*').orderBy('setting_key', 'asc');
}

/**
 * Get a single setting value by key.
 *
 * SELECT setting_value FROM hub_settings WHERE setting_key = $1
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @returns {Promise<string|null>} setting_value or null if not found
 */
async function getSettingByKey(db, settingKey) {
  const row = await db('hub_settings')
    .where({ setting_key: settingKey })
    .select('setting_value')
    .first();
  return row ? row.setting_value : null;
}

/**
 * Upsert a hub setting (update if exists, insert if new).
 *
 * Uses ON CONFLICT (setting_key) DO UPDATE to support forward-compatible new keys.
 *
 * @param {import('knex').Knex} db
 * @param {string} settingKey
 * @param {string} settingValue
 * @param {string|null} updatedByUserId - UUID of curator or null
 * @returns {Promise<object>} Updated HubSetting row
 */
async function upsertSetting(db, settingKey, settingValue, updatedByUserId) {
  const [row] = await db.raw(
    `INSERT INTO hub_settings (setting_key, setting_value, updated_at, updated_by_user_id)
     VALUES (?, ?, NOW(), ?)
     ON CONFLICT (setting_key) DO UPDATE
       SET setting_value = EXCLUDED.setting_value,
           updated_at = NOW(),
           updated_by_user_id = EXCLUDED.updated_by_user_id
     RETURNING *`,
    [settingKey, settingValue, updatedByUserId || null]
  ).then((result) => result.rows);

  return row;
}

module.exports = {
  getAllSettings,
  getSettingByKey,
  upsertSetting,
};
