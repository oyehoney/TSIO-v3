import React from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from '../hooks/useSearchParams';
import { useSearch } from '../hooks/useSearch';
import { SearchResultCard } from '../components/SearchResultCard';
import { SearchFilterPanel } from '../components/SearchFilterPanel';
import { SearchEmptyState } from '../components/SearchEmptyState';

export function SearchPage() {
  const { filters, setFilters, resetFilters } = useSearchParams();
  const searchState = useSearch(filters);

  const query = filters.q.trim();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header: query echo + result count */}
      <header className="mb-6">
        {query && (
          <h1 className="text-xl font-semibold text-gray-900">
            Search results for: &ldquo;<span className="font-bold">{query}</span>&rdquo;
          </h1>
        )}
        {searchState.status === 'results' && (
          <p className="text-sm text-gray-500 mt-1" aria-live="polite">
            {searchState.pagination.total_count} record{searchState.pagination.total_count !== 1 ? 's' : ''} found
            {(filters.maturity_level.length > 0 || filters.review_status.length > 0 || filters.reuse_potential) &&
              ' (filters applied)'}
          </p>
        )}
        {/* Query too long error — inline per UX Mockup Screen 01 States table */}
        {searchState.status === 'error' && searchState.code === 'QUERY_TOO_LONG' && (
          <p className="text-sm text-red-600 mt-1" role="alert">
            Your search query is too long. Please shorten it to 500 characters or fewer.
          </p>
        )}
        {/* Search unavailable error */}
        {searchState.status === 'error' && searchState.code === 'SEARCH_UNAVAILABLE' && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800" role="alert">
            Search is temporarily unavailable. Try{' '}
            <Link to="/catalog" className="underline hover:text-yellow-900">browsing the catalog</Link>.
          </div>
        )}
      </header>

      {/* Active filter chips */}
      {(filters.maturity_level.length > 0 || filters.review_status.length > 0 || filters.reuse_potential) && (
        <div className="flex flex-wrap gap-2 mb-4" aria-label="Active filters">
          {filters.maturity_level.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded">
              {v}
              <button
                aria-label={`Remove maturity filter: ${v}`}
                onClick={() => setFilters({ maturity_level: filters.maturity_level.filter(x => x !== v) })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
          {filters.review_status.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded">
              {v}
              <button
                aria-label={`Remove review status filter: ${v}`}
                onClick={() => setFilters({ review_status: filters.review_status.filter(x => x !== v) })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
          {filters.reuse_potential && (
            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded">
              Reuse: {filters.reuse_potential}
              <button
                aria-label="Remove reuse potential filter"
                onClick={() => setFilters({ reuse_potential: '' })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Two-column layout: filter panel + results */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter panel — hidden when blank/error/loading with no query */}
        {query && (
          <SearchFilterPanel
            filters={{
              maturity_level: filters.maturity_level,
              review_status: filters.review_status,
              contributing_office: filters.contributing_office,
              reuse_potential: filters.reuse_potential,
            }}
            onChange={(updates) => setFilters(updates)}
            onReset={resetFilters}
          />
        )}

        {/* Results area */}
        <div className="flex-1 min-w-0">
          {searchState.status === 'loading' && (
            <div aria-live="polite" aria-busy="true" className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-lg h-40 animate-pulse" aria-hidden="true" />
              ))}
              <span className="sr-only">Searching…</span>
            </div>
          )}

          {(searchState.status === 'blank' || (searchState.status === 'idle' && !query)) && (
            <SearchEmptyState type="blank" />
          )}

          {searchState.status === 'empty' && (
            <SearchEmptyState type="no-results" query={searchState.query} />
          )}

          {searchState.status === 'results' && (
            <>
              <div className="space-y-4" role="list" aria-label="Search results">
                {searchState.data.map(card => (
                  <div key={card.record_id} role="listitem">
                    <SearchResultCard card={card} />
                  </div>
                ))}
              </div>

              {/* Pagination — per UX Mockup Screen 01 layout */}
              {searchState.pagination.total_pages > 1 && (
                <nav
                  className="flex justify-center items-center gap-2 mt-8"
                  aria-label="Search results pagination"
                >
                  {filters.page > 1 && (
                    <button
                      onClick={() => setFilters({ page: filters.page - 1 })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      aria-label="Previous page"
                    >
                      ← Previous
                    </button>
                  )}
                  {Array.from({ length: searchState.pagination.total_pages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - filters.page) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => setFilters({ page: p })}
                        className={`px-3 py-1 text-sm border rounded ${p === filters.page ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                        aria-label={`Page ${p}`}
                        aria-current={p === filters.page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    ))}
                  {filters.page < searchState.pagination.total_pages && (
                    <button
                      onClick={() => setFilters({ page: filters.page + 1 })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      aria-label="Next page"
                    >
                      Next →
                    </button>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
