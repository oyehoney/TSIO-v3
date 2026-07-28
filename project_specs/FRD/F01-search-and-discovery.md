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
