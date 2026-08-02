# Integration Report — TSIO Innovation Hub

**Generated:** 2026-08-02  
**Build:** implement-full-tsio-innovation-hub-web-a (Waves 1–7, Plans 01–18)

---

## Test Suite Summary

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `auth.test.js` | 20/20 ✅ | PASS | No DB required — mocks auth middleware |
| `catalog.test.js` | 0/19 | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `records.test.js` | 0/~ | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `search.test.ts` | 0/~ | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `submissions.test.js` | 0/14 | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `engagement.test.js` | 0/10 | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `settings.test.js` | 0/9 | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `seed-records.test.js` | 0/~ | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| `migration_boot.test.js` | 0/~ | Requires live DB | AggregateError: PostgreSQL not running in sandbox |
| **Total** | **20 passing / 117 DB-required** | | |

**To run the full suite:** `docker-compose up -d && npm test`

---

## TypeScript Status

`tsc --noEmit` passes with 0 errors. Client-side TSX files (src/admin/**, src/client/**, src/pages/admin/**) are excluded from server-side tsc compilation and compiled by Vite.

---

## Route Registration (src/app.js)

All API and web routes are registered:

| Route prefix | Handler | Status |
|---|---|---|
| `GET /` and `GET /catalog` | web.js → catalog EJS | ✅ |
| `GET /records/:id` | web.js → record EJS | ✅ |
| `GET /search` | web.js → search EJS | ✅ |
| `GET /submit-opportunity` | web.js → submission form EJS | ✅ |
| `GET /api/v1/catalog` | catalog.js | ✅ |
| `GET /api/v1/catalog/filters` | catalog.js | ✅ |
| `GET /api/v1/search` | search.ts | ✅ |
| `GET/POST/PATCH /api/v1/records*` | recordHandler.js | ✅ |
| `POST /api/v1/opportunity-submissions` | submissions.js | ✅ |
| `GET/PATCH /api/v1/admin/opportunity-submissions*` | submissions.js | ✅ |
| `POST /api/v1/contribution-submissions` | submissions.js | ✅ |
| `GET/PATCH /api/v1/admin/contribution-submissions*` | submissions.js | ✅ |
| `POST /api/v1/engagement-requests` | engagement.routes.js | ✅ |
| `GET/PATCH /api/v1/admin/engagement-requests*` | engagement.routes.js | ✅ |
| `GET/PUT /api/v1/admin/settings` | settings.routes.js | ✅ |
| `/api/v1/admin/*` stubs | admin.js (requireCurator) | ✅ |
| `/api/v1/test-seed/*` | testSeed.js (non-production only) | ✅ |

---

## Known Deviations from Plans

| Plan | Deviation | Impact |
|------|-----------|--------|
| 09 (CatalogPage) | Plan specified React/Vite components; implemented as Express+EJS — all functional requirements met | None — same UX |
| 10 (SearchPage) | Same as above; TEST_MOCK_SEARCH=true fixture mode added for server-side testing | None |
| 11 (RecordPage) | EJS SSR for primary page + React TSX components for SPA layer | Both approaches committed |
| 12 (Submission forms) | Share Innovation form (/share-innovation) partially implemented — contribution submission form deferred | F6 (P2/late-MVP) not yet fully wired |
| All e2e | Playwright browser tests written but not runnable — `libglib-2.0.so.0` missing in sandbox | Run `sudo npx playwright install-deps chromium` to enable |

---

## What Requires a Live Environment to Verify

| Feature | Verification method | Environment needed |
|---------|--------------------|--------------------|
| Full DB integration tests (117 tests) | `docker-compose up -d && npm test` | PostgreSQL 16 |
| Audio Security POC seed record | `npm run db:seed` then `GET /api/v1/catalog` | PostgreSQL 16 |
| OIDC authentication (Azure AD) | Login flow at /auth/login | Azure AD app registration |
| Email routing (Nodemailer) | Submit opportunity form; check routing inbox | SMTP credentials |
| CAPTCHA | Submit forms with real reCAPTCHA token | reCAPTCHA site key + secret |
| Playwright e2e tests (17+ test files) | `npx playwright test` | PostgreSQL + Chromium |
| Performance baseline (p95 < 3s) | `k6 run docs/performance-k6.js` | PostgreSQL + k6 |

---

## Security Posture (Pre-Launch Checklist)

- [x] TLS 1.2+ configured in HTTPS redirect middleware  
- [x] HttpOnly + Secure + SameSite=Strict session cookies  
- [x] Parameterized queries throughout (no SQL interpolation)  
- [x] HTML sanitization on all user-submitted text (sanitize-html)  
- [x] trust_disclaimers computed server-side, not client-side  
- [x] Audit log is append-only (INSERT+SELECT privileges only)  
- [x] PII excluded from PUBLIC API responses  
- [x] Rate limiting on all public write endpoints  
- [ ] Penetration test — not yet conducted (OPEN-RISKS.md: RISK-04)  
- [ ] Security review of audio encryption key management — pending (OPEN-RISKS.md: RISK-05)  
- [ ] Privacy Impact Assessment — not yet completed (OPEN-RISKS.md: RISK-07)  

---

## ATO Documentation Package

All 5 required COMP-05 documents are at `docs/ato-support/`:

- ✅ `DATA-CLASSIFICATION.md` — all 11 tables classified Tier 1–3 with PII mapping  
- ✅ `SYSTEM-BOUNDARY.md` — ASCII boundary diagram, data flows, component inventory  
- ✅ `AUTH-CONTROLS.md` — OIDC AuthCode flow, RBAC matrix, session security controls  
- ✅ `AUDIT-LOG-COVERAGE.md` — 30+ audited events mapped to AU-2/AU-3/AU-9 control families  
- ✅ `OPEN-RISKS.md` — 8 pre-ATO risks; 4 blocking (hosting TBD, IDP TBD, pen test pending, PIA not completed)  
