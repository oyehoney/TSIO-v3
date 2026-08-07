import type { PaginatedCatalogResponse, CatalogFilters, FilterState } from '../types/catalog';
import { API_BASE, DEFAULT_PAGE_SIZE } from '../lib/constants';

export async function fetchCatalog(filters: FilterState): Promise<PaginatedCatalogResponse> {
  const params = new URLSearchParams();

  filters.maturity_level.forEach(v => params.append('maturity_level', v));
  filters.review_status.forEach(v => params.append('review_status', v));
  filters.contributing_office.forEach(v => params.append('contributing_office', v));
  filters.mission_area.forEach(v => params.append('mission_area', v));
  filters.technology_area.forEach(v => params.append('technology_area', v));
  if (filters.reuse_potential) params.set('reuse_potential', filters.reuse_potential);
  params.set('sort', filters.sort);
  params.set('page', String(filters.page));
  params.set('page_size', String(DEFAULT_PAGE_SIZE));

  const res = await fetch(`${API_BASE}/catalog?${params.toString()}`);
  if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
  return res.json();
}

export async function fetchCatalogFilters(): Promise<CatalogFilters> {
  const res = await fetch(`${API_BASE}/catalog/filters`);
  if (!res.ok) throw new Error(`Filter options request failed: ${res.status}`);
  return res.json();
}
