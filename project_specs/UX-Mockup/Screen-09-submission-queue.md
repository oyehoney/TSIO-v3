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
