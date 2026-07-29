# Requirements: TSIO Innovation Hub

**Defined:** 2026-07-29
**Core Value:** A stakeholder with a mission problem can find relevant I&R innovation work, understand what was tested and learned, and take a clear next action — without needing to know the original project name, team, or document location.

## v1 Requirements

Requirements for initial release (R1 + R2 per Story Map). Each maps to roadmap phases.

### Discovery & Catalog

- [ ] **F0**: Curator can publish innovation records to a browsable catalog; users can view catalog cards showing title, one-sentence outcome, maturity level, review status, contributing office, and engagement indicator without opening the full record
- [ ] **F1**: Users can search using problem-oriented language (not just project names) across record titles, problem statements, summaries, findings, tags, and mission areas; users can filter by maturity, review status, contributing office, and reuse potential

### Innovation Record

- [ ] **F2**: Users can open an innovation record and see all structured sections — problem and context, what was explored, outcome and evidence, key findings, maturity and readiness, reuse guidance, ownership and attribution, artifact links, and next-action options
- [ ] **F3**: Users can switch between an Executive Perspective (mission problem, strategic relevance, outcome, decision recommendation) and a Technical Perspective (architecture, tools, security, reuse guidance) on the same record — both derived from the same underlying evidence
- [ ] **F4**: I&R Curator can create a structured innovation record around an existing lessons-learned document, treating the original as the authoritative source, linking back to it, and making it findable through problem-oriented search — without relocating the original

### Engagement

- [ ] **F5**: Any user can submit a structured opportunity request describing their mission problem, affected users, current workflow, and desired outcome — submission does not imply portfolio acceptance; confirmation explains I&R review process
- [ ] **F7**: Every engagement action (demo request, adoption discussion, technical guidance request) is logged with request type, record reference, user name, office, and contact information; initial routing via configurable email address

### Curation & Administration

- [ ] **F8**: Authorized I&R Curators can create and edit records, manage metadata, assign maturity and review status, record contributors and owners, set review dates, save drafts, submit for review, publish, unpublish, mark as superseded, and archive records through an admin interface; publication requires problem statement, named owner, maturity level, review status, attribution, at least one source artifact, last-reviewed date, and appropriate disclaimer
- [ ] **F9**: The system enforces the full maturity model (Idea, Evaluated Idea, Experiment/POC, Prototype/Pilot, Production/Validated Pattern, Archived/Retired) and review status model (Submitted, Curated for Completeness, Technically Reviewed, Security Reviewed, Policy Reviewed, Validated for Reuse, Superseded, Retired) as separate, independently-assignable attributes; trust disclaimers are displayed visibly on every record based on maturity and review status combinations

### Platform & Identity

- [ ] **PLAT-01**: User authentication via organizational identity provider (OIDC/Azure AD); role model supports at minimum PUBLIC (anonymous browse/search/submit), CURATOR (full record management), and ADMIN (settings, user management)
- [ ] **PLAT-02**: System maintains an audit history of all material changes to records (field-level change log with user, timestamp, and before/after values)
- [ ] **PLAT-03**: Engagement routing email address is configurable by an admin without code deployment
- [ ] **PLAT-04**: MVP content set includes at least 3 curated POC records seeded at launch, including the Audio Security POC as the anchor record

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Community Contribution

- **F6**: Teams with existing innovation work can submit it through a governed contribution flow with attribution preserved; submission enters a curation workflow before publication (Story Map R3 — P2 priority, all personas primarily served by R1/R2 discovery; contribution pathway is lower leverage for MVP)

### Advanced Features

- **ADV-01**: Real-time in-app notifications for engagement request updates and record review status changes — deferred; email routing covers MVP engagement adequately
- **ADV-02**: Portfolio management / POC execution tracking — explicitly excluded from MVP per PRD Section 10
- **ADV-03**: Automatic maturity or approval determination — human curation required; automation deferred
- **ADV-04**: Mobile-native application — web-first MVP, WCAG 2.1 AA responsive design covers mobile browsers

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| SharePoint / Git repository replacement | Hub curates and links to authoritative sources — replacing them is out of scope per PRD Section 10 |
| Mass historical document migration | MVP starts with 3–5 curated records to prove the model before scaling |
| POC execution management | Hub is discovery and engagement, not a project management tool |
| Enterprise portfolio management | Out of scope per PRD Section 10 |
| Architecture, security, legal, or policy review | Hub surfaces review status but does not perform those reviews |
| Production deployment of POCs | Hub communicates readiness; it does not deploy |
| Broad social networking / discussion forums | Out of scope per PRD Section 10; engagement routing via I&R team is sufficient |
| Sensitive material outside approved access boundaries | All published content must be approved for public access within the Judiciary |
| Autonomous investment decisions | Human curation and governance required throughout |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| F0 | — | Pending |
| F1 | — | Pending |
| F2 | — | Pending |
| F3 | — | Pending |
| F4 | — | Pending |
| F5 | — | Pending |
| F7 | — | Pending |
| F8 | — | Pending |
| F9 | — | Pending |
| PLAT-01 | — | Pending |
| PLAT-02 | — | Pending |
| PLAT-03 | — | Pending |
| PLAT-04 | — | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: 13 ⚠️

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after initialization*
