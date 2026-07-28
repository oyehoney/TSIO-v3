# TSIO Innovation Hub

## What This Is

The TSIO Innovation Hub is a web-based platform that serves as a single, governed entry point for Judiciary stakeholders to discover, understand, and engage with innovation work produced by the TSIO Innovation & Research (I&R) team. It converts scattered innovation outputs — distributed across SharePoint, project folders, code repositories, videos, and individual team knowledge — into discoverable, understandable, and actionable institutional knowledge. Users arrive with a mission problem or area of interest, discover relevant innovation work, understand its status and applicability, and take an informed next step (demo request, adoption discussion, technical guidance).

## Core Value

A stakeholder with a mission problem can find relevant I&R innovation work, understand what was tested and learned, and take a clear next action — without needing to know the original project name, team, or document location.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **F0** — Innovation Catalog: browsable catalog of curated innovation records with visible maturity, review status, and engagement indicators
- [ ] **F1** — Search and Discovery: full-text search covering problem statements, summaries, findings, tags, mission/technology areas; filterable by maturity, review status, contributing office, reuse potential
- [ ] **F2** — Innovation Record: structured record per innovation effort with problem context, what was explored, outcome/evidence, key findings, maturity/readiness, reuse guidance, ownership/attribution, artifact links, and next-action options
- [ ] **F3** — Executive and Technical Perspectives: single record supporting two derived views (executive: mission relevance, maturity, decision recommendation; technical: architecture, tools, security, reuse guidance)
- [ ] **F4** — Existing Lessons-Learned Integration: treat existing documents as authoritative sources, surface structured records around them with metadata and problem-oriented search without replacing or relocating the originals
- [ ] **F5** — Opportunity Submission: structured form for stakeholders to submit a mission problem or opportunity for I&R consideration; problem-first framing; submission does not imply portfolio acceptance
- [ ] **F6** — Share Existing Innovation Work: contribution flow for teams with existing innovation work to share; enters curation workflow before publication
- [ ] **F7** — Engagement Routing: trackable engagement per request (request type, record reference, user info, office, description, desired next step); initial implementation via configurable email routing
- [ ] **F8** — Curation and Administration: authorized I&R users can create/edit records, manage metadata, assign maturity/review status, manage contributors/owners, control publication lifecycle (draft → review → published → superseded/archived)
- [ ] **F9** — Content, Maturity & Trust Model: defined maturity levels (Idea → Experiment/POC → Prototype/Pilot → Production/Validated Pattern → Archived) and review statuses (Submitted → Curated → Technically Reviewed → Security Reviewed → Policy Reviewed → Validated for Reuse → Superseded/Retired) surfaced visibly on every record

### Out of Scope

- SharePoint/Git repository replacement — Hub curates and links to authoritative sources, not replaces them
- Historical document migration at scale — MVP starts with 3-5 curated POC records
- POC execution management — Hub is discovery/engagement, not a project management tool
- Enterprise portfolio management — deferred post-MVP
- Automated maturity/approval determination — human curation required
- Architecture, security, legal, or policy review replacement — Hub surfaces review status, does not perform those reviews
- POC production deployment — Hub communicates readiness, does not deploy
- Broad social networking / discussion forums — out of MVP scope
- Mobile-native app — web-first MVP
- Real-time notifications — deferred post-MVP

## Context

- **Domain:** Federal Judiciary (Administrative Office of the U.S. Courts), specifically TSIO Innovation & Research branch
- **Problem:** Innovation outputs are distributed across SharePoint, project folders, code repositories, videos, and institutional memory — making discovery nearly impossible without already knowing the project name or team
- **Key insight:** This is an engagement and transition mechanism, not a document library. The goal is converting scattered innovation into institutional knowledge
- **Initial content set:** MVP begins with ~3-5 curated I&R POC records (Audio Security POC is confirmed strong candidate); at least one archived/stopped experiment to demonstrate honest lifecycle
- **Existing artifact:** Audio Security lessons-learned document is a target for the first structured record, providing defense-in-depth findings, GPU/CPU separation, Azure Government Cloud constraints, performance/testing limitations, and production-readiness gaps
- **Stakeholder environment:** TSIO delivery team builds; Pivota must preserve the intent and governance expressed in the PRD through implementation — not merely produce a functional portal

## Constraints

- **Governance:** Publication requires a clear problem statement, named owner/steward, maturity level, review status, attribution, at least one source artifact, last-reviewed date, and appropriate disclaimer
- **Trust integrity:** Interface must clearly communicate that POC ≠ production-ready, Published ≠ approved for adoption, Community-submitted ≠ centrally endorsed, Validated for reuse ≠ local review waived
- **Initial hosting environment:** TBD — decision required during Pivota discovery (see Section 11 of PRD)
- **Identity and access:** TBD — decision required during discovery
- **Email routing:** Initial engagement routing uses configurable email address (`AOml_TSO_IRB_Team@ao.uscourts.gov`); address must be configurable
- **Maintainability over novelty:** MVP favors a clear, supportable internal product over visually elaborate portals
- **Audit history:** System must maintain audit history of material changes to records

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hub as engagement/transition mechanism, not document library | Curate and link to authoritative sources rather than copy them; preserves single source of truth | — Pending |
| Start with ~3-5 curated POC records for MVP | Proves the model before scaling; Audio Security POC is first candidate | — Pending |
| One record, two perspectives (executive + technical) | Avoids duplicate records that drift out of sync; both views grounded in same evidence | — Pending |
| Email-based engagement routing for MVP | Reduces infrastructure complexity for initial release; address must be configurable for future routing | — Pending |
| Separate maturity from review status | A POC can be technically sophisticated but lack security/policy review; conflating them would mislead stakeholders | — Pending |

---
*Last updated: 2026-07-28 after initialization*
