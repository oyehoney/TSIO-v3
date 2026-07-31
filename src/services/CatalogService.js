'use strict';

const MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

const REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

// Maturity sort order for sort=maturity (highest first)
const MATURITY_ORDER = {
  PRODUCTION_VALIDATED: 0,
  PROTOTYPE_PILOT: 1,
  EXPERIMENT_POC: 2,
  IDEA: 3,
  ARCHIVED: 4,
};

/**
 * Build a CatalogCard from a DB row + aggregated arrays.
 * Per TechArch §4.2 CatalogCard interface.
 */
function buildCatalogCard(row) {
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
    mission_area_tags: row.mission_area_tags || [],
    technology_area_tags: row.technology_area_tags || [],
    engagement_options: row.engagement_options || [],
    is_validated_for_reuse: row.review_status === 'VALIDATED_FOR_REUSE',
    is_community_contributed: row.source_type === 'COMMUNITY',
    published_at: row.published_at ? row.published_at.toISOString() : null,
  };
}

/**
 * CatalogService.listCatalog
 *
 * Queries innovation_records filtered to PUBLISHED (PUBLIC access).
 * Joins record_tags and record_engagement_options using aggregated subqueries.
 *
 * From TechArch §2.1 CatalogService:
 * - Filters by publication_state = 'PUBLISHED' and deleted_at IS NULL
 * - Multi-value filter parameters (maturity, review status, tags, office, reuse potential)
 * - Sort: recent (published_at DESC), maturity (maturity_level order), relevance (FTS rank not used here — sort=relevance falls back to recent for non-search context)
 * - Paginates results; returns catalog card projection (not full record)
 *
 * @param {import('pg').Pool} pool
 * @param {object} filters
 * @param {object} pagination  { page: number, page_size: number }
 * @returns {{ data: CatalogCard[], pagination: object }}
 */
async function listCatalog(pool, filters = {}, pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(pagination.page_size, 10) || 12));
  const offset = (page - 1) * pageSize;
  const sort = ['recent', 'maturity', 'relevance'].includes(filters.sort) ? filters.sort : 'recent';

  const params = [];
  const conditions = [
    "ir.publication_state = 'PUBLISHED'",
    'ir.deleted_at IS NULL',
  ];

  // --- multi-value maturity_level filter ---
  if (filters.maturity_level && filters.maturity_level.length > 0) {
    const validMaturity = ['IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED', 'ARCHIVED'];
    const vals = filters.maturity_level.filter(v => validMaturity.includes(v));
    if (vals.length > 0) {
      params.push(vals);
      conditions.push(`ir.maturity_level = ANY($${params.length})`);
    }
  }

  // --- multi-value review_status filter ---
  if (filters.review_status && filters.review_status.length > 0) {
    const validStatus = ['SUBMITTED', 'CURATED', 'TECHNICALLY_REVIEWED', 'SECURITY_REVIEWED', 'POLICY_REVIEWED', 'VALIDATED_FOR_REUSE', 'SUPERSEDED_RETIRED'];
    const vals = filters.review_status.filter(v => validStatus.includes(v));
    if (vals.length > 0) {
      params.push(vals);
      conditions.push(`ir.review_status = ANY($${params.length})`);
    }
  }

  // --- multi-value contributing_office filter ---
  if (filters.contributing_office && filters.contributing_office.length > 0) {
    params.push(filters.contributing_office);
    conditions.push(`ir.contributing_office = ANY($${params.length})`);
  }

  // --- reuse_potential filter (single-value) ---
  if (filters.reuse_potential && ['HIGH', 'MEDIUM', 'LOW'].includes(filters.reuse_potential)) {
    params.push(filters.reuse_potential);
    conditions.push(`ir.reuse_potential = $${params.length}`);
  }

  // --- mission_area tag filter (multi-value — requires ANY on record_tags join) ---
  const hasMissionFilter = filters.mission_area && filters.mission_area.length > 0;
  const hasTechFilter = filters.technology_area && filters.technology_area.length > 0;

  if (hasMissionFilter) {
    params.push(filters.mission_area);
    conditions.push(`EXISTS (SELECT 1 FROM record_tags rt_m WHERE rt_m.record_id = ir.record_id AND rt_m.tag_type = 'MISSION_AREA' AND rt_m.tag_value = ANY($${params.length}))`);
  }

  if (hasTechFilter) {
    params.push(filters.technology_area);
    conditions.push(`EXISTS (SELECT 1 FROM record_tags rt_t WHERE rt_t.record_id = ir.record_id AND rt_t.tag_type = 'TECHNOLOGY_AREA' AND rt_t.tag_value = ANY($${params.length}))`);
  }

  const whereClause = conditions.join(' AND ');

  // ORDER BY — from TechArch §2.1: recent = published_at DESC, maturity = maturity order, relevance → falls back to recent without a search query
  let orderClause;
  if (sort === 'maturity') {
    orderClause = `CASE ir.maturity_level
      WHEN 'PRODUCTION_VALIDATED' THEN 0
      WHEN 'PROTOTYPE_PILOT' THEN 1
      WHEN 'EXPERIMENT_POC' THEN 2
      WHEN 'IDEA' THEN 3
      WHEN 'ARCHIVED' THEN 4
      ELSE 5
    END ASC, ir.published_at DESC NULLS LAST`;
  } else {
    // recent or relevance (no FTS query here — default to recent)
    orderClause = 'ir.published_at DESC NULLS LAST';
  }

  // Count query
  const countSql = `SELECT COUNT(DISTINCT ir.record_id) AS total FROM innovation_records ir WHERE ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Data query — aggregated tags and engagement options via lateral subqueries
  params.push(pageSize);
  const limitParam = params.length;
  params.push(offset);
  const offsetParam = params.length;

  const dataSql = `
    SELECT
      ir.record_id,
      ir.title,
      ir.short_summary,
      ir.maturity_level,
      ir.review_status,
      ir.reuse_potential,
      ir.source_type,
      ir.published_at,
      COALESCE(mission.tags, '{}') AS mission_area_tags,
      COALESCE(tech.tags, '{}')    AS technology_area_tags,
      COALESCE(eng.options, '{}')  AS engagement_options
    FROM innovation_records ir
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(tag_value ORDER BY display_order) AS tags
      FROM record_tags
      WHERE record_id = ir.record_id AND tag_type = 'MISSION_AREA'
    ) mission ON TRUE
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(tag_value ORDER BY display_order) AS tags
      FROM record_tags
      WHERE record_id = ir.record_id AND tag_type = 'TECHNOLOGY_AREA'
    ) tech ON TRUE
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(option_type ORDER BY display_order) AS options
      FROM record_engagement_options
      WHERE record_id = ir.record_id
    ) eng ON TRUE
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const dataResult = await pool.query(dataSql, params);
  const data = dataResult.rows.map(buildCatalogCard);

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

/**
 * CatalogService.getFilterOptions
 *
 * Returns available facet values from PUBLISHED, non-deleted records.
 * Per TechArch §4.2 CatalogFilters interface and FRD F00 §API Surface.
 *
 * @param {import('pg').Pool} pool
 * @returns {CatalogFilters}
 */
async function getFilterOptions(pool) {
  const sql = `
    SELECT
      ARRAY_AGG(DISTINCT ir.maturity_level)       FILTER (WHERE ir.maturity_level IS NOT NULL) AS maturity_levels,
      ARRAY_AGG(DISTINCT ir.review_status)        FILTER (WHERE ir.review_status IS NOT NULL)  AS review_statuses,
      ARRAY_AGG(DISTINCT ir.contributing_office)  FILTER (WHERE ir.contributing_office IS NOT NULL) AS contributing_offices,
      ARRAY_AGG(DISTINCT ir.reuse_potential)      FILTER (WHERE ir.reuse_potential IS NOT NULL) AS reuse_potentials
    FROM innovation_records ir
    WHERE ir.publication_state = 'PUBLISHED'
      AND ir.deleted_at IS NULL
  `;

  const tagSql = `
    SELECT tag_type, ARRAY_AGG(DISTINCT tag_value ORDER BY tag_value) AS tag_values
    FROM record_tags rt
    INNER JOIN innovation_records ir ON ir.record_id = rt.record_id
    WHERE ir.publication_state = 'PUBLISHED'
      AND ir.deleted_at IS NULL
    GROUP BY tag_type
  `;

  const [mainResult, tagResult] = await Promise.all([
    pool.query(sql),
    pool.query(tagSql),
  ]);

  const row = mainResult.rows[0] || {};
  const tagsByType = {};
  for (const tagRow of tagResult.rows) {
    tagsByType[tagRow.tag_type] = tagRow.tag_values || [];
  }

  return {
    maturity_levels: row.maturity_levels || [],
    review_statuses: row.review_statuses || [],
    contributing_offices: row.contributing_offices || [],
    mission_area_tags: tagsByType['MISSION_AREA'] || [],
    technology_area_tags: tagsByType['TECHNOLOGY_AREA'] || [],
    reuse_potentials: row.reuse_potentials || [],
  };
}

module.exports = { listCatalog, getFilterOptions, MATURITY_LABELS, REVIEW_STATUS_LABELS };
