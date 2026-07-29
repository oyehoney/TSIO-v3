# User Story Map
## TSIO Innovation Hub

| Field | Value |
|-------|-------|
| **Product Name** | TSIO Innovation Hub |
| **Date** | 2026-07-29 |
| **Related Personas** | PERSONAS-TSIO-Innovation-Hub.md |
| **Related Journeys** | JOURNEYS-TSIO-Innovation-Hub.md |
| **Related JTBD** | JTBD-TSIO-Innovation-Hub.md |
| **Related User Stories** | UserStories-TSIO-Innovation-Hub.md |
| **Related PRD** | PRD-TSIO-Innovation-Hub.md |

---

## Overview

This story map organizes all 32 user stories (US-0.1 through US-9.3) along two axes:

- **Horizontal axis (columns):** Journey stages drawn from JOURNEYS-TSIO-Innovation-Hub.md — the real sequence of steps each persona takes to accomplish their job
- **Vertical axis (rows):** Stories and activities within each stage, grouped by Epic and release priority

The **NaC (Natural Acceptance Criteria)** column bridges JTBD outcomes to testable story criteria. Each NaC is derived by applying a specific JTBD functional outcome (the "what matters") to a journey stage context (the "when/where"), producing a testable verification statement. NaC are not invented — they are the intersection of JTBD outcome + journey stage + user story.

**Map conventions:**
- Story Map IDs: `SM-{Epic}.{NN}` (e.g., SM-0.1, SM-3.2)
- Release tiers: **R1** = MVP Core (P0 stories); **R2** = MVP Launch (P1 stories); **R3** = Post-MVP (P2 stories)
- NaC notation: `JTBD-XX.Y → [testable criterion]`

**Personas:**
| ID | Name | Role |
|----|------|------|
| PER-01 | Margaret Hollis | Decision-Maker / Executive |
| PER-02 | David Reyes | Operational Leader / Court Administrator |
| PER-03 | Priya Nair | Technical Adopter / Court IT |
| PER-04 | Marcus Webb | Innovation Contributor |
| PER-05 | Catalina Torres | I&R Curator |

---

## Story Map Matrix

### PER-01: Margaret Hollis — Decision-Maker
**Journey:** JRN-01.1 (Briefing Reference to Record Assessment) + JRN-01.2 (Surfacing a Mission Problem)

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Arrive at Hub catalog from shared link | PER-01 | Epic 0: Innovation Catalog (F0) | US-0.1: Browse Published Innovation Records | JTBD-01.1 → Catalog loads within 3s; all published records visible in card layout with maturity badge and mission area tags | R1 |
| Scan catalog cards; read maturity badges | PER-01 | Epic 9: Trust Model (F9) | US-9.1: Trust Signals Visible on Every Card | JTBD-01.1 → Maturity level and review status badges visible on every catalog card without clicking through | R1 |
| Locate record via search when browsing is insufficient | PER-01 | Epic 1: Search & Discovery (F1) | US-1.3: Receive Guidance When No Results Found | JTBD-01.2 → Empty-state search surfaces F5 pathway so mission problem is not lost | R1 |
| Open full Innovation Record from catalog card | PER-01 | Epic 2: Innovation Record (F2) | US-2.1: View a Full Innovation Record | JTBD-01.1 → Full record renders at `/records/{id}` with problem statement, outcome summary, maturity, trust disclaimers, and perspective toggle visible | R1 |
| Read Executive Perspective on record | PER-01 | Epic 3: Perspectives (F3) | US-3.1: Read Executive Perspective | JTBD-01.1 → Executive Perspective is default view; mission relevance, maturity in plain language, and decision recommendation visible without scrolling through technical detail | R2 |
| Read trust disclaimers before acting | PER-01 | Epic 9: Trust Model (F9) | US-9.2: Trust Disclaimers on Every Record | JTBD-01.1 → Trust & Limitations section renders before Next-Action panel; POC disclaimer appears automatically for Experiment/POC maturity records | R1 |
| Request briefing or demo from record page | PER-01 | Epic 7: Engagement Routing (F7) | US-7.1: Request Demo or Briefing | JTBD-01.3 → Engagement form accessible from record page; record reference pre-populated; on-screen confirmation received before navigating away | R2 |
| Search for interpreter access topic; find no results | PER-01 | Epic 1: Search & Discovery (F1) | US-1.1: Search by Mission Problem | JTBD-01.2 → Problem-language search executes against problem statements and key findings; empty state includes CTA link to F5 form | R1 |
| Submit mission problem via Opportunity Submission | PER-01 | Epic 5: Opportunity Submission (F5) | US-5.1: Submit Mission Problem for I&R Consideration | JTBD-01.2 → Form completable in under 5 minutes; on-screen confirmation states submission does not imply project commitment | R2 |
| Read submission confirmation | PER-01 | Epic 5: Opportunity Submission (F5) | US-5.2: Receive Confirmation After Submitting | JTBD-01.2 → Confirmation rendered immediately; states submission does not imply portfolio acceptance; offers "Return to Catalog" CTA | R2 |

---

### PER-02: David Reyes — Operational Leader
**Journey:** JRN-02.1 (Mission Problem Search to Adoption Discussion) + JRN-02.2 (Empty Search to Opportunity Submission)

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Arrive at Hub; go directly to search bar | PER-02 | Epic 1: Search & Discovery (F1) | US-1.1: Search by Mission Problem | JTBD-02.1 → Search field accessible from nav bar on all pages; executes against problem statements and tags, not just titles | R1 |
| Filter search results by maturity and reuse potential | PER-02 | Epic 1: Search & Discovery (F1) | US-1.2: Filter Search Results | JTBD-02.1 → Filter panel on search results page; maturity level and reuse potential filters narrow results; filter state reflected in URL | R1 |
| Browse catalog when search returns options | PER-02 | Epic 0: Innovation Catalog (F0) | US-0.2: Filter Catalog by Metadata | JTBD-02.1 → Filter panel with maturity, review status, mission area, reuse potential; active filters shown above results; empty state CTAs to F5 | R1 |
| Identify community-contributed vs. I&R records at a glance | PER-02 | Epic 0: Innovation Catalog (F0) | US-0.3: Identify Community and Reuse-Validated Records | JTBD-02.2 → Community badge visible on catalog cards for source_type=COMMUNITY; Validated for Reuse badge visible; both unambiguous on card | R1 |
| Open Innovation Record; read reuse guidance | PER-02 | Epic 2: Innovation Record (F2) | US-2.1: View a Full Innovation Record | JTBD-02.2 → Record displays reuse guidance, maturity level, review status, and owner/steward name; trust disclaimers visible before Next-Action panel | R1 |
| Read trust signals — incomplete security review flag | PER-02 | Epic 9: Trust Model (F9) | US-9.2: Trust Disclaimers on Every Record | JTBD-02.2 → Security review status prominently displayed; disclaimer language context-triggered; stakeholder cannot misread status | R1 |
| Request adoption discussion from record | PER-02 | Epic 7: Engagement Routing (F7) | US-7.1: Request Demo or Briefing | JTBD-02.2 → Adoption discussion engagement option visible on published record; record reference pre-populated; confirmation received in under 3 minutes | R2 |
| Search returns no results; follow empty-state CTA | PER-02 | Epic 1: Search & Discovery (F1) | US-1.3: Receive Guidance When No Results Found | JTBD-02.1 → Empty state message reads "No records found… submit a mission problem"; direct link to F5 form included | R1 |
| Submit mission problem via opportunity form | PER-02 | Epic 5: Opportunity Submission (F5) | US-5.1: Submit Mission Problem for I&R Consideration | JTBD-02.1 → Problem-first form completable in under 5 minutes; CAPTCHA required; confirmation states submission does not imply project commitment | R2 |
| Read confirmation; note potential follow-up | PER-02 | Epic 5: Opportunity Submission (F5) | US-5.2: Receive Confirmation After Submitting | JTBD-02.1 → Confirmation explicitly states I&R review; offers "Return to Catalog" CTA; optional confirmation email sent | R2 |
| Read maturity model definitions to understand trust signals | PER-02 | Epic 9: Trust Model (F9) | US-9.1: Trust Signals Visible on Every Card | JTBD-02.2 → Maturity level badge color-coded and labeled on every card; review status badge with human-readable label visible | R1 |

---

### PER-03: Priya Nair — Technical Adopter
**Journey:** JRN-03.1 (Technical Feasibility Evaluation) + JRN-03.2 (Technical Guidance Request)

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Search Hub using technical/problem language | PER-03 | Epic 1: Search & Discovery (F1) | US-1.1: Search by Mission Problem | JTBD-03.1 → Search covers problem statements and key findings; "audio security" returns record even if title uses internal naming | R1 |
| Filter search results by maturity and reuse potential | PER-03 | Epic 1: Search & Discovery (F1) | US-1.2: Filter Search Results | JTBD-03.1 → Filter by maturity level, review status, contributing office, reuse potential; result count updates on filter apply | R1 |
| Locate record; navigate to Technical Perspective | PER-03 | Epic 2: Innovation Record (F2) | US-2.1: View a Full Innovation Record | JTBD-03.1 → Record renders with perspective toggle visible at top; Technical View accessible without scrolling past executive content | R1 |
| Read Technical Perspective: architecture, dependencies, security | PER-03 | Epic 3: Perspectives (F3) | US-3.2: Read Technical Perspective | JTBD-03.1 → Technical View renders: architecture, tech stack, dependencies, security findings, infrastructure requirements, artifact links; structured list format not prose | R2 |
| Follow artifact links to architecture diagrams | PER-03 | Epic 4: Lessons-Learned Integration (F4) | US-4.2: Stakeholder Accesses Source Document | JTBD-03.1 → Artifact links render in dedicated section; open in new tab; link label includes artifact type; Hub context preserved | R2 |
| Synthesize assessment using reuse guidance | PER-03 | Epic 2: Innovation Record (F2) | US-2.1: View a Full Innovation Record | JTBD-03.1 → Reuse guidance section explicitly lists what a court would need to assess before adopting; court-environment-specific notes present | R1 |
| Identify open questions after technical review | PER-03 | Epic 3: Perspectives (F3) | US-3.2: Read Technical Perspective | JTBD-03.2 → "Request Technical Guidance" CTA visible in Technical Perspective view; not only in full record footer | R2 |
| Open technical guidance request form (pre-populated) | PER-03 | Epic 7: Engagement Routing (F7) | US-7.2: Request Technical Guidance | JTBD-03.2 → Record ID and title pre-filled; form captures question description and contact info; request type REQUEST_TECHNICAL_GUIDANCE stored | R2 |
| Submit technical guidance request; read confirmation | PER-03 | Epic 7: Engagement Routing (F7) | US-7.2: Request Technical Guidance | JTBD-03.2 → Confirmation includes record reference, request type, date/time, statement of routing; citable in feasibility report | R2 |

---

### PER-04: Marcus Webb — Innovation Contributor
**Journey:** JRN-04.1 (Innovation Contribution Submission and Attribution Verification)

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Browse catalog to understand what published records look like | PER-04 | Epic 0: Innovation Catalog (F0) | US-0.1: Browse Published Innovation Records | JTBD-04.1 → Catalog cards clearly distinguish I&R-conducted from community-contributed records; attribution field visible on community cards | R1 |
| Identify community badges and attribution on existing records | PER-04 | Epic 0: Innovation Catalog (F0) | US-0.3: Identify Community and Reuse-Validated Records | JTBD-04.2 → Community badge displayed unambiguously; contributing team name visible; I&R-conducted records carry no community badge | R1 |
| Navigate to contribution submission form | PER-04 | Epic 6: Share Innovation Work (F6) | US-6.1: Submit Existing Innovation Work for Curation | JTBD-04.1 → Form accessible at `/share-innovation`; "Share Your Work" CTA distinct from opportunity submission; form intro explains contribution vs. opportunity | R3 |
| Complete contribution form in a single session | PER-04 | Epic 6: Share Innovation Work (F6) | US-6.1: Submit Existing Innovation Work for Curation | JTBD-04.1 → Form fields: work description, problem addressed, outcome summary, artifact URLs, team/office, contact; completable in a single session; rate limit 5/IP/hr | R3 |
| Submit form; read confirmation message | PER-04 | Epic 6: Share Innovation Work (F6) | US-6.2: Receive Confirmation That Contribution Is Under Curation Review | JTBD-04.1 → Confirmation states "Your submission has entered I&R curation review… publication is not automatic… your team will receive attribution if published" | R3 |
| View published record; verify attribution | PER-04 | Epic 2: Innovation Record (F2) | US-2.1: View a Full Innovation Record | JTBD-04.2 → Published record displays contributing team and office name in dedicated attribution field; Community badge present; record discoverable via catalog search | R3 |

---

### PER-05: Catalina Torres — I&R Curator
**Journey:** JRN-05.1 (Record Creation and Publication Lifecycle) + JRN-05.2 (Submission Queue Review and Engagement Monitoring)

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Log into admin interface; access Create New Record | PER-05 | Epic 8: Curation & Admin (F8) | US-8.1: Access the Curator Administration Interface | JTBD-05.1 → Admin at `/admin`; unauthenticated requests redirect to IdP login; dashboard displays summary tiles for records, submissions, engagement | R1 |
| View all records regardless of publication state | PER-05 | Epic 0: Innovation Catalog (F0) | US-0.4: Curator Reviews All Records Regardless of State | JTBD-05.1 → Authenticated curators see all records; Draft/Review state cards labeled; non-published records return 404 to public users | R1 |
| Create new Innovation Record in Draft state | PER-05 | Epic 2: Innovation Record (F2) | US-2.2: Curator Creates a New Innovation Record | JTBD-05.1 → Admin provides "New Innovation Record" action; record created in DRAFT with system-generated ID; all structured fields available; Save Draft at any time | R1 |
| Author all required governance fields | PER-05 | Epic 8: Curation & Admin (F8) | US-8.2: Manage All Innovation Records from Admin Interface | JTBD-05.1 → Records section shows all records; sortable by title, maturity, review status, publication state; inline field editing with state-based edit rules | R1 |
| Reference maturity/review definitions inline | PER-05 | Epic 8: Curation & Admin (F8) | US-8.3: View In-App Content Model Reference | JTBD-05.1 → Content Model Reference accessible at Admin → Content Model Reference; all 5 maturity levels and 7 review statuses with definitions; inline in dropdowns | R1 |
| Assign maturity level and review status consistently | PER-05 | Epic 9: Trust Model (F9) | US-9.3: Curator Assigns Maturity and Review Status Consistently | JTBD-05.1 → Maturity level required for publication; dropdown shows all 5 options with inline definitions; curator cannot publish without both fields set | R1 |
| Advance record to Review state; enforce governance | PER-05 | Epic 2: Innovation Record (F2) | US-2.3: Curator Advances Record Through Publication Lifecycle | JTBD-05.1 → "Submit for Review" blocked with field list if any pub-required field is missing; "Publish" re-validates governance gate; all transitions logged to audit history | R1 |
| Advance record to Published; spot-check public view | PER-05 | Epic 2: Innovation Record (F2) | US-2.3: Curator Advances Record Through Publication Lifecycle | JTBD-05.1 → On publication, `published_at` set; record immediately appears in catalog and search; editing published record triggers warning and moves to Review | R1 |
| Create structured record from existing lessons-learned doc | PER-05 | Epic 4: Lessons-Learned Integration (F4) | US-4.1: Curator Creates Structured Record from Lessons-Learned Doc | JTBD-05.1 → Standard Innovation Record with DOCUMENT artifact link to SharePoint URL; Hub stores URL only, does not copy content; record discoverable via catalog and search | R2 |
| Archive or supersede outdated records | PER-05 | Epic 2: Innovation Record (F2) | US-2.4: Curator Archives or Supersedes a Record | JTBD-05.1 → Curator can mark Published record as SUPERSEDED (requires linked record ID) or ARCHIVED; archived records removed from default browse but accessible via direct URL | R1 |
| View audit history for a record | PER-05 | Epic 2: Innovation Record (F2) | US-2.5: View Audit History for a Record | JTBD-05.1 → Audit history accessible from admin record detail; each entry shows timestamp, curator name, field changed, old/new value, state transition; read-only | R1 |
| Author perspective-specific content (executive + technical) | PER-05 | Epic 3: Perspectives (F3) | US-3.3: Curator Authors Perspective-Specific Content | JTBD-05.1 → Separate fields for executive_perspective_text (pub-required), executive_recommendation (pub-required), technical_perspective_text (optional); single record entity | R2 |
| Open submissions queue; triage new submissions | PER-05 | Epic 8: Curation & Admin (F8) | US-8.1: Access the Curator Administration Interface | JTBD-05.2 → Admin dashboard shows pending opportunity submissions and contribution submissions tiles; quick-links to Submissions queues | R1 |
| Review and disposition opportunity submissions | PER-05 | Epic 5: Opportunity Submission (F5) | US-5.3: Curator Reviews and Dispositions Opportunity Submissions | JTBD-05.2 → Opportunity submissions visible in Submissions → Opportunities; curator can set disposition (UNDER_REVIEW / ACCEPTED / DECLINED / LINKED); disposition logged with timestamp | R2 |
| Review and disposition contribution submissions | PER-05 | Epic 6: Share Innovation Work (F6) | US-6.3: Curator Creates Innovation Record from Contribution Submission | JTBD-05.2 → Contribution submissions visible in Submissions → Contributions; curator can set ACCEPTED_FOR_CURATION; "Create Record from Submission" pre-populates Draft record | R3 |
| View engagement activity log; filter by record | PER-05 | Epic 7: Engagement Routing (F7) | US-7.3: Curator Monitors Engagement Activity and Updates Routing Email | JTBD-05.3 → Engagement Activity log shows request type, record title, requestor name/office, timestamp, routing status; filterable by record, type, date range | R2 |
| Update routing email address without code deployment | PER-05 | Epic 7: Engagement Routing (F7) | US-7.3: Curator Monitors Engagement Activity and Updates Routing Email | JTBD-05.3 → Curator can navigate to Hub Settings; update engagement_routing_email; subsequent notifications routed to updated address; no code deployment required | R2 |

---

## NaC Derivation Table

Each NaC is derived from the intersection of a JTBD outcome, a journey stage, and a user story. Source: JTBD-TSIO-Innovation-Hub.md NaC Preview + journey stage context from JOURNEYS-TSIO-Innovation-Hub.md.

| JTBD ID | JTBD Outcome | Journey Stage | NaC (Testable Criterion) | Stories |
|---------|-------------|---------------|--------------------------|---------|
| JTBD-01.1 | Decision-maker assesses maturity and relevance without technical help | JRN-01.1: Browse (catalog cards) | Given a published record with Executive Perspective, a non-technical user can state the maturity level and mission relevance in plain language within 5 minutes without requesting staff interpretation | US-0.1, US-9.1 |
| JTBD-01.1 | Decision-maker assesses maturity and relevance without technical help | JRN-01.1: Read (Executive Perspective) | Given an open Innovation Record, the Executive Perspective is the default view; maturity level appears in plain language (not enum) and a decision recommendation is present | US-3.1, US-9.2 |
| JTBD-01.1 | Decision-maker assesses maturity and relevance without technical help | JRN-01.1: Locate (full record) | Given a catalog card click, the full Innovation Record renders at `/records/{id}` within 3 seconds with problem statement, outcome summary, perspective toggle, and trust disclaimers all visible | US-2.1 |
| JTBD-01.2 | Mission problem submitted in under 5 minutes; confirmation received | JRN-01.2: Recognize Need (empty search state) | Given a search that returns zero results, the empty-state message includes a direct CTA link to the Opportunity Submission form at `/submit-opportunity` | US-1.3 |
| JTBD-01.2 | Mission problem submitted in under 5 minutes; confirmation received | JRN-01.2: Submit (opportunity form) | Given the Opportunity Submission form, a user can complete and submit a problem description with confirmation received in under 5 minutes; confirmation explicitly states no project commitment | US-5.1, US-5.2 |
| JTBD-01.3 | Briefing/demo request initiated from record in under 3 minutes | JRN-01.1: Act (engagement routing) | Given an Innovation Record page, a user can submit a briefing or demo engagement request with on-screen confirmation received before navigating away; record reference is pre-populated | US-7.1 |
| JTBD-02.1 | Relevant prior work discovered via problem-language search | JRN-02.1: Search (results with maturity) | Given a mission problem description as a search query, at least one relevant record is returned when a matching record exists; results display maturity badge and review status without clicking through | US-1.1, US-1.2 |
| JTBD-02.1 | Relevant prior work discovered via problem-language search | JRN-02.1: Filter (narrow to actionable) | Given filter controls for maturity level and reuse potential on the search results page, applying filters re-executes search and updates result count without a full page reload | US-1.2, US-0.2 |
| JTBD-02.1 | Relevant prior work discovered via problem-language search | JRN-02.2: Search (No Results) — empty state CTA | Given a search that returns no results, the empty-state message reads "No records found for '[query]'. Try different keywords, or submit a mission problem for I&R consideration." with a direct F5 link | US-1.3 |
| JTBD-02.2 | Adoption readiness assessed; adoption discussion initiated | JRN-02.1: Read Record (reuse guidance) | Given a published record, the reuse guidance section explicitly lists what a court would need to assess, configure, or review before adopting; maturity and review status are prominently displayed | US-2.1, US-9.2 |
| JTBD-02.2 | Adoption readiness assessed; adoption discussion initiated | JRN-02.1: Request Engagement (adoption discussion) | Given a published Innovation Record, a user can submit an adoption discussion request in under 3 minutes; record reference is pre-populated; confirmation states routing and expected response | US-7.1 |
| JTBD-03.1 | Technical constraints identified without accessing raw documents | JRN-03.1: Locate Record (perspective navigation) | Given an open Innovation Record, the Technical Perspective is accessible via a visible toggle at the top of the page; navigation does not require scrolling past executive content | US-2.1, US-3.2 |
| JTBD-03.1 | Technical constraints identified without accessing raw documents | JRN-03.1: Read Technical Perspective | Given the Technical Perspective on a record, a technical evaluator can list architecture, dependencies, security findings, and infrastructure constraints from the Hub page alone without accessing any raw source document | US-3.2 |
| JTBD-03.1 | Technical constraints identified without accessing raw documents | JRN-03.1: Follow Artifact Links | Given a record with artifact links, each link opens in a new tab with a label identifying the artifact type (e.g., "Architecture Diagram — SharePoint"); Hub context is preserved | US-4.2 |
| JTBD-03.2 | Technical guidance request submitted with record reference in under 3 minutes | JRN-03.2: Open Request Form (pre-populated) | Given the Technical Perspective view, a "Request Technical Guidance" CTA is visibly placed without requiring scroll to footer; clicking it opens a form with record ID and title pre-filled | US-7.2 |
| JTBD-03.2 | Technical guidance request submitted with record reference in under 3 minutes | JRN-03.2: Submit Request (confirmation) | Given the engagement form, submitting a technical guidance request produces a confirmation containing: record reference, request type, date/time, and routing statement — citable in a feasibility report | US-7.2 |
| JTBD-04.1 | Contribution submitted; confirmation acknowledges curation review; attribution committed | JRN-04.1: Orient (catalog — attribution labels) | Given the Innovation Catalog, community-contributed records are visually distinguished from I&R-conducted records with a Community badge and visible attribution field before clicking through | US-0.3, US-0.1 |
| JTBD-04.1 | Contribution submitted; confirmation acknowledges curation review; attribution committed | JRN-04.1: Complete Submission (contribution form) | Given the contribution form at `/share-innovation`, a submitter can complete all required fields in a single session; CAPTCHA required; rate limit enforced at 5 submissions/IP/hr | US-6.1 |
| JTBD-04.1 | Contribution submitted; confirmation acknowledges curation review; attribution committed | JRN-04.1: Submit and Receive Confirmation | Given a completed contribution form submission, the on-screen confirmation states that the submission has entered I&R curation review, publication is not automatic, and attribution will be credited if published | US-6.2 |
| JTBD-04.2 | Published record discoverable with correct attribution | JRN-04.1: View Published Record (attribution field) | Given a published community-contributed record, the contributing team's name and office appear in the attribution field; the Community badge is displayed; record is findable via catalog search by problem area | US-2.1, US-0.3 |
| JTBD-05.1 | Records created and published in under 60 min; governance enforced | JRN-05.1: Access Admin (login and dashboard) | Given the admin interface at `/admin`, an authenticated curator sees the dashboard with summary tiles and quick-links; unauthenticated access redirects to IdP login | US-8.1 |
| JTBD-05.1 | Records created and published in under 60 min; governance enforced | JRN-05.1: Author Record (create form) | Given the "New Innovation Record" action, all structured fields defined in F2 are available; curator can Save Draft at any time without all pub-required fields complete | US-2.2 |
| JTBD-05.1 | Records created and published in under 60 min; governance enforced | JRN-05.1: Enforce Governance (publication gate) | Given the admin interface, a curator cannot transition a record to Published state while any required governance field is empty; all blocking fields are listed before the transition is attempted | US-2.3, US-9.3 |
| JTBD-05.1 | Records created and published in under 60 min; governance enforced | JRN-05.1: Advance to Published (lifecycle) | Given a record in REVIEW state with all pub-required fields complete, the "Publish" action sets `published_at` and makes the record immediately visible in catalog and search; transition logged to audit history | US-2.3 |
| JTBD-05.1 | Records created and published in under 60 min; governance enforced | JRN-05.1: Post-Publication Update (audit trail) | Given a published record, a curator can update maturity level or review status as a controlled field change; the change is logged to audit history with timestamp and actor; no record recreation required | US-2.4, US-2.5 |
| JTBD-05.2 | All incoming submissions visible in admin queue; disposition recorded without email | JRN-05.2: Review Submissions (disposition field) | Given an F5 or F6 submission, the submission appears in the admin review queue within 5 minutes; curator can record a disposition (UNDER_REVIEW / ACCEPTED / DECLINED / PENDING) without leaving the interface | US-5.3, US-6.3 |
| JTBD-05.3 | Engagement log viewable by record; routing email configurable without code deployment | JRN-05.2: View Engagement Log (filter by record) | Given the admin engagement log, a curator can filter requests by record, request type, and date range; high-interest patterns are identifiable at a glance | US-7.3 |
| JTBD-05.3 | Engagement log viewable by record; routing email configurable without code deployment | JRN-05.2: Route Pending Request (routing config) | Given the admin Hub Settings, a curator can update the engagement_routing_email field; subsequent notifications are sent to the updated address; change takes effect without a code deployment | US-7.3 |

---

## Release Planning

### Release R1: MVP Core — "Trusted Catalog & Curation Foundation"

**Theme:** Establish the working skeleton of the Hub: a browsable, searchable catalog of published innovation records with governance-enforced curation, trust signals on every card and record, and a functional admin interface. Every P0 story ships in R1. At the end of R1, Catalina can publish records and Margaret, David, and Priya can discover and read them.

**Stories (18 stories — all P0):**
US-0.1, US-0.2, US-0.3, US-0.4, US-1.1, US-1.2, US-1.3, US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-8.1, US-8.2, US-8.3, US-9.1, US-9.2, US-9.3

**Personas Served:** PER-01 (partial journey — Browse/Locate/Read without Exec Perspective), PER-02 (Search/Filter/Read without engagement), PER-03 (Search/Locate without Technical Perspective), PER-05 (full curation lifecycle)

**JTBD Addressed:**
- JTBD-01.1 (partial — catalog trust signals; full Executive Perspective in R2)
- JTBD-02.1 (full — problem-language search, filtering, empty-state CTA)
- JTBD-02.2 (partial — record read + trust signals; engagement routing in R2)
- JTBD-03.1 (partial — record locate + artifact links available; Technical Perspective view in R2)
- JTBD-05.1 (full — admin create/publish lifecycle, governance enforcement, audit history)

**Complete journeys enabled by R1:**
- JRN-05.1 (PER-05 full curation lifecycle — all stages)
- JRN-02.1 stages: Arrive → Search → Filter → Read Record → Assess Readiness (engagement request deferred to R2)
- JRN-02.2 (PER-02 empty search to opportunity form CTA — links to R2 for form completion)

**Acceptance Gate:**
- [ ] All NaC for R1 stories pass
- [ ] PER-05 can create and publish a complete innovation record in under 60 minutes
- [ ] PER-01 can browse the catalog and read a full record with visible trust signals
- [ ] PER-02 can search by mission problem language and find a relevant record
- [ ] Governance enforcement prevents publication of any record missing required fields
- [ ] Zero records published missing maturity level, review status, or trust disclaimers

---

### Release R2: MVP Launch — "Audience-Appropriate Views & Engagement Pathways"

**Theme:** Add the differentiated views (Executive and Technical Perspectives), engagement routing forms, opportunity submission flow, and lessons-learned integration. At the end of R2, all five personas can complete their primary journeys end-to-end. This is the targeted MVP launch state.

**Stories (11 stories — all P1):**
US-3.1, US-3.2, US-3.3, US-4.1, US-4.2, US-5.1, US-5.2, US-5.3, US-7.1, US-7.2, US-7.3

**Personas Served:** PER-01 (full journey — Executive Perspective + briefing request + opportunity submission), PER-02 (full journey — engagement routing added), PER-03 (full journey — Technical Perspective + technical guidance request), PER-05 (submission queue review + engagement monitoring)

**JTBD Addressed:**
- JTBD-01.1 (complete — Executive Perspective as default view)
- JTBD-01.2 (complete — Opportunity Submission form + confirmation)
- JTBD-01.3 (complete — briefing/demo request from record page)
- JTBD-02.2 (complete — adoption discussion engagement routing)
- JTBD-03.1 (complete — full Technical Perspective with structured findings)
- JTBD-03.2 (complete — targeted technical guidance request)
- JTBD-05.2 (complete — submission queue review and disposition)
- JTBD-05.3 (complete — engagement log + routing email update)

**Complete journeys enabled by R2:**
- JRN-01.1 (PER-01 — full: Arrive → Browse → Locate → Read → Act)
- JRN-01.2 (PER-01 — full: Recognize Need → Navigate → Submit → Confirm)
- JRN-02.1 (PER-02 — full: all 6 stages including engagement request)
- JRN-02.2 (PER-02 — full: empty search through opportunity confirmation)
- JRN-03.1 (PER-03 — full: Arrive → Locate → Read Technical Perspective → Artifact Links → Synthesize)
- JRN-03.2 (PER-03 — full: Identify Need → Open Form → Submit → Confirm)
- JRN-05.2 (PER-05 — full: submission queue + engagement monitoring + routing)

**Acceptance Gate:**
- [ ] All NaC for R2 stories pass
- [ ] PER-01 can determine maturity and mission relevance in under 5 minutes via Executive Perspective
- [ ] PER-01 can submit a mission problem in under 5 minutes with unambiguous confirmation
- [ ] PER-01 can request a briefing from a record page in under 3 minutes with trackable confirmation
- [ ] PER-02 can initiate an adoption discussion in under 3 minutes from a record page
- [ ] PER-03 can identify all technical constraints from Technical Perspective without accessing raw documents
- [ ] PER-03 can submit a technical guidance request in under 3 minutes with citable confirmation
- [ ] PER-05 can view and disposition all incoming submissions without leaving the admin interface
- [ ] PER-05 can update routing email without a code deployment

---

### Release R3: Post-MVP — "Community Contribution Pathway"

**Theme:** Open the governed contribution pathway for teams outside I&R to share innovation work. This completes PER-04's journey and extends the Hub's content model to community-contributed records. Deferred from core MVP due to lower audience priority (P2) and dependency on R1/R2 foundation.

**Stories (3 stories — all P2):**
US-6.1, US-6.2, US-6.3

**Personas Served:** PER-04 (full journey — orientation → submission → confirmation → attribution verification), PER-05 (contribution queue review and record creation from submission)

**JTBD Addressed:**
- JTBD-04.1 (complete — governed contribution form with attribution commitment and curation-review confirmation)
- JTBD-04.2 (complete — published community record with named attribution discoverable via catalog search)

**Complete journeys enabled by R3:**
- JRN-04.1 (PER-04 — full: Orient → Find Pathway → Complete Submission → Confirm → View Published Record)

**Acceptance Gate:**
- [ ] All NaC for R3 stories pass
- [ ] PER-04 can submit a contribution in a single session with confirmation that publication is not automatic
- [ ] PER-05 can create a pre-populated Draft record from a contribution submission with one action
- [ ] Published community record displays named team attribution in a dedicated attribution field
- [ ] Published community record is discoverable via catalog search by problem area
- [ ] Community badge and trust disclaimer render correctly on all contributed records

---

## Coverage Analysis

### Persona Coverage

| Persona | R1 — MVP Core | R2 — MVP Launch | R3 — Post-MVP |
|---------|---------------|-----------------|---------------|
| **PER-01** Margaret Hollis | US-0.1, US-0.2, US-0.3, US-1.1, US-1.2, US-1.3, US-2.1, US-9.1, US-9.2 | US-3.1, US-5.1, US-5.2, US-7.1 | — |
| **PER-02** David Reyes | US-0.2, US-0.3, US-1.1, US-1.2, US-1.3, US-2.1, US-9.1, US-9.2 | US-5.1, US-5.2, US-7.1 | — |
| **PER-03** Priya Nair | US-1.1, US-1.2, US-2.1 | US-3.2, US-4.2, US-7.2 | — |
| **PER-04** Marcus Webb | US-0.1, US-0.3 (orientation only) | — | US-6.1, US-6.2 |
| **PER-05** Catalina Torres | US-0.4, US-2.2, US-2.3, US-2.4, US-2.5, US-8.1, US-8.2, US-8.3, US-9.3 | US-3.3, US-4.1, US-5.3, US-7.3 | US-6.3 |

**Notes:**
- PER-01 and PER-02 are fully served by R1 + R2 (no R3 dependencies)
- PER-03 receives partial journey in R1 (discover + locate) and completes in R2 (technical perspective + guidance request)
- PER-04 is oriented in R1 but cannot contribute until R3; this is acceptable given P2 priority
- PER-05 receives a complete curation lifecycle in R1 and full operational tooling in R2

---

### JTBD Coverage

| JTBD ID | Persona | Release | Stories | NaC Count |
|---------|---------|---------|---------|-----------|
| JTBD-01.1 | PER-01 | R1 (partial), R2 (complete) | US-0.1, US-9.1, US-2.1, US-3.1, US-9.2 | 3 |
| JTBD-01.2 | PER-01 | R2 | US-1.3, US-5.1, US-5.2 | 2 |
| JTBD-01.3 | PER-01 | R2 | US-7.1 | 1 |
| JTBD-02.1 | PER-02 | R1 (full) | US-1.1, US-1.2, US-0.2, US-1.3 | 3 |
| JTBD-02.2 | PER-02 | R1 (partial), R2 (complete) | US-2.1, US-9.2, US-7.1 | 2 |
| JTBD-03.1 | PER-03 | R1 (partial), R2 (complete) | US-2.1, US-3.2, US-4.2 | 3 |
| JTBD-03.2 | PER-03 | R2 | US-7.2 | 2 |
| JTBD-04.1 | PER-04 | R3 | US-6.1, US-6.2 | 3 |
| JTBD-04.2 | PER-04 | R3 | US-2.1, US-0.3 | 2 |
| JTBD-05.1 | PER-05 | R1 | US-2.2, US-2.3, US-2.4, US-2.5, US-8.1, US-8.2, US-8.3, US-9.3 | 5 |
| JTBD-05.2 | PER-05 | R2 | US-5.3, US-6.3 | 1 |
| JTBD-05.3 | PER-05 | R2 | US-7.3 | 2 |

**Total NaC derived:** 29 NaC statements across 12 JTBD outcomes

---

### Gap Analysis

**Journey stages without story coverage:**
- None identified. All journey stages across JRN-01.1 through JRN-05.2 are covered by at least one mapped story.

**JTBD outcomes without derived NaC:**
- None. All 12 JTBD IDs have at least one NaC derived in the NaC Derivation Table.

**Orphan stories (not mapped to any journey stage):**
- None. All 32 stories (US-0.1 through US-9.3) appear in the Story Map Matrix under at least one persona's journey lane.
  - Note: Some stories serve multiple personas (e.g., US-2.1 appears in PER-01, PER-02, PER-03, and PER-04 lanes). This is correct — they are shared touchpoints, not duplicates.

**Personas without journey coverage in a release:**
- PER-04 has no stories in R2 (journey starts orientation in R1, contribution in R3). This is intentional — F6 is P2 priority. PER-04 is not left without any value: R1 catalog and attribution visibility inform their decision to contribute.

**Partial JTBD coverage warnings:**
- JTBD-01.1 and JTBD-02.2 are partially addressed in R1 (catalog trust signals + record read) but fully resolved only in R2 (Executive Perspective view and engagement routing). These are explicitly staged — R1 enables discovery; R2 enables action.
- JTBD-03.1 similarly: R1 enables search and record access; R2 completes with the structured Technical Perspective.

**R1 journey completeness check:**
- JRN-05.1 (PER-05): ✅ Fully complete in R1
- JRN-02.1 (PER-02): ⚠ Stages 1–5 complete in R1; Stage 6 (engagement request) completes in R2
- JRN-02.2 (PER-02): ⚠ Empty-state CTA available in R1; form completion requires R2
- All consuming-persona primary journeys (JRN-01.x, JRN-02.x, JRN-03.x): ✅ Complete by end of R2

---

## NaC-to-Acceptance Criteria Mapping

This table verifies that each derived NaC aligns with the explicit Acceptance Criteria (AC) in UserStories-TSIO-Innovation-Hub.md. Alignment is confirmed when the AC either directly tests the NaC condition or provides an equivalent behavioral assertion.

| NaC | Story | AC from UserStories.md | Aligned? |
|-----|-------|------------------------|----------|
| JTBD-01.1: Non-technical user can state maturity and mission relevance in under 5 minutes from Executive Perspective | US-3.1 | "Executive Perspective renders: executive perspective text, executive recommendation, maturity level and review status in plain language, reuse potential in plain language, trust disclaimers, and all engagement options" | ✅ Yes |
| JTBD-01.1: Catalog loads within 3s; published records visible with maturity badge and mission area tags | US-0.1 | "Catalog loads within 3 seconds under normal load" + "Each card displays: title, short summary, maturity level badge (with color coding), review status badge, mission area tags" | ✅ Yes |
| JTBD-01.1: Full record renders at `/records/{id}` with perspective toggle visible | US-2.1 | "Clicking a catalog card or search result navigates to `/records/{record_id}` and renders the full Innovation Record" + "A perspective toggle (Executive / Technical view) is visible on the record page" | ✅ Yes |
| JTBD-01.2: Empty-state search surfaces F5 pathway | US-1.3 | "When a valid query returns zero results, the empty-state message reads: 'No records found for '[query]'. Try different keywords, or submit a mission problem for I&R consideration.'" + "The empty-state message includes a direct CTA link to the Opportunity Submission form (F5)" | ✅ Yes |
| JTBD-01.2: Opportunity form completable in under 5 minutes; confirmation states no project commitment | US-5.1 | "On successful submission, an on-screen confirmation is displayed with explicit language: 'Your submission has been received. This submission does not imply acceptance of the opportunity into the I&R portfolio or a commitment to begin a project.'" | ✅ Yes |
| JTBD-01.3: Briefing/demo request submitted from record page; record reference pre-populated; confirmation received before navigating away | US-7.1 | "The Next-Action panel on every published Innovation Record page displays the configured engagement options as actionable buttons" + "On successful submission, an on-screen confirmation is shown" + "An engagement request record is created with `request_type` tied to the selected engagement option and `record_id` tied to the current record" | ✅ Yes |
| JTBD-02.1: Problem-language search returns relevant records; results display maturity badge and review status | US-1.1 | "Search executes against problem statements, key findings, what was explored, outcome summaries, titles, tags, and summaries with weighted relevance" + "Each result card displays: title, short summary snippet with query terms highlighted, maturity level badge, review status badge" | ✅ Yes |
| JTBD-02.1: Filter controls on search page re-execute search; result count updates | US-1.2 | "Re-applying filters re-executes the search and re-renders results without a full page reload" + "Total result count updates when filters are applied" | ✅ Yes |
| JTBD-02.2: Record displays reuse guidance and trust signals prominently | US-2.1 | "The record displays: title, problem statement, what was explored, outcome summary, key findings, maturity level, review status, reuse guidance, owner/steward name and office" + "Trust disclaimers are rendered in a visible 'Trust & Limitations' section before the Next-Action panel" | ✅ Yes |
| JTBD-02.2: Adoption discussion request submitted in under 3 minutes; confirmation includes routing | US-7.1 | "An email notification is sent to the configurable routing address with: request type, record title and URL, requestor name, office, email, description of interest, timestamp" + "An optional confirmation email is sent to the requestor's provided email address" | ✅ Yes |
| JTBD-03.1: Technical Perspective toggle accessible without scrolling; structured technical content | US-3.2 | "A perspective toggle labeled 'Executive View' and 'Technical View' is always visible on the record page; it cannot be hidden" + "Clicking 'Technical View' re-renders the content area without a page reload showing: what was explored, technical perspective text, security findings, performance findings, reuse guidance, artifact links" | ✅ Yes |
| JTBD-03.1: Artifact links open in new tab with type label; Hub context preserved | US-4.2 | "Each artifact link displays a label and opens the external URL in a new tab" + "The Hub clearly communicates that the link leads to an external authoritative source document" | ✅ Yes |
| JTBD-03.2: "Request Technical Guidance" CTA visible in Technical Perspective; form pre-populated with record reference | US-7.2 | "'Request Technical Guidance' engagement option is available on records where it has been configured by the curator" + "The engagement form is accessible from both the Technical and Executive Perspectives" + "The request type `REQUEST_TECHNICAL_GUIDANCE` is stored on the engagement request record" | ✅ Yes |
| JTBD-03.2: Technical guidance request confirmation includes record reference, request type, date/time | US-7.2 | "An engagement request record is created with `request_type` tied to the selected engagement option and `record_id` tied to the current record" + "An optional confirmation email is sent to the requestor's provided email address" | ✅ Yes — confirmation captures record reference via stored request record; confirmation email aligns |
| JTBD-04.1: Community badges visible on catalog cards before contribution submission | US-0.3 | "A 'Community' badge is displayed on catalog cards where `source_type = COMMUNITY`" + "I&R-conducted records carry no community badge; the visual distinction between source types is unambiguous" | ✅ Yes |
| JTBD-04.1: Contribution form completable in single session; confirmation states curation review required | US-6.1, US-6.2 | Form fields include work description, problem, outcome, artifact URLs, team/office, contact; "Submissions enter I&R curation review. Publication is not guaranteed." + Confirmation: "Your submission has been received. The I&R team will review it for potential curation. This submission does not guarantee publication." | ✅ Yes |
| JTBD-04.2: Published community record has named attribution; discoverable via search by problem area | US-2.1 | "The record displays: … contributing office, artifact links" + community trust disclaimer rendered; US-0.3: Community badge and attribution visible | ✅ Yes (attribution via contributing_office + contributor_attribution fields) |
| JTBD-05.1: Admin at `/admin`; unauthenticated access redirects to IdP; dashboard with summary tiles | US-8.1 | "The admin interface is accessible at `/admin` and all sub-paths" + "Unauthenticated requests to admin routes redirect to the identity provider login" + "The admin dashboard displays summary tiles: total published records, total draft/review records, pending opportunity submissions, pending contribution submissions, engagement requests in the last 7 days" | ✅ Yes |
| JTBD-05.1: Curator can Save Draft at any time without all pub-required fields complete | US-2.2 | "Curator can save a draft at any time without all pub-required fields being complete" | ✅ Yes |
| JTBD-05.1: Governance gate prevents publication while any required field is empty; all blocking fields listed | US-2.3 | "'Submit for Review' transitions a record from `DRAFT` to `REVIEW`; if any pub-required field is missing, the system lists all blocking fields and prevents the transition" + "'Publish' transitions a record from `REVIEW` to `PUBLISHED`; governance gate re-validates all pub-required fields" | ✅ Yes |
| JTBD-05.1: Maturity level and review status required before publication; dropdown shows inline definitions | US-9.3 | "Attempting to publish without maturity level set returns: 'Maturity level is required before publishing.'" + "curator selects from a dropdown displaying all 5 options with their definitions shown inline" | ✅ Yes |
| JTBD-05.1: Published record sets `published_at`; immediately visible in catalog and search | US-2.3 | "On successful publication, `published_at` timestamp is set and the record immediately appears in the catalog and search" | ✅ Yes |
| JTBD-05.2: F5/F6 submissions appear in admin queue within 5 minutes; curator records disposition without leaving interface | US-5.3, US-6.3 | US-5.3: "All `opportunity_submission` records are visible in the Submissions → Opportunities section … sorted reverse-chronologically" + "Curator can update the disposition of each submission" ; US-6.3: Contribution submissions visible in Submissions → Contributions; disposition field present | ✅ Yes |
| JTBD-05.3: Engagement log filterable by record, type, date range; routing email updatable without code deployment | US-7.3 | "Curator can filter engagement requests by record, request type, and date range" + "Curator can navigate to Hub Settings and update the `engagement_routing_email` field … After saving a new routing email, all subsequent notifications are sent to the updated address — no code deployment required" | ✅ Yes |

**Alignment summary:** 24 of 24 NaC-to-AC mappings verified as aligned. No NaC conflicts or unverifiable criteria identified.

---

*TSIO Innovation Hub — Story Map | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-29*
*Powered by Pivota Spec Framework*
