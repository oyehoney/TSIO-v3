import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { FilterPanel } from '../components/catalog/FilterPanel';
import { SortControls } from '../components/catalog/SortControls';
import { ActiveFilterBar } from '../components/catalog/ActiveFilterBar';
import { CatalogCard } from '../components/catalog/CatalogCard';
import { PaginationControls } from '../components/catalog/PaginationControls';
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState';
import { useCatalog } from '../hooks/useCatalog';
import type { SortOption } from '../types/catalog';

export function CatalogPage() {
  const { filters, filterOptions, catalogData, loading, error, updateFilters } = useCatalog();

  const hasActiveFilters =
    filters.maturity_level.length > 0 ||
    filters.review_status.length > 0 ||
    filters.contributing_office.length > 0 ||
    filters.mission_area.length > 0 ||
    filters.technology_area.length > 0 ||
    Boolean(filters.reuse_potential);

  return (
    <AppShell>
      <div className="flex gap-8">
        {/* Filter sidebar */}
        <FilterPanel
          filters={filters}
          filterOptions={filterOptions}
          onChange={updateFilters}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title + sort row */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Innovation Catalog</h1>
            <SortControls
              value={filters.sort}
              onChange={(sort: SortOption) => updateFilters({ sort, page: 1 })}
            />
          </div>

          {/* Active filter bar with result count */}
          <ActiveFilterBar
            filters={filters}
            totalCount={catalogData?.pagination.total_count ?? 0}
            onChange={updateFilters}
          />

          {/* Error state */}
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-sm text-red-700"
              data-testid="catalog-error"
            >
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              aria-label="Loading catalog…"
              aria-busy="true"
              data-testid="catalog-loading"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 h-52 animate-pulse" />
              ))}
            </div>
          )}

          {/* Catalog grid */}
          {!loading && !error && catalogData && (
            catalogData.data.length === 0 ? (
              <CatalogEmptyState hasActiveFilters={hasActiveFilters} />
            ) : (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  data-testid="catalog-grid"
                >
                  {catalogData.data.map(card => (
                    <CatalogCard key={card.record_id} card={card} />
                  ))}
                </div>

                <PaginationControls
                  currentPage={filters.page}
                  totalPages={catalogData.pagination.total_pages}
                  onPageChange={page => updateFilters({ page })}
                />
              </>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
