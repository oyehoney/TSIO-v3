import React from 'react';

export function CommunityBadge() {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
      aria-label="Community-contributed record"
      data-testid="community-badge"
    >
      COMMUNITY
    </span>
  );
}
