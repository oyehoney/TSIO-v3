---

## F07: Engagement Routing

**PRD Reference:** F7 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter), P5 (I&R Curator)

---

### Description

Every engagement action a stakeholder takes on the Hub — demo request, adoption discussion request, technical guidance request, briefing request — is captured as a trackable engagement record and routed to the I&R team. Initial MVP implementation uses configurable email routing to minimize infrastructure complexity. Each engagement request is tied to a specific Innovation Record, so the I&R team knows exactly what the requestor is interested in. Engagement activity is visible to curators in the admin interface, giving the team visibility into which records are attracting interest.

---

### Terminology

- **Engagement Request:** A trackable record capturing a stakeholder's request to take a next action related to a specific Innovation Record. Includes request type, record reference, requestor identity, office, description of interest, and desired next step.
- **Engagement Option:** One of the configured next-action types available on a specific Innovation Record: `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING`. (Note: submitting a related problem is handled via the F05 Opportunity Submission form — not a distinct engagement option.)
- **Next-Action Panel:** The UI section on every Innovation Record page that displays the configured engagement options as actionable buttons or links.
- **Configurable Routing Email:** The email address that receives all engagement request notifications. Initial value: `AOml_TSO_IRB_Team@ao.uscourts.gov`. Changeable by a curator without code deployment.
- **Engagement Confirmation:** The on-screen acknowledgment shown to the requestor after submitting an engagement request.
- **Engagement Activity Log:** The admin interface view showing all engagement requests across all records, with request type, record title, requestor info, and timestamp.

---

### Sub-Features

- Engagement request form triggered from the Next-Action panel on any Innovation Record page
- One form per engagement option type (demo, adoption, technical guidance, briefing, related problem)
- Trackable engagement record stored per request
- Email notification to configurable routing address on each request
- Optional confirmation email to requestor
- Engagement confirmation message rendered on screen
- Engagement activity log visible to curators in admin interface
- Curator can view engagement requests per record and across all records
- Routing email address configurable in admin settings (no code deployment required)

---

### Process

#### Requestor (PUBLIC)

1. Requestor views an Innovation Record page.
2. System displays the Next-Action panel with configured engagement options (1–4 buttons/links).
3. Requestor clicks an engagement option (e.g., "Request Demo").
4. System renders an inline form or modal containing: requestor name, office, email, description of interest, desired next step (pre-populated with the engagement type label).
5. Requestor completes the form and clicks "Submit Request."
6. System validates all fields (see Validation).
7. On valid submission: system creates an `engagement_request` record with `status = SUBMITTED`, `request_type` = selected option, `record_id` = current record.
8. System sends email notification to the configurable routing address containing: request type, record title and URL, requestor name, office, email, description of interest, timestamp.
9. System optionally sends confirmation email to requestor.
10. System renders confirmation: "Your request has been sent to the I&R team. Someone will follow up with you based on team availability."
11. Requestor may dismiss the modal or continue browsing.

#### Curator (Admin Interface)

1. Curator navigates to Engagement Activity in the admin interface.
2. System displays all engagement requests in reverse chronological order with: request type, record title, requestor name, office, email, submitted timestamp, and status.
3. Curator can filter by record, request type, or date range.
4. Curator updates request `status` as needed: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` or `NO_ACTION`.
5. Curator can view engagement requests scoped to a specific record from the record's admin detail view.

#### Curator (Routing Email Configuration)

1. Curator navigates to Hub Settings in the admin interface.
2. Curator updates the `engagement_routing_email` setting value (see F08).
3. System saves the new value. All subsequent engagement request notifications are sent to the updated address.
4. No code deployment required.

---

### Inputs

**Engagement Request Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `request_type` | enum | required (system-set) | `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING` |
| `record_id` | UUID | required (system-set) | The Innovation Record this request is about |
| `requestor_name` | string (2–200 chars) | required | Requestor's full name |
| `requestor_email` | string, email format | required | Requestor's email address |
| `requestor_office` | string (2–200 chars) | required | Requestor's organizational unit or court |
| `requestor_title` | string (0–200 chars) | optional | Requestor's title or role |
| `description_of_interest` | text (20–2,000 chars) | required | What the requestor is hoping to learn or accomplish |
| `desired_next_step` | text (0–500 chars) | optional | Requestor's suggested or preferred next step |
| `captcha_token` | string | required | CAPTCHA verification token |

---

### Outputs

- **Engagement Request record** created in `engagement_requests` table
- **Email notification** to routing address with full request details and direct link to the Innovation Record
- **Optional confirmation email** to `requestor_email`
- **On-screen confirmation** rendered to requestor
- **Admin interface entry** visible in Engagement Activity log

---

### Validation

- `requestor_name`: 2–200 characters; required.
- `requestor_email`: Valid email format; required.
- `requestor_office`: 2–200 characters; required.
- `description_of_interest`: 20–2,000 characters; required.
- `request_type`: Must be a valid enum member; must be one of the engagement options configured for the target record. A requestor cannot request a type not configured on the record.
- `record_id`: Must reference an existing, Published Innovation Record. Engagement requests against non-published records are rejected.
- `captcha_token`: Must be validated. If invalid, return 422 `CAPTCHA_INVALID`.
- Rate limiting: Maximum 10 engagement requests per IP per hour. Exceeding this returns 429.
- All text fields: HTML stripped; stored as plain text.
- `engagement_routing_email` (admin setting): Must be a valid email format when saved. Cannot be blank.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." |
| Invalid email format | 422 | `INVALID_EMAIL` | "Please enter a valid email address." |
| CAPTCHA failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many requests. Please wait before submitting again." |
| Record is not published (request submitted via direct API call) | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |
| Request type not configured for target record | 422 | `INVALID_ENGAGEMENT_TYPE` | "This engagement option is not available for the selected record." |
| Email routing failure | 200 (request saved) | — | No user-facing error; request is stored; curator resolves in admin |
| Routing service unavailable | 503 | `ENGAGEMENT_UNAVAILABLE` | "The engagement form is temporarily unavailable. Please try again or contact the I&R team directly." |

---

### API Surface (F07)

See `Y1-api.md` §Engagement for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/engagement-requests` | None (PUBLIC) | Submit an engagement request |
| `GET` | `/api/v1/engagement-requests` | CURATOR | List all engagement requests (admin) |
| `GET` | `/api/v1/engagement-requests?record_id={id}` | CURATOR | List engagement requests for a specific record |
| `PATCH` | `/api/v1/engagement-requests/{request_id}` | CURATOR | Update status of an engagement request |
| `GET` | `/api/v1/settings/routing-email` | CURATOR | Get current routing email setting |
| `PUT` | `/api/v1/settings/routing-email` | CURATOR | Update routing email setting |

---

### Schema Surface (F07)

Primary tables: `engagement_requests`, `hub_settings`. Full DDL in `Y0-schema.md` §engagement_requests, §hub_settings.

---

*End of F07-engagement-routing.md — continues in F08a-curation-administration.md*
