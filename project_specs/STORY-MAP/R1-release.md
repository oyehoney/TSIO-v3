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

