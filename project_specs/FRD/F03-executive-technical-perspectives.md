---

## F03: Executive and Technical Perspectives

**PRD Reference:** F3 — Priority P1 (High-Value MVP)  
**Personas Served:** P1 (Decision-Maker), P3 (Technical Adopter)

---

### Description

A single Innovation Record (F02) supports two derived views — an Executive Perspective and a Technical Perspective — so that different audiences receive appropriately framed information from the same underlying record without the team maintaining duplicate records that can drift out of sync. The perspective toggle is visible on every Innovation Record page. The default perspective shown is configured per record by the curator. Both perspectives link to each other and to the full record data.

---

### Terminology

- **Executive Perspective:** The audience-framed view of an Innovation Record optimized for decision-makers and senior leadership. Emphasizes mission relevance, maturity in plain language, and decision guidance. Suppresses deep technical implementation detail.
- **Technical Perspective:** The audience-framed view of an Innovation Record optimized for technical staff, architects, and developers. Includes architecture details, tools, dependencies, security findings, performance results, and technical reuse guidance.
- **Perspective Toggle:** The UI control (tab, button group, or toggle) allowing a user to switch between Executive and Technical views on the same record page.
- **Default Perspective:** The view shown when a record is first opened. Set by the curator; defaults to Executive Perspective if not explicitly configured.
- **Perspective-Specific CTA:** The primary call-to-action button displayed in each perspective, pointing to the most relevant engagement option for that audience.

---

### Sub-Features

- Perspective toggle displayed on every published Innovation Record page
- Executive Perspective view: mission relevance, maturity in plain language, decision recommendation, briefing/demo CTA
- Technical Perspective view: architecture, technology stack, tools/dependencies, security findings, performance results, reuse guidance, technical artifact links, technical guidance CTA
- Curator configures which perspective is shown by default
- Both perspectives derived from the same underlying record (no duplicate records)
- Each perspective links back to the other
- Trust disclaimers rendered in both perspectives (sourced from the same underlying record)

---

### Process

#### Viewing Perspectives (PUBLIC user)

1. User opens an Innovation Record page at `/records/{record_id}`.
2. System renders the record in the default perspective (curator-configured; fallback: Executive).
3. System displays the perspective toggle control labeled "Executive View" and "Technical View."
4. User clicks "Technical View" → system re-renders the record content area showing Technical Perspective fields without a page reload.
5. User clicks "Executive View" → system reverts to Executive Perspective content.
6. URL may optionally include a `?view=executive` or `?view=technical` query parameter so perspective-specific links can be shared directly.
7. Trust disclaimers are rendered identically in both perspectives.
8. Engagement options (Next-Action panel) are rendered in both perspectives; the primary CTA button changes per perspective:
   - Executive: "Request Briefing" or "Request Demo" is the primary CTA
   - Technical: "Request Technical Guidance" is the primary CTA
9. Artifact links are shown in both perspectives; technical artifact types (code repos, architecture diagrams) are given visual prominence in Technical Perspective.

#### Curator Configuration

1. Curator opens a record in the admin interface.
2. Curator sets `default_perspective` field to `EXECUTIVE` or `TECHNICAL`.
3. Curator authors `executive_perspective_text` (mission relevance framing, 50–3,000 chars) — see F02b §Inputs.
4. Curator authors `executive_recommendation` (decision guidance for senior leaders, 50–1,000 chars).
5. Curator optionally authors `technical_perspective_text` (technical architecture and detail narrative, 50–5,000 chars).
6. Curator optionally populates `security_findings` and `performance_findings` fields (rendered only in Technical Perspective).
7. All perspective content is stored on the Innovation Record (no separate record entity).

---

### Inputs

- `record_id` (UUID, required): The Innovation Record to display
- `view` (optional query param): `executive` or `technical`; defaults to `default_perspective` on the record

**Curator Inputs (part of Innovation Record — see F02b):**
- `executive_perspective_text` (text, 50–3,000 chars, pub-required)
- `executive_recommendation` (text, 50–1,000 chars, pub-required)
- `technical_perspective_text` (text, 50–5,000 chars, optional)
- `security_findings` (text, 0–2,000 chars, optional)
- `performance_findings` (text, 0–2,000 chars, optional)
- `default_perspective` (enum: `EXECUTIVE` or `TECHNICAL`, default: `EXECUTIVE`)

---

### Outputs

**Executive Perspective renders:**
- `executive_perspective_text` (mission relevance framing)
- `executive_recommendation` (decision guidance)
- `maturity_level` in plain language (human-readable label, not enum value)
- `review_status` in plain language
- `reuse_potential` in plain language
- Trust disclaimers (same as full record)
- Primary CTA: most prominent engagement option for executive audience (configured per record)
- Link: "View Technical Details →" (switches to Technical Perspective)

**Technical Perspective renders:**
- `what_was_explored` (approach and technology description)
- `technical_perspective_text` (if populated)
- `security_findings` (if populated)
- `performance_findings` (if populated)
- `reuse_guidance` (reuse and adaptation guidance)
- `artifact_links` (all types; code repos and diagrams visually prominent)
- `technology_area_tags`
- Trust disclaimers (same as full record)
- Primary CTA: "Request Technical Guidance" engagement option
- Link: "View Executive Summary →" (switches to Executive Perspective)

**Both Perspectives render (common elements):**
- `title`
- `problem_statement`
- `outcome_summary`
- `key_findings`
- `maturity_level` badge
- `review_status` badge
- `last_reviewed_date`
- `owner_name` and `owner_office`
- `contributing_office` and `contributor_attribution` (if community)
- All engagement options (Next-Action panel)
- Community badge (if `source_type = COMMUNITY`)
- All applicable trust disclaimers

---

### Validation

- `view` parameter: if present, must be `executive` or `technical`; any other value defaults to `executive`.
- If `technical_perspective_text` is empty, the Technical Perspective tab/view is still rendered but displays a message: "Technical detail for this record is not yet available. Contact the I&R team for more information." The perspective toggle is not hidden.
- `default_perspective` defaults to `EXECUTIVE` if not explicitly set by the curator.
- The perspective toggle must always be displayed on the record page; it cannot be disabled or hidden even if Technical Perspective content is minimal.

---

### Error States

| Scenario | HTTP Status | Error Code | User-Facing Message |
|----------|-------------|------------|---------------------|
| Invalid `view` param value | 200 (defaults to executive) | — | Silent fallback; no error shown |
| Technical perspective content empty | 200 | — | "Technical detail for this record is not yet available." (placeholder rendered in Technical view) |
| Record not found or not published (PUBLIC) | 404 | `RECORD_NOT_FOUND` | "The requested record was not found." |

---

### API Surface (F03)

Perspectives are derived from the Innovation Record; no separate API endpoint. Use `GET /api/v1/records/{record_id}` (see `Y1-api.md` §Records). The response payload includes all perspective fields. The `view` query parameter is a frontend rendering concern, not a backend filter.

---

### Schema Surface (F03)

Perspective fields are stored on the `innovation_records` table: `executive_perspective_text`, `executive_recommendation`, `technical_perspective_text`, `security_findings`, `performance_findings`, `default_perspective`. Full DDL in `Y0-schema.md` §innovation_records.

---

*End of F03-executive-technical-perspectives.md — continues in F04-lessons-learned-integration.md*
