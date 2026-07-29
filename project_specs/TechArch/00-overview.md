# TechArch: TSIO Innovation Hub

**Document Type:** Technical Architecture Document  
**Project Acronym:** TSIO-Innovation-Hub  
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch  
**Date:** 2026-07-29  
**Version:** 1.0 — MVP  
**Status:** Active  
**Derived from:** PRD-TSIO-Innovation-Hub.md (2026-07-28), FRD-TSIO-Innovation-Hub.md (2026-07-28)

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

The TSIO Innovation Hub follows a **Monolithic Web Application with a Structured REST API** pattern. This choice is deliberate: the system is small in initial record volume (3–5 records at launch, growing to ~50 within a year), the team is small, the hosting environment is undecided but constrained by federal ATO requirements, and the FRD explicitly calls for "maintainability over novelty."

A single deployable application serves both the public-facing Hub and the curator administration interface. The REST API layer is shared — the public frontend and the admin frontend both consume the same `/api/v1/*` endpoints, differentiated by authentication state and role. There is no microservices boundary, no event streaming, and no separate read/write store in MVP.

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture style | Monolith with REST API | Small team, federal hosting constraints, maintainability requirement |
| Database | PostgreSQL (primary recommendation) | Native full-text search (tsvector), UUID support, JSONB for future flexibility, AO-environment compatibility |
| Search strategy | PostgreSQL native FTS (tsvector + GIN index) | Eliminates external search service dependency; sufficient for MVP record volumes |
| Authentication | OIDC/OAuth 2.0 via Azure AD / Microsoft Entra ID | Federal Judiciary standard; OIDC middleware in backend |
| Frontend approach | Server-side rendered with progressive enhancement | Avoids SPA complexity; accessible; works on government-issued browsers |
| Email routing | Configurable SMTP relay or transactional email service | Database-stored routing address; changeable without code deployment |
| Artifact storage | External URL links only | Hub never copies or hosts authoritative source documents (PRD Design Principle) |
| Audit history | Write-ahead append-only audit_log table | 100% material change capture; no soft-overwrites |

---

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TSIO Innovation Hub                          │
│                     (Single Deployable Unit)                        │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │   Public Hub (SSR)   │    │  Curator Admin Interface (SSR)   │   │
│  │  /catalog            │    │  /admin/*                        │   │
│  │  /records/{id}       │    │  Record management               │   │
│  │  /search             │    │  Submission queues               │   │
│  │  /submit-opportunity │    │  Engagement activity log         │   │
│  │  /share-innovation   │    │  Hub settings                    │   │
│  └──────────┬───────────┘    └──────────────┬───────────────────┘   │
│             │                               │                       │
│             └──────────────┬────────────────┘                       │
│                            │                                        │
│                  ┌─────────▼──────────┐                             │
│                  │  REST API Layer    │                             │
│                  │  /api/v1/*         │                             │
│                  │  - Catalog         │                             │
│                  │  - Search          │                             │
│                  │  - Records         │                             │
│                  │  - Submissions     │                             │
│                  │  - Engagement      │                             │
│                  │  - Settings        │                             │
│                  │  - Admin           │                             │
│                  └─────────┬──────────┘                             │
│                            │                                        │
│           ┌────────────────┼─────────────────┐                      │
│           │                │                 │                      │
│  ┌────────▼───────┐  ┌─────▼──────┐  ┌──────▼──────┐               │
│  │  Service Layer │  │  Auth      │  │  Email      │               │
│  │  - Records     │  │  Middleware│  │  Service    │               │
│  │  - Catalog     │  │  (OIDC)    │  │  (SMTP/     │               │
│  │  - Search      │  │            │  │  Transact.) │               │
│  │  - Submissions │  └─────┬──────┘  └──────┬──────┘               │
│  │  - Engagement  │        │                │                       │
│  │  - Audit       │        │                │                       │
│  └────────┬───────┘        │                │                       │
│           │                │                │                       │
│  ┌────────▼───────────────────────────────┐ │                       │
│  │         PostgreSQL Database            │ │                       │
│  │  innovation_records                    │ │                       │
│  │  record_key_findings                   │ │                       │
│  │  record_artifact_links                 │ │                       │
│  │  record_tags                           │ │                       │
│  │  record_engagement_options             │ │                       │
│  │  audit_log                             │ │                       │
│  │  users                                 │ │                       │
│  │  opportunity_submissions               │ │                       │
│  │  contribution_submissions              │ │                       │
│  │  engagement_requests                   │ │                       │
│  │  hub_settings                          │ │                       │
│  │  (+ FTS: tsvector GIN indexes)         │ │                       │
│  └────────────────────────────────────────┘ │                       │
└─────────────────────────────────────────────┼─────────────────────┘
                                              │
            ┌─────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                  External Integrations                    │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  Azure AD /     │  │  Email Relay / Transactional │   │
│  │  Entra ID       │  │  Email Service               │   │
│  │  (OIDC/OAuth2)  │  │  (SMTP or SendGrid/ACS)      │   │
│  └─────────────────┘  └──────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  CAPTCHA        │  │  Artifact Source Systems     │   │
│  │  Provider       │  │  (SharePoint, GitHub,        │   │
│  │  (reCAPTCHA v3  │  │   Video — link-only,         │   │
│  │  or hCaptcha)   │  │   no integration required)   │   │
│  └─────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 1.3 Deployment Topology

The hosting environment is TBD pending federal ATO discovery. The architecture is designed to be deployment-agnostic at the application level. The following topology describes the target deployment pattern for a single-server or PaaS deployment:

```
┌────────────────────────────────────────────────────────┐
│           Federal Cloud / AO-Managed Hosting           │
│         (Azure Government, AO On-Premise, or PaaS)     │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Reverse Proxy / WAF                  │   │
│  │    (nginx, Azure App Gateway, or equivalent)    │   │
│  │    HTTPS enforced; HTTP redirect to HTTPS       │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │           Application Server                    │   │
│  │    Node.js / Python / .NET (TBD per hosting)    │   │
│  │    Public: port 80/443 (via reverse proxy)      │   │
│  │    Admin: /admin/* (role-gated)                 │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │           PostgreSQL Database                   │   │
│  │    Managed or self-hosted per AO policy         │   │
│  │    Encrypted at rest; TLS in transit            │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Deployment constraints:**
- All traffic HTTPS-only; TLS 1.2 minimum (TLS 1.3 preferred)
- Database encrypted at rest; connection via TLS
- No public database port exposure
- Admin routes (`/admin/*`) require valid OIDC session — no anonymous access
- Environment variables / secrets stored in hosting secret management (not in code or config files)
- Outbound HTTPS required for: Azure AD OIDC endpoints, email relay, CAPTCHA provider validation

---

### 1.4 Publication Lifecycle State Machine

The publication lifecycle governs record visibility. The state machine is enforced at the service layer, not just the UI:

```
                    ┌─────────┐
                    │  DRAFT  │◄──────────────────────┐
                    └────┬────┘                        │
                         │ submit-review               │ return-to-draft
                         ▼                             │
                    ┌─────────┐                        │
                    │ REVIEW  ├────────────────────────┘
                    └────┬────┘
                         │ publish (governance gate)
                         ▼
                    ┌──────────┐
              ┌─────┤ PUBLISHED├──────┐
              │     └──────────┘      │
              │ supersede             │ archive
              ▼                       ▼
         ┌───────────┐          ┌──────────┐
         │ SUPERSEDED│          │ ARCHIVED │
         └─────┬─────┘          └──────────┘
               │ archive
               ▼
          ┌──────────┐
          │ ARCHIVED │
          └──────────┘
```

**Governance gate (REVIEW → PUBLISHED):** System validates all `pub-required` fields are non-empty before allowing transition. Failure returns HTTP 422 with a list of blocking fields.

**Deletion rule:** Only DRAFT records may be hard-deleted. All other states are soft-deleted only (audit integrity requirement).

---

*End of 00-overview.md*
