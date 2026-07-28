---

## F05: Opportunity Submission

**PRD Reference:** F5 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader)

---

### Description

Operational leaders and decision-makers can submit a mission problem or innovation opportunity for I&R consideration through a structured, problem-first form. The form guides the submitter to articulate the mission problem before proposing solutions — a deliberate design choice that prevents solution-first framing and aligns with the Hub's problem-first discovery philosophy. Submission initiates a curation review process; it does not imply portfolio acceptance, a commitment to begin a project, or a timeline. Submissions are routed to the I&R team via configurable email and visible in the curator admin interface.

---

### Terminology

- **Opportunity Submission:** A structured record capturing a mission problem or innovation opportunity submitted by a stakeholder for I&R team consideration.
- **Problem-First Framing:** The form design principle that leads submitters to describe the mission problem, not jump to a proposed technology or solution. Form field labels and help text reinforce this.
- **Submission Confirmation:** The on-screen acknowledgment and optional email confirmation sent to the submitter after a successful submission. Must explicitly state that submission does not imply acceptance or project commitment.
- **Configurable Routing Email:** The email address to which submission notifications are sent. Initial value: `AOml_TSO_IRB_Team@ao.uscourts.gov`. Changeable by a curator without code deployment (see F08).
- **Submission Disposition:** The curator's recorded action on a submission: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`. Visible in the admin interface; not surfaced to the submitter.

---

### Sub-Features

- Public-facing submission form accessible from the catalog, record pages, and search empty state
- Problem-first form field ordering and labeling
- Server-side and client-side input validation
- Spam/abuse protection (CAPTCHA or rate limiting)
- Submission confirmation message on screen with explicit "not a commitment" language
- Optional email confirmation to submitter
- Automated email notification to I&R routing address on submission
- Submission record stored and visible in curator admin interface (F08)
- Curator can update disposition status on each submission
- No authentication required for submission in MVP

---

### Process

#### Submitter (PUBLIC)

1. Submitter navigates to the submission form at `/submit-opportunity` or via a CTA link from catalog/record pages.
2. System renders the structured submission form with problem-first field ordering and helper text.
3. Submitter completes all required fields and optional fields as desired.
4. Submitter completes spam/abuse protection (CAPTCHA or equivalent).
5. Submitter clicks "Submit."
6. System validates all fields (see Validation). If errors: system re-renders the form with inline error messages on invalid fields. Submitter's input is preserved.
7. On valid submission: system creates an `opportunity_submission` record with `status = SUBMITTED` and `submitted_at = now()`.
8. System sends email notification to the configurable routing address with a formatted summary of the submission.
9. System optionally sends a confirmation email to the submitter (if `submitter_email` was provided).
10. System renders the submission confirmation page with explicit language: "Your submission has been received by the TSIO I&R team. This submission does not imply acceptance of the opportunity into the I&R portfolio or a commitment to begin a project. The I&R team will review submissions on a periodic basis and may reach out if they have questions."
11. Submitter may optionally be offered a "Return to Catalog" CTA.

#### Curator (Admin Interface)

1. Curator navigates to the Submissions section in the admin interface.
2. System displays all `opportunity_submission` records in reverse chronological order, with status indicators.
3. Curator reviews a submission and updates its `disposition` field: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`.
4. If `LINKED_TO_RECORD`: curator enters the `linked_record_id` of the Innovation Record that addresses this submission.
5. Disposition history is logged (timestamp + curator user ID).

---

### Inputs

**Submission Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `problem_description` | text (50–3,000 chars) | required | The mission problem or opportunity (problem-first framing; label: "Describe the mission problem you are facing") |
| `mission_area` | string (2–200 chars) | required | The mission domain this problem falls under (e.g., "Court Operations," "Cybersecurity") |
| `submitting_office` | string (2–200 chars) | required | The submitter's organizational unit or court |
| `submitter_name` | string (2–200 chars) | required | Submitter's full name |
| `submitter_email` | string, email format | required | Submitter's email address (used for confirmation email and follow-up) |
| `submitter_title` | string (0–200 chars) | optional | Submitter's title or role |
| `urgency_context` | text (0–1,000 chars) | optional | Any urgency or priority context the I&R team should know |
| `known_constraints` | text (0–1,000 chars) | optional | Known constraints, previous attempts, or related work the submitter is aware of |
| `captcha_token` | string | required | CAPTCHA verification token (anti-spam) |

---

### Outputs

- **Opportunity Submission record** created in `opportunity_submissions` table with `status = SUBMITTED`
- **Email notification** sent to configurable routing address containing: submission timestamp, submitter name, office, email, mission area, problem description, urgency context, known constraints, and a link to the submission in the admin interface
- **Optional confirmation email** to `submitter_email` with submission receipt text and "not a commitment" language
- **Confirmation page** rendered to submitter with explicit submission acknowledgment
- **Admin interface entry** visible to curators in Submissions queue

---

### Validation

- `problem_description`: 50–3,000 characters; must not be blank; must not be a URL or single-word entry (encouraged by field label and help text; not technically blocked beyond length).
- `mission_area`: 2–200 characters; required.
- `submitting_office`: 2–200 characters; required.
- `submitter_name`: 2–200 characters; required.
- `submitter_email`: Must be a valid email format (`user@domain.tld`); required.
- `captcha_token`: Must be validated against the CAPTCHA provider before submission is accepted. If invalid or missing, return 422 with `CAPTCHA_INVALID`.
- Rate limiting: Maximum 5 submissions per IP address per hour. Submissions exceeding this limit receive a 429 response.
- All text fields: HTML tags stripped; content is stored as plain text.
- No authentication required from the submitter in MVP. If authentication is added in a future release, this section will be updated.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." (inline on each invalid field) |
| `problem_description` too short | 422 | `FIELD_TOO_SHORT` | "Please provide more detail — at least 50 characters." |
| Invalid email format | 422 | `INVALID_EMAIL` | "Please enter a valid email address." |
| CAPTCHA verification failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many submissions. Please wait before submitting again." |
| Email routing failure (routing email bounces) | 200 (submission still saved) | — | No user-facing error; submission is stored; curator resolves routing issue in admin |
| Submission service unavailable | 503 | `SUBMISSION_UNAVAILABLE` | "The submission form is temporarily unavailable. Please try again shortly or contact the I&R team directly." |

---

### API Surface (F05)

See `Y1-api.md` §Submissions for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/opportunity-submissions` | None (PUBLIC) | Submit a mission problem or opportunity |
| `GET` | `/api/v1/opportunity-submissions` | CURATOR | List all opportunity submissions (admin) |
| `PATCH` | `/api/v1/opportunity-submissions/{submission_id}` | CURATOR | Update disposition of a submission |

---

### Schema Surface (F05)

Primary table: `opportunity_submissions`. Full DDL in `Y0-schema.md` §opportunity_submissions.

---

*End of F05-opportunity-submission.md — continues in F06-share-existing-innovation.md*
