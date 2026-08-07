import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, PaginatedCatalogResponse, CatalogFilters, SortOption, MaturityLevel, ReviewStatus, ReusePotential } from '../types/catalog';
import { fetchCatalog, fetchCatalogFilters } from '../api/catalogApi';

const DEFAULT_FILTERS: FilterState = {
  maturity_level: [],
  review_status: [],
  contributing_office: [],
  mission_area: [],
  technology_area: [],
  reuse_potential: '',
  sort: 'recent',
  page: 1,
};

function filtersFromSearchParams(params: URLSearchParams): FilterState {
  return {
    maturity_level: params.getAll('maturity_level') as MaturityLevel[],
    review_status: params.getAll('review_status') as ReviewStatus[],
    contributing_office: params.getAll('contributing_office'),
    mission_area: params.getAll('mission_area'),
    technology_area: params.getAll('technology_area'),
    reuse_potential: (params.get('reuse_potential') ?? '') as ReusePotential | '',
    sort: (params.get('sort') as SortOption) || 'recent',
    page: parseInt(params.get('page') ?? '1', 10) || 1,
  };
}

function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  filters.maturity_level.forEach(v => p.append('maturity_level', v));
  filters.review_status.forEach(v => p.append('review_status', v));
  filters.contributing_office.forEach(v => p.append('contributing_office', v));
  filters.mission_area.forEach(v => p.append('mission_area', v));
  filters.technology_area.forEach(v => p.append('technology_area', v));
  if (filters.reuse_potential) p.set('reuse_potential', filters.reuse_potential);
  if (filters.sort !== 'recent') p.set('sort', filters.sort);
  if (filters.page > 1) p.set('page', String(filters.page));
  return p;
}

export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalogData, setCatalogData] = useState<PaginatedCatalogResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<CatalogFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = filtersFromSearchParams(searchParams);

  // Load filter options once on mount
  useEffect(() => {
    fetchCatalogFilters()
      .then(setFilterOptions)
      .catch(() => {/* non-fatal; filter options degrade gracefully */});
  }, []);

  // Re-fetch catalog whenever URL params change
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCatalog(filters)
      .then(data => {
        setCatalogData(data);
        setLoading(false);
      })
      .catch(() => {
        setError('The catalog is temporarily unavailable. Please try again shortly.');
        setLoading(false);
      });
  }, [searchParams.toString()]);

  const updateFilters = useCallback((updated: Partial<FilterState>) => {
    const current = filtersFromSearchParams(searchParams);
    const next = { ...current, ...updated };
    setSearchParams(filtersToSearchParams(next), { replace: false });
  }, [searchParams, setSearchParams]);

  return {
    filters,
    filterOptions,
    catalogData,
    loading,
    error,
    updateFilters,
  };
}

// Export DEFAULT_FILTERS for potential use in tests
export { DEFAULT_FILTERS };
