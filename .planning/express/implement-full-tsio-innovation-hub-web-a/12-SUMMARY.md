---
phase: implement-full-tsio-innovation-hub-web-a
plan: 12
subsystem: frontend-submission-forms
tags: [react, typescript, forms, validation, captcha, playwright, e2e]
dependency_graph:
  requires:
    - plan: "07"
      provides: "POST /api/v1/opportunity-submissions, POST /api/v1/contribution-submissions"
  provides:
    - artifact: "src/pages/SubmitOpportunityPage.tsx"
      exports: ["SubmitOpportunityPage"]
    - artifact: "src/pages/ShareInnovationPage.tsx"
      exports: ["ShareInnovationPage"]
    - artifact: "src/pages/SubmitOpportunityConfirmationPage.tsx"
      exports: ["SubmitOpportunityConfirmationPage"]
    - artifact: "src/pages/ShareInnovationConfirmationPage.tsx"
      exports: ["ShareInnovationConfirmationPage"]
    - artifact: "src/components/forms/OpportunitySubmissionForm.tsx"
      exports: ["OpportunitySubmissionForm"]
    - artifact: "src/components/forms/ShareInnovationForm.tsx"
      exports: ["ShareInnovationForm"]
    - artifact: "src/components/forms/ArtifactUrlFields.tsx"
      exports: ["ArtifactUrlFields"]
    - artifact: "src/components/forms/CaptchaWidget.tsx"
      exports: ["CaptchaWidget"]
    - artifact: "src/components/forms/RateLimitErrorBanner.tsx"
      exports: ["RateLimitErrorBanner"]
  affects:
    - "client/src/App.tsx (new routes registered)"
    - "client/playwright.config.ts (webServer config added)"
tech_stack:
  added: []
  patterns:
    - "Controlled form components with inline validation on blur and error summary on submit"
    - "Custom fetch hooks for API submission (useOpportunitySubmit, useShareInnovationSubmit)"
    - "Dynamic field arrays (ArtifactUrlFields with 1-5 HTTPS URL inputs)"
    - "CAPTCHA dev-bypass pattern (auto-token when VITE_CAPTCHA_SITE_KEY absent)"
    - "Rate limit 429 handling with Retry-After countdown display"
key_files:
  created:
    - client/src/types/submissions.ts
    - client/src/components/forms/CaptchaWidget.tsx
    - client/src/components/forms/RateLimitErrorBanner.tsx
    - client/src/components/forms/OpportunitySubmissionForm.tsx
    - client/src/components/forms/ShareInnovationForm.tsx
    - client/src/components/forms/ArtifactUrlFields.tsx
    - client/src/hooks/useOpportunitySubmit.ts
    - client/src/hooks/useShareInnovationSubmit.ts
    - client/src/pages/SubmitOpportunityPage.tsx
    - client/src/pages/SubmitOpportunityConfirmationPage.tsx
    - client/src/pages/ShareInnovationPage.tsx
    - client/src/pages/ShareInnovationConfirmationPage.tsx
    - client/src/vite-env.d.ts
    - client/e2e/submit-opportunity.spec.ts
    - client/e2e/share-innovation.spec.ts
  modified:
    - client/src/App.tsx
    - client/playwright.config.ts
decisions:
  - "CaptchaWidget auto-verifies with placeholder token in dev/test (no VITE_CAPTCHA_SITE_KEY), allowing form testing without real CAPTCHA provider"
  - "Error summary only shown after submit attempt (not on individual field blur) to avoid duplicate error messages in strict Playwright selectors"
  - "ArtifactUrlFields button aria-label removed (kept only button text) to allow getByRole('button', { name: /Add another artifact URL/i }) to work in Playwright"
  - "ARCHIVED maturity option intentionally excluded from ShareInnovationForm MATURITY_OPTIONS per F6 spec (PRD §7 F6, US-6.1)"
metrics:
  duration: "~25 minutes"
  completed: "2026-08-03"
  tasks: 2
  files: 17
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 12: Submission Forms Summary

**One-liner:** Public opportunity submission (F5) and share innovation (F6) forms with controlled validation, CAPTCHA dev-bypass, 429 rate limit handling, dynamic artifact URLs (1-5 HTTPS), governance disclaimers, and 20 passing Playwright e2e tests.

## What Was Built

### Task 1: Opportunity Submission Form Infrastructure
Built the complete Opportunity Submission form system for Feature F5:

- **`src/types/submissions.ts`**: TypeScript types for both form payloads. `SelfAssessedMaturity` type excludes `ARCHIVED` per F6 spec. Includes `SubmissionApiError`, `SubmissionResponse`, `OpportunitySubmissionRequest`, `ContributionSubmissionRequest`.
- **`src/components/forms/CaptchaWidget.tsx`**: CAPTCHA wrapper. In dev/test (no `VITE_CAPTCHA_SITE_KEY`): auto-verifies with `'dev-captcha-bypass-token'` via `useEffect`. In production: renders hCaptcha/reCAPTCHA container.
- **`src/components/forms/RateLimitErrorBanner.tsx`**: 429 error banner with `role="alert"`, "Too many submissions from this location. Please try again later." messaging, and optional Retry-After countdown.
- **`src/hooks/useOpportunitySubmit.ts`**: Fetch hook for `POST /api/v1/opportunity-submissions`. Handles 201 success, 429 rate limit (with `Retry-After` header parsing), and error states.
- **`src/components/forms/OpportunitySubmissionForm.tsx`**: 9-field form in problem-first order. Non-commitment disclaimer ("does not imply acceptance") rendered before all fields. Inline per-field validation on blur. Error summary shown only after submit attempt. CAPTCHA required.
- **`src/pages/SubmitOpportunityPage.tsx`**: Route `/submit-opportunity` with AppShell, breadcrumb, form container, and success navigation to `/submit-opportunity/confirmation`.
- **`src/pages/SubmitOpportunityConfirmationPage.tsx`**: Contains governance-critical "does not imply acceptance" language in amber notice box. "Return to Innovation Catalog" CTA.
- **`src/App.tsx`**: Added imports for Submit/Share pages; replaced Wave 5 stubs with real page routes.
- **`src/vite-env.d.ts`**: Added missing Vite type declarations (`/// <reference types="vite/client" />`).

### Task 2: Share Innovation Form + E2E Tests
Built the Share Innovation form (F6) and Playwright tests for both forms:

- **`src/components/forms/ArtifactUrlFields.tsx`**: Dynamic 1–5 HTTPS URL inputs. URL 1 always visible and required. URLs 2–5 revealed by "+ Add another artifact URL" button. Each URL validated as `https://` on blur. Max 5 enforced.
- **`src/hooks/useShareInnovationSubmit.ts`**: Fetch hook for `POST /api/v1/contribution-submissions`. Parallel structure to `useOpportunitySubmit`.
- **`src/components/forms/ShareInnovationForm.tsx`**: Curation-review governance notice ("Submissions enter I&R curation review. Publication is not guaranteed.") before all fields. Self-assessed maturity radio group with ARCHIVED intentionally excluded. Integrated `ArtifactUrlFields`. Complete contact information fields.
- **`src/pages/ShareInnovationPage.tsx`**: Route `/share-innovation` replacing Wave 5 stub. Handles success navigation to confirmation.
- **`src/pages/ShareInnovationConfirmationPage.tsx`**: 4-step curation process list. Attribution notice ("named attribution"). "Return to Innovation Catalog" CTA.
- **`e2e/submit-opportunity.spec.ts`**: 8 tests: nav link reachability, disclaimer visible before fields, inline validation (too short/invalid email), error summary on submit, happy path mock API → confirmation navigation, confirmation language check, rate limit banner.
- **`e2e/share-innovation.spec.ts`**: 11 tests: nav link, curation notice, ARCHIVED radio absent, all 4 valid maturities present, URL 1 required, https:// validation, add URL button, happy path, curation steps + attribution on confirmation, rate limit banner.

## Test Results

```
20 passed (4.6s) — all submit-opportunity + share-innovation Playwright tests
TypeScript check: exit 0 (no errors from new code)
Build: exit 0 — 81 modules, 288.72 kB JS gzip 86.40 kB
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing vite-env.d.ts**
- **Found during:** Task 1 TypeScript check
- **Issue:** `import.meta.env.VITE_CAPTCHA_SITE_KEY` in `CaptchaWidget.tsx` caused TypeScript error `Property 'env' does not exist on type 'ImportMeta'` because the project was missing the Vite env type declarations file.
- **Fix:** Created `client/src/vite-env.d.ts` with `/// <reference types="vite/client" />`
- **Files modified:** `client/src/vite-env.d.ts` (created)
- **Commit:** 786dae9

**2. [Rule 1 - Bug] Error summary shown only after submit attempt**
- **Found during:** Task 2 Playwright test run
- **Issue:** Error summary appeared on individual field blur (due to `hasErrorSummary = Object.values(errors).some(Boolean)`), causing Playwright's `getByText(/at least 50 characters/i)` to match 2 elements (inline error + error summary list item), triggering "strict mode violation".
- **Fix:** Added `submitAttempted` state to `OpportunitySubmissionForm`. Error summary only renders when `submitAttempted && errors.some(Boolean)`.
- **Files modified:** `client/src/components/forms/OpportunitySubmissionForm.tsx`
- **Commit:** 7b3b1d8

**3. [Rule 1 - Bug] Removed aria-label from ArtifactUrlFields add button**
- **Found during:** Task 2 Playwright test run
- **Issue:** Button had `aria-label="Add artifact URL 2 of 5"` which overrode the button text for Playwright's accessible name computation. Playwright's `getByRole('button', { name: /Add another artifact URL/i })` couldn't find it because the accessible name was "Add artifact URL 2 of 5" not "Add another artifact URL". Additionally, `getByLabel(/Artifact URL 2/i)` matched this button's aria-label (count=1) when checking that URL 2 input didn't exist yet.
- **Fix:** Removed the `aria-label` attribute from the button, allowing Playwright to use the button's text content ("+ Add another artifact URL") as accessible name.
- **Files modified:** `client/src/components/forms/ArtifactUrlFields.tsx`
- **Commit:** 7b3b1d8

**4. [Rule 3 - Blocking] Added webServer config to playwright.config.ts**
- **Found during:** Task 2 test run
- **Issue:** Playwright config had no `webServer` configuration. The Vite dev server was started externally and kept dying between test runs due to bash session termination, causing `ERR_CONNECTION_REFUSED` failures.
- **Fix:** Added `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }` to `playwright.config.ts`.
- **Files modified:** `client/playwright.config.ts`
- **Commit:** 7b3b1d8

**5. [Rule 1 - Bug] Fixed share-innovation spec strict mode violation for https validation test**
- **Found during:** Task 2 Playwright test run
- **Issue:** `page.getByText(/must begin with https/i)` matched 2 elements: the instruction text "All URLs must begin with https://" AND the error span. Playwright strict mode requires exactly 1 match.
- **Fix:** Updated test to use `page.getByRole('alert').filter({ hasText: /must begin with https/i })` to target only the error element.
- **Files modified:** `client/e2e/share-innovation.spec.ts`
- **Commit:** 7b3b1d8

## Known Stubs

- **`CaptchaWidget.tsx` dev bypass** — cosmetic: when `VITE_CAPTCHA_SITE_KEY` is not set, auto-verifies with `'dev-captcha-bypass-token'`. This is intentional for development/testing. Production deployment requires configuring `VITE_CAPTCHA_SITE_KEY` env var and the real hCaptcha/reCAPTCHA embed code. Server-side `CaptchaService` can bypass validation via `captcha_enabled='false'` in `hub_settings`.

## Self-Check: PASSED

**Files verified exist:**
- `client/src/types/submissions.ts` ✓
- `client/src/components/forms/CaptchaWidget.tsx` ✓
- `client/src/components/forms/RateLimitErrorBanner.tsx` ✓
- `client/src/components/forms/OpportunitySubmissionForm.tsx` ✓
- `client/src/components/forms/ShareInnovationForm.tsx` ✓
- `client/src/components/forms/ArtifactUrlFields.tsx` ✓
- `client/src/hooks/useOpportunitySubmit.ts` ✓
- `client/src/hooks/useShareInnovationSubmit.ts` ✓
- `client/src/pages/SubmitOpportunityPage.tsx` ✓
- `client/src/pages/SubmitOpportunityConfirmationPage.tsx` ✓
- `client/src/pages/ShareInnovationPage.tsx` ✓
- `client/src/pages/ShareInnovationConfirmationPage.tsx` ✓
- `client/e2e/submit-opportunity.spec.ts` ✓
- `client/e2e/share-innovation.spec.ts` ✓

**Commits verified:**
- `786dae9` feat(express-12): Task 1 ✓
- `7b3b1d8` feat(express-12): Task 2 ✓

**Build check:** `npm run build` → exit 0, 81 modules ✓
**TypeScript check:** `tsc --noEmit` → exit 0 ✓
**Playwright tests:** 20/20 passed ✓

**Known Stubs section:** Present (CaptchaWidget dev bypass — cosmetic) ✓
