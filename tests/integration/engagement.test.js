'use strict';

/**
 * engagement.test.js
 *
 * Jest + Supertest integration tests for all EngagementService endpoints.
 * Tests run against a real PostgreSQL instance via DATABASE_URL.
 *
 * Covers:
 * POST /api/v1/engagement-requests (PUBLIC):
 *   - 201 happy path: valid request on PUBLISHED record with configured type
 *   - 404 RECORD_NOT_FOUND: record does not exist
 *   - 404 RECORD_NOT_FOUND: record exists but is DRAFT (not PUBLISHED)
 *   - 422 INVALID_ENGAGEMENT_TYPE: request_type not configured on record
 *   - 422 CAPTCHA_INVALID: invalid captcha token
 *   - 429 RATE_LIMIT_EXCEEDED: exceeds 10/hour from same IP
 *
 * GET /api/v1/admin/engagement-requests (CURATOR):
 *   - 200 returns paginated list of engagement requests
 *   - 200 filter by record_id returns only that record's requests
 *
 * PATCH /api/v1/admin/engagement-requests/:id (CURATOR):
 *   - 200 updates status to IN_PROGRESS with curator_note
 *   - 404 non-existent request_id
 *
 * CAPTCHA bypass: set CAPTCHA_SECRET_KEY=undefined in test env (no outbound call).
 * When CAPTCHA_SECRET_KEY is not set, CaptchaService treats as disabled and returns valid.
 *
 * Rate limit test: uses forceExpressRateLimit flag to bypass the rate limiter for
 * most tests (applied per-instance via custom createApp option).
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const { createTestCurator, cleanupRecords, buildFullRecord } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;
let createdRecordIds = [];
let createdEngagementIds = [];

/** Session middleware factory — sets req.user and req.session.user for curator */
function curatorSessionMiddleware(userId) {
  return (req, _res, next) => {
    req.session = { user: { user_id: userId, role: 'CURATOR' } };
    req.user = { user_id: userId, role: 'CURATOR' };
    next();
  };
}

/** No-session middleware — PUBLIC access */
function noSessionMiddleware(req, _res, next) {
  req.session = {};
  next();
}

/** App instances */
let curatorApp;   // Has curator session — used for admin endpoints
let publicApp;    // No session — used for public POST endpoint

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  });

  testCuratorId = await createTestCurator(db, '-engagement');

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
  // Clean up engagement requests first (FK to innovation_records)
  if (createdEngagementIds.length > 0) {
    await db('engagement_requests')
      .whereIn('request_id', createdEngagementIds)
      .delete()
      .catch(() => {});
    createdEngagementIds = [];
  }
  if (createdRecordIds.length > 0) {
    await cleanupRecords(db, createdRecordIds);
    createdRecordIds = [];
  }
});

afterAll(async () => {
  // Final cleanup of any lingering test data
  if (testCuratorId) {
    await db('engagement_requests')
      .where('updated_by_user_id', testCuratorId)
      .delete()
      .catch(() => {});
    await db('users')
      .where('user_id', testCuratorId)
      .delete()
      .catch(() => {});
  }
  await db.destroy();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Seed a PUBLISHED innovation_record with specified engagement_options.
 * Returns the created record.
 */
async function seedPublishedRecord(engagementOptions = ['REQUEST_DEMO']) {
  // Create a full record using the test helper
  const fullRecord = buildFullRecord(testCuratorId);

  // Use the curator app to create and publish the record
  // Step 1: Create (DRAFT)
  const createRes = await request(curatorApp)
    .post('/api/v1/records')
    .send({ ...fullRecord, engagement_options: engagementOptions });

  if (createRes.status !== 201) {
    throw new Error(`Failed to create record: ${JSON.stringify(createRes.body)}`);
  }
  const recordId = createRes.body.record_id;
  createdRecordIds.push(recordId);

  // Step 2: Submit for review
  await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);

  // Step 3: Publish
  const pubRes = await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);
  if (pubRes.status !== 200) {
    throw new Error(`Failed to publish record: ${JSON.stringify(pubRes.body)}`);
  }

  return pubRes.body;
}

/**
 * Seed a DRAFT innovation_record (stays in DRAFT state).
 */
async function seedDraftRecord() {
  const fullRecord = buildFullRecord(testCuratorId);
  const createRes = await request(curatorApp)
    .post('/api/v1/records')
    .send(fullRecord);

  if (createRes.status !== 201) {
    throw new Error(`Failed to create draft record: ${JSON.stringify(createRes.body)}`);
  }

  createdRecordIds.push(createRes.body.record_id);
  return createRes.body;
}

/**
 * Build a valid EngagementRequestCreateRequest body.
 */
function buildEngagementBody(recordId, overrides = {}) {
  return {
    record_id: recordId,
    request_type: 'REQUEST_DEMO',
    requestor_name: 'Jane Smith',
    requestor_email: 'jane.smith@court.gov',
    requestor_office: 'District Court of Northern California',
    requestor_title: 'IT Director',
    description_of_interest: 'We are interested in exploring how this innovation could benefit our district courtroom security operations.',
    desired_next_step: 'Schedule a demo with our technical team.',
    captcha_token: 'test-bypass-token',
    ...overrides,
  };
}

// ─── POST /api/v1/engagement-requests ─────────────────────────────────────────

describe('POST /api/v1/engagement-requests', () => {
  test('201 — valid request for configured type on PUBLISHED record', async () => {
    const record = await seedPublishedRecord(['REQUEST_DEMO', 'REQUEST_TECHNICAL_GUIDANCE']);
    const body = buildEngagementBody(record.record_id);

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .send(body);

    expect(res.status).toBe(201);

    // Verify EngagementRequest shape
    expect(res.body).toMatchObject({
      record_id: record.record_id,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Jane Smith',
      requestor_email: 'jane.smith@court.gov',
      requestor_office: 'District Court of Northern California',
      status: 'SUBMITTED',
    });
    expect(res.body.request_id).toBeDefined();
    expect(typeof res.body.request_id).toBe('string');
    expect(res.body.submitted_at).toBeDefined();
    expect(res.body.curator_note).toBeNull();
    expect(res.body.updated_by_user_id).toBeNull();

    // Verify row exists in DB
    const dbRow = await db('engagement_requests')
      .where({ request_id: res.body.request_id })
      .first();
    expect(dbRow).toBeDefined();
    expect(dbRow.status).toBe('SUBMITTED');

    createdEngagementIds.push(res.body.request_id);
  });

  test('404 RECORD_NOT_FOUND — record does not exist', async () => {
    const nonExistentId = '00000000-0000-4000-a000-000000000001';
    const body = buildEngagementBody(nonExistentId);

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .send(body);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  test('404 RECORD_NOT_FOUND — record exists but is DRAFT (not PUBLISHED)', async () => {
    const draftRecord = await seedDraftRecord();
    const body = buildEngagementBody(draftRecord.record_id);

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .send(body);

    // Public users must not know the record exists — same 404 as non-existent (T-08-03)
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  test('422 INVALID_ENGAGEMENT_TYPE — request_type not configured on record', async () => {
    // Seed record with only REQUEST_DEMO configured
    const record = await seedPublishedRecord(['REQUEST_DEMO']);
    // Request a type that is NOT configured on this record
    const body = buildEngagementBody(record.record_id, { request_type: 'REQUEST_BRIEFING' });

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_ENGAGEMENT_TYPE');
  });

  test('422 CAPTCHA_INVALID — invalid captcha token when CAPTCHA is enabled', async () => {
    // CaptchaService returns valid when CAPTCHA_SECRET_KEY is not set (treat as disabled).
    // To test CAPTCHA_INVALID, we need to simulate CAPTCHA enabled with a bad token.
    // We mock this by temporarily setting env variables and checking service behavior.
    //
    // Per plan spec: "Use environment variable CAPTCHA_BYPASS_TOKEN (set to a test value
    // in .env.test) that CaptchaService accepts as valid without an outbound HTTP call."
    //
    // Since CaptchaService does NOT bypass on missing token when captcha_enabled = 'true'
    // in hub_settings, we test the code path by sending no token with CAPTCHA_SECRET_KEY set.
    //
    // In the default test environment where CAPTCHA_SECRET_KEY is undefined, CaptchaService
    // treats it as disabled and passes all tokens. We verify 422 is returned when
    // captcha_enabled = 'true' is set in hub_settings.

    // Update hub_settings to enable captcha for this test
    await db('hub_settings').insert({
      setting_key: 'captcha_enabled',
      setting_value: 'true',
      description: 'Test: captcha enabled',
    }).onConflict('setting_key').merge();

    // Set a fake CAPTCHA_SECRET_KEY so CaptchaService makes the validation attempt
    const originalKey = process.env.CAPTCHA_SECRET_KEY;
    process.env.CAPTCHA_SECRET_KEY = 'test-invalid-key';

    try {
      const record = await seedPublishedRecord(['REQUEST_DEMO']);
      // Send with an obviously invalid token — CaptchaService will call provider
      // and get back a failure (the test key is not a real reCAPTCHA key)
      const body = buildEngagementBody(record.record_id, { captcha_token: 'invalid-token-xyz' });

      const res = await request(publicApp)
        .post('/api/v1/engagement-requests')
        .send(body);

      // CaptchaService.validate() will fail (network error or invalid response)
      // and return { valid: false, error: 'CAPTCHA_INVALID' }
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CAPTCHA_INVALID');
    } finally {
      // Restore env and hub_settings
      if (originalKey === undefined) {
        delete process.env.CAPTCHA_SECRET_KEY;
      } else {
        process.env.CAPTCHA_SECRET_KEY = originalKey;
      }
      await db('hub_settings').where({ setting_key: 'captcha_enabled' }).delete().catch(() => {});
    }
  });

  test('429 RATE_LIMIT_EXCEEDED — exceeds 10/hour from same IP', async () => {
    // The engagementLimiter middleware limits to 10 requests per IP per hour.
    // We send 11 requests from the same IP and expect the 11th to return 429.
    //
    // NOTE: Express rate-limit tracks IP per router instance. Using publicApp,
    // all requests come from the test runner IP (127.0.0.1 via supertest).
    // The rate limiter is keyed on req.ip.

    const record = await seedPublishedRecord(['REQUEST_DEMO']);
    const body = buildEngagementBody(record.record_id);

    // Send 10 requests (should succeed — may get 201 or other non-429 codes
    // depending on captcha/record state, but rate limit tracks all attempts)
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(publicApp)
          .post('/api/v1/engagement-requests')
          .set('X-Forwarded-For', '192.0.2.100') // Same simulated IP for all requests
          .send(body),
      );
    }
    const results = await Promise.all(requests);

    // Track any created engagements for cleanup
    for (const r of results) {
      if (r.body && r.body.request_id) {
        createdEngagementIds.push(r.body.request_id);
      }
    }

    // 11th request should be rate-limited
    const limitedRes = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', '192.0.2.100')
      .send(body);

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(limitedRes.headers['retry-after']).toBeDefined();
    expect(limitedRes.headers['retry-after']).toBe('3600');
  });
});

// ─── GET /api/v1/admin/engagement-requests ────────────────────────────────────

describe('GET /api/v1/admin/engagement-requests', () => {
  test('200 — returns paginated list of engagement requests', async () => {
    // Seed a PUBLISHED record and create 3 engagement requests
    const record = await seedPublishedRecord(['REQUEST_DEMO', 'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING']);

    const engagements = await db('engagement_requests').insert([
      {
        record_id: record.record_id,
        request_type: 'REQUEST_DEMO',
        requestor_name: 'Alice Test',
        requestor_email: 'alice@court.gov',
        requestor_office: 'Test Office A',
        description_of_interest: 'Alice is interested in the REQUEST_DEMO option for testing purposes in court environments.',
        status: 'SUBMITTED',
      },
      {
        record_id: record.record_id,
        request_type: 'REQUEST_TECHNICAL_GUIDANCE',
        requestor_name: 'Bob Test',
        requestor_email: 'bob@court.gov',
        requestor_office: 'Test Office B',
        description_of_interest: 'Bob is requesting technical guidance on implementing this innovation in production courtroom settings.',
        status: 'IN_PROGRESS',
      },
      {
        record_id: record.record_id,
        request_type: 'REQUEST_BRIEFING',
        requestor_name: 'Carol Test',
        requestor_email: 'carol@court.gov',
        requestor_office: 'Test Office C',
        description_of_interest: 'Carol would like a briefing on this innovation for leadership review and budget planning purposes.',
        status: 'COMPLETED',
      },
    ]).returning('request_id');

    createdEngagementIds.push(...engagements.map((e) => e.request_id));

    const res = await request(curatorApp)
      .get('/api/v1/admin/engagement-requests')
      .query({ page: 1, page_size: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total_count).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.page_size).toBe(10);
  });

  test("200 — filter by record_id returns only that record's requests", async () => {
    // Seed 2 records
    const recordA = await seedPublishedRecord(['REQUEST_DEMO']);
    const recordB = await seedPublishedRecord(['REQUEST_DEMO']);

    // 2 requests for record A, 1 for record B
    const engagementsA = await db('engagement_requests').insert([
      {
        record_id: recordA.record_id,
        request_type: 'REQUEST_DEMO',
        requestor_name: 'User A1',
        requestor_email: 'a1@court.gov',
        requestor_office: 'Office A1',
        description_of_interest: 'First engagement request for record A in this integration test scenario.',
        status: 'SUBMITTED',
      },
      {
        record_id: recordA.record_id,
        request_type: 'REQUEST_DEMO',
        requestor_name: 'User A2',
        requestor_email: 'a2@court.gov',
        requestor_office: 'Office A2',
        description_of_interest: 'Second engagement request for record A in this integration test scenario for filtering.',
        status: 'SUBMITTED',
      },
    ]).returning('request_id');

    const engagementsB = await db('engagement_requests').insert([
      {
        record_id: recordB.record_id,
        request_type: 'REQUEST_DEMO',
        requestor_name: 'User B1',
        requestor_email: 'b1@court.gov',
        requestor_office: 'Office B1',
        description_of_interest: 'Engagement request for record B in this filter test — should NOT appear in record A results.',
        status: 'SUBMITTED',
      },
    ]).returning('request_id');

    createdEngagementIds.push(
      ...engagementsA.map((e) => e.request_id),
      ...engagementsB.map((e) => e.request_id),
    );

    // Filter by record A
    const res = await request(curatorApp)
      .get('/api/v1/admin/engagement-requests')
      .query({ record_id: recordA.record_id, page: 1, page_size: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // All returned items should be for record A
    for (const item of res.body.data) {
      expect(item.record_id).toBe(recordA.record_id);
    }
    // Should have exactly 2 results for record A
    expect(res.body.pagination.total_count).toBe(2);
  });
});

// ─── PATCH /api/v1/admin/engagement-requests/:id ─────────────────────────────

describe('PATCH /api/v1/admin/engagement-requests/:id', () => {
  test('200 — updates status to IN_PROGRESS with curator_note', async () => {
    const record = await seedPublishedRecord(['REQUEST_DEMO']);

    // Create a SUBMITTED engagement request directly in DB
    const [engagement] = await db('engagement_requests').insert({
      record_id: record.record_id,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Test Requestor',
      requestor_email: 'test.requestor@court.gov',
      requestor_office: 'Test Office for PATCH',
      description_of_interest: 'Testing the PATCH status update endpoint with curator note to confirm proper update behavior.',
      status: 'SUBMITTED',
    }).returning('*');

    createdEngagementIds.push(engagement.request_id);

    const res = await request(curatorApp)
      .patch(`/api/v1/admin/engagement-requests/${engagement.request_id}`)
      .send({ status: 'IN_PROGRESS', curator_note: 'Following up with requestor this week.' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.curator_note).toBe('Following up with requestor this week.');
    expect(res.body.request_id).toBe(engagement.request_id);

    // Verify in DB
    const dbRow = await db('engagement_requests')
      .where({ request_id: engagement.request_id })
      .first();
    expect(dbRow.status).toBe('IN_PROGRESS');
    expect(dbRow.curator_note).toBe('Following up with requestor this week.');
    expect(dbRow.updated_by_user_id).toBe(testCuratorId);
  });

  test('404 — non-existent request_id', async () => {
    const nonExistentId = '00000000-0000-4000-a000-000000000002';

    const res = await request(curatorApp)
      .patch(`/api/v1/admin/engagement-requests/${nonExistentId}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ENGAGEMENT_REQUEST_NOT_FOUND');
  });
});
