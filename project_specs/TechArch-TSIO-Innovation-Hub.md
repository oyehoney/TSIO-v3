# TechArch: TSIO Innovation Hub

**Document Type:** Technical Architecture Document  
**Project Acronym:** TSIO-Innovation-Hub  
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch  
**Date:** 2026-07-29  
**Version:** 1.0 — MVP  
**Status:** Active  
**Derived from:** PRD-TSIO-Innovation-Hub.md (2026-07-28), FRD-TSIO-Innovation-Hub.md (2026-07-28)

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

The TSIO Innovation Hub follows a **Monolithic Web Application with a Structured REST API** pattern. This choice is deliberate: the system is small in initial record volume (3–5 records at launch, growing to ~50 within a year), the team is small, the hosting environment is undecided but constrained by federal ATO requirements, and the FRD explicitly calls for "maintainability over novelty."

A single deployable application serves both the public-facing Hub and the curator administration interface. The REST API layer is shared — the public frontend and the admin frontend both consume the same `/api/v1/*` endpoints, differentiated by authentication state and role. There is no microservices boundary, no event streaming, and no separate read/write store in MVP.

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture style | Monolith with REST API | Small team, federal hosting constraints, maintainability requirement |
| Database | PostgreSQL (primary recommendation) | Native full-text search (tsvector), UUID support, JSONB for future flexibility, AO-environment compatibility |
| Search strategy | PostgreSQL native FTS (tsvector + GIN index) | Eliminates external search service dependency; sufficient for MVP record volumes |
| Authentication | OIDC/OAuth 2.0 via Azure AD / Microsoft Entra ID | Federal Judiciary standard; OIDC middleware in backend |
| Frontend approach | Server-side rendered with progressive enhancement | Avoids SPA complexity; accessible; works on government-issued browsers |
| Email routing | Configurable SMTP relay or transactional email service | Database-stored routing address; changeable without code deployment |
| Artifact storage | External URL links only | Hub never copies or hosts authoritative source documents (PRD Design Principle) |
| Audit history | Write-ahead append-only audit_log table | 100% material change capture; no soft-overwrites |

---

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TSIO Innovation Hub                          │
│                     (Single Deployable Unit)                        │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │   Public Hub (SSR)   │    │  Curator Admin Interface (SSR)   │   │
│  │  /catalog            │    │  /admin/*                        │   │
│  │  /records/{id}       │    │  Record management               │   │
│  │  /search             │    │  Submission queues               │   │
│  │  /submit-opportunity │    │  Engagement activity log         │   │
│  │  /share-innovation   │    │  Hub settings                    │   │
│  └──────────┬───────────┘    └──────────────┬───────────────────┘   │
│             │                               │                       │
│             └──────────────┬────────────────┘                       │
│                            │                                        │
│                  ┌─────────▼──────────┐                             │
│                  │  REST API Layer    │                             │
│                  │  /api/v1/*         │                             │
│                  │  - Catalog         │                             │
│                  │  - Search          │                             │
│                  │  - Records         │                             │
│                  │  - Submissions     │                             │
│                  │  - Engagement      │                             │
│                  │  - Settings        │                             │
│                  │  - Admin           │                             │
│                  └─────────┬──────────┘                             │
│                            │                                        │
│           ┌────────────────┼─────────────────┐                      │
│           │                │                 │                      │
│  ┌────────▼───────┐  ┌─────▼──────┐  ┌──────▼──────┐               │
│  │  Service Layer │  │  Auth      │  │  Email      │               │
│  │  - Records     │  │  Middleware│  │  Service    │               │
│  │  - Catalog     │  │  (OIDC)    │  │  (SMTP/     │               │
│  │  - Search      │  │            │  │  Transact.) │               │
│  │  - Submissions │  └─────┬──────┘  └──────┬──────┘               │
│  │  - Engagement  │        │                │                       │
│  │  - Audit       │        │                │                       │
│  └────────┬───────┘        │                │                       │
│           │                │                │                       │
│  ┌────────▼───────────────────────────────┐ │                       │
│  │         PostgreSQL Database            │ │                       │
│  │  innovation_records                    │ │                       │
│  │  record_key_findings                   │ │                       │
│  │  record_artifact_links                 │ │                       │
│  │  record_tags                           │ │                       │
│  │  record_engagement_options             │ │                       │
│  │  audit_log                             │ │                       │
│  │  users                                 │ │                       │
│  │  opportunity_submissions               │ │                       │
│  │  contribution_submissions              │ │                       │
│  │  engagement_requests                   │ │                       │
│  │  hub_settings                          │ │                       │
│  │  (+ FTS: tsvector GIN indexes)         │ │                       │
│  └────────────────────────────────────────┘ │                       │
└─────────────────────────────────────────────┼─────────────────────┘
                                              │
            ┌─────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                  External Integrations                    │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  Azure AD /     │  │  Email Relay / Transactional │   │
│  │  Entra ID       │  │  Email Service               │   │
│  │  (OIDC/OAuth2)  │  │  (SMTP or SendGrid/ACS)      │   │
│  └─────────────────┘  └──────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  CAPTCHA        │  │  Artifact Source Systems     │   │
│  │  Provider       │  │  (SharePoint, GitHub,        │   │
│  │  (reCAPTCHA v3  │  │   Video — link-only,         │   │
│  │  or hCaptcha)   │  │   no integration required)   │   │
│  └─────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 1.3 Deployment Topology

The hosting environment is TBD pending federal ATO discovery. The architecture is designed to be deployment-agnostic at the application level. The following topology describes the target deployment pattern for a single-server or PaaS deployment:

```
┌────────────────────────────────────────────────────────┐
│           Federal Cloud / AO-Managed Hosting           │
│         (Azure Government, AO On-Premise, or PaaS)     │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Reverse Proxy / WAF                  │   │
│  │    (nginx, Azure App Gateway, or equivalent)    │   │
│  │    HTTPS enforced; HTTP redirect to HTTPS       │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │           Application Server                    │   │
│  │    Node.js / Python / .NET (TBD per hosting)    │   │
│  │    Public: port 80/443 (via reverse proxy)      │   │
│  │    Admin: /admin/* (role-gated)                 │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │           PostgreSQL Database                   │   │
│  │    Managed or self-hosted per AO policy         │   │
│  │    Encrypted at rest; TLS in transit            │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Deployment constraints:**
- All traffic HTTPS-only; TLS 1.2 minimum (TLS 1.3 preferred)
- Database encrypted at rest; connection via TLS
- No public database port exposure
- Admin routes (`/admin/*`) require valid OIDC session — no anonymous access
- Environment variables / secrets stored in hosting secret management (not in code or config files)
- Outbound HTTPS required for: Azure AD OIDC endpoints, email relay, CAPTCHA provider validation

---

### 1.4 Publication Lifecycle State Machine

The publication lifecycle governs record visibility. The state machine is enforced at the service layer, not just the UI:

```
                    ┌─────────┐
                    │  DRAFT  │◄──────────────────────┐
                    └────┬────┘                        │
                         │ submit-review               │ return-to-draft
                         ▼                             │
                    ┌─────────┐                        │
                    │ REVIEW  ├────────────────────────┘
                    └────┬────┘
                         │ publish (governance gate)
                         ▼
                    ┌──────────┐
              ┌─────┤ PUBLISHED├──────┐
              │     └──────────┘      │
              │ supersede             │ archive
              ▼                       ▼
         ┌───────────┐          ┌──────────┐
         │ SUPERSEDED│          │ ARCHIVED │
         └─────┬─────┘          └──────────┘
               │ archive
               ▼
          ┌──────────┐
          │ ARCHIVED │
          └──────────┘
```

**Governance gate (REVIEW → PUBLISHED):** System validates all `pub-required` fields are non-empty before allowing transition. Failure returns HTTP 422 with a list of blocking fields.

**Deletion rule:** Only DRAFT records may be hard-deleted. All other states are soft-deleted only (audit integrity requirement).

---

*End of 00-overview.md*
---

## 2. Component Architecture

### 2.1 Backend Components

The backend is organized into four logical layers: HTTP handlers (controllers), service layer (business logic), data access layer (repositories), and infrastructure services (auth, email, search).

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Handler Layer                       │
│  CatalogHandler  SearchHandler  RecordHandler               │
│  SubmissionHandler  EngagementHandler  AdminHandler         │
│  SettingsHandler  AuthHandler                               │
└────────────────────────────┬────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────┐
│                     Service Layer                           │
│                                                             │
│  CatalogService          RecordService                      │
│  SearchService           AuditService                       │
│  SubmissionService       EngagementService                  │
│  SettingsService         TrustDisclaimerService             │
│  PublicationLifecycleService  GovernanceGateService         │
└────────────────────────────┬────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────┐
│                  Data Access Layer (Repositories)           │
│                                                             │
│  InnovationRecordRepository   AuditLogRepository            │
│  TagRepository                EngagementRepository          │
│  ArtifactLinkRepository       SubmissionRepository          │
│  UserRepository               SettingsRepository            │
└────────────────────────────┬────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────┐
│                  Infrastructure Services                    │
│                                                             │
│  AuthMiddleware (OIDC/Azure AD)  EmailService (SMTP/API)    │
│  SearchIndexService (PG FTS)     CaptchaService             │
│  RateLimiter (IP-based)          SecretManager              │
└─────────────────────────────────────────────────────────────┘
```

#### CatalogService
- Queries `innovation_records` filtered by `publication_state = PUBLISHED` (PUBLIC) or all states (CURATOR)
- Applies multi-value filter parameters (maturity, review status, tags, office, reuse potential)
- Applies sort order: `recent` (published_at DESC), `maturity` (maturity_level order), `relevance` (FTS rank)
- Paginates results; returns catalog card projection (not full record)
- Returns available filter facets from current published record set

#### SearchService
- Executes PostgreSQL FTS query using weighted `tsvector` column built from indexed fields
- Field weights: problem_statement (3×), key_findings aggregate (3×), what_was_explored (2×), outcome_summary (2×), title (2×), others (1×)
- Sanitizes query input (HTML strip, SQL parameterization)
- Scopes to PUBLISHED records for PUBLIC; all states for CURATOR
- Returns relevance-ranked results with query-term highlight snippets

#### RecordService
- Full CRUD for Innovation Records (CURATOR only for write operations)
- Delegates to PublicationLifecycleService for all state transitions
- Delegates to GovernanceGateService before REVIEW → PUBLISHED transition
- Delegates to AuditService to log every field change and state transition
- Assembles full record response including key findings, artifact links, tags, engagement options
- Computes trust disclaimers via TrustDisclaimerService before returning public record

#### PublicationLifecycleService
- Enforces valid state transitions per the state machine (see §1.4)
- Rejects invalid transitions with `INVALID_STATE_TRANSITION` error
- Sets `published_at` timestamp on first PUBLISHED transition
- Only allows hard-delete on DRAFT state records

#### GovernanceGateService
- Validates all `pub-required` fields are non-empty before REVIEW → PUBLISHED transition
- Returns list of blocking field names on failure
- Hard-coded list of required fields; no configuration bypass

#### TrustDisclaimerService
- Evaluates four disclaimer trigger conditions against record field values
- Returns array of applicable disclaimer texts
- Hard-coded disclaimer texts; not configurable at runtime

#### AuditService
- Appends a new row to `audit_log` for every: field edit, state transition, record creation, record deletion
- Captures: record_id, changed_by_user_id, changed_at, event_type, field_changed, old_value, new_value, state_transition
- Write-once; audit rows are never updated or deleted

#### SubmissionService
- Handles Opportunity Submission (F05) and Contribution Submission (F06) create/list/update-disposition
- Validates CAPTCHA token server-side before persisting submission
- Applies IP-based rate limiting (5 submissions/hour per IP)
- Triggers EmailService after successful persistence (failure of email does not roll back submission)
- Pre-populates Draft Innovation Record from Contribution Submission on curator request

#### EngagementService
- Creates Engagement Requests tied to a specific Innovation Record
- Validates request_type is configured on target record
- Validates target record is PUBLISHED
- Applies IP-based rate limiting (10 requests/hour per IP)
- Triggers EmailService for routing notification
- Provides curator list/filter/update-status interface

#### SettingsService
- Reads and writes key-value pairs from `hub_settings` table
- Validates email format for `engagement_routing_email` setting
- Used by EmailService at send time to read current routing address

#### EmailService
- Sends routing notification emails and submitter confirmation emails
- Reads routing address from SettingsService at send time (not cached at startup)
- Failure is non-fatal: logs error, submission/request record remains persisted
- Supports SMTP relay (primary) with transactional email API fallback

---

### 2.2 Frontend Components

The frontend is server-side rendered (SSR) with progressive enhancement for filter interactions. No full SPA framework is required for MVP. The following describes the major page/component hierarchy:

```
Public Hub (/*)
├── Navigation Bar (search field, Hub name, submit-opportunity link)
├── CatalogPage (/catalog, /)
│   ├── FilterPanel (maturity, review_status, mission_area, tech_area, reuse_potential, office)
│   ├── SortControl (recent, maturity, relevance)
│   ├── CatalogGrid
│   │   └── CatalogCard (title, summary, maturity badge, review badge, tags,
│   │                     engagement indicators, community badge, reuse badge)
│   └── Pagination
├── RecordPage (/records/{id})
│   ├── PerspectiveToggle (Executive / Technical tabs)
│   ├── ExecutivePerspectivePanel
│   │   ├── ProblemStatementBlock
│   │   ├── OutcomeSummaryBlock
│   │   ├── KeyFindingsList
│   │   ├── ExecutivePerspectiveText
│   │   ├── ExecutiveRecommendation
│   │   └── MaturityReviewStatusBadges
│   ├── TechnicalPerspectivePanel
│   │   ├── WhatWasExploredBlock
│   │   ├── TechnicalPerspectiveText
│   │   ├── SecurityFindingsBlock
│   │   ├── PerformanceFindingsBlock
│   │   ├── ReuseGuidanceBlock
│   │   └── ArtifactLinksSection
│   ├── TrustDisclaimerBlock (required; rendered before NextActionPanel)
│   ├── NextActionPanel
│   │   └── EngagementRequestModal (form per engagement type)
│   └── RecordMetaFooter (owner, office, last-reviewed date)
├── SearchPage (/search?q=...)
│   ├── SearchResultsList (same card as CatalogCard + highlight snippet)
│   └── EmptyStateWithCTA
├── OpportunitySubmissionForm (/submit-opportunity)
└── ContributionSubmissionForm (/share-innovation)

Admin Interface (/admin/*)
├── AdminNav
├── DashboardPage (/admin)
│   └── SummaryTiles (published count, draft/review count, pending submissions, recent engagement)
├── RecordsListPage (/admin/records)
│   └── RecordAdminTable (all states, filterable)
├── RecordEditPage (/admin/records/{id}/edit, /admin/records/new)
│   ├── AllRecordFields (tabbed: Core | Perspectives | Classification | Artifacts | Engagement)
│   ├── PublicationStateControls (Submit for Review, Publish, Supersede, Archive)
│   ├── GovernanceGateFeedback (blocking field list)
│   └── AuditHistoryPanel
├── OpportunitySubmissionsPage (/admin/submissions/opportunities)
├── ContributionSubmissionsPage (/admin/submissions/contributions)
├── EngagementActivityPage (/admin/engagement)
├── SettingsPage (/admin/settings)
└── ContentModelReferencePage (/admin/reference)
```

---

### 2.3 Authentication / Authorization Flow

```
Public User                 Curator                     Azure AD / Entra ID
    │                          │                               │
    │ GET /catalog              │                               │
    │──────────────────────────►│                               │
    │                          │ (no auth check; PUBLIC route)  │
    │◄─────────────────────────┤                               │
    │                          │                               │
    │                          │ GET /admin                    │
    │                          │ (no session)                  │
    │                          │──────────────────────────────►│
    │                          │◄── redirect to OIDC login ────┤
    │                          │                               │
    │                          │ POST /token (OIDC callback)   │
    │                          │──────────────────────────────►│
    │                          │◄── id_token + access_token ───┤
    │                          │                               │
    │                          │ AuthMiddleware:               │
    │                          │ - Validate token signature    │
    │                          │ - Extract sub, email, name    │
    │                          │ - Upsert users table          │
    │                          │ - Check role = CURATOR        │
    │                          │ - Set session                 │
    │                          │                               │
    │                          │ GET /admin (with session)     │
    │                          │──────────────────────────────►│
    │                          │ 200 Admin Dashboard           │
    │                          │◄──────────────────────────────│
```

---

*End of 01-components.md*
---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      users                                  │
│  PK user_id (UUID)                                          │
│     email, display_name, role, is_active                    │
│     idp_subject, last_login_at, created_at                  │
└────────────────┬────────────────────────────────────────────┘
                 │ created_by / updated_by
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  innovation_records                         │
│  PK record_id (UUID)                                        │
│     Core: title, problem_statement, what_was_explored,      │
│           outcome_summary, reuse_guidance, short_summary    │
│     Trust: maturity_level, review_status, reuse_potential,  │
│            source_type                                      │
│     Attribution: owner_name, owner_office,                  │
│                  contributing_office, contributor_attribution│
│     Perspectives: executive_perspective_text,               │
│                   executive_recommendation,                 │
│                   technical_perspective_text,               │
│                   security_findings, performance_findings,  │
│                   default_perspective                       │
│     Lifecycle: publication_state, last_reviewed_date,       │
│                published_at, superseded_by_record_id (FK)   │
│     System: created_at, updated_at, deleted_at,             │
│             created_by_user_id (FK), updated_by_user_id (FK)│
└──────┬────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N                                                  │ 1:N
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│  record_key_findings    │               │   record_artifact_links       │
│  PK finding_id (UUID)   │               │   PK link_id (UUID)           │
│  FK record_id           │               │   FK record_id                │
│     finding_text        │               │      label, url,              │
│     display_order       │               │      artifact_type,           │
│     created_at          │               │      display_order, created_at│
└─────────────────────────┘               └───────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N                                                  │ 1:N
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│      record_tags        │               │ record_engagement_options     │
│  PK tag_id (UUID)       │               │  PK option_id (UUID)          │
│  FK record_id           │               │  FK record_id                 │
│     tag_type            │               │     option_type               │
│     tag_value           │               │     display_order             │
│     display_order       │               │  UNIQUE(record_id, option_type│
└─────────────────────────┘               └───────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │ 1:N (record_id FK)                                   │ 1:N (record_id FK)
┌──────▼──────────────────┐               ┌──────────────────▼────────────┐
│      audit_log          │               │   engagement_requests         │
│  PK audit_id (UUID)     │               │  PK request_id (UUID)         │
│  FK record_id           │               │  FK record_id                 │
│  FK changed_by_user_id  │               │     request_type              │
│     changed_at          │               │     requestor_name/email/     │
│     event_type          │               │     office/title              │
│     field_changed       │               │     description_of_interest   │
│     old_value/new_value │               │     desired_next_step         │
│     state_transition    │               │     status, curator_note      │
└─────────────────────────┘               │     submitted_at, updated_at  │
                                          │  FK updated_by_user_id        │
                                          └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               opportunity_submissions                       │
│  PK submission_id (UUID)                                    │
│     problem_description, mission_area, submitting_office    │
│     submitter_name, submitter_email, submitter_title        │
│     urgency_context, known_constraints                      │
│     status, disposition, internal_note                      │
│  FK linked_record_id (→ innovation_records)                 │
│     submitted_at, reviewed_at                               │
│  FK reviewed_by_user_id (→ users)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               contribution_submissions                      │
│  PK submission_id (UUID)                                    │
│     work_description, problem_addressed, outcome_summary    │
│     self_assessed_maturity, artifact_urls (TEXT[])          │
│     contributing_team, contributing_office                  │
│     contact_name, contact_email, contact_title              │
│     additional_context                                      │
│     status, internal_note                                   │
│  FK linked_record_id (→ innovation_records)                 │
│     submitted_at, reviewed_at                               │
│  FK reviewed_by_user_id (→ users)                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     hub_settings                            │
│  PK setting_key (VARCHAR)                                   │
│     setting_value, description, updated_at                  │
│  FK updated_by_user_id (→ users)                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Full Database DDL

> **Target database:** PostgreSQL 14+. All UUIDs use `gen_random_uuid()`. Timestamps stored as `TIMESTAMPTZ` (UTC). Enum values enforced via `CHECK` constraints for portability; alternatively, use PostgreSQL native `CREATE TYPE ... AS ENUM` for stricter type safety. Adjust `TEXT[]` (array type) for non-PostgreSQL engines.

---

#### Table: users

Curator user accounts. One row per authenticated curator. Populated via OIDC identity provider on first login. `idp_subject` is the stable unique identifier from Azure AD (OID claim).

```sql
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

---

#### Table: innovation_records

The primary content entity. One row per Innovation Record. Full-text search index (`search_vector`) is maintained as a generated `tsvector` column (PostgreSQL 12+) or kept up-to-date via trigger.

```sql
CREATE TABLE innovation_records (
    record_id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core content fields
    title                       VARCHAR(200)    NOT NULL
                                    CHECK (LENGTH(title) >= 5),
    problem_statement           TEXT            NOT NULL
                                    CHECK (LENGTH(problem_statement) >= 50),
    what_was_explored           TEXT            NOT NULL
                                    CHECK (LENGTH(what_was_explored) >= 50),
    outcome_summary             TEXT            NOT NULL
                                    CHECK (LENGTH(outcome_summary) >= 50),
    reuse_guidance              TEXT,
    short_summary               VARCHAR(280),

    -- Maturity & trust model
    maturity_level              VARCHAR(30)     NOT NULL
                                    CHECK (maturity_level IN (
                                        'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT',
                                        'PRODUCTION_VALIDATED', 'ARCHIVED'
                                    )),
    review_status               VARCHAR(30)     NOT NULL
                                    CHECK (review_status IN (
                                        'SUBMITTED', 'CURATED', 'TECHNICALLY_REVIEWED',
                                        'SECURITY_REVIEWED', 'POLICY_REVIEWED',
                                        'VALIDATED_FOR_REUSE', 'SUPERSEDED_RETIRED'
                                    )),
    reuse_potential             VARCHAR(10)     NOT NULL
                                    CHECK (reuse_potential IN ('HIGH', 'MEDIUM', 'LOW')),
    source_type                 VARCHAR(20)     NOT NULL
                                    CHECK (source_type IN ('I_AND_R', 'COMMUNITY')),

    -- Ownership & attribution
    owner_name                  VARCHAR(200)    NOT NULL,
    owner_office                VARCHAR(200)    NOT NULL,
    contributing_office         VARCHAR(200)    NOT NULL,
    contributor_attribution     TEXT,

    -- Perspective content
    executive_perspective_text  TEXT,
    executive_recommendation    TEXT,
    technical_perspective_text  TEXT,
    security_findings           TEXT,
    performance_findings        TEXT,
    default_perspective         VARCHAR(10)     NOT NULL DEFAULT 'EXECUTIVE'
                                    CHECK (default_perspective IN ('EXECUTIVE', 'TECHNICAL')),

    -- Publication lifecycle
    publication_state           VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                                    CHECK (publication_state IN (
                                        'DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'
                                    )),
    last_reviewed_date          DATE,
    published_at                TIMESTAMPTZ,
    superseded_by_record_id     UUID            REFERENCES innovation_records(record_id),

    -- Full-text search vector (PostgreSQL FTS)
    -- Weighted: A = problem_statement + key_findings (high), B = title + what_was_explored + outcome_summary (medium), C = others (standard)
    -- Updated via trigger on INSERT/UPDATE
    search_vector               TSVECTOR,

    -- Audit / system
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by_user_id          UUID            NOT NULL REFERENCES users(user_id),
    updated_by_user_id          UUID            NOT NULL REFERENCES users(user_id),
    deleted_at                  TIMESTAMPTZ     -- soft-delete: NULL = not deleted
);

-- Publication lifecycle indexes
CREATE INDEX idx_innovation_records_publication_state
    ON innovation_records(publication_state)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_maturity
    ON innovation_records(maturity_level)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_review_status
    ON innovation_records(review_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_published_at
    ON innovation_records(published_at DESC)
    WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX idx_innovation_records_source_type
    ON innovation_records(source_type)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_innovation_records_reuse_potential
    ON innovation_records(reuse_potential)
    WHERE deleted_at IS NULL;

-- Full-text search GIN index
CREATE INDEX idx_innovation_records_fts
    ON innovation_records USING GIN(search_vector);

-- FTS update trigger function
CREATE OR REPLACE FUNCTION update_innovation_record_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.problem_statement, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.outcome_summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.what_was_explored, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.reuse_guidance, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_summary, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.executive_perspective_text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.technical_perspective_text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_innovation_record_fts
    BEFORE INSERT OR UPDATE ON innovation_records
    FOR EACH ROW EXECUTE FUNCTION update_innovation_record_search_vector();

-- NOTE: key_findings text is appended to search_vector via a separate trigger
-- that fires after record_key_findings INSERT/UPDATE/DELETE (see record_key_findings DDL).
```

---

#### Table: record_key_findings

Stores the structured key findings array for each Innovation Record. Minimum 1 item required for publication. Display order is curator-controlled.

```sql
CREATE TABLE record_key_findings (
    finding_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    finding_text    TEXT        NOT NULL
                        CHECK (LENGTH(finding_text) >= 10 AND LENGTH(finding_text) <= 1000),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_key_findings_record
    ON record_key_findings(record_id, display_order);

-- Trigger to keep parent record search_vector in sync with key findings changes
CREATE OR REPLACE FUNCTION refresh_record_search_vector_from_findings()
RETURNS TRIGGER AS $$
DECLARE
    target_record_id UUID;
    findings_text TEXT;
BEGIN
    target_record_id := COALESCE(NEW.record_id, OLD.record_id);
    SELECT string_agg(finding_text, ' ')
      INTO findings_text
      FROM record_key_findings
     WHERE record_id = target_record_id;

    UPDATE innovation_records
       SET search_vector = search_vector ||
           setweight(to_tsvector('english', COALESCE(findings_text, '')), 'A'),
           updated_at = NOW()
     WHERE record_id = target_record_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_findings_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_key_findings
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_findings();
```

---

#### Table: record_artifact_links

Stores external artifact links. Hub stores URL and label only — no content is cached or proxied. At least one link required for publication.

```sql
CREATE TABLE record_artifact_links (
    link_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL CHECK (LENGTH(label) >= 2),
    url             TEXT        NOT NULL CHECK (url LIKE 'https://%'),
    artifact_type   VARCHAR(20) NOT NULL
                        CHECK (artifact_type IN (
                            'DOCUMENT', 'CODE_REPOSITORY', 'VIDEO', 'DIAGRAM', 'OTHER'
                        )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_artifact_links_record
    ON record_artifact_links(record_id, display_order);
```

---

#### Table: record_tags

Stores mission area and technology area tags. Multi-value per record per tag type.

```sql
CREATE TABLE record_tags (
    tag_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    tag_type        VARCHAR(20) NOT NULL
                        CHECK (tag_type IN ('MISSION_AREA', 'TECHNOLOGY_AREA')),
    tag_value       VARCHAR(100) NOT NULL CHECK (LENGTH(tag_value) >= 1),
    display_order   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_record_tags_record
    ON record_tags(record_id, tag_type);

CREATE INDEX idx_record_tags_value
    ON record_tags(tag_type, tag_value);

-- Trigger to append tag values to record search_vector
CREATE OR REPLACE FUNCTION refresh_record_search_vector_from_tags()
RETURNS TRIGGER AS $$
DECLARE
    target_record_id UUID;
    tags_text TEXT;
BEGIN
    target_record_id := COALESCE(NEW.record_id, OLD.record_id);
    SELECT string_agg(tag_value, ' ')
      INTO tags_text
      FROM record_tags
     WHERE record_id = target_record_id;

    UPDATE innovation_records
       SET search_vector = search_vector ||
           setweight(to_tsvector('english', COALESCE(tags_text, '')), 'C'),
           updated_at = NOW()
     WHERE record_id = target_record_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tags_update_fts
    AFTER INSERT OR UPDATE OR DELETE ON record_tags
    FOR EACH ROW EXECUTE FUNCTION refresh_record_search_vector_from_tags();
```

---

#### Table: record_engagement_options

Stores which engagement options are configured on each record. A record may have 1–4 options. UNIQUE constraint prevents duplicate option types per record.

```sql
CREATE TABLE record_engagement_options (
    option_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL
                        REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    option_type     VARCHAR(40) NOT NULL
                        CHECK (option_type IN (
                            'REQUEST_DEMO',
                            'REQUEST_ADOPTION_DISCUSSION',
                            'REQUEST_TECHNICAL_GUIDANCE',
                            'REQUEST_BRIEFING',
                            'SUBMIT_RELATED_PROBLEM'
                        )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    UNIQUE (record_id, option_type)
);

CREATE INDEX idx_record_engagement_options_record
    ON record_engagement_options(record_id, display_order);
```

---

#### Table: audit_log

Append-only log of material changes to Innovation Records. Every field edit and state transition is captured here. Rows are never updated or deleted. Required by NFR.

```sql
CREATE TABLE audit_log (
    audit_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID        NOT NULL
                            REFERENCES innovation_records(record_id),
    changed_by_user_id  UUID        NOT NULL REFERENCES users(user_id),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type          VARCHAR(40) NOT NULL
                            CHECK (event_type IN (
                                'FIELD_EDIT',
                                'STATE_TRANSITION',
                                'RECORD_CREATED',
                                'RECORD_DELETED'
                            )),
    field_changed       VARCHAR(100),   -- NULL for non-field events (e.g. state transition)
    old_value           TEXT,
    new_value           TEXT,
    state_transition    VARCHAR(50)     -- e.g. 'DRAFT->REVIEW', 'REVIEW->PUBLISHED'
);

CREATE INDEX idx_audit_log_record
    ON audit_log(record_id, changed_at DESC);

CREATE INDEX idx_audit_log_user
    ON audit_log(changed_by_user_id, changed_at DESC);

CREATE INDEX idx_audit_log_event_type
    ON audit_log(event_type, changed_at DESC);
```

---

#### Table: opportunity_submissions

Stores stakeholder mission problem / opportunity submissions (F05). No authentication required from submitter. Visible in curator admin queue.

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

---

#### Table: contribution_submissions

Stores community innovation work contribution submissions (F06). Priority P2 (late-MVP / post-MVP) but schema included at MVP for forward compatibility.

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

---

#### Table: engagement_requests

Stores all stakeholder engagement requests (F07). Tied to a specific Innovation Record and a specific engagement type configured on that record.

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

#### Table: hub_settings

Admin-configurable key-value settings store. Routing email address and other configurable parameters are stored here, changeable by curators without code deployment.

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

---

### 3.3 Database Design Notes

**Search vector strategy:** The `search_vector` column on `innovation_records` is the single FTS target. Triggers keep it synchronized with the record's own text fields (via the record INSERT/UPDATE trigger) and with `record_key_findings` and `record_tags` (via their respective after-triggers). This gives the search query a single `WHERE search_vector @@ plainto_tsquery(...)` clause with no joins.

**Weight mapping to FRD field weights:**

| FRD Weight | FTS Weight | Fields |
|-----------|------------|--------|
| High (3×) | A | `problem_statement`, aggregated `key_findings` text |
| Medium (2×) | B | `title`, `what_was_explored`, `outcome_summary` |
| Standard (1×) | C | `reuse_guidance`, `short_summary`, `executive_perspective_text`, `technical_perspective_text`, tag values |

**Soft-delete:** Only DRAFT records may be hard-deleted. All other records use `deleted_at` timestamping. All queries include `WHERE deleted_at IS NULL` in partial indexes and query predicates.

**Audit log immutability:** The `audit_log` table has no UPDATE or DELETE grants in the application role. The application database user has INSERT + SELECT only on this table.

**Array column (artifact_urls in contribution_submissions):** Uses PostgreSQL `TEXT[]` native array type. For non-PostgreSQL engines, serialize as JSON text column or normalize into a separate `contribution_submission_artifact_urls` table.

---

*End of 02-data-model.md*
---

## 4. API Design

### 4.1 API Conventions

- **Base path:** `/api/v1`
- **Content type:** `application/json` for all requests and responses
- **Authentication:** Bearer token (`Authorization: Bearer <token>`) or session cookie for CURATOR endpoints. Public endpoints require no authentication.
- **Pagination envelope** (all list endpoints):

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 12,
    "total_count": 47,
    "total_pages": 4
  }
}
```

- **Error envelope:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": [
      { "field": "field_name", "error_code": "FIELD_TOO_SHORT", "message": "..." }
    ]
  }
}
```

---

### 4.2 TypeScript Interfaces

These interfaces define the canonical shapes for all API request bodies and response payloads. They are the authoritative contract between the frontend and backend.

```typescript
// ─── Enum Types ────────────────────────────────────────────────────────────

type MaturityLevel =
  | 'IDEA'
  | 'EXPERIMENT_POC'
  | 'PROTOTYPE_PILOT'
  | 'PRODUCTION_VALIDATED'
  | 'ARCHIVED';

type ReviewStatus =
  | 'SUBMITTED'
  | 'CURATED'
  | 'TECHNICALLY_REVIEWED'
  | 'SECURITY_REVIEWED'
  | 'POLICY_REVIEWED'
  | 'VALIDATED_FOR_REUSE'
  | 'SUPERSEDED_RETIRED';

type ReusePotential = 'HIGH' | 'MEDIUM' | 'LOW';

type SourceType = 'I_AND_R' | 'COMMUNITY';

type PublicationState =
  | 'DRAFT'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

type ArtifactType =
  | 'DOCUMENT'
  | 'CODE_REPOSITORY'
  | 'VIDEO'
  | 'DIAGRAM'
  | 'OTHER';

type EngagementOptionType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING'
  | 'SUBMIT_RELATED_PROBLEM';

type DefaultPerspective = 'EXECUTIVE' | 'TECHNICAL';

type AuditEventType =
  | 'FIELD_EDIT'
  | 'STATE_TRANSITION'
  | 'RECORD_CREATED'
  | 'RECORD_DELETED';

type OpportunitySubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED_FOR_CONSIDERATION'
  | 'DECLINED'
  | 'LINKED_TO_RECORD';

type ContributionSubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED_FOR_CURATION'
  | 'DECLINED'
  | 'PUBLISHED';

type EngagementRequestStatus =
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_ACTION';

// ─── Shared Sub-Types ──────────────────────────────────────────────────────

interface ArtifactLink {
  link_id?: string;           // UUID; present in responses, omitted in create requests
  label: string;              // 2–200 chars
  url: string;                // Must be https://...
  artifact_type: ArtifactType;
  display_order?: number;
}

interface AuditEntry {
  audit_id: string;
  record_id: string;
  changed_by: string;         // Display name of curator
  changed_by_user_id: string;
  changed_at: string;         // ISO 8601 UTC
  event_type: AuditEventType;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  state_transition: string | null;  // e.g., 'DRAFT->REVIEW'
}

interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Array<{
      field: string;
      error_code: string;
      message: string;
    }>;
  };
}

// ─── Innovation Record ─────────────────────────────────────────────────────

/** Full Innovation Record — returned by GET /api/v1/records/{id} */
interface InnovationRecord {
  record_id: string;                        // UUID
  title: string;                            // 5–200 chars
  problem_statement: string;
  what_was_explored: string;
  outcome_summary: string;
  key_findings: string[];                   // Array; min 1 item for publication
  reuse_guidance: string | null;
  short_summary: string | null;             // ≤ 280 chars; auto-generated or curator-authored

  // Trust model
  maturity_level: MaturityLevel;
  maturity_label: string;                   // Human-readable label
  review_status: ReviewStatus;
  review_status_label: string;
  reuse_potential: ReusePotential;
  source_type: SourceType;

  // Attribution
  owner_name: string;
  owner_office: string;
  contributing_office: string;
  contributor_attribution: string | null;

  // Perspectives
  executive_perspective_text: string;
  executive_recommendation: string;
  technical_perspective_text: string | null;
  security_findings: string | null;
  performance_findings: string | null;
  default_perspective: DefaultPerspective;

  // Relations
  mission_area_tags: string[];
  technology_area_tags: string[];
  artifact_links: ArtifactLink[];
  engagement_options: EngagementOptionType[];

  // System-computed
  trust_disclaimers: string[];              // Derived from maturity_level, source_type, review_status, publication_state
  is_validated_for_reuse: boolean;          // review_status === 'VALIDATED_FOR_REUSE'
  is_community_contributed: boolean;        // source_type === 'COMMUNITY'

  // Lifecycle
  publication_state: PublicationState;
  last_reviewed_date: string | null;        // YYYY-MM-DD
  published_at: string | null;              // ISO 8601 UTC
  superseded_by_record_id: string | null;   // UUID

  // Audit
  created_at: string;                       // ISO 8601 UTC
  updated_at: string;
  created_by_user_id: string;
  updated_by_user_id: string;
}

/** Catalog card — returned by GET /api/v1/catalog and GET /api/v1/search */
interface CatalogCard {
  record_id: string;
  title: string;
  short_summary: string | null;
  maturity_level: MaturityLevel;
  maturity_label: string;
  review_status: ReviewStatus;
  review_status_label: string;
  reuse_potential: ReusePotential;
  source_type: SourceType;
  mission_area_tags: string[];
  technology_area_tags: string[];
  engagement_options: EngagementOptionType[];
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  published_at: string | null;
  publication_state?: PublicationState;     // Present for CURATOR role only
}

/** Search result card — extends CatalogCard */
interface SearchResultCard extends CatalogCard {
  relevance_score: number;
  highlight_snippet: string | null;         // Query-term highlighted excerpt from problem_statement or short_summary
}

/** Create / update record request body */
interface InnovationRecordWriteRequest {
  title?: string;
  problem_statement?: string;
  what_was_explored?: string;
  outcome_summary?: string;
  key_findings?: string[];
  reuse_guidance?: string | null;
  short_summary?: string | null;
  maturity_level?: MaturityLevel;
  review_status?: ReviewStatus;
  reuse_potential?: ReusePotential;
  source_type?: SourceType;
  owner_name?: string;
  owner_office?: string;
  contributing_office?: string;
  contributor_attribution?: string | null;
  executive_perspective_text?: string;
  executive_recommendation?: string;
  technical_perspective_text?: string | null;
  security_findings?: string | null;
  performance_findings?: string | null;
  default_perspective?: DefaultPerspective;
  mission_area_tags?: string[];
  technology_area_tags?: string[];
  artifact_links?: Omit<ArtifactLink, 'link_id'>[];
  engagement_options?: EngagementOptionType[];
  last_reviewed_date?: string | null;
  superseded_by_record_id?: string | null;
}

// ─── Catalog / Search Query Params ─────────────────────────────────────────

interface CatalogQueryParams {
  maturity_level?: MaturityLevel | MaturityLevel[];
  review_status?: ReviewStatus | ReviewStatus[];
  contributing_office?: string | string[];
  mission_area?: string | string[];
  technology_area?: string | string[];
  reuse_potential?: ReusePotential;
  sort?: 'recent' | 'maturity' | 'relevance';
  page?: number;
  page_size?: number;
}

interface SearchQueryParams extends CatalogQueryParams {
  q: string;  // 1–500 chars; required
}

// ─── Opportunity Submission ─────────────────────────────────────────────────

interface OpportunitySubmission {
  submission_id: string;
  problem_description: string;
  mission_area: string;
  submitting_office: string;
  submitter_name: string;
  submitter_email: string;
  submitter_title: string | null;
  urgency_context: string | null;
  known_constraints: string | null;
  status: OpportunitySubmissionStatus;
  disposition: OpportunitySubmissionStatus | null;
  linked_record_id: string | null;
  internal_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
}

interface OpportunitySubmissionCreateRequest {
  problem_description: string;    // 50–3000 chars
  mission_area: string;           // 2–200 chars
  submitting_office: string;      // 2–200 chars
  submitter_name: string;         // 2–200 chars
  submitter_email: string;        // valid email
  submitter_title?: string;
  urgency_context?: string;
  known_constraints?: string;
  captcha_token: string;
}

interface SubmissionDispositionUpdateRequest {
  disposition: OpportunitySubmissionStatus;
  linked_record_id?: string | null;
  internal_note?: string | null;
}

// ─── Contribution Submission ────────────────────────────────────────────────

interface ContributionSubmission {
  submission_id: string;
  work_description: string;
  problem_addressed: string;
  outcome_summary: string;
  self_assessed_maturity: Exclude<MaturityLevel, 'ARCHIVED'>;
  artifact_urls: string[];
  contributing_team: string;
  contributing_office: string;
  contact_name: string;
  contact_email: string;
  contact_title: string | null;
  additional_context: string | null;
  status: ContributionSubmissionStatus;
  internal_note: string | null;
  linked_record_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
}

interface ContributionSubmissionCreateRequest {
  work_description: string;       // 50–3000 chars
  problem_addressed: string;      // 50–2000 chars
  outcome_summary: string;        // 50–2000 chars
  self_assessed_maturity: Exclude<MaturityLevel, 'ARCHIVED'>;
  artifact_urls: string[];        // 1–5 valid HTTPS URLs
  contributing_team: string;      // 2–200 chars
  contributing_office: string;    // 2–200 chars
  contact_name: string;           // 2–200 chars
  contact_email: string;          // valid email
  contact_title?: string;
  additional_context?: string;
  captcha_token: string;
}

interface ContributionDispositionUpdateRequest {
  disposition: ContributionSubmissionStatus;
  linked_record_id?: string | null;
  internal_note?: string | null;
}

// ─── Engagement Request ─────────────────────────────────────────────────────

interface EngagementRequest {
  request_id: string;
  record_id: string;
  request_type: EngagementOptionType;
  requestor_name: string;
  requestor_email: string;
  requestor_office: string;
  requestor_title: string | null;
  description_of_interest: string;
  desired_next_step: string | null;
  status: EngagementRequestStatus;
  curator_note: string | null;
  submitted_at: string;
  updated_at: string;
  updated_by_user_id: string | null;
}

interface EngagementRequestCreateRequest {
  request_type: EngagementOptionType;
  record_id: string;              // UUID of the target Innovation Record
  requestor_name: string;         // 2–200 chars
  requestor_email: string;        // valid email
  requestor_office: string;       // 2–200 chars
  requestor_title?: string;
  description_of_interest: string; // 20–2000 chars
  desired_next_step?: string;
  captcha_token: string;
}

interface EngagementRequestStatusUpdateRequest {
  status: EngagementRequestStatus;
  curator_note?: string | null;
}

// ─── Hub Settings ───────────────────────────────────────────────────────────

interface HubSetting {
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

interface HubSettingUpdateRequest {
  setting_value: string;
}

interface HubSettingsBulkUpdateRequest {
  settings: Array<{
    setting_key: string;
    setting_value: string;
  }>;
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────

interface DashboardSummary {
  published_records: number;
  draft_review_records: number;
  pending_opportunity_submissions: number;
  pending_contribution_submissions: number;
  recent_engagement_requests_7d: number;
}

// ─── Catalog Filters ────────────────────────────────────────────────────────

interface CatalogFilters {
  maturity_levels: MaturityLevel[];
  review_statuses: ReviewStatus[];
  contributing_offices: string[];
  mission_area_tags: string[];
  technology_area_tags: string[];
  reuse_potentials: ReusePotential[];
}

// ─── Content Model Reference ────────────────────────────────────────────────

interface MaturityLevelDefinition {
  enum_value: MaturityLevel;
  label: string;
  color: string;    // e.g., 'gray', 'yellow', 'orange', 'green', 'dark-gray'
  definition: string;
}

interface ReviewStatusDefinition {
  enum_value: ReviewStatus;
  label: string;
  definition: string;
}
```

---

### 4.3 API Endpoint Catalog

#### Public Endpoints (No Authentication)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/catalog` | List published records with filter, sort, pagination |
| `GET` | `/api/v1/catalog/filters` | Return available facet values for current published records |
| `GET` | `/api/v1/search` | Full-text search with filters and pagination |
| `GET` | `/api/v1/records/{record_id}` | Retrieve a single published Innovation Record |
| `POST` | `/api/v1/opportunity-submissions` | Submit a mission problem or opportunity |
| `POST` | `/api/v1/contribution-submissions` | Submit existing innovation work for curation |
| `POST` | `/api/v1/engagement-requests` | Submit an engagement request |

#### CURATOR-Protected Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/records/{record_id}` | Retrieve any record (including non-published states) |
| `POST` | `/api/v1/records` | Create a new record (DRAFT state) |
| `PATCH` | `/api/v1/records/{record_id}` | Update fields on a record |
| `POST` | `/api/v1/records/{record_id}/submit-review` | Transition DRAFT → REVIEW |
| `POST` | `/api/v1/records/{record_id}/publish` | Transition REVIEW → PUBLISHED (governance gate applied) |
| `POST` | `/api/v1/records/{record_id}/supersede` | Mark record as SUPERSEDED |
| `POST` | `/api/v1/records/{record_id}/archive` | Mark record as ARCHIVED |
| `DELETE` | `/api/v1/records/{record_id}` | Hard-delete a DRAFT record (DRAFT only) |
| `GET` | `/api/v1/records/{record_id}/audit` | Retrieve audit history for a record |
| `GET` | `/api/v1/opportunity-submissions` | List all opportunity submissions |
| `PATCH` | `/api/v1/opportunity-submissions/{submission_id}` | Update submission disposition |
| `GET` | `/api/v1/contribution-submissions` | List all contribution submissions |
| `PATCH` | `/api/v1/contribution-submissions/{submission_id}` | Update contribution disposition |
| `POST` | `/api/v1/admin/contribution-submissions/{submission_id}/create-record` | Pre-populate Draft record from accepted contribution |
| `GET` | `/api/v1/engagement-requests` | List all engagement requests (with optional filters) |
| `PATCH` | `/api/v1/engagement-requests/{request_id}` | Update engagement request status |
| `GET` | `/api/v1/settings/routing-email` | Get current routing email setting |
| `PUT` | `/api/v1/settings/routing-email` | Update routing email setting |
| `GET` | `/api/v1/admin/records` | List all records across all publication states |
| `GET` | `/api/v1/admin/dashboard-summary` | Return dashboard summary counts |
| `GET` | `/api/v1/admin/opportunity-submissions` | List opportunity submissions (admin view) |
| `PATCH` | `/api/v1/admin/opportunity-submissions/{id}` | Update opportunity submission disposition |
| `GET` | `/api/v1/admin/contribution-submissions` | List contribution submissions (admin view) |
| `PATCH` | `/api/v1/admin/contribution-submissions/{id}` | Update contribution disposition |
| `GET` | `/api/v1/admin/engagement-requests` | List all engagement requests |
| `PATCH` | `/api/v1/admin/engagement-requests/{id}` | Update engagement request status |
| `GET` | `/api/v1/admin/settings` | Get all Hub settings |
| `PUT` | `/api/v1/admin/settings` | Update Hub settings (bulk) |
| `GET` | `/api/v1/admin/maturity-reference` | Get maturity level definitions |
| `GET` | `/api/v1/admin/review-status-reference` | Get review status definitions |

---

### 4.4 Key API Behaviors

#### Publication State Transition Endpoints

State transition endpoints (`/submit-review`, `/publish`, `/supersede`, `/archive`) are POST actions with no request body (except `/supersede` which requires `superseded_by_record_id`). They enforce the state machine and return HTTP 422 on invalid transitions.

```
POST /api/v1/records/{record_id}/publish
→ 200 { "publication_state": "PUBLISHED", "published_at": "2026-07-29T14:00:00Z" }
→ 422 { "error": { "code": "PUBLICATION_GATE_FAILED", "message": "...", "fields": ["problem_statement", "last_reviewed_date"] } }
→ 422 { "error": { "code": "INVALID_STATE_TRANSITION", "message": "Current state: DRAFT. Allowed transitions: submit-review." } }
```

#### Editing a PUBLISHED Record

PATCH on a PUBLISHED record requires a confirmation header. Without it, returns 409:

```
PATCH /api/v1/records/{record_id}
→ 409 { "error": { "code": "EDIT_REQUIRES_CONFIRMATION", "message": "..." } }

PATCH /api/v1/records/{record_id}
  X-Confirm-Edit: true
→ 200 (record now in REVIEW state)
```

#### Rate Limiting Headers

Rate-limited endpoints return standard headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1722265200
Retry-After: 3600
```

---

*End of 03-api.md*
---

## 5. Security Architecture

### 5.1 Authentication

The Hub uses **OAuth 2.0 / OpenID Connect (OIDC)** for curator authentication. The identity provider is Azure Active Directory / Microsoft Entra ID (assumed for the Federal Judiciary environment; to be confirmed during discovery).

**Authentication flow:**

1. Curator navigates to `/admin` (or any `/admin/*` route)
2. Auth middleware checks for a valid session token
3. If no valid session: middleware redirects to the Azure AD OIDC authorization endpoint
4. User authenticates with Azure AD (MFA enforced per AO policy)
5. Azure AD redirects to the Hub callback URL with an authorization code
6. Hub backend exchanges the code for `id_token` and `access_token` at the Azure AD token endpoint
7. Backend validates the `id_token` signature against the Azure AD JWKS endpoint
8. Backend extracts claims: `sub` (OID), `email`, `name`, and group/role claims
9. Backend upserts a `users` table row keyed on `idp_subject = sub`
10. Backend creates a server-side session (session ID stored in an HttpOnly, Secure, SameSite=Strict cookie)
11. Curator accesses the admin interface

**Session management:**
- Sessions stored server-side (Redis or database-backed session store)
- Session lifetime: follows Azure AD token expiry policy (typically 1 hour for access token; refresh token handles silently where possible)
- Expired sessions redirect to Azure AD login
- Session cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`
- No JWT stored in browser localStorage or sessionStorage

**OIDC configuration:**
```
Authorization endpoint: https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize
Token endpoint:         https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
JWKS endpoint:          https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys
Scopes required:        openid profile email (+ groups claim if using group-based role assignment)
```

---

### 5.2 Authorization

The system has two roles: **PUBLIC** (unauthenticated) and **CURATOR** (authenticated + role-verified).

| Role | Who | Access |
|------|-----|--------|
| `PUBLIC` | Any unauthenticated user | Read-only access to PUBLISHED records, catalog, search; submit opportunity/contribution/engagement forms |
| `CURATOR` | Authenticated I&R team members with CURATOR role | All PUBLIC access + read/write all records (all states), submission queues, engagement log, settings |
| `ADMIN` | Designated system administrator | All CURATOR access + user management (future scope) |

**Authorization enforcement:**

- All `/admin/*` routes require authenticated CURATOR session enforced by auth middleware
- The REST API enforces role at the handler layer — PUBLIC endpoints explicitly exclude non-published records, CURATOR endpoints require valid session token in `Authorization` header or session cookie
- Role assignment is stored in the `users.role` column; can be changed by an ADMIN without code deployment
- If `role ≠ CURATOR` after successful authentication: system returns HTTP 403 `ACCESS_DENIED`

**Resource-level authorization:** In MVP, all CURATORs have equal write access to all records. Record-level ownership is tracked in audit history for accountability, not enforced as an access gate.

---

### 5.3 Public Form Protections

All unauthenticated public forms (opportunity submission, contribution submission, engagement request) are protected against spam and abuse:

| Protection | Mechanism | Limit |
|------------|-----------|-------|
| CAPTCHA | Server-side token validation (reCAPTCHA v3 or hCaptcha) | Per-submission; all three form types |
| IP rate limiting | Server-side counter (Redis or in-memory) | Opportunity/Contribution: 5/hour per IP; Engagement: 10/hour per IP |
| Input sanitization | HTML strip + length validation before persistence | All text fields |
| HTTPS enforcement | Reverse proxy redirects HTTP → HTTPS | All routes |

**CAPTCHA fallback:** If the Judiciary network environment restricts outbound calls to CAPTCHA providers, IP rate limiting alone is the anti-abuse mechanism. The system must be configurable to disable CAPTCHA validation without a code deployment (via `hub_settings`).

---

### 5.4 Data Protection

#### Encryption

| Layer | Requirement | Implementation |
|-------|-------------|----------------|
| Data in transit | TLS 1.2 minimum; TLS 1.3 preferred | Enforced at reverse proxy / load balancer |
| Data at rest | Database volume encrypted | AO-managed hosting / cloud provider disk encryption |
| Database connection | TLS required for app → database connections | Connection string config |
| Secrets | Environment variables or secret management service | Never stored in code or config files |

#### Sensitive Data Handling

- **Email addresses** (submitter, requestor, curator): Stored in plaintext in the database. Access restricted to CURATOR role via API. Not exposed in public API responses.
- **Identity provider tokens**: Not stored in the database. Session tokens are opaque references stored server-side.
- **CAPTCHA API keys**: Stored in environment variables / secret management. Not in application code.
- **Routing email address**: Stored in `hub_settings` table. Readable/writable only by CURATOR role.
- **Personally Identifiable Information (PII)**: Submitter and requestor names, emails, and office information are stored in `opportunity_submissions`, `contribution_submissions`, and `engagement_requests`. These tables are accessible only to authenticated CURATORs. PII is not included in public API responses.

#### Audit Log Security

- The `audit_log` table is append-only at the application layer: the application database user has INSERT and SELECT privileges only — no UPDATE or DELETE
- Audit rows capture the `user_id` of the acting curator, not just a display name, so identity cannot be forged even if a display name changes
- Audit records are retained indefinitely in MVP (no expiry policy); this aligns with federal records retention requirements

---

### 5.5 Input Validation and Injection Prevention

| Attack Vector | Defense |
|---------------|---------|
| SQL injection | Parameterized queries / ORM prepared statements throughout; no raw string interpolation in SQL |
| XSS (stored) | All user-supplied text is HTML-stripped before persistence; frontend renders text as plain text, not innerHTML |
| XSS (reflected) | Query parameters are validated and sanitized; search query is parameterized before passing to FTS engine |
| SSRF | Artifact URLs stored as strings only — Hub never fetches or proxies them; no URL-to-server requests |
| Path traversal | No file system access; all data operations via ORM/repository layer |
| CSRF | SameSite=Strict session cookies mitigate most CSRF; CURATOR mutations may additionally require a CSRF token |
| Rate abuse | IP-based rate limiting on all public write endpoints |

---

### 5.6 Trust Integrity Enforcement (Security-Relevant)

The trust disclaimer system is a security-relevant feature because incorrect disclaimer rendering could mislead stakeholders into treating a POC record as production-ready. The following controls enforce trust integrity:

1. **Trust disclaimers are computed server-side** by `TrustDisclaimerService` and included in every public record API response. The frontend renders the disclaimer texts from the API response — it does not compute them independently.
2. **Trust disclaimer texts are hard-coded** in the application source code. Curators cannot modify them. A code change and release is required to update disclaimer language.
3. **Governance gate is enforced server-side** in `GovernanceGateService` before any REVIEW → PUBLISHED transition. The admin UI publication controls are a convenience layer; the gate is always enforced at the API layer regardless of how the request originates.
4. **Only PUBLISHED records are returned** to PUBLIC API consumers. The catalog and search endpoints include `WHERE publication_state = 'PUBLISHED'` at the query layer, not just as a frontend filter.

---

### 5.7 Federal Compliance Considerations

| Requirement | Approach |
|-------------|----------|
| WCAG 2.1 AA | Enforced in frontend component design; semantic HTML, ARIA labels, keyboard navigation, color contrast ratios |
| ATO / FedRAMP | Hosting environment and identity provider must be AO-approved (Azure Government or AO on-premise) |
| FISMA | Audit logging satisfies FISMA audit trail requirements; TLS and encryption at rest address confidentiality |
| HTTPS-only | Enforced at reverse proxy layer; HSTS header recommended |
| Identity management | Azure AD / Entra ID is the standard AO identity system; OIDC integration aligns with federal identity guidelines |
| No public PII in responses | Submitter/requestor PII is never included in PUBLIC API responses |

---

*End of 04-security.md*
---

## 6. Technology Stack

### 6.1 Stack Overview

The technology stack is chosen to prioritize federal hosting compatibility, team maintainability, and simplicity over novelty. Where the hosting environment is still TBD (pending ATO discovery), decisions are documented as recommendations with the rationale for each choice. Nothing in this stack requires a commercial cloud provider — all components can run on AO-managed on-premise or Azure Government hosting.

### 6.2 Recommended Stack Table

| Layer | Technology | Version | Purpose | Decision Status |
|-------|-----------|---------|---------|-----------------|
| **Runtime** | Node.js | 20 LTS | Application server runtime | Recommended |
| **Web Framework** | Express.js or Fastify | 4.x / 4.x | HTTP routing, middleware, REST API | Recommended |
| **Template Engine** | Nunjucks or EJS | Latest | Server-side rendering for public Hub and admin interface | Recommended |
| **Database** | PostgreSQL | 14+ | Primary data store, full-text search, UUID support | Strongly Recommended |
| **ORM / Query Builder** | Knex.js or Drizzle ORM | Latest | Database access, migrations, parameterized queries | Recommended |
| **Database Migrations** | Knex migrations or Flyway | — | Schema version control and deployment | Required |
| **Full-Text Search** | PostgreSQL native FTS (tsvector + GIN) | Built-in | Record search; eliminates external search service dependency | Recommended |
| **Authentication** | Passport.js (OIDC strategy) or MSAL Node | Latest | Azure AD / Entra ID OIDC integration | Recommended |
| **Session Store** | express-session + connect-pg-simple | — | Server-side session management with PostgreSQL backing | Recommended |
| **Email** | Nodemailer | Latest | SMTP-based transactional email for routing notifications | Recommended |
| **CAPTCHA** | Google reCAPTCHA v3 | v3 | Spam protection on public forms | Recommended |
| **Rate Limiting** | express-rate-limit | Latest | IP-based rate limiting on public write endpoints | Required |
| **Input Sanitization** | DOMPurify (server-side via jsdom) or sanitize-html | Latest | HTML stripping on all user text inputs | Required |
| **Validation** | Zod or Joi | Latest | Request body and query parameter validation | Required |
| **Logging** | Winston or Pino | Latest | Structured application logging | Required |
| **Environment Config** | dotenv (dev) + hosting secret manager (prod) | — | Secrets and environment configuration | Required |
| **Testing** | Jest + Supertest | Latest | Unit and integration tests | Required |
| **Reverse Proxy** | nginx | Latest | HTTPS termination, static asset serving, header security | Required |

### 6.3 Alternative Stacks (If Hosting Dictates)

If the AO-managed hosting environment favors a .NET or Python stack (e.g., for existing AO tooling support), the following alternatives map to the same architecture:

| Component | .NET Alternative | Python Alternative |
|-----------|-----------------|-------------------|
| Web Framework | ASP.NET Core 8 | FastAPI or Django |
| ORM | Entity Framework Core | SQLAlchemy / Django ORM |
| Auth | Microsoft.Identity.Web | authlib (OIDC) |
| Template Engine | Razor Pages | Jinja2 |
| Validation | FluentValidation | Pydantic |
| Email | MailKit | smtplib / anymail |

The PostgreSQL database recommendation applies regardless of the application language stack.

### 6.4 Infrastructure Dependencies

| Dependency | Role | Required By | Fallback |
|------------|------|-------------|---------|
| Azure AD / Entra ID tenant | OIDC identity provider for curator auth | Admin interface | None — alternative IdP must support OIDC |
| SMTP relay | Outbound email for routing notifications and confirmations | F05, F06, F07 | If unavailable: submission queue in admin interface serves as manual notification |
| CAPTCHA provider (reCAPTCHA v3 or hCaptcha) | Anti-spam for public forms | F05, F06, F07 | IP rate limiting only if CAPTCHA outbound calls are blocked |
| Reverse proxy / WAF | TLS termination, security headers, request forwarding | All | Could be nginx on the same host or AO WAF |

### 6.5 Not In Stack (Explicitly Excluded from MVP)

| Technology | Reason Excluded |
|-----------|-----------------|
| Elasticsearch / OpenSearch | Not needed at MVP record volumes; PostgreSQL FTS is sufficient |
| Redis | Not required for MVP session store (PostgreSQL session store is adequate); add if performance demands it |
| Message queue (RabbitMQ, SQS) | Email is fire-and-forget; no async job queue needed at MVP scale |
| Containerization (Docker/Kubernetes) | Hosting environment TBD; container support uncertain in some federal environments; application is structured to be container-ready without requiring it |
| CDN | MVP does not serve user-uploaded content; all assets are static files served by the application or nginx |
| GraphQL | REST API is sufficient; added complexity not justified |
| SPA framework (React, Vue) | Server-side rendering is sufficient; avoids JavaScript build complexity and SPA accessibility issues |
| Mobile app (iOS/Android) | Explicitly out of scope per PRD §11 |

---

*End of 05-tech-stack.md*
---

## 7. Integration Points

### 7.1 Integration Summary

| ID | Integration | Dependency | MVP Required | Decision Status |
|----|-------------|------------|--------------|-----------------|
| INT-01 | Identity Provider (Azure AD / Entra ID) | CURATOR authentication | P0 — MVP launch blocker | TBD — confirm during discovery |
| INT-02 | Email Delivery (SMTP or transactional API) | Routing notifications, submission confirmations | P1 — required for MVP engagement routing | TBD — hosting-dependent |
| INT-03 | Full-Text Search Engine | Search and Discovery (F01) | P0 — critical MVP requirement | Recommended: PostgreSQL native FTS |
| INT-04 | CAPTCHA Provider (reCAPTCHA v3 / hCaptcha) | Spam protection on public forms | P1 — required for unauthenticated forms | TBD — pending network environment assessment |
| INT-05 | Artifact Source Systems (SharePoint, GitHub, etc.) | Innovation Record artifact links | Link-only; no active integration | N/A — no integration code required |
| INT-06 | Hosting Environment | All features | P0 — MVP cannot deploy without this | TBD — ATO discovery required |

---

### 7.2 INT-01: Identity Provider (Azure AD / Microsoft Entra ID)

**Dependency:** Curation and Administration interface (F08); role-based access control throughout  
**Protocol:** OAuth 2.0 / OpenID Connect (OIDC)

**Integration contract:**
- Hub registers as an OIDC application in the AO Azure AD tenant
- Required OIDC scopes: `openid profile email` (plus `groups` or custom `roles` claim for CURATOR role assignment)
- The Hub extracts the following claims from the OIDC `id_token`:
  - `sub` (stored as `idp_subject`) — stable unique identifier; used as the audit identity key
  - `email` — stored in `users.email`
  - `name` — stored in `users.display_name`
  - `roles` or group membership — used to determine CURATOR role
- The Hub upserts a `users` table row on each authenticated login (keyed on `idp_subject`)
- Session expiry follows the Azure AD access token lifetime (configurable in Entra ID; typically 1 hour)
- Role assignment (CURATOR) must be configurable without code deployment — via Entra ID app role assignment or by an ADMIN user editing the `users.role` column

**Implementation guidance:**
```
Library: @azure/msal-node (MSAL) or passport-azure-ad (Passport OIDC strategy)
Callback URL: https://{hub-domain}/auth/callback
Logout URL:   https://{hub-domain}/auth/logout
```

**Decision gate:** Confirm Azure AD tenant ID, client ID, and client secret with AO IT during discovery. Confirm whether MFA is enforced at the tenant level (expected yes).

---

### 7.3 INT-02: Email Delivery

**Dependency:** Opportunity Submission (F05), Contribution Submission (F06), Engagement Routing (F07)  
**Purpose:** Routing notifications to I&R team, optional submission confirmation emails to submitters/requestors

**Integration contract:**
- The Hub sends transactional emails programmatically to:
  - `engagement_routing_email` setting value (read from `hub_settings` at send time — not cached)
  - Submitter or requestor email address (optional confirmation)
- Email is triggered by: new opportunity submission, new contribution submission, new engagement request
- Email content: plain-text summary of the triggering event + direct link to the admin interface entry
- **Failure contract:** Email delivery failure must NOT cause the submission or request to fail or be lost. The record is persisted first; email is attempted after. Failure is logged for curator resolution. No retry queue in MVP.
- Routing email address is stored in `hub_settings` and is changeable by a CURATOR without code deployment

**Candidate implementations (in preference order):**
1. **AO-managed SMTP relay** — if available in the hosting environment; simplest; uses Nodemailer with SMTP transport
2. **Azure Communication Services (Email)** — if AO is on Azure Government; managed transactional email
3. **SendGrid** — if not restricted; widely supported Node.js SDK

**Configuration:**
```
SMTP_HOST=smtp.ao.uscourts.gov   (or equivalent)
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=<service account>
SMTP_PASS=<secret>
EMAIL_FROM=noreply@ao.uscourts.gov
```

---

### 7.4 INT-03: Full-Text Search Engine

**Dependency:** Search and Discovery (F01)  
**Recommendation:** PostgreSQL native full-text search (tsvector + GIN index)

**Implementation:**
- `search_vector TSVECTOR` column on `innovation_records` (see §3.2 DDL)
- Maintained by INSERT/UPDATE trigger on `innovation_records` and after-triggers on `record_key_findings` and `record_tags`
- Search query: `WHERE search_vector @@ plainto_tsquery('english', $1) AND publication_state = 'PUBLISHED'`
- Relevance ranking: `ts_rank(search_vector, plainto_tsquery('english', $1)) AS relevance_score`
- Highlighted snippets: `ts_headline('english', problem_statement, plainto_tsquery('english', $1)) AS highlight`
- Field weighting: A (3×) for problem_statement + key_findings; B (2×) for title, what_was_explored, outcome_summary; C (1×) for others

**Why native FTS over Elasticsearch:**
- MVP record volume (3–50 records) is far below the threshold where dedicated search services provide meaningful benefit
- Eliminates an external service dependency that may not be available in the federal hosting environment
- Single deployable artifact; no additional infrastructure to manage or secure
- PostgreSQL FTS supports phrase queries, stemming, weighting, and highlighting — all required FRD capabilities

**Future migration path:** If record volume grows significantly or search quality requires tuning beyond native FTS capabilities, the search index can be extracted to a dedicated service (Elasticsearch, Meilisearch) by replacing the search query in `SearchService` without changing the API contract.

---

### 7.5 INT-04: CAPTCHA Provider

**Dependency:** Public forms: Opportunity Submission (F05), Contribution Submission (F06), Engagement Request (F07)  
**Purpose:** Prevent automated spam submissions from unauthenticated users

**Integration contract:**
- Client: renders CAPTCHA widget and attaches `captcha_token` to the form submission
- Server: validates `captcha_token` against the CAPTCHA provider's verification endpoint before persisting the record
- If token is invalid or missing: return HTTP 422 `CAPTCHA_INVALID`; do not persist the submission
- CAPTCHA API key must be configurable without code deployment (stored in environment variables)

**Candidate providers:**
1. **Google reCAPTCHA v3** (preferred) — score-based, invisible; server-side verification: `POST https://www.google.com/recaptcha/api/siteverify`
2. **hCaptcha** — alternative if Google services are restricted; similar API contract
3. **Cloudflare Turnstile** — lightweight option if Cloudflare WAF is in the stack

**Fallback:** If the Judiciary network environment blocks outbound calls to CAPTCHA verification endpoints, CAPTCHA validation can be disabled via a `hub_settings` flag (`captcha_enabled = false`), and IP rate limiting alone serves as the anti-abuse mechanism. This fallback requires a curator-accessible setting, not a code change.

---

### 7.6 INT-05: Artifact Source Systems (Link-Only)

**Dependency:** Innovation Record (F02), Lessons-Learned Integration (F04)  
**Integration type:** No active integration — URL storage only

The Hub stores external URLs in `record_artifact_links.url`. No API calls, authentication bridges, content synchronization, or link-health polling is performed against source systems.

Supported source system URL patterns (as link targets only):

| System | URL Pattern |
|--------|-------------|
| SharePoint (AO) | `https://*.sharepoint.com/*`, `https://ao.sharepoint.com/*` |
| SharePoint Online | `https://*.sharepoint.com/sites/*` |
| GitHub Enterprise | `https://github.uscourts.gov/*` |
| GitHub.com | `https://github.com/*` |
| Microsoft Stream | `https://web.microsoftstream.com/*`, `https://stream.office.com/*` |
| Any HTTPS URL | Any valid `https://` URL |

**Important constraints:**
- The Hub must NEVER crawl, index, cache, or proxy content from linked URLs
- Access control for linked artifacts is governed by the source system; curators should note access requirements in `reuse_guidance` or `technical_perspective_text`
- If a linked URL becomes unreachable, the Innovation Record remains valid and published; the broken link is a content issue resolved by the curator at next review

**Optional future enhancement:** A link-health advisory feature that checks artifact URL availability during curator record review (HTTP HEAD request server-side) and surfaces a warning if a URL returns non-200. This is not in MVP scope but the `record_artifact_links` schema accommodates a future `last_checked_at` and `is_reachable` column.

---

### 7.7 INT-06: Hosting Environment

**Status:** TBD — decision required during Pivota discovery  
**Priority:** P0 — MVP cannot deploy without a hosting decision

**Application requirements for hosting environment:**

| Requirement | Notes |
|-------------|-------|
| Web application server runtime | Node.js 20 LTS (or .NET / Python per §6.3) |
| Outbound HTTPS | Required for Azure AD OIDC endpoints, email relay, CAPTCHA validation |
| PostgreSQL database | v14+; managed or self-hosted; encrypted at rest and in transit |
| HTTPS enforcement | TLS 1.2 minimum at reverse proxy layer |
| Secret management | Environment variable injection or secret store (Azure Key Vault, Vault, etc.) |
| Federal ATO compliance | Must comply with AO ATO requirements |

**Known candidate environments:**

| Candidate | Notes |
|-----------|-------|
| Azure Government Cloud (MAG) | Preferred if AO has existing Azure Gov presence; FedRAMP High authorized; Azure AD integration native |
| AO On-Premise Hosting | Most common for AO applications; requires AO IT provisioning; SMTP relay likely available |
| Court-Hosted Server | Not preferred — maintainability concerns; creates a dependency on a specific court |

**Decision required items:**
1. Confirm hosting environment with AO IT
2. Confirm ATO process and timeline
3. Confirm Azure AD tenant and OIDC registration process
4. Confirm SMTP relay availability or alternative email service
5. Confirm outbound HTTPS policy (CAPTCHA provider access)

---

*End of 06-integrations.md*
