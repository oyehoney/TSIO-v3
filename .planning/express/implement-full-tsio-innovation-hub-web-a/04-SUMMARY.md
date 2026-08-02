---
phase: implement-full-tsio-innovation-hub-web-a
plan: "04"
subsystem: SearchService + SearchIndexService (F1 backend)
tags: [search, postgresql, fts, tsvector, ts_rank, ts_headline, nodejs]

dependency_graph:
  requires:
    - "01-PLAN: innovation_records table with search_vector TSVECTOR, GIN index, FTS triggers"
    - "02-PLAN: docker-compose.yml with postgres:16"
    - "03-PLAN: src/app.js Express factory, pg Pool, /api/v1 router"
  provides:
    - "src/services/SearchService.ts — search(pool, query, filters, pagination) with plainto_tsquery + ts_rank + ts_headline"
    - "src/services/SearchIndexService.ts — index maintenance utilities"
    - "src/routes/search.ts — GET /api/v1/search Express router"
    - "SearchService scopes to publication_state='PUBLISHED' for PUBLIC role"
    - "Query sanitization: HTML strip + parameterized (no interpolation)"
    - "Empty/blank query: returns 200 with prompt, no FTS executed"
    - "Query > 500 chars: returns 400 QUERY_TOO_LONG"
  affects:
    - "04-PLAN (CatalogPage, Wave 4): consumes GET /api/v1/search"
    - "Wave 4 SearchPage: consumes ts_headline highlight snippets"

tech_stack:
  added:
    - "TypeScript (search.ts uses TS; rest of project uses CJS)"
    - "plainto_tsquery for FTS (handles natural language without operator syntax)"
    - "ts_rank for relevance scoring"
    - "ts_headline for query-term highlighted snippets"
  patterns:
    - "Weighted tsvector already built by Phase 1 triggers (A=problem_statement/key_findings, B=title/outcome/explored, C=tags/summary)"
    - "Role-scoped queries: PUBLIC=PUBLISHED only, CURATOR=all states"
    - "Parameterized pg queries throughout (no SQL string interpolation)"

key_files:
  created:
    - path: "src/services/SearchService.ts"
      purpose: "FTS search with plainto_tsquery, ts_rank ranking, ts_headline snippets, filter application, pagination"
    - path: "src/services/SearchIndexService.ts"
      purpose: "Search index utilities — verify index exists, rebuild trigger"
    - path: "src/routes/search.ts"
      purpose: "GET /api/v1/search router with Zod input validation"

commits:
  - hash: "24db725"
    message: "feat(implement-full-tsio-innovation-hub-web-a-04): implement SearchService, SearchIndexService, types, and route wiring"
