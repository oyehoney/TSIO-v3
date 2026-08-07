import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  hasActiveFilters: boolean;
}

export function CatalogEmptyState({ hasActiveFilters }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="catalog-empty-state"
      role="status"
    >
      <span className="text-5xl mb-4" aria-hidden="true">📭</span>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">No records found</h2>
      {hasActiveFilters ? (
        <>
          <p className="text-sm text-gray-600 mb-4 max-w-sm">
            No records match your current filters.
          </p>
          <ul className="text-sm text-gray-600 text-left mb-6 space-y-1">
            <li>• Clearing one or more filters</li>
            <li>• Searching with a keyword</li>
          </ul>
        </>
      ) : (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">
          No published innovation records are available yet.
        </p>
      )}
      <p className="text-sm text-gray-600 mb-3 max-w-sm">
        Can't find work on a problem your court is facing?
      </p>
      <Link
        to="/submit-opportunity"
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
        data-testid="empty-state-submit-cta"
      >
        Submit a Mission Problem for I&R Consideration →
      </Link>
    </div>
  );
}
