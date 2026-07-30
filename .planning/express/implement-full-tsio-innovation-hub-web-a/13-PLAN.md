---
phase: implement-full-tsio-innovation-hub-web-a
plan: 13
type: execute
wave: 5
depends_on: [2, 3]
files_modified:
  - src/components/engagement/EngagementRequestModal.tsx
  - src/components/engagement/useEngagementForm.ts
  - src/components/engagement/EngagementConfirmation.tsx
  - src/components/engagement/CaptchaWidget.tsx
  - e2e/engagement-modal.spec.ts
autonomous: true

features:
  implements: ["F7"]
  depends_on: ["F2", "F9"]
  enables: ["F7"]

must_haves:
  truths:
    - "Clicking any engagement button on the RecordPage opens the EngagementRequestModal with the record title and ID pre-populated and the request type pre-set to the button that was clicked"
    - "All 4 engagement types are supported: REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING — each opens the modal with the matching title (e.g. 'Request Technical Guidance')"
    - "The modal form collects: requestor name (required), office (required), email (required), description of interest (required, 20-2000 chars with live character count), desired next step (optional)"
    - "A CAPTCHA widget is displayed before the Submit button; submit is blocked until CAPTCHA is completed"
    - "On successful submission the form is replaced by an in-modal confirmation: 'Your request has been sent to the I&R team. Someone will follow up with you based on team availability.' with request type, record title, and timestamp"
    - "Rate limit feedback (429 from API) renders at the top of the modal: 'Too many requests. Please try again later.'"
    - "Server error feedback (5xx) renders at the top of the modal: 'Unable to submit at this time. Please try again or contact the I&R team directly.'"
    - "Cancel or modal close (×) button closes the modal without submission; focus returns to the trigger button (WCAG 2.1 AA focus management)"
    - "All form validation errors are shown inline (red border + error text beneath each field); submit button disabled while errors present"
    - "Modal is implemented as a portal overlay on /records/{id}; it does not create a new route"
  artifacts:
    - path: "src/components/engagement/EngagementRequestModal.tsx"
      provides: "Main modal component — overlay + focus trap + form orchestration; accepts engagementType, recordId, recordTitle, isOpen, onClose props; renders EngagementConfirmation on success"
      exports: ["EngagementRequestModal"]
      min_lines: 120
    - path: "src/components/engagement/useEngagementForm.ts"
      provides: "React hook — form state, field-level validation, API submit, confirmation/error state; accepts engagementType and recordId; posts to POST /api/v1/engagement-requests"
      exports: ["useEngagementForm"]
      min_lines: 80
    - path: "src/components/engagement/EngagementConfirmation.tsx"
      provides: "In-modal success view — displays confirmation text, request type label, record title, submission timestamp; Close button"
      exports: ["EngagementConfirmation"]
    - path: "src/components/engagement/CaptchaWidget.tsx"
      provides: "Wrapper around reCAPTCHA/hCaptcha widget that exposes onVerify(token) callback and reset(); renders only when CAPTCHA_SITE_KEY env var is set; renders a dev-bypass placeholder otherwise"
      exports: ["CaptchaWidget"]
    - path: "e2e/engagement-modal.spec.ts"
      provides: "Playwright e2e tests covering: open modal, fill+submit happy path, inline validation errors, CAPTCHA block, rate-limit message, server error message, cancel/close focus return"
  key_links:
    - from: "src/components/engagement/EngagementRequestModal.tsx"
      to: "RecordPage Next-Action panel (11-PLAN.md)"
      via: "EngagementRequestModal exported and consumed by RecordPage via onEngagementButtonClick handler; Wave 5b provides the component, Wave 4c (11-PLAN.md) wires the trigger"
      pattern: "EngagementRequestModal"
    - from: "src/components/engagement/useEngagementForm.ts"
      to: "POST /api/v1/engagement-requests"
      via: "fetch('/api/v1/engagement-requests', { method: 'POST', body: JSON.stringify({...}) })"
      pattern: "api/v1/engagement-requests"
    - from: "src/components/engagement/EngagementRequestModal.tsx"
      to: "src/components/engagement/CaptchaWidget.tsx"
      via: "CaptchaWidget rendered in modal form; onVerify sets captchaToken in form state; submit disabled until captchaToken is non-empty"
      pattern: "CaptchaWidget"

integration_contracts:
  requires:
    - from_plan: "08"
      artifact: "src/services/engagement.service.js"
      exports: ["createEngagementRequest"]
      verify: "grep -n 'createEngagementRequest' src/services/engagement.service.js && grep -n 'listEngagementRequests' src/services/engagement.service.js && echo CONTRACT_OK"
    - from_plan: "08"
      artifact: "src/routes/engagement.routes.js"
      exports: ["POST /api/v1/engagement-requests"]
      verify: "grep -n 'engagement-requests' src/routes/engagement.routes.js && grep -n 'createEngagementRequest' src/routes/engagement.routes.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/components/engagement/EngagementRequestModal.tsx"
      exports:
        - "EngagementRequestModal: React component — engagementType, recordId, recordTitle, isOpen, onClose props; modal overlay; form + confirmation rendering"
      shape: |
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

        export function EngagementRequestModal(props: EngagementRequestModalProps): JSX.Element;
      verify: "grep -n 'EngagementRequestModal' src/components/engagement/EngagementRequestModal.tsx && grep -n 'EngagementType' src/components/engagement/EngagementRequestModal.tsx && grep -n 'recordId' src/components/engagement/EngagementRequestModal.tsx && echo CONTRACT_OK"
    - artifact: "src/components/engagement/useEngagementForm.ts"
      exports:
        - "useEngagementForm: React hook — (engagementType: EngagementType, recordId: string) => { fields, errors, captchaToken, setCaptchaToken, isSubmitting, confirmationState, submitError, handleChange, handleBlur, handleSubmit, reset }"
      shape: |
        export interface UseEngagementFormResult {
          fields: { requestorName: string; requestorOffice: string; requestorEmail: string; descriptionOfInterest: string; desiredNextStep: string };
          errors: Partial<Record<keyof UseEngagementFormResult['fields'], string>>;
          captchaToken: string | null;
          setCaptchaToken: (token: string | null) => void;
          isSubmitting: boolean;
          confirmationState: { requestType: string; recordTitle: string; submittedAt: string } | null;
          submitError: { code: string; message: string } | null;
          handleChange: (field: string, value: string) => void;
          handleBlur: (field: string) => void;
          handleSubmit: () => Promise<void>;
          reset: () => void;
        }
        export function useEngagementForm(engagementType: EngagementType, recordId: string): UseEngagementFormResult;
      verify: "grep -n 'useEngagementForm' src/components/engagement/useEngagementForm.ts && grep -n 'captchaToken' src/components/engagement/useEngagementForm.ts && grep -n 'confirmationState' src/components/engagement/useEngagementForm.ts && echo CONTRACT_OK"
    - artifact: "src/components/engagement/EngagementConfirmation.tsx"
      exports:
        - "EngagementConfirmation: renders success state inside modal — request type label, record title, timestamp, Close button"
      shape: |
        export interface EngagementConfirmationProps {
          requestType: EngagementType;
          recordTitle: string;
          submittedAt: string; // ISO 8601 string
          onClose: () => void;
        }
        export function EngagementConfirmation(props: EngagementConfirmationProps): JSX.Element;
      verify: "grep -n 'EngagementConfirmation' src/components/engagement/EngagementConfirmation.tsx && grep -n 'submittedAt' src/components/engagement/EngagementConfirmation.tsx && echo CONTRACT_OK"
    - artifact: "src/components/engagement/CaptchaWidget.tsx"
      exports:
        - "CaptchaWidget: renders reCAPTCHA/hCaptcha widget; onVerify(token) callback; reset() method; dev-bypass placeholder when NEXT_PUBLIC_CAPTCHA_SITE_KEY is absent"
      shape: |
        export interface CaptchaWidgetProps {
          onVerify: (token: string) => void;
          onExpire?: () => void;
        }
        export function CaptchaWidget(props: CaptchaWidgetProps): JSX.Element;
      verify: "grep -n 'CaptchaWidget' src/components/engagement/CaptchaWidget.tsx && grep -n 'onVerify' src/components/engagement/CaptchaWidget.tsx && echo CONTRACT_OK"
---

<objective>
Build the **Engagement Request Modal** — the UI component that allows stakeholders on the Innovation Record page (`/records/{id}`) to submit one of four engagement requests (REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING) directly from the Next-Action panel.

Purpose: This is the final step in F7 (Engagement Routing) on the frontend. The backend EngagementService (08-PLAN.md) is already live; this plan wires the public-facing modal form to `POST /api/v1/engagement-requests`. The modal is designed to be mounted by the RecordPage (11-PLAN.md, Wave 4c) which provides the trigger button and passes in `engagementType`, `recordId`, and `recordTitle`.

Output:
- `src/components/engagement/EngagementRequestModal.tsx` — modal overlay component with focus trap, form + confirmation rendering
- `src/components/engagement/useEngagementForm.ts` — React hook for form state, validation, API submit, confirmation state
- `src/components/engagement/EngagementConfirmation.tsx` — in-modal success view
- `src/components/engagement/CaptchaWidget.tsx` — CAPTCHA widget wrapper with dev bypass
- `e2e/engagement-modal.spec.ts` — Playwright e2e tests covering all form states
</objective>

<feature_dependencies>
Implements: F7: Engagement Routing — engagement request modal/inline form for all 4 engagement types (REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING), CAPTCHA integration, rate-limit feedback, confirmation message
Depends on: F2: Innovation Record (RecordPage Next-Action panel provides trigger buttons; Wave 4c / 11-PLAN.md wires the modal; record title and ID are passed as props), F9: Content, Maturity & Trust Model (trust context already on record page — no direct dependency on trust components from this plan)
Enables: F7 complete: Wave 7 integration validates end-to-end engagement request routing
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/08-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md (Screen 03: Engagement Request Modal, Flow 03)
@project_specs/UserStories-TSIO-Innovation-Hub.md (US-7.1, US-7.2)
</context>

<tasks>

<task type="auto">
  <name>Task 1: EngagementRequestModal, useEngagementForm hook, EngagementConfirmation, and CaptchaWidget</name>
  <files>
    src/components/engagement/EngagementRequestModal.tsx
    src/components/engagement/useEngagementForm.ts
    src/components/engagement/EngagementConfirmation.tsx
    src/components/engagement/CaptchaWidget.tsx
  </files>
  <action>
Create `src/components/engagement/` directory. Implement the four files below. Ground every design decision in UX-Mockup Screen 03 and Flow 03.

---

### 1. `src/components/engagement/useEngagementForm.ts`

React hook managing form state, field validation, CAPTCHA token, API submission to `POST /api/v1/engagement-requests`, and success/error state.

```typescript
// src/components/engagement/useEngagementForm.ts
// Manages engagement request form state, validation, and API submission.
// POST /api/v1/engagement-requests (Wave 3c / 08-PLAN.md provides this endpoint)
//
// API request shape (from 08-PLAN.md integration_contracts.provides):
//   { request_type, record_id, requestor_name, requestor_email, requestor_office,
//     description_of_interest, desired_next_step?, captcha_token }
// API success response: EngagementRequest { request_id, record_id, request_type, submitted_at, ... }
// API error 429: { error: { code: 'RATE_LIMIT_EXCEEDED', message: string } }
// API error 422: { error: { code: 'CAPTCHA_INVALID' | 'VALIDATION_ERROR', message: string, fields?: [] } }
// API error 5xx: generic server error

import { useState, useCallback } from 'react';

export type EngagementType =
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'REQUEST_BRIEFING';

interface FormFields {
  requestorName: string;
  requestorOffice: string;
  requestorEmail: string;
  descriptionOfInterest: string;
  desiredNextStep: string;
}

interface FormErrors {
  requestorName?: string;
  requestorOffice?: string;
  requestorEmail?: string;
  descriptionOfInterest?: string;
}

interface ConfirmationState {
  requestType: EngagementType;
  recordTitle: string;
  submittedAt: string; // ISO 8601
}

interface SubmitError {
  code: string;
  message: string;
}

export interface UseEngagementFormResult {
  fields: FormFields;
  errors: FormErrors;
  captchaToken: string | null;
  setCaptchaToken: (token: string | null) => void;
  isSubmitting: boolean;
  confirmationState: ConfirmationState | null;
  submitError: SubmitError | null;
  handleChange: (field: keyof FormFields, value: string) => void;
  handleBlur: (field: keyof FormFields) => void;
  handleSubmit: (recordTitle: string) => Promise<void>;
  reset: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: keyof FormFields, value: string): string | undefined {
  switch (field) {
    case 'requestorName':
      if (!value.trim()) return 'Name is required.';
      return undefined;
    case 'requestorOffice':
      if (!value.trim()) return 'Office is required.';
      return undefined;
    case 'requestorEmail':
      if (!value.trim()) return 'Email address is required.';
      if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address.';
      return undefined;
    case 'descriptionOfInterest':
      if (!value.trim()) return 'Description is required.';
      if (value.trim().length < 20) return 'Description must be at least 20 characters.';
      if (value.trim().length > 2000) return 'Description must be 2000 characters or fewer.';
      return undefined;
    default:
      return undefined;
  }
}

const EMPTY_FIELDS: FormFields = {
  requestorName: '',
  requestorOffice: '',
  requestorEmail: '',
  descriptionOfInterest: '',
  desiredNextStep: '',
};

export function useEngagementForm(
  engagementType: EngagementType,
  recordId: string
): UseEngagementFormResult {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const handleChange = useCallback((field: keyof FormFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
    // Clear error as user types
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  }, []);

  const handleBlur = useCallback((field: keyof FormFields) => {
    const value = fields[field] ?? '';
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [fields]);

  const handleSubmit = useCallback(async (recordTitle: string) => {
    // Validate all required fields
    const requiredFields: (keyof FormFields)[] = [
      'requestorName', 'requestorOffice', 'requestorEmail', 'descriptionOfInterest',
    ];
    const newErrors: FormErrors = {};
    let hasError = false;
    for (const field of requiredFields) {
      const error = validateField(field, fields[field] ?? '');
      if (error) { newErrors[field] = error; hasError = true; }
    }
    if (hasError) { setErrors(newErrors); return; }

    if (!captchaToken) {
      setSubmitError({ code: 'CAPTCHA_REQUIRED', message: 'Please complete the CAPTCHA before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v1/engagement-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: engagementType,
          record_id: recordId,
          requestor_name: fields.requestorName.trim(),
          requestor_email: fields.requestorEmail.trim(),
          requestor_office: fields.requestorOffice.trim(),
          description_of_interest: fields.descriptionOfInterest.trim(),
          desired_next_step: fields.desiredNextStep.trim() || undefined,
          captcha_token: captchaToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmationState({
          requestType: engagementType,
          recordTitle,
          submittedAt: data.submitted_at ?? new Date().toISOString(),
        });
        return;
      }

      // Error handling
      const errorData = await response.json().catch(() => ({}));
      const errorCode = errorData?.error?.code ?? 'UNKNOWN_ERROR';
      const errorMessage = errorData?.error?.message ?? 'An unexpected error occurred.';

      if (response.status === 429) {
        setSubmitError({ code: errorCode, message: 'Too many requests. Please try again later.' });
      } else if (response.status === 422) {
        if (errorCode === 'CAPTCHA_INVALID') {
          setSubmitError({ code: errorCode, message: 'CAPTCHA verification failed. Please complete the CAPTCHA again.' });
          setCaptchaToken(null); // Reset CAPTCHA
        } else {
          setSubmitError({ code: errorCode, message: errorMessage });
        }
      } else {
        setSubmitError({
          code: errorCode,
          message: 'Unable to submit at this time. Please try again or contact the I&R team directly.',
        });
      }
    } catch {
      setSubmitError({
        code: 'NETWORK_ERROR',
        message: 'Unable to submit at this time. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, captchaToken, engagementType, recordId]);

  const reset = useCallback(() => {
    setFields(EMPTY_FIELDS);
    setErrors({});
    setCaptchaToken(null);
    setIsSubmitting(false);
    setConfirmationState(null);
    setSubmitError(null);
  }, []);

  return {
    fields,
    errors,
    captchaToken,
    setCaptchaToken,
    isSubmitting,
    confirmationState,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}
```

---

### 2. `src/components/engagement/CaptchaWidget.tsx`

Wrapper around the CAPTCHA widget. Uses `NEXT_PUBLIC_CAPTCHA_SITE_KEY` env var. In dev/test environments where no site key is set, renders a visible dev-bypass button (clearly labelled) that calls `onVerify('dev-bypass-token')` — this ensures the form is testable locally without a CAPTCHA provider account.

**UX-Mockup Screen 03:** "CAPTCHA / reCAPTCHA widget — must complete before submit enabled"

```typescript
// src/components/engagement/CaptchaWidget.tsx
// Wraps reCAPTCHA v2 (or hCaptcha) widget.
// Uses react-google-recaptcha for reCAPTCHA v2 (explicit render, challenge-based).
// Fallback dev-bypass when NEXT_PUBLIC_CAPTCHA_SITE_KEY is not set — visible warning label.
//
// NOTE: Do NOT use invisible reCAPTCHA v3 — the UX mockup shows a visible challenge widget
// ("CAPTCHA / reCAPTCHA widget"). Use reCAPTCHA v2 checkbox ("I'm not a robot") or hCaptcha.

import React from 'react';

export interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function CaptchaWidget({ onVerify, onExpire }: CaptchaWidgetProps): JSX.Element {
  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY ?? '';

  // Dev/test bypass: renders when no site key is configured.
  // Clearly marked so it is never confused with production behavior.
  if (!siteKey) {
    return (
      <div
        role="region"
        aria-label="CAPTCHA verification"
        style={{
          border: '1px dashed #D97706',
          borderRadius: '4px',
          padding: '12px',
          backgroundColor: '#FEF3C7',
          fontSize: '14px',
          color: '#92400E',
        }}
      >
        <strong>[DEV] CAPTCHA not configured.</strong> Click to bypass for local development only.
        <br />
        <button
          type="button"
          onClick={() => onVerify('dev-bypass-token')}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            border: '1px solid #D97706',
            borderRadius: '4px',
            background: '#FFFBEB',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Bypass CAPTCHA (dev only)
        </button>
      </div>
    );
  }

  // Production: dynamic import of react-google-recaptcha to avoid SSR issues
  // The component is rendered only on the client side.
  const ReCAPTCHA = require('react-google-recaptcha').default;

  return (
    <div role="region" aria-label="CAPTCHA verification">
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={(token: string | null) => {
          if (token) onVerify(token);
          else if (onExpire) onExpire();
        }}
        onExpired={() => {
          if (onExpire) onExpire();
        }}
      />
    </div>
  );
}
```

---

### 3. `src/components/engagement/EngagementConfirmation.tsx`

In-modal success view, rendered when `confirmationState` is non-null. Replaces the form body.

**UX-Mockup Screen 03 confirmation layout:**
- ✅ checkmark
- "Your request has been sent to the I&R team. Someone will follow up with you based on team availability."
- Request type, Record name, Submitted timestamp
- [Close] button

```typescript
// src/components/engagement/EngagementConfirmation.tsx
// Renders the success state inside the EngagementRequestModal.
// UX-Mockup Screen 03 Confirmation State.

import React from 'react';
import type { EngagementType } from './useEngagementForm';

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  REQUEST_DEMO: 'Demo',
  REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance',
  REQUEST_BRIEFING: 'Briefing',
};

export interface EngagementConfirmationProps {
  requestType: EngagementType;
  recordTitle: string;
  submittedAt: string; // ISO 8601 UTC string
  onClose: () => void;
}

export function EngagementConfirmation({
  requestType,
  recordTitle,
  submittedAt,
  onClose,
}: EngagementConfirmationProps): JSX.Element {
  const label = ENGAGEMENT_LABELS[requestType] ?? requestType;
  const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '24px 0' }}>
      {/* Checkmark icon */}
      <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>

      <p style={{ fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
        Your request has been sent to the I&R team.
      </p>
      <p style={{ color: '#374151', marginBottom: '24px' }}>
        Someone will follow up with you based on team availability.
      </p>

      <dl style={{ textAlign: 'left', borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <dt style={{ color: '#6B7280', minWidth: '120px' }}>Request type:</dt>
          <dd style={{ margin: 0 }}>{label}</dd>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <dt style={{ color: '#6B7280', minWidth: '120px' }}>Record:</dt>
          <dd style={{ margin: 0 }}>{recordTitle}</dd>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <dt style={{ color: '#6B7280', minWidth: '120px' }}>Submitted:</dt>
          <dd style={{ margin: 0 }}>{formattedDate}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '10px 24px',
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '15px',
        }}
      >
        Close
      </button>
    </div>
  );
}
```

---

### 4. `src/components/engagement/EngagementRequestModal.tsx`

Main modal component. Implements:
- Overlay backdrop (dimmed, `aria-modal="true"`, `role="dialog"`)
- Focus trap (on open, focus moves to first input; on close, focus returns to trigger — WCAG 2.1 AA)
- Modal title reflects request type: "Request Technical Guidance" / "Request a Demo" / etc.
- Pre-populated read-only record reference display
- Form fields wired to `useEngagementForm` hook
- CAPTCHA via `CaptchaWidget`
- Submit button disabled while submitting or errors present
- Submission error banner at form top (rate limit, server error)
- Switches to `EngagementConfirmation` on success
- Cancel button and × button both call `onClose`

**UX-Mockup Screen 03 layout notes:**
- Modal title = request type name (e.g. "Request Technical Guidance")
- "You are requesting [type label] for: [record emoji] [record title]" — read-only, cannot edit
- Fields: Your Name*, Your Office*, Your Email Address*, Describe your interest* (with char count), Desired next step (optional)
- CAPTCHA before buttons
- "* Required fields" note
- [Cancel] + [Submit Request] buttons
- On success: form replaced by confirmation view

```typescript
// src/components/engagement/EngagementRequestModal.tsx
// Engagement request modal overlay.
// UX-Mockup: Screen 03 — Engagement Request Modal + Flow 03
// UserStories: US-7.1, US-7.2

import React, { useEffect, useRef } from 'react';
import { useEngagementForm, EngagementType } from './useEngagementForm';
import { EngagementConfirmation } from './EngagementConfirmation';
import { CaptchaWidget } from './CaptchaWidget';

const ENGAGEMENT_TITLES: Record<EngagementType, string> = {
  REQUEST_DEMO: 'Request a Demo',
  REQUEST_ADOPTION_DISCUSSION: 'Request Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Request Technical Guidance',
  REQUEST_BRIEFING: 'Request a Briefing',
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  REQUEST_DEMO: 'a demo',
  REQUEST_ADOPTION_DISCUSSION: 'an adoption discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'technical guidance',
  REQUEST_BRIEFING: 'a briefing',
};

export interface EngagementRequestModalProps {
  engagementType: EngagementType;
  recordId: string;
  recordTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EngagementRequestModal({
  engagementType,
  recordId,
  recordTitle,
  isOpen,
  onClose,
}: EngagementRequestModalProps): JSX.Element | null {
  const {
    fields,
    errors,
    captchaToken,
    setCaptchaToken,
    isSubmitting,
    confirmationState,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = useEngagementForm(engagementType, recordId);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management: move focus to first input on open (WCAG 2.1 AA)
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Keyboard trap: close on Escape, trap Tab within modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = ENGAGEMENT_TITLES[engagementType];
  const label = ENGAGEMENT_LABELS[engagementType];
  const isFormDisabled = isSubmitting;
  const canSubmit = !isSubmitting && captchaToken !== null;
  const descCharCount = fields.descriptionOfInterest.length;

  return (
    // Overlay backdrop
    <div
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-labelledby="engagement-modal-title"
        aria-describedby="engagement-modal-desc"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 id="engagement-modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            {confirmationState ? 'Request Submitted' : title}
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', lineHeight: 1, padding: '4px', color: '#374151',
            }}
          >
            ✕
          </button>
        </div>
        <hr style={{ borderColor: '#E5E7EB', marginBottom: '20px' }} />

        {/* Success confirmation state */}
        {confirmationState ? (
          <EngagementConfirmation
            requestType={confirmationState.requestType}
            recordTitle={confirmationState.recordTitle}
            submittedAt={confirmationState.submittedAt}
            onClose={onClose}
          />
        ) : (
          /* Form state */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(recordTitle);
            }}
            noValidate
          >
            {/* Record reference — read-only, pre-populated */}
            <p id="engagement-modal-desc" style={{ color: '#374151', marginBottom: '20px', fontSize: '15px' }}>
              You are requesting {label} for:{' '}
              <span style={{ fontWeight: 600 }}>📋 {recordTitle}</span>
              <br />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>(Pre-populated — cannot edit record reference)</span>
            </p>

            {/* Submission error banner */}
            {submitError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#991B1B',
                  fontSize: '14px',
                }}
              >
                {submitError.message}
              </div>
            )}

            {/* Your Name */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorName" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorName"
                ref={firstInputRef}
                type="text"
                value={fields.requestorName}
                onChange={(e) => handleChange('requestorName', e.target.value)}
                onBlur={() => handleBlur('requestorName')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorName}
                aria-describedby={errors.requestorName ? 'requestorName-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorName ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorName && (
                <p id="requestorName-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorName}
                </p>
              )}
            </div>

            {/* Your Office */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorOffice" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Office <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorOffice"
                type="text"
                value={fields.requestorOffice}
                onChange={(e) => handleChange('requestorOffice', e.target.value)}
                onBlur={() => handleBlur('requestorOffice')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorOffice}
                aria-describedby={errors.requestorOffice ? 'requestorOffice-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorOffice ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorOffice && (
                <p id="requestorOffice-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorOffice}
                </p>
              )}
            </div>

            {/* Your Email Address */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requestorEmail" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Your Email Address <span aria-hidden="true">*</span>
              </label>
              <input
                id="requestorEmail"
                type="email"
                value={fields.requestorEmail}
                onChange={(e) => handleChange('requestorEmail', e.target.value)}
                onBlur={() => handleBlur('requestorEmail')}
                disabled={isFormDisabled}
                aria-required="true"
                aria-invalid={!!errors.requestorEmail}
                aria-describedby={errors.requestorEmail ? 'requestorEmail-error' : undefined}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.requestorEmail ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              {errors.requestorEmail && (
                <p id="requestorEmail-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px' }}>
                  {errors.requestorEmail}
                </p>
              )}
            </div>

            {/* Describe your interest */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="descriptionOfInterest" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Describe your interest or question <span aria-hidden="true">*</span>
              </label>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                Help us understand your context so we can respond appropriately. (20–2000 chars)
              </p>
              <textarea
                id="descriptionOfInterest"
                value={fields.descriptionOfInterest}
                onChange={(e) => handleChange('descriptionOfInterest', e.target.value)}
                onBlur={() => handleBlur('descriptionOfInterest')}
                disabled={isFormDisabled}
                rows={4}
                maxLength={2000}
                aria-required="true"
                aria-invalid={!!errors.descriptionOfInterest}
                aria-describedby="descriptionOfInterest-count descriptionOfInterest-error"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: `1px solid ${errors.descriptionOfInterest ? '#EF4444' : '#D1D5DB'}`,
                  fontSize: '15px', boxSizing: 'border-box', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {errors.descriptionOfInterest ? (
                  <p id="descriptionOfInterest-error" role="alert" style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>
                    {errors.descriptionOfInterest}
                  </p>
                ) : <span />}
                <span
                  id="descriptionOfInterest-count"
                  aria-live="polite"
                  style={{ fontSize: '13px', color: descCharCount > 1900 ? '#DC2626' : '#6B7280' }}
                >
                  {descCharCount} / 2000
                </span>
              </div>
            </div>

            {/* Desired next step (optional) */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="desiredNextStep" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                Desired next step <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
              </label>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                e.g., a call, a document review, a live demo
              </p>
              <input
                id="desiredNextStep"
                type="text"
                value={fields.desiredNextStep}
                onChange={(e) => handleChange('desiredNextStep', e.target.value)}
                disabled={isFormDisabled}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: '1px solid #D1D5DB', fontSize: '15px', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* CAPTCHA */}
            <div style={{ marginBottom: '20px' }}>
              <CaptchaWidget
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>

            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              * Required fields
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isFormDisabled}
                style={{
                  padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: '4px',
                  background: '#FFFFFF', cursor: 'pointer', fontSize: '15px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={isSubmitting}
                style={{
                  padding: '10px 20px', borderRadius: '4px', border: 'none',
                  backgroundColor: canSubmit ? '#1D4ED8' : '#9CA3AF',
                  color: '#FFFFFF', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                }}
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

**Package dependencies to install if not present:**
- `react-google-recaptcha` (only for production CAPTCHA rendering; CaptchaWidget uses dynamic require to avoid SSR issues)

Run: `npm install react-google-recaptcha` (or equivalent for the project's package manager).
  </action>
  <verify>
ls src/components/engagement/EngagementRequestModal.tsx src/components/engagement/useEngagementForm.ts src/components/engagement/EngagementConfirmation.tsx src/components/engagement/CaptchaWidget.tsx && echo "ALL_FILES_EXIST" && grep -n 'EngagementRequestModal' src/components/engagement/EngagementRequestModal.tsx && grep -n 'EngagementType' src/components/engagement/EngagementRequestModal.tsx && grep -n 'recordId' src/components/engagement/EngagementRequestModal.tsx && echo "MODAL_CONTRACT_OK" && grep -n 'useEngagementForm' src/components/engagement/useEngagementForm.ts && grep -n 'captchaToken' src/components/engagement/useEngagementForm.ts && grep -n 'confirmationState' src/components/engagement/useEngagementForm.ts && grep -n 'api/v1/engagement-requests' src/components/engagement/useEngagementForm.ts && echo "HOOK_CONTRACT_OK" && grep -n 'EngagementConfirmation' src/components/engagement/EngagementConfirmation.tsx && grep -n 'submittedAt' src/components/engagement/EngagementConfirmation.tsx && echo "CONFIRMATION_CONTRACT_OK" && grep -n 'CaptchaWidget' src/components/engagement/CaptchaWidget.tsx && grep -n 'onVerify' src/components/engagement/CaptchaWidget.tsx && echo "CAPTCHA_CONTRACT_OK"
  </verify>
  <done>
- `src/components/engagement/useEngagementForm.ts` exports `useEngagementForm(engagementType, recordId)` hook with: form fields, per-field validation (name/office/email required, description 20-2000 chars), captchaToken state, isSubmitting, confirmationState (non-null on success), submitError (rate-limit/server-error handling), handleChange, handleBlur, handleSubmit (POSTs to /api/v1/engagement-requests), reset
- `src/components/engagement/CaptchaWidget.tsx` exports `CaptchaWidget({ onVerify, onExpire })` — renders reCAPTCHA v2 widget when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` is set; renders dev-bypass button otherwise
- `src/components/engagement/EngagementConfirmation.tsx` exports `EngagementConfirmation({ requestType, recordTitle, submittedAt, onClose })` — renders ✅ success state with request type label, record title, formatted timestamp, and Close button
- `src/components/engagement/EngagementRequestModal.tsx` exports `EngagementRequestModal({ engagementType, recordId, recordTitle, isOpen, onClose })` — modal overlay with: WCAG focus management (focus trap + Escape close + focus return), record reference read-only display, form fields wired to hook, CaptchaWidget, submit-disabled-until-CAPTCHA behavior, inline validation errors, submission error banner (rate-limit / server-error), switches to EngagementConfirmation on success
- Modal title reflects request type: "Request Technical Guidance" / "Request a Demo" / "Request Adoption Discussion" / "Request a Briefing"
- All 4 EngagementType values supported (REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING)
  </done>

  <feature_dependencies>
  Implements: F7: Engagement Routing — EngagementRequestModal UI, useEngagementForm hook, CAPTCHA integration, confirmation state
  Depends on: POST /api/v1/engagement-requests endpoint from 08-PLAN.md (Wave 3c EngagementService)
  Enables: RecordPage (11-PLAN.md) wires trigger buttons to this modal; Wave 7 end-to-end engagement routing validation
  </feature_dependencies>
</task>

<task type="auto">
  <name>Task 2: Playwright e2e tests for engagement request modal</name>
  <files>
    e2e/engagement-modal.spec.ts
  </files>
  <action>
Write Playwright e2e tests covering all states of the engagement request modal per UX-Mockup Screen 03 and US-7.1, US-7.2. Tests run against the live app served by `docker compose up`.

**Playwright prerequisite check:** Confirm `npx playwright --version` works and `playwright.config.ts` exists with a `baseURL` configured. If not, create `playwright.config.ts` at the project root:

```typescript
// playwright.config.ts (create if absent)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    headless: true,
  },
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
});
```

---

### `e2e/engagement-modal.spec.ts`

Tests assume:
1. A seeded PUBLISHED innovation record exists at `/records/test-record-001` with at least REQUEST_DEMO and REQUEST_TECHNICAL_GUIDANCE configured (Wave 7a seeding provides this — for e2e test we mock the API layer via Playwright route interception so tests are not blocked on live seed data).
2. `POST /api/v1/engagement-requests` is interceptable via `page.route()` for error state tests.

```typescript
// e2e/engagement-modal.spec.ts
// Playwright e2e tests for Engagement Request Modal (Screen 03 / Flow 03)
// UserStories: US-7.1, US-7.2
// Feature: F7 — Engagement Routing

import { test, expect } from '@playwright/test';

// Intercept the engagement API with a mock success response for controlled tests
const MOCK_SUCCESS_RESPONSE = {
  request_id: 'test-request-uuid-001',
  record_id: 'test-record-001',
  request_type: 'REQUEST_DEMO',
  requestor_name: 'Margaret Hollis',
  requestor_email: 'margaret@uscourts.gov',
  requestor_office: 'Eastern District of Virginia',
  description_of_interest: 'We are evaluating this for our court and would like a live demo.',
  status: 'SUBMITTED',
  submitted_at: '2026-07-30T14:14:00Z',
};

// Helper: fill the engagement form with valid data
async function fillEngagementForm(page: import('@playwright/test').Page) {
  await page.fill('#requestorName', 'Margaret Hollis');
  await page.fill('#requestorOffice', 'Eastern District of Virginia');
  await page.fill('#requestorEmail', 'margaret@uscourts.gov');
  await page.fill('#descriptionOfInterest', 'We are evaluating this for our court and would like a live demo to see it in action.');
}

test.describe('Engagement Request Modal — F7 (US-7.1, US-7.2)', () => {

  test('clicking "Request a Demo" button opens modal with correct title and pre-populated record', async ({ page }) => {
    await page.goto('/records/test-record-001');
    // Click the "Request a Demo" engagement button in the Next-Action panel
    await page.click('button:has-text("Request a Demo")');
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Modal title should reflect the request type
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request a Demo');
    // Record reference should be pre-populated and read-only
    await expect(page.locator('[role="dialog"]')).toContainText('a demo for:');
    // CAPTCHA widget should be present
    await expect(page.locator('[aria-label="CAPTCHA verification"]')).toBeVisible();
  });

  test('clicking "Request Technical Guidance" opens modal with correct title', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request Technical Guidance")');
    await expect(page.locator('#engagement-modal-title')).toHaveText('Request Technical Guidance');
    await expect(page.locator('[role="dialog"]')).toContainText('technical guidance for:');
  });

  test('modal can be closed with the × button; focus returns to trigger', async ({ page }) => {
    await page.goto('/records/test-record-001');
    const trigger = page.locator('button:has-text("Request a Demo")').first();
    await trigger.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button[aria-label="Close modal"]');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    // Focus should return to the trigger button (WCAG 2.1 AA)
    await expect(trigger).toBeFocused();
  });

  test('modal can be closed with Cancel button', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Submit button is disabled until CAPTCHA is completed', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    // Submit should still be disabled — CAPTCHA not yet completed
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeDisabled();
  });

  test('happy path: fill form, bypass CAPTCHA (dev), submit successfully, see confirmation', async ({ page }) => {
    // Intercept the API to return mock success
    await page.route('/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);

    // Complete the dev CAPTCHA bypass (CaptchaWidget renders bypass button in test env)
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) {
      await bypassBtn.click();
    }

    // Submit the form
    const submitBtn = page.locator('button:has-text("Submit Request")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Confirmation state should appear
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="dialog"]')).toContainText('Your request has been sent to the I&R team.');
    await expect(page.locator('[role="dialog"]')).toContainText('Demo');
    await expect(page.locator('button:has-text("Close")')).toBeVisible();
  });

  test('closing confirmation modal closes entire modal', async ({ page }) => {
    await page.route('/api/v1/engagement-requests', (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(MOCK_SUCCESS_RESPONSE) });
    });
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Close")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('inline validation: required fields show errors on blur', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    // Click Name field then blur without entering value
    await page.click('#requestorName');
    await page.press('#requestorName', 'Tab');
    await expect(page.locator('#requestorName-error')).toBeVisible();
    await expect(page.locator('#requestorName-error')).toContainText('Name is required.');
  });

  test('inline validation: description too short shows error', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await page.fill('#descriptionOfInterest', 'Too short');
    await page.press('#descriptionOfInterest', 'Tab');
    await expect(page.locator('#descriptionOfInterest-error')).toBeVisible();
    await expect(page.locator('#descriptionOfInterest-error')).toContainText('at least 20 characters');
  });

  test('rate limit (429) shows error banner at top of form', async ({ page }) => {
    await page.route('/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please wait before submitting again.' } }),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Too many requests');
    // Modal should still be open (user should be able to try again later)
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('server error (500) shows error banner', async ({ page }) => {
    await page.route('/api/v1/engagement-requests', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } }),
      });
    });

    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    await fillEngagementForm(page);
    const bypassBtn = page.locator('button:has-text("Bypass CAPTCHA (dev only)")');
    if (await bypassBtn.isVisible()) await bypassBtn.click();
    await page.click('button:has-text("Submit Request")');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="alert"]')).toContainText('Unable to submit at this time');
  });

  test('character count display updates live in description field', async ({ page }) => {
    await page.goto('/records/test-record-001');
    await page.click('button:has-text("Request a Demo")');
    // Initially 0 / 2000
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText('0 / 2000');
    await page.fill('#descriptionOfInterest', 'Hello world description text here.');
    // Count should update to reflect new length
    const expectedLen = 'Hello world description text here.'.length;
    await expect(page.locator('#descriptionOfInterest-count')).toHaveText(`${expectedLen} / 2000`);
  });

});
```

Run verification:
```bash
npx playwright --version && echo "PLAYWRIGHT_INSTALLED" && \
ls playwright.config.ts && echo "CONFIG_EXISTS" && \
ls e2e/engagement-modal.spec.ts && echo "TEST_FILE_EXISTS"
```

Then run the tests:
```bash
npx playwright test e2e/engagement-modal.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT_PASSED"
```
  </action>
  <verify>
ls e2e/engagement-modal.spec.ts && echo "FILE_EXISTS" && grep -n 'EngagementRequestModal\|engagement-modal\|engagement-requests' e2e/engagement-modal.spec.ts && grep -n 'rate.*limit\|429\|RATE_LIMIT' e2e/engagement-modal.spec.ts && grep -n 'confirmation\|Confirmation' e2e/engagement-modal.spec.ts && grep -n 'CAPTCHA\|captcha\|Bypass CAPTCHA' e2e/engagement-modal.spec.ts && echo "TEST_STRUCTURE_OK" && npx playwright test e2e/engagement-modal.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT_PASSED"
  </verify>
  <done>
- `e2e/engagement-modal.spec.ts` exists with Playwright tests covering:
  - Open modal via "Request a Demo" button — correct title and pre-populated record reference
  - Open modal via "Request Technical Guidance" — correct title
  - Close via × button — focus returns to trigger button (WCAG 2.1 AA)
  - Close via Cancel button
  - Close via Escape key
  - Submit disabled until CAPTCHA completed
  - Happy path: fill form + dev-CAPTCHA bypass + submit → confirmation state visible with correct text
  - Closing confirmation state closes modal
  - Inline validation: required field blur shows error
  - Inline validation: description too short shows error
  - 429 rate-limit response renders error banner at top of modal
  - 500 server error response renders error banner
  - Character count displays and updates live
- `npx playwright test e2e/engagement-modal.spec.ts` passes with 0 failures
  </done>

  <feature_dependencies>
  Implements: F7: Engagement Routing — Playwright e2e test coverage for modal open, form submission happy path, all error states (validation, CAPTCHA, rate limit, server error), confirmation display, and WCAG focus management
  Depends on: EngagementRequestModal, useEngagementForm, EngagementConfirmation, CaptchaWidget (Task 1 of this plan)
  Enables: Wave 7 integration validation can reference and re-run these tests as part of the full Playwright suite
  </feature_dependencies>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API (POST /api/v1/engagement-requests) | Untrusted PUBLIC user data (PII: name, email, office; free-text description; CAPTCHA token) from the modal form crossing into the engagement request API endpoint over HTTPS |
| client→CAPTCHA provider | Browser-side CAPTCHA token generation crossing through the user's browser to the external CAPTCHA provider (reCAPTCHA/hCaptcha) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-01 | Spoofing | POST /api/v1/engagement-requests — unauthenticated form submission; no session required | mitigate | Server-side CAPTCHA validation enforced in `EngagementService.createEngagementRequest` (08-PLAN.md, `src/services/engagement.service.js`) before any DB write. Frontend `useEngagementForm` blocks submit until `captchaToken` is non-null — defense-in-depth (cannot be bypassed by disabling JS; server validates independently). |
| T-13-02 | Tampering | engagement form free-text fields — XSS via description_of_interest or desired_next_step rendered elsewhere in the admin interface | mitigate | All text fields HTML-stripped server-side in `EngagementService.createEngagementRequest` via sanitize-html/DOMPurify before persistence (08-PLAN.md task action). Frontend textarea has `maxLength={2000}` for UI UX only — server enforces length limits independently. Admin display of engagement requests must also escape or sanitize on render (Wave 6 admin plan responsibility). |
| T-13-03 | Information Disclosure | recordId pre-populated in modal — exposes the record UUID to the user | accept | record_id is the public URL parameter (`/records/{record_id}`) — already exposed in the page URL for any published record. No private information is leaked by passing it to the modal. Non-published records return 404 from `GET /api/v1/records/{id}` before this page is rendered. Risk accepted: UUIDs are not sensitive when the record is published. |
| T-13-04 | Denial of Service | POST /api/v1/engagement-requests — modal enables rapid repeated form submissions from the same browser | mitigate | IP-based rate limit (10/hour) enforced server-side by `engagementLimiter` middleware in `src/routes/engagement.routes.js` (08-PLAN.md). Frontend `isSubmitting` flag disables the submit button during in-flight request — prevents accidental double-submit. Rate-limit 429 response renders a visible error banner in the modal per UX-Mockup Screen 03 states. |
| T-13-05 | Tampering | CAPTCHA bypass token in dev mode — `dev-bypass-token` accepted by CaptchaWidget in dev environments could be replayed in production | mitigate | `CaptchaWidget.tsx` only renders the dev bypass button when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` env var is absent. In production, `NEXT_PUBLIC_CAPTCHA_SITE_KEY` must be set — this env var is required in deployment config. `CaptchaService.validate()` server-side checks `captcha_enabled` from hub_settings and validates token against the real CAPTCHA provider endpoint (not against a hardcoded bypass value). The dev bypass never reaches the real CAPTCHA provider endpoint. |
</threat_model>

<verification>
After both tasks complete:

```bash
# 1. All source files exist
ls src/components/engagement/EngagementRequestModal.tsx \
   src/components/engagement/useEngagementForm.ts \
   src/components/engagement/EngagementConfirmation.tsx \
   src/components/engagement/CaptchaWidget.tsx \
   e2e/engagement-modal.spec.ts && echo "ALL_FILES_EXIST"

# 2. Integration contract: provides EngagementRequestModal for Wave 4c (11-PLAN.md) to wire
grep -n 'EngagementRequestModal' src/components/engagement/EngagementRequestModal.tsx && \
grep -n 'EngagementType' src/components/engagement/EngagementRequestModal.tsx && \
grep -n 'recordId' src/components/engagement/EngagementRequestModal.tsx && echo "MODAL_CONTRACT_OK"

# 3. Integration contract: requires POST /api/v1/engagement-requests from 08-PLAN.md
grep -n 'api/v1/engagement-requests' src/components/engagement/useEngagementForm.ts && echo "API_WIRED_OK"

# 4. All 4 engagement types handled
grep -n 'REQUEST_DEMO\|REQUEST_ADOPTION_DISCUSSION\|REQUEST_TECHNICAL_GUIDANCE\|REQUEST_BRIEFING' src/components/engagement/EngagementRequestModal.tsx && echo "ALL_4_TYPES_OK"

# 5. Confirmation state implementation
grep -n 'confirmationState\|EngagementConfirmation' src/components/engagement/EngagementRequestModal.tsx && echo "CONFIRMATION_OK"

# 6. CAPTCHA wired in modal
grep -n 'CaptchaWidget\|captchaToken' src/components/engagement/EngagementRequestModal.tsx && echo "CAPTCHA_WIRED_OK"

# 7. Rate-limit feedback in form
grep -n 'RATE_LIMIT\|Too many requests' src/components/engagement/useEngagementForm.ts && echo "RATE_LIMIT_FEEDBACK_OK"

# 8. Playwright tests cover key states
grep -n '429\|rate.*limit\|RATE_LIMIT' e2e/engagement-modal.spec.ts && echo "E2E_RATE_LIMIT_COVERED"
grep -n 'confirmation\|Confirmation\|been sent' e2e/engagement-modal.spec.ts && echo "E2E_CONFIRMATION_COVERED"
grep -n 'CAPTCHA\|captcha' e2e/engagement-modal.spec.ts && echo "E2E_CAPTCHA_COVERED"

# 9. Run Playwright tests
npx playwright test e2e/engagement-modal.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT_PASSED"
```
</verification>

<success_criteria>
- `EngagementRequestModal` component accepts `engagementType`, `recordId`, `recordTitle`, `isOpen`, `onClose` props; renders modal overlay with ARIA roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`); title reflects request type; record reference is read-only and pre-populated
- All 4 engagement types supported: REQUEST_DEMO ("Request a Demo"), REQUEST_ADOPTION_DISCUSSION ("Request Adoption Discussion"), REQUEST_TECHNICAL_GUIDANCE ("Request Technical Guidance"), REQUEST_BRIEFING ("Request a Briefing")
- Form collects: name (required), office (required), email (required, format-validated), description (required, 20-2000 chars, live character count), desired next step (optional)
- Submit disabled until CAPTCHA token is obtained; `CaptchaWidget` renders real reCAPTCHA when `NEXT_PUBLIC_CAPTCHA_SITE_KEY` is set, dev-bypass otherwise
- On 201 success: form content replaced by `EngagementConfirmation` showing "Your request has been sent to the I&R team. Someone will follow up with you based on team availability." + request type, record title, timestamp
- On 429: error banner at top of form "Too many requests. Please try again later." — modal stays open
- On 5xx: error banner at top of form "Unable to submit at this time. Please try again or contact the I&R team directly." — modal stays open
- × button and Cancel button both close modal; Escape key also closes; focus returns to trigger button on close (WCAG 2.1 AA)
- Playwright e2e tests pass (0 failures) covering: open, 4 type titles, ×/Cancel/Escape close, focus return, CAPTCHA-required, happy-path submit + confirmation, inline validation errors, rate-limit banner, server-error banner, character count
- Component is ready for RecordPage (11-PLAN.md) to import `EngagementRequestModal` and wire engagement button triggers
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/13-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (CAPTCHA widget strategy, dev-bypass pattern, WCAG focus management approach)
- Integration contract provided to Wave 4c (11-PLAN.md) for RecordPage wiring
- Integration contract consumed from Wave 3c (08-PLAN.md) EngagementService
- Playwright test coverage summary
</output>
