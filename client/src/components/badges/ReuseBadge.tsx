import React from 'react';

export function ReuseBadge() {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300"
      aria-label="Validated for Reuse"
      data-testid="reuse-badge"
    >
      ✓ Validated for Reuse
    </span>
  );
}
