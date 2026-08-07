---
phase: implement-full-tsio-innovation-hub-web-a
plan: 17
subsystem: seed-data
tags: [seed, database, audio-security, content, integration-test]
dependency_graph:
  requires: [01-PLAN, 02-PLAN]
  provides: [seed-data, anchor-record, archived-record, migration-boot-test]
  affects: [wave-7b-playwright-suite]
tech_stack:
  added: [db/seeds]
  patterns: [ON CONFLICT DO NOTHING idempotency, fixed UUID seed records]
key_files:
  created:
    - db/seeds/seed_audio_security_poc.sql
    - db/seeds/seed_archived_experiment.sql
    - db/seeds/run_seeds.sh
    - tests/integration/migration_boot.test.js
  modified:
    - db/seeds/seed_audio_security_poc.sql (short_summary length fix)
decisions:
  - Fixed UUIDs (a0000000-..., b0000000-...) for stable Wave 7b test fixture references
  - short_summary field reduced to 259 chars from 284 to fit VARCHAR(280) constraint
  - All INSERTs use ON CONFLICT DO NOTHING — no upsert logic needed for seed records
  - seed curator user (f0000000-...) inserted at CURATOR role (not ADMIN) per threat model T-17-05
metrics:
  duration: ~5 minutes
  completed: 2026-08-03
  tasks: 2
  files: 4
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 17: Seed Data and Migration Boot Test Summary

**One-liner:** Idempotent SQL seed for Audio Security POC anchor record (PROTOTYPE_PILOT/TECHNICALLY_REVIEWED/PUBLISHED) and archived scheduling experiment, with 16-test migration boot integration test suite — all passing against live PostgreSQL 16.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create idempotent seed SQL for Audio Security POC anchor record and archived experiment | `896900f` | ✅ Complete |
| 2 | Create migration boot integration test (16 tests, all passing) | `f0913cb` | ✅ Complete |

## Files Created

### `db/seeds/seed_audio_security_poc.sql`
Audio Security POC anchor record — the MVP content cold-start anchor (F4).

**Anchor Record UUID:** `a0000000-0000-0000-0000-000000000001`

Key field values for Wave 7b test fixture reference:
- `title`: "Audio Security POC: Real-Time Audio Surveillance Detection in Federal Courtrooms"
- `maturity_level`: `PROTOTYPE_PILOT` — triggers "POC ≠ production-ready" disclaimer
- `review_status`: `TECHNICALLY_REVIEWED` — no security/policy review yet
- `publication_state`: `PUBLISHED` — triggers "Published ≠ approved for adoption" disclaimer
- `source_type`: `I_AND_R` — does NOT trigger community disclaimer
- `reuse_potential`: `MEDIUM`
- `default_perspective`: `EXECUTIVE`
- `last_reviewed_date`: `2025-06-15`

Child records seeded with anchor UUID:
- `record_key_findings` (4 rows): GPU/CPU separation (finding_id b0...001), Azure Gov Cloud constraints (b0...002), performance/latency limitations (b0...003), production-readiness gaps (b0...004)
- `record_artifact_links` (2 rows): DOCUMENT link to SharePoint lessons-learned PDF (link_id c0...001), DIAGRAM link to architecture diagram (c0...002)
- `record_tags` (5 rows): 2 MISSION_AREA (Courtroom Security, Physical Security Technology), 3 TECHNOLOGY_AREA (AI/ML — Audio Analysis, Azure Government Cloud, GPU Computing)
- `record_engagement_options` (3 rows): REQUEST_BRIEFING, REQUEST_TECHNICAL_GUIDANCE, REQUEST_DEMO
- Seed curator user `f0000000-0000-0000-0000-000000000001` (CURATOR role, system-seed@tsio.courts.internal)

Trust disclaimer trigger verification:
- ✅ `PROTOTYPE_PILOT` → "POC ≠ production-ready" disclaimer (maturity IN EXPERIMENT_POC, PROTOTYPE_PILOT)
- ✅ `PUBLISHED` → "Published ≠ approved for adoption" disclaimer (always on PUBLISHED)
- ✅ `I_AND_R` → does NOT trigger community disclaimer
- ✅ `TECHNICALLY_REVIEWED` (not `VALIDATED_FOR_REUSE`) → does NOT trigger reuse disclaimer

### `db/seeds/seed_archived_experiment.sql`
Archived stopped experiment — demonstrates honest institutional lifecycle (F9/PRD §9).

**Archived Record UUID:** `a0000000-0000-0000-0000-000000000002`

Key values:
- `title`: "Automated Case Scheduling Optimization POC (Archived)"
- `maturity_level`: `ARCHIVED` — per PRD §6.1 (innovation work no longer active)
- `publication_state`: `ARCHIVED` — per PRD §6.4 (removed from default catalog browse)
- 2 `record_key_findings`, 1 `record_artifact_links`, 2 `record_tags` rows

### `db/seeds/run_seeds.sh`
Shell script applying both seed files in order against the docker-compose `db` service.

Usage: `./db/seeds/run_seeds.sh`  
Requires: `docker compose up -d db` first  
Idempotent: safe to run multiple times (all INSERTs use ON CONFLICT DO NOTHING)

### `tests/integration/migration_boot.test.js`
16-test Jest suite verifying full database stack on PostgreSQL 16.

**Test groups:**
1. "Migration boot: all 11 tables exist" (3 tests) — all expected tables present, GIN FTS index exists, CHECK constraints exist
2. "hub_settings seed data" (2 tests) — ≥4 rows, engagement_routing_email=AOml_TSO_IRB_Team@ao.uscourts.gov
3. "Audio Security POC anchor record (F4)" (7 tests) — trust model values, catalog discoverability, 4 key findings, DOCUMENT artifact link, MISSION+TECHNOLOGY tags, REQUEST_BRIEFING+REQUEST_TECHNICAL_GUIDANCE options, search_vector non-null, FTS query returns anchor
4. "Archived experiment record (F0/F9 honest lifecycle)" (2 tests) — both ARCHIVED values, NOT in PUBLISHED catalog
5. "Idempotency" (2 tests) — duplicate ON CONFLICT DO NOTHING resolves without error

**Test result:** 16/16 passing against live PostgreSQL 16 container

## Seed Idempotency Strategy

All child table `INSERT` statements use `ON CONFLICT (primary_key) DO NOTHING`:
- `innovation_records`: `ON CONFLICT (record_id) DO NOTHING`
- `record_key_findings`: `ON CONFLICT (finding_id) DO NOTHING`
- `record_artifact_links`: `ON CONFLICT (link_id) DO NOTHING`
- `record_tags`: `ON CONFLICT (tag_id) DO NOTHING`
- `record_engagement_options`: `ON CONFLICT (record_id, option_type) DO NOTHING`
- `users`: `ON CONFLICT (user_id) DO NOTHING`

Re-running seeds produces `INSERT 0 0` for all statements — verified idempotent.

## Migration Boot Test Results

```
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Time:        ~0.1s
```

Run command:
```bash
DATABASE_URL="postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub" \
  npx jest tests/integration/migration_boot.test.js --testTimeout=30000 --forceExit
```

## Integration Contract for Wave 7b

| Artifact | UUID / Key | Purpose |
|----------|-----------|---------|
| Audio Security POC anchor | `a0000000-0000-0000-0000-000000000001` | Primary test fixture for E2E catalog, detail view, FTS, engagement flow tests |
| Archived experiment | `a0000000-0000-0000-0000-000000000002` | Lifecycle/governance test fixture |
| Seed curator user | `f0000000-0000-0000-0000-000000000001` | FK attribution for seeded records |
| Finding: GPU/CPU | `b0000000-0000-0000-0000-000000000001` | Key finding #1 for detail view tests |
| Finding: Azure Gov Cloud | `b0000000-0000-0000-0000-000000000002` | Key finding #2 |
| Finding: Performance/Latency | `b0000000-0000-0000-0000-000000000003` | Key finding #3 |
| Finding: Production-readiness gaps | `b0000000-0000-0000-0000-000000000004` | Key finding #4 |
| DOCUMENT artifact link | `c0000000-0000-0000-0000-000000000001` | SharePoint lessons-learned PDF link |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed short_summary VARCHAR(280) overflow in audio security POC seed**
- **Found during:** Task 1 verification (live seed run)
- **Issue:** `short_summary` value was 284 characters; PostgreSQL `VARCHAR(280)` constraint caused INSERT failure, cascading to all child record failures
- **Fix:** Rewrote short_summary to 259 characters with equivalent semantic content
- **Files modified:** `db/seeds/seed_audio_security_poc.sql`
- **Commit:** `f0913cb`

## Known Stubs

None found.

## Self-Check: PASSED

- [x] `db/seeds/seed_audio_security_poc.sql` exists — FOUND
- [x] `db/seeds/seed_archived_experiment.sql` exists — FOUND
- [x] `db/seeds/run_seeds.sh` exists and is executable — FOUND
- [x] `tests/integration/migration_boot.test.js` exists — FOUND
- [x] Task 1 commit `896900f` exists — VERIFIED
- [x] Task 2 commit `f0913cb` exists — VERIFIED
- [x] 16/16 integration tests passing against live PostgreSQL 16 — VERIFIED
- [x] Seed idempotency confirmed: re-run produces INSERT 0 0 for all statements — VERIFIED
- [x] Anchor record UUID `a0000000-0000-0000-0000-000000000001` has PROTOTYPE_PILOT/TECHNICALLY_REVIEWED/PUBLISHED/I_AND_R — VERIFIED in live DB
- [x] Archived record UUID `a0000000-0000-0000-0000-000000000002` has ARCHIVED/ARCHIVED — VERIFIED in live DB
- [x] No blocking stubs found — VERIFIED
