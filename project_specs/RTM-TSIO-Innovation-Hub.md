# Requirements Traceability Matrix
## TSIO Innovation Hub

| Field | Value |
|-------|-------|
| **Document Type** | Requirements Traceability Matrix (RTM) |
| **Project Acronym** | TSIO-Innovation-Hub |
| **Domain** | Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch |
| **Date** | 2026-07-29 |
| **Version** | 1.0 — MVP |
| **Status** | Active |
| **Derived from** | PRD-TSIO-Innovation-Hub.md, FRD-TSIO-Innovation-Hub.md, TechArch-TSIO-Innovation-Hub.md, UserStories-TSIO-Innovation-Hub.md |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Requirements Summary](#2-requirements-summary)
3. [Traceability Matrix](#3-traceability-matrix)
4. [Requirements Detail](#4-requirements-detail)
5. [Test Case Coverage Matrix](#5-test-case-coverage-matrix)
6. [Non-Functional Requirements Traceability](#6-non-functional-requirements-traceability)
7. [Change Management](#7-change-management)
8. [Approval](#8-approval)

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides comprehensive bidirectional traceability between all specification documents for the TSIO Innovation Hub. It establishes and verifies that every product requirement defined in the Product Requirements Document (PRD) is implemented through functional requirements in the Functional Requirements Document (FRD), realized by technical specifications in the Technical Architecture document (TechArch), expressed as user-facing behavior in User Stories, and covered by test cases. The RTM serves as the authoritative governance record for the Hub's MVP scope.

The TSIO Innovation Hub is a governed web platform that converts scattered innovation outputs — distributed across SharePoint, project folders, code repositories, videos, and institutional memory — into discoverable, understandable, and actionable institutional knowledge for Federal Judiciary stakeholders. The platform is organized into ten features (F0–F9) ranging from the browsable Innovation Catalog (F0) to the Content, Maturity & Trust Model (F9), which is foundational to the system's trust integrity.

Traceability is maintained at four levels: **Product** (PRD features F0–F9 with priority tiers P0/P1/P2), **Functional** (FRD feature specifications F00–F09 with detailed behavioral requirements, validation rules, and API contracts), **Technical** (TechArch architecture components, data model tables, API endpoints, and service layer definitions), and **Acceptance** (User Stories US-0.1 through US-9.3 with explicit acceptance criteria). All identifiers used in this matrix are extracted directly from the source specification documents; no placeholder IDs are used.

---

## 2. Requirements Summary

### 2.1 PRD Feature Summary (F0–F9)

- **F0 — Innovation Catalog** (P0 — Critical MVP): Browsable catalog of all published innovation records with visible maturity, review status, engagement indicators, filtering, sorting, and pagination. Serves all five personas.
- **F1 — Search and Discovery** (P0 — Critical MVP): Full-text search across problem statements, key findings, summaries, tags, and mission/technology areas; filterable results; empty-state guidance with submission CTA. Serves P1, P2, P3.
- **F2 — Innovation Record** (P0 — Critical MVP): Structured authoritative record per innovation effort with all required content fields, publication lifecycle, trust disclaimers, audit history, and artifact links. Serves P1, P2, P3, P5.
- **F3 — Executive and Technical Perspectives** (P1 — High MVP): Single record supporting two derived views (executive: mission relevance and decision recommendation; technical: architecture, security findings, reuse guidance). Serves P1, P3.
- **F4 — Existing Lessons-Learned Integration** (P1 — High MVP): Curators wrap existing source documents in structured Innovation Records without relocating the originals; Audio Security POC is the MVP anchor record. Serves P5.
- **F5 — Opportunity Submission** (P1 — High MVP): Problem-first structured form for stakeholders to submit mission problems for I&R consideration; no authentication required; confirmation language explicitly disclaims portfolio commitment. Serves P1, P2.
- **F6 — Share Existing Innovation Work** (P2 — Late-MVP/Post-MVP): Contribution form for teams outside I&R; enters curation workflow before any record is published; community records labeled distinctly. Serves P4.
- **F7 — Engagement Routing** (P1 — High MVP): Trackable engagement requests (demo, adoption discussion, technical guidance, briefing) tied to specific records; configurable email routing to `AOml_TSO_IRB_Team@ao.uscourts.gov`; curator engagement activity log. Serves P1, P2, P3, P5.
- **F8 — Curation and Administration** (P0 — Critical MVP): Authorized I&R curator interface for record creation, lifecycle management, submission review, engagement monitoring, audit history, and governance enforcement. Serves P5.
- **F9 — Content, Maturity & Trust Model** (P0 — Critical MVP): Defined maturity levels (5), review statuses (7), trust disclaimers (4 types), and publication lifecycle; surfaced visibly on every record and catalog card; foundational to trust integrity. Serves all personas.

### 2.2 FRD Feature Coverage

- **F00** — Innovation Catalog: 6 sub-features, 2 API endpoints (`GET /api/v1/catalog`, `GET /api/v1/catalog/filters`), full filter/sort/pagination behavioral specification
- **F01** — Search and Discovery: 7 sub-features, 1 API endpoint (`GET /api/v1/search`), 9 indexed fields with defined weights
- **F02 (F02a + F02b)** — Innovation Record: 10 sub-features, 9 API endpoints, 29 input fields with pub-required/optional classification, complete validation rules, publication gate specification
- **F03** — Executive and Technical Perspectives: 7 sub-features, no additional API endpoints (derived from record), perspective toggle and default configuration
- **F04** — Existing Lessons-Learned Integration: 5 sub-features, no additional API endpoints (uses F02), artifact URL reachability check specification
- **F05** — Opportunity Submission: 9 sub-features, 3 API endpoints, 8 form fields, CAPTCHA and rate-limiting requirements
- **F06** — Share Existing Innovation Work: 9 sub-features, 3 API endpoints, 12 form fields, community attribution workflow
- **F07** — Engagement Routing: engagement request lifecycle, configurable routing email, 3 API endpoints, admin activity log
- **F08 (F08a + F08b)** — Curation and Administration: 8 sub-feature areas, admin interface component hierarchy, OIDC-gated access, governance gate enforcement
- **F09** — Content, Maturity & Trust Model: 5 maturity levels, 7 review statuses, 4 trust disclaimer trigger conditions, lifecycle state machine

### 2.3 TechArch Component Summary

- **Architecture pattern:** Monolithic Web Application with REST API (`/api/v1/*`); SSR frontend with progressive enhancement
- **Database:** PostgreSQL 14+ with 11 tables: `users`, `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`, `audit_log`, `opportunity_submissions`, `contribution_submissions`, `engagement_requests`, `hub_settings`
- **Search:** PostgreSQL native FTS with weighted `tsvector` GIN index; 4-weight field hierarchy (A/B/C)
- **Authentication:** OIDC/OAuth 2.0 via Azure AD / Microsoft Entra ID
- **Services:** CatalogService, SearchService, RecordService, PublicationLifecycleService, GovernanceGateService, TrustDisclaimerService, AuditService, SubmissionService, EngagementService, SettingsService, EmailService
- **Email routing:** Configurable SMTP relay; `hub_settings` table stores routing address; changeable without code deployment

### 2.4 User Story Coverage

- **32 total user stories** across 10 epics (Epic 0–9)
- **18 P0 stories** (MVP launch blockers) across Epics 0, 1, 2, 8, 9
- **11 P1 stories** (high-value MVP) across Epics 3, 4, 5, 7
- **3 P2 stories** (late-MVP/post-MVP) in Epic 6
- All 5 personas (Margaret Hollis, David Reyes, Priya Nair, Marcus Webb, Catalina Torres) represented

---

## 3. Traceability Matrix

### 3.1 Primary Traceability: PRD Features → FRD → TechArch → User Stories

| PRD Feature | Priority | FRD Spec | TechArch Service / Component | TechArch DB Table(s) | User Stories |
|-------------|----------|----------|------------------------------|----------------------|--------------|
| **F0: Innovation Catalog** | P0 | F00 | CatalogService, CatalogHandler | `innovation_records`, `record_tags`, `record_engagement_options` | US-0.1, US-0.2, US-0.3, US-0.4 |
| **F1: Search and Discovery** | P0 | F01 | SearchService, SearchHandler, SearchIndexService (PG FTS) | `innovation_records`, `record_tags`, `record_key_findings` | US-1.1, US-1.2, US-1.3 |
| **F2: Innovation Record** | P0 | F02 (F02a + F02b) | RecordService, RecordHandler, PublicationLifecycleService, GovernanceGateService, AuditService, TrustDisclaimerService | `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`, `audit_log` | US-2.1, US-2.2, US-2.3, US-2.4, US-2.5 |
| **F3: Executive and Technical Perspectives** | P1 | F03 | RecordService, RecordHandler | `innovation_records` (perspective fields) | US-3.1, US-3.2, US-3.3 |
| **F4: Existing Lessons-Learned Integration** | P1 | F04 | RecordService, RecordHandler | `record_artifact_links`, `innovation_records` | US-4.1, US-4.2 |
| **F5: Opportunity Submission** | P1 | F05 | SubmissionService, SubmissionHandler, EmailService, CaptchaService, RateLimiter | `opportunity_submissions`, `hub_settings` | US-5.1, US-5.2, US-5.3 |
| **F6: Share Existing Innovation Work** | P2 | F06 | SubmissionService, SubmissionHandler, EmailService, CaptchaService, RateLimiter | `contribution_submissions`, `innovation_records` | US-6.1, US-6.2, US-6.3 |
| **F7: Engagement Routing** | P1 | F07 | EngagementService, EngagementHandler, EmailService, SettingsService | `engagement_requests`, `hub_settings` | US-7.1, US-7.2, US-7.3 |
| **F8: Curation and Administration** | P0 | F08 (F08a + F08b) | AdminHandler, AuthMiddleware (OIDC), RecordService, PublicationLifecycleService, GovernanceGateService, AuditService | `users`, `innovation_records`, `audit_log`, `opportunity_submissions`, `contribution_submissions`, `engagement_requests`, `hub_settings` | US-8.1, US-8.2, US-8.3 |
| **F9: Content, Maturity & Trust Model** | P0 | F09 | TrustDisclaimerService, GovernanceGateService, PublicationLifecycleService, CatalogService | `innovation_records` (maturity_level, review_status, publication_state columns) | US-9.1, US-9.2, US-9.3 |

---

### 3.2 Reverse Traceability: User Stories → PRD → FRD → TechArch

| Story ID | Story Title | PRD Feature(s) | FRD Spec(s) | TechArch Service(s) |
|----------|-------------|----------------|-------------|---------------------|
| US-0.1 | Browse Published Innovation Records | F0 | F00 | CatalogService, CatalogHandler |
| US-0.2 | Filter Catalog by Metadata | F0 | F00 | CatalogService, CatalogHandler |
| US-0.3 | Identify Community and Reuse-Validated Records | F0, F9 | F00, F09 | CatalogService, TrustDisclaimerService |
| US-0.4 | Curator Reviews All Records Regardless of Publication State | F0, F8 | F00, F08 | CatalogService, AuthMiddleware |
| US-1.1 | Search by Mission Problem | F1 | F01 | SearchService, SearchIndexService (PG FTS) |
| US-1.2 | Filter Search Results | F1 | F01 | SearchService, SearchHandler |
| US-1.3 | Receive Guidance When No Results Are Found | F1, F5 | F01, F05 | SearchService, SubmissionService |
| US-2.1 | View a Full Innovation Record | F2, F9 | F02, F09 | RecordService, TrustDisclaimerService |
| US-2.2 | Curator Creates a New Innovation Record | F2, F8 | F02, F08 | RecordService, GovernanceGateService |
| US-2.3 | Curator Advances a Record Through the Publication Lifecycle | F2, F8 | F02, F08 | PublicationLifecycleService, GovernanceGateService, AuditService |
| US-2.4 | Curator Archives or Supersedes a Record | F2, F8 | F02, F08 | PublicationLifecycleService, RecordService, AuditService |
| US-2.5 | View Audit History for a Record | F2, F8 | F02, F08 | AuditService, RecordHandler |
| US-3.1 | Read the Executive Perspective on an Innovation Record | F3 | F03 | RecordService, RecordHandler |
| US-3.2 | Read the Technical Perspective on an Innovation Record | F3 | F03 | RecordService, RecordHandler |
| US-3.3 | Curator Authors Perspective-Specific Content | F3, F2 | F03, F02 | RecordService, GovernanceGateService |
| US-4.1 | Curator Creates a Structured Record from an Existing Lessons-Learned Document | F4, F2 | F04, F02 | RecordService, AuditService |
| US-4.2 | Stakeholder Accesses Source Document from a Lessons-Learned Record | F4, F2 | F04, F02 | RecordService, RecordHandler |
| US-5.1 | Submit a Mission Problem for I&R Consideration | F5 | F05 | SubmissionService, EmailService, CaptchaService |
| US-5.2 | Receive Confirmation After Submitting an Opportunity | F5 | F05 | SubmissionService, EmailService |
| US-5.3 | Curator Reviews and Dispositions Opportunity Submissions | F5, F8 | F05, F08 | SubmissionService, AdminHandler |
| US-6.1 | Submit Existing Innovation Work for I&R Curation | F6 | F06 | SubmissionService, EmailService, CaptchaService, RateLimiter |
| US-6.2 | Receive Confirmation That Contribution Is Under Curation Review | F6 | F06 | SubmissionService, EmailService |
| US-6.3 | Curator Creates an Innovation Record from a Contribution Submission | F6, F8, F2 | F06, F08, F02 | SubmissionService, RecordService, AdminHandler |
| US-7.1 | Request a Demo or Briefing from an Innovation Record | F7 | F07 | EngagementService, EmailService, CaptchaService |
| US-7.2 | Request Technical Guidance on an Innovation Record | F7 | F07 | EngagementService, EngagementHandler |
| US-7.3 | Curator Monitors Engagement Activity and Updates Routing Email | F7, F8 | F07, F08 | EngagementService, SettingsService |
| US-8.1 | Access the Curator Administration Interface | F8 | F08 | AuthMiddleware, AdminHandler |
| US-8.2 | Manage All Innovation Records from the Admin Interface | F8, F2 | F08, F02 | RecordService, PublicationLifecycleService, GovernanceGateService |
| US-8.3 | View In-App Content Model Reference | F8, F9 | F08, F09 | AdminHandler, SettingsService |
| US-9.1 | Trust Signals Are Visible on Every Catalog Card and Record | F9, F0, F2 | F09, F00, F02 | TrustDisclaimerService, CatalogService, RecordService |
| US-9.2 | Trust Disclaimers Are Rendered on Every Published Record | F9, F2, F3 | F09, F02, F03 | TrustDisclaimerService, RecordService |
| US-9.3 | Curator Assigns Maturity and Review Status Consistently | F9, F8 | F09, F08 | GovernanceGateService, RecordService, AuditService |

---

### 3.3 TechArch Component Coverage Traceability

| TechArch Component | PRD Feature(s) | FRD Spec(s) | User Stories |
|--------------------|----------------|-------------|--------------|
| **CatalogService** | F0, F9 | F00, F09 | US-0.1, US-0.2, US-0.3, US-0.4 |
| **SearchService + SearchIndexService (PG FTS)** | F1 | F01 | US-1.1, US-1.2, US-1.3 |
| **RecordService** | F2, F3, F4 | F02, F03, F04 | US-2.1, US-2.2, US-2.3, US-2.4, US-3.1, US-3.2, US-3.3, US-4.1, US-4.2 |
| **PublicationLifecycleService** | F2, F8, F9 | F02, F08, F09 | US-2.3, US-2.4, US-8.2, US-9.3 |
| **GovernanceGateService** | F2, F8, F9 | F02, F08, F09 | US-2.2, US-2.3, US-8.2, US-9.3 |
| **TrustDisclaimerService** | F2, F9 | F02, F09 | US-2.1, US-9.1, US-9.2 |
| **AuditService** | F2, F8 | F02, F08 | US-2.3, US-2.4, US-2.5, US-9.3 |
| **SubmissionService** | F5, F6 | F05, F06 | US-5.1, US-5.2, US-5.3, US-6.1, US-6.2, US-6.3 |
| **EngagementService** | F7 | F07 | US-7.1, US-7.2, US-7.3 |
| **SettingsService** | F7, F8 | F07, F08 | US-7.3, US-8.3 |
| **EmailService** | F5, F6, F7 | F05, F06, F07 | US-5.1, US-5.2, US-6.1, US-6.2, US-7.1, US-7.3 |
| **AuthMiddleware (OIDC/Azure AD)** | F8 | F08 | US-8.1, US-0.4 |
| **CaptchaService** | F5, F6, F7 | F05, F06, F07 | US-5.1, US-6.1, US-7.1 |
| **RateLimiter (IP-based)** | F5, F6, F7 | F05, F06, F07 | US-5.1, US-6.1, US-7.1 |

---

### 3.4 Database Table Coverage Traceability

| DB Table | PRD Feature(s) | FRD Spec(s) | Purpose |
|----------|----------------|-------------|---------|
| `users` | F8 | F08 | Curator user accounts; OIDC identity; role enforcement |
| `innovation_records` | F0, F1, F2, F3, F4, F9 | F00, F01, F02, F03, F04, F09 | Primary content entity; all record fields including perspectives, maturity, review status, publication state |
| `record_key_findings` | F1, F2 | F01, F02 | Structured key findings array; FTS weight A; minimum 1 required for publication |
| `record_artifact_links` | F2, F4 | F02, F04 | External URL links to authoritative source documents; minimum 1 required for publication |
| `record_tags` | F0, F1, F2 | F00, F01, F02 | Mission area and technology area classification tags |
| `record_engagement_options` | F2, F7 | F02, F07 | Configured engagement actions per record (REQUEST_DEMO, etc.) |
| `audit_log` | F2, F8 | F02, F08 | Append-only material change log; 100% capture; no updates or deletes |
| `opportunity_submissions` | F5, F8 | F05, F08 | Stakeholder mission problem submissions; curator disposition tracking |
| `contribution_submissions` | F6, F8 | F06, F08 | Community innovation work submissions; curation review queue |
| `engagement_requests` | F7, F8 | F07, F08 | Trackable engagement records tied to specific Innovation Records |
| `hub_settings` | F7, F8 | F07, F08 | Admin-configurable key-value store; `engagement_routing_email` setting |

---

## 4. Requirements Detail

This section documents each PRD feature alongside its FRD functional requirements, TechArch realizations, and mapped user stories with acceptance criteria traceability.

### F0: Innovation Catalog

**PRD Priority:** P0 — Critical MVP  
**FRD Reference:** F00  
**Personas Served:** P1, P2, P3, P4, P5

**FRD Functional Requirements:**
- Catalog queries `innovation_records` filtered by `publication_state = PUBLISHED` (PUBLIC role) or all states (CURATOR role)
- Supports multi-value filter parameters: `maturity_level`, `review_status`, `contributing_office`, `mission_area`, `technology_area`, `reuse_potential`
- Sort options: `recent` (published_at DESC, default), `maturity`, `relevance`
- Default pagination: 12 cards per page; maximum 50
- Each catalog card renders: title, short_summary, maturity badge, review status badge, mission/technology area tags, engagement indicators, community badge (if `source_type = COMMUNITY`), reuse badge (if `review_status = VALIDATED_FOR_REUSE`), published_at date
- Empty state: message + CTA link to F05 Opportunity Submission form
- CURATOR role sees all records regardless of publication state with visible state labels

**TechArch Realization:**
- `CatalogService`: queries and applies all filters, sorts, pagination; returns catalog card projections
- `GET /api/v1/catalog` and `GET /api/v1/catalog/filters` API endpoints
- Database indexes on `innovation_records.publication_state`, `maturity_level`, `review_status`, `published_at`, `source_type`, `reuse_potential`

**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4

---

### F1: Search and Discovery

**PRD Priority:** P0 — Critical MVP  
**FRD Reference:** F01  
**Personas Served:** P1, P2, P3

**FRD Functional Requirements:**
- Full-text search executes against 9 indexed fields with defined weights: `problem_statement` (High 3×), `key_findings` (High 3×), `what_was_explored` (Medium 2×), `outcome_summary` (Medium 2×), `title` (Medium 2×), `reuse_guidance` (Standard 1×), `mission_area_tags` (Standard 1×), `technology_area_tags` (Standard 1×), `short_summary` (Standard 1×)
- Query `q` parameter: 1–500 characters; HTML stripped; SQL parameterized
- Results ranked by relevance; ties broken by `published_at DESC`
- Query term highlights in result card snippets
- Filter panel: `maturity_level`, `review_status`, `contributing_office`, `reuse_potential`
- Empty-state guidance: "No records found for '[query]'. Try different keywords, or submit a mission problem for I&R consideration." with CTA to F05
- Query and filter state reflected in URL for bookmarking

**TechArch Realization:**
- `SearchService`: executes PostgreSQL FTS using weighted `tsvector` column; GIN index on `search_vector`
- `SearchIndexService (PG FTS)`: single `search_vector` column maintained by triggers from `innovation_records`, `record_key_findings`, and `record_tags` tables
- `GET /api/v1/search` API endpoint
- FTS update triggers: `trg_innovation_record_fts`, `trg_findings_update_fts`, `trg_tags_update_fts`

**User Stories:** US-1.1, US-1.2, US-1.3

---

### F2: Innovation Record

**PRD Priority:** P0 — Critical MVP  
**FRD Reference:** F02 (F02a + F02b)  
**Personas Served:** P1, P2, P3, P5

**FRD Functional Requirements:**
- 29 structured input fields covering: core content (title, problem_statement, what_was_explored, outcome_summary, key_findings), trust model (maturity_level, review_status, reuse_potential, source_type), attribution (owner_name, owner_office, contributing_office), perspectives (executive_perspective_text, executive_recommendation, technical_perspective_text, security_findings, performance_findings), lifecycle (publication_state, last_reviewed_date), and artifacts (artifact_links, engagement_options)
- Pub-required fields: title, problem_statement, what_was_explored, outcome_summary, key_findings (min 1), maturity_level, review_status, reuse_potential, owner_name, owner_office, contributing_office, source_type, mission_area_tags (min 1), artifact_links (min 1), engagement_options (min 1), last_reviewed_date, executive_perspective_text, executive_recommendation
- Publication gate: GovernanceGateService validates ALL pub-required fields before REVIEW → PUBLISHED transition; returns 422 with blocking field list on failure
- Trust disclaimers: TrustDisclaimerService derives applicable disclaimers from maturity_level, source_type, review_status, and publication_state; curator cannot suppress
- Audit history: AuditService logs every field edit, state transition, record creation, and deletion to `audit_log`
- Only DRAFT records may be hard-deleted (DELETE returns 409 for any other state)
- 9 API endpoints covering full CRUD, lifecycle transitions, and audit retrieval

**TechArch Realization:**
- `RecordService` + `RecordHandler`: full CRUD, orchestration of all lifecycle and governance services
- `PublicationLifecycleService`: enforces valid state machine transitions (DRAFT → REVIEW → PUBLISHED → SUPERSEDED/ARCHIVED)
- `GovernanceGateService`: hard-coded pub-required field list; no configuration bypass
- `TrustDisclaimerService`: evaluates 4 disclaimer trigger conditions against record field values
- `AuditService`: appends to `audit_log`; INSERT + SELECT only (no UPDATE/DELETE grants)
- Database: `innovation_records` (primary), `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`, `audit_log`

**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4, US-2.5

---

### F3: Executive and Technical Perspectives

**PRD Priority:** P1 — High MVP  
**FRD Reference:** F03  
**Personas Served:** P1, P3

**FRD Functional Requirements:**
- Two derived views from one Innovation Record: Executive Perspective and Technical Perspective
- No separate record entity; all perspective fields stored on `innovation_records` table
- Executive Perspective renders: executive_perspective_text, executive_recommendation, maturity_level (plain language), review_status (plain language), reuse_potential (plain language), trust disclaimers; primary CTA = "Request Briefing" or "Request Demo"
- Technical Perspective renders: what_was_explored, technical_perspective_text (if populated), security_findings, performance_findings, reuse_guidance, artifact_links (code repos/diagrams prominent), technology_area_tags; primary CTA = "Request Technical Guidance"
- Common to both: title, problem_statement, outcome_summary, key_findings, maturity badge, review status badge, last_reviewed_date, owner/office, all engagement options, trust disclaimers
- Perspective toggle always visible; cannot be hidden even when technical content is empty
- `default_perspective` field set by curator; defaults to `EXECUTIVE`
- Optional `?view=executive` or `?view=technical` URL parameter for direct perspective linking
- If `technical_perspective_text` is empty: placeholder rendered; toggle still displayed

**TechArch Realization:**
- Perspective fields on `innovation_records` table: `executive_perspective_text`, `executive_recommendation`, `technical_perspective_text`, `security_findings`, `performance_findings`, `default_perspective`
- No separate API endpoint; perspectives derived in `RecordService` response assembly
- Frontend: `PerspectiveToggle`, `ExecutivePerspectivePanel`, `TechnicalPerspectivePanel` components in `RecordPage`

**User Stories:** US-3.1, US-3.2, US-3.3

---

### F4: Existing Lessons-Learned Integration

**PRD Priority:** P1 — High MVP (required for first content records)  
**FRD Reference:** F04  
**Personas Served:** P5

**FRD Functional Requirements:**
- Curators create a standard Innovation Record (F02) and add an artifact link of type `DOCUMENT` pointing to the external SharePoint (or other) URL
- Hub stores URL and label only; does not crawl, index, copy, or cache linked document content
- Key findings entered manually by curator from source document; no automated extraction
- Record is discoverable via catalog (F00) and search (F01) by curator-authored content, not the source document
- Non-blocking HTTP HEAD reachability check on artifact URLs at save and REVIEW → PUBLISHED transition; advisory rendered inline if non-200 response; warning written to audit log; does not block save or publish
- Audio Security POC anchor record: must include `key_findings` covering GPU/CPU separation, Azure Government Cloud constraints, performance/latency limitations, and production-readiness gaps
- If source document URL becomes unreachable, Innovation Record remains valid and published

**TechArch Realization:**
- `record_artifact_links` table: stores `label`, `url`, `artifact_type`, `display_order`; URL validated as `https://`
- `RecordService` + `ArtifactLinkRepository`
- Non-blocking URL reachability check in RecordService at save and on publish transition
- No separate API surface; standard F02 record creation API

**User Stories:** US-4.1, US-4.2

---

### F5: Opportunity Submission

**PRD Priority:** P1 — High MVP  
**FRD Reference:** F05  
**Personas Served:** P1, P2

**FRD Functional Requirements:**
- Public form accessible at `/submit-opportunity`; no authentication required
- 8 form fields: `problem_description` (required, 50–3,000 chars, problem-first label), `mission_area` (required), `submitting_office` (required), `submitter_name` (required), `submitter_email` (required, email format), `submitter_title` (optional), `urgency_context` (optional, 0–1,000 chars), `known_constraints` (optional, 0–1,000 chars)
- CAPTCHA token required; validated server-side before persisting
- Rate limiting: 5 submissions per IP per hour (429 on exceeded)
- On successful submission: `opportunity_submission` record created with `status = SUBMITTED`; email sent to routing address; optional confirmation email to submitter
- Confirmation message: "Your submission has been received by the TSIO I&R team. This submission does not imply acceptance of the opportunity into the I&R portfolio or a commitment to begin a project."
- Curator disposition options: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`
- If email routing fails: submission still saved; no error shown to submitter

**TechArch Realization:**
- `SubmissionService` + `SubmissionHandler`
- `opportunity_submissions` table
- `EmailService` (non-fatal on email failure)
- `CaptchaService` + `RateLimiter`
- API endpoints: `POST /api/v1/opportunity-submissions`, `GET /api/v1/opportunity-submissions` (CURATOR), `PATCH /api/v1/opportunity-submissions/{submission_id}` (CURATOR)

**User Stories:** US-5.1, US-5.2, US-5.3

---

### F6: Share Existing Innovation Work

**PRD Priority:** P2 — Late-MVP / Post-MVP  
**FRD Reference:** F06  
**Personas Served:** P4

**FRD Functional Requirements:**
- Public form accessible at `/share-innovation`; no authentication required
- 11 form fields: `work_description` (required, 50–3,000 chars), `problem_addressed` (required, 50–2,000 chars), `outcome_summary` (required, 50–2,000 chars), `self_assessed_maturity` (required, enum excluding `ARCHIVED`), `artifact_urls` (required, 1–5 valid HTTPS URLs), `contributing_team` (required), `contributing_office` (required), `contact_name` (required), `contact_email` (required), `contact_title` (optional), `additional_context` (optional, 0–1,000 chars)
- Explicit form messaging: "Submissions enter I&R curation review. Publication is not guaranteed. If published, your team will be credited."
- CAPTCHA required; rate limiting: 5 submissions per IP per hour
- Curator can "Create Record from Submission" — creates pre-populated Draft Innovation Record with `source_type = COMMUNITY`
- Published community records: display community badge + trust disclaimer "This record was contributed by a team outside the TSIO I&R branch and curated for the Hub. It is not a centrally endorsed or I&R-conducted effort."
- Attribution via `contributing_office` and `contributor_attribution` fields on published record

**TechArch Realization:**
- `SubmissionService` + `SubmissionHandler`
- `contribution_submissions` table (schema included at MVP for forward compatibility)
- `innovation_records` with `source_type = COMMUNITY` when accepted
- API endpoints: `POST /api/v1/contribution-submissions`, `GET /api/v1/contribution-submissions` (CURATOR), `PATCH /api/v1/contribution-submissions/{submission_id}` (CURATOR)

**User Stories:** US-6.1, US-6.2, US-6.3

---

### F7: Engagement Routing

**PRD Priority:** P1 — High MVP  
**FRD Reference:** F07  
**Personas Served:** P1, P2, P3, P5

**FRD Functional Requirements:**
- 4 engagement option types: `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING`
- Engagement request fields: request_type, record_id, requestor_name, requestor_email, requestor_office, description_of_interest (required, 20–2,000 chars), desired_next_step (optional)
- Engagement requests only against PUBLISHED records; non-published returns 404
- Request type must be configured on target record; unconfigured type returns error
- CAPTCHA required; rate limiting: 10 requests per IP per hour
- Configurable routing email: stored in `hub_settings.engagement_routing_email`; initial value `AOml_TSO_IRB_Team@ao.uscourts.gov`; changeable by curator without code deployment
- SettingsService reads routing address at send time (not cached at startup)
- Email failure is non-fatal: engagement request record remains persisted
- Curator engagement activity log: all requests visible with type, record title, requestor info, timestamp, status
- Status lifecycle: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` / `NO_ACTION`

**TechArch Realization:**
- `EngagementService` + `EngagementHandler`
- `engagement_requests` table
- `SettingsService` + `hub_settings` table
- `EmailService` (non-fatal)
- `CaptchaService` + `RateLimiter`

**User Stories:** US-7.1, US-7.2, US-7.3

---

### F8: Curation and Administration

**PRD Priority:** P0 — Critical MVP  
**FRD Reference:** F08 (F08a + F08b)  
**Personas Served:** P5

**FRD Functional Requirements:**
- Admin interface accessible at `/admin/*`; unauthenticated requests redirect to OIDC login
- Post-authentication: system checks for CURATOR role; non-CURATOR authenticated users receive 403
- Dashboard tiles: total published records, draft/review records, pending opportunity submissions, pending contribution submissions, engagement requests in last 7 days
- Record management: create/edit/delete (DRAFT only) records; all pub-required field validation
- Full publication lifecycle management: DRAFT → REVIEW, REVIEW → PUBLISHED (governance gate), REVIEW → DRAFT (silent revert), PUBLISHED → REVIEW (confirmation required), PUBLISHED → SUPERSEDED (linked ID required), PUBLISHED → ARCHIVED, SUPERSEDED → ARCHIVED
- Invalid state transition returns: "This state transition is not permitted. Current state: [state]. Allowed transitions: [list]."
- Submission review: Opportunities queue (`opportunity_submissions`), Contributions queue (`contribution_submissions`)
- Engagement activity log with filter by record, request type, date range
- Settings page: update `engagement_routing_email` (validated email format; cannot be blank)
- Content Model Reference page: maturity levels (5) and review statuses (7) with definitions; read-only
- Audit history: accessible from every record's admin detail view

**TechArch Realization:**
- `AdminHandler` + all admin route handlers
- `AuthMiddleware (OIDC/Azure AD)`: validates OIDC token, extracts sub/email/name, upserts `users` table, checks CURATOR role
- `PublicationLifecycleService`, `GovernanceGateService`, `AuditService`
- `users` table with role enum: `CURATOR`, `ADMIN`
- Admin frontend component hierarchy: `DashboardPage`, `RecordsListPage`, `RecordEditPage`, `OpportunitySubmissionsPage`, `ContributionSubmissionsPage`, `EngagementActivityPage`, `SettingsPage`, `ContentModelReferencePage`

**User Stories:** US-8.1, US-8.2, US-8.3

---

### F9: Content, Maturity & Trust Model

**PRD Priority:** P0 — Critical MVP (Foundational)  
**FRD Reference:** F09  
**Personas Served:** All (P1–P5)

**FRD Functional Requirements:**
- 5 Maturity Levels: `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED`, `ARCHIVED`
- 7 Review Statuses: `SUBMITTED`, `CURATED`, `TECHNICALLY_REVIEWED`, `SECURITY_REVIEWED`, `POLICY_REVIEWED`, `VALIDATED_FOR_REUSE`, `SUPERSEDED_RETIRED`
- Both models displayed on every catalog card and Innovation Record page with color-coded badges
- 4 Trust Disclaimer triggers:
  - `maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT)` → POC ≠ production-ready disclaimer
  - `publication_state = PUBLISHED` (always) → Published ≠ approved for adoption disclaimer
  - `source_type = COMMUNITY` → Community-submitted ≠ centrally endorsed disclaimer
  - `review_status = VALIDATED_FOR_REUSE` → Validated for Reuse ≠ local review waived disclaimer
- Disclaimers are system-derived and hard-coded; curators cannot suppress, modify, or override
- All applicable disclaimers render simultaneously
- Maturity level and review status are curator-assigned; not self-reported or automatically derived
- `ARCHIVED` maturity distinct from `ARCHIVED` publication state; system prompts curator to archive publication state when Archived maturity is set on a Published record (no automatic cascade)
- Filtering and search support both models
- Content Model Reference accessible in admin interface

**TechArch Realization:**
- `TrustDisclaimerService`: evaluates 4 trigger conditions; returns applicable disclaimer texts; hard-coded texts, not configurable
- `GovernanceGateService`: validates maturity_level and review_status as pub-required fields
- `innovation_records` table columns: `maturity_level`, `review_status`, `reuse_potential`, `source_type`, `publication_state` (all enforced via CHECK constraints)
- Badge rendering in `CatalogCard` and `RecordPage` frontend components
- `ContentModelReferencePage` in admin interface: read-only definitions of all levels/statuses

**User Stories:** US-9.1, US-9.2, US-9.3

---

## 5. Test Case Coverage Matrix

Test cases are derived directly from FRD acceptance criteria, validation rules, and error states. Each test case maps to one or more user stories. Test IDs follow the convention `TEST-{FeatureNum}-{SeqNum}`.

### 5.1 F0: Innovation Catalog Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F0-01 | Catalog page renders at `/` and `/catalog` with all published records in card layout | US-0.1 | Functional | All PUBLISHED records rendered; non-published absent |
| TEST-F0-02 | Each catalog card displays title, short_summary, maturity badge, review badge, tags, engagement indicators, published_at | US-0.1 | Functional | All 9 card fields rendered correctly |
| TEST-F0-03 | Default sort is Most Recent (published_at DESC); sort control switches to Maturity and Relevance | US-0.1 | Functional | Sort order changes correctly; default is recency |
| TEST-F0-04 | Catalog paginates at 12 cards per page; pagination controls visible | US-0.1 | Functional | 12 cards on page 1; next/prev controls present |
| TEST-F0-05 | Only PUBLISHED records visible to unauthenticated users | US-0.1, US-0.4 | Security | DRAFT/REVIEW records absent for PUBLIC role |
| TEST-F0-06 | Multi-select filter for maturity level narrows catalog correctly | US-0.2 | Functional | Only records matching selected maturity levels shown |
| TEST-F0-07 | Multi-select filter for review status narrows catalog correctly | US-0.2 | Functional | Only records matching selected review statuses shown |
| TEST-F0-08 | Filter re-renders without full page reload; active filters summarized above results | US-0.2 | Functional | No full reload; filter summary shows active selections |
| TEST-F0-09 | Invalid filter values silently ignored; stripped from URL | US-0.2 | Validation | Invalid filter params stripped; no error shown |
| TEST-F0-10 | Zero results on active filters shows empty-state with F5 submission CTA | US-0.2, US-0.3 | Functional | Empty-state message with link to /submit-opportunity |
| TEST-F0-11 | Community badge shown on cards with `source_type = COMMUNITY` | US-0.3 | Functional | Community badge present and unambiguous |
| TEST-F0-12 | Reuse Badge shown on cards with `review_status = VALIDATED_FOR_REUSE` | US-0.3 | Functional | Reuse badge displayed; absent on other records |
| TEST-F0-13 | Authenticated CURATOR sees all records regardless of publication state with state labels | US-0.4 | Authorization | CURATOR sees DRAFT, REVIEW, PUBLISHED records with labels |
| TEST-F0-14 | CURATOR can link directly to a non-published record; PUBLIC user accessing same URL gets 404 | US-0.4 | Security | 404 returned to PUBLIC; curator can access |
| TEST-F0-15 | Catalog loads within 3 seconds under normal load | US-0.1 | Performance | Page load < 3 seconds |

### 5.2 F1: Search and Discovery Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F1-01 | Search field accessible from nav bar on all pages and from catalog page | US-1.1 | Functional | Search field present on all Hub pages |
| TEST-F1-02 | Search executes across problem_statement (3×), key_findings (3×), what_was_explored (2×), outcome_summary (2×), title (2×), reuse_guidance, tags, short_summary (all 1×) | US-1.1 | Functional | Weighted relevance ordering matches field weight specification |
| TEST-F1-03 | Results ranked by relevance; ties broken by published_at DESC | US-1.1 | Functional | Relevance order correct; tie-breaking by recency |
| TEST-F1-04 | Each result card shows query-term highlights in snippet | US-1.1 | Functional | Matching terms highlighted in result cards |
| TEST-F1-05 | Search scoped to PUBLISHED records for PUBLIC role | US-1.1 | Security | DRAFT/REVIEW records absent from search results |
| TEST-F1-06 | Results accessible via direct URL with query parameters `/search?q=...` | US-1.1 | Functional | URL reflects query; shareable link works |
| TEST-F1-07 | Filter panel on search results page; re-applies search with filters | US-1.2 | Functional | Filtered search results re-rendered correctly |
| TEST-F1-08 | Active filters and query string reflected in URL | US-1.2 | Functional | URL includes both `q` and active filter params |
| TEST-F1-09 | Blank or whitespace-only query does not execute search; prompt rendered | US-1.3 | Validation | No search executed; "Enter a search term" prompt shown |
| TEST-F1-10 | Query exceeding 500 characters returns 400 with `QUERY_TOO_LONG` | US-1.3 | Validation | Inline error: "Your search query is too long. Please shorten it to 500 characters or fewer." |
| TEST-F1-11 | Zero results shows empty-state with guidance and F5 CTA | US-1.3 | Functional | Empty-state with correct message and CTA link |
| TEST-F1-12 | Search query sanitized: HTML tags stripped before execution | US-1.1 | Security | HTML in query is sanitized; no XSS |

### 5.3 F2: Innovation Record Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F2-01 | Full Innovation Record renders at `/records/{record_id}` with all content fields | US-2.1 | Functional | All pub-required fields rendered correctly |
| TEST-F2-02 | Artifact links open in new tab; no artifact content embedded | US-2.1 | Functional | Links open new tab; no iframe/embed present |
| TEST-F2-03 | Trust disclaimers rendered in "Trust & Limitations" section before Next-Action panel | US-2.1 | Functional | Disclaimer section present; correct trigger conditions |
| TEST-F2-04 | Non-published record returns 404 for PUBLIC user direct URL access | US-2.1 | Security | 404 returned for DRAFT/REVIEW/SUPERSEDED/ARCHIVED |
| TEST-F2-05 | Admin interface provides "New Innovation Record" creating record in DRAFT state | US-2.2 | Functional | New record in DRAFT; system-generated record_id and created_at |
| TEST-F2-06 | All pub-required fields available in creation form; field-level validation errors shown inline | US-2.2 | Functional | All 19 pub-required fields present; inline validation errors on invalid input |
| TEST-F2-07 | Curator can save draft with incomplete pub-required fields | US-2.2 | Functional | Save succeeds with incomplete pub-required fields in DRAFT |
| TEST-F2-08 | "Submit for Review" blocked if any pub-required field missing; lists blocking fields | US-2.3 | Validation | 422 returned with list of all blocking fields |
| TEST-F2-09 | "Publish" transition re-validates pub-required fields via governance gate | US-2.3 | Validation | Publish blocked if any pub-required field missing |
| TEST-F2-10 | On successful publication: `published_at` set; record appears in catalog and search | US-2.3 | Functional | published_at timestamp set; record immediately discoverable |
| TEST-F2-11 | Editing a PUBLISHED record triggers confirmation warning; moves to REVIEW on confirm | US-2.3 | Functional | Warning shown; PUBLISHED → REVIEW on confirm; removed from public view |
| TEST-F2-12 | All state transitions logged to audit history with timestamp and curator identity | US-2.3, US-2.5 | Functional | Audit entry created for each state transition |
| TEST-F2-13 | Curator marks PUBLISHED record as SUPERSEDED with linked `superseded_by_record_id` | US-2.4 | Functional | Record transitions to SUPERSEDED; supersedes link saved |
| TEST-F2-14 | `superseded_by_record_id` referencing non-existent record returns 422 | US-2.4 | Validation | 422 with `INVALID_SUPERSEDES_REF` error |
| TEST-F2-15 | ARCHIVED records removed from default catalog browse; accessible via direct URL with "Archived" label | US-2.4 | Functional | Record absent from catalog; accessible by direct URL |
| TEST-F2-16 | DELETE of non-DRAFT record returns 409 | US-2.4 | Validation | 409 with `DELETE_NOT_PERMITTED` |
| TEST-F2-17 | Audit history accessible from admin record view; entries are read-only | US-2.5 | Functional | Audit log shown; no edit/delete controls |
| TEST-F2-18 | 100% of material field changes captured in audit log | US-2.5 | Functional | Every field change creates an audit entry |
| TEST-F2-19 | `artifact_link.url` must be valid `https://` URL; non-https rejected with 422 | US-2.2 | Validation | 422 with `INVALID_ARTIFACT_URL` |
| TEST-F2-20 | `key_findings` array empty returns 422 with `KEY_FINDINGS_REQUIRED` | US-2.2 | Validation | 422 with error message |
| TEST-F2-21 | `last_reviewed_date` in the future returns 422 with `INVALID_REVIEW_DATE` | US-2.2 | Validation | 422 with error message |

### 5.4 F3: Executive and Technical Perspectives Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F3-01 | Executive Perspective is default view when record opened (unless curator configured otherwise) | US-3.1 | Functional | Executive view rendered on first load |
| TEST-F3-02 | Executive Perspective shows mission relevance framing, executive recommendation, maturity in plain language; does not show technical architecture details | US-3.1 | Functional | Technical fields absent from Executive view |
| TEST-F3-03 | Primary CTA in Executive Perspective is "Request Briefing" or "Request Demo" | US-3.1 | Functional | Correct primary CTA rendered |
| TEST-F3-04 | "View Technical Details →" link visible in Executive Perspective; switches view | US-3.1 | Functional | Link present; switches to Technical Perspective |
| TEST-F3-05 | Perspective toggle ("Executive View" / "Technical View") always visible; cannot be hidden | US-3.2 | Functional | Toggle visible even when technical content empty |
| TEST-F3-06 | Technical Perspective renders: what_was_explored, technical_perspective_text, security_findings, performance_findings, reuse_guidance, artifact_links (code repos prominent), technology_area_tags | US-3.2 | Functional | All Technical fields rendered; code repos visually prominent |
| TEST-F3-07 | Primary CTA in Technical Perspective is "Request Technical Guidance" | US-3.2 | Functional | Correct primary CTA rendered |
| TEST-F3-08 | Empty `technical_perspective_text` shows placeholder: "Technical detail for this record is not yet available..." | US-3.2 | Functional | Placeholder message rendered; toggle still shown |
| TEST-F3-09 | Trust disclaimers rendered identically in both perspectives | US-3.2, US-9.2 | Functional | Same disclaimers in both views |
| TEST-F3-10 | `?view=executive` and `?view=technical` URL params render respective perspective directly | US-3.2 | Functional | Correct perspective rendered via URL param |
| TEST-F3-11 | Record creation/edit form includes separate fields for all perspective-specific content | US-3.3 | Functional | executive_perspective_text, executive_recommendation, technical_perspective_text, security_findings, performance_findings all available in form |
| TEST-F3-12 | Curator can set `default_perspective` to EXECUTIVE or TECHNICAL per record | US-3.3 | Functional | default_perspective saved and applied on record open |
| TEST-F3-13 | Publication gate requires executive_perspective_text and executive_recommendation; technical perspective optional | US-3.3 | Validation | Publish blocked without executive fields; technical fields optional |

### 5.5 F4: Existing Lessons-Learned Integration Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F4-01 | Curator creates Innovation Record with DOCUMENT artifact link pointing to SharePoint URL | US-4.1 | Functional | Record saved; SharePoint URL stored as artifact link |
| TEST-F4-02 | SharePoint URLs (`https://ao.sharepoint.com/...`) accepted as valid artifact URLs | US-4.1 | Functional | No validation error for SharePoint URLs |
| TEST-F4-03 | Hub stores only URL and label; does not crawl, index, or cache linked document content | US-4.1 | Functional | No content extracted from linked document |
| TEST-F4-04 | Non-blocking HTTP HEAD reachability check performed on artifact URL at save; advisory shown if non-200 | US-4.1 | Functional | Advisory shown for unreachable URL; save not blocked |
| TEST-F4-05 | Reachability warning written to audit log | US-4.1 | Functional | Audit warning entry created for unreachable URL |
| TEST-F4-06 | Published lessons-learned record discoverable via catalog and search by curator-authored content | US-4.1 | Functional | Record found in catalog and search |
| TEST-F4-07 | Artifact links rendered in dedicated section; each opens external URL in new tab | US-4.2 | Functional | Artifact links section visible; new tab behavior |
| TEST-F4-08 | Multiple artifact links per record all displayed | US-4.2 | Functional | All configured artifact links rendered |
| TEST-F4-09 | Audio Security POC anchor record published with correct key_findings (GPU/CPU, Azure Gov Cloud, performance, production-readiness gaps) | US-4.2 | Content | All 4 required finding categories present |

### 5.6 F5: Opportunity Submission Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F5-01 | Submission form accessible at `/submit-opportunity` without authentication | US-5.1 | Functional | Form renders for unauthenticated users |
| TEST-F5-02 | Form fields present with problem-first field ordering and labels | US-5.1 | Functional | problem_description labeled "Describe the mission problem you are facing" |
| TEST-F5-03 | CAPTCHA required; submission rejected without valid CAPTCHA token (422, `CAPTCHA_INVALID`) | US-5.1 | Security | 422 returned without valid CAPTCHA |
| TEST-F5-04 | Rate limit enforced: 6th submission within 1 hour from same IP returns 429 | US-5.1 | Security | 429 returned on rate limit exceeded |
| TEST-F5-05 | Required fields missing returns 422 with inline field errors; form input preserved | US-5.1 | Validation | 422 with inline errors; input not cleared |
| TEST-F5-06 | `problem_description` < 50 characters returns 422 with `FIELD_TOO_SHORT` | US-5.1 | Validation | 422 with error message |
| TEST-F5-07 | Invalid email format returns 422 with `INVALID_EMAIL` | US-5.1 | Validation | 422 with error message |
| TEST-F5-08 | On successful submission: `opportunity_submission` record created; email sent to routing address | US-5.2 | Functional | Record in DB; routing email triggered |
| TEST-F5-09 | On-screen confirmation displays "does not imply acceptance" language | US-5.2 | Functional | Correct confirmation text rendered |
| TEST-F5-10 | Email routing failure does not surface error to submitter; submission record persisted | US-5.2 | Resilience | Submission saved even if email fails; no user error shown |
| TEST-F5-11 | All submissions visible in admin Submissions → Opportunities queue with status indicators | US-5.3 | Functional | All submissions shown in admin queue |
| TEST-F5-12 | Curator can update disposition to all 4 statuses; `LINKED_TO_RECORD` requires linked_record_id | US-5.3 | Functional | All disposition updates accepted; linked_record_id validated |

### 5.7 F6: Share Existing Innovation Work Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F6-01 | Contribution form accessible at `/share-innovation` without authentication | US-6.1 | Functional | Form renders for unauthenticated users |
| TEST-F6-02 | Form includes explicit messaging about curation review and publication not guaranteed | US-6.1 | Functional | Curation messaging visible on form |
| TEST-F6-03 | `self_assessed_maturity` excludes `ARCHIVED` as a valid option | US-6.1 | Validation | `ARCHIVED` not available in maturity dropdown |
| TEST-F6-04 | `artifact_urls`: minimum 1 required; each must be valid HTTPS URL | US-6.1 | Validation | Submission blocked with no URLs; invalid URL format returns 422 |
| TEST-F6-05 | CAPTCHA required; rate limiting enforced (5 per IP per hour) | US-6.1 | Security | Same as F5 CAPTCHA and rate limit tests |
| TEST-F6-06 | On successful submission: confirmation renders with "does not guarantee publication" language | US-6.2 | Functional | Correct confirmation text rendered |
| TEST-F6-07 | All contributions visible in admin Submissions → Contributions queue | US-6.3 | Functional | Contributions queue shows all submissions |
| TEST-F6-08 | Curator "Create Record from Submission" creates pre-populated Draft with `source_type = COMMUNITY` | US-6.3 | Functional | Draft record created; community fields populated |
| TEST-F6-09 | Published community record displays community badge and community trust disclaimer | US-6.3 | Functional | Community badge and disclaimer visible on published record |
| TEST-F6-10 | Attribution fields `contributing_office` and `contributor_attribution` visible on published community record | US-6.3 | Functional | Attribution rendered on record page |

### 5.8 F7: Engagement Routing Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F7-01 | Next-Action panel displays configured engagement options (1–4) as actionable buttons on published records | US-7.1 | Functional | All configured options rendered as buttons |
| TEST-F7-02 | Clicking engagement option renders inline form/modal with required fields | US-7.1 | Functional | Modal/inline form opens with correct fields |
| TEST-F7-03 | CAPTCHA required before engagement request submission | US-7.1 | Security | Submission rejected without valid CAPTCHA |
| TEST-F7-04 | On success: on-screen confirmation shown; engagement_request record created; routing email sent | US-7.1 | Functional | Confirmation shown; record in DB; email triggered |
| TEST-F7-05 | Rate limit enforced: 11th request within 1 hour from same IP returns 429 | US-7.1 | Security | 429 returned on rate limit exceeded |
| TEST-F7-06 | Engagement request against non-published record returns 404 | US-7.2 | Security | 404 for DRAFT/REVIEW/ARCHIVED records |
| TEST-F7-07 | Request type not configured on target record returns error | US-7.2 | Validation | "This engagement option is not available for the selected record." |
| TEST-F7-08 | REQUEST_TECHNICAL_GUIDANCE available from both Technical and Executive perspectives | US-7.2 | Functional | Engagement form accessible from both perspective views |
| TEST-F7-09 | Engagement activity log shows all requests in reverse-chronological order with all required fields | US-7.3 | Functional | Log visible in admin; all fields present |
| TEST-F7-10 | Curator can update routing email in Settings; validation: valid email format, cannot be blank | US-7.3 | Functional | New routing email saved; subsequent emails use new address |
| TEST-F7-11 | Routing email change takes effect immediately without code deployment | US-7.3 | Functional | Next engagement request uses updated routing address |

### 5.9 F8: Curation and Administration Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F8-01 | Unauthenticated access to `/admin/*` redirects to OIDC login | US-8.1 | Security | Redirect to Azure AD login |
| TEST-F8-02 | Authenticated user without CURATOR role receives 403 | US-8.1 | Security | 403 with "You do not have permission" message |
| TEST-F8-03 | Expired OIDC session redirects to login | US-8.1 | Security | Session expiry redirected to login |
| TEST-F8-04 | Admin dashboard displays all 5 summary tiles with correct counts | US-8.1 | Functional | All tiles rendered with accurate data |
| TEST-F8-05 | Records section shows all records (all states) in sortable table | US-8.2 | Functional | All records visible; sortable by Title, Maturity, Review Status, State, Owner, Last Updated |
| TEST-F8-06 | All valid state transitions execute correctly in admin interface | US-8.2 | Functional | Each valid transition succeeds |
| TEST-F8-07 | Invalid state transition returns descriptive error with current state and allowed transitions | US-8.2 | Validation | Correct error message with transition list |
| TEST-F8-08 | PUBLISHED → REVIEW requires confirmation; REVIEW → DRAFT requires no confirmation | US-8.2 | Functional | Confirmation dialog for PUBLISHED→REVIEW; direct for REVIEW→DRAFT |
| TEST-F8-09 | PUBLISHED → SUPERSEDED requires `superseded_by_record_id` | US-8.2 | Validation | Transition blocked without valid linked record ID |
| TEST-F8-10 | Governance gate lists all missing pub-required fields when blocking publication | US-8.2 | Validation | Complete list of blocking fields returned |
| TEST-F8-11 | Content Model Reference shows all 5 maturity levels and 7 review statuses with definitions; read-only | US-8.3 | Functional | All levels and statuses shown with definitions; no edit controls |
| TEST-F8-12 | Maturity and review status dropdowns in record edit form show inline definitions | US-8.3 | Functional | Definitions visible in dropdown UI |

### 5.10 F9: Content, Maturity & Trust Model Test Cases

| Test ID | Test Description | US | Type | Expected Result |
|---------|-----------------|-----|------|-----------------|
| TEST-F9-01 | Maturity level badge with color coding visible on every catalog card (Idea=Gray, POC=Yellow, Prototype=Orange, Production=Green, Archived=Dark Gray) | US-9.1 | Functional | Color-coded badges on all catalog cards |
| TEST-F9-02 | Review status badge visible on every catalog card and record page | US-9.1 | Functional | Review status badge present on all cards and records |
| TEST-F9-03 | Maturity and review status are curator-assigned; changes logged to audit history | US-9.1 | Functional | Audit entry created on maturity/status changes |
| TEST-F9-04 | Trust disclaimer rendered for `EXPERIMENT_POC` or `PROTOTYPE_PILOT` maturity: "POC ≠ production-ready" text | US-9.2 | Functional | Correct disclaimer text for trigger condition |
| TEST-F9-05 | Trust disclaimer rendered for all PUBLISHED records: "Published ≠ approved for adoption" text | US-9.2 | Functional | Published disclaimer present on all published records |
| TEST-F9-06 | Trust disclaimer rendered for `source_type = COMMUNITY`: "Community-submitted ≠ centrally endorsed" text | US-9.2 | Functional | Community disclaimer present on community records |
| TEST-F9-07 | Trust disclaimer rendered for `review_status = VALIDATED_FOR_REUSE`: "Validated for Reuse ≠ local review waived" text | US-9.2 | Functional | Validated for Reuse disclaimer present |
| TEST-F9-08 | All applicable disclaimers render simultaneously; not mutually exclusive | US-9.2 | Functional | Multiple disclaimers rendered when multiple conditions met |
| TEST-F9-09 | Curator cannot suppress, modify, or override any trust disclaimer | US-9.2 | Security | No override mechanism available in curator interface |
| TEST-F9-10 | Trust disclaimers rendered identically in both Executive and Technical perspectives | US-9.2 | Functional | Identical disclaimers in both perspective views |
| TEST-F9-11 | Attempting to publish without maturity_level returns: "Maturity level is required before publishing." | US-9.3 | Validation | 422 with correct message |
| TEST-F9-12 | Attempting to publish without review_status returns: "Review status is required before publishing." | US-9.3 | Validation | 422 with correct message |
| TEST-F9-13 | `VALIDATED_FOR_REUSE` review status triggers Reuse Badge on catalog card and record page | US-9.3 | Functional | Reuse Badge visible on validated records |
| TEST-F9-14 | Setting `maturity_level = ARCHIVED` on a Published record triggers admin advisory to also archive publication state; no automatic cascade | US-9.3 | Functional | Advisory shown; publication state NOT automatically changed |
| TEST-F9-15 | `maturity_level = ARCHIVED` and `publication_state = ARCHIVED` are independent controls | US-9.3 | Functional | Each can be set independently |

### 5.11 Coverage Summary

| Feature | PRD Priority | User Stories | Test Cases | Critical (P0) Tests |
|---------|-------------|-------------|------------|---------------------|
| F0: Innovation Catalog | P0 | 4 (US-0.1–0.4) | 15 (TEST-F0-01–15) | 15 |
| F1: Search and Discovery | P0 | 3 (US-1.1–1.3) | 12 (TEST-F1-01–12) | 12 |
| F2: Innovation Record | P0 | 5 (US-2.1–2.5) | 21 (TEST-F2-01–21) | 21 |
| F3: Executive and Technical Perspectives | P1 | 3 (US-3.1–3.3) | 13 (TEST-F3-01–13) | — |
| F4: Existing Lessons-Learned Integration | P1 | 2 (US-4.1–4.2) | 9 (TEST-F4-01–09) | — |
| F5: Opportunity Submission | P1 | 3 (US-5.1–5.3) | 12 (TEST-F5-01–12) | — |
| F6: Share Existing Innovation Work | P2 | 3 (US-6.1–6.3) | 10 (TEST-F6-01–10) | — |
| F7: Engagement Routing | P1 | 3 (US-7.1–7.3) | 11 (TEST-F7-01–11) | — |
| F8: Curation and Administration | P0 | 3 (US-8.1–8.3) | 12 (TEST-F8-01–12) | 12 |
| F9: Content, Maturity & Trust Model | P0 | 3 (US-9.1–9.3) | 15 (TEST-F9-01–15) | 15 |
| **Total** | | **32** | **130** | **75** |

> **Note:** All 32 user stories have at least one corresponding test case. All 10 PRD features have complete test coverage. P0 features (F0, F1, F2, F8, F9) account for 75 of 130 test cases.

---

## 6. Non-Functional Requirements Traceability

| NFR Category | PRD Requirement | FRD Implementation | TechArch Implementation | Test Ref |
|--------------|-----------------|-------------------|------------------------|----------|
| **Governance** | Every published record must have: problem_statement, named owner, maturity_level, review_status, at least one artifact_link, last_reviewed_date, and trust disclaimers | F02b §Validation pub-required fields; F09 §Trust Disclaimer triggers | `GovernanceGateService` (hard-coded required field list; no bypass); `TrustDisclaimerService` | TEST-F2-08, TEST-F2-09, TEST-F9-11, TEST-F9-12 |
| **Audit History** | 100% of material changes to innovation records captured with timestamp and actor | F02 §Audit History; audit_log table: FIELD_EDIT, STATE_TRANSITION, RECORD_CREATED, RECORD_DELETED | `AuditService` (write-once; no UPDATE/DELETE grants); `audit_log` table | TEST-F2-12, TEST-F2-17, TEST-F2-18, TEST-F9-03 |
| **Access Control** | Curation interface requires authentication; public Hub accessible without authentication | F08 §Process (OIDC gate); F00/F01/F02 (PUBLIC role: unauthenticated access to catalog/search/published records) | `AuthMiddleware (OIDC/Azure AD)`; `/admin/*` routes require valid OIDC session; public routes have no auth check | TEST-F8-01, TEST-F8-02, TEST-F8-03, TEST-F0-05 |
| **Trust Integrity** | Maturity and review status visually prominent on every record/card; trust disclaimers rendered on every record | F09 §Trust Disclaimer triggers; F00/F02 §Outputs (badge rendering) | `TrustDisclaimerService` (hard-coded; not configurable); badge components in `CatalogCard` and `RecordPage` | TEST-F9-01–TEST-F9-10 |
| **Configurability** | Engagement routing email changeable without code deployment | F07 §SettingsService description; F08 §Settings | `hub_settings` table; `SettingsService` reads at send time (not cached at startup); admin Settings page | TEST-F7-10, TEST-F7-11 |
| **Browser Compatibility** | Standard government-issued browsers; modern browsers supported | PRD §8 NFR | SSR frontend with progressive enhancement; no SPA framework required for MVP | Manual browser compatibility testing |
| **Accessibility** | WCAG 2.1 AA | PRD §8 NFR | SSR frontend (accessible by default); no SPA complexity | Automated accessibility scan + manual review |
| **Performance** | Catalog and search page load < 3 seconds under normal load | PRD §8 NFR | PostgreSQL native FTS (no external search service); GIN indexes on `search_vector`; partial indexes on publication_state/maturity/review_status | TEST-F0-15; load testing |
| **Maintainability** | Supportable by TSIO delivery team without specialized vendor knowledge | PRD §8 NFR | Monolithic architecture; standard PostgreSQL + SSR stack; `maintainability over novelty` design principle | Architecture review; documentation |
| **Hosting Compliance** | Deployable in Judiciary approved hosting environment | PRD §8 NFR; TechArch §1.3 (deployment topology) | Deployment-agnostic application layer; TLS 1.2 minimum; secrets in hosting secret management; environment variable configuration | Hosting environment validation (TBD pending ATO discovery) |
| **Data Integrity** | Innovation records authoritative; linked artifacts not copied or modified | PRD §8 NFR; F02 §artifact_links; F04 §Validation | `record_artifact_links` stores URL+label only; no caching or proxying; Hub does not write to external artifact systems | TEST-F4-03 |

---

## 7. Change Management

All changes to this RTM must be traceable to a corresponding change in at least one source specification document. The change log below records all material modifications made after initial document creation.

| Change ID | Date | Document(s) Affected | Change Description | Author | Approved By |
|-----------|------|----------------------|--------------------|--------|-------------|
| CHG-001 | 2026-07-29 | RTM-TSIO-Innovation-Hub.md | Initial RTM created; full traceability established across PRD (F0–F9), FRD (F00–F09), TechArch (11 DB tables, 14 services), and UserStories (32 stories, 130 test cases) | Pivota Spec Generator | Pending |

---

## 8. Approval

This RTM requires sign-off from the following stakeholders before it is considered the governing traceability baseline for TSIO Innovation Hub MVP development.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner / I&R Lead** | *(TSIO I&R Team Lead)* | | |
| **Technical Architect** | *(Pivota Technical Lead)* | | |
| **Delivery Lead** | *(TSIO Delivery Team Lead)* | | |
| **QA / Test Lead** | *(Designated QA Representative)* | | |

**Approval Notes:**

- Approval of this RTM confirms that all PRD features (F0–F9) have corresponding FRD specifications, TechArch implementations, user stories, and test cases
- Any material change to the PRD, FRD, TechArch, or UserStories after approval must trigger an RTM update and re-approval
- The RTM is considered the governing traceability document for the MVP scope defined in PRD-TSIO-Innovation-Hub.md (2026-07-28)
- Hosting environment and identity provider decisions (marked TBD in PRD §5 and TechArch §1.3) will require an RTM update when resolved, particularly for NFR traceability rows covering Access Control and Hosting Compliance

---

*TSIO Innovation Hub — Requirements Traceability Matrix | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-29*
