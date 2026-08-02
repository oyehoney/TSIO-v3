/**
 * MaturityBadge.tsx — Color-coded maturity level badge.
 *
 * Colors per UX-Mockup Color System (Section Overview):
 *   IDEA → Gray #6B7280
 *   EXPERIMENT_POC → Yellow/Amber #D97706
 *   PROTOTYPE_PILOT → Orange #EA580C
 *   PRODUCTION_VALIDATED → Green #16A34A
 *   ARCHIVED → Dark Gray #374151
 *
 * F9: Content, Maturity & Trust Model
 */

import React from 'react';

interface MaturityBadgeProps {
  level: string;
  small?: boolean;
}

const MATURITY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  IDEA: { label: 'Idea', bg: '#F3F4F6', color: '#6B7280' },
  EXPERIMENT_POC: { label: 'Experiment / POC', bg: '#FEF3C7', color: '#D97706' },
  PROTOTYPE_PILOT: { label: 'Prototype / Pilot', bg: '#FFEDD5', color: '#EA580C' },
  PRODUCTION_VALIDATED: { label: 'Production / Validated', bg: '#DCFCE7', color: '#16A34A' },
  ARCHIVED: { label: 'Archived', bg: '#E5E7EB', color: '#374151' },
};

export const MaturityBadge: React.FC<MaturityBadgeProps> = ({ level, small = false }) => {
  const config = MATURITY_CONFIG[level] || { label: level, bg: '#F3F4F6', color: '#6B7280' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '2px 6px' : '3px 10px',
        borderRadius: '4px',
        fontSize: small ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
};

export default MaturityBadge;
