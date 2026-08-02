---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: complete
stopped_at: Completed implement-full-tsio-innovation-hub-web-a-18-PLAN.md (all 18 express plans done)
last_updated: "2026-08-02T06:30:00Z"
last_activity: 2026-08-02 — All 18 express execution plans complete; full application built; ATO docs written
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 24
  completed_plans: 24
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-28)

**Core value:** A stakeholder with a mission problem can find relevant I&R innovation work, understand what was tested and learned, and take a clear next action — without needing to know the original project name, team, or document location.
**Current focus:** Phase 1 — Foundation & Platform

## Current Position

Phase: 6 of 6 (Content Seeding & Launch Polish) — COMPLETE
Plan: 18 of 18 express execution plans complete
Status: Built — pending live environment validation (OIDC, SMTP, CAPTCHA, full DB test suite)
Last activity: 2026-08-02 — All 18 express execution plans complete

Progress: [██████████] 100%

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
| Phase implement-full-tsio-innovation-hub-web-a P10 | 90 | 2 tasks | 13 files |
| Phase implement-full-tsio-innovation-hub-web-a P11 | 84 | 2 tasks | 18 files |
| Phase implement-full-tsio-innovation-hub-web-a P13 | 45 | 3 tasks | 8 files |
| Phase implement-full-tsio-innovation-hub-web-a P14 | 45 | 2 tasks | 14 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Architecture: Monolithic web app + REST API, PostgreSQL with native FTS (tsvector + GIN). No microservices, no external search service.
- Auth: OIDC/Azure AD (Microsoft Entra ID). THREE roles: PUBLIC (anon), CURATOR (record management), ADMIN (settings + user management).
- Hosting: TBD — federal ATO environment; architecture is deployment-agnostic until decision is made. Prioritize in Phase 1 discovery.
- Engagement routing: Configurable email (initial: AOml_TSO_IRB_Team@ao.uscourts.gov); stored in hub_settings table, changeable without code deploy.
- Content cold-start mitigation: Commit to 3–5 curated records at launch; Audio Security POC is anchor record (Phase 6).
- [Phase implement-full-tsio-innovation-hub-web-a]: SearchPage uses EJS SSR (not React SPA): adapted all components to EJS templates, direct searchService.js calls, TEST_MOCK_SEARCH fixture mode for Playwright tests
- [Phase implement-full-tsio-innovation-hub-web-a P11]: RecordPage dual implementation: EJS SSR (record.ejs) is the functional page; React TSX components (src/client/) provide the SPA layer. onEngagementRequest noop stub documented for Wave 5 wiring. Test-seed endpoint gated on NODE_ENV !== 'production' (T-11-07).
- [Phase implement-full-tsio-innovation-hub-web-a P13]: CaptchaWidget uses grecaptcha global API (not react-google-recaptcha npm) to avoid require() in browser-targeted TS. Dev-bypass via window.__ENV.CAPTCHA_SITE_KEY absence. WCAG focus trap uses document keydown listener + useRef triggerButtonRef in RecordPage for focus return on modal close.
- [Phase implement-full-tsio-innovation-hub-web-a P14]: Admin SPA uses BrowserRouter + nested /admin routes with ProtectedRoute calling useAdminAuth(). Auth gate checks CURATOR session via dashboard-summary endpoint. Wave 6c placeholder routes render real JSX divs. GovernanceGate is client-side only (17 pub-required fields); server-side gate in Wave 6b RecordService. Playwright e2e tests use page.route() for API interception (no DB dependency).

### Pending Todos

None yet.

### Blockers/Concerns

- Hosting environment and identity provider configuration are TBD. Phase 1 must resolve or at least scope these before auth work begins. Design frontend to be hosting-agnostic until decision is made.

## Session Continuity

Last session: 2026-08-02T05:30:00Z
Stopped at: Completed implement-full-tsio-innovation-hub-web-a-14-PLAN.md
Resume file: None
