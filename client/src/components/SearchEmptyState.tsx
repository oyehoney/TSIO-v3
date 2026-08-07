import React from 'react';
import { Link } from 'react-router-dom';

interface SearchEmptyStateProps {
  type: 'no-results' | 'blank';
  query?: string;
}

export function SearchEmptyState({ type, query }: SearchEmptyStateProps) {
  if (type === 'blank') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 text-base">Enter a search term to find innovation records.</p>
      </div>
    );
  }

  // no-results state — per UX Mockup Screen 01 empty state
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto space-y-4"
      role="status"
      aria-live="polite"
    >
      <span className="text-5xl" aria-hidden="true">🔍</span>
      <h2 className="text-lg font-semibold text-gray-800">No records found</h2>
      {query && (
        <p className="text-gray-600 text-sm">
          No records found for &ldquo;<strong>{query}</strong>&rdquo;.
        </p>
      )}
      <p className="text-gray-600 text-sm">
        Try different keywords, or let I&amp;R know about this mission problem:
      </p>
      <Link
        to={`/submit-opportunity${query ? `?context=search&q=${encodeURIComponent(query)}` : ''}`}
        className="inline-flex items-center gap-1 bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Submit a mission problem for I&R consideration"
      >
        Submit a Mission Problem for I&amp;R Consideration →
      </Link>
      <hr className="w-full border-gray-200" />
      <p className="text-gray-600 text-sm">You can also browse all published records:</p>
      <Link
        to="/catalog"
        className="text-blue-600 hover:text-blue-800 underline text-sm"
        aria-label="View Innovation Catalog"
      >
        View Innovation Catalog →
      </Link>
    </div>
  );
}
