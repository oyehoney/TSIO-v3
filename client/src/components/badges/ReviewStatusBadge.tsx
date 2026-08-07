import React from 'react';
import type { ReviewStatus } from '../../types/catalog';

interface Props {
  review_status: ReviewStatus;
  review_status_label: string;
}

export function ReviewStatusBadge({ review_status, review_status_label }: Props) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
      aria-label={`Review status: ${review_status_label}`}
      data-testid="review-status-badge"
      data-review-status={review_status}
    >
      {review_status_label}
    </span>
  );
}
