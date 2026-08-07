import React from 'react';
import type { FilterState } from '../../types/catalog';
import { MATURITY_LABELS, REVIEW_STATUS_LABELS } from '../../lib/constants';

interface Props {
  filters: FilterState;
  totalCount: number;
  onChange: (updated: Partial<FilterState>) => void;
}

export function ActiveFilterBar({ filters, totalCount, onChange }: Props) {
  const hasActiveFilters =
    filters.maturity_level.length > 0 ||
    filters.review_status.length > 0 ||
    filters.contributing_office.length > 0 ||
    filters.mission_area.length > 0 ||
    filters.technology_area.length > 0 ||
    Boolean(filters.reuse_potential);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4" data-testid="active-filter-bar">
      <span className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
        Showing {totalCount} record{totalCount !== 1 ? 's' : ''}
        {hasActiveFilters ? ' (filters applied)' : ''}
      </span>

      {hasActiveFilters && (
        <>
          <span className="text-sm text-gray-400">Active filters:</span>
          {filters.maturity_level.map(level => (
            <FilterChip
              key={level}
              label={MATURITY_LABELS[level] ?? level}
              onRemove={() => onChange({ maturity_level: filters.maturity_level.filter(v => v !== level), page: 1 })}
            />
          ))}
          {filters.review_status.map(status => (
            <FilterChip
              key={status}
              label={REVIEW_STATUS_LABELS[status] ?? status}
              onRemove={() => onChange({ review_status: filters.review_status.filter(v => v !== status), page: 1 })}
            />
          ))}
          {filters.contributing_office.map(office => (
            <FilterChip
              key={office}
              label={office}
              onRemove={() => onChange({ contributing_office: filters.contributing_office.filter(v => v !== office), page: 1 })}
            />
          ))}
          {filters.mission_area.map(tag => (
            <FilterChip
              key={tag}
              label={tag}
              onRemove={() => onChange({ mission_area: filters.mission_area.filter(v => v !== tag), page: 1 })}
            />
          ))}
          {filters.technology_area.map(tag => (
            <FilterChip
              key={tag}
              label={tag}
              onRemove={() => onChange({ technology_area: filters.technology_area.filter(v => v !== tag), page: 1 })}
            />
          ))}
          {filters.reuse_potential && (
            <FilterChip
              label={`Reuse: ${filters.reuse_potential.charAt(0) + filters.reuse_potential.slice(1).toLowerCase()}`}
              onRemove={() => onChange({ reuse_potential: '', page: 1 })}
            />
          )}

          <button
            onClick={() => onChange({
              maturity_level: [],
              review_status: [],
              contributing_office: [],
              mission_area: [],
              technology_area: [],
              reuse_potential: '',
              page: 1,
            })}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
            data-testid="clear-all-filters-bar"
          >
            Clear all filters
          </button>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium" data-testid="filter-chip">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="hover:text-indigo-600 font-bold leading-none"
      >
        ×
      </button>
    </span>
  );
}
