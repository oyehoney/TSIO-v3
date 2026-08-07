import React from 'react';
import type { SortOption } from '../../types/catalog';

interface Props {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

export function SortControls({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-gray-600 font-medium whitespace-nowrap">
        Sort:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={e => onChange(e.target.value as SortOption)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
        data-testid="sort-select"
      >
        <option value="recent">Most Recent</option>
        <option value="maturity">Maturity</option>
        <option value="relevance">Relevance</option>
      </select>
    </div>
  );
}
