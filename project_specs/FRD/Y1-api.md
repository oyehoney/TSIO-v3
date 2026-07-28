---

## Y1: REST API Catalog

This document defines all REST API endpoints for the TSIO Innovation Hub MVP. All endpoints are prefixed with `/api/v1`. JSON is the only supported content type (`Content-Type: application/json`).

**Authentication:**
- PUBLIC endpoints: No authentication required.
- CURATOR endpoints: Require a valid session token (Bearer token in `Authorization` header or session cookie). Method TBD pending identity provider selection.

**Pagination:** All list endpoints return a standard pagination envelope:
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

**Error envelope:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": ["field_name"]   // present only for validation errors
  }
}
```

---

### §Catalog — F00

#### `GET /api/v1/catalog`

Returns paginated list of published Innovation Records for the public catalog view.

**Auth:** None (PUBLIC)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `maturity_level` | string (repeatable) | — | Filter by maturity level enum(s) |
| `review_status` | string (repeatable) | — | Filter by review status enum(s) |
| `contributing_office` | string | — | Filter by contributing office name |
| `mission_area` | string (repeatable) | — | Filter by mission area tag |
| `technology_area` | string (repeatable) | — | Filter by technology area tag |
| `reuse_potential` | string | — | Filter by reuse potential (HIGH, MEDIUM, LOW) |
| `sort` | string | `recent` | Sort order: `recent`, `maturity`, `relevance` |
| `page` | integer | 1 | Page number |
| `page_size` | integer | 12 | Results per page (max 50) |

**Response 200:**
```json
{
  "data": [
    {
      "record_id": "uuid",
      "title": "string",
      "short_summary": "string (≤280 chars)",
      "maturity_level": "EXPERIMENT_POC",
      "maturity_label": "Experiment / POC",
      "review_status": "TECHNICALLY_REVIEWED",
      "review_status_label": "Technically Reviewed",
      "reuse_potential": "MEDIUM",
      "source_type": "I_AND_R",
      "mission_area_tags": ["Cybersecurity"],
      "technology_area_tags": ["AI/ML"],
      "engagement_options": ["REQUEST_DEMO", "REQUEST_TECHNICAL_GUIDANCE"],
      "is_validated_for_reuse": false,
      "is_community_contributed": false,
      "published_at": "2026-07-28T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "page_size": 12, "total_count": 3, "total_pages": 1 }
}
```

**Response 503:** `CATALOG_UNAVAILABLE`

---

#### `GET /api/v1/catalog/filters`

Returns available filter option values (facets) for the current published record set.

**Auth:** None (PUBLIC)

**Response 200:**
```json
{
  "maturity_levels": ["EXPERIMENT_POC", "PROTOTYPE_PILOT"],
  "review_statuses": ["CURATED", "TECHNICALLY_REVIEWED"],
  "contributing_offices": ["TSIO I&R"],
  "mission_area_tags": ["Cybersecurity", "Court Operations"],
  "technology_area_tags": ["AI/ML", "Cloud Infrastructure"],
  "reuse_potentials": ["HIGH", "MEDIUM", "LOW"]
}
```

---

### §Search — F01

#### `GET /api/v1/search`

Full-text search over published Innovation Records.

**Auth:** None (PUBLIC)

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query (1–500 chars) |
| `maturity_level` | string (repeatable) | no | Filter |
| `review_status` | string (repeatable) | no | Filter |
| `contributing_office` | string | no | Filter |
| `reuse_potential` | string | no | Filter |
| `page` | integer | no | Default 1 |
| `page_size` | integer | no | Default 12, max 50 |

**Response 200:** Same envelope as `GET /api/v1/catalog` with an additional `relevance_score` field on each result item.

**Response 400:** `QUERY_TOO_LONG` (query > 500 chars)  
**Response 503:** `SEARCH_UNAVAILABLE`

---

### §Records — F02

#### `GET /api/v1/records/{record_id}`

Retrieve a single Innovation Record.

**Auth:** None for PUBLISHED records; CURATOR session required for DRAFT/REVIEW/SUPERSEDED/ARCHIVED.

**Path Parameters:** `record_id` (UUID)

**Response 200:**
```json
{
  "record_id": "uuid",
  "title": "string",
  "problem_statement": "string",
  "what_was_explored": "string",
  "outcome_summary": "string",
  "key_findings": ["string", "string"],
  "maturity_level": "EXPERIMENT_POC",
  "maturity_label": "Experiment / POC",
  "review_status": "TECHNICALLY_REVIEWED",
  "review_status_label": "Technically Reviewed",
  "reuse_guidance": "string or null",
  "reuse_potential": "MEDIUM",
  "owner_name": "string",
  "owner_office": "string",
  "contributing_office": "string",
  "source_type": "I_AND_R",
  "contributor_attribution": "string or null",
  "mission_area_tags": ["string"],
  "technology_area_tags": ["string"],
  "artifact_links": [
    { "label": "string", "url": "https://...", "artifact_type": "DOCUMENT" }
  ],
  "engagement_options": ["REQUEST_DEMO"],
  "executive_perspective_text": "string",
  "executive_recommendation": "string",
  "technical_perspective_text": "string or null",
  "security_findings": "string or null",
  "performance_findings": "string or null",
  "default_perspective": "EXECUTIVE",
  "publication_state": "PUBLISHED",
  "last_reviewed_date": "2026-07-28",
  "published_at": "2026-07-28T00:00:00Z",
  "superseded_by_record_id": "uuid or null",
  "trust_disclaimers": ["string", "string"],
  "short_summary": "string",
  "created_at": "2026-07-01T00:00:00Z",
  "updated_at": "2026-07-28T00:00:00Z"
}
```

**Response 404:** `RECORD_NOT_FOUND`  
**Response 503:** `RECORD_UNAVAILABLE`

---

#### `POST /api/v1/records`

Create a new Innovation Record in DRAFT state.

**Auth:** CURATOR

**Request Body:** All Innovation Record fields (see F02b §Inputs). `record_id`, `publication_state`, `created_at`, `updated_at`, `published_at` are system-set.

**Response 201:** Full record JSON (as above, with `publication_state: "DRAFT"`)  
**Response 422:** `VALIDATION_ERROR` with `fields` list  
**Response 403:** `ACCESS_DENIED`

---

#### `PATCH /api/v1/records/{record_id}`

Update one or more fields on an Innovation Record. Partial update (only provided fields are changed).

**Auth:** CURATOR

**Request Body:** Any subset of Innovation Record fields (excluding system-managed fields).

**Response 200:** Updated full record JSON  
**Response 422:** `VALIDATION_ERROR`  
**Response 409:** `EDIT_REQUIRES_CONFIRMATION` (if record is PUBLISHED)  
**Response 404:** `RECORD_NOT_FOUND`

---

#### `POST /api/v1/records/{record_id}/submit-review`

Transition record from DRAFT → REVIEW.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "REVIEW" }`  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/publish`

Transition record from REVIEW → PUBLISHED. Applies governance gate.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "PUBLISHED", "published_at": "..." }`  
**Response 422:** `PUBLICATION_GATE_FAILED` with blocking `fields` list  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/supersede`

Mark a Published record as SUPERSEDED.

**Auth:** CURATOR  
**Request Body:** `{ "superseded_by_record_id": "uuid" }`  
**Response 200:** `{ "publication_state": "SUPERSEDED" }`  
**Response 422:** `INVALID_SUPERSEDES_REF` or `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/archive`

Mark a record as ARCHIVED.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "ARCHIVED" }`  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `GET /api/v1/records/{record_id}/audit`

Return audit history for a record.

**Auth:** CURATOR

**Response 200:**
```json
{
  "data": [
    {
      "audit_id": "uuid",
      "changed_by": "Curator Name",
      "changed_at": "2026-07-28T10:00:00Z",
      "event_type": "STATE_TRANSITION",
      "state_transition": "DRAFT->REVIEW",
      "field_changed": null,
      "old_value": null,
      "new_value": null
    }
  ]
}
```

---

### §Submissions (Opportunities) — F05

#### `POST /api/v1/opportunity-submissions`

Submit a mission problem or opportunity.

**Auth:** None (PUBLIC)

**Request Body:** All opportunity submission form fields (see F05 §Inputs) plus `captcha_token`.

**Response 201:** `{ "submission_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `SUBMISSION_UNAVAILABLE`

---

#### `GET /api/v1/opportunity-submissions`

List all opportunity submissions.

**Auth:** CURATOR

**Query Parameters:** `status` (filter), `page`, `page_size`

**Response 200:** Paginated list of submission summaries.

---

#### `PATCH /api/v1/opportunity-submissions/{submission_id}`

Update disposition of an opportunity submission.

**Auth:** CURATOR  
**Request Body:** `{ "disposition": "...", "linked_record_id": "uuid or null", "internal_note": "..." }`  
**Response 200:** Updated submission record  
**Response 422:** `VALIDATION_ERROR`

---

### §Submissions (Contributions) — F06

#### `POST /api/v1/contribution-submissions`

Submit existing innovation work for curation.

**Auth:** None (PUBLIC)

**Request Body:** All contribution form fields (see F06 §Inputs) plus `captcha_token`.

**Response 201:** `{ "submission_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `SUBMISSION_UNAVAILABLE`

---

#### `GET /api/v1/contribution-submissions`

List all contribution submissions.

**Auth:** CURATOR  
**Query Parameters:** `status` (filter), `page`, `page_size`  
**Response 200:** Paginated list.

---

#### `PATCH /api/v1/contribution-submissions/{submission_id}`

Update disposition of a contribution submission.

**Auth:** CURATOR  
**Request Body:** `{ "disposition": "...", "linked_record_id": "uuid or null", "internal_note": "..." }`  
**Response 200:** Updated submission record

---

#### `POST /api/v1/admin/contribution-submissions/{submission_id}/create-record`

Pre-populate a new Draft Innovation Record from an accepted contribution submission.

**Auth:** CURATOR  
**Request Body:** None (data sourced from submission)  
**Response 201:** New Innovation Record JSON (DRAFT state)  
**Response 422:** `SUBMISSION_NOT_ACCEPTED` (if disposition ≠ ACCEPTED_FOR_CURATION)

---

### §Engagement — F07

#### `POST /api/v1/engagement-requests`

Submit an engagement request.

**Auth:** None (PUBLIC)

**Request Body:** All engagement request form fields (see F07 §Inputs) plus `captcha_token`.

**Response 201:** `{ "request_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`, `INVALID_ENGAGEMENT_TYPE`  
**Response 404:** `RECORD_NOT_FOUND`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `ENGAGEMENT_UNAVAILABLE`

---

#### `GET /api/v1/engagement-requests`

List all engagement requests.

**Auth:** CURATOR  
**Query Parameters:** `record_id` (filter), `request_type` (filter), `status` (filter), `page`, `page_size`  
**Response 200:** Paginated list of engagement request summaries.

---

#### `PATCH /api/v1/engagement-requests/{request_id}`

Update status of an engagement request.

**Auth:** CURATOR  
**Request Body:** `{ "status": "...", "curator_note": "..." }`  
**Response 200:** Updated engagement request record

---

### §Settings — F07/F08

#### `GET /api/v1/settings/routing-email`

**Auth:** CURATOR  
**Response 200:** `{ "setting_key": "engagement_routing_email", "setting_value": "AOml_TSO_IRB_Team@ao.uscourts.gov" }`

---

#### `PUT /api/v1/settings/routing-email`

**Auth:** CURATOR  
**Request Body:** `{ "setting_value": "new@email.gov" }`  
**Response 200:** `{ "setting_key": "engagement_routing_email", "setting_value": "new@email.gov" }`  
**Response 422:** `INVALID_EMAIL`

---

### §Admin — F08

#### `GET /api/v1/admin/dashboard-summary`

**Auth:** CURATOR  
**Response 200:**
```json
{
  "published_records": 3,
  "draft_review_records": 2,
  "pending_opportunity_submissions": 1,
  "pending_contribution_submissions": 0,
  "recent_engagement_requests_7d": 5
}
```

---

#### `GET /api/v1/admin/records`

List all Innovation Records across all publication states.

**Auth:** CURATOR  
**Query Parameters:** `publication_state`, `maturity_level`, `review_status`, `q` (title search), `page`, `page_size`  
**Response 200:** Paginated list including all publication states.

---

#### `GET /api/v1/admin/settings`

**Auth:** CURATOR  
**Response 200:** `{ "settings": [{ "setting_key": "...", "setting_value": "...", "description": "..." }] }`

---

#### `PUT /api/v1/admin/settings`

**Auth:** CURATOR  
**Request Body:** `{ "settings": [{ "setting_key": "...", "setting_value": "..." }] }`  
**Response 200:** Updated settings list  
**Response 422:** `VALIDATION_ERROR`

---

#### `GET /api/v1/admin/maturity-reference`

**Auth:** CURATOR  
**Response 200:** Array of `{ "enum_value": "...", "label": "...", "definition": "..." }` for all 5 maturity levels.

---

#### `GET /api/v1/admin/review-status-reference`

**Auth:** CURATOR  
**Response 200:** Array of `{ "enum_value": "...", "label": "...", "definition": "..." }` for all 7 review statuses.

---

*End of Y1-api.md — continues in Y2-errors.md*
