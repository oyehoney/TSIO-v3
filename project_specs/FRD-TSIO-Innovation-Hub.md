# FRD: TSIO Innovation Hub

**Document Type:** Functional Requirements Document  
**Project Acronym:** TSIO-Innovation-Hub  
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch  
**Date:** 2026-07-28  
**Version:** 1.0 — MVP  
**Status:** Active  
**Derived from:** PRD-TSIO-Innovation-Hub.md (2026-07-28)

---

## Scope

This FRD specifies the detailed functional behavior of every feature in the TSIO Innovation Hub MVP. It defines inputs, outputs, validation rules, error handling, database schema, and API contracts to a level of precision sufficient for development without further clarification. The FRD is organized as a series of per-feature specifications (F00–F09) followed by consolidated cross-feature artifacts (database schema, API catalog, error catalog, integration points).

This FRD does not specify visual design, hosting environment configuration, identity provider configuration, or deployment procedures. Those are addressed in separate technical and infrastructure deliverables.

---

## Conventions

### How to Read This Document

- **Feature IDs** follow the PRD: F0 → F00, F1 → F01, … F9 → F09 (zero-padded for sort order).
- **Sub-letter suffixes** (e.g., F02a, F02b) indicate that a single PRD feature was split across two chunk files for document size management. Together they form the complete spec for that feature.
- **Cross-reference notation:** `see F03 §Process step 2` means: see feature F03, the Process section, step 2.
- **Cross-feature artifacts:** Full database DDL is in `Y0-schema.md`. Full REST API specs are in `Y1-api.md`. Error codes are in `Y2-errors.md`. Integration contracts are in `Y3-integrations.md`. Each feature chunk contains a brief summary of its relevant schema and API surfaces, with a pointer to the cross-feature file.
- **Required fields** in inputs are marked `(required)`. Optional fields are marked `(optional)`.
- **HTTP status codes** follow standard RFC 7231 semantics.
- **`CURATOR`** role: authenticated I&R team member with write access to curation interface.
- **`PUBLIC`** role: any unauthenticated user accessing the public Hub.

### Field Naming Conventions

- All API field names use `snake_case`.
- All database column names use `snake_case`.
- All enum values use `UPPER_SNAKE_CASE` in API responses; human-readable labels are separate.
- Timestamps are ISO 8601 UTC (`2026-07-28T00:00:00Z`).

---

## Master Table of Contents

| Section | File | Description |
|---------|------|-------------|
| F00 | `F00-innovation-catalog.md` | Innovation Catalog — browsable record surface |
| F01 | `F01-search-and-discovery.md` | Search and Discovery — full-text problem-first search |
| F02a | `F02a-innovation-record.md` | Innovation Record — description, sub-features, process |
| F02b | `F02b-innovation-record.md` | Innovation Record — inputs, outputs, validation, errors |
| F03 | `F03-executive-technical-perspectives.md` | Executive and Technical Perspectives |
| F04 | `F04-lessons-learned-integration.md` | Existing Lessons-Learned Integration |
| F05 | `F05-opportunity-submission.md` | Opportunity Submission |
| F06 | `F06-share-existing-innovation.md` | Share Existing Innovation Work |
| F07 | `F07-engagement-routing.md` | Engagement Routing |
| F08a | `F08a-curation-administration.md` | Curation & Administration — description, process |
| F08b | `F08b-curation-administration.md` | Curation & Administration — inputs, validation, errors |
| F09 | `F09-content-maturity-trust-model.md` | Content, Maturity & Trust Model |
| Y0 | `Y0-schema.md` | Database Schema — full DDL |
| Y1 | `Y1-api.md` | REST API Catalog |
| Y2 | `Y2-errors.md` | Cross-Feature Error Catalog |
| Y3 | `Y3-integrations.md` | External Integration Points |

---

## Shared Terminology (Cross-Feature)

The following terms are used across multiple features. Feature-specific terms are defined in each feature chunk.

- **Innovation Record:** The structured, authoritative representation of a single innovation effort in the Hub. Every catalog entry, search result, and engagement action traces back to a record.
- **Maturity Level:** A curator-assigned classification indicating the development stage of an innovation effort. Five levels: Idea, Experiment/POC, Prototype/Pilot, Production/Validated Pattern, Archived.
- **Review Status:** A curator-assigned classification indicating what governance reviews have been completed for an innovation record. Seven statuses: Submitted, Curated, Technically Reviewed, Security Reviewed, Policy Reviewed, Validated for Reuse, Superseded/Retired.
- **Publication Lifecycle:** The controlled state machine governing record visibility: Draft → Review → Published → Superseded / Archived. Only Published records are visible to non-curators.
- **Curator:** An authorized I&R team member with write access to the curation interface. Responsible for creating, enriching, and governing innovation records.
- **Trust Disclaimer:** A required statement rendered on every published record clarifying the limitations of maturity, publication, and validation status.
- **Artifact Link:** An external URL pointing to an authoritative source document (SharePoint, GitHub, video recording, etc.). The Hub links to artifacts but does not copy or host them.
- **Engagement Request:** A trackable record of a stakeholder action (demo request, adoption discussion request, technical guidance request, briefing request) tied to a specific Innovation Record.
- **Opportunity Submission:** A structured submission from a stakeholder describing a mission problem for I&R consideration.
- **Contribution Submission:** A structured submission from a team outside I&R sharing existing innovation work for curation.
- **Executive Perspective:** The audience-framed view of an Innovation Record optimized for decision-makers and senior leadership.
- **Technical Perspective:** The audience-framed view of an Innovation Record optimized for technical staff, architects, and developers.
- **Mission Area:** A classification tag aligning an innovation record to a Judiciary mission domain (e.g., case management, cybersecurity, court operations).
- **Technology Area:** A classification tag identifying the technology domain of an innovation effort (e.g., AI/ML, cloud infrastructure, identity management).
- **Reuse Potential:** A curator-assigned indicator of how readily an innovation effort can be adopted or adapted by another court or team.
- **Audit History:** A log of material changes to an Innovation Record, including the timestamp, acting user, and field changed.
- **Last-Reviewed Date:** The date on which a curator last reviewed the content and accuracy of an Innovation Record. Required for publication.
- **Configurable Routing Email:** The email address to which engagement requests and submissions are routed. Must be changeable by a curator without a code deployment.
- **P0 / P1 / P2:** PRD priority tiers. P0 = MVP launch blocker; P1 = high-value MVP feature; P2 = late-MVP or post-MVP.

---

*End of 00-header.md — continues in F00-innovation-catalog.md*
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
---

## F01: Search and Discovery

**PRD Reference:** F1 — Priority P0 (Critical MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter)

---

### Description

Search and Discovery is the primary mechanism for stakeholders who arrive with a specific mission problem, technology area, or area of interest. Full-text search allows a stakeholder to describe their need in natural language and surface relevant innovation records without knowing the project name, team, or document location. Search operates across structured fields — problem statements, summaries, key findings, tags, mission area, and technology area — and its results carry the same maturity and review status signals as the catalog.

---

### Terminology

- **Query:** The text string a user enters in the search field. May be a natural language problem description, a keyword, a technology name, or a mission area phrase.
- **Search Result:** A single Innovation Record returned in response to a query, rendered similarly to a catalog card but with a relevance score applied to ordering.
- **Relevance Ranking:** The ordering of search results by how well the record's indexed fields match the query. Problem statement and key findings fields are weighted higher than tags.
- **Empty-State Guidance:** The message and call-to-action rendered when a query returns zero results.
- **Search Index:** The set of fields from each Innovation Record that are indexed for full-text search. Defined in F01 §Inputs below.

---

### Sub-Features

- Full-text search field accessible from the Hub navigation bar (available on all pages) and from the catalog page
- Search executes across a defined set of structured fields per Innovation Record
- Problem statement and key findings fields weighted higher in relevance ranking than tags and title
- Search results filterable by maturity level, review status, contributing office, and reuse potential
- Each result card displays maturity level, review status, and engagement indicators (same as catalog card)
- Empty-state guidance when query returns zero results
- Search accessible via direct URL with query parameters (`/search?q=...`)
- Search is scoped to Published records for PUBLIC role; CURATOR role searches all records

---

### Process

1. User enters a query in the search field and submits (Enter key or search button).
2. System validates query (see Validation).
3. System executes full-text search against the search index for all Published records (PUBLIC role) or all records (CURATOR role).
4. System applies any active filter selections from the filter panel.
5. System ranks results by relevance; ties broken by `published_at DESC`.
6. System renders results as a paginated list of record cards (default: 12 per page).
7. Each result card displays: title, short summary snippet with query terms highlighted, maturity level badge, review status badge, mission/technology area tags, engagement indicators.
8. If zero results: system renders empty-state message with guidance text and a CTA link to the Opportunity Submission form (F05): "No records found — consider submitting this as a mission problem for I&R consideration."
9. User adjusts filters → system re-executes search with updated filter parameters and re-renders results.
10. User clicks a result → system navigates to the full Innovation Record (F02).
11. Search query and filter state are reflected in the URL so results are shareable and bookmarkable.

---

### Inputs

- `q` (string, required for search, 1–500 characters): User query text
- `maturity_level` filter (optional, multi-select): same enum as F00
- `review_status` filter (optional, multi-select): same enum as F00
- `contributing_office` filter (optional, multi-select)
- `reuse_potential` filter (optional): `HIGH`, `MEDIUM`, `LOW`
- `page` (optional, integer ≥ 1, default: 1)
- `page_size` (optional, integer, default: 12, max: 50)

**Search Index Fields (fields searched, with relative weight):**

| Field | Weight | Notes |
|-------|--------|-------|
| `problem_statement` | High (3×) | Mission problem the record addresses |
| `key_findings` | High (3×) | Structured list of primary learnings |
| `what_was_explored` | Medium (2×) | Description of approach and technology |
| `outcome_summary` | Medium (2×) | Outcome and evidence narrative |
| `title` | Medium (2×) | Record title |
| `reuse_guidance` | Standard (1×) | Reuse guidance text |
| `mission_area_tags` | Standard (1×) | Mission area classification tags |
| `technology_area_tags` | Standard (1×) | Technology area classification tags |
| `short_summary` | Standard (1×) | 280-character summary |

---

### Outputs

- **Search results page** with:
  - Query echo ("Showing results for: _audio security_")
  - Total result count
  - Current page of result cards (up to `page_size`)
  - Pagination controls
  - Active filter summary
  - Relevance-ordered result list
- **Each result card** (same fields as catalog card plus):
  - Query-term highlights in the `short_summary` or `problem_statement` snippet
- **Empty state:** "No records found for '[query]'. Try different keywords, or [submit a mission problem for I&R consideration → F05 form link]."
- **URL** updated to reflect query and filter state: `/search?q=audio+security&maturity_level=EXPERIMENT_POC`

---

### Validation

- `q` must be between 1 and 500 characters. If blank or whitespace-only, the system does not execute a search and instead renders the catalog (F00) or a prompt to enter a search term.
- `q` must be sanitized: HTML tags stripped, special characters escaped before being passed to the search engine. No executable content allowed.
- Filter values validated using same rules as F00 §Validation.
- `page` and `page_size` validated using same rules as F00 §Validation.
- Search is restricted to Published records for PUBLIC role. CURATOR search returns all records (including Draft, Review, Superseded, Archived) with state labels on each result card.
- Query results that match records in `SUPERSEDED` or `ARCHIVED` state are not shown to PUBLIC users in search results; they are only accessible via direct URL.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Query is blank or whitespace only | 200 (no search) | — | "Enter a search term to find innovation records." |
| Query exceeds 500 characters | 400 | `QUERY_TOO_LONG` | "Your search query is too long. Please shorten it to 500 characters or fewer." |
| Zero results for valid query | 200 (empty result) | — | "No records found for '[query]'. Try different keywords, or submit a mission problem." |
| Search index unavailable | 503 | `SEARCH_UNAVAILABLE` | "Search is temporarily unavailable. Try browsing the catalog." (with link to `/catalog`) |
| Invalid filter values | 200 (ignored) | — | Invalid filters silently ignored; URL stripped of invalid params |

---

### API Surface (F01)

See `Y1-api.md` §Search for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/search` | None (PUBLIC) | Full-text search with filters and pagination |

---

### Schema Surface (F01)

Search executes against the full-text search index built on the `innovation_records` table and `record_tags` table. The search engine indexes the fields listed in F01 §Inputs. Full DDL in `Y0-schema.md` §innovation_records, §record_tags.

---

*End of F01-search-and-discovery.md — continues in F02a-innovation-record.md*
---

## F02: Innovation Record (Part A — Description, Sub-Features, Process)

**PRD Reference:** F2 — Priority P0 (Critical MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter), P5 (I&R Curator)  
**Continued in:** `F02b-innovation-record.md` (Inputs, Outputs, Validation, Errors, API/Schema)

---

### Description

The Innovation Record is the structured, authoritative representation of a single innovation effort. It is the primary unit of content on the Hub — every catalog entry, search result, and engagement action traces back to a record. A record answers four questions for every stakeholder: What problem was faced? What was explored? What was learned? What should I do next? Records are created and governed exclusively by I&R Curators. They are never self-published by contributors. Every field defined in this spec is part of the canonical record; no field is optional at the point of publication.

The Innovation Record is also the data entity from which Executive and Technical Perspectives (F03) are derived. Both perspectives share the same underlying record data — no duplicate records are created.

---

### Terminology

- **Problem Statement:** A structured description of the mission problem or opportunity that the innovation effort addressed. Written for a broad stakeholder audience, not as an internal project description.
- **What Was Explored:** A description of the approach, technology, and scope of the exploration. For technical audiences; surfaced in the Technical Perspective (F03).
- **Outcome Summary:** A concise narrative of what was found — whether the experiment succeeded, failed, or surfaced partial findings. May be negative.
- **Key Findings:** A structured list (array) of primary learnings from the effort, including limitations, gaps, and caveats. Required; must include at least one finding.
- **Reuse Guidance:** Curator-authored guidance on what a stakeholder would need to consider to adopt or adapt this work in their environment.
- **Source Type:** Whether the record represents I&R-conducted work (`I_AND_R`) or community-contributed work (`COMMUNITY`).
- **Named Owner/Steward:** The I&R team member or office accountable for maintaining the accuracy of this record. Required for publication.
- **Contributing Office:** The organizational unit that produced the innovation work (may differ from Named Owner if community-contributed).
- **Artifact Link:** An external URL to a source document, code repository, video, or diagram. The Hub stores the link but does not copy or host the content. A record requires at least one Artifact Link before it can be published.
- **Next-Action Options:** The set of engagement actions a stakeholder can take from this record (see F07). Each record may have one or more engagement options configured by the curator.
- **Trust Disclaimers:** Required statements that must be rendered on every published record per the Content, Maturity & Trust Model (F09).
- **Last-Reviewed Date:** The date a curator last reviewed the record for accuracy and currency. Required; must be within a curator-configurable staleness window.
- **Audit Entry:** A single logged event recording who changed what field on a record, when.

---

### Sub-Features

- **Record Creation:** Curator creates a new record in Draft state with all structured fields
- **Record Editing:** Curator edits any field of a Draft or Review-state record; Published records require the curator to create a new version or supersede
- **Record Viewing (Public):** PUBLIC users view a Published record's full content including both perspectives
- **Perspective Toggle:** User selects Executive or Technical view of the same record (see F03)
- **Artifact Link Management:** Curator adds, edits, or removes artifact links; at least one required for publication
- **Next-Action Configuration:** Curator configures which engagement options appear on the record (see F07)
- **Trust Disclaimer Rendering:** System automatically renders the applicable trust disclaimers based on maturity level and source type; curator cannot suppress them
- **Audit History View:** Curator views a chronological log of material changes to the record
- **Record Superseding:** Curator marks a record as Superseded and optionally links to the superseding record
- **Record Archiving:** Curator marks a record as Archived

---

### Process

#### Viewing a Record (PUBLIC user)

1. User clicks a catalog card or search result link to `/records/{record_id}`.
2. System retrieves the record by `record_id`.
3. If `publication_state ≠ PUBLISHED` and role is PUBLIC: system returns 404.
4. System renders the Innovation Record page with the Executive Perspective active by default (configurable per record by curator).
5. System renders the perspective toggle (see F03).
6. System renders all required trust disclaimers based on the record's maturity level and source type (see F09).
7. System renders the Next-Action panel with configured engagement options (see F07).
8. System renders artifact links in a dedicated section. Links open in a new tab. No artifact content is embedded.
9. System renders the last-reviewed date and named owner/steward.

#### Creating a Record (CURATOR)

1. Curator navigates to the admin interface and selects "New Innovation Record."
2. System creates a new record in `DRAFT` state with a system-generated `record_id` and `created_at` timestamp.
3. Curator enters all structured fields (see F02b §Inputs for full field list).
4. Curator saves draft at any time; record remains in `DRAFT` state.
5. Curator adds at least one Artifact Link.
6. Curator assigns maturity level, review status, mission area tags, technology area tags, reuse potential.
7. Curator configures engagement options (Next-Action buttons) for the record.
8. Curator sets named owner/steward and contributing office.
9. Curator clicks "Submit for Review" → system validates publication readiness (see F02b §Validation). If any required field is missing, system lists blocking fields and prevents state transition.
10. On successful validation, record transitions to `REVIEW` state. System logs an audit entry.
11. Curator (or designated reviewer) reviews the record in `REVIEW` state.
12. Curator clicks "Publish" → system re-validates, then transitions record to `PUBLISHED` state. System sets `published_at` timestamp. System logs an audit entry.
13. Published record appears in catalog (F00) and search (F01) immediately.

#### Editing a Published Record (CURATOR)

1. Curator opens a Published record in the admin interface.
2. System warns: "This record is Published. Edits will move it to Review state and remove it from public view until re-published."
3. Curator confirms edit intent.
4. System transitions record to `REVIEW` state. System logs an audit entry (state change + actor).
5. Curator makes edits and re-publishes using the same process as steps 9–13 above.
6. Alternatively, if the change is a supersession: curator clicks "Supersede" → system marks the record as `SUPERSEDED`, prompts for the `superseded_by_record_id`, and transitions the new record to Published.

#### Returning a Record to Draft from Review (CURATOR)

1. Curator opens a record in `REVIEW` state in the admin interface.
2. Curator clicks "Return to Draft."
3. System transitions record to `DRAFT` state without requiring confirmation (the record was never public).
4. System logs an audit entry (state change: `REVIEW → DRAFT`, actor, timestamp).
5. No fields are changed; the record retains all content authored to date.
6. Curator may edit any field and re-submit for review using the standard process (steps 9–13 of Creating a Record).

#### Archiving a Record (CURATOR)

1. Curator selects "Archive" on any record.
2. System transitions record to `ARCHIVED` state. System logs an audit entry.
3. Archived records are not shown in the default catalog browse but remain accessible via direct URL with an "Archived" label.

---

*End of F02a-innovation-record.md — continued in F02b-innovation-record.md*
---

## F02: Innovation Record (Part B — Inputs, Outputs, Validation, Errors, API/Schema)

**PRD Reference:** F2 — Priority P0 (Critical MVP)  
**Continued from:** `F02a-innovation-record.md`

---

### Inputs (Full Field Specification)

All fields below are part of the canonical Innovation Record. Fields marked `(pub-required)` must be present and non-empty before a record can transition from `REVIEW` to `PUBLISHED`. Fields marked `(required)` must be present to save; fields marked `(optional)` may be blank.

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `record_id` | UUID | system | System-generated unique identifier |
| `title` | string (5–200 chars) | pub-required | Human-readable title of the innovation effort |
| `problem_statement` | text (50–5000 chars) | pub-required | Mission problem or opportunity addressed |
| `what_was_explored` | text (50–5000 chars) | pub-required | Description of approach, technology, scope |
| `outcome_summary` | text (50–3000 chars) | pub-required | What was found; may be positive, negative, or inconclusive |
| `key_findings` | array of strings (1–20 items, each 10–1000 chars) | pub-required | Structured list of primary learnings; min 1 item |
| `maturity_level` | enum | pub-required | `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED`, `ARCHIVED` |
| `review_status` | enum | pub-required | `SUBMITTED`, `CURATED`, `TECHNICALLY_REVIEWED`, `SECURITY_REVIEWED`, `POLICY_REVIEWED`, `VALIDATED_FOR_REUSE`, `SUPERSEDED_RETIRED` |
| `reuse_guidance` | text (0–3000 chars) | optional | What stakeholder needs to consider for adoption |
| `reuse_potential` | enum | pub-required | `HIGH`, `MEDIUM`, `LOW` |
| `owner_name` | string (2–200 chars) | pub-required | Named owner/steward full name |
| `owner_office` | string (2–200 chars) | pub-required | Owner's organizational unit |
| `contributing_office` | string (2–200 chars) | pub-required | Office that produced the innovation work |
| `source_type` | enum | pub-required | `I_AND_R` or `COMMUNITY` |
| `contributor_attribution` | text (0–500 chars) | optional | Attribution text for contributing team/individuals |
| `mission_area_tags` | array of strings (1–10 items) | pub-required | Mission area classification tags; min 1 |
| `technology_area_tags` | array of strings (0–10 items) | optional | Technology area classification tags |
| `artifact_links` | array of objects (min 1) | pub-required | Each item: `{ label: string, url: string (valid URL), type: enum }` |
| `artifact_link.type` | enum | pub-required per item | `DOCUMENT`, `CODE_REPOSITORY`, `VIDEO`, `DIAGRAM`, `OTHER` |
| `engagement_options` | array of enums (1–4 items) | pub-required | Options from: `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING`. Note: `SUBMIT_RELATED_PROBLEM` is not an engagement option — stakeholders submit related problems via the F05 Opportunity Submission form, which is already linked from the empty-state search and record pages. |
| `trust_disclaimers` | system-applied | system | Automatically derived from `maturity_level` and `source_type`; curator cannot suppress |
| `last_reviewed_date` | date (YYYY-MM-DD) | pub-required | Date curator last verified record accuracy |
| `executive_perspective_text` | text (50–3000 chars) | pub-required | Curator-authored executive framing text |
| `executive_recommendation` | text (50–1000 chars) | pub-required | What a senior leader should consider |
| `technical_perspective_text` | text (50–5000 chars) | optional | Curator-authored technical detail text |
| `security_findings` | text (0–2000 chars) | optional | Security review findings and constraints |
| `performance_findings` | text (0–2000 chars) | optional | Performance and testing results |
| `publication_state` | enum | system | `DRAFT`, `REVIEW`, `PUBLISHED`, `SUPERSEDED`, `ARCHIVED` |
| `superseded_by_record_id` | UUID | optional | Links to the newer record that supersedes this one |
| `created_at` | timestamp | system | Record creation timestamp |
| `updated_at` | timestamp | system | Last modification timestamp |
| `published_at` | timestamp | system | Timestamp of first publication |
| `created_by_user_id` | UUID | system | Curator who created the record |
| `updated_by_user_id` | UUID | system | Curator who last updated the record |

---

### Outputs

- **Public Record Page:** Fully rendered Innovation Record with all published fields, trust disclaimers, perspective toggle, artifact links, and Next-Action panel.
- **Admin Record View:** Same content plus publication state indicator, audit history log, and edit/publish/archive controls.
- **Record JSON (API):** Full structured representation of the record (see `Y1-api.md` §Records).
- **Audit Entry (on state change or field edit):** `{ record_id, changed_by, changed_at, field_changed, old_value, new_value, state_transition }` logged to `audit_log` table.

---

### Validation

**Field-Level Validation (enforced on save and on publish):**

- `title`: 5–200 characters; must not be blank.
- `problem_statement`: 50–5,000 characters; must not be blank; required for publication.
- `what_was_explored`: 50–5,000 characters; required for publication.
- `outcome_summary`: 50–3,000 characters; required for publication.
- `key_findings`: Array; minimum 1 item; each item 10–1,000 characters; maximum 20 items.
- `maturity_level`: Must be a valid enum member; required for publication.
- `review_status`: Must be a valid enum member; required for publication.
- `reuse_potential`: Must be a valid enum member; required for publication.
- `owner_name`, `owner_office`, `contributing_office`: 2–200 characters each; required for publication.
- `source_type`: Must be `I_AND_R` or `COMMUNITY`; required for publication.
- `mission_area_tags`: Minimum 1 tag; each tag 1–100 characters; maximum 10 tags.
- `artifact_links`: Minimum 1 item required for publication. Each URL must be a valid absolute HTTP/HTTPS URL. Each label 2–200 characters. `type` must be valid enum.
- `engagement_options`: Minimum 1 option; maximum 4; all values must be valid enum members.
- `last_reviewed_date`: Must be a valid calendar date not in the future; required for publication.
- `executive_perspective_text`: 50–3,000 characters; required for publication.
- `executive_recommendation`: 50–1,000 characters; required for publication.
- `superseded_by_record_id`: If set, must reference an existing record ID.

**Publication Gate (enforced before `REVIEW → PUBLISHED` transition):**
System checks that ALL `pub-required` fields are non-empty. If any are missing, system returns a list of blocking fields and refuses the transition. No exceptions.

**Trust Disclaimer Logic:**
- If `maturity_level = EXPERIMENT_POC` or `PROTOTYPE_PILOT`: render "POC ≠ production-ready" disclaimer.
- If `publication_state = PUBLISHED` (any record): render "Published ≠ approved for adoption" disclaimer.
- If `source_type = COMMUNITY`: render "Community-submitted ≠ centrally endorsed" disclaimer.
- If `review_status = VALIDATED_FOR_REUSE`: render "Validated for Reuse ≠ local review waived" disclaimer.
- All applicable disclaimers are rendered simultaneously; they are not mutually exclusive.

---

### Error States

| Scenario | HTTP Status | Error Code | User/Curator-Facing Message |
|----------|-------------|------------|------------------------------|
| PUBLIC user requests non-published record | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |
| Curator submits for publish with missing required fields | 422 | `PUBLICATION_GATE_FAILED` | "Publication blocked. Missing required fields: [list of field names]." |
| Curator submits invalid artifact URL | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| `key_findings` array is empty | 422 | `KEY_FINDINGS_REQUIRED` | "At least one key finding is required." |
| `last_reviewed_date` is in the future | 422 | `INVALID_REVIEW_DATE` | "Last-reviewed date cannot be in the future." |
| Record store unavailable on fetch | 503 | `RECORD_UNAVAILABLE` | "This record is temporarily unavailable. Please try again shortly." |
| Curator attempts to edit a PUBLISHED record without confirmation | 409 | `EDIT_REQUIRES_CONFIRMATION` | "Editing this record will move it to Review state and remove it from public view. Confirm to proceed." |
| `superseded_by_record_id` references non-existent record | 422 | `INVALID_SUPERSEDES_REF` | "The superseding record ID does not exist." |

---

### API Surface (F02)

See `Y1-api.md` §Records for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/records/{record_id}` | None (Published); CURATOR for any state | Retrieve a single innovation record |
| `POST` | `/api/v1/records` | CURATOR | Create a new innovation record (Draft state) |
| `PATCH` | `/api/v1/records/{record_id}` | CURATOR | Update fields on a record |
| `POST` | `/api/v1/records/{record_id}/submit-review` | CURATOR | Transition record from DRAFT → REVIEW |
| `POST` | `/api/v1/records/{record_id}/publish` | CURATOR | Transition record from REVIEW → PUBLISHED |
| `POST` | `/api/v1/records/{record_id}/supersede` | CURATOR | Mark record as SUPERSEDED |
| `POST` | `/api/v1/records/{record_id}/archive` | CURATOR | Mark record as ARCHIVED |
| `GET` | `/api/v1/records/{record_id}/audit` | CURATOR | Retrieve audit history for a record |
| `DELETE` | `/api/v1/records/{record_id}` | CURATOR | Permanently delete a record. Permitted only when `publication_state = DRAFT`. Returns 409 with `DELETE_NOT_PERMITTED` if record is in any other state. |

---

### Schema Surface (F02)

Primary tables: `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options`, `audit_log`. Full DDL in `Y0-schema.md` §innovation_records and related tables.

---

*End of F02b-innovation-record.md — continues in F03-executive-technical-perspectives.md*
---

## F03: Executive and Technical Perspectives

**PRD Reference:** F3 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P3 (Technical Adopter)

---

### Description

A single Innovation Record (F02) supports two derived views — an Executive Perspective and a Technical Perspective — so that different audiences receive appropriately framed information from the same underlying record without the team maintaining duplicate records that can drift out of sync. The perspective toggle is visible on every Innovation Record page. The default perspective shown is configured per record by the curator. Both perspectives link to each other and to the full record data.

---

### Terminology

- **Executive Perspective:** The audience-framed view of an Innovation Record optimized for decision-makers and senior leadership. Emphasizes mission relevance, maturity in plain language, and decision guidance. Suppresses deep technical implementation detail.
- **Technical Perspective:** The audience-framed view of an Innovation Record optimized for technical staff, architects, and developers. Includes architecture details, tools, dependencies, security findings, performance results, and technical reuse guidance.
- **Perspective Toggle:** The UI control (tab, button group, or toggle) allowing a user to switch between Executive and Technical views on the same record page.
- **Default Perspective:** The view shown when a record is first opened. Set by the curator; defaults to Executive Perspective if not explicitly configured.
- **Perspective-Specific CTA:** The primary call-to-action button displayed in each perspective, pointing to the most relevant engagement option for that audience.

---

### Sub-Features

- Perspective toggle displayed on every published Innovation Record page
- Executive Perspective view: mission relevance, maturity in plain language, decision recommendation, briefing/demo CTA
- Technical Perspective view: architecture, technology stack, tools/dependencies, security findings, performance results, reuse guidance, technical artifact links, technical guidance CTA
- Curator configures which perspective is shown by default
- Both perspectives derived from the same underlying record (no duplicate records)
- Each perspective links back to the other
- Trust disclaimers rendered in both perspectives (sourced from the same underlying record)

---

### Process

#### Viewing Perspectives (PUBLIC user)

1. User opens an Innovation Record page at `/records/{record_id}`.
2. System renders the record in the default perspective (curator-configured; fallback: Executive).
3. System displays the perspective toggle control labeled "Executive View" and "Technical View."
4. User clicks "Technical View" → system re-renders the record content area showing Technical Perspective fields without a page reload.
5. User clicks "Executive View" → system reverts to Executive Perspective content.
6. URL may optionally include a `?view=executive` or `?view=technical` query parameter so perspective-specific links can be shared directly.
7. Trust disclaimers are rendered identically in both perspectives.
8. Engagement options (Next-Action panel) are rendered in both perspectives; the primary CTA button changes per perspective:
   - Executive: "Request Briefing" or "Request Demo" is the primary CTA
   - Technical: "Request Technical Guidance" is the primary CTA
9. Artifact links are shown in both perspectives; technical artifact types (code repos, architecture diagrams) are given visual prominence in Technical Perspective.

#### Curator Configuration

1. Curator opens a record in the admin interface.
2. Curator sets `default_perspective` field to `EXECUTIVE` or `TECHNICAL`.
3. Curator authors `executive_perspective_text` (mission relevance framing, 50–3,000 chars) — see F02b §Inputs.
4. Curator authors `executive_recommendation` (decision guidance for senior leaders, 50–1,000 chars).
5. Curator optionally authors `technical_perspective_text` (technical architecture and detail narrative, 50–5,000 chars).
6. Curator optionally populates `security_findings` and `performance_findings` fields (rendered only in Technical Perspective).
7. All perspective content is stored on the Innovation Record (no separate record entity).

---

### Inputs

- `record_id` (UUID, required): The Innovation Record to display
- `view` (optional query param): `executive` or `technical`; defaults to `default_perspective` on the record

**Curator Inputs (part of Innovation Record — see F02b):**
- `executive_perspective_text` (text, 50–3,000 chars, pub-required)
- `executive_recommendation` (text, 50–1,000 chars, pub-required)
- `technical_perspective_text` (text, 50–5,000 chars, optional)
- `security_findings` (text, 0–2,000 chars, optional)
- `performance_findings` (text, 0–2,000 chars, optional)
- `default_perspective` (enum: `EXECUTIVE` or `TECHNICAL`, default: `EXECUTIVE`)

---

### Outputs

**Executive Perspective renders:**
- `executive_perspective_text` (mission relevance framing)
- `executive_recommendation` (decision guidance)
- `maturity_level` in plain language (human-readable label, not enum value)
- `review_status` in plain language
- `reuse_potential` in plain language
- Trust disclaimers (same as full record)
- Primary CTA: most prominent engagement option for executive audience (configured per record)
- Link: "View Technical Details →" (switches to Technical Perspective)

**Technical Perspective renders:**
- `what_was_explored` (approach and technology description)
- `technical_perspective_text` (if populated)
- `security_findings` (if populated)
- `performance_findings` (if populated)
- `reuse_guidance` (reuse and adaptation guidance)
- `artifact_links` (all types; code repos and diagrams visually prominent)
- `technology_area_tags`
- Trust disclaimers (same as full record)
- Primary CTA: "Request Technical Guidance" engagement option
- Link: "View Executive Summary →" (switches to Executive Perspective)

**Both Perspectives render (common elements):**
- `title`
- `problem_statement`
- `outcome_summary`
- `key_findings`
- `maturity_level` badge
- `review_status` badge
- `last_reviewed_date`
- `owner_name` and `owner_office`
- `contributing_office` and `contributor_attribution` (if community)
- All engagement options (Next-Action panel)
- Community badge (if `source_type = COMMUNITY`)
- All applicable trust disclaimers

---

### Validation

- `view` parameter: if present, must be `executive` or `technical`; any other value defaults to `executive`.
- If `technical_perspective_text` is empty, the Technical Perspective tab/view is still rendered but displays a message: "Technical detail for this record is not yet available. Contact the I&R team for more information." The perspective toggle is not hidden.
- `default_perspective` defaults to `EXECUTIVE` if not explicitly set by the curator.
- The perspective toggle must always be displayed on the record page; it cannot be disabled or hidden even if Technical Perspective content is minimal.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Invalid `view` param value | 200 (defaults to executive) | — | Silent fallback; no error shown |
| Technical perspective content empty | 200 | — | "Technical detail for this record is not yet available." (placeholder rendered in Technical view) |
| Record not found or not published (PUBLIC) | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |

---

### API Surface (F03)

Perspectives are derived from the Innovation Record; no separate API endpoint. Use `GET /api/v1/records/{record_id}` (see `Y1-api.md` §Records). The response payload includes all perspective fields. The `view` query parameter is a frontend rendering concern, not a backend filter.

---

### Schema Surface (F03)

Perspective fields are stored on the `innovation_records` table: `executive_perspective_text`, `executive_recommendation`, `technical_perspective_text`, `security_findings`, `performance_findings`, `default_perspective`. Full DDL in `Y0-schema.md` §innovation_records.

---

*End of F03-executive-technical-perspectives.md — continues in F04-lessons-learned-integration.md*
---

## F04: Existing Lessons-Learned Integration

**PRD Reference:** F4 — Priority P1 (High-Value MVP; required for first content records)  
**Personas Served:** P5 (I&R Curator)

---

### Description

The Hub treats existing lessons-learned documents as authoritative sources, not as content to be migrated or replaced. Curators create structured Innovation Records (F02) that surface metadata, problem context, and key findings around existing documents — making them discoverable and actionable — without relocating or modifying the originals. The Audio Security POC lessons-learned document in SharePoint is the MVP anchor record for this pattern. This feature describes the specific curation workflow and constraints for integrating existing documents as artifact sources.

---

### Terminology

- **Authoritative Source Document:** An existing document (SharePoint page, PDF, Git README, recorded video) that is the original output of an innovation effort. The Hub does not copy, modify, or host it.
- **Structured Wrapper Record:** An Innovation Record in the Hub that provides problem context, structured key findings, maturity classification, and navigation to an Authoritative Source Document.
- **Key Findings Extraction:** The process by which a curator reads the source document and enters its primary learnings as structured `key_findings` items on the Innovation Record. This is a human-authored curation step, not automated extraction.
- **Artifact Link (Lessons-Learned):** An Artifact Link of type `DOCUMENT` pointing to the external URL of the source document (SharePoint, SharePoint Online, direct file link, video URL, etc.).
- **Audio Security POC:** The MVP anchor record. Source: TSIO I&R Audio Security Proof of Concept lessons-learned document in SharePoint. Key structured findings include: GPU/CPU separation architecture, Azure Government Cloud constraints, performance and testing limitations, and production-readiness gaps.

---

### Sub-Features

- Curator creates a full Innovation Record (F02) using an existing document as the primary artifact source
- `artifact_links` field stores the external URL to the source document (no content is copied)
- Key findings from the source document entered manually by the curator as structured `key_findings` items
- Record is searchable by problem statement and key findings without requiring the source document to be indexed
- Source document does not need to be reformatted, relocated, or modified
- Record is discoverable via catalog (F00) and search (F01)
- Record carries a `source_type = I_AND_R` designation if the work was I&R-conducted

---

### Process

1. Curator identifies an existing lessons-learned document suitable for Hub integration (e.g., Audio Security POC SharePoint page).
2. Curator reads the source document and identifies:
   - The mission problem it addressed
   - What was explored
   - The key findings, limitations, and gaps
   - The maturity level of the effort (e.g., `EXPERIMENT_POC`)
   - Whether any formal reviews have been completed
3. Curator opens the admin interface and creates a new Innovation Record (F02 creation process).
4. Curator enters the problem statement, what was explored, and outcome summary based on the source document.
5. Curator enters key findings as structured items. For Audio Security POC, required findings include:
   - GPU/CPU separation architectural requirement and rationale
   - Azure Government Cloud feature constraints affecting real-time audio processing
   - Performance and latency limitations observed during testing
   - Production-readiness gaps and conditions not yet met
6. Curator adds an `artifact_link` of type `DOCUMENT` with the SharePoint URL of the source document and a label (e.g., "Audio Security POC Lessons-Learned Document").
7. Curator assigns maturity level, review status, mission/technology area tags.
8. Curator authors the executive and technical perspective fields.
9. Curator sets `last_reviewed_date` to today.
10. Curator publishes the record following the standard publication process (see F02a §Process).
11. Published record is discoverable in catalog and search. Stakeholders navigate to the artifact link to access the source document directly.

---

### Inputs

Same as F02b §Inputs. The following fields are specifically relevant to the lessons-learned integration pattern:

- `artifact_links` (array, min 1 item, pub-required): Must include at least one link of type `DOCUMENT` pointing to the source document external URL
- `key_findings` (array, pub-required): Manually authored from source document content; minimum 1 item
- `what_was_explored` (text, pub-required): Summarizes the approach described in the source document
- `outcome_summary` (text, pub-required): Summarizes the findings described in the source document
- `source_type` (enum, pub-required): `I_AND_R` for I&R-produced lessons-learned documents

**No additional inputs specific to this feature.** The lessons-learned integration pattern is a curation workflow, not a distinct system feature with new data fields.

---

### Outputs

- A fully published Innovation Record discoverable in catalog (F00) and search (F01)
- The record's `artifact_links` section renders the external URL to the source document
- Stakeholders can navigate to the source document directly from the Hub record
- The source document is not modified, hosted, or copied by the Hub

---

### Validation

- At least one `artifact_link` of type `DOCUMENT` is strongly recommended (not system-enforced as type-specific) for lessons-learned records; general publication gate requires at least one artifact link of any type (see F02b §Validation).
- `artifact_link.url` must be a valid absolute HTTPS URL. SharePoint URLs (e.g., `https://ao.sharepoint.com/sites/...`) are valid.
- The Hub must not attempt to crawl, index, or cache the content of the linked source document. Only the URL and label are stored.
- `key_findings` must be manually authored; no automated extraction from linked documents is performed or implied.
- If the source document URL becomes unreachable, the Innovation Record remains valid and published. The broken link is a content issue to be resolved by the curator during the next review cycle, not a system error that unpublishes the record.
- **Link reachability check:** The system performs a non-blocking HTTP HEAD check on each artifact URL when the curator saves the record (Draft or any state) and again on the REVIEW → PUBLISHED transition. If the URL returns a non-200 response, the system renders an inline advisory on the affected artifact link field: "This URL may not be accessible. Verify the link before publishing." This advisory is also written as a warning entry in the audit log. The check does not block saving or publishing — it is informational only.

---

### Error States

| Scenario | HTTP Status | Error Code | Curator-Facing Message |
|----------|-------------|------------|------------------------|
| Artifact URL is not a valid HTTPS URL | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| Curator attempts to publish with no artifact links | 422 | `PUBLICATION_GATE_FAILED` | "At least one artifact link is required before publishing." |
| Artifact URL returns non-200 on save or publish (link check runs on every save and on publish transition) | 200 (warning only, non-blocking) | — | Curator sees inline advisory on the artifact link field: "This URL may not be accessible. Verify the link before publishing." Advisory is also written as a warning entry in the audit log. Record is not blocked from saving or publishing. |
| Source document access requires authentication the stakeholder doesn't have | 200 (record valid) | — | No system error; curator should note access requirements in `reuse_guidance` or `technical_perspective_text` |

---

### API Surface (F04)

No dedicated API endpoints. Uses standard Innovation Record API (see `Y1-api.md` §Records). The lessons-learned integration is a curation workflow pattern, not a separate API surface.

---

### Schema Surface (F04)

Uses `record_artifact_links` table. Each row: `{ record_id, label, url, type, display_order }`. Full DDL in `Y0-schema.md` §record_artifact_links.

---

*End of F04-lessons-learned-integration.md — continues in F05-opportunity-submission.md*
---

## F05: Opportunity Submission

**PRD Reference:** F5 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader)

---

### Description

Operational leaders and decision-makers can submit a mission problem or innovation opportunity for I&R consideration through a structured, problem-first form. The form guides the submitter to articulate the mission problem before proposing solutions — a deliberate design choice that prevents solution-first framing and aligns with the Hub's problem-first discovery philosophy. Submission initiates a curation review process; it does not imply portfolio acceptance, a commitment to begin a project, or a timeline. Submissions are routed to the I&R team via configurable email and visible in the curator admin interface.

---

### Terminology

- **Opportunity Submission:** A structured record capturing a mission problem or innovation opportunity submitted by a stakeholder for I&R team consideration.
- **Problem-First Framing:** The form design principle that leads submitters to describe the mission problem, not jump to a proposed technology or solution. Form field labels and help text reinforce this.
- **Submission Confirmation:** The on-screen acknowledgment and optional email confirmation sent to the submitter after a successful submission. Must explicitly state that submission does not imply acceptance or project commitment.
- **Configurable Routing Email:** The email address to which submission notifications are sent. Initial value: `AOml_TSO_IRB_Team@ao.uscourts.gov`. Changeable by a curator without code deployment (see F08).
- **Submission Disposition:** The curator's recorded action on a submission: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`. Visible in the admin interface; not surfaced to the submitter.

---

### Sub-Features

- Public-facing submission form accessible from the catalog, record pages, and search empty state
- Problem-first form field ordering and labeling
- Server-side and client-side input validation
- Spam/abuse protection (CAPTCHA or rate limiting)
- Submission confirmation message on screen with explicit "not a commitment" language
- Optional email confirmation to submitter
- Automated email notification to I&R routing address on submission
- Submission record stored and visible in curator admin interface (F08)
- Curator can update disposition status on each submission
- No authentication required for submission in MVP

---

### Process

#### Submitter (PUBLIC)

1. Submitter navigates to the submission form at `/submit-opportunity` or via a CTA link from catalog/record pages.
2. System renders the structured submission form with problem-first field ordering and helper text.
3. Submitter completes all required fields and optional fields as desired.
4. Submitter completes spam/abuse protection (CAPTCHA or equivalent).
5. Submitter clicks "Submit."
6. System validates all fields (see Validation). If errors: system re-renders the form with inline error messages on invalid fields. Submitter's input is preserved.
7. On valid submission: system creates an `opportunity_submission` record with `status = SUBMITTED` and `submitted_at = now()`.
8. System sends email notification to the configurable routing address with a formatted summary of the submission.
9. System optionally sends a confirmation email to the submitter (if `submitter_email` was provided).
10. System renders the submission confirmation page with explicit language: "Your submission has been received by the TSIO I&R team. This submission does not imply acceptance of the opportunity into the I&R portfolio or a commitment to begin a project. The I&R team will review submissions on a periodic basis and may reach out if they have questions."
11. Submitter may optionally be offered a "Return to Catalog" CTA.

#### Curator (Admin Interface)

1. Curator navigates to the Submissions section in the admin interface.
2. System displays all `opportunity_submission` records in reverse chronological order, with status indicators.
3. Curator reviews a submission and updates its `disposition` field: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`.
4. If `LINKED_TO_RECORD`: curator enters the `linked_record_id` of the Innovation Record that addresses this submission.
5. Disposition history is logged (timestamp + curator user ID).

---

### Inputs

**Submission Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `problem_description` | text (50–3,000 chars) | required | The mission problem or opportunity (problem-first framing; label: "Describe the mission problem you are facing") |
| `mission_area` | string (2–200 chars) | required | The mission domain this problem falls under (e.g., "Court Operations," "Cybersecurity") |
| `submitting_office` | string (2–200 chars) | required | The submitter's organizational unit or court |
| `submitter_name` | string (2–200 chars) | required | Submitter's full name |
| `submitter_email` | string, email format | required | Submitter's email address (used for confirmation email and follow-up) |
| `submitter_title` | string (0–200 chars) | optional | Submitter's title or role |
| `urgency_context` | text (0–1,000 chars) | optional | Any urgency or priority context the I&R team should know |
| `known_constraints` | text (0–1,000 chars) | optional | Known constraints, previous attempts, or related work the submitter is aware of |
| `captcha_token` | string | required | CAPTCHA verification token (anti-spam) |

---

### Outputs

- **Opportunity Submission record** created in `opportunity_submissions` table with `status = SUBMITTED`
- **Email notification** sent to configurable routing address containing: submission timestamp, submitter name, office, email, mission area, problem description, urgency context, known constraints, and a link to the submission in the admin interface
- **Optional confirmation email** to `submitter_email` with submission receipt text and "not a commitment" language
- **Confirmation page** rendered to submitter with explicit submission acknowledgment
- **Admin interface entry** visible to curators in Submissions queue

---

### Validation

- `problem_description`: 50–3,000 characters; must not be blank; must not be a URL or single-word entry (encouraged by field label and help text; not technically blocked beyond length).
- `mission_area`: 2–200 characters; required.
- `submitting_office`: 2–200 characters; required.
- `submitter_name`: 2–200 characters; required.
- `submitter_email`: Must be a valid email format (`user@domain.tld`); required.
- `captcha_token`: Must be validated against the CAPTCHA provider before submission is accepted. If invalid or missing, return 422 with `CAPTCHA_INVALID`.
- Rate limiting: Maximum 5 submissions per IP address per hour. Submissions exceeding this limit receive a 429 response.
- All text fields: HTML tags stripped; content is stored as plain text.
- No authentication required from the submitter in MVP. If authentication is added in a future release, this section will be updated.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." (inline on each invalid field) |
| `problem_description` too short | 422 | `FIELD_TOO_SHORT` | "Please provide more detail — at least 50 characters." |
| Invalid email format | 422 | `INVALID_EMAIL` | "Please enter a valid email address." |
| CAPTCHA verification failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many submissions. Please wait before submitting again." |
| Email routing failure (routing email bounces) | 200 (submission still saved) | — | No user-facing error; submission is stored; curator resolves routing issue in admin |
| Submission service unavailable | 503 | `SUBMISSION_UNAVAILABLE` | "The submission form is temporarily unavailable. Please try again shortly or contact the I&R team directly." |

---

### API Surface (F05)

See `Y1-api.md` §Submissions for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/opportunity-submissions` | None (PUBLIC) | Submit a mission problem or opportunity |
| `GET` | `/api/v1/opportunity-submissions` | CURATOR | List all opportunity submissions (admin) |
| `PATCH` | `/api/v1/opportunity-submissions/{submission_id}` | CURATOR | Update disposition of a submission |

---

### Schema Surface (F05)

Primary table: `opportunity_submissions`. Full DDL in `Y0-schema.md` §opportunity_submissions.

---

*End of F05-opportunity-submission.md — continues in F06-share-existing-innovation.md*
---

## F06: Share Existing Innovation Work

**PRD Reference:** F6 — Priority P2 (Late-MVP / Post-MVP)  
**Personas Served:** P4 (Innovation Contributor)

---

### Description

Teams outside I&R that have conducted their own innovation work can submit that work for consideration and curation through a structured contribution form. Submissions enter a curation workflow before any public Innovation Record is created — the I&R team curates, enriches, and governs the record before publication. Published records from community contributors are clearly distinguished from I&R-conducted work via a visible community badge and a trust disclaimer. This feature is scoped for late-MVP or early post-MVP delivery; the submission form and admin queue are the MVP deliverable; full curator workflow is the same as F02.

---

### Terminology

- **Contribution Submission:** A structured record capturing an existing innovation effort submitted by a team outside I&R for curation and potential publication on the Hub.
- **Contributing Team:** The organizational unit (court, AO office, program team) that conducted the innovation work and is submitting it.
- **Community Record:** An Innovation Record published on the Hub where `source_type = COMMUNITY`, indicating it was contributed by a team outside I&R and curated by I&R.
- **Curation Review (Contribution):** The I&R curator workflow for reviewing, enriching, and deciding whether to publish a contribution submission as an Innovation Record.
- **Contribution Disposition:** The curator's recorded action: `UNDER_REVIEW`, `ACCEPTED_FOR_CURATION`, `DECLINED`, `PUBLISHED` (linked to record ID). Not surfaced to the contributor.
- **Self-Assessed Maturity:** The maturity level the contributing team believes their work has reached. Curator assigns the final maturity level and is not bound by the self-assessment.

---

### Sub-Features

- Public-facing contribution form accessible from the Hub navigation or a dedicated "Share Your Work" CTA
- Structured form with fields for: work description, problem addressed, outcome summary, self-assessed maturity, artifact URLs, team/office, contact information
- Explicit acknowledgment on form that submission enters curation review and publication is not guaranteed
- Automated email notification to I&R routing address on submission
- Submission record stored and visible in curator admin interface (F08)
- Curator reviews and creates an Innovation Record (F02) from the contribution if accepted
- Curator sets `source_type = COMMUNITY` on the resulting Innovation Record
- Published community records display community badge and required trust disclaimer
- Attribution: contributing team/office credited on published record via `contributing_office` and `contributor_attribution` fields

---

### Process

#### Contributor (PUBLIC)

1. Contributor navigates to the contribution form at `/share-innovation` or via a CTA.
2. System renders the contribution submission form with helper text explaining: "Submissions enter I&R curation review. Publication is not guaranteed. If published, your team will be credited."
3. Contributor completes all required fields (see Inputs).
4. Contributor completes CAPTCHA.
5. Contributor clicks "Submit."
6. System validates all fields. If errors: re-renders form with inline error messages.
7. On valid submission: system creates a `contribution_submission` record with `status = SUBMITTED`.
8. System sends email notification to the configurable routing address.
9. System optionally sends confirmation email to contributor.
10. System renders confirmation page: "Your submission has been received. The I&R team will review it for potential curation. This submission does not guarantee publication. If your work is published, your team will receive attribution."

#### Curator (Admin Interface)

1. Curator navigates to the Contributions section in the admin interface.
2. System displays all `contribution_submission` records with status indicators.
3. Curator reviews a submission and updates `disposition`:
   - `DECLINED`: Curator records a brief reason (internal note; not surfaced to contributor).
   - `ACCEPTED_FOR_CURATION`: Curator creates a new Innovation Record (F02) populated from the submission data, sets `source_type = COMMUNITY`, enters `contributing_office` and `contributor_attribution` from submission data, and proceeds through the standard publication lifecycle.
4. Once the record is published, curator updates the contribution submission `disposition` to `PUBLISHED` and links `linked_record_id`.

---

### Inputs

**Contribution Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `work_description` | text (50–3,000 chars) | required | Description of the innovation work |
| `problem_addressed` | text (50–2,000 chars) | required | The mission problem this work addressed |
| `outcome_summary` | text (50–2,000 chars) | required | Summary of what was found or built |
| `self_assessed_maturity` | enum | required | Submitter's best estimate: `IDEA`, `EXPERIMENT_POC`, `PROTOTYPE_PILOT`, `PRODUCTION_VALIDATED` |
| `artifact_urls` | array of strings (1–5 valid URLs) | required | Links to existing artifacts (SharePoint, GitHub, video) |
| `contributing_team` | string (2–200 chars) | required | Team or office name |
| `contributing_office` | string (2–200 chars) | required | Organizational unit |
| `contact_name` | string (2–200 chars) | required | Primary contact full name |
| `contact_email` | string, email format | required | Primary contact email |
| `contact_title` | string (0–200 chars) | optional | Contact's title or role |
| `additional_context` | text (0–1,000 chars) | optional | Anything else the curator should know |
| `captcha_token` | string | required | CAPTCHA verification token |

---

### Outputs

- **Contribution Submission record** created in `contribution_submissions` table with `status = SUBMITTED`
- **Email notification** to routing address with: submission timestamp, contributing team, contact info, work description, problem addressed, outcome summary, self-assessed maturity, artifact URLs
- **Optional confirmation email** to `contact_email`
- **Confirmation page** rendered to contributor
- **Admin interface entry** in Contributions queue
- **Innovation Record (if accepted):** Standard F02 record with `source_type = COMMUNITY` and community attribution fields populated

---

### Validation

- Same email, CAPTCHA, rate-limiting, and text-sanitization rules as F05 §Validation apply.
- `artifact_urls`: Minimum 1 item; maximum 5; each must be a valid absolute HTTPS URL.
- `self_assessed_maturity`: Must be a valid enum member (excluding `ARCHIVED` — self-assessed maturity cannot be "Archived").
- Curator is not required to use the `self_assessed_maturity` value; they assign the final maturity level independently.
- Rate limiting: Same as F05 (5 submissions per IP per hour).

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." |
| No artifact URLs provided | 422 | `ARTIFACT_URL_REQUIRED` | "At least one artifact link is required." |
| Invalid artifact URL format | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| CAPTCHA failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many submissions. Please wait before submitting again." |
| Submission service unavailable | 503 | `SUBMISSION_UNAVAILABLE` | "The submission form is temporarily unavailable. Please try again shortly." |

---

### API Surface (F06)

See `Y1-api.md` §Contributions for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/contribution-submissions` | None (PUBLIC) | Submit existing innovation work for curation |
| `GET` | `/api/v1/contribution-submissions` | CURATOR | List all contribution submissions (admin) |
| `PATCH` | `/api/v1/contribution-submissions/{submission_id}` | CURATOR | Update disposition of a contribution |

---

### Schema Surface (F06)

Primary table: `contribution_submissions`. Full DDL in `Y0-schema.md` §contribution_submissions.

---

*End of F06-share-existing-innovation.md — continues in F07-engagement-routing.md*
---

## F07: Engagement Routing

**PRD Reference:** F7 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter), P5 (I&R Curator)

---

### Description

Every engagement action a stakeholder takes on the Hub — demo request, adoption discussion request, technical guidance request, briefing request — is captured as a trackable engagement record and routed to the I&R team. Initial MVP implementation uses configurable email routing to minimize infrastructure complexity. Each engagement request is tied to a specific Innovation Record, so the I&R team knows exactly what the requestor is interested in. Engagement activity is visible to curators in the admin interface, giving the team visibility into which records are attracting interest.

---

### Terminology

- **Engagement Request:** A trackable record capturing a stakeholder's request to take a next action related to a specific Innovation Record. Includes request type, record reference, requestor identity, office, description of interest, and desired next step.
- **Engagement Option:** One of the configured next-action types available on a specific Innovation Record: `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING`. (Note: submitting a related problem is handled via the F05 Opportunity Submission form — not a distinct engagement option.)
- **Next-Action Panel:** The UI section on every Innovation Record page that displays the configured engagement options as actionable buttons or links.
- **Configurable Routing Email:** The email address that receives all engagement request notifications. Initial value: `AOml_TSO_IRB_Team@ao.uscourts.gov`. Changeable by a curator without code deployment.
- **Engagement Confirmation:** The on-screen acknowledgment shown to the requestor after submitting an engagement request.
- **Engagement Activity Log:** The admin interface view showing all engagement requests across all records, with request type, record title, requestor info, and timestamp.

---

### Sub-Features

- Engagement request form triggered from the Next-Action panel on any Innovation Record page
- One form per engagement option type (demo, adoption, technical guidance, briefing, related problem)
- Trackable engagement record stored per request
- Email notification to configurable routing address on each request
- Optional confirmation email to requestor
- Engagement confirmation message rendered on screen
- Engagement activity log visible to curators in admin interface
- Curator can view engagement requests per record and across all records
- Routing email address configurable in admin settings (no code deployment required)

---

### Process

#### Requestor (PUBLIC)

1. Requestor views an Innovation Record page.
2. System displays the Next-Action panel with configured engagement options (1–4 buttons/links).
3. Requestor clicks an engagement option (e.g., "Request Demo").
4. System renders an inline form or modal containing: requestor name, office, email, description of interest, desired next step (pre-populated with the engagement type label).
5. Requestor completes the form and clicks "Submit Request."
6. System validates all fields (see Validation).
7. On valid submission: system creates an `engagement_request` record with `status = SUBMITTED`, `request_type` = selected option, `record_id` = current record.
8. System sends email notification to the configurable routing address containing: request type, record title and URL, requestor name, office, email, description of interest, timestamp.
9. System optionally sends confirmation email to requestor.
10. System renders confirmation: "Your request has been sent to the I&R team. Someone will follow up with you based on team availability."
11. Requestor may dismiss the modal or continue browsing.

#### Curator (Admin Interface)

1. Curator navigates to Engagement Activity in the admin interface.
2. System displays all engagement requests in reverse chronological order with: request type, record title, requestor name, office, email, submitted timestamp, and status.
3. Curator can filter by record, request type, or date range.
4. Curator updates request `status` as needed: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` or `NO_ACTION`.
5. Curator can view engagement requests scoped to a specific record from the record's admin detail view.

#### Curator (Routing Email Configuration)

1. Curator navigates to Hub Settings in the admin interface.
2. Curator updates the `engagement_routing_email` setting value (see F08).
3. System saves the new value. All subsequent engagement request notifications are sent to the updated address.
4. No code deployment required.

---

### Inputs

**Engagement Request Form Fields:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `request_type` | enum | required (system-set) | `REQUEST_DEMO`, `REQUEST_ADOPTION_DISCUSSION`, `REQUEST_TECHNICAL_GUIDANCE`, `REQUEST_BRIEFING` |
| `record_id` | UUID | required (system-set) | The Innovation Record this request is about |
| `requestor_name` | string (2–200 chars) | required | Requestor's full name |
| `requestor_email` | string, email format | required | Requestor's email address |
| `requestor_office` | string (2–200 chars) | required | Requestor's organizational unit or court |
| `requestor_title` | string (0–200 chars) | optional | Requestor's title or role |
| `description_of_interest` | text (20–2,000 chars) | required | What the requestor is hoping to learn or accomplish |
| `desired_next_step` | text (0–500 chars) | optional | Requestor's suggested or preferred next step |
| `captcha_token` | string | required | CAPTCHA verification token |

---

### Outputs

- **Engagement Request record** created in `engagement_requests` table
- **Email notification** to routing address with full request details and direct link to the Innovation Record
- **Optional confirmation email** to `requestor_email`
- **On-screen confirmation** rendered to requestor
- **Admin interface entry** visible in Engagement Activity log

---

### Validation

- `requestor_name`: 2–200 characters; required.
- `requestor_email`: Valid email format; required.
- `requestor_office`: 2–200 characters; required.
- `description_of_interest`: 20–2,000 characters; required.
- `request_type`: Must be a valid enum member; must be one of the engagement options configured for the target record. A requestor cannot request a type not configured on the record.
- `record_id`: Must reference an existing, Published Innovation Record. Engagement requests against non-published records are rejected.
- `captcha_token`: Must be validated. If invalid, return 422 `CAPTCHA_INVALID`.
- Rate limiting: Maximum 10 engagement requests per IP per hour. Exceeding this returns 429.
- All text fields: HTML stripped; stored as plain text.
- `engagement_routing_email` (admin setting): Must be a valid email format when saved. Cannot be blank.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Required field missing | 422 | `VALIDATION_ERROR` | "[Field label] is required." |
| Invalid email format | 422 | `INVALID_EMAIL` | "Please enter a valid email address." |
| CAPTCHA failed | 422 | `CAPTCHA_INVALID` | "CAPTCHA verification failed. Please try again." |
| Rate limit exceeded | 429 | `RATE_LIMIT_EXCEEDED` | "Too many requests. Please wait before submitting again." |
| Record is not published (request submitted via direct API call) | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |
| Request type not configured for target record | 422 | `INVALID_ENGAGEMENT_TYPE` | "This engagement option is not available for the selected record." |
| Email routing failure | 200 (request saved) | — | No user-facing error; request is stored; curator resolves in admin |
| Routing service unavailable | 503 | `ENGAGEMENT_UNAVAILABLE` | "The engagement form is temporarily unavailable. Please try again or contact the I&R team directly." |

---

### API Surface (F07)

See `Y1-api.md` §Engagement for full request/response schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/engagement-requests` | None (PUBLIC) | Submit an engagement request |
| `GET` | `/api/v1/engagement-requests` | CURATOR | List all engagement requests (admin) |
| `GET` | `/api/v1/engagement-requests?record_id={id}` | CURATOR | List engagement requests for a specific record |
| `PATCH` | `/api/v1/engagement-requests/{request_id}` | CURATOR | Update status of an engagement request |
| `GET` | `/api/v1/settings/routing-email` | CURATOR | Get current routing email setting |
| `PUT` | `/api/v1/settings/routing-email` | CURATOR | Update routing email setting |

---

### Schema Surface (F07)

Primary tables: `engagement_requests`, `hub_settings`. Full DDL in `Y0-schema.md` §engagement_requests, §hub_settings.

---

*End of F07-engagement-routing.md — continues in F08a-curation-administration.md*
---

## F08: Curation and Administration (Part A — Description, Sub-Features, Process)

**PRD Reference:** F8 — Priority P0 (Critical MVP)  
**Personas Served:** P5 (I&R Curator)  
**Continued in:** `F08b-curation-administration.md` (Inputs, Outputs, Validation, Errors, API/Schema)

---

### Description

The Curation and Administration interface is the operational backbone of the Hub's governance model. It is accessible only to authenticated I&R Curators. It provides all capabilities required to create, enrich, govern, and publish Innovation Records; review incoming opportunity and contribution submissions; monitor engagement activity; and configure Hub-level settings such as the engagement routing email address. Without this interface, the Hub cannot operate — curators cannot create records, governance cannot be enforced, and the publication lifecycle cannot be managed.

Access to the admin interface is controlled by role-based authentication. The specific identity provider (Azure AD or other) is determined during discovery (see PROJECT.md §Constraints). The admin interface is separate from the public Hub in URL path (e.g., `/admin/*`) and access control policy.

---

### Terminology

- **Curation Interface:** The authenticated admin area of the Hub, accessible only to users with the CURATOR role.
- **Record Management:** The CRUD operations available in the curation interface for Innovation Records.
- **Publication Lifecycle:** The governed state machine (Draft → Review → Published → Superseded / Archived) controlled exclusively by curators.
- **Governance Enforcement:** The system-level validation that prevents a record from transitioning to Published state unless all required fields are present.
- **Submission Queue:** The admin view displaying incoming Opportunity Submissions (F05) and Contribution Submissions (F06) awaiting curator review.
- **Engagement Activity Log:** The admin view displaying all engagement requests (F07) received, with request type, record reference, requestor info, and status.
- **Audit History:** The per-record log of material changes (field edits, state transitions) with timestamp and curator identity.
- **Hub Settings:** Admin-configurable system settings, including the engagement routing email address.
- **CURATOR Role:** An authenticated user with write access to the curation interface. Assigned by system administrator. In MVP, role assignment is managed at the identity/user management layer.

---

### Sub-Features

- **Record Management:** Create, edit, and (Draft-state only) permanently delete Innovation Records; manage all structured fields (see F02). Published, Superseded, and Archived records cannot be deleted — use Archive to remove from catalog browse.
- **Maturity & Review Status Assignment:** Assign and update maturity level and review status; changes logged to audit history
- **Publication Lifecycle Control:** Manage record state transitions (Draft → Review → Published → Superseded → Archived); governance gate enforced before publish
- **Owner & Attribution Management:** Assign named owner/steward, contributing office, contributor attribution
- **Submission Review (Opportunities):** View, filter, and update disposition of opportunity submissions (F05)
- **Submission Review (Contributions):** View, filter, and update disposition of contribution submissions (F06); create Innovation Record from accepted contribution
- **Engagement Monitoring:** View engagement request log; filter by record, type, date range; update request status
- **Audit History View:** View per-record audit history (field changes, state transitions, timestamps, actors)
- **Hub Settings Management:** View and update configurable settings (engagement routing email)
- **Content Model Reference:** In-app reference display of maturity level and review status definitions for curator consistency
- **Access Control:** Admin interface accessible only to CURATOR role; public Hub accessible without authentication

---

### Process

#### Curator Login

1. Curator navigates to `/admin`.
2. System checks for authenticated session (via identity provider — TBD).
3. If no valid session: system redirects to identity provider login.
4. After successful authentication, system checks CURATOR role assignment.
5. If role not assigned: system renders 403 "Access Denied" page.
6. If role assigned: system renders the admin dashboard.

#### Admin Dashboard

1. System displays summary tiles: total published records, total draft records, pending submissions (opportunity + contribution), recent engagement requests (last 7 days).
2. Curator navigates to one of: Records, Submissions (Opportunities), Submissions (Contributions), Engagement, Settings.

#### Record Management

1. Curator navigates to Records section.
2. System displays all Innovation Records (all publication states) in a table with columns: Title, Maturity, Review Status, Publication State, Owner, Last Updated.
3. Curator filters or searches records by title, publication state, maturity, review status.
4. Curator selects "New Record" → follows F02a §Process (Creating a Record).
5. Curator selects an existing record → admin record detail view renders with all fields editable.
6. Curator edits fields and saves → system validates field-level constraints (see F02b §Validation) and saves to `DRAFT` or current state.
7. Curator advances record through publication lifecycle → system enforces governance gate at each state transition.
8. Curator views audit history for a record → system renders audit log for that `record_id`.

#### Submission Review — Opportunities

1. Curator navigates to Submissions → Opportunities.
2. System lists all `opportunity_submissions` in reverse chronological order with status.
3. Curator opens a submission and reviews its fields.
4. Curator updates `disposition`: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, or `LINKED_TO_RECORD`.
5. If `LINKED_TO_RECORD`: curator enters the `linked_record_id` of the relevant Innovation Record.
6. Disposition change logged with timestamp and curator user ID.

#### Submission Review — Contributions

1. Curator navigates to Submissions → Contributions.
2. System lists all `contribution_submissions` in reverse chronological order with status.
3. Curator opens a submission and reviews its fields.
4. Curator updates `disposition`:
   - `DECLINED`: curator enters an internal note (not surfaced to contributor).
   - `ACCEPTED_FOR_CURATION`: curator clicks "Create Record from Submission" → system pre-populates a new Draft Innovation Record with available data from the submission (work description → `what_was_explored`, problem addressed → `problem_statement`, outcome summary → `outcome_summary`, artifact URLs → `artifact_links`, contributing team/office → `contributing_office`, contact name/email → `contributor_attribution`). Curator enriches and publishes following F02a process.
5. When record is published: curator sets `disposition = PUBLISHED` and `linked_record_id` on the contribution submission.

#### Engagement Monitoring

1. Curator navigates to Engagement.
2. System displays all engagement requests in reverse chronological order: request type, record title (linked), requestor name, office, submitted_at, status.
3. Curator filters by record, request type, or date range.
4. Curator opens a request and views full details (description_of_interest, desired_next_step, requestor contact).
5. Curator updates status: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` or `NO_ACTION`.

#### Hub Settings

1. Curator navigates to Settings.
2. System displays current value of `engagement_routing_email`.
3. Curator updates the value and saves.
4. System validates email format and saves to `hub_settings` table.
5. All subsequent routing emails are sent to the new address.
6. System displays other configurable settings (e.g., default page size, contact email) as defined in the `hub_settings` table.

---

*End of F08a-curation-administration.md — continued in F08b-curation-administration.md*
---

## F08: Curation and Administration (Part B — Inputs, Outputs, Validation, Errors, API/Schema)

**PRD Reference:** F8 — Priority P0 (Critical MVP)  
**Continued from:** `F08a-curation-administration.md`

---

### Inputs

**Record Management Inputs:** All Innovation Record fields as defined in F02b §Inputs. The admin interface provides a form for all fields; the same field-level validation rules apply.

**Submission Disposition Inputs:**

| Field | Type | Req? | Context |
|-------|------|------|---------|
| `disposition` | enum | required | For opportunity submissions: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, `LINKED_TO_RECORD`. For contribution submissions: `UNDER_REVIEW`, `ACCEPTED_FOR_CURATION`, `DECLINED`, `PUBLISHED` |
| `linked_record_id` | UUID | conditional | Required when `disposition = LINKED_TO_RECORD` or `PUBLISHED` |
| `internal_note` | text (0–1,000 chars) | optional | Curator-only note on disposition decision (not surfaced externally) |

**Engagement Request Status Update Inputs:**

| Field | Type | Req? | Description |
|-------|------|------|-------------|
| `status` | enum | required | `SUBMITTED`, `IN_PROGRESS`, `COMPLETED`, `NO_ACTION` |
| `curator_note` | text (0–500 chars) | optional | Internal curator note on the request |

**Hub Settings Inputs:**

| Setting Key | Type | Req? | Description |
|-------------|------|------|-------------|
| `engagement_routing_email` | string, email format | required (not blank) | Email address for all engagement and submission routing notifications |
| `contact_display_email` | string, email format | optional | Email displayed on the Hub for general inquiries (public-facing) |
| `catalog_default_page_size` | integer (6–50) | optional | Default number of cards per catalog page |
| `default_perspective` | enum (`EXECUTIVE`, `TECHNICAL`) | optional | System-wide fallback default perspective (overridden per record if set) |

---

### Outputs

**Admin Dashboard Outputs:**
- Summary tile: total Published records count
- Summary tile: total Draft + Review records count
- Summary tile: pending opportunity submissions count (status = `SUBMITTED` or `UNDER_REVIEW`)
- Summary tile: pending contribution submissions count (status = `SUBMITTED` or `UNDER_REVIEW`)
- Summary tile: engagement requests in last 7 days count
- Quick links to each admin section

**Record Management Outputs:**
- Record list table with all records and current state
- Record detail/edit form with all structured fields
- Governance gate feedback: list of blocking fields on failed publish attempt
- Audit history log for each record: `[timestamp] [curator_name] changed [field] from [old_value] to [new_value]`

**Submission Queue Outputs:**
- List of opportunity submissions with: submitter name, office, mission area, submitted_at, disposition status
- List of contribution submissions with: contact name, contributing office, submitted_at, self-assessed maturity, disposition status
- Full submission detail view per record

**Engagement Activity Outputs:**
- List of engagement requests with: request type, record title (linked), requestor name, office, submitted_at, status
- Full engagement request detail view
- Filter/sort controls

**Settings Outputs:**
- Current value of each Hub setting displayed and editable

---

### Validation

**Access Control:**
- All `/admin/*` routes require authenticated CURATOR session.
- Unauthenticated requests to admin routes: redirect to identity provider login.
- Authenticated requests by non-CURATOR role: return 403.
- Session management follows the identity provider's token expiry rules. Expired sessions redirect to login.

**Record Operations:**
- All field-level validation rules from F02b §Validation apply when creating or editing records.
- State transitions must follow the publication lifecycle strictly:
  - `DRAFT` → `REVIEW` (Submit for Review)
  - `REVIEW` → `PUBLISHED` (Publish) — governance gate applied
  - `REVIEW` → `DRAFT` (Return to Draft)
  - `PUBLISHED` → `REVIEW` (Edit — requires confirmation)
  - `PUBLISHED` → `SUPERSEDED` (Supersede — requires `superseded_by_record_id`)
  - `PUBLISHED` → `ARCHIVED` (Archive)
  - `SUPERSEDED` → `ARCHIVED` (Archive)
  - No other transitions are valid.
- Deletion: only Draft-state records may be deleted by a curator. Published, Superseded, and Archived records cannot be deleted (soft-delete only; retained for audit integrity).

**Submission Dispositions:**
- `linked_record_id` is required when `disposition = LINKED_TO_RECORD` or `PUBLISHED`; must reference an existing record.
- `internal_note` is optional; max 1,000 characters.

**Settings:**
- `engagement_routing_email`: required to be non-blank and valid email format; validated on save.
- `catalog_default_page_size`: must be integer 6–50.

---

### Error States

| Scenario | HTTP Status | Error Code | Curator-Facing Message |
|----------|-------------|------------|------------------------|
| Unauthenticated access to admin route | 302 | — | Redirect to identity provider login |
| Authenticated but non-CURATOR role | 403 | `ACCESS_DENIED` | "You do not have permission to access the administration interface." |
| Expired session | 302 | — | Redirect to identity provider login |
| Governance gate failure on publish | 422 | `PUBLICATION_GATE_FAILED` | "Publication blocked. Missing required fields: [field list]." |
| Invalid state transition attempted | 422 | `INVALID_STATE_TRANSITION` | "This state transition is not permitted. Current state: [state]. Allowed transitions: [list]." |
| Attempt to delete a non-Draft record | 422 | `DELETE_NOT_PERMITTED` | "Only Draft-state records may be deleted. To remove from public view, Archive this record instead." |
| `linked_record_id` references non-existent record | 422 | `INVALID_RECORD_REF` | "The linked record ID does not exist." |
| Invalid routing email format in settings | 422 | `INVALID_EMAIL` | "Routing email must be a valid email address." |
| Admin data service unavailable | 503 | `ADMIN_UNAVAILABLE` | "The administration interface is temporarily unavailable. Please try again shortly." |
| Attempt to create two CURATOR accounts by a non-admin | 403 | `ACCESS_DENIED` | "User management requires system administrator access." |

---

### API Surface (F08)

The curation interface may be served as a traditional server-rendered admin panel or as a single-page application consuming the same REST API as the public Hub, with CURATOR-role endpoints. All CURATOR-protected endpoints require a valid session token in the `Authorization` header or session cookie.

See `Y1-api.md` §Admin for full curator API schemas.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/records` | CURATOR | List all records (all states) |
| `GET` | `/api/v1/admin/dashboard-summary` | CURATOR | Return dashboard summary counts |
| `GET` | `/api/v1/admin/opportunity-submissions` | CURATOR | List opportunity submissions |
| `PATCH` | `/api/v1/admin/opportunity-submissions/{id}` | CURATOR | Update submission disposition |
| `GET` | `/api/v1/admin/contribution-submissions` | CURATOR | List contribution submissions |
| `PATCH` | `/api/v1/admin/contribution-submissions/{id}` | CURATOR | Update contribution disposition |
| `POST` | `/api/v1/admin/contribution-submissions/{id}/create-record` | CURATOR | Create Innovation Record from contribution |
| `GET` | `/api/v1/admin/engagement-requests` | CURATOR | List all engagement requests |
| `PATCH` | `/api/v1/admin/engagement-requests/{id}` | CURATOR | Update engagement request status |
| `GET` | `/api/v1/admin/settings` | CURATOR | Get all Hub settings |
| `PUT` | `/api/v1/admin/settings` | CURATOR | Update Hub settings |
| `GET` | `/api/v1/admin/maturity-reference` | CURATOR | Get maturity level definitions (content model reference) |
| `GET` | `/api/v1/admin/review-status-reference` | CURATOR | Get review status definitions (content model reference) |

---

### Schema Surface (F08)

The admin interface operates on all tables defined in `Y0-schema.md`:
- `innovation_records`, `record_key_findings`, `record_artifact_links`, `record_tags`, `record_engagement_options` (record management)
- `opportunity_submissions` (opportunity queue)
- `contribution_submissions` (contribution queue)
- `engagement_requests` (engagement monitoring)
- `hub_settings` (settings management)
- `audit_log` (audit history)
- `users` (curator identity; populated by identity provider integration)

Full DDL in `Y0-schema.md`.

---

*End of F08b-curation-administration.md — continues in F09-content-maturity-trust-model.md*
---

## F09: Content, Maturity & Trust Model

**PRD Reference:** F9 — Priority P0 (Critical MVP — Foundational)  
**Personas Served:** All (P1–P5)

---

### Description

The Content, Maturity & Trust Model defines the structured vocabulary, classification rules, and display requirements that govern how innovation work is categorized, communicated, and trusted across the Hub. It is not a standalone user-facing feature but the foundational framework that every other feature depends on. The maturity level and review status models are the primary trust signals on every record — they tell stakeholders what development stage an effort has reached and what governance reviews have been completed. These signals must be visibly rendered on every catalog card and Innovation Record page, and they must be enforced in the curation workflow. This feature defines the exact values, labels, display requirements, and behavioral constraints for each signal.

---

### Terminology

- **Maturity Level:** A five-tier curator-assigned classification of how far an innovation effort has progressed from idea to validated pattern.
- **Review Status:** A seven-state curator-assigned classification of what governance reviews have been applied to an innovation effort.
- **Trust Signal:** Any UI element that communicates maturity, review status, or trust disclaimer context to a stakeholder. Trust signals must be visually prominent and unambiguous.
- **Trust Disclaimer:** Required text statements that must appear on every published Innovation Record page, derived from the record's maturity and source type. Not suppressible by curators.
- **Content Model Reference:** The in-app display of maturity and review status definitions available to curators in the admin interface to ensure consistent classification.

---

### Sub-Features

- Maturity level model: 5 levels defined, enforced, and displayed
- Review status model: 7 statuses defined, enforced, and displayed
- Trust disclaimer rendering on every published Innovation Record
- Catalog card trust signal display (maturity badge + review status badge)
- Content model reference view in admin interface
- Filtering support for both models in catalog (F00) and search (F01)
- Maturity and review status are curator-assigned only; never self-reported or automatically derived

---

### Maturity Level Model

Maturity is curator-assigned. Curators may not advance maturity without a deliberate edit action. The following are the authoritative definitions:

| Level | Enum Value | Display Label | Color/Visual | Definition |
|-------|-----------|---------------|--------------|------------|
| 1 | `IDEA` | Idea | Gray | A problem or opportunity has been identified and captured; no technical exploration has yet been conducted |
| 2 | `EXPERIMENT_POC` | Experiment / POC | Yellow | A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive; not production-ready |
| 3 | `PROTOTYPE_PILOT` | Prototype / Pilot | Orange | A working model or limited deployment was built and tested in a realistic environment; not fully validated |
| 4 | `PRODUCTION_VALIDATED` | Production / Validated Pattern | Green | Fully deployed and operational, or a proven architectural pattern validated through formal review |
| — | `ARCHIVED` | Archived | Dark Gray | Work is no longer active; retained for institutional learning; not recommended for adoption |

**Behavioral rules:**
- Maturity level must be assigned before a record can be published.
- Curators may set any maturity level; the system does not auto-advance or auto-restrict maturity based on other fields.
- Maturity level changes are logged to the audit history.
- `ARCHIVED` maturity is distinct from `ARCHIVED` publication state. These are independent controls with different meanings:
  - **`maturity_level = ARCHIVED`** signals that the *innovation work itself* is no longer active — the effort was stopped, superseded, or retired. It describes the state of the underlying work.
  - **`publication_state = ARCHIVED`** signals that the *Hub record* has been removed from the default catalog browse. The record is still accessible via direct URL with an "Archived" label.
  - **Curator guidance:** When retiring a completed-or-stopped innovation effort, curators should set both `maturity_level = ARCHIVED` and `publication_state = ARCHIVED`. Setting maturity alone leaves the record visible in the default catalog browse. Setting publication state alone removes catalog visibility but does not signal the work's retirement status on the record itself.
  - The system does not automatically cascade one to the other. When a curator sets `maturity_level = ARCHIVED` on a Published record, the admin interface displays an advisory: "This record's work is marked as Archived. Consider also archiving the publication state to remove it from the default catalog browse."

---

### Review Status Model

Review status is curator-assigned, independent from maturity level. A technically sophisticated POC may lack policy or security review. All statuses are valid regardless of maturity level.

| Status | Enum Value | Display Label | Definition |
|--------|-----------|---------------|------------|
| 1 | `SUBMITTED` | Submitted | Record is in the system; not yet curated by I&R |
| 2 | `CURATED` | Curated | I&R curator has structured and enriched the record; not yet externally reviewed |
| 3 | `TECHNICALLY_REVIEWED` | Technically Reviewed | I&R or AO technical team has assessed architecture and findings |
| 4 | `SECURITY_REVIEWED` | Security Reviewed | Cybersecurity or ISSO review of security implications completed |
| 5 | `POLICY_REVIEWED` | Policy Reviewed | Legal, privacy, or policy review completed |
| 6 | `VALIDATED_FOR_REUSE` | Validated for Reuse | All applicable reviews completed; recommended as a reuse-ready pattern |
| 7 | `SUPERSEDED_RETIRED` | Superseded / Retired | Record replaced by a newer version or retired; retained for institutional record |

**Behavioral rules:**
- Review status must be assigned before a record can be published.
- Review statuses are not a sequential progression — curators assign the highest applicable status. A record may jump from `CURATED` directly to `VALIDATED_FOR_REUSE` if all applicable reviews have been completed simultaneously.
- `VALIDATED_FOR_REUSE` triggers the Reuse Badge display on catalog cards and record pages.
- `SUPERSEDED_RETIRED` review status is distinct from `SUPERSEDED` publication state but they commonly co-occur.

---

### Trust Disclaimer Rules

The following disclaimers are system-derived from record fields and rendered automatically. Curators cannot suppress them. The system evaluates all applicable disclaimers and renders all that apply simultaneously.

| Trigger Condition | Required Disclaimer Text |
|-------------------|--------------------------|
| `maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT)` | "Proof of concept and prototype results do not indicate production readiness. This record should not be interpreted as a recommendation to deploy in a production environment without additional validation." |
| `publication_state = PUBLISHED` (always) | "Publication on the TSIO Innovation Hub indicates curation and structured presentation by the I&R team. It does not constitute formal adoption approval." |
| `source_type = COMMUNITY` | "This record was contributed by a team outside the TSIO I&R branch and curated for the Hub. It is not a centrally endorsed or I&R-conducted effort." |
| `review_status = VALIDATED_FOR_REUSE` | "Validated for Reuse status indicates that applicable I&R reviews have been completed. It does not waive local security, policy, or operational review requirements before adoption in any court environment." |

---

### Process

#### Curator Applies Maturity and Review Status

1. Curator opens Innovation Record in admin interface.
2. Curator selects `maturity_level` from a dropdown with all 5 options and their definitions shown inline.
3. Curator selects `review_status` from a dropdown with all 7 options and their definitions shown inline.
4. Curator saves. Changes are logged to audit history.
5. On publication, system validates both fields are set (governance gate, see F08b).

#### Trust Disclaimer Rendering

1. System evaluates the applicable disclaimer rules against the record's current field values.
2. System renders all applicable disclaimers in a designated "Trust & Limitations" section on the Innovation Record page.
3. This section is rendered before the Next-Action panel, ensuring it is visible before engagement CTAs.
4. Disclaimer text is hard-coded in the system; curators cannot edit disclaimer language.

#### Content Model Reference (Admin)

1. Curator navigates to Admin → Content Model Reference.
2. System renders a read-only reference table of all 5 maturity levels and 7 review statuses with their definitions.
3. This view is always available to curators; it does not require a specific record to be open.

---

### Inputs

- `maturity_level` (enum, pub-required): Set by curator on Innovation Record — see maturity table above for valid values
- `review_status` (enum, pub-required): Set by curator on Innovation Record — see review status table above for valid values
- `source_type` (enum, pub-required): `I_AND_R` or `COMMUNITY` — used for trust disclaimer trigger
- `publication_state` (enum, system): Used for trust disclaimer trigger

---

### Outputs

- **Maturity Level Badge:** Displayed on every catalog card and Innovation Record page with the display label and associated color.
- **Review Status Badge:** Displayed on every catalog card and Innovation Record page with the display label.
- **Reuse Badge:** Displayed additionally when `review_status = VALIDATED_FOR_REUSE`.
- **Community Badge:** Displayed when `source_type = COMMUNITY`.
- **Trust Disclaimer Block:** Rendered on every published Innovation Record page in a "Trust & Limitations" section. Contains all applicable disclaimer texts.
- **Content Model Reference:** Read-only table rendered in admin interface.
- **Filter Options:** Maturity level and review status enum values surfaced as filter options in catalog (F00) and search (F01).

---

### Validation

- `maturity_level`: Must be a valid enum value from the 5-value set. Required before publication.
- `review_status`: Must be a valid enum value from the 7-value set. Required before publication.
- Trust disclaimers are not configurable. The system derives and renders them; curators have no input on disclaimer text or display.
- The content model enum definitions are hard-coded in the application. Changes to maturity level or review status definitions require a code change and release.
- Any record with `publication_state = PUBLISHED` must have visible trust signals (maturity badge, review status badge, disclaimer block). A technical audit should verify these are present on every rendered public record page.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Curator attempts to publish without maturity level set | 422 | `PUBLICATION_GATE_FAILED` | "Maturity level is required before publishing." |
| Curator attempts to publish without review status set | 422 | `PUBLICATION_GATE_FAILED` | "Review status is required before publishing." |
| Invalid enum value submitted for maturity or review status | 422 | `INVALID_ENUM_VALUE` | "Invalid maturity level / review status value." |

---

### API Surface (F09)

Maturity and review status are fields on the Innovation Record (see `Y1-api.md` §Records). No dedicated API endpoints for this feature; values are part of the Innovation Record payload.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/maturity-reference` | CURATOR | Get maturity level definitions |
| `GET` | `/api/v1/admin/review-status-reference` | CURATOR | Get review status definitions |

---

### Schema Surface (F09)

`maturity_level` and `review_status` are enum columns on the `innovation_records` table. See `Y0-schema.md` §innovation_records.

---

*End of F09-content-maturity-trust-model.md — continues in Y0-schema.md*
---

## Y0: Database Schema — Full DDL

This document contains the complete database schema for the TSIO Innovation Hub MVP. All tables use UUID primary keys. Timestamps are stored as UTC. Enum types are defined as `VARCHAR` with `CHECK` constraints (or as native `ENUM` type depending on the database engine selected during implementation).

> **Note:** The specific database engine (PostgreSQL, SQLite, SQL Server, etc.) is TBD pending the hosting decision. This DDL is written in standard ANSI SQL with PostgreSQL-compatible syntax. Adjust enum handling and UUID generation for the selected engine.

---

### §innovation_records

The primary data entity. One row per Innovation Record.

```sql
CREATE TABLE innovation_records (
    record_id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core content fields
    title                   VARCHAR(200)    NOT NULL CHECK (LENGTH(title) >= 5),
    problem_statement       TEXT            NOT NULL CHECK (LENGTH(problem_statement) >= 50),
    what_was_explored       TEXT            NOT NULL CHECK (LENGTH(what_was_explored) >= 50),
    outcome_summary         TEXT            NOT NULL CHECK (LENGTH(outcome_summary) >= 50),
    reuse_guidance          TEXT,
    short_summary           VARCHAR(280),   -- auto-generated from outcome_summary or curator-authored
    
    -- Maturity & trust model
    maturity_level          VARCHAR(30)     NOT NULL CHECK (maturity_level IN (
                                'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT',
                                'PRODUCTION_VALIDATED', 'ARCHIVED'
                            )),
    review_status           VARCHAR(30)     NOT NULL CHECK (review_status IN (
                                'SUBMITTED', 'CURATED', 'TECHNICALLY_REVIEWED',
                                'SECURITY_REVIEWED', 'POLICY_REVIEWED',
                                'VALIDATED_FOR_REUSE', 'SUPERSEDED_RETIRED'
                            )),
    reuse_potential         VARCHAR(10)     NOT NULL CHECK (reuse_potential IN ('HIGH', 'MEDIUM', 'LOW')),
    source_type             VARCHAR(20)     NOT NULL CHECK (source_type IN ('I_AND_R', 'COMMUNITY')),
    
    -- Ownership & attribution
    owner_name              VARCHAR(200)    NOT NULL,
    owner_office            VARCHAR(200)    NOT NULL,
    contributing_office     VARCHAR(200)    NOT NULL,
    contributor_attribution TEXT,
    
    -- Perspective content
    executive_perspective_text  TEXT,
    executive_recommendation    TEXT,
    technical_perspective_text  TEXT,
    security_findings           TEXT,
    performance_findings        TEXT,
    default_perspective         VARCHAR(10) NOT NULL DEFAULT 'EXECUTIVE'
                                    CHECK (default_perspective IN ('EXECUTIVE', 'TECHNICAL')),
    
    -- Publication lifecycle
    publication_state       VARCHAR(20)     NOT NULL DEFAULT 'DRAFT' CHECK (publication_state IN (
                                'DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'
                            )),
    last_reviewed_date      DATE,
    published_at            TIMESTAMPTZ,
    superseded_by_record_id UUID            REFERENCES innovation_records(record_id),
    
    -- Audit / system
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by_user_id      UUID            NOT NULL REFERENCES users(user_id),
    updated_by_user_id      UUID            NOT NULL REFERENCES users(user_id),
    deleted_at              TIMESTAMPTZ     -- soft-delete; NULL = not deleted
);

CREATE INDEX idx_innovation_records_publication_state ON innovation_records(publication_state);
CREATE INDEX idx_innovation_records_maturity ON innovation_records(maturity_level);
CREATE INDEX idx_innovation_records_review_status ON innovation_records(review_status);
CREATE INDEX idx_innovation_records_published_at ON innovation_records(published_at DESC);
```

---

### §record_key_findings

Stores the structured key findings array for each Innovation Record.

```sql
CREATE TABLE record_key_findings (
    finding_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    finding_text    TEXT        NOT NULL CHECK (LENGTH(finding_text) >= 10 AND LENGTH(finding_text) <= 1000),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_key_findings_record ON record_key_findings(record_id, display_order);
```

---

### §record_artifact_links

Stores external artifact links associated with each Innovation Record.

```sql
CREATE TABLE record_artifact_links (
    link_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL CHECK (LENGTH(label) >= 2),
    url             TEXT        NOT NULL CHECK (url LIKE 'https://%'),
    artifact_type   VARCHAR(20) NOT NULL CHECK (artifact_type IN (
                        'DOCUMENT', 'CODE_REPOSITORY', 'VIDEO', 'DIAGRAM', 'OTHER'
                    )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_artifact_links_record ON record_artifact_links(record_id);
```

---

### §record_tags

Stores mission area and technology area tags for each Innovation Record.

```sql
CREATE TABLE record_tags (
    tag_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    tag_type        VARCHAR(20) NOT NULL CHECK (tag_type IN ('MISSION_AREA', 'TECHNOLOGY_AREA')),
    tag_value       VARCHAR(100) NOT NULL CHECK (LENGTH(tag_value) >= 1),
    display_order   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_record_tags_record ON record_tags(record_id, tag_type);
CREATE INDEX idx_record_tags_value ON record_tags(tag_type, tag_value);
```

---

### §record_engagement_options

Stores which engagement options are configured on each Innovation Record.

```sql
CREATE TABLE record_engagement_options (
    option_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID        NOT NULL REFERENCES innovation_records(record_id) ON DELETE CASCADE,
    option_type     VARCHAR(40) NOT NULL CHECK (option_type IN (
                        'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION',
                        'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING'
                    )),
    display_order   INTEGER     NOT NULL DEFAULT 0,
    UNIQUE (record_id, option_type)
);

CREATE INDEX idx_record_engagement_options_record ON record_engagement_options(record_id);
```

---

### §audit_log

Tracks all material changes to Innovation Records.

```sql
CREATE TABLE audit_log (
    audit_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID        NOT NULL REFERENCES innovation_records(record_id),
    changed_by_user_id  UUID        NOT NULL REFERENCES users(user_id),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    field_changed       VARCHAR(100),           -- NULL if event is a state transition only
    old_value           TEXT,
    new_value           TEXT,
    state_transition    VARCHAR(50),            -- e.g., 'DRAFT->REVIEW', 'REVIEW->PUBLISHED'
    event_type          VARCHAR(40) NOT NULL CHECK (event_type IN (
                            'FIELD_EDIT', 'STATE_TRANSITION', 'RECORD_CREATED', 'RECORD_DELETED'
                        ))
);

CREATE INDEX idx_audit_log_record ON audit_log(record_id, changed_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(changed_by_user_id);
```

---

### §users

Curator user accounts. Populated by identity provider integration (Azure AD or equivalent). One row per authenticated curator.

```sql
CREATE TABLE users (
    user_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'CURATOR' CHECK (role IN ('CURATOR', 'ADMIN')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idp_subject     VARCHAR(500) UNIQUE     -- Identity provider subject claim (e.g., Azure AD OID)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_idp_subject ON users(idp_subject);
```

---

### §opportunity_submissions

Stores stakeholder mission problem / opportunity submissions (F05).

```sql
CREATE TABLE opportunity_submissions (
    submission_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_description TEXT        NOT NULL CHECK (LENGTH(problem_description) >= 50),
    mission_area        VARCHAR(200) NOT NULL,
    submitting_office   VARCHAR(200) NOT NULL,
    submitter_name      VARCHAR(200) NOT NULL,
    submitter_email     VARCHAR(255) NOT NULL,
    submitter_title     VARCHAR(200),
    urgency_context     TEXT,
    known_constraints   TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                            'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED_FOR_CONSIDERATION',
                            'DECLINED', 'LINKED_TO_RECORD'
                        )),
    disposition         VARCHAR(30), -- same set as status; set when curator acts
    linked_record_id    UUID        REFERENCES innovation_records(record_id),
    internal_note       TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by_user_id UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_opportunity_submissions_status ON opportunity_submissions(status, submitted_at DESC);
```

---

### §contribution_submissions

Stores community innovation work contribution submissions (F06).

```sql
CREATE TABLE contribution_submissions (
    submission_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    work_description        TEXT        NOT NULL CHECK (LENGTH(work_description) >= 50),
    problem_addressed       TEXT        NOT NULL CHECK (LENGTH(problem_addressed) >= 50),
    outcome_summary         TEXT        NOT NULL CHECK (LENGTH(outcome_summary) >= 50),
    self_assessed_maturity  VARCHAR(30) NOT NULL CHECK (self_assessed_maturity IN (
                                'IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'
                            )),
    artifact_urls           TEXT[]      NOT NULL,   -- Array of URL strings
    contributing_team       VARCHAR(200) NOT NULL,
    contributing_office     VARCHAR(200) NOT NULL,
    contact_name            VARCHAR(200) NOT NULL,
    contact_email           VARCHAR(255) NOT NULL,
    contact_title           VARCHAR(200),
    additional_context      TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                                'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED_FOR_CURATION',
                                'DECLINED', 'PUBLISHED'
                            )),
    internal_note           TEXT,
    linked_record_id        UUID        REFERENCES innovation_records(record_id),
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at             TIMESTAMPTZ,
    reviewed_by_user_id     UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_contribution_submissions_status ON contribution_submissions(status, submitted_at DESC);
```

---

### §engagement_requests

Stores all stakeholder engagement requests (F07).

```sql
CREATE TABLE engagement_requests (
    request_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id               UUID        NOT NULL REFERENCES innovation_records(record_id),
    request_type            VARCHAR(40) NOT NULL CHECK (request_type IN (
                                'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION',
                                'REQUEST_TECHNICAL_GUIDANCE', 'REQUEST_BRIEFING'
                            )),
    requestor_name          VARCHAR(200) NOT NULL,
    requestor_email         VARCHAR(255) NOT NULL,
    requestor_office        VARCHAR(200) NOT NULL,
    requestor_title         VARCHAR(200),
    description_of_interest TEXT        NOT NULL CHECK (LENGTH(description_of_interest) >= 20),
    desired_next_step       TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
                                'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'NO_ACTION'
                            )),
    curator_note            TEXT,
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id      UUID        REFERENCES users(user_id)
);

CREATE INDEX idx_engagement_requests_record ON engagement_requests(record_id, submitted_at DESC);
CREATE INDEX idx_engagement_requests_status ON engagement_requests(status);
CREATE INDEX idx_engagement_requests_submitted ON engagement_requests(submitted_at DESC);
```

---

### §hub_settings

Stores admin-configurable Hub settings (F07, F08).

```sql
CREATE TABLE hub_settings (
    setting_key     VARCHAR(100) PRIMARY KEY,
    setting_value   TEXT        NOT NULL,
    description     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID     REFERENCES users(user_id)
);

-- Seed data: required settings
INSERT INTO hub_settings (setting_key, setting_value, description) VALUES
    ('engagement_routing_email', 'AOml_TSO_IRB_Team@ao.uscourts.gov', 'Email address for all engagement request and submission routing notifications'),
    ('contact_display_email', 'AOml_TSO_IRB_Team@ao.uscourts.gov', 'Public-facing contact email displayed on the Hub'),
    ('catalog_default_page_size', '12', 'Default number of cards per catalog page'),
    ('default_perspective', 'EXECUTIVE', 'System-wide fallback default perspective (EXECUTIVE or TECHNICAL)');
```

---

*End of Y0-schema.md — continues in Y1-api.md*
---

## Y1: REST API Catalog

This document defines all REST API endpoints for the TSIO Innovation Hub MVP. All endpoints are prefixed with `/api/v1`. JSON is the only supported content type (`Content-Type: application/json`).

**Authentication:**
- PUBLIC endpoints: No authentication required.
- CURATOR endpoints: Require a valid session token (Bearer token in `Authorization` header or session cookie). Method TBD pending identity provider selection.

**Pagination:** All list endpoints return a standard pagination envelope:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 12,
    "total_count": 47,
    "total_pages": 4
  }
}
```

**Error envelope:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": ["field_name"]   // present only for validation errors
  }
}
```

---

### §Catalog — F00

#### `GET /api/v1/catalog`

Returns paginated list of published Innovation Records for the public catalog view.

**Auth:** None (PUBLIC)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `maturity_level` | string (repeatable) | — | Filter by maturity level enum(s) |
| `review_status` | string (repeatable) | — | Filter by review status enum(s) |
| `contributing_office` | string | — | Filter by contributing office name |
| `mission_area` | string (repeatable) | — | Filter by mission area tag |
| `technology_area` | string (repeatable) | — | Filter by technology area tag |
| `reuse_potential` | string | — | Filter by reuse potential (HIGH, MEDIUM, LOW) |
| `sort` | string | `recent` | Sort order: `recent`, `maturity`, `relevance` |
| `page` | integer | 1 | Page number |
| `page_size` | integer | 12 | Results per page (max 50) |

**Response 200:**
```json
{
  "data": [
    {
      "record_id": "uuid",
      "title": "string",
      "short_summary": "string (≤280 chars)",
      "maturity_level": "EXPERIMENT_POC",
      "maturity_label": "Experiment / POC",
      "review_status": "TECHNICALLY_REVIEWED",
      "review_status_label": "Technically Reviewed",
      "reuse_potential": "MEDIUM",
      "source_type": "I_AND_R",
      "mission_area_tags": ["Cybersecurity"],
      "technology_area_tags": ["AI/ML"],
      "engagement_options": ["REQUEST_DEMO", "REQUEST_TECHNICAL_GUIDANCE"],
      "is_validated_for_reuse": false,
      "is_community_contributed": false,
      "published_at": "2026-07-28T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "page_size": 12, "total_count": 3, "total_pages": 1 }
}
```

**Response 503:** `CATALOG_UNAVAILABLE`

---

#### `GET /api/v1/catalog/filters`

Returns available filter option values (facets) for the current published record set.

**Auth:** None (PUBLIC)

**Response 200:**
```json
{
  "maturity_levels": ["EXPERIMENT_POC", "PROTOTYPE_PILOT"],
  "review_statuses": ["CURATED", "TECHNICALLY_REVIEWED"],
  "contributing_offices": ["TSIO I&R"],
  "mission_area_tags": ["Cybersecurity", "Court Operations"],
  "technology_area_tags": ["AI/ML", "Cloud Infrastructure"],
  "reuse_potentials": ["HIGH", "MEDIUM", "LOW"]
}
```

---

### §Search — F01

#### `GET /api/v1/search`

Full-text search over published Innovation Records.

**Auth:** None (PUBLIC)

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query (1–500 chars) |
| `maturity_level` | string (repeatable) | no | Filter |
| `review_status` | string (repeatable) | no | Filter |
| `contributing_office` | string | no | Filter |
| `reuse_potential` | string | no | Filter |
| `page` | integer | no | Default 1 |
| `page_size` | integer | no | Default 12, max 50 |

**Response 200:** Same envelope as `GET /api/v1/catalog` with an additional `relevance_score` field on each result item.

**Response 400:** `QUERY_TOO_LONG` (query > 500 chars)  
**Response 503:** `SEARCH_UNAVAILABLE`

---

### §Records — F02

#### `GET /api/v1/records/{record_id}`

Retrieve a single Innovation Record.

**Auth:** None for PUBLISHED records; CURATOR session required for DRAFT/REVIEW/SUPERSEDED/ARCHIVED.

**Path Parameters:** `record_id` (UUID)

**Response 200:**
```json
{
  "record_id": "uuid",
  "title": "string",
  "problem_statement": "string",
  "what_was_explored": "string",
  "outcome_summary": "string",
  "key_findings": ["string", "string"],
  "maturity_level": "EXPERIMENT_POC",
  "maturity_label": "Experiment / POC",
  "review_status": "TECHNICALLY_REVIEWED",
  "review_status_label": "Technically Reviewed",
  "reuse_guidance": "string or null",
  "reuse_potential": "MEDIUM",
  "owner_name": "string",
  "owner_office": "string",
  "contributing_office": "string",
  "source_type": "I_AND_R",
  "contributor_attribution": "string or null",
  "mission_area_tags": ["string"],
  "technology_area_tags": ["string"],
  "artifact_links": [
    { "label": "string", "url": "https://...", "artifact_type": "DOCUMENT" }
  ],
  "engagement_options": ["REQUEST_DEMO"],
  "executive_perspective_text": "string",
  "executive_recommendation": "string",
  "technical_perspective_text": "string or null",
  "security_findings": "string or null",
  "performance_findings": "string or null",
  "default_perspective": "EXECUTIVE",
  "publication_state": "PUBLISHED",
  "last_reviewed_date": "2026-07-28",
  "published_at": "2026-07-28T00:00:00Z",
  "superseded_by_record_id": "uuid or null",
  "trust_disclaimers": ["string", "string"],
  "short_summary": "string",
  "created_at": "2026-07-01T00:00:00Z",
  "updated_at": "2026-07-28T00:00:00Z"
}
```

**Response 404:** `RECORD_NOT_FOUND`  
**Response 503:** `RECORD_UNAVAILABLE`

---

#### `POST /api/v1/records`

Create a new Innovation Record in DRAFT state.

**Auth:** CURATOR

**Request Body:** All Innovation Record fields (see F02b §Inputs). `record_id`, `publication_state`, `created_at`, `updated_at`, `published_at` are system-set.

**Response 201:** Full record JSON (as above, with `publication_state: "DRAFT"`)  
**Response 422:** `VALIDATION_ERROR` with `fields` list  
**Response 403:** `ACCESS_DENIED`

---

#### `PATCH /api/v1/records/{record_id}`

Update one or more fields on an Innovation Record. Partial update (only provided fields are changed).

**Auth:** CURATOR

**Request Body:** Any subset of Innovation Record fields (excluding system-managed fields).

**Response 200:** Updated full record JSON  
**Response 422:** `VALIDATION_ERROR`  
**Response 409:** `EDIT_REQUIRES_CONFIRMATION` (if record is PUBLISHED)  
**Response 404:** `RECORD_NOT_FOUND`

---

#### `POST /api/v1/records/{record_id}/submit-review`

Transition record from DRAFT → REVIEW.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "REVIEW" }`  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/publish`

Transition record from REVIEW → PUBLISHED. Applies governance gate.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "PUBLISHED", "published_at": "..." }`  
**Response 422:** `PUBLICATION_GATE_FAILED` with blocking `fields` list  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/supersede`

Mark a Published record as SUPERSEDED.

**Auth:** CURATOR  
**Request Body:** `{ "superseded_by_record_id": "uuid" }`  
**Response 200:** `{ "publication_state": "SUPERSEDED" }`  
**Response 422:** `INVALID_SUPERSEDES_REF` or `INVALID_STATE_TRANSITION`

---

#### `POST /api/v1/records/{record_id}/archive`

Mark a record as ARCHIVED.

**Auth:** CURATOR  
**Request Body:** None  
**Response 200:** `{ "publication_state": "ARCHIVED" }`  
**Response 422:** `INVALID_STATE_TRANSITION`

---

#### `GET /api/v1/records/{record_id}/audit`

Return audit history for a record.

**Auth:** CURATOR

**Response 200:**
```json
{
  "data": [
    {
      "audit_id": "uuid",
      "changed_by": "Curator Name",
      "changed_at": "2026-07-28T10:00:00Z",
      "event_type": "STATE_TRANSITION",
      "state_transition": "DRAFT->REVIEW",
      "field_changed": null,
      "old_value": null,
      "new_value": null
    }
  ]
}
```

---

### §Submissions (Opportunities) — F05

#### `POST /api/v1/opportunity-submissions`

Submit a mission problem or opportunity.

**Auth:** None (PUBLIC)

**Request Body:** All opportunity submission form fields (see F05 §Inputs) plus `captcha_token`.

**Response 201:** `{ "submission_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `SUBMISSION_UNAVAILABLE`

---

#### `GET /api/v1/opportunity-submissions`

List all opportunity submissions.

**Auth:** CURATOR

**Query Parameters:** `status` (filter), `page`, `page_size`

**Response 200:** Paginated list of submission summaries.

---

#### `PATCH /api/v1/opportunity-submissions/{submission_id}`

Update disposition of an opportunity submission.

**Auth:** CURATOR  
**Request Body:** `{ "disposition": "...", "linked_record_id": "uuid or null", "internal_note": "..." }`  
**Response 200:** Updated submission record  
**Response 422:** `VALIDATION_ERROR`

---

### §Submissions (Contributions) — F06

#### `POST /api/v1/contribution-submissions`

Submit existing innovation work for curation.

**Auth:** None (PUBLIC)

**Request Body:** All contribution form fields (see F06 §Inputs) plus `captcha_token`.

**Response 201:** `{ "submission_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `SUBMISSION_UNAVAILABLE`

---

#### `GET /api/v1/contribution-submissions`

List all contribution submissions.

**Auth:** CURATOR  
**Query Parameters:** `status` (filter), `page`, `page_size`  
**Response 200:** Paginated list.

---

#### `PATCH /api/v1/contribution-submissions/{submission_id}`

Update disposition of a contribution submission.

**Auth:** CURATOR  
**Request Body:** `{ "disposition": "...", "linked_record_id": "uuid or null", "internal_note": "..." }`  
**Response 200:** Updated submission record

---

#### `POST /api/v1/admin/contribution-submissions/{submission_id}/create-record`

Pre-populate a new Draft Innovation Record from an accepted contribution submission.

**Auth:** CURATOR  
**Request Body:** None (data sourced from submission)  
**Response 201:** New Innovation Record JSON (DRAFT state)  
**Response 422:** `SUBMISSION_NOT_ACCEPTED` (if disposition ≠ ACCEPTED_FOR_CURATION)

---

### §Engagement — F07

#### `POST /api/v1/engagement-requests`

Submit an engagement request.

**Auth:** None (PUBLIC)

**Request Body:** All engagement request form fields (see F07 §Inputs) plus `captcha_token`.

**Response 201:** `{ "request_id": "uuid", "submitted_at": "..." }`  
**Response 422:** `VALIDATION_ERROR`, `CAPTCHA_INVALID`, `INVALID_ENGAGEMENT_TYPE`  
**Response 404:** `RECORD_NOT_FOUND`  
**Response 429:** `RATE_LIMIT_EXCEEDED`  
**Response 503:** `ENGAGEMENT_UNAVAILABLE`

---

#### `GET /api/v1/engagement-requests`

List all engagement requests.

**Auth:** CURATOR  
**Query Parameters:** `record_id` (filter), `request_type` (filter), `status` (filter), `page`, `page_size`  
**Response 200:** Paginated list of engagement request summaries.

---

#### `PATCH /api/v1/engagement-requests/{request_id}`

Update status of an engagement request.

**Auth:** CURATOR  
**Request Body:** `{ "status": "...", "curator_note": "..." }`  
**Response 200:** Updated engagement request record

---

### §Settings — F07/F08

#### `GET /api/v1/settings/routing-email`

**Auth:** CURATOR  
**Response 200:** `{ "setting_key": "engagement_routing_email", "setting_value": "AOml_TSO_IRB_Team@ao.uscourts.gov" }`

---

#### `PUT /api/v1/settings/routing-email`

**Auth:** CURATOR  
**Request Body:** `{ "setting_value": "new@email.gov" }`  
**Response 200:** `{ "setting_key": "engagement_routing_email", "setting_value": "new@email.gov" }`  
**Response 422:** `INVALID_EMAIL`

---

### §Admin — F08

#### `GET /api/v1/admin/dashboard-summary`

**Auth:** CURATOR  
**Response 200:**
```json
{
  "published_records": 3,
  "draft_review_records": 2,
  "pending_opportunity_submissions": 1,
  "pending_contribution_submissions": 0,
  "recent_engagement_requests_7d": 5
}
```

---

#### `GET /api/v1/admin/records`

List all Innovation Records across all publication states.

**Auth:** CURATOR  
**Query Parameters:** `publication_state`, `maturity_level`, `review_status`, `q` (title search), `page`, `page_size`  
**Response 200:** Paginated list including all publication states.

---

#### `GET /api/v1/admin/settings`

**Auth:** CURATOR  
**Response 200:** `{ "settings": [{ "setting_key": "...", "setting_value": "...", "description": "..." }] }`

---

#### `PUT /api/v1/admin/settings`

**Auth:** CURATOR  
**Request Body:** `{ "settings": [{ "setting_key": "...", "setting_value": "..." }] }`  
**Response 200:** Updated settings list  
**Response 422:** `VALIDATION_ERROR`

---

#### `GET /api/v1/admin/maturity-reference`

**Auth:** CURATOR  
**Response 200:** Array of `{ "enum_value": "...", "label": "...", "definition": "..." }` for all 5 maturity levels.

---

#### `GET /api/v1/admin/review-status-reference`

**Auth:** CURATOR  
**Response 200:** Array of `{ "enum_value": "...", "label": "...", "definition": "..." }` for all 7 review statuses.

---

*End of Y1-api.md — continues in Y2-errors.md*
---

## Y2: Cross-Feature Error Catalog

This document catalogs all error codes used across the TSIO Innovation Hub. Error responses follow the standard envelope defined in `Y1-api.md`:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": ["field_name"]   // present only for validation errors
  }
}
```

---

### HTTP Status Code Reference

| HTTP Status | Meaning in This System |
|-------------|------------------------|
| 200 | Success (including empty result sets — these are not errors) |
| 201 | Resource created successfully |
| 302 | Redirect (authentication flow) |
| 400 | Malformed request (bad syntax, missing required parameters) |
| 403 | Authenticated but not authorized (wrong role or insufficient permission) |
| 404 | Resource not found or not accessible to the requester's role |
| 409 | Conflict — the request cannot be applied in the current state |
| 422 | Unprocessable entity — request is well-formed but violates business rules or validation |
| 429 | Rate limit exceeded |
| 503 | Service temporarily unavailable |

---

### Error Code Catalog

#### Authentication & Authorization

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `ACCESS_DENIED` | 403 | F08 | Authenticated user does not have CURATOR role | Contact system administrator to request access |
| `SESSION_EXPIRED` | 302 | F08 | Session token has expired | Re-authenticate via identity provider |

---

#### Records (F02)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `RECORD_NOT_FOUND` | 404 | F00, F02, F03, F07 | Record does not exist, is not published (PUBLIC), or has been deleted | Verify the record ID; check if the record has been archived |
| `RECORD_UNAVAILABLE` | 503 | F02 | Record store temporarily unreachable | Retry after a brief delay |
| `PUBLICATION_GATE_FAILED` | 422 | F02, F08 | Curator attempted to publish with missing required fields | Review and complete all listed required fields |
| `INVALID_STATE_TRANSITION` | 422 | F02, F08 | State transition not allowed from current publication state | Check the publication lifecycle diagram; follow valid transitions |
| `EDIT_REQUIRES_CONFIRMATION` | 409 | F02, F08 | Curator attempted to edit a PUBLISHED record without confirming the resulting state change | Re-submit with a confirmation flag or use the admin interface confirmation dialog |
| `INVALID_SUPERSEDES_REF` | 422 | F02, F08 | `superseded_by_record_id` references a non-existent record | Provide a valid existing record ID |
| `DELETE_NOT_PERMITTED` | 422 | F08 | Curator attempted to delete a non-DRAFT record | Archive the record instead; only DRAFT records may be deleted |
| `KEY_FINDINGS_REQUIRED` | 422 | F02 | `key_findings` array is empty | Add at least one key finding |
| `INVALID_REVIEW_DATE` | 422 | F02 | `last_reviewed_date` is in the future | Set a date on or before today |
| `INVALID_ARTIFACT_URL` | 422 | F02, F04, F06 | Artifact URL is not a valid `https://` absolute URL | Provide a valid HTTPS URL |
| `INVALID_ENUM_VALUE` | 422 | F02, F09 | Field value is not a valid member of the required enum set | Use one of the defined enum values |

---

#### Search & Catalog (F00, F01)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `CATALOG_UNAVAILABLE` | 503 | F00 | Catalog data store temporarily unavailable | Retry after a brief delay |
| `SEARCH_UNAVAILABLE` | 503 | F01 | Search index service temporarily unavailable | Try browsing the catalog; retry search after a brief delay |
| `QUERY_TOO_LONG` | 400 | F01 | Query string exceeds 500 characters | Shorten the query to 500 characters or fewer |

---

#### Submissions (F05, F06)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `SUBMISSION_UNAVAILABLE` | 503 | F05, F06 | Submission service temporarily unavailable | Retry after a brief delay; contact I&R team directly if persistent |
| `CAPTCHA_INVALID` | 422 | F05, F06, F07 | CAPTCHA token is missing, expired, or invalid | Reload the page and complete the CAPTCHA again |
| `RATE_LIMIT_EXCEEDED` | 429 | F05, F06, F07 | Submission rate limit (5/hour for submissions, 10/hour for engagement) exceeded for this IP | Wait before submitting again |
| `ARTIFACT_URL_REQUIRED` | 422 | F06 | No artifact URLs provided on contribution submission | Include at least one valid artifact URL |
| `SUBMISSION_NOT_ACCEPTED` | 422 | F06 | Curator attempted to create a record from a submission not yet in ACCEPTED_FOR_CURATION state | Update submission disposition to ACCEPTED_FOR_CURATION first |
| `FIELD_TOO_SHORT` | 422 | F05, F06 | A text field did not meet the minimum character length | Provide more detail; see the field's minimum length requirement |

---

#### Engagement Routing (F07)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `ENGAGEMENT_UNAVAILABLE` | 503 | F07 | Engagement request service temporarily unavailable | Retry after a brief delay |
| `INVALID_ENGAGEMENT_TYPE` | 422 | F07 | Requested engagement type is not configured for the target record | Select an available engagement option from the Next-Action panel |

---

#### Settings (F07, F08)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `INVALID_EMAIL` | 422 | F05, F06, F07, F08 | Email address field does not match a valid email format | Provide a properly formatted email address |
| `INVALID_RECORD_REF` | 422 | F08 | A linked record ID references a non-existent Innovation Record | Provide a valid existing record ID |
| `ADMIN_UNAVAILABLE` | 503 | F08 | Admin data service temporarily unavailable | Retry after a brief delay |

---

### Validation Error Format

When multiple field validation errors occur simultaneously, all are returned together:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "fields": [
      {
        "field": "problem_statement",
        "error_code": "FIELD_TOO_SHORT",
        "message": "Problem statement must be at least 50 characters."
      },
      {
        "field": "submitter_email",
        "error_code": "INVALID_EMAIL",
        "message": "Please enter a valid email address."
      }
    ]
  }
}
```

---

### Error Retry Guidance Summary

| HTTP Status | Client Behavior |
|-------------|-----------------|
| 400 | Fix the request before retrying. Do not retry unchanged. |
| 403 | Do not retry. Contact administrator for access. |
| 404 | Do not retry with same parameters. Resource does not exist or is inaccessible. |
| 409 | Re-submit with required confirmation or resolve the conflict first. |
| 422 | Fix the validation errors in the request body before retrying. |
| 429 | Wait and retry after the specified or implied delay. |
| 503 | Retry with exponential backoff. If persistent after 5 minutes, contact the I&R team. |

---

*End of Y2-errors.md — continues in Y3-integrations.md*
---

## Y3: External Integration Points

This document defines the external systems and services that the TSIO Innovation Hub depends on or interfaces with. Where specific vendor decisions are TBD (pending hosting and identity discovery), this document defines the integration contract requirements so that implementation can proceed once decisions are made.

---

### INT-01: Identity Provider (Authentication)

**Dependency:** F08 (Curation and Administration), CURATOR role enforcement  
**Status:** TBD — decision required during Pivota discovery phase  
**Priority:** P0 — MVP launch blocker (admin interface cannot function without authentication)

**Contract Requirements:**
- The identity provider must support standard OAuth 2.0 / OpenID Connect (OIDC) flows.
- The Hub must be able to extract the following claims from the OIDC token: `email`, `name` (display name), `sub` (subject / unique user ID), `groups` or `roles` (for CURATOR role assignment).
- The Hub must store a local `users` table record keyed by `idp_subject` for audit trail integrity (curator identity on audit entries must not be lost if IdP access changes).
- Session token expiry must be enforced; expired sessions redirect to the IdP login page.
- Role assignment (`CURATOR`) must be configurable without code deployment — either via IdP group membership or a local role table maintained by an admin.

**Candidate:** Azure Active Directory / Microsoft Entra ID (assumed for Federal Judiciary context; confirm during discovery).  
**Integration method:** MSAL or standard OIDC middleware in the backend framework.

---

### INT-02: Email Delivery (Routing Notifications)

**Dependency:** F05 (Opportunity Submission), F06 (Share Existing Innovation Work), F07 (Engagement Routing)  
**Status:** Required for MVP  
**Priority:** P1 — engagement routing and submission notifications depend on this

**Contract Requirements:**
- The Hub must be able to send transactional emails programmatically to:
  - The configurable routing address (`engagement_routing_email` setting) for engagement requests and new submissions
  - The submitter/requestor email address for confirmation messages
- Emails are triggered by: new opportunity submission, new contribution submission, new engagement request.
- Email content must include a plain-text summary of the triggering event and a direct link to the relevant record or submission in the admin interface.
- The routing email address must be changeable without a code deployment (stored in `hub_settings` table).
- Failure to deliver email must not cause the submission or request to fail or be lost. The record is stored successfully; email delivery failure is a background concern logged for curator resolution.

**Candidate:** SMTP relay provided by the Judiciary hosting environment (AO-managed); or a transactional email service (e.g., SendGrid, Azure Communication Services) if SMTP relay is not available.  
**Fallback:** If email delivery is not available at MVP launch, the admin interface submission queue (F08) serves as the primary notification mechanism for curators.

---

### INT-03: Full-Text Search Engine

**Dependency:** F01 (Search and Discovery)  
**Status:** Required for MVP  
**Priority:** P0 — search is a critical MVP requirement

**Contract Requirements:**
- The search engine must support full-text search with relevance ranking across indexed text fields.
- Fields indexed: `problem_statement`, `key_findings`, `what_was_explored`, `outcome_summary`, `title`, `reuse_guidance`, mission area tags, technology area tags, `short_summary`.
- Field weighting must be configurable so problem-statement and key-findings fields are ranked higher than tags.
- The index must be updated in near-real-time (or synchronously) when a record is published, edited, superseded, or archived.
- Search must be scoped to Published records for PUBLIC queries; CURATOR queries may search all states.
- The engine must support query sanitization to prevent injection.

**Candidates (in order of preference for simplicity):**
1. Native full-text search of the primary database engine (PostgreSQL `tsvector`, SQLite FTS5) — preferred for MVP simplicity.
2. Elasticsearch or OpenSearch — if native FTS is insufficient for relevance tuning at scale.
3. Meilisearch — lightweight alternative if a dedicated search service is preferred.

**Decision:** TBD pending hosting environment selection. PostgreSQL native FTS is recommended for MVP unless the record volume or search sophistication requires a dedicated engine.

---

### INT-04: CAPTCHA Provider

**Dependency:** F05 (Opportunity Submission), F06 (Share Existing Innovation Work), F07 (Engagement Routing)  
**Status:** Required for MVP (public forms without authentication)  
**Priority:** P1 — spam/abuse protection for unauthenticated public forms

**Contract Requirements:**
- The CAPTCHA provider must return a token that can be server-side validated to confirm the form was submitted by a human.
- Server-side validation must be performed before the submission is persisted.
- CAPTCHA must be accessible to users with disabilities (WCAG 2.1 AA compliant).
- The CAPTCHA provider's API key must be configurable without code deployment.

**Candidates:**
- Google reCAPTCHA v3 (score-based, invisible) — preferred for usability.
- hCaptcha — alternative if Google services are restricted in the Judiciary environment.
- Cloudflare Turnstile — lightweight option if Cloudflare is in the stack.

**Note:** If the Judiciary network environment restricts outbound calls to CAPTCHA providers, rate limiting (IP-based, 5 submissions/hour) serves as the fallback anti-abuse mechanism.

---

### INT-05: Artifact Source Systems (Read-Only Link References)

**Dependency:** F02 (Innovation Record), F04 (Lessons-Learned Integration)  
**Status:** Informational — no active integration required  
**Priority:** P1 — artifact links are required for publication but require no system integration

**Contract Requirements:**
- The Hub stores external URLs pointing to authoritative source documents in external systems. No API integration, authentication bridge, or content sync is required with these systems.
- Supported source systems (as link targets only):
  - SharePoint / SharePoint Online (`https://*.sharepoint.com/*`)
  - GitHub / GitHub Enterprise (`https://github.com/*`, `https://github.uscourts.gov/*`)
  - Video platforms (e.g., Microsoft Stream, YouTube — HTTPS URLs)
  - Any other system accessible via HTTPS URL
- The Hub does not crawl, index, cache, or proxy content from these systems.
- Access control for linked artifacts is governed by the source system, not by the Hub. Curators should note access requirements in `reuse_guidance` or `technical_perspective_text` when relevant.
- If a linked URL becomes unreachable, the Hub record remains valid. The broken link is a content issue to be resolved by the curator. The system may optionally surface a link-health advisory to curators during record review.

---

### INT-06: Hosting Environment

**Dependency:** All features  
**Status:** TBD — decision required during Pivota discovery  
**Priority:** P0 — MVP cannot be deployed without a hosting decision

**Contract Requirements:**
- The hosting environment must support a web application server capable of serving the Hub frontend and backend API.
- The environment must support a relational database (PostgreSQL preferred; SQL Server and SQLite also viable).
- The environment must support outbound HTTPS calls (for email delivery and CAPTCHA validation).
- The environment must comply with Federal Judiciary hosting and ATO requirements.
- Deployment must not require Judiciary-external cloud services that are not ATO-approved (e.g., commercial AWS/Azure regions may require substitution with GovCloud equivalents).

**Known candidates:** AO-managed on-premise hosting; Azure Government Cloud (if approved); Court-hosted server (less preferred for maintainability).  
**Decision:** To be finalized in Pivota discovery phase.

---

### Integration Dependency Summary

| Integration | Features Affected | MVP Required | Decision Status |
|-------------|-------------------|--------------|-----------------|
| INT-01: Identity Provider | F08 (CURATOR auth) | Yes (P0) | TBD — discovery required |
| INT-02: Email Delivery | F05, F06, F07 | Yes (P1) | TBD — hosting-dependent |
| INT-03: Full-Text Search | F01 | Yes (P0) | TBD — recommend PostgreSQL native FTS |
| INT-04: CAPTCHA Provider | F05, F06, F07 | Yes (P1) | TBD — recommend reCAPTCHA v3 |
| INT-05: Artifact Sources | F02, F04 | Link-only (no integration) | N/A |
| INT-06: Hosting Environment | All | Yes (P0) | TBD — discovery required |

---

*End of Y3-integrations.md*  
*All FRD chunks written. Assembling master document next.*
