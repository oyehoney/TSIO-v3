# Authentication and Authorization Controls — TSIO Innovation Hub

**Document:** Auth/AuthZ Controls Description  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Draft — pending ISSO review and IDP selection

---

## Overview

This document describes the authentication (AuthN) and authorization (AuthZ) controls implemented in the TSIO Innovation Hub. It supports COMP-05 and related ATO control families (IA, AC) for the ATO package.

---

## Authentication

### Mechanism

The TSIO Innovation Hub uses **OpenID Connect (OIDC) via Authorization Code Flow** for all authenticated sessions.

| Attribute | Value |
|-----------|-------|
| Protocol | OpenID Connect 1.0 (OAuth 2.0 Authorization Code Flow) |
| IDP | AO Azure Active Directory / Microsoft Entra ID (TBD — see OPEN-RISKS.md RISK-04) |
| Token type | JWT (JSON Web Token) — `id_token` + `access_token` |
| Token validation | API validates JWT signature against IDP JWKS endpoint (`/.well-known/jwks.json`) |
| Session storage | httpOnly, Secure, SameSite=Strict cookie containing JWT |
| Session duration | TBD — pending AO IAM policy guidance |
| Token library | `jose` (Web Crypto API compatible JWT library) |

### Authentication Flow

```
1. User navigates to authenticated route
2. Frontend redirects to /auth/login
3. API redirects to IDP authorization endpoint with:
   - response_type=code
   - scope=openid profile email
   - redirect_uri=/auth/callback
   - state=<CSRF nonce>
4. User authenticates with IDP (AO credentials — PIV/CAC or password + MFA)
5. IDP issues authorization code to /auth/callback
6. API exchanges code for tokens at IDP token endpoint
7. API validates id_token (signature, iss, aud, exp claims)
8. API upserts user record in users table (user_id, email, display_name, oidc_sub)
9. API sets httpOnly JWT cookie
10. User is redirected to original destination
```

### Session Security

| Control | Implementation |
|---------|---------------|
| httpOnly cookie | Prevents JavaScript access to JWT token |
| Secure flag | Cookie only transmitted over HTTPS |
| SameSite=Strict | Mitigates CSRF for cookie-based sessions |
| Token expiry | JWT exp claim enforced by AuthMiddleware on every request |
| JWKS caching | IDP public keys fetched and cached; rotated on 401 from IDP |
| State parameter | CSRF nonce on /auth/login → validated on /auth/callback |

### Non-Authenticated Access

Public catalog browse (`GET /api/catalog`, `GET /api/records/:id`) does **not** require authentication. Anonymous users may view PUBLISHED innovation records. All write operations and submission endpoints require a valid JWT.

---

## Authorization — Role-Based Access Control (RBAC)

### Roles

| Role | Description | Assignment |
|------|-------------|-----------|
| `VIEWER` | Read-only access to PUBLISHED catalog content | Any authenticated Judiciary staff member |
| `CURATOR` | Can create, edit, publish, and archive innovation records | Assigned by ADMIN; limited to I&R staff |
| `ADMIN` | Full system access including user management and hub settings | Limited to TSIO technical leads; assigned manually |

**Default role:** New users authenticated via OIDC are assigned `VIEWER` unless a CURATOR or ADMIN manually elevates them.

### Role Assignment

- Roles are stored in the `users.role` column.
- Role changes require ADMIN action via the admin interface.
- No self-service role elevation is permitted.
- The seed curator (`00000000-0000-0000-0000-000000000001`) is created with `CURATOR` role for development/demo environments only.

### Authorization Matrix

| Operation | Anonymous | VIEWER | CURATOR | ADMIN |
|-----------|-----------|--------|---------|-------|
| Browse PUBLISHED catalog | ✓ | ✓ | ✓ | ✓ |
| View individual PUBLISHED record | ✓ | ✓ | ✓ | ✓ |
| Full-text search (PUBLISHED) | ✓ | ✓ | ✓ | ✓ |
| View DRAFT/REVIEW records | ✗ | ✗ | ✓ (own) | ✓ |
| Create innovation record | ✗ | ✗ | ✓ | ✓ |
| Edit innovation record | ✗ | ✗ | ✓ (own) | ✓ |
| Publish / archive record | ✗ | ✗ | ✓ | ✓ |
| Submit engagement request | ✗ | ✓ | ✓ | ✓ |
| Submit opportunity | ✗ | ✓ | ✓ | ✓ |
| View engagement requests | ✗ | ✗ | ✓ | ✓ |
| View submissions | ✗ | ✗ | ✓ | ✓ |
| Manage hub settings | ✗ | ✗ | ✗ | ✓ |
| Manage users / roles | ✗ | ✗ | ✗ | ✓ |
| View audit log | ✗ | ✗ | ✗ | ✓ |

### AuthMiddleware Implementation

Every API endpoint (except public catalog routes) is protected by `AuthMiddleware`:

```
Request → AuthMiddleware:
  1. Extract JWT from httpOnly cookie
  2. Validate JWT signature using IDP JWKS
  3. Validate exp, iss, aud claims
  4. Look up user in users table by oidc_sub
  5. Attach user (user_id, role) to request context
  6. If role insufficient → 403 Forbidden
  7. If token invalid/expired → 401 Unauthorized (redirect to /auth/login)
```

---

## Transport Security

| Control | Implementation |
|---------|---------------|
| HTTPS enforcement | All external traffic on port 443 (TLS 1.2 minimum; TLS 1.3 preferred) |
| HTTP redirect | HTTP 80 → HTTPS 443 redirect enforced at load balancer/Nginx |
| HSTS | Strict-Transport-Security header set by Nginx |
| Certificate | AO-issued TLS certificate (Let's Encrypt or AO CA — TBD per hosting team) |
| API ↔ DB | Database connection uses `sslmode=require` (enforced in production config) |

---

## CSRF Protection

| Control | Implementation |
|---------|---------------|
| Cookie SameSite=Strict | Primary CSRF mitigation for same-origin form submissions |
| State parameter (OIDC) | CSRF nonce on authorization redirect — validated on callback |
| Content-Type enforcement | API rejects requests without `application/json` Content-Type for write operations |

---

## Input Validation and Injection Prevention

| Control | Implementation |
|---------|---------------|
| Parameterized queries | All database queries use parameterized statements via `pg` library — no string concatenation |
| Request schema validation | Zod schema validation on all API request bodies |
| Output encoding | React JSX auto-escapes HTML — no `dangerouslySetInnerHTML` in catalog UI |
| URL validation | Artifact link URLs validated against HTTPS scheme and allowed domain patterns |

---

## Audit of Auth Events

All authentication and authorization events are recorded in the `audit_log` table:

| Event | Logged |
|-------|--------|
| Successful login | Yes |
| Failed login (JWT validation failure) | Yes |
| Session expiry | Yes |
| Role elevation | Yes |
| Permission denied (403) | Yes |

See AUDIT-LOG-COVERAGE.md for full audit event coverage.

---

## Known Gaps (Pre-ATO)

| Gap | Status | Reference |
|-----|--------|-----------|
| IDP not yet selected | Open | OPEN-RISKS.md RISK-04 |
| MFA enforcement policy | Pending IDP selection | OPEN-RISKS.md RISK-04 |
| Session timeout duration | TBD — pending AO IAM guidance | OPEN-RISKS.md RISK-05 |
| TLS certificate source | TBD — pending hosting decision | OPEN-RISKS.md RISK-01 |
| PIV/CAC enforcement | Depends on IDP capability | OPEN-RISKS.md RISK-04 |

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Review: ISSO, AO IAM Team*
