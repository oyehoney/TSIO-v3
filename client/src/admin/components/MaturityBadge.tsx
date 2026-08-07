// MaturityBadge.tsx — Color-coded maturity badge per UX-Mockup Color System

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

export function MaturityBadge({ level, small = false }: MaturityBadgeProps) {
  const config = MATURITY_CONFIG[level] || { label: level, bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: small ? '2px 6px' : '3px 10px',
        borderRadius: '12px',
        fontSize: small ? '11px' : '12px',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
