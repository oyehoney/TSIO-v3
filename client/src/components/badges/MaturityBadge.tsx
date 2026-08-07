import React from 'react';
import { MATURITY_BADGE_COLORS } from '../../lib/constants';
import type { MaturityLevel } from '../../types/catalog';

interface Props {
  maturity_level: MaturityLevel;
  maturity_label: string;
}

export function MaturityBadge({ maturity_level, maturity_label }: Props) {
  const colorClass = MATURITY_BADGE_COLORS[maturity_level] ?? 'bg-gray-500 text-white';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}
      aria-label={`Maturity: ${maturity_label}`}
      data-testid="maturity-badge"
      data-maturity={maturity_level}
    >
      <span className="mr-1" aria-hidden="true">●</span>
      {maturity_label}
    </span>
  );
}
