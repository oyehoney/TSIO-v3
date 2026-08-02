---
phase: implement-full-tsio-innovation-hub-web-a
plan: "05"
subsystem: RecordService cluster — GovernanceGateService, TrustDisclaimerService, PublicationLifecycleService, AuditService (F2, F3, F4, F9)
tags: [records, crud, publication-lifecycle, trust-disclaimers, governance-gate, audit, nodejs]

dependency_graph:
  requires:
    - "01-PLAN: innovation_records, record_key_findings, record_artifact_links, record_tags, record_engagement_options, audit_log tables"
    - "03-PLAN: src/app.js Express factory"
  provides:
    - "src/services/recordService.js — full CRUD + 9 REST endpoints"
    - "src/services/publicationLifecycleService.js — state machine (DRAFT→REVIEW→PUBLISHED→SUPERSEDED/ARCHIVED)"
    - "src/services/governanceGateService.js — validates all pub-required fields before REVIEW→PUBLISHED"
    - "src/services/trustDisclaimerService.js — 4 hard-coded trigger conditions, returns disclaimer text array"
    - "src/services/auditService.js — append-only audit_log writes"
    - "src/handlers/recordHandler.js — HTTP handlers for all 9 record endpoints"
    - "src/repositories/ — innovationRecordRepository, auditLogRepository, artifactLinkRepository, tagRepository, keyFindingRepository, engagementOptionsRepository"
    - "tests/integration/records.test.js — integration tests for all 9 endpoints"
  affects:
    - "Wave 4 RecordPage (Plan 11): consumes GET /api/v1/records/:id with trust_disclaimers array"
    - "Wave 6 Admin RecordEdit (Plan 14): consumes POST/PATCH record endpoints"
    - "Wave 7 seed (Plan 17): uses publication lifecycle to publish seeded records"

tech_stack:
  patterns:
    - "State machine enforced at service layer (not route handler)"
    - "GovernanceGate: 13 pub-required fields checked, returns blocking field list on failure"
    - "TrustDisclaimerService: 4 rules evaluated simultaneously, all applicable returned"
    - "AuditService: RECORD_CREATED / FIELD_EDIT / STATE_TRANSITION / RECORD_DELETED event types"
    - "409 EDIT_REQUIRES_CONFIRMATION on PATCH to PUBLISHED record without X-Confirm-Edit header"
    - "Hard delete only for DRAFT; 409 DELETE_NOT_PERMITTED for all other states"

trust_disclaimer_rules:
  - "maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT) → POC ≠ production-ready"
  - "publication_state = PUBLISHED (always) → Published ≠ approved for adoption"
  - "source_type = COMMUNITY → Community-submitted ≠ centrally endorsed"
  - "review_status = VALIDATED_FOR_REUSE → Validated ≠ local review waived"

key_files:
  created:
    - path: "src/services/recordService.js"
      purpose: "Full CRUD for innovation records; assembles full record response including child rows"
    - path: "src/services/publicationLifecycleService.js"
      purpose: "Enforces valid state transitions; sets published_at on first PUBLISHED"
    - path: "src/services/governanceGateService.js"
      purpose: "Validates all pub-required fields; returns blocking field list"
    - path: "src/services/trustDisclaimerService.js"
      purpose: "Evaluates 4 disclaimer trigger conditions; returns disclaimer text array"
    - path: "src/services/auditService.js"
      purpose: "Append-only audit_log writes; never updates/deletes audit rows"
    - path: "src/handlers/recordHandler.js"
      purpose: "HTTP handlers for GET, POST, PATCH, DELETE, submit-review, publish, supersede, archive, audit endpoints"
    - path: "tests/integration/records.test.js"
      purpose: "Integration tests for all 9 record endpoints (requires live PostgreSQL)"

commits:
  - hash: "1cc8b1d"
    message: "feat(implement-full-tsio-innovation-hub-web-a-05): implement RecordService cluster — all 9 record endpoints"
  - hash: "943da46"
    message: "test(implement-full-tsio-innovation-hub-web-a-05): add integration tests for all 9 record endpoints"
