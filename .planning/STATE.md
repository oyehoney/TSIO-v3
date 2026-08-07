# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-28)

**Core value:** A stakeholder with a mission problem can find relevant I&R innovation work, understand what was tested and learned, and take a clear next action — without needing to know the original project name, team, or document location.
**Current focus:** Phase 1 — Foundation & Platform

## Current Position

Phase: 1 of 6 (Foundation & Platform)
Plan: 0 of 5 in current phase
Status: Ready to plan
Last activity: 2026-08-04 - UAT re-verified express task implement-full-tsio-innovation-hub-web-a (99/99 passed, 2 fix cycles); security audit OPEN_THREATS (3 HIGH — see SECURITY.md)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Architecture: Monolithic web app + REST API, PostgreSQL with native FTS (tsvector + GIN). No microservices, no external search service.
- Auth: OIDC/Azure AD (Microsoft Entra ID). THREE roles: PUBLIC (anon), CURATOR (record management), ADMIN (settings + user management).
- Hosting: TBD — federal ATO environment; architecture is deployment-agnostic until decision is made. Prioritize in Phase 1 discovery.
- Engagement routing: Configurable email (initial: AOml_TSO_IRB_Team@ao.uscourts.gov); stored in hub_settings table, changeable without code deploy.
- Content cold-start mitigation: Commit to 3–5 curated records at launch; Audio Security POC is anchor record (Phase 6).

### Pending Todos

None yet.

### Blockers/Concerns

- Hosting environment and identity provider configuration are TBD. Phase 1 must resolve or at least scope these before auth work begins. Design frontend to be hosting-agnostic until decision is made.

### Express Tasks Completed

| # | Description | Date | Commit | Directory | UAT |
|---|-------------|------|--------|-----------|-----|
| implement-full-tsio-innovation-hub-web-a | Implement full TSIO Innovation Hub web application — all 10 features F0–F9 | 2026-08-04 | 39720ac | [implement-full-tsio-innovation-hub-web-a](./express/implement-full-tsio-innovation-hub-web-a/) | ✓ 99/99 · Security: OPEN_THREATS (3H) |

## Session Continuity

Last session: 2026-08-04
Stopped at: UAT re-verification complete — 99/99 Playwright tests passed (2 fix cycles; chromium deps installed). Security audit ran: OPEN_THREATS — 3 HIGH findings in SECURITY.md (test-seed endpoint, rate-limit X-FF spoofing, CAPTCHA fail-open). Dev-server wrapper regenerated (catalog: agent-synthesized). Boot-smoke PASS (2 attempts; fixed consrc→pg_get_constraintdef in verify SQL).
Resume file: None
