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

### Compliance & Security

- [ ] **COMP-01**: The system architecture supports FISMA Moderate or Low categorization — architecture decisions (hosting environment, data flows, encryption in transit/at rest) must not preclude an Authority to Operate (ATO) assessment; hosting must use a FedRAMP-authorized cloud environment (Azure Government, AWS GovCloud, or equivalent Judiciary-approved infrastructure)
- [ ] **COMP-02**: All cryptographic operations (TLS, session tokens, password hashing if applicable) use FIPS 140-2/3 validated modules — no use of non-FIPS cipher suites or custom cryptographic implementations; this is an architectural constraint applied from the first code commit
- [ ] **COMP-03**: Section 508 / WCAG 2.1 AA accessibility compliance is enforced as a build-time constraint across all user-facing pages — not a post-hoc audit; every new UI component includes automated accessibility checks (axe-core or equivalent) and keyboard navigation verification
- [ ] **COMP-04**: All data in transit is encrypted (HTTPS/TLS 1.2+ enforced, no HTTP fallback); all data at rest in PostgreSQL is encrypted at the storage layer (database server encryption, not application-level); no PII or sensitive Judiciary information is logged in plaintext application logs
- [ ] **COMP-05**: The system's security posture is documented sufficient to support an ATO package: data classification of all stored fields, system boundary diagram, authentication/authorization controls description, audit log coverage, and open risk items — this documentation is a deliverable of Phase 6

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
| PLAT-01 | Phase 1 — Foundation & Platform | Pending |
| PLAT-02 | Phase 1 — Foundation & Platform | Pending |
| PLAT-03 | Phase 1 — Foundation & Platform | Pending |
| F8 | Phase 2 — Content Model & Admin Interface | Pending |
| F9 | Phase 2 — Content Model & Admin Interface | Pending |
| F2 | Phase 3 — Innovation Record & Perspectives | Pending |
| F3 | Phase 3 — Innovation Record & Perspectives | Pending |
| F4 | Phase 3 — Innovation Record & Perspectives | Pending |
| F0 | Phase 4 — Catalog & Search | Pending |
| F1 | Phase 4 — Catalog & Search | Pending |
| F5 | Phase 5 — Engagement & Opportunity Submission | Pending |
| F7 | Phase 5 — Engagement & Opportunity Submission | Pending |
| PLAT-04 | Phase 6 — Content Seeding & Launch Polish | Pending |
| COMP-01 | Phase 1 — Foundation & Platform | Pending |
| COMP-02 | Phase 1 — Foundation & Platform | Pending |
| COMP-03 | Phase 1 — Foundation & Platform (constraint applied from start) | Pending |
| COMP-04 | Phase 1 — Foundation & Platform | Pending |
| COMP-05 | Phase 6 — Content Seeding & Launch Polish | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after initialization*
