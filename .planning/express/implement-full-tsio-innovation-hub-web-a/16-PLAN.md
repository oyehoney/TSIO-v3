---
phase: implement-full-tsio-innovation-hub-web-a
plan: 16
type: execute
wave: 6
depends_on: [2, 3]
files_modified:
  - src/pages/admin/submissions/OpportunitySubmissionsPage.tsx
  - src/pages/admin/submissions/ContributionSubmissionsPage.tsx
  - src/pages/admin/EngagementActivityPage.tsx
  - src/pages/admin/SettingsPage.tsx
  - src/pages/admin/ContentModelReferencePage.tsx
  - src/components/admin/AdminLayout.tsx
  - e2e/admin-supporting-pages.spec.ts
autonomous: true

features:
  implements: ["F7", "F8", "F9"]
  depends_on: ["F5", "F6", "F7", "F8"]
  enables: []

must_haves:
  truths:
    - "OpportunitySubmissionsPage at /admin/submissions/opportunities renders a reverse-chronological list of all opportunity submissions with columns (date, office, contact, status); each row links to a detail view where curator can set disposition (UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD) with optional linked_record_id and internal notes; Save Disposition fires PATCH /api/v1/admin/opportunity-submissions/:id"
    - "ContributionSubmissionsPage at /admin/submissions/contributions renders a list of contribution submissions; detail view shows full submission content; curator can set disposition (UNDER_REVIEW, ACCEPTED_FOR_CURATION, DECLINED); when ACCEPTED_FOR_CURATION is saved, 'Create Innovation Record from This Submission' CTA appears and navigates to /admin/records/new pre-populated"
    - "EngagementActivityPage at /admin/engagement renders all engagement requests reverse-chronologically with filters (record, type, date range); each row has inline [Update] status control (SUBMITTED | IN_PROGRESS | COMPLETED | NO_ACTION); routing email address is displayed below table with link to Settings"
    - "SettingsPage at /admin/settings shows engagement routing email field; Save validates non-blank valid email format; success toast confirms 'Routing email updated. Future notifications will be sent to [email].'; invalid format shows inline error"
    - "ContentModelReferencePage at /admin/content-model displays read-only tables: all 5 maturity levels (enum, label, color indicator, full definition) and all 7 review statuses (enum, label, definition); page is clearly marked read-only"
    - "All five pages are reachable from the admin sidebar (wired into AdminLayout navigation with correct href) — no orphan routes"
    - "Playwright e2e tests cover: submission queue list renders, disposition save fires correct API, 'Create Record from Submission' CTA visible after ACCEPTED_FOR_CURATION, engagement log filters work, settings save with valid/invalid email, content model reference page renders all 5+7 rows"
  artifacts:
    - path: "src/pages/admin/submissions/OpportunitySubmissionsPage.tsx"
      provides: "OpportunitySubmissionsPage component — list + detail with 4 disposition options"
      exports: ["OpportunitySubmissionsPage"]
    - path: "src/pages/admin/submissions/ContributionSubmissionsPage.tsx"
      provides: "ContributionSubmissionsPage component — list + detail with Create Record CTA"
      exports: ["ContributionSubmissionsPage"]
    - path: "src/pages/admin/EngagementActivityPage.tsx"
      provides: "EngagementActivityPage component — engagement log with filters and inline status update"
      exports: ["EngagementActivityPage"]
    - path: "src/pages/admin/SettingsPage.tsx"
      provides: "SettingsPage component — routing email config with validation"
      exports: ["SettingsPage"]
    - path: "src/pages/admin/ContentModelReferencePage.tsx"
      provides: "ContentModelReferencePage component — read-only maturity + review status definitions"
      exports: ["ContentModelReferencePage"]
    - path: "src/components/admin/AdminLayout.tsx"
      provides: "AdminLayout with sidebar nav wiring all 5 new pages"
      exports: ["AdminLayout"]
    - path: "e2e/admin-supporting-pages.spec.ts"
      provides: "Playwright e2e tests for all 5 admin supporting pages"
  key_links:
    - from: "OpportunitySubmissionsPage"
      to: "GET /api/v1/admin/opportunity-submissions"
      via: "fetch on mount for list data"
      pattern: "opportunity-submissions"
    - from: "OpportunitySubmissionsPage detail Save"
      to: "PATCH /api/v1/admin/opportunity-submissions/:id"
      via: "form submit handler"
      pattern: "PATCH.*opportunity-submissions"
    - from: "ContributionSubmissionsPage"
      to: "POST /api/v1/admin/contribution-submissions/:id/create-record"
      via: "'Create Innovation Record from This Submission' button handler"
      pattern: "create-record"
    - from: "EngagementActivityPage"
      to: "GET /api/v1/admin/engagement-requests"
      via: "fetch with filter query params"
      pattern: "engagement-requests"
    - from: "SettingsPage"
      to: "GET/PUT /api/v1/admin/settings"
      via: "fetch on mount + form submit"
      pattern: "admin/settings"
    - from: "ContentModelReferencePage"
      to: "GET /api/v1/admin/maturity-reference and GET /api/v1/admin/review-status-reference"
      via: "fetch on mount"
      pattern: "maturity-reference|review-status-reference"
    - from: "AdminLayout sidebar"
      to: "all 5 admin supporting pages"
      via: "NavLink href attributes"
      pattern: "/admin/submissions/opportunities|/admin/submissions/contributions|/admin/engagement|/admin/settings|/admin/content-model"

integration_contracts:
  requires:
    - from_plan: "07"
      artifact: "src/routes/submissions.js"
      exports:
        - "GET /api/v1/admin/opportunity-submissions — CURATOR, paginated, ordered submitted_at DESC"
        - "PATCH /api/v1/admin/opportunity-submissions/:id — CURATOR, disposition update"
        - "GET /api/v1/admin/contribution-submissions — CURATOR, paginated"
        - "PATCH /api/v1/admin/contribution-submissions/:id — CURATOR, disposition update"
        - "POST /api/v1/admin/contribution-submissions/:id/create-record — CURATOR, create record from submission"
      verify: "grep -n 'submissionsRouter' src/routes/submissions.js && grep -n 'opportunity-submissions' src/routes/submissions.js && grep -n 'contribution-submissions' src/routes/submissions.js && grep -n 'create-record' src/routes/submissions.js && echo CONTRACT_OK"
    - from_plan: "08"
      artifact: "src/services/engagement.service.js"
      exports:
        - "listEngagementRequests — GET /api/v1/admin/engagement-requests with filters"
        - "updateEngagementRequestStatus — PATCH /api/v1/admin/engagement-requests/:id"
      verify: "grep -n 'listEngagementRequests' src/services/engagement.service.js && grep -n 'updateEngagementRequestStatus' src/services/engagement.service.js && echo CONTRACT_OK"
    - from_plan: "08"
      artifact: "src/services/settings.service.js"
      exports:
        - "getAllSettings — GET /api/v1/admin/settings returns HubSetting[] including engagement_routing_email"
        - "updateSettings — PUT /api/v1/admin/settings validates engagement_routing_email"
        - "getSettingByKey — used by EmailService at send time"
      verify: "grep -n 'getAllSettings' src/services/settings.service.js && grep -n 'updateSettings' src/services/settings.service.js && grep -n 'engagement_routing_email' src/services/settings.service.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/pages/admin/submissions/OpportunitySubmissionsPage.tsx"
      exports:
        - "OpportunitySubmissionsPage: React component rendered at /admin/submissions/opportunities"
        - "Calls GET /api/v1/admin/opportunity-submissions for list"
        - "Calls PATCH /api/v1/admin/opportunity-submissions/:id for disposition updates"
      shape: |
        export default function OpportunitySubmissionsPage(): JSX.Element
        // Renders list of OpportunitySubmission objects with disposition controls
        // UX: per Screen-09 mockup — list row (date, office, contact, status) + detail view with 4 disposition options
      verify: "grep -n 'OpportunitySubmissionsPage' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && grep -n 'opportunity-submissions' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/admin/submissions/ContributionSubmissionsPage.tsx"
      exports:
        - "ContributionSubmissionsPage: React component rendered at /admin/submissions/contributions"
        - "Calls GET /api/v1/admin/contribution-submissions for list"
        - "Calls PATCH /api/v1/admin/contribution-submissions/:id for disposition updates"
        - "Calls POST /api/v1/admin/contribution-submissions/:id/create-record for record creation"
      shape: |
        export default function ContributionSubmissionsPage(): JSX.Element
        // Renders list + detail with 'Create Innovation Record from This Submission' CTA
        // CTA visible only when disposition === 'ACCEPTED_FOR_CURATION'
      verify: "grep -n 'ContributionSubmissionsPage' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && grep -n 'create-record' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/admin/EngagementActivityPage.tsx"
      exports:
        - "EngagementActivityPage: React component rendered at /admin/engagement"
        - "Calls GET /api/v1/admin/engagement-requests with filters (record, type, date range)"
        - "Calls PATCH /api/v1/admin/engagement-requests/:id for status updates"
      shape: |
        export default function EngagementActivityPage(): JSX.Element
        // Renders filterable engagement log per Screen-10 mockup
        // Shows routing email + 'Update Routing Email → Settings' link
      verify: "grep -n 'EngagementActivityPage' src/pages/admin/EngagementActivityPage.tsx && grep -n 'engagement-requests' src/pages/admin/EngagementActivityPage.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/admin/SettingsPage.tsx"
      exports:
        - "SettingsPage: React component rendered at /admin/settings"
        - "Calls GET /api/v1/admin/settings on mount"
        - "Calls PUT /api/v1/admin/settings on save"
      shape: |
        export default function SettingsPage(): JSX.Element
        // Renders engagement routing email field per Screen-11 mockup
        // Validates non-blank valid email; shows success toast on save
      verify: "grep -n 'SettingsPage' src/pages/admin/SettingsPage.tsx && grep -n 'admin/settings' src/pages/admin/SettingsPage.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/admin/ContentModelReferencePage.tsx"
      exports:
        - "ContentModelReferencePage: React component rendered at /admin/content-model"
        - "Calls GET /api/v1/admin/maturity-reference and GET /api/v1/admin/review-status-reference on mount"
      shape: |
        export default function ContentModelReferencePage(): JSX.Element
        // Read-only reference tables per Screen-12 mockup
        // Maturity levels: IDEA, EXPERIMENT_POC, PROTOTYPE_PILOT, PRODUCTION_VALIDATED, ARCHIVED
        // Review statuses: SUBMITTED, CURATED, TECHNICALLY_REVIEWED, SECURITY_REVIEWED, POLICY_REVIEWED, VALIDATED_FOR_REUSE, SUPERSEDED_RETIRED
      verify: "grep -n 'ContentModelReferencePage' src/pages/admin/ContentModelReferencePage.tsx && grep -n 'maturity-reference' src/pages/admin/ContentModelReferencePage.tsx && grep -n 'review-status-reference' src/pages/admin/ContentModelReferencePage.tsx && echo CONTRACT_OK"
    - artifact: "src/components/admin/AdminLayout.tsx"
      exports:
        - "AdminLayout: sidebar nav wiring /admin/submissions/opportunities, /admin/submissions/contributions, /admin/engagement, /admin/settings, /admin/content-model"
      verify: "grep -n 'submissions/opportunities' src/components/admin/AdminLayout.tsx && grep -n 'submissions/contributions' src/components/admin/AdminLayout.tsx && grep -n 'admin/engagement' src/components/admin/AdminLayout.tsx && grep -n 'admin/settings' src/components/admin/AdminLayout.tsx && grep -n 'content-model' src/components/admin/AdminLayout.tsx && echo CONTRACT_OK"
---

<objective>
Build the five **admin supporting pages** that complete Wave 6's admin interface (W6-c):

1. **OpportunitySubmissionsPage** (`/admin/submissions/opportunities`) — reverse-chronological list of opportunity submissions; detail view with 4-disposition control (UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD) and internal notes; PATCH API call on save.
2. **ContributionSubmissionsPage** (`/admin/submissions/contributions`) — list of contribution submissions; detail view with full content; 3-disposition control; "Create Innovation Record from This Submission" CTA revealed only when ACCEPTED_FOR_CURATION; navigates to `/admin/records/new` pre-populated.
3. **EngagementActivityPage** (`/admin/engagement`) — engagement request log with filters (record, type, date range); inline [Update] status control (SUBMITTED → IN_PROGRESS / COMPLETED / NO_ACTION); displays current routing email with link to Settings.
4. **SettingsPage** (`/admin/settings`) — routing email config field; client-side validation (non-blank + valid email format); PUT API call; success toast with email address confirmation; inline error for invalid format.
5. **ContentModelReferencePage** (`/admin/content-model`) — read-only reference tables: 5 maturity levels (enum, label, color indicator, definition) and 7 review statuses (enum, label, definition); explicitly read-only notice.

All five pages are wired into **AdminLayout** sidebar nav to prevent orphan routes, and all UX decisions are grounded in UX-Mockup Screens 09–12 and UserStories US-5.3, US-6.3, US-7.3, US-8.3.

Purpose: Completes the curator's operational control surface — Wave 7 integration validation verifies curator can manage submissions, monitor engagement, configure routing email, and reference content model definitions end-to-end.

Output:
- `src/pages/admin/submissions/OpportunitySubmissionsPage.tsx`
- `src/pages/admin/submissions/ContributionSubmissionsPage.tsx`
- `src/pages/admin/EngagementActivityPage.tsx`
- `src/pages/admin/SettingsPage.tsx`
- `src/pages/admin/ContentModelReferencePage.tsx`
- `src/components/admin/AdminLayout.tsx` (updated with sidebar nav links)
- `e2e/admin-supporting-pages.spec.ts` — Playwright e2e tests
</objective>

<feature_dependencies>
Implements: F7: Engagement Routing (EngagementActivityPage — curator log + status updates; SettingsPage — routing email config without code deployment; US-7.3), F8: Curation and Administration (OpportunitySubmissionsPage — 4-disposition queue US-5.3; ContributionSubmissionsPage — create-record CTA US-6.3; SettingsPage — hub_settings read/write US-7.3; US-8.1), F9: Content, Maturity & Trust Model (ContentModelReferencePage — read-only 5 maturity + 7 review status definitions US-8.3)
Depends on: F5: Opportunity Submission backend (07-PLAN SubmissionService provides opportunity-submissions endpoints), F6: Contribution Submission backend (07-PLAN SubmissionService provides contribution-submissions + create-record endpoints), F7: EngagementService + SettingsService (08-PLAN provides engagement-requests + settings endpoints)
Enables: None (Wave 7 integration validates these pages end-to-end)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/07-PLAN.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/08-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md (Screen-09 Submission Queue, Screen-10 Engagement Activity Log, Screen-11 Hub Settings, Screen-12 Content Model Reference, Admin Nav Sidebar structure)
@project_specs/UserStories-TSIO-Innovation-Hub.md (US-5.3, US-6.3, US-7.3, US-8.3)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement OpportunitySubmissionsPage, ContributionSubmissionsPage, and AdminLayout sidebar wiring</name>
  <files>
    src/pages/admin/submissions/OpportunitySubmissionsPage.tsx
    src/pages/admin/submissions/ContributionSubmissionsPage.tsx
    src/components/admin/AdminLayout.tsx
  </files>
  <action>
Implement the two submission queue admin pages per UX-Mockup Screen-09, then wire all admin supporting pages into AdminLayout sidebar.

---

### Design Grounding (Screen-09 — do not diverge silently)

**Opportunity Submissions Queue:**
- Route: `/admin/submissions/opportunities`
- List view columns: DATE, OFFICE, CONTACT, STATUS; reverse-chronological (submitted_at DESC)
- Status color badges per Screen-09: NEW=blue, UNDER_REVIEW=gray, ACCEPTED_FOR_CONSIDERATION=green, DECLINED=red, LINKED_TO_RECORD=teal
- Each row shows problem description truncated (~120 chars) with `[Review →]` link
- Clicking [Review →] opens inline detail (or navigates to `?id=:id` sub-view)
- Detail view fields: submitter name/office/email, mission area, urgency context (if present), full problem description, known constraints (if present)
- Disposition selector: `<select>` with options: `Under Review | Accepted for Consideration | Declined | Linked to Record`
- Conditional field: when LINKED_TO_RECORD selected, show "Linked Record ID" text input
- Internal Notes: `<textarea>` (not visible to submitter — label this explicitly per mockup)
- `[Save Disposition]` button → PATCH `/api/v1/admin/opportunity-submissions/:id` with `{ disposition, linked_record_id?, internal_note? }`
- Below form: Disposition History (flat log of `reviewed_at + curator` when present)
- Success: show toast "Disposition saved." (Pattern 06)

**US-5.3 acceptance criteria to satisfy:**
- All 4 dispositions available: UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD
- When LINKED_TO_RECORD: linked_record_id input shown; required
- Disposition changes logged (backend already does this via reviewed_by_user_id/reviewed_at — display these on detail view)

**Conflict flag:** UX mockup shows UNDER_REVIEW as default initial disposition selector value. API uses `status` field (SUBMITTED) for initial state; `disposition` is null until curator acts. Implement: if `disposition` is null, show "Not yet reviewed" as display; selector defaults to UNDER_REVIEW as first actionable option (curator must explicitly pick before saving).

---

**Contribution Submissions Queue:**
- Route: `/admin/submissions/contributions`
- List view columns: DATE, OFFICE, CONTACT, STATUS, MATURITY (self-assessed)
- Detail view sections: SUBMISSION CONTENT (mission problem, work description, outcome summary, self-assessed maturity, artifact URLs as clickable external links), DISPOSITION section
- Disposition selector options: `Under Review | Accepted for Curation | Declined`
  - Note: "PUBLISHED" disposition value exists in the API but is set by backend after record publication — not shown as a curator-selectable option in this UI (it's set automatically when linked record is published)
- `[Save Disposition]` button → PATCH `/api/v1/admin/contribution-submissions/:id`
- **Create Record CTA:** Revealed ONLY when `disposition === 'ACCEPTED_FOR_CURATION'` (after save, re-fetch submission and check):
  ```
  ┌──────────────────────────────────────────────────────────┐
  │  ✅ Accepted for Curation                                │
  │                                                          │
  │  [Create Innovation Record from This Submission →]       │
  │                                                          │
  │  This will create a Draft record pre-populated with:     │
  │  • Problem Description → Problem Statement               │
  │  • Work Description → What Was Explored                  │
  │  • Outcome Summary → Outcome Summary                     │
  │  • Artifact URLs → Artifact Links                        │
  │  • Source Type → COMMUNITY (set automatically)           │
  └──────────────────────────────────────────────────────────┘
  ```
- CTA click: call `POST /api/v1/admin/contribution-submissions/:id/create-record`; on success (201 response returns `{ record_id }`), navigate to `/admin/records/${record_id}/edit`
- Success toast for disposition save: "Disposition saved."

**US-6.3 acceptance criteria to satisfy:**
- "Create Record from Submission" CTA visible when disposition = ACCEPTED_FOR_CURATION
- Resulting record pre-populated (backend does mapping; frontend just navigates to edit view)
- source_type = COMMUNITY set by backend (document this in CTA explanation box)

---

### Implementation notes for both pages

**API integration pattern (use consistent approach across admin pages):**
```typescript
// Generic fetch wrapper for admin API — uses session cookie (HttpOnly) set by OIDC auth
async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin', // send session cookie
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `API error ${res.status}`);
  }
  return res.json();
}
```

**Pagination:** Both lists support `?page=1&page_size=20`; implement simple pagination controls (previous/next + page count display).

**Loading state:** Show "Loading submissions…" text (not skeleton) while fetching.

**Empty state:** "No submissions received yet." when `data.length === 0`.

**Error state:** Show inline error banner "Unable to load submissions. Please try again." — do not throw unhandled.

**React Router assumption:** Assume React Router v6 (uses `<Link>`, `useNavigate`, `useParams`). If project uses a different router (check `package.json` for react-router-dom, Next.js, etc.) — adapt accordingly and note the adaptation in a code comment. Do NOT silently assume Next.js `app/` directory structure; check the project structure first.

---

### AdminLayout sidebar wiring

Update `src/components/admin/AdminLayout.tsx` to include all five new pages in the sidebar per Admin Navigation Sidebar spec (Screen-06 mockup):

```
TSIO INNOVATION HUB [ADMIN]

  Dashboard                   → /admin

  RECORDS
  ─────────────────
  All Records                 → /admin/records
  + New Record                → /admin/records/new

  SUBMISSIONS
  ─────────────────
  Opportunities  [badge]      → /admin/submissions/opportunities
  Contributions  [badge]      → /admin/submissions/contributions

  ENGAGEMENT
  ─────────────────
  Activity Log                → /admin/engagement

  REFERENCE
  ─────────────────
  Content Model               → /admin/content-model

  SETTINGS
  ─────────────────
  Hub Settings                → /admin/settings
```

Sidebar badge counts for Opportunities and Contributions: fetch `GET /api/v1/admin/dashboard-summary` on mount; use `pending_opportunity_submissions` and `pending_contribution_submissions` counts. Display numeric badge only when count > 0. If dashboard-summary returns 501 (stub not yet implemented), render 0 silently (no error).

**IMPORTANT — Pivota Preview compatibility:**
- Do NOT set `X-Frame-Options: DENY/SAMEORIGIN` or `Content-Security-Policy: frame-ancestors 'none'/'self'` in any component meta tags or response headers
- Every sidebar NavLink href must point to a real registered route; no dead links

Active sidebar item: highlight current route using `NavLink` `aria-current="page"` or `className` active variant.
  </action>
  <verify>
grep -n 'OpportunitySubmissionsPage' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && grep -n 'opportunity-submissions' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && grep -n 'ACCEPTED_FOR_CONSIDERATION\|LINKED_TO_RECORD\|UNDER_REVIEW\|DECLINED' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && echo "OPP_SUBMISSIONS_OK"
grep -n 'ContributionSubmissionsPage' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && grep -n 'create-record' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && grep -n 'ACCEPTED_FOR_CURATION' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && echo "CONTRIB_SUBMISSIONS_OK"
grep -n 'submissions/opportunities' src/components/admin/AdminLayout.tsx && grep -n 'submissions/contributions' src/components/admin/AdminLayout.tsx && grep -n 'admin/engagement' src/components/admin/AdminLayout.tsx && grep -n 'admin/settings' src/components/admin/AdminLayout.tsx && grep -n 'content-model' src/components/admin/AdminLayout.tsx && echo "SIDEBAR_WIRING_OK"
  </verify>
  <done>
- `src/pages/admin/submissions/OpportunitySubmissionsPage.tsx` exports `OpportunitySubmissionsPage`; calls `GET /api/v1/admin/opportunity-submissions`; detail view offers 4 disposition options (UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD); LINKED_TO_RECORD shows linked_record_id input; Save fires `PATCH /api/v1/admin/opportunity-submissions/:id`; success toast renders
- `src/pages/admin/submissions/ContributionSubmissionsPage.tsx` exports `ContributionSubmissionsPage`; detail view shows full submission content; disposition selector has UNDER_REVIEW, ACCEPTED_FOR_CURATION, DECLINED; "Create Innovation Record from This Submission" CTA visible only when disposition === 'ACCEPTED_FOR_CURATION'; CTA calls `POST .../create-record` then navigates to record edit
- `src/components/admin/AdminLayout.tsx` sidebar contains working `<NavLink>` (or equivalent) for all 5 new pages (opportunities, contributions, engagement, settings, content-model) plus existing Dashboard, All Records, New Record; active route highlighted; pending badge counts fetched from dashboard-summary
</done>

<feature_dependencies>
Implements: F8: Curation and Administration (OpportunitySubmissionsPage — US-5.3 4-disposition queue), F6: Share Existing Innovation Work (ContributionSubmissionsPage — US-6.3 create-record CTA), F8: Admin nav sidebar wiring (AdminLayout)
Depends on: F5/F6: 07-PLAN SubmissionService (opportunity-submissions + contribution-submissions + create-record endpoints)
Enables: F7: EngagementActivityPage + SettingsPage in Task 2 (both need AdminLayout sidebar)
</feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Implement EngagementActivityPage, SettingsPage, ContentModelReferencePage, and Playwright e2e tests</name>
  <files>
    src/pages/admin/EngagementActivityPage.tsx
    src/pages/admin/SettingsPage.tsx
    src/pages/admin/ContentModelReferencePage.tsx
    e2e/admin-supporting-pages.spec.ts
  </files>
  <action>
Implement the remaining three admin supporting pages and full Playwright e2e test suite.

---

### EngagementActivityPage (`/admin/engagement`)

**Design grounding: Screen-10 Engagement Activity Log**

Layout:
- Page heading: "Engagement Activity Log" with total count + "N in the last 7 days"
- Filter bar: Record dropdown (all records with engagement), Type dropdown (all 4 types + ALL), Date range select (Last 7 days / Last 30 days / Last 90 days / All time)
- Table columns: DATE, TYPE, RECORD (linked to `/records/:id`), REQUESTOR NAME + OFFICE, STATUS with inline [Update] action

Filters hit `GET /api/v1/admin/engagement-requests?record_id=&request_type=&from_date=&to_date=&page=1&page_size=20`

**Inline status update (Pattern from Screen-10):**
- [Update] button per row opens an inline popover/dropdown:
  ```
  ┌──────────────────────────────────────────────────────┐
  │  Update Status for this Request                      │
  │  Current: SUBMITTED                                  │
  │  ● SUBMITTED  ○ IN PROGRESS  ○ COMPLETED  ○ NO ACTION│
  │  [Save]  [Cancel]                                    │
  └──────────────────────────────────────────────────────┘
  ```
- [Save] fires `PATCH /api/v1/admin/engagement-requests/:id` with `{ status: 'IN_PROGRESS' | 'COMPLETED' | 'NO_ACTION' }`
- After save: row status chip updates inline; toast "Status updated."
- [Completed] requests show [View] instead of [Update]

**Routing email display (below table):**
```
Routing Email:
Requests are routed to: AOml_TSO_IRB_Team@ao.uscourts.gov
[Update Routing Email — go to Settings →]  (links to /admin/settings)
```
- Fetch current routing email from `GET /api/v1/admin/settings`; find `engagement_routing_email` key; display value
- Link text "Update Routing Email — go to Settings →" navigates to `/admin/settings`

**US-7.3 acceptance criteria:**
- Filter by record, request type, date range ✅
- Update status: SUBMITTED → IN_PROGRESS → COMPLETED / NO_ACTION ✅
- Displays routing email + settings link ✅

---

### SettingsPage (`/admin/settings`)

**Design grounding: Screen-11 Hub Settings**

Layout:
```
Hub Settings
─────────────────────────────────────
── ENGAGEMENT ROUTING ──────────────
Routing Email Address
All engagement requests and submission notifications are sent to this address.
This field can be updated without a code deployment.

[ input: current routing email value ]
Must be a valid email address. Cannot be blank.

[Save Routing Email]

── ABOUT ────────────────────────────
TSIO Innovation Hub — Administration Interface
Administrative Office of the U.S. Courts
TSIO Innovation & Research Branch
```

**On mount:** `GET /api/v1/admin/settings` → find `setting_key === 'engagement_routing_email'` → populate input

**On save:**
1. Client-side validation first:
   - Blank: show inline error "Routing email cannot be blank." (do not call API)
   - Invalid email format: show inline error "Please enter a valid email address." (do not call API)
   - Valid: proceed to API call
2. Call `PUT /api/v1/admin/settings` with `{ settings: [{ setting_key: 'engagement_routing_email', setting_value: inputValue }] }`
3. On success (200): success toast "Routing email updated. Future notifications will be sent to [new email]."
4. On API 422 INVALID_EMAIL: show inline error "Please enter a valid email address."
5. On API 422 VALIDATION_ERROR: show inline error "Routing email cannot be blank."

**Email validation regex (client-side):** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — same pattern as backend SubmissionService

**US-7.3 acceptance criteria:**
- Can update routing email without code deployment ✅
- Invalid format rejected with inline error ✅
- Blank rejected with inline error ✅
- Success toast confirms new email address ✅

---

### ContentModelReferencePage (`/admin/content-model`)

**Design grounding: Screen-12 Content Model Reference**

On mount: call `GET /api/v1/admin/maturity-reference` AND `GET /api/v1/admin/review-status-reference` in parallel (Promise.all). Note: these endpoints return 501 NOT_IMPLEMENTED until Wave 3c fully implements them — handle gracefully: if 501 or error, fall back to static hard-coded definitions below (same values the system uses everywhere). This is correct behavior per the mockup which says "Definitions require a code change" — the data IS a code constant.

**Maturity Levels (hard-coded fallback, canonical values from F9):**
```typescript
const MATURITY_LEVELS = [
  { value: 'IDEA',                 label: 'Idea',                       color: '#6B7280', colorLabel: 'Gray',
    definition: 'A problem or opportunity has been identified; no technical exploration has been conducted yet.' },
  { value: 'EXPERIMENT_POC',       label: 'Experiment / POC',           color: '#D97706', colorLabel: 'Amber',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.' },
  { value: 'PROTOTYPE_PILOT',      label: 'Prototype / Pilot',          color: '#EA580C', colorLabel: 'Orange',
    definition: 'A working model or limited deployment was built and tested in a realistic environment.' },
  { value: 'PRODUCTION_VALIDATED', label: 'Production / Validated Pattern', color: '#16A34A', colorLabel: 'Green',
    definition: 'Fully deployed and operational; or proven architectural pattern validated across multiple use cases.' },
  { value: 'ARCHIVED',             label: 'Archived',                   color: '#374151', colorLabel: 'Dark Gray',
    definition: 'Work is no longer actively maintained; captured for institutional learning. Not recommended for adoption without re-evaluation.' },
];
```

**Review Statuses (hard-coded fallback, canonical values from F9):**
```typescript
const REVIEW_STATUSES = [
  { value: 'SUBMITTED',          label: 'Submitted',
    definition: 'Record is in the system; not yet curated or reviewed.' },
  { value: 'CURATED',            label: 'Curated',
    definition: 'I&R curator has structured and enriched the record; it has not yet received external review.' },
  { value: 'TECHNICALLY_REVIEWED', label: 'Technically Reviewed',
    definition: 'I&R or AO technical team has assessed the technical approach and findings for accuracy.' },
  { value: 'SECURITY_REVIEWED',  label: 'Security Reviewed',
    definition: 'Cybersecurity or ISSO review has been completed for this record.' },
  { value: 'POLICY_REVIEWED',    label: 'Policy Reviewed',
    definition: 'Legal, privacy, or policy review has been completed.' },
  { value: 'VALIDATED_FOR_REUSE', label: 'Validated for Reuse',
    definition: 'All applicable I&R reviews have been completed. This status does not waive local security, policy, or operational review requirements before adoption.' },
  { value: 'SUPERSEDED_RETIRED', label: 'Superseded / Retired',
    definition: 'This record has been replaced by a newer record or retired; retained for institutional history.' },
];
```

Layout per Screen-12:
```tsx
<section>
  <h1>Content Model Reference</h1>
  <p className="read-only-notice">This reference is read-only. Definitions require a code change.</p>

  <h2>Maturity Levels</h2>
  <table>
    <thead><tr><th>Level</th><th>Label</th><th>Color</th><th>Definition</th></tr></thead>
    <tbody>
      {MATURITY_LEVELS.map((m, i) => (
        <tr key={m.value}>
          <td>{i + 1 === 5 ? '—' : i + 1}</td>
          <td><span className="maturity-badge" style={{ backgroundColor: m.color }}>
            {/* colored dot */} {m.label}
          </span></td>
          <td>{m.colorLabel}</td>
          <td>{m.definition}</td>
        </tr>
      ))}
    </tbody>
  </table>

  <h2>Review Statuses</h2>
  <table>
    <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
    <tbody>
      {REVIEW_STATUSES.map(s => (
        <tr key={s.value}>
          <td><strong>{s.label}</strong></td>
          <td>{s.definition}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
```

**US-8.3 acceptance criteria:**
- Accessible at `/admin/content-model` from sidebar ✅
- Displays all 5 maturity levels with color indicator and definition ✅
- Displays all 7 review statuses with definition ✅
- Read-only — no edit controls ✅
- Maturity level color indicator uses the canonical color system (gray/amber/orange/green/dark gray) ✅

---

### Playwright e2e Tests (`e2e/admin-supporting-pages.spec.ts`)

**Setup assumption:** Playwright config (`playwright.config.ts`) exists with `baseURL` set (verify; create if missing). Tests mock the API layer using `page.route()` to avoid requiring a live backend.

```typescript
import { test, expect } from '@playwright/test';

// ── Mock CURATOR session ────────────────────────────────────────────────────
// Most admin pages check OIDC session. Mock by intercepting the session check endpoint
// or by setting a cookie. Adapt to the project's actual auth check mechanism.
// If the admin pages redirect unauthenticated users to /auth/login, mock the session
// endpoint to return a valid CURATOR user.

test.beforeEach(async ({ page }) => {
  // Mock session endpoint (adapt to actual endpoint used by admin pages)
  await page.route('**/api/v1/admin/**', route => {
    // Allow specific routes to pass through to mock handlers below
    route.fallback();
  });
});

// ── Opportunity Submissions ─────────────────────────────────────────────────
test.describe('OpportunitySubmissionsPage', () => {
  test('renders list of submissions from API', async ({ page }) => {
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            submission_id: 'sub-opp-001',
            submitter_name: 'David Reyes',
            submitting_office: 'Eastern VA District Court',
            mission_area: 'Court Operations',
            problem_description: 'Remote hearing scheduling integration for rural courts…',
            status: 'SUBMITTED',
            disposition: null,
            submitted_at: '2026-07-29T14:22:00Z',
          }],
          pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
        }),
      });
    });

    await page.goto('/admin/submissions/opportunities');
    await expect(page.getByText('David Reyes')).toBeVisible();
    await expect(page.getByText('Eastern VA District Court')).toBeVisible();
    // Status badge rendered
    await expect(page.getByText(/SUBMITTED|New|Under Review/i)).toBeVisible();
  });

  test('disposition save fires PATCH with correct payload', async ({ page }) => {
    let patchBody: unknown;
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              submission_id: 'sub-opp-001',
              submitter_name: 'David Reyes',
              submitting_office: 'Eastern VA',
              mission_area: 'Court Operations',
              problem_description: 'Remote hearing scheduling integration…',
              status: 'SUBMITTED',
              disposition: null,
              submitted_at: '2026-07-29T14:22:00Z',
            }],
            pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 },
          }),
        });
      } else if (route.request().method() === 'PATCH') {
        patchBody = JSON.parse(route.request().postData() || '{}');
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-opp-001', disposition: 'UNDER_REVIEW' }) });
      } else {
        route.fallback();
      }
    });

    await page.goto('/admin/submissions/opportunities');
    // Open detail view
    await page.getByRole('link', { name: /Review/i }).first().click();
    // Select disposition
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('UNDER_REVIEW');
    await page.getByRole('button', { name: /Save Disposition/i }).click();

    // Verify PATCH fired with disposition
    await expect(page.getByText(/Disposition saved/i)).toBeVisible();
    expect(patchBody).toMatchObject({ disposition: 'UNDER_REVIEW' });
  });

  test('LINKED_TO_RECORD disposition shows linked_record_id input', async ({ page }) => {
    await page.route('**/api/v1/admin/opportunity-submissions*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          submission_id: 'sub-opp-001', submitter_name: 'Jane', submitting_office: 'AO',
          mission_area: 'Court Ops', problem_description: 'A long enough description here for test…',
          status: 'SUBMITTED', disposition: null, submitted_at: '2026-07-29T14:22:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });

    await page.goto('/admin/submissions/opportunities');
    await page.getByRole('link', { name: /Review/i }).first().click();
    await page.getByRole('combobox', { name: /disposition/i }).selectOption('LINKED_TO_RECORD');
    // linked_record_id input appears
    await expect(page.getByLabel(/Linked Record ID/i)).toBeVisible();
  });
});

// ── Contribution Submissions ────────────────────────────────────────────────
test.describe('ContributionSubmissionsPage', () => {
  test('Create Record CTA is visible after ACCEPTED_FOR_CURATION', async ({ page }) => {
    await page.route('**/api/v1/admin/contribution-submissions*', async route => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [{
            submission_id: 'sub-con-001',
            contact_name: 'Marcus Webb',
            contributing_office: 'Central CA District',
            self_assessed_maturity: 'PROTOTYPE_PILOT',
            work_description: 'Low-bandwidth video conferencing for rural hearings…',
            problem_addressed: 'Rural courts need reliable video hearing access…',
            outcome_summary: 'Prototype achieved 240p video at 256kbps with acceptable quality…',
            artifact_urls: ['https://example.gov/artifact1'],
            status: 'SUBMITTED',
            disposition: 'ACCEPTED_FOR_CURATION',
            submitted_at: '2026-07-28T10:00:00Z',
          }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
        });
      } else if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ submission_id: 'sub-con-001', disposition: 'ACCEPTED_FOR_CURATION' }) });
      } else {
        route.fallback();
      }
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('link', { name: /Review/i }).first().click();
    // CTA visible since disposition is already ACCEPTED_FOR_CURATION
    await expect(page.getByRole('button', { name: /Create Innovation Record from This Submission/i })).toBeVisible();
  });

  test('CTA button is NOT visible when disposition is UNDER_REVIEW', async ({ page }) => {
    await page.route('**/api/v1/admin/contribution-submissions*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          submission_id: 'sub-con-002', contact_name: 'Alex Chen', contributing_office: '9th Circuit',
          self_assessed_maturity: 'EXPERIMENT_POC', work_description: 'Automated scheduling workflow…',
          problem_addressed: 'Manual scheduling is error-prone…', outcome_summary: 'Reduced errors by 40%…',
          artifact_urls: ['https://example.gov/a'], status: 'SUBMITTED', disposition: null,
          submitted_at: '2026-07-20T10:00:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });

    await page.goto('/admin/submissions/contributions');
    await page.getByRole('link', { name: /Review/i }).first().click();
    await expect(page.getByRole('button', { name: /Create Innovation Record/i })).not.toBeVisible();
  });
});

// ── Engagement Activity Log ─────────────────────────────────────────────────
test.describe('EngagementActivityPage', () => {
  test('renders engagement requests and displays routing email', async ({ page }) => {
    await page.route('**/api/v1/admin/engagement-requests*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{
          request_id: 'req-001', request_type: 'REQUEST_TECHNICAL_GUIDANCE',
          record_id: 'rec-001', requestor_name: 'Priya Nair',
          requestor_office: 'District CT', status: 'SUBMITTED',
          submitted_at: '2026-07-29T14:22:00Z',
        }], pagination: { page: 1, page_size: 20, total_count: 1, total_pages: 1 } })
      });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [
          { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
        ] })
      });
    });

    await page.goto('/admin/engagement');
    await expect(page.getByText('Priya Nair')).toBeVisible();
    await expect(page.getByText('AOml_TSO_IRB_Team@ao.uscourts.gov')).toBeVisible();
    await expect(page.getByRole('link', { name: /Update Routing Email|go to Settings/i })).toBeVisible();
  });

  test('filter by type re-fetches with query param', async ({ page }) => {
    let capturedUrl = '';
    await page.route('**/api/v1/admin/engagement-requests*', route => {
      capturedUrl = route.request().url();
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [], pagination: { page: 1, page_size: 20, total_count: 0, total_pages: 0 } }) });
    });
    await page.route('**/api/v1/admin/settings*', route => {
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [{ setting_key: 'engagement_routing_email', setting_value: 'test@example.gov' }] }) });
    });

    await page.goto('/admin/engagement');
    await page.getByRole('combobox', { name: /Type/i }).selectOption('REQUEST_BRIEFING');
    await expect(async () => {
      expect(capturedUrl).toContain('request_type=REQUEST_BRIEFING');
    }).toPass({ timeout: 3000 });
  });
});

// ── Settings Page ───────────────────────────────────────────────────────────
test.describe('SettingsPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/admin/settings*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [
            { setting_key: 'engagement_routing_email', setting_value: 'AOml_TSO_IRB_Team@ao.uscourts.gov' },
          ] }) });
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}');
        const email = body?.settings?.find((s: {setting_key: string}) => s.setting_key === 'engagement_routing_email')?.setting_value;
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: [{ setting_key: 'engagement_routing_email', setting_value: email }] }) });
      } else {
        route.fallback();
      }
    });
  });

  test('loads current routing email on mount', async ({ page }) => {
    await page.goto('/admin/settings');
    const input = page.getByLabel(/Routing Email/i);
    await expect(input).toHaveValue('AOml_TSO_IRB_Team@ao.uscourts.gov');
  });

  test('save with valid email shows success toast', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('newemail@uscourts.gov');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/Routing email updated.*newemail@uscourts.gov/i)).toBeVisible();
  });

  test('save with blank email shows inline error without API call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') apiCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/cannot be blank/i)).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('save with invalid email format shows inline error without API call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/admin/settings', route => {
      if (route.request().method() === 'PUT') apiCalled = true;
      route.fallback();
    });
    await page.goto('/admin/settings');
    await page.getByLabel(/Routing Email/i).fill('not-an-email');
    await page.getByRole('button', { name: /Save Routing Email/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
    expect(apiCalled).toBe(false);
  });
});

// ── Content Model Reference Page ────────────────────────────────────────────
test.describe('ContentModelReferencePage', () => {
  test('renders all 5 maturity levels and 7 review statuses', async ({ page }) => {
    // These pages fall back to hard-coded data; mock API returns 501
    await page.route('**/api/v1/admin/maturity-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });
    await page.route('**/api/v1/admin/review-status-reference*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });

    await page.goto('/admin/content-model');
    // Maturity levels
    await expect(page.getByText('Idea')).toBeVisible();
    await expect(page.getByText('Experiment / POC')).toBeVisible();
    await expect(page.getByText('Prototype / Pilot')).toBeVisible();
    await expect(page.getByText('Production / Validated Pattern')).toBeVisible();
    await expect(page.getByText('Archived')).toBeVisible();
    // Review statuses
    await expect(page.getByText('Submitted')).toBeVisible();
    await expect(page.getByText('Curated')).toBeVisible();
    await expect(page.getByText('Validated for Reuse')).toBeVisible();
    // Read-only notice
    await expect(page.getByText(/read-only.*code change/i)).toBeVisible();
  });

  test('is reachable via admin sidebar link', async ({ page }) => {
    // Mock settings endpoint to prevent AdminLayout sidebar from failing
    await page.route('**/api/v1/admin/dashboard-summary*', route => {
      route.fulfill({ status: 501, contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_IMPLEMENTED' } }) });
    });
    await page.goto('/admin');
    const contentModelLink = page.getByRole('link', { name: /Content Model/i });
    await expect(contentModelLink).toBeVisible();
    await contentModelLink.click();
    await expect(page).toHaveURL(/\/admin\/content-model/);
  });
});
```

**Playwright prerequisite check:** Before writing tests, verify `npx playwright --version` works in the project. If `playwright.config.ts` does not exist, create a minimal one:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.BASE_URL || 'http://localhost:3000' },
});
```
  </action>
  <verify>
grep -n 'EngagementActivityPage' src/pages/admin/EngagementActivityPage.tsx && grep -n 'engagement-requests' src/pages/admin/EngagementActivityPage.tsx && grep -n 'engagement_routing_email\|Routing Email\|go to Settings' src/pages/admin/EngagementActivityPage.tsx && echo "ENGAGEMENT_PAGE_OK"
grep -n 'SettingsPage' src/pages/admin/SettingsPage.tsx && grep -n 'engagement_routing_email' src/pages/admin/SettingsPage.tsx && grep -n 'cannot be blank\|valid email\|Save Routing Email' src/pages/admin/SettingsPage.tsx && echo "SETTINGS_PAGE_OK"
grep -n 'ContentModelReferencePage' src/pages/admin/ContentModelReferencePage.tsx && grep -n 'IDEA\|EXPERIMENT_POC\|PROTOTYPE_PILOT\|PRODUCTION_VALIDATED\|ARCHIVED' src/pages/admin/ContentModelReferencePage.tsx && grep -n 'CURATED\|VALIDATED_FOR_REUSE\|TECHNICALLY_REVIEWED' src/pages/admin/ContentModelReferencePage.tsx && echo "CONTENT_MODEL_OK"
ls e2e/admin-supporting-pages.spec.ts && grep -n 'OpportunitySubmissionsPage\|opportunity-submissions\|ContributionSubmissionsPage\|EngagementActivityPage\|SettingsPage\|ContentModelReferencePage' e2e/admin-supporting-pages.spec.ts && echo "PLAYWRIGHT_FILE_OK"
npx playwright test e2e/admin-supporting-pages.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
  </verify>
  <done>
- `src/pages/admin/EngagementActivityPage.tsx` exports `EngagementActivityPage`; calls `GET /api/v1/admin/engagement-requests` with filter params (record_id, request_type, from_date/to_date); inline status update fires `PATCH /api/v1/admin/engagement-requests/:id`; displays routing email from settings; links to `/admin/settings`
- `src/pages/admin/SettingsPage.tsx` exports `SettingsPage`; loads routing email on mount from `GET /api/v1/admin/settings`; validates non-blank + valid email format client-side before API call; success toast names the new email address; inline errors for blank and invalid format
- `src/pages/admin/ContentModelReferencePage.tsx` exports `ContentModelReferencePage`; renders all 5 maturity levels (IDEA, EXPERIMENT_POC, PROTOTYPE_PILOT, PRODUCTION_VALIDATED, ARCHIVED) with color indicators and definitions; renders all 7 review statuses with definitions; falls back to hard-coded data if API returns 501; read-only notice present
- `e2e/admin-supporting-pages.spec.ts` exists; Playwright tests pass covering: opportunity submissions list + disposition save PATCH + LINKED_TO_RECORD conditional input; contribution submissions Create Record CTA visibility; engagement log renders + filter re-fetches; settings blank/invalid/valid save; content model all 5 maturity + 7 review rows + sidebar reachable
- All tests pass: 0 failing, 0 skipped
</done>

<feature_dependencies>
Implements: F7: Engagement Routing (EngagementActivityPage — US-7.3 curator activity log; SettingsPage — US-7.3 routing email config), F9: Content, Maturity & Trust Model (ContentModelReferencePage — US-8.3 in-app reference), F8: Curation and Administration (all three pages contribute to complete curator control surface)
Depends on: F7: 08-PLAN EngagementService (engagement-requests endpoints), F8: 08-PLAN SettingsService (settings endpoints + maturity/review-status-reference endpoints via admin router)
Enables: Wave 7 end-to-end integration validation of full curator workflow
</feature_dependencies>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→admin-API (disposition updates) | CURATOR-authenticated browser requests carrying disposition values, linked_record_id, internal notes crossing into PATCH /api/v1/admin/opportunity-submissions/:id and PATCH /api/v1/admin/contribution-submissions/:id |
| client→admin-API (settings write) | CURATOR-authenticated browser request carrying engagement_routing_email value crossing into PUT /api/v1/admin/settings |
| client→admin-API (status updates) | CURATOR-authenticated browser request carrying engagement request status crossing into PATCH /api/v1/admin/engagement-requests/:id |
| API-response→DOM (submission content rendering) | Submitter-supplied free-text (problem_description, work_description, internal_note) fetched from API and rendered into admin UI — trust: server already sanitized input, but XSS risk if rendered with dangerouslySetInnerHTML |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-16-01 | Elevation of Privilege | PATCH /api/v1/admin/opportunity-submissions/:id + PATCH /api/v1/admin/contribution-submissions/:id — disposition write | mitigate | Both endpoints are declared CURATOR-gated in `src/routes/admin.js` via `router.use(requireCurator)` (06-PLAN). The frontend sends `credentials: 'same-origin'` so the session cookie is included on every admin fetch. A PUBLIC user without a CURATOR session cookie will receive 401/403 before the disposition is processed. Frontend does not implement its own auth gate beyond relying on session cookie inclusion. |
| T-16-02 | Tampering | PUT /api/v1/admin/settings — routing email can be redirected to attacker-controlled address by a compromised CURATOR account | mitigate | Client-side validation (non-blank + regex) in `SettingsPage.tsx` reduces accidental invalid submissions. Server-side validation in `SettingsService.updateSettings` (08-PLAN) enforces RFC-5321 email format and rejects blank values with 422 INVALID_EMAIL/VALIDATION_ERROR — both enforced server-side independently of client. `updated_by_user_id` FK recorded on every settings change for audit. |
| T-16-03 | Information Disclosure | GET /api/v1/admin/opportunity-submissions, contribution-submissions, engagement-requests — PII in submission data (submitter email, name, office, description) rendered to admin UI | mitigate | All admin API endpoints are CURATOR-gated (requireCurator middleware — 06-PLAN). PII is not exposed on any public endpoint. Admin pages send `credentials: 'same-origin'` — no API key or token in localStorage that could be exfiltrated. |
| T-16-04 | Tampering | API-response→DOM: submitter-supplied free text (problem_description, work_description, internal_note) rendered in React admin components | mitigate | React's JSX rendering escapes HTML by default — text content rendered via `{value}` interpolation is safe. `dangerouslySetInnerHTML` MUST NOT be used in any of the five admin page components. If rich text rendering is needed in future, a sanitize-html pass must precede rendering. Server-side sanitize-html already applied at submission time (07-PLAN SubmissionService). Defense-in-depth: double-sanitized. |
| T-16-05 | Spoofing | "Create Innovation Record from This Submission" — POST /api/v1/admin/contribution-submissions/:id/create-record — CURATOR verifies the submission_id comes from the current curator session | mitigate | The submission_id originates from `GET /api/v1/admin/contribution-submissions` which only returns submissions visible to CURATOR. The POST endpoint requires CURATOR session (requireCurator middleware). The frontend cannot forge a submission_id that wasn't returned by the list endpoint in the same session. |
| T-16-06 | Denial of Service | ContentModelReferencePage — API returns 501; page must not break or expose unhandled error to curator | accept | ContentModelReferencePage falls back to hard-coded constant data when API returns 501 or any error (graceful degradation). No user-visible error for 501. Residual risk: if static data drifts from DB enum values, curator sees stale definitions until code is updated. This is explicitly documented in the mockup ("Definitions require a code change"). Risk accepted — F9 definitions are compile-time constants that change only with code deployments. |
</threat_model>

<verification>
After both tasks complete:

```bash
# 1. All source files exist
ls src/pages/admin/submissions/OpportunitySubmissionsPage.tsx \
   src/pages/admin/submissions/ContributionSubmissionsPage.tsx \
   src/pages/admin/EngagementActivityPage.tsx \
   src/pages/admin/SettingsPage.tsx \
   src/pages/admin/ContentModelReferencePage.tsx \
   e2e/admin-supporting-pages.spec.ts && echo "ALL_FILES_EXIST"

# 2. Sidebar wiring for all 5 pages
grep -n 'submissions/opportunities' src/components/admin/AdminLayout.tsx && \
grep -n 'submissions/contributions' src/components/admin/AdminLayout.tsx && \
grep -n 'admin/engagement' src/components/admin/AdminLayout.tsx && \
grep -n 'admin/settings' src/components/admin/AdminLayout.tsx && \
grep -n 'content-model' src/components/admin/AdminLayout.tsx && echo "SIDEBAR_COMPLETE"

# 3. Key API integrations wired
grep -n 'opportunity-submissions' src/pages/admin/submissions/OpportunitySubmissionsPage.tsx && echo "OPP_API_OK"
grep -n 'create-record' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && \
grep -n 'ACCEPTED_FOR_CURATION' src/pages/admin/submissions/ContributionSubmissionsPage.tsx && echo "CONTRIB_CTA_OK"
grep -n 'engagement-requests' src/pages/admin/EngagementActivityPage.tsx && echo "ENGAGEMENT_API_OK"
grep -n 'admin/settings' src/pages/admin/SettingsPage.tsx && echo "SETTINGS_API_OK"
grep -n 'maturity-reference\|review-status-reference' src/pages/admin/ContentModelReferencePage.tsx && echo "CONTENT_MODEL_API_OK"

# 4. No dangerouslySetInnerHTML in admin pages (XSS guard)
grep -rn 'dangerouslySetInnerHTML' src/pages/admin/ && echo "WARNING: dangerouslySetInnerHTML found" || echo "NO_DANGEROUSLYSETINNERHTML_OK"

# 5. Integration contract verify commands
grep -n 'submissionsRouter' src/routes/submissions.js && grep -n 'create-record' src/routes/submissions.js && echo CONTRACT_OK
grep -n 'listEngagementRequests' src/services/engagement.service.js && grep -n 'updateEngagementRequestStatus' src/services/engagement.service.js && echo CONTRACT_OK
grep -n 'getAllSettings' src/services/settings.service.js && grep -n 'engagement_routing_email' src/services/settings.service.js && echo CONTRACT_OK

# 6. Playwright tests
npx playwright test e2e/admin-supporting-pages.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
</verification>

<success_criteria>
- All 5 admin supporting pages render at their designated routes, reachable from the admin sidebar (no orphan pages)
- OpportunitySubmissionsPage: 4-disposition selector functional, LINKED_TO_RECORD conditional input, PATCH fires on Save
- ContributionSubmissionsPage: "Create Innovation Record from This Submission" CTA visible only when disposition === ACCEPTED_FOR_CURATION; navigates to record edit on click
- EngagementActivityPage: filter dropdowns re-fetch with query params; inline status update fires PATCH; routing email displayed; Settings link present
- SettingsPage: loads current email on mount; blank and invalid format rejected client-side (no API call); valid save fires PUT and shows success toast with email address
- ContentModelReferencePage: all 5 maturity levels and all 7 review statuses rendered; falls back to hard-coded constants if API returns 501; read-only notice present
- AdminLayout sidebar contains all correct NavLinks for existing and new admin pages; active route highlighted
- Playwright e2e tests pass: 0 failing, 0 skipped — covers all 5 pages with API mocking
- No dangerouslySetInnerHTML usage in any admin page component
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/16-SUMMARY.md` with:
- Tasks completed
- Files created/modified
- Key design decisions (router library used, sidebar badge count behavior, hard-coded fallback in ContentModelReferencePage, ACCEPTED_FOR_CURATION CTA reveal logic)
- Any deviations from UX mockup noted with justification
- Integration contracts provided to Wave 7
</output>
