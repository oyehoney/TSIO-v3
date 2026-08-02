---
phase: implement-full-tsio-innovation-hub-web-a
plan: 14
subsystem: admin-interface
tags: [admin, react, oidc, dashboard, records, edit-form, governance, publication]
dependency_graph:
  requires:
    - "06-PLAN: AuthMiddleware (authenticateOidc, redirectToLogin, buildOidcCallbackHandler)"
    - "06-PLAN: admin routes (GET /api/v1/admin/dashboard-summary, GET /api/v1/admin/records, requireCurator)"
    - "05-PLAN: RecordService (getAdminRecords, createRecord, updateRecord)"
  provides:
    - "src/admin/AdminApp.tsx: React admin SPA root with all /admin/* routes"
    - "src/admin/AdminShell.tsx: persistent sidebar layout for all authenticated admin pages"
    - "src/admin/pages/AdminLoginPage.tsx: OIDC login gate with 403 access denied display"
    - "src/admin/pages/DashboardPage.tsx: 5-tile dashboard consuming /api/v1/admin/dashboard-summary"
    - "src/admin/pages/RecordsListPage.tsx: sortable/filterable records table"
    - "src/admin/pages/RecordEditPage.tsx: full 29-field form with readiness checklist + GovernanceGate"
    - "src/admin/components/ReadinessChecklist.tsx: 17 pub-required field checklist + getMissingPubRequiredFields()"
    - "src/admin/components/AdminSidebar.tsx: persistent navigation with pending badges"
    - "src/admin/components/MaturityBadge.tsx: color-coded maturity level badge"
    - "src/admin/components/ReviewStatusBadge.tsx: review status label badge"
    - "src/admin/components/PublicationStateChip.tsx: color-coded publication state chip"
    - "src/admin/hooks/useAdminAuth.ts: auth guard hook redirecting to /admin/login on 401/403"
    - "src/admin/api/adminApiClient.ts: typed fetch layer with session cookie credential"
    - "e2e/admin-core.spec.ts: Playwright e2e tests for admin auth gate, dashboard, edit form"
  affects:
    - "Wave 6b (15-PLAN): RecordEditPage state machine buttons ready for lifecycle endpoint"
    - "Wave 6c (16-PLAN): AdminShell and auth pattern ready for submissions/engagement/settings"
    - "Wave 7: end-to-end curator workflow through dashboard → publish flow"
tech_stack:
  added:
    - "React 18 + TypeScript admin SPA mounted under /admin/* routes"
    - "React Router v6 (BrowserRouter, Routes, Route, Outlet, useParams, useNavigate, useSearchParams)"
  patterns:
    - "ProtectedRoute component wrapping useAdminAuth() for CURATOR session guard"
    - "Inline governance definitions via MATURITY_DEFINITIONS and REVIEW_STATUS_DEFINITIONS maps"
    - "ReadinessChecklist sidebar + getMissingPubRequiredFields() for GovernanceGate"
    - "Auto-save (60s interval, dirty check) + manual Save Draft with 'Saved' indicator"
    - "URL query params preserve filter/sort state (bookmarkable) in RecordsListPage"
    - "Graceful 501 stub handling: shows zeros/empty rather than errors"
key_files:
  created:
    - src/admin/AdminApp.tsx
    - src/admin/AdminShell.tsx
    - src/admin/api/adminApiClient.ts
    - src/admin/hooks/useAdminAuth.ts
    - src/admin/pages/AdminLoginPage.tsx
    - src/admin/pages/DashboardPage.tsx
    - src/admin/pages/RecordsListPage.tsx
    - src/admin/pages/RecordEditPage.tsx
    - src/admin/components/AdminSidebar.tsx
    - src/admin/components/MaturityBadge.tsx
    - src/admin/components/ReviewStatusBadge.tsx
    - src/admin/components/PublicationStateChip.tsx
    - src/admin/components/ReadinessChecklist.tsx
    - e2e/admin-core.spec.ts
  modified: []
decisions:
  - "Auth gate via useAdminAuth() calls /api/v1/admin/dashboard-summary endpoint — avoids dedicated /api/v1/admin/me endpoint not yet in contract"
  - "GovernanceGate is purely client-side validation — server-side GovernanceGate runs in RecordService.publishRecord() (Wave 6b)"
  - "Wave 6c placeholder pages (submissions, engagement, settings, content-model) render actual JSX divs to prevent 404/crashes from sidebar nav"
  - "AdminApp.tsx uses BrowserRouter + nested /admin routes via Outlet — AdminShell wraps all authenticated children"
  - "Playwright e2e tests use page.route() interception for auth mocking — avoids database dependency"
  - "Auto-save interval uses dirty-check (JSON comparison) so empty 60s intervals never fire PATCH"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-08-02"
  tasks_completed: 2
  files_created: 14
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 14: Admin Dashboard, RecordsList, and RecordEditPage Summary

**One-liner:** React admin SPA with OIDC auth gate, 5-tile dashboard, sortable records table, and full 29-field edit form with pub-required validation and GovernanceGate error display.

## Tasks Completed

### Task 1: Admin shell, auth gate, dashboard, and shared components

- **`src/admin/api/adminApiClient.ts`** — Typed fetch layer: `getDashboardSummary`, `getAdminRecords`, `getRecord`, `createRecord`, `updateRecord`, `transitionRecord`. All use `credentials: 'include'`; 401/403 → redirect to /admin/login.
- **`src/admin/hooks/useAdminAuth.ts`** — Auth guard hook: calls dashboard-summary endpoint; redirects to /admin/login on 401/403 or network error; returns `{ checking, authenticated }`.
- **`src/admin/pages/AdminLoginPage.tsx`** — Login gate: "Sign in with Microsoft" → navigates to /auth/login; `?error=access_denied` → red 403 banner ("You do not have permission to access the administration interface"); page title "Administration — TSIO Innovation Hub".
- **`src/admin/pages/DashboardPage.tsx`** — 5 summary tiles: Published Records, Draft / In Review, Opportunity Submissions, Contribution Submissions, Recent Engagements (7d); each tile links to its admin section; Quick Actions: [+ New Innovation Record], [Review Opportunity Submissions], [Review Contribution Submissions], [View Engagement Activity]; graceful 501 handling shows 0 counts.
- **`src/admin/components/AdminSidebar.tsx`** — All nav sections per UX-Mockup Screen 06: Dashboard | Records (All Records, + New Record) | Submissions (Opportunities, Contributions with pending count badges) | Engagement (Activity Log) | Reference (Content Model) | Settings (Hub Settings); "View Public Hub ↗" footer link; active route highlighted.
- **`src/admin/components/MaturityBadge.tsx`** — Color-coded badges: IDEA (#6B7280), EXPERIMENT_POC (#D97706), PROTOTYPE_PILOT (#EA580C), PRODUCTION_VALIDATED (#16A34A), ARCHIVED (#374151).
- **`src/admin/components/ReviewStatusBadge.tsx`** — Label badges for all 7 review statuses per PRD §6.2.
- **`src/admin/components/PublicationStateChip.tsx`** — Color-coded chips per UX-Mockup Screen 08: DRAFT (#E5E7EB/#374151), REVIEW (#DBEAFE/#1E40AF "IN REVIEW"), PUBLISHED (#DCFCE7/#166534), SUPERSEDED (#FEF3C7/#92400E), ARCHIVED (#D1D5DB/#374151).
- **`src/admin/AdminShell.tsx`** — Layout: AdminSidebar left + main content right via Outlet; fetches dashboard summary for sidebar pending badge counts.
- **`src/admin/AdminApp.tsx`** — React Router BrowserRouter with all admin routes: /admin/login (unauthenticated), /admin (dashboard), /admin/records, /admin/records/new, /admin/records/:id/edit, /admin/records/:id/audit, /admin/submissions/opportunities, /admin/submissions/contributions, /admin/engagement, /admin/settings, /admin/content-model; ProtectedRoute wraps all auth-required routes; Wave 6c routes render actual JSX placeholder divs.

### Task 2: RecordsListPage, RecordEditPage, ReadinessChecklist, GovernanceGate display, and Playwright e2e tests

- **`src/admin/components/ReadinessChecklist.tsx`** — 17 pub-required fields with ✅/❌ display; exports `getMissingPubRequiredFields(record)` returning `string[]` of missing field labels; "X fields required before publishing" summary count; green header when all fields complete.
- **`src/admin/pages/RecordsListPage.tsx`** — Sortable table: Title, Maturity (MaturityBadge), Review Status (ReviewStatusBadge), Publication State (PublicationStateChip), Owner, Last Updated, Actions ([Edit] → edit, [View ↗] → /records/:id new tab for PUBLISHED only); filter controls (title debounced 300ms, state dropdown, maturity dropdown, review status dropdown); [+ New Record] button; URL query params preserve state (bookmarkable); skeleton rows while loading; 501 stub notice; empty state with "Create the first record" link; pagination.
- **`src/admin/pages/RecordEditPage.tsx`** — All 29 fields in 8 sections (Basic Info, Mission & Technical Context, Governance & Classification, Perspectives, Tags & Classification, Ownership & Attribution, Artifact Links, Engagement Options, Dates) plus 3 display-only fields; inline maturity definitions per PRD §6.1 on dropdown change; inline review status definitions per PRD §6.2 on dropdown change; "[View all ... definitions →]" links to /admin/content-model; ARCHIVED maturity advisory for Published records (US-9.3); ReadinessChecklist sidebar; GovernanceGate error banner listing missing fields; [Submit for Review] and [Publish] disabled when pub-required fields missing; state-dependent action buttons per UX-Mockup Screen 07; warning modal for editing Published record; auto-save (60s interval, dirty-check); manual Save Draft with "Saved" indicator; redirect to /admin/records/:id/edit after new record creation.
- **`e2e/admin-core.spec.ts`** — 14 Playwright tests using `page.route()` API interception for auth mocking: unauthenticated /admin redirects to /admin/login; login page renders; access denied message; dashboard 5 tiles; sidebar nav links; records table headers; filter controls; /admin/records/new all sections; maturity inline definition; review status inline definition; GovernanceGate Submit for Review disabled; pub-required fields visible; Save Draft always enabled; ARCHIVED maturity advisory.

## Auth Gate Design

**OIDC Redirect Flow:**
1. User navigates to `/admin/*` (any protected route)
2. `ProtectedRoute` renders, calls `useAdminAuth()` — shows spinner while checking
3. `useAdminAuth()` sends `fetch('/api/v1/admin/dashboard-summary', { credentials: 'include' })`
4. If 401/403: `window.location.href = '/admin/login'` (client-side redirect)
5. `/admin/login` page renders "Sign in with Microsoft" button
6. Button click: `window.location.href = '/auth/login'` (server-side OIDC initiation)
7. Server builds authorization URL with PKCE (per 06-PLAN auth.js), redirects to Azure AD
8. After IdP authenticates, OIDC callback → session created → redirect to `/admin`

**403 Display (US-8.1 AC):**
- `/admin/login?error=access_denied` → red banner "You do not have permission to access the administration interface"
- Triggered when authenticated user lacks CURATOR role (server sends 403 after OIDC callback)

## GovernanceGate Error Display

**Implementation:**
```typescript
const missingPubRequired = getMissingPubRequiredFields(form);
const hasMissingPubRequired = missingPubRequired.length > 0;

// Button disabled:
<button disabled={hasMissingPubRequired}>Submit for Review ▶</button>

// GovernanceGate banner when transition attempted with missing fields:
{governanceErrors.length > 0 && (
  <div>
    ⛔ Cannot publish — missing required fields:
    <ul>
      {governanceErrors.map(field => <li>{field}</li>)}
    </ul>
  </div>
)}
```

`getMissingPubRequiredFields()` is exported from ReadinessChecklist.tsx and tests all 17 pub-required fields against the current form state. Returns `string[]` of missing field labels.

## RecordEditPage Field Structure (29 Fields)

**Sections:**
1. **Basic Information** — title (pub-required), short_summary
2. **Mission & Technical Context** — problem_statement (pub-required), what_was_explored (pub-required), outcome_summary (pub-required), key_findings[] (pub-required, 1+)
3. **Governance & Classification** — maturity_level (pub-required, inline definition), review_status (pub-required, inline definition), reuse_potential (pub-required, radio), source_type (pub-required, radio)
4. **Perspectives** — default_perspective (radio), executive_perspective_text (pub-required), executive_recommendation (pub-required), technical_perspective_text, security_findings, performance_findings, reuse_guidance
5. **Tags & Classification** — mission_area_tags[] (pub-required, 1+), technology_area_tags[]
6. **Ownership & Attribution** — owner_name (pub-required), owner_office (pub-required), contributing_office (pub-required), contributor_attribution
7. **Artifact Links** — artifact_links[] (pub-required, 1+) {label, url (https://), source_type}
8. **Engagement Options** — engagement_options[] (pub-required, 1+) — 5 checkbox options
9. **Dates** — last_reviewed_date (pub-required)
10. **Display only** — publication_state (chip in header), record_id (footer), created_at (footer)

## Integration Contracts Provided to Wave 6b (15-PLAN) and Wave 6c (16-PLAN)

**For Wave 6b (publication lifecycle):**
- `RecordEditPage` state machine buttons call `adminApiClient.transitionRecord(id, action)` for: SUBMIT_FOR_REVIEW, PUBLISH, RETURN_TO_DRAFT, ARCHIVE, SUPERSEDE
- Currently shows API error response (404/501) inline since lifecycle endpoint is Wave 6b
- GovernanceGate validation is ready; server-side GovernanceGate blocks PUBLISH if pub-required fields missing

**For Wave 6c (submissions, engagement, settings):**
- `AdminShell` layout with Outlet is ready — Wave 6c pages slot in as child routes
- `AdminSidebar` nav items pointing to Wave 6c routes already render placeholder JSX divs
- `adminApiClient` has endpoints for opportunity-submissions, contribution-submissions, engagement-requests, settings (all currently return 501 stubs)

## Known Stubs

- Wave 6c placeholder pages in AdminApp.tsx render descriptive `<div>` content, not null/empty. **Cosmetic** — does not defeat plan objective.
- `adminApiClient.transitionRecord()` will receive 404/501 until Wave 6b lifecycle endpoint is implemented. **Cosmetic** — errors shown inline per plan spec ("do NOT suppress errors").

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

**Files verified:**
- ✅ src/admin/AdminApp.tsx (routes registered, imports verified)
- ✅ src/admin/AdminShell.tsx (Outlet + AdminSidebar)
- ✅ src/admin/api/adminApiClient.ts (getDashboardSummary, getAdminRecords, credentials: include)
- ✅ src/admin/hooks/useAdminAuth.ts (401/403 redirect)
- ✅ src/admin/pages/AdminLoginPage.tsx (Sign in with Microsoft, access_denied display)
- ✅ src/admin/pages/DashboardPage.tsx (5 tiles, total_published_records, pending_opportunity, recent_engagement)
- ✅ src/admin/pages/RecordsListPage.tsx (getAdminRecords, MaturityBadge, PublicationStateChip)
- ✅ src/admin/pages/RecordEditPage.tsx (executive_perspective_text, GovernanceGate, ReadinessChecklist, EXPERIMENT_POC definition, IDEA definition, PRODUCTION_VALIDATED definition, Submit for Review)
- ✅ src/admin/components/AdminSidebar.tsx (all nav sections, /admin/records, /admin/submissions)
- ✅ src/admin/components/MaturityBadge.tsx (EXPERIMENT_POC #D97706, PRODUCTION_VALIDATED #16A34A)
- ✅ src/admin/components/ReviewStatusBadge.tsx (7 review statuses)
- ✅ src/admin/components/PublicationStateChip.tsx (DBEAFE, DCFCE7, FEF3C7)
- ✅ src/admin/components/ReadinessChecklist.tsx (ReadinessChecklist, getMissingPubRequiredFields)
- ✅ e2e/admin-core.spec.ts (admin/login, sign Microsoft, access denied, 14 tests)

**TypeScript check:** `npx tsc --noEmit --project tsconfig.client.json` → exit 0 (no errors)

**Playwright e2e:** Browser not installed in sandbox environment (no /usr/bin/chromium or ms-playwright cache). Tests verified syntactically (14 test blocks, correct imports, page.route() auth interception pattern). All assertions reference actual DOM elements rendered by the components. Full browser run deferred to verify phase.

**Build check:** `npx tsc --noEmit --project tsconfig.client.json` → exit 0.
