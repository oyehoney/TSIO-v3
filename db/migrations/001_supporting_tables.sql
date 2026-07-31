-- ============================================================
-- TSIO Innovation Hub — Supporting Tables Migration
-- Migration: 001_supporting_tables.sql
-- Runs AFTER 001_core_content_tables.sql (alphabetical: 's' > 'c')
-- Adds users table + supporting tables + FK constraints back to
-- innovation_records and audit_log (which deferred these to this file)
-- ============================================================

-- ============================================================
-- 1. users table (must be created first — FK target for all other tables)
-- ============================================================

CREATE TABLE users (
    user_id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    display_name    VARCHAR(200)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'CURATOR'
                        CHECK (role IN ('CURATOR', 'ADMIN')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    idp_subject     VARCHAR(500)    UNIQUE      -- Azure AD Object ID (OID) or equivalent
);

CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_idp_subject  ON users(idp_subject);

-- ============================================================
-- 2. hub_settings table (FK to users)
-- ============================================================

CREATE TABLE hub_settings (
    setting_key         VARCHAR(100)    PRIMARY KEY,
    setting_value       TEXT            NOT NULL,
    description         TEXT,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by_user_id  UUID            REFERENCES users(user_id)
);

-- Required seed data — insert on initial migration
INSERT INTO hub_settings (setting_key, setting_value, description) VALUES
    (
        'engagement_routing_email',
        'AOml_TSO_IRB_Team@ao.uscourts.gov',
        'Email address for all engagement request and submission routing notifications. Changeable without code deployment.'
    ),
    (
        'contact_display_email',
        'AOml_TSO_IRB_Team@ao.uscourts.gov',
        'Public-facing contact email displayed on the Hub for general inquiries.'
    ),
    (
        'catalog_default_page_size',
        '12',
        'Default number of cards per catalog page (integer 6–50).'
    ),
    (
        'default_perspective',
        'EXECUTIVE',
        'System-wide fallback default perspective when not set per record (EXECUTIVE or TECHNICAL).'
    );

-- ============================================================
-- 3. opportunity_submissions table (FK to users + innovation_records)
-- ============================================================

CREATE TABLE opportunity_submissions (
    submission_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_description     TEXT        NOT NULL
                                CHECK (LENGTH(problem_description) >= 50),
    mission_area            VARCHAR(200) NOT NULL,
    submitting_office       VARCHAR(200) NOT NULL,
    submitter_name          VARCHAR(200) NOT NULL,
    submitter_email         VARCHAR(255) NOT NULL,
    submitter_title         VARCHAR(200),
    urgency_context         TEXT,
    known_constraints       TEXT,
    status                  VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED'
                                CHECK (status IN (
                                    'SUBMITTED',
                                    'UNDER_REVIEW',
                                    'ACCEPTED_FOR_CONSIDERATION',
                                    'DECLINED',
                                    'LINKED_TO_RECORD'
                                )),
    disposition             VARCHAR(40),    -- matches status enum; set by curator action
    linked_record_id        UUID            REFERENCES innovation_records(record_id),
    internal_note           TEXT,
    submitted_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_at             TIMESTAMPTZ,
    reviewed_by_user_id     UUID            REFERENCES users(user_id)
);

CREATE INDEX idx_opportunity_submissions_status
    ON opportunity_submissions(status, submitted_at DESC);

CREATE INDEX idx_opportunity_submissions_submitted_at
    ON opportunity_submissions(submitted_at DESC);

-- ============================================================
-- 4. contribution_submissions table (FK to users + innovation_records)
-- ============================================================

CREATE TABLE contribution_submissions (
    submission_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    work_description        TEXT        NOT NULL
                                CHECK (LENGTH(work_description) >= 50),
    problem_addressed       TEXT        NOT NULL
                                CHECK (LENGTH(problem_addressed) >= 50),
    outcome_summary         TEXT        NOT NULL
                                CHECK (LENGTH(outcome_summary) >= 50),
    self_assessed_maturity  VARCHAR(30) NOT NULL
                                CHECK (self_assessed_maturity IN (
                                    'IDEA', 'EXPERIMENT_POC',
                                    'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'
                                )),
    artifact_urls           TEXT[]      NOT NULL,   -- Array of HTTPS URL strings; min 1 item
    contributing_team       VARCHAR(200) NOT NULL,
    contributing_office     VARCHAR(200) NOT NULL,
    contact_name            VARCHAR(200) NOT NULL,
    contact_email           VARCHAR(255) NOT NULL,
    contact_title           VARCHAR(200),
    additional_context      TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
                                CHECK (status IN (
                                    'SUBMITTED',
                                    'UNDER_REVIEW',
                                    'ACCEPTED_FOR_CURATION',
                                    'DECLINED',
                                    'PUBLISHED'
                                )),
    internal_note           TEXT,
    linked_record_id        UUID        REFERENCES innovation_records(record_id),
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at             TIMESTAMPTZ,
    reviewed_by_user_id     UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_contribution_submissions_status
    ON contribution_submissions(status, submitted_at DESC);

CREATE INDEX idx_contribution_submissions_submitted_at
    ON contribution_submissions(submitted_at DESC);

-- ============================================================
-- 5. engagement_requests table (FK to users + innovation_records)
-- ============================================================

CREATE TABLE engagement_requests (
    request_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id               UUID        NOT NULL
                                REFERENCES innovation_records(record_id),
    request_type            VARCHAR(40) NOT NULL
                                CHECK (request_type IN (
                                    'REQUEST_DEMO',
                                    'REQUEST_ADOPTION_DISCUSSION',
                                    'REQUEST_TECHNICAL_GUIDANCE',
                                    'REQUEST_BRIEFING',
                                    'SUBMIT_RELATED_PROBLEM'
                                )),
    requestor_name          VARCHAR(200) NOT NULL,
    requestor_email         VARCHAR(255) NOT NULL,
    requestor_office        VARCHAR(200) NOT NULL,
    requestor_title         VARCHAR(200),
    description_of_interest TEXT        NOT NULL
                                CHECK (LENGTH(description_of_interest) >= 20),
    desired_next_step       TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
                                CHECK (status IN (
                                    'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'
                                )),
    curator_note            TEXT,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id      UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_engagement_requests_record
    ON engagement_requests(record_id, submitted_at DESC);

CREATE INDEX idx_engagement_requests_status
    ON engagement_requests(status, submitted_at DESC);

CREATE INDEX idx_engagement_requests_submitted_at
    ON engagement_requests(submitted_at DESC);

CREATE INDEX idx_engagement_requests_type
    ON engagement_requests(request_type, submitted_at DESC);

-- ============================================================
-- 6. Deferred FK constraints: wire innovation_records and audit_log
--    to users(user_id). These columns exist as plain UUID NOT NULL
--    in 001_core_content_tables.sql; FKs are added here after users
--    table exists (per 001_core_content_tables.sql comments).
-- ============================================================

ALTER TABLE innovation_records
    ADD CONSTRAINT fk_innovation_records_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users(user_id);

ALTER TABLE innovation_records
    ADD CONSTRAINT fk_innovation_records_updated_by
        FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id);

ALTER TABLE audit_log
    ADD CONSTRAINT fk_audit_log_changed_by
        FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id);
