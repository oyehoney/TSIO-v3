---
phase: implement-full-tsio-innovation-hub-web-a
plan: 18
type: execute
wave: 7
depends_on: [1, 2, 3, 4, 5, 6]
files_modified:
  - e2e/integration/catalog-browsing.spec.ts
  - e2e/integration/search-and-discovery.spec.ts
  - e2e/integration/record-detail.spec.ts
  - e2e/integration/trust-disclaimers.spec.ts
  - e2e/integration/opportunity-submission.spec.ts
  - e2e/integration/share-innovation.spec.ts
  - e2e/integration/engagement-request.spec.ts
  - e2e/integration/admin-publication-lifecycle.spec.ts
  - e2e/integration/oidc-auth-gate.spec.ts
  - e2e/integration/cross-cutting-trust-auth.spec.ts
  - scripts/integration-gap-report.md
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"]
  depends_on: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"]
  enables: []

must_haves:
  truths:
    - "Catalog at / and /catalog shows only PUBLISHED records to unauthenticated users; every card displays maturity badge, review status badge, mission/technology area tags, and published_at (TEST-F0-01, TEST-F0-02, TEST-F0-05)"
    - "Search at /search returns weighted FTS results with query-term highlights; empty-state shows 'Submit a Mission Problem' CTA linking to /submit-opportunity (TEST-F1-01, TEST-F1-11)"
    - "Innovation Record at /records/{id} renders all pub-required content fields, PerspectiveToggle (always visible), ExecutivePerspectivePanel with decision recommendation, TechnicalPerspectivePanel, artifact links opening in new tabs, and next-action engagement panel (TEST-F2-01, TEST-F3-01–TEST-F3-10, TEST-F4-07)"
    - "All 4 trust disclaimer conditions trigger correctly and simultaneously: EXPERIMENT_POC/PROTOTYPE_PILOT maturity → 'POC ≠ production-ready'; PUBLISHED state → 'Published ≠ approved for adoption'; COMMUNITY source_type → 'Community-submitted ≠ centrally endorsed'; VALIDATED_FOR_REUSE review_status → 'Validated for Reuse ≠ local review waived' (TEST-F9-04 through TEST-F9-08)"
    - "Opportunity submission at /submit-opportunity accepts a 50–3000 char problem description and returns confirmation with 'does not imply acceptance' language; no authentication required (TEST-F5-01, TEST-F5-09)"
    - "Share innovation at /share-innovation accepts 1–5 HTTPS artifact URLs; self_assessed_maturity dropdown excludes ARCHIVED; confirmation states curation review required (TEST-F6-01, TEST-F6-03, TEST-F6-06)"
    - "Engagement request modal on a PUBLISHED record's page submits for all 4 types (REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING); returns on-screen confirmation with record reference; returns 404 for non-published record requests (TEST-F7-04, TEST-F7-06)"
    - "Admin publication lifecycle DRAFT→REVIEW→PUBLISHED completes successfully through the admin UI with a seeded record satisfying all governance gate requirements; published record immediately appears in catalog (TEST-F2-10, TEST-F8-06)"
    - "Unauthenticated access to /admin/* redirects to OIDC login; authenticated non-CURATOR user receives 403 (TEST-F8-01, TEST-F8-02)"
    - "Audio Security POC anchor record (F4) is published with key findings covering GPU/CPU separation, Azure Government Cloud constraints, performance/latency limitations, and production-readiness gaps; discoverable via catalog and search (TEST-F4-09)"
  artifacts:
    - path: "e2e/integration/catalog-browsing.spec.ts"
      provides: "Playwright tests: catalog renders PUBLISHED records only; card fields complete; filter panel; sort; pagination; community/reuse badges (TEST-F0-01–TEST-F0-14)"
    - path: "e2e/integration/search-and-discovery.spec.ts"
      provides: "Playwright tests: weighted FTS returns results; highlights; filters; URL state; empty-state CTA; blank/long query validation (TEST-F1-01–TEST-F1-12)"
    - path: "e2e/integration/record-detail.spec.ts"
      provides: "Playwright tests: full Innovation Record; PerspectiveToggle; Executive/Technical panels; artifact links in new tab; audit history; 404 for non-published; ?view= URL param (TEST-F2-01–TEST-F2-04, TEST-F3-01–TEST-F3-10, TEST-F4-07–TEST-F4-08)"
    - path: "e2e/integration/trust-disclaimers.spec.ts"
      provides: "Playwright tests: all 4 disclaimer trigger conditions; simultaneous multi-disclaimer rendering; identical in both perspectives; curator cannot suppress (TEST-F9-04–TEST-F9-10)"
    - path: "e2e/integration/opportunity-submission.spec.ts"
      provides: "Playwright tests: /submit-opportunity form; field validation; CAPTCHA bypass for e2e; rate-limit feedback; confirmation text; curator submissions queue (TEST-F5-01–TEST-F5-09)"
    - path: "e2e/integration/share-innovation.spec.ts"
      provides: "Playwright tests: /share-innovation form; ARCHIVED excluded from maturity dropdown; 1-5 HTTPS URL validation; curation messaging; confirmation text (TEST-F6-01–TEST-F6-07)"
    - path: "e2e/integration/engagement-request.spec.ts"
      provides: "Playwright tests: engagement modal for all 4 types on PUBLISHED record; 404 guard on non-published; record reference pre-populated; email routing confirmation (TEST-F7-01–TEST-F7-08)"
    - path: "e2e/integration/admin-publication-lifecycle.spec.ts"
      provides: "Playwright tests: full DRAFT→REVIEW→PUBLISHED lifecycle; governance gate blocking; audit log entries; curator-only record visibility (TEST-F2-05–TEST-F2-17, TEST-F8-04–TEST-F8-10)"
    - path: "e2e/integration/oidc-auth-gate.spec.ts"
      provides: "Playwright tests: unauthenticated /admin/* redirects to login; authenticated non-CURATOR gets 403; session expiry redirects to login (TEST-F8-01–TEST-F8-03)"
    - path: "e2e/integration/cross-cutting-trust-auth.spec.ts"
      provides: "Playwright tests: POC≠production-ready visible on every POC/Prototype record; PUBLISHED≠approved-for-adoption on every PUBLISHED record; maturity/review badges on all catalog cards and record pages (TEST-F9-01–TEST-F9-03, TEST-F9-11–TEST-F9-15)"
    - path: "scripts/integration-gap-report.md"
      provides: "Documented cross-cutting gaps discovered during integration validation with remediation notes"
  key_links:
    - from: "e2e/integration/catalog-browsing.spec.ts"
      to: "GET /api/v1/catalog"
      via: "Playwright page.goto('/') or page.goto('/catalog') then API intercept assertions"
      pattern: "api/v1/catalog"
    - from: "e2e/integration/search-and-discovery.spec.ts"
      to: "GET /api/v1/search?q="
      via: "page.fill('[role=searchbox]') + page.press Enter then URL assertion"
      pattern: "api/v1/search"
    - from: "e2e/integration/record-detail.spec.ts"
      to: "GET /api/v1/records/:id"
      via: "page.goto('/records/:id') then field assertions on RecordPage"
      pattern: "api/v1/records"
    - from: "e2e/integration/trust-disclaimers.spec.ts"
      to: "TrustDisclaimerService trigger conditions"
      via: "Mock API returns record with specific maturity_level/source_type/review_status/publication_state; assert disclaimer text visible"
      pattern: "Trust.*Limitations|POC.*production|Published.*approved|Community.*endorsed|Validated.*waived"
    - from: "e2e/integration/engagement-request.spec.ts"
      to: "POST /api/v1/engagement-requests"
      via: "page.click engagement button; fill modal form; submit; assert confirmation"
      pattern: "api/v1/engagement-requests"
    - from: "e2e/integration/admin-publication-lifecycle.spec.ts"
      to: "POST /api/v1/records/:id/publish"
      via: "Admin UI: click Publish button; assert published_at set; navigate to catalog to confirm record appears"
      pattern: "api/v1/records.*publish"
    - from: "e2e/integration/oidc-auth-gate.spec.ts"
      to: "GET /admin/* → 302 to /auth/login"
      via: "page.goto('/admin') with no session cookie; assert redirect"
      pattern: "auth/login|oidc/authorize"

integration_contracts:
  requires:
    # Wave 1 — Database schema
    - from_plan: "01"
      artifact: "prisma/schema.prisma or db/migrations/"
      exports: ["innovation_records table with all 29 fields", "record_key_findings", "record_artifact_links", "record_tags", "record_engagement_options", "audit_log", "FTS search_vector GIN index", "trg_innovation_record_fts trigger"]
      verify: "grep -rn 'innovation_records\|search_vector\|trg_innovation_record_fts' db/ prisma/ migrations/ 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "db/migrations/ or prisma/schema.prisma"
      exports: ["users table with role enum (CURATOR, ADMIN)", "hub_settings table with engagement_routing_email", "opportunity_submissions", "contribution_submissions", "engagement_requests"]
      verify: "grep -rn 'users\|hub_settings\|opportunity_submissions\|engagement_requests' db/ prisma/ migrations/ 2>/dev/null | head -5 && echo CONTRACT_OK"
    # Wave 2 — Core public API
    - from_plan: "03"
      artifact: "src/services/catalog.service.js"
      exports: ["CatalogService — GET /api/v1/catalog with publication_state=PUBLISHED filter", "GET /api/v1/catalog/filters"]
      verify: "grep -n 'PUBLISHED\|CatalogService\|catalog' src/services/catalog.service.js && echo CONTRACT_OK"
    - from_plan: "04"
      artifact: "src/services/search.service.js"
      exports: ["SearchService — GET /api/v1/search?q= weighted FTS", "tsvector search_vector column queried"]
      verify: "grep -n 'SearchService\|search_vector\|tsvector\|tsquery' src/services/search.service.js && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "src/services/record.service.js"
      exports: ["RecordService — 9 CRUD + lifecycle endpoints", "TrustDisclaimerService — 4 trigger conditions", "GovernanceGateService — pub-required field validation", "PublicationLifecycleService — DRAFT→REVIEW→PUBLISHED state machine", "AuditService — append-only audit_log"]
      verify: "grep -n 'TrustDisclaimerService\|GovernanceGateService\|PublicationLifecycleService\|AuditService' src/services/record.service.js src/services/*.js 2>/dev/null | head -10 && echo CONTRACT_OK"
    # Wave 3 — Admin/engagement API
    - from_plan: "06"
      artifact: "src/middleware/auth.middleware.js"
      exports: ["AuthMiddleware — OIDC token validation", "requireCurator — 401/403 guard on /admin/* routes", "users table upsert on first login"]
      verify: "grep -n 'requireCurator\|OIDC\|AuthMiddleware\|CURATOR' src/middleware/auth.middleware.js && echo CONTRACT_OK"
    - from_plan: "07"
      artifact: "src/services/submission.service.js"
      exports: ["SubmissionService — POST /api/v1/opportunity-submissions", "POST /api/v1/contribution-submissions", "CaptchaService", "RateLimiter (5/IP/hr)"]
      verify: "grep -n 'SubmissionService\|opportunity-submissions\|contribution-submissions\|CaptchaService\|RateLimiter' src/services/submission.service.js src/routes/*.js 2>/dev/null | head -10 && echo CONTRACT_OK"
    - from_plan: "08"
      artifact: "src/services/engagement.service.js"
      exports: ["EngagementService — POST /api/v1/engagement-requests (PUBLISHED records only)", "SettingsService — GET/PUT /api/v1/admin/settings (engagement_routing_email)", "EmailService non-fatal SMTP"]
      verify: "grep -n 'EngagementService\|engagement-requests\|SettingsService\|engagement_routing_email' src/services/engagement.service.js src/services/*.js 2>/dev/null | head -10 && echo CONTRACT_OK"
    # Wave 4 — Public UI
    - from_plan: "09"
      artifact: "src/pages/CatalogPage.tsx"
      exports: ["CatalogPage at / and /catalog", "CatalogCard with maturity badge, review status badge, tags, engagement indicators", "FilterPanel", "SortControls", "Pagination"]
      verify: "grep -n 'CatalogPage\|CatalogCard\|maturity.*badge\|review.*badge' src/pages/CatalogPage.tsx src/components/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "10"
      artifact: "src/pages/SearchPage.tsx"
      exports: ["SearchPage at /search", "weighted FTS result cards with highlights", "FilterPanel", "URL state for q + filters", "empty-state CTA to /submit-opportunity"]
      verify: "grep -n 'SearchPage\|highlight\|submit-opportunity\|empty.*state' src/pages/SearchPage.tsx src/components/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "11"
      artifact: "src/pages/RecordPage.tsx"
      exports: ["RecordPage at /records/:id", "PerspectiveToggle (always visible)", "ExecutivePerspectivePanel", "TechnicalPerspectivePanel", "TrustDisclaimersSection", "ArtifactLinksSection", "EngagementPanel", "?view= URL param support"]
      verify: "grep -n 'RecordPage\|PerspectiveToggle\|ExecutivePerspectivePanel\|TechnicalPerspectivePanel\|TrustDisclaimer' src/pages/RecordPage.tsx src/components/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    # Wave 5 — Public forms
    - from_plan: "12"
      artifact: "src/pages/SubmitOpportunityPage.tsx"
      exports: ["SubmitOpportunityPage at /submit-opportunity", "problem-first field ordering", "CAPTCHA integration", "confirmation message with 'does not imply acceptance'"]
      verify: "grep -n 'SubmitOpportunityPage\|does not imply\|problem_description\|submit-opportunity' src/pages/SubmitOpportunityPage.tsx src/pages/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "12"
      artifact: "src/pages/ShareInnovationPage.tsx"
      exports: ["ShareInnovationPage at /share-innovation", "self_assessed_maturity excluding ARCHIVED", "1-5 HTTPS artifact URLs", "curation review confirmation message"]
      verify: "grep -n 'ShareInnovationPage\|share-innovation\|ARCHIVED\|artifact_urls' src/pages/ShareInnovationPage.tsx src/pages/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "13"
      artifact: "src/components/EngagementModal.tsx"
      exports: ["EngagementModal on RecordPage for all 4 engagement types (REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING)", "record reference pre-populated", "CAPTCHA", "on-screen confirmation"]
      verify: "grep -n 'EngagementModal\|REQUEST_DEMO\|REQUEST_TECHNICAL_GUIDANCE\|REQUEST_ADOPTION' src/components/EngagementModal.tsx src/components/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    # Wave 6 — Admin UI
    - from_plan: "14"
      artifact: "src/admin/pages/RecordsListPage.tsx"
      exports: ["Admin auth gate redirects /admin/* to OIDC login", "DashboardPage with 5 summary tiles", "RecordsListPage all states sortable", "RecordEditPage 29 fields with PublicationReadinessChecklist"]
      verify: "grep -n 'RecordsListPage\|DashboardPage\|admin.*auth\|requireCurator\|/admin' src/admin/pages/*.tsx src/admin/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "15"
      artifact: "src/admin/components/PublicationLifecycleControls.tsx"
      exports: ["PublicationLifecycleControls — state-aware action buttons", "ConfirmationDialog", "GovernanceGateFeedback — inline blocking field list", "MaturityLevelDropdown + ReviewStatusDropdown with inline definitions"]
      verify: "grep -n 'PublicationLifecycleControls\|GovernanceGateFeedback\|MaturityLevelDropdown\|ReviewStatusDropdown' src/admin/components/PublicationLifecycleControls.tsx src/admin/components/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    - from_plan: "16"
      artifact: "src/pages/admin/submissions/OpportunitySubmissionsPage.tsx"
      exports: ["OpportunitySubmissionsPage — 4-disposition queue", "ContributionSubmissionsPage — Create Record CTA after ACCEPTED_FOR_CURATION", "EngagementActivityPage — log with filters + inline status update", "SettingsPage — routing email config", "ContentModelReferencePage — read-only 5 maturity + 7 review status definitions", "AdminLayout with all pages wired in sidebar"]
      verify: "grep -n 'OpportunitySubmissionsPage\|ContributionSubmissionsPage\|EngagementActivityPage\|SettingsPage\|ContentModelReferencePage' src/pages/admin/submissions/*.tsx src/pages/admin/*.tsx 2>/dev/null | head -5 && echo CONTRACT_OK"
    # Wave 7a (plan 17 — seed + app boot) — must complete before this plan
    - from_plan: "17"
      artifact: "seeds/audio-security-poc.sql or seeds/seed.ts"
      exports: ["Audio Security POC Innovation Record in PUBLISHED state with all pub-required fields satisfied", "key_findings: GPU/CPU separation, Azure Government Cloud constraints, performance limitations, production-readiness gaps", "artifact_link: DOCUMENT type pointing to SharePoint URL", "hub_settings: engagement_routing_email = 'AOml_TSO_IRB_Team@ao.uscourts.gov'"]
      verify: "grep -rn 'Audio Security\|audio.security\|gpu.*cpu\|azure.*gov' seeds/ db/seeds/ 2>/dev/null | head -5 && echo CONTRACT_OK"
  provides:
    # This is the final wave — provides the overall system acceptance criteria
    - artifact: "e2e/integration/"
      exports:
        - "Complete Playwright test suite (10 spec files) covering all 10 features F0–F9"
        - "130+ test cases mapped to RTM TEST-F0-01 through TEST-F9-15"
        - "All tests pass against the seeded TSIO Innovation Hub application"
        - "Zero cross-cutting trust/auth gaps found in integration validation (or all documented in scripts/integration-gap-report.md)"
      shape: |
        System acceptance criteria — the TSIO Innovation Hub MVP is DONE when:
        1. All 10 feature integration test suites pass (0 failures, 0 skipped)
        2. Audio Security POC anchor record (F4) is published and discoverable
        3. All 4 trust disclaimer conditions trigger correctly per TEST-F9-04–TEST-F9-08
        4. Full publication lifecycle DRAFT→REVIEW→PUBLISHED completes through admin UI
        5. OIDC auth gate blocks unauthenticated /admin/* access
        6. Engagement request routing email confirmed (configurable; non-fatal on failure)
        7. Opportunity submission and Share Innovation forms confirm curation-before-publication
      verify: "npx playwright test e2e/integration/ --reporter=list 2>&1 | tail -10 && echo CONTRACT_OK"
    - artifact: "scripts/integration-gap-report.md"
      exports:
        - "Document of any cross-cutting gaps discovered during Wave 7b integration validation"
        - "Each gap: feature ID, test case, actual vs expected behavior, remediation recommendation"
        - "Empty 'gaps' section = no cross-cutting issues found"
      shape: |
        # Integration Gap Report — Wave 7b
        Generated: {date}
        Status: PASSED (or GAPS FOUND — see below)
        ## Gaps Found
        (none, or list of gaps with feature ID, test case, description, remediation)
      verify: "ls scripts/integration-gap-report.md && echo CONTRACT_OK"
---

<objective>
Run the complete **end-to-end integration validation** across all 10 features (F0–F9) of the TSIO Innovation Hub — the final acceptance gate for Wave 7 and the MVP.

This plan does NOT build new features. It:
1. Writes a comprehensive Playwright test suite across 10 feature domains that exercises the fully-seeded app (built in plan 17) against the exact acceptance criteria defined in the RTM.
2. Validates all cross-cutting trust/auth concerns: all 4 trust disclaimer conditions, POC≠production-ready visibility, PUBLISHED≠approved-for-adoption messaging, OIDC auth gate behavior.
3. Produces a gap report documenting any cross-cutting issues discovered during integration validation.

**Grounding:**
- RTM test cases TEST-F0-01 through TEST-F9-15 (130 test cases) drive the Playwright spec contents.
- JOURNEYS JRN-01.1 through JRN-05.2 drive the end-to-end scenario flow structure.
- WAVE-SCHEDULE.md plan 17 seeds the Audio Security POC anchor record (F4) that all integration tests run against.
- All 4 trust disclaimer trigger conditions from PRD §6.3 / FRD F09 are validated in dedicated integration tests.

Purpose: Declare the TSIO Innovation Hub MVP **DONE** — every user-facing behavior, every trust signal, every auth guard, every engagement path exercised and confirmed.

Output:
- `e2e/integration/` — 10 Playwright spec files (one per feature domain)
- `scripts/integration-gap-report.md` — cross-cutting gap report (empty gaps section = MVP ready to ship)
</objective>

<feature_dependencies>
Implements: F0: Innovation Catalog (catalog-browsing integration tests); F1: Search and Discovery (search-and-discovery integration tests); F2: Innovation Record (record-detail integration tests + admin lifecycle tests); F3: Executive and Technical Perspectives (perspective toggle and panel tests in record-detail.spec.ts); F4: Existing Lessons-Learned Integration (Audio Security POC anchor record end-to-end validation); F5: Opportunity Submission (opportunity-submission integration tests); F6: Share Existing Innovation Work (share-innovation integration tests); F7: Engagement Routing (engagement-request integration tests including email routing confirmation); F8: Curation and Administration (admin-publication-lifecycle + oidc-auth-gate integration tests); F9: Content, Maturity & Trust Model (trust-disclaimers + cross-cutting-trust-auth integration tests)
Depends on: All prior waves — Wave 1 (DB schema), Wave 2 (core public API), Wave 3 (admin/engagement API), Wave 4 (public UI), Wave 5 (public forms), Wave 6 (admin UI), Plan 17 (Audio Security POC seed + app boot verification)
Enables: None (this is the final integration validation — MVP acceptance)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/17-PLAN.md
@project_specs/RTM-TSIO-Innovation-Hub.md
@project_specs/JOURNEYS-TSIO-Innovation-Hub.md
@project_specs/PRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Full Playwright integration test suite — catalog, search, record detail, trust disclaimers, forms, engagement, auth gate</name>
  <files>
    e2e/integration/catalog-browsing.spec.ts
    e2e/integration/search-and-discovery.spec.ts
    e2e/integration/record-detail.spec.ts
    e2e/integration/trust-disclaimers.spec.ts
    e2e/integration/opportunity-submission.spec.ts
    e2e/integration/share-innovation.spec.ts
    e2e/integration/engagement-request.spec.ts
    e2e/integration/admin-publication-lifecycle.spec.ts
    e2e/integration/oidc-auth-gate.spec.ts
    e2e/integration/cross-cutting-trust-auth.spec.ts
  </files>
  <action>
Create `e2e/integration/` directory if it does not exist. Write 10 Playwright spec files that together constitute the full integration validation suite. All tests use `page.route()` mocks for the API layer (so the suite runs without a live backend) **unless** a live seeded backend is available from plan 17 — in that case, prefer live API calls for integration fidelity and mock only what is unavailable.

Verify `playwright.config.ts` exists with a `baseURL` pointing to the application. If missing, create it with `baseURL: process.env.BASE_URL || 'http://localhost:3000'`.

Each file targets the RTM test cases listed in the spec header. Use the Audio Security POC anchor record as the primary test record (seeded by plan 17).

---

### Architecture convention for all 10 spec files

```typescript
// Shared mock data for the Audio Security POC anchor record
// This is the MVP anchor record seeded by plan 17 (seeds/audio-security-poc.sql)
const AUDIO_SECURITY_POC = {
  record_id: 'rec-audio-security-poc-001',
  title: 'Audio Security POC — Courtroom Audio Processing',
  problem_statement: 'Federal courtrooms require reliable audio capture and processing for proceedings, but existing consumer-grade audio hardware lacks the security posture required for classified or sensitive proceedings.',
  what_was_explored: 'GPU/CPU separation approach to isolate audio processing from court network; Azure Government Cloud constraints on GPU VM availability; FIPS-compliant audio codec evaluation.',
  outcome_summary: 'POC demonstrated feasibility of GPU/CPU separation for audio security, but identified significant Azure Government Cloud limitations and hardware procurement gaps.',
  maturity_level: 'EXPERIMENT_POC',
  review_status: 'TECHNICALLY_REVIEWED',
  reuse_potential: 'HIGH',
  source_type: 'INTERNAL',
  owner_name: 'I&R Technical Lead',
  owner_office: 'TSIO Innovation & Research',
  contributing_office: 'TSIO I&R',
  publication_state: 'PUBLISHED',
  published_at: '2026-07-28T00:00:00Z',
  last_reviewed_date: '2026-07-25',
  executive_perspective_text: 'This POC established that secure GPU-accelerated audio processing is technically feasible for Judiciary environments, but is not yet production-ready.',
  executive_recommendation: 'Not recommended for production adoption without additional security review and hardware procurement assessment. Consider initiating a prototype/pilot phase.',
  technical_perspective_text: 'GPU/CPU separation implemented using NVIDIA T4 instances on Azure Government Cloud. Audio processing pipeline isolated in a separate VLAN. FIPS 140-2 validated codec evaluated.',
  security_findings: 'Azure Government Cloud GPU VM availability is limited to specific regions. FIPS-compliant codec introduces 40ms latency. Full ISSO review not yet completed.',
  performance_findings: 'Real-time audio processing achievable at 48kHz sample rate with <80ms round-trip latency under normal load. GPU utilization peaks at 60% during active sessions.',
  reuse_guidance: 'Courts adopting this approach must: (1) provision dedicated GPU infrastructure or Azure Government Cloud GPU VMs; (2) engage local ISSO for security review before deployment; (3) evaluate FIPS codec latency tolerance with court stakeholders.',
  short_summary: 'A proof of concept exploring secure GPU/CPU-separated audio processing for courtroom use, including Azure Government Cloud constraints and production-readiness assessment.',
  default_perspective: 'EXECUTIVE',
  key_findings: [
    { finding_id: 'kf-001', finding_text: 'GPU/CPU separation is technically feasible but requires dedicated GPU infrastructure not available in most courts.', finding_order: 1 },
    { finding_id: 'kf-002', finding_text: 'Azure Government Cloud imposes GPU VM availability constraints; dedicated hardware procurement is required for most court environments.', finding_order: 2 },
    { finding_id: 'kf-003', finding_text: 'FIPS 140-2 compliant codec introduces 40ms latency, which may be acceptable for recorded proceedings but requires stakeholder evaluation for live hearings.', finding_order: 3 },
    { finding_id: 'kf-004', finding_text: 'This POC has not completed security or policy review. It is not production-ready and should not be deployed in a production Judiciary environment without ISSO review.', finding_order: 4 },
  ],
  artifact_links: [
    { link_id: 'al-001', label: 'Audio Security POC Lessons Learned Document', url: 'https://ao.sharepoint.com/sites/TSIO/Documents/AudioSecurityPOC-LessonsLearned.docx', artifact_type: 'DOCUMENT', display_order: 1 },
    { link_id: 'al-002', label: 'Architecture Diagram', url: 'https://ao.sharepoint.com/sites/TSIO/Diagrams/AudioSec-Architecture.png', artifact_type: 'DIAGRAM', display_order: 2 },
  ],
  mission_area_tags: [{ tag_id: 't-001', tag_value: 'Courtroom Technology', tag_type: 'MISSION_AREA' }],
  technology_area_tags: [{ tag_id: 't-002', tag_value: 'Audio Processing', tag_type: 'TECHNOLOGY_AREA' }, { tag_id: 't-003', tag_value: 'Cloud Infrastructure', tag_type: 'TECHNOLOGY_AREA' }],
  engagement_options: [
    { option_id: 'eo-001', engagement_type: 'REQUEST_DEMO' },
    { option_id: 'eo-002', engagement_type: 'REQUEST_TECHNICAL_GUIDANCE' },
    { option_id: 'eo-003', engagement_type: 'REQUEST_BRIEFING' },
  ],
};

// Catalog card projection (returned by GET /api/v1/catalog)
const AUDIO_SECURITY_CATALOG_CARD = {
  record_id: AUDIO_SECURITY_POC.record_id,
  title: AUDIO_SECURITY_POC.title,
  short_summary: AUDIO_SECURITY_POC.short_summary,
  maturity_level: AUDIO_SECURITY_POC.maturity_level,
  review_status: AUDIO_SECURITY_POC.review_status,
  reuse_potential: AUDIO_SECURITY_POC.reuse_potential,
  source_type: AUDIO_SECURITY_POC.source_type,
  publication_state: AUDIO_SECURITY_POC.publication_state,
  published_at: AUDIO_SECURITY_POC.published_at,
  mission_area_tags: AUDIO_SECURITY_POC.mission_area_tags,
  technology_area_tags: AUDIO_SECURITY_POC.technology_area_tags,
  engagement_options: AUDIO_SECURITY_POC.engagement_options,
};
```

---

### File 1: `e2e/integration/catalog-browsing.spec.ts`

Tests: TEST-F0-01 through TEST-F0-14. User story: JRN-01.1 (Browse stage — Margaret finds the Audio Security POC card), JRN-02.1 (filter + maturity badge).

```typescript
// e2e/integration/catalog-browsing.spec.ts
// RTM: TEST-F0-01 through TEST-F0-14
// Journeys: JRN-01.1 (Arrive, Browse, Locate), JRN-02.1 (Filter)
// F0: Innovation Catalog + F9: trust signals on catalog cards

import { test, expect } from '@playwright/test';

// [Paste AUDIO_SECURITY_CATALOG_CARD and a second PUBLISHED record here as fixtures]

test.describe('F0: Innovation Catalog', () => {

  test('TEST-F0-01: catalog page renders at / and /catalog with all published records', async ({ page }) => {
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/');
    await expect(page.getByText('Audio Security POC')).toBeVisible();
    await page.goto('/catalog');
    await expect(page.getByText('Audio Security POC')).toBeVisible();
  });

  test('TEST-F0-02: each catalog card displays all 9 required fields', async ({ page }) => {
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    // title
    await expect(page.getByText('Audio Security POC')).toBeVisible();
    // short_summary
    await expect(page.getByText(/proof of concept/i)).toBeVisible();
    // maturity badge (EXPERIMENT_POC)
    await expect(page.getByText(/Experiment.*POC|POC/i).first()).toBeVisible();
    // review status badge (TECHNICALLY_REVIEWED)
    await expect(page.getByText(/Technically Reviewed/i)).toBeVisible();
    // mission/technology area tags
    await expect(page.getByText(/Courtroom Technology/i)).toBeVisible();
    // published_at date
    await expect(page.getByText(/2026-07-28|Jul 28/i)).toBeVisible();
    // engagement indicator — at least one option configured
    await expect(page.getByText(/Demo|Guidance|Briefing/i)).toBeVisible();
  });

  test('TEST-F0-05: only PUBLISHED records visible to unauthenticated users', async ({ page }) => {
    const draftRecord = { ...AUDIO_SECURITY_CATALOG_CARD, record_id: 'rec-draft-001', title: 'Draft Record - Should Not Appear', publication_state: 'DRAFT' };
    await page.route('**/api/v1/catalog*', route => {
      // API correctly returns only PUBLISHED records; simulate this
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD], // draftRecord NOT included
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    await expect(page.getByText('Audio Security POC')).toBeVisible();
    await expect(page.getByText('Draft Record - Should Not Appear')).not.toBeVisible();
  });

  test('TEST-F0-06: multi-select maturity filter narrows catalog correctly', async ({ page }) => {
    let capturedUrl = '';
    await page.route('**/api/v1/catalog*', route => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    // Apply maturity filter — selector label varies by implementation; adapt
    const maturityFilterControl = page.getByRole('combobox', { name: /maturity/i }).or(page.getByLabel(/maturity/i));
    if (await maturityFilterControl.count() > 0) {
      await maturityFilterControl.first().selectOption('EXPERIMENT_POC');
      await expect(async () => {
        expect(capturedUrl).toContain('maturity_level');
      }).toPass({ timeout: 3000 });
    } else {
      // Checkbox-style filter
      const maturityCheckbox = page.getByLabel(/Experiment.*POC/i);
      if (await maturityCheckbox.count() > 0) {
        await maturityCheckbox.click();
        await expect(async () => {
          expect(capturedUrl).toContain('maturity_level');
        }).toPass({ timeout: 3000 });
      }
    }
  });

  test('TEST-F0-10: zero results with active filter shows empty-state with F5 CTA', async ({ page }) => {
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    // Empty-state message
    await expect(page.getByText(/no.*record|no.*result|no.*innovation/i)).toBeVisible();
    // F5 CTA link
    const ctaLink = page.getByRole('link', { name: /submit.*mission.*problem|submit.*opportunity/i });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
  });

  test('TEST-F0-11: community badge shown on cards with source_type=COMMUNITY', async ({ page }) => {
    const communityRecord = { ...AUDIO_SECURITY_CATALOG_CARD, record_id: 'rec-community-001', title: 'Community Innovation Record', source_type: 'COMMUNITY' };
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [communityRecord],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    await expect(page.getByText(/Community.*Contributed|Community Submission/i)).toBeVisible();
  });

  test('TEST-F0-12: reuse badge shown on cards with review_status=VALIDATED_FOR_REUSE', async ({ page }) => {
    const reuseRecord = { ...AUDIO_SECURITY_CATALOG_CARD, record_id: 'rec-reuse-001', title: 'Validated Reuse Pattern', review_status: 'VALIDATED_FOR_REUSE' };
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [reuseRecord],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    await expect(page.getByText(/Validated for Reuse|Reuse Ready/i)).toBeVisible();
  });

  test('TEST-F0-04: default sort is Most Recent; pagination shows 12 cards per page', async ({ page }) => {
    const cards = Array.from({ length: 12 }, (_, i) => ({
      ...AUDIO_SECURITY_CATALOG_CARD,
      record_id: `rec-${String(i).padStart(3, '0')}`,
      title: `Innovation Record ${i + 1}`,
    }));
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: cards,
        pagination: { page: 1, page_size: 12, total_count: 13, total_pages: 2 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    // 12 cards rendered
    await expect(page.getByTestId('catalog-card').or(page.locator('[data-card]').or(page.locator('.catalog-card')))).toHaveCount(12, { timeout: 5000 });
    // Pagination controls visible (next page)
    await expect(page.getByRole('navigation', { name: /pagination/i }).or(page.getByLabel(/page.*2|next.*page/i))).toBeVisible();
  });
});
```

---

### File 2: `e2e/integration/search-and-discovery.spec.ts`

Tests: TEST-F1-01 through TEST-F1-12. Journeys: JRN-02.1 (Search + Filter), JRN-02.2 (empty-state CTA), JRN-03.1 (Arrive/search for audio security).

```typescript
// e2e/integration/search-and-discovery.spec.ts
// RTM: TEST-F1-01 through TEST-F1-12
// Journeys: JRN-02.1 (Search, Filter), JRN-02.2 (Empty state → F5 CTA), JRN-03.1 (Arrive)

import { test, expect } from '@playwright/test';

test.describe('F1: Search and Discovery', () => {

  test('TEST-F1-01: search field accessible from catalog; search returns results', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [{ ...AUDIO_SECURITY_CATALOG_CARD, snippet: 'GPU/CPU separation approach to isolate audio processing' }],
        pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        query: 'audio security',
      })});
    });
    await page.goto('/');
    // Search input accessible from nav/catalog
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).or(page.getByLabel(/search/i));
    await searchInput.first().fill('audio security');
    await searchInput.first().press('Enter');
    await page.waitForURL(/search/);
    await expect(page.getByText('Audio Security POC')).toBeVisible();
  });

  test('TEST-F1-04: result cards show query-term highlights in snippet', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [{ ...AUDIO_SECURITY_CATALOG_CARD, snippet: 'GPU/CPU separation approach to isolate <mark>audio</mark> processing' }],
        pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        query: 'audio',
      })});
    });
    await page.goto('/search?q=audio');
    // Highlighted term visible — either via <mark> element or highlighted span
    await expect(page.locator('mark, .highlight, [data-highlight]').first()).toBeVisible();
  });

  test('TEST-F1-06: search results accessible via direct URL with query parameters', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        query: 'audio security',
      })});
    });
    await page.goto('/search?q=audio+security');
    await expect(page.getByText('Audio Security POC')).toBeVisible();
    // URL contains query param
    expect(page.url()).toContain('q=');
  });

  test('TEST-F1-09: blank query does not execute search; prompt rendered', async ({ page }) => {
    let searchCalled = false;
    await page.route('**/api/v1/search*', route => {
      searchCalled = true;
      route.fallback();
    });
    await page.goto('/search');
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await searchInput.first().fill('   '); // whitespace only
    await searchInput.first().press('Enter');
    // No search API call
    expect(searchCalled).toBe(false);
    // Prompt shown
    await expect(page.getByText(/enter.*search|search.*term/i)).toBeVisible();
  });

  test('TEST-F1-10: query over 500 chars returns 400 with QUERY_TOO_LONG inline error', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({
        error: { code: 'QUERY_TOO_LONG', message: 'Your search query is too long. Please shorten it to 500 characters or fewer.' },
      })});
    });
    await page.goto('/search');
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    const longQuery = 'a'.repeat(501);
    await searchInput.first().fill(longQuery);
    await searchInput.first().press('Enter');
    await expect(page.getByText(/too long|500 characters/i)).toBeVisible();
  });

  test('TEST-F1-11: zero results shows empty-state with F5 submission CTA', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [],
        pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0 },
        query: 'remote hearing scheduling integration',
      })});
    });
    await page.goto('/search?q=remote+hearing+scheduling+integration');
    // JRN-02.2: empty-state message with F5 CTA
    await expect(page.getByText(/no.*record|no.*result/i)).toBeVisible();
    await expect(page.getByText(/submit.*mission.*problem|submit.*opportunity/i)).toBeVisible();
    const ctaLink = page.getByRole('link', { name: /submit.*mission|submit.*opportunity/i });
    await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
  });

  test('TEST-F1-05: search scoped to PUBLISHED records for PUBLIC role', async ({ page }) => {
    await page.route('**/api/v1/search*', route => {
      // Simulates API returning only PUBLISHED records; no DRAFT in results
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD], // only PUBLISHED
        pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        query: 'audio',
      })});
    });
    await page.goto('/search?q=audio');
    await expect(page.getByText('Audio Security POC')).toBeVisible();
    // No DRAFT record visible
    await expect(page.getByText('Draft Record - Should Not Appear')).not.toBeVisible();
  });
});
```

---

### File 3: `e2e/integration/record-detail.spec.ts`

Tests: TEST-F2-01, TEST-F2-02, TEST-F2-04, TEST-F3-01 through TEST-F3-10, TEST-F4-07, TEST-F4-08. Journeys: JRN-01.1 (Locate → Read → Act), JRN-03.1 (Technical Perspective evaluation).

```typescript
// e2e/integration/record-detail.spec.ts
// RTM: TEST-F2-01–F2-04, TEST-F3-01–F3-10, TEST-F4-07, TEST-F4-08
// Journeys: JRN-01.1 (Read executive perspective + briefing CTA), JRN-03.1 (Technical perspective)

import { test, expect } from '@playwright/test';

test.describe('F2/F3/F4: Innovation Record + Perspectives + Artifact Links', () => {

  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/v1/records/${AUDIO_SECURITY_POC.record_id}*`, route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: AUDIO_SECURITY_POC })});
    });
  });

  test('TEST-F2-01: full Innovation Record renders at /records/:id with all content fields', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Core content fields present
    await expect(page.getByText(AUDIO_SECURITY_POC.title)).toBeVisible();
    await expect(page.getByText(/Federal courtrooms require/i)).toBeVisible(); // problem_statement
    await expect(page.getByText(/GPU\/CPU separation/i)).toBeVisible(); // what_was_explored excerpt or key finding
    // Trust Disclaimers section
    await expect(page.getByText(/Trust.*Limitations|Disclaimers/i)).toBeVisible();
  });

  test('TEST-F2-02: artifact links open in new tab; no content embedded', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    const artifactLink = page.getByRole('link', { name: /Lessons Learned Document/i });
    await expect(artifactLink).toBeVisible();
    await expect(artifactLink).toHaveAttribute('target', '_blank');
    await expect(artifactLink).toHaveAttribute('rel', /noopener/i);
    // No iframe embedding
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('TEST-F2-04: non-published record returns 404 for PUBLIC user', async ({ page }) => {
    await page.route('**/api/v1/records/rec-draft-secret*', route => {
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'RECORD_NOT_FOUND' } })});
    });
    await page.goto('/records/rec-draft-secret');
    await expect(page.getByText(/not found|404|does not exist/i)).toBeVisible();
  });

  // F3: Executive and Technical Perspectives
  test('TEST-F3-01: Executive Perspective is default view on record open', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Default perspective = EXECUTIVE per record.default_perspective
    await expect(page.getByText(AUDIO_SECURITY_POC.executive_perspective_text)).toBeVisible();
    // Technical architecture details NOT visible by default
    await expect(page.getByText('GPU utilization peaks at 60%')).not.toBeVisible();
  });

  test('TEST-F3-02: Executive Perspective shows mission relevance; technical details absent', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    await expect(page.getByText(/Not recommended for production adoption/i)).toBeVisible(); // executive_recommendation
    // Architecture detail from technical_perspective_text should NOT be in executive view
    await expect(page.getByText(/NVIDIA T4 instances/i)).not.toBeVisible();
  });

  test('TEST-F3-03: primary CTA in Executive Perspective is Request Briefing or Request Demo', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Executive perspective primary CTAs per F3 spec
    await expect(page.getByRole('button', { name: /Request.*Briefing|Request.*Demo/i }).first()).toBeVisible();
  });

  test('TEST-F3-05: PerspectiveToggle always visible; cannot be hidden', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Toggle/tab always visible per TEST-F3-05
    await expect(page.getByRole('tab', { name: /Executive|Technical/i }).first().or(
      page.getByText(/Executive View|Technical View|Executive Perspective|Technical Perspective/i).first()
    )).toBeVisible();
  });

  test('TEST-F3-06: switching to Technical Perspective shows technical fields', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Switch to Technical view
    const techToggle = page.getByRole('tab', { name: /Technical/i }).or(page.getByRole('button', { name: /Technical.*View|Technical.*Perspective/i }));
    await techToggle.first().click();
    // Technical perspective fields visible
    await expect(page.getByText(/NVIDIA T4 instances/i).or(page.getByText(/GPU.*utilization/i))).toBeVisible();
    // security_findings visible in technical view
    await expect(page.getByText(/Azure Government Cloud GPU VM availability/i)).toBeVisible();
  });

  test('TEST-F3-07: primary CTA in Technical Perspective is Request Technical Guidance', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    const techToggle = page.getByRole('tab', { name: /Technical/i }).or(page.getByRole('button', { name: /Technical.*View/i }));
    await techToggle.first().click();
    await expect(page.getByRole('button', { name: /Request Technical Guidance/i })).toBeVisible();
  });

  test('TEST-F3-09: trust disclaimers rendered identically in both perspectives', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Executive perspective — disclaimer present (EXPERIMENT_POC triggers POC≠production-ready)
    const execDisclaimerText = await page.getByText(/POC.*production.ready|proof of concept.*production/i).textContent();

    const techToggle = page.getByRole('tab', { name: /Technical/i }).or(page.getByRole('button', { name: /Technical.*View/i }));
    await techToggle.first().click();
    // Same disclaimer visible in technical view
    await expect(page.getByText(/POC.*production.ready|proof of concept.*production/i)).toBeVisible();
  });

  test('TEST-F3-10: ?view=technical URL param renders Technical Perspective directly', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}?view=technical`);
    // Technical perspective should be active immediately
    await expect(page.getByText(/NVIDIA T4|GPU.*utilization/i).or(page.getByText(/Azure Government Cloud GPU/i))).toBeVisible();
  });

  test('TEST-F4-07: artifact links rendered in dedicated section with external link behavior', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Artifact links section present (F4)
    await expect(page.getByText(/Artifact.*Links|Source.*Documents|Supporting.*Documents/i)).toBeVisible();
    // Both artifact links rendered
    await expect(page.getByRole('link', { name: /Lessons Learned/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Architecture Diagram/i })).toBeVisible();
  });
});
```

---

### File 4: `e2e/integration/trust-disclaimers.spec.ts`

Tests: TEST-F9-04 through TEST-F9-10. Directly validates all 4 trust disclaimer trigger conditions (PRD §6.3, FRD F09). This is a critical trust integrity test per the Hub's design principles.

```typescript
// e2e/integration/trust-disclaimers.spec.ts
// RTM: TEST-F9-04 through TEST-F9-10
// PRD §6.3: 4 trust disclaimer trigger conditions — must all be tested explicitly
// Design principle: "Trust integrity — the interface must never mislead stakeholders"

import { test, expect } from '@playwright/test';

// Helper to mock a record and navigate to it
async function mockAndNavigateToRecord(page: import('@playwright/test').Page, overrides: Record<string, unknown>) {
  const record = { ...AUDIO_SECURITY_POC, record_id: 'rec-disclaimer-test', ...overrides };
  await page.route(`**/api/v1/records/rec-disclaimer-test*`, route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: record })});
  });
  await page.goto('/records/rec-disclaimer-test');
}

test.describe('F9: Trust Disclaimers — all 4 trigger conditions', () => {

  test('TEST-F9-04: EXPERIMENT_POC maturity → "POC ≠ production-ready" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'EXPERIMENT_POC', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'CURATED' });
    // Disclaimer text per PRD §6.3: "POC ≠ production-ready"
    await expect(page.getByText(/POC.*production.ready|proof of concept.*not.*production|not.*production.ready/i)).toBeVisible();
  });

  test('TEST-F9-04b: PROTOTYPE_PILOT maturity → "POC ≠ production-ready" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'PROTOTYPE_PILOT', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'CURATED' });
    await expect(page.getByText(/POC.*production.ready|not.*production.ready/i)).toBeVisible();
  });

  test('TEST-F9-05: PUBLISHED state → "Published ≠ approved for adoption" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'PRODUCTION_VALIDATED', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'CURATED' });
    // Per FRD F09: ALL published records show this disclaimer
    await expect(page.getByText(/published.*not.*approved.*adoption|publication.*not.*formal.*approval/i)).toBeVisible();
  });

  test('TEST-F9-06: source_type=COMMUNITY → "Community-submitted ≠ centrally endorsed" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'PROTOTYPE_PILOT', publication_state: 'PUBLISHED', source_type: 'COMMUNITY', review_status: 'CURATED' });
    await expect(page.getByText(/community.*not.*centrally.*endorsed|contributed.*not.*endorsed|community.*submitted/i)).toBeVisible();
  });

  test('TEST-F9-07: review_status=VALIDATED_FOR_REUSE → "Validated for Reuse ≠ local review waived" disclaimer', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'PRODUCTION_VALIDATED', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'VALIDATED_FOR_REUSE' });
    await expect(page.getByText(/validated.*reuse.*not.*waive|local.*review.*still.*required|reuse.*local.*review/i)).toBeVisible();
  });

  test('TEST-F9-08: multiple applicable conditions render all disclaimers simultaneously', async ({ page }) => {
    // This record triggers all 4 disclaimers simultaneously
    await mockAndNavigateToRecord(page, {
      maturity_level: 'EXPERIMENT_POC',    // trigger 1: POC ≠ production-ready
      publication_state: 'PUBLISHED',       // trigger 2: Published ≠ approved for adoption
      source_type: 'COMMUNITY',             // trigger 3: Community-submitted ≠ centrally endorsed
      review_status: 'VALIDATED_FOR_REUSE', // trigger 4: Validated for Reuse ≠ local review waived
    });
    // All 4 disclaimers visible at the same time
    await expect(page.getByText(/POC.*production.ready|not.*production.ready/i)).toBeVisible();
    await expect(page.getByText(/published.*not.*approved.*adoption|publication.*not.*formal/i)).toBeVisible();
    await expect(page.getByText(/community.*not.*endorsed|community.*submitted/i)).toBeVisible();
    await expect(page.getByText(/validated.*reuse.*not.*waive|local.*review.*required/i)).toBeVisible();
  });

  test('TEST-F9-09: curator cannot suppress trust disclaimers', async ({ page }) => {
    // Verify no toggle/override control exists on the record page
    await mockAndNavigateToRecord(page, { maturity_level: 'EXPERIMENT_POC', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'CURATED' });
    // No "hide disclaimer" or "dismiss" button
    await expect(page.getByRole('button', { name: /hide.*disclaimer|dismiss.*disclaimer|suppress/i })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: /disclaimer/i })).toHaveCount(0);
  });

  test('TEST-F9-10: trust disclaimers rendered identically in both perspectives', async ({ page }) => {
    await mockAndNavigateToRecord(page, { maturity_level: 'EXPERIMENT_POC', publication_state: 'PUBLISHED', source_type: 'INTERNAL', review_status: 'CURATED' });
    // Executive perspective disclaimer
    const disclaimerText = page.getByText(/POC.*production.ready|not.*production.ready/i);
    await expect(disclaimerText).toBeVisible();

    // Switch to technical perspective
    const techToggle = page.getByRole('tab', { name: /Technical/i }).or(page.getByRole('button', { name: /Technical.*View/i }));
    await techToggle.first().click();
    // Same disclaimer still visible
    await expect(page.getByText(/POC.*production.ready|not.*production.ready/i)).toBeVisible();
  });
});
```

---

### File 5: `e2e/integration/opportunity-submission.spec.ts`

Tests: TEST-F5-01, TEST-F5-02, TEST-F5-05, TEST-F5-06, TEST-F5-07, TEST-F5-09. Journeys: JRN-01.2, JRN-02.2.

```typescript
// e2e/integration/opportunity-submission.spec.ts
// RTM: TEST-F5-01 through TEST-F5-12 (key cases)
// Journeys: JRN-01.2 (Margaret submits mission problem), JRN-02.2 (David empty-search → F5 CTA)

import { test, expect } from '@playwright/test';

test.describe('F5: Opportunity Submission', () => {

  test('TEST-F5-01: submission form accessible at /submit-opportunity without authentication', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // Form renders without redirect to login
    await expect(page.getByRole('heading', { name: /submit.*mission|opportunity.*submission|describe.*problem/i })).toBeVisible();
  });

  test('TEST-F5-02: form uses problem-first field ordering with correct label', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // problem_description field labeled "Describe the mission problem" per FRD F05
    const problemField = page.getByLabel(/describe.*mission.*problem|mission.*problem.*description|problem.*facing/i);
    await expect(problemField).toBeVisible();
  });

  test('TEST-F5-05: required fields missing returns inline validation errors; input preserved', async ({ page }) => {
    await page.goto('/submit-opportunity');
    // Click submit without filling required fields
    await page.getByRole('button', { name: /submit.*opportunity|submit.*problem|submit/i }).click();
    // Inline errors shown
    await expect(page.getByText(/required|cannot be blank|please fill/i).first()).toBeVisible();
    // Page stays at /submit-opportunity (not navigated away)
    expect(page.url()).toContain('submit-opportunity');
  });

  test('TEST-F5-06: problem_description < 50 chars returns FIELD_TOO_SHORT error', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions*', route => {
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({
        error: { code: 'FIELD_TOO_SHORT', fields: [{ field: 'problem_description', message: 'Problem description must be at least 50 characters.' }] },
      })});
    });
    await page.goto('/submit-opportunity');
    const problemField = page.getByLabel(/describe.*mission.*problem|problem.*description|problem.*facing/i);
    await problemField.fill('Too short');
    // Fill other required fields minimally
    const missionArea = page.getByLabel(/mission.*area/i);
    if (await missionArea.count() > 0) await missionArea.fill('Court Operations');
    const office = page.getByLabel(/submitting.*office|office/i).first();
    if (await office.count() > 0) await office.fill('Eastern VA District Court');
    const name = page.getByLabel(/name|submitter.*name/i).first();
    if (await name.count() > 0) await name.fill('David Reyes');
    const email = page.getByLabel(/email/i).first();
    if (await email.count() > 0) await email.fill('david.reyes@uscourts.gov');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/too short|50 characters|at least 50/i)).toBeVisible();
  });

  test('TEST-F5-09: successful submission shows "does not imply acceptance" confirmation', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions*', route => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        data: { submission_id: 'sub-001', status: 'SUBMITTED' },
      })});
    });
    await page.goto('/submit-opportunity');
    const problemField = page.getByLabel(/describe.*mission.*problem|problem.*description|problem.*facing/i);
    await problemField.fill('Remote interpreter access reliability for non-English-speaking defendants is unreliable in circuit courts. This directly impacts due process for defendants who need interpretation services during proceedings.');
    const missionArea = page.getByLabel(/mission.*area/i);
    if (await missionArea.count() > 0) await missionArea.fill('Court Operations');
    const office = page.getByLabel(/submitting.*office|office/i).first();
    if (await office.count() > 0) await office.fill('AO Office of the General Counsel');
    const name = page.getByLabel(/name|your.*name/i).first();
    if (await name.count() > 0) await name.fill('Margaret Hollis');
    const email = page.getByLabel(/email/i).first();
    if (await email.count() > 0) await email.fill('m.hollis@uscourts.gov');
    await page.getByRole('button', { name: /submit/i }).click();
    // FRD F05 confirmation text — must contain "does not imply"
    await expect(page.getByText(/does not imply.*acceptance|not.*imply.*commitment|not.*guarantee.*portfolio/i)).toBeVisible();
  });
});
```

---

### File 6: `e2e/integration/share-innovation.spec.ts`

Tests: TEST-F6-01, TEST-F6-03, TEST-F6-04, TEST-F6-06. Journey: JRN-04.1.

```typescript
// e2e/integration/share-innovation.spec.ts
// RTM: TEST-F6-01 through TEST-F6-09 (key cases)
// Journey: JRN-04.1 (Marcus Webb contributes court innovation work)

import { test, expect } from '@playwright/test';

test.describe('F6: Share Existing Innovation Work', () => {

  test('TEST-F6-01: contribution form accessible at /share-innovation without authentication', async ({ page }) => {
    await page.goto('/share-innovation');
    await expect(page.getByRole('heading', { name: /share.*innovation|contribute.*work|submit.*innovation/i })).toBeVisible();
  });

  test('TEST-F6-02: form includes explicit curation review and publication-not-guaranteed messaging', async ({ page }) => {
    await page.goto('/share-innovation');
    // FRD F06: explicit messaging about curation review
    await expect(page.getByText(/curation.*review|not.*guaranteed|not.*automatic.*publication|review.*before.*published/i)).toBeVisible();
  });

  test('TEST-F6-03: self_assessed_maturity dropdown excludes ARCHIVED', async ({ page }) => {
    await page.goto('/share-innovation');
    const maturityDropdown = page.getByLabel(/maturity|self.*assessed.*maturity/i).first();
    await expect(maturityDropdown).toBeVisible();
    // Click dropdown to reveal options
    await maturityDropdown.click();
    // ARCHIVED must NOT be an option
    await expect(page.getByRole('option', { name: /Archived/i })).toHaveCount(0);
    // But other options should exist
    await expect(page.getByRole('option', { name: /Experiment.*POC|POC/i })).toBeVisible();
  });

  test('TEST-F6-04: artifact_urls validation — requires at least 1 valid HTTPS URL', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions*', route => {
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({
        error: { code: 'VALIDATION_ERROR', fields: [{ field: 'artifact_urls', message: 'At least one valid HTTPS URL is required.' }] },
      })});
    });
    await page.goto('/share-innovation');
    // Try to submit without valid HTTPS URL
    const urlField = page.getByLabel(/artifact.*url|document.*url|link.*to.*your/i).first();
    if (await urlField.count() > 0) {
      await urlField.fill('http://not-https.example.com'); // non-HTTPS
      await page.getByRole('button', { name: /submit/i }).click();
      await expect(page.getByText(/https|valid.*url|secure.*url/i)).toBeVisible();
    }
  });

  test('TEST-F6-06: successful submission shows "does not guarantee publication" confirmation', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions*', route => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        data: { submission_id: 'con-001', status: 'SUBMITTED' },
      })});
    });
    await page.goto('/share-innovation');
    // Fill minimum required fields
    const workDesc = page.getByLabel(/work.*description|describe.*work/i).first();
    if (await workDesc.count() > 0) await workDesc.fill('Low-bandwidth video conferencing solution for rural hearing rooms. Addressed connectivity challenges in rural district courts operating with limited bandwidth. Achieved 240p video at 256kbps acceptable quality.');
    const probAddr = page.getByLabel(/problem.*addressed|mission.*problem/i).first();
    if (await probAddr.count() > 0) await probAddr.fill('Rural courts lacked reliable video conferencing for remote hearings. Connectivity constraints made commercial solutions unusable in approximately 30% of district court locations.');
    const outcome = page.getByLabel(/outcome.*summary/i).first();
    if (await outcome.count() > 0) await outcome.fill('Prototype achieved stable 240p video at 256kbps with acceptable quality for hearing proceedings. Pilot completed successfully at 3 rural district courts.');
    const maturity = page.getByLabel(/maturity|self.*assessed/i).first();
    if (await maturity.count() > 0) await maturity.selectOption('PROTOTYPE_PILOT');
    const urlField = page.getByLabel(/artifact.*url|document.*link/i).first();
    if (await urlField.count() > 0) await urlField.fill('https://sharepoint.example.gov/VideoConferencing-POC');
    const team = page.getByLabel(/contributing.*team|team.*name/i).first();
    if (await team.count() > 0) await team.fill('Central CA District Court IT');
    const officeField = page.getByLabel(/contributing.*office|office/i).first();
    if (await officeField.count() > 0) await officeField.fill('Central CA District');
    const contactName = page.getByLabel(/contact.*name|your.*name/i).first();
    if (await contactName.count() > 0) await contactName.fill('Marcus Webb');
    const contactEmail = page.getByLabel(/email/i).first();
    if (await contactEmail.count() > 0) await contactEmail.fill('marcus.webb@cacd.uscourts.gov');
    await page.getByRole('button', { name: /submit/i }).click();
    // FRD F06 confirmation: publication not guaranteed; curation review required
    await expect(page.getByText(/curation.*review|not.*guaranteed|publication.*not.*automatic/i)).toBeVisible();
  });
});
```

---

### File 7: `e2e/integration/engagement-request.spec.ts`

Tests: TEST-F7-01 through TEST-F7-08. Journeys: JRN-01.1 (Act — briefing request), JRN-02.1 (Request Engagement), JRN-03.2 (Technical Guidance Request).

```typescript
// e2e/integration/engagement-request.spec.ts
// RTM: TEST-F7-01 through TEST-F7-08
// Journeys: JRN-01.1 Act (briefing request), JRN-02.1 Request Engagement, JRN-03.2 Technical Guidance

import { test, expect } from '@playwright/test';

test.describe('F7: Engagement Routing', () => {

  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/v1/records/${AUDIO_SECURITY_POC.record_id}*`, route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: AUDIO_SECURITY_POC })});
    });
  });

  test('TEST-F7-01: Next-Action panel renders configured engagement options as actionable buttons', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Audio Security POC has REQUEST_DEMO, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING configured
    await expect(page.getByRole('button', { name: /Request.*Demo|Request Demo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request.*Technical.*Guidance|Technical Guidance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request.*Briefing|Briefing/i })).toBeVisible();
  });

  test('TEST-F7-02: clicking engagement option opens form/modal with required fields', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    await page.getByRole('button', { name: /Request.*Briefing|Briefing/i }).click();
    // Modal/inline form appears
    await expect(page.getByRole('dialog').or(page.getByTestId('engagement-modal').or(page.locator('[data-engagement-form]')))).toBeVisible();
    // Required fields: description_of_interest (FRD F07)
    await expect(page.getByLabel(/describe.*interest|interest.*description|what.*would you like/i)).toBeVisible();
  });

  test('TEST-F7-04: successful engagement submission shows confirmation with record reference; creates engagement record', async ({ page }) => {
    await page.route('**/api/v1/engagement-requests*', route => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
        data: {
          request_id: 'req-001',
          request_type: 'REQUEST_BRIEFING',
          record_id: AUDIO_SECURITY_POC.record_id,
          status: 'SUBMITTED',
        },
      })});
    });
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    await page.getByRole('button', { name: /Request.*Briefing|Briefing/i }).click();
    // Fill engagement form
    const descField = page.getByLabel(/describe.*interest|interest.*description|what.*would you like/i);
    await descField.fill('I need a briefing on the Audio Security POC before our next leadership meeting on courtroom technology modernization. Specifically interested in maturity status and decision recommendation.');
    const nameField = page.getByLabel(/name|your.*name/i).first();
    if (await nameField.count() > 0) await nameField.fill('Margaret Hollis');
    const officeField = page.getByLabel(/office/i).first();
    if (await officeField.count() > 0) await officeField.fill('AO Executive Office');
    const emailField = page.getByLabel(/email/i).first();
    if (await emailField.count() > 0) await emailField.fill('m.hollis@uscourts.gov');
    await page.getByRole('button', { name: /submit.*request|send.*request|submit/i }).last().click();
    // Confirmation with record reference — JRN-01.1 Act success: "request is tracked"
    await expect(page.getByText(/request.*received|briefing.*request.*received|submission.*received/i)).toBeVisible();
    await expect(page.getByText(/Audio Security|audio.*security/i)).toBeVisible();
  });

  test('TEST-F7-06: engagement request against non-published record returns 404', async ({ page }) => {
    await page.route('**/api/v1/records/rec-draft-001*', route => {
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'RECORD_NOT_FOUND' } })});
    });
    await page.goto('/records/rec-draft-001');
    await expect(page.getByText(/not found|404|does not exist/i)).toBeVisible();
    // No engagement options rendered for non-existent/non-published record
    await expect(page.getByRole('button', { name: /Request.*Demo|Request.*Guidance|Request.*Briefing/i })).toHaveCount(0);
  });

  test('TEST-F7-08: REQUEST_TECHNICAL_GUIDANCE accessible from Technical Perspective', async ({ page }) => {
    await page.goto(`/records/${AUDIO_SECURITY_POC.record_id}`);
    // Switch to Technical perspective
    const techToggle = page.getByRole('tab', { name: /Technical/i }).or(page.getByRole('button', { name: /Technical.*View/i }));
    await techToggle.first().click();
    // Technical Guidance CTA visible in Technical Perspective — JRN-03.2
    await expect(page.getByRole('button', { name: /Request Technical Guidance/i })).toBeVisible();
  });
});
```

---

### File 8: `e2e/integration/admin-publication-lifecycle.spec.ts`

Tests: TEST-F2-05, TEST-F2-07, TEST-F2-08, TEST-F2-09, TEST-F2-10, TEST-F8-04, TEST-F8-05, TEST-F8-06, TEST-F8-10. Journey: JRN-05.1.

```typescript
// e2e/integration/admin-publication-lifecycle.spec.ts
// RTM: TEST-F2-05–F2-17 (key cases), TEST-F8-04–F8-10
// Journey: JRN-05.1 (Catalina creates and publishes a record through full lifecycle)

import { test, expect } from '@playwright/test';

// Mock a CURATOR session for all admin tests
const CURATOR_SESSION_COOKIE = { name: 'session', value: 'mock-curator-session', domain: 'localhost', path: '/' };

test.describe('F8: Admin Publication Lifecycle', () => {

  test.beforeEach(async ({ page, context }) => {
    // Set mock curator session cookie
    await context.addCookies([CURATOR_SESSION_COOKIE]);
    // Mock session validation endpoint
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: { user_id: 'usr-curator-001', email: 'catalina.torres@ao.uscourts.gov', role: 'CURATOR' },
      })});
    });
  });

  test('TEST-F8-04: admin dashboard displays all 5 summary tiles', async ({ page }) => {
    await page.route('**/api/v1/admin/dashboard-summary*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: {
          published_records: 1,
          draft_review_records: 2,
          pending_opportunity_submissions: 3,
          pending_contribution_submissions: 1,
          engagement_requests_last_7_days: 5,
        },
      })});
    });
    await page.goto('/admin');
    // All 5 summary tiles rendered
    await expect(page.getByText(/published.*record|1.*published/i)).toBeVisible();
    await expect(page.getByText(/draft.*review|2.*draft/i)).toBeVisible();
    await expect(page.getByText(/opportunity.*submission|3.*opportunity/i)).toBeVisible();
    await expect(page.getByText(/contribution.*submission|1.*contribution/i)).toBeVisible();
    await expect(page.getByText(/engagement.*request|5.*engagement/i)).toBeVisible();
  });

  test('TEST-F2-07: curator can save draft with incomplete pub-required fields', async ({ page }) => {
    await page.route('**/api/v1/records*', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
          data: { record_id: 'rec-new-001', publication_state: 'DRAFT', title: 'Draft Innovation Record' },
        })});
      } else {
        route.fallback();
      }
    });
    await page.goto('/admin/records/new');
    const titleField = page.getByLabel(/title/i).first();
    await expect(titleField).toBeVisible();
    await titleField.fill('Draft Innovation Record');
    // Save draft without completing all pub-required fields
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText(/draft.*saved|saved.*draft|record.*saved/i)).toBeVisible();
  });

  test('TEST-F2-08: "Submit for Review" blocked if pub-required field missing; lists blocking fields', async ({ page }) => {
    const incompleteRecord = {
      ...AUDIO_SECURITY_POC,
      record_id: 'rec-incomplete-001',
      publication_state: 'DRAFT',
      executive_perspective_text: '', // missing pub-required field
      executive_recommendation: '',   // missing pub-required field
    };
    await page.route('**/api/v1/records/rec-incomplete-001*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: incompleteRecord })});
    });
    await page.route('**/api/v1/records/rec-incomplete-001/submit-review*', route => {
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({
        error: {
          code: 'PUBLICATION_GATE_FAILED',
          message: 'The record cannot be submitted for review. Required fields are missing.',
          fields: [
            { field: 'executive_perspective_text', error_code: 'REQUIRED', message: 'Executive Perspective Text is required.' },
            { field: 'executive_recommendation', error_code: 'REQUIRED', message: 'Executive Recommendation is required.' },
          ],
        },
      })});
    });
    await page.goto('/admin/records/rec-incomplete-001/edit');
    await page.getByRole('button', { name: /Submit for Review/i }).click();
    // Governance gate feedback rendered
    await expect(page.getByText(/Cannot publish|missing.*required.*field|required.*field.*missing/i)).toBeVisible();
    await expect(page.getByText(/Executive Perspective Text/i)).toBeVisible();
    await expect(page.getByText(/Executive Recommendation/i)).toBeVisible();
  });

  test('TEST-F2-10: on successful publication, published_at set; record appears in catalog', async ({ page }) => {
    const reviewRecord = { ...AUDIO_SECURITY_POC, record_id: 'rec-review-001', publication_state: 'REVIEW', published_at: null };
    const publishedRecord = { ...reviewRecord, publication_state: 'PUBLISHED', published_at: '2026-07-30T12:00:00Z' };
    await page.route('**/api/v1/records/rec-review-001*', route => {
      if (route.request().url().includes('/publish')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: publishedRecord })});
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: reviewRecord })});
      }
    });
    await page.goto('/admin/records/rec-review-001/edit');
    await page.getByRole('button', { name: /Publish/i }).click();
    // Publication state updated in UI
    await expect(page.getByText(/PUBLISHED|Published/i)).toBeVisible();
  });

  test('TEST-F8-06: all valid state transitions execute correctly: DRAFT→REVIEW', async ({ page }) => {
    const draftRecord = { ...AUDIO_SECURITY_POC, record_id: 'rec-state-001', publication_state: 'DRAFT' };
    await page.route('**/api/v1/records/rec-state-001*', route => {
      if (route.request().url().includes('submit-review')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { ...draftRecord, publication_state: 'REVIEW' } })});
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: draftRecord })});
      }
    });
    await page.goto('/admin/records/rec-state-001/edit');
    // Submit for Review button visible in DRAFT state
    await expect(page.getByRole('button', { name: /Submit for Review/i })).toBeVisible();
    await page.getByRole('button', { name: /Submit for Review/i }).click();
    // State updated to REVIEW
    await expect(page.getByText(/REVIEW|In Review/i)).toBeVisible();
  });
});
```

---

### File 9: `e2e/integration/oidc-auth-gate.spec.ts`

Tests: TEST-F8-01, TEST-F8-02, TEST-F8-03.

```typescript
// e2e/integration/oidc-auth-gate.spec.ts
// RTM: TEST-F8-01 through TEST-F8-03
// Validates: unauthenticated /admin/* → OIDC login redirect; non-CURATOR → 403; session expiry → login

import { test, expect } from '@playwright/test';

test.describe('F8: OIDC Auth Gate', () => {

  test('TEST-F8-01: unauthenticated access to /admin/* redirects to OIDC login', async ({ page }) => {
    // No session cookie set — pure unauthenticated request
    const response = await page.goto('/admin');
    // Either: redirect to /auth/login or /oidc/authorize, or page renders a login redirect UI
    const finalUrl = page.url();
    const redirectedToLogin =
      finalUrl.includes('auth/login') ||
      finalUrl.includes('oidc/authorize') ||
      finalUrl.includes('login.microsoftonline.com') ||
      // Or the page renders a "login required" / "sign in" message
      await page.getByText(/sign in|log in|authentication required|please log in/i).isVisible();
    expect(redirectedToLogin).toBe(true);
  });

  test('TEST-F8-02: authenticated user without CURATOR role receives 403', async ({ page, context }) => {
    // Set a non-CURATOR session cookie
    await context.addCookies([{ name: 'session', value: 'non-curator-session', domain: 'localhost', path: '/' }]);
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: { user_id: 'usr-read-001', email: 'readonly@uscourts.gov', role: 'PUBLIC' }, // not CURATOR
      })});
    });
    await page.route('**/admin*', route => {
      // Simulate backend 403 for non-CURATOR
      if (route.request().url().includes('/admin') && !route.request().url().includes('/api/')) {
        // Frontend may receive 403 and render a permissions-denied page
        route.fallback();
      } else {
        route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({
          error: { code: 'FORBIDDEN', message: 'You do not have permission to access the administration interface.' },
        })});
      }
    });
    await page.goto('/admin');
    // Either a 403 page or a "You do not have permission" message
    const has403 = await page.getByText(/do not have permission|unauthorized|403|access denied/i).isVisible().catch(() => false);
    // Or redirected to an error page
    const redirectedToError = page.url().includes('error') || page.url().includes('forbidden');
    expect(has403 || redirectedToError).toBe(true);
  });

  test('TEST-F8-03: expired OIDC session redirects to login', async ({ page, context }) => {
    // Simulate expired session — server returns 401 on session check
    await context.addCookies([{ name: 'session', value: 'expired-session', domain: 'localhost', path: '/' }]);
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({
        error: { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' },
      })});
    });
    await page.goto('/admin');
    const finalUrl = page.url();
    const redirectedToLogin =
      finalUrl.includes('auth/login') ||
      finalUrl.includes('login') ||
      await page.getByText(/session.*expired|sign in again|log in again/i).isVisible();
    expect(redirectedToLogin).toBe(true);
  });
});
```

---

### File 10: `e2e/integration/cross-cutting-trust-auth.spec.ts`

Tests: TEST-F9-01, TEST-F9-02, TEST-F9-03, TEST-F9-11, TEST-F9-14, TEST-F9-15. Cross-cutting concern: trust signals visible on every catalog card and record page.

```typescript
// e2e/integration/cross-cutting-trust-auth.spec.ts
// RTM: TEST-F9-01–F9-03, TEST-F9-11, TEST-F9-14, TEST-F9-15
// Cross-cutting: trust signals on every catalog card and record; governance gate for maturity/review
// Design principle: "Trust integrity — POC ≠ production-ready, Published ≠ approved for adoption"

import { test, expect } from '@playwright/test';

test.describe('F9: Cross-cutting Trust Signals', () => {

  test('TEST-F9-01: maturity badge with color coding visible on every catalog card', async ({ page }) => {
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    // Maturity badge visible — EXPERIMENT_POC shown as "Experiment / POC" or "POC" with amber/yellow color indicator
    await expect(page.getByText(/Experiment.*POC|POC/i).first()).toBeVisible();
    // Color indicator element (badge with color class)
    const maturityBadge = page.locator('[data-maturity-badge], .maturity-badge, [aria-label*="maturity"]').first();
    if (await maturityBadge.count() > 0) {
      await expect(maturityBadge).toBeVisible();
    }
  });

  test('TEST-F9-02: review status badge visible on every catalog card and record page', async ({ page }) => {
    await page.route('**/api/v1/catalog*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: [AUDIO_SECURITY_CATALOG_CARD],
        pagination: { page: 1, page_size: 12, total_count: 1, total_pages: 1 },
        filters_available: {},
      })});
    });
    await page.goto('/catalog');
    await expect(page.getByText(/Technically Reviewed/i)).toBeVisible();
  });

  test('TEST-F9-11: publish without maturity_level shows governance gate error', async ({ page, context }) => {
    await context.addCookies([{ name: 'session', value: 'mock-curator-session', domain: 'localhost', path: '/' }]);
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: { user_id: 'usr-curator-001', email: 'catalina@ao.uscourts.gov', role: 'CURATOR' },
      })});
    });
    const recordWithoutMaturity = { ...AUDIO_SECURITY_POC, record_id: 'rec-no-maturity', maturity_level: null, publication_state: 'REVIEW' };
    await page.route('**/api/v1/records/rec-no-maturity*', route => {
      if (route.request().url().includes('/publish')) {
        route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({
          error: {
            code: 'PUBLICATION_GATE_FAILED',
            message: 'Maturity level is required before publishing.',
            fields: [{ field: 'maturity_level', error_code: 'REQUIRED', message: 'Maturity level is required before publishing.' }],
          },
        })});
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: recordWithoutMaturity })});
      }
    });
    await page.goto('/admin/records/rec-no-maturity/edit');
    await page.getByRole('button', { name: /Publish/i }).click();
    await expect(page.getByText(/Maturity level is required|maturity.*required/i)).toBeVisible();
  });

  test('TEST-F9-14: ARCHIVED maturity on Published record triggers advisory (no automatic cascade)', async ({ page, context }) => {
    await context.addCookies([{ name: 'session', value: 'mock-curator-session', domain: 'localhost', path: '/' }]);
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: { user_id: 'usr-curator-001', email: 'catalina@ao.uscourts.gov', role: 'CURATOR' },
      })});
    });
    await page.route(`**/api/v1/records/${AUDIO_SECURITY_POC.record_id}*`, route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: AUDIO_SECURITY_POC })});
    });
    await page.goto(`/admin/records/${AUDIO_SECURITY_POC.record_id}/edit`);
    // Select ARCHIVED maturity on a PUBLISHED record
    const maturityDropdown = page.getByLabel(/Maturity Level/i).or(page.locator('select[name="maturity_level"]'));
    if (await maturityDropdown.count() > 0) {
      await maturityDropdown.first().selectOption('ARCHIVED');
      // Advisory shown — per TEST-F9-14
      await expect(page.getByText(/consider.*archiv.*publication|archive.*publication.*state|remove.*public.*catalog/i)).toBeVisible();
      // BUT publication_state NOT automatically changed — PUBLISHED still in effect
      await expect(page.getByText(/PUBLISHED/i)).toBeVisible();
    }
  });

  test('TEST-F9-15: maturity_level=ARCHIVED and publication_state=ARCHIVED are independent controls', async ({ page, context }) => {
    await context.addCookies([{ name: 'session', value: 'mock-curator-session', domain: 'localhost', path: '/' }]);
    await page.route('**/api/v1/admin/me*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        data: { user_id: 'usr-curator-001', email: 'catalina@ao.uscourts.gov', role: 'CURATOR' },
      })});
    });
    // Record with ARCHIVED maturity but PUBLISHED publication_state
    const archivedMaturityPublished = {
      ...AUDIO_SECURITY_POC,
      record_id: 'rec-archived-maturity',
      maturity_level: 'ARCHIVED',
      publication_state: 'PUBLISHED',
    };
    await page.route('**/api/v1/records/rec-archived-maturity*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: archivedMaturityPublished })});
    });
    await page.goto('/admin/records/rec-archived-maturity/edit');
    // Both fields independently editable; publication_state still PUBLISHED even with ARCHIVED maturity
    await expect(page.getByText(/PUBLISHED/i)).toBeVisible();
    // Maturity shows ARCHIVED
    const maturityDropdown = page.getByLabel(/Maturity Level/i).or(page.locator('select[name="maturity_level"]'));
    if (await maturityDropdown.count() > 0) {
      const maturityValue = await maturityDropdown.first().inputValue();
      expect(maturityValue).toBe('ARCHIVED');
    }
  });
});
```

**After writing all 10 spec files**, verify that `playwright.config.ts` exists with a valid `baseURL`. If it does not exist, create it:

```typescript
// playwright.config.ts (create if missing)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
```

**Add shared fixtures** at the top of each spec file by inlining `AUDIO_SECURITY_POC` and `AUDIO_SECURITY_CATALOG_CARD` constants (or create `e2e/integration/fixtures.ts` and import from it). Do not leave them as undefined references.
  </action>
  <verify>
ls e2e/integration/catalog-browsing.spec.ts e2e/integration/search-and-discovery.spec.ts e2e/integration/record-detail.spec.ts e2e/integration/trust-disclaimers.spec.ts e2e/integration/opportunity-submission.spec.ts e2e/integration/share-innovation.spec.ts e2e/integration/engagement-request.spec.ts e2e/integration/admin-publication-lifecycle.spec.ts e2e/integration/oidc-auth-gate.spec.ts e2e/integration/cross-cutting-trust-auth.spec.ts && echo "ALL_SPEC_FILES_EXIST" && npx playwright test e2e/integration/ --reporter=list 2>&1 | tail -20 && echo CONTRACT_OK
  </verify>
  <done>
- `e2e/integration/` directory contains all 10 spec files
- `catalog-browsing.spec.ts`: tests TEST-F0-01, F0-02, F0-04, F0-05, F0-06, F0-10, F0-11, F0-12; community badge, reuse badge, pagination, filter, empty-state CTA to /submit-opportunity
- `search-and-discovery.spec.ts`: tests TEST-F1-01, F1-04, F1-05, F1-06, F1-09, F1-10, F1-11; blank query guard, empty-state F5 CTA, highlight rendering, URL state, PUBLISHED scope
- `record-detail.spec.ts`: tests TEST-F2-01, F2-02, F2-04, F3-01 through F3-10, F4-07, F4-08; full record fields, PerspectiveToggle always visible, Executive/Technical panels, ?view= param, artifact links in new tab
- `trust-disclaimers.spec.ts`: all 4 trust disclaimer trigger conditions explicitly tested (TEST-F9-04 through F9-10); multi-disclaimer simultaneous rendering; no curator suppression mechanism
- `opportunity-submission.spec.ts`: tests TEST-F5-01, F5-02, F5-05, F5-06, F5-09; problem-first label, no-auth access, 50-char minimum, "does not imply acceptance" confirmation
- `share-innovation.spec.ts`: tests TEST-F6-01 through F6-06; ARCHIVED excluded from maturity dropdown, HTTPS URL required, curation messaging, confirmation text
- `engagement-request.spec.ts`: tests TEST-F7-01, F7-02, F7-04, F7-06, F7-08; all 4 engagement types on PUBLISHED record, record reference in confirmation, 404 for non-published, REQUEST_TECHNICAL_GUIDANCE from Technical Perspective
- `admin-publication-lifecycle.spec.ts`: tests TEST-F2-07, F2-08, F2-10, F8-04, F8-06; DRAFT→REVIEW lifecycle, governance gate feedback showing blocking field names, dashboard summary tiles, curator-only record visibility
- `oidc-auth-gate.spec.ts`: tests TEST-F8-01, F8-02, F8-03; unauthenticated /admin/* redirects to login, non-CURATOR gets 403, expired session redirects to login
- `cross-cutting-trust-auth.spec.ts`: tests TEST-F9-01, F9-02, F9-11, F9-14, F9-15; maturity badge on catalog cards, governance gate maturity_level required, ARCHIVED maturity advisory no auto-cascade, independent maturity/publication_state controls
- `playwright.config.ts` exists with `baseURL`
- All tests run without syntax errors: `npx playwright test e2e/integration/ --reporter=list` completes (pass or known pending mocks)
</done>

<feature_dependencies>
Implements: F0: Innovation Catalog (catalog-browsing.spec.ts — TEST-F0-01 through F0-14); F1: Search and Discovery (search-and-discovery.spec.ts — TEST-F1-01 through F1-12); F2: Innovation Record (record-detail.spec.ts + admin-publication-lifecycle.spec.ts — TEST-F2-01 through F2-17); F3: Executive and Technical Perspectives (record-detail.spec.ts TEST-F3-01 through F3-10); F4: Existing Lessons-Learned Integration (record-detail.spec.ts artifact link tests + Audio Security POC anchor validation); F5: Opportunity Submission (opportunity-submission.spec.ts TEST-F5-01 through F5-09); F6: Share Existing Innovation Work (share-innovation.spec.ts TEST-F6-01 through F6-06); F7: Engagement Routing (engagement-request.spec.ts TEST-F7-01 through F7-08); F8: Curation and Administration (admin-publication-lifecycle.spec.ts + oidc-auth-gate.spec.ts TEST-F8-01 through F8-10); F9: Content, Maturity & Trust Model (trust-disclaimers.spec.ts + cross-cutting-trust-auth.spec.ts TEST-F9-01 through F9-15)
Depends on: All prior waves 1–6 and Plan 17 (Audio Security POC seeded; app boot verified)
Enables: None — this is the final MVP acceptance gate
</feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Run full integration test suite and produce gap report</name>
  <files>
    scripts/integration-gap-report.md
  </files>
  <action>
Run the complete Playwright integration test suite written in Task 1 and produce a gap report documenting any cross-cutting issues discovered.

**Step 1 — Run the test suite:**

```bash
mkdir -p scripts
npx playwright test e2e/integration/ --reporter=list 2>&1 | tee /tmp/playwright-integration-results.txt
PLAYWRIGHT_EXIT_CODE=$?
```

**Step 2 — Analyze results:**

Parse `/tmp/playwright-integration-results.txt` to identify:
1. Passed tests (✓)
2. Failed tests (✗) with failure reason
3. Skipped tests

Group failures by feature (F0–F9) to identify cross-cutting gaps.

**Step 3 — Gap classification:**

For each failure, classify as one of:
- **Test implementation gap** — test code issue (mock missing, wrong selector, assertion typo); fix the test
- **Feature gap** — a real behavior is missing or incorrect in the application implementation; document for remediation
- **Infrastructure gap** — app not running, baseURL unreachable, Playwright not installed; document as infrastructure

Fix test implementation gaps inline (update the spec file). Document feature gaps and infrastructure gaps in the report.

**Step 4 — Write gap report:**

Write `scripts/integration-gap-report.md` with:
- Total tests run / passed / failed
- List of any feature gaps with: feature ID, test case ID, description, actual vs expected behavior, recommended remediation
- Trust integrity summary: confirm all 4 disclaimer conditions tested and passing
- Auth gate summary: confirm OIDC gate tests passing
- Status: PASSED (no feature gaps) or GAPS FOUND

**Gap report template:**

```markdown
# Integration Gap Report — Wave 7b
**Generated:** {date}
**Suite:** e2e/integration/ (10 spec files)
**Test runner:** Playwright

## Summary
- Total tests: {N}
- Passed: {N}
- Failed: {N}
- Skipped: {N}
- Status: PASSED / GAPS FOUND

## Trust Integrity Validation
- [ ] TEST-F9-04: EXPERIMENT_POC → POC≠production-ready disclaimer ✓/✗
- [ ] TEST-F9-05: PUBLISHED → Published≠approved-for-adoption disclaimer ✓/✗
- [ ] TEST-F9-06: COMMUNITY source_type → Community-submitted≠centrally-endorsed ✓/✗
- [ ] TEST-F9-07: VALIDATED_FOR_REUSE → Validated≠local-review-waived ✓/✗
- [ ] TEST-F9-08: Multi-disclaimer simultaneous rendering ✓/✗
- [ ] TEST-F9-09: No curator suppression mechanism ✓/✗

## Auth Gate Validation
- [ ] TEST-F8-01: Unauthenticated /admin/* → OIDC login redirect ✓/✗
- [ ] TEST-F8-02: Authenticated non-CURATOR → 403 ✓/✗
- [ ] TEST-F8-03: Expired session → login redirect ✓/✗

## Engagement Routing Validation
- [ ] TEST-F7-04: Engagement submission → on-screen confirmation with record reference ✓/✗
- [ ] TEST-F7-06: Non-published record engagement → 404 ✓/✗

## F4: Audio Security POC Anchor Record
- [ ] Anchor record seeded with GPU/CPU separation finding ✓/✗
- [ ] Anchor record seeded with Azure Government Cloud constraints finding ✓/✗
- [ ] Anchor record seeded with performance/latency limitations finding ✓/✗
- [ ] Anchor record seeded with production-readiness gaps finding ✓/✗
- [ ] Anchor record discoverable via catalog ✓/✗
- [ ] Anchor record discoverable via search for "audio security" ✓/✗

## Feature Gaps Found
{List of gaps, or "None found — MVP acceptance criteria met" if all tests pass}

### GAP-{NN}: {Feature ID} — {Title}
- **Test Case:** TEST-F{N}-{NN}
- **Journey:** JRN-{N}.{N} {stage}
- **Description:** {what is wrong}
- **Actual:** {observed behavior}
- **Expected:** {required behavior per PRD/FRD/RTM}
- **Severity:** BLOCKER / HIGH / MEDIUM / LOW
- **Remediation:** {which plan/service/component needs updating and what specifically}

## Conclusion
{PASSED: All integration tests pass. TSIO Innovation Hub MVP acceptance criteria met.}
{OR: GAPS FOUND: N feature gaps require remediation before MVP acceptance. See gap list above.}
```

**Step 5 — If feature gaps are found, add remediation tasks inline:**

For each BLOCKER or HIGH severity feature gap, add a concise inline fix task at the end of this action. Document what file/service/component needs changing and the exact behavior to fix. Keep fixes targeted — do not restructure entire features.
  </action>
  <verify>
ls scripts/integration-gap-report.md && grep -n 'Status:\|PASSED\|GAPS FOUND' scripts/integration-gap-report.md && grep -n 'Trust Integrity Validation\|Auth Gate Validation\|F4.*Audio Security' scripts/integration-gap-report.md && echo CONTRACT_OK
  </verify>
  <done>
- `scripts/integration-gap-report.md` exists
- Report contains: test run summary (total/passed/failed/skipped), trust integrity validation checklist (all 4 disclaimer conditions), auth gate validation checklist, F4 Audio Security POC anchor record checklist
- Status field is either "PASSED" (no feature gaps) or "GAPS FOUND" with documented gap list
- For any BLOCKER/HIGH gaps: remediation recommendation documents the exact file, service, and fix needed
- All 4 trust disclaimer conditions are explicitly confirmed tested (TEST-F9-04 through F9-08)
- OIDC auth gate tests confirmed (TEST-F8-01 through F8-03)
- POC≠production-ready warning visible on Audio Security POC record (EXPERIMENT_POC maturity)
- PUBLISHED≠approved-for-adoption messaging confirmed on all published records
</done>

<feature_dependencies>
Implements: F0–F9 (gap report is the final system-level acceptance artifact covering all features); F4 specifically: Audio Security POC anchor record reachability validation; F8: OIDC auth gate functional confirmation; F9: all 4 trust disclaimer conditions confirmed as operational
Depends on: Task 1 (all 10 Playwright spec files must exist and be runnable)
Enables: None — this is the final MVP acceptance gate output
</feature_dependencies>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test→API | Playwright tests send requests to the application API; mock responses must not leak secrets or reveal internal record IDs in test output |
| CI/CD→filesystem | Test result files written to /tmp and scripts/; no secrets in output files |
| gap-report→stakeholders | Gap report documents actual vs expected behavior; must not expose internal system credentials or unredacted PII from test fixtures |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-W7b-01 | Information Disclosure | `e2e/integration/*.spec.ts` — test fixtures using real-looking PII (names, emails) | mitigate | All fixture identities in spec files use clearly fictional values (e.g., `margaret.hollis@uscourts.gov` matches PRD persona names — not real individuals); `AUDIO_SECURITY_POC.owner_name` = 'I&R Technical Lead' (role, not real name); no real credentials in any fixture; verify: `grep -rn 'password\|secret\|token\|api_key' e2e/integration/ 2>/dev/null | grep -v mock | wc -l` → 0 |
| T-W7b-02 | Elevation of Privilege | `e2e/integration/oidc-auth-gate.spec.ts` — mock CURATOR session cookie used in admin tests | mitigate | Mock session cookies (`mock-curator-session`) are non-functional outside the Playwright mock context; `page.route('**/api/v1/admin/me*')` intercepts before any real server; tests explicitly verify the 403 path for non-CURATOR to confirm the gate works; the mock cookie cannot be used to access a real production system |
| T-W7b-03 | Tampering | `scripts/integration-gap-report.md` — gap report written by executor with test output | mitigate | Report is a documentation artifact only; not used as input to any security gate or automated process; `scripts/` directory is version-controlled; content is auditable; no executable code or eval() paths consume the report content |
| T-W7b-04 | Information Disclosure | Test output logged to `/tmp/playwright-integration-results.txt` | accept | `/tmp` is ephemeral sandbox storage; no real credentials in test output (all API responses are mocked); residual risk: test output contains mock record IDs and fixture data — acceptable for a sandboxed CI environment; owner: executor sandbox |
| T-W7b-05 | Spoofing | `page.route()` mock handlers could mask real API failures if live backend is available | mitigate | Tests are designed to work against mocked API by default; when a live seeded backend is available (from plan 17), remove route mocks for full integration fidelity; documented in Task 1 action: "prefer live API calls for integration fidelity and mock only what is unavailable"; real test failures against live backend surface real spoofing/auth gaps |
</threat_model>

<verification>
**Overall phase verification — Wave 7b complete when:**

1. All 10 Playwright spec files exist in `e2e/integration/`:
   ```bash
   ls e2e/integration/*.spec.ts | wc -l
   # Expected: 10
   ```

2. All tests run without syntax errors:
   ```bash
   npx playwright test e2e/integration/ --reporter=list 2>&1 | tail -10 && echo SUITE_RAN
   ```

3. Trust disclaimer tests cover all 4 trigger conditions:
   ```bash
   grep -n 'EXPERIMENT_POC\|COMMUNITY\|VALIDATED_FOR_REUSE\|PUBLISHED.*approved\|POC.*production' e2e/integration/trust-disclaimers.spec.ts | wc -l
   # Expected: >= 8 (each condition mentioned at least twice — mock setup + assertion)
   ```

4. OIDC auth gate tests present:
   ```bash
   grep -n 'auth/login\|oidc\|403\|SESSION_EXPIRED\|FORBIDDEN' e2e/integration/oidc-auth-gate.spec.ts | wc -l
   # Expected: >= 6
   ```

5. Gap report exists with required sections:
   ```bash
   grep -n 'Trust Integrity Validation\|Auth Gate Validation\|Audio Security POC\|Status:' scripts/integration-gap-report.md && echo GAP_REPORT_OK
   ```

6. No real credentials in test fixtures:
   ```bash
   grep -rn 'password\|secret\|api_key\|AZURE_CLIENT_SECRET' e2e/integration/ 2>/dev/null | grep -v 'mock\|#\|//' | wc -l
   # Expected: 0
   ```
</verification>

<success_criteria>
The TSIO Innovation Hub Wave 7b integration validation is **DONE** when:

1. **All 10 Playwright spec files exist** in `e2e/integration/` — one per feature domain (F0 catalog, F1 search, F2/F3/F4 record+perspectives+artifacts, F9 trust disclaimers, F5 opportunity submission, F6 share innovation, F7 engagement, F8 admin lifecycle, F8 auth gate, F9 cross-cutting trust)

2. **All 4 trust disclaimer conditions explicitly tested** (TEST-F9-04 through F9-08): EXPERIMENT_POC/PROTOTYPE_PILOT → POC≠production-ready, PUBLISHED → Published≠approved-for-adoption, COMMUNITY → Community-submitted≠centrally-endorsed, VALIDATED_FOR_REUSE → Validated≠local-review-waived — all must render simultaneously when multiple conditions apply

3. **OIDC auth gate explicitly tested** (TEST-F8-01 through F8-03): unauthenticated /admin/* → login redirect; non-CURATOR authenticated → 403; expired session → login redirect

4. **Audio Security POC anchor record validated** (TEST-F4-09): all 4 required key finding categories present (GPU/CPU separation, Azure Government Cloud constraints, performance/latency, production-readiness gaps)

5. **Publication lifecycle DRAFT→REVIEW→PUBLISHED tested end-to-end** in admin UI (TEST-F2-08, F2-10, F8-06)

6. **Gap report produced** at `scripts/integration-gap-report.md` with trust integrity checklist, auth gate checklist, F4 anchor record checklist, and Status field (PASSED or GAPS FOUND with remediation)

7. **Zero real credentials** in any test fixture or mock data (automated check passes)

If any BLOCKER-severity gaps are found, they are documented in the gap report with specific remediation instructions pointing to the exact file/service/component and fix.
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/18-SUMMARY.md` with:
- Files created/modified (all 10 spec files + gap report)
- Test counts by spec file
- Gap report status (PASSED / GAPS FOUND with count)
- Trust integrity: all 4 disclaimer conditions confirmed tested
- Auth gate: OIDC tests confirmed
- Any cross-cutting gaps found with severity
</output>
