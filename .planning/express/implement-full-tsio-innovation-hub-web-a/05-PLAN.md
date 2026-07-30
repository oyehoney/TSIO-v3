---
phase: implement-full-tsio-innovation-hub-web-a
plan: 05
type: execute
wave: 2
depends_on: [1]
files_modified:
  - src/services/recordService.js
  - src/services/publicationLifecycleService.js
  - src/services/governanceGateService.js
  - src/services/trustDisclaimerService.js
  - src/services/auditService.js
  - src/handlers/recordHandler.js
  - src/repositories/innovationRecordRepository.js
  - src/repositories/auditLogRepository.js
  - src/repositories/artifactLinkRepository.js
  - src/repositories/tagRepository.js
  - src/repositories/keyFindingRepository.js
  - src/repositories/engagementOptionsRepository.js
  - tests/integration/records.test.js
autonomous: true

features:
  implements: ["F2", "F3", "F4", "F9"]
  depends_on: ["F0"]
  enables: ["F2", "F3", "F4", "F8", "F9"]

must_haves:
  truths:
    - "GET /api/v1/records returns 200 with full InnovationRecord shape including key_findings, artifact_links, mission_area_tags, technology_area_tags, engagement_options, trust_disclaimers"
    - "POST /api/v1/records creates a record in DRAFT state with system-assigned record_id, created_at, and publication_state=DRAFT; logs RECORD_CREATED audit entry"
    - "PATCH /api/v1/records/:id updates mutable fields; returns 409 EDIT_REQUIRES_CONFIRMATION if record is PUBLISHED and X-Confirm-Edit header is absent; re-queues record to REVIEW state on confirmed edit of PUBLISHED record; logs FIELD_EDIT audit entries"
    - "POST /api/v1/records/:id/submit-review transitions DRAFT→REVIEW; rejects any other source state with 422 INVALID_STATE_TRANSITION; logs STATE_TRANSITION audit entry"
    - "POST /api/v1/records/:id/publish runs GovernanceGate validation of all pub-required fields; returns 422 PUBLICATION_GATE_FAILED with blocking field list if any are missing; transitions REVIEW→PUBLISHED and sets published_at if gate passes; logs STATE_TRANSITION audit entry"
    - "POST /api/v1/records/:id/supersede transitions PUBLISHED→SUPERSEDED; requires superseded_by_record_id in body; validates referenced record exists; logs STATE_TRANSITION"
    - "POST /api/v1/records/:id/archive transitions any non-DRAFT state to ARCHIVED; logs STATE_TRANSITION"
    - "DELETE /api/v1/records/:id hard-deletes only DRAFT records; returns 409 DELETE_NOT_PERMITTED for any other state"
    - "GET /api/v1/records/:id/audit returns paginated audit_log entries for the record (CURATOR-only)"
    - "TrustDisclaimerService evaluates exactly 4 trigger conditions: (1) maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT) → 'POC ≠ production-ready', (2) publication_state = PUBLISHED → 'Published ≠ approved for adoption', (3) source_type = COMMUNITY → 'Community-submitted ≠ centrally endorsed', (4) review_status = VALIDATED_FOR_REUSE → 'Validated for Reuse ≠ local review waived'; all applicable disclaimers returned simultaneously"
    - "AuditService appends one row per event to audit_log with record_id, changed_by_user_id (from session, never from request body), changed_at, event_type, field_changed, old_value, new_value, state_transition; audit rows are never updated or deleted"
    - "Integration tests cover: happy-path create→submit-review→publish flow, governance gate blocking with missing required fields, trust disclaimer derivation for all 4 conditions, PATCH of PUBLISHED record without/with X-Confirm-Edit header, DELETE of non-DRAFT record (409), audit log append verification"
  artifacts:
    - path: "src/services/recordService.js"
      provides: "Full CRUD orchestration for Innovation Records; delegates to lifecycle, governance, audit, and disclaimer services"
      exports: ["createRecord", "getRecord", "updateRecord", "submitForReview", "publishRecord", "supersedeRecord", "archiveRecord", "deleteRecord", "getAuditHistory"]
    - path: "src/services/publicationLifecycleService.js"
      provides: "State machine enforcement for DRAFT→REVIEW→PUBLISHED→SUPERSEDED/ARCHIVED transitions"
      exports: ["transition", "canTransition", "VALID_TRANSITIONS"]
    - path: "src/services/governanceGateService.js"
      provides: "Pub-required field validation before REVIEW→PUBLISHED transition"
      exports: ["validate", "PUB_REQUIRED_FIELDS"]
    - path: "src/services/trustDisclaimerService.js"
      provides: "Derives trust disclaimer texts from record field values (4 hard-coded trigger conditions)"
      exports: ["getDisclaimers", "DISCLAIMER_TEXTS"]
    - path: "src/services/auditService.js"
      provides: "Append-only audit_log writer"
      exports: ["logEvent"]
    - path: "src/handlers/recordHandler.js"
      provides: "Express route handlers for all 9 RecordService endpoints"
      exports: ["createRecord", "getRecord", "updateRecord", "submitForReview", "publishRecord", "supersedeRecord", "archiveRecord", "deleteRecord", "getAuditHistory"]
    - path: "src/repositories/innovationRecordRepository.js"
      provides: "Parameterized DB queries for innovation_records CRUD including soft-delete"
      exports: ["findById", "create", "update", "softDelete", "hardDelete"]
    - path: "tests/integration/records.test.js"
      provides: "Jest + Supertest integration tests for all 9 record endpoints"
  key_links:
    - from: "src/handlers/recordHandler.js"
      to: "src/services/recordService.js"
      via: "recordService.createRecord / getRecord / updateRecord / etc."
      pattern: "recordService\\.\\w+"
    - from: "src/services/recordService.js"
      to: "src/services/publicationLifecycleService.js"
      via: "lifecycle.transition(currentState, targetState)"
      pattern: "lifecycle\\.transition"
    - from: "src/services/recordService.js"
      to: "src/services/governanceGateService.js"
      via: "governanceGate.validate(record) before REVIEW→PUBLISHED"
      pattern: "governanceGate\\.validate"
    - from: "src/services/recordService.js"
      to: "src/services/trustDisclaimerService.js"
      via: "trustDisclaimer.getDisclaimers(record) on every GET response"
      pattern: "trustDisclaimer\\.getDisclaimers"
    - from: "src/services/recordService.js"
      to: "src/services/auditService.js"
      via: "auditService.logEvent(record_id, user_id, event_type, ...)"
      pattern: "auditService\\.logEvent"
    - from: "src/repositories/innovationRecordRepository.js"
      to: "innovation_records DB table"
      via: "parameterized knex/drizzle queries with deleted_at IS NULL guards"
      pattern: "deleted_at.*IS NULL"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/migrations/001_core_content_tables.sql"
      exports: ["innovation_records", "record_key_findings", "record_artifact_links", "record_tags", "record_engagement_options", "audit_log"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS innovation_records' db/migrations/001_core_content_tables.sql && grep -n 'CREATE TABLE IF NOT EXISTS audit_log' db/migrations/001_core_content_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports: ["users"]
      verify: "grep -n 'CREATE TABLE users' db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "docker-compose.yml"
      exports: ["db (postgres:16 service with healthcheck)"]
      verify: "grep -n 'postgres:16' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK"
  provides:
    - artifact: "src/services/recordService.js"
      exports:
        - "createRecord(fields, userId) → InnovationRecord"
        - "getRecord(recordId, role) → InnovationRecord (PUBLIC: PUBLISHED only; CURATOR: all states)"
        - "updateRecord(recordId, fields, userId, confirmEdit) → InnovationRecord"
        - "submitForReview(recordId, userId) → { publication_state: 'REVIEW' }"
        - "publishRecord(recordId, userId) → { publication_state: 'PUBLISHED', published_at: ISO8601 } | 422 PUBLICATION_GATE_FAILED"
        - "supersedeRecord(recordId, supersededByRecordId, userId) → { publication_state: 'SUPERSEDED' }"
        - "archiveRecord(recordId, userId) → { publication_state: 'ARCHIVED' }"
        - "deleteRecord(recordId, userId) → 204 | 409 DELETE_NOT_PERMITTED"
        - "getAuditHistory(recordId, pagination) → PaginatedResponse<AuditEntry>"
      shape: |
        InnovationRecord response shape (consumed by Wave 4/6 frontend):
        {
          record_id, title, problem_statement, what_was_explored, outcome_summary,
          key_findings: string[],
          reuse_guidance, short_summary,
          maturity_level, maturity_label, review_status, review_status_label,
          reuse_potential, source_type,
          owner_name, owner_office, contributing_office, contributor_attribution,
          executive_perspective_text, executive_recommendation,
          technical_perspective_text, security_findings, performance_findings,
          default_perspective,
          mission_area_tags: string[], technology_area_tags: string[],
          artifact_links: [{ link_id, label, url, artifact_type, display_order }],
          engagement_options: EngagementOptionType[],
          trust_disclaimers: string[],   // computed by TrustDisclaimerService
          is_validated_for_reuse: boolean,
          is_community_contributed: boolean,
          publication_state, last_reviewed_date, published_at,
          superseded_by_record_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id
        }
      verify: "grep -n 'createRecord\\|getRecord\\|publishRecord\\|submitForReview' src/services/recordService.js && echo CONTRACT_OK"
    - artifact: "src/services/publicationLifecycleService.js"
      exports:
        - "transition(currentState, targetTransition) → newState | throws INVALID_STATE_TRANSITION"
        - "VALID_TRANSITIONS: { DRAFT: ['submit-review'], REVIEW: ['publish', 'return-to-draft'], PUBLISHED: ['supersede', 'archive'], SUPERSEDED: ['archive'] }"
      shape: |
        State machine: DRAFT→REVIEW (submit-review), REVIEW→DRAFT (return-to-draft),
        REVIEW→PUBLISHED (publish — governance gate required), PUBLISHED→SUPERSEDED (supersede),
        PUBLISHED→ARCHIVED (archive), SUPERSEDED→ARCHIVED (archive).
        Hard-delete only on DRAFT. All other transitions are state changes (no delete).
      verify: "grep -n 'INVALID_STATE_TRANSITION\\|VALID_TRANSITIONS\\|transition' src/services/publicationLifecycleService.js && echo CONTRACT_OK"
    - artifact: "src/services/governanceGateService.js"
      exports:
        - "validate(record) → { valid: true } | { valid: false, blocking_fields: string[] }"
        - "PUB_REQUIRED_FIELDS: string[] — list of 16 pub-required field names from FRD F02b"
      shape: |
        PUB_REQUIRED_FIELDS = [
          'title', 'problem_statement', 'what_was_explored', 'outcome_summary',
          'maturity_level', 'review_status', 'reuse_potential', 'source_type',
          'owner_name', 'owner_office', 'contributing_office',
          'mission_area_tags',    // min 1 item required
          'artifact_links',       // min 1 item required
          'engagement_options',   // min 1 item required
          'last_reviewed_date',
          'executive_perspective_text', 'executive_recommendation'
        ]
        Returns 422 PUBLICATION_GATE_FAILED with blocking_fields array on failure.
      verify: "grep -n 'PUB_REQUIRED_FIELDS\\|PUBLICATION_GATE_FAILED\\|validate' src/services/governanceGateService.js && echo CONTRACT_OK"
    - artifact: "src/services/trustDisclaimerService.js"
      exports:
        - "getDisclaimers(record) → string[] — returns all applicable disclaimer texts simultaneously"
        - "DISCLAIMER_TEXTS: hard-coded object with 4 keys"
      shape: |
        Trigger conditions (hard-coded, non-configurable per TechArch §5.6):
        1. maturity_level IN ('EXPERIMENT_POC', 'PROTOTYPE_PILOT')
           → "This record describes a proof-of-concept or pilot effort. POC ≠ production-ready."
        2. publication_state === 'PUBLISHED'
           → "Publication on this Hub does not constitute approval for adoption."
        3. source_type === 'COMMUNITY'
           → "This record was contributed by a team outside I&R. Community-submitted ≠ centrally endorsed."
        4. review_status === 'VALIDATED_FOR_REUSE'
           → "Validated for Reuse does not waive the requirement for local review before adoption."
        All applicable disclaimers returned; they are not mutually exclusive.
      verify: "grep -n 'EXPERIMENT_POC\\|COMMUNITY\\|VALIDATED_FOR_REUSE\\|getDisclaimers' src/services/trustDisclaimerService.js && echo CONTRACT_OK"
    - artifact: "src/services/auditService.js"
      exports:
        - "logEvent({ record_id, changed_by_user_id, event_type, field_changed, old_value, new_value, state_transition }) → void"
        - "event_type values: FIELD_EDIT | STATE_TRANSITION | RECORD_CREATED | RECORD_DELETED"
      shape: |
        Appends one row to audit_log per call. Never updates or deletes rows.
        changed_by_user_id MUST come from authenticated session context (never from request body).
        Used by Wave 6 admin interface for AuditHistoryPanel.
      verify: "grep -n 'logEvent\\|audit_log\\|INSERT' src/services/auditService.js && echo CONTRACT_OK"
    - artifact: "src/handlers/recordHandler.js"
      exports:
        - "Express route handlers: router.get('/records/:id'), router.post('/records'), router.patch('/records/:id'), router.post('/records/:id/submit-review'), router.post('/records/:id/publish'), router.post('/records/:id/supersede'), router.post('/records/:id/archive'), router.delete('/records/:id'), router.get('/records/:id/audit')"
      shape: |
        Route prefixes for Wave 4/6 frontend API calls:
          GET    /api/v1/records/:id          → 200 InnovationRecord | 404 RECORD_NOT_FOUND
          POST   /api/v1/records              → 201 InnovationRecord (CURATOR only)
          PATCH  /api/v1/records/:id          → 200 InnovationRecord | 409 EDIT_REQUIRES_CONFIRMATION (CURATOR only)
          POST   /api/v1/records/:id/submit-review  → 200 { publication_state } (CURATOR only)
          POST   /api/v1/records/:id/publish         → 200 { publication_state, published_at } | 422 (CURATOR only)
          POST   /api/v1/records/:id/supersede       → 200 { publication_state } (CURATOR only)
          POST   /api/v1/records/:id/archive         → 200 { publication_state } (CURATOR only)
          DELETE /api/v1/records/:id                 → 204 | 409 DELETE_NOT_PERMITTED (CURATOR only)
          GET    /api/v1/records/:id/audit           → 200 PaginatedResponse<AuditEntry> (CURATOR only)
      verify: "grep -n 'submit-review\\|publish\\|supersede\\|archive' src/handlers/recordHandler.js && echo CONTRACT_OK"
---

<objective>
Implement RecordService with all 9 CRUD endpoints, PublicationLifecycleService (DRAFT→REVIEW→PUBLISHED→SUPERSEDED/ARCHIVED state machine), GovernanceGateService (pub-required field validation), TrustDisclaimerService (4 hard-coded trigger conditions), and AuditService (append-only audit_log writes) — the complete backend service cluster for the Innovation Record feature.

Purpose: These services are the critical backend foundation for all Innovation Record operations. Wave 4 and Wave 6 (frontend) will call every endpoint defined here. The governance gate and trust disclaimer logic are security-relevant (per TechArch §5.6): trust disclaimers are computed server-side and included in every public record response, never computed independently by the frontend.

Output:
- `src/services/` — 5 service modules (recordService, publicationLifecycleService, governanceGateService, trustDisclaimerService, auditService)
- `src/handlers/recordHandler.js` — Express route handlers for all 9 endpoints
- `src/repositories/` — 6 repository modules (innovationRecordRepository + 5 child table repositories)
- `tests/integration/records.test.js` — Jest + Supertest integration tests covering all endpoint contracts
</objective>

<feature_dependencies>
Implements: F2: Innovation Record (full CRUD, publication lifecycle, audit history), F3: Executive and Technical Perspectives (perspective fields on all record responses; no separate endpoint — view param is frontend concern), F4: Existing Lessons-Learned Integration (artifact link HTTPS validation and retrieval in RecordService), F9: Content Maturity and Trust Model (TrustDisclaimerService hard-coded conditions, GovernanceGateService pub-required field validation, PublicationLifecycleService state machine)
Depends on: F0 (database schema — Wave 1 plans 01 and 02 provide all required tables)
Enables: F2 (Wave 4 RecordPage, Wave 6 RecordEditPage), F3 (Wave 4 PerspectiveToggle), F4 (Wave 4 artifact links rendering), F8 (Wave 6 publication lifecycle controls), F9 (Wave 4 trust disclaimers rendering, Wave 6 GovernanceGateFeedback)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/01-PLAN.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/02-PLAN.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
@project_specs/FRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement RecordService cluster (recordService, publicationLifecycleService, governanceGateService, trustDisclaimerService, auditService + repositories + recordHandler)</name>
  <files>
    src/services/recordService.js
    src/services/publicationLifecycleService.js
    src/services/governanceGateService.js
    src/services/trustDisclaimerService.js
    src/services/auditService.js
    src/handlers/recordHandler.js
    src/repositories/innovationRecordRepository.js
    src/repositories/auditLogRepository.js
    src/repositories/artifactLinkRepository.js
    src/repositories/tagRepository.js
    src/repositories/keyFindingRepository.js
    src/repositories/engagementOptionsRepository.js
  </files>
  <action>
Create the directory structure `src/services/`, `src/handlers/`, `src/repositories/` and implement all modules below. All DB queries use parameterized placeholders — no raw string interpolation in SQL. Use the project's ORM/query builder (Knex.js or Drizzle ORM per TechArch §6.2 stack table). All queries include `WHERE deleted_at IS NULL` guards. All DB column names must match TechArch §3.2 DDL exactly.

---

### `src/services/publicationLifecycleService.js`

Enforce the state machine from TechArch §1.4:

```
DRAFT → REVIEW (submit-review)
REVIEW → DRAFT (return-to-draft)
REVIEW → PUBLISHED (publish — governance gate must be called BEFORE this)
PUBLISHED → SUPERSEDED (supersede)
PUBLISHED → ARCHIVED (archive)
SUPERSEDED → ARCHIVED (archive)
```

Exports:
- `VALID_TRANSITIONS` — object mapping current_state → array of allowed next transitions
- `transition(currentState, targetTransition)` — throws `{ code: 'INVALID_STATE_TRANSITION', message: 'Current state: X. Allowed transitions: Y.' }` if not valid; returns new state string on success
- `canDelete(publicationState)` — returns `true` only for `DRAFT`; all other states return `false` (per TechArch §1.4 deletion rule)

On `REVIEW → PUBLISHED` transition, set `published_at = NOW()`. The service itself does NOT set the timestamp — it returns `{ newState: 'PUBLISHED', setPublishedAt: true }` so the repository layer sets the column.

---

### `src/services/governanceGateService.js`

Validates all pub-required fields before REVIEW → PUBLISHED transition. From FRD F02b §Validation:

```javascript
const PUB_REQUIRED_FIELDS = [
  'title',
  'problem_statement',
  'what_was_explored',
  'outcome_summary',
  'maturity_level',
  'review_status',
  'reuse_potential',
  'source_type',
  'owner_name',
  'owner_office',
  'contributing_office',
  'last_reviewed_date',
  'executive_perspective_text',
  'executive_recommendation',
];
// Arrays validated separately: key_findings (min 1), artifact_links (min 1), engagement_options (min 1), mission_area_tags (min 1)
const PUB_REQUIRED_ARRAYS = {
  key_findings: 1,
  artifact_links: 1,
  engagement_options: 1,
  mission_area_tags: 1,
};
```

Exports:
- `PUB_REQUIRED_FIELDS` — string array of scalar pub-required field names
- `validate(record)` — receives full record object (with resolved relations); returns `{ valid: true }` or `{ valid: false, blocking_fields: string[] }` — never throws. Caller (recordService) throws the 422 with `code: 'PUBLICATION_GATE_FAILED'`.

Additional field-level rules from FRD F02b:
- `last_reviewed_date` must NOT be in the future (return `'last_reviewed_date_future'` in blocking_fields if it is)
- `title`: 5–200 chars
- `problem_statement`, `what_was_explored`: 50–5000 chars each
- `outcome_summary`: 50–3000 chars
- `executive_perspective_text`: 50–3000 chars
- `executive_recommendation`: 50–1000 chars
- Each `artifact_links` item: `url` must start with `https://`, `label` 2–200 chars, `artifact_type` must be valid enum
- Each `key_findings` item: 10–1000 chars

---

### `src/services/trustDisclaimerService.js`

Evaluates 4 hard-coded trigger conditions per FRD F02b §Validation and TechArch §5.6. Disclaimer texts are hard-coded in source — not configurable at runtime.

```javascript
const DISCLAIMER_TEXTS = {
  POC_NOT_PRODUCTION_READY:
    'This record describes a proof-of-concept or pilot effort. Proof-of-concept status does not imply production readiness or organizational endorsement for deployment.',
  PUBLISHED_NOT_APPROVED_FOR_ADOPTION:
    'Publication on this Hub does not constitute approval for adoption. Stakeholders should conduct appropriate local review before adopting any innovation work.',
  COMMUNITY_NOT_CENTRALLY_ENDORSED:
    'This record was contributed by a team outside I&R. Community-submitted content has not been centrally validated by the TSIO Innovation & Research team.',
  VALIDATED_REUSE_NOT_LOCAL_REVIEW_WAIVED:
    'A "Validated for Reuse" review status does not waive the requirement for local review, security assessment, or policy approval before adoption in your jurisdiction.',
};
```

Trigger conditions:
1. `record.maturity_level === 'EXPERIMENT_POC' || record.maturity_level === 'PROTOTYPE_PILOT'` → `DISCLAIMER_TEXTS.POC_NOT_PRODUCTION_READY`
2. `record.publication_state === 'PUBLISHED'` → `DISCLAIMER_TEXTS.PUBLISHED_NOT_APPROVED_FOR_ADOPTION`
3. `record.source_type === 'COMMUNITY'` → `DISCLAIMER_TEXTS.COMMUNITY_NOT_CENTRALLY_ENDORSED`
4. `record.review_status === 'VALIDATED_FOR_REUSE'` → `DISCLAIMER_TEXTS.VALIDATED_REUSE_NOT_LOCAL_REVIEW_WAIVED`

All applicable disclaimers are returned in a single array — they are not mutually exclusive (per FRD F02b). A record can trigger all 4 simultaneously.

Exports:
- `DISCLAIMER_TEXTS` — hard-coded object
- `getDisclaimers(record)` — returns `string[]`; pure function (no I/O)

---

### `src/services/auditService.js`

Append-only writer to the `audit_log` table. Never reads or updates rows.

Exports:
- `logEvent(db, { record_id, changed_by_user_id, event_type, field_changed, old_value, new_value, state_transition })`
  - `event_type` must be one of: `'FIELD_EDIT'`, `'STATE_TRANSITION'`, `'RECORD_CREATED'`, `'RECORD_DELETED'`
  - `changed_by_user_id` is always taken from the authenticated session context passed by the caller — NEVER from the request body
  - `field_changed`, `old_value`, `new_value` are `null` for state transition events
  - `state_transition` is a string like `'DRAFT->REVIEW'` or `null` for field edit events
  - Throws on DB error (let the caller handle rollback if needed)

---

### `src/repositories/innovationRecordRepository.js`

Parameterized queries for `innovation_records`. All queries include `AND deleted_at IS NULL` unless explicitly retrieving deleted records. Use `db` (knex/drizzle instance) passed via dependency injection.

Exports:
- `findById(db, recordId, { includeDeleted = false })` — returns full row or `null`
- `findByIdWithRelations(db, recordId)` — joins `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`; assembles as arrays on the returned object
- `create(db, fields)` — INSERTs and returns the created row
- `update(db, recordId, fields)` — UPDATEs `updated_at = NOW()` and specified fields; returns updated row
- `softDelete(db, recordId)` — sets `deleted_at = NOW()`
- `hardDelete(db, recordId)` — hard DELETE; only called after lifecycle service confirms DRAFT state

### `src/repositories/auditLogRepository.js`

Exports:
- `insert(db, entry)` — INSERT only; no UPDATE/DELETE methods exposed
- `findByRecordId(db, recordId, { page, pageSize })` — SELECT with ORDER BY changed_at DESC and pagination

### `src/repositories/artifactLinkRepository.js`

Exports:
- `findByRecordId(db, recordId)` — returns array ordered by display_order
- `replaceForRecord(db, recordId, links)` — DELETEs existing, INSERTs new links (used on record update)

### `src/repositories/tagRepository.js`

Exports:
- `findByRecordId(db, recordId)` — returns `{ mission_area_tags: string[], technology_area_tags: string[] }`
- `replaceForRecord(db, recordId, { mission_area_tags, technology_area_tags })` — DELETEs existing, INSERTs new

### `src/repositories/keyFindingRepository.js`

Exports:
- `findByRecordId(db, recordId)` — returns array of finding_text strings ordered by display_order
- `replaceForRecord(db, recordId, findings)` — DELETEs existing, INSERTs new finding texts

### `src/repositories/engagementOptionsRepository.js`

Exports:
- `findByRecordId(db, recordId)` — returns array of option_type strings ordered by display_order
- `replaceForRecord(db, recordId, options)` — DELETEs existing, INSERTs new option types

---

### `src/services/recordService.js`

Orchestration layer. Calls repositories, lifecycle service, governance gate, trust disclaimer service, and audit service.

Implements these functions (each handles its own error shaping for the handler layer):

**`createRecord(db, fields, userId)`**
1. Call `publicationLifecycleService` — no transition needed; record starts in `DRAFT`
2. INSERT via `innovationRecordRepository.create()` with `publication_state: 'DRAFT'`, `created_by_user_id: userId`, `updated_by_user_id: userId`
3. If `key_findings` provided: `keyFindingRepository.replaceForRecord()`
4. If `artifact_links` provided: `artifactLinkRepository.replaceForRecord()` — validate each URL starts with `https://`
5. If `mission_area_tags` or `technology_area_tags`: `tagRepository.replaceForRecord()`
6. If `engagement_options`: `engagementOptionsRepository.replaceForRecord()`
7. Call `auditService.logEvent(db, { record_id, changed_by_user_id: userId, event_type: 'RECORD_CREATED', ... })`
8. Return assembled record via `innovationRecordRepository.findByIdWithRelations()`

**`getRecord(db, recordId, role)`**
1. `findByIdWithRelations()` — returns `null` → throw `{ code: 'RECORD_NOT_FOUND', status: 404 }`
2. If `role !== 'CURATOR'` and `publication_state !== 'PUBLISHED'`: throw `{ code: 'RECORD_NOT_FOUND', status: 404 }`
3. Append `trust_disclaimers: trustDisclaimerService.getDisclaimers(record)` to response
4. Append `maturity_label`, `review_status_label` (human-readable labels from lookup table — see maturity/review label map below)
5. Append `is_validated_for_reuse: record.review_status === 'VALIDATED_FOR_REUSE'`
6. Append `is_community_contributed: record.source_type === 'COMMUNITY'`

Maturity label map (from FRD §Shared Terminology and TechArch §4.2 `MaturityLevelDefinition`):
```javascript
const MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};
const REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};
```

**`updateRecord(db, recordId, fields, userId, confirmEdit)`**
1. `findById()` → 404 if not found
2. If `publication_state === 'PUBLISHED'` AND `confirmEdit !== true`: throw `{ code: 'EDIT_REQUIRES_CONFIRMATION', status: 409 }`
3. If `publication_state === 'PUBLISHED'` AND `confirmEdit === true`: transition to `REVIEW` state first (log `STATE_TRANSITION` audit entry `'PUBLISHED->REVIEW'`); then apply field updates
4. Log `FIELD_EDIT` audit entries for each changed field (old_value → new_value)
5. `innovationRecordRepository.update()` for scalar fields; call replace-repos for array fields
6. Return assembled record

**`submitForReview(db, recordId, userId)`**
1. `findById()` → 404 if not found
2. `lifecycle.transition(currentState, 'submit-review')` → throws `INVALID_STATE_TRANSITION` if not DRAFT
3. `innovationRecordRepository.update(db, recordId, { publication_state: 'REVIEW', updated_by_user_id: userId })`
4. `auditService.logEvent(...)` with `event_type: 'STATE_TRANSITION'`, `state_transition: 'DRAFT->REVIEW'`
5. Return `{ record_id, publication_state: 'REVIEW' }`

**`publishRecord(db, recordId, userId)`**
1. `findByIdWithRelations()` (need full record for governance gate)
2. `lifecycle.transition(currentState, 'publish')` → throws `INVALID_STATE_TRANSITION` if not REVIEW
3. `governanceGate.validate(record)` → if `{ valid: false, blocking_fields }`: throw `{ code: 'PUBLICATION_GATE_FAILED', status: 422, fields: blocking_fields }`
4. `innovationRecordRepository.update(db, recordId, { publication_state: 'PUBLISHED', published_at: new Date().toISOString(), updated_by_user_id: userId })`
5. `auditService.logEvent(...)` with `event_type: 'STATE_TRANSITION'`, `state_transition: 'REVIEW->PUBLISHED'`
6. Return `{ record_id, publication_state: 'PUBLISHED', published_at }`

**`supersedeRecord(db, recordId, supersededByRecordId, userId)`**
1. `findById()` → 404 if not found
2. `lifecycle.transition(currentState, 'supersede')` → throws if not PUBLISHED
3. Validate `supersededByRecordId` references an existing record → throw `{ code: 'INVALID_SUPERSEDES_REF', status: 422 }` if not found
4. `innovationRecordRepository.update(db, recordId, { publication_state: 'SUPERSEDED', superseded_by_record_id: supersededByRecordId, updated_by_user_id: userId })`
5. `auditService.logEvent(...)` `state_transition: 'PUBLISHED->SUPERSEDED'`
6. Return `{ record_id, publication_state: 'SUPERSEDED' }`

**`archiveRecord(db, recordId, userId)`**
1. `findById()` → 404 if not found
2. `lifecycle.transition(currentState, 'archive')` → throws if not PUBLISHED or SUPERSEDED
3. `innovationRecordRepository.update(db, recordId, { publication_state: 'ARCHIVED', updated_by_user_id: userId })`
4. `auditService.logEvent(...)` `state_transition: '<prev>->ARCHIVED'`
5. Return `{ record_id, publication_state: 'ARCHIVED' }`

**`deleteRecord(db, recordId, userId)`**
1. `findById()` → 404 if not found
2. `lifecycle.canDelete(currentState)` → if false: throw `{ code: 'DELETE_NOT_PERMITTED', status: 409 }`
3. `auditService.logEvent(...)` `event_type: 'RECORD_DELETED'`
4. `innovationRecordRepository.hardDelete(db, recordId)`
5. Return `{ deleted: true }`

**`getAuditHistory(db, recordId, pagination)`**
1. Verify record exists → 404 if not
2. `auditLogRepository.findByRecordId()` with pagination
3. Return `PaginatedResponse<AuditEntry>`

---

### `src/handlers/recordHandler.js`

Express router mounting at `/api/v1`. Wire the following routes:

```
GET    /records/:id              → recordService.getRecord (PUBLIC: role from session or 'PUBLIC')
POST   /records                  → requireCurator → recordService.createRecord
PATCH  /records/:id              → requireCurator → recordService.updateRecord (reads X-Confirm-Edit header)
POST   /records/:id/submit-review → requireCurator → recordService.submitForReview
POST   /records/:id/publish       → requireCurator → recordService.publishRecord
POST   /records/:id/supersede     → requireCurator → recordService.supersedeRecord (body: { superseded_by_record_id })
POST   /records/:id/archive       → requireCurator → recordService.archiveRecord
DELETE /records/:id               → requireCurator → recordService.deleteRecord
GET    /records/:id/audit         → requireCurator → recordService.getAuditHistory
```

Handler response patterns:
- `createRecord` → HTTP 201 with InnovationRecord body
- `getRecord` → HTTP 200 with InnovationRecord body
- `updateRecord` → HTTP 200 with InnovationRecord body
- `submitForReview`, `publishRecord`, `supersedeRecord`, `archiveRecord` → HTTP 200 with `{ record_id, publication_state[, published_at] }`
- `deleteRecord` → HTTP 204 No Content
- `getAuditHistory` → HTTP 200 with `PaginatedResponse<AuditEntry>` envelope

Error mapping (from service errors to HTTP):
```javascript
const ERROR_STATUS_MAP = {
  RECORD_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 422,
  PUBLICATION_GATE_FAILED: 422,
  EDIT_REQUIRES_CONFIRMATION: 409,
  DELETE_NOT_PERMITTED: 409,
  INVALID_SUPERSEDES_REF: 422,
  INVALID_ARTIFACT_URL: 422,
};
```

Error response envelope per TechArch §4.1:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": [{ "field": "field_name", "error_code": "...", "message": "..." }]
  }
}
```

`requireCurator` middleware: checks session for authenticated user with `role IN ('CURATOR', 'ADMIN')`; returns 401 if no session, 403 if authenticated but role insufficient.

Read `X-Confirm-Edit` header in PATCH handler and pass as `confirmEdit = req.headers['x-confirm-edit'] === 'true'` to `recordService.updateRecord`.

For `GET /records/:id`: derive role from session — if authenticated CURATOR/ADMIN, pass `'CURATOR'`; otherwise pass `'PUBLIC'`.
  </action>
  <verify>
grep -n 'INVALID_STATE_TRANSITION\|VALID_TRANSITIONS\|transition' src/services/publicationLifecycleService.js && echo "lifecycle_ok" && grep -n 'PUB_REQUIRED_FIELDS\|PUBLICATION_GATE_FAILED\|validate' src/services/governanceGateService.js && echo "governance_ok" && grep -n 'EXPERIMENT_POC\|COMMUNITY\|VALIDATED_FOR_REUSE\|getDisclaimers' src/services/trustDisclaimerService.js && echo "disclaimer_ok" && grep -n 'logEvent\|audit_log\|INSERT\|RECORD_CREATED' src/services/auditService.js && echo "audit_ok" && grep -n 'createRecord\|getRecord\|publishRecord\|submitForReview' src/services/recordService.js && echo "recordservice_ok" && grep -n 'submit-review\|publish\|supersede\|archive' src/handlers/recordHandler.js && echo "handler_ok" && echo CONTRACT_OK
  </verify>
  <done>
- `src/services/publicationLifecycleService.js`: exports `transition`, `canDelete`, `VALID_TRANSITIONS`; state machine exactly matches TechArch §1.4 (6 valid transitions, DRAFT-only delete)
- `src/services/governanceGateService.js`: exports `validate`, `PUB_REQUIRED_FIELDS` (14 scalar fields); validates arrays (key_findings, artifact_links, engagement_options, mission_area_tags min 1 each); validates last_reviewed_date not in future
- `src/services/trustDisclaimerService.js`: exports `getDisclaimers`, `DISCLAIMER_TEXTS`; evaluates all 4 trigger conditions; returns all applicable disclaimers simultaneously; pure function (no I/O); hard-coded texts non-configurable
- `src/services/auditService.js`: exports `logEvent`; INSERT-only to audit_log; no UPDATE/DELETE; changed_by_user_id from session context
- `src/services/recordService.js`: exports all 9 functions; delegates to lifecycle/governance/disclaimer/audit services correctly
- `src/handlers/recordHandler.js`: 9 routes wired; correct HTTP status codes (201 for create, 204 for delete, 200 for others); `requireCurator` middleware guards write routes; `X-Confirm-Edit` header parsed; error envelope matches TechArch §4.1
- All repositories: parameterized queries only; `deleted_at IS NULL` guards; column names match TechArch §3.2 exactly
  </done>
</task>

<task type="auto">
  <name>Task 2: Integration tests for all 9 record endpoints</name>
  <files>
    tests/integration/records.test.js
  </files>
  <action>
Create `tests/integration/records.test.js` using Jest + Supertest. Tests run against a real PostgreSQL instance (docker-compose `db` service) using the DATABASE_URL environment variable.

**Test setup:** Before all tests, run migrations 001 and 002 (or rely on the initdb.d already run by docker-compose). Create a test curator user in the `users` table with a known `user_id`. Use a test Express app instance that includes `recordHandler` routes and a test session middleware that injects the curator user.

**Required test cases (must all pass for DONE criteria):**

```javascript
// ─── Context Boot Test (one per backend — from system prompt) ────────────────
describe('context boot', () => {
  it('app starts and connects to DB successfully', async () => {
    // Verify DB connection by running a simple SELECT 1
    const result = await db.raw('SELECT 1 as ok');
    expect(result.rows[0].ok).toBe(1);
  });
});

// ─── POST /api/v1/records (create) ─────────────────────────────────────────
describe('POST /api/v1/records', () => {
  it('returns 201 with DRAFT record and RECORD_CREATED audit entry', async () => {
    // POST minimal valid fields (only pub-required not needed at draft stage)
    // Assert: 201, record_id set, publication_state === 'DRAFT', created_by_user_id === testCuratorId
    // Assert: audit_log has 1 row for this record_id with event_type RECORD_CREATED
  });

  it('returns 401 if not authenticated', async () => {
    // POST without session
    // Assert: 401
  });
});

// ─── GET /api/v1/records/:id ────────────────────────────────────────────────
describe('GET /api/v1/records/:id', () => {
  it('returns 404 for non-published record accessed by PUBLIC role', async () => {
    // Create DRAFT record, GET without auth session
    // Assert: 404 RECORD_NOT_FOUND
  });

  it('returns 200 with trust_disclaimers for PUBLISHED EXPERIMENT_POC record', async () => {
    // Create + publish a record with maturity_level EXPERIMENT_POC
    // GET without auth (PUBLIC role)
    // Assert: 200, trust_disclaimers array includes 'POC...' and 'Published...' disclaimers
    // Assert: response shape includes key_findings[], artifact_links[], mission_area_tags[], engagement_options[]
  });

  it('returns 200 for DRAFT record when accessed by CURATOR', async () => {
    // Create DRAFT record, GET with curator session
    // Assert: 200, publication_state === 'DRAFT'
  });
});

// ─── PATCH /api/v1/records/:id (update) ────────────────────────────────────
describe('PATCH /api/v1/records/:id', () => {
  it('returns 409 EDIT_REQUIRES_CONFIRMATION when editing PUBLISHED record without header', async () => {
    // Create and publish a record (must have all pub-required fields)
    // PATCH without X-Confirm-Edit header
    // Assert: 409, error.code === 'EDIT_REQUIRES_CONFIRMATION'
  });

  it('moves PUBLISHED record to REVIEW when X-Confirm-Edit: true is provided', async () => {
    // PATCH with X-Confirm-Edit: true
    // Assert: 200, publication_state === 'REVIEW'
    // Assert: audit_log has STATE_TRANSITION PUBLISHED->REVIEW entry
  });
});

// ─── POST /api/v1/records/:id/submit-review ────────────────────────────────
describe('POST /api/v1/records/:id/submit-review', () => {
  it('transitions DRAFT → REVIEW and logs STATE_TRANSITION', async () => {
    // Create DRAFT, call submit-review
    // Assert: 200, publication_state === 'REVIEW'
    // Assert: audit_log STATE_TRANSITION 'DRAFT->REVIEW'
  });

  it('returns 422 INVALID_STATE_TRANSITION when called on REVIEW state record', async () => {
    // Create DRAFT → submit-review → submit-review again
    // Assert: 422, error.code === 'INVALID_STATE_TRANSITION'
  });
});

// ─── POST /api/v1/records/:id/publish (governance gate) ────────────────────
describe('POST /api/v1/records/:id/publish', () => {
  it('returns 422 PUBLICATION_GATE_FAILED with blocking fields when required fields missing', async () => {
    // Create DRAFT with only title, submit-review, attempt publish
    // Assert: 422, error.code === 'PUBLICATION_GATE_FAILED'
    // Assert: error.fields includes at least problem_statement, maturity_level
  });

  it('transitions REVIEW → PUBLISHED and sets published_at when all pub-required fields present', async () => {
    // Create fully-populated record with ALL pub-required fields + min 1 key_finding + min 1 artifact_link
    // + min 1 engagement_option + min 1 mission_area_tag
    // submit-review → publish
    // Assert: 200, publication_state === 'PUBLISHED', published_at is ISO8601 string
    // Assert: record is now visible via GET without auth
    // Assert: audit_log has STATE_TRANSITION REVIEW->PUBLISHED
  });
});

// ─── DELETE /api/v1/records/:id ─────────────────────────────────────────────
describe('DELETE /api/v1/records/:id', () => {
  it('returns 204 when deleting a DRAFT record', async () => {
    // Create DRAFT, DELETE
    // Assert: 204
    // Assert: subsequent GET by CURATOR returns 404
  });

  it('returns 409 DELETE_NOT_PERMITTED when deleting PUBLISHED record', async () => {
    // Create + publish a record, DELETE
    // Assert: 409, error.code === 'DELETE_NOT_PERMITTED'
  });
});

// ─── TrustDisclaimerService unit-style integration ─────────────────────────
describe('TrustDisclaimerService — all 4 trigger conditions', () => {
  it('COMMUNITY source_type → community disclaimer included', async () => {
    // Create published COMMUNITY source record
    // GET, assert trust_disclaimers includes community text
  });

  it('VALIDATED_FOR_REUSE review_status → validated reuse disclaimer included', async () => {
    // Create published record with review_status VALIDATED_FOR_REUSE
    // GET, assert trust_disclaimers includes validated-reuse text
  });

  it('EXPERIMENT_POC + COMMUNITY simultaneously triggers 3 disclaimers', async () => {
    // Create published EXPERIMENT_POC COMMUNITY record
    // GET, assert trust_disclaimers.length >= 3 (POC + PUBLISHED + COMMUNITY)
  });
});

// ─── GET /api/v1/records/:id/audit ─────────────────────────────────────────
describe('GET /api/v1/records/:id/audit', () => {
  it('returns 401 when called without curator session', async () => {
    // Create record, GET audit without auth
    // Assert: 401
  });

  it('returns paginated audit entries in reverse chronological order', async () => {
    // Create record + submit-review (2 audit entries: RECORD_CREATED + STATE_TRANSITION)
    // GET audit
    // Assert: 200, data is array with >= 2 entries, pagination envelope present
    // Assert: entries ordered by changed_at DESC
  });
});
```

**Test helper:** Create a `tests/helpers/testDb.js` that:
- Exports a `getDb()` function returning a configured knex/drizzle instance connected to `process.env.DATABASE_URL`
- Exports `cleanupRecords(db, recordIds)` that hard-deletes test records and their audit log entries after each test (in the correct FK order: audit_log first, then child tables via cascade, then innovation_records)
- Exports `createTestCurator(db)` that INSERTs a test user with role CURATOR and returns the `user_id`
- Exports `buildFullRecord()` that returns a valid object with ALL pub-required fields populated (used by governance gate tests)

The test file must pass with `npx jest tests/integration/records.test.js --forceExit` against a running docker-compose PostgreSQL instance.
  </action>
  <verify>
npx jest tests/integration/records.test.js --forceExit --testTimeout=30000 2>&1 | tail -30 && echo "INTEGRATION TESTS PASSED"
  </verify>
  <done>
- `tests/integration/records.test.js` exists
- Context boot test passes (DB connection verified)
- All 9 endpoint contracts tested: create (201 + DRAFT state), get (404 for PUBLIC+DRAFT, 200 for PUBLISHED), update (409 without confirm header, 200+REVIEW with header), submit-review (200+REVIEW, 422 invalid transition), publish (422 gate fail with blocking fields, 200+PUBLISHED+published_at), delete (204 for DRAFT, 409 for PUBLISHED), audit (401 without auth, 200+pagination)
- All 4 TrustDisclaimerService trigger conditions verified via GET responses
- Audit log append verified (STATE_TRANSITION and RECORD_CREATED entries confirmed in audit history responses)
- `npx jest tests/integration/records.test.js --forceExit` exits 0 with 0 failing tests
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | Untrusted request body/params crossing into RecordHandler (createRecord, updateRecord, publishRecord, supersedeRecord) |
| API→DB | Service-layer data crossing into PostgreSQL via repository queries |
| session→service | Session-extracted user_id crossing into AuditService as changed_by_user_id |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Elevation of Privilege | `GET /api/v1/records/:id` — PUBLIC users must not access non-PUBLISHED records | mitigate | `recordService.getRecord()` enforces: if `role !== 'CURATOR'` and `publication_state !== 'PUBLISHED'` → throw `RECORD_NOT_FOUND` (404, not 403 — avoids information disclosure about record existence). Enforced at service layer, not just handler layer. Partial index `idx_innovation_records_published_at WHERE publication_state = 'PUBLISHED'` signals the DB-layer guard. |
| T-05-02 | Tampering | `PATCH /api/v1/records/:id` — unauthorized edits of Innovation Records | mitigate | `requireCurator` middleware in `recordHandler.js` validates session before any write route; returns 401 (no session) or 403 (insufficient role). Middleware checks `req.session.user.role IN ('CURATOR', 'ADMIN')`. Never trusts a client-supplied role claim. |
| T-05-03 | Repudiation | `auditService.logEvent` — changed_by_user_id must come from session, not request body | mitigate | `recordService.js` passes `changed_by_user_id` from `req.session.user.user_id` (session-extracted) to all `auditService.logEvent` calls. The `changed_by_user_id` parameter is never accepted from request body. Integration test `GET /records/:id/audit` verifies audit entries carry the correct curator user_id. |
| T-05-04 | Tampering | `artifact_links[].url` — SSRF prevention (Hub must never fetch artifact URLs) | mitigate | `artifactLinkRepository.replaceForRecord()` and `governanceGateService.validate()` check that each URL starts with `https://` (matching the DB CHECK constraint `url LIKE 'https://%'`). Service layer never performs an HTTP fetch against artifact URLs — they are stored as strings only per TechArch §7.6. |
| T-05-05 | Elevation of Privilege | `POST /api/v1/records/:id/publish` — governance gate bypass attempt | mitigate | `governanceGateService.validate()` is called server-side in `recordService.publishRecord()` before any DB update. The frontend publication controls (Wave 6) are convenience only — the gate is always enforced at the service layer regardless of request origin, per TechArch §5.6 rule 3. |
| T-05-06 | Information Disclosure | `TrustDisclaimerService` — disclaimer texts must be hard-coded; not settable by curator | mitigate | `DISCLAIMER_TEXTS` is a module-level constant in `trustDisclaimerService.js`. No code path accepts external input to modify disclaimer texts. Per TechArch §5.6 rule 2: "A code change and release is required to update disclaimer language." |
| T-05-07 | Tampering | SQL injection via record field inputs | mitigate | All repository methods use parameterized queries via knex/drizzle prepared statements. No raw SQL string interpolation in any repository. Input sanitization (HTML strip via `sanitize-html` per TechArch §6.2) applied to all text fields in `recordHandler.js` before passing to service layer. |
| T-05-08 | Tampering | `DELETE /api/v1/records/:id` — hard-delete of non-DRAFT records would destroy audit trail | mitigate | `publicationLifecycleService.canDelete()` returns `true` only for `DRAFT` state. `recordService.deleteRecord()` calls this gate before `hardDelete()`. For all other states, returns 409 `DELETE_NOT_PERMITTED` per FRD F02b and TechArch §1.4 deletion rule. |
</threat_model>

<verification>
After both tasks complete:

1. Verify all service files exist:
   ```bash
   ls src/services/recordService.js src/services/publicationLifecycleService.js src/services/governanceGateService.js src/services/trustDisclaimerService.js src/services/auditService.js && echo "ALL_SERVICES_EXIST"
   ```

2. Verify handler and all repositories exist:
   ```bash
   ls src/handlers/recordHandler.js src/repositories/innovationRecordRepository.js src/repositories/auditLogRepository.js src/repositories/artifactLinkRepository.js src/repositories/tagRepository.js src/repositories/keyFindingRepository.js src/repositories/engagementOptionsRepository.js && echo "ALL_REPOS_EXIST"
   ```

3. Verify GovernanceGate has correct pub-required fields:
   ```bash
   grep -c "PUB_REQUIRED_FIELDS\|problem_statement\|last_reviewed_date\|executive_perspective_text" src/services/governanceGateService.js && echo "GOVERNANCE_GATE_OK"
   ```

4. Verify TrustDisclaimerService has all 4 trigger conditions:
   ```bash
   grep -c "EXPERIMENT_POC\|PROTOTYPE_PILOT\|COMMUNITY\|VALIDATED_FOR_REUSE\|PUBLISHED" src/services/trustDisclaimerService.js && echo "DISCLAIMER_CONDITIONS_OK"
   ```

5. Verify state machine transitions match TechArch §1.4:
   ```bash
   grep -E "submit-review|return-to-draft|publish|supersede|archive" src/services/publicationLifecycleService.js | wc -l && echo "TRANSITIONS_OK"
   ```

6. Run integration tests:
   ```bash
   npx jest tests/integration/records.test.js --forceExit --testTimeout=30000 2>&1 | tail -10 && echo "INTEGRATION_TESTS_PASSED"
   ```

7. Verify audit service never exposes UPDATE/DELETE:
   ```bash
   grep -v "UPDATE\|DELETE" src/repositories/auditLogRepository.js | grep "INSERT\|findBy" && echo "AUDIT_IMMUTABLE_OK"
   ```
</verification>

<success_criteria>
- All 5 service modules exist and export the documented functions
- All 6 repository modules exist with parameterized queries and `deleted_at IS NULL` guards
- `src/handlers/recordHandler.js` mounts all 9 routes with correct HTTP verbs and status codes
- `publicationLifecycleService` enforces exactly 6 valid state transitions; `canDelete()` returns `true` only for DRAFT
- `governanceGateService.validate()` checks all pub-required fields (14 scalar + 4 array-min-1) from FRD F02b; returns `blocking_fields` array on failure
- `trustDisclaimerService.getDisclaimers()` evaluates all 4 trigger conditions simultaneously; hard-coded texts non-configurable
- `auditService.logEvent()` only INSERTs to `audit_log`; `changed_by_user_id` always from session context
- All record GET responses include `trust_disclaimers: string[]`, `maturity_label`, `review_status_label`, `is_validated_for_reuse`, `is_community_contributed`
- Integration test suite in `tests/integration/records.test.js` passes with `npx jest --forceExit`: 0 failing tests
- Integration tests cover: create→submit-review→publish happy path, governance gate 422 with blocking fields, all 4 trust disclaimer conditions, PATCH 409/200 with/without X-Confirm-Edit, DELETE 204 DRAFT / 409 non-DRAFT, audit log pagination
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/05-SUMMARY.md` with:
- Tasks completed (service cluster + integration tests)
- Files created (list all 13 files)
- Key implementation decisions (state machine transitions, governance gate field list, disclaimer trigger conditions)
- Integration contract summary for Wave 4 and Wave 6 frontend consumption (endpoint shapes, trust_disclaimers API contract, error codes)
</output>
