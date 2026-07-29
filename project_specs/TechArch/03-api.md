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
