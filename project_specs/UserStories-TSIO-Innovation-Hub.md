# User Stories
## TSIO Innovation Hub

| Field | Value |
|-------|-------|
| **Product Name** | TSIO Innovation Hub |
| **Project Acronym** | TSIO-Innovation-Hub |
| **Date** | 2026-07-29 |
| **Related PRD** | PRD-TSIO-Innovation-Hub.md |
| **Related FRD** | FRD-TSIO-Innovation-Hub.md |
| **Related Personas** | PERSONAS-TSIO-Innovation-Hub.md |

---

## Story Format

Each story follows: **As a [persona], I want to [action], so that [outcome].**

Acceptance criteria are listed beneath each story. Stories are grouped by epic and prioritised.

**Personas:**
- **Margaret Hollis** — Decision-Maker / Executive / Senior Leadership (PER-01)
- **David Reyes** — Operational Leader / Court Administrator (PER-02)
- **Priya Nair** — Technical Adopter / Court IT Staff (PER-03)
- **Marcus Webb** — Innovation Contributor / Court Team Lead (PER-04)
- **Catalina Torres** — I&R Curator / TSIO Team Member (PER-05)

---

## Epic 0: Innovation Catalog (F0)

### US-0.1: Browse Published Innovation Records
**As a** Margaret Hollis, **I want to** browse a paginated catalog of all published innovation records, **so that** I can quickly orient to the landscape of I&R work without needing to know specific project names.

**Acceptance Criteria:**
- [ ] Catalog page renders at the Hub root URL (`/`) and `/catalog` with all published records displayed in a card layout
- [ ] Each card displays: title, short summary, maturity level badge (with color coding), review status badge, mission area tags, technology area tags, engagement indicators, and publication date
- [ ] Default sort is Most Recent (published_at DESC); user can switch to Maturity or Relevance
- [ ] Catalog paginates at 12 cards per page (default); pagination controls (previous/next, page numbers) are visible
- [ ] Only records with `publication_state = PUBLISHED` are shown to non-authenticated users
- [ ] Catalog loads within 3 seconds under normal load

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Filter Catalog by Metadata
**As a** David Reyes, **I want to** filter the catalog by maturity level, review status, mission area, technology area, contributing office, and reuse potential, **so that** I can quickly surface only the records most relevant to my court's near-term decisions.

**Acceptance Criteria:**
- [ ] Filter panel is visible on the catalog page with controls for: maturity level (multi-select), review status (multi-select), contributing office (multi-select), mission area (multi-select), technology area (multi-select), reuse potential
- [ ] Applying a filter re-renders the catalog without a full page reload
- [ ] Active filters are summarized visibly above the results; each active filter can be individually cleared
- [ ] Invalid filter values are silently ignored and stripped from the URL
- [ ] When zero records match active filters, an empty-state message is shown with a CTA to submit a mission problem (F5)
- [ ] Filter state is reflected in the URL so filtered views can be bookmarked and shared

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Identify Community and Reuse-Validated Records
**As a** David Reyes, **I want to** see at a glance which records were contributed by teams outside I&R and which have been validated for reuse, **so that** I can assess the source and adoption readiness of a record before clicking through.

**Acceptance Criteria:**
- [ ] A "Community" badge is displayed on catalog cards where `source_type = COMMUNITY`
- [ ] A "Validated for Reuse" badge (Reuse Badge) is displayed on catalog cards where `review_status = VALIDATED_FOR_REUSE`
- [ ] Engagement indicators (e.g., "Demo Available," "Adoption Discussion Available") are visible on each card showing what next actions are configured
- [ ] I&R-conducted records carry no community badge; the visual distinction between source types is unambiguous

**Priority:** P0 | **Feature Ref:** F0, F9

---

### US-0.4: Curator Reviews All Records Regardless of Publication State
**As a** Catalina Torres, **I want to** see all innovation records in the catalog (including Draft and In Review states), **so that** I can verify publication state and quickly identify which records are visible to the public.

**Acceptance Criteria:**
- [ ] Authenticated curators see all records in the catalog regardless of `publication_state`
- [ ] Draft and Review-state records are labeled with their state ("DRAFT," "IN REVIEW") on the card
- [ ] Draft and Review-state cards are not accessible via direct URL by PUBLIC users (returns 404)
- [ ] Curators can link directly to a non-published record from the admin interface to verify its presentation

**Priority:** P0 | **Feature Ref:** F0, F8

---

## Epic 1: Search and Discovery (F1)

### US-1.1: Search by Mission Problem
**As a** David Reyes, **I want to** search the Hub using natural language to describe a mission problem my court is facing, **so that** I can find relevant innovation records without knowing the project name, team, or document location.

**Acceptance Criteria:**
- [ ] A search field is accessible from the Hub navigation bar on all pages and from the catalog page
- [ ] Search executes against problem statements, key findings, what was explored, outcome summaries, titles, tags, and summaries with weighted relevance (problem statements and key findings weighted higher)
- [ ] Results are returned ranked by relevance; ties broken by `published_at DESC`
- [ ] Each result card displays: title, short summary snippet with query terms highlighted, maturity level badge, review status badge, mission/technology area tags, and engagement indicators
- [ ] Search is scoped to Published records for PUBLIC users
- [ ] Search results are accessible via direct URL with query parameters (`/search?q=...`) for bookmarking and sharing

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Filter Search Results
**As a** Priya Nair, **I want to** refine search results by maturity level, review status, contributing office, and reuse potential, **so that** I can narrow results to records that are technically relevant and at an appropriate stage for evaluation.

**Acceptance Criteria:**
- [ ] Filter panel is available on the search results page with controls for maturity level, review status, contributing office, and reuse potential
- [ ] Re-applying filters re-executes the search and re-renders results without a full page reload
- [ ] Active filters and the query string are both reflected in the URL
- [ ] Invalid filter values are silently ignored
- [ ] Total result count updates when filters are applied

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Receive Guidance When No Results Are Found
**As a** Margaret Hollis, **I want to** receive clear guidance when my search returns no results, **so that** I understand I can submit the problem for I&R consideration rather than assuming no work exists.

**Acceptance Criteria:**
- [ ] When a valid query returns zero results, the empty-state message reads: "No records found for '[query]'. Try different keywords, or submit a mission problem for I&R consideration."
- [ ] The empty-state message includes a direct CTA link to the Opportunity Submission form (F5)
- [ ] A blank or whitespace-only query does not execute a search; the system prompts the user to enter a search term
- [ ] A query exceeding 500 characters returns an inline error: "Your search query is too long. Please shorten it to 500 characters or fewer."

**Priority:** P0 | **Feature Ref:** F1, F5

---

## Epic 2: Innovation Record (F2)

### US-2.1: View a Full Innovation Record
**As a** Margaret Hollis, **I want to** open a full Innovation Record from the catalog, **so that** I can understand what problem was addressed, what was explored, what was learned, and what I should do next — without reading raw technical documents.

**Acceptance Criteria:**
- [ ] Clicking a catalog card or search result navigates to `/records/{record_id}` and renders the full Innovation Record
- [ ] The record displays: title, problem statement, what was explored, outcome summary, key findings, maturity level, review status, reuse guidance, owner/steward name and office, contributing office, artifact links, last-reviewed date
- [ ] Artifact links open in a new tab; no artifact content is embedded or hosted on the Hub
- [ ] Trust disclaimers are rendered in a visible "Trust & Limitations" section before the Next-Action panel
- [ ] A perspective toggle (Executive / Technical view) is visible on the record page
- [ ] Non-published records return 404 when accessed directly by PUBLIC users

**Priority:** P0 | **Feature Ref:** F2, F9

---

### US-2.2: Curator Creates a New Innovation Record
**As a** Catalina Torres, **I want to** create a new Innovation Record in Draft state from the admin interface, **so that** I can structure and govern innovation work before it is visible to stakeholders.

**Acceptance Criteria:**
- [ ] Admin interface provides a "New Innovation Record" action that creates a record in `DRAFT` state with a system-generated ID and created_at timestamp
- [ ] All structured fields defined in the FRD (title, problem statement, what was explored, outcome summary, key findings, maturity level, review status, reuse potential, owner, contributing office, source type, mission area tags, artifact links, engagement options, executive perspective text, executive recommendation, last-reviewed date) are available in the creation form
- [ ] Curator can save a draft at any time without all pub-required fields being complete
- [ ] Field-level validation errors are shown inline (e.g., title too short, artifact URL not a valid HTTPS URL)
- [ ] A complete record can be created and published in under 60 minutes for a well-documented effort

**Priority:** P0 | **Feature Ref:** F2, F8

---

### US-2.3: Curator Advances a Record Through the Publication Lifecycle
**As a** Catalina Torres, **I want to** advance a record from Draft through Review to Published with governance enforcement at each step, **so that** no record is made public without all required governance fields being present.

**Acceptance Criteria:**
- [ ] "Submit for Review" transitions a record from `DRAFT` to `REVIEW`; if any pub-required field is missing, the system lists all blocking fields and prevents the transition
- [ ] "Publish" transitions a record from `REVIEW` to `PUBLISHED`; governance gate re-validates all pub-required fields before accepting the transition
- [ ] On successful publication, `published_at` timestamp is set and the record immediately appears in the catalog and search
- [ ] Editing a Published record triggers a warning: "Editing will move this record to Review state and remove it from public view. Confirm to proceed."
- [ ] All state transitions are logged to the audit history with timestamp and curator identity

**Priority:** P0 | **Feature Ref:** F2, F8

---

### US-2.4: Curator Archives or Supersedes a Record
**As a** Catalina Torres, **I want to** mark a record as Superseded or Archived when it is no longer current, **so that** the Hub's institutional record remains accurate and stakeholders are not misled by outdated information.

**Acceptance Criteria:**
- [ ] Curator can mark any Published record as `SUPERSEDED`; system prompts for the `superseded_by_record_id` of the newer record
- [ ] If `superseded_by_record_id` references a non-existent record, the system returns an error: "The superseding record ID does not exist."
- [ ] Curator can mark any record as `ARCHIVED`; archived records are removed from the default catalog browse but remain accessible via direct URL with an "Archived" label
- [ ] Archiving is logged to the audit history
- [ ] Only Draft-state records may be permanently deleted via `DELETE /api/v1/records/{record_id}`; attempting to delete a non-Draft record returns 409 with message "Only Draft-state records may be deleted. To remove from public view, Archive this record instead." Published, Superseded, and Archived records are retained for institutional record integrity.

**Priority:** P0 | **Feature Ref:** F2, F8

---

### US-2.5: View Audit History for a Record
**As a** Catalina Torres, **I want to** view a chronological log of all material changes to an Innovation Record, **so that** I can track who changed what and when for governance and accountability purposes.

**Acceptance Criteria:**
- [ ] Audit history is accessible from the admin record detail view for every record
- [ ] Each audit entry shows: timestamp, curator name, field changed, old value, new value, and state transition (if applicable)
- [ ] State transitions (e.g., DRAFT → REVIEW, REVIEW → PUBLISHED) are included in the audit log
- [ ] Audit history is read-only; curators cannot edit or delete audit entries
- [ ] 100% of material changes to records are captured in the audit log

**Priority:** P0 | **Feature Ref:** F2, F8

---

## Epic 3: Executive and Technical Perspectives (F3)

### US-3.1: Read the Executive Perspective on an Innovation Record
**As a** Margaret Hollis, **I want to** read an executive-framed view of an Innovation Record that focuses on mission relevance and decision guidance, **so that** I can assess whether the effort warrants further investment without reading technical implementation detail.

**Acceptance Criteria:**
- [ ] The Executive Perspective is the default view when a record is opened (unless curator configured otherwise)
- [ ] Executive Perspective renders: executive perspective text (mission relevance framing), executive recommendation (decision guidance for senior leaders), maturity level and review status in plain language, reuse potential in plain language, trust disclaimers, and all engagement options
- [ ] The primary CTA in the Executive Perspective is "Request Briefing" or "Request Demo" (as configured per record)
- [ ] Deep technical implementation fields (architecture details, security findings, performance data) are not displayed in the Executive Perspective
- [ ] A "View Technical Details →" link is visible and switches to the Technical Perspective

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.2: Read the Technical Perspective on an Innovation Record
**As a** Priya Nair, **I want to** switch to the Technical Perspective on an Innovation Record to access architecture details, security findings, and reuse guidance, **so that** I can assess technical feasibility and what local adaptation would require.

**Acceptance Criteria:**
- [ ] A perspective toggle labeled "Executive View" and "Technical View" is always visible on the record page; it cannot be hidden
- [ ] Clicking "Technical View" re-renders the content area without a page reload showing: what was explored, technical perspective text (if populated), security findings, performance findings, reuse guidance, artifact links (with code repos and diagrams visually prominent), and technology area tags
- [ ] The primary CTA in the Technical Perspective is "Request Technical Guidance"
- [ ] If `technical_perspective_text` is empty, a placeholder message is shown: "Technical detail for this record is not yet available. Contact the I&R team for more information." — the toggle is still displayed
- [ ] Trust disclaimers are rendered identically in both perspectives
- [ ] A "View Executive Summary →" link is visible and switches back to the Executive Perspective
- [ ] The `?view=executive` or `?view=technical` query parameter allows direct linking to a specific perspective

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.3: Curator Authors Perspective-Specific Content
**As a** Catalina Torres, **I want to** author separate executive-framing text and optional technical-detail text on the same Innovation Record, **so that** both audience views are served from a single record without duplicate records drifting out of sync.

**Acceptance Criteria:**
- [ ] Record creation/edit form includes separate fields for: `executive_perspective_text` (50–3,000 chars, pub-required), `executive_recommendation` (50–1,000 chars, pub-required), `technical_perspective_text` (50–5,000 chars, optional), `security_findings` (optional), `performance_findings` (optional)
- [ ] Curator can set `default_perspective` to `EXECUTIVE` or `TECHNICAL` per record; defaults to `EXECUTIVE` if not set
- [ ] Both perspectives are derived from the same Innovation Record; no separate record entity exists for perspectives
- [ ] Publication gate requires `executive_perspective_text` and `executive_recommendation` to be present; technical perspective fields are optional

**Priority:** P1 | **Feature Ref:** F3, F2

---

## Epic 4: Existing Lessons-Learned Integration (F4)

### US-4.1: Curator Creates a Structured Record from an Existing Lessons-Learned Document
**As a** Catalina Torres, **I want to** create a full Innovation Record linked to an existing SharePoint lessons-learned document without relocating or modifying the source, **so that** the Hub makes existing I&R work discoverable and actionable while preserving the authoritative source document in place.

**Acceptance Criteria:**
- [ ] Curator can create a standard Innovation Record (F2) and add an artifact link of type `DOCUMENT` pointing to the external SharePoint URL of the source document
- [ ] The artifact link URL must be a valid absolute HTTPS URL; SharePoint URLs (e.g., `https://ao.sharepoint.com/sites/...`) are accepted
- [ ] The Hub stores only the URL and label; it does not crawl, index, copy, or cache the content of the linked document
- [ ] Key findings are entered manually by the curator as structured `key_findings` items (no automated extraction is performed or implied)
- [ ] The published record is discoverable via catalog (F0) and search (F1) based on the curator-authored problem statement, key findings, and tags — not by indexing the source document
- [ ] If the source document URL later becomes unreachable, the Innovation Record remains valid and published; the broken link is a content issue to be resolved at the next review cycle

**Priority:** P1 | **Feature Ref:** F4, F2

---

### US-4.2: Stakeholder Accesses Source Document from a Lessons-Learned Record
**As a** Priya Nair, **I want to** navigate directly to the original source document from a Hub record, **so that** I can access the full authoritative content when the structured record summary is not sufficient for my technical evaluation.

**Acceptance Criteria:**
- [ ] Artifact links are rendered in a dedicated section on the Innovation Record page
- [ ] Each artifact link displays a label and opens the external URL in a new tab
- [ ] The Hub clearly communicates that the link leads to an external authoritative source document (not Hub-hosted content)
- [ ] Multiple artifact links are supported per record; all are displayed
- [ ] The Audio Security POC lessons-learned record (MVP anchor) is published and includes the SharePoint URL as a DOCUMENT artifact link with key findings covering: GPU/CPU separation architecture, Azure Government Cloud constraints, performance/latency limitations, and production-readiness gaps

**Priority:** P1 | **Feature Ref:** F4, F2

---

## Epic 5: Opportunity Submission (F5)

### US-5.1: Submit a Mission Problem for I&R Consideration
**As a** Margaret Hollis, **I want to** submit a mission problem or innovation opportunity through a structured form, **so that** the I&R team is aware of a gap I've identified and can consider it for future innovation work.

**Acceptance Criteria:**
- [ ] A public-facing submission form is accessible at `/submit-opportunity` and via CTA links from the catalog, record pages, and search empty-state
- [ ] Form fields include: problem description (required, 50–3,000 chars, labeled "Describe the mission problem you are facing"), mission area (required), submitting office (required), submitter name (required), submitter email (required), submitter title (optional), urgency context (optional), known constraints (optional)
- [ ] Form uses problem-first field ordering and labeling; field labels and help text guide the submitter to describe the mission problem before proposing solutions
- [ ] CAPTCHA or equivalent anti-spam protection is required before submission is accepted
- [ ] On successful submission, an on-screen confirmation is displayed with explicit language: "Your submission has been received. This submission does not imply acceptance of the opportunity into the I&R portfolio or a commitment to begin a project."
- [ ] No authentication is required to submit in MVP

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: Receive Confirmation After Submitting an Opportunity
**As a** David Reyes, **I want to** receive a clear confirmation after submitting a mission problem, **so that** I know the I&R team received my submission and understand what to expect next.

**Acceptance Criteria:**
- [ ] On-screen confirmation is rendered immediately after a successful submission
- [ ] An optional confirmation email is sent to the submitter's provided email address if supplied
- [ ] The confirmation message explicitly states that submission does not imply portfolio acceptance or project commitment
- [ ] The confirmation page offers a "Return to Catalog" CTA
- [ ] If the routing email delivery fails, the submission is still saved in the system; no error is shown to the submitter

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: Curator Reviews and Dispositions Opportunity Submissions
**As a** Catalina Torres, **I want to** view all incoming opportunity submissions in the admin interface and record a disposition on each, **so that** the I&R team can track which mission problems have been reviewed and what action was taken.

**Acceptance Criteria:**
- [ ] All `opportunity_submission` records are visible in the Submissions → Opportunities section of the admin interface, sorted reverse-chronologically with status indicators
- [ ] Curator can update the disposition of each submission: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, or `LINKED_TO_RECORD`
- [ ] When `LINKED_TO_RECORD`, curator must enter the `linked_record_id` of the Innovation Record that addresses the submission
- [ ] Disposition changes are logged with timestamp and curator user ID
- [ ] An email notification is sent to the configurable routing address on each new submission

**Priority:** P1 | **Feature Ref:** F5, F8

---

## Epic 6: Share Existing Innovation Work (F6)

### US-6.1: Submit Existing Innovation Work for I&R Curation
**As a** Marcus Webb, **I want to** submit my team's innovation work through a structured contribution form, **so that** it enters a governed curation process with the possibility of being published on the Hub with my team credited.

**Acceptance Criteria:**
- [ ] A public-facing contribution form is accessible at `/share-innovation` and via a "Share Your Work" CTA
- [ ] Form fields include: work description (required, 50–3,000 chars), problem addressed (required, 50–2,000 chars), outcome summary (required, 50–2,000 chars), self-assessed maturity (required, enum), artifact URLs (required, 1–5 valid HTTPS URLs), contributing team (required), contributing office (required), contact name and email (required), contact title (optional), additional context (optional)
- [ ] `self_assessed_maturity` enum excludes `ARCHIVED` as a valid self-assessment value
- [ ] CAPTCHA verification is required before submission is accepted
- [ ] The form includes explicit messaging: "Submissions enter I&R curation review. Publication is not guaranteed. If published, your team will be credited."
- [ ] Rate limiting: maximum 5 submissions per IP per hour

**Priority:** P2 | **Feature Ref:** F6

---

### US-6.2: Receive Confirmation That Contribution Is Under Curation Review
**As a** Marcus Webb, **I want to** receive a clear confirmation after submitting my team's innovation work, **so that** I understand the next steps and have confidence that my submission was received and is being evaluated.

**Acceptance Criteria:**
- [ ] On-screen confirmation is rendered after a successful submission: "Your submission has been received. The I&R team will review it for potential curation. This submission does not guarantee publication. If your work is published, your team will receive attribution."
- [ ] An optional confirmation email is sent to the contact email address if provided
- [ ] The confirmation clearly distinguishes this from automatic publication
- [ ] If routing email delivery fails, the submission is still saved; no error is shown to the contributor

**Priority:** P2 | **Feature Ref:** F6

---

### US-6.3: Curator Creates an Innovation Record from a Contribution Submission
**As a** Catalina Torres, **I want to** accept a contribution submission and create a draft Innovation Record pre-populated from the submission data, **so that** community-contributed work can enter the standard curation and publication workflow efficiently.

**Acceptance Criteria:**
- [ ] All contribution submissions are visible in Submissions → Contributions in the admin interface
- [ ] Curator can update disposition to `DECLINED` (with optional internal note) or `ACCEPTED_FOR_CURATION`
- [ ] When `ACCEPTED_FOR_CURATION`, curator can click "Create Record from Submission" to create a pre-populated Draft Innovation Record with: work description → `what_was_explored`, problem addressed → `problem_statement`, outcome summary → `outcome_summary`, artifact URLs → `artifact_links`, contributing team/office → `contributing_office`, contact info → `contributor_attribution`
- [ ] The resulting Innovation Record has `source_type = COMMUNITY` set automatically
- [ ] When the record is published, curator updates the contribution submission disposition to `PUBLISHED` and links `linked_record_id`
- [ ] Published community records display the Community Badge and required trust disclaimer: "This record was contributed by a team outside the TSIO I&R branch and curated for the Hub. It is not a centrally endorsed or I&R-conducted effort."
- [ ] The contributing team receives named attribution via `contributing_office` and `contributor_attribution` fields on the published record

**Priority:** P2 | **Feature Ref:** F6, F8, F2

---

## Epic 7: Engagement Routing (F7)

### US-7.1: Request a Demo or Briefing from an Innovation Record
**As a** Margaret Hollis, **I want to** request a briefing or demo directly from an Innovation Record page, **so that** I can initiate a follow-up conversation with the I&R team about an effort I find relevant to a mission problem I own.

**Acceptance Criteria:**
- [ ] The Next-Action panel on every published Innovation Record page displays the configured engagement options (1–4 options) as actionable buttons
- [ ] Clicking an engagement option (e.g., "Request Briefing") renders an inline form or modal with fields: requestor name, office, email, description of interest (required, 20–2,000 chars), desired next step (optional)
- [ ] CAPTCHA verification is required before submission is accepted
- [ ] On successful submission, an on-screen confirmation is shown: "Your request has been sent to the I&R team. Someone will follow up with you based on team availability."
- [ ] An engagement request record is created with `request_type` tied to the selected engagement option and `record_id` tied to the current record
- [ ] An email notification is sent to the configurable routing address with: request type, record title and URL, requestor name, office, email, description of interest, timestamp
- [ ] An optional confirmation email is sent to the requestor's provided email address
- [ ] Rate limiting: maximum 10 engagement requests per IP per hour

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.2: Request Technical Guidance on an Innovation Record
**As a** Priya Nair, **I want to** request technical guidance from the I&R team about a specific Innovation Record, **so that** I can get expert assistance evaluating whether and how to adapt the work for my court's environment.

**Acceptance Criteria:**
- [ ] "Request Technical Guidance" engagement option is available on records where it has been configured by the curator
- [ ] The engagement form is accessible from both the Technical and Executive Perspectives
- [ ] The request type `REQUEST_TECHNICAL_GUIDANCE` is stored on the engagement request record
- [ ] A stakeholder cannot request an engagement type that has not been configured on the target record; attempting this (e.g., via direct API call) returns: "This engagement option is not available for the selected record."
- [ ] Engagement requests can only be submitted against Published records; requests against non-published records return 404

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.3: Curator Monitors Engagement Activity and Updates Routing Email
**As a** Catalina Torres, **I want to** view all engagement requests in a log and update the routing email address without a code deployment, **so that** I can track which records are attracting interest and ensure requests reach the right team members.

**Acceptance Criteria:**
- [ ] The Engagement Activity section in the admin interface displays all engagement requests in reverse chronological order with: request type, record title (linked), requestor name, office, submitted timestamp, and status
- [ ] Curator can filter engagement requests by record, request type, and date range
- [ ] Curator can update request status: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` or `NO_ACTION`
- [ ] Curator can navigate to Hub Settings and update the `engagement_routing_email` field; value is validated as a valid email format and cannot be blank
- [ ] After saving a new routing email, all subsequent engagement and submission notifications are sent to the updated address — no code deployment required
- [ ] The curator can also view engagement requests scoped to a specific record from that record's admin detail view

**Priority:** P1 | **Feature Ref:** F7, F8

---

## Epic 8: Curation and Administration (F8)

### US-8.1: Access the Curator Administration Interface
**As a** Catalina Torres, **I want to** log in to a dedicated administration interface accessible only to authorized I&R users, **so that** I can create and manage innovation records without exposing curation capabilities to the general public.

**Acceptance Criteria:**
- [ ] The admin interface is accessible at `/admin` and all sub-paths (`/admin/*`)
- [ ] Unauthenticated requests to admin routes redirect to the identity provider login
- [ ] After successful authentication, the system checks for the CURATOR role; non-CURATOR authenticated users receive a 403 "You do not have permission to access the administration interface."
- [ ] Expired sessions redirect to the identity provider login
- [ ] The admin dashboard displays summary tiles: total published records, total draft/review records, pending opportunity submissions, pending contribution submissions, engagement requests in the last 7 days
- [ ] Quick-links from the dashboard navigate to: Records, Submissions (Opportunities), Submissions (Contributions), Engagement, Settings

**Priority:** P0 | **Feature Ref:** F8

---

### US-8.2: Manage All Innovation Records from the Admin Interface
**As a** Catalina Torres, **I want to** view, filter, create, and edit all Innovation Records from a single admin interface regardless of publication state, **so that** I have a complete operational picture of the Hub's content and can act on any record at any stage.

**Acceptance Criteria:**
- [ ] The Records section displays all records (all publication states) in a sortable table with columns: Title, Maturity, Review Status, Publication State, Owner, Last Updated
- [ ] Curator can filter and search the record list by title, publication state, maturity, and review status
- [ ] Selecting a record opens an admin detail view with all fields editable (subject to state-based edit rules)
- [ ] All state transitions follow the valid lifecycle: DRAFT → REVIEW, REVIEW → PUBLISHED (governance gate), REVIEW → DRAFT (silent revert, no confirmation required since record was never public — audit entry logged), PUBLISHED → REVIEW (requires confirmation), PUBLISHED → SUPERSEDED (requires linked ID), PUBLISHED → ARCHIVED, SUPERSEDED → ARCHIVED
- [ ] Attempting an invalid state transition returns: "This state transition is not permitted. Current state: [state]. Allowed transitions: [list]."
- [ ] Publication governance gate prevents any record missing pub-required fields from being published; the system lists all blocking fields

**Priority:** P0 | **Feature Ref:** F8, F2

---

### US-8.3: View In-App Content Model Reference
**As a** Catalina Torres, **I want to** access a reference table of all maturity level and review status definitions within the admin interface, **so that** I can apply them consistently across records without consulting an external document.

**Acceptance Criteria:**
- [ ] A Content Model Reference section is accessible in the admin interface at Admin → Content Model Reference (always available, not tied to a specific record)
- [ ] The reference displays all 5 maturity levels with: enum value, display label, color/visual indicator, and full definition
- [ ] The reference displays all 7 review statuses with: enum value, display label, and full definition
- [ ] The reference view is read-only; curators cannot edit the definitions from this view (definitions require a code change)
- [ ] Maturity and review status dropdowns in the record edit form display the definitions inline to guide curator selection

**Priority:** P0 | **Feature Ref:** F8, F9

---

## Epic 9: Content, Maturity & Trust Model (F9)

### US-9.1: Trust Signals Are Visible on Every Catalog Card and Record
**As a** Margaret Hollis, **I want to** see the maturity level and review status prominently displayed on every catalog card and Innovation Record, **so that** I can immediately understand the development stage and governance review state of any effort without reading detailed content.

**Acceptance Criteria:**
- [ ] Maturity level badge (with color coding: Idea=Gray, Experiment/POC=Yellow, Prototype/Pilot=Orange, Production/Validated=Green, Archived=Dark Gray) is displayed on every catalog card and Innovation Record page
- [ ] Review status badge with human-readable label is displayed on every catalog card and Innovation Record page
- [ ] Badges are visually prominent and unambiguous — stakeholders can distinguish between maturity levels at a glance
- [ ] Maturity level and review status are curator-assigned fields; they are never self-reported or automatically derived
- [ ] Changes to maturity level or review status on a Published record are logged to the audit history

**Priority:** P0 | **Feature Ref:** F9, F0, F2

---

### US-9.2: Trust Disclaimers Are Rendered on Every Published Record
**As a** David Reyes, **I want to** see clear trust disclaimers on every Innovation Record that explain what the publication status, maturity level, and review status do and do not mean, **so that** I can make an informed decision about the risk and readiness of a given effort without being misled.

**Acceptance Criteria:**
- [ ] A "Trust & Limitations" section is rendered on every published Innovation Record page before the Next-Action panel
- [ ] The following disclaimers are rendered automatically based on trigger conditions:
  - `maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT)` → "Proof of concept and prototype results do not indicate production readiness. This record should not be interpreted as a recommendation to deploy in a production environment without additional validation."
  - `publication_state = PUBLISHED` (always) → "Publication on the TSIO Innovation Hub indicates curation and structured presentation by the I&R team. It does not constitute formal adoption approval."
  - `source_type = COMMUNITY` → "This record was contributed by a team outside the TSIO I&R branch and curated for the Hub. It is not a centrally endorsed or I&R-conducted effort."
  - `review_status = VALIDATED_FOR_REUSE` → "Validated for Reuse status indicates that applicable I&R reviews have been completed. It does not waive local security, policy, or operational review requirements before adoption in any court environment."
- [ ] All applicable disclaimers render simultaneously; they are not mutually exclusive
- [ ] Disclaimer text is system-derived and hard-coded; curators cannot suppress, modify, or override any disclaimer
- [ ] Trust disclaimers are rendered identically in both the Executive and Technical Perspectives

**Priority:** P0 | **Feature Ref:** F9, F2, F3

---

### US-9.3: Curator Assigns Maturity and Review Status Consistently
**As a** Catalina Torres, **I want to** assign maturity level and review status to each record using defined models with inline definitions, **so that** the Hub's trust signals are applied consistently across all records and stakeholders can rely on them.

**Acceptance Criteria:**
- [ ] Maturity level is a required field for publication; curator selects from a dropdown displaying all 5 options with their definitions shown inline
- [ ] Review status is a required field for publication; curator selects from a dropdown displaying all 7 options with their definitions shown inline
- [ ] `VALIDATED_FOR_REUSE` review status triggers the Reuse Badge display on the catalog card and record page
- [ ] Maturity level changes are logged to the audit history; the system does not auto-advance or auto-restrict maturity
- [ ] `ARCHIVED` maturity level is distinct from `ARCHIVED` publication state: `maturity_level = ARCHIVED` signals the innovation work is no longer active; `publication_state = ARCHIVED` removes the record from the default catalog browse. Curators should set both when retiring work. When `maturity_level = ARCHIVED` is set on a Published record, the admin interface displays an advisory prompting the curator to also archive the publication state — but does not cascade automatically.
- [ ] Attempting to publish without maturity level set returns: "Maturity level is required before publishing."
- [ ] Attempting to publish without review status set returns: "Review status is required before publishing."

**Priority:** P0 | **Feature Ref:** F9, F8

---

## Summary Table

| Epic | Feature | Story Count | P0 | P1 | P2 |
|------|---------|-------------|----|----|-----|
| Epic 0: Innovation Catalog | F0 | 4 | 4 | 0 | 0 |
| Epic 1: Search and Discovery | F1 | 3 | 3 | 0 | 0 |
| Epic 2: Innovation Record | F2 | 5 | 5 | 0 | 0 |
| Epic 3: Executive and Technical Perspectives | F3 | 3 | 0 | 3 | 0 |
| Epic 4: Existing Lessons-Learned Integration | F4 | 2 | 0 | 2 | 0 |
| Epic 5: Opportunity Submission | F5 | 3 | 0 | 3 | 0 |
| Epic 6: Share Existing Innovation Work | F6 | 3 | 0 | 0 | 3 |
| Epic 7: Engagement Routing | F7 | 3 | 0 | 3 | 0 |
| Epic 8: Curation and Administration | F8 | 3 | 3 | 0 | 0 |
| Epic 9: Content, Maturity & Trust Model | F9 | 3 | 3 | 0 | 0 |
| **Total** | | **32** | **18** | **11** | **3** |

---

## Story Index

| Story ID | Title | Persona | Priority | Feature Ref |
|----------|-------|---------|----------|-------------|
| US-0.1 | Browse Published Innovation Records | Margaret Hollis | P0 | F0 |
| US-0.2 | Filter Catalog by Metadata | David Reyes | P0 | F0 |
| US-0.3 | Identify Community and Reuse-Validated Records | David Reyes | P0 | F0, F9 |
| US-0.4 | Curator Reviews All Records Regardless of Publication State | Catalina Torres | P0 | F0, F8 |
| US-1.1 | Search by Mission Problem | David Reyes | P0 | F1 |
| US-1.2 | Filter Search Results | Priya Nair | P0 | F1 |
| US-1.3 | Receive Guidance When No Results Are Found | Margaret Hollis | P0 | F1, F5 |
| US-2.1 | View a Full Innovation Record | Margaret Hollis | P0 | F2, F9 |
| US-2.2 | Curator Creates a New Innovation Record | Catalina Torres | P0 | F2, F8 |
| US-2.3 | Curator Advances a Record Through the Publication Lifecycle | Catalina Torres | P0 | F2, F8 |
| US-2.4 | Curator Archives or Supersedes a Record | Catalina Torres | P0 | F2, F8 |
| US-2.5 | View Audit History for a Record | Catalina Torres | P0 | F2, F8 |
| US-3.1 | Read the Executive Perspective on an Innovation Record | Margaret Hollis | P1 | F3 |
| US-3.2 | Read the Technical Perspective on an Innovation Record | Priya Nair | P1 | F3 |
| US-3.3 | Curator Authors Perspective-Specific Content | Catalina Torres | P1 | F3, F2 |
| US-4.1 | Curator Creates a Structured Record from an Existing Lessons-Learned Document | Catalina Torres | P1 | F4, F2 |
| US-4.2 | Stakeholder Accesses Source Document from a Lessons-Learned Record | Priya Nair | P1 | F4, F2 |
| US-5.1 | Submit a Mission Problem for I&R Consideration | Margaret Hollis | P1 | F5 |
| US-5.2 | Receive Confirmation After Submitting an Opportunity | David Reyes | P1 | F5 |
| US-5.3 | Curator Reviews and Dispositions Opportunity Submissions | Catalina Torres | P1 | F5, F8 |
| US-6.1 | Submit Existing Innovation Work for I&R Curation | Marcus Webb | P2 | F6 |
| US-6.2 | Receive Confirmation That Contribution Is Under Curation Review | Marcus Webb | P2 | F6 |
| US-6.3 | Curator Creates an Innovation Record from a Contribution Submission | Catalina Torres | P2 | F6, F8, F2 |
| US-7.1 | Request a Demo or Briefing from an Innovation Record | Margaret Hollis | P1 | F7 |
| US-7.2 | Request Technical Guidance on an Innovation Record | Priya Nair | P1 | F7 |
| US-7.3 | Curator Monitors Engagement Activity and Updates Routing Email | Catalina Torres | P1 | F7, F8 |
| US-8.1 | Access the Curator Administration Interface | Catalina Torres | P0 | F8 |
| US-8.2 | Manage All Innovation Records from the Admin Interface | Catalina Torres | P0 | F8, F2 |
| US-8.3 | View In-App Content Model Reference | Catalina Torres | P0 | F8, F9 |
| US-9.1 | Trust Signals Are Visible on Every Catalog Card and Record | Margaret Hollis | P0 | F9, F0, F2 |
| US-9.2 | Trust Disclaimers Are Rendered on Every Published Record | David Reyes | P0 | F9, F2, F3 |
| US-9.3 | Curator Assigns Maturity and Review Status Consistently | Catalina Torres | P0 | F9, F8 |

---

## Priority Definitions

| Priority | Definition |
|----------|------------|
| **P0** | Critical — MVP launch blocker; Hub cannot operate without this |
| **P1** | High — High-value MVP feature; targeted for launch |
| **P2** | Important — Valuable; included late-MVP or early post-MVP based on capacity |
| **P3** | Deferred — Planned but explicitly deferred to a future release |

---

*TSIO Innovation Hub — User Stories | Administrative Office of the U.S. Courts, TSIO Innovation & Research | Generated 2026-07-29*
