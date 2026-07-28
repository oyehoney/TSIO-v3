---

## Y0: Database Schema — Full DDL

This document contains the complete database schema for the TSIO Innovation Hub MVP. All tables use UUID primary keys. Timestamps are stored as UTC. Enum types are defined as `VARCHAR` with `CHECK` constraints (or as native `ENUM` type depending on the database engine selected during implementation).

> **Note:** The specific database engine (PostgreSQL, SQLite, SQL Server, etc.) is TBD pending the hosting decision. This DDL is written in standard ANSI SQL with PostgreSQL-compatible syntax. Adjust enum handling and UUID generation for the selected engine.

---

### §innovation_records

The primary data entity. One row per Innovation Record.

```sql
CREATE TABLE innovation_records (
    record_id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core content fields
    title                   VARCHAR(200)    NOT NULL CHECK (LENGTH(title) >= 5),
    problem_statement       TEXT            NOT NULL CHECK (LENGTH(problem_statement) >= 50),
    what_was_explored       TEXT            NOT NULL CHECK (LENGTH(what_was_explored) >= 50),
    outcome_summary         TEXT            NOT NULL CHECK (LENGTH(outcome_summary) >= 50),
    reuse_guidance          TEXT,
    short_summary           VARCHAR(280),   -- auto-generated from outcome_summary or curator-authored
    
    -- Maturity & trust model
    maturity_level          VARCHAR(30)     NOT NULL CHECK (maturity_level IN (
                                'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT',
                                'PRODUCTION_VALIDATED', 'ARCHIVED'
                            )),
    review_status           VARCHAR(30)     NOT NULL CHECK (review_status IN (
                                'SUBMITTED', 'CURATED', 'TECHNICALLY_REVIEWED',
                                'SECURITY_REVIEWED', 'POLICY_REVIEWED',
                                'VALIDATED_FOR_REUSE', 'SUPERSEDED_RETIRED'
                            )),
    reuse_potential         VARCHAR(10)     NOT NULL CHECK (reuse_potential IN ('HIGH', 'MEDIUM', 'LOW')),
    source_type             VARCHAR(20)     NOT NULL CHECK (source_type IN ('I_AND_R', 'COMMUNITY')),
    
    -- Ownership & attribution
    owner_name              VARCHAR(200)    NOT NULL,
    owner_office            VARCHAR(200)    NOT NULL,
    contributing_office     VARCHAR(200)    NOT NULL,
    contributor_attribution TEXT,
    
    -- Perspective content
    executive_perspective_text  TEXT,
    executive_recommendation    TEXT,
    technical_perspective_text  TEXT,
    security_findings           TEXT,
    performance_findings        TEXT,
    default_perspective         VARCHAR(10) NOT NULL DEFAULT 'EXECUTIVE'
                                    CHECK (default_perspective IN ('EXECUTIVE', 'TECHNICAL')),
    
    -- Publication lifecycle
    publication_state       VARCHAR(20)     NOT NULL DEFAULT 'DRAFT' CHECK (publication_state IN (
                                'DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'
                            )),
    last_reviewed_date      DATE,
    published_at            TIMESTAMPTZ,
    superseded_by_record_id UUID            REFERENCES innovation_records(record_id),
    
    -- Audit / system
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by_user_id      UUID            NOT NULL REFERENCES users(user_id),
    updated_by_user_id      UUID            NOT NULL REFERENCES users(user_id),
    deleted_at              TIMESTAMPTZ     -- soft-delete; NULL = not deleted
);

CREATE INDEX idx_innovation_records_publication_state ON innovation_records(publication_state);
CREATE INDEX idx_innovation_records_maturity ON innovation_records(maturity_level);
CREATE INDEX idx_innovation_records_review_status ON innovation_records(review_status);
CREATE INDEX idx_innovation_records_published_at ON innovation_records(published_at DESC);
```

---

### §record_key_findings

Stores the structured key findings array for each Innovation Record.

```sql
CREATE TABLE record_key_findings (
    finding_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    finding_text    TEXT        NOT NULL CHECK (LENGTH(finding_text) >= 10 AND LENGTH(finding_text) <= 1000),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_key_findings_record ON record_key_findings(record_id, display_order);
```

---

### §record_artifact_links

Stores external artifact links associated with each Innovation Record.

```sql
CREATE TABLE record_artifact_links (
    link_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL CHECK (LENGTH(label) >= 2),
    url             TEXT        NOT NULL CHECK (url LIKE 'https://%'),
    artifact_type   VARCHAR(20) NOT NULL CHECK (artifact_type IN (
                        'DOCUMENT', 'CODE_REPOSITORY', 'VIDEO', 'DIAGRAM', 'OTHER'
                    )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_artifact_links_record ON record_artifact_links(record_id);
```

---

### §record_tags

Stores mission area and technology area tags for each Innovation Record.

```sql
CREATE TABLE record_tags (
    tag_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    tag_type        VARCHAR(20) NOT NULL CHECK (tag_type IN ('MISSION_AREA', 'TECHNOLOGY_AREA')),
    tag_value       VARCHAR(100) NOT NULL CHECK (LENGTH(tag_value) >= 1),
    display_order   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_record_tags_record ON record_tags(record_id, tag_type);
CREATE INDEX idx_record_tags_value ON record_tags(tag_type, tag_value);
```

---

### §record_engagement_options

Stores which engagement options are configured on each Innovation Record.

```sql
CREATE TABLE record_engagement_options (
    option_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    option_type     VARCHAR(40) NOT NULL CHECK (option_type IN (
                        'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION',
                        'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING',
                        'SUBMIT_RELATED_PROBLEM'
                    )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    UNIQUE (record_id, option_type)
);

CREATE INDEX idx_record_engagement_options_record ON record_engagement_options(record_id);
```

---

### §audit_log

Tracks all material changes to Innovation Records.

```sql
CREATE TABLE audit_log (
    audit_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID        NOT NULL REFERENCES innovation_records(record_id),
    changed_by_user_id  UUID        NOT NULL REFERENCES users(user_id),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    field_changed       VARCHAR(100),           -- NULL if event is a state transition only
    old_value           TEXT,
    new_value           TEXT,
    state_transition    VARCHAR(50),            -- e.g., 'DRAFT->REVIEW', 'REVIEW->PUBLISHED'
    event_type          VARCHAR(40) NOT NULL CHECK (event_type IN (
                            'FIELD_EDIT', 'STATE_TRANSITION', 'RECORD_CREATED', 'RECORD_DELETED'
                        ))
);

CREATE INDEX idx_audit_log_record ON audit_log(record_id, changed_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(changed_by_user_id);
```

---

### §users

Curator user accounts. Populated by identity provider integration (Azure AD or equivalent). One row per authenticated curator.

```sql
CREATE TABLE users (
    user_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'CURATOR' CHECK (role IN ('CURATOR', 'ADMIN')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idp_subject     VARCHAR(500) UNIQUE     -- Identity provider subject claim (e.g., Azure AD OID)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_idp_subject ON users(idp_subject);
```

---

### §opportunity_submissions

Stores stakeholder mission problem / opportunity submissions (F05).

```sql
CREATE TABLE opportunity_submissions (
    submission_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_description TEXT        NOT NULL CHECK (LENGTH(problem_description) >= 50),
    mission_area        VARCHAR(200) NOT NULL,
    submitting_office   VARCHAR(200) NOT NULL,
    submitter_name      VARCHAR(200) NOT NULL,
    submitter_email     VARCHAR(255) NOT NULL,
    submitter_title     VARCHAR(200),
    urgency_context     TEXT,
    known_constraints   TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                            'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED_FOR_CONSIDERATION',
                            'DECLINED', 'LINKED_TO_RECORD'
                        )),
    disposition         VARCHAR(30), -- same set as status; set when curator acts
    linked_record_id    UUID        REFERENCES innovation_records(record_id),
    internal_note       TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by_user_id UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_opportunity_submissions_status ON opportunity_submissions(status, submitted_at DESC);
```

---

### §contribution_submissions

Stores community innovation work contribution submissions (F06).

```sql
CREATE TABLE contribution_submissions (
    submission_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    work_description        TEXT        NOT NULL CHECK (LENGTH(work_description) >= 50),
    problem_addressed       TEXT        NOT NULL CHECK (LENGTH(problem_addressed) >= 50),
    outcome_summary         TEXT        NOT NULL CHECK (LENGTH(outcome_summary) >= 50),
    self_assessed_maturity  VARCHAR(30) NOT NULL CHECK (self_assessed_maturity IN (
                                'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'
                            )),
    artifact_urls           TEXT[]      NOT NULL,   -- Array of URL strings
    contributing_team       VARCHAR(200) NOT NULL,
    contributing_office     VARCHAR(200) NOT NULL,
    contact_name            VARCHAR(200) NOT NULL,
    contact_email           VARCHAR(255) NOT NULL,
    contact_title           VARCHAR(200),
    additional_context      TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                                'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED_FOR_CURATION',
                                'DECLINED', 'PUBLISHED'
                            )),
    internal_note           TEXT,
    linked_record_id        UUID        REFERENCES innovation_records(record_id),
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at             TIMESTAMPTZ,
    reviewed_by_user_id     UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_contribution_submissions_status ON contribution_submissions(status, submitted_at DESC);
```

---

### §engagement_requests

Stores all stakeholder engagement requests (F07).

```sql
CREATE TABLE engagement_requests (
    request_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id               UUID        NOT NULL REFERENCES innovation_records(record_id),
    request_type            VARCHAR(40) NOT NULL CHECK (request_type IN (
                                'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION',
                                'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING',
                                'SUBMIT_RELATED_PROBLEM'
                            )),
    requestor_name          VARCHAR(200) NOT NULL,
    requestor_email         VARCHAR(255) NOT NULL,
    requestor_office        VARCHAR(200) NOT NULL,
    requestor_title         VARCHAR(200),
    description_of_interest TEXT        NOT NULL CHECK (LENGTH(description_of_interest) >= 20),
    desired_next_step       TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                                'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'
                            )),
    curator_note            TEXT,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id      UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_engagement_requests_record ON engagement_requests(record_id, submitted_at DESC);
CREATE INDEX idx_engagement_requests_status ON engagement_requests(status);
CREATE INDEX idx_engagement_requests_submitted ON engagement_requests(submitted_at DESC);
```

---

### §hub_settings

Stores admin-configurable Hub settings (F07, F08).

```sql
CREATE TABLE hub_settings (
    setting_key     VARCHAR(100) PRIMARY KEY,
    setting_value   TEXT        NOT NULL,
    description     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID     REFERENCES users(user_id)
);

-- Seed data: required settings
INSERT INTO hub_settings (setting_key, setting_value, description) VALUES
    ('engagement_routing_email', 'AOml_TSO_IRB_Team@ao.uscourts.gov', 'Email address for all engagement request and submission routing notifications'),
    ('contact_display_email', 'AOml_TSO_IRB_Team@ao.uscourts.gov', 'Public-facing contact email displayed on the Hub'),
    ('catalog_default_page_size', '12', 'Default number of cards per catalog page'),
    ('default_perspective', 'EXECUTIVE', 'System-wide fallback default perspective (EXECUTIVE or TECHNICAL)');
```

---

*End of Y0-schema.md — continues in Y1-api.md*
