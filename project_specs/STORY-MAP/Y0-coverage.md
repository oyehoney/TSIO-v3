## Coverage Analysis

### Persona Coverage

| Persona | R1 — MVP Core | R2 — MVP Launch | R3 — Post-MVP |
|---------|---------------|-----------------|---------------|
| **PER-01** Margaret Hollis | US-0.1, US-0.2, US-0.3, US-1.1, US-1.2, US-1.3, US-2.1, US-9.1, US-9.2 | US-3.1, US-5.1, US-5.2, US-7.1 | — |
| **PER-02** David Reyes | US-0.2, US-0.3, US-1.1, US-1.2, US-1.3, US-2.1, US-9.1, US-9.2 | US-5.1, US-5.2, US-7.1 | — |
| **PER-03** Priya Nair | US-1.1, US-1.2, US-2.1 | US-3.2, US-4.2, US-7.2 | — |
| **PER-04** Marcus Webb | US-0.1, US-0.3 (orientation only) | — | US-6.1, US-6.2 |
| **PER-05** Catalina Torres | US-0.4, US-2.2, US-2.3, US-2.4, US-2.5, US-8.1, US-8.2, US-8.3, US-9.3 | US-3.3, US-4.1, US-5.3, US-7.3 | US-6.3 |

**Notes:**
- PER-01 and PER-02 are fully served by R1 + R2 (no R3 dependencies)
- PER-03 receives partial journey in R1 (discover + locate) and completes in R2 (technical perspective + guidance request)
- PER-04 is oriented in R1 but cannot contribute until R3; this is acceptable given P2 priority
- PER-05 receives a complete curation lifecycle in R1 and full operational tooling in R2

---

### JTBD Coverage

| JTBD ID | Persona | Release | Stories | NaC Count |
|---------|---------|---------|---------|-----------|
| JTBD-01.1 | PER-01 | R1 (partial), R2 (complete) | US-0.1, US-9.1, US-2.1, US-3.1, US-9.2 | 3 |
| JTBD-01.2 | PER-01 | R2 | US-1.3, US-5.1, US-5.2 | 2 |
| JTBD-01.3 | PER-01 | R2 | US-7.1 | 1 |
| JTBD-02.1 | PER-02 | R1 (full) | US-1.1, US-1.2, US-0.2, US-1.3 | 3 |
| JTBD-02.2 | PER-02 | R1 (partial), R2 (complete) | US-2.1, US-9.2, US-7.1 | 2 |
| JTBD-03.1 | PER-03 | R1 (partial), R2 (complete) | US-2.1, US-3.2, US-4.2 | 3 |
| JTBD-03.2 | PER-03 | R2 | US-7.2 | 2 |
| JTBD-04.1 | PER-04 | R3 | US-6.1, US-6.2 | 3 |
| JTBD-04.2 | PER-04 | R3 | US-2.1, US-0.3 | 2 |
| JTBD-05.1 | PER-05 | R1 | US-2.2, US-2.3, US-2.4, US-2.5, US-8.1, US-8.2, US-8.3, US-9.3 | 5 |
| JTBD-05.2 | PER-05 | R2 | US-5.3, US-6.3 | 1 |
| JTBD-05.3 | PER-05 | R2 | US-7.3 | 2 |

**Total NaC derived:** 29 NaC statements across 12 JTBD outcomes

---

### Gap Analysis

**Journey stages without story coverage:**
- None identified. All journey stages across JRN-01.1 through JRN-05.2 are covered by at least one mapped story.

**JTBD outcomes without derived NaC:**
- None. All 12 JTBD IDs have at least one NaC derived in the NaC Derivation Table.

**Orphan stories (not mapped to any journey stage):**
- None. All 32 stories (US-0.1 through US-9.3) appear in the Story Map Matrix under at least one persona's journey lane.
  - Note: Some stories serve multiple personas (e.g., US-2.1 appears in PER-01, PER-02, PER-03, and PER-04 lanes). This is correct — they are shared touchpoints, not duplicates.

**Personas without journey coverage in a release:**
- PER-04 has no stories in R2 (journey starts orientation in R1, contribution in R3). This is intentional — F6 is P2 priority. PER-04 is not left without any value: R1 catalog and attribution visibility inform their decision to contribute.

**Partial JTBD coverage warnings:**
- JTBD-01.1 and JTBD-02.2 are partially addressed in R1 (catalog trust signals + record read) but fully resolved only in R2 (Executive Perspective view and engagement routing). These are explicitly staged — R1 enables discovery; R2 enables action.
- JTBD-03.1 similarly: R1 enables search and record access; R2 completes with the structured Technical Perspective.

**R1 journey completeness check:**
- JRN-05.1 (PER-05): ✅ Fully complete in R1
- JRN-02.1 (PER-02): ⚠ Stages 1–5 complete in R1; Stage 6 (engagement request) completes in R2
- JRN-02.2 (PER-02): ⚠ Empty-state CTA available in R1; form completion requires R2
- All consuming-persona primary journeys (JRN-01.x, JRN-02.x, JRN-03.x): ✅ Complete by end of R2

---

