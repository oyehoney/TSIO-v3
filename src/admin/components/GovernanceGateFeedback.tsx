/**
 * GovernanceGateFeedback.tsx
 *
 * Inline error panel rendered when POST /api/v1/records/:id/publish returns
 * 422 PUBLICATION_GATE_FAILED. Maps API field names (snake_case) to
 * human-readable labels for Curator Catalina Torres (PER-05).
 *
 * UX Mockup Screen 07 — Publication Gate Error State:
 *   ⛔ Cannot publish — missing required fields:
 *   • Executive Perspective Text
 *   • Last-Reviewed Date
 *   Complete all required fields and try again.
 *
 * Per US-2.3 AC: "governance gate re-validates all pub-required fields before
 * accepting the transition"
 *
 * aria-live="polite" so assistive technology announces errors without
 * disruptive interruption (WCAG 2.1 AA federal government requirement).
 *
 * F8: Curation and Administration — governance gate error display
 */

import React from 'react';

// Maps GovernanceGateService PUB_REQUIRED_FIELDS field names → human-readable labels
// Sources: 05-PLAN.md PUB_REQUIRED_FIELDS + FRD F02b §Publication Requirements
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
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #FECACA',
        backgroundColor: '#FEF2F2',
        padding: '16px',
      }}
      data-testid="governance-gate-feedback"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span aria-hidden="true" style={{ fontSize: '1.125rem' }}>⛔</span>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991B1B', margin: 0 }}>
          Cannot publish — missing required fields:
        </p>
      </div>
      <ul
        style={{ margin: '0 0 8px 24px', padding: 0, color: '#B91C1C', fontSize: '0.8rem', lineHeight: 1.8 }}
        aria-label="Missing required fields"
      >
        {blockingFields.map((field) => (
          <li key={field}>
            {FIELD_LABELS[field] ?? field}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '0.8rem', color: '#991B1B', margin: 0 }}>
        Complete all required fields and try again.
      </p>
    </div>
  );
}

export default GovernanceGateFeedback;
