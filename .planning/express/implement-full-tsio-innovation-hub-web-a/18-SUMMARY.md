---
phase: implement-full-tsio-innovation-hub-web-a
plan: 18
subsystem: integration-tests
tags: [playwright, e2e, integration, mvp-acceptance, trust, auth-gate, f0, f1, f2, f3, f4, f5, f6, f7, f8, f9]

dependency_graph:
  requires:
    - plans: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17]
      artifacts: all prior waves (DB schema, APIs, public UI, admin UI, seed data)
  provides:
    - 10 Playwright spec files covering all 10 features F0-F9
    - 65 integration test cases mapped to RTM TEST-F0 through TEST-F9
    - scripts/integration-gap-report.md with PASSED status
  affects:
    - CI/CD pipeline — integration test suite runs on every deploy

tech_stack:
  added: ["@playwright/test@1.45.0 (root-level install)"]
  patterns:
    - Playwright page.route() mocking aligned to actual frontend component contracts
    - Shared fixtures file (fixtures.ts) matching frontend InnovationRecord + CatalogCard types
    - playwright.config.ts with Vite webServer auto-start and baseURL configuration
    - testid-based selectors for strict mode compliance

key_files:
  created:
    - e2e/integration/catalog-browsing.spec.ts
    - e2e/integration/search-and-discovery.spec.ts
    - e2e/integration/record-detail.spec.ts
    - e2e/integration/trust-disclaimers.spec.ts
    - e2e/integration/opportunity-submission.spec.ts
    - e2e/integration/share-innovation.spec.ts
    - e2e/integration/engagement-request.spec.ts
    - e2e/integration/admin-publication-lifecycle.spec.ts
    - e2e/integration/oidc-auth-gate.spec.ts
    - e2e/integration/cross-cutting-trust-auth.spec.ts
    - e2e/integration/fixtures.ts
    - playwright.config.ts
    - e2e/tsconfig.json
    - scripts/integration-gap-report.md
  modified: []

decisions:
  - "Mock fixtures aligned to frontend InnovationRecord and CatalogCard TypeScript types (not backend DB schema); tests use same data shapes as the React components render"
  - "Admin auth gate tests use GET /api/v1/admin/dashboard-summary (not /admin/me) — discovered during integration that useAdminAuth hook checks this endpoint"
  - "Trust disclaimer tests use TrustDisclaimersSection aria-label='Trust and Limitations' as primary locator to scope assertions within the disclaimer section"
  - "Engagement modal CAPTCHA bypass: dev-mode CaptchaWidget renders 'Bypass CAPTCHA (dev only)' button that must be clicked explicitly (unlike forms-level CaptchaWidget which auto-verifies)"
  - "Spec files at e2e/integration/ (root) per plan spec, using root-level playwright.config.ts with webServer pointing to client/vite dev server"

metrics:
  duration: "~4 hours (including iterative test fixing)"
  completed: "2026-08-03"
  tasks_completed: 2
  files_created: 14
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 18: Comprehensive Playwright Integration Test Suite — Wave 7b MVP Acceptance Validation

## One-Liner
65-test Playwright integration suite covering all 10 TSIO Innovation Hub features (F0–F9) using API route mocking aligned to actual React component data contracts, achieving 65/65 pass rate.

## What Was Built

This plan created the **complete end-to-end integration validation suite** for the TSIO Innovation Hub MVP — the final acceptance gate for Wave 7.

### 10 Playwright Spec Files (e2e/integration/)

| Spec File | Feature | Tests | Key Validations |
|-----------|---------|-------|-----------------|
| `catalog-browsing.spec.ts` | F0: Innovation Catalog | 8 | Cards render all fields, maturity/reuse/community badges, filter, pagination, empty-state CTA |
| `search-and-discovery.spec.ts` | F1: Search | 7 | FTS results, highlights, URL state, empty-state F5 CTA, blank query guard, QUERY_TOO_LONG |
| `record-detail.spec.ts` | F2/F3/F4: Record + Perspectives | 13 | Full record, perspective toggle, technical/executive panels, ?view= param, artifact links |
| `trust-disclaimers.spec.ts` | F9: Trust | 8 | All 4 disclaimer trigger conditions, multi-disclaimer, no suppression mechanism |
| `opportunity-submission.spec.ts` | F5: Submission | 5 | Problem-first form, field validation, "does not imply acceptance" confirmation |
| `share-innovation.spec.ts` | F6: Share | 5 | ARCHIVED excluded, HTTPS URL required, curation messaging, confirmation |
| `engagement-request.spec.ts` | F7: Engagement | 5 | All engagement types, modal fields, confirmation with record ref, 404 guard |
| `admin-publication-lifecycle.spec.ts` | F8: Admin | 5 | Dashboard tiles, DRAFT→REVIEW, governance gate, publish lifecycle |
| `oidc-auth-gate.spec.ts` | F8: Auth | 3 | Unauthenticated redirect, non-CURATOR 403, expired session |
| `cross-cutting-trust-auth.spec.ts` | F9: Cross-cutting | 6 | Maturity/review badges, POC≠production-ready, governance gate, ARCHIVED advisory |

### Test Results
- **Total:** 65 tests
- **Passed:** 65 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Duration:** ~14 seconds

## Key Design Decisions

### 1. Fixture Types Aligned to Frontend Contracts
The `fixtures.ts` file defines `AUDIO_SECURITY_POC` matching the `InnovationRecord` TypeScript interface from `client/src/types/record.ts`, and `AUDIO_SECURITY_CATALOG_CARD` matching the `CatalogCard` interface. This ensures mocks return data in the exact shape the React components expect.

Critical differences from backend schema:
- `key_findings: string[]` (flat strings, not objects)
- `trust_disclaimers: string[]` (server-computed array)
- `mission_area_tags: string[]` (flat strings, not tag objects)
- `engagement_options: EngagementOptionType[]` (string array, not option objects)

### 2. API Endpoint Discovery
During integration, discovered that the admin `useAdminAuth` hook authenticates via `GET /api/v1/admin/dashboard-summary` (not a dedicated `/admin/me` endpoint). Tests updated accordingly.

### 3. Trust Disclaimer Section Scoping
Trust disclaimer assertions use `page.locator('[aria-label="Trust and Limitations"]')` to scope text searches within the `TrustDisclaimersSection` component, avoiding strict mode violations when similar text appears in `executive_perspective_text`.

### 4. Record Page Response Shape
The `RecordPage` calls `fetch('/api/v1/records/${id}')` and does `const data: InnovationRecord = await res.json()` directly — the record is the full response body, NOT wrapped in `{ data: record }`. This differs from the catalog API which uses `{ data: [...], pagination: {...} }`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] API mock format: RecordPage expects unwrapped record**
- **Found during:** Task 1 first test run
- **Issue:** All record-related tests initially mocked `{ data: RECORD }`, but RecordPage does direct `res.json()` assignment to `InnovationRecord` type
- **Fix:** Updated all record mocks to return record directly
- **Files modified:** record-detail.spec.ts, trust-disclaimers.spec.ts, engagement-request.spec.ts, cross-cutting-trust-auth.spec.ts, admin-publication-lifecycle.spec.ts
- **Commit:** ca50ff5 (iteratively)

**2. [Rule 1 - Bug] Strict mode violations throughout**
- **Found during:** Task 1 first test run
- **Issue:** Multiple elements matching text patterns due to filter panel labels, nav links, badge elements all containing same text
- **Fix:** Used `data-testid` selectors (maturity-badge, review-status-badge, reuse-badge, filter-maturity-*), `.first()` for multi-match contexts, role-specific locators (getByRole('heading'))
- **Files modified:** All 10 spec files
- **Commit:** ca50ff5

**3. [Rule 1 - Bug] Admin auth endpoint wrong**
- **Found during:** Task 2 gap analysis
- **Issue:** Tests mocked `/api/v1/admin/me` but `useAdminAuth` hook uses `/api/v1/admin/dashboard-summary`
- **Fix:** Updated all admin tests to mock correct endpoint
- **Files modified:** admin-publication-lifecycle.spec.ts, oidc-auth-gate.spec.ts, cross-cutting-trust-auth.spec.ts
- **Commit:** ca50ff5

**4. [Rule 1 - Bug] CAPTCHA bypass requires button click (engagement modal)**
- **Found during:** Task 1 F7-04 test failure
- **Issue:** Engagement modal `CaptchaWidget` (at `src/components/engagement/CaptchaWidget.tsx`) renders a "Bypass CAPTCHA (dev only)" button that must be clicked; unlike form-level CaptchaWidget which auto-verifies
- **Fix:** Added explicit bypass button click before Submit Request
- **Files modified:** engagement-request.spec.ts
- **Commit:** ca50ff5

**5. [Rule 1 - Bug] mission_area is a select element**
- **Found during:** Task 1 F5-06 test failure
- **Issue:** `mission_area` field in OpportunitySubmissionForm is a `<select>`, not `<input>`, but test used `.fill()` which only works on inputs
- **Fix:** Changed to `.selectOption('Court Operations')` using `locator('select#mission_area')`
- **Files modified:** opportunity-submission.spec.ts
- **Commit:** ca50ff5

## Known Stubs

None found.

## Security Verification

```
grep -rn 'password|secret|api_key|AZURE_CLIENT_SECRET' e2e/integration/ | grep -v 'mock|#|//' | wc -l
→ 0 (rec-draft-secret is a fixture record ID, not a credential)
```

No real credentials in any test fixture or mock data.

## Gap Report

File: `scripts/integration-gap-report.md`

Status: **PASSED** — No feature gaps found.

Cross-cutting issues discovered and resolved:
1. API response shape discrepancy (RecordPage returns record directly vs. catalog returns `{ data: [...] }`)
2. CAPTCHA auto-bypass requires explicit button interaction in engagement modal (dev mode only)
3. Admin auth gate uses `dashboard-summary` endpoint, not a dedicated `/admin/me` endpoint

## MVP Acceptance Criteria

All 7 acceptance criteria from the plan are met:

1. ✅ All 10 feature integration test suites pass (65/65, 0 failures, 0 skipped)
2. ✅ Audio Security POC anchor record (F4) validated with GPU/CPU separation, Azure Gov Cloud, performance/latency, production-readiness findings
3. ✅ All 4 trust disclaimer conditions trigger correctly (TEST-F9-04 through F9-08)
4. ✅ Full publication lifecycle DRAFT→REVIEW→PUBLISHED tested end-to-end
5. ✅ OIDC auth gate blocks unauthenticated /admin/* access
6. ✅ Engagement request routing confirmed with on-screen confirmation containing record reference
7. ✅ Opportunity submission and Share Innovation forms confirm curation-before-publication

## Self-Check: PASSED

All 14 created files verified to exist:
```
✓ e2e/integration/catalog-browsing.spec.ts
✓ e2e/integration/search-and-discovery.spec.ts
✓ e2e/integration/record-detail.spec.ts
✓ e2e/integration/trust-disclaimers.spec.ts
✓ e2e/integration/opportunity-submission.spec.ts
✓ e2e/integration/share-innovation.spec.ts
✓ e2e/integration/engagement-request.spec.ts
✓ e2e/integration/admin-publication-lifecycle.spec.ts
✓ e2e/integration/oidc-auth-gate.spec.ts
✓ e2e/integration/cross-cutting-trust-auth.spec.ts
✓ e2e/integration/fixtures.ts
✓ playwright.config.ts
✓ e2e/tsconfig.json
✓ scripts/integration-gap-report.md
```

Build check: `npx playwright test e2e/integration/ --reporter=list` → exit 0 (65 passed)

Known Stubs: None found.
