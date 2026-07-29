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
