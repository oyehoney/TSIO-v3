import React from 'react';
import type { FilterState, CatalogFilters, MaturityLevel, ReviewStatus, ReusePotential } from '../../types/catalog';
import { MATURITY_LABELS, REVIEW_STATUS_LABELS } from '../../lib/constants';

interface Props {
  filters: FilterState;
  filterOptions: CatalogFilters | null;
  onChange: (updated: Partial<FilterState>) => void;
}

export function FilterPanel({ filters, filterOptions, onChange }: Props) {
  // Defensive: ensure array fields are always arrays even if undefined is passed
  const safeFilters: FilterState = {
    maturity_level: filters?.maturity_level ?? [],
    review_status: filters?.review_status ?? [],
    contributing_office: filters?.contributing_office ?? [],
    mission_area: filters?.mission_area ?? [],
    technology_area: filters?.technology_area ?? [],
    reuse_potential: filters?.reuse_potential ?? '',
    sort: filters?.sort ?? 'recent',
    page: filters?.page ?? 1,
  };

  function toggleMulti<T extends string>(current: T[], value: T): T[] {
    return current.includes(value) ? current.filter(v => v !== value) : [...current, value];
  }

  return (
    <aside
      className="w-56 flex-shrink-0 space-y-5"
      aria-label="Filter catalog records"
      data-testid="filter-panel"
    >
      {/* Maturity Level */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Maturity Level</legend>
        <div className="space-y-1.5">
          {(filterOptions?.maturity_levels ?? (Object.keys(MATURITY_LABELS) as MaturityLevel[])).map(level => (
            <label key={level} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={safeFilters.maturity_level.includes(level)}
                onChange={() => onChange({ maturity_level: toggleMulti(safeFilters.maturity_level, level), page: 1 })}
                data-testid={`filter-maturity-${level}`}
              />
              {MATURITY_LABELS[level] ?? level}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Review Status */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Review Status</legend>
        <div className="space-y-1.5">
          {(filterOptions?.review_statuses ?? (Object.keys(REVIEW_STATUS_LABELS) as ReviewStatus[])).map(status => (
            <label key={status} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={safeFilters.review_status.includes(status)}
                onChange={() => onChange({ review_status: toggleMulti(safeFilters.review_status, status), page: 1 })}
                data-testid={`filter-review-${status}`}
              />
              {REVIEW_STATUS_LABELS[status] ?? status}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Mission Area */}
      {filterOptions && filterOptions.mission_area_tags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-2">Mission Area</legend>
          <div className="space-y-1.5">
            {filterOptions.mission_area_tags.map(tag => (
              <label key={tag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safeFilters.mission_area.includes(tag)}
                  onChange={() => onChange({ mission_area: toggleMulti(safeFilters.mission_area, tag), page: 1 })}
                  data-testid={`filter-mission-${tag}`}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Technology Area */}
      {filterOptions && filterOptions.technology_area_tags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-2">Technology Area</legend>
          <div className="space-y-1.5">
            {filterOptions.technology_area_tags.map(tag => (
              <label key={tag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safeFilters.technology_area.includes(tag)}
                  onChange={() => onChange({ technology_area: toggleMulti(safeFilters.technology_area, tag), page: 1 })}
                  data-testid={`filter-technology-${tag}`}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Contributing Office */}
      {filterOptions && filterOptions.contributing_offices.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800 mb-2">Contributing Office</legend>
          <div className="space-y-1.5">
            {filterOptions.contributing_offices.map(office => (
              <label key={office} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safeFilters.contributing_office.includes(office)}
                  onChange={() => onChange({ contributing_office: toggleMulti(safeFilters.contributing_office, office), page: 1 })}
                  data-testid={`filter-office-${office}`}
                />
                {office}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Reuse Potential */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Reuse Potential</legend>
        <div className="space-y-1.5">
          {(['', 'HIGH', 'MEDIUM', 'LOW'] as const).map(val => (
            <label key={val || 'any'} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="reuse_potential"
                value={val}
                checked={safeFilters.reuse_potential === val}
                onChange={() => onChange({ reuse_potential: val as ReusePotential | '', page: 1 })}
                data-testid={`filter-reuse-${val || 'any'}`}
              />
              {val === '' ? 'Any' : val.charAt(0) + val.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Clear All */}
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
        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
        data-testid="clear-all-filters"
      >
        Clear All Filters
      </button>
    </aside>
  );
}
