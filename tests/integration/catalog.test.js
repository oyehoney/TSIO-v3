'use strict';
const request = require('supertest');
const { Pool } = require('pg');
const { createApp } = require('../../src/app');

// Use a real DB — DATABASE_URL must point to a running PostgreSQL instance
// (docker compose up -d db first)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = createApp();

// System user UUID for created_by/updated_by (from Wave 1 migration note:
// users table created in 001_supporting_tables.sql; for test isolation,
// insert a test user and use its UUID)
let testUserId;

beforeAll(async () => {
  // Insert a test curator user for FK requirements
  const result = await pool.query(`
    INSERT INTO users (email, display_name, role)
    VALUES ('test-curator@ao.uscourts.gov', 'Test Curator', 'CURATOR')
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING user_id
  `);
  testUserId = result.rows[0].user_id;
});

beforeEach(async () => {
  // Clean catalog data before each test; preserve users row
  await pool.query('DELETE FROM record_engagement_options');
  await pool.query('DELETE FROM record_tags');
  await pool.query('DELETE FROM record_key_findings');
  await pool.query('DELETE FROM record_artifact_links');
  await pool.query('DELETE FROM audit_log');
  await pool.query('DELETE FROM innovation_records');
});

afterAll(async () => {
  // Clean up test user
  await pool.query("DELETE FROM users WHERE email = 'test-curator@ao.uscourts.gov'");
  await pool.end();
});

/**
 * Helper: insert a minimal PUBLISHED innovation record.
 * Returns the inserted record_id.
 */
async function insertPublishedRecord(overrides = {}) {
  const defaults = {
    title: 'Test Innovation Record',
    problem_statement: 'A'.repeat(50),
    what_was_explored: 'B'.repeat(50),
    outcome_summary: 'C'.repeat(50),
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'MEDIUM',
    source_type: 'I_AND_R',
    owner_name: 'Test Owner',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
    publication_state: 'PUBLISHED',
    published_at: new Date().toISOString(),
    created_by_user_id: testUserId,
    updated_by_user_id: testUserId,
  };
  const record = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO innovation_records
      (title, problem_statement, what_was_explored, outcome_summary,
       maturity_level, review_status, reuse_potential, source_type,
       owner_name, owner_office, contributing_office, publication_state,
       published_at, created_by_user_id, updated_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING record_id`,
    [
      record.title, record.problem_statement, record.what_was_explored, record.outcome_summary,
      record.maturity_level, record.review_status, record.reuse_potential, record.source_type,
      record.owner_name, record.owner_office, record.contributing_office, record.publication_state,
      record.published_at, record.created_by_user_id, record.updated_by_user_id,
    ]
  );
  return result.rows[0].record_id;
}

// ─── GET /api/v1/catalog ────────────────────────────────────────────────────

describe('GET /api/v1/catalog', () => {

  test('returns 200 with empty data array when no records exist', async () => {
    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 12,
      total_count: 0,
      total_pages: 1,
    });
  });

  test('returns published records with correct CatalogCard shape', async () => {
    const recordId = await insertPublishedRecord({ title: 'Audio Security POC' });

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const card = res.body.data[0];
    expect(card.record_id).toBe(recordId);
    expect(card.title).toBe('Audio Security POC');
    expect(card).toHaveProperty('maturity_level', 'EXPERIMENT_POC');
    expect(card).toHaveProperty('maturity_label', 'Experiment / POC');
    expect(card).toHaveProperty('review_status', 'CURATED');
    expect(card).toHaveProperty('review_status_label', 'Curated');
    expect(card).toHaveProperty('is_validated_for_reuse', false);
    expect(card).toHaveProperty('is_community_contributed', false);
    expect(Array.isArray(card.mission_area_tags)).toBe(true);
    expect(Array.isArray(card.technology_area_tags)).toBe(true);
    expect(Array.isArray(card.engagement_options)).toBe(true);
    expect(card).toHaveProperty('published_at');
  });

  test('does NOT return DRAFT records to public users', async () => {
    // Insert a DRAFT record — should not appear in catalog
    await pool.query(
      `INSERT INTO innovation_records
        (title, problem_statement, what_was_explored, outcome_summary,
         maturity_level, review_status, reuse_potential, source_type,
         owner_name, owner_office, contributing_office, publication_state,
         created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,'IDEA','SUBMITTED','LOW','I_AND_R','Owner','TSIO','TSIO','DRAFT',$5,$5)`,
      ['Draft Record', 'A'.repeat(50), 'B'.repeat(50), 'C'.repeat(50), testUserId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('does NOT return soft-deleted PUBLISHED records', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query('UPDATE innovation_records SET deleted_at = NOW() WHERE record_id = $1', [recordId]);

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('filters by maturity_level (single value)', async () => {
    await insertPublishedRecord({ maturity_level: 'EXPERIMENT_POC' });
    await insertPublishedRecord({ maturity_level: 'PROTOTYPE_PILOT', title: 'Pilot Record' });

    const res = await request(app).get('/api/v1/catalog?maturity_level=EXPERIMENT_POC');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].maturity_level).toBe('EXPERIMENT_POC');
  });

  test('filters by maturity_level (multi-value)', async () => {
    await insertPublishedRecord({ maturity_level: 'EXPERIMENT_POC' });
    await insertPublishedRecord({ maturity_level: 'PROTOTYPE_PILOT', title: 'Pilot Record' });
    await insertPublishedRecord({ maturity_level: 'IDEA', title: 'Idea Record' });

    const res = await request(app).get('/api/v1/catalog?maturity_level=EXPERIMENT_POC&maturity_level=PROTOTYPE_PILOT');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test('filters by review_status', async () => {
    await insertPublishedRecord({ review_status: 'VALIDATED_FOR_REUSE' });
    await insertPublishedRecord({ review_status: 'CURATED', title: 'Curated Record' });

    const res = await request(app).get('/api/v1/catalog?review_status=VALIDATED_FOR_REUSE');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].is_validated_for_reuse).toBe(true);
  });

  test('filters by reuse_potential', async () => {
    await insertPublishedRecord({ reuse_potential: 'HIGH' });
    await insertPublishedRecord({ reuse_potential: 'LOW', title: 'Low Reuse Record' });

    const res = await request(app).get('/api/v1/catalog?reuse_potential=HIGH');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reuse_potential).toBe('HIGH');
  });

  test('silently ignores invalid filter values (FRD F00 §Validation)', async () => {
    await insertPublishedRecord();

    // 'INVALID_LEVEL' is not a valid maturity_level — should be ignored, returning all records
    const res = await request(app).get('/api/v1/catalog?maturity_level=INVALID_LEVEL');
    expect(res.status).toBe(200);
    // No maturity filter applied — returns all published records
    expect(res.body.data.length).toBe(1);
  });

  test('paginates correctly with page and page_size', async () => {
    // Insert 3 records
    await insertPublishedRecord({ title: 'Record 1' });
    await insertPublishedRecord({ title: 'Record 2' });
    await insertPublishedRecord({ title: 'Record 3' });

    const res = await request(app).get('/api/v1/catalog?page=1&page_size=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total_count).toBe(3);
    expect(res.body.pagination.total_pages).toBe(2);
    expect(res.body.pagination.page_size).toBe(2);

    const res2 = await request(app).get('/api/v1/catalog?page=2&page_size=2');
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(1);
  });

  test('clamps page_size to 50 maximum (FRD F00 §Validation)', async () => {
    const res = await request(app).get('/api/v1/catalog?page_size=999');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(50);
  });

  test('defaults to page 1 for invalid page value (FRD F00 §Validation)', async () => {
    const res = await request(app).get('/api/v1/catalog?page=abc');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  test('is_community_contributed = true for COMMUNITY source_type records', async () => {
    await insertPublishedRecord({ source_type: 'COMMUNITY', title: 'Community Record' });

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data[0].is_community_contributed).toBe(true);
  });

  test('includes mission_area_tags and technology_area_tags from record_tags', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query(
      `INSERT INTO record_tags (record_id, tag_type, tag_value, display_order) VALUES ($1,'MISSION_AREA','Cybersecurity',0), ($1,'TECHNOLOGY_AREA','AI/ML',0)`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    const card = res.body.data[0];
    expect(card.mission_area_tags).toContain('Cybersecurity');
    expect(card.technology_area_tags).toContain('AI/ML');
  });

  test('includes engagement_options from record_engagement_options', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query(
      `INSERT INTO record_engagement_options (record_id, option_type, display_order) VALUES ($1,'REQUEST_DEMO',0)`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data[0].engagement_options).toContain('REQUEST_DEMO');
  });

});

// ─── GET /api/v1/catalog/filters ────────────────────────────────────────────

describe('GET /api/v1/catalog/filters', () => {

  test('returns empty arrays when no published records exist', async () => {
    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      maturity_levels: expect.any(Array),
      review_statuses: expect.any(Array),
      contributing_offices: expect.any(Array),
      mission_area_tags: expect.any(Array),
      technology_area_tags: expect.any(Array),
      reuse_potentials: expect.any(Array),
    });
  });

  test('returns correct CatalogFilters shape from published records', async () => {
    const recordId = await insertPublishedRecord({
      maturity_level: 'EXPERIMENT_POC',
      review_status: 'VALIDATED_FOR_REUSE',
      contributing_office: 'TSIO I&R',
      reuse_potential: 'HIGH',
    });
    await pool.query(
      `INSERT INTO record_tags (record_id, tag_type, tag_value) VALUES ($1,'MISSION_AREA','Cybersecurity'), ($1,'TECHNOLOGY_AREA','AI/ML')`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body.maturity_levels).toContain('EXPERIMENT_POC');
    expect(res.body.review_statuses).toContain('VALIDATED_FOR_REUSE');
    expect(res.body.contributing_offices).toContain('TSIO I&R');
    expect(res.body.mission_area_tags).toContain('Cybersecurity');
    expect(res.body.technology_area_tags).toContain('AI/ML');
    expect(res.body.reuse_potentials).toContain('HIGH');
  });

  test('does NOT include filter values from DRAFT records', async () => {
    // Insert a DRAFT record with a unique office name
    await pool.query(
      `INSERT INTO innovation_records
        (title, problem_statement, what_was_explored, outcome_summary,
         maturity_level, review_status, reuse_potential, source_type,
         owner_name, owner_office, contributing_office, publication_state,
         created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,'IDEA','SUBMITTED','LOW','I_AND_R','Owner','TSIO','DRAFT_ONLY_OFFICE','DRAFT',$5,$5)`,
      ['Draft Only', 'A'.repeat(50), 'B'.repeat(50), 'C'.repeat(50), testUserId]
    );

    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body.contributing_offices).not.toContain('DRAFT_ONLY_OFFICE');
  });

});

// ─── GET /healthz ───────────────────────────────────────────────────────────

describe('GET /healthz', () => {
  test('returns 200 {status: ok} when DB is reachable', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
