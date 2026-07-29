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
