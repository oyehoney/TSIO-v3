---
phase: implement-full-tsio-innovation-hub-web-a
plan: 13
subsystem: frontend-engagement-modal
tags: [react, typescript, modal, engagement, captcha, playwright, wcag, f7]
dependency_graph:
  requires:
    - plan: "08"
      artifact: "POST /api/v1/engagement-requests"
      reason: "Form submits to this endpoint"
    - plan: "11"
      artifact: "client/src/components/record/NextActionPanel.tsx"
      reason: "NextActionPanel provides trigger buttons; RecordPage wires modal"
  provides:
    - artifact: "client/src/components/engagement/EngagementRequestModal.tsx"
      exports: ["EngagementRequestModal", "EngagementType"]
      consumers: ["RecordPage (Plan 11)", "Wave 7 integration tests"]
    - artifact: "client/src/components/engagement/useEngagementForm.ts"
      exports: ["useEngagementForm", "UseEngagementFormResult"]
    - artifact: "client/src/components/engagement/EngagementConfirmation.tsx"
      exports: ["EngagementConfirmation"]
    - artifact: "client/src/components/engagement/CaptchaWidget.tsx"
      exports: ["CaptchaWidget"]
  affects:
    - "client/src/pages/RecordPage.tsx — wired EngagementRequestModal; handles focus return"
tech_stack:
  added: []
  patterns:
    - "React portal-style modal overlay (fixed positioning, z-index 50)"
    - "WCAG 2.1 AA focus trap pattern with Tab cycling and Escape close"
    - "document.activeElement capture for trigger button focus return"
    - "CAPTCHA dev-bypass: VITE_CAPTCHA_SITE_KEY absent → visible bypass button"
    - "Playwright route interception for API mocking in e2e tests"
key_files:
  created:
    - client/src/components/engagement/useEngagementForm.ts
    - client/src/components/engagement/CaptchaWidget.tsx
    - client/src/components/engagement/EngagementConfirmation.tsx
    - client/src/components/engagement/EngagementRequestModal.tsx
    - client/e2e/engagement-modal.spec.ts
    - client/src/pages/ShareInnovationPage.tsx (stub - Rule 1 auto-fix)
    - client/src/pages/ShareInnovationConfirmationPage.tsx (stub - Rule 1 auto-fix)
  modified:
    - client/src/pages/RecordPage.tsx
decisions:
  - "CAPTCHA dev-bypass: CaptchaWidget renders a visible orange-bordered DEV button (not auto-verify) when VITE_CAPTCHA_SITE_KEY is absent, matching UX mockup Screen 03 requirement for visible challenge widget; differs from forms/CaptchaWidget.tsx which auto-verifies immediately"
  - "WCAG focus return: used document.activeElement capture at click time to obtain trigger button reference, since OnEngagementRequest callback signature (2-arg) cannot carry button element"
  - "Env var prefix: used VITE_CAPTCHA_SITE_KEY (Vite convention) instead of plan's NEXT_PUBLIC_CAPTCHA_SITE_KEY (Next.js convention)"
  - "E2E test location: client/e2e/ (matches playwright.config.ts testDir) not root e2e/"
  - "Error handling: 429 → 'Too many requests. Please try again later.'; 5xx → 'Unable to submit at this time. Please try again or contact the I&R team directly.'"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-08-03"
  tasks_completed: 2
  files_changed: 8
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 13: Engagement Request Modal Summary

**One-liner:** Engagement request modal with WCAG focus trap, 4 engagement types, CAPTCHA dev-bypass, rate-limit/server-error banners, and in-modal confirmation — 13 Playwright tests pass.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | EngagementRequestModal, useEngagementForm, EngagementConfirmation, CaptchaWidget | `eccce08` | ✅ |
| 2 | Playwright e2e tests for engagement modal | `af4281c` | ✅ |

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `client/src/components/engagement/useEngagementForm.ts` | Form state, validation, API submit hook | ~190 |
| `client/src/components/engagement/CaptchaWidget.tsx` | CAPTCHA wrapper with dev-bypass | ~70 |
| `client/src/components/engagement/EngagementConfirmation.tsx` | In-modal success view | ~70 |
| `client/src/components/engagement/EngagementRequestModal.tsx` | Main modal overlay component | ~240 |
| `client/e2e/engagement-modal.spec.ts` | Playwright e2e tests — 13 tests | ~277 |

## Files Modified

| File | Change |
|------|--------|
| `client/src/pages/RecordPage.tsx` | Wired `EngagementRequestModal`; added modal state + `handleEngagementRequest`; `handleModalClose` returns focus to trigger (WCAG 2.1 AA) |

## Key Implementation Decisions

### 1. CAPTCHA Widget Strategy
The UX mockup requires a visible challenge widget (not invisible reCAPTCHA v3). Two CaptchaWidget implementations exist in the project:
- `client/src/components/forms/CaptchaWidget.tsx` (Plan 12): auto-verifies immediately in dev mode — optimized for form submission flows
- `client/src/components/engagement/CaptchaWidget.tsx` (this plan): renders a visible DEV bypass button — submit remains blocked until explicitly clicked, matching UX mockup Screen 03

### 2. Dev-Bypass Pattern
When `VITE_CAPTCHA_SITE_KEY` env var is absent, the engagement CaptchaWidget renders an amber-bordered warning box with a "Bypass CAPTCHA (dev only)" button. This:
- Keeps submit disabled until explicitly bypassed (unlike auto-verify)
- Is clearly labeled to avoid production confusion
- Enables full e2e test coverage without CAPTCHA provider accounts

### 3. WCAG Focus Return Implementation
`OnEngagementRequest` signature is `(type, record) => void` — cannot carry a button element. Solution: `RecordPage.handleEngagementRequest` captures `document.activeElement` immediately when called (it will be the just-clicked button), stores it in `triggerButtonRef.current`, and calls `.focus()` in `handleModalClose`. This satisfies WCAG 2.1 AA focus management without changing the shared callback type.

### 4. Env Var Convention
Plan specified `NEXT_PUBLIC_CAPTCHA_SITE_KEY` (Next.js convention). This project uses Vite, so the correct variable is `VITE_CAPTCHA_SITE_KEY`. This is aligned with the existing `forms/CaptchaWidget.tsx` implementation.

## Integration Contracts

### Provided (for Wave 4c RecordPage / Wave 7 integration)
```typescript
export type EngagementType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING';

export interface EngagementRequestModalProps {
  engagementType: EngagementType;
  recordId: string;
  recordTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EngagementRequestModal(props: EngagementRequestModalProps): JSX.Element | null;
```

RecordPage is already wired — clicking any engagement button in NextActionPanel now opens the modal with correct type.

### Consumed (from Wave 3c / Plan 08)
- `POST /api/v1/engagement-requests` — sends `{ request_type, record_id, requestor_name, requestor_email, requestor_office, description_of_interest, desired_next_step?, captcha_token }`
- Rate limit (429) and server error (5xx) responses handled with user-visible banners

## Playwright Test Coverage

**Location:** `client/e2e/engagement-modal.spec.ts`  
**Tests:** 13 tests, 13 passed (0 failures, 2.2s total)

| Test | State Covered |
|------|--------------|
| Open via "Request a Demo" | Modal opens, correct title, record pre-populated, CAPTCHA visible |
| Open via "Request Technical Guidance" | Correct title for technical guidance type |
| Close via × button | Modal closes, focus returns to trigger (WCAG) |
| Close via Cancel | Modal closes |
| Close via Escape | Modal closes |
| Submit disabled without CAPTCHA | CAPTCHA gate enforced |
| Happy path submit → confirmation | Full form flow; confirmation state visible |
| Close confirmation | Confirmation → modal closed |
| Inline validation: required field blur | Name error shown on blur |
| Inline validation: description too short | Error shown for <20 chars |
| Rate-limit (429) | Error banner "Too many requests"; modal stays open |
| Server error (500) | Error banner "Unable to submit at this time" |
| Character count | Live count updates as user types |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing ShareInnovation page imports in App.tsx**
- **Found during:** Task 1 TypeScript check
- **Issue:** `client/src/App.tsx` imported `ShareInnovationPage` and `ShareInnovationConfirmationPage` from `./pages/` but these files did not exist, causing TypeScript build failure
- **Fix:** Created stub implementations at `client/src/pages/ShareInnovationPage.tsx` and `client/src/pages/ShareInnovationConfirmationPage.tsx` (Plan 12 had these in untracked working tree and they were later incorporated)
- **Files modified:** `client/src/pages/ShareInnovationPage.tsx`, `client/src/pages/ShareInnovationConfirmationPage.tsx`
- **Commit:** eccce08

**2. [Rule 3 - Adaptation] Vite env var prefix**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `NEXT_PUBLIC_CAPTCHA_SITE_KEY` (Next.js convention); project uses Vite
- **Fix:** Used `import.meta.env.VITE_CAPTCHA_SITE_KEY` (Vite convention), consistent with existing `forms/CaptchaWidget.tsx`
- **No behavior change** — same pattern, different env var name

**3. [Rule 3 - Adaptation] E2e test location**
- **Found during:** Task 2
- **Issue:** Plan specifies `e2e/engagement-modal.spec.ts` (project root) but `playwright.config.ts` `testDir` points to `client/e2e/`
- **Fix:** Created test at `client/e2e/engagement-modal.spec.ts` to match Playwright configuration
- **Commit:** af4281c

**4. [Rule 3 - Adaptation] E2e tests use API route mocking for record endpoint**
- **Found during:** Task 2
- **Issue:** Plan assumes seeded `test-record-001` record, but no live seed data was available (only DB running, no API server)
- **Fix:** Added `mockRecordApi()` helper that intercepts `GET /api/v1/records/test-record-001` with a complete mock record response; all engagement API calls also mocked — tests run fully offline against Vite preview server

## Known Stubs

None found in the created engagement modal components. The `ShareInnovationPage.tsx` stub created as a Rule 1 auto-fix was subsequently updated to a fuller implementation from Plan 12's working tree.

## Self-Check: PASSED

- ✅ `client/src/components/engagement/EngagementRequestModal.tsx` — exists, 240+ lines
- ✅ `client/src/components/engagement/useEngagementForm.ts` — exists, 190+ lines  
- ✅ `client/src/components/engagement/EngagementConfirmation.tsx` — exists
- ✅ `client/src/components/engagement/CaptchaWidget.tsx` — exists
- ✅ `client/e2e/engagement-modal.spec.ts` — exists, 277 lines
- ✅ Commits verified: `eccce08` (Task 1), `af4281c` (Task 2)
- ✅ Build check: `npx tsc --noEmit` → exit 0 (no errors)
- ✅ Playwright tests: 13/13 passed, 0 failures
- ✅ No blocking stubs in engagement modal components
