---
phase: implement-full-tsio-innovation-hub-web-a
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - db/migrations/002_supporting_tables.sql
  - docker-compose.yml
autonomous: true

features:
  implements: ["F5", "F6", "F7", "F8"]
  depends_on: []
  enables: ["F5", "F6", "F7", "F8"]

must_haves:
  truths:
    - "users table exists with UUID PK, email UNIQUE, role CHECK (CURATOR, ADMIN), idp_subject UNIQUE"
    - "hub_settings table exists with 4 seed rows (engagement_routing_email, contact_display_email, catalog_default_page_size, default_perspective)"
    - "opportunity_submissions table exists with all 12 columns and status CHECK constraint (5 values)"
    - "contribution_submissions table exists with TEXT[] artifact_urls and self_assessed_maturity CHECK (4 values, no ARCHIVED)"
    - "engagement_requests table exists with request_type CHECK (5 values) and status CHECK (4 values)"
    - "docker-compose.yml runs PostgreSQL 16 with pinned image, healthcheck, and the app service wired to depend on healthy DB"
    - "psql connects to the running container and all 5 supporting tables exist with correct schemas"
  artifacts:
    - path: "db/migrations/002_supporting_tables.sql"
      provides: "DDL for users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests tables + indexes + seed data"
      contains: "CREATE TABLE users"
    - path: "docker-compose.yml"
      provides: "PostgreSQL 16 service with healthcheck; app service depending on healthy DB"
      contains: "postgres:16"
  key_links:
    - from: "opportunity_submissions"
      to: "users"
      via: "reviewed_by_user_id FK REFERENCES users(user_id)"
      pattern: "REFERENCES users\\(user_id\\)"
    - from: "contribution_submissions"
      to: "users"
      via: "reviewed_by_user_id FK REFERENCES users(user_id)"
      pattern: "REFERENCES users\\(user_id\\)"
    - from: "engagement_requests"
      to: "users"
      via: "updated_by_user_id FK REFERENCES users(user_id)"
      pattern: "REFERENCES users\\(user_id\\)"
    - from: "hub_settings"
      to: "users"
      via: "updated_by_user_id FK REFERENCES users(user_id)"
      pattern: "REFERENCES users\\(user_id\\)"
    - from: "opportunity_submissions"
      to: "innovation_records"
      via: "linked_record_id FK REFERENCES innovation_records(record_id)"
      pattern: "REFERENCES innovation_records\\(record_id\\)"

integration_contracts:
  requires: []
  provides:
    - artifact: "db/migrations/002_supporting_tables.sql"
      exports:
        - "users"
        - "hub_settings"
        - "opportunity_submissions"
        - "contribution_submissions"
        - "engagement_requests"
      shape: |
        users: (user_id UUID PK, email VARCHAR(255) UNIQUE NOT NULL, display_name VARCHAR(200) NOT NULL,
                role VARCHAR(20) CHECK (CURATOR|ADMIN) DEFAULT CURATOR, is_active BOOLEAN DEFAULT TRUE,
                last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL, idp_subject VARCHAR(500) UNIQUE)
        hub_settings: (setting_key VARCHAR(100) PK, setting_value TEXT NOT NULL, description TEXT,
                       updated_at TIMESTAMPTZ NOT NULL, updated_by_user_id UUID FK → users)
        opportunity_submissions: (submission_id UUID PK, problem_description TEXT CHECK(≥50),
                       mission_area VARCHAR(200), submitting_office VARCHAR(200),
                       submitter_name VARCHAR(200), submitter_email VARCHAR(255),
                       submitter_title VARCHAR(200), urgency_context TEXT, known_constraints TEXT,
                       status VARCHAR(40) CHECK(SUBMITTED|UNDER_REVIEW|ACCEPTED_FOR_CONSIDERATION|DECLINED|LINKED_TO_RECORD),
                       disposition VARCHAR(40), linked_record_id UUID FK → innovation_records,
                       internal_note TEXT, submitted_at TIMESTAMPTZ NOT NULL,
                       reviewed_at TIMESTAMPTZ, reviewed_by_user_id UUID FK → users)
        contribution_submissions: (submission_id UUID PK, work_description TEXT CHECK(≥50),
                       problem_addressed TEXT CHECK(≥50), outcome_summary TEXT CHECK(≥50),
                       self_assessed_maturity VARCHAR(30) CHECK(IDEA|EXPERIMENT_POC|PROTOTYPE_PILOT|PRODUCTION_VALIDATED),
                       artifact_urls TEXT[] NOT NULL, contributing_team VARCHAR(200),
                       contributing_office VARCHAR(200), contact_name VARCHAR(200),
                       contact_email VARCHAR(255), contact_title VARCHAR(200),
                       additional_context TEXT,
                       status VARCHAR(30) CHECK(SUBMITTED|UNDER_REVIEW|ACCEPTED_FOR_CURATION|DECLINED|PUBLISHED),
                       internal_note TEXT, linked_record_id UUID FK → innovation_records,
                       submitted_at TIMESTAMPTZ NOT NULL, reviewed_at TIMESTAMPTZ,
                       reviewed_by_user_id UUID FK → users)
        engagement_requests: (request_id UUID PK, record_id UUID NOT NULL FK → innovation_records,
                       request_type VARCHAR(40) CHECK(REQUEST_DEMO|REQUEST_ADOPTION_DISCUSSION|REQUEST_TECHNICAL_GUIDANCE|REQUEST_BRIEFING|SUBMIT_RELATED_PROBLEM),
                       requestor_name VARCHAR(200), requestor_email VARCHAR(255),
                       requestor_office VARCHAR(200), requestor_title VARCHAR(200),
                       description_of_interest TEXT CHECK(≥20), desired_next_step TEXT,
                       status VARCHAR(20) CHECK(SUBMITTED|IN_PROGRESS|COMPLETED|NO_ACTION) DEFAULT SUBMITTED,
                       curator_note TEXT, submitted_at TIMESTAMPTZ NOT NULL,
                       updated_at TIMESTAMPTZ NOT NULL, updated_by_user_id UUID FK → users)
      verify: "grep -n 'CREATE TABLE users' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE hub_settings' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE opportunity_submissions' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE contribution_submissions' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE engagement_requests' db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
    - artifact: "docker-compose.yml"
      exports:
        - "db (postgres:16 service with healthcheck)"
        - "app (depends_on db service_healthy)"
      shape: |
        services:
          db:
            image: postgres:16
            environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
            healthcheck: pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}
          app:
            depends_on:
              db:
                condition: service_healthy
      verify: "grep -n 'postgres:16' docker-compose.yml && grep -n 'healthcheck' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK"
---

<objective>
Create the five supporting PostgreSQL tables (users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests) with exact DDL from TechArch, and establish the docker-compose.yml with a pinned PostgreSQL 16 image and healthcheck. This plan is Wave 1b — it builds alongside plan 01's core content tables (Wave 1a) in the same migration wave.

Purpose: Backend services in Waves 3 (F5/F6/F7/F8) cannot exist without these tables. The users table is the FK target for all curator-authored content (audit_log, innovation_records created_by/updated_by), so it must exist before Wave 1a DDL that references it. docker-compose.yml provides the running PostgreSQL instance that all subsequent development and testing depends on.

Output:
- db/migrations/002_supporting_tables.sql — DDL for 5 tables + 9 indexes + 4 seed rows
- docker-compose.yml — PostgreSQL 16 service with healthcheck; app service stub
</objective>

<feature_dependencies>
Implements: F5: Opportunity Submission (opportunity_submissions table), F6: Share Existing Innovation Work (contribution_submissions table), F7: Engagement Routing (engagement_requests + hub_settings tables), F8: Curation and Administration (users table)
Depends on: None (Wave 1 — first wave)
Enables: F5: SubmissionService (W3b), F6: SubmissionService (W3b), F7: EngagementService + SettingsService (W3c), F8: AuthMiddleware + AdminHandler (W3a)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create docker-compose.yml with pinned PostgreSQL 16 and healthcheck</name>
  <files>docker-compose.yml</files>
  <action>
Create docker-compose.yml in the project root. This file is the single-source runtime contract for all development and CI work.

Requirements from WAVE-SCHEDULE.md: pinned PostgreSQL 16 image + healthcheck. App service must depend on healthy DB.

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: tsio_hub
      POSTGRES_USER: tsio_hub_user
      POSTGRES_PASSWORD: tsio_hub_dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tsio_hub_user -d tsio_hub"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  app:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://tsio_hub_user:tsio_hub_dev_password@db:5432/tsio_hub
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
```

Key decisions:
- `postgres:16` pinned (not `:latest`) per infrastructure contract
- Healthcheck uses `pg_isready` (built into postgres image) against the configured user+db
- Migrations directory mounted as `initdb.d` so PostgreSQL auto-runs all `.sql` files in alphabetical order on first boot
- Connection string uses service name `db` (not `localhost`) per container networking rules
- App service is a stub (`build: .`) — later waves will add the full command and env vars
- `start_period: 10s` gives PostgreSQL time to initialize before health probes count failures
  </action>
  <verify>
docker compose config --quiet && echo "COMPOSE CONFIG VALID"
docker build -t tsio-build-check . 2>&1 | tail -5 || echo "NO DOCKERFILE YET (expected at this stage)" && echo "BUILD CHECK SKIPPED"
grep -n 'postgres:16' docker-compose.yml && grep -n 'healthcheck' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK
  </verify>
  <done>
- docker-compose.yml exists at project root
- `docker compose config --quiet` exits 0 with no errors
- Image is pinned to `postgres:16` (not latest)
- healthcheck block uses `pg_isready -U tsio_hub_user -d tsio_hub`
- app service has `depends_on.db.condition: service_healthy`
- Migrations directory mounted as `/docker-entrypoint-initdb.d:ro`
  </done>
</task>

<task type="auto">
  <name>Task 2: Create supporting tables DDL (users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests)</name>
  <files>db/migrations/002_supporting_tables.sql</files>
  <action>
Create db/migrations/002_supporting_tables.sql with exact DDL from TechArch §3.2. This file runs after 001_core_tables.sql (innovation_records and its child tables) because several tables here have FK references to innovation_records. The users table must be created FIRST within this file because other tables in this same file FK to it.

**NOTE:** The users table also serves as a FK target for innovation_records (created_by_user_id, updated_by_user_id). Because 001_core_tables.sql references users, this migration file (002) must run BEFORE 001. Rename this to 001_users_and_supporting_tables.sql if needed, or ensure migration tooling runs in alphabetical order with a 001 prefix for this file. If using PostgreSQL initdb.d (docker-compose), files run alphabetically — use prefix `001` for this file and `002` for the core tables file.

> Executor decision: Name this file `001_supporting_tables.sql` (prefix 001) and the core tables migration `002_core_tables.sql` so users is created before innovation_records which FKs to it. Adjust the 01-PLAN.md core tables filename accordingly, or create users in a standalone preamble. The safest approach: create users first, then all other tables in dependency order.

Copy the following DDL verbatim from TechArch §3.2:

---

#### users table (must be created first — FK target for all other tables)

```sql
-- ============================================================
-- TSIO Innovation Hub — Supporting Tables Migration
-- Migration: 001_supporting_tables.sql
-- Run BEFORE 002_core_tables.sql (innovation_records FKs to users)
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
```

#### hub_settings table (and seed data)

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

#### opportunity_submissions table

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

#### contribution_submissions table

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

#### engagement_requests table

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

The complete file must contain all five CREATE TABLE statements in this order:
1. users (no FKs to other hub tables)
2. hub_settings (FK to users)
3. opportunity_submissions (FK to users + innovation_records)
4. contribution_submissions (FK to users + innovation_records)
5. engagement_requests (FK to users + innovation_records)

Followed by all indexes and the hub_settings seed INSERT.

**Migration file naming coordination:** Since innovation_records (created in the parallel 01-PLAN) has FK references to users, the final file must load users BEFORE innovation_records. Name this file so it sorts first alphabetically (e.g., `001_supporting_tables.sql`) and the core tables file `002_core_tables.sql`. PostgreSQL initdb.d runs files in alphabetical order.
  </action>
  <verify>
mkdir -p db/migrations && ls db/migrations/
grep -n 'CREATE TABLE users' db/migrations/001_supporting_tables.sql && echo "users table DDL found"
grep -n 'CREATE TABLE hub_settings' db/migrations/001_supporting_tables.sql && echo "hub_settings DDL found"
grep -n 'CREATE TABLE opportunity_submissions' db/migrations/001_supporting_tables.sql && echo "opportunity_submissions DDL found"
grep -n 'CREATE TABLE contribution_submissions' db/migrations/001_supporting_tables.sql && echo "contribution_submissions DDL found"
grep -n 'CREATE TABLE engagement_requests' db/migrations/001_supporting_tables.sql && echo "engagement_requests DDL found"
grep -n "AOml_TSO_IRB_Team@ao.uscourts.gov" db/migrations/001_supporting_tables.sql && echo "seed data found"
grep -n "service_healthy" docker-compose.yml && echo "healthcheck dependency found"
docker compose up -d db 2>&1 | tail -5 && sleep 5 && docker compose exec db psql -U tsio_hub_user -d tsio_hub -c "\dt" 2>&1 | grep -E "(users|hub_settings|opportunity_submissions|contribution_submissions|engagement_requests)" && echo "ALL TABLES EXIST" && docker compose down
  </verify>
  <done>
- db/migrations/001_supporting_tables.sql exists with all 5 CREATE TABLE statements verbatim from TechArch
- users table: user_id UUID PK, email UNIQUE, role CHECK(CURATOR|ADMIN), idp_subject UNIQUE — exactly as TechArch
- hub_settings table: 4 seed rows inserted including engagement_routing_email = 'AOml_TSO_IRB_Team@ao.uscourts.gov'
- opportunity_submissions: status CHECK with exactly 5 values (SUBMITTED, UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD)
- contribution_submissions: self_assessed_maturity CHECK with exactly 4 values (no ARCHIVED), artifact_urls TEXT[]
- engagement_requests: request_type CHECK with 5 values, status CHECK with 4 values (SUBMITTED, IN_PROGRESS, COMPLETED, NO_ACTION)
- All 9 indexes created (2 on users, 2 on opportunity_submissions, 2 on contribution_submissions, 4 on engagement_requests)
- When docker compose boots, psql \dt shows all 5 tables and hub_settings has 4 rows
- File sorts BEFORE core tables migration (001 prefix) so users exists before innovation_records FK is applied
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| migration→db | SQL DDL files loaded into PostgreSQL via initdb.d or migration runner |
| compose→host | docker-compose.yml mounts host paths into container filesystem |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | docker-compose.yml `volumes` mount of `./db/migrations` | mitigate | Mount is read-only (`:ro` flag in compose `volumes` directive for the initdb.d mount); host path is the checked-in repo directory, not user-controlled input |
| T-02-02 | Information disclosure | docker-compose.yml `environment` block containing POSTGRES_PASSWORD | accept | Dev credentials only (not prod); prod secrets will be injected via host secret manager per TechArch §1.3 deployment constraints; no prod credentials in repo |
| T-02-03 | Elevation of privilege | hub_settings seed row `engagement_routing_email` writable by any CURATOR role | mitigate | `SettingsService` (Wave 3c) validates email format before write; `updated_by_user_id` FK ensures every change is attributed to an authenticated curator; audit trail via updated_at |
| T-02-04 | Tampering | contribution_submissions `artifact_urls TEXT[]` — array of unvalidated URL strings | mitigate | CHECK constraint is not applied at DB layer for array element format (PostgreSQL limitation); validation enforced at service layer in `SubmissionService` (Wave 3b) per FRD: each element must be a valid HTTPS URL; schema comment documents this requirement |
| T-02-05 | Information disclosure | engagement_requests stores PII (requestor_name, requestor_email, requestor_office) | mitigate | Table is not exposed to PUBLIC API role; `EngagementService` (Wave 3c) requires CURATOR auth for list/filter endpoints; `updated_by_user_id` FK enforces attribution on all curator actions |
</threat_model>

<verification>
Run after both tasks complete:

```bash
# 1. Validate docker-compose config parses cleanly
docker compose config --quiet && echo "COMPOSE CONFIG VALID"

# 2. Validate postgres:16 pinned (not latest)
grep 'postgres:16' docker-compose.yml && echo "IMAGE PINNED"

# 3. Validate healthcheck and dependency wiring
grep -n 'service_healthy' docker-compose.yml && echo "HEALTHCHECK WIRED"

# 4. Validate all 5 supporting table DDL files
grep -c 'CREATE TABLE' db/migrations/001_supporting_tables.sql

# 5. Validate seed data present
grep 'AOml_TSO_IRB_Team@ao.uscourts.gov' db/migrations/001_supporting_tables.sql && echo "SEED DATA OK"

# 6. Validate file sorts before core tables migration
ls db/migrations/ | sort | head -3

# 7. Boot PostgreSQL and verify all tables load
docker compose up -d db && sleep 8
docker compose exec db psql -U tsio_hub_user -d tsio_hub -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>&1 | grep -E "users|hub_settings|opportunity_submissions|contribution_submissions|engagement_requests"
docker compose exec db psql -U tsio_hub_user -d tsio_hub -c "SELECT count(*) FROM hub_settings;" 2>&1 | grep '4'
docker compose down
```
</verification>

<success_criteria>
- docker-compose.yml exists with `postgres:16` pinned, healthcheck using `pg_isready`, app service with `depends_on.db.condition: service_healthy`
- `docker compose config --quiet` exits 0
- db/migrations/001_supporting_tables.sql contains all 5 CREATE TABLE statements verbatim from TechArch §3.2
- File prefix 001 ensures it loads before 002_core_tables.sql (users must exist before innovation_records FK)
- users table: role CHECK(CURATOR|ADMIN), idp_subject UNIQUE — matches TechArch exactly
- hub_settings: 4 seed rows including `engagement_routing_email = 'AOml_TSO_IRB_Team@ao.uscourts.gov'`
- opportunity_submissions status: exactly 5 CHECK values matching TechArch
- contribution_submissions: `self_assessed_maturity` excludes ARCHIVED (4 values only), `artifact_urls TEXT[]`
- engagement_requests: 5 request_type values, 4 status values — matches TechArch exactly
- All 9 indexes created exactly as specified in TechArch
- When `docker compose up -d db` runs, `\dt` in psql shows all tables and `SELECT count(*) FROM hub_settings` returns 4
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/02-SUMMARY.md`
</output>
