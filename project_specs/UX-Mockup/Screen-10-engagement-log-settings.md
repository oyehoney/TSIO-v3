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
