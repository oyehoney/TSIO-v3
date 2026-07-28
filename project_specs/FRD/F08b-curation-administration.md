---

## F08: Curation and Administration (Part B — Inputs, Outputs, Validation, Errors, API/Schema)

**PRD Reference:** F8 — Priority P0 (Critical MVP)  
**Continued from:** `F08a-curation-administration.md`

---

### Inputs

**Record Management Inputs:** All Innovation Record fields as defined in F02b §Inputs. The admin interface provides a form for all fields; the same field-level validation rules apply.

**Submission Disposition Inputs:**

| Field | Type | Req? | Context |
|-------|------|------|---------|
| `disposition` | enum | required | For opportunity submissions: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`. For contribution submissions: `UNDER_REVIEW`, `ACCEPTED_FOR_CURATION`, `DECLINED`, `PUBLISHED` |
| `linked_record_id` | UUID | conditional | Required when `disposition = LINKED_TO_RECORD` or `PUBLISHED` |
| `internal_note` | text (0–1,000 chars) | optional | Curator-only note on disposition decision (not surfaced externally) |

**Engagement Request Status Update Inputs:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `status` | enum | required | `SUBMITTED`, `IN_PROGRESS`, `COMPLETED`, `NO_ACTION` |
| `curator_note` | text (0–500 chars) | optional | Internal curator note on the request |

**Hub Settings Inputs:**

| Setting Key | Type | Req? | Description |
|-------------|------|------|-------------|
| `engagement_routing_email` | string, email format | required (not blank) | Email address for all engagement and submission routing notifications |
| `contact_display_email` | string, email format | optional | Email displayed on the Hub for general inquiries (public-facing) |
| `catalog_default_page_size` | integer (6–50) | optional | Default number of cards per catalog page |
| `default_perspective` | enum (`EXECUTIVE`, `TECHNICAL`) | optional | System-wide fallback default perspective (overridden per record if set) |

---

### Outputs

**Admin Dashboard Outputs:**
- Summary tile: total Published records count
- Summary tile: total Draft + Review records count
- Summary tile: pending opportunity submissions count (status = `SUBMITTED` or `UNDER_REVIEW`)
- Summary tile: pending contribution submissions count (status = `SUBMITTED` or `UNDER_REVIEW`)
- Summary tile: engagement requests in last 7 days count
- Quick links to each admin section

**Record Management Outputs:**
- Record list table with all records and current state
- Record detail/edit form with all structured fields
- Governance gate feedback: list of blocking fields on failed publish attempt
- Audit history log for each record: `[timestamp] [curator_name] changed [field] from [old_value] to [new_value]`

**Submission Queue Outputs:**
- List of opportunity submissions with: submitter name, office, mission area, submitted_at, disposition status
- List of contribution submissions with: contact name, contributing office, submitted_at, self-assessed maturity, disposition status
- Full submission detail view per record

**Engagement Activity Outputs:**
- List of engagement requests with: request type, record title (linked), requestor name, office, submitted_at, status
- Full engagement request detail view
- Filter/sort controls

**Settings Outputs:**
- Current value of each Hub setting displayed and editable

---

### Validation

**Access Control:**
- All `/admin/*` routes require authenticated CURATOR session.
- Unauthenticated requests to admin routes: redirect to identity provider login.
- Authenticated requests by non-CURATOR role: return 403.
- Session management follows the identity provider's token expiry rules. Expired sessions redirect to login.

**Record Operations:**
- All field-level validation rules from F02b §Validation apply when creating or editing records.
- State transitions must follow the publication lifecycle strictly:
  - `DRAFT` → `REVIEW` (Submit for Review)
  - `REVIEW` → `PUBLISHED` (Publish) — governance gate applied
  - `REVIEW` → `DRAFT` (Return to Draft)
  - `PUBLISHED` → `REVIEW` (Edit — requires confirmation)
  - `PUBLISHED` → `SUPERSEDED` (Supersede — requires `superseded_by_record_id`)
  - `PUBLISHED` → `ARCHIVED` (Archive)
  - `SUPERSEDED` → `ARCHIVED` (Archive)
  - No other transitions are valid.
- Deletion: only Draft-state records may be deleted by a curator. Published, Superseded, and Archived records cannot be deleted (soft-delete only; retained for audit integrity).

**Submission Dispositions:**
- `linked_record_id` is required when `disposition = LINKED_TO_RECORD` or `PUBLISHED`; must reference an existing record.
- `internal_note` is optional; max 1,000 characters.

**Settings:**
- `engagement_routing_email`: required to be non-blank and valid email format; validated on save.
- `catalog_default_page_size`: must be integer 6–50.

---

### Error States

| Scenario | HTTP Status | Error Code | Curator-Facing Message |
|----------|-------------|------------|------------------------|
| Unauthenticated access to admin route | 302 | — | Redirect to identity provider login |
| Authenticated but non-CURATOR role | 403 | `ACCESS_DENIED` | "You do not have permission to access the administration interface." |
| Expired session | 302 | — | Redirect to identity provider login |
| Governance gate failure on publish | 422 | `PUBLICATION_GATE_FAILED` | "Publication blocked. Missing required fields: [field list]." |
| Invalid state transition attempted | 422 | `INVALID_STATE_TRANSITION` | "This state transition is not permitted. Current state: [state]. Allowed transitions: [list]." |
| Attempt to delete a non-Draft record | 422 | `DELETE_NOT_PERMITTED` | "Only Draft-state records may be deleted. To remove from public view, Archive this record instead." |
| `linked_record_id` references non-existent record | 422 | `INVALID_RECORD_REF` | "The linked record ID does not exist." |
| Invalid routing email format in settings | 422 | `INVALID_EMAIL` | "Routing email must be a valid email address." |
| Admin data service unavailable | 503 | `ADMIN_UNAVAILABLE` | "The administration interface is temporarily unavailable. Please try again shortly." |
| Attempt to create two CURATOR accounts by a non-admin | 403 | `ACCESS_DENIED` | "User management requires system administrator access." |

---

### API Surface (F08)

The curation interface may be served as a traditional server-rendered admin panel or as a single-page application consuming the same REST API as the public Hub, with CURATOR-role endpoints. All CURATOR-protected endpoints require a valid session token in the `Authorization` header or session cookie.

See `Y1-api.md` §Admin for full curator API schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/records` | CURATOR | List all records (all states) |
| `GET` | `/api/v1/admin/dashboard-summary` | CURATOR | Return dashboard summary counts |
| `GET` | `/api/v1/admin/opportunity-submissions` | CURATOR | List opportunity submissions |
| `PATCH` | `/api/v1/admin/opportunity-submissions/{id}` | CURATOR | Update submission disposition |
| `GET` | `/api/v1/admin/contribution-submissions` | CURATOR | List contribution submissions |
| `PATCH` | `/api/v1/admin/contribution-submissions/{id}` | CURATOR | Update contribution disposition |
| `POST` | `/api/v1/admin/contribution-submissions/{id}/create-record` | CURATOR | Create Innovation Record from contribution |
| `GET` | `/api/v1/admin/engagement-requests` | CURATOR | List all engagement requests |
| `PATCH` | `/api/v1/admin/engagement-requests/{id}` | CURATOR | Update engagement request status |
| `GET` | `/api/v1/admin/settings` | CURATOR | Get all Hub settings |
| `PUT` | `/api/v1/admin/settings` | CURATOR | Update Hub settings |
| `GET` | `/api/v1/admin/maturity-reference` | CURATOR | Get maturity level definitions (content model reference) |
| `GET` | `/api/v1/admin/review-status-reference` | CURATOR | Get review status definitions (content model reference) |

---

### Schema Surface (F08)

The admin interface operates on all tables defined in `Y0-schema.md`:
- `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options` (record management)
- `opportunity_submissions` (opportunity queue)
- `contribution_submissions` (contribution queue)
- `engagement_requests` (engagement monitoring)
- `hub_settings` (settings management)
- `audit_log` (audit history)
- `users` (curator identity; populated by identity provider integration)

Full DDL in `Y0-schema.md`.

---

*End of F08b-curation-administration.md — continues in F09-content-maturity-trust-model.md*
