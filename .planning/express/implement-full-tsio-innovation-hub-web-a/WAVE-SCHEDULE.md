# Wave Schedule: TSIO Innovation Hub

**Project:** Implement full TSIO Innovation Hub web application  
**Generated:** 2026-07-30  
**Source:** PRD-TSIO-Innovation-Hub.md, RTM-TSIO-Innovation-Hub.md  
**Features covered:** F0, F1, F2, F3, F4, F5, F6, F7, F8, F9 (all 10)

---

```yaml
wave: 1
domain: database
depends_on: []
features: [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9]
objective: >
  Create all 11 PostgreSQL tables (users, innovation_records, record_key_findings,
  record_artifact_links, record_tags, record_engagement_options, audit_log,
  opportunity_submissions, contribution_submissions, engagement_requests, hub_settings)
  with exact DDL, CHECK constraints for all enums (maturity_level 5 values, review_status
  7 values, publication_state 5 values, source_type, engagement option types), GIN index
  on search_vector, FTS update triggers (trg_innovation_record_fts, trg_findings_update_fts,
  trg_tags_update_fts), partial indexes on publication_state/maturity/review_status/published_at,
  and docker-compose.yml with pinned PostgreSQL 16 image + healthcheck.
estimated_plans: 2
---
wave: 2
domain: backend
depends_on: [1]
features: [F0, F1, F2, F9]
objective: >
  Implement the core read/write API surface for the public-facing Hub: CatalogService
  (GET /api/v1/catalog, GET /api/v1/catalog/filters), SearchService with PostgreSQL FTS
  (GET /api/v1/search), RecordService full CRUD with all 9 endpoints, GovernanceGateService
  (pub-required field validation), TrustDisclaimerService (4 hard-coded trigger conditions),
  PublicationLifecycleService (DRAFT→REVIEW→PUBLISHED→SUPERSEDED/ARCHIVED state machine),
  and AuditService (append-only audit_log writes). All services include integration tests.
estimated_plans: 3
---
wave: 3
domain: backend
depends_on: [1]
features: [F5, F6, F7, F8]
objective: >
  Implement the submission, engagement, and administration API surface: SubmissionService
  (POST/GET/PATCH for opportunity_submissions and contribution_submissions), EngagementService
  (engagement_requests CRUD with PUBLISHED-only guard), SettingsService (hub_settings
  read/write including configurable routing email), EmailService (non-fatal SMTP routing),
  CaptchaService, RateLimiter (IP-based), and AuthMiddleware (OIDC/Azure AD token validation
  with users table upsert and CURATOR role check). All services include integration tests.
estimated_plans: 3
---
wave: 4
domain: frontend
depends_on: [2, 3]
features: [F0, F1, F2, F3, F9]
objective: >
  Build all public-facing UI screens: Catalog page (/ and /catalog) with CatalogCard
  components showing maturity badges, review status badges, community badge, reuse badge,
  filter panel, sort controls, pagination; Search page (/search) with weighted FTS results,
  query-term highlights, filter panel, URL state; Innovation Record page (/records/{id})
  with PerspectiveToggle, ExecutivePerspectivePanel, TechnicalPerspectivePanel, trust
  disclaimers section, artifact links, next-action engagement panel, ?view= URL param;
  color-coded maturity/review badge components used everywhere. Playwright e2e tests
  covering all screens.
estimated_plans: 3
---
wave: 5
domain: frontend
depends_on: [2, 3]
features: [F5, F6, F7]
objective: >
  Build the public submission and engagement forms: Opportunity Submission form
  (/submit-opportunity) with problem-first field ordering, CAPTCHA, rate limit feedback,
  inline validation, "does not imply acceptance" confirmation message; Share Innovation
  form (/share-innovation) with curation-review messaging, self_assessed_maturity
  excluding ARCHIVED, 1-5 HTTPS artifact URLs, confirmation; Engagement request
  modal/inline form on Innovation Record page for all 4 engagement types (REQUEST_DEMO,
  REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING) with CAPTCHA
  and rate limit feedback. Playwright e2e tests for all form flows.
estimated_plans: 2
---
wave: 6
domain: frontend
depends_on: [2, 3]
features: [F8, F9]
objective: >
  Build the curator administration interface (/admin/*): OIDC login redirect gate,
  DashboardPage (5 summary tiles), RecordsListPage (all states, sortable table),
  RecordEditPage (all 29 fields, pub-required validation, inline maturity/review
  definitions), publication lifecycle action controls with confirmation dialogs and
  GovernanceGate error display, OpportunitySubmissionsPage (4 disposition options),
  ContributionSubmissionsPage ("Create Record from Submission" action),
  EngagementActivityPage (log with filters), SettingsPage (routing email config),
  ContentModelReferencePage (read-only maturity + review status definitions).
  Playwright e2e tests for curator flows.
estimated_plans: 3
---
wave: 7
domain: integration
depends_on: [1, 2, 3, 4, 5, 6]
features: [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9]
objective: >
  End-to-end integration validation across all features: seed the Audio Security POC
  anchor record (F4) with all required key findings; verify full publication lifecycle
  (DRAFT→REVIEW→PUBLISHED) through admin UI; verify public catalog and search discover
  the published record; verify engagement request flow routes email; verify opportunity
  submission and contribution submission flows; verify trust disclaimers render correctly
  for all 4 trigger conditions; verify OIDC auth gates block unauthenticated admin access;
  run complete Playwright suite against the fully seeded app; fix cross-cutting gaps.
estimated_plans: 2
```

---

## WAVE SCHEDULE

| Wave | Domain | Plans | Features | Objective |
|------|--------|-------|----------|-----------|
| 1 | database | 2 | F0, F1, F2, F3, F4, F5, F6, F7, F8, F9 | Create all 11 DB tables, enums/CHECK constraints, GIN/FTS indexes, 3 FTS update triggers, partial indexes, docker-compose with pinned PostgreSQL 16 |
| 2 | backend | 3 | F0, F1, F2, F9 | Core public API: CatalogService, SearchService (PG FTS), RecordService (9 endpoints), GovernanceGateService, TrustDisclaimerService, PublicationLifecycleService, AuditService — all with integration tests |
| 3 | backend | 3 | F5, F6, F7, F8 | Submission/engagement/admin API: SubmissionService, EngagementService, SettingsService, EmailService, CaptchaService, RateLimiter, AuthMiddleware (OIDC) — all with integration tests |
| 4 | frontend | 3 | F0, F1, F2, F3, F9 | Public UI: Catalog, Search, Innovation Record with PerspectiveToggle, trust disclaimers, engagement panel, color-coded badges — Playwright e2e tests |
| 5 | frontend | 2 | F5, F6, F7 | Public forms: Opportunity Submission, Share Innovation, Engagement request modal — CAPTCHA, rate limit feedback, confirmations — Playwright e2e tests |
| 6 | frontend | 3 | F8, F9 | Admin interface (/admin/*): OIDC gate, Dashboard, RecordsList, RecordEdit, lifecycle controls, submissions queues, engagement log, Settings, Content Model Reference — Playwright e2e tests |
| 7 | integration | 2 | F0, F1, F2, F3, F4, F5, F6, F7, F8, F9 | Seed Audio Security POC anchor record; full end-to-end lifecycle validation; cross-cutting trust/auth/engagement flows; complete Playwright suite pass |

**Total features:** 10 (F0–F9) | **Covered:** 10 | **Uncovered:** 0

---

## Wave Dependency Graph

```
Wave 1 (database)
    ├── Wave 2 (backend — core public API)    ─┐
    └── Wave 3 (backend — admin/engagement)  ─┤
                                               ├── Wave 4 (frontend — public catalog/record/search)
                                               ├── Wave 5 (frontend — public forms/engagement)
                                               └── Wave 6 (frontend — admin interface)
                                                              │
                                               Waves 4+5+6 ──┴── Wave 7 (integration)
```

Waves 2 and 3 are both `depends_on: [1]` and can run in parallel (no shared file writes, independent service domains). Waves 4, 5, and 6 are all `depends_on: [2, 3]` and can run in parallel (independent frontend page sets). Wave 7 depends on all prior waves.

---

## Feature-to-Wave Assignment Rationale

| Feature | DB (W1) | Backend (W2/W3) | Frontend (W4/W5/W6) | Integration (W7) | Notes |
|---------|---------|-----------------|---------------------|------------------|-------|
| **F0 Innovation Catalog** | ✅ tables | ✅ W2 CatalogService | ✅ W4 CatalogPage | ✅ W7 | Core public surface |
| **F1 Search & Discovery** | ✅ FTS index + triggers | ✅ W2 SearchService | ✅ W4 SearchPage | ✅ W7 | FTS schema in W1; service in W2; UI in W4 |
| **F2 Innovation Record** | ✅ 6 tables | ✅ W2 RecordService + lifecycle | ✅ W4 RecordPage | ✅ W7 | Largest feature; spans all layers |
| **F3 Exec/Tech Perspectives** | ✅ perspective columns on innovation_records | ✅ W2 (fields on RecordService) | ✅ W4 PerspectiveToggle + panels | ✅ W7 | No separate DB table or API; derived view |
| **F4 Lessons-Learned Integration** | ✅ record_artifact_links | ✅ W2 (artifact URL check in RecordService) | ✅ W4 (artifact links on RecordPage) | ✅ W7 seed anchor record | No separate API; uses F2 CRUD |
| **F5 Opportunity Submission** | ✅ opportunity_submissions | ✅ W3 SubmissionService | ✅ W5 SubmitOpportunityPage | ✅ W7 | Public unauthenticated form |
| **F6 Share Innovation Work** | ✅ contribution_submissions | ✅ W3 SubmissionService | ✅ W5 ShareInnovationPage | ✅ W7 | P2 late-MVP; schema included at MVP |
| **F7 Engagement Routing** | ✅ engagement_requests + hub_settings | ✅ W3 EngagementService + SettingsService | ✅ W5 engagement modal | ✅ W7 email routing test | Configurable email; non-fatal on failure |
| **F8 Curation & Administration** | ✅ users table; all admin tables | ✅ W3 AdminHandler + AuthMiddleware | ✅ W6 full admin interface | ✅ W7 | OIDC-gated; all admin screens |
| **F9 Content, Maturity & Trust Model** | ✅ enums, CHECK constraints | ✅ W2 TrustDisclaimerService + GovernanceGateService | ✅ W4 badges; W6 ContentModelRef | ✅ W7 | Foundational; touches every layer |

---

## Plan Count Breakdown (18 total)

| Wave | Plans | Rationale for Split |
|------|-------|---------------------|
| W1-a | DB schema: innovation_records + child tables (record_key_findings, record_artifact_links, record_tags, record_engagement_options) + audit_log + FTS indexes/triggers | Core content tables; most complex DDL |
| W1-b | DB schema: users + hub_settings + opportunity_submissions + contribution_submissions + engagement_requests + docker-compose | Supporting tables; infrastructure |
| W2-a | CatalogService (GET /api/v1/catalog + filters endpoint) + integration tests | Read-only catalog API |
| W2-b | SearchService + SearchIndexService PG FTS (GET /api/v1/search) + integration tests | Search-specific service |
| W2-c | RecordService full CRUD (9 endpoints) + PublicationLifecycleService + GovernanceGateService + AuditService + TrustDisclaimerService + integration tests | Most complex backend service cluster |
| W3-a | AuthMiddleware OIDC + AdminHandler skeleton + users upsert + CURATOR role check + integration tests | Auth must come before all admin services |
| W3-b | SubmissionService (opportunity + contribution endpoints) + CaptchaService + RateLimiter + EmailService + integration tests | Submission flows |
| W3-c | EngagementService (engagement_requests) + SettingsService (hub_settings) + integration tests | Engagement + settings |
| W4-a | CatalogPage (/ and /catalog) — CatalogCard with all badge components, filter panel, sort, pagination + Playwright tests | Public entry point |
| W4-b | SearchPage (/search) — FTS results, highlights, filter panel, URL state + Playwright tests | Search UI |
| W4-c | RecordPage (/records/{id}) — PerspectiveToggle, ExecutivePerspectivePanel, TechnicalPerspectivePanel, trust disclaimers, artifact links, next-action panel + Playwright tests | Record detail; most complex public page |
| W5-a | SubmitOpportunityPage (/submit-opportunity) + ShareInnovationPage (/share-innovation) + form components + Playwright tests | Public submission forms |
| W5-b | Engagement request modal/form (inline on RecordPage for all 4 types, CAPTCHA, rate limit, confirmation) + Playwright tests | Engagement interactions |
| W6-a | Admin auth gate + DashboardPage + RecordsListPage + RecordEditPage (all 29 fields) + Playwright tests | Core admin record management |
| W6-b | PublicationLifecycleService UI controls (transition actions, confirmation dialogs, GovernanceGate error display) + Playwright tests | Lifecycle management UI |
| W6-c | OpportunitySubmissionsPage + ContributionSubmissionsPage + EngagementActivityPage + SettingsPage + ContentModelReferencePage + Playwright tests | Admin supporting pages |
| W7-a | Seed Audio Security POC anchor record with all required key findings; app docker-compose boot verification; context integration test | Data seeding + app boot |
| W7-b | Full end-to-end Playwright suite across all features; cross-cutting trust/auth/engagement validation; gap closure | Integration validation |
