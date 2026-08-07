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
        Your request has been sent to the I&amp;R team.
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
