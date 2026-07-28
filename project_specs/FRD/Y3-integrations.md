---

## Y3: External Integration Points

This document defines the external systems and services that the TSIO Innovation Hub depends on or interfaces with. Where specific vendor decisions are TBD (pending hosting and identity discovery), this document defines the integration contract requirements so that implementation can proceed once decisions are made.

---

### INT-01: Identity Provider (Authentication)

**Dependency:** F08 (Curation and Administration), CURATOR role enforcement  
**Status:** TBD — decision required during Pivota discovery phase  
**Priority:** P0 — MVP launch blocker (admin interface cannot function without authentication)

**Contract Requirements:**
- The identity provider must support standard OAuth 2.0 / OpenID Connect (OIDC) flows.
- The Hub must be able to extract the following claims from the OIDC token: `email`, `name` (display name), `sub` (subject / unique user ID), `groups` or `roles` (for CURATOR role assignment).
- The Hub must store a local `users` table record keyed by `idp_subject` for audit trail integrity (curator identity on audit entries must not be lost if IdP access changes).
- Session token expiry must be enforced; expired sessions redirect to the IdP login page.
- Role assignment (`CURATOR`) must be configurable without code deployment — either via IdP group membership or a local role table maintained by an admin.

**Candidate:** Azure Active Directory / Microsoft Entra ID (assumed for Federal Judiciary context; confirm during discovery).  
**Integration method:** MSAL or standard OIDC middleware in the backend framework.

---

### INT-02: Email Delivery (Routing Notifications)

**Dependency:** F05 (Opportunity Submission), F06 (Share Existing Innovation Work), F07 (Engagement Routing)  
**Status:** Required for MVP  
**Priority:** P1 — engagement routing and submission notifications depend on this

**Contract Requirements:**
- The Hub must be able to send transactional emails programmatically to:
  - The configurable routing address (`engagement_routing_email` setting) for engagement requests and new submissions
  - The submitter/requestor email address for confirmation messages
- Emails are triggered by: new opportunity submission, new contribution submission, new engagement request.
- Email content must include a plain-text summary of the triggering event and a direct link to the relevant record or submission in the admin interface.
- The routing email address must be changeable without a code deployment (stored in `hub_settings` table).
- Failure to deliver email must not cause the submission or request to fail or be lost. The record is stored successfully; email delivery failure is a background concern logged for curator resolution.

**Candidate:** SMTP relay provided by the Judiciary hosting environment (AO-managed); or a transactional email service (e.g., SendGrid, Azure Communication Services) if SMTP relay is not available.  
**Fallback:** If email delivery is not available at MVP launch, the admin interface submission queue (F08) serves as the primary notification mechanism for curators.

---

### INT-03: Full-Text Search Engine

**Dependency:** F01 (Search and Discovery)  
**Status:** Required for MVP  
**Priority:** P0 — search is a critical MVP requirement

**Contract Requirements:**
- The search engine must support full-text search with relevance ranking across indexed text fields.
- Fields indexed: `problem_statement`, `key_findings`, `what_was_explored`, `outcome_summary`, `title`, `reuse_guidance`, mission area tags, technology area tags, `short_summary`.
- Field weighting must be configurable so problem-statement and key-findings fields are ranked higher than tags.
- The index must be updated in near-real-time (or synchronously) when a record is published, edited, superseded, or archived.
- Search must be scoped to Published records for PUBLIC queries; CURATOR queries may search all states.
- The engine must support query sanitization to prevent injection.

**Candidates (in order of preference for simplicity):**
1. Native full-text search of the primary database engine (PostgreSQL `tsvector`, SQLite FTS5) — preferred for MVP simplicity.
2. Elasticsearch or OpenSearch — if native FTS is insufficient for relevance tuning at scale.
3. Meilisearch — lightweight alternative if a dedicated search service is preferred.

**Decision:** TBD pending hosting environment selection. PostgreSQL native FTS is recommended for MVP unless the record volume or search sophistication requires a dedicated engine.

---

### INT-04: CAPTCHA Provider

**Dependency:** F05 (Opportunity Submission), F06 (Share Existing Innovation Work), F07 (Engagement Routing)  
**Status:** Required for MVP (public forms without authentication)  
**Priority:** P1 — spam/abuse protection for unauthenticated public forms

**Contract Requirements:**
- The CAPTCHA provider must return a token that can be server-side validated to confirm the form was submitted by a human.
- Server-side validation must be performed before the submission is persisted.
- CAPTCHA must be accessible to users with disabilities (WCAG 2.1 AA compliant).
- The CAPTCHA provider's API key must be configurable without code deployment.

**Candidates:**
- Google reCAPTCHA v3 (score-based, invisible) — preferred for usability.
- hCaptcha — alternative if Google services are restricted in the Judiciary environment.
- Cloudflare Turnstile — lightweight option if Cloudflare is in the stack.

**Note:** If the Judiciary network environment restricts outbound calls to CAPTCHA providers, rate limiting (IP-based, 5 submissions/hour) serves as the fallback anti-abuse mechanism.

---

### INT-05: Artifact Source Systems (Read-Only Link References)

**Dependency:** F02 (Innovation Record), F04 (Lessons-Learned Integration)  
**Status:** Informational — no active integration required  
**Priority:** P1 — artifact links are required for publication but require no system integration

**Contract Requirements:**
- The Hub stores external URLs pointing to authoritative source documents in external systems. No API integration, authentication bridge, or content sync is required with these systems.
- Supported source systems (as link targets only):
  - SharePoint / SharePoint Online (`https://*.sharepoint.com/*`)
  - GitHub / GitHub Enterprise (`https://github.com/*`, `https://github.uscourts.gov/*`)
  - Video platforms (e.g., Microsoft Stream, YouTube — HTTPS URLs)
  - Any other system accessible via HTTPS URL
- The Hub does not crawl, index, cache, or proxy content from these systems.
- Access control for linked artifacts is governed by the source system, not by the Hub. Curators should note access requirements in `reuse_guidance` or `technical_perspective_text` when relevant.
- If a linked URL becomes unreachable, the Hub record remains valid. The broken link is a content issue to be resolved by the curator. The system may optionally surface a link-health advisory to curators during record review.

---

### INT-06: Hosting Environment

**Dependency:** All features  
**Status:** TBD — decision required during Pivota discovery  
**Priority:** P0 — MVP cannot be deployed without a hosting decision

**Contract Requirements:**
- The hosting environment must support a web application server capable of serving the Hub frontend and backend API.
- The environment must support a relational database (PostgreSQL preferred; SQL Server and SQLite also viable).
- The environment must support outbound HTTPS calls (for email delivery and CAPTCHA validation).
- The environment must comply with Federal Judiciary hosting and ATO requirements.
- Deployment must not require Judiciary-external cloud services that are not ATO-approved (e.g., commercial AWS/Azure regions may require substitution with GovCloud equivalents).

**Known candidates:** AO-managed on-premise hosting; Azure Government Cloud (if approved); Court-hosted server (less preferred for maintainability).  
**Decision:** To be finalized in Pivota discovery phase.

---

### Integration Dependency Summary

| Integration | Features Affected | MVP Required | Decision Status |
|-------------|-------------------|--------------|-----------------|
| INT-01: Identity Provider | F08 (CURATOR auth) | Yes (P0) | TBD — discovery required |
| INT-02: Email Delivery | F05, F06, F07 | Yes (P1) | TBD — hosting-dependent |
| INT-03: Full-Text Search | F01 | Yes (P0) | TBD — recommend PostgreSQL native FTS |
| INT-04: CAPTCHA Provider | F05, F06, F07 | Yes (P1) | TBD — recommend reCAPTCHA v3 |
| INT-05: Artifact Sources | F02, F04 | Link-only (no integration) | N/A |
| INT-06: Hosting Environment | All | Yes (P0) | TBD — discovery required |

---

*End of Y3-integrations.md*  
*All FRD chunks written. Assembling master document next.*
