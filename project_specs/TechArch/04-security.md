---

## 5. Security Architecture

### 5.1 Authentication

The Hub uses **OAuth 2.0 / OpenID Connect (OIDC)** for curator authentication. The identity provider is Azure Active Directory / Microsoft Entra ID (assumed for the Federal Judiciary environment; to be confirmed during discovery).

**Authentication flow:**

1. Curator navigates to `/admin` (or any `/admin/*` route)
2. Auth middleware checks for a valid session token
3. If no valid session: middleware redirects to the Azure AD OIDC authorization endpoint
4. User authenticates with Azure AD (MFA enforced per AO policy)
5. Azure AD redirects to the Hub callback URL with an authorization code
6. Hub backend exchanges the code for `id_token` and `access_token` at the Azure AD token endpoint
7. Backend validates the `id_token` signature against the Azure AD JWKS endpoint
8. Backend extracts claims: `sub` (OID), `email`, `name`, and group/role claims
9. Backend upserts a `users` table row keyed on `idp_subject = sub`
10. Backend creates a server-side session (session ID stored in an HttpOnly, Secure, SameSite=Strict cookie)
11. Curator accesses the admin interface

**Session management:**
- Sessions stored server-side (Redis or database-backed session store)
- Session lifetime: follows Azure AD token expiry policy (typically 1 hour for access token; refresh token handles silently where possible)
- Expired sessions redirect to Azure AD login
- Session cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`
- No JWT stored in browser localStorage or sessionStorage

**OIDC configuration:**
```
Authorization endpoint: https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize
Token endpoint:         https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
JWKS endpoint:          https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys
Scopes required:        openid profile email (+ groups claim if using group-based role assignment)
```

---

### 5.2 Authorization

The system has two roles: **PUBLIC** (unauthenticated) and **CURATOR** (authenticated + role-verified).

| Role | Who | Access |
|------|-----|--------|
| `PUBLIC` | Any unauthenticated user | Read-only access to PUBLISHED records, catalog, search; submit opportunity/contribution/engagement forms |
| `CURATOR` | Authenticated I&R team members with CURATOR role | All PUBLIC access + read/write all records (all states), submission queues, engagement log, settings |
| `ADMIN` | Designated system administrator | All CURATOR access + user management (future scope) |

**Authorization enforcement:**

- All `/admin/*` routes require authenticated CURATOR session enforced by auth middleware
- The REST API enforces role at the handler layer — PUBLIC endpoints explicitly exclude non-published records, CURATOR endpoints require valid session token in `Authorization` header or session cookie
- Role assignment is stored in the `users.role` column; can be changed by an ADMIN without code deployment
- If `role ≠ CURATOR` after successful authentication: system returns HTTP 403 `ACCESS_DENIED`

**Resource-level authorization:** In MVP, all CURATORs have equal write access to all records. Record-level ownership is tracked in audit history for accountability, not enforced as an access gate.

---

### 5.3 Public Form Protections

All unauthenticated public forms (opportunity submission, contribution submission, engagement request) are protected against spam and abuse:

| Protection | Mechanism | Limit |
|------------|-----------|-------|
| CAPTCHA | Server-side token validation (reCAPTCHA v3 or hCaptcha) | Per-submission; all three form types |
| IP rate limiting | Server-side counter (Redis or in-memory) | Opportunity/Contribution: 5/hour per IP; Engagement: 10/hour per IP |
| Input sanitization | HTML strip + length validation before persistence | All text fields |
| HTTPS enforcement | Reverse proxy redirects HTTP → HTTPS | All routes |

**CAPTCHA fallback:** If the Judiciary network environment restricts outbound calls to CAPTCHA providers, IP rate limiting alone is the anti-abuse mechanism. The system must be configurable to disable CAPTCHA validation without a code deployment (via `hub_settings`).

---

### 5.4 Data Protection

#### Encryption

| Layer | Requirement | Implementation |
|-------|-------------|----------------|
| Data in transit | TLS 1.2 minimum; TLS 1.3 preferred | Enforced at reverse proxy / load balancer |
| Data at rest | Database volume encrypted | AO-managed hosting / cloud provider disk encryption |
| Database connection | TLS required for app → database connections | Connection string config |
| Secrets | Environment variables or secret management service | Never stored in code or config files |

#### Sensitive Data Handling

- **Email addresses** (submitter, requestor, curator): Stored in plaintext in the database. Access restricted to CURATOR role via API. Not exposed in public API responses.
- **Identity provider tokens**: Not stored in the database. Session tokens are opaque references stored server-side.
- **CAPTCHA API keys**: Stored in environment variables / secret management. Not in application code.
- **Routing email address**: Stored in `hub_settings` table. Readable/writable only by CURATOR role.
- **Personally Identifiable Information (PII)**: Submitter and requestor names, emails, and office information are stored in `opportunity_submissions`, `contribution_submissions`, and `engagement_requests`. These tables are accessible only to authenticated CURATORs. PII is not included in public API responses.

#### Audit Log Security

- The `audit_log` table is append-only at the application layer: the application database user has INSERT and SELECT privileges only — no UPDATE or DELETE
- Audit rows capture the `user_id` of the acting curator, not just a display name, so identity cannot be forged even if a display name changes
- Audit records are retained indefinitely in MVP (no expiry policy); this aligns with federal records retention requirements

---

### 5.5 Input Validation and Injection Prevention

| Attack Vector | Defense |
|---------------|---------|
| SQL injection | Parameterized queries / ORM prepared statements throughout; no raw string interpolation in SQL |
| XSS (stored) | All user-supplied text is HTML-stripped before persistence; frontend renders text as plain text, not innerHTML |
| XSS (reflected) | Query parameters are validated and sanitized; search query is parameterized before passing to FTS engine |
| SSRF | Artifact URLs stored as strings only — Hub never fetches or proxies them; no URL-to-server requests |
| Path traversal | No file system access; all data operations via ORM/repository layer |
| CSRF | SameSite=Strict session cookies mitigate most CSRF; CURATOR mutations may additionally require a CSRF token |
| Rate abuse | IP-based rate limiting on all public write endpoints |

---

### 5.6 Trust Integrity Enforcement (Security-Relevant)

The trust disclaimer system is a security-relevant feature because incorrect disclaimer rendering could mislead stakeholders into treating a POC record as production-ready. The following controls enforce trust integrity:

1. **Trust disclaimers are computed server-side** by `TrustDisclaimerService` and included in every public record API response. The frontend renders the disclaimer texts from the API response — it does not compute them independently.
2. **Trust disclaimer texts are hard-coded** in the application source code. Curators cannot modify them. A code change and release is required to update disclaimer language.
3. **Governance gate is enforced server-side** in `GovernanceGateService` before any REVIEW → PUBLISHED transition. The admin UI publication controls are a convenience layer; the gate is always enforced at the API layer regardless of how the request originates.
4. **Only PUBLISHED records are returned** to PUBLIC API consumers. The catalog and search endpoints include `WHERE publication_state = 'PUBLISHED'` at the query layer, not just as a frontend filter.

---

### 5.7 Federal Compliance Considerations

| Requirement | Approach |
|-------------|----------|
| WCAG 2.1 AA | Enforced in frontend component design; semantic HTML, ARIA labels, keyboard navigation, color contrast ratios |
| ATO / FedRAMP | Hosting environment and identity provider must be AO-approved (Azure Government or AO on-premise) |
| FISMA | Audit logging satisfies FISMA audit trail requirements; TLS and encryption at rest address confidentiality |
| HTTPS-only | Enforced at reverse proxy layer; HSTS header recommended |
| Identity management | Azure AD / Entra ID is the standard AO identity system; OIDC integration aligns with federal identity guidelines |
| No public PII in responses | Submitter/requestor PII is never included in PUBLIC API responses |

---

*End of 04-security.md*
