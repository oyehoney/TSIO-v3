import { useState, useEffect } from 'react';
import type { SearchFilters } from './useSearchParams';

export interface SearchResultCard {
  record_id: string;
  title: string;
  short_summary: string | null;
  maturity_level: string;
  maturity_label: string;
  review_status: string;
  review_status_label: string;
  reuse_potential: string;
  source_type: string;
  mission_area_tags: string[];
  technology_area_tags: string[];
  engagement_options: string[];
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  published_at: string | null;
  relevance_score: number;
  highlight_snippet: string | null;
}

export interface SearchPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'blank' }                          // blank/whitespace query
  | { status: 'results'; data: SearchResultCard[]; pagination: SearchPagination }
  | { status: 'empty'; query: string }           // valid query, zero results
  | { status: 'error'; code: 'QUERY_TOO_LONG' | 'SEARCH_UNAVAILABLE' | 'UNKNOWN'; message: string };

/**
 * Executes GET /api/v1/search with the current SearchFilters.
 * Re-runs whenever filters change.
 */
export function useSearch(filters: SearchFilters): SearchState {
  const [state, setState] = useState<SearchState>({ status: 'idle' });

  useEffect(() => {
    const q = filters.q.trim();

    // Blank query — no search; show prompt
    if (!q) {
      setState({ status: 'blank' });
      return;
    }

    // Query too long — inline error (also caught by backend 400, but handle client-side first)
    if (q.length > 500) {
      setState({ status: 'error', code: 'QUERY_TOO_LONG', message: 'Your search query is too long. Please shorten it to 500 characters or fewer.' });
      return;
    }

    setState({ status: 'loading' });

    const params = new URLSearchParams();
    params.set('q', q);
    filters.maturity_level.forEach(v => params.append('maturity_level', v));
    filters.review_status.forEach(v => params.append('review_status', v));
    filters.contributing_office.forEach(v => params.append('contributing_office', v));
    if (filters.reuse_potential) params.set('reuse_potential', filters.reuse_potential);
    if (filters.page > 1) params.set('page', String(filters.page));

    const controller = new AbortController();

    fetch(`/api/v1/search?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();

        if (res.status === 400 && body?.error?.code === 'QUERY_TOO_LONG') {
          setState({ status: 'error', code: 'QUERY_TOO_LONG', message: body.error.message });
          return;
        }
        if (res.status === 503) {
          setState({ status: 'error', code: 'SEARCH_UNAVAILABLE', message: body?.error?.message ?? 'Search is temporarily unavailable. Try browsing the catalog.' });
          return;
        }
        if (!res.ok) {
          setState({ status: 'error', code: 'UNKNOWN', message: 'An unexpected error occurred.' });
          return;
        }

        // Blank query response from backend (edge case: blank after server-side processing)
        if (body.message && Array.isArray(body.data) && body.data.length === 0 && !body.pagination) {
          setState({ status: 'blank' });
          return;
        }

        // Zero results with guidance message
        if (Array.isArray(body.data) && body.data.length === 0) {
          setState({ status: 'empty', query: q });
          return;
        }

        setState({ status: 'results', data: body.data, pagination: body.pagination });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', code: 'UNKNOWN', message: 'Search failed. Please try again.' });
      });

    return () => controller.abort();
  }, [
    filters.q,
    // Stringify arrays for stable dependency comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.maturity_level.join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.review_status.join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.contributing_office.join(','),
    filters.reuse_potential,
    filters.page,
  ]);

  return state;
}
