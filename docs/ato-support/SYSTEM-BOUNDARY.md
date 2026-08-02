# System Boundary — TSIO Innovation Hub

**Document:** System Boundary Diagram and Description  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Draft — pending hosting confirmation

---

## System Purpose

The TSIO Innovation Hub is an internal web application for the Administrative Office of the U.S. Courts. It provides a searchable catalog of TSIO I&R innovation records, allowing court staff across the federal judiciary to discover, understand, and engage with technology experimentation findings. Curators manage record lifecycle via an authenticated curator interface.

---

## ASCII System Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION BOUNDARY                              │
│                    AO Azure Government Cloud (FedRAMP High)                 │
│                                                                             │
│  ┌──────────────────────────┐      ┌──────────────────────────────────────┐ │
│  │    Frontend Container    │      │         API Container                │ │
│  │  (React / Nginx)         │      │      (Node.js / Express)             │ │
│  │                          │      │                                      │ │
│  │  • Static asset serving  │      │  • REST API endpoints                │ │
│  │  • Client-side routing   │      │  • AuthMiddleware (OIDC JWT)         │ │
│  │  • No direct DB access   │      │  • CatalogService                   │ │
│  │                          │      │  • EngagementService                 │ │
│  │  Port: 3000 (internal)   │      │  • SubmissionService                 │ │
│  │  Exposed via: HTTPS LB   │      │  • AuditLogService                   │ │
│  └──────────┬───────────────┘      │  Port: 8080 (internal)               │ │
│             │  HTTPS (TLS)         └──────────────┬───────────────────────┘ │
│             │  /api/* proxy        ┌──────────────┴───────────────────────┐ │
│             └─────────────────────►│                                      │ │
│                                    │      PostgreSQL 16 Container         │ │
│                                    │      (tsio_hub database)             │ │
│                                    │                                      │ │
│                                    │  • 11 tables (see DATA-              │ │
│                                    │    CLASSIFICATION.md)                │ │
│                                    │  • FTS via tsvector triggers         │ │
│                                    │  • Row-level audit log               │ │
│                                    │  • Encrypted at rest (AZ disk)       │ │
│                                    │  Port: 5432 (internal only)          │ │
│                                    └──────────────────────────────────────┘ │
│                                                                             │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────────────────────────────────┐
         │                   EXTERNAL INTERFACES                   │
         └────────────────────────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────────────────┐
         │  BROWSER CLIENTS (Judiciary court staff)                │
         │  • Internal network (VPN / .uscourts.gov intranet)     │
         │  • HTTPS only (port 443)                               │
         │  • Authentication required for non-VIEWER actions      │
         └─────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────────────────┐
         │  IDENTITY PROVIDER (IDP) — TBD                         │
         │  • AO Azure AD (Microsoft Entra) — anticipated         │
         │  • OIDC authorization code flow                        │
         │  • JWT tokens validated by AuthMiddleware              │
         │  • Specific IDP: pending AO IAM team decision          │
         │  (see OPEN-RISKS.md RISK-04)                           │
         └─────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────────────────┐
         │  SHAREPOINT (Read-only reference, not in boundary)      │
         │  • Artifact links in innovation_records point to       │
         │    authenticated SharePoint URLs                        │
         │  • The Hub does NOT read from or write to SharePoint   │
         │  • Users access SharePoint documents via their own     │
         │    browser sessions — the Hub only stores the URL      │
         └────────────────────────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────────────────────────────────┐
         │  EMAIL (Outbound only — engagement routing)             │
         │  • engagement_routing_email (hub_settings) receives    │
         │    formatted engagement request notifications           │
         │  • AO email infrastructure (.gov SMTP relay)           │
         │  • No inbound email to the Hub                         │
         └────────────────────────────────────────────────────────┘
```

---

## System Components

### Within the Authorization Boundary

| Component | Technology | Role | Network Exposure |
|-----------|-----------|------|-----------------|
| Frontend Container | React, Nginx | Static UI serving + API proxy | Internal only; exposed via HTTPS load balancer |
| API Container | Node.js 18, Express | Business logic, auth enforcement, API endpoints | Internal only (port 8080); reached via frontend proxy |
| PostgreSQL 16 Container | PostgreSQL 16 | Persistent data store | Internal only (port 5432); no external exposure |

### External to the Authorization Boundary (but interfacing)

| Component | Type | Interface | Notes |
|-----------|------|-----------|-------|
| Browser (court staff) | External client | HTTPS inbound to load balancer | Authenticated users only for CURATOR/ADMIN actions |
| Identity Provider (AO Azure AD / Entra) | External OIDC IDP | HTTPS OIDC authorization code flow | TBD — see OPEN-RISKS.md |
| SharePoint (AO) | External document store | URLs only; no API integration | Hub stores links; does not read SharePoint |
| AO Email Relay | External SMTP | Outbound only (engagement notifications) | .gov SMTP relay; no inbound |

---

## Data Flows

### Read — Catalog Browse (Unauthenticated)
```
Browser → HTTPS LB → Nginx → /api/catalog → Express API → PostgreSQL
  ← innovation_records WHERE publication_state='PUBLISHED' ←
```

### Write — Curator Creates Record (Authenticated)
```
Browser (CURATOR) → HTTPS LB → Nginx → /api/records POST
  → Express API (AuthMiddleware validates JWT) → PostgreSQL INSERT
  → AuditLog INSERT (automated)
```

### Engagement Request
```
Browser (any authenticated) → /api/engage POST
  → Express API → PostgreSQL INSERT engagement_requests
  → Email notification → AO SMTP Relay → Curator inbox
```

### Authentication Flow
```
Browser → /auth/login → Redirect to IDP (AO Azure AD)
  → OIDC authorization code → /auth/callback
  → API validates token with IDP JWKS endpoint
  → JWT stored in httpOnly cookie (session duration TBD)
```

---

## Network Segmentation

- **PostgreSQL port 5432** is NOT exposed outside the Docker network. Only the API container may connect to the database.
- **API port 8080** is NOT exposed directly to external clients. All external traffic routes through Nginx.
- **Frontend port 3000** is exposed only through the HTTPS load balancer.
- All inter-service traffic within the Docker network is on the `tsio_hub_network` Docker network (bridge).

---

## Hosting

**Status: TBD** — See OPEN-RISKS.md RISK-01.

Anticipated: AO Azure Government Cloud, FedRAMP High boundary, within existing AO cloud tenant. Specific subscription, resource group, and hosting topology pending AO hosting team decision.

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Review: AO Infrastructure Team, ISSO*
