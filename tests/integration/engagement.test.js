'use strict';

/**
 * engagement.test.js
 *
 * Jest + Supertest integration tests for all engagement endpoints.
 * Tests run against a real PostgreSQL instance via DATABASE_URL.
 *
 * Covers:
 * - POST /api/v1/engagement-requests (PUBLIC)
 *     201 happy path (DB row verified)
 *     404 RECORD_NOT_FOUND (non-existent record_id)
 *     404 RECORD_NOT_FOUND (DRAFT record — not PUBLISHED)
 *     422 INVALID_ENGAGEMENT_TYPE (type not configured on record)
 *     422 CAPTCHA_INVALID (invalid captcha token — bypassed via captcha_enabled=false in hub_settings)
 *     429 RATE_LIMIT_EXCEEDED (11th request from same IP)
 * - GET /api/v1/admin/engagement-requests (CURATOR)
 *     200 paginated list
 *     200 filter by record_id
 * - PATCH /api/v1/admin/engagement-requests/:id (CURATOR)
 *     200 status update with curator_note
 *     404 non-existent request_id
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const { createTestCurator } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;
let createdRecordIds = [];
let createdEngagementIds = [];
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
  // Clean up engagement requests
  if (createdEngagementIds.length > 0) {
    await db('engagement_requests')
      .whereIn('request_id', createdEngagementIds)
      .delete()
      .catch(() => {});
    createdEngagementIds = [];
  }
  // Clean up records (engagement_requests cascade via ON DELETE CASCADE not set, so clean engagement first)
  if (createdRecordIds.length > 0) {
    // Remove engagement requests for these records
    await db('engagement_requests')
      .whereIn('record_id', createdRecordIds)
      .delete()
      .catch(() => {});
    await db('audit_log')
      .whereIn('record_id', createdRecordIds)
      .delete()
      .catch(() => {});
    await db('innovation_records')
      .whereIn('record_id', createdRecordIds)
      .delete()
      .catch(() => {});
    createdRecordIds = [];
  }
});

afterAll(async () => {
  await db('users')
    .where('user_id', testCuratorId)
    .delete()
    .catch(() => {});
  await db.destroy();
});

function trackRecord(id) {
  if (id && !createdRecordIds.includes(id)) createdRecordIds.push(id);
  return id;
}

function trackEngagement(id) {
  if (id && !createdEngagementIds.includes(id)) createdEngagementIds.push(id);
  return id;
}

// Helper: Create a PUBLISHED record with specified engagement options
async function createPublishedRecord(engagementOptions = ['REQUEST_DEMO']) {
  // Full record payload (all pub-required fields) — strings meet DB check constraints (min 50 chars)
  const payload = {
    title: 'Test Published Record for Engagement Testing',
    problem_statement: 'Courtroom audio systems lack automated security monitoring, creating risk of unauthorized recording and evidence tampering in federal proceedings.',
    what_was_explored: 'Explored AI-based anomaly detection for courtroom audio streams, testing three commercial ML platforms against known threat signatures in a simulated environment.',
    outcome_summary: 'Proof-of-concept demonstrated 94% detection accuracy for known threat signatures. Integration with existing court AV infrastructure is technically feasible within six months.',
    reuse_guidance: 'Reusable for any district with existing IP-based audio infrastructure. Requires local security assessment before deployment.',
    short_summary: 'AI anomaly detection POC for courtroom audio security with 94% accuracy.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'SUBMITTED',
    reuse_potential: 'HIGH',
    source_type: 'I_AND_R',
    owner_name: 'Test Owner',
    owner_office: 'TSIO',
    contributing_office: 'TSIO Innovation and Research',
    contributor_attribution: 'TSIO I&R Team',
    executive_perspective_text: 'This proof-of-concept validates that AI-based audio security monitoring is technically feasible for federal courtroom environments with high accuracy threshold.',
    executive_recommendation: 'Recommend proceeding to pilot phase in two to three volunteer districts with dedicated AV staff to validate operational integration.',
    technical_perspective_text: 'The POC used a transformer-based anomaly detection model fine-tuned on courtroom audio signatures. Latency averaged 120ms, within acceptable bounds for real-time monitoring.',
    security_findings: 'No significant vulnerabilities identified in POC architecture. Full security assessment required before pilot deployment to production systems.',
    performance_findings: 'Processing 8 simultaneous audio streams at 120ms average latency on commodity hardware with 8-core 32GB RAM configuration.',
    default_perspective: 'EXECUTIVE',
    last_reviewed_date: new Date().toISOString().split('T')[0],
    created_by_user_id: testCuratorId,
    updated_by_user_id: testCuratorId,
    key_findings: ['94% detection accuracy for known threat signatures in simulated environment.'],
    artifact_links: [{
      label: 'POC Report',
      url: 'https://example.ao.uscourts.gov/reports/poc.pdf',
      artifact_type: 'DOCUMENT',
      display_order: 0,
    }],
    mission_area_tags: ['Courtroom Technology'],
    technology_area_tags: ['AI/ML'],
    engagement_options: engagementOptions,
  };

  const createRes = await request(curatorApp).post('/api/v1/records').send(payload);
  if (createRes.status !== 201) {
    throw new Error(`Failed to create record: ${createRes.status} ${JSON.stringify(createRes.body)}`);
  }
  const recordId = createRes.body.record_id;
  trackRecord(recordId);

  // Submit for review
  const submitRes = await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);
  if (submitRes.status !== 200) {
    throw new Error(`Failed to submit record for review: ${submitRes.status}`);
  }

  // Publish
  const publishRes = await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);
  if (publishRes.status !== 200) {
    throw new Error(`Failed to publish record: ${publishRes.status} ${JSON.stringify(publishRes.body)}`);
  }

  return recordId;
}

// Helper: Create a DRAFT record (not published)
async function createDraftRecord() {
  const payload = {
    title: 'Draft Record for Engagement Test',
    problem_statement: 'A'.repeat(50),
    what_was_explored: 'B'.repeat(50),
    outcome_summary: 'C'.repeat(50),
    maturity_level: 'IDEA',
    review_status: 'SUBMITTED',
    reuse_potential: 'MEDIUM',
    source_type: 'I_AND_R',
    owner_name: 'Owner',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
  };
  const createRes = await request(curatorApp).post('/api/v1/records').send(payload);
  if (createRes.status !== 201) {
    throw new Error(`Failed to create draft record: ${createRes.status}`);
  }
  const recordId = createRes.body.record_id;
  trackRecord(recordId);
  return recordId;
}

// Standard valid engagement request body
function buildEngagementBody(recordId, requestType = 'REQUEST_DEMO') {
  return {
    record_id: recordId,
    request_type: requestType,
    requestor_name: 'Jane Smith',
    requestor_email: 'jane.smith@ao.uscourts.gov',
    requestor_office: 'Federal Judiciary Center',
    requestor_title: 'Senior Technology Advisor',
    description_of_interest: 'We are interested in exploring this technology for our district. The potential applications seem highly relevant to our current challenges with audio security.',
    desired_next_step: 'Would like to schedule a 30-minute discovery call.',
    captcha_token: 'test-bypass-token',
  };
}

// Generate a unique test IP to prevent rate limit state pollution between test suites.
// Uses 203.0.113.x range (TEST-NET-3, per RFC 5737 — documentation/testing only).
let testIpCounter = 1;
function nextTestIp() {
  const ip = `203.0.113.${testIpCounter}`;
  testIpCounter = (testIpCounter % 254) + 1;
  return ip;
}

// ─── Context Boot Test ────────────────────────────────────────────────────────

describe('context boot', () => {
  it('app starts and connects to DB successfully', async () => {
    const result = await db.raw('SELECT 1 as ok');
    expect(result.rows[0].ok).toBe(1);
  });
});

// ─── POST /api/v1/engagement-requests ────────────────────────────────────────

describe('POST /api/v1/engagement-requests', () => {
  let publishedRecordId;

  beforeEach(async () => {
    publishedRecordId = await createPublishedRecord(['REQUEST_DEMO', 'REQUEST_BRIEFING']);
  });

  it('201 — valid request for configured type on PUBLISHED record', async () => {
    const body = buildEngagementBody(publishedRecordId, 'REQUEST_DEMO');

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', nextTestIp())
      .send(body);

    expect(res.status).toBe(201);
    // Response shape: EngagementRequest
    expect(res.body.request_id).toBeTruthy();
    expect(res.body.record_id).toBe(publishedRecordId);
    expect(res.body.request_type).toBe('REQUEST_DEMO');
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.submitted_at).toBeTruthy();
    expect(new Date(res.body.submitted_at).toISOString()).toBeTruthy();
    expect(res.body.requestor_name).toBe('Jane Smith');
    expect(res.body.requestor_email).toBe('jane.smith@ao.uscourts.gov');
    expect(res.body.requestor_office).toBe('Federal Judiciary Center');
    expect(res.body.curator_note).toBeNull();

    trackEngagement(res.body.request_id);

    // Verify row exists in engagement_requests table
    const row = await db('engagement_requests')
      .where({ request_id: res.body.request_id })
      .first();
    expect(row).toBeTruthy();
    expect(row.request_type).toBe('REQUEST_DEMO');
    expect(row.status).toBe('SUBMITTED');
  });

  it('404 RECORD_NOT_FOUND — record does not exist', async () => {
    // Use a syntactically valid UUID that does not exist in the database
    const body = buildEngagementBody('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'REQUEST_DEMO');

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', nextTestIp())
      .send(body);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  it('404 RECORD_NOT_FOUND — record exists but is DRAFT (not PUBLISHED)', async () => {
    const draftRecordId = await createDraftRecord();
    const body = buildEngagementBody(draftRecordId, 'REQUEST_DEMO');

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', nextTestIp())
      .send(body);

    // Per TechArch §T-08-03: 404 even for existing DRAFT (prevent enumeration)
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  it('422 INVALID_ENGAGEMENT_TYPE — request_type not configured on record', async () => {
    // Record only has REQUEST_DEMO and REQUEST_BRIEFING configured
    const body = buildEngagementBody(publishedRecordId, 'REQUEST_ADOPTION_DISCUSSION');

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', nextTestIp())
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_ENGAGEMENT_TYPE');
  });

  it('422 CAPTCHA_INVALID — invalid captcha token when captcha_enabled=true', async () => {
    // Temporarily enable captcha for this test
    await db('hub_settings')
      .where({ setting_key: 'captcha_enabled' })
      .update({ setting_value: 'true' });

    try {
      const body = {
        ...buildEngagementBody(publishedRecordId, 'REQUEST_DEMO'),
        captcha_token: 'invalid-captcha-token-12345',
      };

      // CAPTCHA_SECRET_KEY not set → validate() returns false when captcha_enabled=true and no secret
      // Actually: CaptchaService returns { valid: true } when CAPTCHA_SECRET_KEY is not set
      // So we need to set a fake secret to get CAPTCHA_INVALID
      const originalSecret = process.env.CAPTCHA_SECRET_KEY;
      process.env.CAPTCHA_SECRET_KEY = 'fake-secret-for-testing';

      try {
        const res = await request(publicApp)
          .post('/api/v1/engagement-requests')
          .set('X-Forwarded-For', nextTestIp())
          .send(body);

        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('CAPTCHA_INVALID');
      } finally {
        if (originalSecret === undefined) {
          delete process.env.CAPTCHA_SECRET_KEY;
        } else {
          process.env.CAPTCHA_SECRET_KEY = originalSecret;
        }
      }
    } finally {
      // Restore captcha_enabled=false
      await db('hub_settings')
        .where({ setting_key: 'captcha_enabled' })
        .update({ setting_value: 'false' });
    }
  });

  it('429 RATE_LIMIT_EXCEEDED — exceeds 10/hour from same IP', async () => {
    // Create a separate app instance with a different db to avoid rate limit state pollution
    // The engagementLimiter is module-level so we need the same app instance
    // Send 11 requests to trigger the rate limit
    // Use a specific IP via X-Forwarded-For to isolate from other tests
    const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 1}`;

    // Send 10 requests (should all succeed or get errors, but not 429)
    const body = buildEngagementBody(publishedRecordId, 'REQUEST_DEMO');
    let lastNon429Status = null;

    for (let i = 0; i < 10; i++) {
      const res = await request(publicApp)
        .post('/api/v1/engagement-requests')
        .set('X-Forwarded-For', testIp)
        .send(body);
      lastNon429Status = res.status;
      if (res.status === 201 && res.body.request_id) {
        trackEngagement(res.body.request_id);
      }
    }

    // 11th request should be rate limited
    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', testIp)
      .send(body);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    // Verify Retry-After header
    expect(res.headers['retry-after']).toBeTruthy();
  });

  it('422 VALIDATION_ERROR — missing required field (requestor_name)', async () => {
    const body = {
      ...buildEngagementBody(publishedRecordId, 'REQUEST_DEMO'),
      requestor_name: undefined,
    };

    const res = await request(publicApp)
      .post('/api/v1/engagement-requests')
      .set('X-Forwarded-For', nextTestIp())
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/v1/admin/engagement-requests ───────────────────────────────────

describe('GET /api/v1/admin/engagement-requests', () => {
  let publishedRecordId;
  let publishedRecord2Id;

  beforeEach(async () => {
    publishedRecordId = await createPublishedRecord(['REQUEST_DEMO']);
    publishedRecord2Id = await createPublishedRecord(['REQUEST_DEMO']);
  });

  it('200 — returns paginated list of engagement requests', async () => {
    // Create 3 engagement requests
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const row = await db('engagement_requests').insert({
        record_id: publishedRecordId,
        request_type: 'REQUEST_DEMO',
        requestor_name: `Requestor ${i}`,
        requestor_email: `requestor${i}@example.gov`,
        requestor_office: 'Test Office',
        description_of_interest: 'Testing description text that meets minimum length.',
        status: 'SUBMITTED',
      }).returning('request_id');
      ids.push(row[0].request_id);
      trackEngagement(row[0].request_id);
    }

    const res = await request(curatorApp)
      .get('/api/v1/admin/engagement-requests')
      .query({ page: 1, page_size: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeTruthy();
    expect(res.body.pagination.total_count).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.page_size).toBe(10);
  });

  it('200 — filter by record_id returns only that record\'s requests', async () => {
    // Seed 2 requests for record A, 1 for record B
    const rowA1 = await db('engagement_requests').insert({
      record_id: publishedRecordId,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Requestor A1',
      requestor_email: 'a1@example.gov',
      requestor_office: 'Office A',
      description_of_interest: 'Testing description text that meets minimum length.',
      status: 'SUBMITTED',
    }).returning('request_id');
    trackEngagement(rowA1[0].request_id);

    const rowA2 = await db('engagement_requests').insert({
      record_id: publishedRecordId,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Requestor A2',
      requestor_email: 'a2@example.gov',
      requestor_office: 'Office A',
      description_of_interest: 'Testing description text that meets minimum length.',
      status: 'SUBMITTED',
    }).returning('request_id');
    trackEngagement(rowA2[0].request_id);

    const rowB1 = await db('engagement_requests').insert({
      record_id: publishedRecord2Id,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Requestor B1',
      requestor_email: 'b1@example.gov',
      requestor_office: 'Office B',
      description_of_interest: 'Testing description text that meets minimum length.',
      status: 'SUBMITTED',
    }).returning('request_id');
    trackEngagement(rowB1[0].request_id);

    const res = await request(curatorApp)
      .get('/api/v1/admin/engagement-requests')
      .query({ record_id: publishedRecordId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // All returned requests should be for publishedRecordId
    const allForRecord = res.body.data.every((r) => r.record_id === publishedRecordId);
    expect(allForRecord).toBe(true);
    // Should include both A1 and A2
    const requestIds = res.body.data.map((r) => r.request_id);
    expect(requestIds).toContain(rowA1[0].request_id);
    expect(requestIds).toContain(rowA2[0].request_id);
    // Should NOT include B1
    expect(requestIds).not.toContain(rowB1[0].request_id);
  });

  it('401 — unauthenticated access returns 401', async () => {
    const res = await request(publicApp)
      .get('/api/v1/admin/engagement-requests');
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/v1/admin/engagement-requests/:id ─────────────────────────────

describe('PATCH /api/v1/admin/engagement-requests/:id', () => {
  let publishedRecordId;
  let testEngagementId;

  beforeEach(async () => {
    publishedRecordId = await createPublishedRecord(['REQUEST_DEMO']);

    // Seed a SUBMITTED engagement request directly
    const row = await db('engagement_requests').insert({
      record_id: publishedRecordId,
      request_type: 'REQUEST_DEMO',
      requestor_name: 'Patch Test Requestor',
      requestor_email: 'patch-test@example.gov',
      requestor_office: 'Test Office',
      description_of_interest: 'Testing status update through PATCH endpoint for curator.',
      status: 'SUBMITTED',
    }).returning('request_id');
    testEngagementId = row[0].request_id;
    trackEngagement(testEngagementId);
  });

  it('200 — updates status to IN_PROGRESS with curator_note', async () => {
    const res = await request(curatorApp)
      .patch(`/api/v1/admin/engagement-requests/${testEngagementId}`)
      .send({ status: 'IN_PROGRESS', curator_note: 'Following up with the team.' });

    expect(res.status).toBe(200);
    expect(res.body.request_id).toBe(testEngagementId);
    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.curator_note).toBe('Following up with the team.');
    expect(res.body.updated_by_user_id).toBe(testCuratorId);

    // Verify in DB
    const row = await db('engagement_requests').where({ request_id: testEngagementId }).first();
    expect(row.status).toBe('IN_PROGRESS');
    expect(row.curator_note).toBe('Following up with the team.');
  });

  it('200 — updates status to COMPLETED', async () => {
    const res = await request(curatorApp)
      .patch(`/api/v1/admin/engagement-requests/${testEngagementId}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('404 — non-existent request_id returns 404', async () => {
    // Use a syntactically valid UUID that does not exist in the database
    const res = await request(curatorApp)
      .patch('/api/v1/admin/engagement-requests/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99')
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ENGAGEMENT_REQUEST_NOT_FOUND');
  });

  it('401 — unauthenticated access returns 401', async () => {
    const res = await request(publicApp)
      .patch(`/api/v1/admin/engagement-requests/${testEngagementId}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(401);
  });
});
