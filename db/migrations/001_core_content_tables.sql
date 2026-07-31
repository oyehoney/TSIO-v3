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
