import { useSearchParams as useRouterSearchParams } from 'react-router-dom';

export interface SearchFilters {
  q: string;
  maturity_level: string[];
  review_status: string[];
  contributing_office: string[];
  reuse_potential: string;
  page: number;
}

/**
 * Reads and writes search state to/from the URL.
 * All state changes update the URL — URL is the single source of truth.
 */
export function useSearchParams(): {
  filters: SearchFilters;
  setFilters: (updates: Partial<SearchFilters>) => void;
  resetFilters: () => void;
} {
  const [params, setParams] = useRouterSearchParams();

  const filters: SearchFilters = {
    q: params.get('q') ?? '',
    maturity_level: params.getAll('maturity_level'),
    review_status: params.getAll('review_status'),
    contributing_office: params.getAll('contributing_office'),
    reuse_potential: params.get('reuse_potential') ?? '',
    page: parseInt(params.get('page') ?? '1', 10) || 1,
  };

  function setFilters(updates: Partial<SearchFilters>) {
    const next = new URLSearchParams();
    const merged = { ...filters, ...updates };

    if (merged.q) next.set('q', merged.q);
    merged.maturity_level.forEach(v => next.append('maturity_level', v));
    merged.review_status.forEach(v => next.append('review_status', v));
    merged.contributing_office.forEach(v => next.append('contributing_office', v));
    if (merged.reuse_potential) next.set('reuse_potential', merged.reuse_potential);
    // Reset to page 1 when filters change (but not when page itself changes)
    if (updates.page !== undefined) {
      next.set('page', String(merged.page));
    } else if (merged.page > 1 && updates.q === undefined) {
      // keep page only if only page changed
    } else {
      next.delete('page'); // filter change resets to page 1
    }

    setParams(next, { replace: false });
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q); // preserve query, clear all filters
    setParams(next, { replace: false });
  }

  return { filters, setFilters, resetFilters };
}
