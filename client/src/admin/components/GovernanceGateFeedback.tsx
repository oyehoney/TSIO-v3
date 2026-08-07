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
