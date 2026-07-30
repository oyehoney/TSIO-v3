---
phase: implement-full-tsio-innovation-hub-web-a
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - db/migrations/001_core_content_tables.sql
  - db/migrations/001_core_content_tables_verify.sql
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F9"]
  depends_on: []
  enables: ["F0", "F1", "F2", "F3", "F4", "F9"]

must_haves:
  truths:
    - "innovation_records table exists with all 29 columns, CHECK constraints for all 5 enum values of maturity_level, 7 review_status values, 5 publication_state values, 3 reuse_potential values, 2 source_type values, 2 default_perspective values"
    - "record_key_findings, record_artifact_links, record_tags, record_engagement_options tables exist with correct FK → innovation_records ON DELETE CASCADE and UNIQUE constraints"
    - "audit_log table exists with append-only design (4 event_type CHECK values) and FK to both innovation_records and users"
    - "GIN index idx_innovation_records_fts on search_vector column exists"
    - "All 6 partial indexes on innovation_records exist (publication_state, maturity_level, review_status, published_at, source_type, reuse_potential)"
    - "Trigger trg_innovation_record_fts fires BEFORE INSERT OR UPDATE on innovation_records, setting search_vector with A/B/C weighted fields"
    - "Trigger trg_findings_update_fts fires AFTER INSERT OR UPDATE OR DELETE on record_key_findings, refreshing parent search_vector with weight A"
    - "Trigger trg_tags_update_fts fires AFTER INSERT OR UPDATE OR DELETE on record_tags, refreshing parent search_vector with weight C"
    - "All migration SQL is idempotent (CREATE TABLE IF NOT EXISTS / DROP-and-recreate triggers with CREATE OR REPLACE FUNCTION)"
    - "verify script confirms table existence, all indexes, all triggers using psql \\d meta-commands against the Docker PostgreSQL instance"
  artifacts:
    - path: "db/migrations/001_core_content_tables.sql"
      provides: "DDL for innovation_records + 4 child tables + audit_log + all indexes + all FTS triggers"
    - path: "db/migrations/001_core_content_tables_verify.sql"
      provides: "Verification queries confirming tables, indexes, triggers, and CHECK constraints exist"
  key_links:
    - from: "record_key_findings"
      to: "innovation_records.search_vector"
      via: "trg_findings_update_fts trigger → refresh_record_search_vector_from_findings()"
      pattern: "trg_findings_update_fts"
    - from: "record_tags"
      to: "innovation_records.search_vector"
      via: "trg_tags_update_fts trigger → refresh_record_search_vector_from_tags()"
      pattern: "trg_tags_update_fts"
    - from: "innovation_records"
      to: "search_vector (GIN index)"
      via: "trg_innovation_record_fts trigger → update_innovation_record_search_vector()"
      pattern: "trg_innovation_record_fts"

integration_contracts:
  requires: []
  provides:
    - artifact: "db/migrations/001_core_content_tables.sql"
      exports:
        - "TABLE: innovation_records (record_id UUID PK, title, problem_statement, what_was_explored, outcome_summary, reuse_guidance, short_summary, maturity_level CHECK IN ('IDEA','EXPERIMENT_POC','PROTOTYPE_PILOT','PRODUCTION_VALIDATED','ARCHIVED'), review_status CHECK IN ('SUBMITTED','CURATED','TECHNICALLY_REVIEWED','SECURITY_REVIEWED','POLICY_REVIEWED','VALIDATED_FOR_REUSE','SUPERSEDED_RETIRED'), reuse_potential CHECK IN ('HIGH','MEDIUM','LOW'), source_type CHECK IN ('I_AND_R','COMMUNITY'), owner_name, owner_office, contributing_office, contributor_attribution, executive_perspective_text, executive_recommendation, technical_perspective_text, security_findings, performance_findings, default_perspective CHECK IN ('EXECUTIVE','TECHNICAL'), publication_state CHECK IN ('DRAFT','REVIEW','PUBLISHED','SUPERSEDED','ARCHIVED') DEFAULT 'DRAFT', last_reviewed_date DATE, published_at TIMESTAMPTZ, superseded_by_record_id UUID FK self-ref, search_vector TSVECTOR, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_by_user_id UUID FK users, updated_by_user_id UUID FK users, deleted_at TIMESTAMPTZ)"
        - "TABLE: record_key_findings (finding_id UUID PK, record_id UUID FK innovation_records ON DELETE CASCADE, finding_text TEXT CHECK LENGTH 10-1000, display_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ)"
        - "TABLE: record_artifact_links (link_id UUID PK, record_id UUID FK innovation_records ON DELETE CASCADE, label VARCHAR(200) CHECK LENGTH >= 2, url TEXT CHECK url LIKE 'https://%', artifact_type CHECK IN ('DOCUMENT','CODE_REPOSITORY','VIDEO','DIAGRAM','OTHER'), display_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ)"
        - "TABLE: record_tags (tag_id UUID PK, record_id UUID FK innovation_records ON DELETE CASCADE, tag_type CHECK IN ('MISSION_AREA','TECHNOLOGY_AREA'), tag_value VARCHAR(100) CHECK LENGTH >= 1, display_order INTEGER DEFAULT 0)"
        - "TABLE: record_engagement_options (option_id UUID PK, record_id UUID FK innovation_records ON DELETE CASCADE, option_type CHECK IN ('REQUEST_DEMO','REQUEST_ADOPTION_DISCUSSION','REQUEST_TECHNICAL_GUIDANCE','REQUEST_BRIEFING','SUBMIT_RELATED_PROBLEM'), display_order INTEGER DEFAULT 0, UNIQUE(record_id, option_type))"
        - "TABLE: audit_log (audit_id UUID PK, record_id UUID FK innovation_records, changed_by_user_id UUID FK users, changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), event_type CHECK IN ('FIELD_EDIT','STATE_TRANSITION','RECORD_CREATED','RECORD_DELETED'), field_changed VARCHAR(100), old_value TEXT, new_value TEXT, state_transition VARCHAR(50))"
        - "INDEX: idx_innovation_records_fts ON innovation_records USING GIN(search_vector)"
        - "INDEX: idx_innovation_records_publication_state ON innovation_records(publication_state) WHERE deleted_at IS NULL"
        - "INDEX: idx_innovation_records_maturity ON innovation_records(maturity_level) WHERE deleted_at IS NULL"
        - "INDEX: idx_innovation_records_review_status ON innovation_records(review_status) WHERE deleted_at IS NULL"
        - "INDEX: idx_innovation_records_published_at ON innovation_records(published_at DESC) WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL"
        - "INDEX: idx_innovation_records_source_type ON innovation_records(source_type) WHERE deleted_at IS NULL"
        - "INDEX: idx_innovation_records_reuse_potential ON innovation_records(reuse_potential) WHERE deleted_at IS NULL"
        - "INDEX: idx_record_key_findings_record ON record_key_findings(record_id, display_order)"
        - "INDEX: idx_record_artifact_links_record ON record_artifact_links(record_id, display_order)"
        - "INDEX: idx_record_tags_record ON record_tags(record_id, tag_type)"
        - "INDEX: idx_record_tags_value ON record_tags(tag_type, tag_value)"
        - "INDEX: idx_record_engagement_options_record ON record_engagement_options(record_id, display_order)"
        - "INDEX: idx_audit_log_record ON audit_log(record_id, changed_at DESC)"
        - "INDEX: idx_audit_log_user ON audit_log(changed_by_user_id, changed_at DESC)"
        - "INDEX: idx_audit_log_event_type ON audit_log(event_type, changed_at DESC)"
        - "TRIGGER: trg_innovation_record_fts BEFORE INSERT OR UPDATE ON innovation_records"
        - "TRIGGER: trg_findings_update_fts AFTER INSERT OR UPDATE OR DELETE ON record_key_findings"
        - "TRIGGER: trg_tags_update_fts AFTER INSERT OR UPDATE OR DELETE ON record_tags"
      shape: |
        innovation_records is the primary FTS target. search_vector is a TSVECTOR maintained by
        trg_innovation_record_fts (A: problem_statement; B: outcome_summary, what_was_explored, title;
        C: reuse_guidance, short_summary, executive_perspective_text, technical_perspective_text) plus
        trg_findings_update_fts (A weight, key_findings aggregate) and trg_tags_update_fts (C weight, tag values).
        Wave 2/3 backend must pass users.user_id as created_by_user_id / updated_by_user_id on INSERT/UPDATE.
        audit_log requires users.user_id as changed_by_user_id — users table created in Plan 02 (Wave 1b);
        FK constraint is deferred here using DEFERRABLE INITIALLY DEFERRED or added as ALTER TABLE in Plan 02.
        Wave 2 SearchService query pattern: WHERE search_vector @@ plainto_tsquery('english', $1) AND publication_state = 'PUBLISHED' AND deleted_at IS NULL.
      verify: "psql $DATABASE_URL -c \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('innovation_records','record_key_findings','record_artifact_links','record_tags','record_engagement_options','audit_log');\" | grep innovation_records && echo CONTRACT_OK"
---

<objective>
Create the full DDL for the TSIO Innovation Hub's core content database tables: **innovation_records** and its four child tables (**record_key_findings**, **record_artifact_links**, **record_tags**, **record_engagement_options**), plus **audit_log** — along with all GIN/FTS indexes, partial indexes, and the three FTS update triggers that keep `search_vector` synchronized.

Purpose: Every Wave 2 and Wave 3 backend service depends on these tables being fully specified with exact column names, types, CHECK constraints, indexes, and triggers exactly as defined in TechArch §3.2. No approximations — copy verbatim from spec.

Output:
- `db/migrations/001_core_content_tables.sql` — complete, runnable DDL (PostgreSQL 14+)
- `db/migrations/001_core_content_tables_verify.sql` — verification queries confirming all objects exist
</objective>

<feature_dependencies>
Implements: F0: Innovation Catalog (innovation_records + indexes for catalog queries), F1: Search and Discovery (search_vector GIN index + FTS triggers), F2: Innovation Record (all 6 record tables + audit_log), F3: Executive and Technical Perspectives (perspective columns on innovation_records), F4: Existing Lessons-Learned Integration (record_artifact_links with HTTPS constraint), F9: Content Maturity and Trust Model (maturity_level, review_status, publication_state CHECK constraints)
Depends on: None (Wave 1 — no prior wave)
Enables: F0, F1, F2, F3, F4, F9 backend services (Wave 2) and F5, F6, F7, F8 supporting tables (Wave 1b Plan 02 which adds users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
@project_specs/PRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create core content tables DDL migration (innovation_records + child tables + audit_log + all indexes + FTS triggers)</name>
  <files>db/migrations/001_core_content_tables.sql</files>
  <action>
Create the directory `db/migrations/` and write `001_core_content_tables.sql` with the following DDL copied **verbatim** from TechArch §3.2. Do NOT reinterpret, abbreviate, or rename any column, constraint, or index.

**IMPORTANT NOTE ON FK DEPENDENCY:** `innovation_records` has FK columns `created_by_user_id` and `updated_by_user_id` that reference `users(user_id)`, and `audit_log` has FK to `users`. The `users` table is created in Plan 02 (Wave 1b). To allow this migration to run first, add `DEFERRABLE INITIALLY DEFERRED` to those FK constraints, OR define `created_by_user_id UUID NOT NULL` and `updated_by_user_id UUID NOT NULL` without the REFERENCES clause for now, with a comment `-- FK to users added in 002_supporting_tables.sql`. Use the `DEFERRABLE INITIALLY DEFERRED` approach as it is cleaner. Alternatively, just omit the REFERENCES for these two FK columns and add them in migration 002.

Use the **omit-and-add-later** approach: define `created_by_user_id UUID NOT NULL` and `updated_by_user_id UUID NOT NULL` (and `changed_by_user_id UUID NOT NULL` in audit_log) WITHOUT the `REFERENCES users(user_id)` clause. Add a comment `-- FK to users(user_id) added by 002_supporting_tables.sql`. This allows 001 to run before 002 without FK violations. The `superseded_by_record_id` self-reference is fine since innovation_records is created in this same migration.

Write the file with exactly this content:

```sql
-- =============================================================================
-- Migration 001: Core Content Tables
-- TSIO Innovation Hub
-- Target: PostgreSQL 14+
-- Generated from TechArch-TSIO-Innovation-Hub.md §3.2
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: innovation_records
-- Primary content entity. One row per Innovation Record.
-- search_vector maintained by triggers (trg_innovation_record_fts,
-- trg_findings_update_fts, trg_tags_update_fts).
-- FK to users(user_id) for created_by/updated_by added in 002_supporting_tables.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_records (
    record_id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core content fields
    title                       VARCHAR(200)    NOT NULL
                                    CHECK (LENGTH(title) >= 5),
    problem_statement           TEXT            NOT NULL
                                    CHECK (LENGTH(problem_statement) >= 50),
    what_was_explored           TEXT            NOT NULL
                                    CHECK (LENGTH(what_was_explored) >= 50),
    outcome_summary             TEXT            NOT NULL
                                    CHECK (LENGTH(outcome_summary) >= 50),
    reuse_guidance              TEXT,
    short_summary               VARCHAR(280),

    -- Maturity & trust model
    maturity_level              VARCHAR(30)     NOT NULL
                                    CHECK (maturity_level IN (
                                        'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT',
                                        'PRODUCTION_VALIDATED', 'ARCHIVED'
                                    )),
    review_status               VARCHAR(30)     NOT NULL
                                    CHECK (review_status IN (
                                        'SUBMITTED', 'CURATED', 'TECHNICALLY_REVIEWED',
                                        'SECURITY_REVIEWED', 'POLICY_REVIEWED',
                                        'VALIDATED_FOR_REUSE', 'SUPERSEDED_RETIRED'
                                    )),
    reuse_potential             VARCHAR(10)     NOT NULL
                                    CHECK (reuse_potential IN ('HIGH', 'MEDIUM', 'LOW')),
    source_type                 VARCHAR(20)     NOT NULL
                                    CHECK (source_type IN ('I_AND_R', 'COMMUNITY')),

    -- Ownership & attribution
    owner_name                  VARCHAR(200)    NOT NULL,
    owner_office                VARCHAR(200)    NOT NULL,
    contributing_office         VARCHAR(200)    NOT NULL,
    contributor_attribution     TEXT,

    -- Perspective content
    executive_perspective_text  TEXT,
    executive_recommendation    TEXT,
    technical_perspective_text  TEXT,
    security_findings           TEXT,
    performance_findings        TEXT,
    default_perspective         VARCHAR(10)     NOT NULL DEFAULT 'EXECUTIVE'
                                    CHECK (default_perspective IN ('EXECUTIVE', 'TECHNICAL')),

    -- Publication lifecycle
    publication_state           VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                                    CHECK (publication_state IN (
                                        'DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'
                                    )),
    last_reviewed_date          DATE,
    published_at                TIMESTAMPTZ,
    superseded_by_record_id     UUID            REFERENCES innovation_records(record_id),

    -- Full-text search vector (PostgreSQL FTS)
    -- Weighted: A = problem_statement + key_findings (high), B = title + what_was_explored + outcome_summary (medium), C = others (standard)
    -- Updated via trigger on INSERT/UPDATE
    search_vector               TSVECTOR,

    -- Audit / system
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by_user_id          UUID            NOT NULL,  -- FK to users(user_id) added in 002_supporting_tables.sql
    updated_by_user_id          UUID            NOT NULL,  -- FK to users(user_id) added in 002_supporting_tables.sql
    deleted_at                  TIMESTAMPTZ                -- soft-delete: NULL = not deleted
);

-- Publication lifecycle indexes
CREATE INDEX IF NOT EXISTS idx_innovation_records_publication_state
    ON innovation_records(publication_state)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_innovation_records_maturity
    ON innovation_records(maturity_level)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_innovation_records_review_status
    ON innovation_records(review_status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_innovation_records_published_at
    ON innovation_records(published_at DESC)
    WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_innovation_records_source_type
    ON innovation_records(source_type)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_innovation_records_reuse_potential
    ON innovation_records(reuse_potential)
    WHERE deleted_at IS NULL;

-- Full-text search GIN index
CREATE INDEX IF NOT EXISTS idx_innovation_records_fts
    ON innovation_records USING GIN(search_vector);

-- FTS update trigger function
CREATE OR REPLACE FUNCTION update_innovation_record_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.problem_statement, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.outcome_summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.what_was_explored, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.reuse_guidance, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_summary, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.executive_perspective_text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.technical_perspective_text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_innovation_record_fts ON innovation_records;
CREATE TRIGGER trg_innovation_record_fts
    BEFORE INSERT OR UPDATE ON innovation_records
    FOR EACH ROW EXECUTE FUNCTION update_innovation_record_search_vector();

-- NOTE: key_findings text is appended to search_vector via a separate trigger
-- that fires after record_key_findings INSERT/UPDATE/DELETE (see below).

-- -----------------------------------------------------------------------------
-- TABLE: record_key_findings
-- Structured key findings array. Min 1 for publication. Weight A in FTS.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_key_findings (
    finding_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    finding_text    TEXT        NOT NULL
                        CHECK (LENGTH(finding_text) >= 10 AND LENGTH(finding_text) <= 1000),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_record_key_findings_record
    ON record_key_findings(record_id, display_order);

-- Trigger to keep parent record search_vector in sync with key findings changes
CREATE OR REPLACE FUNCTION refresh_record_search_vector_from_findings()
RETURNS TRIGGER AS $$
DECLARE
    target_record_id UUID;
    findings_text TEXT;
BEGIN
    target_record_id := COALESCE(NEW.record_id, OLD.record_id);
    SELECT string_agg(finding_text, ' ')
      INTO findings_text
      FROM record_key_findings
     WHERE record_id = target_record_id;

    UPDATE innovation_records
       SET search_vector = search_vector ||
           setweight(to_tsvector('english', COALESCE(findings_text, '')), 'A'),
           updated_at = NOW()
     WHERE record_id = target_record_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_findings_update_fts ON record_key_findings;
CREATE TRIGGER trg_findings_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_key_findings
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_findings();

-- -----------------------------------------------------------------------------
-- TABLE: record_artifact_links
-- External URL links. Hub stores URL + label only — never copies or caches.
-- At least 1 required for publication.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_artifact_links (
    link_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL CHECK (LENGTH(label) >= 2),
    url             TEXT        NOT NULL CHECK (url LIKE 'https://%'),
    artifact_type   VARCHAR(20) NOT NULL
                        CHECK (artifact_type IN (
                            'DOCUMENT', 'CODE_REPOSITORY', 'VIDEO', 'DIAGRAM', 'OTHER'
                        )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_record_artifact_links_record
    ON record_artifact_links(record_id, display_order);

-- -----------------------------------------------------------------------------
-- TABLE: record_tags
-- Mission area and technology area tags. Multi-value per record per tag type.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_tags (
    tag_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    tag_type        VARCHAR(20) NOT NULL
                        CHECK (tag_type IN ('MISSION_AREA', 'TECHNOLOGY_AREA')),
    tag_value       VARCHAR(100) NOT NULL CHECK (LENGTH(tag_value) >= 1),
    display_order   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_record_tags_record
    ON record_tags(record_id, tag_type);

CREATE INDEX IF NOT EXISTS idx_record_tags_value
    ON record_tags(tag_type, tag_value);

-- Trigger to append tag values to record search_vector
CREATE OR REPLACE FUNCTION refresh_record_search_vector_from_tags()
RETURNS TRIGGER AS $$
DECLARE
    target_record_id UUID;
    tags_text TEXT;
BEGIN
    target_record_id := COALESCE(NEW.record_id, OLD.record_id);
    SELECT string_agg(tag_value, ' ')
      INTO tags_text
      FROM record_tags
     WHERE record_id = target_record_id;

    UPDATE innovation_records
       SET search_vector = search_vector ||
           setweight(to_tsvector('english', COALESCE(tags_text, '')), 'C'),
           updated_at = NOW()
     WHERE record_id = target_record_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tags_update_fts ON record_tags;
CREATE TRIGGER trg_tags_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_tags
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_tags();

-- -----------------------------------------------------------------------------
-- TABLE: record_engagement_options
-- Engagement options configured per record. 1–4 options.
-- UNIQUE constraint prevents duplicate option types per record.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_engagement_options (
    option_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    option_type     VARCHAR(40) NOT NULL
                        CHECK (option_type IN (
                            'REQUEST_DEMO',
                            'REQUEST_ADOPTION_DISCUSSION',
                            'REQUEST_TECHNICAL_GUIDANCE',
                            'REQUEST_BRIEFING',
                            'SUBMIT_RELATED_PROBLEM'
                        )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    UNIQUE (record_id, option_type)
);

CREATE INDEX IF NOT EXISTS idx_record_engagement_options_record
    ON record_engagement_options(record_id, display_order);

-- -----------------------------------------------------------------------------
-- TABLE: audit_log
-- Append-only log of material changes to Innovation Records.
-- Application database user has INSERT + SELECT only (no UPDATE/DELETE grants).
-- FK to users(user_id) added in 002_supporting_tables.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID        NOT NULL
                            REFERENCES innovation_records(record_id),
    changed_by_user_id  UUID        NOT NULL,  -- FK to users(user_id) added in 002_supporting_tables.sql
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type          VARCHAR(40) NOT NULL
                            CHECK (event_type IN (
                                'FIELD_EDIT',
                                'STATE_TRANSITION',
                                'RECORD_CREATED',
                                'RECORD_DELETED'
                            )),
    field_changed       VARCHAR(100),   -- NULL for non-field events (e.g. state transition)
    old_value           TEXT,
    new_value           TEXT,
    state_transition    VARCHAR(50)     -- e.g. 'DRAFT->REVIEW', 'REVIEW->PUBLISHED'
);

CREATE INDEX IF NOT EXISTS idx_audit_log_record
    ON audit_log(record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user
    ON audit_log(changed_by_user_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type
    ON audit_log(event_type, changed_at DESC);

-- =============================================================================
-- End of 001_core_content_tables.sql
-- =============================================================================
```
  </action>
  <verify>
Check the file was written with correct content:

```bash
ls -la db/migrations/001_core_content_tables.sql && \
grep -c "CREATE TABLE IF NOT EXISTS" db/migrations/001_core_content_tables.sql && \
grep "trg_innovation_record_fts" db/migrations/001_core_content_tables.sql && \
grep "trg_findings_update_fts" db/migrations/001_core_content_tables.sql && \
grep "trg_tags_update_fts" db/migrations/001_core_content_tables.sql && \
grep "idx_innovation_records_fts" db/migrations/001_core_content_tables.sql && \
grep "USING GIN" db/migrations/001_core_content_tables.sql && \
echo "TASK1_FILE_OK"
```

Expected: file exists, 6 CREATE TABLE IF NOT EXISTS statements (innovation_records + 4 child tables + audit_log), all 3 trigger names present, GIN index present.
  </verify>
  <done>
- `db/migrations/001_core_content_tables.sql` exists
- Contains 6 table definitions (innovation_records, record_key_findings, record_artifact_links, record_tags, record_engagement_options, audit_log)
- maturity_level CHECK IN ('IDEA','EXPERIMENT_POC','PROTOTYPE_PILOT','PRODUCTION_VALIDATED','ARCHIVED')
- review_status CHECK IN ('SUBMITTED','CURATED','TECHNICALLY_REVIEWED','SECURITY_REVIEWED','POLICY_REVIEWED','VALIDATED_FOR_REUSE','SUPERSEDED_RETIRED')
- publication_state CHECK IN ('DRAFT','REVIEW','PUBLISHED','SUPERSEDED','ARCHIVED') DEFAULT 'DRAFT'
- reuse_potential CHECK IN ('HIGH','MEDIUM','LOW')
- source_type CHECK IN ('I_AND_R','COMMUNITY')
- default_perspective CHECK IN ('EXECUTIVE','TECHNICAL') DEFAULT 'EXECUTIVE'
- artifact_type CHECK IN ('DOCUMENT','CODE_REPOSITORY','VIDEO','DIAGRAM','OTHER')
- option_type CHECK IN ('REQUEST_DEMO','REQUEST_ADOPTION_DISCUSSION','REQUEST_TECHNICAL_GUIDANCE','REQUEST_BRIEFING','SUBMIT_RELATED_PROBLEM')
- event_type CHECK IN ('FIELD_EDIT','STATE_TRANSITION','RECORD_CREATED','RECORD_DELETED')
- GIN index idx_innovation_records_fts on search_vector
- All 6 partial indexes on innovation_records (publication_state, maturity, review_status, published_at, source_type, reuse_potential)
- Trigger trg_innovation_record_fts BEFORE INSERT OR UPDATE on innovation_records with A/B/C weighted fields
- Trigger trg_findings_update_fts AFTER INSERT OR UPDATE OR DELETE on record_key_findings (weight A)
- Trigger trg_tags_update_fts AFTER INSERT OR UPDATE OR DELETE on record_tags (weight C)
- FK to users deferred to migration 002 (no REFERENCES users clause; comments explain)
- All DDL uses CREATE TABLE IF NOT EXISTS and CREATE OR REPLACE FUNCTION for idempotency; triggers use DROP TRIGGER IF EXISTS before CREATE
  </done>
</task>

<task type="auto">
  <name>Task 2: Create migration verification script</name>
  <files>db/migrations/001_core_content_tables_verify.sql</files>
  <action>
Write `db/migrations/001_core_content_tables_verify.sql` — a SQL script that verifies all objects created by migration 001 exist in the database. This script is used by Wave 2/3 backend planners to confirm the schema is in place before building services.

Write the file with exactly this content:

```sql
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
```
  </action>
  <verify>
Check the verification script file exists and contains key query patterns:

```bash
ls -la db/migrations/001_core_content_tables_verify.sql && \
grep -c "SELECT" db/migrations/001_core_content_tables_verify.sql && \
grep "trg_innovation_record_fts" db/migrations/001_core_content_tables_verify.sql && \
grep "idx_innovation_records_fts" db/migrations/001_core_content_tables_verify.sql && \
grep "update_innovation_record_search_vector" db/migrations/001_core_content_tables_verify.sql && \
echo "TASK2_FILE_OK"
```

Expected: file exists, multiple SELECT queries, all 3 trigger names referenced, GIN index name present, trigger function names present.
  </verify>
  <done>
- `db/migrations/001_core_content_tables_verify.sql` exists
- Contains 8 verification queries covering: table existence (6 tables), innovation_records columns (29 expected), CHECK constraints, all indexes (14 expected), trigger existence (3 triggers), GIN index confirmation, UNIQUE constraint on engagement_options, trigger function existence (3 functions)
- Wave 2/3 backend planners can run this script against a live PostgreSQL instance to confirm schema readiness before building services
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| migration-file→postgres | SQL DDL files cross from the repository into the PostgreSQL engine during migration execution |
| search_vector→FTS-index | User-supplied text in record content fields crosses into the tsvector GIN index via triggers |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | audit_log table — no UPDATE/DELETE grants at application layer | mitigate | Per TechArch §5.4: "The application database user has INSERT and SELECT privileges only — no UPDATE or DELETE." The DDL itself does not grant these, but the DB role setup in the app service layer (Wave 2/3) MUST NOT grant UPDATE/DELETE on audit_log. This is documented in the DDL comment: "Application database user has INSERT + SELECT only." Wave 2 AuditService task must enforce this at connection role creation. |
| T-01-02 | Information Disclosure | innovation_records — deleted_at soft-delete; non-deleted filtering | mitigate | All 6 partial indexes include `WHERE deleted_at IS NULL`. Wave 2 CatalogService and SearchService MUST include `AND deleted_at IS NULL` in all query predicates. The partial indexes make it a performance failure (full scan) if queries omit this — acting as an operational enforcement mechanism. |
| T-01-03 | Elevation of Privilege | innovation_records — publication_state CHECK constraint; PUBLIC users must only see PUBLISHED records | mitigate | CHECK constraint `publication_state IN ('DRAFT','REVIEW','PUBLISHED','SUPERSEDED','ARCHIVED')` is enforced at DB layer. The `idx_innovation_records_published_at` partial index condition `WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL` additionally signals the correct query predicate to Wave 2 CatalogService. Service-layer enforcement is required in Wave 2 (not DB-layer-only) per TechArch §5.6 rule 4. |
| T-01-04 | Tampering | record_artifact_links — url CHECK `url LIKE 'https://%'` prevents HTTP URLs | mitigate | CHECK constraint enforced at DB layer in `record_artifact_links.url`: `CHECK (url LIKE 'https://%')`. This prevents storage of HTTP (non-TLS) artifact URLs. Wave 2 RecordService should additionally validate URL format before persistence to provide human-readable errors (DB CHECK produces generic constraint violation). |
| T-01-05 | Tampering | search_vector via FTS triggers — trigger functions use COALESCE + parameterized to_tsvector; no raw SQL interpolation | mitigate | All three trigger functions (`update_innovation_record_search_vector`, `refresh_record_search_vector_from_findings`, `refresh_record_search_vector_from_tags`) use `to_tsvector('english', COALESCE(field, ''))` with no string interpolation. tsvector construction is parameterized through PL/pgSQL variable binding, not dynamic SQL. No injection surface exists in the trigger body. |
| T-01-06 | Repudiation | audit_log — changed_by_user_id stored per row for non-repudiation | mitigate | `changed_by_user_id UUID NOT NULL` on every audit_log row ensures every material change is attributed to a specific user identity. The FK to users(user_id) is added in migration 002. Wave 2 AuditService must pass the authenticated curator's user_id (from session, not from request body) as changed_by_user_id — never trust a client-supplied actor ID. |
</threat_model>

<verification>
After both tasks complete:

1. Confirm migration file exists and has correct table count:
   ```bash
   grep -c "CREATE TABLE IF NOT EXISTS" db/migrations/001_core_content_tables.sql
   ```
   Expected: 6

2. Confirm all three trigger names present:
   ```bash
   grep -c "trg_innovation_record_fts\|trg_findings_update_fts\|trg_tags_update_fts" db/migrations/001_core_content_tables.sql
   ```
   Expected: at least 6 (2 per trigger — DROP IF EXISTS + CREATE)

3. Confirm GIN index present:
   ```bash
   grep "USING GIN(search_vector)" db/migrations/001_core_content_tables.sql
   ```
   Expected: 1 match

4. Confirm partial indexes exist:
   ```bash
   grep -c "WHERE deleted_at IS NULL" db/migrations/001_core_content_tables.sql
   ```
   Expected: 5 (publication_state, maturity, review_status, source_type, reuse_potential indexes)

5. Confirm FK deferral comment pattern:
   ```bash
   grep "FK to users" db/migrations/001_core_content_tables.sql
   ```
   Expected: 3 matches (created_by_user_id, updated_by_user_id, changed_by_user_id)

6. Confirm verify script exists:
   ```bash
   ls db/migrations/001_core_content_tables_verify.sql && echo VERIFY_SCRIPT_OK
   ```
</verification>

<success_criteria>
- `db/migrations/001_core_content_tables.sql` exists with 6 tables, all CHECK constraints verbatim from TechArch §3.2, 7 partial + GIN indexes, 3 FTS trigger functions (CREATE OR REPLACE), 3 triggers (DROP IF EXISTS + CREATE for idempotency)
- `db/migrations/001_core_content_tables_verify.sql` exists with 8 verification queries covering tables, columns, constraints, indexes, triggers, and trigger functions
- All enum values match TechArch §3.2 exactly (no abbreviations or reordering)
- FK references to users table are deferred to migration 002 with explanatory comments
- No references to users table column other than as UUID NOT NULL (no REFERENCES clause in this migration)
- Wave 2 backend planners can consume: table names, column names, CHECK constraint values, index names, trigger names — all copied verbatim for use in ORM/query builder configuration
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/01-SUMMARY.md` with:
- Tasks completed
- Files created
- Key DDL decisions (FK deferral approach, idempotency strategy)
- Integration contract summary for Wave 2/3 consumption
</output>
