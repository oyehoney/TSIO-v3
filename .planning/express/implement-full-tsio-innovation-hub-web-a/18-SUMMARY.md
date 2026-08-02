---
phase: implement-full-tsio-innovation-hub-web-a
plan: "18"
subsystem: E2E integration validation and gap closure
tags: [integration, testing, gap-closure, report]

dependency_graph:
  requires:
    - "All prior 17 plans complete"
  provides:
    - "docs/INTEGRATION-REPORT.md — full test results, deviations, live-env requirements"
    - "Route registration audit — all 18 API + web routes confirmed registered in src/app.js"
    - "TypeScript build verified clean (0 errors)"

key_files:
  created:
    - path: "docs/INTEGRATION-REPORT.md"
      purpose: "Full integration status: 20 passing tests, 117 DB-required tests, TypeScript clean, route audit, ATO checklist, deviations"

commits:
  - hash: "pending"
    message: "feat(implement-full-tsio-innovation-hub-web-a-18): E2E integration validation, gap closure, integration report"

test_results:
  passing: 20
  requires_live_db: 117
  typescript_errors: 0
  playwright_blocked: true
  playwright_reason: "libglib-2.0.so.0 missing in sandbox — install Chromium deps to enable"

known_deviations:
  - "Plans 09/10/11: React/Vite components in plans; implemented as Express+EJS SSR (functionally equivalent)"
  - "Plan 12: Share Innovation form (/share-innovation) partially implemented — F6 is P2/late-MVP"
  - "F6 contribution submission frontend: deferred (P2 feature per PRD)"

live_environment_requirements:
  - feature: "Full DB integration tests (117)"
    command: "docker-compose up -d && npm test"
  - feature: "Seed records verification"
    command: "npm run db:seed then GET /api/v1/catalog"
  - feature: "OIDC login flow"
    requirement: "Azure AD app registration (OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER_URL)"
  - feature: "Email routing"
    requirement: "SMTP credentials in .env"
  - feature: "CAPTCHA"
    requirement: "RECAPTCHA_SITE_KEY + RECAPTCHA_SECRET_KEY"
  - feature: "Playwright e2e"
    command: "sudo npx playwright install-deps chromium && npx playwright test"
  - feature: "Performance baseline (p95 < 3s)"
    command: "k6 run docs/performance-k6.js"
