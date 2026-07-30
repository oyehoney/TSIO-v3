---
phase: implement-full-tsio-innovation-hub-web-a
plan: 14
type: execute
wave: 6
depends_on: [2, 3]
files_modified:
  - src/admin/AdminApp.tsx
  - src/admin/AdminShell.tsx
  - src/admin/pages/AdminLoginPage.tsx
  - src/admin/pages/DashboardPage.tsx
  - src/admin/pages/RecordsListPage.tsx
  - src/admin/pages/RecordEditPage.tsx
  - src/admin/components/AdminSidebar.tsx
  - src/admin/components/MaturityBadge.tsx
  - src/admin/components/ReviewStatusBadge.tsx
  - src/admin/components/PublicationStateChip.tsx
  - src/admin/components/ReadinessChecklist.tsx
  - src/admin/hooks/useAdminAuth.ts
  - src/admin/api/adminApiClient.ts
  - e2e/admin-core.spec.ts
autonomous: true

features:
  implements: ["F8", "F9"]
  depends_on: ["F8"]
  enables: ["F8", "F9"]

must_haves:
  truths:
    - "Unauthenticated requests to /admin/* redirect to /admin/login which redirects to OIDC authorization URL via GET /auth/login"
    - "After successful OIDC callback, authenticated curator is redirected to /admin and sees DashboardPage with 5 summary tiles"
    - "DashboardPage shows: total published records, draft/review records count, pending opportunity submissions, pending contribution submissions, recent engagement requests (last 7 days); all tiles link to their respective admin sections"
    - "RecordsListPage at /admin/records shows all records in all publication states in a sortable table with columns: Title, Maturity, Review Status, Publication State, Owner, Last Updated, and [Edit]/[View] actions"
    - "RecordEditPage at /admin/records/new and /admin/records/:id/edit renders all 29 fields in sections: Basic Info, Mission Context, Governance, Perspectives, Tags, Ownership, Artifact Links, Engagement Options, Dates"
    - "Maturity and Review Status dropdowns in RecordEditPage display inline definitions per the content model (5 maturity levels, 7 review statuses)"
    - "RecordEditPage Publication Readiness Checklist shows green checkmarks for complete pub-required fields and red X for missing; Save Draft is always enabled; Submit for Review is disabled when any pub-required field is missing"
    - "GovernanceGate error display lists specific missing fields when Submit for Review or Publish is attempted with incomplete pub-required fields"
    - "Admin sidebar is persistent across all /admin/* routes with sections: Dashboard, Records (All Records, + New Record), Submissions (Opportunities, Contributions with pending counts), Engagement (Activity Log), Reference (Content Model), Settings (Hub Settings)"
    - "All /admin/* routes require CURATOR session; non-authenticated users are redirected to /admin/login"
  artifacts:
    - path: "src/admin/AdminApp.tsx"
      provides: "Admin React app root with React Router routes for all /admin/* paths"
      exports: ["AdminApp"]
    - path: "src/admin/AdminShell.tsx"
      provides: "Shell layout with persistent AdminSidebar and main content area; wraps all authenticated admin routes"
      exports: ["AdminShell"]
    - path: "src/admin/pages/AdminLoginPage.tsx"
      provides: "Login gate page at /admin/login — shows 'Sign in with Microsoft' button that POSTs to /auth/login; displays 403 message for non-CURATOR authenticated users"
      exports: ["AdminLoginPage"]
    - path: "src/admin/pages/DashboardPage.tsx"
      provides: "Dashboard at /admin with 5 summary tiles from GET /api/v1/admin/dashboard-summary; Quick Actions; engagement activity; links to all admin sections"
      exports: ["DashboardPage"]
    - path: "src/admin/pages/RecordsListPage.tsx"
      provides: "Sortable table of ALL records at /admin/records; filter by state/maturity/review; [Edit] and [View] actions per row; + New Record button"
      exports: ["RecordsListPage"]
    - path: "src/admin/pages/RecordEditPage.tsx"
      provides: "Full 29-field record edit form at /admin/records/new and /admin/records/:id/edit; pub-required validation, readiness checklist, GovernanceGate error display, state transition actions"
      exports: ["RecordEditPage"]
    - path: "e2e/admin-core.spec.ts"
      provides: "Playwright e2e tests for admin auth gate, dashboard, records list, and record edit form"
  key_links:
    - from: "src/admin/hooks/useAdminAuth.ts"
      to: "/admin/login"
      via: "redirects unauthenticated users to /admin/login which redirects to GET /auth/login OIDC endpoint"
      pattern: "useAdminAuth|/admin/login|/auth/login"
    - from: "src/admin/pages/DashboardPage.tsx"
      to: "GET /api/v1/admin/dashboard-summary"
      via: "adminApiClient.getDashboardSummary() on mount"
      pattern: "dashboard-summary|getDashboardSummary"
    - from: "src/admin/pages/RecordsListPage.tsx"
      to: "GET /api/v1/admin/records"
      via: "adminApiClient.getAdminRecords(filters) on mount and filter change"
      pattern: "admin/records|getAdminRecords"
    - from: "src/admin/pages/RecordEditPage.tsx"
      to: "GovernanceGate error display"
      via: "validatePubRequiredFields() returns missing field names; displayed as error banner when transition is blocked"
      pattern: "GovernanceGate|validatePubRequired|missingFields"

integration_contracts:
  requires:
    - from_plan: "06"
      artifact: "src/middleware/auth.js"
      exports: ["authenticateOidc", "redirectToLogin", "buildOidcCallbackHandler"]
      verify: "grep -n 'authenticateOidc' src/middleware/auth.js && grep -n 'redirectToLogin' src/middleware/auth.js && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "src/routes/admin.js"
      exports: ["GET /api/v1/admin/dashboard-summary", "GET /api/v1/admin/records"]
      verify: "grep -n 'dashboard-summary' src/routes/admin.js && grep -n 'requireCurator' src/routes/admin.js && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "src/services/RecordService.js"
      exports: ["getAdminRecords", "createRecord", "updateRecord"]
      verify: "grep -n 'getAdminRecords\\|createRecord\\|updateRecord\\|RecordService' src/services/RecordService.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/admin/AdminApp.tsx"
      exports:
        - "AdminApp: root React component mounting all /admin/* routes"
        - "Route: /admin/login → AdminLoginPage"
        - "Route: /admin → DashboardPage (auth-gated)"
        - "Route: /admin/records → RecordsListPage (auth-gated)"
        - "Route: /admin/records/new → RecordEditPage (auth-gated)"
        - "Route: /admin/records/:id/edit → RecordEditPage (auth-gated)"
      shape: |
        // All /admin/* routes inside <AdminShell> which wraps authenticated content
        // Unauthenticated: <ProtectedRoute> redirects to /admin/login
        // AdminLoginPage handles OIDC redirect initiation (GET /auth/login)
      verify: "grep -n 'AdminLoginPage\\|DashboardPage\\|RecordsListPage\\|RecordEditPage' src/admin/AdminApp.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/pages/DashboardPage.tsx"
      exports:
        - "DashboardPage: renders 5 summary tiles from /api/v1/admin/dashboard-summary"
        - "Tiles: total_published_records, draft_review_records, pending_opportunity_submissions, pending_contribution_submissions, recent_engagement_requests_7d"
        - "Quick Actions links to /admin/records/new, /admin/submissions/opportunities, /admin/submissions/contributions, /admin/engagement"
      shape: |
        interface DashboardSummary {
          total_published_records: number;
          draft_review_records: number;
          pending_opportunity_submissions: number;
          pending_contribution_submissions: number;
          recent_engagement_requests_7d: number;
        }
      verify: "grep -n 'dashboard-summary\\|total_published\\|pending_opportunity' src/admin/pages/DashboardPage.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/pages/RecordEditPage.tsx"
      exports:
        - "RecordEditPage: all 29 record fields with pub-required validation"
        - "Publication state machine: DRAFT/REVIEW/PUBLISHED/SUPERSEDED/ARCHIVED state-dependent action buttons"
        - "GovernanceGate error display: lists missing pub-required fields when transition blocked"
        - "ReadinessChecklist: shows green/red per pub-required field"
        - "Inline maturity/review status definitions per F9 content model"
      shape: |
        // 29 fields: title, short_summary, problem_statement, what_was_explored,
        // outcome_summary, key_findings[], maturity_level, review_status,
        // reuse_potential, source_type, default_perspective,
        // executive_perspective_text, executive_recommendation,
        // technical_perspective_text, security_findings, performance_findings,
        // reuse_guidance, mission_area_tags[], technology_area_tags[],
        // owner_name, owner_office, contributing_office, contributor_attribution,
        // artifact_links[]{label,url,source_type}, engagement_options[],
        // last_reviewed_date, publication_state (display only)
        // Pub-required for transition to REVIEW/PUBLISHED: title, problem_statement,
        //   what_was_explored, outcome_summary, key_findings (1+),
        //   maturity_level, review_status, executive_perspective_text,
        //   executive_recommendation, reuse_potential, owner_name, owner_office,
        //   contributing_office, source_type, mission_area_tags (1+),
        //   artifact_links (1+), engagement_options (1+), last_reviewed_date
      verify: "grep -n 'executive_perspective_text\\|GovernanceGate\\|readiness\\|pub_required\\|ReadinessChecklist' src/admin/pages/RecordEditPage.tsx && echo CONTRACT_OK"
    - artifact: "e2e/admin-core.spec.ts"
      exports:
        - "Playwright tests: unauthenticated /admin redirect, dashboard renders 5 tiles, records list table, record edit form renders all sections"
      verify: "grep -n 'admin/login\\|DashboardPage\\|RecordsListPage\\|RecordEditPage\\|readiness' e2e/admin-core.spec.ts && echo CONTRACT_OK"
---

<objective>
Build **Wave 6a** of the admin interface: OIDC login redirect gate, DashboardPage (5 summary tiles), RecordsListPage (sortable table of all records in all states), and RecordEditPage (all 29 fields with inline maturity/review status definitions, pub-required field validation, GovernanceGate error display, and publication state machine).

Purpose: This is the operational backbone of F8 (Curation and Administration). The curator cannot create, edit, or publish records without this interface. It depends on Wave 2 (RecordService) and Wave 3 (AuthMiddleware + admin route stubs) being in place. Wave 6b (publication lifecycle controls) and Wave 6c (submissions pages, engagement log, settings) build on top of the auth gate and core record management established here.

Output:
- `src/admin/AdminApp.tsx` — root React app with all admin routes
- `src/admin/AdminShell.tsx` — persistent sidebar layout shell
- `src/admin/pages/AdminLoginPage.tsx` — OIDC login redirect gate
- `src/admin/pages/DashboardPage.tsx` — 5-tile dashboard consuming GET /api/v1/admin/dashboard-summary
- `src/admin/pages/RecordsListPage.tsx` — sortable/filterable records table consuming GET /api/v1/admin/records
- `src/admin/pages/RecordEditPage.tsx` — 29-field edit form with readiness checklist, inline governance definitions, GovernanceGate error display
- `src/admin/components/` — shared admin badge/chip/checklist components
- `src/admin/hooks/useAdminAuth.ts` — auth guard hook
- `src/admin/api/adminApiClient.ts` — typed admin API fetch layer
- `e2e/admin-core.spec.ts` — Playwright e2e tests
</objective>

<feature_dependencies>
Implements: F8: Curation and Administration — OIDC login gate, DashboardPage (summary counts), RecordsListPage (all-states table), RecordEditPage (all 29 fields, pub-required validation, GovernanceGate error display); F9: Content, Maturity & Trust Model — inline maturity/review status definitions in edit form dropdowns, publication readiness checklist, ReadinessChecklist component
Depends on: F8: AuthMiddleware from Wave 3a (06-PLAN.md) for OIDC session validation; admin route stubs from 06-PLAN.md (GET /api/v1/admin/dashboard-summary, GET /api/v1/admin/records); RecordService from Wave 2c (05-PLAN.md) for record CRUD
Enables: F8: Wave 6b publication lifecycle controls (builds on RecordEditPage state machine shell); Wave 6c admin supporting pages (reuse AdminShell and auth pattern); Wave 7 integration validation (end-to-end curator workflow from dashboard through publish)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/06-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md
@project_specs/UserStories-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Admin shell, auth gate, dashboard, and shared components</name>
  <files>
    src/admin/AdminApp.tsx
    src/admin/AdminShell.tsx
    src/admin/pages/AdminLoginPage.tsx
    src/admin/pages/DashboardPage.tsx
    src/admin/components/AdminSidebar.tsx
    src/admin/components/MaturityBadge.tsx
    src/admin/components/ReviewStatusBadge.tsx
    src/admin/components/PublicationStateChip.tsx
    src/admin/hooks/useAdminAuth.ts
    src/admin/api/adminApiClient.ts
  </files>
  <action>
Create the admin React app foundation: routing shell, OIDC auth gate, Dashboard, sidebar navigation, and shared badge/chip components. Ground every design decision in UX-Mockup Screen 06 (Admin Dashboard) and Screen 08 (Records List).

**Pivota Preview compatibility (mandatory):**
- Dev server MUST bind to `0.0.0.0:3000` (set in vite.config.ts / package.json start script)
- Do NOT emit `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` headers
- Every nav item must point to a real route

---

### Technology stack (use project's existing stack — check package.json):
- React + TypeScript (Vite or CRA per existing setup)
- React Router v6 (`<Routes>` + `<Route>`)
- TailwindCSS for styling (if project uses it) OR inline style objects (if not)
- Fetch API for API calls (no axios dependency unless already in package.json)

---

### `src/admin/api/adminApiClient.ts`

Typed fetch layer for all admin API calls. All requests include credentials (session cookie).

```typescript
// Base URL from environment; defaults to empty string (same-origin)
const API_BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send session cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    // Redirect to login for auth failures
    window.location.href = '/admin/login';
    throw new Error(`Auth error: ${res.status}`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error?.message || `HTTP ${res.status}`), {
      status: res.status,
      code: body?.error?.code,
      fields: body?.error?.fields,
    });
  }
  return res.json();
}

export interface DashboardSummary {
  total_published_records: number;
  draft_review_records: number;
  pending_opportunity_submissions: number;
  pending_contribution_submissions: number;
  recent_engagement_requests_7d: number;
}

export interface AdminRecord {
  record_id: string;
  title: string;
  maturity_level: string;
  review_status: string;
  publication_state: string;
  owner_name: string | null;
  owner_office: string | null;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; page_size: number; total_count: number; total_pages: number };
}

export const adminApiClient = {
  getDashboardSummary: () =>
    apiFetch<DashboardSummary>('/api/v1/admin/dashboard-summary'),

  getAdminRecords: (params?: {
    title?: string;
    publication_state?: string;
    maturity_level?: string;
    review_status?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])).toString()
      : '';
    return apiFetch<PaginatedResponse<AdminRecord>>(`/api/v1/admin/records${qs}`);
  },

  getRecord: (id: string) =>
    apiFetch<Record<string, unknown>>(`/api/v1/admin/records/${id}`),

  createRecord: (data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>('/api/v1/admin/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (id: string, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/api/v1/admin/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  transitionRecord: (id: string, action: string, data?: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/api/v1/admin/records/${id}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    }),
};
```

---

### `src/admin/hooks/useAdminAuth.ts`

Auth guard hook. Checks for session by calling GET /api/v1/admin/dashboard-summary (a CURATOR-only endpoint). If 401/403, redirects to /admin/login.

```typescript
import { useEffect, useState } from 'react';

export function useAdminAuth() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard-summary', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          window.location.href = '/admin/login';
        }
      })
      .catch(() => {
        window.location.href = '/admin/login';
      })
      .finally(() => setChecking(false));
  }, []);

  return { checking, authenticated };
}
```

---

### `src/admin/components/AdminSidebar.tsx`

Persistent sidebar per UX-Mockup Screen 06 Admin Navigation Sidebar. All nav items link to real routes. Active route highlighted. Pending counts fetched from DashboardSummary (passed as prop).

```typescript
// Sections per mockup:
// Dashboard → /admin
// RECORDS: All Records → /admin/records, + New Record → /admin/records/new
// SUBMISSIONS: Opportunities → /admin/submissions/opportunities (badge: pendingOpportunities)
//              Contributions → /admin/submissions/contributions (badge: pendingContributions)
// ENGAGEMENT: Activity Log → /admin/engagement
// REFERENCE: Content Model → /admin/content-model
// SETTINGS: Hub Settings → /admin/settings
// Footer: "View Public Hub ↗" → /catalog (new tab)
```

Mark current route using `useLocation()` from react-router-dom for active highlighting.

---

### `src/admin/components/MaturityBadge.tsx`

Color-coded maturity badge per UX-Mockup Color System (Section Overview):
- IDEA → Gray `#6B7280`
- EXPERIMENT_POC → Yellow/Amber `#D97706`
- PROTOTYPE_PILOT → Orange `#EA580C`
- PRODUCTION_VALIDATED → Green `#16A34A`
- ARCHIVED → Dark Gray `#374151`

Display label: "Idea" | "Experiment / POC" | "Prototype / Pilot" | "Production / Validated" | "Archived"

```typescript
interface MaturityBadgeProps { level: string; small?: boolean; }
```

---

### `src/admin/components/ReviewStatusBadge.tsx`

Review status badge with human-readable label. No color differentiation required (plain label badge). Labels per PRD Section 6.2:
- SUBMITTED → "Submitted"
- CURATED → "Curated"
- TECHNICALLY_REVIEWED → "Technically Reviewed"
- SECURITY_REVIEWED → "Security Reviewed"
- POLICY_REVIEWED → "Policy Reviewed"
- VALIDATED_FOR_REUSE → "Validated for Reuse"
- SUPERSEDED_RETIRED → "Superseded / Retired"

---

### `src/admin/components/PublicationStateChip.tsx`

State chip per UX-Mockup Screen 08 State Chips Color Coding:
- DRAFT → `#E5E7EB` bg / `#374151` text
- REVIEW → `#DBEAFE` bg / `#1E40AF` text, label "IN REVIEW"
- PUBLISHED → `#DCFCE7` bg / `#166534` text
- SUPERSEDED → `#FEF3C7` bg / `#92400E` text
- ARCHIVED → `#D1D5DB` bg / `#374151` text

---

### `src/admin/pages/AdminLoginPage.tsx`

Login gate at `/admin/login`. Renders a "Sign in with Microsoft" button that navigates to GET /auth/login (which server-side redirects to OIDC authorization URL). If user arrives with a `?error=access_denied` query param (bounced by auth middleware because they authenticated but lack CURATOR role), show: "You do not have permission to access the administration interface." (per UserStory US-8.1 AC).

```typescript
// Route: /admin/login
// Behavior:
//   - If already authenticated (session exists): redirect to /admin via window.location
//   - "Sign in with Microsoft" button → window.location.href = '/auth/login'
//   - error=access_denied → show 403 message (dark red banner)
//   - Page title: "Administration — TSIO Innovation Hub"
// IMPORTANT: No X-Frame-Options headers, no CSP frame-ancestors restrictions
```

---

### `src/admin/pages/DashboardPage.tsx`

Dashboard at `/admin` per UX-Mockup Screen 06.

**5 summary tiles from GET /api/v1/admin/dashboard-summary:**
1. **Published Records** — `total_published_records` count; links to `/admin/records?state=published`
2. **Draft / In Review** — `draft_review_records` count; links to `/admin/records?state=draft,review`
3. **Opportunity Submissions** — `pending_opportunity_submissions`; links to `/admin/submissions/opportunities`
4. **Contribution Submissions** — `pending_contribution_submissions`; links to `/admin/submissions/contributions`
5. **Recent Engagements (7d)** — `recent_engagement_requests_7d`; links to `/admin/engagement`

**Quick Actions (per mockup):**
- [+ New Innovation Record] → `/admin/records/new`
- [Review Opportunity Submissions] → `/admin/submissions/opportunities`
- [Review Contribution Submissions] → `/admin/submissions/contributions`
- [View Engagement Activity] → `/admin/engagement`

Loading state: skeleton tiles while fetching. Error state: "Dashboard data unavailable." with retry button.

NOTE: GET /api/v1/admin/dashboard-summary returns 501 from Wave 3a stub until Wave 2c RecordService implements it. Show "Dashboard loading..." or "0" counts gracefully on 501.

---

### `src/admin/AdminShell.tsx`

Layout shell wrapping authenticated admin pages. Renders `<AdminSidebar>` on left, main content on right. Passes pending counts from DashboardSummary to sidebar for badge display. Sidebar is persistent across all /admin/* child routes.

```typescript
// Structure:
// <div style={{ display: 'flex', minHeight: '100vh' }}>
//   <AdminSidebar pendingOpportunities={...} pendingContributions={...} />
//   <main style={{ flex: 1, padding: '24px' }}>
//     <Outlet />  {/* React Router nested route outlet */}
//   </main>
// </div>
```

---

### `src/admin/AdminApp.tsx`

Root React component. Sets up React Router with all admin routes. Unauthenticated routes redirect via `<ProtectedRoute>` which calls `useAdminAuth()` and shows loading spinner while checking.

```typescript
// Routes:
// /admin/login         → <AdminLoginPage /> (no auth required)
// /admin               → <AdminShell><DashboardPage /></AdminShell>  (auth required)
// /admin/records       → <AdminShell><RecordsListPage /></AdminShell>  (auth required)
// /admin/records/new   → <AdminShell><RecordEditPage /></AdminShell>  (auth required)
// /admin/records/:id/edit → <AdminShell><RecordEditPage /></AdminShell>  (auth required)
// /admin/records/:id/audit → <AdminShell><div>Audit History (placeholder)</div></AdminShell>
// /admin/submissions/opportunities → <AdminShell><div>Opportunity Submissions (Wave 6c)</div></AdminShell>
// /admin/submissions/contributions → <AdminShell><div>Contribution Submissions (Wave 6c)</div></AdminShell>
// /admin/engagement    → <AdminShell><div>Engagement Activity (Wave 6c)</div></AdminShell>
// /admin/settings      → <AdminShell><div>Hub Settings (Wave 6c)</div></AdminShell>
// /admin/content-model → <AdminShell><div>Content Model Reference (Wave 6c)</div></AdminShell>

// IMPORTANT: Wave 6c placeholder pages MUST return actual JSX divs — not null, not empty strings.
// Nav items pointing to these routes must render without 404/crash.
```
  </action>
  <verify>
grep -n 'AdminLoginPage\|DashboardPage\|RecordsListPage\|RecordEditPage' src/admin/AdminApp.tsx && echo "ROUTES_REGISTERED"
grep -n 'dashboard-summary\|getDashboardSummary' src/admin/api/adminApiClient.ts && echo "API_CLIENT_OK"
grep -n 'useAdminAuth\|/admin/login' src/admin/hooks/useAdminAuth.ts && echo "AUTH_HOOK_OK"
grep -n 'AdminSidebar\|/admin/records\|/admin/submissions' src/admin/components/AdminSidebar.tsx && echo "SIDEBAR_OK"
grep -n 'EXPERIMENT_POC\|D97706\|16A34A' src/admin/components/MaturityBadge.tsx && echo "MATURITY_BADGE_OK"
grep -n 'DBEAFE\|DCFCE7\|FEF3C7' src/admin/components/PublicationStateChip.tsx && echo "STATE_CHIP_OK"
grep -n 'total_published_records\|pending_opportunity\|recent_engagement' src/admin/pages/DashboardPage.tsx && echo "DASHBOARD_TILES_OK" && echo CONTRACT_OK
  </verify>
  <done>
- `src/admin/AdminApp.tsx` registers all admin routes: /admin/login (unauthenticated), /admin (dashboard), /admin/records, /admin/records/new, /admin/records/:id/edit, /admin/records/:id/audit, /admin/submissions/opportunities, /admin/submissions/contributions, /admin/engagement, /admin/settings, /admin/content-model — Wave 6c routes show placeholder divs (not empty/null)
- `src/admin/hooks/useAdminAuth.ts` checks auth by calling dashboard-summary endpoint; redirects to /admin/login on 401/403
- `src/admin/pages/AdminLoginPage.tsx` shows "Sign in with Microsoft" → navigates to /auth/login; shows 403 message when error=access_denied present in URL
- `src/admin/pages/DashboardPage.tsx` fetches GET /api/v1/admin/dashboard-summary and renders 5 tiles (published, draft/review, opportunity submissions, contribution submissions, recent engagements 7d); each tile links to its admin section; Quick Actions with 4 links; graceful loading and 501 handling
- `src/admin/components/AdminSidebar.tsx` renders all nav sections per mockup with correct routes; active route highlighted; pending badges on Opportunities and Contributions
- `src/admin/components/MaturityBadge.tsx` renders color-coded badge for all 5 maturity levels per UX-Mockup color system
- `src/admin/components/ReviewStatusBadge.tsx` renders label badge for all 7 review statuses
- `src/admin/components/PublicationStateChip.tsx` renders color-coded state chip for DRAFT/REVIEW/PUBLISHED/SUPERSEDED/ARCHIVED per mockup specs
- `src/admin/api/adminApiClient.ts` exports typed fetch functions: getDashboardSummary, getAdminRecords, getRecord, createRecord, updateRecord, transitionRecord — all use `credentials: 'include'`; 401/403 → redirect to /admin/login
  </done>

  <feature_dependencies>
  Implements: F8: Curation and Administration — admin shell, OIDC login gate, Dashboard with 5 summary tiles; F9: Content, Maturity & Trust Model — MaturityBadge with color coding, ReviewStatusBadge with labels, PublicationStateChip
  Depends on: F8: Wave 3a AuthMiddleware (06-PLAN) for OIDC session + /auth/login redirect endpoint; Wave 3a admin route stubs for /api/v1/admin/dashboard-summary
  Enables: F8: RecordsListPage (Task 2) consumes AdminShell and shared components; Wave 6b/6c consume AdminShell, sidebar, auth pattern
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: RecordsListPage, RecordEditPage (all 29 fields), ReadinessChecklist, GovernanceGate display, and Playwright e2e tests</name>
  <files>
    src/admin/pages/RecordsListPage.tsx
    src/admin/pages/RecordEditPage.tsx
    src/admin/components/ReadinessChecklist.tsx
    e2e/admin-core.spec.ts
  </files>
  <action>
Implement RecordsListPage (sortable/filterable table of all records) and RecordEditPage (full 29-field form with readiness checklist, inline governance definitions, GovernanceGate error display, and state-dependent action buttons). Ground every field and governance rule in UX-Mockup Screen 07 (Record Create/Edit) and Screen 08 (Records List), UserStories US-2.2, US-2.3, US-8.2, US-8.3, US-9.3.

---

### `src/admin/pages/RecordsListPage.tsx`

Sortable table of ALL records per UX-Mockup Screen 08.

**Columns (per mockup):**
- Title (sortable, click to open edit view)
- Maturity (`<MaturityBadge>`)
- Review Status (`<ReviewStatusBadge>`)
- Publication State (`<PublicationStateChip>`)
- Owner
- Last Updated (default sort, descending)
- Actions: [Edit] → `/admin/records/{id}/edit`; [View] → `/records/{id}` (new tab, only for PUBLISHED records)

**Filter controls (above table):**
- Title text search (debounced 300ms)
- State dropdown: All | DRAFT | REVIEW | PUBLISHED | SUPERSEDED | ARCHIVED
- Maturity dropdown: All | IDEA | EXPERIMENT_POC | PROTOTYPE_PILOT | PRODUCTION_VALIDATED | ARCHIVED
- Review Status dropdown

**[+ New Record] button:** navigates to `/admin/records/new`

**Pagination:** from API response `pagination` object; previous/next + page numbers.

**Empty state:** "No records exist yet. [+ Create the first record]"

**Implementation:**

```typescript
// Fetch on mount and on filter/sort change:
//   GET /api/v1/admin/records?title=...&publication_state=...&sort_by=updated_at&sort_dir=desc&page=1&page_size=20
// Use adminApiClient.getAdminRecords(params)
// While fetching: skeleton table rows
// On 501 (stub not yet implemented by Wave 2c): show "Records list unavailable — service not yet implemented."
```

**Sortable columns:** clicking column header toggles asc/desc sort; updates URL query params so filter state is bookmarkable.

---

### `src/admin/components/ReadinessChecklist.tsx`

Publication readiness checklist per UX-Mockup Screen 07. Shows green ✅ or red ❌ for each pub-required field.

**Pub-required fields (17 total per UX-Mockup):**
1. Title
2. Problem Statement
3. What Was Explored
4. Outcome Summary
5. Key Findings (1+)
6. Maturity Level
7. Review Status
8. Executive Perspective Text
9. Executive Recommendation
10. Reuse Potential
11. Owner Name + Office
12. Contributing Office
13. Source Type
14. Mission Area Tags (1+)
15. Artifact Links (1+)
16. Engagement Options (1+)
17. Last-Reviewed Date

```typescript
interface ReadinessChecklistProps {
  record: Partial<RecordFormValues>;
}
// Returns: checklist items with pass/fail, count of missing fields
// Also exports: getMissingPubRequiredFields(record) => string[] of missing field names
//   (used by GovernanceGate error display)
```

Show: "X fields required before publishing" count below checklist per mockup.

---

### `src/admin/pages/RecordEditPage.tsx`

Full 29-field record create/edit form per UX-Mockup Screen 07. This is the most complex component in Wave 6a.

**All 29 fields organized in sections (per mockup):**

**BASIC INFORMATION:**
1. `title` — required; 5–200 chars
2. `short_summary` — required; max 280 chars; char counter "X / 280"

**MISSION & TECHNICAL CONTEXT:**
3. `problem_statement` — required; 50–5000 chars; textarea
4. `what_was_explored` — required; 50–5000 chars; textarea
5. `outcome_summary` — required; 50–3000 chars; textarea
6. `key_findings[]` — required; 1–20 items; dynamic list with [+ Add Finding] and [× remove] per item

**GOVERNANCE & CLASSIFICATION:**
7. `maturity_level` — required for publication; dropdown with inline definition displayed below selection
8. `review_status` — required for publication; dropdown with inline definition displayed below selection
9. `reuse_potential` — required; radio: High / Medium / Low
10. `source_type` — required; radio: I&R-Conducted (IIR) / Community-Contributed (COMMUNITY)

**PERSPECTIVES:**
11. `default_perspective` — radio: Executive / Technical
12. `executive_perspective_text` — pub-required; 50–3000 chars; textarea; red "REQUIRED — not yet filled" placeholder until content entered
13. `executive_recommendation` — pub-required; 50–1000 chars; textarea; red "REQUIRED" placeholder
14. `technical_perspective_text` — optional; 50–5000 chars; textarea
15. `security_findings` — optional; textarea
16. `performance_findings` — optional; textarea
17. `reuse_guidance` — optional; textarea

**TAGS & CLASSIFICATION:**
18. `mission_area_tags[]` — pub-required (1+); tag chips with [× remove] and [+ Add tag] text input
19. `technology_area_tags[]` — optional; same tag chip pattern

**OWNERSHIP & ATTRIBUTION:**
20. `owner_name` — pub-required; text input
21. `owner_office` — pub-required; text input
22. `contributing_office` — pub-required; text input
23. `contributor_attribution` — optional; text input

**ARTIFACT LINKS:**
24. `artifact_links[]` — pub-required (1+); each item: { label, url (must be valid https://), source_type: Document|Code|Video|Diagram|Other }; dynamic add/remove

**ENGAGEMENT OPTIONS:**
25. `engagement_options[]` — pub-required (1+); checkboxes: ☐ REQUEST_BRIEFING, ☐ REQUEST_DEMO, ☐ REQUEST_ADOPTION_DISCUSSION, ☐ REQUEST_TECHNICAL_GUIDANCE, ☐ SUBMIT_RELATED_PROBLEM

**DATES:**
26. `last_reviewed_date` — pub-required; date input; shows red "REQUIRED" until filled

*Plus 3 display-only fields (not form inputs):*
27. `publication_state` — shown as PublicationStateChip in top bar; not editable directly
28. `record_id` — shown in footer
29. `created_at` — shown in footer

---

**Inline Maturity Definitions (per F9 / PRD Section 6.1):**

When maturity_level dropdown value changes, show definition below:
- IDEA: "A problem or opportunity has been identified and captured; no technical exploration yet."
- EXPERIMENT_POC: "A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive."
- PROTOTYPE_PILOT: "A working model or limited deployment was built; tested in a realistic environment."
- PRODUCTION_VALIDATED: "Fully deployed and operational; or a proven architectural pattern validated through review."
- ARCHIVED: "Work is no longer active; captured for institutional learning; not recommended for adoption."

Include "[View all maturity definitions →]" link to `/admin/content-model`.

**Inline Review Status Definitions (per F9 / PRD Section 6.2):**

When review_status dropdown value changes, show definition below:
- SUBMITTED: "Record is in the system; not yet curated."
- CURATED: "I&R curator has structured and enriched the record; not yet externally reviewed."
- TECHNICALLY_REVIEWED: "I&R or AO technical team has assessed architecture and findings."
- SECURITY_REVIEWED: "Cybersecurity or ISSO review of security implications completed."
- POLICY_REVIEWED: "Legal, privacy, or policy review completed."
- VALIDATED_FOR_REUSE: "All applicable reviews completed; recommended as a reuse-ready pattern."
- SUPERSEDED_RETIRED: "Record replaced by a newer version or retired; retained for institutional record."

Include "[View all review status definitions →]" link to `/admin/content-model`.

---

**ARCHIVED maturity advisory (per UserStory US-9.3 AC):**
When `maturity_level = ARCHIVED` is set on a record with `publication_state = PUBLISHED`, display advisory:
"This record is currently published. Setting maturity to Archived indicates the innovation work is no longer active. Consider also archiving the publication state to remove it from the default catalog browse. This does not happen automatically."

---

**State-dependent action buttons (per UX-Mockup Screen 07 State Transition Actions):**

```
DRAFT:     [Save Draft]  [Submit for Review ▶]
REVIEW:    [Save Draft]  [Publish ▶]  [Return to Draft]
PUBLISHED: [Edit (triggers warning modal)]  [Supersede]  [Archive]
SUPERSEDED:[Archive]
ARCHIVED:  (read-only — no state transitions; record displayed with "ARCHIVED" notice)
```

[Submit for Review] and [Publish] are disabled when any pub-required field is missing. When clicked with missing fields, show **GovernanceGate error banner** above action buttons:

```
⛔ Cannot publish — missing required fields:
• Executive Perspective Text
• Executive Recommendation
• Last-Reviewed Date

Complete all required fields and try again.
```

Use `getMissingPubRequiredFields(record)` from `ReadinessChecklist.tsx` to generate the list.

**Warning modal for editing Published record (per mockup):**
```
⚠ This record is currently Published and visible to all Hub users.
Editing will move this record to Review state and remove it from public view until it is re-published.
Are you sure you want to proceed?
[Cancel]  [Yes, Edit Record]
```

**Save behavior:**
- For new records: POST to `/api/v1/admin/records` → creates record in DRAFT → redirects to `/admin/records/{id}/edit`
- For edits: PATCH to `/api/v1/admin/records/{id}` with changed fields
- Auto-save every 60 seconds while editing (debounced, no confirmation required for draft)
- Manual [Save Draft] always available; success shows "Saved" indicator in footer

**State transitions call:**
- Submit for Review → `adminApiClient.transitionRecord(id, 'SUBMIT_FOR_REVIEW')`
- Publish → `adminApiClient.transitionRecord(id, 'PUBLISH')`
- Return to Draft → `adminApiClient.transitionRecord(id, 'RETURN_TO_DRAFT')`
- Archive → `adminApiClient.transitionRecord(id, 'ARCHIVE')`
- Supersede → `adminApiClient.transitionRecord(id, 'SUPERSEDE', { superseded_by_record_id })`

Note: lifecycle endpoint `POST /api/v1/admin/records/:id/lifecycle` is implemented in Wave 6b (15-PLAN). For Wave 6a, the state transition buttons should call the endpoint and display the API error response (which will be a 404 or 501 until Wave 6b). Do NOT suppress errors; show them in a `<div style={{ color: 'red' }}>{error.message}</div>` error banner.

---

### `e2e/admin-core.spec.ts`

Playwright e2e tests. Uses `baseURL` from `playwright.config.ts`. Tests run against the running dev server.

```typescript
import { test, expect } from '@playwright/test';

// Test: Unauthenticated /admin redirects to /admin/login
test('unauthenticated /admin redirects to /admin/login', async ({ page }) => {
  await page.goto('/admin');
  // Should end up at /admin/login (via client-side redirect from useAdminAuth)
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
});

// Test: /admin/login renders correctly
test('/admin/login shows sign-in button', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
  // Page title
  await expect(page).toHaveTitle(/Administration.*TSIO Innovation Hub/i);
});

// Test: /admin/login with error=access_denied shows 403 message
test('/admin/login with error=access_denied shows access denied message', async ({ page }) => {
  await page.goto('/admin/login?error=access_denied');
  await expect(page.getByText('You do not have permission')).toBeVisible();
});

// Test: RecordsListPage renders table structure (mock auth via cookie injection)
test('RecordsListPage renders table with column headers', async ({ page, context }) => {
  // Inject a test session cookie to bypass auth check
  // NOTE: This test relies on a test-mode endpoint that sets a mock session.
  // If the app has no test-mode: skip with test.skip()
  // The critical check is table structure renders (not data — data comes from 501 stub)
  await context.addCookies([{
    name: 'test_session',
    value: 'curator',
    domain: 'localhost',
    path: '/',
  }]);
  await page.goto('/admin/records');
  // Table headers per UX-Mockup Screen 08
  await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Maturity' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /State/i })).toBeVisible();
});

// Test: RecordEditPage at /admin/records/new renders all major sections
test('/admin/records/new renders all form sections', async ({ page, context }) => {
  await context.addCookies([{ name: 'test_session', value: 'curator', domain: 'localhost', path: '/' }]);
  await page.goto('/admin/records/new');
  // Section headings per UX-Mockup Screen 07
  await expect(page.getByText(/BASIC INFORMATION/i)).toBeVisible();
  await expect(page.getByText(/GOVERNANCE.*CLASSIFICATION/i)).toBeVisible();
  await expect(page.getByText(/PERSPECTIVES/i)).toBeVisible();
  await expect(page.getByText(/ARTIFACT LINKS/i)).toBeVisible();
  await expect(page.getByText(/ENGAGEMENT OPTIONS/i)).toBeVisible();
  // Publication Readiness Checklist
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();
});

// Test: Maturity dropdown shows inline definition
test('maturity level dropdown shows inline definition', async ({ page, context }) => {
  await context.addCookies([{ name: 'test_session', value: 'curator', domain: 'localhost', path: '/' }]);
  await page.goto('/admin/records/new');
  // Select EXPERIMENT_POC
  await page.selectOption('[name="maturity_level"]', 'EXPERIMENT_POC');
  await expect(page.getByText('targeted exploration was conducted to test feasibility')).toBeVisible();
});

// Test: Missing pub-required fields show GovernanceGate error
test('GovernanceGate shows missing fields on Submit for Review', async ({ page, context }) => {
  await context.addCookies([{ name: 'test_session', value: 'curator', domain: 'localhost', path: '/' }]);
  await page.goto('/admin/records/new');
  // Click Submit for Review without filling fields
  const submitBtn = page.getByRole('button', { name: /Submit for Review/i });
  // Button should be disabled when no fields filled
  await expect(submitBtn).toBeDisabled();
  // Fill title only to make it partially complete, then verify checklist still shows missing items
  await page.fill('[name="title"]', 'Test Record Title 123');
  // Still disabled — many required fields missing
  await expect(submitBtn).toBeDisabled();
  // Readiness checklist should show red items
  await expect(page.getByText(/PUBLICATION READINESS/i)).toBeVisible();
  // At least one checklist item should show ❌ or "REQUIRED"
  await expect(page.getByText(/REQUIRED|❌/i).first()).toBeVisible();
});

// Test: AdminSidebar navigation links are present and point to real routes
test('AdminSidebar contains all navigation links', async ({ page, context }) => {
  await context.addCookies([{ name: 'test_session', value: 'curator', domain: 'localhost', path: '/' }]);
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'All Records' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Opportunities/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Contributions/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Activity Log/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Content Model/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Hub Settings/i })).toBeVisible();
});
```

**Prerequisites check:** If `playwright.config.ts` does not exist, create it:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
});
```

If `@playwright/test` is not in package.json, add to devDependencies and note in task completion.
  </action>
  <verify>
grep -n 'ReadinessChecklist\|getMissingPubRequired' src/admin/components/ReadinessChecklist.tsx && echo "CHECKLIST_COMPONENT_OK"
grep -n 'executive_perspective_text\|GovernanceGate\|ReadinessChecklist' src/admin/pages/RecordEditPage.tsx && echo "RECORD_EDIT_GOVERNANCE_OK"
grep -n 'maturity_level.*definition\|EXPERIMENT_POC.*targeted exploration\|IDEA.*problem.*identified' src/admin/pages/RecordEditPage.tsx && echo "INLINE_DEFINITIONS_OK"
grep -n 'Submit for Review\|ARCHIVED.*maturity.*advisory\|superseded_by_record_id' src/admin/pages/RecordEditPage.tsx && echo "STATE_MACHINE_OK"
grep -n 'getAdminRecords\|MaturityBadge\|PublicationStateChip' src/admin/pages/RecordsListPage.tsx && echo "RECORDS_LIST_OK"
grep -n 'admin/login\|sign.*microsoft\|access.*denied\|Admin Dashboard' e2e/admin-core.spec.ts && echo "E2E_TESTS_OK"
npx playwright test e2e/admin-core.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED" && echo CONTRACT_OK
  </verify>
  <done>
- `src/admin/pages/RecordsListPage.tsx` renders sortable table with columns: Title, Maturity (MaturityBadge), Review Status (ReviewStatusBadge), Publication State (PublicationStateChip), Owner, Last Updated, Actions; filter controls for title/state/maturity; + New Record button; gracefully handles 501 from API stub; pagination from API response
- `src/admin/components/ReadinessChecklist.tsx` shows 17 pub-required fields with ✅/❌; exports `getMissingPubRequiredFields(record)` returning array of missing field names
- `src/admin/pages/RecordEditPage.tsx` renders all 29 fields in correct sections per UX-Mockup Screen 07 with proper labels, char limits, and help text; maturity_level and review_status dropdowns show inline definitions per PRD Section 6.1/6.2 when selection changes; includes "[View all ... definitions →]" links to /admin/content-model; ARCHIVED maturity advisory shown for Published records; GovernanceGate error banner lists missing pub-required fields from getMissingPubRequiredFields(); [Submit for Review] and [Publish] are disabled when pub-required fields are missing; warning modal shown before editing Published record; state-dependent action buttons per UX-Mockup Screen 07 state table; auto-save and manual Save Draft with "Saved" indicator
- `e2e/admin-core.spec.ts` Playwright tests pass: unauthenticated /admin redirects to /admin/login, /admin/login renders correctly, error=access_denied shows 403 message, RecordsListPage renders table headers, /admin/records/new renders all form sections, maturity dropdown shows inline definition, Submit for Review disabled with empty form, AdminSidebar has all nav links
  </done>

  <feature_dependencies>
  Implements: F8: Curation and Administration — RecordsListPage (all-states sortable table), RecordEditPage (full 29-field form, state machine action buttons, GovernanceGate error display); F9: Content, Maturity & Trust Model — inline maturity/review status definitions in edit form, ReadinessChecklist with pub-required fields, PublicationStateChip color coding
  Depends on: F8: Task 1 output (AdminShell, MaturityBadge, ReviewStatusBadge, PublicationStateChip, adminApiClient, useAdminAuth) — Task 2 builds directly on Task 1 components
  Enables: F8: Wave 6b (15-PLAN) implements actual lifecycle transitions — builds on state machine buttons in RecordEditPage; Wave 6c (16-PLAN) reuses AdminShell and auth pattern for submissions/engagement/settings pages; Wave 7 integration validation runs end-to-end curator workflow through this interface
  </feature_dependencies>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser→/admin/* | Unauthenticated browser requests crossing into CURATOR-protected admin frontend routes |
| browser→/auth/login | Browser-initiated OIDC authorization redirect — untrusted URL parameters could influence redirect behavior |
| admin-form→/api/v1/admin/* | Curator-supplied form data (record fields, lifecycle actions) crossing from admin React app into CURATOR-protected backend API |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-14-01 | Spoofing | Admin auth gate — useAdminAuth.ts checks session by calling dashboard-summary | mitigate | `useAdminAuth.ts` redirects to /admin/login on ANY non-200 response from `/api/v1/admin/dashboard-summary`; the actual session validation is enforced server-side by `authenticateOidc` + `requireCurator` (from 06-PLAN) — the client-side check is defense-in-depth UI, not the authoritative auth boundary |
| T-14-02 | Elevation of Privilege | Admin routes accessible if useAdminAuth check is bypassed (e.g., service worker, direct script injection) | mitigate | Every `/api/v1/admin/*` endpoint has server-side `requireCurator` middleware (from 06-PLAN `src/routes/admin.js` `router.use(requireCurator)`) — client-side auth gate is UX only; all data comes from authenticated API endpoints; no admin action succeeds without server-side CURATOR check |
| T-14-03 | Tampering | RecordEditPage — curator can enter arbitrary text in free-text fields (problem_statement, findings, etc.) | mitigate | Server-side: all text fields are HTML-stripped via sanitize-html in RecordService before persistence (Wave 2c, 05-PLAN). Client-side: artifact link URL fields validate `https://` prefix before allow submission. Defense-in-depth: React renders all field values as text content (not dangerouslySetInnerHTML) — XSS via stored content is prevented at render layer |
| T-14-04 | Information Disclosure | Admin dashboard and records list expose unpublished record data (draft titles, counts) | accept | By design: these are CURATOR-only endpoints (`requireCurator` on all `/api/v1/admin/*` routes). Non-curator users receive 403 before any data is served. Draft/internal data exposure is acceptable to authenticated curators. Residual risk: session theft would expose draft content — mitigated at session layer (HttpOnly cookie, SameSite=Strict, 1hr expiry per 06-PLAN). Risk owned by AO IT security. |
| T-14-05 | Spoofing | AdminLoginPage — "Sign in with Microsoft" button navigates to /auth/login which initiates OIDC flow | mitigate | The OIDC authorization URL construction and PKCE state management are entirely server-side in `src/middleware/auth.js::redirectToLogin` (06-PLAN); the frontend only navigates to `/auth/login` — it does not construct IdP URLs, does not handle tokens, and cannot be manipulated by DOM injection to alter the OIDC flow. State parameter stored server-side prevents CSRF. |
| T-14-06 | Denial of Service | RecordEditPage auto-save fires PATCH every 60 seconds — could cause unintended API traffic | mitigate | Auto-save is debounced and only fires when form values have changed (dirty check before firing PATCH). If 60s fires and no changes: no request sent. Maximum: 1 PATCH per 60 seconds per open edit tab — not a DoS vector for a curator-only interface. |
</threat_model>

<verification>
After both tasks complete:

```bash
# 1. All source files exist
ls src/admin/AdminApp.tsx \
   src/admin/AdminShell.tsx \
   src/admin/pages/AdminLoginPage.tsx \
   src/admin/pages/DashboardPage.tsx \
   src/admin/pages/RecordsListPage.tsx \
   src/admin/pages/RecordEditPage.tsx \
   src/admin/components/AdminSidebar.tsx \
   src/admin/components/MaturityBadge.tsx \
   src/admin/components/ReviewStatusBadge.tsx \
   src/admin/components/PublicationStateChip.tsx \
   src/admin/components/ReadinessChecklist.tsx \
   src/admin/hooks/useAdminAuth.ts \
   src/admin/api/adminApiClient.ts \
   e2e/admin-core.spec.ts && echo "ALL_FILES_EXIST"

# 2. Integration contracts
grep -n 'authenticateOidc' src/middleware/auth.js && grep -n 'upsertFromOidc' src/middleware/auth.js && echo CONTRACT_OK
grep -n 'requireCurator' src/routes/admin.js && grep -n 'dashboard-summary' src/routes/admin.js && grep -n 'maturity-reference' src/routes/admin.js && echo CONTRACT_OK

# 3. Admin routes registered
grep -n 'AdminLoginPage\|DashboardPage\|RecordsListPage\|RecordEditPage' src/admin/AdminApp.tsx && echo "ROUTES_REGISTERED"

# 4. Dashboard tile fields
grep -n 'total_published_records\|pending_opportunity\|recent_engagement' src/admin/pages/DashboardPage.tsx && echo "DASHBOARD_TILES_OK"

# 5. RecordEditPage governance
grep -n 'executive_perspective_text\|GovernanceGate\|getMissingPubRequired\|ReadinessChecklist' src/admin/pages/RecordEditPage.tsx && echo "GOVERNANCE_OK"

# 6. Inline definitions present
grep -n 'EXPERIMENT_POC.*targeted exploration\|IDEA.*no technical exploration\|PRODUCTION_VALIDATED.*Fully deployed' src/admin/pages/RecordEditPage.tsx && echo "INLINE_DEFS_OK"

# 7. Playwright tests
npx playwright test e2e/admin-core.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
</verification>

<success_criteria>
- `/admin/login` renders a "Sign in with Microsoft" button that navigates to `/auth/login` (OIDC initiation); shows 403 message when `?error=access_denied` present; page title includes "Administration — TSIO Innovation Hub"
- `useAdminAuth` redirects unauthenticated requests to `/admin/login` by checking a CURATOR-only endpoint
- `DashboardPage` fetches GET `/api/v1/admin/dashboard-summary` and renders 5 tiles (published records, draft/review records, pending opportunity submissions, pending contribution submissions, recent engagements last 7d); each tile links to its admin section; Quick Actions with 4 nav links; graceful on 501 stub
- `AdminSidebar` renders all navigation sections per UX-Mockup (Dashboard, Records, Submissions with Opportunities/Contributions badges, Engagement, Reference, Settings) with correct routes; all nav items link to real routes (no 404s)
- `RecordsListPage` renders sortable table with Title, Maturity, Review Status, Publication State, Owner, Last Updated, Actions columns; filter controls; [+ New Record] button; gracefully handles 501 API stub
- `RecordEditPage` renders all 29 fields organized in correct sections; maturity_level and review_status dropdowns show inline definitions per PRD §6.1/6.2 on selection; ARCHIVED maturity advisory shown for Published records; `ReadinessChecklist` shows ✅/❌ for all 17 pub-required fields; GovernanceGate error banner lists missing fields; [Submit for Review] and [Publish] disabled when fields missing; state-dependent action buttons per mockup; warning modal for editing Published record
- All Playwright e2e tests in `e2e/admin-core.spec.ts` pass (0 failing, 0 skipped): unauthenticated redirect, login page render, access denied display, records list structure, record edit sections, inline definitions, disabled Submit for Review, sidebar nav links
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/14-SUMMARY.md` with:
- Tasks completed
- Files created
- Auth gate design (useAdminAuth pattern, OIDC redirect flow)
- GovernanceGate error display implementation
- RecordEditPage field structure and pub-required validation approach
- Integration contracts provided to Wave 6b (15-PLAN) and Wave 6c (16-PLAN)
- Any conflicts with UX-Mockup specs flagged
</output>
