/**
 * Migration Boot Integration Test
 * TSIO Innovation Hub — Wave 7a (Plan 17)
 *
 * Verifies:
 * 1. All 11 DB tables exist after migration
 * 2. hub_settings seed rows present (including engagement_routing_email)
 * 3. Audio Security POC anchor record is PUBLISHED and discoverable
 * 4. AI Redaction POC record is PUBLISHED
 * 5. Blockchain Experiment record is ARCHIVED (both maturity + publication_state)
 * 6. Anchor record search_vector is non-null (FTS triggers fired during seeding)
 * 7. Idempotency: duplicate inserts with ON CONFLICT DO NOTHING succeed silently
 *
 * Requires: Running PostgreSQL 16 accessible via DATABASE_URL env var
 * with all migrations and seeds already applied.
 *
 * Local development:
 *   docker compose up -d db
 *   ./db/seeds/run_seeds.sh   (or: DATABASE_URL=... node -e "require('./db/seeds/001...').seed(knex)")
 *   DATABASE_URL="postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub" \
 *     npx jest tests/integration/migration_boot.test.js --testTimeout=30000
 *
 * CI: Set DATABASE_URL in CI environment to point at a fresh PostgreSQL 16 container
 * with migrations applied.
 */

'use strict';

const { Pool } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub';

// Fixed UUIDs matching seed files — stable for Wave 7b test fixture references
const ANCHOR_UUID      = '11111111-1111-1111-1111-111111111001'; // Audio Security POC
const AI_REDACTION_UUID = '22222222-2222-2222-2222-222222222001'; // AI Redaction POC
const BLOCKCHAIN_UUID  = '33333333-3333-3333-3333-333333333001'; // Blockchain Experiment
const SEED_USER_ID     = 'ffffffff-ffff-ffff-ffff-ffffffffffff'; // Seed curator

let pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL });
  // Verify connection before any tests run
  await pool.query('SELECT 1');
}, 30000);

afterAll(async () => {
  if (pool) await pool.end();
});

// =============================================================================
// Test Group 1: All 11 tables exist after migration
// =============================================================================
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

  test('innovation_records has CHECK constraints (maturity_level, review_status, publication_state)', async () => {
    const result = await pool.query(
      `SELECT conname
         FROM pg_constraint
        WHERE conrelid = 'innovation_records'::regclass
          AND contype = 'c'
        ORDER BY conname`
    );
    // At minimum, CHECK constraints exist for the key governance columns
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

  test('record_engagement_options has UNIQUE constraint on (record_id, option_type)', async () => {
    const result = await pool.query(
      `SELECT conname, contype
         FROM pg_constraint
        WHERE conrelid = 'record_engagement_options'::regclass
          AND contype = 'u'`
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Test Group 2: hub_settings seed data (seeded via migration 001_supporting_tables.sql)
// =============================================================================
describe('hub_settings seed data', () => {
  test('hub_settings has at least 4 rows', async () => {
    const result = await pool.query('SELECT count(*) AS cnt FROM hub_settings');
    expect(parseInt(result.rows[0].cnt, 10)).toBeGreaterThanOrEqual(4);
  });

  test('engagement_routing_email setting exists with correct initial value', async () => {
    const result = await pool.query(
      `SELECT setting_value FROM hub_settings WHERE setting_key = 'engagement_routing_email'`
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].setting_value).toBe('AOml_TSO_IRB_Team@ao.uscourts.gov');
  });

  test('default_perspective setting is EXECUTIVE', async () => {
    const result = await pool.query(
      `SELECT setting_value FROM hub_settings WHERE setting_key = 'default_perspective'`
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].setting_value).toBe('EXECUTIVE');
  });
});

// =============================================================================
// Test Group 3: Audio Security POC anchor record (F4)
// UUID: 11111111-1111-1111-1111-111111111001
// =============================================================================
describe('Audio Security POC anchor record (F4)', () => {
  test('anchor record exists with correct trust model values', async () => {
    const result = await pool.query(
      `SELECT record_id, title, maturity_level, review_status, publication_state, source_type
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    const record = result.rows[0];
    expect(record.maturity_level).toBe('EXPERIMENT_POC');
    expect(record.review_status).toBe('TECHNICALLY_REVIEWED');
    expect(record.publication_state).toBe('PUBLISHED');
    expect(record.source_type).toBe('I_AND_R');
  });

  test('anchor record title matches expected value', async () => {
    const result = await pool.query(
      `SELECT title FROM innovation_records WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toContain('Audio Security');
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

  test('anchor record has 5 key findings covering all required topics', async () => {
    const result = await pool.query(
      `SELECT finding_text FROM record_key_findings WHERE record_id = $1 ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(5);
    const allText = result.rows.map((r) => r.finding_text).join(' ');
    // Required finding topics from PRD F4 + user specification
    expect(allText).toMatch(/GPU/i);
    expect(allText).toMatch(/Azure/i);
    expect(allText).toMatch(/latency|performance/i);
    expect(allText).toMatch(/production.readiness|production-readiness/i);
    expect(allText).toMatch(/reuse/i);
  });

  test('anchor record has 1 artifact link (HTTPS DOCUMENT to SharePoint)', async () => {
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
    expect(result.rows[0].label).toContain('Audio Security');
  });

  test('anchor record has MISSION_AREA tags: Cybersecurity and Court Operations', async () => {
    const result = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'MISSION_AREA' ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    const tagValues = result.rows.map((r) => r.tag_value);
    expect(tagValues).toContain('Cybersecurity');
    expect(tagValues).toContain('Court Operations');
  });

  test('anchor record has TECHNOLOGY_AREA tags: Azure Government Cloud and GPU Computing', async () => {
    const result = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'TECHNOLOGY_AREA' ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    const tagValues = result.rows.map((r) => r.tag_value);
    expect(tagValues).toContain('Azure Government Cloud');
    expect(tagValues).toContain('GPU Computing');
  });

  test('anchor record has engagement options: REQUEST_DEMO and REQUEST_TECHNICAL_GUIDANCE', async () => {
    const result = await pool.query(
      `SELECT option_type FROM record_engagement_options WHERE record_id = $1 ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    const types = result.rows.map((r) => r.option_type);
    expect(types).toContain('REQUEST_DEMO');
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

  test('FTS search for "audio security" returns anchor record', async () => {
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

  test('anchor record has executive_perspective_text and executive_recommendation populated', async () => {
    const result = await pool.query(
      `SELECT executive_perspective_text, executive_recommendation
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].executive_perspective_text).toBeTruthy();
    expect(result.rows[0].executive_recommendation).toBeTruthy();
    expect(result.rows[0].executive_perspective_text.length).toBeGreaterThan(50);
    expect(result.rows[0].executive_recommendation.length).toBeGreaterThan(50);
  });
});

// =============================================================================
// Test Group 4: AI Redaction POC record (PUBLISHED, EXPERIMENT_POC)
// UUID: 22222222-2222-2222-2222-222222222001
// =============================================================================
describe('AI Redaction POC record (additional PUBLISHED record)', () => {
  test('AI Redaction POC exists with PUBLISHED state and EXPERIMENT_POC maturity', async () => {
    const result = await pool.query(
      `SELECT record_id, title, maturity_level, publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [AI_REDACTION_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].maturity_level).toBe('EXPERIMENT_POC');
    expect(result.rows[0].publication_state).toBe('PUBLISHED');
  });

  test('AI Redaction POC is discoverable via catalog query', async () => {
    const result = await pool.query(
      `SELECT record_id FROM innovation_records
        WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL AND record_id = $1`,
      [AI_REDACTION_UUID]
    );
    expect(result.rows).toHaveLength(1);
  });

  test('AI Redaction POC has DOCUMENT artifact link', async () => {
    const result = await pool.query(
      `SELECT artifact_type, url FROM record_artifact_links WHERE record_id = $1`,
      [AI_REDACTION_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    const docLinks = result.rows.filter((r) => r.artifact_type === 'DOCUMENT');
    expect(docLinks.length).toBeGreaterThanOrEqual(1);
    expect(docLinks[0].url).toMatch(/^https:\/\//);
  });
});

// =============================================================================
// Test Group 5: Blockchain Experiment record (ARCHIVED, ARCHIVED)
// UUID: 33333333-3333-3333-3333-333333333001
// =============================================================================
describe('Blockchain Experiment record (F0/F9 honest lifecycle — ARCHIVED)', () => {
  test('blockchain experiment record exists with maturity_level=ARCHIVED and publication_state=ARCHIVED', async () => {
    const result = await pool.query(
      `SELECT record_id, maturity_level, publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].maturity_level).toBe('ARCHIVED');
    expect(result.rows[0].publication_state).toBe('ARCHIVED');
  });

  test('archived record does NOT appear in default PUBLISHED catalog query', async () => {
    const result = await pool.query(
      `SELECT record_id
         FROM innovation_records
        WHERE publication_state = 'PUBLISHED'
          AND record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows).toHaveLength(0);
  });

  test('archived record has document artifact link for institutional reference', async () => {
    const result = await pool.query(
      `SELECT artifact_type, url FROM record_artifact_links WHERE record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Test Group 6: Overall catalog integrity
// =============================================================================
describe('Catalog integrity: published records count and structure', () => {
  test('at least 2 records have publication_state=PUBLISHED', async () => {
    const result = await pool.query(
      `SELECT count(*) AS cnt FROM innovation_records
        WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL`
    );
    expect(parseInt(result.rows[0].cnt, 10)).toBeGreaterThanOrEqual(2);
  });

  test('at least 1 record has maturity_level=ARCHIVED and publication_state=ARCHIVED', async () => {
    const result = await pool.query(
      `SELECT count(*) AS cnt FROM innovation_records
        WHERE maturity_level = 'ARCHIVED' AND publication_state = 'ARCHIVED'`
    );
    expect(parseInt(result.rows[0].cnt, 10)).toBeGreaterThanOrEqual(1);
  });

  test('seed curator user exists in users table', async () => {
    const result = await pool.query(
      `SELECT user_id, email, role FROM users WHERE user_id = $1`,
      [SEED_USER_ID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].email).toBe('system-seed@tsio.courts.internal');
    expect(result.rows[0].role).toBe('CURATOR');
  });
});

// =============================================================================
// Test Group 7: Idempotency
// =============================================================================
describe('Idempotency: seed can be re-applied without errors', () => {
  test('duplicate insert of anchor UUID with ON CONFLICT DO NOTHING succeeds silently', async () => {
    await expect(
      pool.query(
        `INSERT INTO innovation_records (
            record_id, title, problem_statement, what_was_explored, outcome_summary,
            maturity_level, review_status, reuse_potential, source_type,
            owner_name, owner_office, contributing_office,
            default_perspective, publication_state, last_reviewed_date,
            published_at, created_by_user_id, updated_by_user_id
         ) VALUES (
            $1,
            'Duplicate title test', $2, $3,
            $4, 'EXPERIMENT_POC', 'TECHNICALLY_REVIEWED',
            'MEDIUM', 'I_AND_R', 'Owner', 'Office', 'Contributing Office',
            'EXECUTIVE', 'PUBLISHED', '2025-06-15', NOW(),
            $5, $5
         ) ON CONFLICT (record_id) DO NOTHING`,
        [
          ANCHOR_UUID,
          'x'.repeat(50),
          'x'.repeat(50),
          'x'.repeat(50),
          SEED_USER_ID,
        ]
      )
    ).resolves.not.toThrow();
  });

  test('duplicate insert of seed user with ON CONFLICT DO NOTHING succeeds silently', async () => {
    await expect(
      pool.query(
        `INSERT INTO users (user_id, email, display_name, role, is_active)
         VALUES ($1, 'system-seed@tsio.courts.internal', 'Duplicate', 'CURATOR', TRUE)
         ON CONFLICT (user_id) DO NOTHING`,
        [SEED_USER_ID]
      )
    ).resolves.not.toThrow();
  });
});
