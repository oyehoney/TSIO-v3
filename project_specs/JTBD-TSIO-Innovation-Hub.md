# Jobs to Be Done
## TSIO Innovation Hub

| Field | Value |
|-------|-------|
| **Product Name** | TSIO Innovation Hub |
| **Date** | 2026-07-29 |
| **Related Personas** | PERSONAS-TSIO-Innovation-Hub.md |
| **Related PRD** | PRD-TSIO-Innovation-Hub.md |

---

## JTBD Summary

| ID | Persona | Job Statement | Priority |
|----|---------|--------------|----------|
| JTBD-01.1 | PER-01 Decision-Maker | When I hear about an innovation effort, I want to assess its relevance and maturity without reading raw technical output, so I can decide whether to invest further. | P0 |
| JTBD-01.2 | PER-01 Decision-Maker | When I identify a mission problem with no known solution, I want to formally surface it to I&R, so I can trigger consideration without navigating internal bureaucracy. | P1 |
| JTBD-01.3 | PER-01 Decision-Maker | When I find a record that warrants deeper review, I want to request a briefing or demo through a clear mechanism, so I can evaluate it for a formal decision or recommendation. | P1 |
| JTBD-02.1 | PER-02 Operational Leader | When my court faces a mission problem, I want to search by the problem itself to find prior I&R exploration, so I can avoid duplicating work already done. | P0 |
| JTBD-02.2 | PER-02 Operational Leader | When I find potentially relevant innovation work, I want to assess its practical readiness and initiate an adoption conversation, so I can give my court a concrete next step. | P0 |
| JTBD-03.1 | PER-03 Technical Adopter | When I am asked to evaluate whether an innovation effort is feasible for our environment, I want to access a structured technical view with architecture, dependencies, and security findings, so I can make a credible recommendation without hunting through raw documents. | P0 |
| JTBD-03.2 | PER-03 Technical Adopter | When I have completed my technical review of a record, I want to request hands-on technical guidance from the I&R team, so I can resolve open questions before committing to a local adaptation scope. | P1 |
| JTBD-04.1 | PER-04 Innovation Contributor | When my team has completed innovation work that could benefit other courts, I want to submit it through a governed pathway with attribution, so I can contribute to the institutional record without bypassing I&R's governance. | P2 |
| JTBD-04.2 | PER-04 Innovation Contributor | When my submitted work is published, I want to view the live record and confirm accurate representation of my team's contribution, so I can trust the Hub as a credible attribution mechanism for future sharing. | P2 |
| JTBD-05.1 | PER-05 I&R Curator | When creating or updating an innovation record, I want to manage all structured fields and publication lifecycle from a single admin interface with governance enforcement, so I can maintain content quality without relying on SharePoint workarounds or email threads. | P0 |
| JTBD-05.2 | PER-05 I&R Curator | When incoming opportunity and contribution submissions arrive, I want to review and disposition them from a dedicated queue, so I can keep the curation pipeline moving without losing submissions in email. | P1 |
| JTBD-05.3 | PER-05 I&R Curator | When monitoring Hub engagement, I want to see which records are receiving requests and of what type, so I can route them accurately and identify high-interest areas without manual tracking. | P1 |

---

## PER-01: Decision-Maker — Jobs

### JTBD-01.1: Assess Innovation Relevance and Maturity Without Technical Translation

**Job Statement:**
When I hear about an innovation effort through informal channels or a briefing reference, I want to assess its relevance to my mission problems and understand its maturity without reading raw technical output, so I can decide whether to invest further or recommend consideration to my organization.

**Current Alternatives:**
- Asks a technical team member to summarize a raw SharePoint document before a briefing
- Relies on informal conversations with I&R team members to get a plain-language explanation
- Skips engagement entirely because no accessible summary is available in time

**Hiring Criteria:**
- Provides an Executive Perspective with mission relevance framing and plain-language maturity status on every record
- Clearly distinguishes between POC, Pilot, and Production-level work without requiring the reader to interpret technical language
- Loads the record and all relevant context in a single page view within 3 seconds

**Success Measure:** A senior leader can determine the maturity status and mission relevance of a record in under 5 minutes without requesting a technical interpretation from staff.

**Related Features:** F0, F2, F3, F9
**Priority:** P0

---

### JTBD-01.2: Surface a Mission Problem to I&R for Consideration

**Job Statement:**
When I identify a mission problem that I believe warrants innovation exploration and no known I&R work addresses it, I want to formally surface it through a structured, problem-first form, so I can trigger I&R consideration without navigating internal bureaucracy or waiting for an informal channel.

**Current Alternatives:**
- Mentions the problem verbally at a leadership meeting and hopes it reaches the right person
- Sends an email to a known I&R contact, which may not be tracked or actioned
- Takes no action because no formal pathway exists

**Hiring Criteria:**
- Provides a structured submission form that guides problem description, mission area, and urgency context without requiring solution proposals
- Confirms submission clearly and states it does not imply a commitment or timeline
- Completes in under 5 minutes for a focused, well-understood problem

**Success Measure:** A decision-maker can submit a mission problem in under 5 minutes and receive immediate confirmation that it is under review — with zero ambiguity about next steps.

**Related Features:** F5, F7
**Priority:** P1

---

### JTBD-01.3: Request a Briefing or Demo on a Record of Interest

**Job Statement:**
When I identify an innovation record that appears relevant to a decision I am evaluating, I want to request a briefing or demo through a clear, trackable mechanism, so I can move from awareness to a structured conversation without cold-emailing or asking staff to find the right contact.

**Current Alternatives:**
- Asks a staff member to find the right I&R contact and set up a meeting informally
- References the work in a briefing deck without understanding enough to make a recommendation
- Defers action because no clear engagement pathway exists

**Hiring Criteria:**
- Engagement request options (demo, briefing, adoption discussion) are prominently visible on every Innovation Record
- Submission is tracked with requestor name, office, and record reference — not a generic email
- Requestor receives a confirmation acknowledging the request and indicating expected response process

**Success Measure:** A decision-maker can initiate a briefing or demo request from a record page in under 3 minutes, with a confirmation received before leaving the page.

**Related Features:** F2, F7
**Priority:** P1

---

## PER-02: Operational Leader — Jobs

### JTBD-02.1: Discover Prior I&R Work by Mission Problem, Not Project Name

**Job Statement:**
When my court faces an operational or technology problem and I suspect I&R may have already explored it, I want to search the Hub using the language of the problem itself — not a project name or team — so I can avoid duplicating work and find actionable prior art before committing local resources.

**Current Alternatives:**
- Discovers relevant I&R work months after independently tackling the same problem, through an informal conversation
- Asks a known I&R contact to search their memory for relevant work
- Assumes no prior work exists because there is no discoverable surface to check

**Hiring Criteria:**
- Full-text search covers problem statements, key findings, mission area tags, and technology area tags — not just record titles
- Returns results with visible maturity level and review status so relevance can be assessed at a glance
- Supports empty-state guidance directing the user to submit a mission problem if no results are found

**Success Measure:** An operational leader can determine whether relevant prior I&R work exists for a given mission problem within a single search session of under 10 minutes — without prior knowledge of any project name, team, or document.

**Related Features:** F0, F1, F9
**Priority:** P0

---

### JTBD-02.2: Assess Practical Readiness and Initiate an Adoption Conversation

**Job Statement:**
When I find an I&R record relevant to a problem my court is facing, I want to understand its practical readiness — what works, what the local adoption considerations are, and what the concrete next step is — so I can give my court leadership a credible assessment and initiate an adoption conversation with I&R.

**Current Alternatives:**
- Reads raw technical documents and infers readiness himself, often missing security or infrastructure constraints
- Contacts I&R informally to ask whether something is "ready" — receives inconsistent answers
- Takes no adoption action because no clear next step is surfaced

**Hiring Criteria:**
- Each record surfaces reuse guidance explicitly: what a court would need to evaluate, configure, or review before adopting
- Maturity level and review status are visibly prominent and explained in plain terms (not jargon)
- A clear "request adoption discussion" action is present on every published record

**Success Measure:** An operational leader can determine from a single record view whether an effort is worth an adoption conversation, and initiate that conversation in under 3 minutes.

**Related Features:** F2, F7, F9
**Priority:** P0

---

## PER-03: Technical Adopter — Jobs

### JTBD-03.1: Evaluate Technical Feasibility Without Hunting Through Raw Documents

**Job Statement:**
When my operational leadership asks me to assess whether an I&R innovation effort is technically feasible for our court environment, I want to access a structured Technical Perspective with architecture, dependency, security, and performance findings in one place, so I can produce a credible feasibility assessment in a single session without hunting through unstructured source documents.

**Current Alternatives:**
- Parses raw SharePoint documents looking for architecture decisions and security constraints scattered across sections
- Requests a direct conversation with the I&R engineer who worked on the effort, which may not be available or timely
- Produces a preliminary assessment with known gaps because critical constraints are not documented accessibly

**Hiring Criteria:**
- Technical Perspective field on every record surfaces: architecture description, technology stack, known dependencies, security findings, performance constraints, and infrastructure requirements in a structured layout
- Artifact links connect directly from the record to architecture diagrams, code repositories, and test result documents
- Reuse guidance describes what local adaptation scope would look like for a court environment

**Success Measure:** A court IT professional can identify all key technical constraints and dependencies of an innovation effort from a single record view in under 30 minutes, without accessing any raw source document.

**Related Features:** F2, F3, F9
**Priority:** P0

---

### JTBD-03.2: Request Technical Guidance to Resolve Adoption Blockers

**Job Statement:**
When I have reviewed a technical record and identified specific open questions — about security constraints, infrastructure compatibility, or adaptation approach — I want to submit a targeted technical guidance request to the I&R team, so I can resolve blockers before committing to a local adaptation scope.

**Current Alternatives:**
- Sends an informal email to an I&R contact whose information was obtained through a colleague
- Raises questions in a meeting without a structured record of what was asked or answered
- Proceeds with adaptation under uncertainty, which creates rework risk if constraints are discovered later

**Hiring Criteria:**
- "Request technical guidance" action is prominently available on every Technical Perspective view and full Innovation Record
- Submission captures the specific record reference, nature of the question, and requestor's contact information — not a generic contact form
- Requestor receives confirmation with indication of routing and expected response process

**Success Measure:** A technical adopter can initiate a targeted technical guidance request from a record page in under 3 minutes, with a confirmation that includes the record reference and request type.

**Related Features:** F2, F3, F7
**Priority:** P1

---

## PER-04: Innovation Contributor — Jobs

### JTBD-04.1: Submit Court Innovation Work Through a Governed, Attributed Pathway

**Job Statement:**
When my team has completed innovation work that addresses a real mission problem and could benefit other courts, I want to submit it through a structured, governed contribution pathway that guarantees attribution and enters a curation workflow, so I can contribute to the institutional record without informal sharing that disappears into email threads.

**Current Alternatives:**
- Shares work informally via email to known I&R contacts, which does not produce a discoverable record and lacks attribution
- Presents work at a conference or meeting, which reaches a limited audience and is not institutionally captured
- Takes no action because no governed pathway exists and self-publishing is not appropriate

**Hiring Criteria:**
- Structured contribution form captures: description of work, problem addressed, outcome summary, artifact locations (URLs), team/office, and contact information
- Submission confirmation explicitly states that it enters curation review and publication is not automatic
- Published record includes named attribution of the contributing team and office

**Success Measure:** An innovation contributor can complete a structured contribution submission in a single session and receive confirmation — with zero ambiguity that the submission enters a governed review, not automatic publication.

**Related Features:** F0, F6, F8
**Priority:** P2

---

### JTBD-04.2: Verify Attribution and Representation Accuracy on the Published Record

**Job Statement:**
When a Hub record based on my team's submitted work is published, I want to view the live record and confirm that the attribution is accurate and the work is represented fairly, so I can trust the Hub as a credible institutional record and share it with confidence as evidence of my team's contribution.

**Current Alternatives:**
- Has no visibility into the published record until someone else mentions it
- Contacts the I&R curator informally to ask whether the record is live and what it says
- Cannot share the record as evidence of contribution if attribution is absent or inaccurate

**Hiring Criteria:**
- Published record displays contributing team and office name in a visible, dedicated attribution field
- Record is discoverable via catalog search using terms related to the submitted work's problem area
- Record clearly distinguishes community-contributed work from I&R-conducted work without diminishing the contribution's value

**Success Measure:** A contributor can locate their team's published record via catalog search within 2 minutes and confirm named attribution appears correctly — with no curator intervention required to find it.

**Related Features:** F0, F2, F6, F9
**Priority:** P2

---

## PER-05: I&R Curator — Jobs

### JTBD-05.1: Create, Govern, and Publish Innovation Records from a Single Interface

**Job Statement:**
When authoring a new innovation record or advancing an existing one toward publication, I want to manage all structured metadata, maturity assignment, review status, and publication lifecycle state from a single admin interface with governance enforcement, so I can maintain record quality and trust integrity without relying on SharePoint folders, email threads, or team memory.

**Current Alternatives:**
- Manages record drafts in SharePoint documents with inconsistent field structure across records
- Tracks publication state in a shared team spreadsheet that is frequently out of date
- Relies on personal knowledge and peer review to catch missing governance fields before sharing records externally

**Hiring Criteria:**
- Admin interface provides create/edit forms for all required Innovation Record fields (F2), with field validation and governance enforcement before state transitions
- System prevents publication of any record missing required fields: problem statement, named owner, maturity level, review status, source artifact link, last-reviewed date, and disclaimer
- Publication lifecycle states (Draft → Review → Published → Superseded → Archived) are managed from the interface with explicit state transitions — not freeform editing

**Success Measure:** A curator can create and publish a complete innovation record in under 60 minutes, with zero records published missing required governance fields.

**Related Features:** F2, F8, F9
**Priority:** P0

---

### JTBD-05.2: Process Incoming Opportunity and Contribution Submissions Without Losing Them in Email

**Job Statement:**
When opportunity submissions (F5) and contribution submissions (F6) arrive from stakeholders, I want to review and disposition them from a dedicated queue in the admin interface, so I can maintain a reliable curation pipeline without hunting through email threads or missing submissions.

**Current Alternatives:**
- Receives submissions via email; manually tracks review status in a spreadsheet
- Loses submissions during periods of high email volume or team transitions
- Has no visibility into submission history or prior disposition decisions

**Hiring Criteria:**
- Admin interface displays incoming F5 and F6 submissions in a dedicated review queue, visible within minutes of submission
- Each submission record captures: submission type, date received, submitting office, contact information, and content fields from the form
- Curator can record a disposition (accepted for curation, declined, pending) against each submission with a timestamp

**Success Measure:** A curator can review all new submissions and record a disposition within one review session — with zero submissions lost to email or requiring manual tracking in a separate system.

**Related Features:** F5, F6, F8
**Priority:** P1

---

### JTBD-05.3: Monitor Engagement Activity and Route Requests Accurately

**Job Statement:**
When stakeholders submit engagement requests — demos, adoption discussions, technical guidance, briefings — I want to see a consolidated activity log showing which records are receiving requests and of what type, so I can route them to the right I&R team member without manual forwarding and identify high-interest records that may warrant prioritized curation attention.

**Current Alternatives:**
- Receives engagement requests via a shared email inbox; manually routes them by reading each one and identifying the relevant I&R contact
- Has no aggregate view of which records or problem areas are generating engagement
- Cannot update the routing email address without asking a developer to change a configuration file

**Hiring Criteria:**
- Admin interface displays an engagement activity log with: request type, innovation record reference, requestor name/office, date submitted, and routing status
- Engagement routing email address is configurable from the admin interface without a code deployment
- Log supports filtering by record, request type, and date range to identify engagement patterns

**Success Measure:** A curator can view all engagement requests received in the past 30 days, sorted by record, in under 5 minutes — and update the routing email address in under 2 minutes without developer involvement.

**Related Features:** F7, F8
**Priority:** P1

---

## Outcome-to-Feature Traceability

| JTBD ID | Feature(s) | Expected Outcome |
|---------|-----------|-----------------|
| JTBD-01.1 | F0, F2, F3, F9 | Decision-maker determines innovation relevance and maturity in under 5 minutes without technical interpretation |
| JTBD-01.2 | F5, F7 | Mission problem submitted in under 5 minutes; confirmation received; I&R team notified via routing |
| JTBD-01.3 | F2, F7 | Briefing or demo request initiated in under 3 minutes from record page; trackable engagement record created |
| JTBD-02.1 | F0, F1, F9 | Relevant prior I&R work discovered via problem-language search within a single session |
| JTBD-02.2 | F2, F7, F9 | Adoption readiness assessed from record alone; adoption discussion initiated in under 3 minutes |
| JTBD-03.1 | F2, F3, F9 | Full technical constraint profile identified from record in under 30 minutes without raw document access |
| JTBD-03.2 | F2, F3, F7 | Targeted technical guidance request submitted in under 3 minutes; confirmation with record reference received |
| JTBD-04.1 | F0, F6, F8 | Contribution submitted in a single session; confirmation acknowledges curation review pathway; attribution committed |
| JTBD-04.2 | F0, F2, F6, F9 | Published record with correct attribution discoverable via catalog search within 2 minutes |
| JTBD-05.1 | F2, F8, F9 | Records created and published in under 60 minutes; governance enforcement prevents publication of incomplete records |
| JTBD-05.2 | F5, F6, F8 | All incoming submissions visible in admin queue within minutes; disposition recorded without email dependency |
| JTBD-05.3 | F7, F8 | Engagement activity log viewable by record and type; routing email configurable without code deployment |

---

## NaC Preview

| JTBD ID | Outcome | Candidate NaC |
|---------|---------|--------------|
| JTBD-01.1 | Decision-maker assesses maturity and relevance without technical help | Given a published record with Executive Perspective, a non-technical user can state the maturity level and mission relevance in plain language within 5 minutes |
| JTBD-01.2 | Mission problem submitted in under 5 minutes | Given the Opportunity Submission form, a user can complete and submit a problem description with confirmation received in under 5 minutes |
| JTBD-01.3 | Briefing/demo request initiated from record in under 3 minutes | Given an Innovation Record page, a user can submit an engagement request with confirmation before navigating away |
| JTBD-02.1 | Relevant prior work discovered via problem-language search | Given a mission problem description as a search query, at least one relevant record returns when a matching record exists in the catalog |
| JTBD-02.2 | Adoption readiness assessed; adoption discussion initiated | Given a published record, the reuse guidance and maturity level allow a user to assess fit and submit an adoption discussion request in under 3 minutes |
| JTBD-03.1 | Technical constraints identified without accessing raw documents | Given the Technical Perspective on a record, a technical evaluator can list architecture, dependencies, and security constraints from the Hub page alone |
| JTBD-03.2 | Technical guidance request submitted with record reference | Given the Technical Perspective, a user can submit a technical guidance request capturing the record ID, question type, and contact info in under 3 minutes |
| JTBD-04.1 | Contribution submitted; confirmation acknowledges curation review | Given the contribution form, a submitter receives a confirmation message stating submission is under curation review before the session ends |
| JTBD-04.2 | Published record discoverable with correct attribution | Given a published community-contributed record, the contributing team's name appears in the attribution field and the record is findable via catalog search |
| JTBD-05.1 | Record published in under 60 min; governance enforced | Given the admin interface, a curator cannot transition a record to Published state while any required governance field is empty |
| JTBD-05.2 | Submissions visible in admin queue; disposition recorded | Given an F5 or F6 submission, the submission appears in the admin review queue within 5 minutes and the curator can record a disposition without leaving the interface |
| JTBD-05.3 | Engagement log viewable by record; routing email configurable | Given the admin engagement log, a curator can filter requests by record and update the routing email address without a code deployment |

---

*TSIO Innovation Hub — JTBD Document | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-29*
*Powered by Pivota Spec Framework*
