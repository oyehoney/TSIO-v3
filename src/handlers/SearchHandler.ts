// SearchHandler: validates GET /api/v1/search query params and delegates to SearchService
// FRD F01 error states: blank query, query too long, zero results, DB unavailable
// TechArch §4.2: error response shape { error: { code, message } }

import type { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { SearchIndexService } from '../services/SearchIndexService';
import type { SearchQueryParams } from '../types/search';

// Valid enum values for filter params — invalid values are silently ignored (FRD F01 Validation)
const VALID_MATURITY = [
  'IDEA',
  'EXPERIMENT_POC',
  'PROTOTYPE_PILOT',
  'PRODUCTION_VALIDATED',
  'ARCHIVED',
];
const VALID_REVIEW_STATUS = [
  'SUBMITTED',
  'CURATED',
  'TECHNICALLY_REVIEWED',
  'SECURITY_REVIEWED',
  'POLICY_REVIEWED',
  'VALIDATED_FOR_REUSE',
  'SUPERSEDED_RETIRED',
];
const VALID_REUSE_POTENTIAL = ['HIGH', 'MEDIUM', 'LOW'];

/** Normalize a single string or array of strings to an array */
function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/** Filter array of strings to only valid enum values; return undefined if empty */
function filterValidEnum(
  values: string[] | undefined,
  valid: string[]
): string[] | undefined {
  if (!values) return undefined;
  const filtered = values.filter((v) => valid.includes(v));
  return filtered.length > 0 ? filtered : undefined;
}

export class SearchHandler {
  /**
   * Handle GET /api/v1/search
   *
   * Query params:
   *   q (required, 1–500 chars), maturity_level, review_status,
   *   contributing_office, reuse_potential, page, page_size
   *
   * Response 200 (results found):
   *   { "data": SearchResultCard[], "pagination": { page, page_size, total_count, total_pages } }
   *
   * Response 200 (blank query — no search executed):
   *   { "message": "Enter a search term to find innovation records.", "data": [] }
   *
   * Response 200 (zero results for valid query):
   *   { "data": [], "pagination": {...}, "message": "No records found for '...'. Try different keywords..." }
   *
   * Response 400: { "error": { "code": "QUERY_TOO_LONG", "message": "..." } }
   * Response 503: { "error": { "code": "SEARCH_UNAVAILABLE", "message": "..." } }
   */
  static async handleSearch(req: Request, res: Response): Promise<void> {
    const db = req.app.get('db') as import('knex').Knex;

    // Role determination — set by AuthMiddleware (Wave 3a) via req.user
    // In test env, X-Test-Role header simulates CURATOR without OIDC (T-04-06)
    // The test middleware (gated on NODE_ENV === 'test') sets req.user from header
    const role: 'PUBLIC' | 'CURATOR' =
      (req as any).user?.role === 'CURATOR' ? 'CURATOR' : 'PUBLIC';

    const rawQ = (req.query.q as string | undefined) ?? '';

    // Query too long check must happen BEFORE sanitization (raw string length)
    // FRD F01 Validation: max 500 chars — reject with 400 QUERY_TOO_LONG
    if (rawQ.length > 500) {
      res.status(400).json({
        error: {
          code: 'QUERY_TOO_LONG',
          message:
            'Your search query is too long. Please shorten it to 500 characters or fewer.',
        },
      });
      return;
    }

    // Blank/whitespace query: return guidance message, no DB query (FRD F01 Error States)
    const sanitizedQ = SearchIndexService.buildQuery(rawQ);
    if (!sanitizedQ) {
      res.status(200).json({
        message: 'Enter a search term to find innovation records.',
        data: [],
        pagination: { page: 1, page_size: 12, total_count: 0, total_pages: 0 },
      });
      return;
    }

    // Parse and validate page / page_size with safe defaults
    let page = parseInt(String(req.query.page ?? '1'), 10);
    if (isNaN(page) || page < 1) page = 1;

    let pageSize = parseInt(String(req.query.page_size ?? '12'), 10);
    if (isNaN(pageSize) || pageSize < 1) pageSize = 12;
    if (pageSize > 50) pageSize = 50;

    // Parse filter params; silently drop invalid enum values (FRD F01 Validation)
    const maturityLevelRaw = toArray(
      req.query.maturity_level as string | string[] | undefined
    );
    const reviewStatusRaw = toArray(
      req.query.review_status as string | string[] | undefined
    );
    const reusePotentialRaw = req.query.reuse_potential as string | undefined;

    const params: SearchQueryParams = {
      q: sanitizedQ,
      maturity_level: filterValidEnum(maturityLevelRaw, VALID_MATURITY) as any,
      review_status: filterValidEnum(reviewStatusRaw, VALID_REVIEW_STATUS) as any,
      contributing_office: toArray(
        req.query.contributing_office as string | string[] | undefined
      ),
      reuse_potential: VALID_REUSE_POTENTIAL.includes(reusePotentialRaw ?? '')
        ? (reusePotentialRaw as any)
        : undefined,
      page,
      page_size: pageSize,
    };

    try {
      const result = await SearchService.search(params, role, db);

      // Zero results: return 200 with guidance message (FRD F01 Error States)
      if (result.data.length === 0) {
        res.status(200).json({
          ...result,
          message: `No records found for '${sanitizedQ}'. Try different keywords, or submit a mission problem.`,
        });
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      // FTS query failure — DB unreachable, index unavailable, etc.
      // Log error for debugging; return 503 SEARCH_UNAVAILABLE (FRD F01 Error States)
      console.error('[SearchHandler] FTS query error:', err?.message ?? err);
      res.status(503).json({
        error: {
          code: 'SEARCH_UNAVAILABLE',
          message:
            'Search is temporarily unavailable. Try browsing the catalog.',
        },
      });
    }
  }
}
