# Roadmap: TSIO Innovation Hub

## Overview

The TSIO Innovation Hub goes from nothing to a governed, publicly accessible platform where Judiciary stakeholders can discover I&R innovation work, understand what was tested and learned, and take a clear next action. The build starts with infrastructure and identity (the locked door), then layers in the curation backbone (the editorial engine), then the core content unit (the record itself), then the public discovery surface (catalog + search), then stakeholder engagement flows, and finally seeds the launch content set and polishes for production release.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Platform** - Project scaffolding, database schema, authentication, role model, audit infrastructure, configurable settings, and federal compliance architecture (FIPS crypto, HTTPS-only, ATO-eligible hosting)
- [ ] **Phase 2: Content Model & Admin Interface** - Maturity/trust model enforcement, curation/admin interface, publication lifecycle state machine
- [ ] **Phase 3: Innovation Record & Perspectives** - Full innovation record structure, executive/technical perspective toggle, lessons-learned integration workflow
- [ ] **Phase 4: Catalog & Search** - Public-facing browsable catalog with filters, full-text search with problem-oriented relevance ranking
- [ ] **Phase 5: Engagement & Opportunity Submission** - Engagement routing (demo/adoption/technical guidance requests), opportunity submission form
- [ ] **Phase 6: Content Seeding & Launch Polish** - Seed 3+ curated POC records including Audio Security POC anchor, trust disclaimer UI, WCAG 2.1 AA, ATO documentation package, launch readiness

## Phase Details

### Phase 1: Foundation & Platform
**Goal**: The application runs, users can authenticate with their organizational identity, roles are enforced, every record change is captured in an audit log, the engagement routing email address is configurable without a code deployment, and the architecture satisfies federal security constraints (FIPS-validated crypto, HTTPS-only, encrypted at rest, ATO-eligible hosting) from day one.
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. A curator can log in via Azure AD / OIDC and access the admin interface; an anonymous user cannot
  2. Role-based access is enforced: PUBLIC can browse, CURATOR can create/edit records, ADMIN can manage settings and users
  3. Every material change to a record (field edit, state transition) is captured in the audit log with user, timestamp, and before/after values
  4. An admin can change the engagement routing email address in the settings UI without touching code or redeploying
  5. The application starts, serves the public catalog route (even if empty), and connects to a running PostgreSQL database
  6. All traffic is HTTPS-only (HTTP redirects to HTTPS); TLS 1.2+ enforced; FIPS 140-2/3 validated cipher suites used (no RC4, DES, MD5, SHA-1 for signing); no plaintext secrets in logs or environment files committed to source control
  7. The application is deployable to a FedRAMP-authorized hosting environment (Docker-compose for local dev; deployment config targets Azure Government / AWS GovCloud or Judiciary-approved equivalent)
**Plans**: TBD

Plans:
- [ ] 01-01: Project scaffolding — monolithic Node.js/Express app, PostgreSQL, docker-compose dev stack, HTTPS + FIPS cipher config, environment configuration
- [ ] 01-02: Database schema — all tables, indexes, FTS triggers, enum constraints per TechArch DDL; storage-layer encryption documented
- [ ] 01-03: Authentication — OIDC/Azure AD integration, AuthMiddleware, session management (FIPS-safe tokens), role enforcement
- [ ] 01-04: Audit infrastructure — AuditService, append-only audit_log table, write-on-every-change integration
- [ ] 01-05: Hub settings — hub_settings table, SettingsService, admin settings page, configurable routing email

### Phase 2: Content Model & Admin Interface
**Goal**: Authorized curators can create, edit, and manage innovation records through an admin interface with the full maturity model and review status model enforced; the publication lifecycle state machine gates record visibility.
**Depends on**: Phase 1
**Requirements**: F8, F9
**Success Criteria** (what must be TRUE):
  1. A curator can create a new innovation record in Draft state, fill in all structured fields, and save without publishing
  2. The system enforces all five maturity levels and all seven review statuses as independent, separately-assignable attributes on every record
  3. The publication lifecycle state machine (Draft → Review → Published → Superseded/Archived) is enforced at the service layer; a record cannot skip states
  4. The governance gate blocks publication if any pub-required field (problem statement, named owner, maturity, review status, source artifact, last-reviewed date, disclaimer) is missing — and lists the blocking fields
  5. Only Published records are visible to non-curator users; Draft and Review records are hidden from public routes
**Plans**: TBD

Plans:
- [ ] 02-01: Content model — maturity/review status enums, trust disclaimer logic, GovernanceGateService, PublicationLifecycleService
- [ ] 02-02: Admin record management — RecordEditPage (all fields, tabbed), PublicationStateControls, GovernanceGateFeedback
- [ ] 02-03: Admin record list, dashboard summary tiles, content model reference page

### Phase 3: Innovation Record & Perspectives
**Goal**: A stakeholder can open a published innovation record and see all structured content — problem context, findings, maturity/readiness, reuse guidance, ownership, artifact links, and next-action options — and can switch between an executive and technical perspective of the same record.
**Depends on**: Phase 2
**Requirements**: F2, F3, F4
**Success Criteria** (what must be TRUE):
  1. A public user can open a published record and see all required sections: problem context, what was explored, outcome/evidence, key findings, maturity/readiness, reuse guidance, ownership/attribution, artifact links, and next-action options
  2. A user can toggle between Executive Perspective (mission relevance, plain-language maturity, decision recommendation) and Technical Perspective (architecture, tools, security findings, reuse guidance) on the same record without a page reload
  3. Trust disclaimers (POC ≠ production-ready, Published ≠ approved for adoption, etc.) are rendered visibly on every published record based on maturity level and source type — curator cannot suppress them
  4. A curator can create a structured innovation record linked to an existing SharePoint lessons-learned document, making it discoverable without relocating the original — the artifact link points to the external source
  5. Artifact links open in a new tab; no document content is embedded or hosted by the Hub
**Plans**: TBD

Plans:
- [ ] 03-01: Innovation record data model — RecordService, all fields, key findings array, artifact links, engagement options, trust disclaimer rendering
- [ ] 03-02: Public RecordPage — all content sections, TrustDisclaimerBlock, RecordMetaFooter, NextActionPanel (stub)
- [ ] 03-03: PerspectiveToggle — Executive/Technical tab rendering, per-perspective CTAs, optional `?view=` URL param
- [ ] 03-04: Lessons-learned integration workflow — artifact link management in admin, external URL validation, integration notes in curation UI

### Phase 4: Catalog & Search
**Goal**: A stakeholder arriving at the Hub can browse all published innovation records in a filterable catalog and can search using problem-oriented natural language to surface relevant records without knowing the project name or team.
**Depends on**: Phase 3
**Requirements**: F0, F1
**Success Criteria** (what must be TRUE):
  1. A user can browse all published records in a card-based catalog showing title, outcome summary, maturity badge, review status badge, mission/technology area tags, and engagement indicators
  2. A user can filter the catalog by maturity level, review status, contributing office, mission area, technology area, and reuse potential — and the catalog updates without a full page reload
  3. A user can search using a problem description (not just a project name) and receive relevance-ranked results with problem_statement and key_findings fields weighted higher than title
  4. Search results show the same maturity and review status signals as catalog cards; clicking a result opens the full innovation record
  5. When search returns zero results, the user sees guidance to submit a mission problem (links to F5 form); when the catalog is empty, curators see a prompt to create the first record
**Plans**: TBD

Plans:
- [ ] 04-01: CatalogService — publication-filtered queries, multi-value filter application, sort orders, pagination, facet endpoint
- [ ] 04-02: CatalogPage — CatalogGrid, CatalogCard components, FilterPanel, SortControl, Pagination, empty state
- [ ] 04-03: SearchService — PostgreSQL FTS with weighted tsvector, query sanitization, relevance ranking, CURATOR vs PUBLIC scoping
- [ ] 04-04: SearchPage — SearchResultsList with highlight snippets, filter panel, empty-state CTA, bookmarkable URL state

### Phase 5: Engagement & Opportunity Submission
**Goal**: A stakeholder can submit a mission problem for I&R consideration and can request a demo, adoption discussion, or technical guidance from any innovation record; all engagement is logged and routed to the I&R team via the configurable email address.
**Depends on**: Phase 4
**Requirements**: F5, F7
**Success Criteria** (what must be TRUE):
  1. Any user (no login required) can submit a structured opportunity request with mission problem, affected users, current workflow, and desired outcome; a confirmation message clearly states that submission does not imply portfolio acceptance
  2. A user can request a demo, adoption discussion, technical guidance, or briefing from any published record; the request is logged with request type, record reference, user name, office, and contact information
  3. Every submitted engagement request and opportunity submission triggers an email to the configurable routing address (AOml_TSO_IRB_Team@ao.uscourts.gov or whatever is set in admin settings)
  4. Curators can view all incoming opportunity submissions and engagement requests in the admin interface, with status and the ability to add internal notes
  5. IP-based rate limiting prevents submission abuse; CAPTCHA is applied to public submission forms
**Plans**: TBD

Plans:
- [ ] 05-01: EngagementService — request creation, validation, rate limiting, email trigger; EngagementActivityPage in admin
- [ ] 05-02: EngagementRequestModal — per-record engagement form, request type routing, confirmation messaging
- [ ] 05-03: SubmissionService — opportunity submission form, CAPTCHA, rate limiting, curator queue; OpportunitySubmissionsPage in admin

### Phase 6: Content Seeding & Launch Polish
**Goal**: The Hub launches with at least 3 fully curated innovation records — including the Audio Security POC as the anchor record and at least one archived experiment — trust disclaimer UI is visually prominent, accessibility meets WCAG 2.1 AA, performance targets are met, and ATO-support documentation is complete.
**Depends on**: Phase 5
**Requirements**: PLAT-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. At least 3 published innovation records are live at launch, with the Audio Security POC (GPU/CPU separation, Azure Government Cloud constraints, performance limitations, production-readiness gaps) as the first fully structured record
  2. At least 1 archived or stopped experiment record is published, demonstrating honest lifecycle representation (maturity_level = ARCHIVED or publication_state = ARCHIVED)
  3. Trust disclaimer blocks are visually prominent on every published record — a stakeholder cannot miss them; the interface never implies a POC is production-ready
  4. The Hub meets WCAG 2.1 AA accessibility standards (keyboard navigation, screen reader compatibility, sufficient color contrast on maturity/review status badges)
  5. The public catalog loads within 3 seconds under normal load; a curator can create and publish a record from scratch in under 60 minutes
  6. ATO-support documentation package is complete: data classification of all stored fields, system boundary diagram, authentication/authorization controls description, audit log coverage table, and identified open risk items
**Plans**: TBD

Plans:
- [ ] 06-01: Audio Security POC record — curate full record from lessons-learned document, all structured fields, executive + technical perspectives
- [ ] 06-02: Additional seed records (2+ POCs, 1 archived experiment) — curate and publish
- [ ] 06-03: Trust disclaimer UI polish — visual prominence audit, color contrast, badge accessibility
- [ ] 06-04: WCAG 2.1 AA audit and remediation — keyboard navigation, ARIA labels, screen reader testing
- [ ] 06-05: ATO documentation package + performance baseline — system boundary diagram, data classification table, controls summary, launch readiness checklist

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Platform | 0/5 | Not started | - |
| 2. Content Model & Admin Interface | 0/3 | Not started | - |
| 3. Innovation Record & Perspectives | 0/4 | Not started | - |
| 4. Catalog & Search | 0/4 | Not started | - |
| 5. Engagement & Opportunity Submission | 0/3 | Not started | - |
| 6. Content Seeding & Launch Polish | 0/5 | Not started | - |
