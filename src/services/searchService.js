'use strict';

/**
 * searchService.js — Plain JS equivalent of SearchService.ts for use by
 * the EJS server-side rendered search page handler.
 *
 * Implements the same FTS logic as SearchService.ts:
 *   - plainto_tsquery with ts_rank and ts_headline
 *   - Publication scope guard (PUBLISHED only for PUBLIC role)
 *   - Multi-value filter predicates for maturity_level, review_status, etc.
 *   - N+1 avoidance for tags and engagement options
 *
 * Security:
 *   - All user input is passed as parameterized bind variables (no string interpolation)
 *   - T-10-01: highlight_snippet contains ONLY <mark> tags per ts_headline config
 *   - T-04-02: publication_state = 'PUBLISHED' guard at query layer
 */

const sanitizeHtml = require('sanitize-html');

// Human-readable labels for maturity_level enum values (TechArch §4.2)
const MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

// Human-readable labels for review_status enum values (TechArch §4.2)
const REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

/**
 * Sanitize raw user query for safe use with plainto_tsquery.
 * Mirrors SearchIndexService.buildQuery() from TypeScript.
 *
 * @param {string} rawQuery
 * @returns {string|null} sanitized query or null if blank
 */
function buildQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return null;

  const stripped = sanitizeHtml(rawQuery, {
    allowedTags: [],
    allowedAttributes: {},
  });

  const trimmed = stripped.trim();
  if (trimmed.length === 0) return null;

  return trimmed.slice(0, 500);
}

/**
 * Execute full-text search against innovation_records.search_vector.
 * Mirrors SearchService.search() from TypeScript.
 *
 * @param {object} params - search parameters
 * @param {string} params.q - search query (pre-sanitized)
 * @param {string[]} [params.maturity_level] - filter by maturity level(s)
 * @param {string[]} [params.review_status] - filter by review status(es)
 * @param {string[]} [params.contributing_office] - filter by office(s)
 * @param {string} [params.reuse_potential] - filter by reuse potential
 * @param {number} [params.page=1] - page number
 * @param {number} [params.page_size=12] - page size (max 50)
 * @param {'PUBLIC'|'CURATOR'} role - access role
 * @param {import('knex').Knex} db - Knex DB instance
 * @returns {Promise<{data: object[], pagination: object}>}
 */
async function search(params, role, db) {
  const sanitizedQ = buildQuery(params.q);
  if (!sanitizedQ) {
    return {
      data: [],
      pagination: {
        page: 1,
        page_size: params.page_size || 12,
        total_count: 0,
        total_pages: 0,
      },
    };
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.page_size || 12));
  const offset = (page - 1) * pageSize;

  // Build base query using Knex
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
    db.raw(
      "ts_rank(ir.search_vector, plainto_tsquery('english', ?)) AS relevance_score",
      [sanitizedQ]
    ),
    db.raw(
      // StartSel=<mark> StopSel=</mark> — safe for EJS <%- %> rendering (T-04-04 / T-10-01)
      "ts_headline('english', COALESCE(ir.problem_statement, ir.short_summary, ''), plainto_tsquery('english', ?), 'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') AS highlight_snippet",
      [sanitizedQ]
    ),
  ]);

  // FTS match predicate using GIN-indexed search_vector
  query = query.whereRaw(
    "ir.search_vector @@ plainto_tsquery('english', ?)",
    [sanitizedQ]
  );

  // Soft-delete guard — unconditional
  query = query.whereNull('ir.deleted_at');

  // Publication scope guard (T-04-02)
  if (role !== 'CURATOR') {
    query = query.where('ir.publication_state', 'PUBLISHED');
  }

  // Optional filter predicates
  if (params.maturity_level && params.maturity_level.length > 0) {
    query = query.whereIn('ir.maturity_level', params.maturity_level);
  }
  if (params.review_status && params.review_status.length > 0) {
    query = query.whereIn('ir.review_status', params.review_status);
  }
  if (params.contributing_office && params.contributing_office.length > 0) {
    query = query.whereIn('ir.contributing_office', params.contributing_office);
  }
  if (params.reuse_potential) {
    query = query.where('ir.reuse_potential', params.reuse_potential);
  }

  // Count total matching records for pagination envelope
  const countQuery = query.clone().clearSelect().count('ir.record_id as count');
  const countResult = await countQuery;
  const totalCount = parseInt(String(countResult[0].count), 10);

  // Fetch page of results ordered by relevance DESC, published_at DESC
  const rows = await query
    .orderByRaw(
      "ts_rank(ir.search_vector, plainto_tsquery('english', ?)) DESC",
      [sanitizedQ]
    )
    .orderBy('ir.published_at', 'desc')
    .limit(pageSize)
    .offset(offset);

  if (rows.length === 0) {
    return {
      data: [],
      pagination: { page, page_size: pageSize, total_count: totalCount, total_pages: 0 },
    };
  }

  // Fetch tags and engagement options in bulk (N+1 avoidance)
  const recordIds = rows.map(function(r) { return r.record_id; });
  const [tags, engagementOptions] = await Promise.all([
    db('record_tags')
      .whereIn('record_id', recordIds)
      .select('record_id', 'tag_type', 'tag_value')
      .orderBy('display_order'),
    db('record_engagement_options')
      .whereIn('record_id', recordIds)
      .select('record_id', 'option_type')
      .orderBy('display_order'),
  ]);

  // Group tags by record_id
  const tagsByRecord = {};
  for (const tag of tags) {
    if (!tagsByRecord[tag.record_id]) {
      tagsByRecord[tag.record_id] = { mission: [], technology: [] };
    }
    if (tag.tag_type === 'MISSION_AREA') {
      tagsByRecord[tag.record_id].mission.push(tag.tag_value);
    } else {
      tagsByRecord[tag.record_id].technology.push(tag.tag_value);
    }
  }

  // Group engagement options by record_id
  const optionsByRecord = {};
  for (const opt of engagementOptions) {
    if (!optionsByRecord[opt.record_id]) {
      optionsByRecord[opt.record_id] = [];
    }
    optionsByRecord[opt.record_id].push(opt.option_type);
  }

  // Map DB rows to SearchResultCard shape
  const data = rows.map(function(row) {
    return {
      record_id: row.record_id,
      title: row.title,
      short_summary: row.short_summary || null,
      maturity_level: row.maturity_level,
      maturity_label: MATURITY_LABELS[row.maturity_level] || row.maturity_level,
      review_status: row.review_status,
      review_status_label: REVIEW_STATUS_LABELS[row.review_status] || row.review_status,
      reuse_potential: row.reuse_potential,
      source_type: row.source_type,
      mission_area_tags: (tagsByRecord[row.record_id] && tagsByRecord[row.record_id].mission) || [],
      technology_area_tags: (tagsByRecord[row.record_id] && tagsByRecord[row.record_id].technology) || [],
      engagement_options: optionsByRecord[row.record_id] || [],
      is_validated_for_reuse: row.review_status === 'VALIDATED_FOR_REUSE',
      is_community_contributed: row.source_type === 'COMMUNITY',
      published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
      relevance_score: parseFloat(row.relevance_score || '0'),
      highlight_snippet: row.highlight_snippet || null,
    };
  });

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

module.exports = { search, buildQuery };
