---
phase: implement-full-tsio-innovation-hub-web-a
plan: "04"
subsystem: SearchService backend API
tags: [search, fts, typescript, express, nodejs, postgresql, plainto_tsquery]

dependency_graph:
  requires:
    - "01-PLAN: innovation_records table with search_vector (GIN index)"
    - "02-PLAN: docker-compose.yml"
  provides:
    - "src/services/SearchService.ts — full PG FTS search with relevance_score and highlight_snippet"
    - "src/services/SearchIndexService.ts — query sanitization and plainto_tsquery builder"
    - "src/handlers/SearchHandler.ts — HTTP handler for GET /api/v1/search"
    - "src/routes/search.ts — Express router"
    - "src/types/search.ts — TypeScript interfaces"
    - "tests/integration/search.test.ts — integration tests"
  affects:
    - "Wave 4 SearchPage frontend — consumes GET /api/v1/search"

tech_stack:
  added:
    - "TypeScript 5.x (strict mode)"
    - "Knex query builder (used by SearchService for typed query building)"
  patterns:
    - "plainto_tsquery for safe FTS query parameterization (prevents FTS injection)"
    - "ts_rank for relevance scoring"
    - "ts_headline for query-term highlight snippets"
    - "Publication scope guard enforced at query layer (not just UI)"

key_files:
  created:
    - src/services/SearchService.ts
    - src/services/SearchIndexService.ts
    - src/handlers/SearchHandler.ts
    - src/routes/search.ts
    - src/types/search.ts
    - tests/integration/search.test.ts
  modified: []

decisions:
  - "TypeScript strict mode for SearchService — provides type safety for complex SearchResultCard shape"
  - "plainto_tsquery (not to_tsquery) — handles raw user input without requiring tsquery syntax knowledge"
  - "CURATOR role sees all publication states; PUBLIC role scoped to PUBLISHED only"
  - "Blank/whitespace query returns 200 with guidance message (not 400) per FRD F01"
  - "Query > 500 chars returns 400 QUERY_TOO_LONG"
  - "503 SEARCH_UNAVAILABLE on DB errors"

metrics:
  duration_minutes: 15
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 0
  completed_date: "2026-07-31"
---

# Phase implement-full-tsio-innovation-hub-web-a Plan 04: SearchService Backend Summary

**One-liner:** TypeScript SearchService with PostgreSQL plainto_tsquery FTS, ts_rank relevance scoring, ts_headline highlights, publication scope guard, and 19-case integration test suite.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | SearchService + SearchIndexService + SearchHandler + routes + types | f4e95b3 | ✅ Complete |
| 2 | Integration tests for GET /api/v1/search | f4e95b3 | ✅ Complete |

## Files Created

| File | Purpose |
|------|---------|
| `src/services/SearchService.ts` | FTS search execution: plainto_tsquery, ts_rank, ts_headline, pagination |
| `src/services/SearchIndexService.ts` | Query sanitization: HTML strip, plainto_tsquery-safe string builder |
| `src/handlers/SearchHandler.ts` | HTTP layer: query param validation, delegation to SearchService |
| `src/routes/search.ts` | Express router: GET /api/v1/search |
| `src/types/search.ts` | TypeScript interfaces: SearchQueryParams, SearchResultCard, PaginatedSearchResponse |
| `tests/integration/search.test.ts` | Integration tests: happy path, empty results, blank query, QUERY_TOO_LONG, scope guard |

## Key Implementation Details

### Publication Scope Guard
```typescript
// PUBLIC (unauthenticated): scoped to PUBLISHED records only
if (role !== 'CURATOR') {
  conditions.push(`ir.publication_state = 'PUBLISHED'`);
}
// CURATOR: sees all publication states (all_states = true)
```

### FTS Query Pattern
```sql
SELECT ir.*, ts_rank(ir.search_vector, query) AS relevance_score,
       ts_headline('english', ir.problem_statement, query) AS highlight_snippet
  FROM innovation_records ir,
       plainto_tsquery('english', $1) query
 WHERE ir.search_vector @@ query
   AND ir.publication_state = 'PUBLISHED'
   AND ir.deleted_at IS NULL
 ORDER BY relevance_score DESC, ir.published_at DESC
 LIMIT $2 OFFSET $3
```

### Query Validation
- Blank/whitespace → 200 with `{ data: [], guidance: "Enter a search term..." }`
- > 500 chars → 400 `QUERY_TOO_LONG`
- DB error → 503 `SEARCH_UNAVAILABLE`

## Deviations from Plan

None — plan executed exactly as written. Code is part of the pivota-auto workspace commit (f4e95b3).

## Self-Check: PASSED

- ✅ `src/services/SearchService.ts` exists (235 lines)
- ✅ `src/services/SearchIndexService.ts` exists (53 lines)
- ✅ `src/handlers/SearchHandler.ts` exists (157 lines)
- ✅ `src/routes/search.ts` exists
- ✅ `src/types/search.ts` exists
- ✅ `tests/integration/search.test.ts` exists (443 lines)
- ✅ plainto_tsquery used (no raw string interpolation in FTS)
- ✅ Publication scope guard present
