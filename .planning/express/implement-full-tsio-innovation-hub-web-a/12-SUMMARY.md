---
phase: implement-full-tsio-innovation-hub-web-a
plan: "12"
subsystem: Opportunity & Contribution Submission forms (F5, F6 frontend)
tags: [react, forms, captcha, rate-limiting, submission, wcag]

dependency_graph:
  requires:
    - "07-PLAN: SubmissionService (POST /api/v1/opportunity-submissions, POST /api/v1/contribution-submissions)"
    - "08-PLAN: SettingsService (CAPTCHA_ENABLED hub_setting)"
  provides:
    - "src/client/types/submissions.ts — OpportunitySubmissionRequest, ContributionSubmissionRequest, SelfAssessedMaturity (ARCHIVED excluded)"
    - "src/client/components/forms/OpportunitySubmissionForm.tsx — problem-first form with inline validation"
    - "src/client/components/forms/CaptchaWidget.tsx — reCAPTCHA v3 with dev bypass"
    - "src/client/components/forms/RateLimitErrorBanner.tsx — Retry-After countdown"
    - "src/client/hooks/useOpportunitySubmit.ts — handles 201/422/429 from POST /api/v1/opportunity-submissions"
    - "src/client/pages/SubmitOpportunityPage.tsx — /submit-opportunity route"
    - "src/client/pages/SubmitOpportunityConfirmationPage.tsx — 'does not imply acceptance' confirmation"
    - "src/client/App.tsx — updated with top nav and submission routes"
  affects:
    - "Wave 7 integration — submission flow tested end-to-end"

key_files:
  created:
    - path: "src/client/types/submissions.ts"
      purpose: "TypeScript types for all submission request/response shapes; SelfAssessedMaturity enum excludes ARCHIVED"
    - path: "src/client/components/forms/OpportunitySubmissionForm.tsx"
      purpose: "Problem-first 8-field form; inline validation; 'does not imply acceptance' disclaimer text verbatim from FRD"
    - path: "src/client/components/forms/CaptchaWidget.tsx"
      purpose: "reCAPTCHA v2 widget; auto-bypass when VITE_CAPTCHA_SITE_KEY absent (dev)"
    - path: "src/client/components/forms/RateLimitErrorBanner.tsx"
      purpose: "429 rate limit banner with Retry-After countdown"
    - path: "src/client/hooks/useOpportunitySubmit.ts"
      purpose: "Form submission hook; handles 201/422/429 from POST /api/v1/opportunity-submissions"
    - path: "src/client/pages/SubmitOpportunityPage.tsx"
      purpose: "/submit-opportunity page"
    - path: "src/client/pages/SubmitOpportunityConfirmationPage.tsx"
      purpose: "Confirmation page with verbatim 'not a commitment' text from FRD"
  modified:
    - path: "src/client/App.tsx"
      purpose: "Top nav (Catalog | Submit a Mission Problem | Share Your Innovation Work) + routes"

commits:
  - hash: "316910a"
    message: "feat(implement-full-tsio-innovation-hub-web-a-12): implement opportunity submission page, form, types, hooks"

notes:
  - "Share Innovation (/share-innovation) contribution form not committed in this plan — deferred to integration wave"
  - "Playwright e2e tests deferred — browser binary missing libglib-2.0.so.0 in sandbox"
  - "Confirmation text matches FRD F05 verbatim"
