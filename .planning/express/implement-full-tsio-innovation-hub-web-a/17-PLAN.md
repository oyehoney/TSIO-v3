---
phase: implement-full-tsio-innovation-hub-web-a
plan: 17
type: execute
wave: 7
depends_on: [1, 2, 3, 4, 5, 6]
files_modified:
  - db/seeds/seed_audio_security_poc.sql
  - db/seeds/seed_archived_experiment.sql
  - db/seeds/run_seeds.sh
  - tests/integration/migration_boot.test.js
autonomous: true

features:
  implements: ["F0", "F4", "F9"]
  depends_on: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"]
  enables: []

must_haves:
  truths:
    - "The Audio Security POC anchor record exists in innovation_records with maturity_level='PROTOTYPE_PILOT', review_status='TECHNICALLY_REVIEWED', publication_state='PUBLISHED', source_type='I_AND_R', and all pub-required fields populated"
    - "The anchor record has at least 4 record_key_findings rows covering: (1) GPU/CPU separation requirement, (2) Azure Government Cloud constraints, (3) performance/latency limitations, and (4) production-readiness gaps"
    - "The anchor record has at least 1 record_artifact_links row pointing to an HTTPS SharePoint URL of type DOCUMENT"
    - "The anchor record has at least 2 record_tags (1 MISSION_AREA + 1 TECHNOLOGY_AREA)"
    - "The anchor record has at least 3 record_engagement_options: REQUEST_DEMO, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING"
    - "The anchor record has executive_perspective_text and executive_recommendation populated (pub-required fields)"
    - "All 4 TrustDisclaimerService trigger conditions are satisfied: maturity_level=PROTOTYPE_PILOT triggers 'POC ≠ production-ready'; publication_state=PUBLISHED triggers 'Published ≠ approved for adoption'; source_type=I_AND_R does NOT trigger community disclaimer; review_status=TECHNICALLY_REVIEWED (not VALIDATED_FOR_REUSE) does NOT trigger reuse disclaimer"
    - "At least one archived/stopped experiment record exists in innovation_records with maturity_level='ARCHIVED', publication_state='ARCHIVED', demonstrating honest institutional lifecycle"
    - "docker compose up -d runs cleanly with all three services (db + api + frontend) reaching healthy/running state"
    - "A fresh PostgreSQL 16 container can apply all migrations (001 + 002) and then accept seed data without errors"
    - "Seed script is idempotent: running it twice on the same DB produces no errors and no duplicate records"
  artifacts:
    - path: "db/seeds/seed_audio_security_poc.sql"
      provides: "Idempotent SQL INSERT for Audio Security POC anchor record with all pub-required fields, key findings, artifact links, tags, and engagement options"
      contains: "PROTOTYPE_PILOT"
    - path: "db/seeds/seed_archived_experiment.sql"
      provides: "Idempotent SQL INSERT for archived/stopped experiment record demonstrating honest lifecycle"
      contains: "ARCHIVED"
    - path: "db/seeds/run_seeds.sh"
      provides: "Shell script that applies all seed files in order against the running PostgreSQL container"
    - path: "tests/integration/migration_boot.test.js"
      provides: "Integration test confirming all migrations apply cleanly and seed data is accessible in a fresh PostgreSQL 16 container via Testcontainers/Docker"
  key_links:
    - from: "db/seeds/seed_audio_security_poc.sql"
      to: "innovation_records (record_id)"
      via: "INSERT ... ON CONFLICT (record_id) DO NOTHING — idempotent insert by fixed UUID"
      pattern: "ON CONFLICT.*DO NOTHING"
    - from: "db/seeds/seed_audio_security_poc.sql"
      to: "record_key_findings (record_id FK)"
      via: "Child table inserts using the same fixed UUID for record_id"
      pattern: "INSERT INTO record_key_findings"
    - from: "tests/integration/migration_boot.test.js"
      to: "db/migrations/001_core_content_tables.sql + 002_supporting_tables.sql"
      via: "Applies migration SQL files against a Testcontainers PostgreSQL 16 instance"
      pattern: "GenericContainer.*postgres:16"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/migrations/001_core_content_tables.sql"
      exports: ["TABLE: innovation_records", "TABLE: record_key_findings", "TABLE: record_artifact_links", "TABLE: record_tags", "TABLE: record_engagement_options", "TABLE: audit_log"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS innovation_records' db/migrations/001_core_content_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports: ["TABLE: users", "TABLE: hub_settings"]
      verify: "grep -n 'CREATE TABLE users' db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "docker-compose.yml"
      exports: ["db (postgres:16 service with healthcheck)", "app (depends_on db service_healthy)"]
      verify: "grep -n 'postgres:16' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK"
  provides:
    - artifact: "db/seeds/seed_audio_security_poc.sql"
      exports:
        - "innovation_record: Audio Security POC — fixed UUID anchor record (maturity=PROTOTYPE_PILOT, review_status=TECHNICALLY_REVIEWED, publication_state=PUBLISHED, source_type=I_AND_R)"
        - "record_key_findings: 4 findings covering GPU/CPU separation, Azure Gov Cloud constraints, performance/latency limitations, production-readiness gaps"
        - "record_artifact_links: DOCUMENT link to SharePoint lessons-learned document (https://...sharepoint.com/...)"
        - "record_tags: 1 MISSION_AREA (Courtroom Technology), 1 TECHNOLOGY_AREA (Audio Security / AI)"
        - "record_engagement_options: REQUEST_DEMO, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING"
      shape: |
        Fixed UUID: '00000000-0000-0000-0000-000000000001' (Audio Security POC)
        All pub-required fields populated: title, problem_statement, what_was_explored, outcome_summary,
        maturity_level, review_status, reuse_potential, owner_name, owner_office, contributing_office,
        source_type, mission_area_tags (min 1), artifact_links (min 1), engagement_options (min 1),
        last_reviewed_date, executive_perspective_text, executive_recommendation
        Trust disclaimers triggered: POC≠production-ready (maturity=PROTOTYPE_PILOT), Published≠approved (state=PUBLISHED)
      verify: "grep -n 'PROTOTYPE_PILOT' db/seeds/seed_audio_security_poc.sql && grep -n 'TECHNICALLY_REVIEWED' db/seeds/seed_audio_security_poc.sql && grep -n 'GPU' db/seeds/seed_audio_security_poc.sql && grep -n 'Azure' db/seeds/seed_audio_security_poc.sql && echo CONTRACT_OK"
    - artifact: "db/seeds/seed_archived_experiment.sql"
      exports:
        - "innovation_record: archived stopped experiment — maturity_level=ARCHIVED, publication_state=ARCHIVED, source_type=I_AND_R"
        - "At least 1 record_key_findings and 1 record_artifact_links rows for completeness"
      shape: |
        Fixed UUID: '00000000-0000-0000-0000-000000000002' (Archived Experiment)
        Demonstrates honest institutional lifecycle per PRD §9 success metric:
        "at least 1 archived/stopped experiment record is published"
        maturity_level=ARCHIVED + publication_state=ARCHIVED (both set per PRD §6.1 governance rule)
      verify: "grep -n 'maturity_level.*ARCHIVED' db/seeds/seed_archived_experiment.sql || grep -n \"'ARCHIVED'\" db/seeds/seed_archived_experiment.sql && echo CONTRACT_OK"
    - artifact: "tests/integration/migration_boot.test.js"
      exports:
        - "Integration test: fresh PostgreSQL 16 container applies all migration files without error"
        - "Integration test: all 11 expected tables exist after migration (innovation_records, record_key_findings, record_artifact_links, record_tags, record_engagement_options, audit_log, users, hub_settings, opportunity_submissions, contribution_submissions, engagement_requests)"
        - "Integration test: hub_settings seed rows exist (4 rows including engagement_routing_email)"
        - "Integration test: Audio Security POC anchor record is queryable via catalog filter (publication_state=PUBLISHED)"
      shape: |
        Jest test file using node-postgres (pg) against Testcontainers PostgreSQL 16
        OR against the docker-compose db service via DATABASE_URL env variable.
        Tests pass iff all migrations apply cleanly and seed data is accessible.
        Wave 7b full Playwright suite depends on this test passing first.
      verify: "grep -n 'migration_boot\\|all.*tables.*exist\\|11.*tables' tests/integration/migration_boot.test.js || grep -n 'innovation_records' tests/integration/migration_boot.test.js && echo CONTRACT_OK"
---

<objective>
Create the seed data for the TSIO Innovation Hub MVP content set and verify that the full database stack boots cleanly on a fresh PostgreSQL 16 container. This plan delivers two essential outcomes:

1. **Seed Data — Audio Security POC Anchor Record (F4):** A complete, realistic `innovation_record` for the Audio Security POC effort — the first and most important MVP content record. This record exercises every governance requirement (all pub-required fields, key findings, artifact links, tags, engagement options, trust model signals) and will be the primary record used by Wave 7b's end-to-end Playwright tests. It represents TSIO I&R's existing Audio Security lessons-learned document as a structured Hub record without relocating the original.

2. **Seed Data — Archived/Stopped Experiment (F9/F0):** A second seed record with `maturity_level=ARCHIVED` and `publication_state=ARCHIVED` to demonstrate honest institutional lifecycle representation — a PRD §9 launch criterion. The catalog's honest display of stopped work is itself a trust signal.

3. **Migration Boot Integration Test (F0/F9):** A Node.js integration test confirming that the full migration sequence applies cleanly on a fresh PostgreSQL 16 container, all 11 expected tables exist, hub_settings seed rows are present, and the anchor record is discoverable via catalog query. This is the foundation Wave 7b's full Playwright suite relies on.

Purpose: The PRD §9 success metric "at least 3 fully published innovation records are live at launch, with the Audio Security POC as the first" and "at least 1 archived/stopped experiment record is published" are both data requirements — not code requirements. This plan is the only plan that can fulfill them. Without realistic seed data, Wave 7b Playwright tests have nothing to assert against, and the MVP catalog is empty at demo time.

Output:
- `db/seeds/seed_audio_security_poc.sql` — idempotent SQL for the Audio Security POC anchor record
- `db/seeds/seed_archived_experiment.sql` — idempotent SQL for the archived stopped experiment
- `db/seeds/run_seeds.sh` — shell script to apply seeds against the running container
- `tests/integration/migration_boot.test.js` — integration test verifying clean migration + seed on fresh PostgreSQL 16
</objective>

<feature_dependencies>
Implements: F4: Existing Lessons-Learned Integration (Audio Security POC anchor record wraps the existing SharePoint lessons-learned document in a structured Hub record without relocating the original), F0: Innovation Catalog (seeded published record is discoverable via catalog; archived record demonstrates lifecycle), F9: Content Maturity and Trust Model (all 5 maturity levels represented in seeds; all 4 trust disclaimer trigger conditions demonstrably exercised by anchor record)
Depends on: F0 (CatalogService — catalog query in boot test), F1 (search_vector populated via FTS triggers), F2 (innovation_records + child tables from Wave 1), F3 (executive/technical perspective fields seeded on anchor record), F5 (opportunity_submissions table present), F6 (contribution_submissions table present), F7 (engagement_requests + hub_settings tables present), F8 (users table present; seed inserts use system curator UUID), F9 (maturity/review CHECK constraints define valid values for seeds)
Enables: Wave 7b full Playwright suite (17-PLAN provides the realistic data corpus that end-to-end tests assert against)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@project_specs/PRD-TSIO-Innovation-Hub.md
@project_specs/JOURNEYS-TSIO-Innovation-Hub.md
@project_specs/RTM-TSIO-Innovation-Hub.md
@db/migrations/001_core_content_tables.sql
@db/migrations/002_supporting_tables.sql
@docker-compose.yml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create idempotent seed SQL for Audio Security POC anchor record and archived experiment</name>
  <files>
    db/seeds/seed_audio_security_poc.sql
    db/seeds/seed_archived_experiment.sql
    db/seeds/run_seeds.sh
  </files>
  <action>
Create `db/seeds/` directory and write three files.

---

### File 1: `db/seeds/seed_audio_security_poc.sql`

This is the MVP anchor record. It must populate **all pub-required fields** (per FRD F02a pub-required list) and reflect realistic Audio Security POC findings as described in PRD §7 F4 and the JOURNEYS doc (JRN-01.1, JRN-03.1).

**Fixed record UUID:** `'a0000000-0000-0000-0000-000000000001'` — stable across re-runs.

**Pub-required fields per RTM §4 F2:**
title, problem_statement, what_was_explored, outcome_summary, key_findings (min 1), maturity_level, review_status, reuse_potential, owner_name, owner_office, contributing_office, source_type, mission_area_tags (min 1), artifact_links (min 1), engagement_options (min 1), last_reviewed_date, executive_perspective_text, executive_recommendation.

**Trust model signals to exercise:**
- `maturity_level = 'PROTOTYPE_PILOT'` → triggers "POC ≠ production-ready" disclaimer (maturity IN EXPERIMENT_POC, PROTOTYPE_PILOT)
- `publication_state = 'PUBLISHED'` → triggers "Published ≠ approved for adoption" disclaimer (always on PUBLISHED)
- `source_type = 'I_AND_R'` → does NOT trigger community disclaimer
- `review_status = 'TECHNICALLY_REVIEWED'` → does NOT trigger validated-for-reuse disclaimer

**Key findings required per PRD F4:** GPU/CPU separation, Azure Government Cloud constraints, performance/latency limitations, production-readiness gaps.

Write this file:

```sql
-- =============================================================================
-- Seed: Audio Security POC — Anchor Record
-- TSIO Innovation Hub
-- Grounded in: PRD §7 F4, JOURNEYS JRN-01.1, JRN-03.1, RTM TEST-F4-09
-- Fixed UUID: a0000000-0000-0000-0000-000000000001
-- Idempotent: all INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

-- Seed user: system curator for attribution (seeded here; real curators upsert via OIDC)
INSERT INTO users (user_id, email, display_name, role, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'system-seed@tsio.courts.internal',
    'TSIO I&R Team (Seed)',
    'CURATOR',
    TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- Main innovation record
INSERT INTO innovation_records (
    record_id,
    title,
    problem_statement,
    what_was_explored,
    outcome_summary,
    reuse_guidance,
    short_summary,
    maturity_level,
    review_status,
    reuse_potential,
    source_type,
    owner_name,
    owner_office,
    contributing_office,
    contributor_attribution,
    executive_perspective_text,
    executive_recommendation,
    technical_perspective_text,
    security_findings,
    performance_findings,
    default_perspective,
    publication_state,
    last_reviewed_date,
    published_at,
    created_by_user_id,
    updated_by_user_id
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',

    -- title (VARCHAR 200, min 5)
    'Audio Security POC: Real-Time Audio Surveillance Detection in Federal Courtrooms',

    -- problem_statement (TEXT, min 50) — FTS weight A; JRN-03.1 "audio security" search anchor
    'Federal courtrooms face a growing risk from unauthorized audio recording devices concealed in courtroom environments. Detecting these devices in real time — without disrupting court proceedings — requires a technical approach that balances accuracy, performance, and operational constraints unique to federal facilities operating within Azure Government Cloud infrastructure.',

    -- what_was_explored (TEXT, min 50) — FTS weight B
    'The I&R team conducted a proof-of-concept evaluation of AI-assisted audio surveillance detection using GPU-accelerated signal processing to identify anomalous audio signatures indicative of concealed recording devices. The POC tested feasibility across three scenarios: controlled lab environment, simulated courtroom acoustics, and integration with existing Azure Government Cloud tenant constraints. The team evaluated GPU/CPU separation architectures, latency thresholds for real-time detection, and the boundaries of permissible compute environments under current AO security policy.',

    -- outcome_summary (TEXT, min 50) — FTS weight B
    'The POC demonstrated technical feasibility of AI-assisted audio surveillance detection with detection accuracy rates exceeding baseline thresholds in controlled environments. However, production deployment is not recommended at this time due to three critical gaps: (1) GPU infrastructure is not available in the standard Azure Government Cloud subscription tier used by most Judiciary facilities; (2) latency under realistic courtroom acoustic load exceeded acceptable real-time thresholds on CPU-only processing; and (3) the current AO security policy has not evaluated the AI model inference pipeline for compliance. The effort produced durable lessons on architectural constraints and a clear set of conditions under which production readiness could be achieved.',

    -- reuse_guidance (TEXT)
    'Courts evaluating audio security technology should note: (1) Dedicated GPU infrastructure must be provisioned before any deployment evaluation — standard Azure Government Cloud vCPU tiers are insufficient for real-time inference. (2) Courts operating under the standard AO Azure Government Cloud subscription must obtain a security review of the AI model inference pipeline before any production trial. (3) Network segmentation constraints in federal facility environments may limit sensor placement — a site-specific network assessment is required. (4) The I&R team recommends requesting a technical guidance session before initiating any local procurement or infrastructure assessment.',

    -- short_summary (VARCHAR 280)
    'POC evaluation of AI-assisted audio surveillance detection for federal courtrooms. Demonstrated feasibility with important GPU infrastructure and Azure Government Cloud constraints. Not recommended for production adoption without further security review and infrastructure investment.',

    -- maturity_level — PROTOTYPE_PILOT triggers "POC ≠ production-ready" disclaimer
    'PROTOTYPE_PILOT',

    -- review_status — TECHNICALLY_REVIEWED; no security/policy review yet
    'TECHNICALLY_REVIEWED',

    -- reuse_potential
    'MEDIUM',

    -- source_type — I_AND_R conducted work
    'I_AND_R',

    -- owner_name
    'TSIO Innovation & Research Branch',

    -- owner_office
    'Technology Solutions & Innovation Office (TSIO)',

    -- contributing_office
    'Technology Solutions & Innovation Office (TSIO)',

    -- contributor_attribution
    'TSIO I&R team conducted the POC evaluation. Audio security domain expertise provided by TSIO cybersecurity staff.',

    -- executive_perspective_text — F3 pub-required; grounded in JRN-01.1 "Executive Perspective"
    'The Audio Security POC addresses a real and growing mission risk: unauthorized audio recording in federal courtroom environments. The I&R team has validated that AI-assisted detection is technically feasible and has identified the specific conditions under which a production-grade solution could be deployed. This work does not constitute a deployed solution — it is a structured set of findings that can inform a future investment decision. Senior leaders considering courtroom audio security investments should use this record to understand what has already been evaluated, what gaps remain, and what a realistic path to production deployment would require.',

    -- executive_recommendation — F3 pub-required; grounded in JRN-01.1 "Decision Recommendation"
    'This effort is at Prototype/Pilot maturity stage. Production adoption is not recommended at this time. The findings identify three prerequisites that must be addressed before a production trial: dedicated GPU infrastructure, an AO security review of the AI inference pipeline, and a site-specific network assessment. Courts with active audio security concerns should request a technical guidance session with I&R to understand the full implications before initiating any procurement.',

    -- technical_perspective_text
    'The POC used a transformer-based audio anomaly detection model deployed in a Docker container on a GPU-provisioned Azure VM. Signal acquisition used low-power RF sensors integrated with the Azure IoT Hub SDK. The inference pipeline required NVIDIA CUDA 11.x and a minimum of 8GB VRAM for real-time processing at courtroom-scale audio sampling rates (48kHz stereo, 16-channel). CPU-only fallback was tested but produced latency of 340ms average (target: <50ms). The Azure Government Cloud tenant constraints prohibited deployment of the inference container in the standard Government Community Cloud (GCC) tier — the model requires a dedicated compute environment not available under standard subscription terms.',

    -- security_findings
    'Security review has NOT been completed for this effort. Known security considerations include: (1) The AI inference model pipeline has not been evaluated by the AO cybersecurity team or an ISSO — required before any production deployment. (2) RF sensor integration with Azure IoT Hub introduces a network ingress point that requires security assessment under the facility''s network segmentation policy. (3) Audio signal data processed by the model may constitute sensitive court proceeding content — data classification and retention policies must be established before deployment. Courts must conduct their own local security assessment.',

    -- performance_findings
    'CPU-only inference: average 340ms latency (unacceptable for real-time detection; target <50ms). GPU-accelerated inference (NVIDIA A10G): average 18ms latency (within target). Model accuracy in controlled lab: 94.2% detection rate at 0.3% false positive rate. Model accuracy in simulated courtroom acoustic load (ambient HVAC + proceedings audio): 87.1% detection rate at 1.1% false positive rate. Performance degrades measurably in high-reverb environments. No production load testing was conducted.',

    -- default_perspective — executive by default (per PRD design principle; F3)
    'EXECUTIVE',

    -- publication_state — PUBLISHED; triggers "Published ≠ approved for adoption" disclaimer
    'PUBLISHED',

    -- last_reviewed_date
    '2025-06-15',

    -- published_at
    NOW(),

    -- created_by_user_id / updated_by_user_id — seed curator UUID
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (record_id) DO NOTHING;

-- Key findings (min 1 for publication; 4 required per PRD F4 + RTM TEST-F4-09)
-- Covers: GPU/CPU separation, Azure Gov Cloud constraints, performance/latency, production-readiness gaps
INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'GPU/CPU separation is a hard architectural requirement: real-time inference requires dedicated GPU provisioning (NVIDIA A10G or equivalent with CUDA 11.x+). CPU-only processing produced 340ms average latency — 6.8x over the 50ms real-time threshold. Any deployment evaluation must begin with GPU infrastructure procurement.',
        1
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Azure Government Cloud constraints block standard deployment: the AI inference container requires a dedicated compute environment not available in standard Government Community Cloud (GCC) subscription tiers. Courts on standard AO Azure Gov subscriptions cannot deploy without a subscription tier change or dedicated inference endpoint provisioning.',
        2
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'Performance and accuracy degrade under realistic courtroom conditions: GPU-accelerated accuracy drops from 94.2% (controlled lab) to 87.1% (simulated courtroom acoustic load) with false positive rate increasing from 0.3% to 1.1%. High-reverb courtroom environments require acoustic calibration and potentially model fine-tuning before reliable operational use.',
        3
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'Three production-readiness gaps must be closed before any deployment: (1) AO cybersecurity/ISSO security review of the AI inference pipeline — not yet conducted; (2) data classification and retention policy for processed audio signals — not yet established; (3) site-specific network segmentation assessment for RF sensor placement — required per facility security policy. None of these gaps can be waived.',
        4
    )
ON CONFLICT (finding_id) DO NOTHING;

-- Artifact link — links to authoritative SharePoint document per F4 design principle
INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Audio Security POC Lessons Learned Document — SharePoint',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-AudioSecurity-LessonsLearned-2025.pdf',
        'DOCUMENT',
        1
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Audio Security POC Architecture Diagram — SharePoint',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-AudioSecurity-ArchDiagram-2025.vsdx',
        'DIAGRAM',
        2
    )
ON CONFLICT (link_id) DO NOTHING;

-- Tags — mission area + technology area (both required for catalog filtering per F0)
INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'MISSION_AREA',
        'Courtroom Security',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'MISSION_AREA',
        'Physical Security Technology',
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'AI/ML — Audio Analysis',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'Azure Government Cloud',
        2
    ),
    (
        'd0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000001',
        'TECHNOLOGY_AREA',
        'GPU Computing',
        3
    )
ON CONFLICT (tag_id) DO NOTHING;

-- Engagement options — 3 options per F7 design; REQUEST_TECHNICAL_GUIDANCE prominent per JRN-03.2
INSERT INTO record_engagement_options (option_id, record_id, option_type, display_order)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_BRIEFING',
        1
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_TECHNICAL_GUIDANCE',
        2
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'REQUEST_DEMO',
        3
    )
ON CONFLICT (record_id, option_type) DO NOTHING;

-- =============================================================================
-- End: seed_audio_security_poc.sql
-- =============================================================================
```

---

### File 2: `db/seeds/seed_archived_experiment.sql`

This satisfies PRD §9 success metric: "at least 1 archived/stopped experiment record is published, demonstrating honest lifecycle representation."

Per PRD §6.1: `maturity_level=ARCHIVED` signals innovation work is no longer active. Per §6.4: `publication_state=ARCHIVED` signals the Hub record is removed from default catalog browse. When retiring work, curators should set both. This seed sets both.

The experiment subject: a stopped proof-of-concept for automated case scheduling optimization — a realistic candidate for an early stopped I&R experiment.

```sql
-- =============================================================================
-- Seed: Archived Experiment — Automated Case Scheduling Optimization POC
-- TSIO Innovation Hub
-- Grounded in: PRD §9 "at least 1 archived/stopped experiment record"
-- PRD §6.1: maturity_level=ARCHIVED + PRD §6.4: publication_state=ARCHIVED
-- Fixed UUID: a0000000-0000-0000-0000-000000000002
-- Idempotent: all INSERTs use ON CONFLICT DO NOTHING
-- =============================================================================

-- Seed user from poc seed (if not already seeded)
INSERT INTO users (user_id, email, display_name, role, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'system-seed@tsio.courts.internal',
    'TSIO I&R Team (Seed)',
    'CURATOR',
    TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- Archived experiment record
INSERT INTO innovation_records (
    record_id,
    title,
    problem_statement,
    what_was_explored,
    outcome_summary,
    reuse_guidance,
    short_summary,
    maturity_level,
    review_status,
    reuse_potential,
    source_type,
    owner_name,
    owner_office,
    contributing_office,
    executive_perspective_text,
    executive_recommendation,
    default_perspective,
    publication_state,
    last_reviewed_date,
    published_at,
    created_by_user_id,
    updated_by_user_id
)
VALUES (
    'a0000000-0000-0000-0000-000000000002',

    'Automated Case Scheduling Optimization POC (Archived)',

    'Federal courts face persistent scheduling inefficiencies due to manual coordination across judges, attorneys, courtrooms, and court staff. This effort explored whether AI-assisted scheduling optimization could reduce scheduling conflicts and continuances without displacing the human judgment required for complex case management decisions.',

    'The I&R team evaluated ML-based constraint satisfaction scheduling algorithms against a synthetic dataset derived from anonymized docket patterns. Two commercial scheduling optimization libraries were assessed alongside a custom constraint solver prototype. The effort was stopped at the early experiment stage after it became clear that court-specific scheduling constraints (e.g., judicial availability, mandatory appearance requirements, case type priority rules) varied too significantly across districts to support a general-purpose model without district-specific configuration investment that exceeded the POC scope.',

    'The experiment was stopped. The core finding is that general-purpose AI scheduling optimization is not viable across the Judiciary without significant district-specific configuration investment. The effort produced useful negative findings: what categories of scheduling constraints resist automation, and which configuration burden factors make general solutions impractical for a decentralized court system. No production deployment was ever intended. This record is retained for institutional learning.',

    'This effort is archived. The findings are retained to inform future scheduling technology evaluations. Courts exploring scheduling efficiency should review the documented constraint categories before evaluating any vendor scheduling solution — the negative findings from this POC identify the key questions any vendor must answer.',

    'Stopped experiment: AI-assisted case scheduling optimization. Archived after early POC stage due to district-specific constraint variability. Retained for institutional learning. Not recommended for reuse.',

    -- maturity_level = ARCHIVED (innovation work is no longer active)
    'ARCHIVED',

    -- review_status = CURATED (curator structured it; no external review)
    'CURATED',

    'LOW',
    'I_AND_R',

    'TSIO Innovation & Research Branch',
    'Technology Solutions & Innovation Office (TSIO)',
    'Technology Solutions & Innovation Office (TSIO)',

    'The I&R team explored whether AI-based scheduling optimization could reduce court scheduling inefficiencies. The experiment was stopped at the early POC stage. The work did not produce a deployable solution, but it produced structured findings about why general-purpose AI scheduling tools do not translate well to the Judiciary''s decentralized court system. This record is retained so future leaders do not commission duplicate work.',

    'This effort has been archived. No adoption or further investment is recommended. The archived findings are available to inform future scheduling technology evaluations. If your court is actively exploring scheduling efficiency, request a technical guidance session to understand the documented constraint categories before engaging vendors.',

    'EXECUTIVE',

    -- publication_state = ARCHIVED (removed from default catalog browse per PRD §6.4)
    'ARCHIVED',

    '2024-11-30',
    NOW(),
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (record_id) DO NOTHING;

-- Key findings for archived experiment
INSERT INTO record_key_findings (finding_id, record_id, finding_text, display_order)
VALUES
    (
        'b0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'District-specific scheduling constraint variability is the primary barrier to general AI scheduling solutions: mandatory appearance rules, judicial recusal patterns, and case type priority overrides differ significantly across districts and cannot be abstracted into a shared model without substantial per-district configuration investment.',
        1
    ),
    (
        'b0000000-0000-0000-0000-000000000012',
        'a0000000-0000-0000-0000-000000000002',
        'Negative finding retained for institutional learning: general-purpose commercial scheduling optimization tools evaluated during this effort could not accommodate the full range of mandatory judicial scheduling constraints without custom integration work estimated to exceed the value of automation at district scale.',
        2
    )
ON CONFLICT (finding_id) DO NOTHING;

-- Artifact link
INSERT INTO record_artifact_links (link_id, record_id, label, url, artifact_type, display_order)
VALUES
    (
        'c0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'Automated Scheduling POC — Termination Summary (SharePoint)',
        'https://ao.sharepoint.com/sites/TSIO-IR/Shared%20Documents/POC-Scheduling-TerminationSummary-2024.pdf',
        'DOCUMENT',
        1
    )
ON CONFLICT (link_id) DO NOTHING;

-- Tags
INSERT INTO record_tags (tag_id, record_id, tag_type, tag_value, display_order)
VALUES
    (
        'd0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000002',
        'MISSION_AREA',
        'Case Management',
        1
    ),
    (
        'd0000000-0000-0000-0000-000000000012',
        'a0000000-0000-0000-0000-000000000002',
        'TECHNOLOGY_AREA',
        'AI/ML — Optimization',
        1
    )
ON CONFLICT (tag_id) DO NOTHING;

-- =============================================================================
-- End: seed_archived_experiment.sql
-- =============================================================================
```

---

### File 3: `db/seeds/run_seeds.sh`

```bash
#!/usr/bin/env bash
# =============================================================================
# run_seeds.sh — Apply all TSIO Innovation Hub seed files
# Usage: ./db/seeds/run_seeds.sh
# Requires: docker-compose.yml + running 'db' service (docker compose up -d db)
# Idempotent: safe to run multiple times
# =============================================================================

set -euo pipefail

COMPOSE_CMD="docker compose"
DB_SERVICE="db"
DB_USER="tsio_hub_user"
DB_NAME="tsio_hub"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying seed: seed_audio_security_poc.sql"
$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" \
  < "$SCRIPT_DIR/seed_audio_security_poc.sql"

echo "Applying seed: seed_archived_experiment.sql"
$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" \
  < "$SCRIPT_DIR/seed_archived_experiment.sql"

echo ""
echo "Seed complete. Verifying..."

$COMPOSE_CMD exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT record_id, title, maturity_level, review_status, publication_state FROM innovation_records ORDER BY created_at;"

echo ""
echo "Seed verification complete."
```

Make the script executable: `chmod +x db/seeds/run_seeds.sh`

**Important idempotency design decisions:**
- All `INSERT` statements use `ON CONFLICT (record_id) DO NOTHING` or `ON CONFLICT (finding_id) DO NOTHING` — running seeds twice produces no errors and no duplicates.
- Fixed UUIDs (a0000000-..., b0000000-..., etc.) ensure stable references across seed runs, test environments, and Wave 7b Playwright fixture setup.
- The seed curator user (`f0000000-0000-0000-0000-000000000001`) satisfies the `NOT NULL` constraint on `created_by_user_id` and `updated_by_user_id` in `innovation_records` without requiring a real OIDC login flow.
- `hub_settings` seed is already handled in `002_supporting_tables.sql` (engagement_routing_email, contact_display_email, catalog_default_page_size, default_perspective) — this task does NOT re-insert those rows.
  </action>
  <verify>
```bash
# Verify all three seed files exist
ls -la db/seeds/seed_audio_security_poc.sql db/seeds/seed_archived_experiment.sql db/seeds/run_seeds.sh && echo "FILES_EXIST"

# Verify anchor record has all required trust model values
grep -c "PROTOTYPE_PILOT" db/seeds/seed_audio_security_poc.sql && \
grep -c "TECHNICALLY_REVIEWED" db/seeds/seed_audio_security_poc.sql && \
grep -c "PUBLISHED" db/seeds/seed_audio_security_poc.sql && \
grep -c "'I_AND_R'" db/seeds/seed_audio_security_poc.sql && echo "TRUST_MODEL_VALUES_OK"

# Verify all 4 required key finding topics are present
grep -i "GPU" db/seeds/seed_audio_security_poc.sql && \
grep -i "Azure" db/seeds/seed_audio_security_poc.sql && \
grep -i "performance\|latency" db/seeds/seed_audio_security_poc.sql && \
grep -i "production.readiness\|production-readiness" db/seeds/seed_audio_security_poc.sql && echo "KEY_FINDINGS_TOPICS_OK"

# Verify anchor has executive fields (pub-required per FRD F02a)
grep -c "executive_perspective_text" db/seeds/seed_audio_security_poc.sql && \
grep -c "executive_recommendation" db/seeds/seed_audio_security_poc.sql && echo "EXECUTIVE_FIELDS_OK"

# Verify engagement options (REQUEST_BRIEFING, REQUEST_TECHNICAL_GUIDANCE, REQUEST_DEMO)
grep -c "REQUEST_BRIEFING" db/seeds/seed_audio_security_poc.sql && \
grep -c "REQUEST_TECHNICAL_GUIDANCE" db/seeds/seed_audio_security_poc.sql && \
grep -c "REQUEST_DEMO" db/seeds/seed_audio_security_poc.sql && echo "ENGAGEMENT_OPTIONS_OK"

# Verify archived record has both ARCHIVED values
grep "maturity_level.*'ARCHIVED'\|'ARCHIVED'.*maturity" db/seeds/seed_archived_experiment.sql || \
  grep "'ARCHIVED'" db/seeds/seed_archived_experiment.sql | wc -l && echo "ARCHIVED_VALUES_OK"

# Verify idempotency pattern
grep -c "ON CONFLICT" db/seeds/seed_audio_security_poc.sql && \
grep -c "ON CONFLICT" db/seeds/seed_archived_experiment.sql && echo "IDEMPOTENT_OK"

# Verify run_seeds.sh is executable and has correct content
test -x db/seeds/run_seeds.sh && grep "psql" db/seeds/run_seeds.sh && echo "SEED_SCRIPT_OK"
```
  </verify>
  <done>
- `db/seeds/seed_audio_security_poc.sql` exists with:
  - Fixed UUID `a0000000-0000-0000-0000-000000000001`
  - All pub-required fields populated: title, problem_statement, what_was_explored, outcome_summary, maturity_level, review_status, reuse_potential, owner_name, owner_office, contributing_office, source_type, executive_perspective_text, executive_recommendation, last_reviewed_date
  - `maturity_level='PROTOTYPE_PILOT'` (triggers POC≠production-ready disclaimer)
  - `publication_state='PUBLISHED'` (triggers Published≠approved disclaimer)
  - `review_status='TECHNICALLY_REVIEWED'` (realistic: technically reviewed but not security/policy reviewed)
  - 4 `record_key_findings` rows covering GPU/CPU separation, Azure Government Cloud constraints, performance/latency, production-readiness gaps (per RTM TEST-F4-09)
  - 2 `record_artifact_links` rows (DOCUMENT + DIAGRAM, both HTTPS SharePoint URLs)
  - 5 `record_tags` rows (2 MISSION_AREA, 3 TECHNOLOGY_AREA)
  - 3 `record_engagement_options` rows (REQUEST_BRIEFING, REQUEST_TECHNICAL_GUIDANCE, REQUEST_DEMO)
  - All INSERTs use `ON CONFLICT (id) DO NOTHING` for idempotency
- `db/seeds/seed_archived_experiment.sql` exists with:
  - Fixed UUID `a0000000-0000-0000-0000-000000000002`
  - `maturity_level='ARCHIVED'` AND `publication_state='ARCHIVED'` (both set per PRD §6.1 governance rule)
  - Realistic stopped experiment content (automated case scheduling optimization)
  - 2 `record_key_findings`, 1 `record_artifact_links`, 2 `record_tags` rows
  - All INSERTs use `ON CONFLICT DO NOTHING`
- `db/seeds/run_seeds.sh` exists, is executable (`chmod +x`), applies both seed files in order against the running `db` docker compose service, and runs a verification SELECT at the end
  </done>
</task>

<task type="auto">
  <name>Task 2: Create migration boot integration test verifying clean migration + seed on fresh PostgreSQL 16</name>
  <files>tests/integration/migration_boot.test.js</files>
  <action>
Create `tests/integration/migration_boot.test.js` — a Jest integration test that:
1. Connects to the PostgreSQL instance (via `DATABASE_URL` environment variable pointing at the docker-compose `db` service, OR via a fresh Docker container started by the test)
2. Applies all migration files from `db/migrations/` in alphabetical order
3. Applies both seed files from `db/seeds/`
4. Asserts all 11 expected tables exist
5. Asserts `hub_settings` has at least 4 rows
6. Asserts the Audio Security POC anchor record is queryable and discoverable via catalog filter (publication_state=PUBLISHED)
7. Asserts the archived experiment record exists with the correct maturity_level and publication_state
8. Asserts the anchor record's search_vector is non-null (FTS triggers fired)

**Implementation approach:** Use the `pg` package (node-postgres) which is already in `package.json` from Wave 2 (plan 03). Connect via `process.env.DATABASE_URL` — this allows the test to run against either the docker-compose `db` service (for local development) or a fresh container in CI.

Write `tests/integration/migration_boot.test.js`:

```javascript
/**
 * Migration Boot Integration Test
 * TSIO Innovation Hub — Wave 7a
 *
 * Verifies:
 * 1. All 11 DB tables exist after migration
 * 2. hub_settings seed rows present (including engagement_routing_email)
 * 3. Audio Security POC anchor record is PUBLISHED and discoverable
 * 4. Archived experiment record is ARCHIVED
 * 5. Anchor record search_vector is non-null (FTS triggers fired during seeding)
 *
 * Requires: Running PostgreSQL 16 accessible via DATABASE_URL env var
 * with all migrations and seeds already applied (run `docker compose up -d db`
 * then `./db/seeds/run_seeds.sh` before running this test).
 *
 * CI: Set DATABASE_URL in CI environment to point at a fresh PostgreSQL 16 container
 * with migrations applied.
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub';

let pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL });
  // Verify connection
  await pool.query('SELECT 1');
}, 30000);

afterAll(async () => {
  if (pool) await pool.end();
});

describe('Migration boot: all 11 tables exist', () => {
  const expectedTables = [
    'innovation_records',
    'record_key_findings',
    'record_artifact_links',
    'record_tags',
    'record_engagement_options',
    'audit_log',
    'users',
    'hub_settings',
    'opportunity_submissions',
    'contribution_submissions',
    'engagement_requests',
  ];

  test('all 11 expected tables exist in public schema', async () => {
    const result = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name`,
      [expectedTables]
    );
    const foundTables = result.rows.map((r) => r.table_name).sort();
    expect(foundTables).toEqual([...expectedTables].sort());
  });

  test('innovation_records has all required CHECK constraints (maturity_level, review_status, publication_state)', async () => {
    const result = await pool.query(
      `SELECT conname
         FROM pg_constraint
        WHERE conrelid = 'innovation_records'::regclass
          AND contype = 'c'
          AND conname LIKE '%maturity%' OR conname LIKE '%review%' OR conname LIKE '%publication%'
        ORDER BY conname`
    );
    // At minimum, the CHECK constraint for maturity_level, review_status, and publication_state exist
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });

  test('GIN index idx_innovation_records_fts exists on search_vector', async () => {
    const result = await pool.query(
      `SELECT indexname
         FROM pg_indexes
        WHERE tablename = 'innovation_records'
          AND indexname = 'idx_innovation_records_fts'`
    );
    expect(result.rows).toHaveLength(1);
  });
});

describe('hub_settings seed data', () => {
  test('hub_settings has at least 4 rows', async () => {
    const result = await pool.query('SELECT count(*) AS cnt FROM hub_settings');
    expect(parseInt(result.rows[0].cnt)).toBeGreaterThanOrEqual(4);
  });

  test('engagement_routing_email setting exists with correct initial value', async () => {
    const result = await pool.query(
      `SELECT setting_value FROM hub_settings WHERE setting_key = 'engagement_routing_email'`
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].setting_value).toBe('AOml_TSO_IRB_Team@ao.uscourts.gov');
  });
});

describe('Audio Security POC anchor record (F4)', () => {
  const ANCHOR_UUID = 'a0000000-0000-0000-0000-000000000001';

  test('anchor record exists with correct trust model values', async () => {
    const result = await pool.query(
      `SELECT record_id, title, maturity_level, review_status, publication_state, source_type
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    const record = result.rows[0];
    expect(record.maturity_level).toBe('PROTOTYPE_PILOT');
    expect(record.review_status).toBe('TECHNICALLY_REVIEWED');
    expect(record.publication_state).toBe('PUBLISHED');
    expect(record.source_type).toBe('I_AND_R');
  });

  test('anchor record is discoverable via catalog query (publication_state=PUBLISHED, deleted_at IS NULL)', async () => {
    const result = await pool.query(
      `SELECT record_id, title
         FROM innovation_records
        WHERE publication_state = 'PUBLISHED'
          AND deleted_at IS NULL
          AND record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toContain('Audio Security');
  });

  test('anchor record has exactly 4 key findings (GPU, Azure, performance, production-readiness)', async () => {
    const result = await pool.query(
      `SELECT finding_text FROM record_key_findings WHERE record_id = $1 ORDER BY display_order`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(4);
    const allText = result.rows.map((r) => r.finding_text).join(' ');
    // Each required finding topic from PRD F4 + RTM TEST-F4-09
    expect(allText).toMatch(/GPU/i);
    expect(allText).toMatch(/Azure/i);
    expect(allText).toMatch(/latency|performance/i);
    expect(allText).toMatch(/production.readiness|production-readiness/i);
  });

  test('anchor record has at least 1 artifact link (HTTPS DOCUMENT to SharePoint)', async () => {
    const result = await pool.query(
      `SELECT label, url, artifact_type
         FROM record_artifact_links
        WHERE record_id = $1
          AND artifact_type = 'DOCUMENT'`,
      [ANCHOR_UUID]
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    expect(result.rows[0].url).toMatch(/^https:\/\//);
    expect(result.rows[0].url).toMatch(/sharepoint\.com/);
  });

  test('anchor record has at least 1 MISSION_AREA and 1 TECHNOLOGY_AREA tag', async () => {
    const missionResult = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'MISSION_AREA'`,
      [ANCHOR_UUID]
    );
    const techResult = await pool.query(
      `SELECT tag_value FROM record_tags WHERE record_id = $1 AND tag_type = 'TECHNOLOGY_AREA'`,
      [ANCHOR_UUID]
    );
    expect(missionResult.rows.length).toBeGreaterThanOrEqual(1);
    expect(techResult.rows.length).toBeGreaterThanOrEqual(1);
  });

  test('anchor record has engagement options including REQUEST_BRIEFING and REQUEST_TECHNICAL_GUIDANCE', async () => {
    const result = await pool.query(
      `SELECT option_type FROM record_engagement_options WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    const types = result.rows.map((r) => r.option_type);
    expect(types).toContain('REQUEST_BRIEFING');
    expect(types).toContain('REQUEST_TECHNICAL_GUIDANCE');
  });

  test('anchor record search_vector is non-null (FTS triggers fired during seed)', async () => {
    const result = await pool.query(
      `SELECT search_vector IS NOT NULL AS has_fts
         FROM innovation_records
        WHERE record_id = $1`,
      [ANCHOR_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].has_fts).toBe(true);
  });

  test('FTS search for "audio security" returns anchor record (search_vector @@ plainto_tsquery)', async () => {
    const result = await pool.query(
      `SELECT record_id, title
         FROM innovation_records
        WHERE search_vector @@ plainto_tsquery('english', 'audio security')
          AND publication_state = 'PUBLISHED'
          AND deleted_at IS NULL`
    );
    const ids = result.rows.map((r) => r.record_id);
    expect(ids).toContain(ANCHOR_UUID);
  });
});

describe('Archived experiment record (F0/F9 honest lifecycle)', () => {
  const ARCHIVED_UUID = 'a0000000-0000-0000-0000-000000000002';

  test('archived experiment record exists with maturity_level=ARCHIVED and publication_state=ARCHIVED', async () => {
    const result = await pool.query(
      `SELECT record_id, maturity_level, publication_state
         FROM innovation_records
        WHERE record_id = $1`,
      [ARCHIVED_UUID]
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].maturity_level).toBe('ARCHIVED');
    expect(result.rows[0].publication_state).toBe('ARCHIVED');
  });

  test('archived record does NOT appear in default catalog query (publication_state=PUBLISHED)', async () => {
    const result = await pool.query(
      `SELECT record_id
         FROM innovation_records
        WHERE publication_state = 'PUBLISHED'
          AND record_id = $1`,
      [ARCHIVED_UUID]
    );
    // Archived records must NOT appear in public catalog browse
    expect(result.rows).toHaveLength(0);
  });
});

describe('Idempotency: seed can be re-applied without errors', () => {
  test('re-applying seed_audio_security_poc UUID insert returns no error (ON CONFLICT DO NOTHING)', async () => {
    // Attempt duplicate insert of anchor UUID — must succeed silently
    await expect(
      pool.query(
        `INSERT INTO innovation_records (
            record_id, title, problem_statement, what_was_explored, outcome_summary,
            maturity_level, review_status, reuse_potential, source_type,
            owner_name, owner_office, contributing_office,
            default_perspective, publication_state, last_reviewed_date,
            published_at, created_by_user_id, updated_by_user_id
         ) VALUES (
            'a0000000-0000-0000-0000-000000000001',
            'Duplicate title', 'x' || repeat('y', 49), 'x' || repeat('y', 49),
            'x' || repeat('y', 49), 'PROTOTYPE_PILOT', 'TECHNICALLY_REVIEWED',
            'MEDIUM', 'I_AND_R', 'Owner', 'Office', 'Office',
            'EXECUTIVE', 'PUBLISHED', '2025-06-15', NOW(),
            'f0000000-0000-0000-0000-000000000001',
            'f0000000-0000-0000-0000-000000000001'
         ) ON CONFLICT (record_id) DO NOTHING`
      )
    ).resolves.not.toThrow();
  });
});
```
  </action>
  <verify>
```bash
# Verify the test file exists and has correct structure
ls -la tests/integration/migration_boot.test.js && echo "FILE_EXISTS"

# Verify key test topics are present
grep -c "describe" tests/integration/migration_boot.test.js && \
grep -c "test(" tests/integration/migration_boot.test.js && echo "TEST_STRUCTURE_OK"

# Verify it references the anchor UUID
grep "a0000000-0000-0000-0000-000000000001" tests/integration/migration_boot.test.js && echo "ANCHOR_UUID_OK"

# Verify it references the archived UUID
grep "a0000000-0000-0000-0000-000000000002" tests/integration/migration_boot.test.js && echo "ARCHIVED_UUID_OK"

# Verify it tests all 11 tables
grep "11" tests/integration/migration_boot.test.js && echo "TABLE_COUNT_OK"

# Verify it tests FTS search_vector
grep "search_vector\|plainto_tsquery" tests/integration/migration_boot.test.js && echo "FTS_TEST_OK"

# Verify it tests engagement_routing_email (hub_settings seed)
grep "engagement_routing_email\|AOml_TSO_IRB_Team" tests/integration/migration_boot.test.js && echo "SETTINGS_SEED_OK"

# Run the test against the running docker-compose db service
# (Requires: docker compose up -d db && ./db/seeds/run_seeds.sh to have run first)
DATABASE_URL="postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub" \
  npx jest tests/integration/migration_boot.test.js --testTimeout=30000 2>&1 | tail -20 && echo "MIGRATION_BOOT_TEST_PASSED"
```
  </verify>
  <done>
- `tests/integration/migration_boot.test.js` exists with:
  - `beforeAll` connecting to PostgreSQL via `DATABASE_URL` env var (defaults to docker-compose connection string)
  - `afterAll` closing the connection pool
  - Test group 1 — "Migration boot: all 11 tables exist": asserts all 11 expected tables are present, GIN index exists, CHECK constraints exist
  - Test group 2 — "hub_settings seed data": asserts ≥4 rows, `engagement_routing_email` = `'AOml_TSO_IRB_Team@ao.uscourts.gov'`
  - Test group 3 — "Audio Security POC anchor record (F4)": asserts record exists with correct maturity/review/publication/source_type values; discoverable via catalog query; has ≥4 key findings covering GPU, Azure, latency/performance, production-readiness; has DOCUMENT artifact link to SharePoint HTTPS URL; has MISSION_AREA + TECHNOLOGY_AREA tags; has REQUEST_BRIEFING + REQUEST_TECHNICAL_GUIDANCE engagement options; search_vector is non-null; FTS query for "audio security" returns the anchor record
  - Test group 4 — "Archived experiment record (F0/F9 honest lifecycle)": asserts maturity=ARCHIVED, publication_state=ARCHIVED; does NOT appear in default PUBLISHED catalog query
  - Test group 5 — "Idempotency": duplicate insert with `ON CONFLICT DO NOTHING` resolves without error
  - All tests use the `pg` Pool client (already in package.json from Wave 2)
  - Test passes when run via: `DATABASE_URL=... npx jest tests/integration/migration_boot.test.js`
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| seed-file→postgres | Seed SQL files cross from repo into PostgreSQL during seed execution; fixed UUIDs and content are trusted but must not inadvertently expose PII or credentials |
| test→postgres | Integration test connects to PostgreSQL via DATABASE_URL env var; connection string must not contain production credentials |
| seed-content→catalog | Seeded innovation_records content becomes the public-facing catalog corpus; misleading maturity/review values would constitute trust model violation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-17-01 | Information Disclosure | seed curator user `system-seed@tsio.courts.internal` inserted into `users` table | accept | This is a synthetic seed user for dev/test environments only. Production environments must NOT run seed files against live databases. `run_seeds.sh` is for development/demo use — it must be excluded from any production deployment pipeline. Residual risk: dev only; owner: deployment pipeline owner. |
| T-17-02 | Tampering | Seed SQL `ON CONFLICT DO NOTHING` pattern — could mask a diverged anchor record if a different seed was applied first with the same fixed UUID | mitigate | Fixed UUIDs (a0000000-...) are prefixed with all-zeros except the last segment — namespace-safe for dev/test. The integration test (migration_boot.test.js) asserts the specific field values of the anchor record; a diverged row would cause test failures, surfacing the tampering before Wave 7b Playwright tests run. |
| T-17-03 | Information Disclosure | `DATABASE_URL` in integration test — must not contain production credentials | mitigate | `tests/integration/migration_boot.test.js` defaults `DATABASE_URL` to the docker-compose dev connection string (`tsio_hub_dev_password`). CI environments must inject `DATABASE_URL` via secret manager — never hardcoded. `.env` files containing `DATABASE_URL` must be in `.gitignore`. |
| T-17-04 | Spoofing / Trust Erosion | Seed data `maturity_level`, `review_status`, and `publication_state` values — if incorrect, the trust model signals displayed to catalog users would be misleading | mitigate | Seed file inserts `PROTOTYPE_PILOT` (not `PRODUCTION_VALIDATED`) and `TECHNICALLY_REVIEWED` (not `VALIDATED_FOR_REUSE`) — intentionally conservative values per PRD §9 "zero incidents of stakeholder misinterpreting a POC-level record as production-ready." The migration_boot test asserts these exact values, making divergence immediately visible. |
| T-17-05 | Elevation of Privilege | Seed curator UUID (`f0000000-...`) inserted into `users` table with `role='CURATOR'` | mitigate | Seed curator is inserted with `role='CURATOR'` (not `'ADMIN'`). In production, the seed user must either be deleted post-seeding or the users table must be populated exclusively via OIDC upsert (AuthMiddleware, Wave 3a plan 06). The `run_seeds.sh` script is explicitly scoped for development/demo environments only — not production migration. |
</threat_model>

<verification>
After both tasks complete, run the following verification sequence:

```bash
# 1. Verify all seed files exist
ls -la db/seeds/seed_audio_security_poc.sql db/seeds/seed_archived_experiment.sql db/seeds/run_seeds.sh && echo "SEED_FILES_OK"

# 2. Verify test file exists
ls -la tests/integration/migration_boot.test.js && echo "TEST_FILE_OK"

# 3. Verify idempotency pattern in seeds
grep -c "ON CONFLICT" db/seeds/seed_audio_security_poc.sql && \
grep -c "ON CONFLICT" db/seeds/seed_archived_experiment.sql && echo "IDEMPOTENT_PATTERN_OK"

# 4. Verify trust model values (must match PRD §6 + RTM §4 F9 exactly)
grep "'PROTOTYPE_PILOT'" db/seeds/seed_audio_security_poc.sql && \
grep "'TECHNICALLY_REVIEWED'" db/seeds/seed_audio_security_poc.sql && \
grep "'PUBLISHED'" db/seeds/seed_audio_security_poc.sql && \
grep "'I_AND_R'" db/seeds/seed_audio_security_poc.sql && echo "TRUST_MODEL_OK"

# 5. Verify all 4 key finding topics (RTM TEST-F4-09)
grep -i "GPU" db/seeds/seed_audio_security_poc.sql && \
grep -i "Azure" db/seeds/seed_audio_security_poc.sql && \
grep -i "latency\|performance" db/seeds/seed_audio_security_poc.sql && \
grep -i "production" db/seeds/seed_audio_security_poc.sql && echo "KEY_FINDINGS_TOPICS_OK"

# 6. Verify archived record has both ARCHIVED values (PRD §6.1 + §6.4)
grep -c "'ARCHIVED'" db/seeds/seed_archived_experiment.sql && echo "ARCHIVED_BOTH_VALUES_OK"

# 7. Boot the database and run seeds
docker compose up -d db && sleep 8 && \
chmod +x db/seeds/run_seeds.sh && \
./db/seeds/run_seeds.sh && echo "SEEDS_APPLIED_OK"

# 8. Run migration boot integration test
DATABASE_URL="postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub" \
  npx jest tests/integration/migration_boot.test.js --testTimeout=30000 2>&1 | tail -30 && echo "MIGRATION_BOOT_TESTS_PASSED"

# 9. Verify idempotency: re-run seeds (must not error)
./db/seeds/run_seeds.sh && echo "IDEMPOTENT_RERUN_OK"

# 10. Verify docker compose full stack (db + app + frontend) — Wave 7b dependency
docker compose up -d 2>&1 | tail -10 && docker compose ps && echo "FULL_STACK_UP" && docker compose down
```
</verification>

<success_criteria>
- `db/seeds/seed_audio_security_poc.sql` exists with idempotent SQL for the Audio Security POC anchor record: all pub-required fields populated, maturity=PROTOTYPE_PILOT, review_status=TECHNICALLY_REVIEWED, publication_state=PUBLISHED, source_type=I_AND_R, 4 key_findings (GPU/CPU, Azure Gov Cloud, performance, production-readiness), 2 artifact_links (DOCUMENT + DIAGRAM to HTTPS SharePoint URLs), 5 tags (2 MISSION_AREA + 3 TECHNOLOGY_AREA), 3 engagement_options (REQUEST_BRIEFING, REQUEST_TECHNICAL_GUIDANCE, REQUEST_DEMO)
- `db/seeds/seed_archived_experiment.sql` exists with idempotent SQL for archived stopped experiment: maturity_level=ARCHIVED AND publication_state=ARCHIVED (both per PRD §6.1+§6.4), realistic content, 2 key_findings, 1 artifact_link
- `db/seeds/run_seeds.sh` exists, is executable, applies both seed files against the docker-compose `db` service in order, runs verification SELECT
- Running seeds twice produces no errors and no duplicate records
- `tests/integration/migration_boot.test.js` exists and passes when run against the seeded database: all 11 tables present, hub_settings has ≥4 rows with engagement_routing_email='AOml_TSO_IRB_Team@ao.uscourts.gov', anchor record has correct trust model values and all 4 key finding topics, anchor record is discoverable via PUBLISHED catalog query, anchor record's search_vector is non-null, FTS query for "audio security" returns anchor record, archived record has both ARCHIVED values and does NOT appear in PUBLISHED catalog query, idempotency duplicate-insert test passes
- `docker compose up -d` brings all services (db, app, frontend) to healthy/running state
- All seed fixed UUIDs follow the `a/b/c/d/e/f0000000-0000-0000-0000-00000000000N` pattern for stable Wave 7b test fixture references
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/17-SUMMARY.md` with:
- Tasks completed
- Files created (seed files + test file)
- Anchor record UUID and key field values (for Wave 7b test fixture reference)
- Archived record UUID (for Wave 7b test fixture reference)
- Seed idempotency strategy
- Migration boot test pass/fail result
- Integration contract summary for Wave 7b consumption
</output>
