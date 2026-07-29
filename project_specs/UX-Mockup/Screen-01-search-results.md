### Screen 01: Search Results

**Route:** `/search?q={query}&maturity_level=...`
**Purpose:** Surface relevant innovation records based on a natural-language mission problem description
**User Stories:** US-1.1, US-1.2, US-1.3, US-9.1
**Personas:** PER-02 (David — primary), PER-03 (Priya), PER-01 (Margaret)

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB         [Search courtroom transcription___] [🔍] │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Search results for: "courtroom transcription automation"           │
│  4 records found                                                    │
│                                                                     │
│ ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│ │ REFINE RESULTS   │  │                                          │ │
│ │                  │  │  ┌──────────────────────────────────────┐│ │
│ │ Maturity Level   │  │  │ SEARCH RESULT CARD                   ││ │
│ │ ☐ Idea           │  │  │                                      ││ │
│ │ ☑ Experiment/POC │  │  │ [Experiment/POC ●]  [Curated]        ││ │
│ │ ☑ Prototype/Pilot│  │  │                                      ││ │
│ │ ☐ Production     │  │  │ Courtroom Audio Transcription POC    ││ │
│ │                  │  │  │                                      ││ │
│ │ Review Status    │  │  │ …explored automated **transcription**││ │
│ │ ☑ Curated        │  │  │ for **courtroom** proceedings using  ││ │
│ │ ☑ Tech Reviewed  │  │  │ cloud-based speech-to-text…          ││ │
│ │ ☐ Validated      │  │  │  (query terms highlighted in bold)   ││ │
│ │                  │  │  │                                      ││ │
│ │ Contributing     │  │  │ 🏷 Court Operations  🏷 AI/ML        ││ │
│ │ Office           │  │  │ 💬 Adoption Discussion Available     ││ │
│ │ [multi-select ▼] │  │  │                                      ││ │
│ │                  │  │  │ Published: June 2026                 ││ │
│ │ Reuse Potential  │  │  │                              [View →]││ │
│ │ ○ Any            │  │  └──────────────────────────────────────┘│ │
│ │ ○ High           │  │                                          │ │
│ │ ○ Medium         │  │  ┌──────────────────────────────────────┐│ │
│ │ ○ Low            │  │  │ SEARCH RESULT CARD #2                ││ │
│ │                  │  │  │ [Prototype/Pilot ●]  [Tech Reviewed] ││ │
│ │ [Clear Filters]  │  │  │ ...                                  ││ │
│ └──────────────────┘  │  └──────────────────────────────────────┘│ │
│                        └──────────────────────────────────────────┘ │
│                                                                     │
│                    ← Previous  [1] [2]  Next →                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Search Result Card Detail

```
┌────────────────────────────────────────────────────────────┐
│  [Prototype/Pilot ●]    [Technically Reviewed]              │
│                                                            │
│  Automated Courtroom Transcription — Pilot Study           │
│                                                            │
│  Problem: Courts face manual transcription backlogs that   │
│  delay case processing. This pilot explored **automated**  │
│  **transcription** solutions for **courtroom** hearings... │
│                          ↑ query terms highlighted         │
│                                                            │
│  🏷 Case Management   🏷 AI/ML   🏷 Cloud Infrastructure   │
│                                                            │
│  💬 Adoption Discussion Available  🔧 Technical Guidance   │
│                                                            │
│  Published: May 2026   ·   Reuse Potential: High           │
│                                              [View Record →]│
└────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Query echo + result count | Page top — orientation |
| Primary | Result cards with maturity/review badges | Main content area |
| Primary | Query term highlights in snippet | Within each result card body |
| Secondary | Filter panel | Left sidebar |
| Secondary | Engagement indicators on cards | Within each card |
| Tertiary | Active filter chips, sort order | Above result list |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (results found) | List of result cards ranked by relevance | "4 records found" |
| Loading | Skeleton result cards | Screen reader: "Searching…" |
| Filtered results | Filter chips above list; count updates | "2 of 4 records (filters applied)" |
| Zero results | Empty state with F5 CTA | See empty state below |
| Query blank on load | Search bar focused; hint text | "Enter a search term to find innovation records." |
| Query too long | Inline character count warning | "Your search query is too long. Please shorten it to 500 characters or fewer." |
| Search unavailable (503) | Error banner | "Search is temporarily unavailable. Try browsing the catalog." + catalog link |

#### Empty State Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🔍  No records found                           │
│                                                             │
│  No records found for "remote hearing scheduling".          │
│                                                             │
│  Try different keywords, or let I&R know about             │
│  this mission problem:                                      │
│                                                             │
│  [Submit a Mission Problem for I&R Consideration →]        │
│                                                             │
│  ─────────────────────────────────────────────────         │
│  You can also browse all published records:                 │
│  [View Innovation Catalog →]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search bar | Text input (pre-filled with current query) | Re-executes search on submit |
| Filter checkboxes | Multi-select | Re-executes search; updates URL |
| Result card "View →" | Link | Navigates to `/records/{id}` |
| Empty state CTA | Link | Navigates to `/submit-opportunity?context=search&q={query}` |
| "View Innovation Catalog →" | Link | Navigates to `/catalog` |
| Active filter chip "×" | Button | Removes filter; re-executes search |
| Pagination | Links | Navigate to `/search?q=...&page=N` |

---

*End of Screen-01-search-results.md*
