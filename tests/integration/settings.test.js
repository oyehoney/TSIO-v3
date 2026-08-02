'use strict';

/**
 * settings.test.js
 *
 * Jest + Supertest integration tests for all SettingsService endpoints.
 * Tests run against a real PostgreSQL instance via DATABASE_URL.
 *
 * Covers:
 * GET /api/v1/admin/settings (CURATOR):
 *   - 200 returns all hub_settings rows including seeded engagement_routing_email
 *
 * PUT /api/v1/admin/settings (CURATOR):
 *   - 200 valid bulk update including valid routing email
 *   - 422 INVALID_EMAIL — engagement_routing_email with invalid format
 *   - 422 VALIDATION_ERROR — engagement_routing_email blank
 *   - 422 VALIDATION_ERROR — catalog_default_page_size out of range
 *   - 200 other setting keys pass through without extra validation
 *
 * Context boot assertion: verifies the app starts and DB connection is live
 * (first describe block doubles as the context-boot test).
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const { createTestCurator } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;

/** Session middleware factory — sets req.user and req.session.user for curator */
function curatorSessionMiddleware(userId) {
  return (req, _res, next) => {
    req.session = { user: { user_id: userId, role: 'CURATOR' } };
    req.user = { user_id: userId, role: 'CURATOR' };
    next();
  };
}

let curatorApp;

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  });

  testCuratorId = await createTestCurator(db, '-settings');

  curatorApp = createApp({
    db,
    sessionMiddleware: curatorSessionMiddleware(testCuratorId),
  });
});

afterAll(async () => {
  // Reset engagement_routing_email to seed value in case tests changed it
  await db('hub_settings')
    .where({ setting_key: 'engagement_routing_email' })
    .update({ setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' })
    .catch(() => {});

  // Reset catalog_default_page_size to seed value
  await db('hub_settings')
    .where({ setting_key: 'catalog_default_page_size' })
    .update({ setting_value: '12' })
    .catch(() => {});

  // Clean up test user
  if (testCuratorId) {
    await db('users')
      .where('user_id', testCuratorId)
      .delete()
      .catch(() => {});
  }

  await db.destroy();
});

// ─── GET /api/v1/admin/settings ───────────────────────────────────────────────

describe('GET /api/v1/admin/settings', () => {
  test('200 — returns all hub_settings rows including seeded values (context boot assertion)', async () => {
    // This test also serves as a context-boot assertion: verifies the app starts
    // and the database connection is live (required first integration check per plan spec).

    const res = await request(curatorApp)
      .get('/api/v1/admin/settings');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4); // 4 seeded rows

    // Verify seeded engagement_routing_email is present
    const routingEmailSetting = res.body.data.find(
      (s) => s.setting_key === 'engagement_routing_email',
    );
    expect(routingEmailSetting).toBeDefined();
    expect(routingEmailSetting.setting_value).toBe('AOml_TSO_IRB_Team@ao.uscourts.gov');

    // Verify required fields in each HubSetting object
    for (const setting of res.body.data) {
      expect(typeof setting.setting_key).toBe('string');
      expect(typeof setting.setting_value).toBe('string');
      expect(setting.updated_at).toBeDefined();
    }
  });
});

// ─── PUT /api/v1/admin/settings ───────────────────────────────────────────────

describe('PUT /api/v1/admin/settings', () => {
  test('200 — valid bulk update including valid routing email', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: 'new-routing@example.gov' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].setting_key).toBe('engagement_routing_email');
    expect(res.body.data[0].setting_value).toBe('new-routing@example.gov');

    // Verify subsequent GET returns updated value
    const getRes = await request(curatorApp).get('/api/v1/admin/settings');
    const updated = getRes.body.data.find((s) => s.setting_key === 'engagement_routing_email');
    expect(updated.setting_value).toBe('new-routing@example.gov');

    // Restore original value
    await db('hub_settings')
      .where({ setting_key: 'engagement_routing_email' })
      .update({ setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' });
  });

  test('422 INVALID_EMAIL — engagement_routing_email with invalid format', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: 'not-an-email' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_EMAIL');
    expect(res.body.error.message).toContain('email');

    // Verify hub_settings was NOT updated (fail-fast validation)
    const dbRow = await db('hub_settings').where({ setting_key: 'engagement_routing_email' }).first();
    // Should still be the seed value (not 'not-an-email')
    expect(dbRow.setting_value).not.toBe('not-an-email');
  });

  test('422 VALIDATION_ERROR — engagement_routing_email blank', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: '' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('blank');
  });

  test('422 VALIDATION_ERROR — catalog_default_page_size out of range', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'catalog_default_page_size', setting_value: '3' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('6');
    expect(res.body.error.message).toContain('50');
  });

  test('422 VALIDATION_ERROR — catalog_default_page_size above max (51)', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'catalog_default_page_size', setting_value: '51' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('200 — other setting keys pass through without extra validation', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'contact_display_email', setting_value: 'contact@example.gov' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].setting_key).toBe('contact_display_email');
    expect(res.body.data[0].setting_value).toBe('contact@example.gov');
  });

  test('200 — catalog_default_page_size valid value (within 6-50)', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'catalog_default_page_size', setting_value: '24' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].setting_value).toBe('24');

    // Restore
    await db('hub_settings')
      .where({ setting_key: 'catalog_default_page_size' })
      .update({ setting_value: '12' });
  });

  test('200 — default_perspective valid value', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'default_perspective', setting_value: 'TECHNICAL' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].setting_value).toBe('TECHNICAL');

    // Restore
    await db('hub_settings')
      .where({ setting_key: 'default_perspective' })
      .update({ setting_value: 'EXECUTIVE' });
  });

  test('422 VALIDATION_ERROR — default_perspective invalid value', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'default_perspective', setting_value: 'STRATEGIC' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('200 — bulk update multiple valid settings at once', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: 'bulk-update@example.gov' },
          { setting_key: 'catalog_default_page_size', setting_value: '12' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    const emailRow = res.body.data.find((s) => s.setting_key === 'engagement_routing_email');
    expect(emailRow.setting_value).toBe('bulk-update@example.gov');

    // Restore
    await db('hub_settings')
      .where({ setting_key: 'engagement_routing_email' })
      .update({ setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' });
  });
});
