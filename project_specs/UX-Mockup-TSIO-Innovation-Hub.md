# UX Mockup — TSIO Innovation Hub

**Project:** TSIO Innovation Hub
**Generated:** 2026-07-29
**Based on:** UserStories-TSIO-Innovation-Hub.md, JOURNEYS-TSIO-Innovation-Hub.md, PRD-TSIO-Innovation-Hub.md, FRD-TSIO-Innovation-Hub.md
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research Branch
**Accessibility Standard:** WCAG 2.1 AA (required for Federal government deployment)

---

## Overview

The TSIO Innovation Hub is a **governed discovery and engagement platform**, not a document library. Every design decision serves one of three objectives:

1. **Discovery** — stakeholders find prior I&R work by describing a mission problem, not a project name
2. **Understanding** — the maturity, review status, and trust signals on every record let stakeholders make informed decisions without relying on informal channels
3. **Engagement** — every record drives a clear next action (briefing request, adoption discussion, technical guidance)

### Design Principles

| Principle | UX Implication |
|-----------|----------------|
| **Engagement over archival** | Every screen answers "so what do I do now?" — no dead ends |
| **Trust integrity** | Maturity badges and trust disclaimers are prominent, not tucked away |
| **Problem-first discovery** | Search and catalog language centers on mission problems, not project titles |
| **One record, two perspectives** | Executive / Technical toggle is always visible; neither view is subordinate |
| **Maintainability over novelty** | Clean government-appropriate typography, high-contrast layout, no decorative complexity |

### Tone and Visual Character

- **Government-professional:** Clean, structured, high-information-density appropriate for Judiciary stakeholders
- **Trust-forward:** Color-coded maturity badges, prominent review status, and explicit trust disclaimers communicate governance seriousness
- **Accessible-first:** Color is never the sole differentiator; all badges carry text labels; keyboard navigation throughout

### Color System for Trust Signals

| Maturity Level | Badge Color | Hex Suggestion |
|----------------|-------------|----------------|
| Idea | Gray | `#6B7280` |
| Experiment / POC | Yellow/Amber | `#D97706` |
| Prototype / Pilot | Orange | `#EA580C` |
| Production / Validated | Green | `#16A34A` |
| Archived | Dark Gray | `#374151` |

All badge colors must meet 4.5:1 contrast ratio against white and badge background per WCAG 2.1 AA.

---

## Navigation Map

| Screen | Route | Reached From | Nav Element |
|--------|-------|--------------|-------------|
| Innovation Catalog | `/` and `/catalog` | App shell | Top nav: "Catalog" / Hub logo |
| Search Results | `/search?q=...` | App shell (search bar on every page) | Global search bar → submit |
| Innovation Record — Executive View | `/records/{id}` | Catalog card / Search result / Direct link | Card click / Result click |
| Innovation Record — Technical View | `/records/{id}?view=technical` | Innovation Record (Executive) | Perspective toggle: "Technical View" |
| Opportunity Submission Form | `/submit-opportunity` | Catalog empty state / Search empty state / Record page CTA / Top nav | "Submit a Mission Problem" link |
| Opportunity Submission Confirmation | `/submit-opportunity/confirmation` | Opportunity Submission Form | Form submit success |
| Contribution Submission Form | `/share-innovation` | Catalog page CTA / Top nav | "Share Your Innovation Work" link |
| Contribution Submission Confirmation | `/share-innovation/confirmation` | Contribution Submission Form | Form submit success |
| Engagement Request Modal | Modal on `/records/{id}` | Innovation Record (both perspectives) | Next-Action panel button |
| Admin — Dashboard | `/admin` | App shell (authenticated) | Admin nav: "Dashboard" |
| Admin — Records List | `/admin/records` | Admin Dashboard / Admin nav | Dashboard quick-link / Sidebar: "Records" |
| Admin — Record Create/Edit | `/admin/records/new` and `/admin/records/{id}/edit` | Records List / Dashboard | "New Record" button / Row "Edit" action |
| Admin — Record Audit History | `/admin/records/{id}/audit` | Admin Record Edit view | Record edit view: "View Audit History" tab |
| Admin — Submission Queue (Opportunities) | `/admin/submissions/opportunities` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Submissions → Opportunities" |
| Admin — Submission Queue (Contributions) | `/admin/submissions/contributions` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Submissions → Contributions" |
| Admin — Engagement Activity Log | `/admin/engagement` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Engagement" |
| Admin — Settings | `/admin/settings` | Admin nav | Sidebar: "Settings" |
| Admin — Content Model Reference | `/admin/content-model` | Admin nav | Sidebar: "Content Model Reference" |

**Invariant — no orphan screens:** All screens above trace to the app shell (top nav / admin sidebar) or a reachable parent. The Engagement Request Modal is not a standalone route; it is triggered from the Innovation Record page. Confirmation screens are reached only through successful form submissions.

---

## Personas Quick Reference

| ID | Name | Role | Primary Screens |
|----|------|------|-----------------|
| PER-01 | Margaret Hollis | Decision-Maker / Executive | Catalog, Record (Executive), Opportunity Submission, Engagement Modal |
| PER-02 | David Reyes | Operational Leader / Court Administrator | Search, Record (Executive + Reuse Guidance), Opportunity Submission |
| PER-03 | Priya Nair | Technical Adopter / Court IT Staff | Record (Technical), Search, Engagement Modal (Technical Guidance) |
| PER-04 | Marcus Webb | Innovation Contributor / Court Team Lead | Contribution Submission Form, Catalog (viewing attribution) |
| PER-05 | Catalina Torres | I&R Curator / TSIO Team Member | All Admin screens |

---

*End of 00-overview.md*
## User Flows

### Flow 00: Browse and Discover (Catalog)

**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4
**Personas:** Margaret Hollis (PER-01), David Reyes (PER-02)
**Trigger:** User navigates to Hub root URL (`/`) or `/catalog`

```
[Hub Landing — /catalog]
        │
        ▼
[Innovation Catalog — Published records, card grid]
        │
        ├── Browse without filters ──▶ [Scan cards for maturity/tags]
        │                                      │
        │                                      ▼
        │                              [Click catalog card]
        │                                      │
        │                                      ▼
        │                            [Innovation Record Page]
        │                                 (→ Flow 02)
        │
        ├── Apply filters ──▶ [Filter panel: maturity, review status,
        │                       mission area, tech area, office, reuse]
        │                                      │
        │                              Results re-render (no reload)
        │                                      │
        │                    ┌─────────────────┴──────────────────┐
        │                    ▼                                     ▼
        │            [Filtered results]                    [Zero results]
        │                    │                                     │
        │            [Click card]                    [Empty state + CTA]
        │                    │                                     │
        │           [Innovation Record]                  "Submit a Mission
        │                                                  Problem" link
        │                                                          │
        │                                                [Opportunity
        │                                                Submission Form]
        │                                                 (→ Flow 04)
        │
        └── Sort ──▶ [Most Recent | Maturity | Relevance]
                              │
                     [Re-ordered catalog results]
```

**Curator variant:** Authenticated curator sees ALL records (Draft, In Review, Published, Superseded, Archived) with state labels. Draft/In Review cards have a muted overlay and state badge. Curator can click any card to open the admin record view.

---

### Flow 01: Search and Discover

**User Stories:** US-1.1, US-1.2, US-1.3
**Personas:** David Reyes (PER-02), Priya Nair (PER-03), Margaret Hollis (PER-01)
**Trigger:** User types in global search bar (available on all pages)

```
[Global Search Bar — available in top nav on all pages]
        │
        ├── Blank/whitespace query ──▶ [Inline prompt: "Enter a search term"]
        │                                       (no search executed)
        │
        ├── Query > 500 chars ──▶ [Inline error: "Too long — max 500 chars"]
        │
        └── Valid query (1–500 chars) ──▶ [Submit]
                        │
                        ▼
             [Search Results Page — /search?q=...]
                        │
                        ├── Results found ──▶ [Ranked result cards]
                        │                       (with maturity, review status,
                        │                        query term highlights)
                        │                              │
                        │                   ┌──────────┴──────────┐
                        │                   ▼                     ▼
                        │          [Apply filters]        [Click result card]
                        │        [Maturity, Review,             │
                        │         Office, Reuse]        [Innovation Record]
                        │                │                (→ Flow 02)
                        │          [Re-ranked results]
                        │
                        └── Zero results ──▶ [Empty state message]
                                                    │
                                      "No records found for '[query]'.
                                       Try different keywords, or submit
                                       a mission problem for I&R consideration."
                                                    │
                                             [CTA: Submit Mission Problem]
                                                    │
                                          [Opportunity Submission Form]
                                               (→ Flow 04)
```

---

### Flow 02: View Innovation Record

**User Stories:** US-2.1, US-3.1, US-3.2, US-4.2, US-9.1, US-9.2
**Personas:** PER-01, PER-02, PER-03
**Trigger:** User clicks a catalog card or search result

```
[Innovation Record — /records/{id}]
        │
        ▼ (loads in default perspective — usually Executive)
[Record Header: Title, Problem Statement, Maturity Badge, Review Status Badge]
        │
        ├── [Perspective Toggle visible: "Executive View" | "Technical View"]
        │
        ├── Executive View (default) ──────────────────────────────────┐
        │        │                                                      │
        │   [Executive Perspective content]                             │
        │   - Mission relevance framing                                 │
        │   - Decision recommendation                                   │
        │   - Maturity + review status in plain language                │
        │   - Trust & Limitations section                               │
        │   - Reuse potential (plain language)                          │
        │   - "View Technical Details →" link                           │
        │   - Next-Action Panel (Request Briefing / Request Demo)       │
        │        │                                                      │
        │        └── Click "View Technical Details →" ──────────────────┘
        │                                                               │
        ├── Technical View ──────────────────────────────────────────────┘
        │        │
        │   [Technical Perspective content]
        │   - What Was Explored
        │   - Technical perspective text (or placeholder if empty)
        │   - Security findings
        │   - Performance findings
        │   - Reuse guidance (court-specific)
        │   - Artifact links (code repos + diagrams prominent)
        │   - Technology area tags
        │   - Trust & Limitations section
        │   - "View Executive Summary →" link
        │   - Next-Action Panel (Request Technical Guidance primary CTA)
        │        │
        │        └── Click "View Executive Summary →" ──▶ Executive View
        │
        ├── Click engagement option ──▶ [Engagement Request Modal]
        │                                       (→ Flow 03)
        │
        └── Click artifact link ──▶ [Opens external URL in new tab]
                                     (SharePoint, GitHub, video, diagram)
```

---

### Flow 03: Engagement Request

**User Stories:** US-7.1, US-7.2
**Personas:** PER-01, PER-02, PER-03
**Trigger:** User clicks an engagement option button on an Innovation Record page

```
[Next-Action Panel on Innovation Record]
        │
[Click engagement button]
(e.g., "Request Briefing", "Request Demo", "Request Technical Guidance",
 "Request Adoption Discussion")
        │
        ▼
[Engagement Request Modal — inline or overlay]
(record title and ID pre-populated; request type pre-set)
        │
        ├── Fill form fields:
        │   - Requestor name (required)
        │   - Office (required)
        │   - Email (required)
        │   - Description of interest (required, 20–2000 chars)
        │   - Desired next step (optional)
        │   - CAPTCHA verification (required)
        │
        ├── Submit ──▶ Validation
        │                │
        │    ┌───────────┴───────────┐
        │    ▼                       ▼
        │  [Errors shown inline]  [Success]
        │  (fix and resubmit)         │
        │                    [On-screen confirmation]
        │                    "Your request has been sent to the I&R team.
        │                     Someone will follow up with you based on
        │                     team availability."
        │                             │
        │                    [Modal closes / dismiss]
        │                             │
        │                    [Return to Innovation Record]
        │
        └── Cancel ──▶ [Modal closes; return to Innovation Record]
```

---

### Flow 04: Opportunity Submission

**User Stories:** US-5.1, US-5.2
**Personas:** PER-01, PER-02
**Trigger:** CTA from catalog/search empty state, record page, or top nav

```
[/submit-opportunity]
        │
[Opportunity Submission Form]
        │
        ├── Fill form fields:
        │   - Problem description (required, 50–3000 chars)
        │   - Mission area (required)
        │   - Submitting office (required)
        │   - Submitter name (required)
        │   - Submitter email (required)
        │   - Submitter title (optional)
        │   - Urgency context (optional)
        │   - Known constraints (optional)
        │   - CAPTCHA verification (required)
        │
        ├── Submit ──▶ Validation
        │                │
        │    ┌───────────┴───────────┐
        │    ▼                       ▼
        │  [Field errors shown     [Success]
        │   inline; fix and             │
        │   resubmit]          [Confirmation page]
        │                      "Your submission has been received.
        │                       This does not imply acceptance of the
        │                       opportunity into the I&R portfolio or
        │                       a commitment to begin a project."
        │                             │
        │                      [CTA: Return to Catalog]
        │
        └── Return to Catalog link (top of page)
```

---

### Flow 05: Contribution Submission

**User Stories:** US-6.1, US-6.2
**Persona:** Marcus Webb (PER-04)
**Trigger:** "Share Your Innovation Work" CTA from catalog or nav

```
[/share-innovation]
        │
[Contribution Submission Form]
        │
        ├── Fill form fields:
        │   - Work description (required, 50–3000 chars)
        │   - Problem addressed (required, 50–2000 chars)
        │   - Outcome summary (required, 50–2000 chars)
        │   - Self-assessed maturity (required, enum — no ARCHIVED option)
        │   - Artifact URLs (required, 1–5 valid HTTPS URLs)
        │   - Contributing team (required)
        │   - Contributing office (required)
        │   - Contact name + email (required)
        │   - Contact title (optional)
        │   - Additional context (optional)
        │   - CAPTCHA verification (required)
        │
        ├── Submit ──▶ Validation
        │                │
        │    ┌───────────┴───────────┐
        │    ▼                       ▼
        │  [Field errors inline]  [Success]
        │                             │
        │                    [Confirmation page]
        │                    "Your submission has been received.
        │                     The I&R team will review it for potential
        │                     curation. This submission does not guarantee
        │                     publication. If your work is published, your
        │                     team will receive attribution."
        │                             │
        │                    [CTA: Return to Catalog]
```

---

### Flow 06: Curator — Record Lifecycle

**User Stories:** US-2.2, US-2.3, US-2.4, US-3.3
**Persona:** Catalina Torres (PER-05)
**Trigger:** Curator logs in and navigates to Admin → Records → New

```
[Admin Dashboard — /admin]
        │
        ▼
[Admin Records List — /admin/records]
        │
        ├── Click "New Innovation Record"
        │           │
        │           ▼
        │   [Record Create Form — /admin/records/new]
        │   (DRAFT state created on first save)
        │           │
        │   ┌───────┴──────────────────────┐
        │   │  Fill all fields; Save Draft  │ ◀── Auto-save / explicit save
        │   └───────────────────────────────┘
        │           │
        │   [Pre-publish checklist shown]
        │   (green = complete; red = missing)
        │           │
        │   Click "Submit for Review"
        │           │
        │   ┌───────┴──────────────────────┐
        │   │  Missing pub-required fields? │
        │   └───────────────────────────────┘
        │      │                    │
        │      ▼ YES                ▼ NO
        │  [List blocking      [State → REVIEW]
        │   fields; prevent    Audit entry logged
        │   transition]
        │           │
        │   [Record in REVIEW state]
        │   Curator reviews; edits if needed
        │           │
        │   Click "Publish"
        │           │
        │   [Governance gate re-validates]
        │           │
        │      │                    │
        │      ▼ FAILS              ▼ PASSES
        │  [Blocking fields     [State → PUBLISHED]
        │   listed again]       published_at set
        │                       Audit entry logged
        │                       Record appears in catalog + search
        │           │
        │   [Published record — options:]
        │   ├── Edit ──▶ Warning modal ──▶ confirm ──▶ State → REVIEW
        │   ├── Supersede ──▶ Enter superseded_by_record_id ──▶ SUPERSEDED
        │   └── Archive ──▶ Confirm ──▶ ARCHIVED (removed from default browse)
```

---

### Flow 07: Curator — Submission Queue Review

**User Stories:** US-5.3, US-6.3, US-7.3
**Persona:** Catalina Torres (PER-05)
**Trigger:** Curator logs in; sees pending queue on Dashboard

```
[Admin Dashboard — pending counts visible]
        │
        ├── Click "Opportunity Submissions" tile
        │           │
        │   [Submission Queue — /admin/submissions/opportunities]
        │   (list: type, date, office, contact, status)
        │           │
        │   [Click submission row]
        │           │
        │   [Submission Detail]
        │   - Read problem description
        │   - Set disposition:
        │     UNDER_REVIEW | ACCEPTED_FOR_CONSIDERATION | DECLINED | LINKED_TO_RECORD
        │   - If LINKED_TO_RECORD: enter linked_record_id
        │   - Add internal notes
        │   - Save disposition (audit-logged)
        │           │
        │   [Return to queue]
        │
        └── Click "Contribution Submissions" tile
                    │
            [Contribution Queue — /admin/submissions/contributions]
                    │
            [Click submission row]
                    │
            [Submission Detail]
            - Read work description, artifacts
            - Set disposition: UNDER_REVIEW | ACCEPTED_FOR_CURATION | DECLINED
            - If ACCEPTED_FOR_CURATION: click "Create Record from Submission"
                    │
                    ▼
            [New Record pre-populated]
            (work description → what_was_explored,
             problem → problem_statement,
             outcome → outcome_summary,
             artifacts → artifact_links,
             source_type = COMMUNITY set automatically)
                    │
            [Standard publication lifecycle]
            (→ Flow 06)
```

---

*End of Flow-00 through Flow-07*
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
### Screen 02: Innovation Record Page

**Route:** `/records/{record_id}` and `/records/{record_id}?view=technical`
**Purpose:** Full structured representation of an innovation effort — serves both executive and technical audiences from a single record
**User Stories:** US-2.1, US-3.1, US-3.2, US-4.2, US-9.1, US-9.2
**Personas:** PER-01 (Margaret — Executive), PER-02 (David — Executive + Reuse), PER-03 (Priya — Technical)

---

#### Layout — Executive View (default)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│ ← Back to Catalog                                                   │
│                                                                     │
│  Audio Security Proof of Concept                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  [Experiment/POC ●]  [Curated]  Owner: I&R Branch  Last reviewed: July 2026 │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure  🏷 Court Operations      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Executive View]  [Technical View]                           │  │
│  │  ────────────────  ──────────────────────────────────────     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  MISSION PROBLEM                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts need reliable audio separation between participants in      │
│  sensitive proceedings to prevent accidental recording of           │
│  attorney-client communications and sidebars.                       │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  EXECUTIVE PERSPECTIVE                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Executive framing narrative — mission relevance text]             │
│  This effort validated that GPU/CPU audio separation is             │
│  technically feasible but faces meaningful constraints in           │
│  the Azure Government Cloud environment currently used…             │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  DECISION RECOMMENDATION                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  This effort is at Proof of Concept stage and is not recommended   │
│  for production adoption without additional security review and     │
│  performance testing in a court-representative environment.         │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OUTCOME SUMMARY                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  The POC demonstrated partial feasibility. GPU-based separation     │
│  works in controlled conditions but Azure Government Cloud          │
│  network segmentation constraints prevent production deployment.    │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  KEY FINDINGS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • GPU/CPU separation architecture is viable for audio isolation    │
│  • Azure Government Cloud GPU availability is limited               │
│  • Latency exceeds acceptable thresholds for real-time proceedings  │
│  • Production readiness requires dedicated GPU infrastructure       │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚠ TRUST & LIMITATIONS                                       │  │
│  │                                                              │  │
│  │  • Proof of concept results do not indicate production       │  │
│  │    readiness. This record should not be interpreted as a     │  │
│  │    recommendation to deploy without additional validation.   │  │
│  │                                                              │  │
│  │  • Publication on the TSIO Innovation Hub indicates curation │  │
│  │    by the I&R team. It does not constitute formal adoption   │  │
│  │    approval.                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Maturity: Experiment / POC  ·  Review Status: Curated              │
│  Reuse Potential: Medium                                            │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  NEXT ACTIONS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  [📋 Request a Briefing]   [🎬 Request a Demo]            │     │
│  │  [💬 Request Adoption Discussion]                         │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│                         [View Technical Details →]                  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SOURCE DOCUMENTS & ARTIFACTS                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📄 Audio Security POC Lessons-Learned Document [SharePoint ↗]     │
│  (External link — opens in new tab)                                 │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Owner: I&R Branch  ·  Contributing Office: TSIO I&R               │
│  Record ID: …  ·  Published: July 2026  ·  Last Reviewed: July 2026│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

#### Layout — Technical View

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
├─────────────────────────────────────────────────────────────────────┤
│ ← Back to Catalog                                                   │
│                                                                     │
│  Audio Security Proof of Concept                                    │
│  [Experiment/POC ●]  [Curated]  Owner: I&R Branch                   │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Executive View]  [Technical View]  ← active                │  │
│  │  ──────────────    ════════════════                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  MISSION PROBLEM  (same as Executive)                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts need reliable audio separation…                             │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  WHAT WAS EXPLORED                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Technical description of approach, technology stack,              │
│   architecture decisions, infrastructure used]                      │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  TECHNICAL DETAILS                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [technical_perspective_text — architecture narrative,              │
│   tools, dependencies, infrastructure requirements]                 │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SECURITY FINDINGS                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⚠ Security review has NOT been completed for this record.         │
│    Local security assessment required before any adoption           │
│    consideration.                                                   │
│                                                                     │
│  [security_findings text if populated]                              │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  PERFORMANCE FINDINGS                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [performance_findings text if populated]                           │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  REUSE GUIDANCE                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts without dedicated GPU infrastructure would require          │
│  hardware provisioning. Azure Government Cloud courts should        │
│  note: GPU availability in standard tiers is limited…               │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  KEY FINDINGS  (same as Executive)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • GPU/CPU separation architecture is viable…                       │
│  • Azure Government Cloud GPU availability is limited…              │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OUTCOME SUMMARY  (same as Executive)                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  The POC demonstrated partial feasibility…                          │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚠ TRUST & LIMITATIONS  (identical in both views)           │  │
│  │  • POC results do not indicate production readiness…        │  │
│  │  • Published ≠ formal adoption approval…                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  NEXT ACTIONS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  [🔧 Request Technical Guidance]  ← primary CTA here     │      │
│  │  [📋 Request a Briefing]  [💬 Request Adoption Discussion]│      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│                       [View Executive Summary →]                    │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  TECHNICAL ARTIFACTS  (code repos and diagrams visually prominent)  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🔧 Architecture Diagram — SharePoint [↗ opens in new tab]         │
│  📄 Audio Security POC Lessons-Learned — SharePoint [↗]            │
│  (External links — Hub does not host or cache these documents)      │
│                                                                     │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure  🏷 AI/ML               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Perspective Toggle Design

```
  ┌──────────────────────────────────────────────┐
  │  [Executive View]        [Technical View]    │
  │  ════════════════        ─────────────────   │
  │  (underline = active tab; always both visible)│
  └──────────────────────────────────────────────┘
```

Behavior:
- Toggle is implemented as a tab control with `role="tablist"` and `role="tab"`
- Active tab is underlined and has `aria-selected="true"`
- Tab switching re-renders content area without page reload
- URL updates to include `?view=executive` or `?view=technical` for shareability
- Toggle is **always visible** — cannot be hidden even if technical content is minimal

#### Trust & Limitations Section Design

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠  TRUST & LIMITATIONS                                      │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  The following statements apply to this record:             │
│                                                              │
│  • Proof of concept and prototype results do not indicate   │
│    production readiness. This record should not be          │
│    interpreted as a recommendation to deploy in a           │
│    production environment without additional validation.    │
│                                                              │
│  • Publication on the TSIO Innovation Hub indicates         │
│    curation and structured presentation by the I&R team.   │
│    It does not constitute formal adoption approval.         │
│                                                              │
│  [Additional disclaimers appear automatically if            │
│   source_type = COMMUNITY or review_status = VALIDATED]     │
└──────────────────────────────────────────────────────────────┘
```

- Background: light amber (`#FEF3C7`) with left border `#D97706`
- Appears **before** the Next-Action panel in both perspectives
- System-generated; curator cannot suppress or modify

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Title, maturity badge, review status badge | Record header — always visible |
| Primary | Perspective toggle (Executive / Technical) | Immediately below header — always visible |
| Primary | Problem Statement | First section — both views |
| Primary | Decision Recommendation (Executive) / Reuse Guidance (Technical) | Prominent section |
| Primary | Trust & Limitations | Before Next-Action panel — both views |
| Primary | Next-Action panel (engagement CTAs) | Before footer — both views |
| Secondary | Executive perspective text / What Was Explored | Mid-record by view |
| Secondary | Key Findings | Both views |
| Secondary | Security Findings (Technical only) | Technical view only |
| Secondary | Outcome Summary | Both views |
| Tertiary | Mission/tech area tags | Header area |
| Tertiary | Artifact links | Separate section below Next-Action |
| Tertiary | Owner, contributing office, dates | Record footer |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default — Executive | Executive content visible; "Executive View" tab active | N/A |
| Default — Technical | Technical content visible; "Technical View" tab active | N/A |
| Technical content empty | Technical view tab visible; placeholder text shown | "Technical detail for this record is not yet available. Contact the I&R team for more information." |
| Loading | Skeleton layout matching section structure | Screen reader: "Loading record…" |
| 404 (non-published) | 404 page | "The requested record was not found." |
| Community record | Community badge in header; Community trust disclaimer rendered | Disclaimer: "This record was contributed by a team outside the TSIO I&R branch…" |
| Validated for Reuse | Reuse badge in header; Validated trust disclaimer rendered | Disclaimer: "Validated for Reuse status indicates reviews completed. It does not waive local requirements…" |
| Superseded record | Yellow banner at top | "This record has been superseded by [link to newer record]." |
| Archived record | Gray banner at top; record accessible but not in catalog | "This record is archived. It is retained for institutional learning but is no longer actively maintained." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Perspective toggle tabs | Tab control | Switch between Executive/Technical content; update URL param |
| Engagement button (primary CTA) | Button | Opens Engagement Request modal |
| Additional engagement buttons | Buttons | Open Engagement Request modal with pre-set type |
| "View Technical Details →" | Link | Switches to Technical Perspective |
| "View Executive Summary →" | Link | Switches to Executive Perspective |
| Artifact links | External link | Opens external URL in new tab; aria-label includes "(opens in new tab)" |
| "← Back to Catalog" | Link | Returns to catalog or search results |

---

*End of Screen-02-innovation-record.md*
### Screen 03: Engagement Request Modal

**Route:** Modal overlay on `/records/{record_id}`
**Purpose:** Allow stakeholders to request a briefing, demo, adoption discussion, or technical guidance — with the record reference pre-populated
**User Stories:** US-7.1, US-7.2
**Personas:** PER-01 (briefing/demo), PER-02 (adoption discussion), PER-03 (technical guidance)

#### Layout — Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Background: Innovation Record page — dimmed overlay]              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Request Technical Guidance                          [✕]    │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │                                                             │    │
│  │  You are requesting technical guidance for:               │    │
│  │  📋 Audio Security Proof of Concept                       │    │
│  │  (Pre-populated — cannot edit record reference)           │    │
│  │                                                             │    │
│  │  Your Name *                                              │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Your Office *                                            │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Your Email Address *                                     │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Describe your interest or question *                     │    │
│  │  Help us understand your context so we can               │    │
│  │  respond appropriately.                (20–2000 chars)   │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  │                                                     │  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │  0 / 2000                                                 │    │
│  │                                                             │    │
│  │  Desired next step (optional)                             │    │
│  │  e.g., a call, a document review, a live demo             │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────────────┐ │    │
│  │  │  [CAPTCHA / reCAPTCHA widget]                        │ │    │
│  │  └──────────────────────────────────────────────────────┘ │    │
│  │                                                             │    │
│  │  * Required fields                                        │    │
│  │                                                             │    │
│  │  [Cancel]                  [Submit Request]               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation State (replaces form content)

```
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Request Submitted                               [✕]        │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │                                                             │    │
│  │              ✅                                             │    │
│  │                                                             │    │
│  │  Your request has been sent to the I&R team.              │    │
│  │  Someone will follow up with you based on                 │    │
│  │  team availability.                                       │    │
│  │                                                             │    │
│  │  Request type: Technical Guidance                         │    │
│  │  Record: Audio Security Proof of Concept                  │    │
│  │  Submitted: July 29, 2026 at 2:14 PM                      │    │
│  │                                                             │    │
│  │                          [Close]                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Request type heading | Modal title |
| Primary | Pre-populated record reference | Below title — read-only |
| Primary | Required form fields (name, office, email, description) | Modal body |
| Secondary | Optional fields (desired next step) | Modal body below required |
| Secondary | CAPTCHA | Before submit button |
| Tertiary | Character count | Below description field |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (open) | Form with empty fields; record reference pre-filled | Focus placed on first field (Name) |
| Validation error | Inline error messages per field; red border | "Name is required." / "Description must be at least 20 characters." |
| Submitting | Submit button shows spinner; "Submitting…"; inputs disabled | Screen reader: "Submitting your request…" |
| Success | Form content replaced by confirmation message | ✅ confirmation with request details |
| Rate limited | Error message at form top | "Too many requests. Please try again later." |
| Server error | Error message at form top | "Unable to submit at this time. Please try again or contact the I&R team directly." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Modal close button [✕] | Button | Closes modal; focus returns to trigger button |
| Text inputs | Input fields | Standard text entry; validated on blur |
| Description textarea | Textarea | Character count shown; validated on blur |
| CAPTCHA widget | Third-party widget | Must complete before submit enabled |
| "Cancel" button | Button | Closes modal; no submission |
| "Submit Request" button | Primary button | Submits form; shows loading state |
| [Close] in confirmation | Button | Closes modal; returns focus to record page |

#### Engagement Request Types and Primary CTA Mapping

| Request Type | Trigger | Primary CTA (in Executive View) | Primary CTA (in Technical View) |
|---|---|---|---|
| REQUEST_BRIEFING | Configured on record | ✅ "Request a Briefing" — primary | Available |
| REQUEST_DEMO | Configured on record | ✅ "Request a Demo" — primary | Available |
| REQUEST_ADOPTION_DISCUSSION | Configured on record | Available | Available |
| REQUEST_TECHNICAL_GUIDANCE | Configured on record | Available | ✅ "Request Technical Guidance" — primary |
| SUBMIT_RELATED_PROBLEM | Configured on record | Available | Available |

**Note:** A stakeholder can only request an engagement type that has been configured for that record. If a type is not configured, its button is not shown.

---

*End of Screen-03-engagement-modal.md*
### Screen 04: Opportunity Submission Form

**Route:** `/submit-opportunity`
**Purpose:** Allow stakeholders to submit a mission problem for I&R consideration without authentication; problem-first framing; explicit non-commitment messaging
**User Stories:** US-5.1, US-5.2
**Personas:** PER-01 (Margaret), PER-02 (David)

#### Layout — Form

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ← Back to Catalog                                                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Submit a Mission Problem                                   │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  Help the I&R team understand the mission challenges       │   │
│  │  your court or organization is facing. Submissions are     │   │
│  │  reviewed by the I&R team for future consideration.        │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ℹ  Submitting this form does not imply acceptance   │  │   │
│  │  │     of the opportunity into the I&R portfolio or a   │  │   │
│  │  │     commitment to begin a project or establish a      │  │   │
│  │  │     timeline.                                         │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — DESCRIBE THE PROBLEM —                                  │   │
│  │                                                             │   │
│  │  Describe the mission problem you are facing *            │   │
│  │  Focus on the challenge, not a proposed solution.         │   │
│  │  What is difficult or impossible today? Who is affected?  │   │
│  │                                      (50–3000 chars)      │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 3000                                                  │   │
│  │                                                             │   │
│  │  Mission Area *                                           │   │
│  │  Select the primary mission area this problem affects.    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  [Select mission area ▼]                            │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Urgency Context (optional)                               │   │
│  │  Is there a decision deadline or event driving urgency?   │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Known Constraints (optional)                             │   │
│  │  Budget, policy, technical, or operational constraints    │   │
│  │  the I&R team should be aware of.                         │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR CONTACT INFORMATION —                              │   │
│  │                                                             │   │
│  │  Submitting Office *                                      │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Name *                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Title (optional)                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Email Address *                                     │   │
│  │  A confirmation may be sent to this address.              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  [CAPTCHA / reCAPTCHA widget]                        │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  * Required fields                                        │   │
│  │                                                             │   │
│  │              [Submit Mission Problem]                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation Page

**Route:** `/submit-opportunity/confirmation`

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                      ✅                                     │   │
│  │                                                             │   │
│  │  Your submission has been received.                        │   │
│  │                                                             │   │
│  │  Thank you for taking the time to describe this mission    │   │
│  │  problem. Your input helps I&R prioritize future           │   │
│  │  exploration.                                              │   │
│  │                                                             │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │  Important: This submission does not imply acceptance      │   │
│  │  of the opportunity into the I&R portfolio or a           │   │
│  │  commitment to begin a project or establish a timeline.   │   │
│  │                                                             │   │
│  │  The I&R curation team will review your submission.       │   │
│  │  If I&R pursues this opportunity, the submitting          │   │
│  │  contact may be engaged for additional context.           │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │                                                             │   │
│  │  A confirmation may have been sent to the email           │   │
│  │  address you provided.                                    │   │
│  │                                                             │   │
│  │              [Return to Innovation Catalog]               │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Non-commitment notice (ℹ box) | Top of form — before all fields |
| Primary | Problem description (required, large textarea) | First field group — problem-first ordering |
| Primary | Mission area (required) | Second field — context for routing |
| Secondary | Urgency context (optional) | Middle |
| Secondary | Known constraints (optional) | Middle |
| Secondary | Contact information fields | Second section — separate from problem |
| Tertiary | CAPTCHA, submit button | Bottom |

#### Field Ordering Rationale

The form uses **problem-first ordering**: the mission problem description is the very first field, before any contact information. This signals to the submitter that the I&R team wants to understand the problem, not just log a contact. Contact information comes second to reduce cognitive load and avoid making the form feel like a registration form.

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Empty form; info notice visible | Non-commitment language visible from page load |
| In-progress | Fields filled; character counter active | Running count on description field |
| Validation error | Inline error per field; red border; error summary at top | "Please fix the following errors: …" |
| Submitting | Button shows spinner; "Submitting…"; form inputs disabled | Screen reader: "Submitting your mission problem…" |
| Success | Navigates to confirmation page | Confirmation with explicit non-commitment language |
| Server error | Error banner at form top | "Unable to submit at this time. Please try again or contact the I&R team directly." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Problem description textarea | Textarea | Required; 50–3000 chars; live character count |
| Mission area dropdown | Select | Required; enumerated mission areas |
| Urgency, constraints textareas | Textarea | Optional |
| Office, name, title, email inputs | Text/email input | Office, name, email required |
| CAPTCHA widget | Third-party | Must complete before submit enabled |
| Submit button | Primary button | Validates all fields; submits on pass |
| "← Back to Catalog" | Link | Returns to `/catalog` |
| "Return to Innovation Catalog" (confirmation) | Primary button | Navigates to `/catalog` |

---

*End of Screen-04-opportunity-submission.md*
### Screen 05: Contribution Submission Form

**Route:** `/share-innovation`
**Purpose:** Allow teams outside I&R to submit existing innovation work through a governed contribution pathway; explicit curation-before-publication messaging
**User Stories:** US-6.1, US-6.2
**Persona:** Marcus Webb (PER-04)

#### Layout — Form

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ← Back to Catalog                                                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Share Your Innovation Work                                 │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  Has your court or team done innovation work that could    │   │
│  │  benefit the broader Judiciary? Submit it here for I&R    │   │
│  │  curation review.                                          │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ℹ  Submissions enter I&R curation review.           │  │   │
│  │  │     Publication is not guaranteed.                   │  │   │
│  │  │     If published, your team will be credited.        │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — ABOUT THE WORK —                                        │   │
│  │                                                             │   │
│  │  Describe the mission problem your team addressed *       │   │
│  │  What challenge were you solving? Who is affected?        │   │
│  │                                     (50–2000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 2000                                                  │   │
│  │                                                             │   │
│  │  Describe what your team built or explored *              │   │
│  │  What approach, technology, or method did you use?        │   │
│  │                                     (50–3000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 3000                                                  │   │
│  │                                                             │   │
│  │  Outcome Summary *                                        │   │
│  │  What were the results? Include limitations or gaps.      │   │
│  │                                     (50–2000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 2000                                                  │   │
│  │                                                             │   │
│  │  What stage is this work at? *                            │   │
│  │  Your honest assessment of current maturity.              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  ○ Idea (problem identified, no exploration yet)    │  │   │
│  │  │  ○ Experiment / POC (feasibility explored)          │  │   │
│  │  │  ○ Prototype / Pilot (working model tested)         │  │   │
│  │  │  ○ Production / Validated (deployed and operating)  │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  Note: Final maturity level is assigned by I&R curators.  │   │
│  │                                                             │   │
│  │  Artifact Links *                                         │   │
│  │  Provide links to documentation, diagrams, code, or       │   │
│  │  recordings that support your submission. (1–5 URLs)      │   │
│  │  All URLs must begin with https://                        │   │
│  │                                                             │   │
│  │  Artifact URL 1 *                                         │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  https://                                           │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Artifact URL 2 (optional)                               │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  https://                                           │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  [+ Add another artifact URL] (up to 5 total)            │   │
│  │                                                             │   │
│  │  Additional Context (optional)                            │   │
│  │  Anything else I&R should know about this work.          │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR TEAM —                                             │   │
│  │                                                             │   │
│  │  Contributing Team Name *                                 │   │
│  │  This is how your team will be credited if published.     │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contributing Office *                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR CONTACT INFORMATION —                              │   │
│  │                                                             │   │
│  │  Contact Name *                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contact Title (optional)                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contact Email Address *                                  │   │
│  │  A confirmation may be sent to this address. A curator   │   │
│  │  may reach out before publication.                        │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  [CAPTCHA / reCAPTCHA widget]                        │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  * Required fields                                        │   │
│  │                                                             │   │
│  │              [Submit Innovation Work]                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation Page

**Route:** `/share-innovation/confirmation`

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        ✅                                   │   │
│  │                                                             │   │
│  │  Your submission has been received.                        │   │
│  │                                                             │   │
│  │  The I&R team will review your submission for potential    │   │
│  │  curation. Here is what happens next:                      │   │
│  │                                                             │   │
│  │  1. I&R curators review your materials                    │   │
│  │  2. A curator may contact you for additional context      │   │
│  │  3. If accepted, a curator will create and enrich a       │   │
│  │     structured Innovation Record                          │   │
│  │  4. You will be contacted before any record is published  │   │
│  │                                                             │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │  This submission does not guarantee publication.          │   │
│  │  If your work is published, your team will receive        │   │
│  │  named attribution.                                       │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │                                                             │   │
│  │              [Return to Innovation Catalog]               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Governance notice (curation required, not auto-published) | Top of form — always visible |
| Primary | Problem description (required) | First content field |
| Primary | Work description (required) | Second content field |
| Primary | Outcome summary (required) | Third content field |
| Primary | Maturity self-assessment (required) | Helps curator but acknowledged as self-assessed |
| Primary | At least one artifact URL (required) | Content section |
| Secondary | Additional artifact URLs (optional, up to 5) | Expandable in same section |
| Secondary | Team and contact information | Second group |
| Tertiary | Additional context (optional), CAPTCHA, submit | Bottom |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Empty form; governance notice visible | N/A |
| Validation error | Inline errors per field | Error summary at top: "Please correct the highlighted fields." |
| Submitting | Button spinner; inputs disabled | "Submitting…" |
| Success | Confirmation page | Process steps listed; attribution messaging |
| Rate limited (>5/IP/hour) | Error at form top | "Too many submissions from this location. Please try again later." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Problem / work / outcome textareas | Textarea | Required; char count shown |
| Maturity radio buttons | Radio group | One selection; no "Archived" option |
| Artifact URL inputs | Text (URL) | Required for first; optional for 2–5; validated as https:// |
| "+ Add another artifact URL" | Button | Reveals next URL field up to 5 |
| Team / contact inputs | Text / email | Required fields validated |
| CAPTCHA | Widget | Required before submit |
| Submit button | Primary button | Full validation on submit |

---

*End of Screen-05-contribution-submission.md*
### Screen 06: Curator Admin Dashboard

**Route:** `/admin`
**Purpose:** Operational command center for I&R curators — summary tiles, quick-action links, and pending queue counts; first screen after login
**User Stories:** US-8.1
**Persona:** Catalina Torres (PER-05)

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB  [ADMIN]             Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  NAVIGATION    │  ADMIN DASHBOARD                                    │
│  ──────────    │  ────────────────────────────────────────────────  │
│                │                                                     │
│  Dashboard     │  CONTENT OVERVIEW                                   │
│                │  ┌────────────────┐  ┌────────────────┐            │
│  Records       │  │  PUBLISHED     │  │  DRAFT / REVIEW│            │
│  ──────────    │  │                │  │                │            │
│  All Records   │  │    14          │  │    3           │            │
│  + New Record  │  │  records live  │  │  pending       │            │
│                │  │                │  │                │            │
│  Submissions   │  │  [View Records]│  │  [View Records]│            │
│  ──────────    │  └────────────────┘  └────────────────┘            │
│  Opportunities │                                                     │
│  Contributions │  SUBMISSION QUEUE                                   │
│                │  ┌────────────────┐  ┌────────────────┐            │
│  Engagement    │  │  OPPORTUNITIES │  │  CONTRIBUTIONS │            │
│  ──────────    │  │                │  │                │            │
│  Activity Log  │  │    2           │  │    1           │            │
│                │  │  new since     │  │  new since     │            │
│  Settings      │  │  last visit    │  │  last visit    │            │
│  ──────────    │  │                │  │                │            │
│  Content Model │  │  [Review →]    │  │  [Review →]    │            │
│  Reference     │  └────────────────┘  └────────────────┘            │
│                │                                                     │
│                │  ENGAGEMENT ACTIVITY                                │
│                │  ┌────────────────────────────────────────────┐   │
│                │  │  LAST 7 DAYS                               │   │
│                │  │                                            │   │
│                │  │    5  engagement requests received         │   │
│                │  │    3  for Audio Security POC              │   │
│                │  │    2  for other records                   │   │
│                │  │                                            │   │
│                │  │  [View Engagement Log →]                  │   │
│                │  └────────────────────────────────────────────┘   │
│                │                                                     │
│                │  QUICK ACTIONS                                      │
│                │  [+ New Innovation Record]                          │
│                │  [Review Opportunity Submissions]                   │
│                │  [Review Contribution Submissions]                  │
│                │  [View Engagement Activity]                         │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
│ Logged in as: Catalina Torres  ·  Role: Curator  ·  [View Public Hub ↗] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Published record count | Content Overview — first tile |
| Primary | Draft/Review record count | Content Overview — second tile |
| Primary | Opportunity submissions pending | Submission Queue — first tile |
| Primary | Contribution submissions pending | Submission Queue — second tile |
| Secondary | Engagement activity (last 7 days) | Engagement section |
| Secondary | Quick Actions | Below all tiles |
| Tertiary | Navigation sidebar | Left sidebar — always visible |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (logged in) | All tiles loaded with current counts | N/A |
| Loading | Skeleton tiles while counts load | Screen reader: "Loading dashboard…" |
| Unauthenticated (redirect) | Redirect to identity provider login | N/A (redirect happens before render) |
| Non-curator authenticated | 403 page | "You do not have permission to access the administration interface." |
| Session expired | Redirect to identity provider login | N/A |
| Zero pending submissions | "0 new" count in tile | Tile still visible; not hidden |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "View Records" (published) | Link | `/admin/records?state=published` |
| "View Records" (draft/review) | Link | `/admin/records?state=draft,review` |
| "Review →" (opportunities) | Link | `/admin/submissions/opportunities` |
| "Review →" (contributions) | Link | `/admin/submissions/contributions` |
| "View Engagement Log →" | Link | `/admin/engagement` |
| "+ New Innovation Record" | Primary button | `/admin/records/new` |
| "View Public Hub ↗" | External link | `/catalog` in new tab |
| Sidebar navigation items | Links | Navigate to respective admin sections |

#### Admin Navigation Sidebar — Complete Structure

```
TSIO INNOVATION HUB [ADMIN]

  Dashboard

  RECORDS
  ─────────────────
  All Records
  + New Record

  SUBMISSIONS
  ─────────────────
  Opportunities        [2]  ← badge count for pending
  Contributions        [1]  ← badge count for pending

  ENGAGEMENT
  ─────────────────
  Activity Log

  REFERENCE
  ─────────────────
  Content Model

  SETTINGS
  ─────────────────
  Hub Settings
```

Sidebar is persistent across all `/admin/*` routes. Active section is highlighted. Pending submission counts appear as numeric badges on Opportunities and Contributions links.

---

*End of Screen-06-admin-dashboard.md*
### Screen 07: Admin — Record Create / Edit Form

**Route:** `/admin/records/new` (create) and `/admin/records/{id}/edit` (edit)
**Purpose:** Full-featured form for curators to author and maintain all Innovation Record fields with inline governance definitions and pre-publication checklist
**User Stories:** US-2.2, US-2.3, US-2.4, US-2.5, US-3.3, US-8.2, US-8.3, US-9.3
**Persona:** Catalina Torres (PER-05)

#### Layout — Record Create / Edit

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB [ADMIN]              Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  [Sidebar nav] │  ← All Records                                      │
│                │                                                     │
│                │  Audio Security Proof of Concept                    │
│                │  Publication State: [DRAFT ▼]   [Save Draft]   [⋮ More] │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  PUBLICATION READINESS CHECKLIST             │  │
│                │  │  ─────────────────────────────────────────   │  │
│                │  │  ✅ Title                                    │  │
│                │  │  ✅ Problem Statement                        │  │
│                │  │  ✅ What Was Explored                        │  │
│                │  │  ✅ Outcome Summary                          │  │
│                │  │  ✅ Key Findings (1+)                        │  │
│                │  │  ✅ Maturity Level                           │  │
│                │  │  ✅ Review Status                            │  │
│                │  │  ❌ Executive Perspective Text               │  │
│                │  │  ❌ Executive Recommendation                 │  │
│                │  │  ✅ Reuse Potential                          │  │
│                │  │  ✅ Owner Name + Office                      │  │
│                │  │  ✅ Contributing Office                      │  │
│                │  │  ✅ Source Type                              │  │
│                │  │  ✅ Mission Area Tags (1+)                   │  │
│                │  │  ✅ Artifact Links (1+)                      │  │
│                │  │  ✅ Engagement Options (1+)                  │  │
│                │  │  ❌ Last-Reviewed Date                       │  │
│                │  │                                              │  │
│                │  │  2 fields required before publishing         │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ── BASIC INFORMATION ───────────────────────────  │
│                │                                                     │
│                │  Title *                                            │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ Audio Security Proof of Concept              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  5–200 characters                                   │
│                │                                                     │
│                │  Short Summary *                                    │
│                │  Displayed on catalog cards (max 280 chars)        │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  0 / 280                                            │
│                │                                                     │
│                │  ── MISSION & TECHNICAL CONTEXT ────────────────  │
│                │                                                     │
│                │  Problem Statement *                               │
│                │  The mission problem this effort addressed.        │
│                │  Write for a broad audience; avoid jargon.         │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  50–5000 characters                                 │
│                │                                                     │
│                │  What Was Explored *                               │
│                │  The approach, technology, and scope.              │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  50–5000 characters                                 │
│                │                                                     │
│                │  Outcome Summary *                                 │
│                │  What was found. May be negative or inconclusive.  │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  50–3000 characters                                 │
│                │                                                     │
│                │  Key Findings *  (1–20 items)                      │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ 1. GPU/CPU separation architecture is viable │  │
│                │  │    [× remove]                                │  │
│                │  ├──────────────────────────────────────────────┤  │
│                │  │ 2. Azure Government Cloud GPU availability   │  │
│                │  │    is limited  [× remove]                   │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  [+ Add Finding]                                    │
│                │                                                     │
│                │  ── GOVERNANCE & CLASSIFICATION ────────────────  │
│                │                                                     │
│                │  Maturity Level *                                  │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  [Experiment / POC ▼]                        │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  ℹ  Experiment / POC: A targeted exploration       │
│                │     was conducted to test feasibility; results     │
│                │     may be positive, negative, or inconclusive.    │
│                │     [View all maturity definitions →]              │
│                │                                                     │
│                │  Review Status *                                   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  [Curated ▼]                                 │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  ℹ  Curated: I&R curator has structured and        │
│                │     enriched the record; not yet externally        │
│                │     reviewed.                                      │
│                │     [View all review status definitions →]         │
│                │                                                     │
│                │  Reuse Potential *                                 │
│                │  ○ High   ○ Medium   ● Low                         │
│                │                                                     │
│                │  Source Type *                                     │
│                │  ● I&R-Conducted   ○ Community-Contributed         │
│                │                                                     │
│                │  ── PERSPECTIVES ──────────────────────────────  │
│                │                                                     │
│                │  Default Perspective                               │
│                │  ● Executive   ○ Technical                         │
│                │                                                     │
│                │  Executive Perspective Text *                      │
│                │  Mission relevance framing for senior leaders.     │
│                │  (50–3000 chars)                                   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  ❌ REQUIRED — not yet filled                │  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Executive Recommendation *                        │
│                │  What should a senior leader consider?             │
│                │  (50–1000 chars)                                   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  ❌ REQUIRED — not yet filled                │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Technical Perspective Text (optional)             │
│                │  Technical architecture and detail narrative.      │
│                │  (50–5000 chars)                                   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Security Findings (optional)                      │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Performance Findings (optional)                   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Reuse Guidance (optional)                         │
│                │  What would a court need to adopt or adapt this?  │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ── TAGS & CLASSIFICATION ────────────────────  │
│                │                                                     │
│                │  Mission Area Tags * (1–10)                        │
│                │  [Cybersecurity ×] [Cloud Infrastructure ×]        │
│                │  [+ Add tag]                                       │
│                │                                                     │
│                │  Technology Area Tags (optional)                   │
│                │  [Azure ×] [AI/ML ×] [+ Add tag]                  │
│                │                                                     │
│                │  ── OWNERSHIP & ATTRIBUTION ──────────────────  │
│                │                                                     │
│                │  Owner Name *                                      │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Owner Office *                                    │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Contributing Office *                             │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Contributor Attribution (optional)                │
│                │  Named credit for contributing team/individuals.   │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │                                              │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ── ARTIFACT LINKS ──────────────────────────  │
│                │  At least one artifact link is required for        │
│                │  publication.                                      │
│                │                                                     │
│                │  Artifact 1 *                                      │
│                │  Label: ┌────────────────────────────────────┐     │
│                │         │ Lessons-Learned Document           │     │
│                │         └────────────────────────────────────┘     │
│                │  URL:   ┌────────────────────────────────────┐     │
│                │         │ https://ao.sharepoint.com/…        │     │
│                │         └────────────────────────────────────┘     │
│                │  Type:  [Document ▼]                               │
│                │  [× Remove]                                        │
│                │  [+ Add Artifact Link]                             │
│                │                                                     │
│                │  ── ENGAGEMENT OPTIONS ─────────────────────  │
│                │  Select which engagement options appear on this    │
│                │  record. At least one required.                    │
│                │                                                     │
│                │  ☑ Request a Briefing                              │
│                │  ☑ Request a Demo                                  │
│                │  ☑ Request Adoption Discussion                     │
│                │  ☑ Request Technical Guidance                      │
│                │  ☐ Submit a Related Problem                        │
│                │                                                     │
│                │  ── DATES ──────────────────────────────────  │
│                │                                                     │
│                │  Last-Reviewed Date *                              │
│                │  Date this record was last verified for accuracy.  │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │  ❌ REQUIRED — [select date]                 │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ── RECORD ACTIONS ─────────────────────────  │
│                │                                                     │
│                │  [Save Draft]  [Submit for Review ▶]               │
│                │                                                     │
│                │  (Submit for Review is disabled until all          │
│                │   pub-required fields are complete)                │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
│  Record ID: rec_01HZ…  ·  Created: July 28, 2026  ·  Last saved: auto │
└─────────────────────────────────────────────────────────────────────┘
```

#### State Transition Actions (top of form, context-sensitive)

| Publication State | Actions Available |
|---|---|
| DRAFT | [Save Draft] [Submit for Review ▶] |
| REVIEW | [Save Draft] [Publish ▶] [Return to Draft] |
| PUBLISHED | [Edit (triggers warning modal)] [Supersede] [Archive] |
| SUPERSEDED | [Archive] |
| ARCHIVED | (read-only; no state changes available except re-review in special cases) |

#### Warning Modal — Editing a Published Record

```
┌──────────────────────────────────────────────────────┐
│  Edit Published Record                        [✕]    │
│  ────────────────────────────────────────────────    │
│                                                      │
│  ⚠  This record is currently Published and visible  │
│     to all Hub users.                               │
│                                                      │
│     Editing will move this record to Review state   │
│     and remove it from public view until it is      │
│     re-published.                                   │
│                                                      │
│     Are you sure you want to proceed?               │
│                                                      │
│  [Cancel]              [Yes, Edit Record]            │
└──────────────────────────────────────────────────────┘
```

#### Publication Gate Error State

```
┌──────────────────────────────────────────────────────┐
│  ⛔ Cannot publish — missing required fields:        │
│  ────────────────────────────────────────────────    │
│  • Executive Perspective Text                        │
│  • Executive Recommendation                          │
│  • Last-Reviewed Date                                │
│                                                      │
│  Complete all required fields and try again.         │
└──────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Publication Readiness Checklist | Top of form — always visible while editing |
| Primary | State label + Save/Submit buttons | Top bar — sticky |
| Primary | Required text fields (title, problem, what explored, outcome, key findings) | Top content sections |
| Primary | Governance fields (maturity, review status) with inline definitions | Governance section |
| Primary | Executive Perspective text + recommendation | Perspectives section |
| Secondary | Technical perspective, security, performance, reuse guidance | Perspectives section (below executive) |
| Secondary | Tags, ownership, artifact links, engagement options | Lower sections |
| Tertiary | Dates, record metadata footer | Bottom |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| DRAFT — clean | All fields editable; checklist shows progress | "DRAFT" badge; auto-save indicator |
| DRAFT — missing fields | Required fields with red border + "REQUIRED" label | Checklist item marked ❌ |
| REVIEW | All fields editable; "Publish" button available | "IN REVIEW" badge |
| PUBLISHED — read-only | Fields disabled; Edit button at top | "PUBLISHED" badge; edit button shown |
| Auto-save active | "Saving…" → "Saved" in footer | Screen reader: "Changes saved" |
| Submit for Review — blocked | Governance error banner above CTA | Lists missing required fields |
| Publish — blocked | Same error banner | Lists missing required fields |
| Supersede action | Modal prompts for linked_record_id | Validation: linked record must exist |
| Archive action | Confirm dialog | "This record will be removed from default catalog browse." |

---

*End of Screen-07-admin-record-edit.md*
### Screen 08: Admin — Records List

**Route:** `/admin/records`
**Purpose:** Complete operational view of all Innovation Records across all publication states; sortable, filterable, with inline state indicators
**User Stories:** US-8.2, US-0.4
**Persona:** Catalina Torres (PER-05)

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB [ADMIN]              Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  [Sidebar nav] │  All Records                    [+ New Record]     │
│                │  ─────────────────────────────────────────────     │
│                │                                                     │
│                │  ┌──────────────┬──────────────┬───────────────┐  │
│                │  │ Search/Filter│ [Title ____] │ State: [All ▼]│  │
│                │  │              │ Maturity:[All▼] Review:[All▼]│  │
│                │  └──────────────┴──────────────┴───────────────┘  │
│                │  17 records total                                   │
│                │                                                     │
│                │  ┌─────────────────────────────────────────────┐  │
│                │  │ TITLE             MATURITY    REVIEW   STATE │  │
│                │  │ ─────────────── ──────────── ─────── ─────  │  │
│                │  │                                              │  │
│                │  │ Audio Security   Exp/POC     Curated  DRAFT │  │
│                │  │ POC              ● yellow    ──────   ──────│  │
│                │  │                              Owner:   Last  │  │
│                │  │                              I&R      Upd:  │  │
│                │  │                              Branch   Jul 28│  │
│                │  │                              [Edit]  [View] │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Transcription    Proto/Pilot  Tech Rev  PUB  │  │
│                │  │ Pilot            ● orange    ─────── ─────  │  │
│                │  │                              Owner:   Last  │  │
│                │  │                              I&R      Upd:  │  │
│                │  │                              Branch   Jun 15│  │
│                │  │                              [Edit]  [View] │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Remote Hearing   Idea         Submitted REVIEW│  │
│                │  │ Scheduling       ● gray       ──────── ────  │  │
│                │  │                              [Edit]  [View] │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ [Archived] Low   Archived     Superseded ARC │  │
│                │  │ Bandwidth Video  ● dark gray  /Retired  ─── │  │
│                │  │                              [View]         │  │
│                │  └──────────────────────────────────────────────  │
│                │                                                     │
│                │  ← Prev  [1] [2]  Next →                           │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘
```

#### Table Columns

| Column | Description | Sortable |
|--------|-------------|---------|
| Title | Record title; click to open edit view | ✅ A–Z |
| Maturity | Maturity level badge (color + label) | ✅ |
| Review Status | Review status label | ✅ |
| Publication State | State chip: DRAFT / IN REVIEW / PUBLISHED / SUPERSEDED / ARCHIVED | ✅ |
| Owner | Owner name | — |
| Last Updated | Relative or absolute date | ✅ default sort |
| Actions | [Edit] (state-dependent) / [View] (opens public-facing record in new tab) | — |

#### State Chips Color Coding

| State | Color | Style |
|-------|-------|-------|
| DRAFT | Gray background | `#E5E7EB` text `#374151` |
| IN REVIEW | Blue background | `#DBEAFE` text `#1E40AF` |
| PUBLISHED | Green background | `#DCFCE7` text `#166534` |
| SUPERSEDED | Yellow background | `#FEF3C7` text `#92400E` |
| ARCHIVED | Dark gray background | `#D1D5DB` text `#374151` |

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Record title, publication state | Table — first two visible columns |
| Primary | Maturity badge, review status | Table columns |
| Secondary | Owner, last updated | Table columns (right side) |
| Tertiary | Actions (edit/view) | Rightmost column |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Table with all records, sorted by last updated | Total count shown |
| Filtered | Filter chips above table; count updates | "Showing 5 of 17 records" |
| Empty (no records yet) | Empty state | "No records exist yet. [+ Create the first record]" |
| Loading | Skeleton table rows | Screen reader: "Loading records…" |

---

### Screen 08b: Admin — Record Audit History

**Route:** `/admin/records/{id}/audit`
**Purpose:** Chronological read-only log of all material changes to a record
**User Stories:** US-2.5

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Record Edit                                             │
│                                                                     │
│  Audit History — Audio Security Proof of Concept                    │
│  ─────────────────────────────────────────────────────────         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ TIMESTAMP          CURATOR         CHANGE                    │  │
│  │ ─────────────────  ─────────────── ────────────────────────  │  │
│  │ Jul 29 2026 14:22  Catalina Torres STATE: DRAFT → REVIEW     │  │
│  │ Jul 29 2026 13:55  Catalina Torres review_status:            │  │
│  │                                   "Submitted" → "Curated"   │  │
│  │ Jul 28 2026 16:10  Catalina Torres KEY_FINDINGS: added item  │  │
│  │                                   "Azure Gov GPU limited"   │  │
│  │ Jul 28 2026 15:00  Catalina Torres Record created (DRAFT)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Audit history is read-only.                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Audit log is read-only. Curators cannot edit or delete entries. Entries show timestamp, curator name (from authenticated identity), field changed, old value, new value, and any state transitions.

---

*End of Screen-08-admin-records-list.md*
### Screen 09: Admin — Submission Queue

**Routes:** `/admin/submissions/opportunities` and `/admin/submissions/contributions`
**Purpose:** Review incoming opportunity and contribution submissions; record dispositions; create records from contributions
**User Stories:** US-5.3, US-6.3
**Persona:** Catalina Torres (PER-05)

---

#### Layout — Opportunity Submissions Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB [ADMIN]              Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  [Sidebar nav] │  Opportunity Submissions                           │
│  Submissions   │  ─────────────────────────────────────────────     │
│  > Opportunities│  5 submissions  ·  2 new (unreviewed)             │
│    Contributions│                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ FILTER:  Status: [All ▼]  Office: [All ▼]   │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ DATE        OFFICE         CONTACT   STATUS  │  │
│                │  │ ─────────── ──────────── ──────── ────────   │  │
│                │  │                                              │  │
│                │  │ Jul 29 2026 District Court  D. Reyes  NEW    │  │
│                │  │             Eastern VA               ──────  │  │
│                │  │ Problem: Remote hearing scheduling           │  │
│                │  │ integration for rural courts…               │  │
│                │  │                              [Review →]     │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 28 2026 AO Leadership   M. Hollis  NEW   │  │
│                │  │                                       ─────  │  │
│                │  │ Problem: Interpreter access reliability…    │  │
│                │  │                              [Review →]     │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 25 2026 Circuit Court   S. Park   UNDER  │  │
│                │  │             9th Circuit               REVIEW │  │
│                │  │ Problem: Case management workflow…          │  │
│                │  │                              [Review →]     │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 20 2026 District Court  R. Kim   ACCEPTED│  │
│                │  │             Northern CA               ─────  │  │
│                │  │ Problem: Digital evidence intake…           │  │
│                │  │            Linked to: Transcription Pilot   │  │
│                │  │                              [View →]       │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Opportunity Submission Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Opportunities                                            │
│                                                                     │
│  Opportunity Submission — Jul 29, 2026                              │
│  ─────────────────────────────────────────────────────────────────  │
│  Submitter:  David Reyes  ·  District Court, Eastern VA             │
│  Email:      dreyes@dcva.uscourts.gov  [copy]                       │
│  Mission Area: Court Operations                                     │
│  Urgency:    FY27 technology planning cycle                         │
│                                                                     │
│  ── PROBLEM DESCRIPTION ─────────────────────────────────────────  │
│  Our court is evaluating remote hearing scheduling integration       │
│  to reduce manual scheduling errors…[full text]                     │
│                                                                     │
│  ── KNOWN CONSTRAINTS ───────────────────────────────────────────  │
│  Limited IT staff; existing case management system is legacy.       │
│                                                                     │
│  ── DISPOSITION ─────────────────────────────────────────────────  │
│  Status:                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Under Review ▼]                                           │  │
│  │  Options: Under Review | Accepted for Consideration |       │  │
│  │           Declined | Linked to Record                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  (If "Linked to Record" selected:)                                  │
│  Linked Record ID:                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Internal Notes (not visible to submitter):                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Save Disposition]                                                 │
│                                                                     │
│  ── DISPOSITION HISTORY ─────────────────────────────────────────  │
│  Jul 29 2026 14:30  Catalina Torres  Status set: Under Review      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

#### Layout — Contribution Submissions Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│  Contribution Submissions                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  3 submissions  ·  1 new (unreviewed)                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ DATE        OFFICE        CONTACT    STATUS     MATURITY     │  │
│  │ ─────────── ──────────── ──────── ────────── ───────────     │  │
│  │                                                              │  │
│  │ Jul 28 2026 District Court M. Webb  NEW       Proto/Pilot   │  │
│  │             Central CA                                       │  │
│  │ Work: Low-bandwidth video conferencing for rural hearings   │  │
│  │                                       [Review →]            │  │
│  ├──────────────────────────────────────────────────────────────  │
│  │ Jul 20 2026 9th Circuit   A. Chen   ACCEPTED  Exp/POC       │  │
│  │                            FOR CUR.                          │  │
│  │ Work: Automated case scheduling workflow                    │  │
│  │ → Record created: [Draft — Automated Scheduling]            │  │
│  │                                       [View Record →]       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Contribution Submission Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Contributions                                            │
│                                                                     │
│  Contribution Submission — Jul 28, 2026                             │
│  Contact: Marcus Webb  ·  District Court, Central CA                │
│  Email:  mwebb@dcca.uscourts.gov  [copy]                            │
│                                                                     │
│  ── SUBMISSION CONTENT ──────────────────────────────────────────  │
│  Mission Problem:  [full text of problem addressed]                 │
│                                                                     │
│  Work Description: [full text of what was built/explored]          │
│                                                                     │
│  Outcome Summary:  [full text]                                      │
│                                                                     │
│  Self-assessed Maturity:  Prototype / Pilot                         │
│                                                                     │
│  Artifact URLs:                                                     │
│  • https://ao.sharepoint.com/sites/… [↗ opens new tab]             │
│  • https://github.com/… [↗ opens new tab]                          │
│                                                                     │
│  Additional Context:  [full text if provided]                       │
│                                                                     │
│  ── DISPOSITION ─────────────────────────────────────────────────  │
│  Status:                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Under Review ▼]                                           │  │
│  │  Options: Under Review | Accepted for Curation | Declined   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Internal Notes:                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Save Disposition]                                                 │
│                                                                     │
│  (If "Accepted for Curation" is saved, an additional button         │
│   becomes available:)                                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ✅ Accepted for Curation                                   │  │
│  │                                                              │  │
│  │  [Create Innovation Record from This Submission →]          │  │
│  │                                                              │  │
│  │  This will create a Draft record pre-populated with:        │  │
│  │  • Problem Description → Problem Statement                  │  │
│  │  • Work Description → What Was Explored                     │  │
│  │  • Outcome Summary → Outcome Summary                        │  │
│  │  • Artifact URLs → Artifact Links                           │  │
│  │  • Source Type → COMMUNITY (set automatically)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Submission type (NEW badge), submitter info, problem/work summary | Queue list row |
| Primary | Full submission text | Detail view top sections |
| Primary | Disposition selector + Save action | Detail view — prominent section |
| Secondary | Linked record (if LINKED_TO_RECORD) | Below disposition |
| Secondary | Internal notes field | Detail view |
| Secondary | "Create Record from Submission" CTA | Revealed after Accepted for Curation |
| Tertiary | Disposition history log | Bottom of detail |

#### Disposition Status Values

| Value | Display Label | Color |
|-------|---------------|-------|
| NEW (unreviewed) | NEW | Blue badge |
| UNDER_REVIEW | Under Review | Gray |
| ACCEPTED_FOR_CONSIDERATION (opportunity) | Accepted | Green |
| ACCEPTED_FOR_CURATION (contribution) | Accepted for Curation | Green |
| DECLINED | Declined | Red |
| LINKED_TO_RECORD (opportunity) | Linked to Record | Teal |
| PUBLISHED (contribution, post-publication) | Published | Green |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No submissions | Empty state | "No submissions received yet." |
| All reviewed | Zero "NEW" badges | Queue list reflects all dispositioned |
| Loading | Skeleton rows | Screen reader: "Loading submissions…" |
| Save success | Toast notification | "Disposition saved." |
| "Create Record from Submission" click | Navigates to `/admin/records/new` pre-populated | Pre-populated fields visible in form |

---

*End of Screen-09-submission-queue.md*
### Screen 10: Admin — Engagement Activity Log

**Route:** `/admin/engagement`
**Purpose:** Full log of all engagement requests across all records; filterable by record, type, date; curator updates request status and verifies routing email
**User Stories:** US-7.3
**Persona:** Catalina Torres (PER-05)

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB [ADMIN]              Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  [Sidebar nav] │  Engagement Activity Log                           │
│  Engagement    │  ─────────────────────────────────────────────     │
│  > Activity Log│  18 total requests  ·  3 in the last 7 days        │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ FILTER:  Record: [All ▼]  Type: [All ▼]     │  │
│                │  │          Date: [Last 30 days ▼]             │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ DATE       TYPE           RECORD      STATUS  │  │
│                │  │            REQUESTOR      OFFICE              │  │
│                │  │ ──────────────────────────────────────────── │  │
│                │  │                                              │  │
│                │  │ Jul 29     Technical      Audio Sec.  SUBM.  │  │
│                │  │ 14:22      Guidance       POC         ─────  │  │
│                │  │            Priya Nair     District CT [Update]│  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 29     Request        Audio Sec.  SUBM.  │  │
│                │  │ 09:11      Briefing       POC         ─────  │  │
│                │  │            M. Hollis      AO Leadership[Upd.] │  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 28     Adoption       Transcription INPROG│  │
│                │  │            Discussion     Pilot        ─────  │  │
│                │  │            D. Reyes       DC Eastern  [Update]│  │
│                │  ├──────────────────────────────────────────────  │
│                │  │ Jul 20     Request Demo   Audio Sec.  COMPL.  │  │
│                │  │                           POC         ─────  │  │
│                │  │            R. Santos      9th Circuit [View]  │  │
│                │  └──────────────────────────────────────────────┘  │
│                │                                                     │
│                │  Routing Email:                                     │
│                │  Requests are routed to:                           │
│                │  AOml_TSO_IRB_Team@ao.uscourts.gov                 │
│                │  [Update Routing Email — go to Settings →]         │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘
```

#### Request Status Update Inline

Clicking [Update] on a row opens an inline dropdown:

```
  ┌──────────────────────────────────────────────────┐
  │  Update Status for this Request                  │
  │  ────────────────────────────────────────────    │
  │  Current: SUBMITTED                              │
  │                                                  │
  │  [● SUBMITTED]                                   │
  │  [○ IN PROGRESS]                                 │
  │  [○ COMPLETED]                                   │
  │  [○ NO ACTION]                                   │
  │                                                  │
  │  [Save]  [Cancel]                               │
  └──────────────────────────────────────────────────┘
```

#### Request Status Values

| Status | Meaning |
|--------|---------|
| SUBMITTED | Request received; not yet actioned |
| IN_PROGRESS | I&R team has responded or is working on it |
| COMPLETED | Follow-up completed |
| NO_ACTION | Request received; no action taken |

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Request type, record name, requestor info | Table columns |
| Primary | Status + [Update] action | Rightmost column |
| Secondary | Date submitted, requestor office | Table columns |
| Tertiary | Routing email display + link to Settings | Below table |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Reverse-chronological list | "18 total requests" |
| Filtered | Active filter chips; count updates | "Showing 5 requests" |
| Empty (no requests) | Empty state | "No engagement requests received yet." |
| Status updated | Inline status changes; toast | "Status updated." |

---

### Screen 11: Admin — Hub Settings

**Route:** `/admin/settings`
**Purpose:** Allow curator to update the engagement routing email address without a code deployment
**User Stories:** US-7.3

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB [ADMIN]              Catalina Torres  [Log out] │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  [Sidebar nav] │  Hub Settings                                      │
│  Settings      │  ─────────────────────────────────────────────     │
│                │                                                     │
│                │  ── ENGAGEMENT ROUTING ─────────────────────────  │
│                │                                                     │
│                │  Routing Email Address                             │
│                │  All engagement requests and submission            │
│                │  notifications are sent to this address.          │
│                │  This field can be updated without a code         │
│                │  deployment.                                       │
│                │                                                     │
│                │  ┌──────────────────────────────────────────────┐  │
│                │  │ AOml_TSO_IRB_Team@ao.uscourts.gov            │  │
│                │  └──────────────────────────────────────────────┘  │
│                │  Must be a valid email address. Cannot be blank.   │
│                │                                                     │
│                │  [Save Routing Email]                              │
│                │                                                     │
│                │  ── ABOUT ──────────────────────────────────────  │
│                │  TSIO Innovation Hub — Administration Interface    │
│                │  Administrative Office of the U.S. Courts          │
│                │  TSIO Innovation & Research Branch                  │
│                │                                                     │
├────────────────┴────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘
```

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Current routing email in input | N/A |
| Blank email attempt | Inline error | "Routing email cannot be blank." |
| Invalid format | Inline error | "Please enter a valid email address." |
| Save success | Toast + input shows new value | "Routing email updated. Future notifications will be sent to [email]." |

---

### Screen 12: Admin — Content Model Reference

**Route:** `/admin/content-model`
**Purpose:** In-app reference table of maturity level and review status definitions; read-only
**User Stories:** US-8.3

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Content Model Reference                                            │
│  ─────────────────────────────────────────────────────────────────  │
│  This reference is read-only. Definitions require a code change.   │
│                                                                     │
│  ── MATURITY LEVELS ────────────────────────────────────────────   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ LEVEL  LABEL                COLOR   DEFINITION               │  │
│  │ ─────  ──────────────────── ─────── ────────────────────     │  │
│  │  1     Idea                 ● Gray  A problem or opportunity  │  │
│  │                                     has been identified;     │  │
│  │                                     no technical exploration │  │
│  │  2     Experiment / POC     ●Amber  A targeted exploration   │  │
│  │                                     was conducted to test    │  │
│  │                                     feasibility…            │  │
│  │  3     Prototype / Pilot    ●Orange A working model or       │  │
│  │                                     limited deployment was   │  │
│  │                                     built…                  │  │
│  │  4     Production /         ●Green  Fully deployed and       │  │
│  │        Validated Pattern            operational; or proven   │  │
│  │                                     architectural pattern…  │  │
│  │  —     Archived             ●D.Gray Work is no longer active;│  │
│  │                                     captured for learning;  │  │
│  │                                     not recommended…        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ── REVIEW STATUSES ────────────────────────────────────────────   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ STATUS               MEANING                                 │  │
│  │ ──────────────────   ───────────────────────────────────     │  │
│  │ Submitted            Record is in the system; not yet curated│  │
│  │ Curated              I&R curator has structured and enriched │  │
│  │ Technically Reviewed I&R or AO technical team has assessed… │  │
│  │ Security Reviewed    Cybersecurity or ISSO review completed  │  │
│  │ Policy Reviewed      Legal, privacy, or policy review done   │  │
│  │ Validated for Reuse  All applicable reviews completed;       │  │
│  │                      recommended as reuse-ready pattern      │  │
│  │ Superseded / Retired Record replaced or retired              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

This screen is accessible from the admin sidebar. The maturity and review status dropdowns in the record edit form also display inline definitions (tooltips or expand-in-place) sourced from this same content model.

---

*End of Screen-10-engagement-log-settings.md*
## Interaction Patterns

### Pattern 01: Catalog Card Click → Record

**When to use:** Any time a catalog card or search result is the entry point to a record
**Behavior:**
- Entire card is clickable (not just the "View Record →" text link)
- Card has hover state: subtle shadow elevation; background lightens
- Focus state: visible outline (3px, `#1D4ED8` blue) for keyboard users
- Card click navigates to `/records/{id}`; "View Record →" link is the accessible anchor
- Back navigation preserves scroll position on catalog/search return

**Examples:** Innovation Catalog (Screen 00), Search Results (Screen 01)

---

### Pattern 02: Perspective Toggle (Tab Pair)

**When to use:** Innovation Record page — switching between Executive and Technical views
**Behavior:**
- Implemented as ARIA tab control: `role="tablist"`, each option `role="tab"`, content area `role="tabpanel"`
- Active tab: underlined + bold; `aria-selected="true"`
- Inactive tab: default weight; `aria-selected="false"`
- Tab switch re-renders content area; no page reload
- URL updates with `?view=executive` or `?view=technical` (pushState or replaceState)
- Both tabs always visible; cannot be conditionally hidden
- Keyboard: Arrow keys navigate between tabs; Enter/Space activates

**Examples:** Innovation Record (Screen 02)

---

### Pattern 03: Filter Panel — Live Filtering

**When to use:** Catalog and Search Results pages
**Behavior:**
- Filter checkboxes trigger re-query immediately on change (no submit button)
- For performance, debounce rapid sequential changes by 150ms before executing query
- URL updated with filter state on each change (shareable/bookmarkable URLs)
- "Active filters" summary bar appears above results when any filter is active
- Each active filter chip includes a "×" dismiss button to remove that single filter
- "Clear all filters" button removes all filters at once
- Result count updates as filters change; aria-live region for screen reader announcement

**Examples:** Innovation Catalog (Screen 00), Search Results (Screen 01)

---

### Pattern 04: Inline Form Validation

**When to use:** All public-facing forms (Engagement Modal, Opportunity Submission, Contribution Submission) and admin forms (Record Create/Edit)
**Behavior:**
- Validation occurs on field blur (not on keystroke) for required field presence
- Validation occurs on keystroke for character count limits (live counter shown)
- On form submit, all fields are validated before submission attempt
- Error messages appear inline below the field with `role="alert"` for screen readers
- Error summary appears at top of form on submit failure: "Please correct the highlighted fields" with anchor links to each error field
- Submit button disabled while form is submitting (loading state)
- Error borders: red (`#DC2626`); Success borders: green (`#16A34A`) on previously-errored fields

**Error message pattern:**
```
  ┌─────────────────────────────────────────────────────────┐
  │ Your Name *                                             │
  │ ┌─────────────────────────────────────────────────┐    │
  │ │                                                 │    │
  │ └─────────────────────────────────────────────────┘    │
  │ ⛔  Name is required.                                  │
  └─────────────────────────────────────────────────────────┘
```

**Examples:** Engagement Modal (Screen 03), Opportunity Submission (Screen 04), Contribution Submission (Screen 05), Record Edit (Screen 07)

---

### Pattern 05: Modal — Focus Trap and Dismiss

**When to use:** Engagement Request Modal; any destructive-action confirmation modals
**Behavior:**
- On modal open: focus moves to first interactive element inside modal
- Focus is trapped within modal while open (Tab cycles within modal)
- Close button [✕] appears in top-right corner
- Pressing Escape closes modal
- Clicking overlay background closes modal (for non-destructive modals)
- On modal close: focus returns to the element that triggered it
- Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title
- Background page is `aria-hidden="true"` while modal is open

**Examples:** Engagement Request (Screen 03), Edit Published Record warning (Screen 07), Archive confirmation

---

### Pattern 06: Toast Notifications

**When to use:** Brief success or information messages that don't require user action
**Behavior:**
- Position: bottom-right corner of viewport
- Auto-dismiss: 5 seconds
- Close button (×) for manual dismiss
- Success toast: green left border, checkmark icon
- Error toast: red left border, warning icon
- Screen reader: `role="status"` (for success) or `role="alert"` (for errors)
- Multiple toasts stack vertically

```
  ┌────────────────────────────────────────┐
  │  ✅  Disposition saved.           [×] │
  └────────────────────────────────────────┘
```

**Examples:** Admin screens — save operations, status updates

---

### Pattern 07: Pre-Publication Checklist

**When to use:** Admin Record Create/Edit form (Screen 07)
**Behavior:**
- Always visible in collapsed form at top of record edit page
- Can be expanded/collapsed (defaults to expanded when any field is missing)
- Each pub-required field shows ✅ (complete) or ❌ (missing)
- Count of missing fields shown: "N fields required before publishing"
- "Submit for Review" button is enabled only when all pub-required fields are present
- On attempt to submit with missing fields, checklist scrolls into view and pulses

---

### Pattern 08: Auto-save Draft

**When to use:** Admin Record Create/Edit (DRAFT and REVIEW states)
**Behavior:**
- Auto-save triggers 3 seconds after last keystroke in any field
- Visual indicator in footer: "Saving…" → "Saved [time]"
- Explicit "Save Draft" button always available for manual save
- Auto-save does not change publication state
- If auto-save fails: show persistent warning "Auto-save failed. Use Save Draft to preserve your work."
- Screen reader: announce "Draft saved" via aria-live when auto-save completes

---

### Pattern 09: External Link Behavior

**When to use:** All artifact links, SharePoint links, GitHub links on public record pages
**Behavior:**
- All external links open in a new tab: `target="_blank" rel="noopener noreferrer"`
- Link labels include artifact type: "Architecture Diagram — SharePoint"
- Each link includes visually and programmatically accessible "(opens in new tab)" indication
- `aria-label`: "[Link label] (opens in new tab)"
- External link icon (↗) rendered after link text
- Hub does not embed, iframe, or cache external content

---

### Pattern 10: Publication State Transitions

**When to use:** Admin Record state management
**Behavior:**

Valid transitions:
```
DRAFT → REVIEW          (Submit for Review — requires pub-required fields)
REVIEW → PUBLISHED      (Publish — governance gate re-validates)
REVIEW → DRAFT          (Return to Draft — no validation required)
PUBLISHED → REVIEW      (Edit — requires confirmation modal)
PUBLISHED → SUPERSEDED  (Supersede — requires linked record ID)
PUBLISHED → ARCHIVED    (Archive — requires confirmation)
SUPERSEDED → ARCHIVED   (Archive)
```

Invalid transitions: All others return error "This state transition is not permitted. Current state: [X]. Allowed transitions: [list]."

Each transition generates an audit log entry.

---

*End of Y0-patterns.md*
## Responsive Considerations

The TSIO Innovation Hub is a **web-first, desktop-primary** platform. Mobile-native apps are explicitly out of scope (PRD §11). However, the public-facing interface must be usable on tablet and mobile for stakeholders who may access the Hub from a mobile browser. The admin interface is designed for desktop use.

### Breakpoints

| Breakpoint | Range | Target device |
|---|---|---|
| Desktop | ≥ 1024px | Government-issued desktop/laptop — primary |
| Tablet | 768px – 1023px | Tablet browser |
| Mobile | < 768px | Mobile browser — supported but not primary |

---

### Desktop (≥ 1024px) — Primary Design Target

All wireframes in this document represent the desktop layout.

**Catalog:**
- 3-column card grid
- Filter panel: left sidebar (fixed width ~240px)
- Full filter panel visible without toggle

**Search Results:**
- Filter panel: left sidebar
- Results: full-width list cards with summary snippets

**Innovation Record:**
- Single-column content with full-width sections
- Perspective toggle at top of content area
- Trust & Limitations section full-width with amber background
- Next-Action panel: horizontal row of buttons

**Admin — Record Edit:**
- Two-column layout optional: checklist sticky right sidebar; form content left column
- Or: checklist pinned to top; form scrolls below

---

### Tablet (768px – 1023px)

**Catalog:**
- 2-column card grid
- Filter panel collapses to "Filter" toggle button above results
- Filter panel expands as an overlay drawer when toggle is clicked

```
┌─────────────────────────────────────────────┐
│ TSIO HUB         [Search ___] [🔍]          │
│ [Catalog] [Submit Problem] [Share Work]     │
├─────────────────────────────────────────────┤
│ [▼ Filters (2 active)]  Sort: [Recent ▼]   │
│ Showing 8 records                           │
│                                             │
│ ┌──────────────┐ ┌──────────────┐          │
│ │  CARD        │ │  CARD        │          │
│ │              │ │              │          │
│ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐ ┌──────────────┐          │
│ │  CARD        │ │  CARD        │          │
│ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────┘
```

**Search Results:**
- Filter panel collapses to drawer on tablet
- Results list full-width

**Innovation Record:**
- All sections stack single-column (same as desktop, just narrower)
- Perspective toggle remains at top; both tabs visible
- Next-Action buttons stack vertically or wrap to 2-across

**Admin Interface:**
- Sidebar collapses to hamburger/drawer on tablet
- Admin is designed for desktop; tablet is supported but may require scrolling

---

### Mobile (< 768px)

**Navigation:**
```
┌──────────────────────────────────────┐
│ TSIO INNOVATION HUB        [☰ Menu] │
└──────────────────────────────────────┘
```
- Global search accessible from hamburger menu or persistent search icon
- Top navigation collapses to hamburger menu drawer
- "Submit a Mission Problem" and "Share Your Innovation Work" accessible from menu

**Catalog:**
- 1-column card grid
- Filters accessible via full-screen drawer triggered by "Filter" button
- Each card shows: title, maturity badge, short summary, engagement indicators
- Tags truncated with "+N more" on cards (expandable on click)

```
┌──────────────────────────────────┐
│ TSIO INNOVATION HUB    [☰] [🔍] │
├──────────────────────────────────┤
│ Innovation Catalog               │
│ [▼ Filter]  Sort: [Recent ▼]    │
│ 14 records                       │
│ ┌──────────────────────────────┐ │
│ │  [Experiment/POC ●] [Curated]│ │
│ │                              │ │
│ │  Audio Security POC          │ │
│ │                              │ │
│ │  Explores GPU/CPU separation │ │
│ │  for courtroom recordings…   │ │
│ │                              │ │
│ │  🏷 Cybersecurity +2         │ │
│ │  📋 Demo Available           │ │
│ │                  [View →]    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Innovation Record:**
- Perspective toggle spans full width; both tabs visible
- All sections single-column, full-width
- Trust & Limitations section full-width amber box
- Next-Action buttons stack vertically (full-width buttons)
- Artifact links listed with visible external link labels

**Opportunity / Contribution Forms:**
- Single-column layout
- All fields full-width
- Character counter always visible below textarea
- Submit button full-width at bottom

**Admin Interface:**
- Admin interface is designed for desktop use; mobile access is not a primary use case
- If accessed on mobile: single-column layout, sidebar hidden (hamburger menu)
- Not optimized for mobile data entry; curators should use desktop for record authoring

---

### Minimum Touch Target Sizes (WCAG 2.1 AA)

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44 × 44px |
| Links | 44px height (inline links: sufficient line-height) |
| Checkboxes / radio buttons | 44 × 44px touch area (visual indicator may be smaller) |
| Perspective toggle tabs | 44px height minimum |
| Filter chips dismiss (×) | 44 × 44px touch area |

---

*End of Y1-responsive.md*
## Accessibility Notes

**Standard:** WCAG 2.1 AA — Required for Federal government deployment (PRD §8 Non-Functional Requirements)

---

### Color Contrast

| Element | Foreground | Background | Minimum Ratio | Verification |
|---------|-----------|------------|---------------|-------------|
| Body text | `#111827` | `#FFFFFF` | 4.5:1 | Must verify |
| Maturity badge text (Idea — Gray) | `#FFFFFF` | `#6B7280` | 4.5:1 | Verify — gray may need darkening |
| Maturity badge text (Experiment — Amber) | `#FFFFFF` | `#D97706` | 4.5:1 | Verify; white on amber may need adjustment |
| Maturity badge text (Prototype — Orange) | `#FFFFFF` | `#EA580C` | 4.5:1 | Verify |
| Maturity badge text (Production — Green) | `#FFFFFF` | `#16A34A` | 4.5:1 | Verify |
| Maturity badge text (Archived — Dark Gray) | `#FFFFFF` | `#374151` | 4.5:1 | Should pass |
| Trust & Limitations section text | `#92400E` | `#FEF3C7` | 4.5:1 | Must verify amber-on-amber |
| State chips (DRAFT) | `#374151` | `#E5E7EB` | 4.5:1 | Should pass |
| State chips (IN REVIEW) | `#1E40AF` | `#DBEAFE` | 4.5:1 | Verify |
| State chips (PUBLISHED) | `#166534` | `#DCFCE7` | 4.5:1 | Verify |
| Error messages | `#DC2626` | `#FFFFFF` | 4.5:1 | Verify |
| Links (default) | `#1D4ED8` | `#FFFFFF` | 4.5:1 | Should pass |
| Disabled button text | `#6B7280` | `#F3F4F6` | 4.5:1 | Verify — disabled states may need care |

**Rule:** Color is NEVER the sole differentiator. All maturity badges display a text label in addition to color. All status chips display a text label. Error states use icons AND text in addition to border color.

---

### Keyboard Navigation

All interactive elements must be reachable and operable with keyboard only.

| Element | Keyboard Behavior |
|---------|-------------------|
| Global navigation links | Tab to reach; Enter to activate |
| Search bar | Tab to reach; Enter to submit |
| Catalog cards | Tab to "View Record →" link; Enter to navigate |
| Filter checkboxes | Tab to reach; Space to toggle |
| Perspective toggle tabs | Tab to tab control; Arrow keys to switch tabs; Enter/Space to activate |
| Engagement buttons (Next-Action panel) | Tab to each button; Enter/Space to open modal |
| Modal (Engagement Request) | Focus trapped within modal; Tab cycles through modal fields; Escape to close |
| Admin record form fields | Tab through fields in logical order; matching visual order |
| Dropdown selects | Tab to reach; Arrow keys to navigate options; Enter to select |
| Checklist items (admin) | Not interactive (display only); no tab stop needed |
| "Submit for Review" / "Publish" buttons | Tab to reach; Enter to activate; blocked with explanation if not available |
| Artifact link [×] remove (admin) | Tab to reach; Enter to remove; confirmation if needed |
| Sort dropdown | Tab to reach; standard select keyboard behavior |

**Tab order:** Tab order must match visual reading order (top-to-bottom, left-to-right for LTR layout). No positive tabindex values that break natural order.

---

### Screen Reader Considerations

#### Page Structure

- Every page has a single `<h1>` that identifies the page (e.g., "Innovation Catalog", "Audio Security Proof of Concept", "Submit a Mission Problem")
- Heading hierarchy is logical: `<h1>` → `<h2>` for section headings → `<h3>` for sub-sections
- Navigation landmark regions: `<header>` (site header), `<nav>` (main navigation), `<main>` (main content), `<aside>` (filter panel), `<footer>` (site footer)
- Skip link: "Skip to main content" is the first focusable element on every page (visually hidden until focused)

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

#### Innovation Catalog

- Catalog card grid uses a `<ul>` with each card as `<li>`
- Each card's "View Record →" link has a unique accessible name: `aria-label="View record: Audio Security Proof of Concept"`
- Maturity badges: `<span class="badge">Experiment / POC</span>` — text label always present; color is supplementary
- Review status badges: same pattern
- Filter panel: `<form role="search">` or `<form aria-label="Filter records">` with `<fieldset>` + `<legend>` per filter group
- Result count: live region — `<div aria-live="polite" aria-atomic="true">Showing 8 of 14 records</div>`

#### Search Results

- Search bar: `<input type="search" aria-label="Search innovation records">` (not `aria-label="Search"` — too generic)
- Query echo heading: `<h2>Search results for: "[query]"</h2>`
- Result count: aria-live region
- Query term highlights: `<mark>audio</mark>` for highlighted terms (accessible by default)
- Empty state CTA: descriptive link text ("Submit a mission problem for I&R consideration") — not "click here"

#### Innovation Record — Perspective Toggle

- Toggle implemented as ARIA tab control:
```html
<div role="tablist" aria-label="Record perspective">
  <button role="tab" aria-selected="true" aria-controls="executive-panel">Executive View</button>
  <button role="tab" aria-selected="false" aria-controls="technical-panel">Technical View</button>
</div>
<div id="executive-panel" role="tabpanel" tabindex="0">...</div>
<div id="technical-panel" role="tabpanel" tabindex="-1" hidden>...</div>
```

#### Trust & Limitations Section

- Section has `<h2>Trust &amp; Limitations</h2>` heading
- Rendered as `<section aria-label="Trust and Limitations">` so it is navigable as a landmark region
- Each disclaimer is a separate `<p>` within the section

#### Engagement Modal

- `role="dialog"` with `aria-modal="true"` and `aria-labelledby="modal-title"`
- When modal opens, focus moves to first field (requestor name)
- Background content: `aria-hidden="true"` while modal is open
- Confirmation state: `role="alert"` on confirmation message so it is announced immediately

#### Forms — Opportunity and Contribution Submission

- Each field: `<label for="field-id">` linked to `<input id="field-id">`
- Required fields: `aria-required="true"` AND visible asterisk `*` with legend "Required fields are marked with *"
- Character counters: `aria-describedby` links textarea to counter element
- Error messages: `aria-describedby` links field to its error element; error elements use `role="alert"` when revealed
- Error summary at top of form: `role="alert"` with links to each errored field

#### Admin — Record Edit Form

- Form sections use `<fieldset>` + `<legend>` to group related fields
- Inline governance definitions (maturity/review status): tooltip/expand pattern with `aria-expanded` and `aria-describedby`
- Pre-publication checklist: `<ul aria-label="Publication readiness checklist">` with each item showing ✅ or ❌ plus text
- Auto-save notification: `aria-live="polite"` region for "Saved" announcements
- Error notifications (publication gate): `role="alert"` for immediate announcement

---

### Images and Icons

- All icons used for engagement indicators (📋 Demo, 💬 Adoption, 🔧 Technical Guidance) must have text labels alongside them — icons alone are not accessible
- No meaningful information conveyed by images without alt text
- Decorative images: `alt=""` to suppress screen reader announcement
- External link icon (↗): `aria-hidden="true"` on the icon; accessible name of link includes "(opens in new tab)"

---

### Motion and Animation

- No autoplay animations or videos
- Transitions for filter updates and modal open/close: duration < 200ms; can be suppressed with `prefers-reduced-motion` media query
- Skeleton loading states use CSS animation; suppressed under `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton, .fade-transition { animation: none; transition: none; }
}
```

---

### ARIA Landmarks Summary

| Region | Landmark Role | Present On |
|--------|---------------|-----------|
| Site header (logo + nav) | `<header>` | All pages |
| Main navigation | `<nav aria-label="Main">` | All pages |
| Admin navigation | `<nav aria-label="Admin">` | All admin pages |
| Filter panel | `<aside aria-label="Filter records">` | Catalog, Search |
| Main content | `<main id="main-content">` | All pages |
| Site footer | `<footer>` | All pages |
| Engagement modal | `role="dialog"` | Innovation Record |
| Form sections | `<section>` with heading | Forms |

---

### Testing Checklist (Prior to Launch)

- [ ] All pages tested with keyboard-only navigation (no mouse)
- [ ] All pages tested with NVDA + Chrome and VoiceOver + Safari
- [ ] Color contrast verified with automated tool (Lighthouse, axe) and manual review of badge colors
- [ ] All form fields have visible, programmatically associated labels
- [ ] All error messages are reachable by screen reader (role="alert" or aria-live)
- [ ] Modal focus trap verified
- [ ] Skip link verified functional
- [ ] Perspective toggle tab control keyboard behavior verified
- [ ] Artifact links verified: all open in new tab with accessible label
- [ ] Trust & Limitations section verified as navigable landmark
- [ ] Publication checklist (admin) verified as screen-reader-readable
- [ ] Maturity badges verified: text label always present (no color-only badges)
- [ ] prefers-reduced-motion query verified active

---

*End of Y2-accessibility.md*
