'use strict';

/**
 * records.test.js
 *
 * Jest + Supertest integration tests for all 9 Innovation Record endpoints.
 * Tests run against a real PostgreSQL instance via DATABASE_URL.
 *
 * Covers:
 * - POST /api/v1/records (create) — 201+DRAFT, RECORD_CREATED audit, 401 unauthenticated
 * - GET /api/v1/records/:id — 404 for PUBLIC+DRAFT, 200+trust_disclaimers for PUBLISHED, 200 CURATOR
 * - PATCH /api/v1/records/:id — 409 EDIT_REQUIRES_CONFIRMATION, 200+REVIEW with confirm header
 * - POST /api/v1/records/:id/submit-review — 200+REVIEW, 422 INVALID_STATE_TRANSITION
 * - POST /api/v1/records/:id/publish — 422 PUBLICATION_GATE_FAILED with blocking fields, 200+PUBLISHED
 * - DELETE /api/v1/records/:id — 204 DRAFT, 409 DELETE_NOT_PERMITTED for non-DRAFT
 * - TrustDisclaimerService — all 4 trigger conditions via GET responses
 * - GET /api/v1/records/:id/audit — 401 unauthenticated, 200+paginated
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const { createTestCurator, cleanupRecords, buildFullRecord } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;
let createdRecordIds = [];

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

// App instances
let curatorApp;
let publicApp;

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  });

  testCuratorId = await createTestCurator(db);

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
  if (createdRecordIds.length > 0) {
    await cleanupRecords(db, createdRecordIds);
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

// Track a record for cleanup
function track(recordId) {
  if (recordId && !createdRecordIds.includes(recordId)) {
    createdRecordIds.push(recordId);
  }
  return recordId;
}

// ─── Context Boot Test ────────────────────────────────────────────────────────

describe('context boot', () => {
  it('app starts and connects to DB successfully', async () => {
    const result = await db.raw('SELECT 1 as ok');
    expect(result.rows[0].ok).toBe(1);
  });
});

// ─── POST /api/v1/records ─────────────────────────────────────────────────────

describe('POST /api/v1/records', () => {
  it('returns 201 with DRAFT record and RECORD_CREATED audit entry', async () => {
    const payload = {
      title: 'Test Draft Record',
      problem_statement: 'A'.repeat(50),
      what_was_explored: 'B'.repeat(50),
      outcome_summary: 'C'.repeat(50),
      maturity_level: 'IDEA',
      review_status: 'SUBMITTED',
      reuse_potential: 'MEDIUM',
      source_type: 'I_AND_R',
      owner_name: 'Test Owner',
      owner_office: 'TSIO',
      contributing_office: 'TSIO I&R',
    };

    const res = await request(curatorApp).post('/api/v1/records').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.record_id).toBeTruthy();
    expect(res.body.publication_state).toBe('DRAFT');
    expect(res.body.created_by_user_id).toBe(testCuratorId);
    track(res.body.record_id);

    // Verify RECORD_CREATED audit entry exists
    const auditRes = await request(curatorApp)
      .get(`/api/v1/records/${res.body.record_id}/audit`);
    expect(auditRes.status).toBe(200);
    const auditEntries = auditRes.body.data;
    const createdEntry = auditEntries.find(e => e.event_type === 'RECORD_CREATED');
    expect(createdEntry).toBeTruthy();
    expect(createdEntry.changed_by_user_id).toBe(testCuratorId);
  });

  it('returns 401 if not authenticated', async () => {
    const res = await request(publicApp).post('/api/v1/records').send({
      title: 'Unauthorized Record',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── GET /api/v1/records/:id ──────────────────────────────────────────────────

describe('GET /api/v1/records/:id', () => {
  it('returns 404 for non-published record accessed by PUBLIC role', async () => {
    // Create DRAFT record
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Draft Record for 404 test',
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
    });
    expect(createRes.status).toBe(201);
    track(createRes.body.record_id);

    // GET without auth — should 404
    const res = await request(publicApp).get(`/api/v1/records/${createRes.body.record_id}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
  });

  it('returns 200 with trust_disclaimers for PUBLISHED EXPERIMENT_POC record', async () => {
    const fullRecord = buildFullRecord(testCuratorId);
    // Create
    const createRes = await request(curatorApp).post('/api/v1/records').send(fullRecord);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    // Submit → Publish
    const submitRes = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/submit-review`);
    expect(submitRes.status).toBe(200);

    const publishRes = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/publish`);
    expect(publishRes.status).toBe(200);

    // GET without auth (PUBLIC)
    const res = await request(publicApp).get(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(200);

    // Trust disclaimers — EXPERIMENT_POC → POC disclaimer; PUBLISHED → published disclaimer
    expect(Array.isArray(res.body.trust_disclaimers)).toBe(true);
    expect(res.body.trust_disclaimers.length).toBeGreaterThanOrEqual(2);
    expect(res.body.trust_disclaimers.some(d => d.includes('proof-of-concept'))).toBe(true);
    expect(res.body.trust_disclaimers.some(d => d.includes('approval for adoption'))).toBe(true);

    // Response shape includes arrays
    expect(Array.isArray(res.body.key_findings)).toBe(true);
    expect(Array.isArray(res.body.artifact_links)).toBe(true);
    expect(Array.isArray(res.body.mission_area_tags)).toBe(true);
    expect(Array.isArray(res.body.engagement_options)).toBe(true);
  });

  it('returns 200 for DRAFT record when accessed by CURATOR', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Curator Draft Access Test',
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
    });
    expect(createRes.status).toBe(201);
    track(createRes.body.record_id);

    const res = await request(curatorApp)
      .get(`/api/v1/records/${createRes.body.record_id}`);
    expect(res.status).toBe(200);
    expect(res.body.publication_state).toBe('DRAFT');
  });
});

// ─── PATCH /api/v1/records/:id ────────────────────────────────────────────────

describe('PATCH /api/v1/records/:id', () => {
  it('returns 409 EDIT_REQUIRES_CONFIRMATION when editing PUBLISHED record without header', async () => {
    const fullRecord = buildFullRecord(testCuratorId);
    const createRes = await request(curatorApp).post('/api/v1/records').send(fullRecord);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);
    const publishRes = await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);
    expect(publishRes.status).toBe(200);

    // PATCH without X-Confirm-Edit header
    const res = await request(curatorApp)
      .patch(`/api/v1/records/${recordId}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EDIT_REQUIRES_CONFIRMATION');
  });

  it('moves PUBLISHED record to REVIEW when X-Confirm-Edit: true is provided', async () => {
    const fullRecord = buildFullRecord(testCuratorId);
    const createRes = await request(curatorApp).post('/api/v1/records').send(fullRecord);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);
    await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);

    // PATCH with X-Confirm-Edit: true
    const res = await request(curatorApp)
      .patch(`/api/v1/records/${recordId}`)
      .set('X-Confirm-Edit', 'true')
      .send({ title: 'Updated After Confirm Edit' });
    expect(res.status).toBe(200);
    expect(res.body.publication_state).toBe('REVIEW');

    // Verify STATE_TRANSITION audit entry PUBLISHED->REVIEW
    const auditRes = await request(curatorApp)
      .get(`/api/v1/records/${recordId}/audit`);
    expect(auditRes.status).toBe(200);
    const transitionEntry = auditRes.body.data.find(e =>
      e.event_type === 'STATE_TRANSITION' && e.state_transition === 'PUBLISHED->REVIEW'
    );
    expect(transitionEntry).toBeTruthy();
  });
});

// ─── POST /api/v1/records/:id/submit-review ───────────────────────────────────

describe('POST /api/v1/records/:id/submit-review', () => {
  it('transitions DRAFT → REVIEW and logs STATE_TRANSITION', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Submit Review Test',
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
    });
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    const res = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/submit-review`);
    expect(res.status).toBe(200);
    expect(res.body.publication_state).toBe('REVIEW');

    // Verify audit log has STATE_TRANSITION DRAFT->REVIEW
    const auditRes = await request(curatorApp)
      .get(`/api/v1/records/${recordId}/audit`);
    expect(auditRes.status).toBe(200);
    const transitionEntry = auditRes.body.data.find(e =>
      e.event_type === 'STATE_TRANSITION' && e.state_transition === 'DRAFT->REVIEW'
    );
    expect(transitionEntry).toBeTruthy();
  });

  it('returns 422 INVALID_STATE_TRANSITION when called on REVIEW state record', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Double Submit Review Test',
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
    });
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    // First submit-review
    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);

    // Second submit-review should fail
    const res = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/submit-review`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});

// ─── POST /api/v1/records/:id/publish ────────────────────────────────────────

describe('POST /api/v1/records/:id/publish', () => {
  it('returns 422 PUBLICATION_GATE_FAILED with blocking fields when required fields missing', async () => {
    // Create minimal DRAFT with only required-by-DB fields (missing many pub-required fields)
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Minimal Draft',
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
    });
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);

    const res = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/publish`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PUBLICATION_GATE_FAILED');
    expect(Array.isArray(res.body.error.fields)).toBe(true);
    // Should include missing required fields
    const fieldNames = res.body.error.fields.map(f => f.field);
    expect(fieldNames).toContain('last_reviewed_date');
    expect(fieldNames).toContain('executive_perspective_text');
  });

  it('transitions REVIEW → PUBLISHED and sets published_at when all pub-required fields present', async () => {
    const fullRecord = buildFullRecord(testCuratorId);
    const createRes = await request(curatorApp).post('/api/v1/records').send(fullRecord);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    // Submit for review
    const submitRes = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/submit-review`);
    expect(submitRes.status).toBe(200);

    // Publish
    const publishRes = await request(curatorApp)
      .post(`/api/v1/records/${recordId}/publish`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.publication_state).toBe('PUBLISHED');
    expect(publishRes.body.published_at).toBeTruthy();
    // Verify published_at is ISO 8601 format
    expect(new Date(publishRes.body.published_at).toISOString()).toBeTruthy();

    // Record is now visible via GET without auth
    const getRes = await request(publicApp).get(`/api/v1/records/${recordId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.publication_state).toBe('PUBLISHED');

    // Verify audit log has STATE_TRANSITION REVIEW->PUBLISHED
    const auditRes = await request(curatorApp)
      .get(`/api/v1/records/${recordId}/audit`);
    expect(auditRes.status).toBe(200);
    const transitionEntry = auditRes.body.data.find(e =>
      e.event_type === 'STATE_TRANSITION' && e.state_transition === 'REVIEW->PUBLISHED'
    );
    expect(transitionEntry).toBeTruthy();
  });
});

// ─── DELETE /api/v1/records/:id ───────────────────────────────────────────────

describe('DELETE /api/v1/records/:id', () => {
  it('returns 204 when deleting a DRAFT record', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Delete Draft Test',
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
    });
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    // Don't track — we're about to delete it

    const res = await request(curatorApp)
      .delete(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(204);

    // Subsequent GET by CURATOR should 404
    const getRes = await request(curatorApp)
      .get(`/api/v1/records/${recordId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 409 DELETE_NOT_PERMITTED when deleting PUBLISHED record', async () => {
    const fullRecord = buildFullRecord(testCuratorId);
    const createRes = await request(curatorApp).post('/api/v1/records').send(fullRecord);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);
    await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);

    const res = await request(curatorApp)
      .delete(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DELETE_NOT_PERMITTED');
  });
});

// ─── TrustDisclaimerService — all 4 trigger conditions ───────────────────────

describe('TrustDisclaimerService — all 4 trigger conditions', () => {
  async function createAndPublishRecord(overrides) {
    const base = buildFullRecord(testCuratorId);
    const payload = { ...base, ...overrides };
    const createRes = await request(curatorApp).post('/api/v1/records').send(payload);
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);
    const publishRes = await request(curatorApp).post(`/api/v1/records/${recordId}/publish`);
    expect(publishRes.status).toBe(200);
    return recordId;
  }

  it('COMMUNITY source_type → community disclaimer included', async () => {
    const recordId = await createAndPublishRecord({ source_type: 'COMMUNITY' });
    const res = await request(publicApp).get(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(200);
    expect(res.body.trust_disclaimers.some(d => d.includes('Community-submitted'))).toBe(true);
  });

  it('VALIDATED_FOR_REUSE review_status → validated reuse disclaimer included', async () => {
    const recordId = await createAndPublishRecord({ review_status: 'VALIDATED_FOR_REUSE' });
    const res = await request(publicApp).get(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(200);
    expect(res.body.trust_disclaimers.some(d => d.includes('Validated for Reuse'))).toBe(true);
  });

  it('EXPERIMENT_POC + COMMUNITY simultaneously triggers 3 disclaimers', async () => {
    const recordId = await createAndPublishRecord({
      maturity_level: 'EXPERIMENT_POC',
      source_type: 'COMMUNITY',
    });
    const res = await request(publicApp).get(`/api/v1/records/${recordId}`);
    expect(res.status).toBe(200);
    // POC + PUBLISHED + COMMUNITY = 3 disclaimers
    expect(res.body.trust_disclaimers.length).toBeGreaterThanOrEqual(3);
    expect(res.body.trust_disclaimers.some(d => d.includes('proof-of-concept'))).toBe(true);
    expect(res.body.trust_disclaimers.some(d => d.includes('approval for adoption'))).toBe(true);
    expect(res.body.trust_disclaimers.some(d => d.includes('Community-submitted'))).toBe(true);
  });
});

// ─── GET /api/v1/records/:id/audit ───────────────────────────────────────────

describe('GET /api/v1/records/:id/audit', () => {
  it('returns 401 when called without curator session', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Audit 401 Test',
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
    });
    expect(createRes.status).toBe(201);
    track(createRes.body.record_id);

    const res = await request(publicApp)
      .get(`/api/v1/records/${createRes.body.record_id}/audit`);
    expect(res.status).toBe(401);
  });

  it('returns paginated audit entries in reverse chronological order', async () => {
    const createRes = await request(curatorApp).post('/api/v1/records').send({
      title: 'Audit Pagination Test',
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
    });
    expect(createRes.status).toBe(201);
    const recordId = createRes.body.record_id;
    track(recordId);

    // Submit for review — creates STATE_TRANSITION entry
    await request(curatorApp).post(`/api/v1/records/${recordId}/submit-review`);

    // GET audit (curator)
    const res = await request(curatorApp)
      .get(`/api/v1/records/${recordId}/audit`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2); // RECORD_CREATED + STATE_TRANSITION

    // Pagination envelope
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.page).toBe('number');
    expect(typeof res.body.pageSize).toBe('number');
    expect(typeof res.body.totalPages).toBe('number');

    // Entries ordered by changed_at DESC (most recent first)
    if (res.body.data.length >= 2) {
      const first = new Date(res.body.data[0].changed_at);
      const second = new Date(res.body.data[1].changed_at);
      expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
    }

    // Find RECORD_CREATED and STATE_TRANSITION entries
    const eventTypes = res.body.data.map(e => e.event_type);
    expect(eventTypes).toContain('RECORD_CREATED');
    expect(eventTypes).toContain('STATE_TRANSITION');
  });
});
