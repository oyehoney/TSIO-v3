---

## F00: Innovation Catalog

**PRD Reference:** F0 — Priority P0 (Critical MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter), P4 (Innovation Contributor), P5 (I&R Curator)

---

### Description

The Innovation Catalog is the primary browsable surface of the Hub. It presents all Published innovation records in a card-based layout that stakeholders can explore without a specific search query. Every catalog card displays the maturity level, review status, mission/technology area tags, and engagement availability indicators so that stakeholders can immediately orient to the landscape of I&R work. The Catalog is the default landing experience for the Hub and the entry point for stakeholders who are browsing rather than searching.

---

### Terminology

- **Catalog Card:** The compact visual unit representing one Innovation Record in the catalog grid. Displays a summary subset of the record's structured fields.
- **Catalog Filter:** A facet control allowing stakeholders to narrow displayed records by a specific metadata field (maturity, review status, mission area, etc.).
- **Engagement Indicator:** A visible badge or label on a catalog card showing what engagement options are available for that record (e.g., "Demo Available," "Adoption Discussion Available").
- **Reuse Badge:** A visual indicator on a catalog card when a record's review status is "Validated for Reuse."
- **Community Badge:** A visible label indicating the record was contributed by a team outside I&R, not conducted by I&R directly.
- **Sort Order:** The ordering of catalog cards. Supported options: Most Recent (default), Maturity (highest first), and Relevance (when combined with a search query).

---

### Sub-Features

- Browse all published innovation records in a paginated card layout
- Filter catalog by maturity level, review status, contributing office, mission area, technology area, and reuse potential
- Sort catalog by recency (default), maturity, and relevance
- Display engagement indicators on each card
- Display community badge for community-contributed records
- Link each card to the full Innovation Record (F02)
- Enforce publication lifecycle: only Published records visible to non-curators
- Curators see all records regardless of publication state, with state labeled on each card

---

### Process

1. User navigates to the Hub root URL (or `/catalog`).
2. System queries the record store for all records with `publication_state = PUBLISHED` (for PUBLIC role) or all records (for CURATOR role).
3. System applies any active filter selections from the query parameters or filter panel.
4. System applies the selected sort order (default: `published_at DESC`).
5. System paginates results (default: 12 cards per page).
6. System renders each result as a catalog card containing: title, mission area tags, technology area tags, maturity level badge, review status badge, engagement indicators, community badge (if applicable), and a "View Record" link.
7. If zero records match the active filters, the system renders an empty-state message with a prompt to clear filters or submit a mission problem (see F05).
8. User clicks a catalog card → system navigates to the full Innovation Record page (see F02).
9. User adjusts a filter → system re-queries and re-renders the catalog without a full page reload (client-side filter application or AJAX).
10. CURATOR role: draft and review-state records are visible with a state indicator label ("DRAFT," "IN REVIEW") and are not accessible to PUBLIC users.

---

### Inputs

- `publication_state` filter (system-applied): `PUBLISHED` for PUBLIC; all states for CURATOR
- `maturity_level` filter (optional, multi-select): one or more of `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED`, `ARCHIVED`
- `review_status` filter (optional, multi-select): one or more of `SUBMITTED`, `CURATED`, `TECHNICALLY_REVIEWED`, `SECURITY_REVIEWED`, `POLICY_REVIEWED`, `VALIDATED_FOR_REUSE`, `SUPERSEDED_RETIRED`
- `contributing_office` filter (optional, multi-select): free-text office name or office ID
- `mission_area` filter (optional, multi-select): tag value
- `technology_area` filter (optional, multi-select): tag value
- `reuse_potential` filter (optional): `HIGH`, `MEDIUM`, `LOW`
- `sort` (optional): `recent` (default), `maturity`, `relevance`
- `page` (optional, integer ≥ 1, default: 1)
- `page_size` (optional, integer, default: 12, max: 50)

---

### Outputs

- **Catalog page rendered** with:
  - Total record count matching current filters
  - Current page of catalog cards (up to `page_size`)
  - Pagination controls (previous/next, page numbers)
  - Active filter summary display
  - Sort control
- **Each catalog card contains:**
  - `title` (string)
  - `short_summary` (string, ≤ 280 characters)
  - `maturity_level` badge with human-readable label and color coding
  - `review_status` badge with human-readable label
  - `mission_area` tags (up to 3 displayed; overflow indicated)
  - `technology_area` tags (up to 3 displayed)
  - `engagement_options` indicators (icon + label per available type)
  - `community_contributed` badge (if `source_type = COMMUNITY`)
  - `reuse_badge` (if `review_status = VALIDATED_FOR_REUSE`)
  - `published_at` date (human-readable: "July 2026")
  - Link → `/records/{record_id}`
- **Empty state:** Message + CTA to submit mission problem (links to F05 form)

---

### Validation

- Only records with `publication_state = PUBLISHED` are returned in catalog queries from PUBLIC role users; any direct URL attempt to a non-published record by a PUBLIC user returns 404.
- Filter values must be valid enum members; invalid filter values are silently ignored (not treated as errors) and the URL parameter is stripped.
- `page` must be a positive integer; non-integer or negative values default to page 1.
- `page_size` must be between 1 and 50; values out of range are clamped to the nearest valid bound.
- Sort values not in the allowed set (`recent`, `maturity`, `relevance`) default to `recent`.
- Records with `publication_state = SUPERSEDED` or `ARCHIVED` are visible to PUBLIC users only if navigated to directly by URL (and are clearly labeled as such); they are not surfaced in the default catalog browse.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| No records match filters | 200 (empty result) | — | "No records match your current filters. Try clearing some filters or [submit a mission problem]." |
| Record store unavailable | 503 | `CATALOG_UNAVAILABLE` | "The catalog is temporarily unavailable. Please try again shortly." |
| Invalid page number (non-integer) | 200 (reset to page 1) | — | Silent: resets to page 1 |
| PUBLIC user accesses non-published record URL | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |
| CURATOR accesses catalog with no records at all | 200 (empty result) | — | "No records exist yet. Create the first record in the admin interface." |

---

### API Surface (F00)

See `Y1-api.md` §Catalog for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/catalog` | None (PUBLIC) | List published records with filter, sort, pagination |
| `GET` | `/api/v1/catalog/filters` | None (PUBLIC) | Return available filter option values (facets) |

---

### Schema Surface (F00)

The Catalog queries the `innovation_records` table filtered by `publication_state`. Tag filters join to `record_tags`. Engagement indicators join to `engagement_options` configured per record. Full DDL in `Y0-schema.md` §innovation_records, §record_tags, §engagement_options.

---

*End of F00-innovation-catalog.md — continues in F01-search-and-discovery.md*
