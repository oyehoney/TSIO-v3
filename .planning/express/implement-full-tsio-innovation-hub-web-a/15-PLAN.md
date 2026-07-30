---
phase: implement-full-tsio-innovation-hub-web-a
plan: 15
type: execute
wave: 6
depends_on: [2, 3]
files_modified:
  - src/admin/components/PublicationLifecycleControls.tsx
  - src/admin/components/ConfirmationDialog.tsx
  - src/admin/components/GovernanceGateFeedback.tsx
  - src/admin/components/MaturityStatusDropdowns.tsx
  - src/admin/pages/RecordEditPage.tsx
  - e2e/admin/record-lifecycle-controls.spec.ts
autonomous: true

features:
  implements: ["F8", "F9"]
  depends_on: ["F8", "F9"]
  enables: []

must_haves:
  truths:
    - "On a DRAFT record's edit page, 'Submit for Review' button is enabled only when all pub-required fields are complete (per Publication Readiness Checklist)"
    - "On a REVIEW record, 'Publish' button triggers REVIEW→PUBLISHED transition; if governance gate fails, the GovernanceGateFeedback inline list shows exactly the blocking field names"
    - "On a PUBLISHED record, 'Edit' button opens a warning modal before allowing editing; confirming moves record to REVIEW and removes it from public view"
    - "On a PUBLISHED record, 'Supersede' button prompts for superseded_by_record_id; invalid ID shows 'The superseding record ID does not exist.' error"
    - "On a PUBLISHED record, 'Archive' button shows a confirmation dialog before archiving; confirming calls archive endpoint"
    - "On a SUPERSEDED record, only 'Archive' action is available; no 'Edit', 'Publish', or 'Supersede' shown"
    - "On an ARCHIVED record, no state-change action buttons are shown; form fields are read-only"
    - "Maturity Level and Review Status dropdowns each display inline definitions of the currently selected value below the control, with a 'View all definitions →' link to the ContentModelReference page"
    - "ARCHIVED maturity level selection on a Published record triggers an advisory: 'Consider also archiving the publication state to remove this record from the public catalog.'"
  artifacts:
    - path: "src/admin/components/PublicationLifecycleControls.tsx"
      provides: "State-aware action buttons for lifecycle transitions; renders correct subset per publication_state"
      exports: ["PublicationLifecycleControls"]
    - path: "src/admin/components/ConfirmationDialog.tsx"
      provides: "Reusable modal dialog for irreversible transition confirmation (Publish/Edit Published, Supersede, Archive)"
      exports: ["ConfirmationDialog"]
    - path: "src/admin/components/GovernanceGateFeedback.tsx"
      provides: "Inline error list component showing missing pub-required fields when publish transitions fail"
      exports: ["GovernanceGateFeedback"]
    - path: "src/admin/components/MaturityStatusDropdowns.tsx"
      provides: "Maturity level + review status controlled dropdowns with inline definitions and advisory for ARCHIVED maturity on Published record"
      exports: ["MaturityLevelDropdown", "ReviewStatusDropdown"]
    - path: "src/admin/pages/RecordEditPage.tsx"
      provides: "RecordEditPage integrating all lifecycle controls, governance feedback, and maturity/review dropdowns"
      exports: ["RecordEditPage"]
    - path: "e2e/admin/record-lifecycle-controls.spec.ts"
      provides: "Playwright e2e tests for all lifecycle control interactions on RecordEditPage"
  key_links:
    - from: "src/admin/pages/RecordEditPage.tsx"
      to: "src/admin/components/PublicationLifecycleControls.tsx"
      via: "<PublicationLifecycleControls publicationState={record.publication_state} onSubmitForReview=... onPublish=... />"
      pattern: "PublicationLifecycleControls"
    - from: "src/admin/components/PublicationLifecycleControls.tsx"
      to: "PATCH /api/v1/records/:id/submit-review | publish | supersede | archive"
      via: "fetch calls to lifecycle transition API endpoints"
      pattern: "fetch.*submit-review|publish|supersede|archive"
    - from: "src/admin/components/GovernanceGateFeedback.tsx"
      to: "422 PUBLICATION_GATE_FAILED response"
      via: "renders blockingFields array from API error.fields on 422 from /api/v1/records/:id/publish"
      pattern: "PUBLICATION_GATE_FAILED|blockingFields|blocking_fields"
    - from: "src/admin/components/MaturityStatusDropdowns.tsx"
      to: "MATURITY_DEFINITIONS / REVIEW_STATUS_DEFINITIONS constants"
      via: "inline definition rendered below each dropdown from hard-coded definition map"
      pattern: "MATURITY_DEFINITIONS|REVIEW_STATUS_DEFINITIONS"

integration_contracts:
  requires:
    - from_plan: "05"
      artifact: "src/services/publicationLifecycleService.js"
      exports:
        - "VALID_TRANSITIONS: { DRAFT: ['submit-review'], REVIEW: ['publish', 'return-to-draft'], PUBLISHED: ['supersede', 'archive'], SUPERSEDED: ['archive'] }"
        - "transition(currentState, targetTransition) → newState | throws INVALID_STATE_TRANSITION"
      verify: "grep -n 'INVALID_STATE_TRANSITION\\|VALID_TRANSITIONS\\|transition' src/services/publicationLifecycleService.js && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "src/services/governanceGateService.js"
      exports:
        - "validate(record) → { valid: true } | { valid: false, blocking_fields: string[] }"
        - "PUB_REQUIRED_FIELDS: string[]"
      verify: "grep -n 'PUB_REQUIRED_FIELDS\\|PUBLICATION_GATE_FAILED\\|validate' src/services/governanceGateService.js && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "src/handlers/recordHandler.js"
      exports:
        - "POST /api/v1/records/:id/submit-review → 200 { publication_state: 'REVIEW' } | 422 INVALID_STATE_TRANSITION"
        - "POST /api/v1/records/:id/publish → 200 { publication_state: 'PUBLISHED', published_at } | 422 PUBLICATION_GATE_FAILED { fields: [{ field, error_code, message }] }"
        - "POST /api/v1/records/:id/supersede → 200 { publication_state: 'SUPERSEDED' } | 422 INVALID_SUPERSEDES_REF"
        - "POST /api/v1/records/:id/archive → 200 { publication_state: 'ARCHIVED' }"
        - "PATCH /api/v1/records/:id with X-Confirm-Edit: true → 200 InnovationRecord | 409 EDIT_REQUIRES_CONFIRMATION"
      verify: "grep -n 'submit-review\\|publish\\|supersede\\|archive' src/handlers/recordHandler.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/admin/components/PublicationLifecycleControls.tsx"
      exports:
        - "PublicationLifecycleControls({ publicationState, recordId, canSubmitForReview, onTransitionSuccess, onTransitionError })"
      shape: |
        Props:
          publicationState: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED'
          recordId: string
          canSubmitForReview: boolean  // true only when all pub-required fields complete
          onTransitionSuccess: (newState: string, publishedAt?: string) => void
          onTransitionError: (code: string, blockingFields?: string[]) => void
        Renders:
          DRAFT    → [Save Draft] [Submit for Review ▶] (Submit disabled when !canSubmitForReview)
          REVIEW   → [Return to Draft] [Publish ▶]
          PUBLISHED → [Edit (opens ConfirmationDialog)] [Supersede (opens SupersedeDialog)] [Archive (opens ConfirmationDialog)]
          SUPERSEDED → [Archive (opens ConfirmationDialog)]
          ARCHIVED  → (no action buttons; read-only message)
      verify: "grep -n 'PublicationLifecycleControls\\|canSubmitForReview\\|onTransitionSuccess' src/admin/components/PublicationLifecycleControls.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/components/ConfirmationDialog.tsx"
      exports:
        - "ConfirmationDialog({ open, title, body, confirmLabel, onConfirm, onCancel, variant })"
      shape: |
        Reusable modal dialog for:
        1. Edit Published Record: title='Edit Published Record', body='Editing will move this record to Review state and remove it from public view until it is re-published. Are you sure you want to proceed?', confirmLabel='Yes, Edit Record'
        2. Archive: title='Archive Record', body='This record will be removed from default catalog browse.', confirmLabel='Archive Record'
        3. Supersede: specialized variant with linked_record_id input field
        variant: 'default' | 'danger'
      verify: "grep -n 'ConfirmationDialog\\|onConfirm\\|onCancel' src/admin/components/ConfirmationDialog.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/components/GovernanceGateFeedback.tsx"
      exports:
        - "GovernanceGateFeedback({ blockingFields: string[] })"
      shape: |
        Renders when publish returns 422 PUBLICATION_GATE_FAILED:
        ┌────────────────────────────────────────────────┐
        │ ⛔ Cannot publish — missing required fields:   │
        │ • Executive Perspective Text                   │
        │ • Executive Recommendation                     │
        │ • Last-Reviewed Date                           │
        │ Complete all required fields and try again.    │
        └────────────────────────────────────────────────┘
        Maps API field names (e.g. 'executive_perspective_text') to human-readable labels.
        aria-live="polite" so screen readers announce the error.
      verify: "grep -n 'GovernanceGateFeedback\\|blockingFields\\|PUBLICATION_GATE_FAILED' src/admin/components/GovernanceGateFeedback.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/components/MaturityStatusDropdowns.tsx"
      exports:
        - "MaturityLevelDropdown({ value, onChange, publicationState })"
        - "ReviewStatusDropdown({ value, onChange })"
      shape: |
        MaturityLevelDropdown:
          - 5 options: IDEA | EXPERIMENT_POC | PROTOTYPE_PILOT | PRODUCTION_VALIDATED | ARCHIVED
          - Inline definition rendered below dropdown for currently selected value
          - 'View all maturity definitions →' link to /admin/content-model
          - When value === 'ARCHIVED' and publicationState === 'PUBLISHED':
            shows advisory: 'Consider also archiving the publication state to remove this record from the public catalog.'
        ReviewStatusDropdown:
          - 7 options: SUBMITTED | CURATED | TECHNICALLY_REVIEWED | SECURITY_REVIEWED | POLICY_REVIEWED | VALIDATED_FOR_REUSE | SUPERSEDED_RETIRED
          - Inline definition rendered below dropdown for currently selected value
          - 'View all review status definitions →' link to /admin/content-model
      verify: "grep -n 'MaturityLevelDropdown\\|ReviewStatusDropdown\\|EXPERIMENT_POC\\|VALIDATED_FOR_REUSE' src/admin/components/MaturityStatusDropdowns.tsx && echo CONTRACT_OK"
    - artifact: "src/admin/pages/RecordEditPage.tsx"
      exports:
        - "RecordEditPage: React component rendering full admin record edit/create form with lifecycle controls, governance gate feedback, maturity/review dropdowns integrated"
      shape: |
        Route: /admin/records/:id/edit and /admin/records/new
        Integrates:
          PublicationLifecycleControls (top bar, state-aware)
          GovernanceGateFeedback (renders inline when publish fails)
          MaturityLevelDropdown + ReviewStatusDropdown (in Governance & Classification section)
          ConfirmationDialog (for Edit Published, Archive, Supersede)
          PublicationReadinessChecklist (green ✅ / red ❌ per pub-required field)
        Navigation wired: linked from /admin/records list via [Edit] action per UX Navigation Map
      verify: "grep -n 'RecordEditPage\\|PublicationLifecycleControls\\|GovernanceGateFeedback\\|MaturityLevelDropdown' src/admin/pages/RecordEditPage.tsx && echo CONTRACT_OK"
---

<objective>
Build the publication lifecycle controls on RecordEditPage — the state-specific action buttons (Submit for Review, Publish, Supersede, Archive, Edit), confirmation dialogs for irreversible transitions, GovernanceGate error display, and Maturity Level / Review Status dropdowns with inline definitions.

Purpose: Curator Catalina Torres (PER-05) must be able to advance a record through DRAFT→REVIEW→PUBLISHED→SUPERSEDED/ARCHIVED with full governance enforcement surfaced in the UI (US-2.3, US-2.4, US-8.2, US-9.3). The lifecycle controls must map exactly to the state machine in PublicationLifecycleService (05-PLAN.md) and surface GovernanceGateService blocking fields inline when publish fails.

Output:
- `src/admin/components/PublicationLifecycleControls.tsx` — state-driven action button bar
- `src/admin/components/ConfirmationDialog.tsx` — reusable confirmation/warning modal
- `src/admin/components/GovernanceGateFeedback.tsx` — inline blocking-field error display
- `src/admin/components/MaturityStatusDropdowns.tsx` — maturity + review dropdowns with inline definitions
- `src/admin/pages/RecordEditPage.tsx` — full edit page integrating all lifecycle components
- `e2e/admin/record-lifecycle-controls.spec.ts` — Playwright e2e tests
</objective>

<feature_dependencies>
Implements: F8: Curation and Administration — publication lifecycle action controls (Submit for Review, Publish, Supersede, Archive, Edit confirmation) and governance gate error display on RecordEditPage; F9: Content, Maturity & Trust Model — Maturity Level and Review Status dropdowns with inline definitions (US-9.3 AC: definitions shown inline to guide curator selection)
Depends on: F8: PublicationLifecycleService + GovernanceGateService + recordHandler lifecycle endpoints (05-PLAN.md Wave 2); F8: AuthMiddleware + requireCurator (06-PLAN.md Wave 3) — admin page is curator-gated
Enables: None (Wave 7 integration validates these controls end-to-end in seeded app)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/05-PLAN.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/06-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md (Screen 07, State Transition Actions table, Warning Modal, Publication Gate Error State)
@project_specs/UserStories-TSIO-Innovation-Hub.md (US-2.3, US-2.4, US-8.2, US-8.3, US-9.3)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Publication lifecycle controls — PublicationLifecycleControls, ConfirmationDialog, GovernanceGateFeedback, MaturityStatusDropdowns</name>
  <files>
    src/admin/components/PublicationLifecycleControls.tsx
    src/admin/components/ConfirmationDialog.tsx
    src/admin/components/GovernanceGateFeedback.tsx
    src/admin/components/MaturityStatusDropdowns.tsx
  </files>
  <action>
Create `src/admin/components/` directory (mkdir -p) if it does not exist, then implement the four component files below. All components use React + TypeScript. Use Tailwind CSS for styling per project conventions. All interactive elements must be keyboard-accessible and include `aria-*` attributes per WCAG 2.1 AA (federal government requirement per UX Mockup overview).

---

### File 1: `src/admin/components/ConfirmationDialog.tsx`

Reusable modal dialog for irreversible lifecycle transitions. Rendered by `PublicationLifecycleControls` for three scenarios: (1) Edit Published Record, (2) Archive, (3) Supersede (special variant with linked_record_id input).

```tsx
// ConfirmationDialog.tsx
// Reusable confirmation modal for irreversible lifecycle transitions on RecordEditPage.
// UX Mockup Screen 07: Warning Modal — Editing a Published Record + Archive action.
// Accessibility: role="dialog", aria-modal="true", aria-labelledby, focus trap (Tab/Shift+Tab).

import React, { useEffect, useRef, useState } from 'react';

export type ConfirmationDialogVariant = 'default' | 'danger';

interface BaseConfirmationDialogProps {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  onConfirm: (data?: Record<string, string>) => void;
  onCancel: () => void;
}

// Supersede variant requires a linked_record_id input
interface SupersedeDialogProps extends BaseConfirmationDialogProps {
  supersede?: true;
}

export type ConfirmationDialogProps = BaseConfirmationDialogProps | SupersedeDialogProps;

export function ConfirmationDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  ...rest
}: ConfirmationDialogProps) {
  const isSupersedeVariant = 'supersede' in rest && rest.supersede === true;
  const [supersededById, setSupersededById] = useState('');
  const [supersededByError, setSupersededByError] = useState('');
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus first interactive element on open
  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (isSupersedeVariant) {
      if (!supersededById.trim()) {
        setSupersededByError('The ID of the superseding record is required.');
        return;
      }
      onConfirm({ superseded_by_record_id: supersededById.trim() });
    } else {
      onConfirm();
    }
  };

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2
            id="confirmation-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 ml-4"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mb-6 text-sm text-gray-700">
          {/* Warning icon for danger variant or PUBLISHED edit */}
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg" aria-hidden="true">⚠</span>
            <div>{body}</div>
          </div>
        </div>

        {/* Supersede input — only shown when supersede variant */}
        {isSupersedeVariant && (
          <div className="mb-6">
            <label
              htmlFor="superseded-by-record-id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ID of the superseding record <span className="text-red-500">*</span>
            </label>
            <input
              id="superseded-by-record-id"
              type="text"
              value={supersededById}
              onChange={(e) => {
                setSupersededById(e.target.value);
                if (supersededByError) setSupersededByError('');
              }}
              placeholder="e.g. rec_01HZ..."
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                supersededByError ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={supersededByError ? 'supersede-error' : undefined}
            />
            {supersededByError && (
              <p id="supersede-error" className="mt-1 text-xs text-red-600" role="alert">
                {supersededByError}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### File 2: `src/admin/components/GovernanceGateFeedback.tsx`

Inline error list rendered when `POST /api/v1/records/:id/publish` returns `422 PUBLICATION_GATE_FAILED`. Maps API field names (snake_case) to the human-readable labels shown in UX Mockup Screen 07 "Publication Gate Error State".

```tsx
// GovernanceGateFeedback.tsx
// Inline error panel for PUBLICATION_GATE_FAILED responses on RecordEditPage.
// UX Mockup Screen 07 — Publication Gate Error State:
//   ⛔ Cannot publish — missing required fields:
//   • Executive Perspective Text
//   • Last-Reviewed Date
//   Complete all required fields and try again.
// Per US-2.3 AC: "governance gate re-validates all pub-required fields before accepting the transition"
// aria-live="polite" so assistive technology announces errors without disruptive interruption.

import React from 'react';

// Maps GovernanceGateService PUB_REQUIRED_FIELDS field names → human-readable labels
// (from 05-PLAN.md PUB_REQUIRED_FIELDS + FRD F02b)
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  problem_statement: 'Problem Statement',
  what_was_explored: 'What Was Explored',
  outcome_summary: 'Outcome Summary',
  maturity_level: 'Maturity Level',
  review_status: 'Review Status',
  reuse_potential: 'Reuse Potential',
  source_type: 'Source Type',
  owner_name: 'Owner Name',
  owner_office: 'Owner Office',
  contributing_office: 'Contributing Office',
  last_reviewed_date: 'Last-Reviewed Date',
  last_reviewed_date_future: 'Last-Reviewed Date (must not be in the future)',
  executive_perspective_text: 'Executive Perspective Text',
  executive_recommendation: 'Executive Recommendation',
  key_findings: 'Key Findings (at least 1 required)',
  artifact_links: 'Artifact Links (at least 1 required)',
  engagement_options: 'Engagement Options (at least 1 required)',
  mission_area_tags: 'Mission Area Tags (at least 1 required)',
};

interface GovernanceGateFeedbackProps {
  blockingFields: string[];
}

export function GovernanceGateFeedback({ blockingFields }: GovernanceGateFeedbackProps) {
  if (!blockingFields || blockingFields.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mt-4 rounded border border-red-300 bg-red-50 p-4"
      data-testid="governance-gate-feedback"
    >
      <div className="flex items-start gap-2 mb-2">
        <span aria-hidden="true" className="text-red-600 text-lg">⛔</span>
        <p className="text-sm font-semibold text-red-800">
          Cannot publish — missing required fields:
        </p>
      </div>
      <ul className="ml-6 list-disc text-sm text-red-700 space-y-1 mb-2" aria-label="Missing required fields">
        {blockingFields.map((field) => (
          <li key={field}>
            {FIELD_LABELS[field] ?? field}
          </li>
        ))}
      </ul>
      <p className="text-sm text-red-700">Complete all required fields and try again.</p>
    </div>
  );
}
```

---

### File 3: `src/admin/components/MaturityStatusDropdowns.tsx`

Maturity Level and Review Status controlled dropdowns with inline definitions and 'View all definitions →' links. Implements US-9.3 AC: "Maturity level is a required field for publication; curator selects from a dropdown displaying all 5 options with their definitions shown inline." When ARCHIVED maturity is selected on a Published record, shows advisory per US-9.3 AC.

```tsx
// MaturityStatusDropdowns.tsx
// Maturity Level and Review Status dropdowns with inline definitions for RecordEditPage.
// UX Mockup Screen 07 Governance & Classification section:
//   [Experiment / POC ▼]
//   ℹ  Experiment / POC: A targeted exploration was conducted to test feasibility...
//   [View all maturity definitions →]
// Per US-9.3: definitions shown inline to guide consistent curator assignment.
// Per US-9.3 AC: ARCHIVED maturity on Published record → advisory to also archive pub state.
// Hard-coded definitions: a code change is required to update them (per TechArch §5.6 rule 2).

import React from 'react';

// Maturity level definitions from FRD §Shared Terminology + TechArch §4.2 MaturityLevelDefinition
export const MATURITY_DEFINITIONS: Record<string, { label: string; definition: string; colorClass: string }> = {
  IDEA: {
    label: 'Idea',
    definition: 'A concept or hypothesis has been identified and documented; no exploration has been conducted yet.',
    colorClass: 'text-gray-600',
  },
  EXPERIMENT_POC: {
    label: 'Experiment / POC',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
    colorClass: 'text-amber-600',
  },
  PROTOTYPE_PILOT: {
    label: 'Prototype / Pilot',
    definition: 'A working prototype or limited pilot was developed and tested in a representative environment.',
    colorClass: 'text-orange-600',
  },
  PRODUCTION_VALIDATED: {
    label: 'Production / Validated Pattern',
    definition: 'The effort has been deployed in a production environment or validated as a repeatable pattern with demonstrated results.',
    colorClass: 'text-green-700',
  },
  ARCHIVED: {
    label: 'Archived',
    definition: 'The innovation effort is no longer active. Results are preserved for institutional learning.',
    colorClass: 'text-gray-500',
  },
};

// Review status definitions from FRD §Shared Terminology + TechArch §4.2 ReviewStatusDefinition
export const REVIEW_STATUS_DEFINITIONS: Record<string, { label: string; definition: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    definition: 'The record has been submitted for I&R review; curation has not yet begun.',
  },
  CURATED: {
    label: 'Curated',
    definition: 'I&R curator has structured and enriched the record; not yet externally reviewed.',
  },
  TECHNICALLY_REVIEWED: {
    label: 'Technically Reviewed',
    definition: 'An I&R technical reviewer has assessed the technical approach, architecture, and findings.',
  },
  SECURITY_REVIEWED: {
    label: 'Security Reviewed',
    definition: 'A security review has been completed for this record.',
  },
  POLICY_REVIEWED: {
    label: 'Policy Reviewed',
    definition: 'A policy review has been completed for this record.',
  },
  VALIDATED_FOR_REUSE: {
    label: 'Validated for Reuse',
    definition: 'All applicable I&R reviews have been completed. Validated for Reuse does not waive local review before adoption.',
  },
  SUPERSEDED_RETIRED: {
    label: 'Superseded / Retired',
    definition: 'This review status is no longer current; the record has been superseded or retired.',
  },
};

interface MaturityLevelDropdownProps {
  value: string;
  onChange: (value: string) => void;
  publicationState?: string;
  disabled?: boolean;
  error?: string;
}

export function MaturityLevelDropdown({
  value,
  onChange,
  publicationState,
  disabled = false,
  error,
}: MaturityLevelDropdownProps) {
  const selectedDef = value ? MATURITY_DEFINITIONS[value] : null;
  const showArchivedAdvisory =
    value === 'ARCHIVED' && publicationState === 'PUBLISHED';

  return (
    <div className="mb-4">
      <label htmlFor="maturity-level" className="block text-sm font-medium text-gray-700 mb-1">
        Maturity Level <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="maturity-level"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'maturity-error' : 'maturity-definition'}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        <option value="">— Select maturity level —</option>
        {Object.entries(MATURITY_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="maturity-error" className="mt-1 text-xs text-red-600" role="alert">{error}</p>
      )}

      {selectedDef && (
        <div id="maturity-definition" className="mt-1 flex items-start gap-1 text-xs text-gray-600">
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div className="mt-1">
        <a
          href="/admin/content-model"
          className="text-xs text-blue-600 hover:underline"
          aria-label="View all maturity level definitions"
        >
          View all maturity definitions →
        </a>
      </div>

      {/* US-9.3 AC: ARCHIVED maturity on Published record → advisory */}
      {showArchivedAdvisory && (
        <div
          role="note"
          className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800"
          data-testid="archived-maturity-advisory"
        >
          <span aria-hidden="true">ℹ</span>{' '}
          Consider also archiving the publication state to remove this record from the public catalog.
        </div>
      )}
    </div>
  );
}

interface ReviewStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ReviewStatusDropdown({
  value,
  onChange,
  disabled = false,
  error,
}: ReviewStatusDropdownProps) {
  const selectedDef = value ? REVIEW_STATUS_DEFINITIONS[value] : null;

  return (
    <div className="mb-4">
      <label htmlFor="review-status" className="block text-sm font-medium text-gray-700 mb-1">
        Review Status <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="review-status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'review-status-error' : 'review-status-definition'}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        <option value="">— Select review status —</option>
        {Object.entries(REVIEW_STATUS_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="review-status-error" className="mt-1 text-xs text-red-600" role="alert">{error}</p>
      )}

      {selectedDef && (
        <div id="review-status-definition" className="mt-1 flex items-start gap-1 text-xs text-gray-600">
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div className="mt-1">
        <a
          href="/admin/content-model"
          className="text-xs text-blue-600 hover:underline"
          aria-label="View all review status definitions"
        >
          View all review status definitions →
        </a>
      </div>
    </div>
  );
}
```

---

### File 4: `src/admin/components/PublicationLifecycleControls.tsx`

State-driven action buttons that render only the valid transitions for the current `publication_state`. Maps exactly to the VALID_TRANSITIONS in `publicationLifecycleService.js` (05-PLAN.md). Calls lifecycle API endpoints; fires `onTransitionSuccess` or `onTransitionError` callbacks for parent RecordEditPage to handle state refresh and error display.

```tsx
// PublicationLifecycleControls.tsx
// State-aware publication lifecycle action buttons for RecordEditPage.
// UX Mockup Screen 07 — State Transition Actions table:
//   DRAFT    → [Save Draft] [Submit for Review ▶]
//   REVIEW   → [Save Draft] [Publish ▶] [Return to Draft]
//   PUBLISHED → [Edit (confirmation)] [Supersede (dialog)] [Archive (confirmation)]
//   SUPERSEDED → [Archive (confirmation)]
//   ARCHIVED  → (read-only; no actions)
// Per US-2.3: "Submit for Review is disabled until all pub-required fields are complete"
// API endpoints from 05-PLAN.md recordHandler.js integration contract.

import React, { useState } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

export type PublicationState = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';

export interface PublicationLifecycleControlsProps {
  publicationState: PublicationState;
  recordId: string;
  canSubmitForReview: boolean;  // true only when all pub-required fields are complete
  isSaving?: boolean;
  onSaveDraft?: () => Promise<void>;
  onTransitionSuccess: (newState: string, publishedAt?: string) => void;
  onTransitionError: (code: string, blockingFields?: string[]) => void;
}

type DialogType = 'edit-published' | 'archive' | 'supersede' | null;

export function PublicationLifecycleControls({
  publicationState,
  recordId,
  canSubmitForReview,
  isSaving = false,
  onSaveDraft,
  onTransitionSuccess,
  onTransitionError,
}: PublicationLifecycleControlsProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const callTransition = async (
    endpoint: string,
    method: 'POST' | 'PATCH' = 'POST',
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => {
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/v1/records/${recordId}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data?.error?.code ?? 'UNKNOWN_ERROR';
        // Extract blocking_fields from PUBLICATION_GATE_FAILED error envelope (05-PLAN.md §4.1)
        const blockingFields: string[] =
          code === 'PUBLICATION_GATE_FAILED'
            ? (data?.error?.fields ?? []).map((f: { field: string }) => f.field)
            : [];
        onTransitionError(code, blockingFields.length > 0 ? blockingFields : undefined);
      } else {
        onTransitionSuccess(data.publication_state, data.published_at);
      }
    } catch {
      onTransitionError('NETWORK_ERROR');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSubmitForReview = () => callTransition('submit-review');
  const handlePublish = () => callTransition('publish');
  const handleReturnToDraft = () => callTransition('return-to-draft');

  const handleConfirmEditPublished = () => {
    setActiveDialog(null);
    // PATCH with X-Confirm-Edit: true transitions PUBLISHED → REVIEW (05-PLAN.md recordService.updateRecord)
    callTransition('', 'PATCH', {}, { 'X-Confirm-Edit': 'true' });
  };

  const handleConfirmSupersede = (data?: Record<string, string>) => {
    setActiveDialog(null);
    if (data?.superseded_by_record_id) {
      callTransition('supersede', 'POST', {
        superseded_by_record_id: data.superseded_by_record_id,
      });
    }
  };

  const handleConfirmArchive = () => {
    setActiveDialog(null);
    callTransition('archive');
  };

  const disabled = isTransitioning || isSaving;

  return (
    <>
      <div
        className="flex items-center gap-3 flex-wrap"
        aria-label="Publication lifecycle actions"
        data-testid="lifecycle-controls"
        data-publication-state={publicationState}
      >
        {/* ── DRAFT ──────────────────────────────────────── */}
        {publicationState === 'DRAFT' && (
          <>
            {onSaveDraft && (
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={onSaveDraft}
                disabled={disabled}
                aria-label="Save draft"
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmitForReview}
              disabled={disabled || !canSubmitForReview}
              aria-disabled={!canSubmitForReview}
              aria-label={
                canSubmitForReview
                  ? 'Submit for review'
                  : 'Submit for Review — complete all required fields first'
              }
              title={
                !canSubmitForReview
                  ? 'Complete all pub-required fields before submitting for review'
                  : undefined
              }
              data-testid="submit-for-review-btn"
            >
              Submit for Review ▶
            </button>
          </>
        )}

        {/* ── REVIEW ──────────────────────────────────────── */}
        {publicationState === 'REVIEW' && (
          <>
            {onSaveDraft && (
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={onSaveDraft}
                disabled={disabled}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
            )}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={handleReturnToDraft}
              disabled={disabled}
              data-testid="return-to-draft-btn"
            >
              Return to Draft
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handlePublish}
              disabled={disabled}
              data-testid="publish-btn"
            >
              Publish ▶
            </button>
          </>
        )}

        {/* ── PUBLISHED ──────────────────────────────────── */}
        {publicationState === 'PUBLISHED' && (
          <>
            {/* Edit opens warning modal per UX Mockup Screen 07 */}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setActiveDialog('edit-published')}
              disabled={disabled}
              data-testid="edit-published-btn"
            >
              Edit
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-amber-400 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              onClick={() => setActiveDialog('supersede')}
              disabled={disabled}
              data-testid="supersede-btn"
            >
              Supersede
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border border-red-300 rounded bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
              onClick={() => setActiveDialog('archive')}
              disabled={disabled}
              data-testid="archive-btn"
            >
              Archive
            </button>
          </>
        )}

        {/* ── SUPERSEDED ─────────────────────────────────── */}
        {publicationState === 'SUPERSEDED' && (
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium border border-red-300 rounded bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
            onClick={() => setActiveDialog('archive')}
            disabled={disabled}
            data-testid="archive-btn"
          >
            Archive
          </button>
        )}

        {/* ── ARCHIVED ─────────────────────────────────────── */}
        {publicationState === 'ARCHIVED' && (
          <p className="text-sm text-gray-500 italic" data-testid="archived-message">
            This record is archived. No further state changes are available.
          </p>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────── */}

      {/* Edit Published Record — Warning Modal (UX Mockup Screen 07) */}
      <ConfirmationDialog
        open={activeDialog === 'edit-published'}
        title="Edit Published Record"
        body={
          <>
            <p className="mb-2">
              This record is currently Published and visible to all Hub users.
            </p>
            <p>
              Editing will move this record to <strong>Review state</strong> and remove it from
              public view until it is re-published.
            </p>
            <p className="mt-2">Are you sure you want to proceed?</p>
          </>
        }
        confirmLabel="Yes, Edit Record"
        variant="danger"
        onConfirm={handleConfirmEditPublished}
        onCancel={() => setActiveDialog(null)}
      />

      {/* Archive Confirmation */}
      <ConfirmationDialog
        open={activeDialog === 'archive'}
        title="Archive Record"
        body={
          <p>
            This record will be removed from the default catalog browse. It will remain accessible
            via direct URL with an <strong>Archived</strong> label.
          </p>
        }
        confirmLabel="Archive Record"
        variant="danger"
        onConfirm={handleConfirmArchive}
        onCancel={() => setActiveDialog(null)}
      />

      {/* Supersede — requires linked_record_id input (US-2.4 AC) */}
      <ConfirmationDialog
        open={activeDialog === 'supersede'}
        supersede
        title="Supersede Record"
        body={
          <p>
            Marking this record as Superseded indicates it has been replaced by a newer record.
            The superseding record must exist in the system.
          </p>
        }
        confirmLabel="Supersede Record"
        variant="danger"
        onConfirm={handleConfirmSupersede}
        onCancel={() => setActiveDialog(null)}
      />
    </>
  );
}
```
  </action>
  <verify>
ls src/admin/components/PublicationLifecycleControls.tsx src/admin/components/ConfirmationDialog.tsx src/admin/components/GovernanceGateFeedback.tsx src/admin/components/MaturityStatusDropdowns.tsx && echo "ALL_COMPONENT_FILES_EXIST" && grep -n "PublicationLifecycleControls\|canSubmitForReview\|onTransitionSuccess" src/admin/components/PublicationLifecycleControls.tsx && grep -n "ConfirmationDialog\|onConfirm\|onCancel" src/admin/components/ConfirmationDialog.tsx && grep -n "GovernanceGateFeedback\|blockingFields\|PUBLICATION_GATE_FAILED" src/admin/components/GovernanceGateFeedback.tsx && grep -n "MaturityLevelDropdown\|ReviewStatusDropdown\|EXPERIMENT_POC\|VALIDATED_FOR_REUSE" src/admin/components/MaturityStatusDropdowns.tsx && echo CONTRACT_OK
  </verify>
  <done>
- `src/admin/components/ConfirmationDialog.tsx`: exports `ConfirmationDialog` with open/title/body/confirmLabel/onConfirm/onCancel/variant props; supersede variant renders linked_record_id text input with required validation; focus placed on cancel button on open; role="dialog" aria-modal="true" aria-labelledby applied
- `src/admin/components/GovernanceGateFeedback.tsx`: exports `GovernanceGateFeedback({ blockingFields })`; maps all 18+ API field names to human-readable labels from PUB_REQUIRED_FIELDS; renders ⛔ panel with ul list; aria-live="polite"; data-testid="governance-gate-feedback"; returns null when blockingFields is empty
- `src/admin/components/MaturityStatusDropdowns.tsx`: exports `MaturityLevelDropdown` and `ReviewStatusDropdown`; each renders inline definition for currently selected value; 'View all definitions →' link to /admin/content-model; ARCHIVED maturity + PUBLISHED state triggers advisory with data-testid="archived-maturity-advisory"; hard-coded definitions (not runtime-configurable)
- `src/admin/components/PublicationLifecycleControls.tsx`: exports `PublicationLifecycleControls`; renders exactly correct action set per publication_state (DRAFT: Submit for Review (disabled when !canSubmitForReview) + Save Draft; REVIEW: Return to Draft + Publish + Save Draft; PUBLISHED: Edit + Supersede + Archive; SUPERSEDED: Archive only; ARCHIVED: read-only message); each button has data-testid; calls correct API endpoints from 05-PLAN.md; fires onTransitionSuccess with newState + publishedAt or onTransitionError with PUBLICATION_GATE_FAILED + blockingFields
  </done>
</task>

<task type="auto">
  <name>Task 2: RecordEditPage integration + Playwright e2e lifecycle tests</name>
  <files>
    src/admin/pages/RecordEditPage.tsx
    e2e/admin/record-lifecycle-controls.spec.ts
  </files>
  <action>
Create `src/admin/pages/` directory (mkdir -p) if it does not exist. Create `e2e/admin/` directory if it does not exist.

---

### File 1: `src/admin/pages/RecordEditPage.tsx`

Integrates all lifecycle components built in Task 1 into a full admin record edit/create page. Matches UX Mockup Screen 07 exactly — including the Publication Readiness Checklist, sticky action bar, and all form sections. Wired into admin navigation per the UX Navigation Map (reached from `/admin/records` list via [Edit] action).

Key behaviors:
- Loads record via `GET /api/v1/records/:id` (with curator session, returns all states)
- `canSubmitForReview` is computed client-side from form state against the same PUB_REQUIRED_FIELDS list as GovernanceGateService — so Submit for Review button enables as fields are filled
- When `onTransitionSuccess` fires, updates local `publicationState` state and re-fetches record
- When `onTransitionError('PUBLICATION_GATE_FAILED', blockingFields)` fires, renders `<GovernanceGateFeedback blockingFields={blockingFields} />` inline above action bar
- PUBLISHED state: all form fields are `disabled`; Edit button opens the ConfirmationDialog (handled by PublicationLifecycleControls)
- ARCHIVED state: all form fields are `disabled`; no state-change actions available

```tsx
// RecordEditPage.tsx
// Admin Innovation Record create/edit page with full lifecycle controls.
// Routes: /admin/records/new (create) and /admin/records/:id/edit (edit)
// UX Mockup Screen 07: Full form with Publication Readiness Checklist, lifecycle action bar.
// Navigation: reached from /admin/records via [Edit] action per UX Navigation Map.

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import {
  PublicationLifecycleControls,
  PublicationState,
} from '../components/PublicationLifecycleControls';
import { GovernanceGateFeedback } from '../components/GovernanceGateFeedback';
import { MaturityLevelDropdown, ReviewStatusDropdown } from '../components/MaturityStatusDropdowns';

// Pub-required scalar fields from GovernanceGateService PUB_REQUIRED_FIELDS (05-PLAN.md)
const PUB_REQUIRED_SCALAR_FIELDS = [
  'title', 'problem_statement', 'what_was_explored', 'outcome_summary',
  'maturity_level', 'review_status', 'reuse_potential', 'source_type',
  'owner_name', 'owner_office', 'contributing_office', 'last_reviewed_date',
  'executive_perspective_text', 'executive_recommendation',
] as const;

// Pub-required array fields (min 1 each)
const PUB_REQUIRED_ARRAY_FIELDS = [
  'key_findings', 'artifact_links', 'engagement_options', 'mission_area_tags',
] as const;

// Human-readable labels for Publication Readiness Checklist (UX Mockup Screen 07)
const CHECKLIST_LABELS: Record<string, string> = {
  title: 'Title',
  problem_statement: 'Problem Statement',
  what_was_explored: 'What Was Explored',
  outcome_summary: 'Outcome Summary',
  maturity_level: 'Maturity Level',
  review_status: 'Review Status',
  reuse_potential: 'Reuse Potential',
  source_type: 'Source Type',
  owner_name: 'Owner Name',
  owner_office: 'Owner Office',
  contributing_office: 'Contributing Office',
  last_reviewed_date: 'Last-Reviewed Date',
  executive_perspective_text: 'Executive Perspective Text',
  executive_recommendation: 'Executive Recommendation',
  key_findings: 'Key Findings (1+)',
  artifact_links: 'Artifact Links (1+)',
  engagement_options: 'Engagement Options (1+)',
  mission_area_tags: 'Mission Area Tags (1+)',
};

// Derives completion status for each pub-required field from current form state
function computeReadinessChecklist(form: Record<string, unknown>): Record<string, boolean> {
  const checklist: Record<string, boolean> = {};
  for (const field of PUB_REQUIRED_SCALAR_FIELDS) {
    const val = form[field];
    checklist[field] =
      typeof val === 'string' ? val.trim().length > 0 : Boolean(val);
  }
  for (const field of PUB_REQUIRED_ARRAY_FIELDS) {
    const arr = form[field];
    checklist[field] = Array.isArray(arr) && arr.length > 0;
  }
  return checklist;
}

export function RecordEditPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [publicationState, setPublicationState] = useState<PublicationState>('DRAFT');
  const [blockingFields, setBlockingFields] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');

  // Load existing record
  useEffect(() => {
    if (isNew) return;
    setIsLoading(true);
    fetch(`/api/v1/records/${id}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error.message);
        setRecord(data);
        setForm(data);
        setPublicationState(data.publication_state as PublicationState);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setIsLoading(false));
  }, [id, isNew]);

  const readinessChecklist = computeReadinessChecklist(form);
  const incompleteCount = Object.values(readinessChecklist).filter((v) => !v).length;
  const canSubmitForReview = incompleteCount === 0;

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear governance gate error when user starts fixing fields
      if (blockingFields.includes(field)) {
        setBlockingFields((prev) => prev.filter((f) => f !== field));
      }
    },
    [blockingFields],
  );

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const url = isNew ? '/api/v1/records' : `/api/v1/records/${id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error?.message ?? 'Save failed.');
      } else {
        setRecord(data);
        setForm(data);
        setPublicationState(data.publication_state as PublicationState);
        if (isNew && data.record_id) {
          navigate(`/admin/records/${data.record_id}/edit`, { replace: true });
        }
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransitionSuccess = (newState: string, publishedAt?: string) => {
    setPublicationState(newState as PublicationState);
    setBlockingFields([]);
    setForm((prev) => ({
      ...prev,
      publication_state: newState,
      ...(publishedAt ? { published_at: publishedAt } : {}),
    }));
  };

  const handleTransitionError = (code: string, fields?: string[]) => {
    if (code === 'PUBLICATION_GATE_FAILED' && fields) {
      setBlockingFields(fields);
    } else if (code === 'INVALID_SUPERSEDES_REF') {
      setSaveError('The superseding record ID does not exist.');
    } else {
      setSaveError(`Transition failed: ${code}`);
    }
  };

  const isReadOnly = publicationState === 'PUBLISHED' || publicationState === 'ARCHIVED';

  if (isLoading) {
    return (
      <main aria-busy="true" aria-label="Loading record…">
        <div className="animate-pulse space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="p-6">
        <p role="alert" className="text-red-600">{loadError}</p>
        <Link to="/admin/records" className="text-blue-600 underline mt-2 inline-block">
          ← All Records
        </Link>
      </main>
    );
  }

  return (
    <main>
      {/* Navigation breadcrumb — wires page into admin nav per UX Navigation Map */}
      <nav aria-label="Breadcrumb" className="px-6 pt-4">
        <Link to="/admin/records" className="text-sm text-blue-600 hover:underline">
          ← All Records
        </Link>
      </nav>

      <div className="px-6 pb-8 max-w-4xl">
        {/* Record title and state bar */}
        <div className="flex items-center justify-between mt-4 mb-4 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900">
            {(form.title as string) || (isNew ? 'New Innovation Record' : 'Innovation Record')}
          </h1>
          <span
            className="text-xs font-semibold px-2 py-1 rounded uppercase"
            data-testid="publication-state-badge"
            style={{ backgroundColor:
              publicationState === 'DRAFT' ? '#E5E7EB' :
              publicationState === 'REVIEW' ? '#DBEAFE' :
              publicationState === 'PUBLISHED' ? '#DCFCE7' :
              publicationState === 'SUPERSEDED' ? '#FEF3C7' : '#D1D5DB',
            }}
          >
            {publicationState === 'REVIEW' ? 'IN REVIEW' : publicationState}
          </span>
        </div>

        {/* Publication Readiness Checklist — UX Mockup Screen 07 */}
        <section
          aria-label="Publication Readiness Checklist"
          className="rounded border border-gray-200 bg-gray-50 p-4 mb-6"
          data-testid="readiness-checklist"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Publication Readiness Checklist
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {[...PUB_REQUIRED_SCALAR_FIELDS, ...PUB_REQUIRED_ARRAY_FIELDS].map((field) => (
              <li key={field} className="flex items-center gap-1">
                <span aria-hidden="true">{readinessChecklist[field] ? '✅' : '❌'}</span>
                <span className={readinessChecklist[field] ? 'text-gray-700' : 'text-red-700 font-medium'}>
                  {CHECKLIST_LABELS[field] ?? field}
                </span>
              </li>
            ))}
          </ul>
          {incompleteCount > 0 && (
            <p className="mt-2 text-xs text-red-600" aria-live="polite">
              {incompleteCount} field{incompleteCount !== 1 ? 's' : ''} required before publishing
            </p>
          )}
        </section>

        {/* Lifecycle action controls — top of form per UX Mockup Screen 07 sticky bar */}
        {!isNew && id && (
          <div className="mb-4" data-testid="lifecycle-controls-wrapper">
            <PublicationLifecycleControls
              publicationState={publicationState}
              recordId={id}
              canSubmitForReview={canSubmitForReview}
              isSaving={isSaving}
              onSaveDraft={handleSaveDraft}
              onTransitionSuccess={handleTransitionSuccess}
              onTransitionError={handleTransitionError}
            />
          </div>
        )}

        {/* Governance gate feedback — inline, above form, per UX Mockup Screen 07 */}
        <GovernanceGateFeedback blockingFields={blockingFields} />

        {saveError && (
          <div role="alert" className="mt-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700" data-testid="save-error">
            {saveError}
          </div>
        )}

        {/* ── BASIC INFORMATION ─────────────────────────────── */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Basic Information
          </h2>

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={(form.title as string) ?? ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              disabled={isReadOnly}
              maxLength={200}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              aria-required="true"
              data-testid="field-title"
            />
            <p className="mt-0.5 text-xs text-gray-500">5–200 characters</p>
          </div>

          <div className="mb-4">
            <label htmlFor="short-summary" className="block text-sm font-medium text-gray-700 mb-1">
              Short Summary
            </label>
            <input
              id="short-summary"
              type="text"
              value={(form.short_summary as string) ?? ''}
              onChange={(e) => handleFieldChange('short_summary', e.target.value)}
              disabled={isReadOnly}
              maxLength={280}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              data-testid="field-short-summary"
            />
            <p className="mt-0.5 text-xs text-gray-500">Displayed on catalog cards (max 280 chars)</p>
          </div>
        </section>

        {/* ── GOVERNANCE & CLASSIFICATION ──────────────────── */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Governance &amp; Classification
          </h2>

          {/* MaturityLevelDropdown with inline definitions — US-9.3 */}
          <MaturityLevelDropdown
            value={(form.maturity_level as string) ?? ''}
            onChange={(v) => handleFieldChange('maturity_level', v)}
            publicationState={publicationState}
            disabled={isReadOnly}
            error={
              blockingFields.includes('maturity_level')
                ? 'Maturity level is required before publishing.'
                : undefined
            }
          />

          {/* ReviewStatusDropdown with inline definitions — US-9.3 */}
          <ReviewStatusDropdown
            value={(form.review_status as string) ?? ''}
            onChange={(v) => handleFieldChange('review_status', v)}
            disabled={isReadOnly}
            error={
              blockingFields.includes('review_status')
                ? 'Review status is required before publishing.'
                : undefined
            }
          />

          <div className="mb-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-1">
                Reuse Potential <span className="text-red-500" aria-hidden="true">*</span>
              </legend>
              {['HIGH', 'MEDIUM', 'LOW'].map((val) => (
                <label key={val} className="inline-flex items-center mr-4 text-sm">
                  <input
                    type="radio"
                    name="reuse_potential"
                    value={val}
                    checked={form.reuse_potential === val}
                    onChange={() => handleFieldChange('reuse_potential', val)}
                    disabled={isReadOnly}
                    className="mr-1"
                  />
                  {val.charAt(0) + val.slice(1).toLowerCase()}
                </label>
              ))}
            </fieldset>
          </div>

          <div className="mb-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-1">
                Source Type <span className="text-red-500" aria-hidden="true">*</span>
              </legend>
              {[
                { value: 'IR_CONDUCTED', label: 'I&R-Conducted' },
                { value: 'COMMUNITY', label: 'Community-Contributed' },
              ].map(({ value: val, label }) => (
                <label key={val} className="inline-flex items-center mr-4 text-sm">
                  <input
                    type="radio"
                    name="source_type"
                    value={val}
                    checked={form.source_type === val}
                    onChange={() => handleFieldChange('source_type', val)}
                    disabled={isReadOnly}
                    className="mr-1"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>
        </section>

        {/* New record Save button (create flow only) */}
        {isNew && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              data-testid="create-record-btn"
            >
              {isSaving ? 'Creating…' : 'Create Record'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

---

### File 2: `e2e/admin/record-lifecycle-controls.spec.ts`

Playwright e2e tests for all lifecycle control interactions on RecordEditPage. Tests mock the API (using `page.route()`) so they run without a live backend. Each test verifies a specific UI behavior as specified in UX Mockup Screen 07 and UserStories US-2.3, US-2.4, US-8.2, US-9.3.

```typescript
// e2e/admin/record-lifecycle-controls.spec.ts
// Playwright e2e tests for publication lifecycle controls on RecordEditPage.
// UX Mockup Screen 07 — State Transition Actions table, Warning Modal, Publication Gate Error.
// US-2.3: Submit for Review, Publish with governance gate.
// US-2.4: Supersede (requires linked ID), Archive (confirmation dialog).
// US-9.3: Maturity + review status dropdowns show inline definitions; ARCHIVED advisory.
// Tests use page.route() to mock API — no live backend required.

import { test, expect } from '@playwright/test';

const ADMIN_RECORD_EDIT_URL = '/admin/records/rec_test_001/edit';
const ADMIN_RECORD_NEW_URL = '/admin/records/new';

// Mock record fixtures by publication state
function mockRecord(overrides: Record<string, unknown> = {}) {
  return {
    record_id: 'rec_test_001',
    title: 'Audio Security POC',
    problem_statement: 'Courts need audio separation.',
    what_was_explored: 'GPU/CPU separation tested.',
    outcome_summary: 'Partial feasibility demonstrated.',
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'MEDIUM',
    source_type: 'IR_CONDUCTED',
    owner_name: 'I&R Branch',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
    last_reviewed_date: '2026-07-29',
    executive_perspective_text: 'GPU separation is promising.',
    executive_recommendation: 'Not production-ready yet.',
    key_findings: ['GPU/CPU separation is viable'],
    artifact_links: [{ link_id: 'lnk_01', label: 'Lessons-Learned', url: 'https://ao.sharepoint.com/doc', artifact_type: 'DOCUMENT', display_order: 1 }],
    engagement_options: ['REQUEST_DEMO'],
    mission_area_tags: ['Cybersecurity'],
    technology_area_tags: [],
    trust_disclaimers: [],
    publication_state: 'DRAFT',
    published_at: null,
    created_at: '2026-07-28T00:00:00Z',
    updated_at: '2026-07-28T00:00:00Z',
    ...overrides,
  };
}

test.describe('DRAFT state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'DRAFT' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('renders Submit for Review button and Save Draft button', async ({ page }) => {
    await expect(page.getByTestId('submit-for-review-btn')).toBeVisible();
    await expect(page.getByTestId('lifecycle-controls')).toHaveAttribute('data-publication-state', 'DRAFT');
  });

  test('Submit for Review is enabled when all pub-required fields are complete', async ({ page }) => {
    // All pub-required fields are set in the mock record
    await expect(page.getByTestId('submit-for-review-btn')).toBeEnabled();
  });

  test('Submit for Review calls submit-review API and updates state badge to IN REVIEW', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/submit-review', (route) =>
      route.fulfill({ status: 200, json: { record_id: 'rec_test_001', publication_state: 'REVIEW' } })
    );
    await page.getByTestId('submit-for-review-btn').click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });
});

test.describe('REVIEW state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'REVIEW' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('renders Publish and Return to Draft buttons', async ({ page }) => {
    await expect(page.getByTestId('publish-btn')).toBeVisible();
    await expect(page.getByTestId('return-to-draft-btn')).toBeVisible();
  });

  test('Publish success updates state badge to PUBLISHED', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', (route) =>
      route.fulfill({
        status: 200,
        json: { record_id: 'rec_test_001', publication_state: 'PUBLISHED', published_at: '2026-07-30T10:00:00Z' },
      })
    );
    await page.getByTestId('publish-btn').click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('PUBLISHED');
  });

  test('Publish 422 PUBLICATION_GATE_FAILED renders GovernanceGateFeedback with blocking fields', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/publish', (route) =>
      route.fulfill({
        status: 422,
        json: {
          error: {
            code: 'PUBLICATION_GATE_FAILED',
            message: 'Missing required fields',
            fields: [
              { field: 'executive_perspective_text', error_code: 'REQUIRED', message: 'Required' },
              { field: 'last_reviewed_date', error_code: 'REQUIRED', message: 'Required' },
            ],
          },
        },
      })
    );
    await page.getByTestId('publish-btn').click();
    // GovernanceGateFeedback panel visible
    await expect(page.getByTestId('governance-gate-feedback')).toBeVisible();
    // Human-readable labels present
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Executive Perspective Text');
    await expect(page.getByTestId('governance-gate-feedback')).toContainText('Last-Reviewed Date');
    // State badge NOT changed to PUBLISHED
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });
});

test.describe('PUBLISHED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'PUBLISHED', published_at: '2026-07-29T00:00:00Z' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('renders Edit, Supersede, Archive buttons; no Submit for Review', async ({ page }) => {
    await expect(page.getByTestId('edit-published-btn')).toBeVisible();
    await expect(page.getByTestId('supersede-btn')).toBeVisible();
    await expect(page.getByTestId('archive-btn')).toBeVisible();
    await expect(page.getByTestId('submit-for-review-btn')).not.toBeVisible();
  });

  test('Edit opens warning modal with correct message', async ({ page }) => {
    await page.getByTestId('edit-published-btn').click();
    // Dialog visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Edit Published Record');
    await expect(page.getByRole('dialog')).toContainText('move this record to Review state');
    await expect(page.getByRole('dialog')).toContainText('remove it from public view');
  });

  test('Confirming Edit Published calls PATCH with X-Confirm-Edit header and transitions to REVIEW', async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};
    await page.route('/api/v1/records/rec_test_001', (route, request) => {
      if (request.method() === 'PATCH') {
        capturedHeaders = request.headers();
        return route.fulfill({
          status: 200,
          json: { ...mockRecord({ publication_state: 'REVIEW' }) },
        });
      }
      return route.fulfill({ status: 200, json: mockRecord({ publication_state: 'PUBLISHED' }) });
    });
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Yes, Edit Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('IN REVIEW');
  });

  test('Cancelling Edit Published dialog keeps state PUBLISHED', async ({ page }) => {
    await page.getByTestId('edit-published-btn').click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('PUBLISHED');
  });

  test('Archive shows confirmation dialog; confirming calls archive endpoint', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/archive', (route) =>
      route.fulfill({ status: 200, json: { record_id: 'rec_test_001', publication_state: 'ARCHIVED' } })
    );
    await page.getByTestId('archive-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Archive Record');
    await expect(page.getByRole('dialog')).toContainText('removed from the default catalog browse');
    await page.getByRole('button', { name: 'Archive Record' }).click();
    await expect(page.getByTestId('publication-state-badge')).toHaveText('ARCHIVED');
  });

  test('Supersede dialog requires linked_record_id; invalid ID shows error from API', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001/supersede', (route) =>
      route.fulfill({
        status: 422,
        json: { error: { code: 'INVALID_SUPERSEDES_REF', message: 'The superseding record ID does not exist.' } },
      })
    );
    await page.getByTestId('supersede-btn').click();
    await expect(page.getByRole('dialog')).toContainText('Supersede Record');
    // Confirm without entering ID — should show inline validation
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    await expect(page.getByRole('dialog')).toContainText('required');
    // Enter an ID and submit — API returns 422
    await page.getByLabel('ID of the superseding record').fill('rec_nonexistent');
    await page.getByRole('button', { name: 'Supersede Record' }).click();
    // Dialog closes, error rendered in form (via onTransitionError → saveError)
    await expect(page.getByTestId('save-error')).toContainText('superseding record ID does not exist');
  });
});

test.describe('SUPERSEDED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'SUPERSEDED' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('only Archive button visible; no Edit, Publish, or Supersede', async ({ page }) => {
    await expect(page.getByTestId('archive-btn')).toBeVisible();
    await expect(page.getByTestId('edit-published-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
    await expect(page.getByTestId('supersede-btn')).not.toBeVisible();
  });
});

test.describe('ARCHIVED state — lifecycle controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'ARCHIVED' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('shows read-only message; no action buttons', async ({ page }) => {
    await expect(page.getByTestId('archived-message')).toBeVisible();
    await expect(page.getByTestId('archive-btn')).not.toBeVisible();
    await expect(page.getByTestId('publish-btn')).not.toBeVisible();
  });
});

test.describe('Maturity and Review Status dropdowns — inline definitions (US-9.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({ status: 200, json: mockRecord({ publication_state: 'DRAFT' }) })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
  });

  test('Maturity Level dropdown shows inline definition for selected value', async ({ page }) => {
    // EXPERIMENT_POC is the mock default
    await expect(page.getByText('Experiment / POC:')).toBeVisible();
    await expect(page.getByText('targeted exploration was conducted')).toBeVisible();
  });

  test('Maturity Level dropdown shows View all maturity definitions link', async ({ page }) => {
    const link = page.getByRole('link', { name: /view all maturity definitions/i });
    await expect(link).toHaveAttribute('href', '/admin/content-model');
  });

  test('Review Status dropdown shows inline definition for selected value', async ({ page }) => {
    // CURATED is the mock default
    await expect(page.getByText('Curated:')).toBeVisible();
  });

  test('Review Status dropdown shows View all review status definitions link', async ({ page }) => {
    const link = page.getByRole('link', { name: /view all review status definitions/i });
    await expect(link).toHaveAttribute('href', '/admin/content-model');
  });

  test('ARCHIVED maturity on PUBLISHED record shows advisory', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        json: mockRecord({ publication_state: 'PUBLISHED', maturity_level: 'ARCHIVED' }),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    await expect(page.getByTestId('archived-maturity-advisory')).toBeVisible();
    await expect(page.getByTestId('archived-maturity-advisory')).toContainText(
      'Consider also archiving the publication state'
    );
  });
});

test.describe('Publication Readiness Checklist — DRAFT state', () => {
  test('Submit for Review disabled when pub-required field missing', async ({ page }) => {
    // Record with missing executive_perspective_text
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        json: mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' }),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    // Submit for Review should be disabled
    await expect(page.getByTestId('submit-for-review-btn')).toBeDisabled();
    // Checklist shows ❌ for executive_perspective_text
    await expect(page.getByTestId('readiness-checklist')).toContainText('Executive Perspective Text');
  });

  test('Checklist count updates as required fields are filled', async ({ page }) => {
    await page.route('/api/v1/records/rec_test_001', (route) =>
      route.fulfill({
        status: 200,
        json: mockRecord({ publication_state: 'DRAFT', executive_perspective_text: '' }),
      })
    );
    await page.goto(ADMIN_RECORD_EDIT_URL);
    // Initially 1 field missing
    await expect(page.getByTestId('readiness-checklist')).toContainText('1 field required before publishing');
  });
});
```
  </action>
  <verify>
ls src/admin/pages/RecordEditPage.tsx e2e/admin/record-lifecycle-controls.spec.ts && echo "FILES_EXIST" && grep -n "RecordEditPage\|PublicationLifecycleControls\|GovernanceGateFeedback\|MaturityLevelDropdown" src/admin/pages/RecordEditPage.tsx && grep -n "admin/records" src/admin/pages/RecordEditPage.tsx && echo "NAVIGATION_WIRED_OK" && npx playwright test e2e/admin/record-lifecycle-controls.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
  </verify>
  <done>
- `src/admin/pages/RecordEditPage.tsx` renders with breadcrumb navigation to `/admin/records` (wired per UX Navigation Map — no orphan pages)
- `RecordEditPage` integrates `PublicationLifecycleControls`, `GovernanceGateFeedback`, `MaturityLevelDropdown`, `ReviewStatusDropdown`
- `canSubmitForReview` computed from 18 pub-required fields (14 scalar + 4 array); Submit for Review disabled when any are empty
- Publication Readiness Checklist renders ✅/❌ per field with count "N fields required before publishing"
- PUBLISHED and ARCHIVED states set `isReadOnly = true`; all form fields rendered with `disabled`
- `onTransitionError('PUBLICATION_GATE_FAILED', fields)` renders `<GovernanceGateFeedback blockingFields={fields} />`
- `onTransitionError('INVALID_SUPERSEDES_REF', ...)` renders error: "The superseding record ID does not exist." (US-2.4 AC)
- `e2e/admin/record-lifecycle-controls.spec.ts` tests all 5 publication states; all confirmation dialogs; GovernanceGateFeedback on 422; maturity/review inline definitions; ARCHIVED advisory; Submit for Review disabled when incomplete
- `npx playwright test e2e/admin/record-lifecycle-controls.spec.ts` exits 0 with 0 failing tests
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API (lifecycle transitions) | Curator-controlled transition requests (submit-review, publish, supersede, archive) crossing from the browser into the lifecycle API endpoints |
| client→API (PATCH edit-published) | X-Confirm-Edit header and PATCH body from curator browser crossing into recordHandler.updateRecord |
| API→render (GovernanceGateFeedback) | blocking_fields array from 422 PUBLICATION_GATE_FAILED server response crossing into DOM rendering |
| curator→supersede-linked-ID | Curator-entered superseded_by_record_id crossing from dialog input into POST /api/v1/records/:id/supersede request body |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-15-01 | Elevation of Privilege | Lifecycle transition buttons — client-side canSubmitForReview gating | accept | `canSubmitForReview` is a UI convenience that disables the Submit for Review button client-side. The governance gate is always enforced server-side in `GovernanceGateService.validate()` called from `recordService.publishRecord()` (05-PLAN.md T-05-05). Client-side disable is UX only — never a security boundary. Residual risk: minimal; the API gate cannot be bypassed regardless of UI state. Risk owned by RecordService / GovernanceGateService layer. |
| T-15-02 | Tampering | GovernanceGateFeedback — XSS via blocking_fields values from API response | mitigate | `GovernanceGateFeedback` renders each `blockingFields[i]` through `FIELD_LABELS[field] ?? field`. The `FIELD_LABELS` object maps only known field names to safe hard-coded strings. Unknown field names fall through to `field` (the raw API key, which is a known enum string from GovernanceGateService — not user-authored content). React's JSX escapes all string output — no dangerouslySetInnerHTML used. |
| T-15-03 | Tampering | ConfirmationDialog supersede input — free-text superseded_by_record_id | mitigate | The `superseded_by_record_id` value from the ConfirmationDialog is passed as the `superseded_by_record_id` field in the POST body to `/api/v1/records/:id/supersede`. `recordHandler.js` passes it to `recordService.supersedeRecord()` which calls `innovationRecordRepository.findById(supersededByRecordId)` — a parameterized query. No string interpolation. Server returns 422 `INVALID_SUPERSEDES_REF` if the ID does not match any record. |
| T-15-04 | Repudiation | Lifecycle transitions fired without confirming identity | mitigate | All lifecycle transition endpoints require `requireCurator` middleware (06-PLAN.md). The `changed_by_user_id` in every resulting `auditService.logEvent()` call comes from `req.session.user.user_id` — not from the request body. Frontend transition calls use `credentials: 'same-origin'` to send the session cookie. |
| T-15-05 | Information Disclosure | RecordEditPage fetches draft/review/archived records (non-PUBLIC states) | mitigate | `GET /api/v1/records/:id` in `recordService.getRecord()` returns non-PUBLISHED records only to CURATOR role (05-PLAN.md T-05-01). RecordEditPage calls the endpoint with `credentials: 'same-origin'` — the session cookie carries curator role. If the session is missing or expired, the API returns 401 and RecordEditPage shows a load error (redirected to OIDC login by `authenticateOidc` middleware). |
| T-15-06 | Denial of Service | GovernanceGateFeedback rendering large blocking_fields array | accept | blocking_fields is bounded by PUB_REQUIRED_FIELDS (18 items max). A 422 response with 18 items renders at most 18 `<li>` elements — negligible DOM impact. No unbounded list risk. Residual risk: none meaningful. |
</threat_model>

<verification>
After both tasks complete:

1. Verify all component files exist:
   ```bash
   ls src/admin/components/PublicationLifecycleControls.tsx \
      src/admin/components/ConfirmationDialog.tsx \
      src/admin/components/GovernanceGateFeedback.tsx \
      src/admin/components/MaturityStatusDropdowns.tsx \
      src/admin/pages/RecordEditPage.tsx \
      e2e/admin/record-lifecycle-controls.spec.ts && echo "ALL_FILES_EXIST"
   ```

2. Verify lifecycle controls render correct state set:
   ```bash
   grep -c "data-testid=\"submit-for-review-btn\"\|data-testid=\"publish-btn\"\|data-testid=\"archive-btn\"\|data-testid=\"supersede-btn\"\|data-testid=\"edit-published-btn\"" src/admin/components/PublicationLifecycleControls.tsx && echo "ALL_STATE_BUTTONS_PRESENT"
   ```

3. Verify GovernanceGateFeedback maps PUB_REQUIRED_FIELDS:
   ```bash
   grep -c "executive_perspective_text\|last_reviewed_date\|mission_area_tags\|artifact_links" src/admin/components/GovernanceGateFeedback.tsx && echo "FIELD_LABELS_OK"
   ```

4. Verify MaturityStatusDropdowns have inline definitions for all 5 maturity levels + 7 review statuses:
   ```bash
   grep -c "EXPERIMENT_POC\|PROTOTYPE_PILOT\|PRODUCTION_VALIDATED\|VALIDATED_FOR_REUSE\|SUPERSEDED_RETIRED" src/admin/components/MaturityStatusDropdowns.tsx && echo "DEFINITIONS_OK"
   ```

5. Verify RecordEditPage integrates all components + navigation wiring:
   ```bash
   grep -n "PublicationLifecycleControls\|GovernanceGateFeedback\|MaturityLevelDropdown\|ReviewStatusDropdown\|admin/records" src/admin/pages/RecordEditPage.tsx && echo "INTEGRATION_OK"
   ```

6. Verify integration contracts provided:
   ```bash
   grep -n "PublicationLifecycleControls\|canSubmitForReview\|onTransitionSuccess" src/admin/components/PublicationLifecycleControls.tsx && echo CONTRACT_OK
   grep -n "GovernanceGateFeedback\|blockingFields\|PUBLICATION_GATE_FAILED" src/admin/components/GovernanceGateFeedback.tsx && echo CONTRACT_OK
   grep -n "MaturityLevelDropdown\|ReviewStatusDropdown\|EXPERIMENT_POC\|VALIDATED_FOR_REUSE" src/admin/components/MaturityStatusDropdowns.tsx && echo CONTRACT_OK
   grep -n "ConfirmationDialog\|onConfirm\|onCancel" src/admin/components/ConfirmationDialog.tsx && echo CONTRACT_OK
   ```

7. Run Playwright tests:
   ```bash
   npx playwright test e2e/admin/record-lifecycle-controls.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
   ```
</verification>

<success_criteria>
- `PublicationLifecycleControls` renders exactly the correct action set for each of 5 publication states; Submit for Review is disabled when pub-required fields incomplete; all lifecycle transition API calls include session cookie via `credentials: 'same-origin'`
- `ConfirmationDialog` opens for Edit Published (UX mockup warning modal text exact), Archive (catalog browse removal message), and Supersede (linked_record_id input with required validation); Cancel key (`Escape` / Cancel button) dismisses without action
- `GovernanceGateFeedback` renders ⛔ panel with human-readable field names from blocking_fields on 422 PUBLICATION_GATE_FAILED; aria-live="polite"; does not render when blockingFields is empty
- `MaturityLevelDropdown` + `ReviewStatusDropdown` each show inline definition for currently selected value; 'View all definitions →' links point to /admin/content-model; ARCHIVED maturity on Published record triggers advisory data-testid="archived-maturity-advisory"
- `RecordEditPage` wired into admin nav via breadcrumb link to `/admin/records` (no orphan page); PUBLISHED and ARCHIVED states disable all form fields; GovernanceGateFeedback renders inline on transition error; Publication Readiness Checklist shows ✅/❌ per pub-required field with incomplete count
- All Playwright tests in `e2e/admin/record-lifecycle-controls.spec.ts` pass: DRAFT → REVIEW transition, REVIEW → PUBLISHED success and 422 gate failure with correct field labels, Edit Published warning modal + confirm + cancel, Archive + Supersede dialogs, SUPERSEDED/ARCHIVED-state-only controls, maturity/review inline definitions, ARCHIVED advisory, Submit for Review disabled when incomplete
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/15-SUMMARY.md` with:
- Tasks completed
- Files created
- Key design decisions (canSubmitForReview computed client-side from 18 pub-required fields; GovernanceGateFeedback FIELD_LABELS map; ConfirmationDialog reused for Edit/Archive/Supersede with supersede variant; ARCHIVED maturity advisory per US-9.3 AC)
- Integration contracts provided to Wave 7
- Any deviations from UX Mockup noted (none expected)
</output>
