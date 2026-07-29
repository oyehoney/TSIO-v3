# UX Mockup — TSIO Innovation Hub

**Project:** TSIO Innovation Hub
**Generated:** 2026-07-29
**Based on:** UserStories-TSIO-Innovation-Hub.md, JOURNEYS-TSIO-Innovation-Hub.md, PRD-TSIO-Innovation-Hub.md, FRD-TSIO-Innovation-Hub.md
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research Branch
**Accessibility Standard:** WCAG 2.1 AA (required for Federal government deployment)

---

## Overview

The TSIO Innovation Hub is a **governed discovery and engagement platform**, not a document library. Every design decision serves one of three objectives:

1. **Discovery** — stakeholders find prior I&R work by describing a mission problem, not a project name
2. **Understanding** — the maturity, review status, and trust signals on every record let stakeholders make informed decisions without relying on informal channels
3. **Engagement** — every record drives a clear next action (briefing request, adoption discussion, technical guidance)

### Design Principles

| Principle | UX Implication |
|-----------|----------------|
| **Engagement over archival** | Every screen answers "so what do I do now?" — no dead ends |
| **Trust integrity** | Maturity badges and trust disclaimers are prominent, not tucked away |
| **Problem-first discovery** | Search and catalog language centers on mission problems, not project titles |
| **One record, two perspectives** | Executive / Technical toggle is always visible; neither view is subordinate |
| **Maintainability over novelty** | Clean government-appropriate typography, high-contrast layout, no decorative complexity |

### Tone and Visual Character

- **Government-professional:** Clean, structured, high-information-density appropriate for Judiciary stakeholders
- **Trust-forward:** Color-coded maturity badges, prominent review status, and explicit trust disclaimers communicate governance seriousness
- **Accessible-first:** Color is never the sole differentiator; all badges carry text labels; keyboard navigation throughout

### Color System for Trust Signals

| Maturity Level | Badge Color | Hex Suggestion |
|----------------|-------------|----------------|
| Idea | Gray | `#6B7280` |
| Experiment / POC | Yellow/Amber | `#D97706` |
| Prototype / Pilot | Orange | `#EA580C` |
| Production / Validated | Green | `#16A34A` |
| Archived | Dark Gray | `#374151` |

All badge colors must meet 4.5:1 contrast ratio against white and badge background per WCAG 2.1 AA.

---

## Navigation Map

| Screen | Route | Reached From | Nav Element |
|--------|-------|--------------|-------------|
| Innovation Catalog | `/` and `/catalog` | App shell | Top nav: "Catalog" / Hub logo |
| Search Results | `/search?q=...` | App shell (search bar on every page) | Global search bar → submit |
| Innovation Record — Executive View | `/records/{id}` | Catalog card / Search result / Direct link | Card click / Result click |
| Innovation Record — Technical View | `/records/{id}?view=technical` | Innovation Record (Executive) | Perspective toggle: "Technical View" |
| Opportunity Submission Form | `/submit-opportunity` | Catalog empty state / Search empty state / Record page CTA / Top nav | "Submit a Mission Problem" link |
| Opportunity Submission Confirmation | `/submit-opportunity/confirmation` | Opportunity Submission Form | Form submit success |
| Contribution Submission Form | `/share-innovation` | Catalog page CTA / Top nav | "Share Your Innovation Work" link |
| Contribution Submission Confirmation | `/share-innovation/confirmation` | Contribution Submission Form | Form submit success |
| Engagement Request Modal | Modal on `/records/{id}` | Innovation Record (both perspectives) | Next-Action panel button |
| Admin — Dashboard | `/admin` | App shell (authenticated) | Admin nav: "Dashboard" |
| Admin — Records List | `/admin/records` | Admin Dashboard / Admin nav | Dashboard quick-link / Sidebar: "Records" |
| Admin — Record Create/Edit | `/admin/records/new` and `/admin/records/{id}/edit` | Records List / Dashboard | "New Record" button / Row "Edit" action |
| Admin — Record Audit History | `/admin/records/{id}/audit` | Admin Record Edit view | Record edit view: "View Audit History" tab |
| Admin — Submission Queue (Opportunities) | `/admin/submissions/opportunities` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Submissions → Opportunities" |
| Admin — Submission Queue (Contributions) | `/admin/submissions/contributions` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Submissions → Contributions" |
| Admin — Engagement Activity Log | `/admin/engagement` | Admin Dashboard / Sidebar | Dashboard tile / Sidebar: "Engagement" |
| Admin — Settings | `/admin/settings` | Admin nav | Sidebar: "Settings" |
| Admin — Content Model Reference | `/admin/content-model` | Admin nav | Sidebar: "Content Model Reference" |

**Invariant — no orphan screens:** All screens above trace to the app shell (top nav / admin sidebar) or a reachable parent. The Engagement Request Modal is not a standalone route; it is triggered from the Innovation Record page. Confirmation screens are reached only through successful form submissions.

---

## Personas Quick Reference

| ID | Name | Role | Primary Screens |
|----|------|------|-----------------|
| PER-01 | Margaret Hollis | Decision-Maker / Executive | Catalog, Record (Executive), Opportunity Submission, Engagement Modal |
| PER-02 | David Reyes | Operational Leader / Court Administrator | Search, Record (Executive + Reuse Guidance), Opportunity Submission |
| PER-03 | Priya Nair | Technical Adopter / Court IT Staff | Record (Technical), Search, Engagement Modal (Technical Guidance) |
| PER-04 | Marcus Webb | Innovation Contributor / Court Team Lead | Contribution Submission Form, Catalog (viewing attribution) |
| PER-05 | Catalina Torres | I&R Curator / TSIO Team Member | All Admin screens |

---

*End of 00-overview.md*
