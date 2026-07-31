---
phase: implement-full-tsio-innovation-hub-web-a
plan: "02"
subsystem: database
tags: [postgresql, docker-compose, wave-1b, users, hub_settings, submissions, engagement]
dependency_graph:
  requires: []
  provides:
    - users table (UUID PK, email UNIQUE, role CHECK CURATOR/ADMIN, idp_subject UNIQUE)
    - hub_settings table (4 seed rows including engagement_routing_email)
    - opportunity_submissions table (status CHECK 5 values, FK to users + innovation_records)
    - contribution_submissions table (self_assessed_maturity 4 values, artifact_urls TEXT[], FK to users + innovation_records)
    - engagement_requests table (request_type CHECK 5 values, status CHECK 4 values, FK to users + innovation_records)
    - docker-compose.yml (postgres:16 with healthcheck, app service depends_on db service_healthy)
  affects:
    - innovation_records (deferred FK constraints added: created_by_user_id, updated_by_user_id → users)
    - audit_log (deferred FK constraint added: changed_by_user_id → users)
tech_stack:
  added: [docker-compose v3.9, postgres:16]
  patterns:
    - PostgreSQL initdb.d alphabetical migration ordering (001_supporting_tables sorts after 001_core_content_tables)
    - Deferred FK constraints via ALTER TABLE (users created after innovation_records due to circular dependency resolution)
    - hub_settings seed data for configurable routing email (no code deploy required to change)
key_files:
  created:
    - db/migrations/001_supporting_tables.sql
    - docker-compose.yml
  modified: []
decisions:
  - "Migration named 001_supporting_tables.sql (not 002_) so it sorts AFTER 001_core_content_tables.sql alphabetically — users table created after innovation_records, then ALTER TABLE adds deferred FKs"
  - "Added ALTER TABLE innovation_records and audit_log to apply deferred FK constraints to users(user_id) per plan 01 comments"
  - "docker-compose uses service name 'db' (not localhost) in DATABASE_URL for container networking"
metrics:
  duration: "~5 minutes"
  completed: "2026-07-31T13:21:07Z"
  tasks_completed: 2
  files_created: 2
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 02: Wave 1b Supporting Tables + docker-compose Summary

**One-liner:** Five supporting PostgreSQL tables (users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests) with verbatim TechArch DDL, 10 indexes, 4 seed rows, deferred FK constraints, and docker-compose.yml with pinned postgres:16 and healthcheck.

---

## What Was Built

### Task 1: docker-compose.yml (commit: 12cb904)

Created `docker-compose.yml` at project root with:
- `db` service: `postgres:16` pinned image, healthcheck via `pg_isready -U tsio_hub_user -d tsio_hub`, migrations mounted as `/docker-entrypoint-initdb.d:ro`
- `app` service: `depends_on: db: condition: service_healthy`, `DATABASE_URL` pointing to `db:5432` (container network name), port `3000:3000`
- `postgres_data` named volume for data persistence

### Task 2: Supporting Tables DDL (commit: f3e83bf via pivota-auto)

Created `db/migrations/001_supporting_tables.sql` with:

**5 tables (verbatim from TechArch §3.2):**
1. **users** — UUID PK, email UNIQUE, display_name, role CHECK(CURATOR|ADMIN), is_active, last_login_at, created_at, idp_subject UNIQUE
2. **hub_settings** — setting_key PK, setting_value, description, updated_at, updated_by_user_id FK→users; 4 seed rows
3. **opportunity_submissions** — submission_id UUID PK, problem_description CHECK(≥50), mission fields, status CHECK(5 values), linked_record_id FK→innovation_records, reviewed_by_user_id FK→users
4. **contribution_submissions** — submission_id UUID PK, work/problem/outcome description CHECKs(≥50), self_assessed_maturity CHECK(4 values, no ARCHIVED), artifact_urls TEXT[], status CHECK(5 values), FKs→users+innovation_records
5. **engagement_requests** — request_id UUID PK, record_id FK→innovation_records, request_type CHECK(5 values), requestor fields, description_of_interest CHECK(≥20), status CHECK(4 values), updated_by_user_id FK→users

**10 indexes:**
- `idx_users_email`, `idx_users_idp_subject`
- `idx_opportunity_submissions_status`, `idx_opportunity_submissions_submitted_at`
- `idx_contribution_submissions_status`, `idx_contribution_submissions_submitted_at`
- `idx_engagement_requests_record`, `idx_engagement_requests_status`, `idx_engagement_requests_submitted_at`, `idx_engagement_requests_type`

**4 hub_settings seed rows:**
- `engagement_routing_email` → `AOml_TSO_IRB_Team@ao.uscourts.gov`
- `contact_display_email` → `AOml_TSO_IRB_Team@ao.uscourts.gov`
- `catalog_default_page_size` → `12`
- `default_perspective` → `EXECUTIVE`

**3 deferred FK constraints (ALTER TABLE):**
- `innovation_records.created_by_user_id` → `users(user_id)`
- `innovation_records.updated_by_user_id` → `users(user_id)`
- `audit_log.changed_by_user_id` → `users(user_id)`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1/3 - Blocking] Added deferred FK constraints for innovation_records and audit_log**
- **Found during:** Task 2 execution
- **Issue:** Plan 01 (`001_core_content_tables.sql`) explicitly commented "FK to users(user_id) added in 002_supporting_tables.sql" for `created_by_user_id`, `updated_by_user_id` in `innovation_records` and `changed_by_user_id` in `audit_log`. Without these ALTER TABLE statements, the schema would be incomplete — users FK referenced but never enforced.
- **Fix:** Added 3 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES users(user_id)` statements at the end of `001_supporting_tables.sql`, after users table creation.
- **Files modified:** `db/migrations/001_supporting_tables.sql`

**2. [Rule 3 - Coordination] Migration file naming to respect alphabetical load order**
- **Found during:** Task 2 execution
- **Issue:** Plan 02 spec said to name file `001_supporting_tables.sql` so it sorts BEFORE `002_core_tables.sql`. However, plan 01 already created `001_core_content_tables.sql`. Since 'c' sorts before 's' alphabetically, `001_supporting_tables.sql` actually loads AFTER `001_core_content_tables.sql` — which is the correct order (innovation_records must exist before our FK references to it from opportunity_submissions etc.).
- **Fix:** Kept the `001_supporting_tables.sql` name and updated file header comment to accurately reflect the alphabetical ordering. The load sequence is correct: core tables first, then supporting tables with deferred FK constraints.
- **Files modified:** `db/migrations/001_supporting_tables.sql` (header comment updated)

**3. [Note] Task 2 committed by pivota-auto workspace artifacts**
- Plan 02 Task 2 file was picked up by the concurrent `pivota-auto` workspace artifact commit (f3e83bf) before a separate explicit task commit could be made. The file content is exactly what was authored — this is an artifact of parallel plan execution in the same workspace. The correct content is committed.

---

## Known Stubs

None found. All DDL is complete and exact per TechArch §3.2.
- `artifact_urls TEXT[]` note: URL format validation is explicitly deferred to SubmissionService (Wave 3b) as documented in the plan's threat model (T-02-04). This is by design, not a stub.

---

## Integration Contract

### Provides

| Table | Key Shape | Used By |
|-------|-----------|---------|
| `users` | UUID PK, email UNIQUE, role CHECK(CURATOR\|ADMIN), idp_subject UNIQUE | W3a AuthMiddleware upsert; W3c AdminHandler; audit FK |
| `hub_settings` | setting_key PK, 4 seed rows | W3c SettingsService read/write |
| `opportunity_submissions` | status CHECK(5 values), FK→users+innovation_records | W3b SubmissionService |
| `contribution_submissions` | self_assessed_maturity CHECK(4 values), artifact_urls TEXT[] | W3b SubmissionService |
| `engagement_requests` | request_type CHECK(5 values), status CHECK(4 values) | W3c EngagementService |

### Migration Load Order (alphabetical via initdb.d)

1. `001_core_content_tables.sql` — innovation_records + child tables + audit_log (FKs to users deferred)
2. `001_core_content_tables_verify.sql` — verification queries (advisory)
3. `001_supporting_tables.sql` — users + supporting tables + ALTER TABLE to add deferred FKs

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: docker-compose.yml | `12cb904` | `chore(implement-full-tsio-innovation-hub-web-a-02): create docker-compose.yml with pinned PostgreSQL 16 and healthcheck` |
| Task 2: supporting tables DDL | `f3e83bf` | `chore: update workspace artifacts [pivota-auto]` (captured 001_supporting_tables.sql) |

---

## Self-Check: PASSED

- [x] `db/migrations/001_supporting_tables.sql` exists — FOUND
- [x] `docker-compose.yml` exists — FOUND
- [x] All 5 CREATE TABLE statements present — VERIFIED (grep count: 5)
- [x] All 4 hub_settings seed rows present — VERIFIED (engagement_routing_email, contact_display_email, catalog_default_page_size, default_perspective)
- [x] docker-compose has postgres:16, healthcheck, service_healthy, db:5432 — VERIFIED
- [x] 10 CREATE INDEX statements — VERIFIED
- [x] 3 ALTER TABLE deferred FK constraints — VERIFIED
- [x] No stubs or TODOs in created files — VERIFIED
- [x] Build check: N/A for Wave 1 (DDL + docker-compose only; no application code; Docker daemon not available in sandbox — verified via YAML parse and node.js content checks)
- [x] Known Stubs section: "None found" (artifact_urls validation by design deferred to service layer)
