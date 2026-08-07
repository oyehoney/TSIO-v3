---
phase: implement-full-tsio-innovation-hub-web-a
plan: 14
subsystem: admin-frontend
tags: [react, admin-ui, oidc-auth, record-management, governance-gate, playwright]
dependency_graph:
  requires: [06-PLAN (auth middleware + admin route stubs), 05-PLAN (RecordService)]
  provides: [AdminApp, AdminShell, AdminLoginPage, DashboardPage, RecordsListPage, RecordEditPage, ReadinessChecklist, adminApiClient, useAdminAuth]
  affects: [Wave 6b (15-PLAN lifecycle controls), Wave 6c (16-PLAN supporting pages), Wave 7 integration]
tech_stack:
  added: []
  patterns: [React Router v6 nested routes, typed fetch layer, client-side auth gate, GovernanceGate error display, publication readiness checklist]
key_files:
  created:
    - client/src/admin/api/adminApiClient.ts
    - client/src/admin/hooks/useAdminAuth.ts
    - client/src/admin/AdminShell.tsx
    - client/src/admin/components/AdminSidebar.tsx
    - client/src/admin/components/MaturityBadge.tsx
    - client/src/admin/components/ReviewStatusBadge.tsx
    - client/src/admin/components/PublicationStateChip.tsx
    - client/src/admin/components/ReadinessChecklist.tsx
    - client/src/admin/pages/AdminLoginPage.tsx
    - client/src/admin/pages/DashboardPage.tsx
    - client/src/admin/pages/RecordsListPage.tsx
    - client/src/admin/pages/RecordEditPage.tsx
    - client/e2e/admin-core.spec.ts
  modified:
    - client/src/App.tsx (replace Wave 6 placeholder with AdminApp)
    - client/src/admin/AdminApp.tsx (wire EngagementActivityPage, SettingsPage, ContentModelReferencePage)
    - client/src/pages/admin/ContentModelReferencePage.tsx (full implementation from stub)
    - client/src/pages/admin/EngagementActivityPage.tsx (full implementation from stub)
    - client/src/pages/admin/SettingsPage.tsx (full implementation from stub)
    - client/src/pages/admin/submissions/ContributionSubmissionsPage.tsx (fix toast in loading state)
    - client/src/pages/admin/submissions/OpportunitySubmissionsPage.tsx (fix toast in loading state)
decisions:
  - "Admin auth gate uses client-side check (useAdminAuth calls dashboard-summary endpoint) as defense-in-depth UI; actual auth enforced server-side by requireCurator middleware"
  - "AdminApp mounted as nested React Router Routes under /admin/* in main App.tsx; uses relative paths (login, /, records) to match remaining path after /admin prefix"
  - "RecordEditPage uses inline style objects (not Tailwind) consistent with admin components pattern; Tailwind used in page-level components"
  - "GovernanceGate shows list of missing field names from getMissingPubRequiredFields(); Submit for Review and Publish disabled when any pub-required field missing"
  - "Playwright tests use page.route() mocks for all API calls — no live backend required for e2e testing"
metrics:
  duration: "~45 minutes"
  completed: "2026-08-03"
  tasks_completed: 2
  files_created: 13
  files_modified: 7
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 14: Admin Interface Core Summary

**One-liner:** OIDC auth gate, DashboardPage (5 summary tiles), RecordsListPage (sortable table), and RecordEditPage (all 29 fields with GovernanceGate error display and publication readiness checklist) using React Router v6 nested routes with inline style components.

## Tasks Completed

### Task 1: Admin shell, auth gate, dashboard, and shared components
**Commit:** `e6287bf`

Files created/modified:
- `client/src/admin/api/adminApiClient.ts` — typed fetch layer for all admin API calls
- `client/src/admin/hooks/useAdminAuth.ts` — auth guard hook; redirects to /admin/login on 401/403
- `client/src/admin/AdminShell.tsx` — layout shell with persistent AdminSidebar and `<Outlet>`
- `client/src/admin/components/AdminSidebar.tsx` — nav with Dashboard, Records, Submissions, Engagement, Reference, Settings sections
- `client/src/admin/components/MaturityBadge.tsx` — color-coded badge for 5 maturity levels per UX-Mockup
- `client/src/admin/components/ReviewStatusBadge.tsx` — label badge for 7 review statuses
- `client/src/admin/components/PublicationStateChip.tsx` — state chip for DRAFT/REVIEW/PUBLISHED/SUPERSEDED/ARCHIVED
- `client/src/admin/pages/AdminLoginPage.tsx` — OIDC login gate with "Sign in with Microsoft" + access_denied error display
- `client/src/admin/pages/DashboardPage.tsx` — 5 summary tiles from /api/v1/admin/dashboard-summary with Quick Actions
- `client/src/App.tsx` — replaced Wave 6 placeholder with `<AdminApp />`
- `client/src/admin/AdminApp.tsx` — wired EngagementActivityPage, SettingsPage, ContentModelReferencePage (Plan 16 additions)
- `client/src/pages/admin/ContentModelReferencePage.tsx` — full implementation (maturity + review status reference)
- `client/src/pages/admin/EngagementActivityPage.tsx` — full implementation (engagement requests log)
- `client/src/pages/admin/SettingsPage.tsx` — full implementation (hub settings management)

### Task 2: RecordsListPage, RecordEditPage (29 fields), ReadinessChecklist, GovernanceGate, Playwright tests
**Commit:** `bf8e8bd`

Files created:
- `client/src/admin/components/ReadinessChecklist.tsx` — 17 pub-required fields with ✅/❌; exports `getMissingPubRequiredFields()`
- `client/src/admin/pages/RecordsListPage.tsx` — sortable table with debounced filter controls and pagination
- `client/src/admin/pages/RecordEditPage.tsx` — full 29-field form with all governance features
- `client/e2e/admin-core.spec.ts` — 9 Playwright tests (all passing)
- `client/e2e/admin-supporting-pages.spec.ts` — Plan 16 supporting page tests

Files fixed:
- `client/src/pages/admin/submissions/ContributionSubmissionsPage.tsx` — toast persistence in loading state
- `client/src/pages/admin/submissions/OpportunitySubmissionsPage.tsx` — toast persistence in loading state

## Auth Gate Design (useAdminAuth pattern, OIDC redirect flow)

```
Browser → /admin                    Browser → /admin/login
     ↓                                    ↓
useAdminAuth()                      AdminLoginPage
     ↓                                    ↓
GET /api/v1/admin/dashboard-summary   "Sign in with Microsoft"
     ↓                                    ↓
  401/403 → window.location.href    window.location.href = '/auth/login'
            = '/admin/login'              ↓
  200 → authenticated = true       Server builds OIDC authorization URL
                                         ↓
                                    Browser → Azure AD OIDC
                                         ↓
                                    /auth/callback (server handles)
                                         ↓
                                    Creates session, redirects → /admin
```

The client-side auth gate (`useAdminAuth`) is defense-in-depth UI only. All data requires CURATOR-role session validated server-side by `requireCurator` middleware on every `/api/v1/admin/*` endpoint.

## GovernanceGate Error Display Implementation

```typescript
// In RecordEditPage.tsx
const handleSubmitForReview = () => {
  const missing = getMissingPubRequiredFields(form);
  if (missing.length > 0) {
    setGovernanceError(missing);  // shows error banner listing missing fields
    return;
  }
  handleTransition('SUBMIT_FOR_REVIEW');
};

// Submit for Review button is disabled when fields are missing:
<button disabled={!canTransition}>Submit for Review ▶</button>
```

The GovernanceGate error banner shows:
```
⛔ Cannot publish — missing required fields:
• Executive Perspective Text
• Last-Reviewed Date
...

Complete all required fields and try again.
```

## RecordEditPage Field Structure (All 29 Fields)

**Form fields (26):** Organized in sections per UX-Mockup Screen 07:
- Basic Information: title, short_summary
- Mission & Technical Context: problem_statement, what_was_explored, outcome_summary, key_findings[]
- Governance & Classification: maturity_level (with inline def), review_status (with inline def), reuse_potential, source_type
- Perspectives: default_perspective, executive_perspective_text, executive_recommendation, technical_perspective_text, security_findings, performance_findings, reuse_guidance
- Tags & Classification: mission_area_tags[], technology_area_tags[]
- Ownership & Attribution: owner_name, owner_office, contributing_office, contributor_attribution
- Artifact Links: artifact_links[] {label, url, source_type}
- Engagement Options: engagement_options[] (5 checkboxes)
- Dates: last_reviewed_date

**Display-only (3):** publication_state (PublicationStateChip in top bar), record_id (footer), created_at (footer)

## Publication Readiness Checklist (17 pub-required fields)

All 17 fields checked in `ReadinessChecklist.tsx`:
title, problem_statement, what_was_explored, outcome_summary, key_findings (1+), maturity_level, review_status, executive_perspective_text, executive_recommendation, reuse_potential, owner_name+office, contributing_office, source_type, mission_area_tags (1+), artifact_links (1+), engagement_options (1+), last_reviewed_date

## Integration Contracts Provided

### To Wave 6b (15-PLAN: lifecycle controls)
- `RecordEditPage` has state-dependent action buttons (DRAFT/REVIEW/PUBLISHED/SUPERSEDED/ARCHIVED)
- `adminApiClient.transitionRecord(id, action)` calls `POST /api/v1/admin/records/:id/lifecycle`
- `getMissingPubRequiredFields()` available for governance validation
- `ReadinessChecklist` component available for reuse

### To Wave 6c (16-PLAN: supporting pages)
- `AdminShell` layout available for all admin pages
- `useAdminAuth` hook for auth gating
- `adminApiClient` typed fetch layer
- `MaturityBadge`, `ReviewStatusBadge`, `PublicationStateChip` badge components

### To Wave 7 (integration validation)
- Full curator workflow: Dashboard → Records List → New Record → Edit (29 fields) → Submit for Review → Publish
- Playwright test harness: `page.route()` mocks for API responses

## Playwright Tests (9/9 Passing)

| Test | Status |
|------|--------|
| unauthenticated /admin redirects to /admin/login | ✅ |
| /admin/login shows sign-in button | ✅ |
| /admin/login with error=access_denied shows access denied message | ✅ |
| DashboardPage renders 5 summary tiles with data | ✅ |
| RecordsListPage renders table with column headers | ✅ |
| /admin/records/new renders all form sections | ✅ |
| maturity level dropdown shows inline definition | ✅ |
| GovernanceGate shows missing fields on Submit for Review | ✅ |
| AdminSidebar contains all navigation links | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing wiring] Wire Plan 16 supporting pages into AdminApp**
- **Found during:** Task 1 — discovered Plan 16 had EngagementActivityPage, SettingsPage, ContentModelReferencePage full implementations in working directory but AdminApp still had placeholders
- **Fix:** Added imports and wired routes in AdminApp.tsx; included full page implementations in Task 1 commit
- **Files modified:** client/src/admin/AdminApp.tsx, client/src/pages/admin/EngagementActivityPage.tsx, client/src/pages/admin/SettingsPage.tsx, client/src/pages/admin/ContentModelReferencePage.tsx
- **Commit:** e6287bf

**2. [Rule 1 - Bug] Fix Playwright test strict mode violations**
- **Found during:** Task 2 Playwright test run
- **Issue:** `getByText()` matched multiple elements (tile label + Quick Action link for dashboard; section header + checklist item for form sections)
- **Fix:** Added `.first()` to affected assertions in e2e/admin-core.spec.ts
- **Files modified:** client/e2e/admin-core.spec.ts
- **Commit:** bf8e8bd

**3. [Rule 1 - Bug] Fix submission page toast persistence**
- **Found during:** Task 2 — pre-existing uncommitted fix in working directory
- **Issue:** Toast was lost during loading state when navigating back from submission detail
- **Fix:** Added `&& !selectedSubmission` condition to loading check so toast renders
- **Files modified:** client/src/pages/admin/submissions/ContributionSubmissionsPage.tsx, client/src/pages/admin/submissions/OpportunitySubmissionsPage.tsx
- **Commit:** bf8e8bd

## Known Stubs

None. All components implement their full intended behavior. The Wave 6c placeholder pages in AdminApp were replaced with actual implementations. The lifecycle endpoint calls in RecordEditPage correctly show API error responses (404/501 from Wave 6b stub) as intended per the plan spec: "show them in a `<div style={{ color: 'red' }}>{error.message}</div>` error banner."

## Self-Check: PASSED

All required files verified to exist:
- ✅ client/src/admin/AdminApp.tsx
- ✅ client/src/admin/AdminShell.tsx  
- ✅ client/src/admin/pages/AdminLoginPage.tsx
- ✅ client/src/admin/pages/DashboardPage.tsx
- ✅ client/src/admin/pages/RecordsListPage.tsx
- ✅ client/src/admin/pages/RecordEditPage.tsx
- ✅ client/src/admin/components/AdminSidebar.tsx
- ✅ client/src/admin/components/MaturityBadge.tsx
- ✅ client/src/admin/components/ReviewStatusBadge.tsx
- ✅ client/src/admin/components/PublicationStateChip.tsx
- ✅ client/src/admin/components/ReadinessChecklist.tsx
- ✅ client/src/admin/hooks/useAdminAuth.ts
- ✅ client/src/admin/api/adminApiClient.ts
- ✅ client/e2e/admin-core.spec.ts

Build check: `npm run build` → exit 0 (vite production build, 99 modules, 395.65 kB JS)
TypeScript check: `tsc --noEmit` → exit 0 (no errors)
Playwright tests: 9/9 passing (`npx playwright test e2e/admin-core.spec.ts`)
