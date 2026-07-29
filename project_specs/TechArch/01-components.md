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
