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
