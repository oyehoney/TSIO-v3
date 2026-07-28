---

## F06: Share Existing Innovation Work

**PRD Reference:** F6 — Priority P2 (Late-MVP / Post-MVP)  
**Personas Served:** P4 (Innovation Contributor)

---

### Description

Teams outside I&R that have conducted their own innovation work can submit that work for consideration and curation through a structured contribution form. Submissions enter a curation workflow before any public Innovation Record is created — the I&R team curates, enriches, and governs the record before publication. Published records from community contributors are clearly distinguished from I&R-conducted work via a visible community badge and a trust disclaimer. This feature is scoped for late-MVP or early post-MVP delivery; the submission form and admin queue are the MVP deliverable; full curator workflow is the same as F02.

---

### Terminology

- **Contribution Submission:** A structured record capturing an existing innovation effort submitted by a team outside I&R for curation and potential publication on the Hub.
- **Contributing Team:** The organizational unit (court, AO office, program team) that conducted the innovation work and is submitting it.
- **Community Record:** An Innovation Record published on the Hub where `source_type = COMMUNITY`, indicating it was contributed by a team outside I&R and curated by I&R.
- **Curation Review (Contribution):** The I&R curator workflow for reviewing, enriching, and deciding whether to publish a contribution submission as an Innovation Record.
- **Contribution Disposition:** The curator's recorded action: `UNDER_REVIEW`, `ACCEPTED_FOR_CURATION`, `DECLINED`, `PUBLISHED` (linked to record ID). Not surfaced to the contributor.
- **Self-Assessed Maturity:** The maturity level the contributing team believes their work has reached. Curator assigns the final maturity level and is not bound by the self-assessment.

---

### Sub-Features

- Public-facing contribution form accessible from the Hub navigation or a dedicated "Share Your Work" CTA
- Structured form with fields for: work description, problem addressed, outcome summary, self-assessed maturity, artifact URLs, team/office, contact information
- Explicit acknowledgment on form that submission enters curation review and publication is not guaranteed
- Automated email notification to I&R routing address on submission
- Submission record stored and visible in curator admin interface (F08)
- Curator reviews and creates an Innovation Record (F02) from the contribution if accepted
- Curator sets `source_type = COMMUNITY` on the resulting Innovation Record
- Published community records display community badge and required trust disclaimer
- Attribution: contributing team/office credited on published record via `contributing_office` and `contributor_attribution` fields

---

### Process

#### Contributor (PUBLIC)

1. Contributor navigates to the contribution form at `/share-innovation` or via a CTA.
2. System renders the contribution submission form with helper text explaining: "Submissions enter I&R curation review. Publication is not guaranteed. If published, your team will be credited."
3. Contributor completes all required fields (see Inputs).
4. Contributor completes CAPTCHA.
5. Contributor clicks "Submit."
6. System validates all fields. If errors: re-renders form with inline error messages.
7. On valid submission: system creates a `contribution_submission` record with `status = SUBMITTED`.
8. System sends email notification to the configurable routing address.
9. System optionally sends confirmation email to contributor.
10. System renders confirmation page: "Your submission has been received. The I&R team will review it for potential curation. This submission does not guarantee publication. If your work is published, your team will receive attribution."

#### Curator (Admin Interface)

1. Curator navigates to the Contributions section in the admin interface.
2. System displays all `contribution_submission` records with status indicators.
3. Curator reviews a submission and updates `disposition`:
   - `DECLINED`: Curator records a brief reason (internal note; not surfaced to contributor).
   - `ACCEPTED_FOR_CURATION`: Curator creates a new Innovation Record (F02) populated from the submission data, sets `source_type = COMMUNITY`, enters `contributing_office` and `contributor_attribution` from submission data, and proceeds through the standard publication lifecycle.
4. Once the record is published, curator updates the contribution submission `disposition` to `PUBLISHED` and links `linked_record_id`.

---

### Inputs

**Contribution Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `work_description` | text (50–3,000 chars) | required | Description of the innovation work |
| `problem_addressed` | text (50–2,000 chars) | required | The mission problem this work addressed |
| `outcome_summary` | text (50–2,000 chars) | required | Summary of what was found or built |
| `self_assessed_maturity` | enum | required | Submitter's best estimate: `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED` |
| `artifact_urls` | array of strings (1–5 valid URLs) | required | Links to existing artifacts (SharePoint, GitHub, video) |
| `contributing_team` | string (2–200 chars) | required | Team or office name |
| `contributing_office` | string (2–200 chars) | required | Organizational unit |
| `contact_name` | string (2–200 chars) | required | Primary contact full name |
| `contact_email` | string, email format | required | Primary contact email |
| `contact_title` | string (0–200 chars) | optional | Contact's title or role |
| `additional_context` | text (0–1,000 chars) | optional | Anything else the curator should know |
| `captcha_token` | string | required | CAPTCHA verification token |

---

### Outputs

- **Contribution Submission record** created in `contribution_submissions` table with `status = SUBMITTED`
- **Email notification** to routing address with: submission timestamp, contributing team, contact info, work description, problem addressed, outcome summary, self-assessed maturity, artifact URLs
- **Optional confirmation email** to `contact_email`
- **Confirmation page** rendered to contributor
- **Admin interface entry** in Contributions queue
- **Innovation Record (if accepted):** Standard F02 record with `source_type = COMMUNITY` and community attribution fields populated

---

### Validation

- Same email, CAPTCHA, rate-limiting, and text-sanitization rules as F05 §Validation apply.
- `artifact_urls`: Minimum 1 item; maximum 5; each must be a valid absolute HTTPS URL.
- `self_assessed_maturity`: Must be a valid enum member (excluding `ARCHIVED` — self-assessed maturity cannot be "Archived").
- Curator is not required to use the `self_assessed_maturity` value; they assign the final maturity level independently.
- Rate limiting: Same as F05 (5 submissions per IP per hour).

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." |
| No artifact URLs provided | 422 | `ARTIFACT_URL_REQUIRED` | "At least one artifact link is required." |
| Invalid artifact URL format | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| CAPTCHA failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many submissions. Please wait before submitting again." |
| Submission service unavailable | 503 | `SUBMISSION_UNAVAILABLE` | "The submission form is temporarily unavailable. Please try again shortly." |

---

### API Surface (F06)

See `Y1-api.md` §Contributions for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/contribution-submissions` | None (PUBLIC) | Submit existing innovation work for curation |
| `GET` | `/api/v1/contribution-submissions` | CURATOR | List all contribution submissions (admin) |
| `PATCH` | `/api/v1/contribution-submissions/{submission_id}` | CURATOR | Update disposition of a contribution |

---

### Schema Surface (F06)

Primary table: `contribution_submissions`. Full DDL in `Y0-schema.md` §contribution_submissions.

---

*End of F06-share-existing-innovation.md — continues in F07-engagement-routing.md*
