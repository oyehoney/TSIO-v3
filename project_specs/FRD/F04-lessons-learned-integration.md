---

## F04: Existing Lessons-Learned Integration

**PRD Reference:** F4 — Priority P1 (High-Value MVP; required for first content records)  
**Personas Served:** P5 (I&R Curator)

---

### Description

The Hub treats existing lessons-learned documents as authoritative sources, not as content to be migrated or replaced. Curators create structured Innovation Records (F02) that surface metadata, problem context, and key findings around existing documents — making them discoverable and actionable — without relocating or modifying the originals. The Audio Security POC lessons-learned document in SharePoint is the MVP anchor record for this pattern. This feature describes the specific curation workflow and constraints for integrating existing documents as artifact sources.

---

### Terminology

- **Authoritative Source Document:** An existing document (SharePoint page, PDF, Git README, recorded video) that is the original output of an innovation effort. The Hub does not copy, modify, or host it.
- **Structured Wrapper Record:** An Innovation Record in the Hub that provides problem context, structured key findings, maturity classification, and navigation to an Authoritative Source Document.
- **Key Findings Extraction:** The process by which a curator reads the source document and enters its primary learnings as structured `key_findings` items on the Innovation Record. This is a human-authored curation step, not automated extraction.
- **Artifact Link (Lessons-Learned):** An Artifact Link of type `DOCUMENT` pointing to the external URL of the source document (SharePoint, SharePoint Online, direct file link, video URL, etc.).
- **Audio Security POC:** The MVP anchor record. Source: TSIO I&R Audio Security Proof of Concept lessons-learned document in SharePoint. Key structured findings include: GPU/CPU separation architecture, Azure Government Cloud constraints, performance and testing limitations, and production-readiness gaps.

---

### Sub-Features

- Curator creates a full Innovation Record (F02) using an existing document as the primary artifact source
- `artifact_links` field stores the external URL to the source document (no content is copied)
- Key findings from the source document entered manually by the curator as structured `key_findings` items
- Record is searchable by problem statement and key findings without requiring the source document to be indexed
- Source document does not need to be reformatted, relocated, or modified
- Record is discoverable via catalog (F00) and search (F01)
- Record carries a `source_type = I_AND_R` designation if the work was I&R-conducted

---

### Process

1. Curator identifies an existing lessons-learned document suitable for Hub integration (e.g., Audio Security POC SharePoint page).
2. Curator reads the source document and identifies:
   - The mission problem it addressed
   - What was explored
   - The key findings, limitations, and gaps
   - The maturity level of the effort (e.g., `EXPERIMENT_POC`)
   - Whether any formal reviews have been completed
3. Curator opens the admin interface and creates a new Innovation Record (F02 creation process).
4. Curator enters the problem statement, what was explored, and outcome summary based on the source document.
5. Curator enters key findings as structured items. For Audio Security POC, required findings include:
   - GPU/CPU separation architectural requirement and rationale
   - Azure Government Cloud feature constraints affecting real-time audio processing
   - Performance and latency limitations observed during testing
   - Production-readiness gaps and conditions not yet met
6. Curator adds an `artifact_link` of type `DOCUMENT` with the SharePoint URL of the source document and a label (e.g., "Audio Security POC Lessons-Learned Document").
7. Curator assigns maturity level, review status, mission/technology area tags.
8. Curator authors the executive and technical perspective fields.
9. Curator sets `last_reviewed_date` to today.
10. Curator publishes the record following the standard publication process (see F02a §Process).
11. Published record is discoverable in catalog and search. Stakeholders navigate to the artifact link to access the source document directly.

---

### Inputs

Same as F02b §Inputs. The following fields are specifically relevant to the lessons-learned integration pattern:

- `artifact_links` (array, min 1 item, pub-required): Must include at least one link of type `DOCUMENT` pointing to the source document external URL
- `key_findings` (array, pub-required): Manually authored from source document content; minimum 1 item
- `what_was_explored` (text, pub-required): Summarizes the approach described in the source document
- `outcome_summary` (text, pub-required): Summarizes the findings described in the source document
- `source_type` (enum, pub-required): `I_AND_R` for I&R-produced lessons-learned documents

**No additional inputs specific to this feature.** The lessons-learned integration pattern is a curation workflow, not a distinct system feature with new data fields.

---

### Outputs

- A fully published Innovation Record discoverable in catalog (F00) and search (F01)
- The record's `artifact_links` section renders the external URL to the source document
- Stakeholders can navigate to the source document directly from the Hub record
- The source document is not modified, hosted, or copied by the Hub

---

### Validation

- At least one `artifact_link` of type `DOCUMENT` is strongly recommended (not system-enforced as type-specific) for lessons-learned records; general publication gate requires at least one artifact link of any type (see F02b §Validation).
- `artifact_link.url` must be a valid absolute HTTPS URL. SharePoint URLs (e.g., `https://ao.sharepoint.com/sites/...`) are valid.
- The Hub must not attempt to crawl, index, or cache the content of the linked source document. Only the URL and label are stored.
- `key_findings` must be manually authored; no automated extraction from linked documents is performed or implied.
- If the source document URL becomes unreachable, the Innovation Record remains valid and published. The broken link is a content issue to be resolved by the curator during the next review cycle, not a system error that unpublishes the record.

---

### Error States

| Scenario | HTTP Status | Error Code | Curator-Facing Message |
|----------|-------------|------------|------------------------|
| Artifact URL is not a valid HTTPS URL | 422 | `INVALID_ARTIFACT_URL` | "Artifact URL must be a valid https:// address." |
| Curator attempts to publish with no artifact links | 422 | `PUBLICATION_GATE_FAILED` | "At least one artifact link is required before publishing." |
| Artifact URL is reachable but returns non-200 (link check, if implemented) | 200 (warning only) | — | Curator sees advisory: "This URL may not be accessible. Verify the link before publishing." |
| Source document access requires authentication the stakeholder doesn't have | 200 (record valid) | — | No system error; curator should note access requirements in `reuse_guidance` or `technical_perspective_text` |

---

### API Surface (F04)

No dedicated API endpoints. Uses standard Innovation Record API (see `Y1-api.md` §Records). The lessons-learned integration is a curation workflow pattern, not a separate API surface.

---

### Schema Surface (F04)

Uses `record_artifact_links` table. Each row: `{ record_id, label, url, type, display_order }`. Full DDL in `Y0-schema.md` §record_artifact_links.

---

*End of F04-lessons-learned-integration.md — continues in F05-opportunity-submission.md*
