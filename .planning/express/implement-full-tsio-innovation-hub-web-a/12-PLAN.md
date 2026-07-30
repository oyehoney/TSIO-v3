---
phase: implement-full-tsio-innovation-hub-web-a
plan: 12
type: execute
wave: 5
depends_on: [2, 3]
files_modified:
  - src/pages/SubmitOpportunityPage.tsx
  - src/pages/SubmitOpportunityConfirmationPage.tsx
  - src/pages/ShareInnovationPage.tsx
  - src/pages/ShareInnovationConfirmationPage.tsx
  - src/components/forms/OpportunitySubmissionForm.tsx
  - src/components/forms/ShareInnovationForm.tsx
  - src/components/forms/ArtifactUrlFields.tsx
  - src/components/forms/CaptchaWidget.tsx
  - src/components/forms/RateLimitErrorBanner.tsx
  - src/hooks/useOpportunitySubmit.ts
  - src/hooks/useShareInnovationSubmit.ts
  - src/types/submissions.ts
  - src/App.tsx
  - e2e/submit-opportunity.spec.ts
  - e2e/share-innovation.spec.ts
autonomous: true

features:
  implements: ["F5", "F6"]
  depends_on: ["F7"]
  enables: ["F5", "F6"]

must_haves:
  truths:
    - "User can navigate to /submit-opportunity from top nav 'Submit a Mission Problem' link; form renders with non-commitment disclaimer visible before any fields"
    - "Opportunity form fields appear in problem-first order: problem description → mission area → urgency context → known constraints → submitting office → submitter name → title → email → CAPTCHA → submit"
    - "Opportunity form validates inline: problem description 50–3000 chars, mission area required, submitting office/name/email required, email format valid; errors shown per-field on blur and on submit; error summary at top on failed submit"
    - "Successful opportunity form submit POSTs to /api/v1/opportunity-submissions with captcha_token, navigates to /submit-opportunity/confirmation with explicit 'does not imply acceptance' messaging and 'Return to Innovation Catalog' CTA"
    - "Rate limit response (429) from API shows RateLimitErrorBanner: 'Too many submissions from this location. Please try again later.' — form stays accessible but submit is blocked until timeout"
    - "User can navigate to /share-innovation from top nav 'Share Your Innovation Work' link; curation-review governance notice visible before all fields"
    - "Share Innovation form fields: problem addressed → work description → outcome summary → maturity self-assessment (radio: IDEA/EXPERIMENT_POC/PROTOTYPE_PILOT/PRODUCTION_VALIDATED — no ARCHIVED) → artifact URLs (1 required, up to 5 with '+ Add another URL' button) → contributing team → contributing office → contact name → contact title → contact email → CAPTCHA → submit"
    - "Artifact URL inputs validate https:// protocol on blur; Artifact URL 1 is required; URLs 2–5 appear only after '+ Add another artifact URL' button clicked (up to 5 total)"
    - "Successful share-innovation submit POSTs to /api/v1/contribution-submissions with artifact_urls array, navigates to /share-innovation/confirmation with curation-steps messaging and attribution notice"
    - "Both confirmation pages include 'Return to Innovation Catalog' CTA linking to /catalog"
    - "Both pages are wired into top nav as 'Submit a Mission Problem' and 'Share Your Innovation Work' links"
    - "Playwright tests cover full happy-path flows and key error states for both forms"
  artifacts:
    - path: "src/pages/SubmitOpportunityPage.tsx"
      provides: "Route /submit-opportunity — renders OpportunitySubmissionForm with page chrome"
      exports: ["SubmitOpportunityPage"]
    - path: "src/pages/SubmitOpportunityConfirmationPage.tsx"
      provides: "Route /submit-opportunity/confirmation — success confirmation with non-commitment messaging"
      exports: ["SubmitOpportunityConfirmationPage"]
    - path: "src/pages/ShareInnovationPage.tsx"
      provides: "Route /share-innovation — renders ShareInnovationForm with page chrome"
      exports: ["ShareInnovationPage"]
    - path: "src/pages/ShareInnovationConfirmationPage.tsx"
      provides: "Route /share-innovation/confirmation — curation-process confirmation with attribution messaging"
      exports: ["ShareInnovationConfirmationPage"]
    - path: "src/components/forms/OpportunitySubmissionForm.tsx"
      provides: "Controlled form with inline validation; problem-first ordering; CAPTCHA; non-commitment disclaimer"
      exports: ["OpportunitySubmissionForm"]
    - path: "src/components/forms/ShareInnovationForm.tsx"
      provides: "Controlled form with inline validation; maturity radio (no ARCHIVED); dynamic artifact URL inputs (1–5); CAPTCHA"
      exports: ["ShareInnovationForm"]
    - path: "src/components/forms/ArtifactUrlFields.tsx"
      provides: "Dynamic 1–5 HTTPS URL inputs with '+ Add another' button and per-field https:// validation"
      exports: ["ArtifactUrlFields"]
    - path: "src/components/forms/CaptchaWidget.tsx"
      provides: "CAPTCHA integration placeholder / hCaptcha/reCAPTCHA wrapper; accepts onVerify callback"
      exports: ["CaptchaWidget"]
    - path: "src/components/forms/RateLimitErrorBanner.tsx"
      provides: "429 rate-limit banner with Retry-After countdown display"
      exports: ["RateLimitErrorBanner"]
    - path: "src/types/submissions.ts"
      provides: "OpportunitySubmissionRequest, ContributionSubmissionRequest, SubmissionResponse TS types"
      exports: ["OpportunitySubmissionRequest", "ContributionSubmissionRequest", "SubmissionResponse", "SelfAssessedMaturity"]
    - path: "e2e/submit-opportunity.spec.ts"
      provides: "Playwright e2e tests: happy path, validation errors, rate limit feedback, nav link reachability"
    - path: "e2e/share-innovation.spec.ts"
      provides: "Playwright e2e tests: happy path, ARCHIVED maturity absent, https:// URL validation, artifact URL add/remove, nav link reachability"
  key_links:
    - from: "src/components/forms/OpportunitySubmissionForm.tsx"
      to: "POST /api/v1/opportunity-submissions"
      via: "useOpportunitySubmit hook — fetch with JSON body including captcha_token"
      pattern: "opportunity-submissions"
    - from: "src/components/forms/ShareInnovationForm.tsx"
      to: "POST /api/v1/contribution-submissions"
      via: "useShareInnovationSubmit hook — fetch with artifact_urls array"
      pattern: "contribution-submissions"
    - from: "src/pages/SubmitOpportunityPage.tsx"
      to: "src/pages/SubmitOpportunityConfirmationPage.tsx"
      via: "React Router navigate('/submit-opportunity/confirmation') on 201 response"
      pattern: "submit-opportunity/confirmation"
    - from: "src/pages/ShareInnovationPage.tsx"
      to: "src/pages/ShareInnovationConfirmationPage.tsx"
      via: "React Router navigate('/share-innovation/confirmation') on 201 response"
      pattern: "share-innovation/confirmation"
    - from: "src/App.tsx"
      to: "src/pages/SubmitOpportunityPage.tsx and ShareInnovationPage.tsx"
      via: "React Router routes + top nav links"
      pattern: "submit-opportunity|share-innovation"

integration_contracts:
  requires:
    - from_plan: "07"
      artifact: "src/routes/submissions.js"
      exports:
        - "POST /api/v1/opportunity-submissions — public, rate-limited (5/hr), CAPTCHA-validated"
        - "POST /api/v1/contribution-submissions — public, rate-limited (5/hr), CAPTCHA-validated"
      verify: "grep -n 'opportunity-submissions' src/routes/submissions.js && grep -n 'contribution-submissions' src/routes/submissions.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/pages/SubmitOpportunityPage.tsx"
      exports: ["SubmitOpportunityPage"]
      shape: |
        Route: /submit-opportunity
        Top nav link label: "Submit a Mission Problem"
        Page title: "Submit a Mission Problem"
        Contains: <OpportunitySubmissionForm> with non-commitment disclaimer box
        On 201: navigate to /submit-opportunity/confirmation
        On 429: show RateLimitErrorBanner
      verify: "grep -n 'SubmitOpportunityPage' src/pages/SubmitOpportunityPage.tsx && grep -n 'submit-opportunity' src/App.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/ShareInnovationPage.tsx"
      exports: ["ShareInnovationPage"]
      shape: |
        Route: /share-innovation
        Top nav link label: "Share Your Innovation Work"
        Page title: "Share Your Innovation Work"
        Contains: <ShareInnovationForm> with curation-review governance notice
        On 201: navigate to /share-innovation/confirmation
        On 429: show RateLimitErrorBanner
      verify: "grep -n 'ShareInnovationPage' src/pages/ShareInnovationPage.tsx && grep -n 'share-innovation' src/App.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/SubmitOpportunityConfirmationPage.tsx"
      exports: ["SubmitOpportunityConfirmationPage"]
      shape: |
        Route: /submit-opportunity/confirmation
        Must contain: "does not imply acceptance" language (exact phrase from UX mockup)
        Must contain: "Return to Innovation Catalog" link to /catalog
      verify: "grep -n 'SubmitOpportunityConfirmationPage' src/pages/SubmitOpportunityConfirmationPage.tsx && grep -n 'does not imply acceptance' src/pages/SubmitOpportunityConfirmationPage.tsx && echo CONTRACT_OK"
    - artifact: "src/pages/ShareInnovationConfirmationPage.tsx"
      exports: ["ShareInnovationConfirmationPage"]
      shape: |
        Route: /share-innovation/confirmation
        Must contain: curation-process step messaging (4 steps from UX mockup)
        Must contain: "attribution" language
        Must contain: "Return to Innovation Catalog" link to /catalog
      verify: "grep -n 'ShareInnovationConfirmationPage' src/pages/ShareInnovationConfirmationPage.tsx && grep -n 'attribution' src/pages/ShareInnovationConfirmationPage.tsx && echo CONTRACT_OK"
    - artifact: "src/components/forms/OpportunitySubmissionForm.tsx"
      exports: ["OpportunitySubmissionForm"]
      shape: |
        Props: { onSuccess: () => void }
        Fields (in order): problem_description (textarea 50–3000, required), mission_area (select required),
          urgency_context (textarea optional), known_constraints (textarea optional),
          submitting_office (text required), submitter_name (text required), submitter_title (text optional),
          submitter_email (email required), captcha_token (CaptchaWidget required)
        Disclaimer: ℹ box before fields: "does not imply acceptance"
        Inline errors: per-field on blur; error summary on submit attempt
        Rate limit: calls onRateLimit -> shows RateLimitErrorBanner
      verify: "grep -n 'problem_description' src/components/forms/OpportunitySubmissionForm.tsx && grep -n 'submitter_email' src/components/forms/OpportunitySubmissionForm.tsx && grep -n 'captcha' src/components/forms/OpportunitySubmissionForm.tsx && echo CONTRACT_OK"
    - artifact: "src/components/forms/ShareInnovationForm.tsx"
      exports: ["ShareInnovationForm"]
      shape: |
        Props: { onSuccess: () => void }
        Fields (in order): problem_addressed (textarea 50–2000, required), work_description (textarea 50–3000, required),
          outcome_summary (textarea 50–2000, required),
          self_assessed_maturity (radio: IDEA|EXPERIMENT_POC|PROTOTYPE_PILOT|PRODUCTION_VALIDATED — NO ARCHIVED option),
          artifact_urls via <ArtifactUrlFields> (1 required, up to 5 total),
          contributing_team (text required), contributing_office (text required),
          contact_name (text required), contact_title (text optional),
          contact_email (email required), captcha_token (CaptchaWidget required)
        Governance notice at top: "Submissions enter I&R curation review. Publication is not guaranteed."
      verify: "grep -n 'self_assessed_maturity' src/components/forms/ShareInnovationForm.tsx && grep -n 'ARCHIVED' src/components/forms/ShareInnovationForm.tsx && echo CONTRACT_OK"
    - artifact: "src/components/forms/ArtifactUrlFields.tsx"
      exports: ["ArtifactUrlFields"]
      shape: |
        Props: { urls: string[], onChange: (urls: string[]) => void, error?: string[] }
        Renders Artifact URL 1 (required), URLs 2–5 (optional, revealed by "+ Add another artifact URL" button)
        Max 5 inputs; button hidden when 5 reached
        Each input validated: must start with https:// ; error shown inline per field
      verify: "grep -n 'ArtifactUrlFields' src/components/forms/ArtifactUrlFields.tsx && grep -n 'https://' src/components/forms/ArtifactUrlFields.tsx && echo CONTRACT_OK"
    - artifact: "e2e/submit-opportunity.spec.ts"
      exports: ["Playwright tests for /submit-opportunity"]
      shape: |
        Test cases: nav link reachable from /, form renders with disclaimer, happy path submit navigates to confirmation,
        problem_description too short shows error, missing required fields shows error summary,
        confirmation page contains non-commitment language, Return to Catalog link works
      verify: "grep -n 'submit-opportunity' e2e/submit-opportunity.spec.ts && grep -n 'confirmation' e2e/submit-opportunity.spec.ts && echo CONTRACT_OK"
    - artifact: "e2e/share-innovation.spec.ts"
      exports: ["Playwright tests for /share-innovation"]
      shape: |
        Test cases: nav link reachable, form renders with curation notice, ARCHIVED radio option absent,
        artifact URL 1 required, invalid https URL shows error, add second URL with button,
        happy path submit navigates to confirmation, confirmation contains curation steps + attribution
      verify: "grep -n 'share-innovation' e2e/share-innovation.spec.ts && grep -n 'ARCHIVED' e2e/share-innovation.spec.ts && echo CONTRACT_OK"
---

<objective>
Build the two public submission form pages for Wave 5a: Opportunity Submission (/submit-opportunity) and Share Innovation (/share-innovation). Both forms submit to the Wave 3 SubmissionService API (07-PLAN.md), include CAPTCHA integration, inline validation, rate-limit error feedback, and navigate to confirmation pages on success. Both pages are wired into top-nav navigation (no orphan routes). Playwright e2e tests cover both form flows.

Purpose: F5 and F6 give operational leaders and innovation contributors a governed, unauthenticated pathway into the I&R review queue. Without these forms, stakeholders can only discover work — they cannot submit problems or share contributions. The "does not imply acceptance" and "curation review required" messaging are governance-critical per PRD §7 F5/F6 and UX Mockup Screens 04/05.

Output:
- src/pages/SubmitOpportunityPage.tsx + confirmation page
- src/pages/ShareInnovationPage.tsx + confirmation page
- src/components/forms/OpportunitySubmissionForm.tsx
- src/components/forms/ShareInnovationForm.tsx
- src/components/forms/ArtifactUrlFields.tsx (dynamic 1–5 HTTPS URL inputs)
- src/components/forms/CaptchaWidget.tsx
- src/components/forms/RateLimitErrorBanner.tsx
- src/hooks/useOpportunitySubmit.ts + useShareInnovationSubmit.ts
- src/types/submissions.ts
- App.tsx route registration + top nav wiring
- e2e/submit-opportunity.spec.ts + e2e/share-innovation.spec.ts
</objective>

<feature_dependencies>
Implements: F5: Opportunity Submission (public /submit-opportunity form with problem-first ordering, non-commitment disclaimer, CAPTCHA, rate limit feedback, confirmation page), F6: Share Existing Innovation Work (public /share-innovation form with curation-review messaging, self_assessed_maturity excluding ARCHIVED, 1–5 HTTPS artifact URL inputs, confirmation page)
Depends on: F7: Engagement Routing — SubmissionService API (POST /api/v1/opportunity-submissions, POST /api/v1/contribution-submissions) provided by Wave 3 Plan 07; CaptchaService, RateLimiter, EmailService provided by same plan
Enables: F5: Wave 6 admin OpportunitySubmissionsPage has records to display; F6: Wave 6 ContributionSubmissionsPage has records to display; F5/F6: Wave 7 end-to-end integration validates full submission flow
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/07-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md
@project_specs/PRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Opportunity Submission page, form, shared form components, types, hooks, nav wiring, and routes</name>
  <files>
    src/types/submissions.ts
    src/components/forms/CaptchaWidget.tsx
    src/components/forms/RateLimitErrorBanner.tsx
    src/hooks/useOpportunitySubmit.ts
    src/components/forms/OpportunitySubmissionForm.tsx
    src/pages/SubmitOpportunityPage.tsx
    src/pages/SubmitOpportunityConfirmationPage.tsx
    src/App.tsx
  </files>
  <action>
Implement the Opportunity Submission form page and all shared form infrastructure it introduces. Wire both routes into the app router and top nav.

---

### src/types/submissions.ts

TypeScript types for both submission forms. Consume exactly what 07-PLAN.md SubmissionService expects.

```typescript
// src/types/submissions.ts

// Maturity levels available for self-assessment on contribution form (ARCHIVED excluded per F6 spec)
export type SelfAssessedMaturity =
  | 'IDEA'
  | 'EXPERIMENT_POC'
  | 'PROTOTYPE_PILOT'
  | 'PRODUCTION_VALIDATED';

// Display labels for self-assessed maturity radio buttons
export const SELF_ASSESSED_MATURITY_LABELS: Record<SelfAssessedMaturity, string> = {
  IDEA: 'Idea (problem identified, no exploration yet)',
  EXPERIMENT_POC: 'Experiment / POC (feasibility explored)',
  PROTOTYPE_PILOT: 'Prototype / Pilot (working model tested)',
  PRODUCTION_VALIDATED: 'Production / Validated (deployed and operating)',
};

// POST /api/v1/opportunity-submissions request body (from 07-PLAN.md SubmissionService spec)
export interface OpportunitySubmissionRequest {
  problem_description: string;       // required, 50–3000 chars
  mission_area: string;              // required
  submitting_office: string;         // required
  submitter_name: string;            // required
  submitter_email: string;           // required, valid email
  submitter_title?: string;          // optional
  urgency_context?: string;          // optional
  known_constraints?: string;        // optional
  captcha_token: string;             // required
}

// POST /api/v1/contribution-submissions request body (from 07-PLAN.md SubmissionService spec)
export interface ContributionSubmissionRequest {
  work_description: string;          // required, 50–3000 chars
  problem_addressed: string;         // required, 50–2000 chars
  outcome_summary: string;           // required, 50–2000 chars
  self_assessed_maturity: SelfAssessedMaturity; // required, ARCHIVED excluded
  artifact_urls: string[];           // required, 1–5 valid HTTPS URLs
  contributing_team: string;         // required
  contributing_office: string;       // required
  contact_name: string;              // required
  contact_email: string;             // required, valid email
  contact_title?: string;            // optional
  additional_context?: string;       // optional
  captcha_token: string;             // required
}

// Shared API submission response shape
export interface SubmissionResponse {
  submission_id: string;
  status: 'SUBMITTED';
  submitted_at: string;
}

// API error shape
export interface SubmissionApiError {
  code: 'CAPTCHA_INVALID' | 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'ARTIFACT_URL_REQUIRED' | 'INVALID_ARTIFACT_URL';
  message: string;
  fields?: Array<{ field: string; error_code: string; message: string }>;
  retryAfter?: number;
}
```

---

### src/components/forms/CaptchaWidget.tsx

Placeholder/integration wrapper. For MVP, renders a visible checkbox-style placeholder that calls `onVerify('mock-captcha-token')` immediately (allowing form testing without real CAPTCHA credentials). When `VITE_CAPTCHA_SITE_KEY` env var is set, switch to real hCaptcha embed. Accepts `onVerify` callback.

```tsx
// src/components/forms/CaptchaWidget.tsx
import React, { useEffect } from 'react';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/**
 * CAPTCHA integration widget.
 * In test/dev mode (no VITE_CAPTCHA_SITE_KEY): immediately issues a placeholder token.
 * In production: embed hCaptcha or reCAPTCHA using the site key env var.
 * 
 * Federal network note: CAPTCHA_ENABLED can be set to 'false' in hub_settings to bypass 
 * server-side validation entirely for environments where external CAPTCHA provider calls are blocked.
 */
export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify, onExpire }) => {
  const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY;

  useEffect(() => {
    // In test/dev without a real site key, issue a placeholder token immediately
    // Server-side CaptchaService will bypass validation when captcha_enabled='false' in hub_settings
    if (!siteKey) {
      onVerify('dev-captcha-bypass-token');
    }
  }, [siteKey, onVerify]);

  if (!siteKey) {
    return (
      <div
        className="border border-gray-300 rounded p-3 bg-gray-50 text-sm text-gray-600"
        aria-label="CAPTCHA verification (development mode — auto-verified)"
        role="status"
      >
        <span className="text-green-700 font-medium">✓ CAPTCHA verification active</span>
        <span className="ml-2 text-gray-500">(Configure VITE_CAPTCHA_SITE_KEY for production CAPTCHA)</span>
      </div>
    );
  }

  // Production: render hCaptcha iframe (requires @hcaptcha/react-hcaptcha or similar)
  // Replace this comment with real provider embed when VITE_CAPTCHA_SITE_KEY is configured.
  return (
    <div
      id="captcha-container"
      data-sitekey={siteKey}
      className="h-captcha"
      aria-label="CAPTCHA verification"
    />
  );
};
```

---

### src/components/forms/RateLimitErrorBanner.tsx

Displayed when the API returns 429. Shows the "Too many submissions" message and optionally a countdown to retry.

```tsx
// src/components/forms/RateLimitErrorBanner.tsx
import React from 'react';

interface RateLimitErrorBannerProps {
  retryAfterSeconds?: number;
}

/**
 * Rate limit error banner shown when the API returns 429 RATE_LIMIT_EXCEEDED.
 * Per UX mockup Screen 05 states: "Too many submissions from this location. Please try again later."
 */
export const RateLimitErrorBanner: React.FC<RateLimitErrorBannerProps> = ({ retryAfterSeconds }) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-50 border border-red-300 rounded-md p-4 flex items-start gap-3"
    >
      <span className="text-red-600 text-lg flex-shrink-0" aria-hidden="true">⚠</span>
      <div>
        <p className="text-red-800 font-semibold text-sm">Too many submissions</p>
        <p className="text-red-700 text-sm mt-1">
          Too many submissions from this location. Please try again later.
          {retryAfterSeconds && retryAfterSeconds > 0 && (
            <span> You may try again in approximately {Math.ceil(retryAfterSeconds / 60)} minute{Math.ceil(retryAfterSeconds / 60) !== 1 ? 's' : ''}.</span>
          )}
        </p>
      </div>
    </div>
  );
};
```

---

### src/hooks/useOpportunitySubmit.ts

Submit hook that calls `POST /api/v1/opportunity-submissions`, handles 201/422/429 response shapes from 07-PLAN.md.

```typescript
// src/hooks/useOpportunitySubmit.ts
import { useState } from 'react';
import type { OpportunitySubmissionRequest, SubmissionResponse, SubmissionApiError } from '../types/submissions';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: SubmissionResponse }
  | { status: 'error'; error: SubmissionApiError }
  | { status: 'rate_limited'; retryAfter?: number };

export function useOpportunitySubmit() {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function submit(payload: OpportunitySubmissionRequest): Promise<boolean> {
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/v1/opportunity-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data: SubmissionResponse = await res.json();
        setState({ status: 'success', data });
        return true;
      }

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        setState({ status: 'rate_limited', retryAfter });
        return false;
      }

      const errorBody = await res.json();
      setState({ status: 'error', error: errorBody.error as SubmissionApiError });
      return false;
    } catch {
      setState({
        status: 'error',
        error: { code: 'VALIDATION_ERROR', message: 'Unable to submit at this time. Please try again or contact the I&R team directly.' },
      });
      return false;
    }
  }

  function reset() {
    setState({ status: 'idle' });
  }

  return { state, submit, reset };
}
```

---

### src/components/forms/OpportunitySubmissionForm.tsx

The main opportunity submission form. Implements problem-first field ordering as specified in UX Mockup Screen 04. Non-commitment disclaimer is rendered **before all fields** per UX spec.

```tsx
// src/components/forms/OpportunitySubmissionForm.tsx
import React, { useState, useCallback } from 'react';
import { CaptchaWidget } from './CaptchaWidget';
import { RateLimitErrorBanner } from './RateLimitErrorBanner';
import { useOpportunitySubmit } from '../../hooks/useOpportunitySubmit';
import type { OpportunitySubmissionRequest } from '../../types/submissions';

// Mission area options — based on Judiciary domain (curator-configurable in future; hardcoded for MVP)
const MISSION_AREAS = [
  'Case Management',
  'Court Operations',
  'Records Management',
  'Cybersecurity',
  'Cloud Infrastructure',
  'AI / Machine Learning',
  'Communication Systems',
  'Access to Justice',
  'Human Resources',
  'Financial Management',
  'Other',
];

interface OpportunitySubmissionFormProps {
  onSuccess: () => void;
}

type FormErrors = Partial<Record<keyof OpportunitySubmissionRequest | 'summary', string>>;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const OpportunitySubmissionForm: React.FC<OpportunitySubmissionFormProps> = ({ onSuccess }) => {
  const { state, submit } = useOpportunitySubmit();

  const [fields, setFields] = useState({
    problem_description: '',
    mission_area: '',
    urgency_context: '',
    known_constraints: '',
    submitting_office: '',
    submitter_name: '',
    submitter_title: '',
    submitter_email: '',
  });
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'problem_description':
        if (!value || value.trim().length < 50) return 'Problem description must be at least 50 characters.';
        if (value.trim().length > 3000) return 'Problem description must be 3000 characters or fewer.';
        break;
      case 'mission_area':
        if (!value) return 'Mission area is required.';
        break;
      case 'submitting_office':
        if (!value || value.trim().length < 2) return 'Submitting office is required.';
        break;
      case 'submitter_name':
        if (!value || value.trim().length < 2) return 'Your name is required.';
        break;
      case 'submitter_email':
        if (!value) return 'Email address is required.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        break;
    }
    return undefined;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }

  function validateAll(): FormErrors {
    const newErrors: FormErrors = {};
    const requiredFields = ['problem_description', 'mission_area', 'submitting_office', 'submitter_name', 'submitter_email'];
    requiredFields.forEach(fieldName => {
      const error = validateField(fieldName, fields[fieldName as keyof typeof fields] || '');
      if (error) newErrors[fieldName as keyof OpportunitySubmissionRequest] = error;
    });
    if (!captchaToken) {
      newErrors['summary'] = 'Please complete the CAPTCHA verification.';
    }
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched({
        problem_description: true,
        mission_area: true,
        submitting_office: true,
        submitter_name: true,
        submitter_email: true,
      });
      return;
    }

    const payload: OpportunitySubmissionRequest = {
      problem_description: fields.problem_description.trim(),
      mission_area: fields.mission_area,
      submitting_office: fields.submitting_office.trim(),
      submitter_name: fields.submitter_name.trim(),
      submitter_email: fields.submitter_email.trim(),
      ...(fields.submitter_title.trim() && { submitter_title: fields.submitter_title.trim() }),
      ...(fields.urgency_context.trim() && { urgency_context: fields.urgency_context.trim() }),
      ...(fields.known_constraints.trim() && { known_constraints: fields.known_constraints.trim() }),
      captcha_token: captchaToken,
    };

    const success = await submit(payload);
    if (success) {
      onSuccess();
    }
  }

  const isSubmitting = state.status === 'submitting';
  const serverErrors = state.status === 'error' ? state.error.fields : undefined;
  const hasErrorSummary = Object.values(errors).some(Boolean) || serverErrors?.length;

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Submit a Mission Problem">
      {/* Non-commitment disclaimer — must appear before all fields per UX Mockup Screen 04 */}
      <div
        role="note"
        className="bg-blue-50 border border-blue-300 rounded-md p-4 mb-6 flex gap-3"
        aria-label="Important notice about this submission"
      >
        <span className="text-blue-600 flex-shrink-0 text-lg" aria-hidden="true">ℹ</span>
        <p className="text-blue-900 text-sm">
          Submitting this form <strong>does not imply acceptance</strong> of the opportunity into the I&R portfolio or a
          commitment to begin a project or establish a timeline.
        </p>
      </div>

      {/* Error summary (rendered when submit attempted with errors) */}
      {hasErrorSummary && (
        <div role="alert" aria-live="polite" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="font-semibold text-red-800 text-sm mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.values(errors).filter(Boolean).map((msg, i) => <li key={i}>{msg}</li>)}
            {serverErrors?.map((f, i) => <li key={`srv-${i}`}>{f.message}</li>)}
          </ul>
        </div>
      )}

      {/* Rate limit error */}
      {state.status === 'rate_limited' && (
        <div className="mb-6">
          <RateLimitErrorBanner retryAfterSeconds={state.retryAfter} />
        </div>
      )}

      {/* Server error */}
      {state.status === 'error' && state.error.code !== 'VALIDATION_ERROR' && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">{state.error.message}</p>
        </div>
      )}

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Describe the Problem —</legend>

        {/* Problem description — first field (problem-first ordering) */}
        <div className="mb-4">
          <label htmlFor="problem_description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe the mission problem you are facing <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Focus on the challenge, not a proposed solution. What is difficult or impossible today? Who is affected?</p>
          <textarea
            id="problem_description"
            name="problem_description"
            value={fields.problem_description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            maxLength={3000}
            disabled={isSubmitting}
            aria-describedby="problem_description_count problem_description_error"
            aria-invalid={!!errors.problem_description}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.problem_description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            <span id="problem_description_error" role="alert" className="text-xs text-red-600">{errors.problem_description || ''}</span>
            <span id="problem_description_count" className="text-xs text-gray-400">{fields.problem_description.length} / 3000</span>
          </div>
        </div>

        {/* Mission area */}
        <div className="mb-4">
          <label htmlFor="mission_area" className="block text-sm font-medium text-gray-700 mb-1">
            Mission Area <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Select the primary mission area this problem affects.</p>
          <select
            id="mission_area"
            name="mission_area"
            value={fields.mission_area}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.mission_area}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.mission_area ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select mission area</option>
            {MISSION_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {errors.mission_area && <span role="alert" className="text-xs text-red-600">{errors.mission_area}</span>}
        </div>

        {/* Urgency context (optional) */}
        <div className="mb-4">
          <label htmlFor="urgency_context" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Is there a decision deadline or event driving urgency?</p>
          <textarea
            id="urgency_context"
            name="urgency_context"
            value={fields.urgency_context}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Known constraints (optional) */}
        <div className="mb-4">
          <label htmlFor="known_constraints" className="block text-sm font-medium text-gray-700 mb-1">
            Known Constraints <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Budget, policy, technical, or operational constraints the I&R team should be aware of.</p>
          <textarea
            id="known_constraints"
            name="known_constraints"
            value={fields.known_constraints}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Contact Information —</legend>

        {/* Submitting office */}
        <div className="mb-4">
          <label htmlFor="submitting_office" className="block text-sm font-medium text-gray-700 mb-1">
            Submitting Office <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="submitting_office"
            name="submitting_office"
            type="text"
            value={fields.submitting_office}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitting_office}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitting_office ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitting_office && <span role="alert" className="text-xs text-red-600">{errors.submitting_office}</span>}
        </div>

        {/* Submitter name */}
        <div className="mb-4">
          <label htmlFor="submitter_name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="submitter_name"
            name="submitter_name"
            type="text"
            value={fields.submitter_name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitter_name}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitter_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitter_name && <span role="alert" className="text-xs text-red-600">{errors.submitter_name}</span>}
        </div>

        {/* Submitter title (optional) */}
        <div className="mb-4">
          <label htmlFor="submitter_title" className="block text-sm font-medium text-gray-700 mb-1">
            Your Title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="submitter_title"
            name="submitter_title"
            type="text"
            value={fields.submitter_title}
            onChange={handleChange}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submitter email */}
        <div className="mb-4">
          <label htmlFor="submitter_email" className="block text-sm font-medium text-gray-700 mb-1">
            Your Email Address <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">A confirmation may be sent to this address.</p>
          <input
            id="submitter_email"
            name="submitter_email"
            type="email"
            value={fields.submitter_email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.submitter_email}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.submitter_email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.submitter_email && <span role="alert" className="text-xs text-red-600">{errors.submitter_email}</span>}
        </div>
      </fieldset>

      {/* CAPTCHA */}
      <div className="mb-6">
        <CaptchaWidget onVerify={handleCaptchaVerify} />
        {errors.summary && !Object.keys(errors).filter(k => k !== 'summary').some(k => errors[k as keyof FormErrors]) && (
          <span role="alert" className="text-xs text-red-600 mt-1 block">{errors.summary}</span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4"><span className="text-red-600">*</span> Required fields</p>

      <button
        type="submit"
        disabled={isSubmitting || state.status === 'rate_limited'}
        aria-busy={isSubmitting}
        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Mission Problem'}
      </button>
    </form>
  );
};
```

---

### src/pages/SubmitOpportunityPage.tsx

Page wrapper for the opportunity submission form. Includes top nav, Back to Catalog link, and handles success redirect.

```tsx
// src/pages/SubmitOpportunityPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OpportunitySubmissionForm } from '../components/forms/OpportunitySubmissionForm';

/**
 * Route: /submit-opportunity
 * Reached from: Top nav "Submit a Mission Problem" link, catalog empty state CTA,
 *               search empty state CTA, Innovation Record page CTA.
 * Per UX Mockup Screen 04 and Navigation Map.
 */
export const SubmitOpportunityPage: React.FC = () => {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate('/submit-opportunity/confirmation');
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/catalog" className="text-blue-700 hover:underline text-sm">
          ← Back to Catalog
        </Link>
      </nav>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Submit a Mission Problem</h1>
        <p className="text-sm text-gray-600 mb-6">
          Help the I&R team understand the mission challenges your court or organization is facing.
          Submissions are reviewed by the I&R team for future consideration.
        </p>
        <OpportunitySubmissionForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
};
```

---

### src/pages/SubmitOpportunityConfirmationPage.tsx

Confirmation page after successful opportunity submission. Must contain the "does not imply acceptance" language verbatim (per UX Mockup Screen 04 confirmation layout) and "Return to Innovation Catalog" CTA.

```tsx
// src/pages/SubmitOpportunityConfirmationPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Route: /submit-opportunity/confirmation
 * Reached from: OpportunitySubmissionForm on 201 response via navigate().
 * Per UX Mockup Screen 04 Layout — Confirmation Page.
 * GOVERNANCE CRITICAL: Must contain "does not imply acceptance" language — do not alter or soften.
 */
export const SubmitOpportunityConfirmationPage: React.FC = () => {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
        <div className="text-4xl mb-4" aria-hidden="true">✅</div>

        <h1 className="text-xl font-semibold text-gray-900 mb-3">Your submission has been received.</h1>

        <p className="text-sm text-gray-700 mb-6">
          Thank you for taking the time to describe this mission problem. Your input helps I&R prioritize future exploration.
        </p>

        <hr className="border-gray-200 mb-4" />

        {/* Non-commitment language — governance-critical, do not modify */}
        <div className="bg-amber-50 border border-amber-300 rounded-md p-4 text-left mb-6">
          <p className="text-sm text-amber-900 font-semibold mb-1">Important</p>
          <p className="text-sm text-amber-800">
            This submission <strong>does not imply acceptance</strong> of the opportunity into the I&R portfolio or
            a commitment to begin a project or establish a timeline.
          </p>
          <p className="text-sm text-amber-800 mt-2">
            The I&R curation team will review your submission. If I&R pursues this opportunity,
            the submitting contact may be engaged for additional context.
          </p>
        </div>

        <hr className="border-gray-200 mb-6" />

        <p className="text-sm text-gray-500 mb-6">
          A confirmation may have been sent to the email address you provided.
        </p>

        <Link
          to="/catalog"
          className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm transition-colors"
        >
          Return to Innovation Catalog
        </Link>
      </div>
    </main>
  );
};
```

---

### src/App.tsx (route additions + top nav wiring)

Add the four new routes to the React Router config and add the two nav links to the top navigation.

**If App.tsx does not yet exist**, create it with a full app shell matching UX Mockup Navigation Map. If it already exists from prior Wave 4 plans, add these routes and nav items without removing existing ones.

Key additions to App.tsx:
1. Import the four new pages
2. Add routes: `/submit-opportunity`, `/submit-opportunity/confirmation`, `/share-innovation`, `/share-innovation/confirmation`
3. Add top nav links: "Submit a Mission Problem" → `/submit-opportunity`, "Share Your Innovation Work" → `/share-innovation`

Navigation wiring must be visible from the catalog page (`/`) per UX Mockup Navigation Map:
```
Top nav: [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]
```

If App.tsx exists with nav, add these two links. If creating new App.tsx:
```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { SubmitOpportunityPage } from './pages/SubmitOpportunityPage';
import { SubmitOpportunityConfirmationPage } from './pages/SubmitOpportunityConfirmationPage';
import { ShareInnovationPage } from './pages/ShareInnovationPage';
import { ShareInnovationConfirmationPage } from './pages/ShareInnovationConfirmationPage';
// (Existing Wave 4 imports: CatalogPage, SearchPage, RecordPage — add to these)

function AppShell() {
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/catalog" className="font-bold text-gray-900 text-sm tracking-wide">
              TSIO INNOVATION HUB
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex gap-4 text-sm list-none m-0 p-0">
                <li>
                  <NavLink to="/catalog" className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}>
                    Catalog
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/submit-opportunity" className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}>
                    Submit a Mission Problem
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/share-innovation" className={({ isActive }) => isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700'}>
                    Share Your Innovation Work
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>
          {/* Global search bar placeholder — Wave 4 adds full search */}
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search…"
              aria-label="Search"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-52"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                }
              }}
            />
          </div>
        </div>
      </header>
      <div id="main-content" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
      <Routes>
        {/* Submission routes (Wave 5a) */}
        <Route path="/submit-opportunity" element={<SubmitOpportunityPage />} />
        <Route path="/submit-opportunity/confirmation" element={<SubmitOpportunityConfirmationPage />} />
        <Route path="/share-innovation" element={<ShareInnovationPage />} />
        <Route path="/share-innovation/confirmation" element={<ShareInnovationConfirmationPage />} />
        {/* Wave 4 routes added here when App.tsx is established */}
      </Routes>
    </BrowserRouter>
  );
}
```

**PIVOTA PREVIEW COMPATIBILITY**: Do NOT set X-Frame-Options: DENY/SAMEORIGIN or CSP frame-ancestors 'none'/'self' in any middleware or meta headers. If a Vite config file exists, ensure server binds to `0.0.0.0:3000`.
  </action>
  <verify>
grep -n 'SubmitOpportunityPage' src/pages/SubmitOpportunityPage.tsx && echo "PAGE_OK"
grep -n 'does not imply acceptance' src/pages/SubmitOpportunityConfirmationPage.tsx && echo "DISCLAIMER_OK"
grep -n 'submit-opportunity' src/App.tsx && grep -n 'Submit a Mission Problem' src/App.tsx && echo "NAV_OK"
grep -n 'problem_description' src/components/forms/OpportunitySubmissionForm.tsx && grep -n 'submitter_email' src/components/forms/OpportunitySubmissionForm.tsx && echo "FORM_FIELDS_OK"
grep -n 'SelfAssessedMaturity' src/types/submissions.ts && grep -n 'captcha_token' src/types/submissions.ts && echo "TYPES_OK" && echo CONTRACT_OK
  </verify>
  <done>
- src/types/submissions.ts exports OpportunitySubmissionRequest, ContributionSubmissionRequest, SelfAssessedMaturity (ARCHIVED excluded), SubmissionResponse, SubmissionApiError
- src/components/forms/CaptchaWidget.tsx renders dev bypass when VITE_CAPTCHA_SITE_KEY absent; calls onVerify with token
- src/components/forms/RateLimitErrorBanner.tsx renders rate limit message with optional Retry-After countdown
- src/hooks/useOpportunitySubmit.ts handles 201/422/429 from POST /api/v1/opportunity-submissions
- src/components/forms/OpportunitySubmissionForm.tsx: non-commitment disclaimer BEFORE fields; problem-first field ordering; inline per-field validation on blur; error summary on submit attempt; CAPTCHA required; submits correct payload shape
- src/pages/SubmitOpportunityPage.tsx: route /submit-opportunity; navigates to /submit-opportunity/confirmation on success
- src/pages/SubmitOpportunityConfirmationPage.tsx: contains "does not imply acceptance" language; "Return to Innovation Catalog" link to /catalog
- src/App.tsx: routes registered for /submit-opportunity and /submit-opportunity/confirmation; top nav contains "Submit a Mission Problem" and "Share Your Innovation Work" links
  </done>

  <feature_dependencies>
  Implements: F5: Opportunity Submission public form (/submit-opportunity) with problem-first ordering, non-commitment disclaimer, CAPTCHA, rate limit feedback, confirmation page
  Depends on: F7: SubmissionService POST /api/v1/opportunity-submissions endpoint (07-PLAN.md); CaptchaService + RateLimiter provided same wave
  Enables: F5: Wave 6 admin OpportunitySubmissionsPage has records to display; F5: Wave 7 integration test submits opportunity
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Build Share Innovation form page, dynamic artifact URL component, submit hook, confirmation page, and Playwright e2e tests for both forms</name>
  <files>
    src/components/forms/ArtifactUrlFields.tsx
    src/hooks/useShareInnovationSubmit.ts
    src/components/forms/ShareInnovationForm.tsx
    src/pages/ShareInnovationPage.tsx
    src/pages/ShareInnovationConfirmationPage.tsx
    e2e/submit-opportunity.spec.ts
    e2e/share-innovation.spec.ts
  </files>
  <action>
Implement the Share Innovation form page (F6) and Playwright e2e tests for both submission forms.

---

### src/components/forms/ArtifactUrlFields.tsx

Dynamic 1–5 HTTPS URL inputs per UX Mockup Screen 05. Artifact URL 1 is always visible and required. URLs 2–5 appear progressively when user clicks "+ Add another artifact URL". Max 5 total. Each URL validated as https:// on blur.

```tsx
// src/components/forms/ArtifactUrlFields.tsx
import React from 'react';

interface ArtifactUrlFieldsProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  errors?: string[];
}

const MAX_URLS = 5;

function isValidHttpsUrl(value: string): boolean {
  if (!value.trim()) return true; // empty optional fields are valid (URL 1 required separately)
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Dynamic artifact URL input list.
 * URL 1: always visible, required (min 1).
 * URLs 2–5: revealed by "+ Add another artifact URL" button, optional, but once added must be valid https://.
 * Per UX Mockup Screen 05 — Artifact Links section.
 */
export const ArtifactUrlFields: React.FC<ArtifactUrlFieldsProps> = ({ urls, onChange, errors }) => {
  // visibleCount tracks how many URL fields have been added (min 1)
  const [visibleCount, setVisibleCount] = React.useState(Math.max(1, urls.length));
  const [touched, setTouched] = React.useState<boolean[]>(new Array(MAX_URLS).fill(false));

  function handleUrlChange(index: number, value: string) {
    const updated = [...urls];
    // Ensure array is long enough
    while (updated.length <= index) updated.push('');
    updated[index] = value;
    onChange(updated);
  }

  function handleAddUrl() {
    if (visibleCount < MAX_URLS) {
      setVisibleCount(prev => prev + 1);
    }
  }

  function handleBlur(index: number) {
    setTouched(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  }

  return (
    <div>
      {Array.from({ length: visibleCount }, (_, i) => {
        const isRequired = i === 0;
        const value = urls[i] || '';
        const hasError = touched[i] && value.trim() !== '' && !isValidHttpsUrl(value);
        const missingRequired = touched[i] && isRequired && !value.trim();
        const externalError = errors?.[i];
        const showError = hasError || missingRequired || externalError;

        return (
          <div key={i} className="mb-3">
            <label htmlFor={`artifact_url_${i}`} className="block text-sm font-medium text-gray-700 mb-1">
              Artifact URL {i + 1}{' '}
              {isRequired
                ? <span aria-label="required" className="text-red-600">*</span>
                : <span className="text-gray-400 font-normal">(optional)</span>
              }
            </label>
            <input
              id={`artifact_url_${i}`}
              name={`artifact_urls[${i}]`}
              type="url"
              value={value}
              placeholder="https://"
              onChange={(e) => handleUrlChange(i, e.target.value)}
              onBlur={() => handleBlur(i)}
              aria-invalid={!!showError}
              aria-describedby={showError ? `artifact_url_${i}_error` : undefined}
              className={`block w-full border rounded-md px-3 py-2 text-sm font-mono ${showError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {showError && (
              <span id={`artifact_url_${i}_error`} role="alert" className="text-xs text-red-600">
                {missingRequired && 'At least one artifact URL is required.'}
                {hasError && 'Artifact URL must begin with https://'}
                {externalError && !missingRequired && !hasError && externalError}
              </span>
            )}
          </div>
        );
      })}

      {visibleCount < MAX_URLS && (
        <button
          type="button"
          onClick={handleAddUrl}
          className="text-sm text-blue-700 hover:text-blue-900 underline mt-1"
          aria-label={`Add artifact URL ${visibleCount + 1} of ${MAX_URLS}`}
        >
          + Add another artifact URL
        </button>
      )}

      {visibleCount >= MAX_URLS && (
        <p className="text-xs text-gray-500 mt-1">Maximum of {MAX_URLS} artifact URLs reached.</p>
      )}
    </div>
  );
};
```

---

### src/hooks/useShareInnovationSubmit.ts

Submit hook for the contribution submission form calling `POST /api/v1/contribution-submissions`.

```typescript
// src/hooks/useShareInnovationSubmit.ts
import { useState } from 'react';
import type { ContributionSubmissionRequest, SubmissionResponse, SubmissionApiError } from '../types/submissions';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; data: SubmissionResponse }
  | { status: 'error'; error: SubmissionApiError }
  | { status: 'rate_limited'; retryAfter?: number };

export function useShareInnovationSubmit() {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function submit(payload: ContributionSubmissionRequest): Promise<boolean> {
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/v1/contribution-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data: SubmissionResponse = await res.json();
        setState({ status: 'success', data });
        return true;
      }

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        setState({ status: 'rate_limited', retryAfter: retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined });
        return false;
      }

      const errorBody = await res.json();
      setState({ status: 'error', error: errorBody.error as SubmissionApiError });
      return false;
    } catch {
      setState({
        status: 'error',
        error: { code: 'VALIDATION_ERROR', message: 'Unable to submit at this time. Please try again or contact the I&R team directly.' },
      });
      return false;
    }
  }

  function reset() { setState({ status: 'idle' }); }

  return { state, submit, reset };
}
```

---

### src/components/forms/ShareInnovationForm.tsx

The main Share Innovation form. CRITICAL governance requirements from UX spec:
1. `self_assessed_maturity` enum must NOT include ARCHIVED (per PRD F6, UX Screen 05, UserStory US-6.1)
2. Curation-review governance notice displayed before all fields
3. Artifact URLs use ArtifactUrlFields component (1 required, up to 5)

```tsx
// src/components/forms/ShareInnovationForm.tsx
import React, { useState, useCallback } from 'react';
import { CaptchaWidget } from './CaptchaWidget';
import { RateLimitErrorBanner } from './RateLimitErrorBanner';
import { ArtifactUrlFields } from './ArtifactUrlFields';
import { useShareInnovationSubmit } from '../../hooks/useShareInnovationSubmit';
import type { ContributionSubmissionRequest, SelfAssessedMaturity } from '../../types/submissions';
import { SELF_ASSESSED_MATURITY_LABELS } from '../../types/submissions';

// CRITICAL: ARCHIVED is excluded from this list per F6 spec (PRD §7 F6, US-6.1, UX Screen 05)
const MATURITY_OPTIONS: SelfAssessedMaturity[] = [
  'IDEA',
  'EXPERIMENT_POC',
  'PROTOTYPE_PILOT',
  'PRODUCTION_VALIDATED',
  // NOTE: 'ARCHIVED' is intentionally absent — self-assessed maturity cannot be ARCHIVED
];

interface ShareInnovationFormProps {
  onSuccess: () => void;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const ShareInnovationForm: React.FC<ShareInnovationFormProps> = ({ onSuccess }) => {
  const { state, submit } = useShareInnovationSubmit();

  const [fields, setFields] = useState({
    problem_addressed: '',
    work_description: '',
    outcome_summary: '',
    self_assessed_maturity: '' as SelfAssessedMaturity | '',
    contributing_team: '',
    contributing_office: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    additional_context: '',
  });
  const [artifactUrls, setArtifactUrls] = useState<string[]>(['']);
  const [captchaToken, setCaptchaToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'problem_addressed':
        if (!value || value.trim().length < 50) return 'Problem addressed must be at least 50 characters.';
        if (value.trim().length > 2000) return 'Problem addressed must be 2000 characters or fewer.';
        break;
      case 'work_description':
        if (!value || value.trim().length < 50) return 'Work description must be at least 50 characters.';
        if (value.trim().length > 3000) return 'Work description must be 3000 characters or fewer.';
        break;
      case 'outcome_summary':
        if (!value || value.trim().length < 50) return 'Outcome summary must be at least 50 characters.';
        if (value.trim().length > 2000) return 'Outcome summary must be 2000 characters or fewer.';
        break;
      case 'self_assessed_maturity':
        if (!value) return 'Please select the current stage of this work.';
        break;
      case 'contributing_team':
        if (!value || value.trim().length < 2) return 'Contributing team name is required.';
        break;
      case 'contributing_office':
        if (!value || value.trim().length < 2) return 'Contributing office is required.';
        break;
      case 'contact_name':
        if (!value || value.trim().length < 2) return 'Contact name is required.';
        break;
      case 'contact_email':
        if (!value) return 'Contact email address is required.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        break;
    }
    return undefined;
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  }

  function validateAll(): Record<string, string> {
    const newErrors: Record<string, string> = {};
    const requiredTextFields = ['problem_addressed', 'work_description', 'outcome_summary', 'self_assessed_maturity', 'contributing_team', 'contributing_office', 'contact_name', 'contact_email'];
    requiredTextFields.forEach(f => {
      const error = validateField(f, fields[f as keyof typeof fields] || '');
      if (error) newErrors[f] = error;
    });
    // Artifact URLs: at least one required, all provided must be https://
    const validUrls = artifactUrls.filter(u => u.trim() !== '');
    if (validUrls.length === 0) {
      newErrors['artifact_urls'] = 'At least one artifact URL is required.';
    } else {
      validUrls.forEach((url, i) => {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== 'https:') newErrors[`artifact_url_${i}`] = `URL ${i + 1} must begin with https://`;
        } catch {
          newErrors[`artifact_url_${i}`] = `URL ${i + 1} is not a valid URL.`;
        }
      });
    }
    if (!captchaToken) newErrors['captcha'] = 'Please complete the CAPTCHA verification.';
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched(Object.fromEntries(Object.keys(fields).map(k => [k, true])));
      return;
    }

    const cleanedUrls = artifactUrls.filter(u => u.trim() !== '');

    const payload: ContributionSubmissionRequest = {
      work_description: fields.work_description.trim(),
      problem_addressed: fields.problem_addressed.trim(),
      outcome_summary: fields.outcome_summary.trim(),
      self_assessed_maturity: fields.self_assessed_maturity as SelfAssessedMaturity,
      artifact_urls: cleanedUrls,
      contributing_team: fields.contributing_team.trim(),
      contributing_office: fields.contributing_office.trim(),
      contact_name: fields.contact_name.trim(),
      contact_email: fields.contact_email.trim(),
      ...(fields.contact_title.trim() && { contact_title: fields.contact_title.trim() }),
      ...(fields.additional_context.trim() && { additional_context: fields.additional_context.trim() }),
      captcha_token: captchaToken,
    };

    const success = await submit(payload);
    if (success) onSuccess();
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Share Your Innovation Work">
      {/* Curation-review governance notice — must appear before all fields per UX Mockup Screen 05 */}
      <div
        role="note"
        className="bg-blue-50 border border-blue-300 rounded-md p-4 mb-6 flex gap-3"
        aria-label="Important notice about submission review"
      >
        <span className="text-blue-600 flex-shrink-0 text-lg" aria-hidden="true">ℹ</span>
        <div className="text-sm text-blue-900">
          <p><strong>Submissions enter I&R curation review.</strong> Publication is not guaranteed.</p>
          <p className="mt-1">If published, your team will be credited.</p>
        </div>
      </div>

      {/* Rate limit error */}
      {state.status === 'rate_limited' && (
        <div className="mb-6">
          <RateLimitErrorBanner retryAfterSeconds={state.retryAfter} />
        </div>
      )}

      {/* Server error */}
      {state.status === 'error' && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">{state.error.message || 'An error occurred. Please try again.'}</p>
        </div>
      )}

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— About the Work —</legend>

        {/* Problem addressed (first content field — problem-first ordering) */}
        <div className="mb-4">
          <label htmlFor="problem_addressed" className="block text-sm font-medium text-gray-700 mb-1">
            Describe the mission problem your team addressed <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What challenge were you solving? Who is affected? (50–2000 chars)</p>
          <textarea
            id="problem_addressed"
            name="problem_addressed"
            value={fields.problem_addressed}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
            aria-invalid={!!errors.problem_addressed}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.problem_addressed ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.problem_addressed ? <span role="alert" className="text-xs text-red-600">{errors.problem_addressed}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.problem_addressed.length} / 2000</span>
          </div>
        </div>

        {/* Work description */}
        <div className="mb-4">
          <label htmlFor="work_description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe what your team built or explored <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What approach, technology, or method did you use? (50–3000 chars)</p>
          <textarea
            id="work_description"
            name="work_description"
            value={fields.work_description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            maxLength={3000}
            disabled={isSubmitting}
            aria-invalid={!!errors.work_description}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.work_description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.work_description ? <span role="alert" className="text-xs text-red-600">{errors.work_description}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.work_description.length} / 3000</span>
          </div>
        </div>

        {/* Outcome summary */}
        <div className="mb-4">
          <label htmlFor="outcome_summary" className="block text-sm font-medium text-gray-700 mb-1">
            Outcome Summary <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">What were the results? Include limitations or gaps. (50–2000 chars)</p>
          <textarea
            id="outcome_summary"
            name="outcome_summary"
            value={fields.outcome_summary}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
            aria-invalid={!!errors.outcome_summary}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.outcome_summary ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between mt-1">
            {errors.outcome_summary ? <span role="alert" className="text-xs text-red-600">{errors.outcome_summary}</span> : <span />}
            <span className="text-xs text-gray-400">{fields.outcome_summary.length} / 2000</span>
          </div>
        </div>

        {/* Self-assessed maturity — ARCHIVED intentionally absent */}
        <div className="mb-4">
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1">
              What stage is this work at? <span aria-label="required" className="text-red-600">*</span>
            </legend>
            <p className="text-xs text-gray-500 mb-2">Your honest assessment of current maturity.</p>
            <div className="space-y-2">
              {MATURITY_OPTIONS.map(option => (
                <label key={option} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="self_assessed_maturity"
                    value={option}
                    checked={fields.self_assessed_maturity === option}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700">{SELF_ASSESSED_MATURITY_LABELS[option]}</span>
                </label>
              ))}
            </div>
            {/* Note to curator: maturity is self-assessed, final assigned by curator */}
            <p className="text-xs text-gray-500 mt-2">Note: Final maturity level is assigned by I&R curators.</p>
            {errors.self_assessed_maturity && (
              <span role="alert" className="text-xs text-red-600 block mt-1">{errors.self_assessed_maturity}</span>
            )}
          </fieldset>
        </div>

        {/* Artifact URLs */}
        <div className="mb-4">
          <p className="block text-sm font-medium text-gray-700 mb-1">
            Artifact Links <span aria-label="required" className="text-red-600">*</span>
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Provide links to documentation, diagrams, code, or recordings that support your submission. (1–5 URLs)
            All URLs must begin with <code className="bg-gray-100 px-1 rounded text-xs">https://</code>
          </p>
          <ArtifactUrlFields
            urls={artifactUrls}
            onChange={setArtifactUrls}
            errors={
              Object.keys(errors)
                .filter(k => k.startsWith('artifact_url_'))
                .map(k => errors[k])
            }
          />
          {errors.artifact_urls && (
            <span role="alert" className="text-xs text-red-600 block mt-1">{errors.artifact_urls}</span>
          )}
        </div>

        {/* Additional context (optional) */}
        <div className="mb-4">
          <label htmlFor="additional_context" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">Anything else I&R should know about this work.</p>
          <textarea
            id="additional_context"
            name="additional_context"
            value={fields.additional_context}
            onChange={handleChange}
            rows={2}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Team —</legend>
        <div className="mb-4">
          <label htmlFor="contributing_team" className="block text-sm font-medium text-gray-700 mb-1">
            Contributing Team Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">This is how your team will be credited if published.</p>
          <input
            id="contributing_team"
            name="contributing_team"
            type="text"
            value={fields.contributing_team}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contributing_team}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contributing_team ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contributing_team && <span role="alert" className="text-xs text-red-600">{errors.contributing_team}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="contributing_office" className="block text-sm font-medium text-gray-700 mb-1">
            Contributing Office <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="contributing_office"
            name="contributing_office"
            type="text"
            value={fields.contributing_office}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contributing_office}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contributing_office ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contributing_office && <span role="alert" className="text-xs text-red-600">{errors.contributing_office}</span>}
        </div>
      </fieldset>

      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">— Your Contact Information —</legend>
        <div className="mb-4">
          <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="contact_name"
            name="contact_name"
            type="text"
            value={fields.contact_name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contact_name}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contact_name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contact_name && <span role="alert" className="text-xs text-red-600">{errors.contact_name}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="contact_title" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="contact_title"
            name="contact_title"
            type="text"
            value={fields.contact_title}
            onChange={handleChange}
            disabled={isSubmitting}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email Address <span aria-label="required" className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-1">A confirmation may be sent to this address. A curator may reach out before publication.</p>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            value={fields.contact_email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={!!errors.contact_email}
            className={`block w-full border rounded-md px-3 py-2 text-sm ${errors.contact_email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.contact_email && <span role="alert" className="text-xs text-red-600">{errors.contact_email}</span>}
        </div>
      </fieldset>

      {/* CAPTCHA */}
      <div className="mb-6">
        <CaptchaWidget onVerify={handleCaptchaVerify} />
        {errors.captcha && <span role="alert" className="text-xs text-red-600 block mt-1">{errors.captcha}</span>}
      </div>

      <p className="text-xs text-gray-500 mb-4"><span className="text-red-600">*</span> Required fields</p>

      <button
        type="submit"
        disabled={isSubmitting || state.status === 'rate_limited'}
        aria-busy={isSubmitting}
        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting…' : 'Submit Innovation Work'}
      </button>
    </form>
  );
};
```

---

### src/pages/ShareInnovationPage.tsx

Page wrapper. Wired into top nav via App.tsx (Task 1).

```tsx
// src/pages/ShareInnovationPage.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShareInnovationForm } from '../components/forms/ShareInnovationForm';

/**
 * Route: /share-innovation
 * Reached from: Top nav "Share Your Innovation Work" link, Catalog page CTA.
 * Per UX Mockup Screen 05 and Navigation Map.
 */
export const ShareInnovationPage: React.FC = () => {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate('/share-innovation/confirmation');
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/catalog" className="text-blue-700 hover:underline text-sm">
          ← Back to Catalog
        </Link>
      </nav>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Share Your Innovation Work</h1>
        <p className="text-sm text-gray-600 mb-6">
          Has your court or team done innovation work that could benefit the broader Judiciary?
          Submit it here for I&R curation review.
        </p>
        <ShareInnovationForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
};
```

---

### src/pages/ShareInnovationConfirmationPage.tsx

Confirmation with curation-process steps and attribution notice per UX Mockup Screen 05.

```tsx
// src/pages/ShareInnovationConfirmationPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Route: /share-innovation/confirmation
 * Reached from: ShareInnovationForm on 201 response.
 * Per UX Mockup Screen 05 Layout — Confirmation Page.
 * Contains: 4-step curation process, attribution notice, "Return to Catalog" CTA.
 */
export const ShareInnovationConfirmationPage: React.FC = () => {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4" aria-hidden="true">✅</div>
          <h1 className="text-xl font-semibold text-gray-900">Your submission has been received.</h1>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          The I&R team will review your submission for potential curation. Here is what happens next:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-6 pl-4">
          <li>I&R curators review your materials</li>
          <li>A curator may contact you for additional context</li>
          <li>If accepted, a curator will create and enrich a structured Innovation Record</li>
          <li>You will be contacted before any record is published</li>
        </ol>

        <hr className="border-gray-200 mb-4" />

        {/* Attribution and governance notice */}
        <div className="bg-amber-50 border border-amber-300 rounded-md p-4 text-left mb-6">
          <p className="text-sm text-amber-800">
            This submission <strong>does not guarantee publication.</strong>{' '}
            If your work is published, your team will receive <strong>named attribution</strong>.
          </p>
        </div>

        <hr className="border-gray-200 mb-6" />

        <div className="text-center">
          <Link
            to="/catalog"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-md text-sm transition-colors"
          >
            Return to Innovation Catalog
          </Link>
        </div>
      </div>
    </main>
  );
};
```

---

### e2e/submit-opportunity.spec.ts

Playwright e2e tests. Uses a mock API route to avoid live backend dependency in e2e. Tests verify the UI behaviors that matter: form renders, nav reachable, validation fires, confirmation displayed, non-commitment language present.

```typescript
// e2e/submit-opportunity.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Opportunity Submission Form (/submit-opportunity)', () => {

  test('Top nav "Submit a Mission Problem" link is reachable from catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    const navLink = page.getByRole('link', { name: 'Submit a Mission Problem' });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/submit-opportunity/);
    await expect(page.getByRole('heading', { name: /Submit a Mission Problem/i })).toBeVisible();
  });

  test('Form renders with non-commitment disclaimer visible before any fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    // Non-commitment disclaimer must be visible before interacting with any field
    const disclaimer = page.getByText(/does not imply acceptance/i);
    await expect(disclaimer).toBeVisible();
    // Form heading
    await expect(page.getByRole('heading', { name: /Submit a Mission Problem/i })).toBeVisible();
    // First field (problem-first ordering) must be problem description
    const problemField = page.getByLabel(/Describe the mission problem/i);
    await expect(problemField).toBeVisible();
  });

  test('Problem description: too short shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    const problemField = page.getByLabel(/Describe the mission problem/i);
    await problemField.fill('Too short');
    await problemField.blur();
    await expect(page.getByText(/at least 50 characters/i)).toBeVisible();
  });

  test('Submit with empty required fields shows error summary', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();
    // Error summary should appear
    await expect(page.getByText(/Please fix the following errors/i)).toBeVisible();
  });

  test('Submitter email: invalid format shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity`);
    const emailField = page.getByLabel(/Your Email Address/i);
    await emailField.fill('not-an-email');
    await emailField.blur();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test('Happy path: successful submission navigates to confirmation page', async ({ page }) => {
    // Intercept the API call and mock a 201 response
    await page.route('**/api/v1/opportunity-submissions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          submission_id: 'test-uuid-opportunity',
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/submit-opportunity`);

    // Fill required fields in problem-first order
    await page.getByLabel(/Describe the mission problem/i).fill(
      'Courts are struggling to reliably authenticate digital evidence across proceedings due to fragmented systems and no standard chain-of-custody protocol for cloud-stored recordings affecting case integrity.'
    );
    await page.getByLabel(/Mission Area/i).selectOption('Court Operations');
    await page.getByLabel(/Submitting Office/i).fill('District Court of DC');
    await page.getByLabel(/Your Name/i).fill('Margaret Hollis');
    await page.getByLabel(/Your Email Address/i).fill('margaret.hollis@uscourts.gov');

    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();

    // Should navigate to confirmation page
    await expect(page).toHaveURL(/submit-opportunity\/confirmation/);
    await expect(page.getByText(/Your submission has been received/i)).toBeVisible();
  });

  test('Confirmation page contains non-commitment language', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity/confirmation`);
    await expect(page.getByText(/does not imply acceptance/i)).toBeVisible();
  });

  test('Confirmation page "Return to Innovation Catalog" link navigates to /catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/submit-opportunity/confirmation`);
    const returnLink = page.getByRole('link', { name: /Return to Innovation Catalog/i });
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('Rate limit response (429) shows RateLimitErrorBanner', async ({ page }) => {
    await page.route('**/api/v1/opportunity-submissions', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '3600' },
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many submissions.' } }),
      });
    });

    await page.goto(`${BASE_URL}/submit-opportunity`);

    await page.getByLabel(/Describe the mission problem/i).fill(
      'Courts are struggling to reliably authenticate digital evidence across proceedings due to fragmented systems and no standard chain-of-custody protocol for cloud-stored recordings affecting case integrity.'
    );
    await page.getByLabel(/Mission Area/i).selectOption('Court Operations');
    await page.getByLabel(/Submitting Office/i).fill('District Court of DC');
    await page.getByLabel(/Your Name/i).fill('Test User');
    await page.getByLabel(/Your Email Address/i).fill('test@uscourts.gov');

    await page.getByRole('button', { name: /Submit Mission Problem/i }).click();

    await expect(page.getByText(/Too many submissions from this location/i)).toBeVisible();
  });

});
```

---

### e2e/share-innovation.spec.ts

Playwright e2e tests for the Share Innovation form.

```typescript
// e2e/share-innovation.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Share Innovation Form (/share-innovation)', () => {

  test('Top nav "Share Your Innovation Work" link is reachable from catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    const navLink = page.getByRole('link', { name: 'Share Your Innovation Work' });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/share-innovation/);
    await expect(page.getByRole('heading', { name: /Share Your Innovation Work/i })).toBeVisible();
  });

  test('Form renders with curation-review governance notice before all fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    const notice = page.getByText(/Submissions enter I&R curation review/i);
    await expect(notice).toBeVisible();
    // Publication not guaranteed language
    await expect(page.getByText(/Publication is not guaranteed/i)).toBeVisible();
  });

  test('ARCHIVED is NOT present as a maturity option', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    // ARCHIVED should not appear in the maturity radio options
    // This is governance-critical — ARCHIVED is excluded per F6 spec
    const archivedOption = page.getByRole('radio', { name: /archived/i });
    await expect(archivedOption).toHaveCount(0);
  });

  test('All four valid maturity options are present', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    await expect(page.getByRole('radio', { name: /Idea/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Experiment/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Prototype/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Production/i })).toBeVisible();
  });

  test('Artifact URL 1 is required — empty submit shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();
    await expect(page.getByText(/at least one artifact URL is required/i)).toBeVisible();
  });

  test('Artifact URL with non-https:// value shows inline error', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    const urlInput = page.getByLabel(/Artifact URL 1/i);
    await urlInput.fill('http://example.com/document');
    await urlInput.blur();
    await expect(page.getByText(/must begin with https/i)).toBeVisible();
  });

  test('"+ Add another artifact URL" button reveals URL 2 field', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation`);
    // Initially only URL 1 visible
    await expect(page.getByLabel(/Artifact URL 2/i)).toHaveCount(0);
    // Click add button
    await page.getByRole('button', { name: /Add another artifact URL/i }).click();
    // URL 2 should now be visible
    await expect(page.getByLabel(/Artifact URL 2/i)).toBeVisible();
  });

  test('Happy path: successful submission navigates to confirmation page', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          submission_id: 'test-uuid-contribution',
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/share-innovation`);

    await page.getByLabel(/Describe the mission problem your team addressed/i).fill(
      'Courts needed a way to track digital evidence integrity across cloud-based storage systems without relying on vendor proprietary tools that create lock-in risks.'
    );
    await page.getByLabel(/Describe what your team built or explored/i).fill(
      'We built a lightweight metadata fingerprinting service using open-source tooling that attaches cryptographic hashes to evidence files at ingest time and verifies them on retrieval.'
    );
    await page.getByLabel(/Outcome Summary/i).fill(
      'Prototype validated in a single district court environment. Requires additional security review. Fingerprint verification adds under 200ms latency at tested volumes.'
    );
    await page.getByRole('radio', { name: /Prototype/i }).click();
    await page.getByLabel(/Artifact URL 1/i).fill('https://sharepoint.ao.dcn/sites/evidence-integrity-poc');
    await page.getByLabel(/Contributing Team Name/i).fill('Eastern District IT Innovation Team');
    await page.getByLabel(/Contributing Office/i).fill('Eastern District of Virginia');
    await page.getByLabel(/Contact Name/i).fill('Marcus Webb');
    await page.getByLabel(/Contact Email Address/i).fill('marcus.webb@uscourts.gov');

    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();

    await expect(page).toHaveURL(/share-innovation\/confirmation/);
    await expect(page.getByText(/Your submission has been received/i)).toBeVisible();
  });

  test('Confirmation page contains curation steps and attribution notice', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation/confirmation`);
    // Curation steps
    await expect(page.getByText(/I&R curators review/i)).toBeVisible();
    await expect(page.getByText(/attribution/i)).toBeVisible();
    // Does not guarantee publication
    await expect(page.getByText(/does not guarantee publication/i)).toBeVisible();
  });

  test('Confirmation page "Return to Innovation Catalog" link navigates to /catalog', async ({ page }) => {
    await page.goto(`${BASE_URL}/share-innovation/confirmation`);
    const returnLink = page.getByRole('link', { name: /Return to Innovation Catalog/i });
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('Rate limit response (429) shows RateLimitErrorBanner', async ({ page }) => {
    await page.route('**/api/v1/contribution-submissions', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '3600' },
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many submissions.' } }),
      });
    });

    await page.goto(`${BASE_URL}/share-innovation`);

    await page.getByLabel(/Describe the mission problem your team addressed/i).fill(
      'Courts needed a way to track digital evidence integrity across cloud-based storage systems without relying on vendor proprietary tools that create lock-in risks.'
    );
    await page.getByLabel(/Describe what your team built or explored/i).fill(
      'We built a lightweight metadata fingerprinting service using open-source tooling that attaches cryptographic hashes to evidence files at ingest time and verifies them on retrieval.'
    );
    await page.getByLabel(/Outcome Summary/i).fill(
      'Prototype validated in a single district court environment. Requires additional security review. Fingerprint verification adds under 200ms latency at tested volumes.'
    );
    await page.getByRole('radio', { name: /Prototype/i }).click();
    await page.getByLabel(/Artifact URL 1/i).fill('https://sharepoint.ao.dcn/sites/evidence-integrity-poc');
    await page.getByLabel(/Contributing Team Name/i).fill('Eastern District IT Innovation Team');
    await page.getByLabel(/Contributing Office/i).fill('Eastern District of Virginia');
    await page.getByLabel(/Contact Name/i).fill('Marcus Webb');
    await page.getByLabel(/Contact Email Address/i).fill('marcus.webb@uscourts.gov');

    await page.getByRole('button', { name: /Submit Innovation Work/i }).click();

    await expect(page.getByText(/Too many submissions from this location/i)).toBeVisible();
  });

});
```

**Playwright prerequisite note:** Before running these tests, ensure `playwright.config.ts` exists with `baseURL: 'http://localhost:3000'` and the app dev server is running on `0.0.0.0:3000`. If `playwright.config.ts` does not exist, create it:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
  </action>
  <verify>
grep -n 'ShareInnovationPage' src/pages/ShareInnovationPage.tsx && echo "SHARE_PAGE_OK"
grep -n 'ARCHIVED' src/components/forms/ShareInnovationForm.tsx && grep -n 'MATURITY_OPTIONS' src/components/forms/ShareInnovationForm.tsx && echo "ARCHIVED_EXCLUDED_OK"
grep -n 'attribution' src/pages/ShareInnovationConfirmationPage.tsx && echo "ATTRIBUTION_OK"
grep -n 'ArtifactUrlFields' src/components/forms/ArtifactUrlFields.tsx && grep -n 'https://' src/components/forms/ArtifactUrlFields.tsx && echo "ARTIFACT_URLS_OK"
grep -n 'share-innovation' e2e/share-innovation.spec.ts && grep -n 'ARCHIVED' e2e/share-innovation.spec.ts && echo "TESTS_OK"
grep -n 'submit-opportunity' e2e/submit-opportunity.spec.ts && grep -n 'confirmation' e2e/submit-opportunity.spec.ts && echo "OPP_TESTS_OK"
npx playwright test e2e/submit-opportunity.spec.ts e2e/share-innovation.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
  </verify>
  <done>
- src/components/forms/ArtifactUrlFields.tsx: URL 1 always visible + required; URLs 2–5 revealed by button; each validated https:// on blur; max 5 enforced
- src/hooks/useShareInnovationSubmit.ts: handles 201/422/429 from POST /api/v1/contribution-submissions; exposes state + submit + reset
- src/components/forms/ShareInnovationForm.tsx: curation-review notice BEFORE fields; ARCHIVED absent from MATURITY_OPTIONS (verified by test); ArtifactUrlFields integrated; all required fields validated; correct ContributionSubmissionRequest payload shape
- src/pages/ShareInnovationPage.tsx: route /share-innovation; navigates to /share-innovation/confirmation on success
- src/pages/ShareInnovationConfirmationPage.tsx: 4-step curation process list; "attribution" language; "Return to Innovation Catalog" link to /catalog
- e2e/submit-opportunity.spec.ts: all tests pass — nav reachable, disclaimer visible, validation fires, happy path → confirmation, non-commitment language on confirmation, return link, 429 rate limit banner
- e2e/share-innovation.spec.ts: all tests pass — nav reachable, curation notice visible, ARCHIVED radio absent (0 count), all 4 valid maturities present, URL 1 required, https:// enforced, add URL button works, happy path → confirmation, curation steps + attribution, return link, 429 rate limit banner
  </done>

  <feature_dependencies>
  Implements: F5: Opportunity Submission confirmation flow and Playwright tests; F6: Share Existing Innovation Work public form (/share-innovation) — curation-review messaging, self_assessed_maturity excluding ARCHIVED, 1–5 HTTPS artifact URL inputs, confirmation page with curation steps + attribution notice
  Depends on: F7: SubmissionService POST /api/v1/contribution-submissions endpoint (07-PLAN.md); ArtifactUrlFields pattern specific to F6; confirmation page pattern parallel to F5
  Enables: F6: Wave 6 ContributionSubmissionsPage has records to display; F5/F6: Wave 7 end-to-end integration validates both form flows
  </feature_dependencies>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user→form | User-controlled text input crossing into React state and subsequently POSTed to the submission API |
| form→API | Browser fetch POST sending JSON body (including captcha_token and user-supplied text) to /api/v1/opportunity-submissions and /api/v1/contribution-submissions |
| API→render | API error messages (from 422/429/5xx) reflected back into the UI as user-facing text |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-01 | Tampering | form→API: captcha_token omitted or forged in client-side fetch | Mitigate | Server-side CaptchaService.validate() in 07-PLAN.md SubmissionHandler validates the token against the CAPTCHA provider before any DB write; client-side captchaToken state is only the vehicle, never trusted as authoritative |
| T-12-02 | Denial of service | user→form: high-frequency submissions from a single IP | Mitigate | RateLimiter submissionLimiter (5/hr, express-rate-limit) applied at the API route level in src/routes/submissions.js (07-PLAN.md); UI surfaces 429 via RateLimitErrorBanner — rate limit is enforced server-side, not purely in the browser |
| T-12-03 | Tampering / Elevation | form→API: artifact_urls contains non-HTTPS URLs or javascript: scheme URIs | Mitigate | Client-side: ArtifactUrlFields validates https:// on blur and on submit; server-side: SubmissionService.isValidHttpsUrl() (07-PLAN.md) validates URL.protocol === 'https:' before persistence — defense-in-depth at both layers |
| T-12-04 | Tampering | form→API: self_assessed_maturity=ARCHIVED submitted directly via forged API call | Mitigate | Server-side: SubmissionService.createContributionSubmission() (07-PLAN.md) only accepts VALID_MATURITIES = ['IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED']; ARCHIVED is rejected with 422 VALIDATION_ERROR; client-side MATURITY_OPTIONS array also excludes ARCHIVED |
| T-12-05 | Information disclosure | API→render: 422 error.message or error.fields[] contains internal DB field names or stack traces reflected to UI | Mitigate | handleServiceError in 07-PLAN.md SubmissionHandler only forwards code and message from service-layer errors; UI renders these strings as plain text in React (not dangerouslySetInnerHTML) — no XSS vector; React's default JSX escaping prevents injection of server-side error strings |
| T-12-06 | Spoofing | form→API: CAPTCHA bypass via captcha_enabled='false' in hub_settings writable by non-CURATOR | Mitigate | hub_settings write is protected by CURATOR auth middleware on PUT /api/v1/admin/settings (08-PLAN.md); public users cannot set captcha_enabled; the bypass is an intentional operator control for federal network environments where CAPTCHA provider outbound calls may be blocked |
| T-12-07 | Tampering | form→API: problem_description or work_description contains embedded HTML/script injected into DB | Mitigate | SubmissionService.sanitize() (07-PLAN.md) strips all HTML tags via sanitize-html before persistence; React renders retrieved strings as text (not HTML) on admin review UI; XSS vector is blocked at both persistence and display layers |
</threat_model>

<verification>
1. Both pages reachable from top nav:
   - Navigate to /catalog → "Submit a Mission Problem" link visible → click → /submit-opportunity loads
   - Navigate to /catalog → "Share Your Innovation Work" link visible → click → /share-innovation loads

2. Opportunity form field ordering (problem-first):
   - Non-commitment disclaimer renders BEFORE problem description field
   - problem_description is the first form field visible on page load

3. Share Innovation form — ARCHIVED absence:
   - grep -c 'ARCHIVED' src/components/forms/ShareInnovationForm.tsx returns the comment reference only, not a radio option
   - Playwright: page.getByRole('radio', { name: /archived/i }) has count 0

4. Artifact URL validation:
   - URL 1 shown on load; URL 2 hidden until "+ Add another" clicked
   - Non-https:// URL shows inline error on blur

5. Confirmation pages:
   - /submit-opportunity/confirmation contains "does not imply acceptance"
   - /share-innovation/confirmation contains "attribution" and curation steps

6. Playwright test run:
   npx playwright test e2e/submit-opportunity.spec.ts e2e/share-innovation.spec.ts --reporter=list

7. Integration contracts fulfilled (Wave 7 verification commands):
   grep -n 'SubmitOpportunityPage' src/pages/SubmitOpportunityPage.tsx && grep -n 'submit-opportunity' src/App.tsx && echo CONTRACT_OK
   grep -n 'ShareInnovationPage' src/pages/ShareInnovationPage.tsx && grep -n 'share-innovation' src/App.tsx && echo CONTRACT_OK
   grep -n 'does not imply acceptance' src/pages/SubmitOpportunityConfirmationPage.tsx && echo CONTRACT_OK
   grep -n 'attribution' src/pages/ShareInnovationConfirmationPage.tsx && echo CONTRACT_OK
</verification>

<success_criteria>
- /submit-opportunity page loads with non-commitment disclaimer visible before any form fields
- Opportunity form enforces problem-first field ordering: problem_description → mission_area → urgency/constraints → contact info → CAPTCHA
- All required opportunity fields validate inline on blur and as error summary on failed submit
- Successful opportunity submission POSTs correct payload to /api/v1/opportunity-submissions and navigates to /submit-opportunity/confirmation
- Confirmation page at /submit-opportunity/confirmation contains "does not imply acceptance" language and "Return to Innovation Catalog" link
- /share-innovation page loads with "Submissions enter I&R curation review" governance notice visible before all fields
- Share Innovation form self_assessed_maturity radio group contains exactly 4 options (IDEA, EXPERIMENT_POC, PROTOTYPE_PILOT, PRODUCTION_VALIDATED) — ARCHIVED is absent
- Artifact URL 1 is required; URLs 2–5 are added via button; each URL validated as https://
- Successful share innovation submission POSTs artifact_urls[] array to /api/v1/contribution-submissions and navigates to /share-innovation/confirmation
- Confirmation page at /share-innovation/confirmation contains 4-step curation process, attribution notice, and "Return to Innovation Catalog" link
- Both pages are accessible from top nav (no orphan routes)
- 429 response from API shows RateLimitErrorBanner on both forms
- All Playwright tests pass: 0 failing, 0 skipped across both spec files
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/12-SUMMARY.md`
</output>
