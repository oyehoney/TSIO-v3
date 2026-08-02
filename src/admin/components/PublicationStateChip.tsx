/**
 * PublicationStateChip.tsx — Publication state chip with color coding.
 *
 * Colors per UX-Mockup Screen 08 State Chips Color Coding:
 *   DRAFT → #E5E7EB bg / #374151 text
 *   REVIEW → #DBEAFE bg / #1E40AF text, label "IN REVIEW"
 *   PUBLISHED → #DCFCE7 bg / #166534 text
 *   SUPERSEDED → #FEF3C7 bg / #92400E text
 *   ARCHIVED → #D1D5DB bg / #374151 text
 *
 * F9: Content, Maturity & Trust Model / F8: publication state machine display
 */

import React from 'react';

interface PublicationStateChipProps {
  state: string;
  small?: boolean;
}

const STATE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'DRAFT', bg: '#E5E7EB', color: '#374151' },
  REVIEW: { label: 'IN REVIEW', bg: '#DBEAFE', color: '#1E40AF' },
  PUBLISHED: { label: 'PUBLISHED', bg: '#DCFCE7', color: '#166534' },
  SUPERSEDED: { label: 'SUPERSEDED', bg: '#FEF3C7', color: '#92400E' },
  ARCHIVED: { label: 'ARCHIVED', bg: '#D1D5DB', color: '#374151' },
};

export const PublicationStateChip: React.FC<PublicationStateChipProps> = ({ state, small = false }) => {
  const config = STATE_CONFIG[state] || { label: state, bg: '#E5E7EB', color: '#374151' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: '12px',
        fontSize: small ? '0.7rem' : '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};

export default PublicationStateChip;
