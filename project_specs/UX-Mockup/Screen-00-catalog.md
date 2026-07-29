## Screen Designs

### Screen 00: Innovation Catalog

**Route:** `/` and `/catalog`
**Purpose:** Primary browsable surface; stakeholders scan the landscape of I&R work without needing a specific search query
**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4, US-9.1
**Personas:** PER-01 (Margaret), PER-02 (David), PER-04 (Marcus — orient before contributing)

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                     [Search ________] [🔍]      │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Innovation Catalog                                   Sort: [Most Recent ▼]  │
│  Showing 24 records                                                 │
│                                                                     │
│ ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│ │ FILTERS          │  │  ┌─────────────────┐ ┌─────────────────┐ │ │
│ │                  │  │  │ CATALOG CARD    │ │ CATALOG CARD    │ │ │
│ │ Maturity Level   │  │  │                 │ │                 │ │ │
│ │ ☐ Idea           │  │  │ [Experiment/POC]│ │ [Prototype/Pilot│ │ │
│ │ ☑ Experiment/POC │  │  │  ● yellow badge │ │  ● orange badge]│ │ │
│ │ ☑ Prototype/Pilot│  │  │                 │ │                 │ │ │
│ │ ☐ Production     │  │  │ Title of Record │ │ Title of Record │ │ │
│ │ ☐ Archived       │  │  │                 │ │                 │ │ │
│ │                  │  │  │ Short summary   │ │ Short summary   │ │ │
│ │ Review Status    │  │  │ text appears    │ │ text appears    │ │ │
│ │ ☐ Submitted      │  │  │ here (280 chars)│ │ here...         │ │ │
│ │ ☑ Curated        │  │  │                 │ │                 │ │ │
│ │ ☑ Tech Reviewed  │  │  │ [Curated]       │ │ [Tech Reviewed] │ │ │
│ │ ☐ Security Rev.  │  │  │                 │ │                 │ │ │
│ │ ☐ Policy Rev.    │  │  │ 🏷 Case Mgmt    │ │ 🏷 Cybersecurity│ │ │
│ │ ☐ Validated Reuse│  │  │ 🏷 AI/ML        │ │ 🏷 Cloud Infra  │ │ │
│ │                  │  │  │                 │ │                 │ │ │
│ │ Mission Area     │  │  │ 📋 Demo Avail.  │ │ 💬 Adoption Disc│ │ │
│ │ [multi-select ▼] │  │  │                 │ │                 │ │ │
│ │                  │  │  │ July 2026       │ │ June 2026       │ │ │
│ │ Technology Area  │  │  │                 │ │                 │ │ │
│ │ [multi-select ▼] │  │  │ [View Record →] │ │ [View Record →] │ │ │
│ │                  │  │  └─────────────────┘ └─────────────────┘ │ │
│ │ Contributing     │  │                                          │ │
│ │ Office           │  │  ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ [multi-select ▼] │  │  │ CATALOG CARD    │ │ CATALOG CARD    │ │ │
│ │                  │  │  │ [Community]     │ │ [Validated for  │ │ │
│ │ Reuse Potential  │  │  │  badge + label  │ │  Reuse] badge   │ │ │
│ │ ○ Any            │  │  │                 │ │                 │ │ │
│ │ ○ High           │  │  │ Title...        │ │ Title...        │ │ │
│ │ ○ Medium         │  │  │                 │ │                 │ │ │
│ │ ○ Low            │  │  │ [COMMUNITY]     │ │ [Validated ✓]   │ │ │
│ │                  │  │  │  ● gray label   │ │  ● green badge  │ │ │
│ │ [Clear All       │  │  │                 │ │                 │ │ │
│ │  Filters]        │  │  └─────────────────┘ └─────────────────┘ │ │
│ └──────────────────┘  └──────────────────────────────────────────┘ │
│                                                                     │
│                    ← Previous  [1] [2] [3]  Next →                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Catalog Card Detail (expanded)

```
┌──────────────────────────────────────────────────────┐
│  [Experiment/POC ●]    [Curated]    [COMMUNITY]       │
│                                                      │
│  Audio Security Proof of Concept                     │
│                                                      │
│  Explores feasibility of GPU/CPU audio separation    │
│  for courtroom recording in Azure Government Cloud   │
│  environments. Key constraints identified.           │
│                                                      │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure            │
│  🏷 Court Operations                                 │
│                                                      │
│  📋 Demo Available   💬 Adoption Discussion          │
│                                                      │
│  Published: July 2026  ·  Owner: I&R Branch          │
│                                                      │
│                              [View Record →]         │
└──────────────────────────────────────────────────────┘
```

**Active filter summary bar (above results when filters active):**
```
Active filters:  [Experiment/POC ×]  [Prototype/Pilot ×]  [Curated ×]
                 [Clear all filters]
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Title, maturity badge, review status badge | Card top — immediately visible |
| Primary | Short summary | Card body — scan-readable |
| Secondary | Mission area tags, technology area tags | Card mid — context |
| Secondary | Engagement indicators (Demo, Adoption, Technical Guidance) | Card mid — actionability signal |
| Secondary | Community badge, Reuse badge | Card top (conditional) |
| Tertiary | Contributing office, publication date | Card bottom |
| Tertiary | "View Record" link | Card footer CTA |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | 12-card grid, filters collapsed on mobile | N/A |
| Filtered | Active filter chips above results; count updated | "Showing 8 of 24 records" |
| Loading (initial) | Skeleton cards in grid layout | Screen reader: "Loading catalog…" |
| Loading (filter apply) | Spinner on result count; cards fade | Aria-live "Updating results…" |
| Zero results | Empty state illustration + message | "No records match your filters. Try clearing some filters or submit a mission problem." + CTA |
| Curator view | All records visible; Draft/Review cards have "[DRAFT]" or "[IN REVIEW]" label chip in top-left corner with muted background | Admin-only state chip |
| Error (503) | Error banner above catalog | "The catalog is temporarily unavailable. Please try again shortly." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search bar (header) | Text input | Navigates to `/search?q=` on submit |
| Filter checkboxes | Multi-select | Re-query on change; no submit button needed |
| Sort dropdown | Select | Re-order results client-side or re-fetch |
| Card "View Record →" | Link | Navigates to `/records/{id}` |
| Active filter chip "×" | Button | Removes that filter; re-query |
| "Clear all filters" | Button | Removes all filters; re-query |
| Pagination controls | Links | Navigate to `/catalog?page=N` |
| "Submit a Mission Problem" (nav) | Link | Navigates to `/submit-opportunity` |
| "Share Your Innovation Work" (nav) | Link | Navigates to `/share-innovation` |
| Empty state CTA | Link | Navigates to `/submit-opportunity` |

#### Empty State Design

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              📭  No records found                       │
│                                                         │
│   No records match your current filters.               │
│                                                         │
│   Try:                                                  │
│   • Clearing one or more filters                        │
│   • Searching with a keyword                            │
│                                                         │
│   Can't find work on a problem your court is facing?   │
│   [Submit a Mission Problem for I&R Consideration →]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

*End of Screen-00-catalog.md*
