---
phase: implement-full-tsio-innovation-hub-web-a
plan: 15
subsystem: admin-frontend-lifecycle
tags: [react, typescript, tailwind, playwright, lifecycle, governance, admin]
dependency_graph:
  requires:
    - plan-05: publicationLifecycleService, governanceGateService, recordHandler lifecycle endpoints
    - plan-14: AdminApp routing, AdminShell, ReadinessChecklist, PublicationStateChip
  provides:
    - PublicationLifecycleControls: state-aware action buttons for all 5 publication states
    - ConfirmationDialog: reusable modal for Edit Published/Archive/Supersede transitions
    - GovernanceGateFeedback: inline error panel for PUBLICATION_GATE_FAILED 422 responses
    - MaturityLevelDropdown + ReviewStatusDropdown: controlled dropdowns with inline definitions
    - RecordEditPage: fully integrated edit/create form with lifecycle controls
  affects:
    - plan-16: admin supporting pages (uses same AdminShell, routing conventions)
tech_stack:
  added: []
  patterns:
    - React functional components with TypeScript
    - Tailwind CSS for Plan 15 components (inline styles for Plan 14 RecordEditPage shell)
    - Playwright e2e tests with page.route() API mocking (no live backend required)
    - Direct fetch() to /api/v1/records/:id endpoints (corrected from adminApiClient)
key_files:
  created:
    - client/src/admin/components/ConfirmationDialog.tsx
    - client/src/admin/components/GovernanceGateFeedback.tsx
    - client/src/admin/components/MaturityStatusDropdowns.tsx
    - client/src/admin/components/PublicationLifecycleControls.tsx
    - client/e2e/admin/record-lifecycle-controls.spec.ts
    - client/src/pages/admin/EngagementActivityPage.tsx (stub, unblocks TSC)
    - client/src/pages/admin/SettingsPage.tsx (stub, unblocks TSC)
    - client/src/pages/admin/ContentModelReferencePage.tsx (stub, unblocks TSC)
    - client/src/admin/pages/RecordsListPage.tsx (stub, unblocks TSC)
  modified:
    - client/src/admin/pages/RecordEditPage.tsx
decisions:
  - "canSubmitForReview computed from Plan 14 ReadinessChecklist (50+ char minimums) not simple non-empty check"
  - "GovernanceGateFeedback blockingFields accepts field keys (snake_case); FIELD_LABELS map provides human-readable names"
  - "ConfirmationDialog reused for Edit Published, Archive, and Supersede via supersede prop variant"
  - "ARCHIVED maturity advisory shown when maturity_level=ARCHIVED AND publication_state=PUBLISHED (US-9.3 AC)"
  - "RecordEditPage API calls use /api/v1/records/:id (direct fetch) per actual backend route contracts, not /api/v1/admin/records/:id (NOT_IMPLEMENTED)"
metrics:
  duration: ~45 minutes
  completed: "2026-08-03"
  tasks: 2
  files: 9
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 15: Publication Lifecycle Controls Summary

**One-liner:** Lifecycle action button bar (Submit/Publish/Supersede/Archive/Edit), ConfirmationDialog modals, GovernanceGateFeedback error panel, and MaturityLevel/ReviewStatus dropdowns with inline definitions — all integrated into RecordEditPage with 21 passing Playwright tests.

## Tasks Completed

### Task 1: Publication lifecycle controls — PublicationLifecycleControls, ConfirmationDialog, GovernanceGateFeedback, MaturityStatusDropdowns

**Commit:** `49e484e`

Created four React TypeScript components in `client/src/admin/components/`:

- **`ConfirmationDialog.tsx`** — Reusable modal with `role="dialog"` aria-modal, focus management on cancel button, and a supersede variant that renders a `linked_record_id` input with required validation. Used for Edit Published (danger), Archive (danger), and Supersede transitions.

- **`GovernanceGateFeedback.tsx`** — Inline error panel with `aria-live="polite"` and `role="alert"`. Renders `⛔ Cannot publish — missing required fields:` with a list of human-readable field names mapped from the 18+ API field keys (snake_case → label via `FIELD_LABELS` map). Returns null when `blockingFields` is empty.

- **`MaturityStatusDropdowns.tsx`** — `MaturityLevelDropdown` (5 options) and `ReviewStatusDropdown` (7 options). Each renders an inline definition for the selected value below the dropdown with a `View all definitions →` link to `/admin/content-model`. Includes `data-testid="archived-maturity-advisory"` panel when maturity=ARCHIVED and publication_state=PUBLISHED (US-9.3 AC).

- **`PublicationLifecycleControls.tsx`** — State machine-driven action buttons: DRAFT (Submit for Review ▶ + Save Draft), REVIEW (Return to Draft + Publish ▶ + Save Draft), PUBLISHED (Edit + Supersede + Archive), SUPERSEDED (Archive only), ARCHIVED (read-only message). Submit for Review disabled when `!canSubmitForReview`. Calls `/api/v1/records/:id/submit-review`, `/publish`, `/return-to-draft`, `/supersede`, `/archive` directly via fetch. Fires `onTransitionSuccess(newState, publishedAt?)` or `onTransitionError(code, blockingFields?)`. All buttons have `data-testid` attributes.

Also created stub pages to unblock TypeScript compilation:
- `RecordsListPage.tsx`, `EngagementActivityPage.tsx`, `SettingsPage.tsx`, `ContentModelReferencePage.tsx`

### Task 2: RecordEditPage integration + Playwright e2e lifecycle tests

**Commit:** `0dd18e4`

**RecordEditPage integration:**

Updated the existing Plan 14 `RecordEditPage.tsx` (1520 lines) to integrate Plan 15 components:

1. **Import updates:** Removed `adminApiClient` import; added `PublicationLifecycleControls`, `GovernanceGateFeedback`, `MaturityLevelDropdown`, `ReviewStatusDropdown` imports.

2. **API fix (Rule 1 deviation):** Replaced `adminApiClient.getRecord(id)` (calls `/api/v1/admin/records/:id` — NOT_IMPLEMENTED in backend) with direct `fetch('/api/v1/records/${id}')`. Replaced `adminApiClient.createRecord/updateRecord` with direct fetch to `/api/v1/records`. The backend has these routes implemented via Plan 05's `recordHandler.js`.

3. **Lifecycle transition handlers:** Replaced `adminApiClient.transitionRecord()` (calls non-existent `/api/v1/admin/records/:id/lifecycle`) with `handleTransitionSuccess`/`handleTransitionError` callbacks passed to `PublicationLifecycleControls` which calls the correct individual endpoints.

4. **Component replacement:** Replaced inline GovernanceGate error display with `<GovernanceGateFeedback blockingFields={governanceError ?? []} />`. Replaced inline maturity/review dropdowns with `<MaturityLevelDropdown>` and `<ReviewStatusDropdown>`. Replaced inline action buttons with `<PublicationLifecycleControls>`.

5. **Testid additions:** Added `data-testid="publication-state-badge"` wrapper around `PublicationStateChip`, `data-testid="readiness-checklist"` on sidebar, `data-testid="save-error"` on API error banner.

**Playwright e2e tests (`client/e2e/admin/record-lifecycle-controls.spec.ts`):**

21 tests across 6 describe blocks — **all 21 pass**:
- DRAFT state: renders Submit/Save Draft, enabled when all fields complete, transitions to REVIEW
- REVIEW state: renders Publish/Return to Draft, success updates badge, 422 PUBLICATION_GATE_FAILED shows GovernanceGateFeedback with correct field labels
- PUBLISHED state: Edit/Supersede/Archive visible (not Submit), Edit opens warning modal, confirm transitions to REVIEW, cancel keeps PUBLISHED, Archive confirmation + endpoint call, Supersede requires linked_record_id
- SUPERSEDED state: only Archive visible
- ARCHIVED state: read-only message, no action buttons
- Maturity/Review dropdowns: inline definitions, "View all maturity definitions →" links, ARCHIVED advisory
- Publication Readiness Checklist: Submit disabled when missing, count displays correctly

## Files Created

| File | Purpose |
|------|---------|
| `client/src/admin/components/ConfirmationDialog.tsx` | Reusable modal for Edit/Archive/Supersede |
| `client/src/admin/components/GovernanceGateFeedback.tsx` | Inline PUBLICATION_GATE_FAILED error panel |
| `client/src/admin/components/MaturityStatusDropdowns.tsx` | Maturity + review status dropdowns with inline definitions |
| `client/src/admin/components/PublicationLifecycleControls.tsx` | State-aware action button bar |
| `client/e2e/admin/record-lifecycle-controls.spec.ts` | 21 Playwright tests — all pass |
| `client/src/admin/pages/RecordsListPage.tsx` | Stub (unblocks TSC for AdminApp imports) |
| `client/src/pages/admin/EngagementActivityPage.tsx` | Stub (unblocks TSC for AdminApp imports) |
| `client/src/pages/admin/SettingsPage.tsx` | Stub (unblocks TSC for AdminApp imports) |
| `client/src/pages/admin/ContentModelReferencePage.tsx` | Stub (unblocks TSC for AdminApp imports) |

## Files Modified

| File | Changes |
|------|---------|
| `client/src/admin/pages/RecordEditPage.tsx` | Integrated Plan 15 components; fixed API calls from adminApiClient to direct fetch |
| `client/src/admin/components/MaturityStatusDropdowns.tsx` | Fixed aria-label to match Playwright accessible name regex |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed RecordEditPage API calls using non-existent admin endpoints**
- **Found during:** Task 2
- **Issue:** Plan 14's RecordEditPage used `adminApiClient.getRecord()` (calls `/api/v1/admin/records/:id`), `adminApiClient.createRecord/updateRecord`, and `adminApiClient.transitionRecord()` (calls `/api/v1/admin/records/:id/lifecycle`). These admin-prefixed endpoints are NOT_IMPLEMENTED in the backend — the actual implemented endpoints are at `/api/v1/records/:id` per Plan 05's `recordHandler.js`.
- **Fix:** Replaced all `adminApiClient` data/lifecycle calls with direct `fetch()` calls to the correct `/api/v1/records/:id` endpoints.
- **Files modified:** `client/src/admin/pages/RecordEditPage.tsx`
- **Commit:** `0dd18e4`

**2. [Rule 3 - Blocking] Created stub pages to unblock TypeScript compilation**
- **Found during:** Task 1 verification
- **Issue:** Plan 14's AdminApp.tsx imports `EngagementActivityPage`, `SettingsPage`, `ContentModelReferencePage` from `../pages/admin/` — these are Plan 16 artifacts that don't yet exist. TypeScript compilation failed.
- **Fix:** Created minimal stub implementations for all three pages.
- **Files modified:** 3 new stub pages
- **Commit:** `49e484e`

**3. [Rule 1 - Bug] Fixed aria-label conflicting with Playwright accessible name matching**
- **Found during:** Task 2 Playwright test run
- **Issue:** `MaturityLevelDropdown` had `aria-label="View all maturity level definitions"` on the link, but Playwright's `getByRole('link', {name: /view all maturity definitions/i})` couldn't match it (regex didn't match "level" suffix).
- **Fix:** Removed conflicting aria-label so accessible name derives from visible text ("View all maturity definitions →") which matches the regex.
- **Files modified:** `client/src/admin/components/MaturityStatusDropdowns.tsx`
- **Commit:** `0dd18e4`

**4. [Rule 1 - Bug] Updated mock data in Playwright tests to meet ReadinessChecklist 50-char minimums**
- **Found during:** Task 2 Playwright test run  
- **Issue:** Plan 14's `ReadinessChecklist` requires 50+ characters for `problem_statement`, `what_was_explored`, `outcome_summary`, `executive_perspective_text`, `executive_recommendation`. The initial test mock used short values, causing unexpected checklist failures.
- **Fix:** Updated all text fields in `mockRecord()` helper to use 50+ character values.
- **Files modified:** `client/e2e/admin/record-lifecycle-controls.spec.ts`
- **Commit:** `0dd18e4`

## Integration Contracts Provided to Wave 7

```typescript
// PublicationLifecycleControls — exported from client/src/admin/components/PublicationLifecycleControls.tsx
PublicationLifecycleControls({
  publicationState: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED',
  recordId: string,
  canSubmitForReview: boolean,  // from ReadinessChecklist.getMissingPubRequiredFields()
  isSaving?: boolean,
  onSaveDraft?: () => Promise<void>,
  onTransitionSuccess: (newState: string, publishedAt?: string) => void,
  onTransitionError: (code: string, blockingFields?: string[]) => void,
})

// GovernanceGateFeedback — exported from client/src/admin/components/GovernanceGateFeedback.tsx
GovernanceGateFeedback({ blockingFields: string[] })  // field keys from PUBLICATION_GATE_FAILED

// MaturityLevelDropdown — exported from client/src/admin/components/MaturityStatusDropdowns.tsx
MaturityLevelDropdown({ value, onChange, publicationState?, disabled?, error? })

// ReviewStatusDropdown — exported from client/src/admin/components/MaturityStatusDropdowns.tsx
ReviewStatusDropdown({ value, onChange, disabled?, error? })

// ConfirmationDialog — exported from client/src/admin/components/ConfirmationDialog.tsx
ConfirmationDialog({ open, title, body, confirmLabel, cancelLabel?, variant?, onConfirm, onCancel })
// Supersede variant: <ConfirmationDialog supersede ... /> adds linked_record_id input
```

## Known Stubs

**None found in Plan 15 deliverables.** All components implement real behavior.

**Cosmetic stubs (in supporting files):**
- `client/src/admin/pages/RecordsListPage.tsx` — stub list page (Plan 14 responsibility). Does not affect Plan 15 lifecycle controls.
- `client/src/pages/admin/EngagementActivityPage.tsx` — stub (Plan 16 responsibility).
- `client/src/pages/admin/SettingsPage.tsx` — stub (Plan 16 responsibility).
- `client/src/pages/admin/ContentModelReferencePage.tsx` — stub (Plan 16 responsibility).

## Self-Check: PASSED

**Files created/exist:**
- ✅ `client/src/admin/components/ConfirmationDialog.tsx`
- ✅ `client/src/admin/components/GovernanceGateFeedback.tsx`
- ✅ `client/src/admin/components/MaturityStatusDropdowns.tsx`
- ✅ `client/src/admin/components/PublicationLifecycleControls.tsx`
- ✅ `client/src/admin/pages/RecordEditPage.tsx`
- ✅ `client/e2e/admin/record-lifecycle-controls.spec.ts`

**Commits exist:**
- ✅ `49e484e`: feat(implement-full-tsio-innovation-hub-web-a-15): add lifecycle action control components
- ✅ `0dd18e4`: feat(implement-full-tsio-innovation-hub-web-a-15): integrate lifecycle controls into RecordEditPage + Playwright tests

**Build check:** `npm run build` → exit 0 (vite build successful, 103 modules)

**TypeScript:** `tsc --noEmit` → exit 0

**Playwright tests:** 21/21 pass

**Known Stubs section:** Present — none blocking.
