---

## F02: Innovation Record (Part B — Inputs, Outputs, Validation, Errors, API/Schema)

**PRD Reference:** F2 — Priority P0 (Critical MVP)  
**Continued from:** `F02a-innovation-record.md`

---

### Inputs (Full Field Specification)

All fields below are part of the canonical Innovation Record. Fields marked `(pub-required)` must be present and non-empty before a record can transition from `REVIEW` to `PUBLISHED`. Fields marked `(required)` must be present to save; fields marked `(optional)` may be blank.

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `record_id` | UUID | system | System-generated unique identifier |
| `title` | string (5–200 chars) | pub-required | Human-readable title of the innovation effort |
| `problem_statement` | text (50–5000 chars) | pub-required | Mission problem or opportunity addressed |
| `what_was_explored` | text (50–5000 chars) | pub-required | Description of approach, technology, scope |
| `outcome_summary` | text (50–3000 chars) | pub-required | What was found; may be positive, negative, or inconclusive |
| `key_findings` | array of strings (1–20 items, each 10–1000 chars) | pub-required | Structured list of primary learnings; min 1 item |
| `maturity_level` | enum | pub-required | `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED`, `ARCHIVED` |
| `review_status` | enum | pub-required | `SUBMITTED`, `CURATED`, `TECHNICALLY_REVIEWED`, `SECURITY_REVIEWED`, `POLICY_REVIEWED`, `VALIDATED_FOR_REUSE`, `SUPERSEDED_RETIRED` |
| `reuse_guidance` | text (0–3000 chars) | optional | What stakeholder needs to consider for adoption |
| `reuse_potential` | enum | pub-required | `HIGH`, `MEDIUM`, `LOW` |
| `owner_name` | string (2–200 chars) | pub-required | Named owner/steward full name |
| `owner_office` | string (2–200 chars) | pub-required | Owner's organizational unit |
| `contributing_office` | string (2–200 chars) | pub-required | Office that produced the innovation work |
| `source_type` | enum | pub-required | `I_AND_R` or `COMMUNITY` |
| `contributor_attribution` | text (0–500 chars) | optional | Attribution text for contributing team/individuals |
| `mission_area_tags` | array of strings (1–10 items) | pub-required | Mission area classification tags; min 1 |
| `technology_area_tags` | array of strings (0–10 items) | optional | Technology area classification tags |
| `artifact_links` | array of objects (min 1) | pub-required | Each item: `{ label: string, url: string (valid URL), type: enum }` |
| `artifact_link.type` | enum | pub-required per item | `DOCUMENT`, `CODE_REPOSITORY`, `VIDEO`, `DIAGRAM`, `OTHER` |
| `engagement_options` | array of enums (1–4 items) | pub-required | Options from: `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING`. Note: `SUBMIT_RELATED_PROBLEM` is not an engagement option — stakeholders submit related problems via the F05 Opportunity Submission form. |
| `trust_disclaimers` | system-applied | system | Automatically derived from `maturity_level` and `source_type`; curator cannot suppress |
| `last_reviewed_date` | date (YYYY-MM-DD) | pub-required | Date curator last verified record accuracy |
| `executive_perspective_text` | text (50–3000 chars) | pub-required | Curator-authored executive framing text |
| `executive_recommendation` | text (50–1000 chars) | pub-required | What a senior leader should consider |
| `technical_perspective_text` | text (50–5000 chars) | optional | Curator-authored technical detail text |
| `security_findings` | text (0–2000 chars) | optional | Security review findings and constraints |
| `performance_findings` | text (0–2000 chars) | optional | Performance and testing results |
| `publication_state` | enum | system | `DRAFT`, `REVIEW`, `PUBLISHED`, `SUPERSEDED`, `ARCHIVED` |
| `superseded_by_record_id` | UUID | optional | Links to the newer record that supersedes this one |
| `created_at` | timestamp | system | Record creation timestamp |
| `updated_at` | timestamp | system | Last modification timestamp |
| `published_at` | timestamp | system | Timestamp of first publication |
| `created_by_user_id` | UUID | system | Curator who created the record |
| `updated_by_user_id` | UUID | system | Curator who last updated the record |

---

### Outputs

- **Public Record Page:** Fully rendered Innovation Record with all published fields, trust disclaimers, perspective toggle, artifact links, and Next-Action panel.
- **Admin Record View:** Same content plus publication state indicator, audit history log, and edit/publish/archive controls.
- **Record JSON (API):** Full structured representation of the record (see `Y1-api.md` §Records).
- **Audit Entry (on state change or field edit):** `{ record_id, changed_by, changed_at, field_changed, old_value, new_value, state_transition }` logged to `audit_log` table.

---

### Validation

**Field-Level Validation (enforced on save and on publish):**

- `title`: 5–200 characters; must not be blank.
- `problem_statement`: 50–5,000 characters; must not be blank; required for publication.
- `what_was_explored`: 50–5,000 characters; required for publication.
- `outcome_summary`: 50–3,000 characters; required for publication.
- `key_findings`: Array; minimum 1 item; each item 10–1,000 characters; maximum 20 items.
- `maturity_level`: Must be a valid enum member; required for publication.
- `review_status`: Must be a valid enum member; required for publication.
- `reuse_potential`: Must be a valid enum member; required for publication.
- `owner_name`, `owner_office`, `contributing_office`: 2–200 characters each; required for publication.
- `source_type`: Must be `I_AND_R` or `COMMUNITY`; required for publication.
- `mission_area_tags`: Minimum 1 tag; each tag 1–100 characters; maximum 10 tags.
- `artifact_links`: Minimum 1 item required for publication. Each URL must be a valid absolute HTTP/HTTPS URL. Each label 2–200 characters. `type` must be valid enum.
- `engagement_options`: Minimum 1 option; maximum 4; all values must be valid enum members.
- `last_reviewed_date`: Must be a valid calendar date not in the future; required for publication.
- `executive_perspective_text`: 50–3,000 characters; required for publication.
- `executive_recommendation`: 50–1,000 characters; required for publication.
- `superseded_by_record_id`: If set, must reference an existing record ID.

**Publication Gate (enforced before `REVIEW → PUBLISHED` transition):**
System checks that ALL `pub-required` fields are non-empty. If any are missing, system returns a list of blocking fields and refuses the transition. No exceptions.

**Trust Disclaimer Logic:**
- If `maturity_level = EXPERIMENT_POC` or `PROTOTYPE_PILOT`: render "POC ≠ production-ready" disclaimer.
- If `publication_state = PUBLISHED` (any record): render "Published ≠ approved for adoption" disclaimer.
- If `source_type = COMMUNITY`: render "Community-submitted ≠ centrally endorsed" disclaimer.
- If `review_status = VALIDATED_FOR_REUSE`: render "Validated for Reuse ≠ local review waived" disclaimer.
- All applicable disclaimers are rendered simultaneously; they are not mutually exclusive.

---

### Error States

| Scenario | HTTP Status | Error Code | User/Curator-Facing Message |
|----------|-------------|------------|------------------------------|
| PUBLIC user requests non-published record | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |
| Curator submits for publish with missing required fields | 422 | `PUBLICATION_GATE_FAILED` | "Publication blocked. Missing required fields: [list of field names]." |
| Curator submits invalid artifact URL | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| `key_findings` array is empty | 422 | `KEY_FINDINGS_REQUIRED` | "At least one key finding is required." |
| `last_reviewed_date` is in the future | 422 | `INVALID_REVIEW_DATE` | "Last-reviewed date cannot be in the future." |
| Record store unavailable on fetch | 503 | `RECORD_UNAVAILABLE` | "This record is temporarily unavailable. Please try again shortly." |
| Curator attempts to edit a PUBLISHED record without confirmation | 409 | `EDIT_REQUIRES_CONFIRMATION` | "Editing this record will move it to Review state and remove it from public view. Confirm to proceed." |
| `superseded_by_record_id` references non-existent record | 422 | `INVALID_SUPERSEDES_REF` | "The superseding record ID does not exist." |

---

### API Surface (F02)

See `Y1-api.md` §Records for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/records/{record_id}` | None (Published); CURATOR for any state | Retrieve a single innovation record |
| `POST` | `/api/v1/records` | CURATOR | Create a new innovation record (Draft state) |
| `PATCH` | `/api/v1/records/{record_id}` | CURATOR | Update fields on a record |
| `POST` | `/api/v1/records/{record_id}/submit-review` | CURATOR | Transition record from DRAFT → REVIEW |
| `POST` | `/api/v1/records/{record_id}/publish` | CURATOR | Transition record from REVIEW → PUBLISHED |
| `POST` | `/api/v1/records/{record_id}/supersede` | CURATOR | Mark record as SUPERSEDED |
| `POST` | `/api/v1/records/{record_id}/archive` | CURATOR | Mark record as ARCHIVED |
| `GET` | `/api/v1/records/{record_id}/audit` | CURATOR | Retrieve audit history for a record |

---

### Schema Surface (F02)

Primary tables: `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`, `audit_log`. Full DDL in `Y0-schema.md` §innovation_records and related tables.

---

*End of F02b-innovation-record.md — continues in F03-executive-technical-perspectives.md*
