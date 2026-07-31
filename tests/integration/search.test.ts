// Integration tests for GET /api/v1/search
// Requires a running PostgreSQL instance with migrations applied
// Run: DATABASE_URL=postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub npx jest tests/integration/search.test.ts

import request from 'supertest';
import knexLib from 'knex';
import { app, db as appDb } from '../../src/app';

// ─── Test data IDs ─────────────────────────────────────────────────────────────
// Fixed UUIDs to make cleanup deterministic
const TEST_USER_ID = 'a0000000-0000-0000-0000-000000000001';
const PUBLISHED_RECORD_ID = 'b0000000-0000-0000-0000-000000000001';
const DRAFT_RECORD_ID = 'b0000000-0000-0000-0000-000000000002';

// Expose draftRecordId for use in scope guard tests
let draftRecordId = DRAFT_RECORD_ID;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get a DB connection for test setup/teardown */
function getDb() {
  return appDb;
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const db = getDb();

  // Clean up any stale test data from previous runs (idempotent)
  await db('record_engagement_options').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('record_tags').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('record_key_findings').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('innovation_records').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('users').where({ user_id: TEST_USER_ID }).delete();

  // Seed CURATOR test user (FK target for created_by_user_id / updated_by_user_id)
  await db('users').insert({
    user_id: TEST_USER_ID,
    email: 'test-search-curator@tsio-test.invalid',
    display_name: 'Test Search Curator',
    role: 'CURATOR',
    is_active: true,
    created_at: new Date(),
  });

  // Seed PUBLISHED innovation record with 'audio security' in problem_statement
  // The FTS trigger (trg_innovation_record_fts) runs on INSERT and populates search_vector
  await db('innovation_records').insert({
    record_id: PUBLISHED_RECORD_ID,
    title: 'Audio Security Research Initiative',
    problem_statement:
      'Improving audio security protocols to prevent unauthorized audio recording in sensitive government environments requires robust technical controls and policy frameworks. Current audio security measures are insufficient for classified settings.',
    what_was_explored:
      'We explored various audio security detection systems including jamming devices, white noise generators, and cryptographic audio protection mechanisms.',
    outcome_summary:
      'Developed a layered audio security framework combining physical controls with software-based detection. The approach reduced unauthorized recording incidents by 87%.',
    reuse_guidance:
      'This audio security framework can be adapted to any office environment with minimal configuration changes.',
    short_summary:
      'Audio security controls for sensitive government spaces — proven to reduce unauthorized recording by 87%.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'HIGH',
    source_type: 'I_AND_R',
    owner_name: 'Test Owner',
    owner_office: 'Test Office',
    contributing_office: 'Audio Security Division',
    publication_state: 'PUBLISHED',
    published_at: new Date('2024-01-15'),
    created_by_user_id: TEST_USER_ID,
    updated_by_user_id: TEST_USER_ID,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Seed key findings for PUBLISHED record (appended to search_vector via trigger)
  await db('record_key_findings').insert([
    {
      record_id: PUBLISHED_RECORD_ID,
      finding_text:
        'Audio security jamming devices reduced detection probability in sensitive compartmented information facilities.',
      display_order: 0,
      created_at: new Date(),
    },
    {
      record_id: PUBLISHED_RECORD_ID,
      finding_text:
        'Policy integration is critical: technical audio security controls alone are insufficient without staff training.',
      display_order: 1,
      created_at: new Date(),
    },
  ]);

  // Seed tags for PUBLISHED record
  await db('record_tags').insert([
    {
      record_id: PUBLISHED_RECORD_ID,
      tag_type: 'MISSION_AREA',
      tag_value: 'Court Security',
      display_order: 0,
    },
    {
      record_id: PUBLISHED_RECORD_ID,
      tag_type: 'TECHNOLOGY_AREA',
      tag_value: 'Audio Detection Systems',
      display_order: 0,
    },
  ]);

  // Seed engagement options for PUBLISHED record
  await db('record_engagement_options').insert([
    {
      record_id: PUBLISHED_RECORD_ID,
      option_type: 'REQUEST_DEMO',
      display_order: 0,
    },
    {
      record_id: PUBLISHED_RECORD_ID,
      option_type: 'REQUEST_TECHNICAL_GUIDANCE',
      display_order: 1,
    },
  ]);

  // Seed DRAFT record with same query terms — must NOT appear in PUBLIC results
  await db('innovation_records').insert({
    record_id: DRAFT_RECORD_ID,
    title: 'Draft Audio Security Prototype',
    problem_statement:
      'Advanced audio security prototype testing for next-generation court facilities. This draft record explores audio security vulnerabilities in modern court environments.',
    what_was_explored:
      'Preliminary audio security testing with prototype equipment in a controlled lab environment.',
    outcome_summary:
      'Early audio security findings suggest significant improvement potential. Full results pending additional audio security testing cycles.',
    short_summary: 'Draft exploration of next-gen audio security controls.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'SUBMITTED',
    reuse_potential: 'MEDIUM',
    source_type: 'I_AND_R',
    owner_name: 'Draft Owner',
    owner_office: 'Draft Office',
    contributing_office: 'Research Division',
    publication_state: 'DRAFT',
    published_at: null,
    created_by_user_id: TEST_USER_ID,
    updated_by_user_id: TEST_USER_ID,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Wait briefly for FTS triggers to settle (they're synchronous in PG, but belt+suspenders)
  await new Promise((resolve) => setTimeout(resolve, 100));
}, 30000);

afterAll(async () => {
  const db = getDb();

  // Clean up test data in FK-safe order
  await db('record_engagement_options').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('record_tags').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('record_key_findings').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('innovation_records').whereIn('record_id', [PUBLISHED_RECORD_ID, DRAFT_RECORD_ID]).delete();
  await db('users').where({ user_id: TEST_USER_ID }).delete();

  // Close DB connection pool
  await db.destroy();
}, 30000);

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('GET /api/v1/search', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns 200 with SearchResultCard array and pagination for valid query', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject({
      record_id: expect.any(String),
      relevance_score: expect.any(Number),
    });
    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 12,
      total_count: expect.any(Number),
      total_pages: expect.any(Number),
    });
  });

  it('returns SearchResultCard with required CatalogCard fields', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    const card = res.body.data[0];
    expect(card).toMatchObject({
      record_id: expect.any(String),
      title: expect.any(String),
      maturity_level: expect.any(String),
      maturity_label: expect.any(String),
      review_status: expect.any(String),
      review_status_label: expect.any(String),
      reuse_potential: expect.any(String),
      source_type: expect.any(String),
      mission_area_tags: expect.any(Array),
      technology_area_tags: expect.any(Array),
      engagement_options: expect.any(Array),
      is_validated_for_reuse: expect.any(Boolean),
      is_community_contributed: expect.any(Boolean),
    });
    // relevance_score must be numeric float (from ts_rank)
    expect(typeof card.relevance_score).toBe('number');
  });

  it('returns highlight_snippet containing query terms when match found', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    const firstResult = res.body.data[0];
    // highlight_snippet is null only if no matching text; with seeded data it should be non-null
    expect(firstResult.highlight_snippet).not.toBeNull();
  });

  // ── Empty result ─────────────────────────────────────────────────────────────

  it('returns 200 with empty data array and guidance message for valid query with no matches', async () => {
    const res = await request(app).get('/api/v1/search?q=xyzzy+nonexistent+term+999');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toMatch(/no records found/i);
  });

  it('includes pagination envelope even for zero results', async () => {
    const res = await request(app).get('/api/v1/search?q=xyzzy+nonexistent+term+999');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      page_size: expect.any(Number),
      total_count: 0,
      total_pages: 0,
    });
  });

  // ── Blank query ──────────────────────────────────────────────────────────────

  it('returns 200 with guidance message (no search executed) for blank q', async () => {
    const res = await request(app).get('/api/v1/search?q=');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enter a search term/i);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with guidance for whitespace-only q', async () => {
    const res = await request(app).get('/api/v1/search?q=   ');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enter a search term/i);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with guidance when q param is omitted entirely', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enter a search term/i);
  });

  // ── Query too long ────────────────────────────────────────────────────────────

  it('returns 400 QUERY_TOO_LONG for q exceeding 500 characters', async () => {
    const longQuery = 'a'.repeat(501);
    const res = await request(app).get(`/api/v1/search?q=${longQuery}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('QUERY_TOO_LONG');
    expect(res.body.error.message).toMatch(/500/);
  });

  it('accepts a query of exactly 500 characters (boundary — not rejected)', async () => {
    const exactQuery = 'audio ' + 'a'.repeat(494);  // 6 + 494 = 500 chars
    const res = await request(app).get(`/api/v1/search?q=${exactQuery}`);
    // 500 chars is valid — should not get 400 (may get 200 with or without results)
    expect(res.status).not.toBe(400);
  });

  // ── Publication scope guard ───────────────────────────────────────────────────

  it('PUBLIC request does NOT return DRAFT records', async () => {
    // No X-Test-Role header → PUBLIC role (default)
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    const recordIds = res.body.data.map((r: any) => r.record_id);
    expect(recordIds).not.toContain(draftRecordId);
  });

  it('PUBLIC request results do not contain publication_state field', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      // For PUBLIC role, publication_state must not be included in any card
      for (const card of res.body.data) {
        expect(card.publication_state).toBeUndefined();
      }
    }
  });

  it('CURATOR request returns DRAFT records with publication_state label', async () => {
    // X-Test-Role: CURATOR → test middleware sets req.user.role = 'CURATOR'
    const res = await request(app)
      .get('/api/v1/search?q=audio+security')
      .set('X-Test-Role', 'CURATOR');
    expect(res.status).toBe(200);
    const recordIds = res.body.data.map((r: any) => r.record_id);
    expect(recordIds).toContain(draftRecordId);
    const draftResult = res.body.data.find(
      (r: any) => r.record_id === draftRecordId
    );
    expect(draftResult).toBeDefined();
    expect(draftResult.publication_state).toBe('DRAFT');
  });

  it('CURATOR request includes publication_state on all result cards', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=audio+security')
      .set('X-Test-Role', 'CURATOR');
    expect(res.status).toBe(200);
    for (const card of res.body.data) {
      expect(card.publication_state).toBeDefined();
      expect(['DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED']).toContain(
        card.publication_state
      );
    }
  });

  // ── Filter application ────────────────────────────────────────────────────────

  it('maturity_level filter returns only matching records', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&maturity_level=EXPERIMENT_POC'
    );
    expect(res.status).toBe(200);
    // All returned cards must match the filter
    for (const card of res.body.data) {
      expect(card.maturity_level).toBe('EXPERIMENT_POC');
    }
  });

  it('maturity_level filter with non-matching value returns empty results', async () => {
    // Seeded records are EXPERIMENT_POC; filtering for PRODUCTION_VALIDATED should return none
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&maturity_level=PRODUCTION_VALIDATED'
    );
    expect(res.status).toBe(200);
    // Published record is EXPERIMENT_POC, so PRODUCTION_VALIDATED filter should exclude it
    const resultIds = res.body.data.map((r: any) => r.record_id);
    expect(resultIds).not.toContain(PUBLISHED_RECORD_ID);
  });

  it('invalid maturity_level filter value is silently ignored (not an error)', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&maturity_level=INVALID_VALUE'
    );
    // Invalid enum value should be silently dropped — should still return results without 400
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // No error code
    expect(res.body.error).toBeUndefined();
  });

  it('reuse_potential filter returns only matching records', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&reuse_potential=HIGH'
    );
    expect(res.status).toBe(200);
    for (const card of res.body.data) {
      expect(card.reuse_potential).toBe('HIGH');
    }
  });

  it('invalid reuse_potential filter value is silently ignored', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&reuse_potential=INVALID'
    );
    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
  });

  // ── Pagination ────────────────────────────────────────────────────────────────

  it('respects page_size parameter and returns correct pagination envelope', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio&page_size=1&page=1'
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.pagination.page_size).toBe(1);
    expect(res.body.pagination.page).toBe(1);
  });

  it('clamps page_size > 50 to 50', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio&page_size=999'
    );
    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(50);
  });

  it('defaults page to 1 for invalid page param', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&page=invalid'
    );
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('defaults page_size to 12 for invalid page_size param', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&page_size=invalid'
    );
    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(12);
  });

  it('total_pages is consistent with total_count and page_size', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=audio+security&page_size=1'
    );
    expect(res.status).toBe(200);
    const { total_count, total_pages, page_size } = res.body.pagination;
    if (total_count > 0) {
      expect(total_pages).toBe(Math.ceil(total_count / page_size));
    } else {
      expect(total_pages).toBe(0);
    }
  });

  // ── HTML injection protection ─────────────────────────────────────────────────

  it('strips HTML tags from query before processing (no 500 error)', async () => {
    const res = await request(app).get(
      '/api/v1/search?q=<script>alert(1)</script>audio+security'
    );
    // After HTML strip, the query becomes 'audio+security' (or empty if stripped entirely)
    // Should not throw 500 — must return 200
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});
