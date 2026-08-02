# Open Risk Items — TSIO Innovation Hub ATO Package

**Document:** Open Risk Register (Pre-ATO)  
**System:** TSIO Innovation Hub  
**Version:** 1.0  
**Date:** 2026-08-02  
**Status:** Active — items require resolution before ATO approval

---

## Purpose

This document identifies open risk items that must be resolved, accepted, or formally mitigated before the TSIO Innovation Hub can receive an Authority to Operate (ATO). It is intended for ISSO, AO Privacy Officer, and ATO decision authority review.

Risk items are categorized by type and assigned a risk level. Items marked **BLOCKING** must be resolved before ATO approval. Items marked **CONDITIONAL** may be accepted with compensating controls or a Plan of Action and Milestones (POA&M).

---

## Risk Register

### RISK-01: Hosting Environment TBD

| Field | Value |
|-------|-------|
| **ID** | RISK-01 |
| **Type** | Infrastructure |
| **Severity** | HIGH |
| **Status** | OPEN — BLOCKING |
| **Owner** | AO Cloud Infrastructure Team |

**Description:** The production hosting environment for the TSIO Innovation Hub has not been confirmed. The system is designed for AO Azure Government Cloud (FedRAMP High), but the specific subscription, resource group, hosting topology (container hosting vs. Azure App Service vs. AKS), and responsible hosting team have not been designated.

**Impact:**
- TLS certificate source cannot be confirmed
- Network segmentation design cannot be finalized
- Backup and recovery procedures cannot be documented
- Encryption-at-rest configuration cannot be verified
- FedRAMP control inheritance cannot be claimed

**Resolution Required:**
1. AO Cloud Infrastructure Team designates responsible subscription and resource group
2. Hosting topology confirmed (Azure Container Apps / App Service / AKS)
3. Security Assessment Report (SAR) for hosting environment shared with ISSO
4. System Interconnection Agreement (if shared infrastructure) documented

---

### RISK-02: Backup and Disaster Recovery Not Defined

| Field | Value |
|-------|-------|
| **ID** | RISK-02 |
| **Type** | Availability / Continuity |
| **Severity** | MEDIUM |
| **Status** | OPEN — CONDITIONAL |
| **Owner** | AO Cloud Infrastructure Team |
| **Depends on** | RISK-01 (hosting decision) |

**Description:** Database backup schedule, retention period, point-in-time recovery (PITR) capability, and Recovery Time Objective (RTO) / Recovery Point Objective (RPO) have not been defined. PostgreSQL backup strategy is hosting-dependent.

**Compensating Control:** Innovation Hub content (innovation records, seeds) is version-controlled in the Git repository and can be re-seeded. The highest-risk data (engagement requests with PII) would require database restoration. A formal backup SLA is required before ATO.

**Resolution Required:** Define backup schedule (daily minimum), retention period (30 days minimum recommended), PITR window, and RTO/RPO targets aligned with system criticality.

---

### RISK-03: Penetration Testing Not Completed

| Field | Value |
|-------|-------|
| **ID** | RISK-03 |
| **Type** | Security Assessment |
| **Severity** | HIGH |
| **Status** | OPEN — BLOCKING (or CONDITIONAL with POA&M) |
| **Owner** | TSIO / AO Security |

**Description:** No formal penetration test or vulnerability assessment has been conducted against the TSIO Innovation Hub application. The application has not been reviewed by an independent security assessor.

**Impact:** ATO authority cannot rely solely on developer-performed security review. Independent assessment is required under FISMA/RMF.

**Compensating Control (if POA&M accepted):**
- Static Application Security Testing (SAST) has been performed via ESLint security rules
- All database queries are parameterized (no SQL injection risk)
- JWT validation uses `jose` library with JWKS verification
- No secrets are hardcoded in the codebase

**Resolution Required:** Schedule and complete Application Security Assessment (ASA) or penetration test against a staging environment before ATO approval, OR obtain ISSO acceptance of a POA&M with a committed completion date within 90 days of ATO.

---

### RISK-04: Identity Provider (IDP) Not Selected

| Field | Value |
|-------|-------|
| **ID** | RISK-04 |
| **Type** | Authentication |
| **Severity** | HIGH |
| **Status** | OPEN — BLOCKING |
| **Owner** | AO IAM Team / TSIO |

**Description:** The OIDC Identity Provider for the TSIO Innovation Hub has not been formally designated by the AO IAM team. The application is designed to integrate with AO Azure Active Directory / Microsoft Entra ID, but the specific Entra tenant, application registration, client ID, and issuer URL have not been provisioned.

**Impact:**
- Authentication cannot be tested in production-equivalent environment
- MFA enforcement policy cannot be confirmed
- PIV/CAC requirement (if applicable) cannot be verified
- Session timeout and token expiry policy cannot be set per AO IAM policy

**Resolution Required:**
1. AO IAM Team provisions Entra application registration for TSIO Innovation Hub
2. Client ID, authority URL, and redirect URIs confirmed
3. MFA enforcement policy confirmed (mandatory MFA expected)
4. PIV/CAC enforcement decision documented
5. Session duration policy confirmed
6. Application integration tested in AO Entra tenant before go-live

---

### RISK-05: Session Duration and Token Expiry Policy TBD

| Field | Value |
|-------|-------|
| **ID** | RISK-05 |
| **Type** | Authentication / Policy |
| **Severity** | MEDIUM |
| **Status** | OPEN — CONDITIONAL |
| **Owner** | AO IAM Team |
| **Depends on** | RISK-04 (IDP selection) |

**Description:** JWT token expiry duration and session timeout policy have not been confirmed. Default JWT expiry from the IDP will be used until AO IAM policy is confirmed.

**Compensating Control:** The application enforces JWT `exp` claim on every request. Expired tokens result in 401 and redirect to /auth/login. No session persistence beyond token expiry.

**Resolution Required:** AO IAM Team confirms maximum session duration and idle timeout requirements. Implementation updated to match policy (e.g., sliding session refresh, absolute timeout).

---

### RISK-06: Audit Log Retention Policy Not Defined

| Field | Value |
|-------|-------|
| **ID** | RISK-06 |
| **Type** | Compliance / Records |
| **Severity** | MEDIUM |
| **Status** | OPEN — CONDITIONAL |
| **Owner** | AO Records Officer / ISSO |

**Description:** Retention periods for `audit_log`, `engagement_requests`, `opportunity_submissions`, and `contribution_submissions` tables have not been formally defined against the AO Records Schedule.

**Impact:** Without a defined retention policy, data accumulates indefinitely or may be deleted without authorization.

**Compensating Control:** No automated deletion is implemented — all records are retained until a retention policy is defined and implemented.

**Resolution Required:** AO Records Officer reviews applicable records schedule. Retention periods defined. Automated purge/archival mechanism implemented per approved schedule.

---

### RISK-07: Privacy Impact Assessment (PIA) Not Completed

| Field | Value |
|-------|-------|
| **ID** | RISK-07 |
| **Type** | Privacy |
| **Severity** | HIGH |
| **Status** | OPEN — BLOCKING |
| **Owner** | AO Privacy Officer |

**Description:** A formal Privacy Impact Assessment (PIA) has not been completed for the TSIO Innovation Hub. The system collects PII in the following tables: `users` (email, display_name, OIDC subject identifier), `engagement_requests` (requester name, email, court), `opportunity_submissions` (submitter name, email, court), `contribution_submissions` (submitter name, email, court).

**Impact:** Per the E-Government Act of 2002 and AO Privacy Policy, a PIA is required before deployment of any system that collects PII from Judiciary staff.

**Resolution Required:** AO Privacy Officer conducts PIA. System of Records Notice (SORN) determination made. If a new SORN is required, publication in the Federal Register is necessary before production deployment.

---

### RISK-08: Accessibility Compliance (Section 508) Assessment TBD

| Field | Value |
|-------|-------|
| **ID** | RISK-08 |
| **Type** | Compliance / Accessibility |
| **Severity** | MEDIUM |
| **Status** | OPEN — CONDITIONAL |
| **Owner** | TSIO / AO Accessibility Program |

**Description:** A formal Section 508 accessibility assessment has not been completed for the TSIO Innovation Hub frontend. The UI uses semantic HTML, ARIA attributes, and keyboard navigation patterns, but has not been tested with assistive technology (JAWS, NVDA, VoiceOver) or reviewed by an accessibility auditor.

**Compensating Control:** React components use semantic HTML5 elements. ARIA labels applied to interactive elements. Color contrast reviewed against WCAG 2.1 AA requirements.

**Resolution Required:** Section 508 conformance assessment conducted by AO Accessibility Program or independent auditor before public rollout. Remediation plan if deficiencies found.

---

## Risk Summary

| Risk ID | Description | Severity | Status | Blocking? |
|---------|-------------|----------|--------|-----------|
| RISK-01 | Hosting TBD | HIGH | OPEN | **BLOCKING** |
| RISK-02 | Backup/DR not defined | MEDIUM | OPEN | Conditional |
| RISK-03 | Pen test not completed | HIGH | OPEN | **BLOCKING** or POA&M |
| RISK-04 | IDP not selected | HIGH | OPEN | **BLOCKING** |
| RISK-05 | Session duration TBD | MEDIUM | OPEN | Conditional |
| RISK-06 | Audit retention TBD | MEDIUM | OPEN | Conditional |
| RISK-07 | PIA not completed | HIGH | OPEN | **BLOCKING** |
| RISK-08 | 508 assessment TBD | MEDIUM | OPEN | Conditional |

**Blocking items before ATO:** RISK-01, RISK-03 (or POA&M), RISK-04, RISK-07

---

## Items Not Listed as Risks (Resolved or Accepted)

| Item | Status |
|------|--------|
| SQL injection | Mitigated — parameterized queries throughout |
| XSS in catalog content | Mitigated — React JSX auto-escaping; no dangerouslySetInnerHTML |
| Seed script in production | Accepted — run_seeds.sh documented as dev/demo only; excluded from prod deployment pipeline |
| CSRF | Mitigated — SameSite=Strict cookie; OIDC state parameter |
| Hardcoded credentials | Accepted — no production credentials in codebase; DATABASE_URL injected via environment |

---

*Last updated: 2026-08-02 | Owner: TSIO I&R Branch | Review: ISSO, AO Privacy Officer, ATO Authority*
