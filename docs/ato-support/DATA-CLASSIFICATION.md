# Data Classification — TSIO Innovation Hub

**Document:** COMP-05 Data Classification  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Draft — pending ISSO review

---

## Purpose

This document classifies the data stored and processed by the TSIO Innovation Hub across all 11 database tables. It supports COMP-05 (data classification requirement) for the ATO package and is intended for review by the Judiciary ISSO and AO Privacy Officer.

---

## Classification Framework

The Judiciary uses the following data sensitivity tiers:

| Tier | Label | Description |
|------|-------|-------------|
| 1 | **Public** | Releasable without restriction; no PII; no operational sensitivity |
| 2 | **Internal** | Not for public release but not classified; operational/administrative |
| 3 | **Sensitive** | Contains PII, financial data, or law enforcement sensitive information |
| 4 | **Controlled** | Requires access controls; may include court-sensitive case information |

---

## Table-by-Table Classification

### 1. `innovation_records`

| Field Category | Example Fields | Classification | Rationale |
|---------------|----------------|----------------|-----------|
| Content narrative | `title`, `problem_statement`, `what_was_explored`, `outcome_summary` | **Tier 2 – Internal** (pre-publication); **Tier 1 – Public** (post-publication) | Curated institutional knowledge intended for publication. PUBLISHED records are explicitly designed for broad internal access across the Judiciary. DRAFT/REVIEW records are Internal until curator-approved. |
| Executive/technical analysis | `executive_perspective_text`, `executive_recommendation`, `technical_perspective_text` | **Tier 2 – Internal** | Analytical narrative written by I&R staff. No PII. May contain pre-decisional information prior to publication. |
| Security/performance findings | `security_findings`, `performance_findings` | **Tier 2 – Internal** | May contain infrastructure-specific technical details not suitable for unrestricted public release. |
| Governance metadata | `maturity_level`, `review_status`, `publication_state`, `source_type` | **Tier 1 – Public** | Controlled vocabulary values; no PII; part of the public-facing trust model. |
| Attribution | `owner_name`, `owner_office`, `contributing_office`, `contributor_attribution` | **Tier 2 – Internal** | Office/team attribution. No individual PII. Organizational unit names are not sensitive. |
| System metadata | `record_id`, `created_at`, `updated_at`, `published_at` | **Tier 2 – Internal** | System housekeeping. UUIDs are not sensitive. |
| User attribution FK | `created_by_user_id`, `updated_by_user_id` | **Tier 2 – Internal** | References to curator user accounts. No direct PII; FK to users table. |

**Table classification: Tier 2 – Internal (PUBLISHED content may be treated as Tier 1 – Public)**

---

### 2. `record_key_findings`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `finding_text` | **Tier 2 – Internal** (pre-pub) / **Tier 1 – Public** (post-pub) | Curated technical findings. No PII. Follows parent record classification. |
| `record_id` (FK) | Tier 2 – Internal | References parent record. |
| `display_order`, `finding_id` | Tier 1 – Public | Non-sensitive metadata. |

**Table classification: Tier 2 – Internal / Tier 1 – Public (inherits from parent `innovation_records`)**

---

### 3. `record_artifact_links`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `url` | **Tier 2 – Internal** | SharePoint document URLs. Not sensitive but reveal internal document structure. URLs are not public-facing links — they point to authenticated SharePoint resources. |
| `label`, `artifact_type` | **Tier 2 – Internal** | Descriptive metadata. No PII. |
| `record_id` (FK), `link_id` | Tier 2 – Internal | System references. |

**Table classification: Tier 2 – Internal**

---

### 4. `record_tags`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `tag_type`, `tag_value` | **Tier 1 – Public** | Controlled vocabulary tags (MISSION_AREA, TECHNOLOGY_AREA). No PII. Used for catalog filtering. |
| `record_id` (FK), `tag_id` | Tier 1 – Public | Non-sensitive references. |

**Table classification: Tier 1 – Public**

---

### 5. `record_engagement_options`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `option_type` | **Tier 1 – Public** | Controlled vocabulary (REQUEST_DEMO, REQUEST_BRIEFING, REQUEST_TECHNICAL_GUIDANCE). No PII. |
| `record_id` (FK), `option_id` | Tier 1 – Public | Non-sensitive. |

**Table classification: Tier 1 – Public**

---

### 6. `audit_log`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `user_id` (FK) | **Tier 2 – Internal** | Links events to authenticated user accounts. Indirectly identifies individuals. |
| `action`, `entity_type`, `entity_id` | **Tier 2 – Internal** | Operational log of who did what to which record. Sensitive from an accountability perspective. |
| `ip_address`, `user_agent` | **Tier 3 – Sensitive** | Network/device metadata. IP address may constitute PII under some regulatory frameworks. |
| `old_value`, `new_value` | **Tier 2 – Internal** | May contain snapshot of record fields at time of change. |
| `created_at` | Tier 2 – Internal | Timestamp of action. |

**Table classification: Tier 3 – Sensitive (IP address and user attribution)**

**Special handling:** The `audit_log` table must only be accessible to ADMIN role users and ISSO auditors. No anonymous or VIEWER access. Retention policy TBD pending ISSO guidance (suggested: 7 years per AO records schedule).

---

### 7. `users`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `email` | **Tier 3 – Sensitive** | PII — work email address. |
| `display_name` | **Tier 3 – Sensitive** | PII — individual's name. |
| `role` | **Tier 2 – Internal** | RBAC role assignment. Sensitive from a privilege perspective. |
| `oidc_sub` | **Tier 3 – Sensitive** | OIDC subject identifier — unique individual identifier from the IDP. |
| `is_active`, `last_login_at` | **Tier 2 – Internal** | Account status and login activity. |
| `user_id` | Tier 2 – Internal | System UUID. Not directly PII but links to PII. |

**Table classification: Tier 3 – Sensitive (PII)**

**Special handling:** The `users` table contains PII and must be treated under the Judiciary Privacy Act obligations. Access restricted to ADMIN role. Data minimization: the Hub stores only the minimum user attributes required for authentication and attribution (email, display name, role, OIDC subject). No SSNs, dates of birth, or court case data are stored.

---

### 8. `hub_settings`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `setting_key`, `setting_value` | **Tier 2 – Internal** | Operational configuration (routing email, page size defaults). Not sensitive content, but controls system behavior. |
| `updated_by_user_id` (FK) | Tier 2 – Internal | Audit attribution. |

**Table classification: Tier 2 – Internal**

---

### 9. `opportunity_submissions`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `submitter_name`, `submitter_email`, `submitter_court` | **Tier 3 – Sensitive** | PII — name and work email of submitting court staff member. |
| `title`, `problem_statement`, `proposed_approach` | **Tier 2 – Internal** | Potentially pre-decisional innovation proposals. Not public. |
| `submission_state` | **Tier 2 – Internal** | Workflow state (SUBMITTED, UNDER_REVIEW, etc.). |

**Table classification: Tier 3 – Sensitive (submitter PII)**

**Special handling:** Submissions contain PII and must not be accessible to VIEWER role users. CURATOR and ADMIN only. Retention policy TBD — recommended: 3 years after disposition.

---

### 10. `contribution_submissions`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `submitter_name`, `submitter_email`, `submitter_court` | **Tier 3 – Sensitive** | PII — same as opportunity_submissions. |
| `title`, `description`, `artifact_links` | **Tier 2 – Internal** | Contribution content. May contain links to internal documents. |
| `submission_state` | **Tier 2 – Internal** | Workflow state. |

**Table classification: Tier 3 – Sensitive (submitter PII)**

---

### 11. `engagement_requests`

| Field | Classification | Rationale |
|-------|----------------|-----------|
| `requester_name`, `requester_email`, `requester_court` | **Tier 3 – Sensitive** | PII — name and work email of court staff making the engagement request. |
| `request_type`, `message` | **Tier 2 – Internal** | Engagement type (REQUEST_DEMO, etc.) and optional message. May contain operational information about court needs. |
| `record_id` (FK) | Tier 2 – Internal | Links request to specific innovation record. |
| `request_state` | **Tier 2 – Internal** | Workflow state (PENDING, ACKNOWLEDGED, etc.). |

**Table classification: Tier 3 – Sensitive (requester PII)**

**Special handling:** Engagement requests are routed via email to `engagement_routing_email` (hub_settings) and stored in DB for tracking. PII retention policy TBD — recommended: 1 year after final disposition, then anonymize or delete. Requests must not be visible to VIEWER role.

---

## Summary Matrix

| Table | Classification | Contains PII | Access Roles |
|-------|---------------|--------------|--------------|
| `innovation_records` | Tier 1–2 | No | All roles (PUBLISHED); CURATOR/ADMIN (DRAFT/REVIEW) |
| `record_key_findings` | Tier 1–2 | No | All roles (if parent PUBLISHED) |
| `record_artifact_links` | Tier 2 | No | All roles (if parent PUBLISHED) |
| `record_tags` | Tier 1 | No | All roles |
| `record_engagement_options` | Tier 1 | No | All roles |
| `audit_log` | **Tier 3** | Indirect (user_id, IP) | ADMIN only |
| `users` | **Tier 3** | **Yes** (email, name, OIDC sub) | ADMIN only |
| `hub_settings` | Tier 2 | No | ADMIN only (write); CURATOR (read) |
| `opportunity_submissions` | **Tier 3** | **Yes** (submitter name/email) | CURATOR, ADMIN |
| `contribution_submissions` | **Tier 3** | **Yes** (submitter name/email) | CURATOR, ADMIN |
| `engagement_requests` | **Tier 3** | **Yes** (requester name/email) | CURATOR, ADMIN |

---

## Data at Rest

- **Database:** PostgreSQL 16 hosted on AO Azure Government Cloud infrastructure (hosting TBD — see OPEN-RISKS.md)
- **Encryption at rest:** Dependent on Azure Government Cloud disk encryption and PostgreSQL tablespace configuration. To be confirmed by hosting team.
- **Backup encryption:** TBD pending hosting decision.

## Data in Transit

- **API ↔ Database:** TLS enforced by connection string (`sslmode=require`) — to be verified in production configuration.
- **Browser ↔ API:** HTTPS enforced. HTTP to HTTPS redirect required (see AUTH-CONTROLS.md).
- **Engagement email routing:** `engagement_routing_email` is a .gov email address; email in transit is subject to AO email security controls.

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Review: ISSO, AO Privacy Officer*
