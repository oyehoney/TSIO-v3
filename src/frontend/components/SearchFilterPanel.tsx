import React from 'react';

// Maturity and review status enums from F9 trust model
const MATURITY_OPTIONS = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'EXPERIMENT_POC', label: 'Experiment / POC' },
  { value: 'PROTOTYPE_PILOT', label: 'Prototype / Pilot' },
  { value: 'PRODUCTION_VALIDATED', label: 'Production / Validated' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const REVIEW_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'CURATED', label: 'Curated' },
  { value: 'TECHNICALLY_REVIEWED', label: 'Tech Reviewed' },
  { value: 'SECURITY_REVIEWED', label: 'Security Reviewed' },
  { value: 'POLICY_REVIEWED', label: 'Policy Reviewed' },
  { value: 'VALIDATED_FOR_REUSE', label: 'Validated for Reuse' },
  { value: 'SUPERSEDED_RETIRED', label: 'Superseded / Retired' },
];

const REUSE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export interface SearchFiltersState {
  maturity_level: string[];
  review_status: string[];
  contributing_office: string[];
  reuse_potential: string;
}

interface SearchFilterPanelProps {
  filters: SearchFiltersState;
  onChange: (updates: Partial<SearchFiltersState>) => void;
  onReset: () => void;
}

export function SearchFilterPanel({ filters, onChange, onReset }: SearchFilterPanelProps) {
  function toggleMulti(key: 'maturity_level' | 'review_status' | 'contributing_office', value: string) {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ [key]: next });
  }

  return (
    <aside
      aria-label="Refine search results"
      className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 space-y-6"
    >
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Refine Results</h2>

      {/* Maturity Level */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Maturity Level</legend>
        <div className="space-y-1">
          {MATURITY_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.maturity_level.includes(opt.value)}
                onChange={() => toggleMulti('maturity_level', opt.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Review Status */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Review Status</legend>
        <div className="space-y-1">
          {REVIEW_STATUS_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.review_status.includes(opt.value)}
                onChange={() => toggleMulti('review_status', opt.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Reuse Potential */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Reuse Potential</legend>
        <div className="space-y-1">
          {REUSE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="reuse_potential"
                value={opt.value}
                checked={filters.reuse_potential === opt.value}
                onChange={() => onChange({ reuse_potential: opt.value })}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Clear Filters */}
      <button
        onClick={onReset}
        className="w-full text-sm text-blue-600 hover:text-blue-800 underline text-left"
        aria-label="Clear all search filters"
      >
        Clear Filters
      </button>
    </aside>
  );
}
