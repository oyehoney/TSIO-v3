// SearchService: Core full-text search execution against innovation_records.search_vector
// TechArch §7.4: uses PostgreSQL plainto_tsquery, ts_rank, ts_headline
// Security: T-04-02 publication scope guard enforced at query layer (not just UI)

import type { Knex } from 'knex';
import { SearchIndexService } from './SearchIndexService';
import type {
  SearchQueryParams,
  SearchResultCard,
  PaginatedSearchResponse,
} from '../types/search';

// Human-readable labels for maturity_level enum values (TechArch §4.2 display names)
const MATURITY_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

// Human-readable labels for review_status enum values (TechArch §4.2 display names)
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
   * FTS query pattern (TechArch §7.4):
   *   SELECT ir.*, ts_rank(ir.search_vector, query) AS relevance_score,
   *          ts_headline('english', ir.problem_statement, query) AS highlight_snippet
   *     FROM innovation_records ir,
   *          plainto_tsquery('english', $1) query
   *    WHERE ir.search_vector @@ query
   *      AND ir.publication_state = 'PUBLISHED'   -- PUBLIC scope (T-04-02)
   *      AND ir.deleted_at IS NULL
   *    ORDER BY relevance_score DESC, ir.published_at DESC
   *    LIMIT $2 OFFSET $3
   *
   * @param params - validated query params (q already sanitized via SearchIndexService)
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
      // Blank query — caller should have handled this; return empty defensively
      return {
        data: [],
        pagination: {
          page: 1,
          page_size: params.page_size ?? 12,
          total_count: 0,
          total_pages: 0,
        },
      };
    }

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.page_size ?? 12));
    const offset = (page - 1) * pageSize;

    // Build base query using Knex for FTS functions
    // plainto_tsquery is injection-safe: treats all input as plain text tokens
    // All user input is passed as parameterized bind variables (? placeholders)
    let query = db('innovation_records as ir').select([
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
      db.raw(
        "ts_rank(ir.search_vector, plainto_tsquery('english', ?)) AS relevance_score",
        [sanitizedQ]
      ),
      db.raw(
        // StartSel=<mark> StopSel=</mark> — safe for frontend rendering (T-04-04)
        "ts_headline('english', COALESCE(ir.problem_statement, ir.short_summary, ''), plainto_tsquery('english', ?), 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') AS highlight_snippet",
        [sanitizedQ]
      ),
    ]);

    // FTS match predicate — search_vector is a GIN-indexed tsvector
    // The @@ operator uses the GIN index (idx_innovation_records_fts) for performance
    query = query.whereRaw(
      "ir.search_vector @@ plainto_tsquery('english', ?)",
      [sanitizedQ]
    );

    // Soft-delete guard — unconditional (applies to all roles)
    query = query.whereNull('ir.deleted_at');

    // Publication scope guard (TechArch §5.6 rule 4; T-04-02 mitigation)
    // Enforced at service/query layer — never delegated to UI
    if (role === 'PUBLIC') {
      query = query.where('ir.publication_state', 'PUBLISHED');
    }

    // Optional filter predicates — applied as AND conjuncts on top of FTS results
    // Multi-value: array input uses IN clause
    if (params.maturity_level) {
      const values = Array.isArray(params.maturity_level)
        ? params.maturity_level
        : [params.maturity_level];
      query = query.whereIn('ir.maturity_level', values);
    }
    if (params.review_status) {
      const values = Array.isArray(params.review_status)
        ? params.review_status
        : [params.review_status];
      query = query.whereIn('ir.review_status', values);
    }
    if (params.contributing_office) {
      const values = Array.isArray(params.contributing_office)
        ? params.contributing_office
        : [params.contributing_office];
      query = query.whereIn('ir.contributing_office', values);
    }
    if (params.reuse_potential) {
      query = query.where('ir.reuse_potential', params.reuse_potential);
    }

    // Count total matching records for pagination envelope
    // Clone the query before adding ORDER BY / LIMIT / OFFSET
    const countQuery = query.clone().clearSelect().count('ir.record_id as count');
    const countResult = await countQuery;
    const totalCount = parseInt(String((countResult[0] as any).count), 10);

    // Fetch page of results ordered by relevance DESC, then published_at DESC (ties)
    const rows = await query
      .orderByRaw(
        "ts_rank(ir.search_vector, plainto_tsquery('english', ?)) DESC",
        [sanitizedQ]
      )
      .orderBy('ir.published_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    // Fetch tags and engagement options for result records in bulk (N+1 avoidance)
    const recordIds = (rows as any[]).map((r: any) => r.record_id);
    const [tags, engagementOptions] =
      recordIds.length > 0
        ? await Promise.all([
            db('record_tags')
              .whereIn('record_id', recordIds)
              .select('record_id', 'tag_type', 'tag_value')
              .orderBy('display_order'),
            db('record_engagement_options')
              .whereIn('record_id', recordIds)
              .select('record_id', 'option_type')
              .orderBy('display_order'),
          ])
        : [[], []];

    // Group tags by record_id for O(1) lookup during result mapping
    const tagsByRecord = new Map<
      string,
      { mission: string[]; technology: string[] }
    >();
    for (const tag of tags as any[]) {
      if (!tagsByRecord.has(tag.record_id)) {
        tagsByRecord.set(tag.record_id, { mission: [], technology: [] });
      }
      if (tag.tag_type === 'MISSION_AREA') {
        tagsByRecord.get(tag.record_id)!.mission.push(tag.tag_value);
      } else {
        tagsByRecord.get(tag.record_id)!.technology.push(tag.tag_value);
      }
    }

    // Group engagement options by record_id
    const optionsByRecord = new Map<string, string[]>();
    for (const opt of engagementOptions as any[]) {
      if (!optionsByRecord.has(opt.record_id)) {
        optionsByRecord.set(opt.record_id, []);
      }
      optionsByRecord.get(opt.record_id)!.push(opt.option_type);
    }

    // Map DB rows to SearchResultCard shape
    const data: SearchResultCard[] = (rows as any[]).map((row: any) => ({
      record_id: row.record_id,
      title: row.title,
      short_summary: row.short_summary ?? null,
      maturity_level: row.maturity_level,
      maturity_label: MATURITY_LABELS[row.maturity_level] ?? row.maturity_level,
      review_status: row.review_status,
      review_status_label:
        REVIEW_STATUS_LABELS[row.review_status] ?? row.review_status,
      reuse_potential: row.reuse_potential,
      source_type: row.source_type,
      mission_area_tags: tagsByRecord.get(row.record_id)?.mission ?? [],
      technology_area_tags: tagsByRecord.get(row.record_id)?.technology ?? [],
      engagement_options: (optionsByRecord.get(row.record_id) ?? []) as any[],
      is_validated_for_reuse: row.review_status === 'VALIDATED_FOR_REUSE',
      is_community_contributed: row.source_type === 'COMMUNITY',
      published_at: row.published_at
        ? new Date(row.published_at).toISOString()
        : null,
      ...(role === 'CURATOR'
        ? { publication_state: row.publication_state }
        : {}),
      relevance_score: parseFloat(row.relevance_score ?? '0'),
      highlight_snippet: row.highlight_snippet ?? null,
    }));

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    return {
      data,
      pagination: {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
      },
    };
  }
}
