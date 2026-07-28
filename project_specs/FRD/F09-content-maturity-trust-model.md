---

## F09: Content, Maturity & Trust Model

**PRD Reference:** F9 — Priority P0 (Critical MVP — Foundational)  
**Personas Served:** All (P1–P5)

---

### Description

The Content, Maturity & Trust Model defines the structured vocabulary, classification rules, and display requirements that govern how innovation work is categorized, communicated, and trusted across the Hub. It is not a standalone user-facing feature but the foundational framework that every other feature depends on. The maturity level and review status models are the primary trust signals on every record — they tell stakeholders what development stage an effort has reached and what governance reviews have been completed. These signals must be visibly rendered on every catalog card and Innovation Record page, and they must be enforced in the curation workflow. This feature defines the exact values, labels, display requirements, and behavioral constraints for each signal.

---

### Terminology

- **Maturity Level:** A five-tier curator-assigned classification of how far an innovation effort has progressed from idea to validated pattern.
- **Review Status:** A seven-state curator-assigned classification of what governance reviews have been applied to an innovation effort.
- **Trust Signal:** Any UI element that communicates maturity, review status, or trust disclaimer context to a stakeholder. Trust signals must be visually prominent and unambiguous.
- **Trust Disclaimer:** Required text statements that must appear on every published Innovation Record page, derived from the record's maturity and source type. Not suppressible by curators.
- **Content Model Reference:** The in-app display of maturity and review status definitions available to curators in the admin interface to ensure consistent classification.

---

### Sub-Features

- Maturity level model: 5 levels defined, enforced, and displayed
- Review status model: 7 statuses defined, enforced, and displayed
- Trust disclaimer rendering on every published Innovation Record
- Catalog card trust signal display (maturity badge + review status badge)
- Content model reference view in admin interface
- Filtering support for both models in catalog (F00) and search (F01)
- Maturity and review status are curator-assigned only; never self-reported or automatically derived

---

### Maturity Level Model

Maturity is curator-assigned. Curators may not advance maturity without a deliberate edit action. The following are the authoritative definitions:

| Level | Enum Value | Display Label | Color/Visual | Definition |
|-------|-----------|---------------|--------------|------------|
| 1 | `IDEA` | Idea | Gray | A problem or opportunity has been identified and captured; no technical exploration has yet been conducted |
| 2 | `EXPERIMENT_POC` | Experiment / POC | Yellow | A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive; not production-ready |
| 3 | `PROTOTYPE_PILOT` | Prototype / Pilot | Orange | A working model or limited deployment was built and tested in a realistic environment; not fully validated |
| 4 | `PRODUCTION_VALIDATED` | Production / Validated Pattern | Green | Fully deployed and operational, or a proven architectural pattern validated through formal review |
| — | `ARCHIVED` | Archived | Dark Gray | Work is no longer active; retained for institutional learning; not recommended for adoption |

**Behavioral rules:**
- Maturity level must be assigned before a record can be published.
- Curators may set any maturity level; the system does not auto-advance or auto-restrict maturity based on other fields.
- Maturity level changes are logged to the audit history.
- `ARCHIVED` maturity is distinct from `ARCHIVED` publication state. A record may have `maturity_level = ARCHIVED` while still `publication_state = PUBLISHED` (it will display as archived-content but still publicly visible). Curators should also set `publication_state = ARCHIVED` to remove from default catalog browse.

---

### Review Status Model

Review status is curator-assigned, independent from maturity level. A technically sophisticated POC may lack policy or security review. All statuses are valid regardless of maturity level.

| Status | Enum Value | Display Label | Definition |
|--------|-----------|---------------|------------|
| 1 | `SUBMITTED` | Submitted | Record is in the system; not yet curated by I&R |
| 2 | `CURATED` | Curated | I&R curator has structured and enriched the record; not yet externally reviewed |
| 3 | `TECHNICALLY_REVIEWED` | Technically Reviewed | I&R or AO technical team has assessed architecture and findings |
| 4 | `SECURITY_REVIEWED` | Security Reviewed | Cybersecurity or ISSO review of security implications completed |
| 5 | `POLICY_REVIEWED` | Policy Reviewed | Legal, privacy, or policy review completed |
| 6 | `VALIDATED_FOR_REUSE` | Validated for Reuse | All applicable reviews completed; recommended as a reuse-ready pattern |
| 7 | `SUPERSEDED_RETIRED` | Superseded / Retired | Record replaced by a newer version or retired; retained for institutional record |

**Behavioral rules:**
- Review status must be assigned before a record can be published.
- Review statuses are not a sequential progression — curators assign the highest applicable status. A record may jump from `CURATED` directly to `VALIDATED_FOR_REUSE` if all applicable reviews have been completed simultaneously.
- `VALIDATED_FOR_REUSE` triggers the Reuse Badge display on catalog cards and record pages.
- `SUPERSEDED_RETIRED` review status is distinct from `SUPERSEDED` publication state but they commonly co-occur.

---

### Trust Disclaimer Rules

The following disclaimers are system-derived from record fields and rendered automatically. Curators cannot suppress them. The system evaluates all applicable disclaimers and renders all that apply simultaneously.

| Trigger Condition | Required Disclaimer Text |
|-------------------|--------------------------|
| `maturity_level IN (EXPERIMENT_POC, PROTOTYPE_PILOT)` | "Proof of concept and prototype results do not indicate production readiness. This record should not be interpreted as a recommendation to deploy in a production environment without additional validation." |
| `publication_state = PUBLISHED` (always) | "Publication on the TSIO Innovation Hub indicates curation and structured presentation by the I&R team. It does not constitute formal adoption approval." |
| `source_type = COMMUNITY` | "This record was contributed by a team outside the TSIO I&R branch and curated for the Hub. It is not a centrally endorsed or I&R-conducted effort." |
| `review_status = VALIDATED_FOR_REUSE` | "Validated for Reuse status indicates that applicable I&R reviews have been completed. It does not waive local security, policy, or operational review requirements before adoption in any court environment." |

---

### Process

#### Curator Applies Maturity and Review Status

1. Curator opens Innovation Record in admin interface.
2. Curator selects `maturity_level` from a dropdown with all 5 options and their definitions shown inline.
3. Curator selects `review_status` from a dropdown with all 7 options and their definitions shown inline.
4. Curator saves. Changes are logged to audit history.
5. On publication, system validates both fields are set (governance gate, see F08b).

#### Trust Disclaimer Rendering

1. System evaluates the applicable disclaimer rules against the record's current field values.
2. System renders all applicable disclaimers in a designated "Trust & Limitations" section on the Innovation Record page.
3. This section is rendered before the Next-Action panel, ensuring it is visible before engagement CTAs.
4. Disclaimer text is hard-coded in the system; curators cannot edit disclaimer language.

#### Content Model Reference (Admin)

1. Curator navigates to Admin → Content Model Reference.
2. System renders a read-only reference table of all 5 maturity levels and 7 review statuses with their definitions.
3. This view is always available to curators; it does not require a specific record to be open.

---

### Inputs

- `maturity_level` (enum, pub-required): Set by curator on Innovation Record — see maturity table above for valid values
- `review_status` (enum, pub-required): Set by curator on Innovation Record — see review status table above for valid values
- `source_type` (enum, pub-required): `I_AND_R` or `COMMUNITY` — used for trust disclaimer trigger
- `publication_state` (enum, system): Used for trust disclaimer trigger

---

### Outputs

- **Maturity Level Badge:** Displayed on every catalog card and Innovation Record page with the display label and associated color.
- **Review Status Badge:** Displayed on every catalog card and Innovation Record page with the display label.
- **Reuse Badge:** Displayed additionally when `review_status = VALIDATED_FOR_REUSE`.
- **Community Badge:** Displayed when `source_type = COMMUNITY`.
- **Trust Disclaimer Block:** Rendered on every published Innovation Record page in a "Trust & Limitations" section. Contains all applicable disclaimer texts.
- **Content Model Reference:** Read-only table rendered in admin interface.
- **Filter Options:** Maturity level and review status enum values surfaced as filter options in catalog (F00) and search (F01).

---

### Validation

- `maturity_level`: Must be a valid enum value from the 5-value set. Required before publication.
- `review_status`: Must be a valid enum value from the 7-value set. Required before publication.
- Trust disclaimers are not configurable. The system derives and renders them; curators have no input on disclaimer text or display.
- The content model enum definitions are hard-coded in the application. Changes to maturity level or review status definitions require a code change and release.
- Any record with `publication_state = PUBLISHED` must have visible trust signals (maturity badge, review status badge, disclaimer block). A technical audit should verify these are present on every rendered public record page.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Curator attempts to publish without maturity level set | 422 | `PUBLICATION_GATE_FAILED` | "Maturity level is required before publishing." |
| Curator attempts to publish without review status set | 422 | `PUBLICATION_GATE_FAILED` | "Review status is required before publishing." |
| Invalid enum value submitted for maturity or review status | 422 | `INVALID_ENUM_VALUE` | "Invalid maturity level / review status value." |

---

### API Surface (F09)

Maturity and review status are fields on the Innovation Record (see `Y1-api.md` §Records). No dedicated API endpoints for this feature; values are part of the Innovation Record payload.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/admin/maturity-reference` | CURATOR | Get maturity level definitions |
| `GET` | `/api/v1/admin/review-status-reference` | CURATOR | Get review status definitions |

---

### Schema Surface (F09)

`maturity_level` and `review_status` are enum columns on the `innovation_records` table. See `Y0-schema.md` §innovation_records.

---

*End of F09-content-maturity-trust-model.md — continues in Y0-schema.md*
