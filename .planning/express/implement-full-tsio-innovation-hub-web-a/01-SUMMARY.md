---
phase: implement-full-tsio-innovation-hub-web-a
plan: "01"
subsystem: database
tags: [postgresql, migrations, fts, triggers, indexes, ddl]

dependency_graph:
  requires: []
  provides:
    - innovation_records table (29 columns, all CHECK constraints)
    - record_key_findings, record_artifact_links, record_tags, record_engagement_options child tables
    - audit_log table (append-only design)
    - GIN index on search_vector for FTS
    - 6 partial indexes on innovation_records
    - 3 FTS trigger functions and triggers
    - 001_core_content_tables_verify.sql for schema validation
  affects:
    - Plan 02 (adds users table + FK constraints to created_by_user_id, updated_by_user_id, changed_by_user_id)
    - All Wave 2/3 backend services (depend on these tables existing)

tech_stack:
  added: []
  patterns:
    - PostgreSQL native FTS with tsvector + GIN index
    - Weighted FTS (A/B/C weights via setweight + to_tsvector)
    - Idempotent DDL (CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION, DROP TRIGGER IF EXISTS)
    - Soft-delete pattern (deleted_at TIMESTAMPTZ, partial indexes exclude deleted rows)
    - FK deferral across migrations (UUID NOT NULL without REFERENCES, added in migration 002)

key_files:
  created:
    - db/migrations/001_core_content_tables.sql
    - db/migrations/001_core_content_tables_verify.sql
  modified: []

decisions:
  - "FK deferral: created_by_user_id, updated_by_user_id (innovation_records) and changed_by_user_id (audit_log) defined as UUID NOT NULL without REFERENCES users(user_id); constraint added by migration 002 after users table exists"
  - "Idempotency strategy: CREATE TABLE IF NOT EXISTS for tables, CREATE OR REPLACE FUNCTION for trigger functions, DROP TRIGGER IF EXISTS before CREATE TRIGGER"
  - "FTS weight scheme: A=problem_statement+key_findings, B=title+what_was_explored+outcome_summary, C=reuse_guidance+short_summary+executive_perspective_text+technical_perspective_text+tags"
  - "Soft-delete: deleted_at TIMESTAMPTZ column; all 6 partial indexes include WHERE deleted_at IS NULL"

metrics:
  duration: "~5 minutes"
  completed: "2026-07-31"
  tasks_completed: 2
  files_created: 2
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 01: Core Content Tables Summary

**One-liner:** PostgreSQL DDL for innovation_records (6 tables) with weighted FTS via tsvector GIN index, 3 cascade triggers, and 6 partial soft-delete indexes — all idempotent via IF NOT EXISTS / CREATE OR REPLACE patterns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create core content tables DDL migration | bffda74 | db/migrations/001_core_content_tables.sql |
| 2 | Create migration verification script | 37b357d | db/migrations/001_core_content_tables_verify.sql |

## Files Created

### `db/migrations/001_core_content_tables.sql`

Complete DDL migration (311 lines) implementing:

**Tables (6):**
- `innovation_records` — 29 columns; CHECK constraints for all 5 enum values of `maturity_level`, 7 `review_status` values, 5 `publication_state` values, 3 `reuse_potential` values, 2 `source_type` values, 2 `default_perspective` values; length checks on title (≥5), problem_statement/what_was_explored/outcome_summary (≥50)
- `record_key_findings` — finding_text length check (10–1000), FK ON DELETE CASCADE
- `record_artifact_links` — url LIKE 'https://%' constraint, artifact_type enum (5 values), FK ON DELETE CASCADE
- `record_tags` — tag_type enum (MISSION_AREA/TECHNOLOGY_AREA), tag_value length ≥1, FK ON DELETE CASCADE
- `record_engagement_options` — option_type enum (5 values), UNIQUE(record_id, option_type), FK ON DELETE CASCADE
- `audit_log` — event_type enum (4 values), append-only design

**Indexes (14):**
- `idx_innovation_records_fts` — USING GIN(search_vector) for FTS
- `idx_innovation_records_publication_state` — partial (WHERE deleted_at IS NULL)
- `idx_innovation_records_maturity` — partial (WHERE deleted_at IS NULL)
- `idx_innovation_records_review_status` — partial (WHERE deleted_at IS NULL)
- `idx_innovation_records_published_at` — partial (WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL), DESC
- `idx_innovation_records_source_type` — partial (WHERE deleted_at IS NULL)
- `idx_innovation_records_reuse_potential` — partial (WHERE deleted_at IS NULL)
- `idx_record_key_findings_record`, `idx_record_artifact_links_record`
- `idx_record_tags_record`, `idx_record_tags_value`
- `idx_record_engagement_options_record`
- `idx_audit_log_record`, `idx_audit_log_user`, `idx_audit_log_event_type`

**Trigger Functions (3) and Triggers (3):**
- `update_innovation_record_search_vector()` / `trg_innovation_record_fts` — BEFORE INSERT OR UPDATE on innovation_records; sets A/B/C weighted FTS from record fields
- `refresh_record_search_vector_from_findings()` / `trg_findings_update_fts` — AFTER INSERT/UPDATE/DELETE on record_key_findings; appends aggregate key findings text at weight A
- `refresh_record_search_vector_from_tags()` / `trg_tags_update_fts` — AFTER INSERT/UPDATE/DELETE on record_tags; appends aggregate tag values at weight C

### `db/migrations/001_core_content_tables_verify.sql`

Verification script (116 lines) with 8 queries for Wave 2/3 backend planners to confirm schema readiness:
1. Table existence (6 tables expected)
2. innovation_records columns (29 expected)
3. CHECK constraints on innovation_records
4. All indexes (14 expected)
5. Trigger existence (3 triggers expected)
6. GIN index confirmation
7. UNIQUE constraint on record_engagement_options
8. Trigger function existence via pg_proc (3 functions expected)

## Key DDL Decisions

### FK Deferral Approach
`created_by_user_id` and `updated_by_user_id` in `innovation_records`, and `changed_by_user_id` in `audit_log`, are defined as `UUID NOT NULL` **without** `REFERENCES users(user_id)`. This allows migration 001 to run before migration 002 (which creates the `users` table). Migration 002 adds `ALTER TABLE ... ADD FOREIGN KEY` for these columns. Each column has a comment: `-- FK to users(user_id) added in 002_supporting_tables.sql`.

### Idempotency Strategy
- Tables: `CREATE TABLE IF NOT EXISTS`
- Trigger functions: `CREATE OR REPLACE FUNCTION`
- Triggers: `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- Indexes: `CREATE INDEX IF NOT EXISTS`

This allows the migration to be re-run safely (e.g., in CI/CD or sandbox reset scenarios).

### FTS Weight Scheme (from TechArch §3.2)
| Weight | Fields |
|--------|--------|
| A (highest) | `problem_statement`, `key_findings` aggregate (via child table trigger) |
| B (medium) | `title`, `what_was_explored`, `outcome_summary` |
| C (standard) | `reuse_guidance`, `short_summary`, `executive_perspective_text`, `technical_perspective_text`, `tag_value` aggregate (via child table trigger) |

## Integration Contract for Wave 2/3

**Wave 2 SearchService query pattern:**
```sql
WHERE search_vector @@ plainto_tsquery('english', $1)
  AND publication_state = 'PUBLISHED'
  AND deleted_at IS NULL
```

**Wave 2 backend must:**
- Pass `users.user_id` as `created_by_user_id`/`updated_by_user_id` on every INSERT/UPDATE to innovation_records
- Pass authenticated curator's `user_id` as `changed_by_user_id` in audit_log rows (never trust client-supplied actor ID per T-01-06)
- NOT grant UPDATE/DELETE on audit_log to the application database user (per T-01-01, INSERT+SELECT only)
- Include `AND deleted_at IS NULL` in all catalog/search predicates (partial indexes enforce this operationally per T-01-02)
- Include `AND publication_state = 'PUBLISHED'` for all public-facing queries (per T-01-03)

**Contract verify command:**
```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('innovation_records','record_key_findings','record_artifact_links','record_tags','record_engagement_options','audit_log');" | grep innovation_records && echo CONTRACT_OK
```

## Deviations from Plan

None — plan executed exactly as written. The FK deferral approach (omit-and-add-later) was specified in the plan and implemented as directed.

## Known Stubs

None found. All DDL is complete and production-ready (pending users table creation in migration 002 to enable FK constraints).

## Self-Check: PASSED

- [x] `db/migrations/001_core_content_tables.sql` exists (14,574 bytes)
- [x] `db/migrations/001_core_content_tables_verify.sql` exists (5,679 bytes)
- [x] 6 CREATE TABLE IF NOT EXISTS statements (6 tables)
- [x] 8 trigger name references (≥6 required: DROP IF EXISTS + CREATE for 3 triggers)
- [x] GIN index USING GIN(search_vector) present
- [x] 5 partial indexes with WHERE deleted_at IS NULL
- [x] 5 FK deferral comments (created_by_user_id, updated_by_user_id, changed_by_user_id + header comments)
- [x] Commit bffda74: Task 1 migration file
- [x] Commit 37b357d: Task 2 verification script
- [x] No stubs or TODOs found in created files
- [x] No build step required for pure SQL DDL migration files
