---
phase: implement-full-tsio-innovation-hub-web-a
plan: 10
type: execute
wave: 4
depends_on: [2, 3]
files_modified:
  - src/frontend/pages/SearchPage.tsx
  - src/frontend/components/SearchResultCard.tsx
  - src/frontend/components/SearchFilterPanel.tsx
  - src/frontend/components/SearchEmptyState.tsx
  - src/frontend/hooks/useSearchParams.ts
  - src/frontend/hooks/useSearch.ts
  - e2e/search-page.spec.ts
autonomous: true

features:
  implements: ["F1", "F9"]
  depends_on: ["F1", "F9"]
  enables: ["F1"]

must_haves:
  truths:
    - "Navigating to /search?q=audio+security renders a search results page with ranked result cards containing query-term highlights"
    - "Each result card displays maturity badge (color-coded per F9 color system), review status badge, mission/technology tags, engagement indicators, and a highlight snippet with query terms bolded"
    - "The filter panel on /search mirrors the catalog filter panel: maturity_level (multi-select checkboxes), review_status (multi-select checkboxes), contributing_office (multi-select), reuse_potential (radio)"
    - "Applying a filter updates the URL (?maturity_level=EXPERIMENT_POC) and re-executes the search without a full page reload"
    - "Zero-results state renders the empty state message with CTA link to /submit-opportunity and a secondary link to /catalog"
    - "Blank/whitespace query on the /search page renders a 'Enter a search term' prompt and no result cards"
    - "Query > 500 chars shows the inline error: 'Your search query is too long. Please shorten it to 500 characters or fewer.'"
    - "The global search bar in the app shell header is pre-filled with the current query when on /search"
    - "SearchPage is reachable from the global search bar present on every page in the app shell"
  artifacts:
    - path: "src/frontend/pages/SearchPage.tsx"
      provides: "Search results page at route /search with URL-state management, filter integration, and pagination"
      exports: ["SearchPage"]
    - path: "src/frontend/components/SearchResultCard.tsx"
      provides: "Individual search result card with highlight snippet, maturity badge, review status badge, tags, and engagement indicators"
      exports: ["SearchResultCard"]
    - path: "src/frontend/components/SearchFilterPanel.tsx"
      provides: "Filter sidebar component shared with CatalogPage — maturity, review, office, reuse filters"
      exports: ["SearchFilterPanel"]
    - path: "src/frontend/components/SearchEmptyState.tsx"
      provides: "Empty/zero-results state component with CTAs to /submit-opportunity and /catalog"
      exports: ["SearchEmptyState"]
    - path: "src/frontend/hooks/useSearchParams.ts"
      provides: "Custom hook reading/writing q, maturity_level, review_status, contributing_office, reuse_potential, page to/from URL search params"
      exports: ["useSearchParams"]
    - path: "src/frontend/hooks/useSearch.ts"
      provides: "Custom hook calling GET /api/v1/search with current params, returns loading/error/data state"
      exports: ["useSearch"]
    - path: "e2e/search-page.spec.ts"
      provides: "Playwright e2e tests covering all Search page states and interactions"
  key_links:
    - from: "SearchPage"
      to: "GET /api/v1/search"
      via: "useSearch hook on URL param change"
      pattern: "useSearch|/api/v1/search"
    - from: "SearchFilterPanel"
      to: "useSearchParams"
      via: "filter change → URL update → useSearch re-fires"
      pattern: "useSearchParams|setSearchParam"
    - from: "SearchResultCard"
      to: "highlight_snippet"
      via: "dangerouslySetInnerHTML scoped to <mark> tags only (per backend ts_headline contract)"
      pattern: "highlight_snippet|dangerouslySetInnerHTML"
    - from: "SearchPage"
      to: "/records/{id}"
      via: "result card click navigates to record detail"
      pattern: "records.*record_id"

integration_contracts:
  requires:
    - from_plan: "04"
      artifact: "src/handlers/SearchHandler.ts + src/routes/search.ts"
      exports:
        - "GET /api/v1/search — public endpoint, returns PaginatedSearchResponse"
        - "SearchResultCard shape: { record_id, title, maturity_level, maturity_label, review_status, review_status_label, reuse_potential, source_type, mission_area_tags, technology_area_tags, engagement_options, is_validated_for_reuse, is_community_contributed, published_at, relevance_score, highlight_snippet }"
        - "Response 200 (results): { data: SearchResultCard[], pagination: { page, page_size, total_count, total_pages } }"
        - "Response 200 (blank query): { message: 'Enter a search term...', data: [] }"
        - "Response 200 (zero results): { data: [], pagination: {...}, message: 'No records found for ...' }"
        - "Response 400: { error: { code: 'QUERY_TOO_LONG', message: '...' } }"
        - "Response 503: { error: { code: 'SEARCH_UNAVAILABLE', message: '...' } }"
        - "highlight_snippet: ts_headline output with StartSel=<mark> StopSel=</mark>"
      verify: "grep -n 'class SearchHandler\\|export.*SearchHandler' src/handlers/SearchHandler.ts && grep -n 'QUERY_TOO_LONG\\|SEARCH_UNAVAILABLE' src/handlers/SearchHandler.ts && grep -n 'ts_headline' src/services/SearchService.ts && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "src/app.js (Express app factory with /healthz and /api/v1 prefix)"
      exports:
        - "createApp() — Express app with /api/v1/catalog and /healthz"
        - "MATURITY_LABELS + REVIEW_STATUS_LABELS maps for badge label rendering"
      verify: "grep -n 'createApp\\|/healthz' src/app.js && grep -n 'MATURITY_LABELS\\|REVIEW_STATUS_LABELS' src/services/CatalogService.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/frontend/pages/SearchPage.tsx"
      exports:
        - "SearchPage — React component rendered at route /search"
        - "Accepts query via URL param q=; re-executes on q/filter/page change"
        - "Wired into app shell router at /search"
      shape: |
        Route: /search?q={query}&maturity_level=...&review_status=...&contributing_office=...&reuse_potential=...&page=N
        Renders: query echo, result count, filter panel, ranked SearchResultCard list, pagination, empty/error states
        Reachable from: global search bar in app shell header (every page)
      verify: "grep -n 'export.*SearchPage\\|function SearchPage' src/frontend/pages/SearchPage.tsx && grep -n '/search' src/frontend/App.tsx 2>/dev/null || grep -rn 'SearchPage' src/frontend/ | grep -v 'SearchPage.tsx' | head -1 && echo CONTRACT_OK"
    - artifact: "src/frontend/components/SearchResultCard.tsx"
      exports:
        - "SearchResultCard — renders a single search result with highlight_snippet, maturity badge, review status badge, tags"
        - "Consumed by SearchPage (Wave 4b) and Wave 7 integration tests"
      shape: |
        Props: { card: SearchResultCard }
        where SearchResultCard = { record_id, title, maturity_level, maturity_label, review_status,
          review_status_label, reuse_potential, source_type, mission_area_tags, technology_area_tags,
          engagement_options, is_validated_for_reuse, is_community_contributed, published_at,
          relevance_score, highlight_snippet }
        Renders highlight_snippet via sanitized dangerouslySetInnerHTML (only <mark> allowed).
        Clicking card navigates to /records/{record_id}
      verify: "grep -n 'export.*SearchResultCard\\|function SearchResultCard' src/frontend/components/SearchResultCard.tsx && grep -n 'highlight_snippet' src/frontend/components/SearchResultCard.tsx && echo CONTRACT_OK"
    - artifact: "src/frontend/components/SearchFilterPanel.tsx"
      exports:
        - "SearchFilterPanel — filter sidebar for search page with maturity, review, office, reuse controls"
        - "Consumed by SearchPage; may be shared with CatalogPage (Wave 4a)"
      shape: |
        Props: { filters: SearchFilters, onChange: (filters: SearchFilters) => void }
        Renders: maturity_level checkboxes (5 values), review_status checkboxes (7 values),
                 contributing_office multi-select, reuse_potential radio group, Clear Filters button
      verify: "grep -n 'export.*SearchFilterPanel\\|function SearchFilterPanel' src/frontend/components/SearchFilterPanel.tsx && echo CONTRACT_OK"
    - artifact: "e2e/search-page.spec.ts"
      exports:
        - "Playwright e2e test suite covering all SearchPage states and interactions"
        - "Consumed by Wave 7 integration validation as part of full Playwright suite"
      shape: |
        Tests: valid query → results rendered, highlight snippets present, filter applies + URL updates,
               blank query → guidance message, zero results → empty state with CTAs,
               result card click → navigates to /records/{id}, nav reachable from app shell search bar
      verify: "ls e2e/search-page.spec.ts && grep -n 'test\\|it(' e2e/search-page.spec.ts | wc -l && echo CONTRACT_OK"
---

<objective>
Implement the **SearchPage** (`/search`) — the full-text search results interface for the TSIO Innovation Hub.

Purpose: F1 (Search and Discovery) requires stakeholders to find innovation records by describing a mission problem in natural language. The Search page consumes the `GET /api/v1/search` endpoint implemented in Wave 2b (04-PLAN.md), renders weighted FTS results with query-term highlights, provides the same filter panel as the catalog (F0), manages URL state for bookmarking and sharing, and handles all edge cases: blank query, zero results, query-too-long, and 503 unavailability. Every result card surfaces maturity and review status badges (F9 trust model).

The UX Mockup (Screen 01) and User Stories US-1.1, US-1.2, US-1.3 are the primary design authority. No conflicts were detected with the PRD.

Output:
- `src/frontend/pages/SearchPage.tsx` — page component at `/search` route
- `src/frontend/components/SearchResultCard.tsx` — result card with highlight rendering
- `src/frontend/components/SearchFilterPanel.tsx` — shared filter sidebar
- `src/frontend/components/SearchEmptyState.tsx` — zero-results and blank-query states
- `src/frontend/hooks/useSearchParams.ts` — URL param read/write hook
- `src/frontend/hooks/useSearch.ts` — API call hook
- `e2e/search-page.spec.ts` — Playwright e2e tests
</objective>

<feature_dependencies>
Implements: F1: Search and Discovery (SearchPage at /search — FTS results display, query-term highlight rendering, filter panel, URL state management, empty states, no-results state); F9: Content Maturity and Trust Model (maturity badge color-coding per F9 color system, review status badges on every result card)
Depends on: F1: SearchService backend (Wave 2b — 04-PLAN.md provides GET /api/v1/search endpoint with SearchResultCard response including highlight_snippet); F9: maturity/review badge components from Wave 4a CatalogPage (09-PLAN.md) — import or duplicate
Enables: F1: Wave 7 integration validation of full search flow; SearchPage provides the reachable /search route that Wave 7 Playwright suite tests end-to-end
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/04-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md
@project_specs/UserStories-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement SearchPage, SearchResultCard, SearchFilterPanel, SearchEmptyState, useSearchParams, useSearch</name>
  <files>
    src/frontend/pages/SearchPage.tsx
    src/frontend/components/SearchResultCard.tsx
    src/frontend/components/SearchFilterPanel.tsx
    src/frontend/components/SearchEmptyState.tsx
    src/frontend/hooks/useSearchParams.ts
    src/frontend/hooks/useSearch.ts
  </files>
  <action>
Build all source files for the Search Results page. Stack: React 18 + TypeScript + React Router v6 (same stack as Wave 4a CatalogPage). Use Tailwind CSS for styling.

**Architecture notes:**
- URL is the source of truth for all search state — `q`, `maturity_level` (repeatable), `review_status` (repeatable), `contributing_office` (repeatable), `reuse_potential`, `page`
- Filter changes update the URL (via React Router `useNavigate`/`useSearchParams`), which triggers the `useSearch` hook to re-fire
- `highlight_snippet` from the backend is ts_headline output containing only `<mark>` tags — render via `dangerouslySetInnerHTML` on a container that allows ONLY `<mark>` (use DOMPurify with `ALLOWED_TAGS: ['mark']` on the client, or the backend guarantees only `<mark>` is present per 04-PLAN.md threat T-04-04)
- Do NOT emit `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`/`'self'` (Pivota Preview compatibility)
- Dev server MUST bind to `0.0.0.0:3000`

---

### `src/frontend/hooks/useSearchParams.ts`

Custom hook wrapping React Router's `useSearchParams` to provide typed read/write access to all search URL params.

```typescript
import { useSearchParams as useRouterSearchParams, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
```

---

### `src/frontend/hooks/useSearch.ts`

Custom hook that calls `GET /api/v1/search` with the current filter state.

```typescript
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
    filters.maturity_level.join(','),
    filters.review_status.join(','),
    filters.contributing_office.join(','),
    filters.reuse_potential,
    filters.page,
  ]);

  return state;
}
```

---

### `src/frontend/components/SearchFilterPanel.tsx`

Filter sidebar. Mirrors the catalog filter panel per UX Mockup Screen 01. Uses the same Tailwind classes as CatalogPage's filter panel (import from Wave 4a if that plan ran first, or create independently here — the executor MUST check if `SearchFilterPanel` already exists from Wave 4a before creating a new file, and re-use it if it does).

```typescript
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
```

---

### `src/frontend/components/SearchEmptyState.tsx`

Renders the zero-results empty state and the blank-query prompt per UX Mockup Screen 01 empty state design.

```typescript
import React from 'react';
import { Link } from 'react-router-dom';

interface SearchEmptyStateProps {
  type: 'no-results' | 'blank';
  query?: string;
}

export function SearchEmptyState({ type, query }: SearchEmptyStateProps) {
  if (type === 'blank') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 text-base">Enter a search term to find innovation records.</p>
      </div>
    );
  }

  // no-results state — per UX Mockup Screen 01 empty state
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto space-y-4"
      role="status"
      aria-live="polite"
    >
      <span className="text-5xl" aria-hidden="true">🔍</span>
      <h2 className="text-lg font-semibold text-gray-800">No records found</h2>
      {query && (
        <p className="text-gray-600 text-sm">
          No records found for &ldquo;<strong>{query}</strong>&rdquo;.
        </p>
      )}
      <p className="text-gray-600 text-sm">
        Try different keywords, or let I&amp;R know about this mission problem:
      </p>
      <Link
        to={`/submit-opportunity${query ? `?context=search&q=${encodeURIComponent(query)}` : ''}`}
        className="inline-flex items-center gap-1 bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Submit a mission problem for I&R consideration"
      >
        Submit a Mission Problem for I&amp;R Consideration →
      </Link>
      <hr className="w-full border-gray-200" />
      <p className="text-gray-600 text-sm">You can also browse all published records:</p>
      <Link
        to="/catalog"
        className="text-blue-600 hover:text-blue-800 underline text-sm"
        aria-label="View the Innovation Catalog"
      >
        View Innovation Catalog →
      </Link>
    </div>
  );
}
```

---

### `src/frontend/components/SearchResultCard.tsx`

Renders a single search result card per UX Mockup Screen 01 search result card detail.

**Critical:** `highlight_snippet` from the backend is ts_headline output — it ONLY contains `<mark>` tags (StartSel/StopSel configured server-side per 04-PLAN.md threat T-04-04). Render with DOMPurify on the client allowing only `<mark>`.

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import type { SearchResultCard as SearchResultCardType } from '../hooks/useSearch';

// F9 color system — per UX Mockup overview color table
const MATURITY_BADGE_CLASSES: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-700 border border-gray-300',
  EXPERIMENT_POC: 'bg-amber-100 text-amber-800 border border-amber-300',
  PROTOTYPE_PILOT: 'bg-orange-100 text-orange-800 border border-orange-300',
  PRODUCTION_VALIDATED: 'bg-green-100 text-green-800 border border-green-300',
  ARCHIVED: 'bg-gray-200 text-gray-600 border border-gray-400',
};

const REVIEW_BADGE_CLASSES = 'bg-blue-50 text-blue-700 border border-blue-200';

const ENGAGEMENT_ICONS: Record<string, string> = {
  REQUEST_DEMO: '📋',
  REQUEST_ADOPTION_DISCUSSION: '💬',
  REQUEST_TECHNICAL_GUIDANCE: '🔧',
  REQUEST_BRIEFING: '📊',
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  REQUEST_DEMO: 'Demo Available',
  REQUEST_ADOPTION_DISCUSSION: 'Adoption Discussion Available',
  REQUEST_TECHNICAL_GUIDANCE: 'Technical Guidance Available',
  REQUEST_BRIEFING: 'Briefing Available',
};

interface Props {
  card: SearchResultCardType;
}

export function SearchResultCard({ card }: Props) {
  // Sanitize highlight_snippet: only allow <mark> tags (per T-04-04 cross-wave constraint)
  const safeSnippet = card.highlight_snippet
    ? DOMPurify.sanitize(card.highlight_snippet, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] })
    : null;

  const publishedDate = card.published_at
    ? new Date(card.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
      aria-label={`Search result: ${card.title}`}
    >
      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MATURITY_BADGE_CLASSES[card.maturity_level] ?? MATURITY_BADGE_CLASSES['IDEA']}`}
          aria-label={`Maturity: ${card.maturity_label}`}
        >
          ● {card.maturity_label}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${REVIEW_BADGE_CLASSES}`}
          aria-label={`Review status: ${card.review_status_label}`}
        >
          {card.review_status_label}
        </span>
        {card.is_community_contributed && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
            COMMUNITY
          </span>
        )}
        {card.is_validated_for_reuse && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-300">
            Validated for Reuse ✓
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        <Link
          to={`/records/${card.record_id}`}
          className="hover:text-blue-700 hover:underline focus:outline-none focus:underline"
        >
          {card.title}
        </Link>
      </h2>

      {/* Highlight snippet — query terms in <mark> tags */}
      {safeSnippet ? (
        <p
          className="text-sm text-gray-600 mb-3 leading-relaxed [&_mark]:bg-yellow-100 [&_mark]:font-semibold [&_mark]:not-italic"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeSnippet }}
          aria-label="Search result excerpt with highlighted terms"
        />
      ) : card.short_summary ? (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{card.short_summary}</p>
      ) : null}

      {/* Tags */}
      {(card.mission_area_tags.length > 0 || card.technology_area_tags.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-3" aria-label="Topic tags">
          {card.mission_area_tags.map(tag => (
            <span key={`m-${tag}`} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
          {card.technology_area_tags.map(tag => (
            <span key={`t-${tag}`} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
              🏷 {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement indicators */}
      {card.engagement_options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Available engagement options">
          {card.engagement_options.map(opt => (
            <span key={opt} className="text-xs text-gray-500">
              {ENGAGEMENT_ICONS[opt] ?? '•'} {ENGAGEMENT_LABELS[opt] ?? opt}
            </span>
          ))}
        </div>
      )}

      {/* Footer: date, reuse potential, view link */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex gap-3 text-xs text-gray-400">
          {publishedDate && <span>Published: {publishedDate}</span>}
          {card.reuse_potential && <span>Reuse Potential: {card.reuse_potential.charAt(0) + card.reuse_potential.slice(1).toLowerCase()}</span>}
        </div>
        <Link
          to={`/records/${card.record_id}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:underline"
          aria-label={`View full record: ${card.title}`}
        >
          View →
        </Link>
      </div>
    </article>
  );
}
```

---

### `src/frontend/pages/SearchPage.tsx`

Main page component. Reads URL params, fires search, renders result list, filter panel, states, and pagination. Per UX Mockup Screen 01 layout: left sidebar (filter panel) + main content area (results/states).

```typescript
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
```

**Navigation wiring (no orphan pages rule):** Register `SearchPage` at `/search` in the app router. The global search bar in the app shell header must be wired to navigate to `/search?q={input}` on submit. If the app router file is `src/frontend/App.tsx` (or `src/frontend/router.tsx`), add:

```tsx
<Route path="/search" element={<SearchPage />} />
```

And in the app shell header's search input, on submit:
```tsx
navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
```

If the app shell component does not exist yet (Wave 4a CatalogPage plan 09 creates it), create a minimal `src/frontend/components/AppShell.tsx` with the header search bar and top nav links:
- `[Catalog]` → `/catalog`
- `[Submit a Mission Problem]` → `/submit-opportunity`
- `[Share Your Innovation Work]` → `/share-innovation`
- Global search input that navigates to `/search?q=...`

Install DOMPurify if not already present: `npm install dompurify && npm install --save-dev @types/dompurify`
  </action>
  <verify>
```bash
ls src/frontend/pages/SearchPage.tsx \
   src/frontend/components/SearchResultCard.tsx \
   src/frontend/components/SearchFilterPanel.tsx \
   src/frontend/components/SearchEmptyState.tsx \
   src/frontend/hooks/useSearchParams.ts \
   src/frontend/hooks/useSearch.ts && echo "FILES_EXIST_OK" && \
grep -n "export function SearchPage\|export.*SearchPage" src/frontend/pages/SearchPage.tsx && echo "SEARCHPAGE_EXPORTED" && \
grep -n "highlight_snippet" src/frontend/components/SearchResultCard.tsx && echo "HIGHLIGHT_SNIPPET_OK" && \
grep -n "dangerouslySetInnerHTML\|DOMPurify" src/frontend/components/SearchResultCard.tsx && echo "SAFE_RENDER_OK" && \
grep -n "EXPERIMENT_POC\|PROTOTYPE_PILOT\|PRODUCTION_VALIDATED" src/frontend/components/SearchResultCard.tsx && echo "MATURITY_BADGES_OK" && \
grep -n "maturity_level\|review_status\|reuse_potential" src/frontend/components/SearchFilterPanel.tsx && echo "FILTER_CONTROLS_OK" && \
grep -n "submit-opportunity\|catalog" src/frontend/components/SearchEmptyState.tsx && echo "EMPTY_STATE_CTAS_OK" && \
grep -n "useSearchParams\|setFilters" src/frontend/hooks/useSearchParams.ts && echo "URL_STATE_HOOK_OK" && \
grep -n "useSearch\|/api/v1/search" src/frontend/hooks/useSearch.ts && echo "SEARCH_HOOK_OK" && \
grep -n "QUERY_TOO_LONG\|SEARCH_UNAVAILABLE" src/frontend/hooks/useSearch.ts && echo "ERROR_STATES_OK" && \
grep -rn "SearchPage\|/search" src/frontend/App.tsx 2>/dev/null || grep -rn "SearchPage" src/frontend/ | grep -v "SearchPage.tsx" | head -3 && echo "ROUTE_WIRED_OK" && \
echo CONTRACT_OK
```
  </verify>
  <done>
- `src/frontend/pages/SearchPage.tsx` exports `SearchPage` component wired at `/search` route
- `src/frontend/components/SearchResultCard.tsx` renders maturity badge (color-coded per F9: amber=EXPERIMENT_POC, orange=PROTOTYPE_PILOT, green=PRODUCTION_VALIDATED, gray=IDEA/ARCHIVED), review status badge, tags, engagement indicators, and `highlight_snippet` via DOMPurify-sanitized `dangerouslySetInnerHTML` allowing only `<mark>` tags
- `src/frontend/components/SearchFilterPanel.tsx` renders maturity (5 checkboxes), review status (7 checkboxes), and reuse_potential (radio) filter controls
- `src/frontend/components/SearchEmptyState.tsx` renders blank-query prompt and zero-results state with CTA links to `/submit-opportunity` and `/catalog`
- `src/frontend/hooks/useSearchParams.ts` reads/writes `q`, `maturity_level[]`, `review_status[]`, `contributing_office[]`, `reuse_potential`, `page` from/to URL
- `src/frontend/hooks/useSearch.ts` calls `GET /api/v1/search`, handles all states: idle, loading, blank, results, empty, error (QUERY_TOO_LONG / SEARCH_UNAVAILABLE / UNKNOWN)
- SearchPage is reachable via global search bar in app shell header (no orphan — wired into nav)
- All filter changes update URL; URL is bookmarkable per US-1.2 acceptance criteria
  </done>
</task>

<task type="auto">
  <name>Task 2: Playwright e2e tests for SearchPage</name>
  <files>
    e2e/search-page.spec.ts
  </files>
  <action>
Create `e2e/search-page.spec.ts` with Playwright tests covering all Search page states and interactions per UX Mockup Screen 01, User Stories US-1.1, US-1.2, US-1.3.

**Pre-condition:** The app must be running at `http://localhost:3000` with the backend and database available (docker-compose up + Wave 1 migrations applied + at least one PUBLISHED record seeded with FTS-searchable content). If no seed data exists yet, use a test-specific seed via the API within the test or rely on Wave 7 (07-PLAN.md) for full integration with seeded data. For this plan's standalone tests, mock the API at the network level using `page.route()` to avoid dependency on a seeded database.

```typescript
import { test, expect, Page } from '@playwright/test';

// Mock response for successful search — matches SearchResultCard shape from 04-PLAN.md
const MOCK_SEARCH_RESULT = {
  record_id: 'test-record-001',
  title: 'Audio Security Proof of Concept',
  short_summary: 'Explores GPU/CPU audio separation in Azure Government Cloud.',
  maturity_level: 'EXPERIMENT_POC',
  maturity_label: 'Experiment / POC',
  review_status: 'CURATED',
  review_status_label: 'Curated',
  reuse_potential: 'MEDIUM',
  source_type: 'I_AND_R',
  mission_area_tags: ['Cybersecurity', 'Court Operations'],
  technology_area_tags: ['Cloud Infrastructure'],
  engagement_options: ['REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION'],
  is_validated_for_reuse: false,
  is_community_contributed: false,
  published_at: '2026-07-01T00:00:00.000Z',
  relevance_score: 0.92,
  highlight_snippet: 'Explores <mark>audio</mark> <mark>security</mark> in cloud environments.',
};

const MOCK_PAGINATION = { page: 1, page_size: 12, total_count: 1, total_pages: 1 };

async function mockSearchSuccess(page: Page, results = [MOCK_SEARCH_RESULT]) {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: results, pagination: MOCK_PAGINATION }),
    });
  });
}

async function mockSearchEmpty(page: Page, query = 'xyzzy') {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
        message: `No records found for '${query}'. Try different keywords, or submit a mission problem.`,
      }),
    });
  });
}

async function mockSearch503(page: Page) {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable. Try browsing the catalog.' } }),
    });
  });
}

// ── Happy path ──────────────────────────────────────────────────────────────

test('Search page renders result cards for a valid query', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Query echo in page header
  await expect(page.getByText(/search results for/i)).toBeVisible();
  await expect(page.getByText('audio security')).toBeVisible();

  // Result count
  await expect(page.getByText(/1 record found/i)).toBeVisible();

  // Result card
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByText('Audio Security Proof of Concept')).toBeVisible();
});

test('Result card displays maturity badge with correct label', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Maturity badge (EXPERIMENT_POC → 'Experiment / POC')
  await expect(page.getByText('● Experiment / POC')).toBeVisible();
});

test('Result card displays review status badge', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  await expect(page.getByText('Curated')).toBeVisible();
});

test('Result card renders highlight_snippet with <mark> tags as bold text', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // The highlight snippet contains <mark>audio</mark> — Playwright can detect the <mark> element
  const markEl = page.locator('mark').first();
  await expect(markEl).toBeVisible();
  // The <mark> element should contain one of the query terms
  const markText = await markEl.textContent();
  expect(['audio', 'security']).toContain(markText?.toLowerCase());
});

test('Result card "View →" link navigates to /records/{id}', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  const viewLink = page.getByRole('link', { name: /view →/i }).first();
  await expect(viewLink).toBeVisible();
  await expect(viewLink).toHaveAttribute('href', /records\/test-record-001/);
});

// ── Blank query ──────────────────────────────────────────────────────────────

test('Blank query on /search shows "Enter a search term" prompt', async ({ page }) => {
  await page.goto('/search?q=');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
  // No result cards rendered
  await expect(page.locator('[role="article"]')).toHaveCount(0);
});

test('Whitespace-only query shows blank query prompt', async ({ page }) => {
  await page.goto('/search?q=   ');

  await expect(page.getByText(/enter a search term/i)).toBeVisible();
});

// ── Query too long ────────────────────────────────────────────────────────────

test('Query > 500 chars shows inline error message', async ({ page }) => {
  const longQuery = 'a'.repeat(501);
  await page.goto(`/search?q=${longQuery}`);

  await expect(page.getByText(/search query is too long/i)).toBeVisible();
  await expect(page.locator('[role="article"]')).toHaveCount(0);
});

// ── Zero results ──────────────────────────────────────────────────────────────

test('Zero results renders empty state with CTA to /submit-opportunity', async ({ page }) => {
  await mockSearchEmpty(page, 'remote hearing scheduling');
  await page.goto('/search?q=remote+hearing+scheduling');

  await expect(page.getByText(/no records found/i)).toBeVisible();

  // CTA link to submit-opportunity
  const ctaLink = page.getByRole('link', { name: /submit a mission problem/i });
  await expect(ctaLink).toBeVisible();
  await expect(ctaLink).toHaveAttribute('href', /submit-opportunity/);
});

test('Zero results empty state includes secondary link to /catalog', async ({ page }) => {
  await mockSearchEmpty(page, 'xyzzy');
  await page.goto('/search?q=xyzzy');

  const catalogLink = page.getByRole('link', { name: /view innovation catalog/i });
  await expect(catalogLink).toBeVisible();
  await expect(catalogLink).toHaveAttribute('href', /catalog/);
});

// ── Filters ──────────────────────────────────────────────────────────────────

test('Filter panel is visible on search results page', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Filter panel heading
  await expect(page.getByRole('heading', { name: /refine results/i })).toBeVisible();

  // Maturity checkboxes
  await expect(page.getByRole('checkbox', { name: /experiment.*poc/i })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /prototype.*pilot/i })).toBeVisible();

  // Reuse potential radio
  await expect(page.getByRole('radio', { name: /high/i })).toBeVisible();
});

test('Checking a maturity filter updates the URL', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security');

  // Check the "Experiment / POC" checkbox
  await page.getByRole('checkbox', { name: /experiment.*poc/i }).check();

  // URL should now contain maturity_level=EXPERIMENT_POC
  await expect(page).toHaveURL(/maturity_level=EXPERIMENT_POC/);
});

test('Active filter chip is visible when filter applied', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Active filter chip with the value
  await expect(page.getByText('EXPERIMENT_POC').first()).toBeVisible();

  // Clear all filters button
  await expect(page.getByRole('button', { name: /clear all filters/i })).toBeVisible();
});

test('Removing a filter chip updates URL and removes the chip', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/search?q=audio+security&maturity_level=EXPERIMENT_POC');

  // Click the × on the chip
  await page.getByRole('button', { name: /remove maturity filter.*experiment_poc/i }).click();

  // maturity_level no longer in URL
  await expect(page).not.toHaveURL(/maturity_level/);
});

// ── 503 error ────────────────────────────────────────────────────────────────

test('503 from search API shows unavailability error banner', async ({ page }) => {
  await mockSearch503(page);
  await page.goto('/search?q=audio+security');

  await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
  // Catalog fallback link
  await expect(page.getByRole('link', { name: /browsing the catalog/i })).toBeVisible();
});

// ── Navigation: reachable from app shell search bar ──────────────────────────

test('Global search bar in app shell navigates to /search?q=...', async ({ page }) => {
  await mockSearchSuccess(page);
  await page.goto('/catalog');

  // Locate the global search bar in the header
  const searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"], input[placeholder*="search" i]')).first();
  await expect(searchInput).toBeVisible();

  await searchInput.fill('audio security');
  await searchInput.press('Enter');

  // Should navigate to search page with q= param
  await expect(page).toHaveURL(/\/search\?q=audio/);
});

// ── Pagination ────────────────────────────────────────────────────────────────

test('Pagination controls are shown when total_pages > 1', async ({ page }) => {
  // Mock multi-page response
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [MOCK_SEARCH_RESULT],
        pagination: { page: 1, page_size: 12, total_count: 25, total_pages: 3 },
      }),
    });
  });

  await page.goto('/search?q=audio');

  const nav = page.getByRole('navigation', { name: /pagination/i });
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
});

test('Clicking page 2 updates URL with page=2', async ({ page }) => {
  await page.route('**/api/v1/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [MOCK_SEARCH_RESULT],
        pagination: { page: 1, page_size: 12, total_count: 25, total_pages: 3 },
      }),
    });
  });

  await page.goto('/search?q=audio');
  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect(page).toHaveURL(/page=2/);
});
```

**Running the tests:**
```bash
npx playwright test e2e/search-page.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```

Ensure `playwright.config.ts` has `baseURL: 'http://localhost:3000'` and the dev server is running before executing.
  </action>
  <verify>
```bash
ls e2e/search-page.spec.ts && echo "TEST_FILE_EXISTS" && \
grep -c "^test(" e2e/search-page.spec.ts && echo "TEST_COUNT_OK" && \
grep -n "highlight_snippet\|<mark>" e2e/search-page.spec.ts && echo "HIGHLIGHT_TESTED" && \
grep -n "no records found\|empty" e2e/search-page.spec.ts && echo "EMPTY_STATE_TESTED" && \
grep -n "submit-opportunity" e2e/search-page.spec.ts && echo "CTA_LINK_TESTED" && \
grep -n "maturity_level\|filter" e2e/search-page.spec.ts && echo "FILTER_TESTED" && \
grep -n "QUERY_TOO_LONG\|too long" e2e/search-page.spec.ts && echo "QUERY_TOO_LONG_TESTED" && \
grep -n "503\|SEARCH_UNAVAILABLE\|temporarily unavailable" e2e/search-page.spec.ts && echo "503_TESTED" && \
grep -n "page.*goto.*catalog\|search bar\|global search" e2e/search-page.spec.ts && echo "NAV_REACHABILITY_TESTED" && \
npx playwright test e2e/search-page.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `e2e/search-page.spec.ts` exists with a Playwright test suite
- Tests cover all required behaviors:
  - Valid query renders result cards with maturity badge (correct label), review status badge, `highlight_snippet` with `<mark>` tags rendered as styled text
  - Result card "View →" link points to `/records/{id}`
  - Blank/whitespace query shows "Enter a search term" prompt; no result cards
  - Query > 500 chars shows inline error without result cards
  - Zero-results renders empty state with CTA link to `/submit-opportunity` and secondary link to `/catalog`
  - Filter panel visible on results page; checking a filter updates the URL
  - Active filter chips shown when filter applied; clicking × removes chip and updates URL
  - 503 API response shows unavailability error banner with catalog fallback link
  - Global search bar in app shell header navigates to `/search?q=...`
  - Pagination controls visible when total_pages > 1; clicking page N updates URL
- All tests use `page.route()` mocks to avoid dependency on seeded database (Wave 7 provides real integration)
- `npx playwright test e2e/search-page.spec.ts --reporter=list` passes with 0 failing tests
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user→SearchPage | User-supplied query string and filter values from URL params entering the React component and being reflected in the page |
| API response→DOM | `highlight_snippet` from `GET /api/v1/search` (containing backend-generated `<mark>` HTML) crossing from API response into DOM via `dangerouslySetInnerHTML` |
| SearchPage→API | User-controlled `q` and filter params crossing from React state into `fetch()` calls to `GET /api/v1/search` |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-10-01 | Tampering / XSS | `SearchResultCard.tsx` — `highlight_snippet` rendered via `dangerouslySetInnerHTML` | mitigate | `highlight_snippet` is the output of PostgreSQL `ts_headline` configured with `StartSel=<mark>` and `StopSel=</mark>` (server-side in `SearchService.ts`). The client sanitizes the value with `DOMPurify.sanitize(snippet, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] })` before setting `dangerouslySetInnerHTML`. This limits the injectable surface to only `<mark>` elements with no attributes — `<mark>` has no event handlers and no src/href attributes, making script injection impossible. |
| T-10-02 | Information Disclosure | `SearchPage` URL state — query and filter values reflected in `document.title` and page headers | mitigate | User-supplied query string is rendered via React's text interpolation (`{query}`) in page headers, NOT via `dangerouslySetInnerHTML`. React automatically HTML-escapes text content, preventing reflected XSS via the query echo display. |
| T-10-03 | Tampering | `useSearch` hook — URL params passed directly to `fetch()` as query string | mitigate | URL params are read via React Router's `useSearchParams()` (typed string values) and appended to `URLSearchParams` via the API (`params.set('q', q)`, `params.append()`). `URLSearchParams` percent-encodes all values before they become the query string — no raw string interpolation into the fetch URL. The backend additionally validates and sanitizes `q` via `SearchIndexService.buildQuery()`. |
| T-10-04 | Denial of Service | `useSearch` hook — rapid filter changes trigger many concurrent `fetch()` calls | mitigate | `useSearch` uses `AbortController` to cancel the in-flight request before firing a new one when the `useEffect` dependency array changes. The cleanup function calls `controller.abort()`, preventing response races and limiting concurrent requests to one at a time. |
| T-10-05 | Information Disclosure | `SearchEmptyState` — query string echoed in CTA URL `/submit-opportunity?context=search&q={query}` | mitigate | The query is passed to React Router `<Link to=...>` using `encodeURIComponent(query)` in the href, not via `dangerouslySetInnerHTML`. The submission form (Wave 5) will read and display this value through React text interpolation, not raw HTML injection. |
| T-10-06 | Spoofing | Maturity badges — frontend label/color derived from `maturity_level` API field | accept | The maturity label and color class are determined server-side (`maturity_label` from the API response) and client-side only for the CSS class lookup table. If a malformed `maturity_level` is returned (not in the 5-value enum), the badge falls back to the `IDEA` gray class — no security boundary is crossed. The backend enforces CHECK constraints on `maturity_level`; residual risk owned by the API contract. |
</threat_model>

<verification>
After both tasks complete:

1. Verify all source files exist:
   ```bash
   ls src/frontend/pages/SearchPage.tsx \
      src/frontend/components/SearchResultCard.tsx \
      src/frontend/components/SearchFilterPanel.tsx \
      src/frontend/components/SearchEmptyState.tsx \
      src/frontend/hooks/useSearchParams.ts \
      src/frontend/hooks/useSearch.ts \
      e2e/search-page.spec.ts && echo "ALL_FILES_OK"
   ```

2. Verify highlight snippet safety (DOMPurify present):
   ```bash
   grep -n "DOMPurify\|ALLOWED_TAGS.*mark" src/frontend/components/SearchResultCard.tsx && echo "HIGHLIGHT_SAFETY_OK"
   ```

3. Verify F9 maturity color classes all present:
   ```bash
   grep -n "EXPERIMENT_POC\|PROTOTYPE_PILOT\|PRODUCTION_VALIDATED\|IDEA\|ARCHIVED" src/frontend/components/SearchResultCard.tsx && echo "F9_BADGES_OK"
   ```

4. Verify URL state management covers all params:
   ```bash
   grep -n "maturity_level\|review_status\|reuse_potential\|page" src/frontend/hooks/useSearchParams.ts && echo "URL_STATE_OK"
   ```

5. Verify search hook handles all states:
   ```bash
   grep -n "blank\|empty\|loading\|QUERY_TOO_LONG\|SEARCH_UNAVAILABLE" src/frontend/hooks/useSearch.ts && echo "SEARCH_STATES_OK"
   ```

6. Verify SearchPage is wired into router:
   ```bash
   grep -rn "SearchPage\|/search" src/frontend/App.tsx 2>/dev/null || grep -rn "SearchPage" src/frontend/ | grep -v "SearchPage.tsx" | head -3 && echo "ROUTE_WIRED_OK"
   ```

7. Verify empty state CTAs point to correct routes:
   ```bash
   grep -n "submit-opportunity\|/catalog" src/frontend/components/SearchEmptyState.tsx && echo "EMPTY_STATE_CTAS_OK"
   ```

8. Run Playwright tests:
   ```bash
   npx playwright test e2e/search-page.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
   ```
</verification>

<success_criteria>
- Navigating to `/search?q=audio+security` renders result cards with title, maturity badge (amber for EXPERIMENT_POC per F9 color system), review status badge, query-term highlights in `<mark>` elements, tags, and engagement indicators
- Blank query at `/search?q=` shows "Enter a search term to find innovation records." prompt with no cards (US-1.3)
- Query > 500 chars shows inline error "Your search query is too long. Please shorten it to 500 characters or fewer." (US-1.3)
- Zero results renders empty state with "Submit a Mission Problem for I&R Consideration →" CTA and "View Innovation Catalog →" secondary link (US-1.3)
- Checking a filter checkbox updates the URL immediately (US-1.2 — filter state reflected in URL)
- Active filter chips appear above results when filters active; clicking × removes the filter and updates URL (US-1.2)
- 503 from backend shows unavailability banner with catalog fallback link (Screen 01 States table)
- SearchPage is reachable from the global search bar in the app shell header (nav map invariant — no orphan page)
- `dangerouslySetInnerHTML` usage is scoped to DOMPurify-sanitized `<mark>` output only (T-10-01 mitigation)
- All Playwright tests in `e2e/search-page.spec.ts` pass with 0 failing, 0 skipped
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/10-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (DOMPurify approach for highlight_snippet, URL-as-state-source-of-truth pattern, mock-based Playwright tests)
- Integration contract summary for Wave 7 (SearchPage route at /search, SearchResultCard component, e2e test suite consumed by Wave 7b full suite)
- Any deviations from the plan and rationale
</output>
