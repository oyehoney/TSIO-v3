---
phase: implement-full-tsio-innovation-hub-web-a
plan: 04
type: execute
wave: 2
depends_on: [1]
files_modified:
  - src/services/SearchService.ts
  - src/services/SearchIndexService.ts
  - src/handlers/SearchHandler.ts
  - src/routes/search.ts
  - src/types/search.ts
  - tests/integration/search.test.ts
autonomous: true

features:
  implements: ["F1", "F9"]
  depends_on: ["F0", "F2", "F9"]
  enables: ["F1"]

must_haves:
  truths:
    - "GET /api/v1/search?q=audio+security returns 200 with a paginated SearchResultCard[] response including relevance_score and highlight_snippet fields"
    - "Search results are scoped to publication_state = PUBLISHED AND deleted_at IS NULL for PUBLIC (unauthenticated) requests"
    - "CURATOR-authenticated requests return results across ALL publication states with publication_state field on each card"
    - "Field weights are honored: problem_statement and key_findings (weight A, 3×) rank above title, what_was_explored, outcome_summary (weight B, 2×) rank above others (weight C, 1×)"
    - "Query sanitization: HTML tags stripped and query is parameterized via plainto_tsquery before hitting PostgreSQL — no raw string interpolation in FTS query"
    - "Filters maturity_level, review_status, contributing_office, reuse_potential apply correctly as AND predicates on top of FTS results"
    - "page and page_size validated: page defaults to 1, page_size defaults to 12, max 50; out-of-range values clamped/defaulted"
    - "q must be 1–500 characters; blank/whitespace returns 200 with guidance message body (no search executed); >500 chars returns 400 QUERY_TOO_LONG"
    - "Empty result set returns 200 with empty data array and guidance message; search index unavailability returns 503 SEARCH_UNAVAILABLE"
    - "Integration tests pass: happy path with results, empty result, blank query, query-too-long, publication scope guard (PUBLIC vs CURATOR), filter application"
  artifacts:
    - path: "src/services/SearchService.ts"
      provides: "SearchService.search(params, role) — executes parameterized PG FTS query, applies filters, returns SearchResultCard[] with relevance_score and highlight_snippet"
      exports: ["SearchService", "SearchParams", "SearchResult"]
    - path: "src/services/SearchIndexService.ts"
      provides: "SearchIndexService.buildQuery(q) — sanitizes and converts raw query string to plainto_tsquery-safe input; rebuildVectorForRecord(recordId) for manual refresh"
      exports: ["SearchIndexService"]
    - path: "src/handlers/SearchHandler.ts"
      provides: "SearchHandler.handleSearch(req, res) — parses and validates query params, delegates to SearchService, returns JSON response per TechArch API contract"
      exports: ["SearchHandler"]
    - path: "src/routes/search.ts"
      provides: "Express router mounting GET /api/v1/search to SearchHandler.handleSearch"
      exports: ["searchRouter"]
    - path: "src/types/search.ts"
      provides: "TypeScript interfaces: SearchQueryParams, SearchResultCard (extends CatalogCard), PaginatedSearchResponse"
      exports: ["SearchQueryParams", "SearchResultCard", "PaginatedSearchResponse"]
    - path: "tests/integration/search.test.ts"
      provides: "Jest + Supertest integration tests for GET /api/v1/search"
      exports: ["search integration test suite"]
  key_links:
    - from: "SearchHandler"
      to: "SearchService.search()"
      via: "handler delegates validated params to service, receives SearchResultCard[]"
      pattern: "SearchService.*search"
    - from: "SearchService"
      to: "innovation_records.search_vector"
      via: "WHERE search_vector @@ plainto_tsquery('english', $1) AND publication_state = 'PUBLISHED' AND deleted_at IS NULL"
      pattern: "plainto_tsquery"
    - from: "SearchService"
      to: "ts_rank / ts_headline"
      via: "ts_rank(search_vector, query) AS relevance_score and ts_headline(problem_statement, query) AS highlight_snippet"
      pattern: "ts_rank|ts_headline"
    - from: "SearchIndexService.buildQuery"
      to: "SearchService"
      via: "sanitized query string passed to plainto_tsquery parameterized binding"
      pattern: "buildQuery|sanitize"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/migrations/001_core_content_tables.sql"
      exports:
        - "TABLE innovation_records WITH search_vector TSVECTOR column"
        - "INDEX idx_innovation_records_fts USING GIN(search_vector)"
        - "TRIGGER trg_innovation_record_fts (BEFORE INSERT OR UPDATE on innovation_records)"
        - "TRIGGER trg_findings_update_fts (AFTER INSERT OR UPDATE OR DELETE on record_key_findings)"
        - "TRIGGER trg_tags_update_fts (AFTER INSERT OR UPDATE OR DELETE on record_tags)"
        - "Partial index idx_innovation_records_publication_state WHERE deleted_at IS NULL"
        - "Columns: publication_state, maturity_level, review_status, reuse_potential, source_type, contributing_office, deleted_at"
      verify: "grep -n 'idx_innovation_records_fts' db/migrations/001_core_content_tables.sql && grep -n 'trg_innovation_record_fts' db/migrations/001_core_content_tables.sql && grep -n 'trg_findings_update_fts' db/migrations/001_core_content_tables.sql && grep -n 'plainto_tsquery\\|TSVECTOR\\|search_vector' db/migrations/001_core_content_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports:
        - "TABLE users (user_id UUID PK, role VARCHAR(20) CHECK IN ('CURATOR','ADMIN'))"
        - "docker-compose.yml with postgres:16 healthcheck for running the test DB"
      verify: "grep -n 'CREATE TABLE users' db/migrations/002_supporting_tables.sql && grep -n 'postgres:16' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK"
  provides:
    - artifact: "src/services/SearchService.ts"
      exports:
        - "SearchService class with method: search(params: SearchQueryParams, role: 'PUBLIC' | 'CURATOR', db: Knex): Promise<PaginatedSearchResponse>"
      shape: |
        interface SearchQueryParams {
          q: string;                         // 1–500 chars; required
          maturity_level?: MaturityLevel | MaturityLevel[];
          review_status?: ReviewStatus | ReviewStatus[];
          contributing_office?: string | string[];
          reuse_potential?: ReusePotential;
          page?: number;                     // default 1
          page_size?: number;               // default 12, max 50
        }

        interface SearchResultCard extends CatalogCard {
          relevance_score: number;
          highlight_snippet: string | null;  // ts_headline excerpt from problem_statement or short_summary
        }

        interface PaginatedSearchResponse {
          data: SearchResultCard[];
          pagination: { page: number; page_size: number; total_count: number; total_pages: number; };
        }

        // Core FTS query used by SearchService:
        // SELECT ir.*, ts_rank(ir.search_vector, query) AS relevance_score,
        //        ts_headline('english', ir.problem_statement, query) AS highlight_snippet
        //   FROM innovation_records ir,
        //        plainto_tsquery('english', $1) query
        //  WHERE ir.search_vector @@ query
        //    AND ir.publication_state = 'PUBLISHED'   -- PUBLIC scope
        //    AND ir.deleted_at IS NULL
        //  ORDER BY relevance_score DESC, ir.published_at DESC
        //  LIMIT $2 OFFSET $3
      verify: "grep -n 'class SearchService\\|export.*SearchService' src/services/SearchService.ts && grep -n 'plainto_tsquery' src/services/SearchService.ts && grep -n 'ts_rank' src/services/SearchService.ts && grep -n 'ts_headline' src/services/SearchService.ts && echo CONTRACT_OK"
    - artifact: "src/handlers/SearchHandler.ts"
      exports:
        - "SearchHandler class with method: handleSearch(req: Request, res: Response): Promise<void>"
        - "GET /api/v1/search handler wired in src/routes/search.ts"
      shape: |
        // GET /api/v1/search
        // Query params: q (required, 1–500 chars), maturity_level, review_status,
        //               contributing_office, reuse_potential, page, page_size
        //
        // Response 200 (results found):
        // { "data": SearchResultCard[], "pagination": { page, page_size, total_count, total_pages } }
        //
        // Response 200 (blank query — no search executed):
        // { "message": "Enter a search term to find innovation records.", "data": [] }
        //
        // Response 200 (zero results for valid query):
        // { "data": [], "pagination": {...}, "message": "No records found for '...'. Try different keywords, or submit a mission problem." }
        //
        // Response 400: { "error": { "code": "QUERY_TOO_LONG", "message": "Your search query is too long..." } }
        // Response 503: { "error": { "code": "SEARCH_UNAVAILABLE", "message": "Search is temporarily unavailable. Try browsing the catalog." } }
      verify: "grep -n 'class SearchHandler\\|export.*SearchHandler' src/handlers/SearchHandler.ts && grep -n 'handleSearch' src/handlers/SearchHandler.ts && grep -n 'QUERY_TOO_LONG\\|SEARCH_UNAVAILABLE' src/handlers/SearchHandler.ts && echo CONTRACT_OK"
    - artifact: "src/types/search.ts"
      exports:
        - "SearchQueryParams interface"
        - "SearchResultCard interface (extends CatalogCard)"
        - "PaginatedSearchResponse interface"
      shape: |
        // All types exported from src/types/search.ts
        // Wave 4 frontend SearchPage and Wave 7 integration tests consume these types directly
        export interface SearchQueryParams { ... }
        export interface SearchResultCard extends CatalogCard { relevance_score: number; highlight_snippet: string | null; }
        export interface PaginatedSearchResponse { data: SearchResultCard[]; pagination: Pagination; }
      verify: "grep -n 'export interface SearchQueryParams\\|export interface SearchResultCard\\|export interface PaginatedSearchResponse' src/types/search.ts && echo CONTRACT_OK"
    - artifact: "tests/integration/search.test.ts"
      exports:
        - "Integration test suite proving GET /api/v1/search honors publication scope, FTS ranking, filters, pagination, and error conditions"
      shape: |
        // Tests must cover:
        // - Happy path: valid q returns 200 + SearchResultCard[] with relevance_score and highlight_snippet
        // - Empty result: valid q with no matches returns 200 + empty data + guidance message
        // - Blank/whitespace q: returns 200 + guidance message (no search executed)
        // - q > 500 chars: returns 400 QUERY_TOO_LONG
        // - PUBLIC scope: PUBLISHED-only records returned; DRAFT record not in results
        // - CURATOR scope: DRAFT records visible in results (with publication_state label)
        // - maturity_level filter: only matching maturity returned
        // - reuse_potential filter: only matching reuse_potential returned
        // - page/page_size: pagination envelope correct
      verify: "grep -n 'describe.*search\\|it.*GET.*search\\|test.*search' tests/integration/search.test.ts && grep -n 'QUERY_TOO_LONG\\|SEARCH_UNAVAILABLE\\|publication_state' tests/integration/search.test.ts && echo CONTRACT_OK"
---

<objective>
Implement **SearchService** and **SearchIndexService** using PostgreSQL native full-text search (tsvector + GIN index), plus the HTTP handler and route wiring for `GET /api/v1/search`. This is Wave 2b of the backend layer.

Purpose: F1 (Search and Discovery) requires a full-text search endpoint that lets stakeholders describe a mission problem in natural language and discover relevant innovation records ranked by relevance. The FTS infrastructure (tsvector column, GIN index, FTS triggers) was established in Wave 1 (01-PLAN.md). This plan builds the service and API layer on top of it.

Output:
- `src/services/SearchService.ts` — executes parameterized FTS query with ts_rank + ts_headline, applies filters, enforces publication scope
- `src/services/SearchIndexService.ts` — query sanitization, HTML stripping; provides `buildQuery()` and `rebuildVectorForRecord()`
- `src/handlers/SearchHandler.ts` — validates query params, returns correct HTTP responses per FRD error states
- `src/routes/search.ts` — Express router mounting the endpoint
- `src/types/search.ts` — TypeScript interfaces for SearchQueryParams, SearchResultCard, PaginatedSearchResponse
- `tests/integration/search.test.ts` — Jest + Supertest integration tests
</objective>

<feature_dependencies>
Implements: F1: Search and Discovery (GET /api/v1/search with PG FTS, weighted ranking, filters, pagination, PUBLIC/CURATOR scope), F9: Content Maturity and Trust Model (maturity_level and review_status filter predicates applied on FTS results)
Depends on: F0: Innovation Catalog (CatalogCard type extended by SearchResultCard), F2: Innovation Record (innovation_records table with search_vector column), F9: Content Maturity and Trust Model (maturity_level/review_status CHECK constraints provide valid filter enum values)
Enables: F1: SearchPage frontend (Wave 4b — consumes GET /api/v1/search and SearchResultCard type)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
@project_specs/FRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement SearchIndexService, SearchService, types, and route wiring</name>
  <files>
    src/types/search.ts
    src/services/SearchIndexService.ts
    src/services/SearchService.ts
    src/handlers/SearchHandler.ts
    src/routes/search.ts
  </files>
  <action>
Create all five source files. Stack: Node.js 20 + Express (per TechArch §6.2). Use Knex.js for parameterized DB queries. Use `sanitize-html` or `DOMPurify` (server-side via jsdom) for HTML stripping per TechArch §6.2 Required.

---

### `src/types/search.ts`

Export the TypeScript interfaces. CatalogCard is defined in a shared types file (create `src/types/catalog.ts` stub if it doesn't exist yet, or import from wherever CatalogService defines it — for now define inline and re-export).

```typescript
import type { MaturityLevel, ReviewStatus, ReusePotential, PublicationState, EngagementOptionType, SourceType } from './common';

export interface CatalogCard {
  record_id: string;
  title: string;
  short_summary: string | null;
  maturity_level: MaturityLevel;
  maturity_label: string;
  review_status: ReviewStatus;
  review_status_label: string;
  reuse_potential: ReusePotential;
  source_type: SourceType;
  mission_area_tags: string[];
  technology_area_tags: string[];
  engagement_options: EngagementOptionType[];
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  published_at: string | null;
  publication_state?: PublicationState;  // Present for CURATOR role only
}

export interface SearchResultCard extends CatalogCard {
  relevance_score: number;
  highlight_snippet: string | null;  // ts_headline excerpt; null if no match
}

export interface SearchQueryParams {
  q: string;
  maturity_level?: MaturityLevel | MaturityLevel[];
  review_status?: ReviewStatus | ReviewStatus[];
  contributing_office?: string | string[];
  reuse_potential?: ReusePotential;
  page?: number;
  page_size?: number;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface PaginatedSearchResponse {
  data: SearchResultCard[];
  pagination: Pagination;
}
```

Also create `src/types/common.ts` with the enum type aliases if it does not already exist:

```typescript
export type MaturityLevel = 'IDEA' | 'EXPERIMENT_POC' | 'PROTOTYPE_PILOT' | 'PRODUCTION_VALIDATED' | 'ARCHIVED';
export type ReviewStatus = 'SUBMITTED' | 'CURATED' | 'TECHNICALLY_REVIEWED' | 'SECURITY_REVIEWED' | 'POLICY_REVIEWED' | 'VALIDATED_FOR_REUSE' | 'SUPERSEDED_RETIRED';
export type ReusePotential = 'HIGH' | 'MEDIUM' | 'LOW';
export type SourceType = 'I_AND_R' | 'COMMUNITY';
export type PublicationState = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
export type EngagementOptionType = 'REQUEST_DEMO' | 'REQUEST_ADOPTION_DISCUSSION' | 'REQUEST_TECHNICAL_GUIDANCE' | 'REQUEST_BRIEFING' | 'SUBMIT_RELATED_PROBLEM';
export type DefaultPerspective = 'EXECUTIVE' | 'TECHNICAL';
export type ArtifactType = 'DOCUMENT' | 'CODE_REPOSITORY' | 'VIDEO' | 'DIAGRAM' | 'OTHER';
```

---

### `src/services/SearchIndexService.ts`

Handles query sanitization and FTS rebuilds.

```typescript
import sanitizeHtml from 'sanitize-html';

export class SearchIndexService {
  /**
   * Sanitize raw user query for safe use with plainto_tsquery.
   * - Strip HTML tags (prevents XSS stored via search terms in logs)
   * - Trim whitespace
   * - Truncate to 500 chars max (FRD F01 Validation)
   * - Return null if blank after sanitization
   */
  static buildQuery(rawQuery: string): string | null {
    if (!rawQuery || typeof rawQuery !== 'string') return null;
    // Strip HTML tags using sanitize-html (server-side)
    const stripped = sanitizeHtml(rawQuery, { allowedTags: [], allowedAttributes: {} });
    const trimmed = stripped.trim();
    if (trimmed.length === 0) return null;
    // Truncation guard (FRD: reject at handler layer if > 500; this is a safety net)
    return trimmed.slice(0, 500);
  }

  /**
   * Rebuild the search_vector for a specific record by triggering an UPDATE.
   * Used for manual refresh if trigger-based update is suspected stale.
   * The trigger trg_innovation_record_fts fires BEFORE UPDATE, so a no-op update suffices.
   */
  static async rebuildVectorForRecord(recordId: string, db: import('knex').Knex): Promise<void> {
    await db('innovation_records')
      .where({ record_id: recordId })
      .update({ updated_at: db.fn.now() });
  }
}
```

---

### `src/services/SearchService.ts`

Core FTS execution. Uses parameterized Knex raw queries with `plainto_tsquery`, `ts_rank`, and `ts_headline` per TechArch §7.4.

```typescript
import type { Knex } from 'knex';
import { SearchIndexService } from './SearchIndexService';
import type { SearchQueryParams, SearchResultCard, PaginatedSearchResponse, MaturityLevel, ReviewStatus, ReusePotential } from '../types/search';

const MATURITY_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

export class SearchService {
  /**
   * Execute full-text search against innovation_records.search_vector.
   *
   * @param params - validated query params (q already sanitized by caller via SearchIndexService)
   * @param role   - 'PUBLIC' restricts to PUBLISHED records; 'CURATOR' returns all states
   * @param db     - Knex connection
   */
  static async search(
    params: SearchQueryParams,
    role: 'PUBLIC' | 'CURATOR',
    db: Knex
  ): Promise<PaginatedSearchResponse> {
    const sanitizedQ = SearchIndexService.buildQuery(params.q);
    if (!sanitizedQ) {
      // Blank query — caller should have caught this; return empty
      return { data: [], pagination: { page: 1, page_size: params.page_size ?? 12, total_count: 0, total_pages: 0 } };
    }

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.page_size ?? 12));
    const offset = (page - 1) * pageSize;

    // Build base query using Knex raw for FTS functions
    // plainto_tsquery handles multi-word queries safely (no operator injection)
    let query = db('innovation_records as ir')
      .select([
        'ir.record_id',
        'ir.title',
        'ir.short_summary',
        'ir.maturity_level',
        'ir.review_status',
        'ir.reuse_potential',
        'ir.source_type',
        'ir.contributing_office',
        'ir.published_at',
        ...(role === 'CURATOR' ? ['ir.publication_state'] : []),
        db.raw("ts_rank(ir.search_vector, plainto_tsquery('english', ?)) AS relevance_score", [sanitizedQ]),
        db.raw(
          "ts_headline('english', COALESCE(ir.problem_statement, ir.short_summary, ''), plainto_tsquery('english', ?), 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') AS highlight_snippet",
          [sanitizedQ]
        ),
      ])
      .whereRaw("ir.search_vector @@ plainto_tsquery('english', ?)", [sanitizedQ])
      .whereNull('ir.deleted_at');

    // Publication scope guard (TechArch §5.6 rule 4: enforced at service layer, not just UI)
    if (role === 'PUBLIC') {
      query = query.where('ir.publication_state', 'PUBLISHED');
    }

    // Apply optional filters (multi-value support)
    if (params.maturity_level) {
      const values = Array.isArray(params.maturity_level) ? params.maturity_level : [params.maturity_level];
      query = query.whereIn('ir.maturity_level', values);
    }
    if (params.review_status) {
      const values = Array.isArray(params.review_status) ? params.review_status : [params.review_status];
      query = query.whereIn('ir.review_status', values);
    }
    if (params.contributing_office) {
      const values = Array.isArray(params.contributing_office) ? params.contributing_office : [params.contributing_office];
      query = query.whereIn('ir.contributing_office', values);
    }
    if (params.reuse_potential) {
      query = query.where('ir.reuse_potential', params.reuse_potential);
    }

    // Count total matching records for pagination envelope
    const countQuery = query.clone().clearSelect().count('ir.record_id as count');
    const countResult = await countQuery;
    const totalCount = parseInt(String((countResult[0] as any).count), 10);

    // Fetch page of results ordered by relevance DESC, then published_at DESC (ties)
    const rows = await query
      .orderByRaw("ts_rank(ir.search_vector, plainto_tsquery('english', ?)) DESC", [sanitizedQ])
      .orderBy('ir.published_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    // Fetch tags and engagement options for result records in bulk
    const recordIds = rows.map((r: any) => r.record_id);
    const [tags, engagementOptions] = recordIds.length > 0
      ? await Promise.all([
          db('record_tags').whereIn('record_id', recordIds).select('record_id', 'tag_type', 'tag_value').orderBy('display_order'),
          db('record_engagement_options').whereIn('record_id', recordIds).select('record_id', 'option_type').orderBy('display_order'),
        ])
      : [[], []];

    // Group tags and options by record_id
    const tagsByRecord = new Map<string, { mission: string[]; technology: string[] }>();
    for (const tag of tags as any[]) {
      if (!tagsByRecord.has(tag.record_id)) tagsByRecord.set(tag.record_id, { mission: [], technology: [] });
      if (tag.tag_type === 'MISSION_AREA') tagsByRecord.get(tag.record_id)!.mission.push(tag.tag_value);
      else tagsByRecord.get(tag.record_id)!.technology.push(tag.tag_value);
    }
    const optionsByRecord = new Map<string, string[]>();
    for (const opt of engagementOptions as any[]) {
      if (!optionsByRecord.has(opt.record_id)) optionsByRecord.set(opt.record_id, []);
      optionsByRecord.get(opt.record_id)!.push(opt.option_type);
    }

    const data: SearchResultCard[] = rows.map((row: any) => ({
      record_id: row.record_id,
      title: row.title,
      short_summary: row.short_summary ?? null,
      maturity_level: row.maturity_level,
      maturity_label: MATURITY_LABELS[row.maturity_level] ?? row.maturity_level,
      review_status: row.review_status,
      review_status_label: REVIEW_STATUS_LABELS[row.review_status] ?? row.review_status,
      reuse_potential: row.reuse_potential,
      source_type: row.source_type,
      mission_area_tags: tagsByRecord.get(row.record_id)?.mission ?? [],
      technology_area_tags: tagsByRecord.get(row.record_id)?.technology ?? [],
      engagement_options: (optionsByRecord.get(row.record_id) ?? []) as any[],
      is_validated_for_reuse: row.review_status === 'VALIDATED_FOR_REUSE',
      is_community_contributed: row.source_type === 'COMMUNITY',
      published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
      ...(role === 'CURATOR' ? { publication_state: row.publication_state } : {}),
      relevance_score: parseFloat(row.relevance_score ?? '0'),
      highlight_snippet: row.highlight_snippet ?? null,
    }));

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    return { data, pagination: { page, page_size: pageSize, total_count: totalCount, total_pages: totalPages } };
  }
}
```

---

### `src/handlers/SearchHandler.ts`

Validates inputs per FRD F01, delegates to SearchService, returns correct error shapes per TechArch §4.2.

```typescript
import type { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { SearchIndexService } from '../services/SearchIndexService';
import type { SearchQueryParams } from '../types/search';

const VALID_MATURITY = ['IDEA','EXPERIMENT_POC','PROTOTYPE_PILOT','PRODUCTION_VALIDATED','ARCHIVED'];
const VALID_REVIEW_STATUS = ['SUBMITTED','CURATED','TECHNICALLY_REVIEWED','SECURITY_REVIEWED','POLICY_REVIEWED','VALIDATED_FOR_REUSE','SUPERSEDED_RETIRED'];
const VALID_REUSE_POTENTIAL = ['HIGH','MEDIUM','LOW'];

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

function filterValidEnum(values: string[] | undefined, valid: string[]): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter(v => valid.includes(v));
  return filtered.length > 0 ? filtered : undefined;
}

export class SearchHandler {
  static async handleSearch(req: Request, res: Response): Promise<void> {
    const db = (req.app.get('db') as import('knex').Knex);
    // Determine role from session/auth middleware (Wave 3a wires CURATOR sessions;
    // for now, default PUBLIC unless req.user.role === 'CURATOR')
    const role: 'PUBLIC' | 'CURATOR' = (req as any).user?.role === 'CURATOR' ? 'CURATOR' : 'PUBLIC';

    const rawQ = (req.query.q as string | undefined) ?? '';

    // Blank/whitespace query: return guidance, no search (FRD F01 Error States)
    const sanitizedQ = SearchIndexService.buildQuery(rawQ);
    if (!sanitizedQ) {
      res.status(200).json({
        message: 'Enter a search term to find innovation records.',
        data: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
      });
      return;
    }

    // Query too long (FRD F01 Validation: max 500 chars — checked on raw string before sanitization)
    if (rawQ.length > 500) {
      res.status(400).json({
        error: {
          code: 'QUERY_TOO_LONG',
          message: 'Your search query is too long. Please shorten it to 500 characters or fewer.',
        },
      });
      return;
    }

    // Parse and validate page / page_size
    let page = parseInt(String(req.query.page ?? '1'), 10);
    if (isNaN(page) || page < 1) page = 1;

    let pageSize = parseInt(String(req.query.page_size ?? '12'), 10);
    if (isNaN(pageSize) || pageSize < 1) pageSize = 12;
    if (pageSize > 50) pageSize = 50;

    // Parse and silently filter invalid enum values (FRD F01 Validation)
    const maturityLevelRaw = toArray(req.query.maturity_level as string | string[] | undefined);
    const reviewStatusRaw = toArray(req.query.review_status as string | string[] | undefined);
    const reusePotentialRaw = req.query.reuse_potential as string | undefined;

    const params: SearchQueryParams = {
      q: sanitizedQ,
      maturity_level: filterValidEnum(maturityLevelRaw, VALID_MATURITY) as any,
      review_status: filterValidEnum(reviewStatusRaw, VALID_REVIEW_STATUS) as any,
      contributing_office: toArray(req.query.contributing_office as string | string[] | undefined),
      reuse_potential: VALID_REUSE_POTENTIAL.includes(reusePotentialRaw ?? '') ? reusePotentialRaw as any : undefined,
      page,
      page_size: pageSize,
    };

    try {
      const result = await SearchService.search(params, role, db);

      if (result.data.length === 0) {
        res.status(200).json({
          ...result,
          message: `No records found for '${sanitizedQ}'. Try different keywords, or submit a mission problem.`,
        });
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      // Log the error (logger injected via req.app.get('logger') in real setup)
      console.error('[SearchHandler] FTS query error:', err);
      res.status(503).json({
        error: {
          code: 'SEARCH_UNAVAILABLE',
          message: 'Search is temporarily unavailable. Try browsing the catalog.',
        },
      });
    }
  }
}
```

---

### `src/routes/search.ts`

```typescript
import { Router } from 'express';
import { SearchHandler } from '../handlers/SearchHandler';

const searchRouter = Router();

// GET /api/v1/search
searchRouter.get('/', SearchHandler.handleSearch);

export { searchRouter };
```

Register this router in the main app entry (e.g., `src/app.ts` or `src/index.ts`):
```typescript
app.use('/api/v1/search', searchRouter);
```
If `src/app.ts` does not exist yet, create a stub that wires the router. The app must expose `app.set('db', knexInstance)` for the handler to consume.
  </action>
  <verify>
```bash
grep -n "export class SearchService" src/services/SearchService.ts && \
grep -n "plainto_tsquery" src/services/SearchService.ts && \
grep -n "ts_rank" src/services/SearchService.ts && \
grep -n "ts_headline" src/services/SearchService.ts && \
grep -n "publication_state.*PUBLISHED" src/services/SearchService.ts && \
grep -n "deleted_at" src/services/SearchService.ts && \
grep -n "export class SearchIndexService" src/services/SearchIndexService.ts && \
grep -n "buildQuery" src/services/SearchIndexService.ts && \
grep -n "sanitizeHtml\|sanitize-html" src/services/SearchIndexService.ts && \
grep -n "export class SearchHandler" src/handlers/SearchHandler.ts && \
grep -n "QUERY_TOO_LONG\|SEARCH_UNAVAILABLE" src/handlers/SearchHandler.ts && \
grep -n "export interface SearchQueryParams\|export interface SearchResultCard\|export interface PaginatedSearchResponse" src/types/search.ts && \
grep -n "searchRouter\|Router" src/routes/search.ts && \
echo "TASK1_SOURCE_OK"
```
  </verify>
  <done>
- `src/types/search.ts` exports `SearchQueryParams`, `SearchResultCard` (extends CatalogCard with `relevance_score` and `highlight_snippet`), `PaginatedSearchResponse`
- `src/types/common.ts` exports all enum type aliases matching TechArch §4.2
- `src/services/SearchIndexService.ts` exports `SearchIndexService` with `buildQuery()` (HTML strip + trim + null on blank) and `rebuildVectorForRecord()`
- `src/services/SearchService.ts` exports `SearchService.search()` using `plainto_tsquery`, `ts_rank`, `ts_headline`; enforces `publication_state = 'PUBLISHED' AND deleted_at IS NULL` for PUBLIC role; includes bulk tag + engagement option fetching
- `src/handlers/SearchHandler.ts` exports `SearchHandler.handleSearch()` with all FRD F01 error states (blank query → 200 guidance, >500 chars → 400 QUERY_TOO_LONG, DB error → 503 SEARCH_UNAVAILABLE, zero results → 200 with guidance message)
- `src/routes/search.ts` exports `searchRouter` mounting `GET /` → `SearchHandler.handleSearch`
- Invalid filter enum values are silently ignored (not treated as errors) per FRD F01 Validation
  </done>
</task>

<task type="auto">
  <name>Task 2: Write integration tests for GET /api/v1/search</name>
  <files>
    tests/integration/search.test.ts
  </files>
  <action>
Create `tests/integration/search.test.ts` using Jest + Supertest. Tests run against a real PostgreSQL instance (available via `docker compose up -d db` from Wave 1). The test file sets up a test database connection using the `DATABASE_URL` environment variable.

**Test setup pattern:**
- Use `beforeAll` to connect to the PostgreSQL test DB and run migrations (001 and 002)
- Seed a test CURATOR user (required as `created_by_user_id` / `updated_by_user_id` FK)
- Seed a PUBLISHED record with known `problem_statement`, `key_findings`, tags, and engagement options
- Seed a DRAFT record to verify PUBLIC scope exclusion
- Use `afterAll` to clean up seeded rows and close DB connection

**Test cases required (per FRD F01 error states and TechArch §4.3):**

```typescript
import request from 'supertest';
import knex from 'knex';
// import app from '../../src/app';  — import Express app

describe('GET /api/v1/search', () => {
  // Setup: connect DB, run migrations, seed test data
  // Seed: PUBLISHED record with problem_statement containing 'audio security'
  //       DRAFT record with 'audio security' in problem_statement (must NOT appear for PUBLIC)

  // ── Happy path ──────────────────────────────────────────────────────────
  it('returns 200 with SearchResultCard array and pagination for valid query', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject({
      record_id: expect.any(String),
      relevance_score: expect.any(Number),
    });
    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 12,
      total_count: expect.any(Number),
      total_pages: expect.any(Number),
    });
  });

  it('returns highlight_snippet containing query terms when match found', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    const firstResult = res.body.data[0];
    expect(firstResult.highlight_snippet).not.toBeNull();
  });

  // ── Empty result ─────────────────────────────────────────────────────────
  it('returns 200 with empty data array and guidance message for valid query with no matches', async () => {
    const res = await request(app).get('/api/v1/search?q=xyzzy+nonexistent+term+999');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toMatch(/no records found/i);
  });

  // ── Blank query ──────────────────────────────────────────────────────────
  it('returns 200 with guidance message (no search executed) for blank q', async () => {
    const res = await request(app).get('/api/v1/search?q=');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enter a search term/i);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 200 with guidance for whitespace-only q', async () => {
    const res = await request(app).get('/api/v1/search?q=   ');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enter a search term/i);
  });

  // ── Query too long ────────────────────────────────────────────────────────
  it('returns 400 QUERY_TOO_LONG for q exceeding 500 characters', async () => {
    const longQuery = 'a'.repeat(501);
    const res = await request(app).get(`/api/v1/search?q=${longQuery}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('QUERY_TOO_LONG');
  });

  // ── Publication scope guard ───────────────────────────────────────────────
  it('PUBLIC request does NOT return DRAFT records', async () => {
    // Seeded DRAFT record has the same query terms
    const res = await request(app).get('/api/v1/search?q=audio+security');
    expect(res.status).toBe(200);
    const recordIds = res.body.data.map((r: any) => r.record_id);
    expect(recordIds).not.toContain(draftRecordId);  // seeded in beforeAll
  });

  it('CURATOR request returns DRAFT records with publication_state label', async () => {
    // Pass CURATOR session header (mock auth middleware for test — set req.user = { role: 'CURATOR' })
    const res = await request(app)
      .get('/api/v1/search?q=audio+security')
      .set('X-Test-Role', 'CURATOR');  // test-only header; test middleware sets req.user.role
    expect(res.status).toBe(200);
    const recordIds = res.body.data.map((r: any) => r.record_id);
    expect(recordIds).toContain(draftRecordId);
    const draftResult = res.body.data.find((r: any) => r.record_id === draftRecordId);
    expect(draftResult.publication_state).toBe('DRAFT');
  });

  // ── Filter application ────────────────────────────────────────────────────
  it('maturity_level filter returns only matching records', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security&maturity_level=EXPERIMENT_POC');
    expect(res.status).toBe(200);
    for (const card of res.body.data) {
      expect(card.maturity_level).toBe('EXPERIMENT_POC');
    }
  });

  it('invalid maturity_level filter value is silently ignored (not an error)', async () => {
    const res = await request(app).get('/api/v1/search?q=audio+security&maturity_level=INVALID_VALUE');
    expect(res.status).toBe(200);
    // Should still return results (filter ignored); no 400 error
    expect(res.body.data).toBeInstanceOf(Array);
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  it('respects page_size parameter and returns correct pagination envelope', async () => {
    const res = await request(app).get('/api/v1/search?q=audio&page_size=1&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.pagination.page_size).toBe(1);
  });

  it('clamps page_size > 50 to 50', async () => {
    const res = await request(app).get('/api/v1/search?q=audio&page_size=999');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(50);
  });
});
```

**Test infrastructure notes:**
- Import the Express `app` from `src/app.ts` (the same app instance used by Supertest)
- Add a test-only middleware in the app (gated on `NODE_ENV === 'test'`) that reads `X-Test-Role` header and sets `req.user = { role: value }` — this simulates CURATOR auth without OIDC in integration tests
- Use a dedicated test DB or the same `tsio_hub` DB with transactions rolled back in `afterEach`
- The `DATABASE_URL` env var points to the Docker PostgreSQL instance
- Run tests: `DATABASE_URL=postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub npx jest tests/integration/search.test.ts`

The test file must import the app, set up and tear down seed data in `beforeAll`/`afterAll`, and all test cases must pass when the Docker DB is running with migrations applied.
  </action>
  <verify>
```bash
grep -n "describe.*GET.*search\|describe.*search" tests/integration/search.test.ts && \
grep -n "QUERY_TOO_LONG" tests/integration/search.test.ts && \
grep -n "publication_state" tests/integration/search.test.ts && \
grep -n "DRAFT" tests/integration/search.test.ts && \
grep -n "maturity_level" tests/integration/search.test.ts && \
grep -n "page_size" tests/integration/search.test.ts && \
grep -n "highlight_snippet" tests/integration/search.test.ts && \
grep -n "beforeAll\|afterAll" tests/integration/search.test.ts && \
echo "TASK2_TESTS_OK"
```

Run integration tests against the Docker DB (requires Wave 1 migrations applied):
```bash
docker compose up -d db && sleep 8 && \
  DATABASE_URL=postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub \
  npx jest tests/integration/search.test.ts --reporter=list 2>&1 | tail -30 && \
  echo "SEARCH INTEGRATION TESTS PASSED"
```
  </verify>
  <done>
- `tests/integration/search.test.ts` exists with a `describe('GET /api/v1/search')` suite
- Tests cover: happy path (200 + SearchResultCard[] + pagination), highlight_snippet present, empty result (200 + guidance message), blank q (200 + guidance, no search), whitespace q (200 + guidance), q > 500 chars (400 QUERY_TOO_LONG), PUBLIC scope exclusion of DRAFT records, CURATOR scope includes DRAFT with publication_state label, maturity_level filter applies correctly, invalid filter value silently ignored, page_size respected and clamped to 50
- `beforeAll` seeds a CURATOR user + PUBLISHED record + DRAFT record; `afterAll` cleans up
- `X-Test-Role` test middleware enables CURATOR simulation without OIDC
- All tests pass when `docker compose up -d db` is running and Wave 1 migrations are applied
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | User-supplied query string `q` and filter params crossing from HTTP request into the FTS query engine |
| query→PGsearch | Sanitized query text crossing from application layer into PostgreSQL `plainto_tsquery` |
| API→client | FTS results (including ts_headline markup) crossing back from PostgreSQL into HTTP response |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-01 | Tampering | `SearchIndexService.buildQuery()` — raw query string into `plainto_tsquery` | mitigate | `buildQuery()` in `SearchIndexService.ts` strips HTML via `sanitize-html` before any further processing. Query is then passed as a parameterized bind variable to `plainto_tsquery('english', $1)` via Knex `db.raw('... plainto_tsquery(\'english\', ?)', [sanitizedQ])`. `plainto_tsquery` itself is injection-safe: it treats all input as plain text tokens, never as operator syntax. No string interpolation of user input into SQL. |
| T-04-02 | Information Disclosure | `SearchService.search()` — publication scope — PUBLIC users must not see DRAFT/REVIEW records | mitigate | `SearchService.ts` enforces `where('ir.publication_state', 'PUBLISHED')` for PUBLIC role at the service layer (not just the UI). This mirrors TechArch §5.6 rule 4: "Only PUBLISHED records are returned to PUBLIC API consumers... enforced at the query layer." The `deleted_at IS NULL` predicate is also applied unconditionally. Integration test `'PUBLIC request does NOT return DRAFT records'` verifies this at runtime. |
| T-04-03 | Information Disclosure | `ts_headline` output — may expose content from non-public records if scope guard fails | mitigate | `ts_headline` is generated only for rows returned by the scoped query. The publication scope guard (`publication_state = 'PUBLISHED' AND deleted_at IS NULL` for PUBLIC) is applied BEFORE the `ts_headline` selection — PostgreSQL evaluates WHERE before SELECT projections. No non-public content is ever passed to `ts_headline` for PUBLIC requests. |
| T-04-04 | Tampering | `ts_headline` HTML output — `<mark>` tags in highlight_snippet rendered to frontend | mitigate | `ts_headline` is configured with explicit `StartSel=<mark>` and `StopSel=</mark>`. These are the ONLY HTML tags that can appear in the snippet. The frontend (Wave 4b SearchPage) MUST render `highlight_snippet` as controlled HTML (e.g. `dangerouslySetInnerHTML` scoped to `<mark>` only, or a safe renderer that allows only `<mark>`). This is a cross-wave constraint — noted here and must be enforced in Wave 4b SearchPage task. |
| T-04-05 | Denial of Service | `GET /api/v1/search` — FTS query with complex query strings can be expensive | mitigate | `SearchIndexService.buildQuery()` truncates to 500 chars max (handler also rejects > 500 at request level → 400 QUERY_TOO_LONG). `plainto_tsquery` does not support boolean operators that could cause query plan explosions. GIN index on `search_vector` (from Wave 1) ensures FTS queries use index scan not sequential scan at MVP record volumes. |
| T-04-06 | Elevation of Privilege | `SearchHandler` role determination — CURATOR role must come from authenticated session, never from client-supplied request body | mitigate | Role is determined in `SearchHandler.ts` via `(req as any).user?.role === 'CURATOR'` where `req.user` is set by `AuthMiddleware` (Wave 3a). The `X-Test-Role` header is gated on `NODE_ENV === 'test'` and MUST NOT be active in production. Wave 3a AuthMiddleware task must own the `req.user` population from OIDC session. |
</threat_model>

<verification>
After both tasks complete:

1. Confirm all source files exist:
   ```bash
   ls src/services/SearchService.ts src/services/SearchIndexService.ts src/handlers/SearchHandler.ts src/routes/search.ts src/types/search.ts tests/integration/search.test.ts && echo "ALL FILES EXIST"
   ```

2. Confirm FTS query pattern (plainto_tsquery parameterized):
   ```bash
   grep -n "plainto_tsquery" src/services/SearchService.ts && echo "FTS QUERY OK"
   ```

3. Confirm publication scope guard present:
   ```bash
   grep -n "publication_state.*PUBLISHED\|PUBLISHED.*publication_state" src/services/SearchService.ts && echo "SCOPE GUARD OK"
   ```

4. Confirm deleted_at guard present:
   ```bash
   grep -n "deleted_at" src/services/SearchService.ts && echo "SOFT DELETE GUARD OK"
   ```

5. Confirm error codes match FRD F01:
   ```bash
   grep -n "QUERY_TOO_LONG\|SEARCH_UNAVAILABLE" src/handlers/SearchHandler.ts && echo "ERROR CODES OK"
   ```

6. Confirm HTML stripping in SearchIndexService:
   ```bash
   grep -n "sanitizeHtml\|sanitize-html\|DOMPurify\|allowedTags" src/services/SearchIndexService.ts && echo "HTML STRIP OK"
   ```

7. Confirm integration test covers publication scope:
   ```bash
   grep -n "DRAFT\|publication_state\|CURATOR" tests/integration/search.test.ts && echo "SCOPE TESTS OK"
   ```

8. Confirm ts_rank and ts_headline both present (F01: relevance ranking + highlights):
   ```bash
   grep -n "ts_rank" src/services/SearchService.ts && grep -n "ts_headline" src/services/SearchService.ts && echo "RANKING AND HIGHLIGHTS OK"
   ```
</verification>

<success_criteria>
- `GET /api/v1/search?q=audio+security` returns 200 with `SearchResultCard[]` including `relevance_score` (float) and `highlight_snippet` (string | null), plus `pagination` envelope matching TechArch §4.1
- `GET /api/v1/search?q=` returns 200 with `{ message: "Enter a search term...", data: [] }` — no DB query executed
- `GET /api/v1/search?q=` + 501-char string returns 400 `QUERY_TOO_LONG`
- PUBLIC requests exclude DRAFT/REVIEW/SUPERSEDED/ARCHIVED records — enforced at `SearchService` query layer with `WHERE publication_state = 'PUBLISHED' AND deleted_at IS NULL`
- CURATOR requests include all publication states and include `publication_state` on each result card
- `maturity_level`, `review_status`, `contributing_office`, `reuse_potential` filters apply as AND predicates; invalid enum values silently dropped
- `page_size` clamped to 1–50; `page` defaults to 1 on invalid input
- Query text is HTML-stripped by `SearchIndexService.buildQuery()` and passed to `plainto_tsquery` as a parameterized bind — no string interpolation
- `ts_headline` StartSel/StopSel configured as `<mark>`/`</mark>` for safe frontend rendering
- Integration tests cover all 11 cases above and pass against the Docker PostgreSQL instance
- Wave 4b frontend SearchPage can consume the `PaginatedSearchResponse` type from `src/types/search.ts`
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/04-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (query sanitization approach, highlight_snippet StartSel/StopSel, scope guard pattern, role determination pattern for Wave 3a coordination)
- Integration contract summary for Wave 4b (SearchPage) consumption
</output>
