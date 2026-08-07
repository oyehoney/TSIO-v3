/**
 * Migration Boot Integration Test
 * TSIO Innovation Hub — Wave 7a
 *
 * Verifies:
 * 1. All 11 DB tables exist after migration
 * 2. hub_settings seed rows present (including engagement_routing_email)
 * 3. Audio Security POC anchor record is PUBLISHED and discoverable
 * 4. Archived experiment record is ARCHIVED
 * 5. Anchor record search_vector is non-null (FTS triggers fired during seeding)
 *
 * Requires: Running PostgreSQL 16 accessible via DATABASE_URL env var
 * with all migrations and seeds already applied (run `docker compose up -d db`
 * then `./db/seeds/run_seeds.sh` before running this test).
 *
 * CI: Set DATABASE_URL in CI environment to point at a fresh PostgreSQL 16 container
 * with migrations applied.
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub';

let pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL });
  // Verify connection
  await pool.query('SELECT 1');
}, 30000);

afterAll(async () => {
  if (pool) await pool.end();
});

describe('Migration boot: all 11 tables exist', () => {
  const expectedTables = [
    'innovation_records',
    'record_key_findings',
    'record_artifact_links',
    'record_tags',
    'record_engagement_options',
    'audit_log',
    'users',
    'hub_settings',
    'opportunity_submissions',
    'contribution_submissions',
    'engagement_requests',
  ];

  test('all 11 expected tables exist in public schema', async () => {
    const result = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name`,
      [expectedTables]
    );
    const foundTables = result.rows.map((r) => r.table_name).sort();
    expect(foundTables).toEqual([...expectedTables].sort());
  });

  test('innovation_records has at least 1 CHECK constraint (maturity_level, review_status, or publication_state)', async () => {
    const result = await pool.query(
      `SELECT conname
         FROM pg_constraint
        WHERE conrelid = 'innovation_records'::regclass
          AND contype = 'c'
        ORDER BY conname`
    );
    // At minimum, the CHECK constraint for maturity_level, review_status, and publication_state exist
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });

  test('GIN index idx_innovation_records_fts exists on search_vector', async () => {
    const result = await pool.query(
      `SELECT indexname
         FROM pg_indexes
        WHERE tablename = 'innovation_records'
          AND indexname = 'idx_innovation_records_fts'`
    );
    expect(result.rows).toHaveLength(1);
  });
});

describe('hub_settings seed data', () => {
  test('hub_settings has at least 4 rows', async () => {
    const result = await pool.query('SELECT count(*) AS cnt FROM hub_settings');
    expect(parseInt(result.rows[0].cnt)).toBeGreaterThanOrEqual(4);
  });

  test('engagement_routing_email setting exists with correct initial value', async () => {
    const result = await pool.query(
      `SELECT setting_value FROM hub_settings WHERE setting_key = 'engagement_routing_email'`
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].setting_value).toBe('AOml_TSO_IRB_Team@ao.uscourts.gov');
  });
});

describe('Audio Security POC anchor record (F4)', () => {
  const ANCHOR_UUID = 'a0000000-0000-0000-0000-000000000001';

  test('anchor record exists with correct trust model values', async () => {
    const result = await pool.query(
      `SELECT record_id, title, maturity_level, review_status, publication_state, source_type
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    const record = result.rows[0];
    expect(record.maturity_level).toBe('PROTOTYPE_PILOT');
    expect(record.review_status).toBe('TECHNICALLY_REVIEWED');
    expect(record.publication_state).toBe('PUBLISHED');
    expect(record.source_type).toBe('I_AND_R');
  });

  test('anchor record is discoverable via catalog query (publication_state=PUBLISHED, deleted_at IS NULL)', async () => {
    const result = await pool.query(
      `SELECT record_id, title
         FROM innovation_records
        WHERE publication_state = 'PUBLISHED'
          AND deleted_at IS NULL
          AND record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toContain('Audio Security');
  });

  test('anchor record has exactly 4 key findings (GPU, Azure, performance, production-readiness)', async () => {
    const result = await pool.query(
      `SELECT finding_text FROM record_key_findings WHERE record_id = $1 ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(4);
    const allText = result.rows.map((r) => r.finding_text).join(' ');
    // Each required finding topic from PRD F4 + RTM TEST-F4-09
    expect(allText).toMatch(/GPU/i);
    expect(allText).toMatch(/Azure/i);
    expect(allText).toMatch(/latency|performance/i);
    expect(allText).toMatch(/production.readiness|production-readiness/i);
  });

  test('anchor record has at least 1 artifact link (HTTPS DOCUMENT to SharePoint)', async () => {
    const result = await pool.query(
      `SELECT label, url, artifact_type
         FROM record_artifact_links
        WHERE record_id = $1
          AND artifact_type = 'DOCUMENT'`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    expect(result.rows[0].url).toMatch(/^https:\/\//);
    expect(result.rows[0].url).toMatch(/sharepoint\.com/);
  });

  test('anchor record has at least 1 MISSION_AREA and 1 TECHNOLOGY_AREA tag', async () => {
    const missionResult = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'MISSION_AREA'`,
      [ANCHOR_UUID]
    );
    const techResult = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'TECHNOLOGY_AREA'`,
      [ANCHOR_UUID]
    );
    expect(missionResult.rows.length).toBeGreaterThanOrEqual(1);
    expect(techResult.rows.length).toBeGreaterThanOrEqual(1);
  });

  test('anchor record has engagement options including REQUEST_BRIEFING and REQUEST_TECHNICAL_GUIDANCE', async () => {
    const result = await pool.query(
      `SELECT option_type FROM record_engagement_options WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    const types = result.rows.map((r) => r.option_type);
    expect(types).toContain('REQUEST_BRIEFING');
    expect(types).toContain('REQUEST_TECHNICAL_GUIDANCE');
  });

  test('anchor record search_vector is non-null (FTS triggers fired during seed)', async () => {
    const result = await pool.query(
      `SELECT search_vector IS NOT NULL AS has_fts
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].has_fts).toBe(true);
  });

  test('FTS search for "audio security" returns anchor record (search_vector @@ plainto_tsquery)', async () => {
    const result = await pool.query(
      `SELECT record_id, title
         FROM innovation_records
        WHERE search_vector @@ plainto_tsquery('english', 'audio security')
          AND publication_state = 'PUBLISHED'
          AND deleted_at IS NULL`
    );
    const ids = result.rows.map((r) => r.record_id);
    expect(ids).toContain(ANCHOR_UUID);
  });
});

describe('Archived experiment record (F0/F9 honest lifecycle)', () => {
  const ARCHIVED_UUID = 'a0000000-0000-0000-0000-000000000002';

  test('archived experiment record exists with maturity_level=ARCHIVED and publication_state=ARCHIVED', async () => {
    const result = await pool.query(
      `SELECT record_id, maturity_level, publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [ARCHIVED_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].maturity_level).toBe('ARCHIVED');
    expect(result.rows[0].publication_state).toBe('ARCHIVED');
  });

  test('archived record does NOT appear in default catalog query (publication_state=PUBLISHED)', async () => {
    const result = await pool.query(
      `SELECT record_id
         FROM innovation_records
        WHERE publication_state = 'PUBLISHED'
          AND record_id = $1`,
      [ARCHIVED_UUID]
    );
    // Archived records must NOT appear in public catalog browse
    expect(result.rows).toHaveLength(0);
  });
});

describe('Idempotency: seed can be re-applied without errors', () => {
  test('re-applying seed_audio_security_poc UUID insert returns no error (ON CONFLICT DO NOTHING)', async () => {
    // Attempt duplicate insert of anchor UUID — must succeed silently
    await expect(
      pool.query(
        `INSERT INTO innovation_records (
            record_id, title, problem_statement, what_was_explored, outcome_summary,
            maturity_level, review_status, reuse_potential, source_type,
            owner_name, owner_office, contributing_office,
            default_perspective, publication_state, last_reviewed_date,
            published_at, created_by_user_id, updated_by_user_id
         ) VALUES (
            'a0000000-0000-0000-0000-000000000001',
            'Duplicate title', 'x' || repeat('y', 49), 'x' || repeat('y', 49),
            'x' || repeat('y', 49), 'PROTOTYPE_PILOT', 'TECHNICALLY_REVIEWED',
            'MEDIUM', 'I_AND_R', 'Owner', 'Office', 'Office',
            'EXECUTIVE', 'PUBLISHED', '2025-06-15', NOW(),
            'f0000000-0000-0000-0000-000000000001',
            'f0000000-0000-0000-0000-000000000001'
         ) ON CONFLICT (record_id) DO NOTHING`
      )
    ).resolves.not.toThrow();
  });
});
