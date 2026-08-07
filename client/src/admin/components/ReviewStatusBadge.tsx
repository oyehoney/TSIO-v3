// ReviewStatusBadge.tsx — Review status badge with human-readable label.
// Per PRD Section 6.2 — 7 review statuses.

import React from 'react';

interface ReviewStatusBadgeProps {
  status: string;
  small?: boolean;
}

const REVIEW_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

export function ReviewStatusBadge({ status, small = false }: ReviewStatusBadgeProps) {
  const label = REVIEW_STATUS_LABELS[status] || status;
  return (
    <span
      style={{
        backgroundColor: '#F9FAFB',
        color: '#374151',
        border: '1px solid #E5E7EB',
        padding: small ? '2px 6px' : '3px 10px',
        borderRadius: '12px',
        fontSize: small ? '11px' : '12px',
        fontWeight: 500,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
