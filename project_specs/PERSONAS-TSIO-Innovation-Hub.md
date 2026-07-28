# PERSONAS: TSIO Innovation Hub

**Document Type:** Persona Profiles  
**Project Acronym:** TSIO-Innovation-Hub  
**Related PRD:** PRD-TSIO-Innovation-Hub.md  
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch  
**Date:** 2026-07-28  
**Status:** Active  

---

## Table of Contents

1. [Persona Summary](#persona-summary)
2. [PER-01: Decision-Maker](#per-01-decision-maker)
3. [PER-02: Operational Leader](#per-02-operational-leader)
4. [PER-03: Technical Adopter](#per-03-technical-adopter)
5. [PER-04: Innovation Contributor](#per-04-innovation-contributor)
6. [PER-05: I&R Curator](#per-05-ir-curator)
7. [Persona Relationships](#persona-relationships)
8. [Feature-Persona Matrix](#feature-persona-matrix)

---

## Persona Summary

| ID | Name | Role | Primary Goal |
|---|---|---|---|
| **PER-01** | Margaret Hollis | Executive / Senior Leadership | Determine whether an innovation effort warrants investment or adoption consideration, with confidence in what she's looking at |
| **PER-02** | David Reyes | Court Administrator / Mission Owner | Find out if I&R has already tackled a problem his court faces, and know the concrete next step to explore adoption |
| **PER-03** | Priya Nair | Court IT Staff / Developer | Understand the technical architecture and constraints of a prior innovation effort before deciding whether to adapt it |
| **PER-04** | Marcus Webb | Court Team / External Team Lead | Share innovation work his team has done so it can benefit the broader Judiciary — through a governed, attributed pathway |
| **PER-05** | Catalina Torres | TSIO I&R Team Member / Curator | Author, govern, and maintain high-quality innovation records across their full lifecycle, and track stakeholder engagement |

---

## PER-01: Decision-Maker

**PRD Source:** P1 — Executive / Senior Leadership

**Role & Context:**
Margaret Hollis is a senior official at the Administrative Office — a court executive or senior AO leader who owns mission delivery and resource decisions affecting courts across the Judiciary. She is not a technologist; she is accountable for outcomes. Her time is constrained, her briefings are dense, and her tolerance for ambiguity is low in high-stakes contexts. She hears about innovation work through informal channels — a conversation at a leadership meeting, a cc on an email thread, a reference in a briefing deck — but has no authoritative place to go to evaluate it. When she does receive an artifact, it is typically a raw technical document that requires someone else to interpret for her. She needs to know whether a given innovation effort is relevant to a problem she owns, what level of confidence she can place in the findings, and whether further investment or adoption conversation is warranted.

**Goals:**
- Understand whether an innovation effort is relevant to a mission problem she owns, without reading raw technical output (F2, F3)
- Receive a clear signal on maturity and review status — what stage is this work at, and has it been appropriately reviewed? (F9, F3)
- Read an executive-appropriate framing that contextualizes the innovation in terms of mission impact (F3)
- Submit a mission problem for I&R consideration when she identifies a gap (F5)
- Request a briefing or demo through a clear, structured mechanism (F7)

**Pain Points:**
- Receives raw technical artifacts with no leadership framing or interpretation
- Hears about innovation work only through informal channels — no authoritative, structured reference
- Cannot distinguish between a deployed production tool, an early-stage POC, and an archived experiment without asking someone
- No mechanism to formally surface a mission problem to I&R for consideration

**Technical Expertise:** Low — comfortable with web portals, document access, and structured summaries; avoids technical implementation language

**Top Tasks:**
1. Browse or search the Innovation Catalog to find work relevant to a known mission problem (F0, F1) — *occasional, high-stakes*
2. Read the Executive Perspective on an Innovation Record to assess relevance and maturity (F3) — *per visit, high priority*
3. Request a briefing or demo on a record of interest via the engagement routing form (F7) — *as needed, high value*
4. Submit a mission problem or opportunity for I&R consideration (F5) — *as needed, strategic*

**Success Criteria:**
- Can assess the maturity and relevance of an innovation record without reading technical implementation detail
- Can submit a mission problem in under 5 minutes via a structured, problem-first form
- Can cite a Hub record in a briefing or decision with confidence in the accuracy and review status it reflects
- Zero incidents of misinterpreting a POC-level result as production-ready

---

## PER-02: Operational Leader

**PRD Source:** P2 — Court Administrator / Mission Owner

**Role & Context:**
David Reyes is the IT director or court administrator at a district court, responsible for mission delivery in his local environment. He operates at the intersection of technology and operations — evaluating tools, managing modernization efforts, and fielding questions from court leadership about what solutions exist for operational problems. He is more technically grounded than a senior executive but is not a developer; he evaluates feasibility and risk, not architecture diagrams. David's persistent frustration is discovering, often by accident, that I&R already explored a problem his court was independently trying to solve — months or years later. He has no way to search by problem area, no visibility into I&R's work portfolio, and no clear process for initiating an adoption conversation even when he does stumble upon relevant work. When he finds something promising, he does not know if it is safe to act on, or who to contact.

**Goals:**
- Discover whether I&R has already worked on a problem his court is facing, by searching in mission problem terms (F1, F0)
- Understand the practical readiness of an innovation effort — what is working, what is not, what local review would be required (F2, F9)
- Filter by maturity level and reuse potential to surface only work relevant to near-term decisions (F0, F1)
- Identify the concrete next step: request an adoption discussion or technical guidance through a clear mechanism (F7)
- Submit a mission problem for I&R consideration when no relevant work exists yet (F5)

**Pain Points:**
- Unaware of I&R innovation work until encountering it informally; no discovery surface
- Cannot search by mission problem — would need to know the project name or team to find existing work
- Even when relevant work is found, the next action is unclear: who do I contact, and how?
- Cannot assess local adoption risk from existing raw artifacts — no reuse guidance, no security or performance summary

**Technical Expertise:** Intermediate — comfortable evaluating technical summaries, risk profiles, and implementation feasibility; does not work at code or architecture level

**Top Tasks:**
1. Search the catalog by mission problem or technology area to find relevant prior work (F1, F0) — *as needed, high priority*
2. Filter catalog by maturity level and reuse potential to narrow to actionable records (F0) — *per search, medium effort*
3. Read the full Innovation Record including reuse guidance, maturity, and review status (F2, F9) — *per record, critical*
4. Request an adoption discussion or technical guidance via engagement routing (F7) — *as needed, high value*
5. Submit a mission problem for I&R consideration if no relevant work exists (F5) — *as needed, strategic*

**Success Criteria:**
- Can find innovation work relevant to a specific mission problem without knowing the project name or team
- Can determine, from the record alone, whether a given effort is worth pursuing an adoption conversation
- Can initiate an adoption discussion or technical guidance request in under 3 minutes
- No longer discovers relevant I&R work months after the fact through informal channels

---

## PER-03: Technical Adopter

**PRD Source:** P3 — Court IT Staff / Developer

**Role & Context:**
Priya Nair is a court-level IT professional or developer — an architect, systems engineer, or senior developer evaluating whether and how to adapt I&R innovation work for her court's local environment. She is highly technical and values specificity: architecture decisions, dependency lists, known security constraints, performance caveats, and infrastructure requirements. She is often asked by operational leadership to evaluate the feasibility of a tool or approach she has not personally seen before. Her current frustration is that technical detail — when it exists at all — is buried in unstructured documents that require significant time to parse, and that critical findings like "requires GPU/CPU separation" or "Azure Government Cloud has these limitations" are scattered or missing entirely. When she can access technical content, it often lacks the structured rigor she needs to make a credible recommendation.

**Goals:**
- Access the Technical Perspective on an Innovation Record, including architecture, tools, dependencies, and security findings (F3, F2)
- Understand the security, performance, and compliance constraints discovered during the effort (F3, F9)
- Access artifact links — architecture diagrams, code repositories, test results — for deeper evaluation (F2)
- Assess what local adaptation work would be required before adoption in her environment (F2, F3)
- Request technical guidance from the I&R team for a specific record (F7)

**Pain Points:**
- Technical findings are buried in unstructured documents with no consistent schema
- Architecture decisions, dependency lists, and infrastructure constraints are not captured in a discoverable way
- No consistent record of known gaps, limitations, or security considerations
- Cannot link from a summary-level finding back to the supporting technical artifact without significant search effort

**Technical Expertise:** High — works at code, architecture, and infrastructure level; evaluates security posture, dependency trees, and deployment constraints directly

**Top Tasks:**
1. Search or browse the catalog to identify records relevant to a technical problem or technology area (F1, F0) — *as needed, high priority*
2. Read the Technical Perspective on an Innovation Record including architecture, tools, and security findings (F3) — *per record, critical*
3. Follow artifact links to source documents, code repositories, and architecture diagrams (F2) — *per record, high value*
4. Assess reuse guidance to determine local adaptation scope (F2, F3) — *per record, medium effort*
5. Request technical guidance from I&R for hands-on evaluation (F7) — *as needed, high value*

**Success Criteria:**
- Can identify all key technical constraints and dependencies of an innovation effort from the Hub record without hunting through raw documents
- Can determine within a single session whether an effort is technically feasible in her environment
- Can access supporting technical artifacts directly from the record
- Can initiate a technical guidance request in under 3 minutes

---

## PER-04: Innovation Contributor

**PRD Source:** P4 — Court Team / External Team

**Role & Context:**
Marcus Webb leads a technology or modernization team at a district court or AO office outside TSIO I&R. His team has conducted their own innovation work — a proof of concept, a pilot deployment, a technical evaluation — that addressed a real mission problem and generated findings that may be valuable to other courts. Marcus wants to share that work with the broader Judiciary but faces a structural barrier: there is no governed pathway. Informal sharing through email or conversations does not reach the right people, does not attribute his team's contribution, and does not produce a discoverable institutional record. Marcus does not want to bypass I&R's governance; he wants a credible, structured mechanism that ensures the work is properly represented and his team receives attribution.

**Goals:**
- Submit existing innovation work through a governed, structured pathway for I&R curation review (F6)
- Provide supporting context and artifact locations so curators can create an accurate, high-quality record (F6, F2)
- Have his team's contribution attributed on the published record (F6, F2)
- Understand that submission enters a curation workflow and publication is not automatic (F6)
- Browse the catalog to understand what kinds of records exist and what the contribution process produces (F0)

**Pain Points:**
- No governed pathway to share court-level innovation work with the broader Judiciary
- Informal sharing through email or ad-hoc channels does not reach the right stakeholders
- No attribution mechanism — team's work disappears into unstructured institutional memory
- Uncertainty about whether submitted work will be published, how it will be represented, and by whom

**Technical Expertise:** Intermediate to high — capable of providing artifact locations, technical summaries, and outcome descriptions; familiar with technical documentation

**Top Tasks:**
1. Browse the Innovation Catalog to understand what published records look like and what contribution produces (F0) — *once, orientation*
2. Complete the structured contribution submission form with work description, problem addressed, outcome summary, and artifact links (F6) — *one-time, high effort*
3. Receive confirmation that submission has entered curation review and understand what to expect next (F6) — *post-submission, critical*
4. View the published record once it is live to confirm attribution and representation accuracy (F2) — *post-publication, high value*

**Success Criteria:**
- Can submit innovation work through a structured, unambiguous form in a single session
- Receives explicit confirmation that submission is under curation review, not automatically published
- Team receives named attribution on the published record
- Published record accurately represents the team's work and is discoverable via search

---

## PER-05: I&R Curator

**PRD Source:** P5 — TSIO Innovation & Research Team Member

**Role & Context:**
Catalina Torres is a member of the TSIO Innovation & Research team responsible for the full governance lifecycle of innovation records on the Hub. She creates records from scratch for I&R-conducted work, enriches and structures incoming contributions from external teams, assigns maturity levels and review statuses based on the defined models, and manages the publication lifecycle from draft through archived. She is also the primary monitor of stakeholder engagement — tracking which records are receiving requests, of what type, and routing those requests to the right team members. Her current reality is managing all of this across SharePoint folders, email threads, and team memory with no dedicated tooling, no structured metadata, no publication state, and no engagement tracking. She needs an administration interface that reduces curation effort, enforces governance requirements before publication, and provides a clear operational picture of the Hub's content and engagement.

**Goals:**
- Create and maintain structured, high-quality innovation records with all required governance fields (F8, F2)
- Manage the full publication lifecycle (Draft → Review → Published → Superseded → Archived) from a single interface (F8)
- Ensure governance requirements are enforced before publication — no record goes live without the required fields (F8, F9)
- Review and process incoming opportunity submissions (F5) and innovation contribution submissions (F6) (F8)
- Track engagement activity: which records are receiving requests, what type, and from which offices (F7, F8)
- Assign maturity levels and review statuses consistently using the defined models (F9, F8)
- Configure engagement routing without requiring a code deployment (F7, F8)

**Pain Points:**
- No dedicated tool for governing innovation records — currently managed across SharePoint, email, and team memory
- No structured metadata schema — records lack consistent fields, making search and filtering impossible
- No publication lifecycle — no way to track which records are draft vs. review-ready vs. published
- No engagement tracking — no visibility into what stakeholders are engaging with or requesting
- No governance enforcement — records can be shared without required fields, undermining trust model

**Technical Expertise:** Intermediate — comfortable with structured web-based administration interfaces, form-based workflows, and metadata management; does not require developer-level tooling

**Top Tasks:**
1. Create a new Innovation Record from scratch, populating all required fields including maturity, review status, and artifact links (F8, F2) — *per record, high effort*
2. Advance a record through the publication lifecycle from Draft to Published, with governance enforcement at each stage (F8) — *per record, critical*
3. Review incoming opportunity submissions (F5) and contribution submissions (F6) and determine disposition (F8) — *regular cadence, high priority*
4. View the engagement activity log to see which records are receiving requests and of what type (F7, F8) — *weekly, monitoring*
5. Create a structured Innovation Record linked to an existing lessons-learned document without relocating the source (F4, F2) — *per legacy record, medium effort*
6. Update maturity level or review status on a published record after new information is available (F8, F9) — *as needed, governance-critical*

**Success Criteria:**
- Can create and publish a complete innovation record in under 60 minutes
- Publication lifecycle (Draft → Published) for a well-documented effort completes in under 5 business days
- System prevents publication of any record missing required governance fields — zero exceptions
- Engagement requests are tracked and routed without manual forwarding through email threads
- Can update engagement routing email address without a code deployment
- Incoming submissions from F5 and F6 are visible in the admin interface within minutes of submission

---

## Persona Relationships

| Persona | Interacts With | Nature of Interaction |
|---|---|---|
| **PER-01** Decision-Maker | PER-05 I&R Curator | Receives engagement routing responses; may submit opportunity via F5 that PER-05 reviews |
| **PER-01** Decision-Maker | PER-02 Operational Leader | Organizational hierarchy; may direct PER-02 to investigate adoption of a Hub record |
| **PER-02** Operational Leader | PER-05 I&R Curator | Initiates adoption discussion via F7; PER-05 receives and routes the engagement request |
| **PER-02** Operational Leader | PER-03 Technical Adopter | Asks PER-03 to evaluate technical feasibility of a record before committing to adoption discussion |
| **PER-03** Technical Adopter | PER-05 I&R Curator | Submits technical guidance request via F7; PER-05 routes to appropriate I&R technical contact |
| **PER-04** Innovation Contributor | PER-05 I&R Curator | Submits work via F6; PER-05 curates the record, assigns governance metadata, and publishes |
| **PER-05** I&R Curator | All personas | Creates and maintains records that all other personas consume; routes all engagement requests |

---

## Feature-Persona Matrix

**Legend:** **P** = Primary user (feature designed for this persona's core workflow) · **S** = Secondary user (feature benefits this persona, not their primary workflow) · **—** = Not applicable

| Feature | PER-01 Decision-Maker | PER-02 Operational Leader | PER-03 Technical Adopter | PER-04 Innovation Contributor | PER-05 I&R Curator |
|---|:---:|:---:|:---:|:---:|:---:|
| **F0** Innovation Catalog | **P** | **P** | **P** | S | **P** |
| **F1** Search and Discovery | **P** | **P** | **P** | — | S |
| **F2** Innovation Record | **P** | **P** | **P** | S | **P** |
| **F3** Executive and Technical Perspectives | **P** | S | **P** | — | S |
| **F4** Existing Lessons-Learned Integration | S | S | S | — | **P** |
| **F5** Opportunity Submission | **P** | **P** | — | — | S |
| **F6** Share Existing Innovation Work | — | — | — | **P** | **P** |
| **F7** Engagement Routing | **P** | **P** | **P** | — | **P** |
| **F8** Curation and Administration | — | — | — | — | **P** |
| **F9** Content, Maturity & Trust Model | S | S | S | — | **P** |

**Matrix notes:**
- F0 is the entry surface for all consuming personas (PER-01 through PER-03); PER-05 uses it to verify published state
- F3 (Executive/Technical Perspectives) is the primary differentiated value for PER-01 and PER-03 specifically
- F6 and F8 are the only features where PER-04 and PER-05 share Primary designation — this is the contribution intake workflow
- F9 (Content, Maturity & Trust Model) is foundational infrastructure surfaced to all consuming personas; PER-05 owns its governance application
- PER-04 has no Primary features that require authentication — contribution (F6) is the sole governed pathway for this persona

---

*TSIO Innovation Hub — PERSONAS Document | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-28*
