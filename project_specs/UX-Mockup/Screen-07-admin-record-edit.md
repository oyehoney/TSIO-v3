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
