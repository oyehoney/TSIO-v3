# Audit Log Event Coverage — TSIO Innovation Hub

**Document:** Audit Log Coverage Table  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Draft — pending ISSO review

---

## Overview

The TSIO Innovation Hub records security-relevant events in the `audit_log` table (PostgreSQL). This document enumerates all audited events, the trigger mechanism, the fields recorded, and the access control applied to audit log data.

This document supports ATO control families **AU-2** (Auditable Events), **AU-3** (Content of Audit Records), and **AU-9** (Protection of Audit Information).

---

## `audit_log` Table Schema

```sql
CREATE TABLE audit_log (
    log_id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            REFERENCES users(user_id),   -- NULL for anonymous events
    action          VARCHAR(100)    NOT NULL,   -- e.g. 'RECORD_CREATED', 'LOGIN_SUCCESS'
    entity_type     VARCHAR(50),               -- e.g. 'innovation_record', 'user'
    entity_id       UUID,                      -- ID of the affected entity
    old_value       JSONB,                     -- Snapshot before change (for UPDATE events)
    new_value       JSONB,                     -- Snapshot after change (for UPDATE events)
    ip_address      INET,                      -- Client IP at time of event
    user_agent      TEXT,                      -- Browser/client user-agent string
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

## Audited Event Coverage Table

### Authentication Events

| Event | `action` Value | Trigger | `user_id` | `entity_type` | Notes |
|-------|---------------|---------|-----------|---------------|-------|
| Successful OIDC login | `LOGIN_SUCCESS` | /auth/callback success | User UUID | `auth_session` | Records oidc_sub, IDP used |
| JWT validation failure | `LOGIN_FAILURE` | AuthMiddleware 401 | NULL | `auth_session` | Records attempted token (sanitized) |
| Session expiry / logout | `LOGOUT` | /auth/logout or cookie expiry | User UUID | `auth_session` | |
| Permission denied (403) | `AUTHZ_DENIED` | AuthMiddleware 403 | User UUID | target entity type | Records requested action |

### Innovation Record Lifecycle Events

| Event | `action` Value | Trigger | `entity_type` | `old_value` | `new_value` |
|-------|---------------|---------|---------------|-------------|-------------|
| Record created | `RECORD_CREATED` | POST /api/records | `innovation_record` | NULL | Full record snapshot |
| Record updated | `RECORD_UPDATED` | PATCH /api/records/:id | `innovation_record` | Previous field values | New field values |
| Record published | `RECORD_PUBLISHED` | publication_state → PUBLISHED | `innovation_record` | `{publication_state: 'DRAFT'}` | `{publication_state: 'PUBLISHED'}` |
| Record archived | `RECORD_ARCHIVED` | publication_state → ARCHIVED | `innovation_record` | Previous state | `{publication_state: 'ARCHIVED'}` |
| Record deleted (soft) | `RECORD_DELETED` | DELETE /api/records/:id | `innovation_record` | Record snapshot | `{deleted_at: timestamp}` |

### Key Finding / Child Table Events

| Event | `action` Value | Trigger | `entity_type` |
|-------|---------------|---------|---------------|
| Finding added | `FINDING_CREATED` | POST /api/records/:id/findings | `record_key_finding` |
| Finding updated | `FINDING_UPDATED` | PATCH /api/records/:id/findings/:fid | `record_key_finding` |
| Finding deleted | `FINDING_DELETED` | DELETE /api/records/:id/findings/:fid | `record_key_finding` |
| Artifact link added | `ARTIFACT_LINK_CREATED` | POST /api/records/:id/links | `record_artifact_link` |
| Artifact link updated | `ARTIFACT_LINK_UPDATED` | PATCH /api/records/:id/links/:lid | `record_artifact_link` |
| Artifact link deleted | `ARTIFACT_LINK_DELETED` | DELETE /api/records/:id/links/:lid | `record_artifact_link` |
| Tag added | `TAG_CREATED` | POST /api/records/:id/tags | `record_tag` |
| Tag deleted | `TAG_DELETED` | DELETE /api/records/:id/tags/:tid | `record_tag` |
| Engagement option added | `ENGAGEMENT_OPTION_CREATED` | POST /api/records/:id/options | `record_engagement_option` |
| Engagement option deleted | `ENGAGEMENT_OPTION_DELETED` | DELETE /api/records/:id/options/:oid | `record_engagement_option` |

### Engagement / Submission Events

| Event | `action` Value | Trigger | `entity_type` | Notes |
|-------|---------------|---------|---------------|-------|
| Engagement request submitted | `ENGAGEMENT_REQUESTED` | POST /api/engage | `engagement_request` | Records record_id + request_type |
| Opportunity submitted | `OPPORTUNITY_SUBMITTED` | POST /api/opportunities | `opportunity_submission` | PII fields excluded from new_value log |
| Contribution submitted | `CONTRIBUTION_SUBMITTED` | POST /api/contributions | `contribution_submission` | PII fields excluded from new_value log |
| Engagement request acknowledged | `ENGAGEMENT_ACKNOWLEDGED` | PATCH /api/engage/:id | `engagement_request` | |

### User Management Events (ADMIN only)

| Event | `action` Value | Trigger | `entity_type` | Notes |
|-------|---------------|---------|---------------|-------|
| User role changed | `USER_ROLE_CHANGED` | PATCH /api/admin/users/:id | `user` | Records old_role → new_role |
| User deactivated | `USER_DEACTIVATED` | PATCH /api/admin/users/:id | `user` | |
| User reactivated | `USER_REACTIVATED` | PATCH /api/admin/users/:id | `user` | |

### Hub Settings Events (ADMIN only)

| Event | `action` Value | Trigger | `entity_type` | Notes |
|-------|---------------|---------|---------------|-------|
| Setting changed | `SETTING_CHANGED` | PATCH /api/admin/settings | `hub_setting` | Records setting_key, old/new value |

---

## Audit Log Access Control

| Role | Access |
|------|--------|
| Anonymous | None |
| VIEWER | None |
| CURATOR | None |
| ADMIN | Read-only access to audit_log via `/api/admin/audit-log` endpoint |

The `audit_log` table has no UPDATE or DELETE grants in application code. Audit records are append-only. Physical deletion requires DBA-level database access (outside application authorization boundary).

---

## PII Handling in Audit Log

Sensitive PII fields from submission tables (`requester_email`, `submitter_email`, `requester_name`, `submitter_name`) are **excluded** from `new_value` / `old_value` JSONB snapshots in the audit log. The audit log records the `entity_id` (UUID) and action type, not the PII content. This minimizes PII exposure in the audit trail.

Exception: `users` table role changes include `email` in the audit record to identify which user's role changed (necessary for accountability). This is acceptable under AU-3 content requirements.

---

## Retention

| Data | Retention Period | Authority |
|------|-----------------|-----------|
| `audit_log` records | TBD — recommended 7 years | AO Records Schedule (pending ISSO guidance) |
| `engagement_requests` | TBD — recommended 1 year after disposition | AO Records Schedule |
| `opportunity_submissions` | TBD — recommended 3 years after disposition | AO Records Schedule |

**Note:** Retention periods are not yet confirmed. See OPEN-RISKS.md RISK-06.

---

## Events NOT Currently Audited (Gaps)

| Gap | Risk | Mitigation Plan |
|-----|------|----------------|
| Failed database queries (application errors) | Low | Captured in application error logs (separate from audit_log). Structured error log format TBD. |
| FTS search queries | Low | Search terms are not personally attributable in an anonymous-access context. No current plan to audit. |
| Record views (catalog browse) | Low | High volume; no current plan to log individual record views. Server access logs capture this at HTTP level. |
| Automated system actions (seed scripts) | Accepted | Seed scripts insert data with `system-seed@tsio.courts.internal` attribution. Not routed through application audit_log. |

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Review: ISSO*
