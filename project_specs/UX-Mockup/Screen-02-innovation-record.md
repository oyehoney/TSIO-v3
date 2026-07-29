### Screen 02: Innovation Record Page

**Route:** `/records/{record_id}` and `/records/{record_id}?view=technical`
**Purpose:** Full structured representation of an innovation effort — serves both executive and technical audiences from a single record
**User Stories:** US-2.1, US-3.1, US-3.2, US-4.2, US-9.1, US-9.2
**Personas:** PER-01 (Margaret — Executive), PER-02 (David — Executive + Reuse), PER-03 (Priya — Technical)

---

#### Layout — Executive View (default)

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│ ← Back to Catalog                                                   │
│                                                                     │
│  Audio Security Proof of Concept                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  [Experiment/POC ●]  [Curated]  Owner: I&R Branch  Last reviewed: July 2026 │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure  🏷 Court Operations      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Executive View]  [Technical View]                           │  │
│  │  ────────────────  ──────────────────────────────────────     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  MISSION PROBLEM                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts need reliable audio separation between participants in      │
│  sensitive proceedings to prevent accidental recording of           │
│  attorney-client communications and sidebars.                       │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  EXECUTIVE PERSPECTIVE                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Executive framing narrative — mission relevance text]             │
│  This effort validated that GPU/CPU audio separation is             │
│  technically feasible but faces meaningful constraints in           │
│  the Azure Government Cloud environment currently used…             │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  DECISION RECOMMENDATION                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  This effort is at Proof of Concept stage and is not recommended   │
│  for production adoption without additional security review and     │
│  performance testing in a court-representative environment.         │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OUTCOME SUMMARY                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  The POC demonstrated partial feasibility. GPU-based separation     │
│  works in controlled conditions but Azure Government Cloud          │
│  network segmentation constraints prevent production deployment.    │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  KEY FINDINGS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • GPU/CPU separation architecture is viable for audio isolation    │
│  • Azure Government Cloud GPU availability is limited               │
│  • Latency exceeds acceptable thresholds for real-time proceedings  │
│  • Production readiness requires dedicated GPU infrastructure       │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚠ TRUST & LIMITATIONS                                       │  │
│  │                                                              │  │
│  │  • Proof of concept results do not indicate production       │  │
│  │    readiness. This record should not be interpreted as a     │  │
│  │    recommendation to deploy without additional validation.   │  │
│  │                                                              │  │
│  │  • Publication on the TSIO Innovation Hub indicates curation │  │
│  │    by the I&R team. It does not constitute formal adoption   │  │
│  │    approval.                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Maturity: Experiment / POC  ·  Review Status: Curated              │
│  Reuse Potential: Medium                                            │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  NEXT ACTIONS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  [📋 Request a Briefing]   [🎬 Request a Demo]            │     │
│  │  [💬 Request Adoption Discussion]                         │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│                         [View Technical Details →]                  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SOURCE DOCUMENTS & ARTIFACTS                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📄 Audio Security POC Lessons-Learned Document [SharePoint ↗]     │
│  (External link — opens in new tab)                                 │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Owner: I&R Branch  ·  Contributing Office: TSIO I&R               │
│  Record ID: …  ·  Published: July 2026  ·  Last Reviewed: July 2026│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

#### Layout — Technical View

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
├─────────────────────────────────────────────────────────────────────┤
│ ← Back to Catalog                                                   │
│                                                                     │
│  Audio Security Proof of Concept                                    │
│  [Experiment/POC ●]  [Curated]  Owner: I&R Branch                   │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Executive View]  [Technical View]  ← active                │  │
│  │  ──────────────    ════════════════                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  MISSION PROBLEM  (same as Executive)                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts need reliable audio separation…                             │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  WHAT WAS EXPLORED                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Technical description of approach, technology stack,              │
│   architecture decisions, infrastructure used]                      │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  TECHNICAL DETAILS                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [technical_perspective_text — architecture narrative,              │
│   tools, dependencies, infrastructure requirements]                 │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SECURITY FINDINGS                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⚠ Security review has NOT been completed for this record.         │
│    Local security assessment required before any adoption           │
│    consideration.                                                   │
│                                                                     │
│  [security_findings text if populated]                              │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  PERFORMANCE FINDINGS                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [performance_findings text if populated]                           │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  REUSE GUIDANCE                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Courts without dedicated GPU infrastructure would require          │
│  hardware provisioning. Azure Government Cloud courts should        │
│  note: GPU availability in standard tiers is limited…               │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  KEY FINDINGS  (same as Executive)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • GPU/CPU separation architecture is viable…                       │
│  • Azure Government Cloud GPU availability is limited…              │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OUTCOME SUMMARY  (same as Executive)                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  The POC demonstrated partial feasibility…                          │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ⚠ TRUST & LIMITATIONS  (identical in both views)           │  │
│  │  • POC results do not indicate production readiness…        │  │
│  │  • Published ≠ formal adoption approval…                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  NEXT ACTIONS                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  [🔧 Request Technical Guidance]  ← primary CTA here     │      │
│  │  [📋 Request a Briefing]  [💬 Request Adoption Discussion]│      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│                       [View Executive Summary →]                    │
│                                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  TECHNICAL ARTIFACTS  (code repos and diagrams visually prominent)  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🔧 Architecture Diagram — SharePoint [↗ opens in new tab]         │
│  📄 Audio Security POC Lessons-Learned — SharePoint [↗]            │
│  (External links — Hub does not host or cache these documents)      │
│                                                                     │
│  🏷 Cybersecurity  🏷 Cloud Infrastructure  🏷 AI/ML               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Perspective Toggle Design

```
  ┌──────────────────────────────────────────────┐
  │  [Executive View]        [Technical View]    │
  │  ════════════════        ─────────────────   │
  │  (underline = active tab; always both visible)│
  └──────────────────────────────────────────────┘
```

Behavior:
- Toggle is implemented as a tab control with `role="tablist"` and `role="tab"`
- Active tab is underlined and has `aria-selected="true"`
- Tab switching re-renders content area without page reload
- URL updates to include `?view=executive` or `?view=technical` for shareability
- Toggle is **always visible** — cannot be hidden even if technical content is minimal

#### Trust & Limitations Section Design

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠  TRUST & LIMITATIONS                                      │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  The following statements apply to this record:             │
│                                                              │
│  • Proof of concept and prototype results do not indicate   │
│    production readiness. This record should not be          │
│    interpreted as a recommendation to deploy in a           │
│    production environment without additional validation.    │
│                                                              │
│  • Publication on the TSIO Innovation Hub indicates         │
│    curation and structured presentation by the I&R team.   │
│    It does not constitute formal adoption approval.         │
│                                                              │
│  [Additional disclaimers appear automatically if            │
│   source_type = COMMUNITY or review_status = VALIDATED]     │
└──────────────────────────────────────────────────────────────┘
```

- Background: light amber (`#FEF3C7`) with left border `#D97706`
- Appears **before** the Next-Action panel in both perspectives
- System-generated; curator cannot suppress or modify

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Title, maturity badge, review status badge | Record header — always visible |
| Primary | Perspective toggle (Executive / Technical) | Immediately below header — always visible |
| Primary | Problem Statement | First section — both views |
| Primary | Decision Recommendation (Executive) / Reuse Guidance (Technical) | Prominent section |
| Primary | Trust & Limitations | Before Next-Action panel — both views |
| Primary | Next-Action panel (engagement CTAs) | Before footer — both views |
| Secondary | Executive perspective text / What Was Explored | Mid-record by view |
| Secondary | Key Findings | Both views |
| Secondary | Security Findings (Technical only) | Technical view only |
| Secondary | Outcome Summary | Both views |
| Tertiary | Mission/tech area tags | Header area |
| Tertiary | Artifact links | Separate section below Next-Action |
| Tertiary | Owner, contributing office, dates | Record footer |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default — Executive | Executive content visible; "Executive View" tab active | N/A |
| Default — Technical | Technical content visible; "Technical View" tab active | N/A |
| Technical content empty | Technical view tab visible; placeholder text shown | "Technical detail for this record is not yet available. Contact the I&R team for more information." |
| Loading | Skeleton layout matching section structure | Screen reader: "Loading record…" |
| 404 (non-published) | 404 page | "The requested record was not found." |
| Community record | Community badge in header; Community trust disclaimer rendered | Disclaimer: "This record was contributed by a team outside the TSIO I&R branch…" |
| Validated for Reuse | Reuse badge in header; Validated trust disclaimer rendered | Disclaimer: "Validated for Reuse status indicates reviews completed. It does not waive local requirements…" |
| Superseded record | Yellow banner at top | "This record has been superseded by [link to newer record]." |
| Archived record | Gray banner at top; record accessible but not in catalog | "This record is archived. It is retained for institutional learning but is no longer actively maintained." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Perspective toggle tabs | Tab control | Switch between Executive/Technical content; update URL param |
| Engagement button (primary CTA) | Button | Opens Engagement Request modal |
| Additional engagement buttons | Buttons | Open Engagement Request modal with pre-set type |
| "View Technical Details →" | Link | Switches to Technical Perspective |
| "View Executive Summary →" | Link | Switches to Executive Perspective |
| Artifact links | External link | Opens external URL in new tab; aria-label includes "(opens in new tab)" |
| "← Back to Catalog" | Link | Returns to catalog or search results |

---

*End of Screen-02-innovation-record.md*
