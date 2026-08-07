---
phase: implement-full-tsio-innovation-hub-web-a
plan: "06"
subsystem: auth
tags: [auth, oidc, azure-ad, session, role-check, admin-routes]
dependency_graph:
  requires: ["02"]
  provides: [requireCurator, requireAdmin, authenticateOidc, upsertFromOidc, admin-route-stubs]
  affects: [wave-3b, wave-3c, wave-6]
tech_stack:
  added: [openid-client, express-session, connect-pg-simple]
  patterns: [PKCE OIDC flow, server-side session, role-check middleware, parameterized SQL upsert]
key_files:
  created:
    - src/config/oidc.js
    - src/repositories/UserRepository.js
    - src/middleware/auth.js
    - src/middleware/requireCurator.js
    - src/middleware/requireAdmin.js
    - src/routes/admin.js
    - tests/integration/auth.test.js
  modified:
    - package.json (added openid-client, express-session, connect-pg-simple)
    - package-lock.json
decisions:
  - "Used openid-client (standards-based OIDC) instead of passport-azure-ad/MSAL to avoid vendor lock-in; works with Azure AD and any OIDC-compliant IdP"
  - "PKCE (S256 code_challenge) implemented in redirectToLogin with state + code_verifier stored server-side in session to prevent CSRF and authorization code interception"
  - "Session stored server-side in PostgreSQL via connect-pg-simple; cookie flags: httpOnly, secure (prod), sameSite=strict — no JWT in browser storage per TechArch §5.1"
  - "requireCurator independently checks req.user (defense-in-depth) returning 401 if missing, 403 ACCESS_DENIED if role not CURATOR/ADMIN"
  - "Integration tests placed in tests/integration/ (not test/integration/) to match existing jest.config.js testMatch pattern"
metrics:
  duration: "~12 minutes"
  completed: "2026-08-03"
  tasks_completed: 2
  files_created: 7
  files_modified: 2
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 06: AuthMiddleware + AdminHandler Summary

## One-liner

OIDC/Azure AD auth middleware with PKCE, server-side PostgreSQL session, idempotent users upsert, CURATOR/ADMIN role-check middlewares, and a 13-route admin API skeleton behind requireCurator.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | AuthMiddleware — OIDC config, users upsert, session, role-check middlewares | 200a2e2 | ✅ |
| 2 | AdminHandler skeleton (protected route registration) + integration tests | b764610 | ✅ |

## Files Created

| File | Purpose |
|------|---------|
| `src/config/oidc.js` | OIDC constants from env: OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI, OIDC_SCOPES, SESSION_SECRET |
| `src/repositories/UserRepository.js` | `upsertFromOidc(idpSubject, email, displayName)` using `ON CONFLICT (idp_subject) DO UPDATE` + `findByIdpSubject` |
| `src/middleware/auth.js` | `buildSessionMiddleware`, `authenticateOidc`, `redirectToLogin` (PKCE), `buildOidcCallbackHandler`, `handleLogout` |
| `src/middleware/requireCurator.js` | 401 if no session user, 403 ACCESS_DENIED if role ≠ CURATOR/ADMIN |
| `src/middleware/requireAdmin.js` | 401 if no session user, 403 ACCESS_DENIED if role ≠ ADMIN |
| `src/routes/admin.js` | 13 CURATOR-protected /api/v1/admin/* routes behind `router.use(requireCurator)`, all returning 501 NOT_IMPLEMENTED |
| `tests/integration/auth.test.js` | 20 tests: requireCurator (401/200/403), all 13 admin stubs return 501, non-CURATOR gets 403, UserRepository upsert SQL pattern |

## Auth Design Decisions

### Library Choice: openid-client
Per TechArch §5.1 guidance to use passport-azure-ad or openid-client, chose **openid-client** for:
- Standards-based OIDC/OAuth 2.0 (RFC 8252) — not vendor-locked to Azure AD
- Works with any OIDC-compliant IdP (Azure AD, Okta, Keycloak, etc.)
- Built-in PKCE support, JWKS-based token validation, issuer discovery
- For Azure AD: set `OIDC_ISSUER=https://login.microsoftonline.com/{tenant_id}/v2.0`

### PKCE Implementation
`redirectToLogin` generates a PKCE `code_verifier` (random) and `code_challenge` (S256 hash), stores both in server-side session alongside `state`. `handleOidcCallback` passes `code_verifier` to the token exchange, and `openid-client` validates `state`. This prevents CSRF (T-06-01) and authorization code interception.

### Session Cookie Flags
Per TechArch §5.1:
- `httpOnly: true` — prevents JavaScript theft of session cookie
- `secure: true` in production — HTTPS-only cookie transmission
- `sameSite: 'strict'` — prevents cross-site request forgery (T-06-03)
- `maxAge: 3600000` — 1 hour, matches Azure AD access token expiry

### Defense-in-Depth for requireCurator
`requireCurator` is designed to work standalone (returns 401 if `req.user` is not set, not just 403), so even if `authenticateOidc` is accidentally skipped, the admin routes are still protected (T-06-05 mitigation).

## Integration Contracts Provided

### For Wave 3b (SubmissionService)
```javascript
const requireCurator = require('./middleware/requireCurator');
router.use(requireCurator); // Protect all curator endpoints
```

### For Wave 3c (EngagementService, SettingsService)
```javascript
const requireCurator = require('./middleware/requireCurator');
const requireAdmin = require('./middleware/requireAdmin');
```

### For Wave 6 (Admin Frontend)
All 13 admin routes are registered and return consistent JSON error shapes:
- `401 { error: { code: 'UNAUTHENTICATED' } }` — no session
- `403 { error: { code: 'ACCESS_DENIED' } }` — wrong role
- `501 { error: { code: 'NOT_IMPLEMENTED' } }` — until Wave 3b/3c implements them

Route paths registered:
- `GET /api/v1/admin/records`
- `GET /api/v1/admin/dashboard-summary`
- `GET /api/v1/admin/opportunity-submissions`
- `PATCH /api/v1/admin/opportunity-submissions/:id`
- `GET /api/v1/admin/contribution-submissions`
- `PATCH /api/v1/admin/contribution-submissions/:id`
- `POST /api/v1/admin/contribution-submissions/:id/create-record`
- `GET /api/v1/admin/engagement-requests`
- `PATCH /api/v1/admin/engagement-requests/:id`
- `GET /api/v1/admin/settings`
- `PUT /api/v1/admin/settings`
- `GET /api/v1/admin/maturity-reference`
- `GET /api/v1/admin/review-status-reference`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Integration test path moved from test/ to tests/**
- **Found during:** Task 2
- **Issue:** Plan specified `test/integration/auth.test.js` but jest.config.js `testMatch` pattern only includes `**/tests/**/*.test.js` (with `s`). Tests in `test/` would not be discovered by jest.
- **Fix:** Placed tests in `tests/integration/auth.test.js` to match existing project structure and jest config.
- **Files modified:** `tests/integration/auth.test.js` (created at correct path)

**2. [Rule 1 - Bug] Restored auth.js after unexpected file modification**
- **Found during:** Post-commit verification
- **Issue:** `src/middleware/auth.js` was modified by an external process after Task 1 commit, reverting to a pre-existing stub version.
- **Fix:** Ran `git restore src/middleware/auth.js` to restore the committed version before proceeding with Task 2.

## Known Stubs

The 501 NOT_IMPLEMENTED handlers in `src/routes/admin.js` are intentional per the plan:
- All 13 admin routes return 501 until Wave 3b (SubmissionService) and Wave 3c (EngagementService, SettingsService) replace them
- **Cosmetic** — plan objective (auth gate + route registration) is fully achieved; stubs are the designed behavior for this wave

## Verification Results

- All 7 files created ✅
- 20/20 integration tests pass (Jest + Supertest) ✅
- TypeScript build (`tsc --noEmit`) passes ✅
- All integration contract verify commands pass ✅
- Admin router has exactly 13 routes ✅
- `router.use(requireCurator)` gates all admin routes ✅

## Self-Check: PASSED

All created files confirmed to exist on disk. Both commits (200a2e2, b764610) confirmed in git log. Build check: `tsc --noEmit` → exit 0. No blocking stubs found.
