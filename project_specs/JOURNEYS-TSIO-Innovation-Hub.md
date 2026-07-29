# User Journeys
## TSIO Innovation Hub

| Field | Value |
|-------|-------|
| **Product Name** | TSIO Innovation Hub |
| **Date** | 2026-07-29 |
| **Related Personas** | PERSONAS-TSIO-Innovation-Hub.md |
| **Related JTBD** | JTBD-TSIO-Innovation-Hub.md |
| **Related PRD** | PRD-TSIO-Innovation-Hub.md |

---

## Journey Index

| ID | Persona | Scenario | Key JTBD | Stages |
|----|---------|----------|----------|--------|
| JRN-01.1 | PER-01 Margaret Hollis | Decision-maker discovers a Hub record from a briefing reference and assesses relevance and maturity | JTBD-01.1 | 5 |
| JRN-01.2 | PER-01 Margaret Hollis | Decision-maker surfaces a mission problem to I&R through the Opportunity Submission form | JTBD-01.2, JTBD-01.3 | 4 |
| JRN-02.1 | PER-02 David Reyes | Operational leader searches by mission problem to find prior I&R work and assesses adoption readiness | JTBD-02.1, JTBD-02.2 | 6 |
| JRN-02.2 | PER-02 David Reyes | Operational leader submits a mission opportunity when search returns no relevant prior work | JTBD-02.1 | 4 |
| JRN-03.1 | PER-03 Priya Nair | Technical adopter evaluates technical feasibility of an I&R innovation effort in a single session | JTBD-03.1 | 5 |
| JRN-03.2 | PER-03 Priya Nair | Technical adopter requests hands-on technical guidance after identifying open architecture questions | JTBD-03.2 | 4 |
| JRN-04.1 | PER-04 Marcus Webb | Innovation contributor submits court-level innovation work through the governed contribution pathway | JTBD-04.1, JTBD-04.2 | 5 |
| JRN-05.1 | PER-05 Catalina Torres | I&R curator creates a new innovation record and advances it through the full publication lifecycle | JTBD-05.1 | 6 |
| JRN-05.2 | PER-05 Catalina Torres | I&R curator processes an incoming submission queue and monitors engagement activity | JTBD-05.2, JTBD-05.3 | 5 |

---

## PER-01: Margaret Hollis

### JRN-01.1: Briefing Reference to Record Assessment

**Persona:** PER-01 (Margaret Hollis)
**Scenario:** Margaret is preparing for a leadership meeting on courtroom technology modernization. A colleague mentions "that I&R audio security work" in a pre-read email. She has never seen the record and has no idea where to look. She navigates to the TSIO Innovation Hub hoping to find something she can reference with confidence — without asking someone to translate a technical document for her.
**Related Jobs:** JTBD-01.1, JTBD-01.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Arrive | Navigates to Hub URL from a shared link in the colleague's email | Innovation Catalog (F0) | "Is this the right place? What am I looking at?" | Uncertain, mildly anxious | No prior familiarity with the Hub; unclear whether this is an internal tool or a public site | Landing page orientation text and clear "start here" catalog entry point reduce disorientation |
| Browse | Scans catalog cards, reads maturity badges and mission area tags | Innovation Catalog (F0), F9 trust signals | "I need audio security — is there a quick way to find it, or do I just scroll?" | Focused but impatient | Catalog may have multiple cards; no obvious visual hierarchy for executive-relevance | Prominent maturity and review status badges on cards let Margaret filter by confidence level at a glance |
| Locate | Finds the Audio Security POC record card; clicks through to the full record | Innovation Record (F2) | "OK, this looks like it. Let me see if it's actually useful or just a technical dump." | Cautiously optimistic | Fear of landing on a raw technical artifact with no leadership framing | Executive Perspective tab visible immediately on record load; no scroll required to find it |
| Read | Reads Executive Perspective: mission relevance framing, maturity level in plain language, decision recommendation | Executive Perspective (F3) | "This was a POC, not a deployed system — I need to say that clearly in the meeting. What's the recommendation?" | Relieved, growing confidence | Concern about misrepresenting maturity to colleagues; needs a clear "what to say" signal | Decision recommendation field in plain language gives Margaret a citable statement for her briefing |
| Act | Clicks "Request a Briefing" on the record; completes and submits engagement form | Engagement Routing (F7) | "I want someone from I&R to walk me through this before the meeting. Is this the right way to ask?" | Purposeful | Uncertainty about who will receive the request and when to expect a response | Confirmation message names the routing destination and states expected response process; Margaret leaves the page confident the request is tracked |

#### Key Moments
- **Decision Point:** Read stage — Margaret decides whether the Executive Perspective gives her enough to cite in the briefing, or whether she needs to ask staff to interpret it. If the framing is too technical, she will not use the record.
- **Risk of Abandonment:** Arrive/Browse stages — if the catalog presents no clear path to the Audio Security record within the first 30 seconds, Margaret will close the tab and email an I&R contact directly.
- **Delight Opportunity:** Read stage — a crisp "Decision Recommendation" field (e.g., "This effort is at POC stage and is not recommended for production adoption without further security review") gives Margaret exactly the sentence she needs for a leadership meeting, generating trust in the Hub as a briefing resource.

#### Success Outcome
Margaret determines the maturity status and mission relevance of the Audio Security POC record in under 5 minutes without asking staff for a technical interpretation. She leaves the page having submitted a briefing request with a confirmation that the request is tracked (JTBD-01.1 and JTBD-01.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Arrive | F0 (Innovation Catalog) |
| Browse | F0, F9 (Trust Model signals on catalog cards) |
| Locate | F2 (Innovation Record) |
| Read | F3 (Executive Perspective) |
| Act | F7 (Engagement Routing) |

---

### JRN-01.2: Surfacing a Mission Problem to I&R

**Persona:** PER-01 (Margaret Hollis)
**Scenario:** After reviewing the Hub, Margaret identifies a critical mission problem in her portfolio — remote interpreter access reliability for non-English-speaking defendants — that she believes warrants I&R exploration. She has no knowledge of existing work on this topic. She wants to formally surface it rather than mentioning it verbally at the next leadership meeting and hoping it reaches the right person.
**Related Jobs:** JTBD-01.2, JTBD-01.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Recognize Need | Cannot find any matching record after a brief catalog scan; sees the empty-state guidance on search results | Search (F1) empty state | "There's nothing here on interpreter access. Is this even an I&R topic? Who would I even tell?" | Frustrated, uncertain | No clear pathway from "nothing found" to "submit this problem"; empty state risks feeling like a dead end | Empty-state message explicitly invites submission with a direct link to the Opportunity Submission form (F5) |
| Navigate | Follows the "Submit a Mission Problem" link to the F5 submission form | Opportunity Submission (F5) | "OK, is this a big form? I have 10 minutes, not 30." | Cautious about time commitment | Fear that a government submission form will be long, redundant, or require information she doesn't have | Form is short (problem description, mission area, office, urgency context, contact info); problem-first framing means she does not need to propose a solution |
| Submit | Completes the problem description and submits the form | Opportunity Submission (F5) | "Am I committing to something here? Will this start a project I didn't intend?" | Anxious about bureaucratic implications | Risk of triggering an unwanted process; needs reassurance that this is a suggestion, not an order | Confirmation message clearly states "Your problem has been submitted for I&R consideration. This does not imply a commitment to begin a project or establish a timeline." |
| Confirm | Reads confirmation; closes browser | Submission confirmation (F5) | "Good. I've done what I can. I'll hear back if they pursue it." | Relieved | No indication of what "next" looks like or who reviewed it | Confirmation message names the curation team as the review owner and states they will acknowledge receipt — setting appropriate expectations without overpromising |

#### Key Moments
- **Decision Point:** Navigate stage — Margaret decides whether the form is short enough to complete now or to defer. Forms perceived as complex will be abandoned.
- **Risk of Abandonment:** Recognize Need stage — if the empty-state search result does not offer a clear call to action, Margaret will not discover the F5 pathway.
- **Delight Opportunity:** Confirm stage — a well-worded confirmation ("Your input helps I&R prioritize future exploration") signals that her contribution has value without overpromising a timeline.

#### Success Outcome
Margaret submits a well-described mission problem in under 5 minutes and receives a confirmation that explicitly sets expectations about the review process — with zero ambiguity about whether she has committed to a project (JTBD-01.2 success measure).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Recognize Need | F0, F1 (empty state) |
| Navigate | F5 (Opportunity Submission form) |
| Submit | F5 |
| Confirm | F5 (confirmation message) |

---

## PER-02: David Reyes

### JRN-02.1: Mission Problem Search to Adoption Discussion Request

**Persona:** PER-02 (David Reyes)
**Scenario:** David's court is evaluating options for transcription automation in courtrooms. Before committing resources to an internal evaluation, he suspects I&R may have already explored this. He navigates to the TSIO Innovation Hub to search by the problem — not by a project name — and attempts to assess whether any existing work is worth an adoption conversation.
**Related Jobs:** JTBD-02.1, JTBD-02.2

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Arrive | Navigates to the Hub; goes directly to search | Search (F1) | "Let me search for 'courtroom transcription' or 'automated transcription' and see what comes up." | Pragmatic, mildly skeptical | No confidence that a government discovery portal will understand mission-language search | Search covers problem statements and tags, not just titles — returns records even when "transcription" appears in the problem context field, not the record title |
| Search | Types "courtroom transcription automation" into the search bar; reviews results | Search (F1), F9 maturity badges | "I'm seeing two results. What maturity level are these at? Are they actually done, or just ideas?" | Interested but guarded | Results lack immediate readiness signal; must click into each record to assess viability | Maturity level and review status displayed on each search result row; David can rule out "Idea" stage records without clicking through |
| Filter | Applies filter: Maturity ≥ Prototype/Pilot, Reuse Potential: Yes | Search (F1) filter panel, F0 | "Let me narrow this to things that are actually worth reading. I don't have time for early-stage experiments right now." | Efficient, task-focused | Filter panel may be hidden or require extra interaction; unclear what "Reuse Potential" means without a tooltip | Filter labels include brief inline definitions (e.g., "Reuse Potential: records where guidance for court adoption is available"); David applies correct filter on first try |
| Read Record | Opens the top result; reads full Innovation Record including reuse guidance and maturity details | Innovation Record (F2), F9 | "OK this is relevant. What would I actually need to do to adopt this? Are there infrastructure requirements I need to know about?" | Engaged, evaluating risk | Reuse guidance section may be generic rather than court-environment-specific | Reuse Guidance field explicitly lists: what a court would need to assess, configure, or obtain before adopting; David can build a feasibility checklist directly from this section |
| Assess Readiness | Reviews maturity level (Prototype/Pilot), review status (Technically Reviewed but not Security Reviewed) | F2, F9 trust signals | "It's not security reviewed. That's a flag — I'll need to factor that in when I talk to our ISSO. But it's worth a conversation with I&R." | Thoughtful, slightly cautious | Trust disclaimers are present but risk being overlooked on a long record page | Security review status prominently displayed near the top of the record with a plain-language note ("Security review has not been completed; local security assessment required before adoption consideration") |
| Request Engagement | Clicks "Request Adoption Discussion"; completes and submits the engagement form | Engagement Routing (F7) | "I want to talk to whoever led this effort. What information do I need to provide to get a useful conversation, not just a generic reply?" | Motivated, purposeful | Generic engagement forms produce generic responses; David wants specificity | Engagement form is pre-populated with the record reference; David adds his court, specific interest (transcription automation feasibility), and desired next step; confirmation states routing and response expectation |

#### Key Moments
- **Decision Point:** Assess Readiness stage — David decides whether the incomplete security review is a blocker or a known variable to manage. If the Hub buries this signal, he may misrepresent readiness to his court leadership.
- **Risk of Abandonment:** Search stage — if results are returned by title-only matching and "courtroom transcription automation" returns zero results, David concludes no relevant work exists and closes the tab. Problem-statement search coverage is critical.
- **Delight Opportunity:** Read Record stage — a reuse guidance section with court-specific implementation notes ("courts operating in Azure Government Cloud should note...") signals that the Hub understands David's context and earns sustained engagement.

#### Success Outcome
David discovers relevant prior I&R transcription work within a single search session of under 10 minutes without knowing any project name. He reads the record, assesses adoption readiness including the incomplete security review flag, and submits an adoption discussion request in under 3 minutes from the record page (JTBD-02.1 and JTBD-02.2 success measures).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Arrive | F0 (Innovation Catalog), F1 (Search) |
| Search | F1, F9 (maturity/review on results) |
| Filter | F1 filter panel, F0 |
| Read Record | F2 (Innovation Record), F9 |
| Assess Readiness | F2, F9 (trust signals) |
| Request Engagement | F7 (Engagement Routing) |

---

### JRN-02.2: Empty Search to Opportunity Submission

**Persona:** PER-02 (David Reyes)
**Scenario:** David searches the Hub for prior I&R work on remote hearing scheduling integration — a problem his court is actively trying to solve. The search returns no results. Rather than simply closing the browser, David wants a clear pathway to surface this as a formal request to I&R so his court doesn't duplicate future work that I&R might take on.
**Related Jobs:** JTBD-02.1

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Search (No Results) | Searches "remote hearing scheduling integration"; receives empty results state | Search (F1) empty state | "Nothing. This isn't surprising, but it means we'll have to figure it out ourselves. Or… wait, is there a way to flag this?" | Resigned, then curious | A plain empty state with no call to action closes the loop — David leaves and the knowledge is lost | Empty-state message reads: "No records found. If this is a problem your court is facing, you can submit it for I&R consideration." with a direct link to F5 |
| Navigate to Submission | Clicks the submission link from the empty-state message; lands on F5 form | Opportunity Submission (F5) | "This is straightforward. Let me describe the problem clearly so it doesn't get dismissed as vague." | Focused | The form may ask for information David doesn't have (budget, solution proposals) — creating friction | Form is problem-first: it asks for the mission problem, not a proposed solution; required fields are limited to what David can answer in 5 minutes |
| Complete and Submit | Fills in: problem description, mission area, court/office, urgency context, contact info | Opportunity Submission (F5) | "I want to be specific enough that this doesn't get lumped into a general backlog." | Engaged, attentive | No character guidance on how much detail is appropriate | Form includes brief guidance text ("Describe the problem as your court experiences it — proposed solutions are not required") that calibrates David's response length |
| Confirm | Reads confirmation; notes that a curator will review the submission | Submission confirmation (F5) | "Good. If I&R takes this on, I'll want to be looped in. I gave my contact info — hopefully that's enough." | Satisfied, hopeful | No explicit statement about whether the submitter will be contacted if I&R pursues the problem | Confirmation message states: "If I&R pursues this opportunity, the submitting contact may be engaged for additional context" — setting realistic expectation of follow-up |

#### Key Moments
- **Decision Point:** Search (No Results) stage — the empty state is the only mechanism that keeps David in the journey. Without a clear CTA, this journey ends at zero value.
- **Risk of Abandonment:** Navigate to Submission — if the link from the empty state goes to a complex multi-page form, David abandons it.
- **Delight Opportunity:** Confirm stage — a confirmation that acknowledges the problem's domain ("Your submission on remote hearing scheduling has been received") demonstrates that the form was read, not just logged.

#### Success Outcome
David finds no matching prior work but successfully submits a mission problem in under 5 minutes, with a confirmation that sets expectations about curation review and potential follow-up (JTBD-02.1 empty-state success measure).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Search (No Results) | F1 (empty state CTA) |
| Navigate to Submission | F5 (Opportunity Submission) |
| Complete and Submit | F5 |
| Confirm | F5 (confirmation message) |

---

## PER-03: Priya Nair

### JRN-03.1: Technical Feasibility Evaluation in a Single Session

**Persona:** PER-03 (Priya Nair)
**Scenario:** David Reyes (her IT director) has asked Priya to evaluate whether the I&R Audio Security POC effort is technically feasible to adapt for their court's environment — specifically regarding GPU/CPU separation, Azure Government Cloud constraints, and any known security gaps. She has one session to produce a preliminary feasibility assessment. She navigates to the Hub expecting to find either a well-structured technical record or a raw document that will take hours to parse.
**Related Jobs:** JTBD-03.1

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Arrive | Navigates to the Hub; searches "audio security" | Search (F1) | "Let me find the audio security POC. If this is a document library I'll be here all day." | Skeptical but professional | Risk that search returns a title-match only — if the record is titled "POC-AudioSec-2024-v3" she won't find it | Search indexes the problem statement and key findings fields; "audio security" returns the record even if the title uses internal project naming |
| Locate Record | Clicks into the Audio Security POC Innovation Record; scans the full record layout | Innovation Record (F2) | "OK — what sections exist here? I need architecture, dependencies, security findings. Are those in one place or scattered?" | Alert, assessing | Fear of navigating a long unstructured page to find relevant technical content | Technical Perspective tab visible as a named section or tab at the top of the record; Priya can navigate directly to the technical content without scrolling past executive context |
| Read Technical Perspective | Opens Technical Perspective; reads architecture description, technology stack, dependencies, infrastructure requirements | Technical Perspective (F3) | "GPU/CPU separation is called out explicitly — that's exactly what I needed. Azure Government Cloud constraints are here too. Is there a known gap list?" | Relieved, increasingly engaged | Critical constraints may be buried within a narrative rather than in a structured list | Technical Perspective surfaces security findings and infrastructure constraints in a structured list format (not embedded in prose); known gaps are labeled as "Known Limitations" for clear identification |
| Follow Artifact Links | Clicks artifact links to architecture diagrams and test result documents | Artifact Links (F2) | "The architecture diagram is linked from the record — let me open it. Does it open in place or redirect me away?" | Focused, efficient | External links may open in the same tab, losing the Hub context; or links may be broken/stale | Artifact links open in a new tab; link labels include the artifact type (e.g., "Architecture Diagram — SharePoint") so Priya knows what she's clicking before she clicks |
| Synthesize Assessment | Returns to record; reviews reuse guidance; begins drafting her feasibility notes | Reuse Guidance (F2), F9 | "Reuse guidance says local GPU infrastructure would be required and Azure Gov constraints are real blockers for our current environment. That's the crux of my assessment." | Confident, productive | Reuse guidance may be generic ("consult local IT") rather than technically specific | Reuse Guidance field includes court-environment-specific notes ("Courts without dedicated GPU infrastructure would require hardware provisioning before any deployment evaluation"); Priya's assessment writes itself |

#### Key Moments
- **Decision Point:** Read Technical Perspective stage — Priya decides whether the structured technical content is sufficient for her assessment or whether she needs to chase raw documents. If the Technical Perspective is well-structured, she completes the assessment in this session.
- **Risk of Abandonment:** Locate Record stage — if the full record page presents executive content first with no visible technical navigation, Priya loses confidence that structured technical content exists and begins hunting through external links prematurely.
- **Delight Opportunity:** Read Technical Perspective — explicit "Known Limitations" section that calls out Azure Government Cloud constraints and GPU/CPU separation by name demonstrates that the Hub understands her technical context; she cites the record directly in her recommendation.

#### Success Outcome
Priya identifies all key technical constraints and dependencies — including GPU/CPU separation requirements and Azure Government Cloud limitations — from the Innovation Record alone in under 30 minutes, without accessing any raw source document beyond the linked architecture diagram (JTBD-03.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Arrive | F1 (Search) |
| Locate Record | F2 (Innovation Record), F3 (Perspective navigation) |
| Read Technical Perspective | F3 (Technical Perspective) |
| Follow Artifact Links | F2 (Artifact Links) |
| Synthesize Assessment | F2 (Reuse Guidance), F9 |

---

### JRN-03.2: Technical Guidance Request After Feasibility Review

**Persona:** PER-03 (Priya Nair)
**Scenario:** After completing her feasibility assessment, Priya has identified two open questions she cannot answer from the record alone: whether the GPU/CPU separation requirement applies to their specific Azure Government subscription tier, and whether the I&R team tested the POC under the same network segmentation constraints her court uses. She wants to submit a targeted technical guidance request — not a generic contact form — that captures these specific questions with the record reference.
**Related Jobs:** JTBD-03.2

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Identify Need | Finishes reading the Technical Perspective; notes two unresolved questions in her assessment notes | Technical Perspective (F3) | "I've gotten everything I can from the record. These two questions need a human answer. How do I ask I&R directly?" | Analytically satisfied, operationally blocked | No obvious "ask a technical question" action visible in the Technical Perspective view | "Request Technical Guidance" CTA is visibly placed in the Technical Perspective — not only in the full record footer; Priya sees it without scrolling away from the technical content |
| Open Request Form | Clicks "Request Technical Guidance"; form opens with record reference pre-populated | Engagement Routing (F7) | "Good — it already knows which record I'm asking about. Let me describe the specific questions." | Efficiently focused | Generic forms that ask for record details the system should already know create friction and signal low integration quality | Record ID and title are pre-filled; Priya writes only her question description and contact information |
| Submit Request | Describes both open questions with technical specificity; submits form | Engagement Routing (F7) | "I want to make sure the right technical person sees this, not just a program coordinator." | Purposeful | Uncertainty about whether the request will be routed to a technical expert or a general inbox | Confirmation message states: "Your technical guidance request for [Record Title] has been received and will be routed to the I&R technical team. Expected response: within [N] business days." |
| Await Confirmation | Reads confirmation on-screen before navigating away | Submission confirmation (F7) | "I have the record title and my request type in the confirmation. I can reference this in my feasibility report to show a follow-up is pending." | Confident, closure | Confirmation may not include enough detail to reference in a follow-up report | Confirmation includes: record reference, request type (Technical Guidance), date/time of submission, and a statement that the requestor will be contacted for follow-up — citable in Priya's report |

#### Key Moments
- **Decision Point:** Open Request Form stage — Priya decides whether to use the Hub's engagement form or send an informal email. If the form requires her to re-enter the record details she just read, she will email instead.
- **Risk of Abandonment:** Identify Need stage — if "Request Technical Guidance" is only reachable by scrolling to the bottom of the full Innovation Record page (rather than visible in the Technical Perspective), Priya may not find it.
- **Delight Opportunity:** Submit Request — a pre-populated record reference, combined with a field specifically labeled "Technical Question" (not a generic "Message" field), signals that the Hub was designed for her exact use case.

#### Success Outcome
Priya initiates a targeted technical guidance request capturing the record reference, both open questions, and her contact information — in under 3 minutes from the Technical Perspective page — and receives a confirmation she can cite in her feasibility report (JTBD-03.2 success measure).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Identify Need | F3 (Technical Perspective CTA) |
| Open Request Form | F7 (Engagement Routing — pre-populated) |
| Submit Request | F7 |
| Await Confirmation | F7 (confirmation message) |

---

## PER-04: Marcus Webb

### JRN-04.1: Innovation Contribution Submission and Attribution Verification

**Persona:** PER-04 (Marcus Webb)
**Scenario:** Marcus's court team has completed a successful pilot of a low-bandwidth video conferencing solution for remote hearings in rural districts. The work addressed a real mission problem, produced reproducible findings, and should benefit other courts facing the same challenge. Marcus wants to share it with the broader Judiciary through a credible pathway — not an email to someone he happens to know. He browses the Hub to understand what published records look like, then submits his team's work through the contribution form.
**Related Jobs:** JTBD-04.1, JTBD-04.2

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Orient | Browses the Innovation Catalog to understand what published records look like and what "contributing" means | Innovation Catalog (F0) | "If I'm going to submit our work, I want to see what the final product looks like. Will our team be credited? Will it look like I&R's own work or our work?" | Curious, evaluating trust | Community-contributed records may be visually indistinct from I&R-conducted records — Marcus may fear his team's work will be attributed to I&R | Catalog cards and record pages clearly distinguish I&R-conducted from community-contributed records with a visible label and attribution field; Marcus can see exactly how his team's name would appear |
| Find Submission Pathway | Navigates to the "Share Your Innovation Work" form (F6); reads the form introduction | Contribution Form (F6) | "Is this the right form? What's the difference between this and the opportunity form? Let me read the intro." | Methodical | Navigation to the contribution form may not be obvious from the catalog; Marcus may waste time finding the right form | Catalog and record pages include a "Share your own innovation work" link (distinct from "Submit a mission problem"); form introduction clearly explains the contribution-vs-opportunity distinction |
| Complete Submission | Fills in: description of work, problem addressed, outcome summary, artifact URLs, team/office, contact info | Contribution Form (F6) | "I want to be thorough here — this needs to represent our work accurately. How long does this take?" | Engaged, somewhat effortful | A long or unclear form creates fatigue; if fields are ambiguous, Marcus may undersell the work | Form fields include brief guidance labels (e.g., "Describe the mission problem your team addressed — what challenge were you solving?"); Marcus completes the form in a single session of under 20 minutes |
| Submit and Receive Confirmation | Submits form; reads confirmation message carefully | Submission confirmation (F6) | "I need to know this won't be published automatically. Our team hasn't vetted everything for public consumption yet. Will a curator review this before it goes live?" | Anxious about governance | Risk that submission implies automatic publication; Marcus's team may not have cleared all artifacts for external sharing | Confirmation message explicitly states: "Your submission has entered I&R curation review. A curator will review your materials, enrich the record, and contact you before any record is published. Publication is not automatic." |
| View Published Record | Weeks later, receives notification; navigates to the published record; verifies attribution | Innovation Record (F2) | "Is our team named? Does this accurately represent what we did? Can I share this link with my leadership?" | Proud, evaluating | If attribution appears as a footnote or uses a generic label ("External Contributor") rather than the team's actual name and office, the record loses its value as institutional recognition | Attribution section prominently displays: contributing team name, office, and a "Community-Contributed" label that acknowledges the source without diminishing the work's credibility |

#### Key Moments
- **Decision Point:** Orient stage — Marcus decides whether to trust the Hub as a fair attribution mechanism. If community-contributed records look indistinguishable from I&R-conducted work (i.e., no clear attribution), or if they look visually subordinate, he loses confidence in the contribution pathway.
- **Risk of Abandonment:** Complete Submission stage — a form that is ambiguous or requires information Marcus doesn't have (e.g., internal I&R project codes) causes him to abandon mid-form and fall back to informal sharing.
- **Delight Opportunity:** View Published Record stage — seeing his team's full name and office in the attribution field of a published, searchable Hub record is the moment Marcus trusts the Hub as a credible institutional record. This is the conversion event that generates future contributions.

#### Success Outcome
Marcus submits his team's innovation work in a single session with a confirmation that publication is not automatic. The published record displays named attribution, is discoverable via catalog search by problem area, and is shareable as evidence of the team's institutional contribution (JTBD-04.1 and JTBD-04.2 success measures).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Orient | F0 (Innovation Catalog — contribution labels) |
| Find Submission Pathway | F6 (Contribution Form entry point) |
| Complete Submission | F6 |
| Submit and Receive Confirmation | F6 (confirmation messaging) |
| View Published Record | F2 (Attribution field), F0 (searchability) |

---

## PER-05: Catalina Torres

### JRN-05.1: Innovation Record Creation and Publication Lifecycle

**Persona:** PER-05 (Catalina Torres)
**Scenario:** The I&R team has just completed a proof-of-concept evaluation of an AI-based document redaction tool. The work generated valuable findings — including significant limitations under current AO security policy — and Catalina has been asked to create the Hub record. She starts from the existing lessons-learned document in SharePoint and must author a structured Innovation Record, assign governance metadata, advance it through review, and publish it — all within the admin interface.
**Related Jobs:** JTBD-05.1

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Access Admin | Logs into the admin interface; navigates to "Create New Record" | Curation Admin (F8) | "Let me start a new record. I want to make sure I have the SharePoint document URL at hand before I begin." | Prepared, methodical | If the creation flow requires fields she doesn't have immediately (e.g., named owner confirmation), Catalina may get blocked mid-form | Admin interface supports "Save as Draft" at any point so Catalina can start with available fields and return to complete the rest |
| Author Record | Populates all structured fields: problem context, what was explored, outcome, key findings, maturity level (Experiment/POC), review status (Curated), artifact link (SharePoint URL), attribution | Record Editor (F8), F2 fields | "Maturity is Experiment/POC — this was a feasibility test, not a pilot. Review status is Curated because I've structured it but no external review has happened yet." | Focused, referencing governance model | Risk of inconsistently applying maturity and review status definitions across records without inline reference | Admin interface displays maturity and review status definitions as inline tooltips so Catalina applies them consistently without opening a separate reference document |
| Enforce Governance | Attempts to advance the record to "Review" state; system validates required fields | Publication Lifecycle (F8), F9 | "Let me make sure I haven't missed anything. Problem statement — yes. Named owner — yes. Artifact link — yes. Disclaimer — do I need to add this manually or does it appear automatically?" | Conscientious, slightly anxious | Governance enforcement may be opaque — Catalina doesn't know which fields are blocking until she hits an error state | System surfaces a pre-publish checklist showing which required fields are complete (green) and which are missing (red) before any state transition; Catalina can see gaps proactively rather than discovering them on submit |
| Advance to Review | Resolves any missing fields; advances record to "Review" state; assigns a peer reviewer | Publication Lifecycle (F8) | "I'm assigning this to the technical lead for a quick sanity check before we publish." | Confident in the process | Peer review assignment may require an external email or ad-hoc message if the admin interface doesn't support internal reviewer assignment | Review state generates a notification to the assigned reviewer (or triggers a routing email); Catalina doesn't need to send a separate message |
| Advance to Published | Peer reviewer approves; Catalina advances record to "Published" | Publication Lifecycle (F8) | "This is now live. Let me do a quick spot-check on the public record to confirm the trust disclaimers are rendering correctly." | Satisfied, quality-checking | Trust disclaimers may not render visibly enough on the published page; Catalina's spot-check is the last line of defense | Admin interface includes a "Preview as public user" option so Catalina can verify how the published record will appear before confirming the transition |
| Post-Publication Update | Three months later: advances review status from "Curated" to "Technically Reviewed" after an I&R technical assessment is completed | Record Editor (F8), F9 | "The technical review is done. I need to update the review status without creating a new record. And I want the audit trail to reflect this change." | Procedural, compliance-aware | Updating a published record without triggering an unintended state change or losing the audit history | Admin interface tracks material changes (including review status updates) with timestamp and actor; status update is a single controlled field change, not a record recreation |

#### Key Moments
- **Decision Point:** Enforce Governance stage — the system's governance check is the mechanism that prevents trust model failures. If the checklist is not shown proactively, and errors only surface on submit, Catalina loses trust in the system's reliability.
- **Risk of Abandonment:** Author Record stage — if the admin interface does not support mid-session saves, a single browser interruption could lose 45 minutes of authoring work. Auto-save or explicit "Save Draft" is critical.
- **Delight Opportunity:** Advance to Published — a "Preview as public user" option that shows Catalina exactly how stakeholders will see the record (including trust disclaimers) before it goes live transforms publication from anxiety-inducing to confidence-building.

#### Success Outcome
Catalina creates and publishes a complete, governance-compliant innovation record from scratch in under 60 minutes, with the governance enforcement system preventing any required field from being skipped. The audit history captures the post-publication review status update (JTBD-05.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Access Admin | F8 (Curation Admin — Create Record) |
| Author Record | F8, F2 (Record fields), F9 (maturity/review inline definitions) |
| Enforce Governance | F8 (governance checklist), F9 |
| Advance to Review | F8 (Publication Lifecycle) |
| Advance to Published | F8, F2 (published record preview) |
| Post-Publication Update | F8 (audit trail), F9 (review status update) |

---

### JRN-05.2: Submission Queue Review and Engagement Monitoring

**Persona:** PER-05 (Catalina Torres)
**Scenario:** It is Monday morning. Catalina logs into the admin interface to review the week's incoming submissions — two opportunity submissions (F5) and one contribution submission (F6) have arrived since Friday. After processing the queue, she checks the engagement activity log to see which records received requests over the past 30 days and routes a pending technical guidance request to the appropriate I&R engineer.
**Related Jobs:** JTBD-05.2, JTBD-05.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Open Submissions Queue | Logs in; navigates to the submissions queue in the admin interface | Admin Submissions Queue (F8, F5, F6) | "Three new submissions since Friday. Let me see what came in — are these opportunities or contributions?" | Alert, operational | Queue may mix F5 and F6 submissions without type labeling, requiring Catalina to open each one to identify it | Queue displays submission type (Opportunity / Contribution), submission date, submitting office, and contact name at the list level — Catalina triages without opening each record |
| Review Submissions | Opens each submission; reads problem descriptions; records disposition decisions (Accept for Curation / Decline / Pending) | Submission Detail (F8) | "The first two opportunities are well-described. I'll accept both for curation consideration. The contribution needs more artifact detail — I'll mark it pending and follow up with the submitter." | Engaged, decisive | No structured disposition field in current tooling means Catalina must track decisions in a separate spreadsheet | Admin interface provides a disposition selector (Accept / Decline / Pending) with a notes field per submission; Catalina records decisions without leaving the interface |
| Follow Up on Pending | Notes the contribution submission is marked "Pending"; copies the submitter's contact information to draft a follow-up request for missing artifact URLs | Submission Detail (F8, F6) | "I need to ask Marcus for the actual document URLs before I can create a record. Let me copy his email from the form." | Practical, slightly tedious | Contact information may not be easily copyable from a read-only submission detail view | Submitter contact info is a copyable field in the submission detail; Catalina sends a follow-up email with one click or copy |
| View Engagement Log | Navigates to the engagement activity log; filters by last 30 days; sorts by record | Engagement Activity Log (F8, F7) | "Which records are getting the most attention? Is there a pattern I should flag for the team's planning meeting?" | Analytical, strategic | Current tooling has no aggregate view — each engagement request arrives as an individual email; no rollup or pattern detection | Engagement log shows: request type, record name, requestor office, date, and routing status. Catalina can see at a glance that the Audio Security POC has received three technical guidance requests in 30 days — a signal worth raising with the team lead |
| Route Pending Request | Identifies one technical guidance request in the log with "Pending Routing" status; confirms the routing email is current; routes the request | Engagement Routing (F7, F8) | "This was routed to the old team email address. Let me verify the routing config is up to date — and if not, update it." | Attentive to operational detail | Routing email may be outdated; updating it currently requires a developer or a configuration file change | Routing email address is an admin-configurable field in the interface settings; Catalina updates it in under 2 minutes without filing a ticket or waiting for a developer |

#### Key Moments
- **Decision Point:** Review Submissions stage — Catalina's disposition decisions shape the curation pipeline. If the admin interface buries disposition options (e.g., only accessible after scrolling through a long form view), decisions accumulate and backlog grows.
- **Risk of Abandonment:** View Engagement Log stage — if the log requires manual construction (export to spreadsheet, pivot table, etc.), Catalina will stop using it within the first month and revert to email-based tracking.
- **Delight Opportunity:** Engagement Log stage — an at-a-glance view showing three technical guidance requests for a single record (the Audio Security POC) gives Catalina a data point to bring to the team planning meeting: "This record is generating significant interest — should we prioritize a follow-up security review?" This is the Hub working as a strategic tool, not just an operational one.

#### Success Outcome
Catalina reviews all new submissions and records dispositions in a single admin session without leaving the interface. She views the 30-day engagement log, identifies the high-interest record, routes a pending request, and updates the routing email address — all in under 30 minutes total (JTBD-05.2 and JTBD-05.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Open Submissions Queue | F8 (Admin Queue), F5, F6 |
| Review Submissions | F8 (Submission Detail, disposition field) |
| Follow Up on Pending | F8, F6 (submitter contact info) |
| View Engagement Log | F8, F7 (Engagement Activity Log) |
| Route Pending Request | F7 (routing config), F8 (admin settings) |

---

## Cross-Journey Patterns

### Common Pain Points

- **No discovery surface before the Hub:** PER-01, PER-02, and PER-03 all arrive from informal channels (a colleague's email, a verbal mention, a director's ask). The Hub's first interaction for each of these personas must work for a first-time visitor with no prior orientation. This implies: fast-loading catalog, clear purpose statement on landing, and search that covers problem-language not just project names.
- **Fear of misrepresenting maturity:** PER-01 (JRN-01.1), PER-02 (JRN-02.1), and PER-03 (JRN-03.1) all share an anxiety about citing or recommending work that is less mature than it appears. Trust signals (maturity badges, review status indicators, trust disclaimers) must be visually prominent on every record and catalog card — not tucked into metadata sections.
- **Engagement form friction:** PER-01 (JRN-01.1 Act), PER-02 (JRN-02.1 Request Engagement), and PER-03 (JRN-03.2 Open Request Form) all pass through an engagement routing form. Across all three journeys, the critical risk is: form requires information the system already has (record ID, record title). Pre-populating the record reference is a shared opportunity with disproportionate impact.
- **Empty-state dead-ends:** PER-01 (JRN-01.2 Recognize Need) and PER-02 (JRN-02.2 Search No Results) both reach a "no results" search state. Without a call-to-action in that empty state, both journeys end at zero value. The F5 submission link from the empty-state is a shared resolution point.

### Shared Opportunities

- **Pre-populated engagement forms:** All engagement requests (JRN-01.1, JRN-02.1, JRN-03.2) benefit from record reference pre-population. Implement once in F7; benefit flows to PER-01, PER-02, and PER-03 simultaneously.
- **Inline governance definitions:** PER-05 (JRN-05.1 Author Record) needs maturity and review status definitions inline in the admin interface. These same definitions should be surfaced as tooltips on catalog cards and record pages for PER-01 and PER-02, who also need plain-language explanations of what "Technically Reviewed" vs. "Validated for Reuse" actually means.
- **Trust signal placement:** Maturity level and review status must appear at the top of every record and on every catalog card. This serves PER-01 (assessing maturity quickly), PER-02 (filtering by readiness), PER-03 (identifying security review gaps), and PER-05 (verifying published state). A single placement decision serves all five personas.
- **"Save Draft" capability in F8:** PER-05 (JRN-05.1 Author Record) depends on mid-session saves. Any records authored by PER-05 will be consumed downstream by PER-01, PER-02, and PER-03 — quality assurance in the authoring flow has a multiplier effect on consuming persona experiences.

### Convergence Points

- **Innovation Record page (F2):** PER-01, PER-02, and PER-03 all converge on the same Innovation Record page, but with different primary sections (Executive Perspective, reuse guidance, Technical Perspective respectively). The record layout must serve all three personas in a single page design — tab/section navigation is critical so each persona finds their primary content without scrolling past irrelevant material.
- **Engagement Routing form (F7):** PER-01 (briefing/demo request), PER-02 (adoption discussion request), and PER-03 (technical guidance request) all submit engagement requests through F7. The form must handle all three request types with appropriate fields for each type while maintaining a single routing and tracking mechanism that PER-05 monitors.
- **Submission confirmation messaging:** PER-02 (JRN-02.2), PER-03 (JRN-03.2), and PER-04 (JRN-04.1) all read a submission confirmation as the final step of their journey. This confirmation message is the last word the Hub has with each of these personas; it must set accurate expectations, provide a citable reference, and signal that the submission is tracked — not lost.

---

## Journey-to-JTBD Traceability

| Journey Stage | JTBD ID | Expected Outcome |
|--------------|---------|-----------------|
| JRN-01.1: Browse | JTBD-01.1 | Maturity and review status visible on catalog cards without clicking through |
| JRN-01.1: Read | JTBD-01.1 | Decision-maker determines relevance and maturity in under 5 minutes via Executive Perspective |
| JRN-01.1: Act | JTBD-01.3 | Briefing request submitted from record page in under 3 minutes with trackable confirmation |
| JRN-01.2: Recognize Need | JTBD-01.2 | Empty-state search surfaces F5 pathway so mission problem is not lost |
| JRN-01.2: Submit | JTBD-01.2 | Mission problem submitted in under 5 minutes; confirmation sets accurate expectations |
| JRN-02.1: Search | JTBD-02.1 | Problem-language search returns relevant records without requiring project-name knowledge |
| JRN-02.1: Filter | JTBD-02.1 | Maturity and reuse-potential filters narrow results to actionable records |
| JRN-02.1: Read Record | JTBD-02.2 | Reuse guidance provides court-specific adoption considerations from the record alone |
| JRN-02.1: Assess Readiness | JTBD-02.2 | Incomplete security review is visibly flagged; stakeholder cannot misread status |
| JRN-02.1: Request Engagement | JTBD-02.2 | Adoption discussion initiated from record in under 3 minutes with pre-populated record reference |
| JRN-02.2: Search (No Results) | JTBD-02.1 | Empty state provides F5 CTA so empty search results generate value rather than dead-ends |
| JRN-02.2: Submit | JTBD-02.1 | Mission problem submitted in under 5 minutes; potential follow-up engagement committed |
| JRN-03.1: Read Technical Perspective | JTBD-03.1 | Architecture, dependencies, security constraints accessible from a single structured Technical Perspective view |
| JRN-03.1: Follow Artifact Links | JTBD-03.1 | Artifact links open in new tab with type labels; Hub context preserved |
| JRN-03.1: Synthesize Assessment | JTBD-03.1 | Reuse guidance includes court-environment-specific notes; feasibility assessment completes in one session |
| JRN-03.2: Open Request Form | JTBD-03.2 | Technical guidance request form pre-populated with record reference; no re-entry required |
| JRN-03.2: Submit Request | JTBD-03.2 | Targeted guidance request submitted in under 3 minutes; confirmation citable in feasibility report |
| JRN-04.1: Orient | JTBD-04.1 | Community-contributed label and attribution field visible on catalog cards before submission |
| JRN-04.1: Complete Submission | JTBD-04.1 | Contribution form completed in a single session with problem-first guidance reducing ambiguity |
| JRN-04.1: Submit and Receive Confirmation | JTBD-04.1 | Confirmation explicitly states curation review is required; publication is not automatic |
| JRN-04.1: View Published Record | JTBD-04.2 | Published record displays contributing team name and office in dedicated attribution field; discoverable via search |
| JRN-05.1: Author Record | JTBD-05.1 | All required governance fields authored in admin interface with inline definitions; draft-save supported |
| JRN-05.1: Enforce Governance | JTBD-05.1 | Pre-publish checklist surfaces missing required fields proactively; no surprise errors on state transition |
| JRN-05.1: Advance to Published | JTBD-05.1 | Record published in under 60 minutes; "Preview as public user" verifies trust disclaimer rendering |
| JRN-05.1: Post-Publication Update | JTBD-05.1 | Review status update tracked in audit history with timestamp and actor; no record recreation required |
| JRN-05.2: Review Submissions | JTBD-05.2 | Disposition recorded per submission without leaving the admin interface; zero email dependency |
| JRN-05.2: View Engagement Log | JTBD-05.3 | 30-day engagement log viewable by record and request type; high-interest patterns identifiable at a glance |
| JRN-05.2: Route Pending Request | JTBD-05.3 | Routing email address updated in admin settings in under 2 minutes without developer involvement |

---

*TSIO Innovation Hub — JOURNEYS Document | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-29*
*Powered by Pivota Spec Framework*
