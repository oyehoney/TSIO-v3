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
