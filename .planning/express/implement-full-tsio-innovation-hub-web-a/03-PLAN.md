---
phase: implement-full-tsio-innovation-hub-web-a
plan: 03
type: execute
wave: 2
depends_on: [1]
files_modified:
  - src/services/CatalogService.js
  - src/handlers/CatalogHandler.js
  - src/routes/catalog.js
  - src/app.js
  - package.json
  - tests/integration/catalog.test.js
autonomous: true

features:
  implements: ["F0", "F9"]
  depends_on: ["F0", "F9"]
  enables: ["F0", "F9"]

must_haves:
  truths:
    - "GET /api/v1/catalog returns paginated CatalogCard[] with only PUBLISHED records (publication_state='PUBLISHED' AND deleted_at IS NULL) for unauthenticated requests"
    - "GET /api/v1/catalog accepts and applies all 7 filter parameters: maturity_level (multi), review_status (multi), contributing_office (multi), mission_area (multi), technology_area (multi), reuse_potential, sort (recent|maturity|relevance)"
    - "GET /api/v1/catalog paginates with page/page_size; page_size clamped to 1–50; invalid page defaults to 1; sort defaults to recent"
    - "Each CatalogCard in the response includes: record_id, title, short_summary, maturity_level, maturity_label, review_status, review_status_label, reuse_potential, source_type, mission_area_tags[], technology_area_tags[], engagement_options[], is_validated_for_reuse (bool), is_community_contributed (bool), published_at"
    - "GET /api/v1/catalog/filters returns CatalogFilters with DISTINCT values from PUBLISHED records: maturity_levels[], review_statuses[], contributing_offices[], mission_area_tags[], technology_area_tags[], reuse_potentials[]"
    - "Integration tests cover: empty catalog (200 empty array), filtered catalog, pagination bounds, filter facets response, invalid filter values silently ignored"
    - "Node.js/Express app boots and connects to PostgreSQL using DATABASE_URL from environment; healthcheck endpoint GET /healthz returns 200"
  artifacts:
    - path: "src/services/CatalogService.js"
      provides: "CatalogService class with listCatalog(filters, pagination) and getFilterOptions() methods"
      exports: ["CatalogService"]
    - path: "src/handlers/CatalogHandler.js"
      provides: "CatalogHandler with handleList and handleFilters methods wired to CatalogService"
      exports: ["CatalogHandler"]
    - path: "src/routes/catalog.js"
      provides: "Express router mounting GET /catalog and GET /catalog/filters"
      exports: ["catalogRouter"]
    - path: "src/app.js"
      provides: "Express app factory with /api/v1 prefix, /healthz endpoint, pg connection pool"
      exports: ["createApp"]
    - path: "package.json"
      provides: "Node.js project with express, pg, zod, jest, supertest dependencies"
    - path: "tests/integration/catalog.test.js"
      provides: "Integration tests for both catalog endpoints using supertest + real PostgreSQL"
  key_links:
    - from: "CatalogHandler"
      to: "CatalogService.listCatalog()"
      via: "handler delegates filtering/pagination/sorting to service"
      pattern: "CatalogService.*listCatalog"
    - from: "CatalogService"
      to: "innovation_records JOIN record_tags JOIN record_engagement_options"
      via: "parameterized SQL query with WHERE publication_state='PUBLISHED' AND deleted_at IS NULL"
      pattern: "publication_state.*PUBLISHED.*deleted_at.*IS NULL"
    - from: "CatalogService.getFilterOptions()"
      to: "innovation_records JOIN record_tags"
      via: "DISTINCT value query scoped to PUBLISHED records"
      pattern: "DISTINCT.*publication_state.*PUBLISHED"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/migrations/001_core_content_tables.sql"
      exports: ["innovation_records", "record_tags", "record_engagement_options"]
      verify: "grep -n 'CREATE TABLE IF NOT EXISTS innovation_records' db/migrations/001_core_content_tables.sql && grep -n 'CREATE TABLE IF NOT EXISTS record_tags' db/migrations/001_core_content_tables.sql && grep -n 'CREATE TABLE IF NOT EXISTS record_engagement_options' db/migrations/001_core_content_tables.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "docker-compose.yml"
      exports: ["db (postgres:16 service with healthcheck)"]
      verify: "grep -n 'postgres:16' docker-compose.yml && grep -n 'service_healthy' docker-compose.yml && echo CONTRACT_OK"
  provides:
    - artifact: "src/services/CatalogService.js"
      exports:
        - "CatalogService.listCatalog(filters, pagination) → { data: CatalogCard[], pagination: Pagination }"
        - "CatalogService.getFilterOptions() → CatalogFilters"
      shape: |
        listCatalog(filters, pagination):
          filters: {
            maturity_level?: string[],
            review_status?: string[],
            contributing_office?: string[],
            mission_area?: string[],
            technology_area?: string[],
            reuse_potential?: string,
            sort?: 'recent' | 'maturity' | 'relevance'
          }
          pagination: { page: number, page_size: number }
          Returns: { data: CatalogCard[], pagination: { page, page_size, total_count, total_pages } }

        CatalogCard shape (per TechArch §4.2 TypeScript interface CatalogCard):
          record_id: string (UUID)
          title: string
          short_summary: string | null
          maturity_level: MaturityLevel
          maturity_label: string  (human-readable)
          review_status: ReviewStatus
          review_status_label: string  (human-readable)
          reuse_potential: ReusePotential
          source_type: SourceType
          mission_area_tags: string[]
          technology_area_tags: string[]
          engagement_options: EngagementOptionType[]
          is_validated_for_reuse: boolean  (review_status === 'VALIDATED_FOR_REUSE')
          is_community_contributed: boolean  (source_type === 'COMMUNITY')
          published_at: string | null  (ISO 8601 UTC)

        CatalogFilters shape (per TechArch §4.2 TypeScript interface CatalogFilters):
          maturity_levels: MaturityLevel[]
          review_statuses: ReviewStatus[]
          contributing_offices: string[]
          mission_area_tags: string[]
          technology_area_tags: string[]
          reuse_potentials: ReusePotential[]
      verify: "grep -n 'class CatalogService' src/services/CatalogService.js && grep -n 'listCatalog' src/services/CatalogService.js && grep -n 'getFilterOptions' src/services/CatalogService.js && echo CONTRACT_OK"
    - artifact: "src/routes/catalog.js + src/app.js"
      exports:
        - "GET /api/v1/catalog — public, no auth, returns PaginatedResponse<CatalogCard>"
        - "GET /api/v1/catalog/filters — public, no auth, returns CatalogFilters"
        - "GET /healthz — 200 {status: 'ok'}"
      shape: |
        GET /api/v1/catalog
        Query params: maturity_level (repeatable), review_status (repeatable), contributing_office (repeatable),
                      mission_area (repeatable), technology_area (repeatable), reuse_potential,
                      sort (recent|maturity|relevance, default: recent), page (int ≥1, default: 1),
                      page_size (int 1-50, default: 12)
        Response 200:
          { "data": CatalogCard[], "pagination": { "page": 1, "page_size": 12, "total_count": 47, "total_pages": 4 } }
        Response 503:
          { "error": { "code": "CATALOG_UNAVAILABLE", "message": "The catalog is temporarily unavailable. Please try again shortly." } }

        GET /api/v1/catalog/filters
        Response 200:
          { "maturity_levels": MaturityLevel[], "review_statuses": ReviewStatus[], "contributing_offices": string[],
            "mission_area_tags": string[], "technology_area_tags": string[], "reuse_potentials": ReusePotential[] }
      verify: "grep -n 'GET.*catalog' src/routes/catalog.js && grep -n 'GET.*filters' src/routes/catalog.js && echo CONTRACT_OK"
    - artifact: "tests/integration/catalog.test.js"
      exports:
        - "Integration test suite for GET /api/v1/catalog and GET /api/v1/catalog/filters"
      shape: |
        Test file using Jest + supertest against a real PostgreSQL database (DATABASE_URL env var).
        Tests cover: empty catalog (200 empty data[]), filter by maturity_level, filter by review_status,
        pagination (page/page_size), invalid filter values silently ignored, filters endpoint returns
        correct CatalogFilters shape, sort=recent/maturity ordering, 503 on DB unavailable.
      verify: "ls tests/integration/catalog.test.js && echo CONTRACT_OK"
---

<objective>
Implement **CatalogService** — the read-only public API surface for the Innovation Catalog — delivering two endpoints:
- `GET /api/v1/catalog` — paginated, filterable list of PUBLISHED Innovation Records as `CatalogCard[]`
- `GET /api/v1/catalog/filters` — available filter facets derived from PUBLISHED records

Also bootstraps the Node.js/Express application skeleton (`src/app.js`, `package.json`) and the full integration test suite (`tests/integration/catalog.test.js`).

Purpose: This is the primary public-facing entry point for the Hub (F0 — the Innovation Catalog). Wave 4 frontend CatalogPage consumes both endpoints. Every catalog card must surface `maturity_level` and `review_status` badges — the visible expression of the F9 Content, Maturity & Trust Model.

Output:
- `src/services/CatalogService.js` — business logic: filtered/sorted/paginated query + filter facets
- `src/handlers/CatalogHandler.js` — HTTP layer: query param validation, response shaping
- `src/routes/catalog.js` — Express router: GET /catalog, GET /catalog/filters
- `src/app.js` — Express app factory with /api/v1 prefix, DB pool, /healthz
- `package.json` — project manifest with all required dependencies
- `tests/integration/catalog.test.js` — integration tests covering both endpoints
</objective>

<feature_dependencies>
Implements: F0: Innovation Catalog (GET /api/v1/catalog paginated card list + GET /api/v1/catalog/filters facets), F9: Content Maturity and Trust Model (maturity_label, review_status_label, is_validated_for_reuse, is_community_contributed computed on every CatalogCard)
Depends on: F0 (Wave 1 innovation_records + record_tags + record_engagement_options tables from 01-PLAN.md), PostgreSQL running via docker-compose from 02-PLAN.md
Enables: F0: CatalogPage frontend (Wave 4a), F9: maturity/review badge components (Wave 4a), F1: SearchService (Wave 2b — shares app.js and DB pool), F2: RecordService (Wave 2c — shares app structure)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/01-PLAN.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/02-PLAN.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
@project_specs/FRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bootstrap Node.js/Express app and implement CatalogService + CatalogHandler + routes</name>
  <files>
    package.json
    src/app.js
    src/services/CatalogService.js
    src/handlers/CatalogHandler.js
    src/routes/catalog.js
  </files>
  <action>
Bootstrap the Node.js application and implement CatalogService as specified in TechArch §2.1 and the FRD F00 catalog spec.

**Step 1 — Create `package.json`:**

```json
{
  "name": "tsio-innovation-hub",
  "version": "1.0.0",
  "description": "TSIO Innovation Hub — backend API",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "jest --testEnvironment=node --forceExit",
    "test:integration": "jest tests/integration --testEnvironment=node --forceExit"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.12.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  },
  "jest": {
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

**Step 2 — Create `src/app.js` (Express app factory with DB pool):**

```js
'use strict';
const express = require('express');
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

function createApp() {
  const app = express();
  app.use(express.json());

  // Health check — returns 200 with DB ping
  app.get('/healthz', async (req, res) => {
    try {
      await getPool().query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'error', message: err.message });
    }
  });

  // API v1 routes
  const catalogRouter = require('./routes/catalog');
  app.use('/api/v1/catalog', catalogRouter(getPool));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
  });

  return app;
}

module.exports = { createApp, getPool };
```

Also create `src/server.js` as a thin entry point:

```js
'use strict';
require('dotenv').config();
const { createApp } = require('./app');
const PORT = process.env.PORT || 3000;
const app = createApp();
app.listen(PORT, () => {
  console.log(`TSIO Innovation Hub listening on port ${PORT}`);
});
```

**Step 3 — Create `src/services/CatalogService.js`:**

Implements the two service methods per TechArch §2.1 CatalogService spec:
- `listCatalog(pool, filters, pagination)` — queries innovation_records filtered to PUBLISHED, joined with record_tags and record_engagement_options
- `getFilterOptions(pool)` — returns DISTINCT values across PUBLISHED records for all filter facets

**Human-readable label maps (from FRD F09 and TechArch §4.2):**

```
MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived'
}

REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired'
}
```

```js
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
```

**Step 4 — Create `src/handlers/CatalogHandler.js`:**

Handles query parameter validation per FRD F00 §Inputs §Validation. Invalid filter values are silently ignored (not errors). `page` non-integer defaults to 1. `page_size` clamped 1–50.

```js
'use strict';
const { listCatalog, getFilterOptions } = require('../services/CatalogService');

/**
 * Parse a query param that may be a single string or an array of strings.
 * Always returns an array (empty if undefined).
 */
function parseMulti(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * handleList — GET /api/v1/catalog
 */
async function handleList(pool, req, res) {
  try {
    const filters = {
      maturity_level: parseMulti(req.query.maturity_level),
      review_status: parseMulti(req.query.review_status),
      contributing_office: parseMulti(req.query.contributing_office),
      mission_area: parseMulti(req.query.mission_area),
      technology_area: parseMulti(req.query.technology_area),
      reuse_potential: req.query.reuse_potential || undefined,
      sort: req.query.sort || 'recent',
    };

    const pagination = {
      page: req.query.page,
      page_size: req.query.page_size,
    };

    const result = await listCatalog(pool, filters, pagination);
    return res.json(result);
  } catch (err) {
    console.error('CatalogHandler.handleList error:', err);
    return res.status(503).json({
      error: {
        code: 'CATALOG_UNAVAILABLE',
        message: 'The catalog is temporarily unavailable. Please try again shortly.',
      },
    });
  }
}

/**
 * handleFilters — GET /api/v1/catalog/filters
 */
async function handleFilters(pool, req, res) {
  try {
    const filters = await getFilterOptions(pool);
    return res.json(filters);
  } catch (err) {
    console.error('CatalogHandler.handleFilters error:', err);
    return res.status(503).json({
      error: {
        code: 'CATALOG_UNAVAILABLE',
        message: 'The catalog is temporarily unavailable. Please try again shortly.',
      },
    });
  }
}

module.exports = { handleList, handleFilters };
```

**Step 5 — Create `src/routes/catalog.js`:**

```js
'use strict';
const express = require('express');
const { handleList, handleFilters } = require('../handlers/CatalogHandler');

/**
 * Catalog router factory.
 * Accepts getPool function so pool is lazily initialized.
 * @param {function} getPool
 * @returns {express.Router}
 */
function catalogRouter(getPool) {
  const router = express.Router();

  // GET /api/v1/catalog/filters  (must come before /:id style routes to avoid ambiguity)
  router.get('/filters', async (req, res) => {
    await handleFilters(getPool(), req, res);
  });

  // GET /api/v1/catalog
  router.get('/', async (req, res) => {
    await handleList(getPool(), req, res);
  });

  return router;
}

module.exports = catalogRouter;
```

**Important architecture note:** The app uses CommonJS (`require`/`module.exports`) throughout, matching Node.js 20 LTS compatibility and the team's maintainability-first principle (TechArch §1.1). No TypeScript or ESM for this MVP backend. The stack uses Express 4.x, pg driver, Zod for future validation use. All parameterized queries via `pg` prepared statements — never string interpolation (TechArch §5.5 SQL injection prevention).

**Run `npm install` after creating package.json.**
  </action>
  <verify>
```bash
ls package.json src/app.js src/services/CatalogService.js src/handlers/CatalogHandler.js src/routes/catalog.js && echo "FILES_EXIST_OK" && \
grep -n 'publication_state.*PUBLISHED' src/services/CatalogService.js && grep -n 'deleted_at.*IS NULL' src/services/CatalogService.js && echo "PUBLISHED_FILTER_OK" && \
grep -n 'listCatalog' src/services/CatalogService.js && grep -n 'getFilterOptions' src/services/CatalogService.js && echo "SERVICE_METHODS_OK" && \
grep -n 'VALIDATED_FOR_REUSE' src/services/CatalogService.js && grep -n 'is_community_contributed' src/services/CatalogService.js && echo "TRUST_MODEL_FIELDS_OK" && \
grep -n 'handleList\|handleFilters' src/handlers/CatalogHandler.js && echo "HANDLER_METHODS_OK" && \
grep -n "GET.*filters\|GET.*/" src/routes/catalog.js && echo "ROUTES_OK" && \
grep -n '/healthz' src/app.js && grep -n '/api/v1/catalog' src/app.js && echo "APP_WIRING_OK" && \
echo CONTRACT_OK
```
  </verify>
  <done>
- `package.json` exists with express, pg, zod, jest, supertest dependencies
- `src/app.js` creates Express app with `/healthz` and `/api/v1/catalog` routes
- `src/services/CatalogService.js` exports `listCatalog` and `getFilterOptions`
- Every query includes `publication_state = 'PUBLISHED' AND deleted_at IS NULL` (enforced at query layer per TechArch §5.6 rule 4)
- `buildCatalogCard` computes `maturity_label`, `review_status_label`, `is_validated_for_reuse`, `is_community_contributed` (F9 trust model fields)
- Multi-value filter params handled via PostgreSQL `ANY($N)` array parameter
- Sort=maturity uses CASE expression for correct ordering (PRODUCTION_VALIDATED first)
- Invalid filter values are silently ignored (invalid enum values filtered out before building query)
- `src/handlers/CatalogHandler.js` returns 503 on DB errors (per FRD F00 error states)
- `src/routes/catalog.js` mounts `/filters` before `/` to avoid route shadowing
- All SQL uses parameterized queries — no string interpolation
  </done>
</task>

<task type="auto">
  <name>Task 2: Write integration tests for GET /api/v1/catalog and GET /api/v1/catalog/filters</name>
  <files>
    tests/integration/catalog.test.js
  </files>
  <action>
Create `tests/integration/catalog.test.js` using Jest + Supertest. Tests run against a real PostgreSQL instance via `DATABASE_URL` environment variable (provided by docker-compose from Wave 1). Each test case seeds data into a test-isolated state using `BEGIN`/`ROLLBACK` transaction wrapping — or `TRUNCATE` with `CASCADE` in `beforeEach`.

**Test structure:**

```js
'use strict';
const request = require('supertest');
const { Pool } = require('pg');
const { createApp } = require('../../src/app');

// Use a real DB — DATABASE_URL must point to a running PostgreSQL instance
// (docker compose up -d db first)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = createApp();

// System user UUID for created_by/updated_by (from Wave 1 migration note:
// users table created in 002_supporting_tables.sql; for test isolation,
// insert a test user and use its UUID)
let testUserId;

beforeAll(async () => {
  // Insert a test curator user for FK requirements
  const result = await pool.query(`
    INSERT INTO users (email, display_name, role)
    VALUES ('test-curator@ao.uscourts.gov', 'Test Curator', 'CURATOR')
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING user_id
  `);
  testUserId = result.rows[0].user_id;
});

beforeEach(async () => {
  // Clean catalog data before each test; preserve users row
  await pool.query('DELETE FROM record_engagement_options');
  await pool.query('DELETE FROM record_tags');
  await pool.query('DELETE FROM record_key_findings');
  await pool.query('DELETE FROM record_artifact_links');
  await pool.query('DELETE FROM audit_log');
  await pool.query('DELETE FROM innovation_records');
});

afterAll(async () => {
  // Clean up test user
  await pool.query("DELETE FROM users WHERE email = 'test-curator@ao.uscourts.gov'");
  await pool.end();
});

/**
 * Helper: insert a minimal PUBLISHED innovation record.
 * Returns the inserted record_id.
 */
async function insertPublishedRecord(overrides = {}) {
  const defaults = {
    title: 'Test Innovation Record',
    problem_statement: 'A'.repeat(50),
    what_was_explored: 'B'.repeat(50),
    outcome_summary: 'C'.repeat(50),
    maturity_level: 'EXPERIMENT_POC',
    review_status: 'CURATED',
    reuse_potential: 'MEDIUM',
    source_type: 'I_AND_R',
    owner_name: 'Test Owner',
    owner_office: 'TSIO',
    contributing_office: 'TSIO I&R',
    publication_state: 'PUBLISHED',
    published_at: new Date().toISOString(),
    created_by_user_id: testUserId,
    updated_by_user_id: testUserId,
  };
  const record = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO innovation_records
      (title, problem_statement, what_was_explored, outcome_summary,
       maturity_level, review_status, reuse_potential, source_type,
       owner_name, owner_office, contributing_office, publication_state,
       published_at, created_by_user_id, updated_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING record_id`,
    [
      record.title, record.problem_statement, record.what_was_explored, record.outcome_summary,
      record.maturity_level, record.review_status, record.reuse_potential, record.source_type,
      record.owner_name, record.owner_office, record.contributing_office, record.publication_state,
      record.published_at, record.created_by_user_id, record.updated_by_user_id,
    ]
  );
  return result.rows[0].record_id;
}

// ─── GET /api/v1/catalog ────────────────────────────────────────────────────

describe('GET /api/v1/catalog', () => {

  test('returns 200 with empty data array when no records exist', async () => {
    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 12,
      total_count: 0,
      total_pages: 1,
    });
  });

  test('returns published records with correct CatalogCard shape', async () => {
    const recordId = await insertPublishedRecord({ title: 'Audio Security POC' });

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const card = res.body.data[0];
    expect(card.record_id).toBe(recordId);
    expect(card.title).toBe('Audio Security POC');
    expect(card).toHaveProperty('maturity_level', 'EXPERIMENT_POC');
    expect(card).toHaveProperty('maturity_label', 'Experiment / POC');
    expect(card).toHaveProperty('review_status', 'CURATED');
    expect(card).toHaveProperty('review_status_label', 'Curated');
    expect(card).toHaveProperty('is_validated_for_reuse', false);
    expect(card).toHaveProperty('is_community_contributed', false);
    expect(Array.isArray(card.mission_area_tags)).toBe(true);
    expect(Array.isArray(card.technology_area_tags)).toBe(true);
    expect(Array.isArray(card.engagement_options)).toBe(true);
    expect(card).toHaveProperty('published_at');
  });

  test('does NOT return DRAFT records to public users', async () => {
    // Insert a DRAFT record — should not appear in catalog
    await pool.query(
      `INSERT INTO innovation_records
        (title, problem_statement, what_was_explored, outcome_summary,
         maturity_level, review_status, reuse_potential, source_type,
         owner_name, owner_office, contributing_office, publication_state,
         created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,'IDEA','SUBMITTED','LOW','I_AND_R','Owner','TSIO','TSIO','DRAFT',$5,$5)`,
      ['Draft Record', 'A'.repeat(50), 'B'.repeat(50), 'C'.repeat(50), testUserId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('does NOT return soft-deleted PUBLISHED records', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query('UPDATE innovation_records SET deleted_at = NOW() WHERE record_id = $1', [recordId]);

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('filters by maturity_level (single value)', async () => {
    await insertPublishedRecord({ maturity_level: 'EXPERIMENT_POC' });
    await insertPublishedRecord({ maturity_level: 'PROTOTYPE_PILOT', title: 'Pilot Record' });

    const res = await request(app).get('/api/v1/catalog?maturity_level=EXPERIMENT_POC');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].maturity_level).toBe('EXPERIMENT_POC');
  });

  test('filters by maturity_level (multi-value)', async () => {
    await insertPublishedRecord({ maturity_level: 'EXPERIMENT_POC' });
    await insertPublishedRecord({ maturity_level: 'PROTOTYPE_PILOT', title: 'Pilot Record' });
    await insertPublishedRecord({ maturity_level: 'IDEA', title: 'Idea Record' });

    const res = await request(app).get('/api/v1/catalog?maturity_level=EXPERIMENT_POC&maturity_level=PROTOTYPE_PILOT');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test('filters by review_status', async () => {
    await insertPublishedRecord({ review_status: 'VALIDATED_FOR_REUSE' });
    await insertPublishedRecord({ review_status: 'CURATED', title: 'Curated Record' });

    const res = await request(app).get('/api/v1/catalog?review_status=VALIDATED_FOR_REUSE');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].is_validated_for_reuse).toBe(true);
  });

  test('filters by reuse_potential', async () => {
    await insertPublishedRecord({ reuse_potential: 'HIGH' });
    await insertPublishedRecord({ reuse_potential: 'LOW', title: 'Low Reuse Record' });

    const res = await request(app).get('/api/v1/catalog?reuse_potential=HIGH');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reuse_potential).toBe('HIGH');
  });

  test('silently ignores invalid filter values (FRD F00 §Validation)', async () => {
    await insertPublishedRecord();

    // 'INVALID_LEVEL' is not a valid maturity_level — should be ignored, returning all records
    const res = await request(app).get('/api/v1/catalog?maturity_level=INVALID_LEVEL');
    expect(res.status).toBe(200);
    // No maturity filter applied — returns all published records
    expect(res.body.data.length).toBe(1);
  });

  test('paginates correctly with page and page_size', async () => {
    // Insert 3 records
    await insertPublishedRecord({ title: 'Record 1' });
    await insertPublishedRecord({ title: 'Record 2' });
    await insertPublishedRecord({ title: 'Record 3' });

    const res = await request(app).get('/api/v1/catalog?page=1&page_size=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total_count).toBe(3);
    expect(res.body.pagination.total_pages).toBe(2);
    expect(res.body.pagination.page_size).toBe(2);

    const res2 = await request(app).get('/api/v1/catalog?page=2&page_size=2');
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(1);
  });

  test('clamps page_size to 50 maximum (FRD F00 §Validation)', async () => {
    const res = await request(app).get('/api/v1/catalog?page_size=999');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page_size).toBe(50);
  });

  test('defaults to page 1 for invalid page value (FRD F00 §Validation)', async () => {
    const res = await request(app).get('/api/v1/catalog?page=abc');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  test('is_community_contributed = true for COMMUNITY source_type records', async () => {
    await insertPublishedRecord({ source_type: 'COMMUNITY', title: 'Community Record' });

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data[0].is_community_contributed).toBe(true);
  });

  test('includes mission_area_tags and technology_area_tags from record_tags', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query(
      `INSERT INTO record_tags (record_id, tag_type, tag_value, display_order) VALUES ($1,'MISSION_AREA','Cybersecurity',0), ($1,'TECHNOLOGY_AREA','AI/ML',0)`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    const card = res.body.data[0];
    expect(card.mission_area_tags).toContain('Cybersecurity');
    expect(card.technology_area_tags).toContain('AI/ML');
  });

  test('includes engagement_options from record_engagement_options', async () => {
    const recordId = await insertPublishedRecord();
    await pool.query(
      `INSERT INTO record_engagement_options (record_id, option_type, display_order) VALUES ($1,'REQUEST_DEMO',0)`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data[0].engagement_options).toContain('REQUEST_DEMO');
  });

});

// ─── GET /api/v1/catalog/filters ────────────────────────────────────────────

describe('GET /api/v1/catalog/filters', () => {

  test('returns empty arrays when no published records exist', async () => {
    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      maturity_levels: expect.any(Array),
      review_statuses: expect.any(Array),
      contributing_offices: expect.any(Array),
      mission_area_tags: expect.any(Array),
      technology_area_tags: expect.any(Array),
      reuse_potentials: expect.any(Array),
    });
  });

  test('returns correct CatalogFilters shape from published records', async () => {
    const recordId = await insertPublishedRecord({
      maturity_level: 'EXPERIMENT_POC',
      review_status: 'VALIDATED_FOR_REUSE',
      contributing_office: 'TSIO I&R',
      reuse_potential: 'HIGH',
    });
    await pool.query(
      `INSERT INTO record_tags (record_id, tag_type, tag_value) VALUES ($1,'MISSION_AREA','Cybersecurity'), ($1,'TECHNOLOGY_AREA','AI/ML')`,
      [recordId]
    );

    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body.maturity_levels).toContain('EXPERIMENT_POC');
    expect(res.body.review_statuses).toContain('VALIDATED_FOR_REUSE');
    expect(res.body.contributing_offices).toContain('TSIO I&R');
    expect(res.body.mission_area_tags).toContain('Cybersecurity');
    expect(res.body.technology_area_tags).toContain('AI/ML');
    expect(res.body.reuse_potentials).toContain('HIGH');
  });

  test('does NOT include filter values from DRAFT records', async () => {
    // Insert a DRAFT record with a unique office name
    await pool.query(
      `INSERT INTO innovation_records
        (title, problem_statement, what_was_explored, outcome_summary,
         maturity_level, review_status, reuse_potential, source_type,
         owner_name, owner_office, contributing_office, publication_state,
         created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,'IDEA','SUBMITTED','LOW','I_AND_R','Owner','TSIO','DRAFT_ONLY_OFFICE','DRAFT',$5,$5)`,
      ['Draft Only', 'A'.repeat(50), 'B'.repeat(50), 'C'.repeat(50), testUserId]
    );

    const res = await request(app).get('/api/v1/catalog/filters');
    expect(res.status).toBe(200);
    expect(res.body.contributing_offices).not.toContain('DRAFT_ONLY_OFFICE');
  });

});

// ─── GET /healthz ───────────────────────────────────────────────────────────

describe('GET /healthz', () => {
  test('returns 200 {status: ok} when DB is reachable', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

**Test execution pre-requisite:** PostgreSQL must be running with the Wave 1 migrations applied. Use `docker compose up -d db` and wait for healthcheck, then `psql $DATABASE_URL -f db/migrations/001_supporting_tables.sql -f db/migrations/002_core_tables.sql` (or equivalent based on final migration filenames from Plan 01/02).

**Note on migration file names:** Plan 02 renamed the supporting tables migration to `001_supporting_tables.sql` (prefix 001) and core tables to `002_core_tables.sql`. Adjust the `psql` commands in the verify step accordingly.
  </action>
  <verify>
```bash
ls tests/integration/catalog.test.js && echo "TEST_FILE_EXISTS" && \
grep -c "describe\|test(" tests/integration/catalog.test.js && echo "TEST_CASES_PRESENT" && \
grep -n "publication_state.*PUBLISHED\|PUBLISHED.*publication_state" tests/integration/catalog.test.js && echo "PUBLISHED_FILTER_TESTED" && \
grep -n "DRAFT.*records\|NOT.*DRAFT\|draft" tests/integration/catalog.test.js && echo "DRAFT_EXCLUSION_TESTED" && \
grep -n "is_validated_for_reuse\|is_community_contributed" tests/integration/catalog.test.js && echo "TRUST_MODEL_TESTED" && \
grep -n "catalog/filters" tests/integration/catalog.test.js && echo "FILTERS_ENDPOINT_TESTED" && \
grep -n "page_size\|pagination" tests/integration/catalog.test.js && echo "PAGINATION_TESTED" && \
echo CONTRACT_OK
```

To run the full integration test suite (requires running PostgreSQL):
```bash
docker compose up -d db && sleep 8 && \
psql $DATABASE_URL -f db/migrations/001_supporting_tables.sql -f db/migrations/002_core_tables.sql 2>&1 | tail -5 && \
npm install && DATABASE_URL=$DATABASE_URL npx jest tests/integration/catalog.test.js --forceExit 2>&1 | tail -30 && echo "INTEGRATION_TESTS_PASSED"
```
  </verify>
  <done>
- `tests/integration/catalog.test.js` exists with Jest + Supertest
- Tests cover all required scenarios:
  - Empty catalog returns 200 with empty `data[]` and valid `pagination` shape
  - Published record returns correct CatalogCard with all required fields including maturity_label, review_status_label
  - DRAFT records excluded from public catalog (F0 publication rule + TechArch §5.6 rule 4)
  - Soft-deleted records excluded (`deleted_at IS NULL`)
  - Filter by maturity_level (single + multi-value)
  - Filter by review_status
  - Filter by reuse_potential
  - Invalid filter values silently ignored (FRD F00 §Validation)
  - Pagination (page, page_size clamped to 50, invalid page defaults to 1)
  - is_community_contributed = true for COMMUNITY source_type (F9 trust model)
  - mission_area_tags and technology_area_tags populated from record_tags join
  - engagement_options populated from record_engagement_options join
  - GET /api/v1/catalog/filters returns CatalogFilters with correct shape
  - Filters endpoint excludes DRAFT records from facets
  - GET /healthz returns 200 `{status: 'ok'}` with DB reachable
- When run against a PostgreSQL instance with Wave 1 migrations applied, all tests pass
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | Unauthenticated HTTP requests from browsers/clients crossing into the catalog handler with attacker-controlled query parameters (maturity_level, review_status, sort, page, contributing_office, etc.) |
| handler→PostgreSQL | User-supplied filter values crossing from query params into PostgreSQL parameterized queries |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Elevation of Privilege | `CatalogService.listCatalog` — PUBLIC must only see PUBLISHED records | mitigate | All queries in `src/services/CatalogService.js` include `ir.publication_state = 'PUBLISHED' AND ir.deleted_at IS NULL` as hard-coded WHERE predicates (not as user-controlled inputs). This is the service-layer enforcement required by TechArch §5.6 rule 4. The partial index `idx_innovation_records_published_at` uses these same predicates, making a full-scan-exposing predicate omission detectable as a performance regression. |
| T-03-02 | Tampering | `CatalogService` SQL query construction — attacker-controlled filter values injected into parameterized query | mitigate | All filter values are passed as PostgreSQL parameters (`$N` placeholders) via the `pg` driver, never via string interpolation. Multi-value filters use `ANY($N::text[])` parameter binding. Invalid enum values are stripped with an allowlist check (`validMaturity.includes(v)`) before being added to the params array — per TechArch §5.5. |
| T-03-03 | Information Disclosure | Catalog response — no PII fields in PUBLIC API response | mitigate | `buildCatalogCard()` in `src/services/CatalogService.js` constructs the response from an explicit field allowlist (record_id, title, short_summary, maturity_level, review_status, reuse_potential, source_type, published_at, tags, engagement_options). Fields such as owner_name, owner_office, contributing_office, created_by_user_id are NOT projected in catalog card queries (per TechArch §5.4: no PII in public API responses). |
| T-03-04 | Denial of Service | Pagination — unbounded page_size could cause large DB result sets | mitigate | `page_size` is clamped to a maximum of 50 in `CatalogService.listCatalog` (per FRD F00 §Inputs: max 50). A separate COUNT query drives `total_count` rather than fetching all rows. LIMIT+OFFSET is used at the query level to bound result size. |
| T-03-05 | Information Disclosure | `GET /api/v1/catalog/filters` — returns contributing_office values from PUBLISHED records | mitigate | `getFilterOptions()` applies `publication_state = 'PUBLISHED' AND deleted_at IS NULL` to all aggregations. DRAFT record offices and other non-public metadata are not exposed. The contributing_office values are free-text (not a secret) but must still be scoped to PUBLISHED records to prevent pre-publication metadata leakage. |
| T-03-06 | Tampering | Sorting by `maturity` uses CASE expression — user cannot inject sort order | mitigate | The sort parameter is validated against an allowlist `['recent', 'maturity', 'relevance']` in `CatalogService.listCatalog`. The ORDER BY clause uses a hard-coded CASE expression, not a user-supplied string. Invalid sort values default to `recent`. |
</threat_model>

<verification>
After both tasks complete:

1. Verify all source files exist:
   ```bash
   ls package.json src/app.js src/services/CatalogService.js src/handlers/CatalogHandler.js src/routes/catalog.js tests/integration/catalog.test.js && echo "ALL_FILES_OK"
   ```

2. Verify publication state filter is present in service queries:
   ```bash
   grep -c "publication_state.*PUBLISHED" src/services/CatalogService.js
   ```
   Expected: ≥ 2 (listCatalog conditions + getFilterOptions)

3. Verify soft-delete filter is present:
   ```bash
   grep -c "deleted_at.*IS NULL" src/services/CatalogService.js
   ```
   Expected: ≥ 2

4. Verify no string interpolation in SQL (no template literals with user input):
   ```bash
   grep -n '\`.*\${.*filter\|sort\|page\|maturity\|review\|office\|reuse' src/services/CatalogService.js || echo "NO_INTERPOLATION_FOUND_OK"
   ```

5. Verify CatalogCard trust model fields are computed:
   ```bash
   grep "is_validated_for_reuse.*VALIDATED_FOR_REUSE\|is_community_contributed.*COMMUNITY" src/services/CatalogService.js && echo "TRUST_MODEL_COMPUTED_OK"
   ```

6. Verify integration tests exist for key coverage areas:
   ```bash
   grep -c "test(" tests/integration/catalog.test.js
   ```
   Expected: ≥ 14

7. End-to-end smoke test (requires docker-compose DB running with migrations applied):
   ```bash
   docker compose up -d db && sleep 8 && npm install && DATABASE_URL=postgres://tsio_hub_user:tsio_hub_dev_password@localhost:5432/tsio_hub npx jest tests/integration/catalog.test.js --forceExit 2>&1 | tail -10 && echo "INTEGRATION_TESTS_PASSED"
   ```
</verification>

<success_criteria>
- `package.json` exists with express, pg, zod, jest, supertest — `npm install` exits 0
- `src/app.js` creates Express app with `/healthz` (200 `{status:'ok'}`) and `/api/v1/catalog` router mounted
- `src/services/CatalogService.js` exports `listCatalog` and `getFilterOptions` with all filtering, sorting, pagination, and label-computation logic
- All SQL queries include `publication_state = 'PUBLISHED' AND deleted_at IS NULL` — no DRAFT/REVIEW/SUPERSEDED/ARCHIVED records ever returned (TechArch §5.6 rule 4)
- `buildCatalogCard` computes F9 trust model fields: `maturity_label`, `review_status_label`, `is_validated_for_reuse`, `is_community_contributed`
- `GET /api/v1/catalog/filters` returns `CatalogFilters` shape with DISTINCT values from PUBLISHED records only
- All filter values use PostgreSQL parameterized queries (`ANY($N)` pattern) — zero string interpolation
- Invalid enum filter values are silently stripped (FRD F00 §Validation)
- Integration tests pass against a real PostgreSQL instance with Wave 1 migrations applied
- Integration test suite covers: empty catalog, DRAFT exclusion, soft-delete exclusion, filter by maturity/review_status/reuse_potential, multi-value filters, pagination bounds, trust model fields, tags join, engagement_options join, filters endpoint shape, DRAFT exclusion from filters, /healthz
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/03-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (CommonJS, pg driver, parameterized queries, LATERAL subqueries for tags/engagement_options)
- Integration contract summary for Wave 4 CatalogPage frontend consumption
</output>
