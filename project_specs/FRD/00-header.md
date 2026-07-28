# FRD: TSIO Innovation Hub

**Document Type:** Functional Requirements Document  
**Project Acronym:** TSIO-Innovation-Hub  
**Domain:** Federal Judiciary — Administrative Office of the U.S. Courts, TSIO Innovation & Research (I&R) Branch  
**Date:** 2026-07-28  
**Version:** 1.0 — MVP  
**Status:** Active  
**Derived from:** PRD-TSIO-Innovation-Hub.md (2026-07-28)

---

## Scope

This FRD specifies the detailed functional behavior of every feature in the TSIO Innovation Hub MVP. It defines inputs, outputs, validation rules, error handling, database schema, and API contracts to a level of precision sufficient for development without further clarification. The FRD is organized as a series of per-feature specifications (F00–F09) followed by consolidated cross-feature artifacts (database schema, API catalog, error catalog, integration points).

This FRD does not specify visual design, hosting environment configuration, identity provider configuration, or deployment procedures. Those are addressed in separate technical and infrastructure deliverables.

---

## Conventions

### How to Read This Document

- **Feature IDs** follow the PRD: F0 → F00, F1 → F01, … F9 → F09 (zero-padded for sort order).
- **Sub-letter suffixes** (e.g., F02a, F02b) indicate that a single PRD feature was split across two chunk files for document size management. Together they form the complete spec for that feature.
- **Cross-reference notation:** `see F03 §Process step 2` means: see feature F03, the Process section, step 2.
- **Cross-feature artifacts:** Full database DDL is in `Y0-schema.md`. Full REST API specs are in `Y1-api.md`. Error codes are in `Y2-errors.md`. Integration contracts are in `Y3-integrations.md`. Each feature chunk contains a brief summary of its relevant schema and API surfaces, with a pointer to the cross-feature file.
- **Required fields** in inputs are marked `(required)`. Optional fields are marked `(optional)`.
- **HTTP status codes** follow standard RFC 7231 semantics.
- **`CURATOR`** role: authenticated I&R team member with write access to curation interface.
- **`PUBLIC`** role: any unauthenticated user accessing the public Hub.

### Field Naming Conventions

- All API field names use `snake_case`.
- All database column names use `snake_case`.
- All enum values use `UPPER_SNAKE_CASE` in API responses; human-readable labels are separate.
- Timestamps are ISO 8601 UTC (`2026-07-28T00:00:00Z`).

---

## Master Table of Contents

| Section | File | Description |
|---------|------|-------------|
| F00 | `F00-innovation-catalog.md` | Innovation Catalog — browsable record surface |
| F01 | `F01-search-and-discovery.md` | Search and Discovery — full-text problem-first search |
| F02a | `F02a-innovation-record.md` | Innovation Record — description, sub-features, process |
| F02b | `F02b-innovation-record.md` | Innovation Record — inputs, outputs, validation, errors |
| F03 | `F03-executive-technical-perspectives.md` | Executive and Technical Perspectives |
| F04 | `F04-lessons-learned-integration.md` | Existing Lessons-Learned Integration |
| F05 | `F05-opportunity-submission.md` | Opportunity Submission |
| F06 | `F06-share-existing-innovation.md` | Share Existing Innovation Work |
| F07 | `F07-engagement-routing.md` | Engagement Routing |
| F08a | `F08a-curation-administration.md` | Curation & Administration — description, process |
| F08b | `F08b-curation-administration.md` | Curation & Administration — inputs, validation, errors |
| F09 | `F09-content-maturity-trust-model.md` | Content, Maturity & Trust Model |
| Y0 | `Y0-schema.md` | Database Schema — full DDL |
| Y1 | `Y1-api.md` | REST API Catalog |
| Y2 | `Y2-errors.md` | Cross-Feature Error Catalog |
| Y3 | `Y3-integrations.md` | External Integration Points |

---

## Shared Terminology (Cross-Feature)

The following terms are used across multiple features. Feature-specific terms are defined in each feature chunk.

- **Innovation Record:** The structured, authoritative representation of a single innovation effort in the Hub. Every catalog entry, search result, and engagement action traces back to a record.
- **Maturity Level:** A curator-assigned classification indicating the development stage of an innovation effort. Five levels: Idea, Experiment/POC, Prototype/Pilot, Production/Validated Pattern, Archived.
- **Review Status:** A curator-assigned classification indicating what governance reviews have been completed for an innovation record. Seven statuses: Submitted, Curated, Technically Reviewed, Security Reviewed, Policy Reviewed, Validated for Reuse, Superseded/Retired.
- **Publication Lifecycle:** The controlled state machine governing record visibility: Draft → Review → Published → Superseded / Archived. Only Published records are visible to non-curators.
- **Curator:** An authorized I&R team member with write access to the curation interface. Responsible for creating, enriching, and governing innovation records.
- **Trust Disclaimer:** A required statement rendered on every published record clarifying the limitations of maturity, publication, and validation status.
- **Artifact Link:** An external URL pointing to an authoritative source document (SharePoint, GitHub, video recording, etc.). The Hub links to artifacts but does not copy or host them.
- **Engagement Request:** A trackable record of a stakeholder action (demo request, adoption discussion request, technical guidance request, briefing request) tied to a specific Innovation Record.
- **Opportunity Submission:** A structured submission from a stakeholder describing a mission problem for I&R consideration.
- **Contribution Submission:** A structured submission from a team outside I&R sharing existing innovation work for curation.
- **Executive Perspective:** The audience-framed view of an Innovation Record optimized for decision-makers and senior leadership.
- **Technical Perspective:** The audience-framed view of an Innovation Record optimized for technical staff, architects, and developers.
- **Mission Area:** A classification tag aligning an innovation record to a Judiciary mission domain (e.g., case management, cybersecurity, court operations).
- **Technology Area:** A classification tag identifying the technology domain of an innovation effort (e.g., AI/ML, cloud infrastructure, identity management).
- **Reuse Potential:** A curator-assigned indicator of how readily an innovation effort can be adopted or adapted by another court or team.
- **Audit History:** A log of material changes to an Innovation Record, including the timestamp, acting user, and field changed.
- **Last-Reviewed Date:** The date on which a curator last reviewed the content and accuracy of an Innovation Record. Required for publication.
- **Configurable Routing Email:** The email address to which engagement requests and submissions are routed. Must be changeable by a curator without a code deployment.
- **P0 / P1 / P2:** PRD priority tiers. P0 = MVP launch blocker; P1 = high-value MVP feature; P2 = late-MVP or post-MVP.

---

*End of 00-header.md — continues in F00-innovation-catalog.md*
