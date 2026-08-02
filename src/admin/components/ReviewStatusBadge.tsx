/**
 * ReviewStatusBadge.tsx — Review status badge with human-readable label.
 *
 * Labels per PRD Section 6.2 (7 review statuses).
 * No color differentiation required — plain label badge.
 *
 * F9: Content, Maturity & Trust Model
 */

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

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({ status, small = false }) => {
  const label = REVIEW_STATUS_LABELS[status] || status;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '2px 6px' : '3px 10px',
        borderRadius: '4px',
        fontSize: small ? '0.7rem' : '0.75rem',
        fontWeight: 500,
        backgroundColor: '#F3F4F6',
        color: '#374151',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export default ReviewStatusBadge;
