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

