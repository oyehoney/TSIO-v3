-- =============================================================================
-- Verification Script: 001_core_content_tables
-- TSIO Innovation Hub
-- Run after 001_core_content_tables.sql to confirm all objects were created.
-- Expected: all queries return non-zero row counts or specific rows.
-- =============================================================================

-- ── 1. Table existence ────────────────────────────────────────────────────────
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN (
       'innovation_records',
       'record_key_findings',
       'record_artifact_links',
       'record_tags',
       'record_engagement_options',
       'audit_log'
   )
 ORDER BY table_name;
-- Expected: 6 rows

-- ── 2. innovation_records columns ─────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'innovation_records'
 ORDER BY ordinal_position;
-- Expected: 29 columns including record_id, title, problem_statement,
--   what_was_explored, outcome_summary, reuse_guidance, short_summary,
--   maturity_level, review_status, reuse_potential, source_type,
--   owner_name, owner_office, contributing_office, contributor_attribution,
--   executive_perspective_text, executive_recommendation,
--   technical_perspective_text, security_findings, performance_findings,
--   default_perspective, publication_state, last_reviewed_date, published_at,
--   superseded_by_record_id, search_vector, created_at, updated_at,
--   created_by_user_id, updated_by_user_id, deleted_at

-- ── 3. CHECK constraints on innovation_records ────────────────────────────────
SELECT conname, consrc
  FROM pg_constraint
 WHERE conrelid = 'innovation_records'::regclass
   AND contype = 'c'
 ORDER BY conname;
-- Expected: CHECK constraints for maturity_level, review_status, reuse_potential,
--   source_type, default_perspective, publication_state, title length, 
--   problem_statement length, what_was_explored length, outcome_summary length

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename IN (
       'innovation_records',
       'record_key_findings',
       'record_artifact_links',
       'record_tags',
       'record_engagement_options',
       'audit_log'
   )
 ORDER BY tablename, indexname;
-- Expected: 14 indexes including idx_innovation_records_fts (GIN),
--   idx_innovation_records_publication_state (partial),
--   idx_innovation_records_maturity (partial),
--   idx_innovation_records_review_status (partial),
--   idx_innovation_records_published_at (partial, DESC),
--   idx_innovation_records_source_type (partial),
--   idx_innovation_records_reuse_potential (partial),
--   idx_record_key_findings_record, idx_record_artifact_links_record,
--   idx_record_tags_record, idx_record_tags_value,
--   idx_record_engagement_options_record,
--   idx_audit_log_record, idx_audit_log_user, idx_audit_log_event_type

-- ── 5. Trigger existence ──────────────────────────────────────────────────────
SELECT trigger_name, event_manipulation, event_object_table, action_timing
  FROM information_schema.triggers
 WHERE trigger_schema = 'public'
   AND trigger_name IN (
       'trg_innovation_record_fts',
       'trg_findings_update_fts',
       'trg_tags_update_fts'
   )
 ORDER BY trigger_name;
-- Expected: 3 rows
-- trg_innovation_record_fts: BEFORE INSERT/UPDATE on innovation_records
-- trg_findings_update_fts: AFTER INSERT/UPDATE/DELETE on record_key_findings
-- trg_tags_update_fts: AFTER INSERT/UPDATE/DELETE on record_tags

-- ── 6. GIN index specifically ─────────────────────────────────────────────────
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE indexname = 'idx_innovation_records_fts';
-- Expected: 1 row with USING gin(search_vector)

-- ── 7. UNIQUE constraint on record_engagement_options ────────────────────────
SELECT conname, contype
  FROM pg_constraint
 WHERE conrelid = 'record_engagement_options'::regclass
   AND contype = 'u';
-- Expected: 1 row for UNIQUE(record_id, option_type)

-- ── 8. FTS trigger function smoke test ───────────────────────────────────────
-- This is a dry run — we cannot insert without a users table yet.
-- Verify the trigger functions exist as pg_proc entries:
SELECT proname, prosrc IS NOT NULL AS has_body
  FROM pg_proc
 WHERE proname IN (
     'update_innovation_record_search_vector',
     'refresh_record_search_vector_from_findings',
     'refresh_record_search_vector_from_tags'
 );
-- Expected: 3 rows, all has_body = true

-- =============================================================================
-- End of verification script
-- =============================================================================
