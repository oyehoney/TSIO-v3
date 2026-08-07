import React from 'react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= Math.min(totalPages, 7); i++) pages.push(i);

  return (
    <nav aria-label="Catalog pagination" className="flex items-center gap-1 justify-center mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
        data-testid="pagination-prev"
      >
        ← Previous
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 text-sm rounded border ${
            p === currentPage
              ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={`Page ${p}`}
          aria-current={p === currentPage ? 'page' : undefined}
          data-testid={`pagination-page-${p}`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
        aria-label="Next page"
        data-testid="pagination-next"
      >
        Next →
      </button>
    </nav>
  );
}
