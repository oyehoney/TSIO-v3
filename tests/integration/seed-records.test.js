/**
 * Seed Records Integration Test
 * TSIO Innovation Hub — Plan 17
 *
 * Verifies that the three seeded innovation records exist and have correct values:
 *   1. Audio Security POC    — 11111111-1111-1111-1111-111111111001 (5 key findings)
 *   2. AI Redaction POC      — 11111111-1111-1111-1111-111111111002 (PUBLISHED, EXPERIMENT_POC, CURATED)
 *   3. Blockchain Experiment — 11111111-1111-1111-1111-111111111003 (ARCHIVED maturity + publication_state)
 *
 * Assertions:
 *   - 3 seeded records exist in the DB
 *   - Audio Security POC has exactly 5 key_findings rows
 *   - Blockchain Experiment (archived record) has publication_state='ARCHIVED'
 *
 * Requires: Running PostgreSQL accessible via DATABASE_URL env var
 * with all migrations and seeds already applied.
 *
 * Local development:
 *   docker compose up -d db
 *   npx knex seed:run
 *   DATABASE_URL="postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub" \
 *     npx jest tests/integration/seed-records.test.js --testTimeout=30000
 */

'use strict';

const { Pool } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub';

// Fixed UUIDs — stable across seed runs and Wave 7b test fixture references
const AUDIO_SECURITY_UUID = '11111111-1111-1111-1111-111111111001'; // Audio Security POC
const AI_REDACTION_UUID   = '11111111-1111-1111-1111-111111111002'; // AI Redaction POC
const BLOCKCHAIN_UUID     = '11111111-1111-1111-1111-111111111003'; // Blockchain Experiment
const SEED_USER_UUID      = '00000000-0000-0000-0000-000000000001'; // Seed curator

const SEEDED_RECORD_UUIDS = [AUDIO_SECURITY_UUID, AI_REDACTION_UUID, BLOCKCHAIN_UUID];

let pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query('SELECT 1');
}, 30000);

afterAll(async () => {
  if (pool) await pool.end();
});

// =============================================================================
// Test Group 1: All 3 seeded records exist in the DB
// =============================================================================
describe('Seeded records: 3 records exist in DB', () => {
  test('all 3 seeded innovation records exist by UUID', async () => {
    const result = await pool.query(
      `SELECT record_id
         FROM innovation_records
        WHERE record_id = ANY($1::uuid[])
        ORDER BY record_id`,
      [SEEDED_RECORD_UUIDS]
    );
    expect(result.rows).toHaveLength(3);
    const foundUUIDs = result.rows.map((r) => r.record_id);
    expect(foundUUIDs).toContain(AUDIO_SECURITY_UUID);
    expect(foundUUIDs).toContain(AI_REDACTION_UUID);
    expect(foundUUIDs).toContain(BLOCKCHAIN_UUID);
  });

  test('seed curator user exists with UUID 00000000-0000-0000-0000-000000000001', async () => {
    const result = await pool.query(
      `SELECT user_id, email, role FROM users WHERE user_id = $1`,
      [SEED_USER_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].email).toBe('system-seed@tsio.courts.internal');
    expect(result.rows[0].role).toBe('CURATOR');
  });
});

// =============================================================================
// Test Group 2: Audio Security POC has exactly 5 key_findings rows
// UUID: 11111111-1111-1111-1111-111111111001
// =============================================================================
describe('Audio Security POC: correct key findings count', () => {
  test('Audio Security POC has 5 key_findings rows', async () => {
    const result = await pool.query(
      `SELECT COUNT(*) AS cnt
         FROM record_key_findings
        WHERE record_id = $1`,
      [AUDIO_SECURITY_UUID]
    );
    expect(parseInt(result.rows[0].cnt, 10)).toBe(5);
  });

  test('Audio Security POC key findings cover GPU, Azure, latency/performance, and production-readiness', async () => {
    const result = await pool.query(
      `SELECT finding_text
         FROM record_key_findings
        WHERE record_id = $1
        ORDER BY display_order`,
      [AUDIO_SECURITY_UUID]
    );
    const allText = result.rows.map((r) => r.finding_text).join(' ');
    expect(allText).toMatch(/GPU/i);
    expect(allText).toMatch(/Azure/i);
    expect(allText).toMatch(/latency|performance/i);
    expect(allText).toMatch(/production.readiness|production-readiness/i);
  });

  test('Audio Security POC has correct trust model values', async () => {
    const result = await pool.query(
      `SELECT maturity_level, review_status, publication_state, source_type
         FROM innovation_records
        WHERE record_id = $1`,
      [AUDIO_SECURITY_UUID]
    );
    expect(result.rows).toHaveLength(1);
    const r = result.rows[0];
    expect(r.maturity_level).toBe('EXPERIMENT_POC');
    expect(r.review_status).toBe('TECHNICALLY_REVIEWED');
    expect(r.publication_state).toBe('PUBLISHED');
    expect(r.source_type).toBe('I_AND_R');
  });

  test('Audio Security POC has 1 artifact link pointing to a SharePoint URL', async () => {
    const result = await pool.query(
      `SELECT url, artifact_type
         FROM record_artifact_links
        WHERE record_id = $1`,
      [AUDIO_SECURITY_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    expect(result.rows[0].artifact_type).toBe('DOCUMENT');
    expect(result.rows[0].url).toMatch(/^https:\/\//);
    expect(result.rows[0].url).toMatch(/sharepoint\.com/);
  });

  test('Audio Security POC has 4 tags (2 MISSION_AREA + 2 TECHNOLOGY_AREA)', async () => {
    const result = await pool.query(
      `SELECT tag_type, tag_value
         FROM record_tags
        WHERE record_id = $1
        ORDER BY tag_type, display_order`,
      [AUDIO_SECURITY_UUID]
    );
    expect(result.rows).toHaveLength(4);
    const missionTags = result.rows.filter((r) => r.tag_type === 'MISSION_AREA');
    const techTags    = result.rows.filter((r) => r.tag_type === 'TECHNOLOGY_AREA');
    expect(missionTags).toHaveLength(2);
    expect(techTags).toHaveLength(2);
  });

  test('Audio Security POC has 2 engagement options', async () => {
    const result = await pool.query(
      `SELECT option_type
         FROM record_engagement_options
        WHERE record_id = $1
        ORDER BY display_order`,
      [AUDIO_SECURITY_UUID]
    );
    expect(result.rows).toHaveLength(2);
    const types = result.rows.map((r) => r.option_type);
    expect(types).toContain('REQUEST_DEMO');
    expect(types).toContain('REQUEST_TECHNICAL_GUIDANCE');
  });
});

// =============================================================================
// Test Group 3: AI Redaction POC — PUBLISHED, EXPERIMENT_POC, CURATED
// UUID: 11111111-1111-1111-1111-111111111002
// =============================================================================
describe('AI Redaction POC: PUBLISHED, EXPERIMENT_POC, CURATED', () => {
  test('AI Redaction POC has correct maturity, review_status, and publication_state', async () => {
    const result = await pool.query(
      `SELECT maturity_level, review_status, publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [AI_REDACTION_UUID]
    );
    expect(result.rows).toHaveLength(1);
    const r = result.rows[0];
    expect(r.maturity_level).toBe('EXPERIMENT_POC');
    expect(r.review_status).toBe('CURATED');
    expect(r.publication_state).toBe('PUBLISHED');
  });

  test('AI Redaction POC is discoverable via PUBLISHED catalog query', async () => {
    const result = await pool.query(
      `SELECT record_id FROM innovation_records
        WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL AND record_id = $1`,
      [AI_REDACTION_UUID]
    );
    expect(result.rows).toHaveLength(1);
  });
});

// =============================================================================
// Test Group 4: Blockchain Experiment — ARCHIVED maturity + ARCHIVED publication_state
// UUID: 11111111-1111-1111-1111-111111111003
// =============================================================================
describe('Blockchain Experiment: ARCHIVED maturity and publication_state', () => {
  test('archived record has publication_state=ARCHIVED', async () => {
    const result = await pool.query(
      `SELECT publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].publication_state).toBe('ARCHIVED');
  });

  test('archived record has maturity_level=ARCHIVED (honest lifecycle)', async () => {
    const result = await pool.query(
      `SELECT maturity_level
         FROM innovation_records
        WHERE record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].maturity_level).toBe('ARCHIVED');
  });

  test('archived record does NOT appear in PUBLISHED catalog query', async () => {
    const result = await pool.query(
      `SELECT record_id FROM innovation_records
        WHERE publication_state = 'PUBLISHED' AND record_id = $1`,
      [BLOCKCHAIN_UUID]
    );
    expect(result.rows).toHaveLength(0);
  });
});

// =============================================================================
// Test Group 5: Idempotency — seeds can be re-applied without errors
// =============================================================================
describe('Idempotency: ON CONFLICT DO NOTHING pattern works', () => {
  test('duplicate insert of Audio Security POC with ON CONFLICT DO NOTHING succeeds silently', async () => {
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
          AUDIO_SECURITY_UUID,
          'x'.repeat(50),
          'x'.repeat(50),
          'x'.repeat(50),
          SEED_USER_UUID,
        ]
      )
    ).resolves.not.toThrow();
  });

  test('duplicate insert of seed curator user with ON CONFLICT DO NOTHING succeeds silently', async () => {
    await expect(
      pool.query(
        `INSERT INTO users (user_id, email, display_name, role, is_active)
         VALUES ($1, 'system-seed@tsio.courts.internal', 'Duplicate', 'CURATOR', TRUE)
         ON CONFLICT (user_id) DO NOTHING`,
        [SEED_USER_UUID]
      )
    ).resolves.not.toThrow();
  });
});
