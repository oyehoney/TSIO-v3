# Security Report — Express: implement-full-tsio-innovation-hub-web-a

**Mode:** retroactive
**Audited:** 2026-08-04
**Verdict:** OPEN_THREATS
**Confirmed HIGH/CRITICAL:** 2

---

## Summary

The TSIO Innovation Hub implements a layered security model: OIDC/Azure AD authentication with server-side PostgreSQL sessions, parameterized SQL queries via Knex throughout (no raw string interpolation), role-based access control (CURATOR/ADMIN) on all mutation endpoints, input sanitization via `sanitize-html` and Zod, and IP-based rate limiting on public submission endpoints. The implementation is generally sound for a government-internal SaaS product.

However, two HIGH-severity findings survive adversarial refutation: (1) an unauthenticated test-seed API is active in the docker-compose `development` deployment (not gated on `NODE_ENV === 'test'`), enabling any network-reachable actor to create/publish/delete records; and (2) the rate-limit IP key is trivially spoofable via `X-Forwarded-For` header injection because `trust proxy 1` is set globally without a network-layer proxy enforcing it. Together with CAPTCHA being silently disabled by default (no `CAPTCHA_SECRET_KEY` in any deployment config), these allow unlimited unauthenticated spam submissions. Additional MEDIUM findings include hardcoded dev secrets committed to source, absent HTTP security headers, and a real internal email address embedded in a migration file.

---

## Attack surface audited

| Area | STRIDE | Verdict | Evidence (file:line) |
|------|--------|---------|----------------------|
| OIDC auth flow (PKCE, session, callback) | Spoofing | SAFE — PKCE state/verifier validated; session server-side; role enforced at callback | `src/middleware/auth.js:113-149` |
| Session cookie configuration | Spoofing | SAFE in prod — HttpOnly, Secure(prod), SameSite=Strict | `src/middleware/auth.js:28-33` |
| `returnTo` post-login redirect | Spoofing / Tampering | SAFE — `req.originalUrl` is always path-relative in Express; no external redirect | `src/middleware/auth.js:84,162-164` |
| DEV_AUTH_BYPASS middleware | Spoofing / EoP | MEDIUM — double-gated `NODE_ENV !== production` AND env var; docker-compose enables it | `src/middleware/devAuthBypass.js:29-44` |
| `requireCurator` (admin router, submissions, engagement, settings) | EoP | SAFE — role check on every protected route | `src/routes/admin.js:24-46`, `src/routes/submissions.js:11-34`, `src/routes/engagement.routes.js:33-46`, `src/routes/settings.routes.js:23-36` |
| `X-Test-User` header shim | Spoofing / EoP | SAFE — gated strictly on `NODE_ENV === 'test'` | `src/routes/admin.js:26`, `src/routes/submissions.js:13` |
| Test-seed routes (`/api/v1/test-seed/*`) | Tampering / EoP | **HIGH** — gated `NODE_ENV !== production`; docker-compose uses `development`; zero auth | `src/app.js:107-110`, `src/routes/testSeed.js:27-132` |
| Catalog SQL queries | Tampering (SQLi) | SAFE — parameterized `ANY($n)` for all filter arrays | `src/services/CatalogService.js:88-127` |
| Admin records filter (`state`, `maturity`, `review_status`) | Tampering (SQLi) | SAFE — Knex `.where(col, value)` parameterized | `src/routes/admin.js:224-226` |
| Search FTS query (`plainto_tsquery`) | Tampering (SQLi) | SAFE — all user input as bind variables; `plainto_tsquery` treats input as plain tokens | `src/services/SearchService.ts:90-104`, `src/services/SearchIndexService.ts:25-28` |
| Record CRUD SQL (create/update/delete) | Tampering (SQLi) | SAFE — Knex parameterized throughout | `src/repositories/innovationRecordRepository.js:83-142` |
| Engagement/submission repository queries | Tampering (SQLi) | SAFE — Knex parameterized throughout | `src/repositories/engagement.repository.js:24-152` |
| Input sanitization (sanitize-html) | Tampering (XSS) | SAFE — `allowedTags: [], allowedAttributes: {}` strips all HTML on all string inputs | `src/handlers/recordHandler.js:45-64`, `src/services/SubmissionService.js:8-11` |
| FTS highlight snippets (`ts_headline`) | Tampering (XSS) | SAFE — marks `<mark>` only; client uses DOMPurify | `src/services/SearchService.ts:94-97` |
| Artifact link URL validation | Tampering | SAFE — `https://` prefix enforced; no URL fetch (display-only) | `src/services/recordService.js:80-91` |
| Rate limiting — submissions (5/hr per IP) | DoS | **HIGH** — `trust proxy 1` + no real proxy; X-Forwarded-For spoofing bypasses limit | `src/app.js:25`, `src/middleware/rateLimiter.js:8-23` |
| Rate limiting — engagement (10/hr per IP) | DoS | **HIGH** — same spoofing issue | `src/app.js:25`, `src/middleware/rateLimiter.js:29-44` |
| Rate limiting — search (`/api/v1/search`) | DoS | MEDIUM — no rate limit at all on FTS endpoint; expensive GIN queries | `src/routes/search.ts:11` |
| CAPTCHA validation | DoS / Tampering | HIGH — silently disabled when `CAPTCHA_SECRET_KEY` not set; docker-compose omits key | `src/services/CaptchaService.js:39-43` |
| Publication scope guard (PUBLIC vs CURATOR) | Info Disclosure | SAFE — 404 for non-PUBLISHED records to PUBLIC; enforced at service layer | `src/services/recordService.js:188-190` |
| Email routing address in migration SQL | Info Disclosure | LOW — real internal email `AOml_TSO_IRB_Team@ao.uscourts.gov` committed to source | `db/migrations/001_supporting_tables.sql:50` |
| DB credentials in docker-compose | Info Disclosure | LOW — dev-only password committed to source; should use env substitution | `docker-compose.yml:10,66` |
| Session secret fallback | Spoofing | MEDIUM — weak default secret in code; docker-compose has committed weak secret | `src/config/oidc.js:13`, `docker-compose.yml:73` |
| HTTP security headers (helmet) | Tampering / Info Disclosure | MEDIUM — no helmet; missing X-Frame-Options, X-Content-Type-Options, CSP, HSTS | `src/app.js` (absent) |
| `/healthz` error message | Info Disclosure | LOW — leaks DB error message including internal hostnames on connection failure | `src/app.js:70` |
| Audit logging of security events | Repudiation | SAFE — append-only audit_log with changed_by_user_id on all record mutations | `src/services/auditService.js`, `src/repositories/auditLogRepository.js` |
| SMTP credentials | Info Disclosure | SAFE — credentials loaded from env vars only; not committed | `src/services/EmailService.js:28-31` |
| User role assignment | EoP | SAFE — role set by DB, checked against `CURATOR\|ADMIN`; cannot be elevated via API | `src/middleware/auth.js:141-149`, `src/repositories/UserRepository.js:24-34` |

---

## Confirmed findings

### FIND-01 — Unauthenticated Test-Seed Routes Active in docker-compose Deployment

**ID:** FIND-01
**Severity:** HIGH
**Category:** Elevation of Privilege / Tampering
**Location:** `src/app.js:107-110`, `src/routes/testSeed.js:27-132`

**Description:**
The test-seed router is mounted when `NODE_ENV !== 'production'`. The `docker-compose.yml` deploys the API with `NODE_ENV: development` — not `test` and not `production`. Consequently, `POST /api/v1/test-seed/published-record` and `DELETE /api/v1/test-seed/records/:id` are fully active in the docker-compose deployment with **zero authentication, zero CURATOR check, and zero session requirement**.

**Exploit:**
```bash
# Create and publish any record without authentication
curl -X POST http://api-host:3001/api/v1/test-seed/published-record \
  -H "Content-Type: application/json" \
  -d '{"title":"Injected Record","short_summary":"attacker-controlled content"}'
# → 201 { "record_id": "<new UUID>" }

# Hard-delete any record by UUID — bypasses lifecycle state machine
curl -X DELETE http://api-host:3001/api/v1/test-seed/records/<UUID>
# → 204 No Content
```
Any network-reachable actor can publish arbitrary records visible to all public users, or delete records by UUID (which requires knowing UUIDs, but UUID enumeration is possible via the public catalog).

**Fix:**
Tighten the guard to `NODE_ENV === 'test'` only (not just `!== 'production'`), or add CURATOR authentication to all test-seed routes:
```js
// src/app.js — change:
if (process.env.NODE_ENV !== 'production') {
// to:
if (process.env.NODE_ENV === 'test') {
```
Additionally, docker-compose deployments intended for preview/staging should not expose test-seed routes at all.

---

### FIND-02 — Rate-Limit Bypass via X-Forwarded-For Spoofing (trust proxy Misconfiguration)

**ID:** FIND-02
**Severity:** HIGH
**Category:** Denial of Service / Tampering
**Location:** `src/app.js:25`, `src/middleware/rateLimiter.js:8-44`, `docker-compose.yml:64-82`

**Description:**
`app.set('trust proxy', 1)` instructs Express to treat the leftmost `X-Forwarded-For` header value as `req.ip`. `express-rate-limit` uses `req.ip` as the rate-limit key. The docker-compose stack deploys the API with **no reverse proxy** between the internet and the Node process — port 3001 is directly exposed. Therefore any client can trivially spoof its IP by sending any `X-Forwarded-For` header value, and each spoofed IP gets a fresh 5-request (submissions) or 10-request (engagement) quota.

**Exploit:**
```bash
# Bypass rate limit with different fake IPs per request
for i in $(seq 1 100); do
  curl -X POST http://api-host:3001/api/v1/opportunity-submissions \
    -H "X-Forwarded-For: 10.0.0.$i" \
    -H "Content-Type: application/json" \
    -d '{"problem_description":"...(50+ chars)...","mission_area":"Courts","submitting_office":"Test","submitter_name":"Attacker","submitter_email":"a@b.com"}'
done
# → All 100 requests succeed (rate limit never triggered)
```
This is compounded by FIND-03 (CAPTCHA disabled by default), making unlimited spam submission trivial.

**Fix:**
Remove `trust proxy 1` when no proxy is deployed, or add a real reverse proxy (nginx/traefik) to the docker-compose stack that sets `X-Forwarded-For` authoritatively and strips client-supplied values. If a proxy is in front of a production deployment, `trust proxy 1` is correct but must not be used without one.

---

### FIND-03 — CAPTCHA Silently Disabled in All Deployments (No Secret Key Configured)

**ID:** FIND-03
**Severity:** HIGH
**Category:** Denial of Service / Tampering
**Location:** `src/services/CaptchaService.js:39-43`, `docker-compose.yml` (absent)

**Description:**
`CaptchaService.validate()` has this logic: if `CAPTCHA_SECRET_KEY` env var is not set, return `{ valid: true }` immediately — treating the absence of configuration as "CAPTCHA disabled". Neither `docker-compose.yml` nor `src/config/oidc.js` sets `CAPTCHA_SECRET_KEY`. Consequently, **all public submission endpoints** (opportunity submissions, contribution submissions, engagement requests) accept any CAPTCHA token or no token at all and proceed to DB writes and email notifications.

**Exploit:**
```bash
# No CAPTCHA token required — omit it entirely
curl -X POST http://api-host:3001/api/v1/engagement-requests \
  -H "Content-Type: application/json" \
  -d '{"record_id":"<valid-uuid>","request_type":"REQUEST_DEMO","requestor_name":"Bot","requestor_email":"bot@spam.com","requestor_office":"Spammers","description_of_interest":"automated spam content here"}'
# → 201 (persisted + routing email sent)
```
Combined with FIND-02 (rate-limit bypass), bots can flood the submission queues and routing email inbox without any friction.

**Fix:**
Set `CAPTCHA_SECRET_KEY` in docker-compose and all deployment configurations. Consider changing the fail-open behavior (`!secretKey → valid: true`) to fail-closed (`!secretKey → valid: false`, or throw at startup) so misconfiguration is immediately obvious rather than silently permissive.

---

### FIND-04 — Hardcoded Dev Session Secret Committed to Source

**ID:** FIND-04
**Severity:** MEDIUM
**Category:** Spoofing / Information Disclosure
**Location:** `src/config/oidc.js:13`, `docker-compose.yml:73`

**Description:**
Two weak session secrets are committed to the repository:
1. Code fallback in `src/config/oidc.js`: `'dev-session-secret-change-in-prod'`
2. docker-compose default: `"dev-preview-session-secret-not-for-production"`

If either secret is used in a staging or production deployment (or if the docker-compose compose file is used directly in a non-air-gapped environment), session cookies signed with these known secrets can be forged, granting CURATOR or ADMIN access without authentication.

**Fix:**
- Remove the hardcoded fallback from `src/config/oidc.js` and throw at startup if `SESSION_SECRET` is not set.
- In `docker-compose.yml`, replace the literal secret with `${SESSION_SECRET}` and require operators to supply it via a `.env` file (which is gitignored).

---

### FIND-05 — Missing HTTP Security Headers (No helmet / CSP / HSTS)

**ID:** FIND-05
**Severity:** MEDIUM
**Category:** Tampering / Information Disclosure
**Location:** `src/app.js` (absent — no helmet or equivalent)

**Description:**
The Express API has no security-header middleware. The following headers are absent from all responses:
- `X-Frame-Options` / `Content-Security-Policy frame-ancestors` — enables clickjacking on any page embedding an iframe
- `X-Content-Type-Options: nosniff` — enables MIME sniffing attacks
- `Strict-Transport-Security` — no HSTS on production HTTPS deployments
- `Content-Security-Policy` — no CSP to restrict script/style sources

**Fix:**
Add `helmet` as the first middleware in `createApp()`:
```js
const helmet = require('helmet');
app.use(helmet());
```

---

### FIND-06 — Internal Email Address Committed in Migration SQL

**ID:** FIND-06
**Severity:** LOW
**Category:** Information Disclosure
**Location:** `db/migrations/001_supporting_tables.sql:50,58`

**Description:**
The migration file hard-codes the real internal routing email address `AOml_TSO_IRB_Team@ao.uscourts.gov` in the `hub_settings` seed INSERT. This email is committed to the repository's history and is readable by anyone with repo access. The value can be changed via the admin settings UI without redeployment, but the original value is permanently visible in git history.

**Fix:**
Use a placeholder value (e.g., `admin@example.gov`) in the migration, and document that the real address must be set post-deployment via the Settings admin page or environment-specific seed.

---

### FIND-07 — `/healthz` Leaks Internal DB Error Messages

**ID:** FIND-07
**Severity:** LOW
**Category:** Information Disclosure
**Location:** `src/app.js:70`

**Description:**
```js
res.status(503).json({ status: 'error', message: err.message });
```
On DB connection failure, `err.message` from node-postgres can contain internal host names, IP addresses, port numbers, and error details (e.g., `connection to server at "db" (172.17.0.2), port 5432 failed: FATAL: password authentication failed`). This endpoint is publicly accessible with no authentication.

**Fix:**
Return a generic message for external callers:
```js
res.status(503).json({ status: 'error', message: 'Database connection unavailable.' });
```

---

## Accepted risks

| ID | Risk | Why accepted | Owner |
|----|------|--------------|-------|
| AR-01 | `DEV_AUTH_BYPASS=true` in docker-compose grants CURATOR access without OIDC | Intentional design for preview/dev environments; guarded by `NODE_ENV !== production`; clearly documented in comments. Remains a risk if docker-compose is used for staging. | Platform team |
| AR-02 | Search endpoint (`/api/v1/search`) has no rate limit | FTS via GIN index is fast; `plainto_tsquery` 500-char limit prevents pathological queries; per-page limit (max 50). DoS risk is low given resource constraints. Acceptable for current scale; add rate limit if traffic grows. | Platform team |
| AR-03 | DB credentials committed in docker-compose.yml | Standard practice for dev-only compose files with clearly named dev passwords; credentials are labeled as dev. Operators must supply real credentials via secrets manager for production. | Platform team |

---

## Audit trail

- **Diff scoped via:** entire develop branch (4 commits from repo inception; no `main` branch exists — audited HEAD directly)
- **Register:** built retroactively from diff (retroactive mode; no PLAN.md threat model)
- **Candidates examined:** 23 candidate attack-surface items assessed
- **Confirmed:** 7 total (FIND-01 through FIND-07); 2 HIGH, 1 HIGH (FIND-03), 1 MEDIUM (FIND-04), 1 MEDIUM (FIND-05), 1 LOW (FIND-06), 1 LOW (FIND-07)
- **Refuted (safe):** 16 candidates refuted — parameterized SQL throughout (Knex/pg), sanitize-html on all string inputs, role checks on all protected routes, PKCE OIDC state validation, 404-not-403 for draft record access prevention, `returnTo` redirect is path-only, publication scope enforced at query layer, X-Test-User gated on `NODE_ENV === 'test'`, SMTP credentials env-only
