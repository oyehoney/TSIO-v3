'use strict';

/**
 * submissions.test.js
 *
 * Jest + Supertest integration tests for all 6 submission endpoints.
 * Runs against a real PostgreSQL instance (DATABASE_URL).
 *
 * Covers:
 * - POST /api/v1/opportunity-submissions — happy path 201, CAPTCHA_INVALID 422,
 *   VALIDATION_ERROR with fields[], email failure isolation (submission still 201)
 * - GET /api/v1/admin/opportunity-submissions — paginated list (CURATOR), 401 without auth
 * - PATCH /api/v1/admin/opportunity-submissions/:id — disposition update 200
 * - POST /api/v1/contribution-submissions — happy path 201, ARCHIVED rejection,
 *   INVALID_ARTIFACT_URL 422, ARTIFACT_URL_REQUIRED 422
 * - GET /api/v1/admin/contribution-submissions — paginated list (CURATOR)
 * - PATCH /api/v1/admin/contribution-submissions/:id — disposition update 200
 */

const request = require('supertest');
const knex = require('knex');
const { createApp } = require('../../src/app');
const CaptchaService = require('../../src/services/CaptchaService');
const EmailService = require('../../src/services/EmailService');
const { createTestCurator } = require('../helpers/testDb');

// ─── DB & App Setup ───────────────────────────────────────────────────────────

let db;
let testCuratorId;

// Session middleware factory — injects curator session so requireCurator passes
function curatorSessionMiddleware(userId) {
  return (req, _res, next) => {
    req.session = { user: { user_id: userId, role: 'CURATOR' } };
    next();
  };
}

// No-session middleware — simulates unauthenticated/public requests
function noSessionMiddleware(req, _res, next) {
  req.session = {};
  next();
}

let curatorApp;
let publicApp;

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 5 },
  });

  testCuratorId = await createTestCurator(db, '-submissions');

  curatorApp = createApp({
    db,
    sessionMiddleware: curatorSessionMiddleware(testCuratorId),
  });

  publicApp = createApp({
    db,
    sessionMiddleware: noSessionMiddleware,
  });
});

afterAll(async () => {
  await db('users').where('user_id', testCuratorId).delete().catch(() => {});
  await db.destroy();
});

// Mock CAPTCHA to return valid by default in tests (no outbound CAPTCHA network calls)
beforeEach(() => {
  jest.spyOn(CaptchaService, 'validate').mockResolvedValue({ valid: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Opportunity Submission API (F05) ─────────────────────────────────────────

describe('Opportunity Submission API (F05)', () => {
  const validOpportunityPayload = {
    problem_description: 'We are facing challenges with audio evidence integrity in court proceedings and need a secure, tamper-proof audio recording solution that meets federal security requirements.',
    mission_area: 'Court Operations',
    submitting_office: 'District Court of DC',
    submitter_name: 'Jane Smith',
    submitter_email: 'jane.smith@uscourts.gov',
    captcha_token: 'test-valid-token'
  };

  beforeEach(async () => {
    await db('opportunity_submissions').del();
  });

  // Test 1: Happy path — creates record, returns 201 with full object
  test('POST /api/v1/opportunity-submissions — happy path creates submission and returns 201', async () => {
    const res = await request(publicApp)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.problem_description).toBe(validOpportunityPayload.problem_description);
    expect(res.body.mission_area).toBe(validOpportunityPayload.mission_area);
    expect(res.body.disposition).toBeNull();
    expect(res.body.submitted_at).toBeDefined();

    // Verify persisted to DB
    const row = await db('opportunity_submissions').where({ submission_id: res.body.submission_id }).first();
    expect(row).toBeDefined();
    expect(row.status).toBe('SUBMITTED');
  });

  // Test 2: CAPTCHA invalid — returns 422, does NOT persist
  test('POST /api/v1/opportunity-submissions — CAPTCHA invalid returns 422', async () => {
    CaptchaService.validate.mockResolvedValueOnce({ valid: false, error: 'CAPTCHA_INVALID' });

    const res = await request(publicApp)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CAPTCHA_INVALID');

    // Verify NOT persisted
    const count = await db('opportunity_submissions').count('submission_id as c').first();
    expect(parseInt(count.c, 10)).toBe(0);
  });

  // Test 3: Validation failure — missing required field → 422 with fields[]
  test('POST /api/v1/opportunity-submissions — missing required field returns 422 with fields[]', async () => {
    const { submitter_email, ...payloadWithoutEmail } = validOpportunityPayload;

    const res = await request(publicApp)
      .post('/api/v1/opportunity-submissions')
      .send(payloadWithoutEmail);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.fields)).toBe(true);
    expect(res.body.error.fields.some(f => f.field === 'submitter_email')).toBe(true);
  });

  // Test 4: problem_description too short → 422 with fields[]
  test('POST /api/v1/opportunity-submissions — problem_description too short returns 422', async () => {
    const res = await request(publicApp)
      .post('/api/v1/opportunity-submissions')
      .send({ ...validOpportunityPayload, problem_description: 'Too short' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.field === 'problem_description')).toBe(true);
  });

  // Test 5: Email failure isolation — SMTP throws → submission still returns 201
  test('POST /api/v1/opportunity-submissions — email failure does NOT roll back submission', async () => {
    jest.spyOn(EmailService, 'sendRoutingNotification').mockRejectedValueOnce(new Error('SMTP timeout'));

    const res = await request(publicApp)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    // Submission succeeds despite email failure (fire-and-forget pattern)
    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();

    const row = await db('opportunity_submissions').where({ submission_id: res.body.submission_id }).first();
    expect(row).toBeDefined();
  });

  // Test 6: Admin list — CURATOR returns paginated results
  test('GET /api/v1/admin/opportunity-submissions — returns paginated list for CURATOR', async () => {
    // Insert a test submission directly
    await db('opportunity_submissions').insert({
      problem_description: 'A'.repeat(51),
      mission_area: 'Test Area',
      submitting_office: 'Test Office',
      submitter_name: 'Test User',
      submitter_email: 'test@uscourts.gov',
      status: 'SUBMITTED'
    });

    const res = await request(curatorApp)
      .get('/api/v1/admin/opportunity-submissions');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total_count).toBeGreaterThan(0);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.page_size).toBe(20);
  });

  // Test 7: Admin list — no auth → 401
  test('GET /api/v1/admin/opportunity-submissions — returns 401 without CURATOR session', async () => {
    const res = await request(publicApp)
      .get('/api/v1/admin/opportunity-submissions');

    expect(res.status).toBe(401);
  });

  // Test 8: Disposition update — CURATOR can update, returns 200 with updated fields
  test('PATCH /api/v1/admin/opportunity-submissions/:id — updates disposition and returns 200', async () => {
    const [inserted] = await db('opportunity_submissions').insert({
      problem_description: 'A'.repeat(51),
      mission_area: 'Test Area',
      submitting_office: 'Test Office',
      submitter_name: 'Test User',
      submitter_email: 'test@uscourts.gov',
      status: 'SUBMITTED'
    }).returning('*');

    const res = await request(curatorApp)
      .patch(`/api/v1/admin/opportunity-submissions/${inserted.submission_id}`)
      .send({ disposition: 'UNDER_REVIEW', internal_note: 'Reviewing now' });

    expect(res.status).toBe(200);
    expect(res.body.disposition).toBe('UNDER_REVIEW');
    expect(res.body.reviewed_at).toBeDefined();
    expect(res.body.reviewed_by_user_id).toBe(testCuratorId);
  });
});

// ─── Contribution Submission API (F06) ────────────────────────────────────────

describe('Contribution Submission API (F06)', () => {
  const validContributionPayload = {
    work_description: 'We developed an AI-based document classification system that automatically categorizes court filings and reduces clerk workload by 40%.',
    problem_addressed: 'Court clerks spend excessive time manually sorting and routing incoming filings across 15 case categories, creating processing backlogs during high-volume periods.',
    outcome_summary: 'The system achieves 94% classification accuracy on a test dataset of 10,000 historical filings. Deployed in pilot at one district court for 6 months.',
    self_assessed_maturity: 'PROTOTYPE_PILOT',
    artifact_urls: ['https://github.uscourts.gov/tsio/doc-classifier'],
    contributing_team: 'AO IT Innovation Team',
    contributing_office: 'AO Office of Technology Solutions',
    contact_name: 'Bob Johnson',
    contact_email: 'bob.johnson@ao.uscourts.gov',
    captcha_token: 'test-valid-token'
  };

  beforeEach(async () => {
    await db('contribution_submissions').del();
  });

  // Test 9: Happy path — creates record, returns 201
  test('POST /api/v1/contribution-submissions — happy path returns 201', async () => {
    const res = await request(publicApp)
      .post('/api/v1/contribution-submissions')
      .send(validContributionPayload);

    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.self_assessed_maturity).toBe('PROTOTYPE_PILOT');
    expect(Array.isArray(res.body.artifact_urls)).toBe(true);
    expect(res.body.disposition).toBeNull();
  });

  // Test 10: ARCHIVED maturity rejected → 422
  test('POST /api/v1/contribution-submissions — ARCHIVED maturity rejected with 422', async () => {
    const res = await request(publicApp)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, self_assessed_maturity: 'ARCHIVED' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.field === 'self_assessed_maturity')).toBe(true);
  });

  // Test 11: Invalid artifact URL (http:// not https://) → 422 INVALID_ARTIFACT_URL
  test('POST /api/v1/contribution-submissions — invalid artifact URL returns 422 INVALID_ARTIFACT_URL', async () => {
    const res = await request(publicApp)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, artifact_urls: ['http://not-https.com/file'] });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.error_code === 'INVALID_ARTIFACT_URL')).toBe(true);
  });

  // Test 12: Empty artifact_urls → 422 ARTIFACT_URL_REQUIRED
  test('POST /api/v1/contribution-submissions — empty artifact_urls returns 422 ARTIFACT_URL_REQUIRED', async () => {
    const res = await request(publicApp)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, artifact_urls: [] });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.error_code === 'ARTIFACT_URL_REQUIRED')).toBe(true);
  });

  // Test 13: Admin list — CURATOR returns paginated results
  test('GET /api/v1/admin/contribution-submissions — returns paginated list for CURATOR', async () => {
    await db('contribution_submissions').insert({
      work_description: 'A'.repeat(51),
      problem_addressed: 'A'.repeat(51),
      outcome_summary: 'A'.repeat(51),
      self_assessed_maturity: 'EXPERIMENT_POC',
      artifact_urls: ['https://github.uscourts.gov/test'],
      contributing_team: 'Test Team',
      contributing_office: 'Test Office',
      contact_name: 'Test Contact',
      contact_email: 'contact@test.gov',
      status: 'SUBMITTED'
    });

    const res = await request(curatorApp)
      .get('/api/v1/admin/contribution-submissions');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total_count).toBeGreaterThan(0);
  });

  // Test 14: Disposition update — CURATOR can update, returns 200
  test('PATCH /api/v1/admin/contribution-submissions/:id — updates disposition and returns 200', async () => {
    const [inserted] = await db('contribution_submissions').insert({
      work_description: 'A'.repeat(51),
      problem_addressed: 'A'.repeat(51),
      outcome_summary: 'A'.repeat(51),
      self_assessed_maturity: 'EXPERIMENT_POC',
      artifact_urls: ['https://github.uscourts.gov/test'],
      contributing_team: 'Test Team',
      contributing_office: 'Test Office',
      contact_name: 'Test Contact',
      contact_email: 'contact@test.gov',
      status: 'SUBMITTED'
    }).returning('*');

    const res = await request(curatorApp)
      .patch(`/api/v1/admin/contribution-submissions/${inserted.submission_id}`)
      .send({ disposition: 'ACCEPTED_FOR_CURATION', internal_note: 'Good candidate for curation' });

    expect(res.status).toBe(200);
    expect(res.body.disposition).toBe('ACCEPTED_FOR_CURATION');
    expect(res.body.reviewed_at).toBeDefined();
    expect(res.body.reviewed_by_user_id).toBe(testCuratorId);
  });
});
