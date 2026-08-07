'use strict';

/**
 * settings.test.js
 *
 * Jest + Supertest integration tests for hub settings endpoints.
 * Tests run against a real PostgreSQL instance via DATABASE_URL.
 *
 * Covers:
 * - GET /api/v1/admin/settings (CURATOR)
 *     200 returns all hub_settings rows including seeded engagement_routing_email
 * - PUT /api/v1/admin/settings (CURATOR — bulk update)
 *     200 valid bulk update including valid routing email
 *     422 INVALID_EMAIL — engagement_routing_email with invalid format
 *     422 VALIDATION_ERROR — engagement_routing_email blank
 *     422 VALIDATION_ERROR — catalog_default_page_size out of range
 *     200 other setting keys pass through without extra validation
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const { createTestCurator } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;
let curatorApp;
let publicApp;

// Session middleware factory for curator auth
function curatorSessionMiddleware(userId) {
  return (req, _res, next) => {
    req.session = { user: { user_id: userId, role: 'CURATOR' } };
    next();
  };
}

// No-session middleware (PUBLIC)
function noSessionMiddleware(req, _res, next) {
  req.session = {};
  next();
}

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

  publicApp = createApp({
    db,
    sessionMiddleware: noSessionMiddleware,
  });
});

afterEach(async () => {
  // Restore the canonical seeded engagement_routing_email value after any test that may have changed it
  await db('hub_settings')
    .where({ setting_key: 'engagement_routing_email' })
    .update({
      setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov',
      updated_at: new Date(),
      updated_by_user_id: null,
    })
    .catch(() => {});

  // Restore catalog_default_page_size to seeded value
  await db('hub_settings')
    .where({ setting_key: 'catalog_default_page_size' })
    .update({ setting_value: '12', updated_at: new Date() })
    .catch(() => {});

  // Remove any test-specific keys (contact_display_email may have been changed)
  // Restore contact_display_email to seeded value
  await db('hub_settings')
    .where({ setting_key: 'contact_display_email' })
    .update({
      setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov',
      updated_at: new Date(),
      updated_by_user_id: null,
    })
    .catch(() => {});
});

afterAll(async () => {
  await db('users')
    .where('user_id', testCuratorId)
    .delete()
    .catch(() => {});
  await db.destroy();
});

// ─── Context Boot Test ────────────────────────────────────────────────────────

describe('context boot — settings', () => {
  it('app starts and settings table is accessible', async () => {
    const result = await db.raw('SELECT COUNT(*) as cnt FROM hub_settings');
    expect(parseInt(result.rows[0].cnt, 10)).toBeGreaterThanOrEqual(4);
  });
});

// ─── GET /api/v1/admin/settings ──────────────────────────────────────────────

describe('GET /api/v1/admin/settings', () => {
  it('200 — returns all hub_settings rows including seeded values', async () => {
    const res = await request(curatorApp)
      .get('/api/v1/admin/settings');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should include at least the 4 seeded settings
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    // Verify engagement_routing_email is present with correct seeded value
    const routingEmailSetting = res.body.data.find(
      (s) => s.setting_key === 'engagement_routing_email'
    );
    expect(routingEmailSetting).toBeTruthy();
    expect(routingEmailSetting.setting_value).toBe('AOml_TSO_IRB_Team@ao.uscourts.gov');

    // Verify expected HubSetting shape: { setting_key, setting_value, description, updated_at }
    expect(routingEmailSetting).toHaveProperty('setting_key');
    expect(routingEmailSetting).toHaveProperty('setting_value');
    expect(routingEmailSetting).toHaveProperty('description');
    expect(routingEmailSetting).toHaveProperty('updated_at');
  });

  it('200 — returns all 4 required seeded keys', async () => {
    const res = await request(curatorApp)
      .get('/api/v1/admin/settings');

    expect(res.status).toBe(200);
    const keys = res.body.data.map((s) => s.setting_key);
    expect(keys).toContain('engagement_routing_email');
    expect(keys).toContain('contact_display_email');
    expect(keys).toContain('catalog_default_page_size');
    expect(keys).toContain('default_perspective');
  });

  it('401 — unauthenticated access returns 401', async () => {
    const res = await request(publicApp)
      .get('/api/v1/admin/settings');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/v1/admin/settings ──────────────────────────────────────────────

describe('PUT /api/v1/admin/settings', () => {
  it('200 — valid bulk update including valid routing email', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: 'new@example.gov' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].setting_key).toBe('engagement_routing_email');
    expect(res.body.data[0].setting_value).toBe('new@example.gov');

    // Verify subsequent GET returns updated value
    const getRes = await request(curatorApp)
      .get('/api/v1/admin/settings');
    expect(getRes.status).toBe(200);
    const setting = getRes.body.data.find((s) => s.setting_key === 'engagement_routing_email');
    expect(setting).toBeTruthy();
    expect(setting.setting_value).toBe('new@example.gov');
  });

  it('422 INVALID_EMAIL — engagement_routing_email with invalid format', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: 'not-an-email' }],
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.code).toBe('INVALID_EMAIL');
  });

  it('422 VALIDATION_ERROR — engagement_routing_email blank', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: '' }],
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('422 VALIDATION_ERROR — catalog_default_page_size out of range', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'catalog_default_page_size', setting_value: '3' }],
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('422 VALIDATION_ERROR — catalog_default_page_size too large', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'catalog_default_page_size', setting_value: '100' }],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Page size must be between 6 and 50');
  });

  it('200 — catalog_default_page_size valid value updates correctly', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'catalog_default_page_size', setting_value: '24' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].setting_key).toBe('catalog_default_page_size');
    expect(res.body.data[0].setting_value).toBe('24');
  });

  it('200 — other setting keys pass through without extra validation', async () => {
    // contact_display_email is valid email, passes through
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'contact_display_email', setting_value: 'contact@example.gov' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].setting_key).toBe('contact_display_email');
    expect(res.body.data[0].setting_value).toBe('contact@example.gov');
  });

  it('200 — bulk update with multiple valid settings', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: 'updated@example.gov' },
          { setting_key: 'catalog_default_page_size', setting_value: '18' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const emailSetting = res.body.data.find((s) => s.setting_key === 'engagement_routing_email');
    const pageSizeSetting = res.body.data.find((s) => s.setting_key === 'catalog_default_page_size');
    expect(emailSetting.setting_value).toBe('updated@example.gov');
    expect(pageSizeSetting.setting_value).toBe('18');
  });

  it('422 — fails fast on first invalid setting in bulk update', async () => {
    // First item invalid, second valid — should fail on first
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [
          { setting_key: 'engagement_routing_email', setting_value: 'invalid-email-format' },
          { setting_key: 'catalog_default_page_size', setting_value: '12' },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_EMAIL');
  });

  it('401 — unauthenticated access returns 401', async () => {
    const res = await request(publicApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: 'test@example.gov' }],
      });
    expect(res.status).toBe(401);
  });

  it('updated_by_user_id is set to the curator making the change', async () => {
    const res = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: 'audit-test@example.gov' }],
      });

    expect(res.status).toBe(200);

    // Verify updated_by_user_id is set in the DB
    const row = await db('hub_settings')
      .where({ setting_key: 'engagement_routing_email' })
      .first();
    expect(row.updated_by_user_id).toBe(testCuratorId);
  });
});

// ─── getSettingByKey — callable at send time (not cached) ────────────────────

describe('getSettingByKey — readable at send time by EmailService', () => {
  it('returns current value for engagement_routing_email without app restart', async () => {
    // Change the routing email via the API
    const updateRes = await request(curatorApp)
      .put('/api/v1/admin/settings')
      .send({
        settings: [{ setting_key: 'engagement_routing_email', setting_value: 'runtime@example.gov' }],
      });
    expect(updateRes.status).toBe(200);

    // Verify SettingsService.getSettingByKey reads the CURRENT value from DB (not cached)
    const SettingsService = require('../../src/services/settings.service');
    const value = await SettingsService.getSettingByKey(db, 'engagement_routing_email');
    expect(value).toBe('runtime@example.gov');
  });
});
