---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      users                                  │
│  PK user_id (UUID)                                          │
│     email, display_name, role, is_active                    │
│     idp_subject, last_login_at, created_at                  │
└────────────────┬────────────────────────────────────────────┘
                 │ created_by / updated_by
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  innovation_records                         │
│  PK record_id (UUID)                                        │
│     Core: title, problem_statement, what_was_explored,      │
│           outcome_summary, reuse_guidance, short_summary    │
│     Trust: maturity_level, review_status, reuse_potential,  │
│            source_type                                      │
│     Attribution: owner_name, owner_office,                  │
│                  contributing_office, contributor_attribution│
│     Perspectives: executive_perspective_text,               │
│                   executive_recommendation,                 │
│                   technical_perspective_text,               │
│                   security_findings, performance_findings,  │
│                   default_perspective                       │
│     Lifecycle: publication_state, last_reviewed_date,       │
│                published_at, superseded_by_record_id (FK)   │
│     System: created_at, updated_at, deleted_at,             │
│             created_by_user_id (FK), updated_by_user_id (FK)│
└──────┬────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N                                                  │ 1:N
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│  record_key_findings    │               │   record_artifact_links       │
│  PK finding_id (UUID)   │               │   PK link_id (UUID)           │
│  FK record_id           │               │   FK record_id                │
│     finding_text        │               │      label, url,              │
│     display_order       │               │      artifact_type,           │
│     created_at          │               │      display_order, created_at│
└─────────────────────────┘               └───────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N                                                  │ 1:N
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│      record_tags        │               │ record_engagement_options     │
│  PK tag_id (UUID)       │               │  PK option_id (UUID)          │
│  FK record_id           │               │  FK record_id                 │
│     tag_type            │               │     option_type               │
│     tag_value           │               │     display_order             │
│     display_order       │               │  UNIQUE(record_id, option_type│
└─────────────────────────┘               └───────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N (record_id FK)                                   │ 1:N (record_id FK)
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│      audit_log          │               │   engagement_requests         │
│  PK audit_id (UUID)     │               │  PK request_id (UUID)         │
│  FK record_id           │               │  FK record_id                 │
│  FK changed_by_user_id  │               │     request_type              │
│     changed_at          │               │     requestor_name/email/     │
│     event_type          │               │     office/title              │
│     field_changed       │               │     description_of_interest   │
│     old_value/new_value │               │     desired_next_step         │
│     state_transition    │               │     status, curator_note      │
└─────────────────────────┘               │     submitted_at, updated_at  │
                                          │  FK updated_by_user_id        │
                                          └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               opportunity_submissions                       │
│  PK submission_id (UUID)                                    │
│     problem_description, mission_area, submitting_office    │
│     submitter_name, submitter_email, submitter_title        │
│     urgency_context, known_constraints                      │
│     status, disposition, internal_note                      │
│  FK linked_record_id (→ innovation_records)                 │
│     submitted_at, reviewed_at                               │
│  FK reviewed_by_user_id (→ users)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               contribution_submissions                      │
│  PK submission_id (UUID)                                    │
│     work_description, problem_addressed, outcome_summary    │
│     self_assessed_maturity, artifact_urls (TEXT[])          │
│     contributing_team, contributing_office                  │
│     contact_name, contact_email, contact_title              │
│     additional_context                                      │
│     status, internal_note                                   │
│  FK linked_record_id (→ innovation_records)                 │
│     submitted_at, reviewed_at                               │
│  FK reviewed_by_user_id (→ users)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     hub_settings                            │
│  PK setting_key (VARCHAR)                                   │
│     setting_value, description, updated_at                  │
│  FK updated_by_user_id (→ users)                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Full Database DDL

> **Target database:** PostgreSQL 14+. All UUIDs use `gen_random_uuid()`. Timestamps stored as `TIMESTAMPTZ` (UTC). Enum values enforced via `CHECK` constraints for portability; alternatively, use PostgreSQL native `CREATE TYPE ... AS ENUM` for stricter type safety. Adjust `TEXT[]` (array type) for non-PostgreSQL engines.

---

#### Table: users

Curator user accounts. One row per authenticated curator. Populated via OIDC identity provider on first login. `idp_subject` is the stable unique identifier from Azure AD (OID claim).

```sql
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
```

---

#### Table: innovation_records

The primary content entity. One row per Innovation Record. Full-text search index (`search_vector`) is maintained as a generated `tsvector` column (PostgreSQL 12+) or kept up-to-date via trigger.

```sql
CREATE TABLE innovation_records (
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
    created_by_user_id          UUID            NOT NULL REFERENCES users(user_id),
    updated_by_user_id          UUID            NOT NULL REFERENCES users(user_id),
    deleted_at                  TIMESTAMPTZ     -- soft-delete: NULL = not deleted
);

-- Publication lifecycle indexes
CREATE INDEX idx_innovation_records_publication_state
    ON innovation_records(publication_state)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_maturity
    ON innovation_records(maturity_level)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_review_status
    ON innovation_records(review_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_published_at
    ON innovation_records(published_at DESC)
    WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX idx_innovation_records_source_type
    ON innovation_records(source_type)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_reuse_potential
    ON innovation_records(reuse_potential)
    WHERE deleted_at IS NULL;

-- Full-text search GIN index
CREATE INDEX idx_innovation_records_fts
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

CREATE TRIGGER trg_innovation_record_fts
    BEFORE INSERT OR UPDATE ON innovation_records
    FOR EACH ROW EXECUTE FUNCTION update_innovation_record_search_vector();

-- NOTE: key_findings text is appended to search_vector via a separate trigger
-- that fires after record_key_findings INSERT/UPDATE/DELETE (see record_key_findings DDL).
```

---

#### Table: record_key_findings

Stores the structured key findings array for each Innovation Record. Minimum 1 item required for publication. Display order is curator-controlled.

```sql
CREATE TABLE record_key_findings (
    finding_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    finding_text    TEXT        NOT NULL
                        CHECK (LENGTH(finding_text) >= 10 AND LENGTH(finding_text) <= 1000),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_key_findings_record
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

CREATE TRIGGER trg_findings_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_key_findings
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_findings();
```

---

#### Table: record_artifact_links

Stores external artifact links. Hub stores URL and label only — no content is cached or proxied. At least one link required for publication.

```sql
CREATE TABLE record_artifact_links (
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

CREATE INDEX idx_record_artifact_links_record
    ON record_artifact_links(record_id, display_order);
```

---

#### Table: record_tags

Stores mission area and technology area tags. Multi-value per record per tag type.

```sql
CREATE TABLE record_tags (
    tag_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    tag_type        VARCHAR(20) NOT NULL
                        CHECK (tag_type IN ('MISSION_AREA', 'TECHNOLOGY_AREA')),
    tag_value       VARCHAR(100) NOT NULL CHECK (LENGTH(tag_value) >= 1),
    display_order   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_record_tags_record
    ON record_tags(record_id, tag_type);

CREATE INDEX idx_record_tags_value
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

CREATE TRIGGER trg_tags_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_tags
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_tags();
```

---

#### Table: record_engagement_options

Stores which engagement options are configured on each record. A record may have 1–4 options. UNIQUE constraint prevents duplicate option types per record.

```sql
CREATE TABLE record_engagement_options (
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

CREATE INDEX idx_record_engagement_options_record
    ON record_engagement_options(record_id, display_order);
```

---

#### Table: audit_log

Append-only log of material changes to Innovation Records. Every field edit and state transition is captured here. Rows are never updated or deleted. Required by NFR.

```sql
CREATE TABLE audit_log (
    audit_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID        NOT NULL
                            REFERENCES innovation_records(record_id),
    changed_by_user_id  UUID        NOT NULL REFERENCES users(user_id),
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

CREATE INDEX idx_audit_log_record
    ON audit_log(record_id, changed_at DESC);

CREATE INDEX idx_audit_log_user
    ON audit_log(changed_by_user_id, changed_at DESC);

CREATE INDEX idx_audit_log_event_type
    ON audit_log(event_type, changed_at DESC);
```

---

#### Table: opportunity_submissions

Stores stakeholder mission problem / opportunity submissions (F05). No authentication required from submitter. Visible in curator admin queue.

```sql
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
```

---

#### Table: contribution_submissions

Stores community innovation work contribution submissions (F06). Priority P2 (late-MVP / post-MVP) but schema included at MVP for forward compatibility.

```sql
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
```

---

#### Table: engagement_requests

Stores all stakeholder engagement requests (F07). Tied to a specific Innovation Record and a specific engagement type configured on that record.

```sql
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
```

---

#### Table: hub_settings

Admin-configurable key-value settings store. Routing email address and other configurable parameters are stored here, changeable by curators without code deployment.

```sql
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
```

---

### 3.3 Database Design Notes

**Search vector strategy:** The `search_vector` column on `innovation_records` is the single FTS target. Triggers keep it synchronized with the record's own text fields (via the record INSERT/UPDATE trigger) and with `record_key_findings` and `record_tags` (via their respective after-triggers). This gives the search query a single `WHERE search_vector @@ plainto_tsquery(...)` clause with no joins.

**Weight mapping to FRD field weights:**

| FRD Weight | FTS Weight | Fields |
|-----------|------------|--------|
| High (3×) | A | `problem_statement`, aggregated `key_findings` text |
| Medium (2×) | B | `title`, `what_was_explored`, `outcome_summary` |
| Standard (1×) | C | `reuse_guidance`, `short_summary`, `executive_perspective_text`, `technical_perspective_text`, tag values |

**Soft-delete:** Only DRAFT records may be hard-deleted. All other records use `deleted_at` timestamping. All queries include `WHERE deleted_at IS NULL` in partial indexes and query predicates.

**Audit log immutability:** The `audit_log` table has no UPDATE or DELETE grants in the application role. The application database user has INSERT + SELECT only on this table.

**Array column (artifact_urls in contribution_submissions):** Uses PostgreSQL `TEXT[]` native array type. For non-PostgreSQL engines, serialize as JSON text column or normalize into a separate `contribution_submission_artifact_urls` table.

---

*End of 02-data-model.md*
