---

## F08: Curation and Administration (Part A — Description, Sub-Features, Process)

**PRD Reference:** F8 — Priority P0 (Critical MVP)  
**Personas Served:** P5 (I&R Curator)  
**Continued in:** `F08b-curation-administration.md` (Inputs, Outputs, Validation, Errors, API/Schema)

---

### Description

The Curation and Administration interface is the operational backbone of the Hub's governance model. It is accessible only to authenticated I&R Curators. It provides all capabilities required to create, enrich, govern, and publish Innovation Records; review incoming opportunity and contribution submissions; monitor engagement activity; and configure Hub-level settings such as the engagement routing email address. Without this interface, the Hub cannot operate — curators cannot create records, governance cannot be enforced, and the publication lifecycle cannot be managed.

Access to the admin interface is controlled by role-based authentication. The specific identity provider (Azure AD or other) is determined during discovery (see PROJECT.md §Constraints). The admin interface is separate from the public Hub in URL path (e.g., `/admin/*`) and access control policy.

---

### Terminology

- **Curation Interface:** The authenticated admin area of the Hub, accessible only to users with the CURATOR role.
- **Record Management:** The CRUD operations available in the curation interface for Innovation Records.
- **Publication Lifecycle:** The governed state machine (Draft → Review → Published → Superseded / Archived) controlled exclusively by curators.
- **Governance Enforcement:** The system-level validation that prevents a record from transitioning to Published state unless all required fields are present.
- **Submission Queue:** The admin view displaying incoming Opportunity Submissions (F05) and Contribution Submissions (F06) awaiting curator review.
- **Engagement Activity Log:** The admin view displaying all engagement requests (F07) received, with request type, record reference, requestor info, and status.
- **Audit History:** The per-record log of material changes (field edits, state transitions) with timestamp and curator identity.
- **Hub Settings:** Admin-configurable system settings, including the engagement routing email address.
- **CURATOR Role:** An authenticated user with write access to the curation interface. Assigned by system administrator. In MVP, role assignment is managed at the identity/user management layer.

---

### Sub-Features

- **Record Management:** Create, edit, and delete Innovation Records; manage all structured fields (see F02)
- **Maturity & Review Status Assignment:** Assign and update maturity level and review status; changes logged to audit history
- **Publication Lifecycle Control:** Manage record state transitions (Draft → Review → Published → Superseded → Archived); governance gate enforced before publish
- **Owner & Attribution Management:** Assign named owner/steward, contributing office, contributor attribution
- **Submission Review (Opportunities):** View, filter, and update disposition of opportunity submissions (F05)
- **Submission Review (Contributions):** View, filter, and update disposition of contribution submissions (F06); create Innovation Record from accepted contribution
- **Engagement Monitoring:** View engagement request log; filter by record, type, date range; update request status
- **Audit History View:** View per-record audit history (field changes, state transitions, timestamps, actors)
- **Hub Settings Management:** View and update configurable settings (engagement routing email)
- **Content Model Reference:** In-app reference display of maturity level and review status definitions for curator consistency
- **Access Control:** Admin interface accessible only to CURATOR role; public Hub accessible without authentication

---

### Process

#### Curator Login

1. Curator navigates to `/admin`.
2. System checks for authenticated session (via identity provider — TBD).
3. If no valid session: system redirects to identity provider login.
4. After successful authentication, system checks CURATOR role assignment.
5. If role not assigned: system renders 403 "Access Denied" page.
6. If role assigned: system renders the admin dashboard.

#### Admin Dashboard

1. System displays summary tiles: total published records, total draft records, pending submissions (opportunity + contribution), recent engagement requests (last 7 days).
2. Curator navigates to one of: Records, Submissions (Opportunities), Submissions (Contributions), Engagement, Settings.

#### Record Management

1. Curator navigates to Records section.
2. System displays all Innovation Records (all publication states) in a table with columns: Title, Maturity, Review Status, Publication State, Owner, Last Updated.
3. Curator filters or searches records by title, publication state, maturity, review status.
4. Curator selects "New Record" → follows F02a §Process (Creating a Record).
5. Curator selects an existing record → admin record detail view renders with all fields editable.
6. Curator edits fields and saves → system validates field-level constraints (see F02b §Validation) and saves to `DRAFT` or current state.
7. Curator advances record through publication lifecycle → system enforces governance gate at each state transition.
8. Curator views audit history for a record → system renders audit log for that `record_id`.

#### Submission Review — Opportunities

1. Curator navigates to Submissions → Opportunities.
2. System lists all `opportunity_submissions` in reverse chronological order with status.
3. Curator opens a submission and reviews its fields.
4. Curator updates `disposition`: `UNDER_REVIEW`, `ACCEPTED_FOR_CONSIDERATION`, `DECLINED`, or `LINKED_TO_RECORD`.
5. If `LINKED_TO_RECORD`: curator enters the `linked_record_id` of the relevant Innovation Record.
6. Disposition change logged with timestamp and curator user ID.

#### Submission Review — Contributions

1. Curator navigates to Submissions → Contributions.
2. System lists all `contribution_submissions` in reverse chronological order with status.
3. Curator opens a submission and reviews its fields.
4. Curator updates `disposition`:
   - `DECLINED`: curator enters an internal note (not surfaced to contributor).
   - `ACCEPTED_FOR_CURATION`: curator clicks "Create Record from Submission" → system pre-populates a new Draft Innovation Record with available data from the submission (work description → `what_was_explored`, problem addressed → `problem_statement`, outcome summary → `outcome_summary`, artifact URLs → `artifact_links`, contributing team/office → `contributing_office`, contact name/email → `contributor_attribution`). Curator enriches and publishes following F02a process.
5. When record is published: curator sets `disposition = PUBLISHED` and `linked_record_id` on the contribution submission.

#### Engagement Monitoring

1. Curator navigates to Engagement.
2. System displays all engagement requests in reverse chronological order: request type, record title (linked), requestor name, office, submitted_at, status.
3. Curator filters by record, request type, or date range.
4. Curator opens a request and views full details (description_of_interest, desired_next_step, requestor contact).
5. Curator updates status: `SUBMITTED` → `IN_PROGRESS` → `COMPLETED` or `NO_ACTION`.

#### Hub Settings

1. Curator navigates to Settings.
2. System displays current value of `engagement_routing_email`.
3. Curator updates the value and saves.
4. System validates email format and saves to `hub_settings` table.
5. All subsequent routing emails are sent to the new address.
6. System displays other configurable settings (e.g., default page size, contact email) as defined in the `hub_settings` table.

---

*End of F08a-curation-administration.md — continued in F08b-curation-administration.md*
