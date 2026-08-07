// PublicationStateChip.tsx — State chip per UX-Mockup Screen 08 State Chips Color Coding

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

export function PublicationStateChip({ state, small = false }: PublicationStateChipProps) {
  const config = STATE_CONFIG[state] || { label: state, bg: '#E5E7EB', color: '#374151' };
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: small ? '2px 6px' : '3px 10px',
        borderRadius: '4px',
        fontSize: small ? '10px' : '11px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
