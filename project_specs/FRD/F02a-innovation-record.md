---

## F02: Innovation Record (Part A — Description, Sub-Features, Process)

**PRD Reference:** F2 — Priority P0 (Critical MVP)  
**Personas Served:** P1 (Decision-Maker), P2 (Operational Leader), P3 (Technical Adopter), P5 (I&R Curator)  
**Continued in:** `F02b-innovation-record.md` (Inputs, Outputs, Validation, Errors, API/Schema)

---

### Description

The Innovation Record is the structured, authoritative representation of a single innovation effort. It is the primary unit of content on the Hub — every catalog entry, search result, and engagement action traces back to a record. A record answers four questions for every stakeholder: What problem was faced? What was explored? What was learned? What should I do next? Records are created and governed exclusively by I&R Curators. They are never self-published by contributors. Every field defined in this spec is part of the canonical record; no field is optional at the point of publication.

The Innovation Record is also the data entity from which Executive and Technical Perspectives (F03) are derived. Both perspectives share the same underlying record data — no duplicate records are created.

---

### Terminology

- **Problem Statement:** A structured description of the mission problem or opportunity that the innovation effort addressed. Written for a broad stakeholder audience, not as an internal project description.
- **What Was Explored:** A description of the approach, technology, and scope of the exploration. For technical audiences; surfaced in the Technical Perspective (F03).
- **Outcome Summary:** A concise narrative of what was found — whether the experiment succeeded, failed, or surfaced partial findings. May be negative.
- **Key Findings:** A structured list (array) of primary learnings from the effort, including limitations, gaps, and caveats. Required; must include at least one finding.
- **Reuse Guidance:** Curator-authored guidance on what a stakeholder would need to consider to adopt or adapt this work in their environment.
- **Source Type:** Whether the record represents I&R-conducted work (`I_AND_R`) or community-contributed work (`COMMUNITY`).
- **Named Owner/Steward:** The I&R team member or office accountable for maintaining the accuracy of this record. Required for publication.
- **Contributing Office:** The organizational unit that produced the innovation work (may differ from Named Owner if community-contributed).
- **Artifact Link:** An external URL to a source document, code repository, video, or diagram. The Hub stores the link but does not copy or host the content. A record requires at least one Artifact Link before it can be published.
- **Next-Action Options:** The set of engagement actions a stakeholder can take from this record (see F07). Each record may have one or more engagement options configured by the curator.
- **Trust Disclaimers:** Required statements that must be rendered on every published record per the Content, Maturity & Trust Model (F09).
- **Last-Reviewed Date:** The date a curator last reviewed the record for accuracy and currency. Required; must be within a curator-configurable staleness window.
- **Audit Entry:** A single logged event recording who changed what field on a record, when.

---

### Sub-Features

- **Record Creation:** Curator creates a new record in Draft state with all structured fields
- **Record Editing:** Curator edits any field of a Draft or Review-state record; Published records require the curator to create a new version or supersede
- **Record Viewing (Public):** PUBLIC users view a Published record's full content including both perspectives
- **Perspective Toggle:** User selects Executive or Technical view of the same record (see F03)
- **Artifact Link Management:** Curator adds, edits, or removes artifact links; at least one required for publication
- **Next-Action Configuration:** Curator configures which engagement options appear on the record (see F07)
- **Trust Disclaimer Rendering:** System automatically renders the applicable trust disclaimers based on maturity level and source type; curator cannot suppress them
- **Audit History View:** Curator views a chronological log of material changes to the record
- **Record Superseding:** Curator marks a record as Superseded and optionally links to the superseding record
- **Record Archiving:** Curator marks a record as Archived

---

### Process

#### Viewing a Record (PUBLIC user)

1. User clicks a catalog card or search result link to `/records/{record_id}`.
2. System retrieves the record by `record_id`.
3. If `publication_state ≠ PUBLISHED` and role is PUBLIC: system returns 404.
4. System renders the Innovation Record page with the Executive Perspective active by default (configurable per record by curator).
5. System renders the perspective toggle (see F03).
6. System renders all required trust disclaimers based on the record's maturity level and source type (see F09).
7. System renders the Next-Action panel with configured engagement options (see F07).
8. System renders artifact links in a dedicated section. Links open in a new tab. No artifact content is embedded.
9. System renders the last-reviewed date and named owner/steward.

#### Creating a Record (CURATOR)

1. Curator navigates to the admin interface and selects "New Innovation Record."
2. System creates a new record in `DRAFT` state with a system-generated `record_id` and `created_at` timestamp.
3. Curator enters all structured fields (see F02b §Inputs for full field list).
4. Curator saves draft at any time; record remains in `DRAFT` state.
5. Curator adds at least one Artifact Link.
6. Curator assigns maturity level, review status, mission area tags, technology area tags, reuse potential.
7. Curator configures engagement options (Next-Action buttons) for the record.
8. Curator sets named owner/steward and contributing office.
9. Curator clicks "Submit for Review" → system validates publication readiness (see F02b §Validation). If any required field is missing, system lists blocking fields and prevents state transition.
10. On successful validation, record transitions to `REVIEW` state. System logs an audit entry.
11. Curator (or designated reviewer) reviews the record in `REVIEW` state.
12. Curator clicks "Publish" → system re-validates, then transitions record to `PUBLISHED` state. System sets `published_at` timestamp. System logs an audit entry.
13. Published record appears in catalog (F00) and search (F01) immediately.

#### Editing a Published Record (CURATOR)

1. Curator opens a Published record in the admin interface.
2. System warns: "This record is Published. Edits will move it to Review state and remove it from public view until re-published."
3. Curator confirms edit intent.
4. System transitions record to `REVIEW` state. System logs an audit entry (state change + actor).
5. Curator makes edits and re-publishes using the same process as steps 9–13 above.
6. Alternatively, if the change is a supersession: curator clicks "Supersede" → system marks the record as `SUPERSEDED`, prompts for the `superseded_by_record_id`, and transitions the new record to Published.

#### Archiving a Record (CURATOR)

1. Curator selects "Archive" on any record.
2. System transitions record to `ARCHIVED` state. System logs an audit entry.
3. Archived records are not shown in the default catalog browse but remain accessible via direct URL with an "Archived" label.

---

*End of F02a-innovation-record.md — continued in F02b-innovation-record.md*
