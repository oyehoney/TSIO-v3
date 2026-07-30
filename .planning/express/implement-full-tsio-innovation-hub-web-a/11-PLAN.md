---
phase: implement-full-tsio-innovation-hub-web-a
plan: 11
type: execute
wave: 4
depends_on: [2, 3]
files_modified:
  - src/client/pages/RecordPage.tsx
  - src/client/components/record/PerspectiveToggle.tsx
  - src/client/components/record/ExecutivePerspectivePanel.tsx
  - src/client/components/record/TechnicalPerspectivePanel.tsx
  - src/client/components/record/TrustDisclaimersSection.tsx
  - src/client/components/record/ArtifactLinksSection.tsx
  - src/client/components/record/NextActionPanel.tsx
  - src/client/pages/NotFoundPage.tsx
  - e2e/record-page.spec.ts
autonomous: true

features:
  implements: ["F2", "F3", "F4", "F9"]
  depends_on: ["F0", "F1"]
  enables: ["F7"]

must_haves:
  truths:
    - "Navigating to /records/{id} for a PUBLISHED record renders the record title, maturity badge, review status badge, owner, and last reviewed date in the record header"
    - "The Perspective Toggle (role=tablist) is always visible with 'Executive View' and 'Technical View' tabs; clicking either switches view content and updates the URL ?view= param without page reload"
    - "Executive View shows: Mission Problem, Executive Perspective text, Decision Recommendation, Outcome Summary, Key Findings, Trust & Limitations section, Next-Action panel, Source Documents & Artifacts section, and footer (Owner, Contributing Office, published dates)"
    - "Technical View shows: Mission Problem, What Was Explored, Technical Details (technical_perspective_text), Security Findings (with 'Security review not completed' warning if field empty), Performance Findings, Reuse Guidance, Key Findings, Outcome Summary, Trust & Limitations section, Next-Action panel, Technical Artifacts section"
    - "Trust & Limitations section renders all applicable trust_disclaimers from the API response; the section is always present (system-generated, cannot be suppressed)"
    - "Trust disclaimers section triggers for all 4 hard-coded conditions: POC-level maturity, PUBLISHED state, COMMUNITY source_type, VALIDATED_FOR_REUSE review_status"
    - "Artifact links render as external links opening in new tab with aria-label '(opens in new tab)'; every artifact link includes label, url, and artifact_type icon"
    - "Next-Action panel renders engagement buttons ONLY for engagement_options present on the record (all 4 types: REQUEST_BRIEFING, REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE); each button click opens the engagement modal trigger (Wave 5 provides modal; this plan provides the trigger/handler hook)"
    - "Breadcrumb '← Back to Catalog' link renders at top of page and links to /catalog"
    - "Navigating to /records/{id} for a non-existent or non-published record renders a 404 page with 'The requested record was not found.' message"
    - "Playwright tests pass: executive view renders expected sections, perspective toggle switches view, trust disclaimers render, artifact links have target=_blank, next-action buttons render per engagement_options, breadcrumb links to /catalog, 404 for unknown record ID"
  artifacts:
    - path: "src/client/pages/RecordPage.tsx"
      provides: "Route /records/:id — fetches InnovationRecord from GET /api/v1/records/:id, controls view state, renders all sub-components"
      exports: ["RecordPage"]
    - path: "src/client/components/record/PerspectiveToggle.tsx"
      provides: "Tab control with role=tablist; switches between executive/technical view; syncs with ?view= URL param"
      exports: ["PerspectiveToggle"]
    - path: "src/client/components/record/ExecutivePerspectivePanel.tsx"
      provides: "Renders mission problem, executive_perspective_text, executive_recommendation, outcome_summary, key_findings"
      exports: ["ExecutivePerspectivePanel"]
    - path: "src/client/components/record/TechnicalPerspectivePanel.tsx"
      provides: "Renders what_was_explored, technical_perspective_text, security_findings, performance_findings, reuse_guidance, key_findings, outcome_summary"
      exports: ["TechnicalPerspectivePanel"]
    - path: "src/client/components/record/TrustDisclaimersSection.tsx"
      provides: "Renders trust_disclaimers string[] from API response in amber callout box; always visible if disclaimers present"
      exports: ["TrustDisclaimersSection"]
    - path: "src/client/components/record/ArtifactLinksSection.tsx"
      provides: "Renders record_artifact_links as external links with artifact_type icons; opens in new tab"
      exports: ["ArtifactLinksSection"]
    - path: "src/client/components/record/NextActionPanel.tsx"
      provides: "Renders engagement buttons from record.engagement_options; fires onEngagementRequest(type) callback for Wave 5 modal integration"
      exports: ["NextActionPanel"]
    - path: "e2e/record-page.spec.ts"
      provides: "Playwright e2e tests for Innovation Record page"
  key_links:
    - from: "RecordPage.tsx"
      to: "GET /api/v1/records/:id"
      via: "fetch on component mount with record_id from URL params"
      pattern: "fetch.*api/v1/records"
    - from: "RecordPage.tsx"
      to: "PerspectiveToggle.tsx"
      via: "view state controlled by RecordPage; ?view= URL param read on mount"
      pattern: "view.*param|perspective.*state"
    - from: "RecordPage.tsx"
      to: "TrustDisclaimersSection.tsx"
      via: "record.trust_disclaimers passed as prop (server-computed array from TrustDisclaimerService)"
      pattern: "trust_disclaimers"
    - from: "RecordPage.tsx"
      to: "NextActionPanel.tsx"
      via: "record.engagement_options passed as prop; onEngagementRequest callback wired for Wave 5"
      pattern: "engagement_options.*NextActionPanel|onEngagementRequest"
    - from: "ArtifactLinksSection.tsx"
      to: "record.artifact_links[].url"
      via: "external link with target=_blank rel=noopener; Hub never fetches artifact URLs"
      pattern: "target.*_blank|artifact_links"

integration_contracts:
  requires:
    - from_plan: "05"
      artifact: "src/handlers/recordHandler.js"
      exports:
        - "GET /api/v1/records/:id → 200 InnovationRecord | 404 RECORD_NOT_FOUND"
      shape: |
        InnovationRecord response shape (from 05-PLAN.md integration_contracts.provides):
        {
          record_id, title, problem_statement, what_was_explored, outcome_summary,
          key_findings: string[],
          reuse_guidance, short_summary,
          maturity_level, maturity_label, review_status, review_status_label,
          reuse_potential, source_type,
          owner_name, owner_office, contributing_office, contributor_attribution,
          executive_perspective_text, executive_recommendation,
          technical_perspective_text, security_findings, performance_findings,
          default_perspective,
          mission_area_tags: string[], technology_area_tags: string[],
          artifact_links: [{ link_id, label, url, artifact_type, display_order }],
          engagement_options: EngagementOptionType[],
          trust_disclaimers: string[],   // computed by TrustDisclaimerService (server-side)
          is_validated_for_reuse: boolean,
          is_community_contributed: boolean,
          publication_state, last_reviewed_date, published_at,
          superseded_by_record_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id
        }
      verify: "grep -n 'submit-review\\|publish\\|supersede\\|archive' src/handlers/recordHandler.js && grep -n 'getRecord\\|createRecord' src/handlers/recordHandler.js && echo CONTRACT_OK"
  provides:
    - artifact: "src/client/pages/RecordPage.tsx"
      exports:
        - "RecordPage — React component routed at /records/:id"
        - "default_perspective field drives initial view; ?view=executive or ?view=technical URL param overrides default"
        - "onEngagementRequest(type: EngagementOptionType) callback prop — Wave 5 wires the engagement modal to this hook"
      shape: |
        Props: none (reads :id from React Router URL params; reads ?view= from URL search params)
        Internal state: { record: InnovationRecord | null, view: 'executive' | 'technical', loading, error }
        On 404 from API → renders NotFoundPage component
        On success → renders full record with PerspectiveToggle, panels, disclaimers, artifacts, next-action
        Exports onEngagementRequest type so Wave 5 (W5-b) can wire the modal:
          type OnEngagementRequest = (engagementType: EngagementOptionType, record: InnovationRecord) => void
      verify: "grep -n 'RecordPage\\|export.*RecordPage\\|onEngagementRequest' src/client/pages/RecordPage.tsx && echo CONTRACT_OK"
    - artifact: "src/client/components/record/NextActionPanel.tsx"
      exports:
        - "NextActionPanel — renders engagement buttons from record.engagement_options"
        - "Props: { engagement_options: EngagementOptionType[], onEngagementRequest: OnEngagementRequest, view: 'executive' | 'technical' }"
        - "In executive view: REQUEST_BRIEFING and REQUEST_DEMO are visually primary CTAs"
        - "In technical view: REQUEST_TECHNICAL_GUIDANCE is visually primary CTA"
        - "Wave 5 (W5-b) replaces onEngagementRequest placeholder with the actual modal trigger"
      shape: |
        Engagement type label map (used as button text):
          REQUEST_BRIEFING → "Request a Briefing"
          REQUEST_DEMO → "Request a Demo"
          REQUEST_ADOPTION_DISCUSSION → "Request Adoption Discussion"
          REQUEST_TECHNICAL_GUIDANCE → "Request Technical Guidance"
        Buttons only rendered for types present in engagement_options prop.
        Primary CTA button styling determined by view prop.
      verify: "grep -n 'NextActionPanel\\|onEngagementRequest\\|REQUEST_BRIEFING\\|REQUEST_TECHNICAL_GUIDANCE' src/client/components/record/NextActionPanel.tsx && echo CONTRACT_OK"
    - artifact: "src/client/components/record/TrustDisclaimersSection.tsx"
      exports:
        - "TrustDisclaimersSection — renders trust_disclaimers string[] from API in amber callout box"
        - "Props: { disclaimers: string[] }"
        - "Wave 7 integration tests verify trust disclaimers render for all 4 trigger conditions"
      shape: |
        Renders only when disclaimers.length > 0.
        Background: #FEF3C7 (light amber), left border: #D97706.
        Heading: "⚠ TRUST & LIMITATIONS"
        Each disclaimer rendered as a bullet in a list.
      verify: "grep -n 'TrustDisclaimersSection\\|trust_disclaimers\\|FEF3C7\\|TRUST.*LIMITATIONS' src/client/components/record/TrustDisclaimersSection.tsx && echo CONTRACT_OK"
    - artifact: "e2e/record-page.spec.ts"
      exports:
        - "Playwright test suite for /records/{id} covering both perspective views, trust disclaimers, artifact links, next-action panel, breadcrumb, 404"
      shape: |
        Tests seed a PUBLISHED EXPERIMENT_POC record via the API (or direct DB) before running.
        All tests verifiable by Playwright against the running dev server at baseURL.
      verify: "grep -n 'PerspectiveToggle\\|trust.*disclaimer\\|artifact\\|breadcrumb\\|404' e2e/record-page.spec.ts && echo CONTRACT_OK"
---

<objective>
Implement the Innovation Record page (`/records/{id}`) — the most complex public-facing page on the TSIO Innovation Hub. The page supports two audience-appropriate perspectives (Executive and Technical) via a persistent toggle, renders all 4 server-computed trust disclaimers, displays artifact links, and provides the Next-Action engagement panel with hooks for Wave 5 to attach the engagement modal.

⚠️ **Architecture conflict flagged:** The constraints for this plan specify "React + TypeScript" while TechArch §5.1 specifies SSR with Nunjucks/EJS as the Recommended template engine. The planning directive overrides for this wave — this plan implements the Record page as a React + TypeScript SPA component. Wave 7 integration plan should resolve this consistency issue if the rest of the app uses SSR.

Purpose: F2 (Innovation Record) and F3 (Executive/Technical Perspectives) are the core value delivery of the Hub. Every catalog card and search result leads here. The trust disclaimers (F9) must be rendered prominently. F4 (Lessons-Learned Integration) surfaces as artifact links on this page. Wave 5 will attach the engagement modal to the onEngagementRequest hook exposed by NextActionPanel.

Output:
- `src/client/pages/RecordPage.tsx` — Route entry point: fetches record, manages view state, composes sub-components
- `src/client/components/record/PerspectiveToggle.tsx` — Always-visible tab control with role=tablist, ?view= URL sync
- `src/client/components/record/ExecutivePerspectivePanel.tsx` — Executive view sections per UX mockup Screen 02
- `src/client/components/record/TechnicalPerspectivePanel.tsx` — Technical view sections per UX mockup Screen 02
- `src/client/components/record/TrustDisclaimersSection.tsx` — Amber callout box with trust_disclaimers from API
- `src/client/components/record/ArtifactLinksSection.tsx` — External artifact links with type icons
- `src/client/components/record/NextActionPanel.tsx` — Engagement buttons wired for Wave 5 modal
- `src/client/pages/NotFoundPage.tsx` — 404 fallback page
- `e2e/record-page.spec.ts` — Playwright e2e tests covering all page behaviors
</objective>

<feature_dependencies>
Implements: F2: Innovation Record (full structured page with all sections — problem context, outcome, key findings, ownership, artifact links, next-action options), F3: Executive and Technical Perspectives (PerspectiveToggle with role=tablist; ExecutivePerspectivePanel for mission relevance + decision recommendation; TechnicalPerspectivePanel for architecture + tools + security + reuse guidance; ?view= URL param for shareability), F4: Existing Lessons-Learned Integration (ArtifactLinksSection renders record_artifact_links as external links to authoritative sources — Hub does not host these), F9: Content Maturity and Trust Model (TrustDisclaimersSection renders all 4 server-computed trust_disclaimers; maturity badge and review status badge visible in record header)
Depends on: F0: Innovation Catalog (catalog page provides breadcrumb back-link target; CatalogCard navigation lands here), F1: Search (search results navigate to this page)
Enables: F7: Engagement Routing (NextActionPanel exposes onEngagementRequest hook; Wave 5 plan W5-b attaches the engagement request modal to this hook)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/05-PLAN.md
@project_specs/UX-Mockup-TSIO-Innovation-Hub.md
@project_specs/PRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement RecordPage and all record sub-components (PerspectiveToggle, Executive/TechnicalPanels, TrustDisclaimers, ArtifactLinks, NextActionPanel, NotFoundPage)</name>
  <files>
    src/client/pages/RecordPage.tsx
    src/client/pages/NotFoundPage.tsx
    src/client/components/record/PerspectiveToggle.tsx
    src/client/components/record/ExecutivePerspectivePanel.tsx
    src/client/components/record/TechnicalPerspectivePanel.tsx
    src/client/components/record/TrustDisclaimersSection.tsx
    src/client/components/record/ArtifactLinksSection.tsx
    src/client/components/record/NextActionPanel.tsx
  </files>
  <action>
Create all component files in `src/client/pages/` and `src/client/components/record/`. This is a React + TypeScript SPA (vite or CRA; use whatever bundler is established by Wave 4a/4b CatalogPage and SearchPage plans; if not yet established, use Vite + React 18 + TypeScript). Dev server must bind to 0.0.0.0:3000 for Pivota Preview. No X-Frame-Options DENY/SAMEORIGIN headers. All API calls use the same origin (no CORS issues with proxied dev server).

---

### Shared types — add to `src/client/types/record.ts` (create if not existing)

```typescript
export type EngagementOptionType =
  | 'REQUEST_BRIEFING'
  | 'REQUEST_DEMO'
  | 'REQUEST_ADOPTION_DISCUSSION'
  | 'REQUEST_TECHNICAL_GUIDANCE'
  | 'SUBMIT_RELATED_PROBLEM';

export type ArtifactType = 'DOCUMENT' | 'CODE_REPOSITORY' | 'VIDEO' | 'DIAGRAM' | 'OTHER';

export interface ArtifactLink {
  link_id: string;
  label: string;
  url: string;
  artifact_type: ArtifactType;
  display_order: number;
}

export interface InnovationRecord {
  record_id: string;
  title: string;
  problem_statement: string;
  what_was_explored: string;
  outcome_summary: string;
  key_findings: string[];
  reuse_guidance: string | null;
  short_summary: string | null;
  maturity_level: string;
  maturity_label: string;
  review_status: string;
  review_status_label: string;
  reuse_potential: string;
  source_type: string;
  owner_name: string;
  owner_office: string;
  contributing_office: string;
  contributor_attribution: string | null;
  executive_perspective_text: string | null;
  executive_recommendation: string | null;
  technical_perspective_text: string | null;
  security_findings: string | null;
  performance_findings: string | null;
  default_perspective: 'EXECUTIVE' | 'TECHNICAL';
  mission_area_tags: string[];
  technology_area_tags: string[];
  artifact_links: ArtifactLink[];
  engagement_options: EngagementOptionType[];
  trust_disclaimers: string[];   // server-computed by TrustDisclaimerService
  is_validated_for_reuse: boolean;
  is_community_contributed: boolean;
  publication_state: string;
  last_reviewed_date: string | null;
  published_at: string | null;
  superseded_by_record_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PerspectiveView = 'executive' | 'technical';
export type OnEngagementRequest = (engagementType: EngagementOptionType, record: InnovationRecord) => void;
```

---

### `src/client/components/record/PerspectiveToggle.tsx`

Per UX Mockup Screen 02 §Perspective Toggle Design:
- Tab control with `role="tablist"`; each tab has `role="tab"`, `aria-selected`, `aria-controls`
- Active tab is underlined (CSS class `perspective-tab--active`)
- Toggle is **always visible** — never hidden
- Clicking a tab calls `onToggle('executive' | 'technical')`
- URL param sync is owned by RecordPage; PerspectiveToggle is a pure controlled component

```typescript
import React from 'react';
import type { PerspectiveView } from '../../types/record';

interface Props {
  view: PerspectiveView;
  onToggle: (view: PerspectiveView) => void;
}

export const PerspectiveToggle: React.FC<Props> = ({ view, onToggle }) => (
  <div role="tablist" aria-label="Perspective" className="perspective-toggle">
    <button
      role="tab"
      aria-selected={view === 'executive'}
      aria-controls="executive-panel"
      id="tab-executive"
      className={`perspective-tab ${view === 'executive' ? 'perspective-tab--active' : ''}`}
      onClick={() => onToggle('executive')}
    >
      Executive View
    </button>
    <button
      role="tab"
      aria-selected={view === 'technical'}
      aria-controls="technical-panel"
      id="tab-technical"
      className={`perspective-tab ${view === 'technical' ? 'perspective-tab--active' : ''}`}
      onClick={() => onToggle('technical')}
    >
      Technical View
    </button>
  </div>
);
```

---

### `src/client/components/record/TrustDisclaimersSection.tsx`

Per UX Mockup Screen 02 §Trust & Limitations Section Design (amber box, ⚠ heading, bullet list):

```typescript
import React from 'react';

interface Props {
  disclaimers: string[];
}

export const TrustDisclaimersSection: React.FC<Props> = ({ disclaimers }) => {
  if (!disclaimers || disclaimers.length === 0) return null;

  return (
    <section
      className="trust-disclaimers"
      aria-label="Trust and Limitations"
      style={{
        background: '#FEF3C7',
        borderLeft: '4px solid #D97706',
        padding: '16px 20px',
        margin: '24px 0',
      }}
    >
      <h3 style={{ margin: '0 0 12px', color: '#92400E' }}>
        ⚠ TRUST &amp; LIMITATIONS
      </h3>
      <p style={{ margin: '0 0 8px', color: '#78350F' }}>
        The following statements apply to this record:
      </p>
      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {disclaimers.map((text, i) => (
          <li key={i} style={{ color: '#78350F', marginBottom: '8px' }}>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
};
```

---

### `src/client/components/record/ArtifactLinksSection.tsx`

Per UX Mockup Screen 02 §SOURCE DOCUMENTS & ARTIFACTS and §TECHNICAL ARTIFACTS sections.
External links open in new tab with `rel="noopener noreferrer"`.

```typescript
import React from 'react';
import type { ArtifactLink, ArtifactType } from '../../types/record';

const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  DOCUMENT: '📄',
  CODE_REPOSITORY: '🔧',
  VIDEO: '🎬',
  DIAGRAM: '📐',
  OTHER: '🔗',
};

interface Props {
  links: ArtifactLink[];
  heading?: string;
}

export const ArtifactLinksSection: React.FC<Props> = ({
  links,
  heading = 'SOURCE DOCUMENTS & ARTIFACTS',
}) => {
  if (!links || links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="artifact-links-section">
      <h2 className="record-section-heading">{heading}</h2>
      <ul className="artifact-links-list">
        {sorted.map((link) => (
          <li key={link.link_id} className="artifact-link-item">
            <span aria-hidden="true">{ARTIFACT_ICONS[link.artifact_type] ?? '🔗'}</span>{' '}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (opens in new tab)`}
              className="artifact-link"
            >
              {link.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="artifact-links-note" style={{ fontSize: '0.85em', color: '#6B7280' }}>
        External links — opens in new tab. Hub does not host or cache these documents.
      </p>
    </section>
  );
};
```

---

### `src/client/components/record/NextActionPanel.tsx`

Per UX Mockup Screen 02 §NEXT ACTIONS and Screen 03 §Engagement Request Types.
Renders only the engagement types present in `engagement_options`. Does NOT render SUBMIT_RELATED_PROBLEM as a button here (that is handled by a link to /submit-opportunity).
Primary CTA in executive view: REQUEST_BRIEFING then REQUEST_DEMO.
Primary CTA in technical view: REQUEST_TECHNICAL_GUIDANCE.

```typescript
import React from 'react';
import type { EngagementOptionType, InnovationRecord, OnEngagementRequest } from '../../types/record';

const ENGAGEMENT_LABELS: Record<EngagementOptionType, string> = {
  REQUEST_BRIEFING: 'Request a Briefing',
  REQUEST_DEMO: 'Request a Demo',
  REQUEST_ADOPTION_DISCUSSION: 'Request Adoption Discussion',
  REQUEST_TECHNICAL_GUIDANCE: 'Request Technical Guidance',
  SUBMIT_RELATED_PROBLEM: 'Submit a Related Problem',
};

const ENGAGEMENT_ICONS: Record<EngagementOptionType, string> = {
  REQUEST_BRIEFING: '📋',
  REQUEST_DEMO: '🎬',
  REQUEST_ADOPTION_DISCUSSION: '💬',
  REQUEST_TECHNICAL_GUIDANCE: '🔧',
  SUBMIT_RELATED_PROBLEM: '📝',
};

// Which types are primary CTAs per view (per UX Mockup Screen 02)
const PRIMARY_FOR_EXECUTIVE: EngagementOptionType[] = ['REQUEST_BRIEFING', 'REQUEST_DEMO'];
const PRIMARY_FOR_TECHNICAL: EngagementOptionType[] = ['REQUEST_TECHNICAL_GUIDANCE'];

interface Props {
  engagement_options: EngagementOptionType[];
  record: InnovationRecord;
  view: 'executive' | 'technical';
  onEngagementRequest: OnEngagementRequest;
}

export const NextActionPanel: React.FC<Props> = ({
  engagement_options,
  record,
  view,
  onEngagementRequest,
}) => {
  // Filter out SUBMIT_RELATED_PROBLEM — rendered separately as a link
  const actionableOptions = engagement_options.filter(
    (opt) => opt !== 'SUBMIT_RELATED_PROBLEM'
  );

  if (actionableOptions.length === 0) return null;

  const primaryOptions = view === 'executive' ? PRIMARY_FOR_EXECUTIVE : PRIMARY_FOR_TECHNICAL;

  return (
    <section className="next-action-panel" aria-label="Next Actions">
      <h2 className="record-section-heading">NEXT ACTIONS</h2>
      <div className="next-action-buttons">
        {actionableOptions.map((optType) => {
          const isPrimary = primaryOptions.includes(optType);
          return (
            <button
              key={optType}
              className={`engagement-btn ${isPrimary ? 'engagement-btn--primary' : 'engagement-btn--secondary'}`}
              onClick={() => onEngagementRequest(optType, record)}
              aria-label={ENGAGEMENT_LABELS[optType]}
            >
              <span aria-hidden="true">{ENGAGEMENT_ICONS[optType]}</span>{' '}
              {ENGAGEMENT_LABELS[optType]}
            </button>
          );
        })}
      </div>
      {/* Cross-link between perspectives per UX Mockup */}
      {view === 'executive' && (
        <div className="perspective-crosslink">
          <a href={`?view=technical`}>View Technical Details →</a>
        </div>
      )}
      {view === 'technical' && (
        <div className="perspective-crosslink">
          <a href={`?view=executive`}>View Executive Summary →</a>
        </div>
      )}
    </section>
  );
};
```

---

### `src/client/components/record/ExecutivePerspectivePanel.tsx`

Per UX Mockup Screen 02 §Layout — Executive View. Sections rendered in UX order:
1. MISSION PROBLEM (problem_statement) — always shown in both views
2. EXECUTIVE PERSPECTIVE (executive_perspective_text)
3. DECISION RECOMMENDATION (executive_recommendation)
4. OUTCOME SUMMARY (outcome_summary)
5. KEY FINDINGS (key_findings[])

```typescript
import React from 'react';
import type { InnovationRecord } from '../../types/record';

interface Props {
  record: InnovationRecord;
}

export const ExecutivePerspectivePanel: React.FC<Props> = ({ record }) => (
  <div
    id="executive-panel"
    role="tabpanel"
    aria-labelledby="tab-executive"
    className="perspective-panel"
  >
    <section className="record-section">
      <h2 className="record-section-heading">MISSION PROBLEM</h2>
      <p>{record.problem_statement}</p>
    </section>

    {record.executive_perspective_text && (
      <section className="record-section">
        <h2 className="record-section-heading">EXECUTIVE PERSPECTIVE</h2>
        <p>{record.executive_perspective_text}</p>
      </section>
    )}

    {record.executive_recommendation && (
      <section className="record-section">
        <h2 className="record-section-heading">DECISION RECOMMENDATION</h2>
        <p>{record.executive_recommendation}</p>
      </section>
    )}

    <section className="record-section">
      <h2 className="record-section-heading">OUTCOME SUMMARY</h2>
      <p>{record.outcome_summary}</p>
    </section>

    {record.key_findings && record.key_findings.length > 0 && (
      <section className="record-section">
        <h2 className="record-section-heading">KEY FINDINGS</h2>
        <ul className="key-findings-list">
          {record.key_findings.map((finding, i) => (
            <li key={i}>{finding}</li>
          ))}
        </ul>
      </section>
    )}

    {/* Maturity and review status in plain language — per UX Mockup §Executive View sections */}
    <section className="record-section record-section--meta">
      <p>
        <strong>Maturity:</strong> {record.maturity_label} &nbsp;·&nbsp;{' '}
        <strong>Review Status:</strong> {record.review_status_label} &nbsp;·&nbsp;{' '}
        <strong>Reuse Potential:</strong> {record.reuse_potential}
      </p>
    </section>
  </div>
);
```

---

### `src/client/components/record/TechnicalPerspectivePanel.tsx`

Per UX Mockup Screen 02 §Layout — Technical View. Sections rendered in UX order:
1. MISSION PROBLEM (same as executive)
2. WHAT WAS EXPLORED (what_was_explored)
3. TECHNICAL DETAILS (technical_perspective_text — placeholder if empty)
4. SECURITY FINDINGS (security_findings — warning if empty: "⚠ Security review has NOT been completed for this record. Local security assessment required before any adoption consideration.")
5. PERFORMANCE FINDINGS (performance_findings)
6. REUSE GUIDANCE (reuse_guidance)
7. KEY FINDINGS (same list as executive)
8. OUTCOME SUMMARY (same as executive)

```typescript
import React from 'react';
import type { InnovationRecord } from '../../types/record';

interface Props {
  record: InnovationRecord;
}

export const TechnicalPerspectivePanel: React.FC<Props> = ({ record }) => (
  <div
    id="technical-panel"
    role="tabpanel"
    aria-labelledby="tab-technical"
    className="perspective-panel"
  >
    <section className="record-section">
      <h2 className="record-section-heading">MISSION PROBLEM</h2>
      <p>{record.problem_statement}</p>
    </section>

    <section className="record-section">
      <h2 className="record-section-heading">WHAT WAS EXPLORED</h2>
      <p>{record.what_was_explored}</p>
    </section>

    <section className="record-section">
      <h2 className="record-section-heading">TECHNICAL DETAILS</h2>
      {record.technical_perspective_text ? (
        <p>{record.technical_perspective_text}</p>
      ) : (
        <p className="record-placeholder-text">
          Technical detail for this record is not yet available. Contact the I&amp;R team for more
          information.
        </p>
      )}
    </section>

    <section className="record-section">
      <h2 className="record-section-heading">SECURITY FINDINGS</h2>
      {!record.security_findings && (
        <p className="security-not-reviewed-warning" role="note" style={{ color: '#D97706' }}>
          ⚠ Security review has NOT been completed for this record. Local security assessment
          required before any adoption consideration.
        </p>
      )}
      {record.security_findings && <p>{record.security_findings}</p>}
    </section>

    {record.performance_findings && (
      <section className="record-section">
        <h2 className="record-section-heading">PERFORMANCE FINDINGS</h2>
        <p>{record.performance_findings}</p>
      </section>
    )}

    {record.reuse_guidance && (
      <section className="record-section">
        <h2 className="record-section-heading">REUSE GUIDANCE</h2>
        <p>{record.reuse_guidance}</p>
      </section>
    )}

    {record.key_findings && record.key_findings.length > 0 && (
      <section className="record-section">
        <h2 className="record-section-heading">KEY FINDINGS</h2>
        <ul className="key-findings-list">
          {record.key_findings.map((finding, i) => (
            <li key={i}>{finding}</li>
          ))}
        </ul>
      </section>
    )}

    <section className="record-section">
      <h2 className="record-section-heading">OUTCOME SUMMARY</h2>
      <p>{record.outcome_summary}</p>
    </section>

    {/* Technology area tags — shown in Technical view footer per UX Mockup §Technical View */}
    {record.technology_area_tags && record.technology_area_tags.length > 0 && (
      <section className="record-section">
        <div className="tag-list">
          {record.technology_area_tags.map((tag) => (
            <span key={tag} className="tag tag--technology">🏷 {tag}</span>
          ))}
        </div>
      </section>
    )}
  </div>
);
```

---

### `src/client/pages/NotFoundPage.tsx`

Simple 404 page used when record is non-existent or non-published.

```typescript
import React from 'react';

export const NotFoundPage: React.FC<{ message?: string }> = ({
  message = 'The requested record was not found.',
}) => (
  <main className="not-found-page">
    <h1>404 — Not Found</h1>
    <p>{message}</p>
    <a href="/catalog">← Return to Catalog</a>
  </main>
);
```

---

### `src/client/pages/RecordPage.tsx`

Main page component. Owns:
- Fetching `GET /api/v1/records/:id` on mount
- Reading `?view=` URL param for initial perspective (defaults to `record.default_perspective`)
- Updating `?view=` URL param on toggle (using `history.replaceState` or React Router `setSearchParams`)
- Breadcrumb "← Back to Catalog" linking to `/catalog` (per Navigation Map: reached from catalog card click)
- Composing all sub-components
- `onEngagementRequest` stub (Wave 5 wires the modal here)

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { InnovationRecord, PerspectiveView, OnEngagementRequest, EngagementOptionType } from '../types/record';
import { PerspectiveToggle } from '../components/record/PerspectiveToggle';
import { ExecutivePerspectivePanel } from '../components/record/ExecutivePerspectivePanel';
import { TechnicalPerspectivePanel } from '../components/record/TechnicalPerspectivePanel';
import { TrustDisclaimersSection } from '../components/record/TrustDisclaimersSection';
import { ArtifactLinksSection } from '../components/record/ArtifactLinksSection';
import { NextActionPanel } from '../components/record/NextActionPanel';
import { NotFoundPage } from './NotFoundPage';

// Maturity badge color map per UX Mockup §Color System for Trust Signals
const MATURITY_BADGE_COLORS: Record<string, string> = {
  IDEA: '#6B7280',
  EXPERIMENT_POC: '#D97706',
  PROTOTYPE_PILOT: '#EA580C',
  PRODUCTION_VALIDATED: '#16A34A',
  ARCHIVED: '#374151',
};

// Wave 5 will replace this stub with the actual modal trigger
const noop: OnEngagementRequest = (_type: EngagementOptionType, _record: InnovationRecord) => {
  // TODO Wave 5 (W5-b): wire engagement request modal here
  console.warn('onEngagementRequest: engagement modal not yet connected (Wave 5)');
};

export const RecordPage: React.FC<{
  onEngagementRequest?: OnEngagementRequest;
}> = ({ onEngagementRequest = noop }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [record, setRecord] = useState<InnovationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Derive initial view: ?view= param, then record.default_perspective, then 'executive'
  const viewParam = searchParams.get('view');
  const [view, setView] = useState<PerspectiveView>(
    viewParam === 'technical' ? 'technical' : 'executive'
  );

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    setLoading(true);

    fetch(`/api/v1/records/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InnovationRecord = await res.json();
        setRecord(data);
        // Apply default_perspective from record if no URL param
        if (!viewParam) {
          setView(data.default_perspective === 'TECHNICAL' ? 'technical' : 'executive');
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = useCallback((newView: PerspectiveView) => {
    setView(newView);
    setSearchParams({ view: newView }, { replace: true });
  }, [setSearchParams]);

  if (loading) {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Loading record…</p>
      </main>
    );
  }

  if (notFound || !record) {
    return <NotFoundPage />;
  }

  const badgeColor = MATURITY_BADGE_COLORS[record.maturity_level] ?? '#6B7280';

  return (
    <main className="record-page">
      {/* Breadcrumb — always present; links to /catalog per UX Navigation Map */}
      <nav aria-label="Breadcrumb" className="record-breadcrumb">
        <a href="/catalog">← Back to Catalog</a>
      </nav>

      {/* Record Header */}
      <header className="record-header">
        <h1 className="record-title">{record.title}</h1>
        <div className="record-badges">
          <span
            className="maturity-badge"
            style={{ backgroundColor: badgeColor, color: '#fff' }}
            title={`Maturity: ${record.maturity_label}`}
          >
            {record.maturity_label}
          </span>
          <span className="review-status-badge">{record.review_status_label}</span>
          {record.is_community_contributed && (
            <span className="community-badge">COMMUNITY</span>
          )}
          {record.is_validated_for_reuse && (
            <span className="validated-reuse-badge">Validated for Reuse ✓</span>
          )}
        </div>
        <div className="record-header-meta">
          <span>Owner: {record.owner_name}</span>
          {record.last_reviewed_date && (
            <span> · Last reviewed: {record.last_reviewed_date}</span>
          )}
        </div>
        {/* Mission area tags */}
        {record.mission_area_tags.length > 0 && (
          <div className="tag-list" aria-label="Mission areas">
            {record.mission_area_tags.map((tag) => (
              <span key={tag} className="tag tag--mission">🏷 {tag}</span>
            ))}
          </div>
        )}
      </header>

      {/* Perspective Toggle — always visible */}
      <PerspectiveToggle view={view} onToggle={handleToggle} />

      {/* Perspective Panels */}
      {view === 'executive' ? (
        <ExecutivePerspectivePanel record={record} />
      ) : (
        <TechnicalPerspectivePanel record={record} />
      )}

      {/* Trust & Limitations — before Next-Action panel in both views, per UX Mockup */}
      <TrustDisclaimersSection disclaimers={record.trust_disclaimers} />

      {/* Next-Action Panel */}
      <NextActionPanel
        engagement_options={record.engagement_options}
        record={record}
        view={view}
        onEngagementRequest={onEngagementRequest}
      />

      {/* Artifact Links Section — view-specific heading */}
      <ArtifactLinksSection
        links={record.artifact_links}
        heading={view === 'technical' ? 'TECHNICAL ARTIFACTS' : 'SOURCE DOCUMENTS & ARTIFACTS'}
      />

      {/* Record Footer */}
      <footer className="record-footer">
        <p>
          Owner: {record.owner_name} · Contributing Office: {record.contributing_office}
        </p>
        {record.published_at && (
          <p>Published: {new Date(record.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        )}
        {record.last_reviewed_date && (
          <p>Last Reviewed: {record.last_reviewed_date}</p>
        )}
        <p className="record-id-display">Record ID: {record.record_id}</p>
      </footer>
    </main>
  );
};
```

**Navigation wiring:** The RecordPage must be reachable from `/records/:id`. Register it in the app router (wherever the React Router routes are declared — typically `src/client/App.tsx` or `src/client/router.tsx`):

```typescript
// Add to router config (alongside CatalogPage at /catalog and SearchPage at /search):
<Route path="/records/:id" element={<RecordPage />} />
```

If `src/client/App.tsx` does not yet exist, create it with:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecordPage } from './pages/RecordPage';
// import CatalogPage and SearchPage when wave 4a/4b are complete
export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/records/:id" element={<RecordPage />} />
      <Route path="/catalog" element={<div>Catalog coming soon</div>} />
      <Route path="/search" element={<div>Search coming soon</div>} />
    </Routes>
  </BrowserRouter>
);
```

Dev server vite.config.ts proxy setup (to avoid CORS with backend on same port):
```typescript
// vite.config.ts
export default {
  server: {
    host: '0.0.0.0',   // Bind to all interfaces for Pivota Preview
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',  // Backend Express app
    },
  },
};
```

**All text fields are rendered as React text content (never innerHTML / dangerouslySetInnerHTML)** per TechArch §5.5 XSS prevention. The `trust_disclaimers` and all record text are plain text strings from the API — render as React children only.
  </action>
  <verify>
ls src/client/pages/RecordPage.tsx src/client/pages/NotFoundPage.tsx src/client/components/record/PerspectiveToggle.tsx src/client/components/record/ExecutivePerspectivePanel.tsx src/client/components/record/TechnicalPerspectivePanel.tsx src/client/components/record/TrustDisclaimersSection.tsx src/client/components/record/ArtifactLinksSection.tsx src/client/components/record/NextActionPanel.tsx && echo "FILES_EXIST_OK" && grep -n "role=\"tablist\"\|aria-selected\|role=\"tab\"" src/client/components/record/PerspectiveToggle.tsx && echo "TABLIST_ARIA_OK" && grep -n "FEF3C7\|TRUST.*LIMITATIONS\|trust_disclaimers" src/client/components/record/TrustDisclaimersSection.tsx && echo "TRUST_DISCLAIMERS_OK" && grep -n "target.*_blank\|rel.*noopener\|opens in new tab" src/client/components/record/ArtifactLinksSection.tsx && echo "ARTIFACT_LINKS_OK" && grep -n "onEngagementRequest\|REQUEST_BRIEFING\|REQUEST_TECHNICAL_GUIDANCE" src/client/components/record/NextActionPanel.tsx && echo "ENGAGEMENT_PANEL_OK" && grep -n "trust_disclaimers\|TrustDisclaimersSection\|NextActionPanel\|Back to Catalog" src/client/pages/RecordPage.tsx && echo "RECORD_PAGE_OK" && echo CONTRACT_OK
  </verify>
  <done>
- `src/client/types/record.ts` exports `InnovationRecord`, `ArtifactLink`, `EngagementOptionType`, `ArtifactType`, `PerspectiveView`, `OnEngagementRequest`
- `src/client/components/record/PerspectiveToggle.tsx`: role=tablist, each tab has role=tab + aria-selected; always visible; calls onToggle on click
- `src/client/components/record/ExecutivePerspectivePanel.tsx`: renders problem_statement, executive_perspective_text, executive_recommendation, outcome_summary, key_findings in correct UX Mockup order
- `src/client/components/record/TechnicalPerspectivePanel.tsx`: renders problem_statement, what_was_explored, technical_perspective_text (with placeholder if null), security_findings (with "Security review not completed" warning if null), performance_findings, reuse_guidance, key_findings, outcome_summary
- `src/client/components/record/TrustDisclaimersSection.tsx`: amber background #FEF3C7, left border #D97706, "⚠ TRUST & LIMITATIONS" heading, renders disclaimers array as bullet list; returns null when empty
- `src/client/components/record/ArtifactLinksSection.tsx`: all links have target=_blank, rel=noopener noreferrer, aria-label "(opens in new tab)", sorted by display_order; artifact_type icon prefix
- `src/client/components/record/NextActionPanel.tsx`: renders only engagement_options present in prop; REQUEST_BRIEFING/REQUEST_DEMO are primary in executive view; REQUEST_TECHNICAL_GUIDANCE is primary in technical view; perspective crosslinks ("View Technical Details →" / "View Executive Summary →") present; onEngagementRequest callback fired on button click
- `src/client/pages/RecordPage.tsx`: fetches /api/v1/records/:id; 404 from API renders NotFoundPage; breadcrumb "← Back to Catalog" links to /catalog; PerspectiveToggle always visible; TrustDisclaimersSection placed before NextActionPanel; ?view= URL param synced on toggle; all text rendered as React children (never dangerouslySetInnerHTML)
- `src/client/pages/NotFoundPage.tsx`: renders 404 heading and message; "Return to Catalog" link
- Route `/records/:id` wired in app router
- Dev server binds to 0.0.0.0:3000 (Pivota Preview compatible)
  </done>
</task>

<task type="auto">
  <name>Task 2: Playwright e2e tests for Innovation Record page</name>
  <files>
    e2e/record-page.spec.ts
  </files>
  <action>
Create `e2e/record-page.spec.ts` using Playwright. Assumes `playwright.config.ts` exists with `baseURL: 'http://localhost:3000'` (Pivota Preview compatible). Tests run against the live dev/test server with a real database seeded with a PUBLISHED record.

**Test setup pattern:** Use `test.beforeAll` to seed a PUBLISHED EXPERIMENT_POC COMMUNITY record via the API (`POST /api/v1/records` + `POST /api/v1/records/:id/submit-review` + `POST /api/v1/records/:id/publish` with a curator session, OR via direct DB seed). Record must have:
- `maturity_level: 'EXPERIMENT_POC'` (triggers trust disclaimer 1)
- `publication_state: 'PUBLISHED'` (triggers trust disclaimer 2)
- `source_type: 'COMMUNITY'` (triggers trust disclaimer 3)
- At least 1 key_finding
- At least 1 artifact_link (DOCUMENT type with valid https:// URL)
- All 4 engagement_options: REQUEST_BRIEFING, REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE
- `executive_perspective_text` and `executive_recommendation` populated
- `technical_perspective_text` populated (to test technical view has content)
- `security_findings: null` (to test "security review not completed" warning)

```typescript
import { test, expect } from '@playwright/test';

// Seeded record ID — set in beforeAll
let publishedRecordId: string;
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

test.beforeAll(async ({ request }) => {
  // Seed a full PUBLISHED record with all required fields for these tests.
  // If the seeding API isn't available (records require curator auth),
  // use the direct DB seed approach via an internal test endpoint.
  // The API route /api/v1/test-seed (gated to NODE_ENV=test) accepts:
  //   POST /api/v1/test-seed/published-record → returns { record_id }
  // This endpoint is a test harness only — guarded by NODE_ENV !== 'production'.
  const seedRes = await request.post('/api/v1/test-seed/published-record', {
    data: {
      title: 'Audio Security Proof of Concept',
      problem_statement: 'Courts need reliable audio separation between participants in sensitive proceedings to prevent accidental recording of attorney-client communications and sidebars.',
      what_was_explored: 'Explored GPU/CPU audio separation architecture in Azure Government Cloud using ML-based speaker diarization.',
      outcome_summary: 'The POC demonstrated partial feasibility. GPU-based separation works in controlled conditions but Azure Government Cloud network segmentation constraints prevent production deployment.',
      maturity_level: 'EXPERIMENT_POC',
      review_status: 'CURATED',
      reuse_potential: 'MEDIUM',
      source_type: 'COMMUNITY',
      owner_name: 'I&R Branch',
      owner_office: 'TSIO',
      contributing_office: 'TSIO I&R',
      executive_perspective_text: 'This effort validated that GPU/CPU audio separation is technically feasible but faces meaningful constraints in the Azure Government Cloud environment.',
      executive_recommendation: 'This effort is at Proof of Concept stage and is not recommended for production adoption without additional security review.',
      technical_perspective_text: 'GPU-based audio separation using Python + TensorFlow on Azure GPU VMs. Dependency on premium GPU tiers not available in all Azure Government Cloud regions.',
      security_findings: null,
      performance_findings: 'Latency exceeds acceptable thresholds for real-time proceedings under standard Azure Government Cloud network conditions.',
      reuse_guidance: 'Courts without dedicated GPU infrastructure would require hardware provisioning.',
      key_findings: [
        'GPU/CPU separation architecture is viable for audio isolation',
        'Azure Government Cloud GPU availability is limited',
        'Latency exceeds acceptable thresholds for real-time proceedings',
      ],
      artifact_links: [
        { label: 'Audio Security POC Lessons-Learned Document', url: 'https://sharepoint.ao.dcn/sites/TSIO/AudioSecurityPOC', artifact_type: 'DOCUMENT' },
      ],
      engagement_options: ['REQUEST_BRIEFING', 'REQUEST_DEMO', 'REQUEST_ADOPTION_DISCUSSION', 'REQUEST_TECHNICAL_GUIDANCE'],
      mission_area_tags: ['Cybersecurity', 'Court Operations'],
      technology_area_tags: ['Cloud Infrastructure', 'AI/ML'],
    },
  });
  expect(seedRes.status()).toBe(201);
  const body = await seedRes.json();
  publishedRecordId = body.record_id;
});

test.afterAll(async ({ request }) => {
  if (publishedRecordId) {
    // Clean up seeded record
    await request.delete(`/api/v1/test-seed/records/${publishedRecordId}`);
  }
});

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

test('breadcrumb "← Back to Catalog" links to /catalog', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const breadcrumb = page.getByRole('link', { name: /back to catalog/i });
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb).toHaveAttribute('href', '/catalog');
});

// ─── Record Header ───────────────────────────────────────────────────────────

test('record header shows title, maturity badge, review status badge, and owner', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: 'Audio Security Proof of Concept' })).toBeVisible();
  await expect(page.locator('.maturity-badge')).toBeVisible();
  await expect(page.locator('.review-status-badge')).toBeVisible();
  // Community badge for COMMUNITY source_type
  await expect(page.locator('.community-badge')).toBeVisible();
  // Owner name
  await expect(page.getByText(/Owner:.*I&R Branch/)).toBeVisible();
});

// ─── Perspective Toggle ───────────────────────────────────────────────────────

test('perspective toggle is visible with both tabs', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const tablist = page.getByRole('tablist');
  await expect(tablist).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Executive View' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Technical View' })).toBeVisible();
});

test('default view is Executive; executive sections visible', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // Executive View tab is aria-selected
  const execTab = page.getByRole('tab', { name: 'Executive View' });
  await expect(execTab).toHaveAttribute('aria-selected', 'true');
  // Executive content sections visible
  await expect(page.getByText('MISSION PROBLEM')).toBeVisible();
  await expect(page.getByText('EXECUTIVE PERSPECTIVE')).toBeVisible();
  await expect(page.getByText('DECISION RECOMMENDATION')).toBeVisible();
  await expect(page.getByText('OUTCOME SUMMARY')).toBeVisible();
  await expect(page.getByText('KEY FINDINGS')).toBeVisible();
});

test('clicking Technical View tab switches view and updates URL ?view=technical', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const techTab = page.getByRole('tab', { name: 'Technical View' });
  await techTab.click();

  // URL updated
  await expect(page).toHaveURL(/view=technical/);
  // Technical View tab now active
  await expect(techTab).toHaveAttribute('aria-selected', 'true');
  // Technical sections visible
  await expect(page.getByText('WHAT WAS EXPLORED')).toBeVisible();
  await expect(page.getByText('TECHNICAL DETAILS')).toBeVisible();
  await expect(page.getByText('SECURITY FINDINGS')).toBeVisible();
});

test('Technical View shows "Security review not completed" warning when security_findings is null', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByText(/Security review has NOT been completed/i)).toBeVisible();
});

test('loading /records/{id}?view=technical opens directly in Technical View', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByRole('tab', { name: 'Technical View' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('WHAT WAS EXPLORED')).toBeVisible();
});

// ─── Trust Disclaimers ───────────────────────────────────────────────────────

test('trust disclaimers section is visible with "TRUST & LIMITATIONS" heading', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
});

test('trust disclaimers include POC disclaimer for EXPERIMENT_POC maturity', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // From TrustDisclaimerService: EXPERIMENT_POC → POC_NOT_PRODUCTION_READY text
  await expect(page.getByText(/proof-of-concept/i)).toBeVisible();
});

test('trust disclaimers include COMMUNITY disclaimer for COMMUNITY source_type', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  // From TrustDisclaimerService: source_type=COMMUNITY → COMMUNITY_NOT_CENTRALLY_ENDORSED text
  await expect(page.getByText(/team outside I&R/i)).toBeVisible();
});

test('trust disclaimers section appears in both executive and technical views', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
  await page.getByRole('tab', { name: 'Technical View' }).click();
  await expect(page.getByRole('heading', { name: /TRUST.*LIMITATIONS/i })).toBeVisible();
});

// ─── Artifact Links ──────────────────────────────────────────────────────────

test('artifact links section is visible with external link opening in new tab', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  const artifactLink = page.getByRole('link', { name: /Audio Security POC.*opens in new tab/i });
  await expect(artifactLink).toBeVisible();
  await expect(artifactLink).toHaveAttribute('target', '_blank');
  await expect(artifactLink).toHaveAttribute('rel', /noopener/);
});

// ─── Next-Action Panel ───────────────────────────────────────────────────────

test('next-action panel shows engagement buttons for all 4 configured engagement types', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('button', { name: /Request a Briefing/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request a Demo/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request Adoption Discussion/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Request Technical Guidance/i })).toBeVisible();
});

test('next-action panel in executive view shows "View Technical Details" crosslink', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}`);
  await expect(page.getByRole('link', { name: /View Technical Details/i })).toBeVisible();
});

test('next-action panel in technical view shows "View Executive Summary" crosslink', async ({ page }) => {
  await page.goto(`/records/${publishedRecordId}?view=technical`);
  await expect(page.getByRole('link', { name: /View Executive Summary/i })).toBeVisible();
});

// ─── 404 Handling ────────────────────────────────────────────────────────────

test('navigating to /records/{nonexistent-id} shows 404 page', async ({ page }) => {
  await page.goto(`/records/${NONEXISTENT_ID}`);
  await expect(page.getByRole('heading', { name: /404/i })).toBeVisible();
  await expect(page.getByText(/The requested record was not found/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Return to Catalog/i })).toBeVisible();
});
```

**Playwright config prerequisite:** Ensure `playwright.config.ts` has:
```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
  testDir: './e2e',
});
```

**Test endpoint prerequisite:** The test seed endpoint `POST /api/v1/test-seed/published-record` and `DELETE /api/v1/test-seed/records/:id` must be added to the Express app gated on `NODE_ENV === 'test'`. These are minimal test harness routes:
- `POST /api/v1/test-seed/published-record`: accepts record shape, creates + submits-for-review + publishes the record as a test curator, returns `{ record_id }`
- `DELETE /api/v1/test-seed/records/:id`: hard-deletes the record (bypasses lifecycle for cleanup)

These test routes must NEVER be active in `NODE_ENV === 'production'`.
  </action>
  <verify>
ls e2e/record-page.spec.ts && echo "PLAYWRIGHT_FILE_EXISTS" && grep -n "perspective.*toggle\|tablist\|aria-selected" e2e/record-page.spec.ts && echo "TOGGLE_TEST_OK" && grep -n "trust.*disclaimer\|TRUST.*LIMITATIONS\|trust_disclaimers\|proof-of-concept\|Community" e2e/record-page.spec.ts && echo "TRUST_TESTS_OK" && grep -n "target.*_blank\|opens in new tab\|artifact" e2e/record-page.spec.ts && echo "ARTIFACT_TESTS_OK" && grep -n "Request a Briefing\|REQUEST_BRIEFING\|engagement" e2e/record-page.spec.ts && echo "ENGAGEMENT_TESTS_OK" && grep -n "Back to Catalog\|breadcrumb\|/catalog" e2e/record-page.spec.ts && echo "BREADCRUMB_TEST_OK" && grep -n "404\|not found\|nonexistent" e2e/record-page.spec.ts && echo "404_TEST_OK" && npx playwright test e2e/record-page.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
  </verify>
  <done>
- `e2e/record-page.spec.ts` exists with a full Playwright test suite
- Tests cover (all must pass):
  - Breadcrumb "← Back to Catalog" renders and links to /catalog
  - Record header shows title, maturity badge, review status badge, owner
  - COMMUNITY badge renders for COMMUNITY source_type records
  - Perspective Toggle (role=tablist) is always visible with both Executive View and Technical View tabs
  - Default view is Executive View (aria-selected="true" on executive tab)
  - Clicking Technical View switches content, updates URL to ?view=technical
  - Loading ?view=technical directly opens Technical View
  - Technical View shows "WHAT WAS EXPLORED", "TECHNICAL DETAILS", "SECURITY FINDINGS" sections
  - "Security review has NOT been completed" warning visible when security_findings is null
  - Trust & Limitations heading visible in both views
  - POC trust disclaimer visible (EXPERIMENT_POC maturity trigger)
  - COMMUNITY trust disclaimer visible (COMMUNITY source_type trigger)
  - Artifact links have target=_blank and rel=noopener
  - All 4 engagement type buttons visible in Next-Action panel
  - "View Technical Details →" link present in executive view
  - "View Executive Summary →" link present in technical view
  - /records/{nonexistent-id} shows 404 page with "not found" message
- Test seed endpoint (`/api/v1/test-seed/published-record`) used by tests; gated to NODE_ENV=test only
- All Playwright tests pass against running dev server (0.0.0.0:3000)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| API→frontend | InnovationRecord JSON from GET /api/v1/records/:id crossing into React component rendering; trust_disclaimers and record text fields are user-influenced strings crossing into DOM |
| URL→component | User-controlled ?view= URL param and :id route param crossing into React state and fetch calls |
| frontend→external | Artifact link URLs stored in the DB crossing into href attributes rendered to the user's browser |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-11-01 | Tampering / XSS (stored) | `RecordPage.tsx` — all record text fields rendered in React | mitigate | All record text fields (`problem_statement`, `executive_perspective_text`, `outcome_summary`, `key_findings[]`, `trust_disclaimers[]`, etc.) are rendered as React text children (e.g. `<p>{record.problem_statement}</p>`) — NEVER via `dangerouslySetInnerHTML`. React automatically escapes HTML entities in JSX text interpolation. This mirrors TechArch §5.5 "All user-supplied text is HTML-stripped before persistence; frontend renders text as plain text, not innerHTML." If a field ever needs rich text in future, a safe renderer must be introduced — this is an explicit constraint documented here for Wave 7 review. |
| T-11-02 | Information Disclosure | `RecordPage` — fetching a non-PUBLISHED record | mitigate | The backend `GET /api/v1/records/:id` returns 404 for any non-PUBLISHED record requested by a PUBLIC (unauthenticated) user (enforced in `recordService.getRecord()` from 05-PLAN.md). `RecordPage.tsx` treats any 404 as "not found" and renders `NotFoundPage` — it never renders partial record data from a 404 response. Non-PUBLISHED records are not exposed to the public frontend under any code path. |
| T-11-03 | Tampering | `?view=` URL param — user-controlled string used to set component state | mitigate | `RecordPage.tsx` validates the `?view=` param against an allowlist: `viewParam === 'technical' ? 'technical' : 'executive'`. Any other value (including injection attempts) defaults to `'executive'`. The param is never interpolated into a fetch URL or API call — it controls only React local state for panel rendering. |
| T-11-04 | Tampering | `:id` route param — user-controlled UUID passed into fetch URL | mitigate | The `:id` param is passed directly to `fetch('/api/v1/records/${id}')`. The backend performs UUID format validation and returns 404 for any value that does not match a real PUBLISHED record. The frontend does no UUID validation itself (server is authoritative). The fetch is a GET to a same-origin relative URL — no SSRF risk since the Hub never makes server-side requests to artifact URLs, only stores them. |
| T-11-05 | Information Disclosure | `ArtifactLinksSection` — artifact URLs rendered as `<a href>` | mitigate | Artifact links are rendered as `<a href={link.url} target="_blank" rel="noopener noreferrer">`. Hub never fetches these URLs — they are stored strings (per TechArch §7.6 SSRF note: "Artifact URLs stored as strings only — Hub never fetches or proxies them"). The `https://` constraint is enforced by the DB CHECK constraint and `governanceGateService.validate()` on write — malicious `javascript:` or `data:` URLs cannot be stored. The frontend adds `rel="noopener noreferrer"` to prevent tab-napping. |
| T-11-06 | Tampering | Trust disclaimers — must be server-computed, not overridable by frontend | mitigate | `TrustDisclaimersSection.tsx` renders `record.trust_disclaimers` which is a `string[]` computed exclusively by `TrustDisclaimerService` on the backend and included in every `GET /api/v1/records/:id` response (per TechArch §5.6 rule 1: "Trust disclaimers are computed server-side by TrustDisclaimerService and included in every public record API response. The frontend renders the disclaimer texts from the API response — it does not compute them independently."). The frontend never has logic to suppress or recompute disclaimers. |
| T-11-07 | Elevation of Privilege | Test-only seed endpoints (`POST /api/v1/test-seed/*`) — must be disabled in production | mitigate | The test seed routes in `NextActionPanel.tsx` and `e2e/record-page.spec.ts` depend on `POST /api/v1/test-seed/published-record` — a test harness endpoint added to the Express app. This endpoint MUST be registered only when `process.env.NODE_ENV !== 'production'` (explicit `if (process.env.NODE_ENV !== 'production') { app.use('/api/v1/test-seed', testSeedRouter); }`). The Wave 7 integration plan should add a production smoke test that asserts `/api/v1/test-seed/published-record` returns 404 in the production build. |
</threat_model>

<verification>
After both tasks complete:

1. Verify all component files exist:
   ```bash
   ls src/client/pages/RecordPage.tsx src/client/pages/NotFoundPage.tsx src/client/components/record/PerspectiveToggle.tsx src/client/components/record/ExecutivePerspectivePanel.tsx src/client/components/record/TechnicalPerspectivePanel.tsx src/client/components/record/TrustDisclaimersSection.tsx src/client/components/record/ArtifactLinksSection.tsx src/client/components/record/NextActionPanel.tsx && echo "ALL_COMPONENT_FILES_OK"
   ```

2. Verify ARIA accessibility on PerspectiveToggle:
   ```bash
   grep -n "role=\"tablist\"\|role=\"tab\"\|aria-selected" src/client/components/record/PerspectiveToggle.tsx && echo "TABLIST_ARIA_OK"
   ```

3. Verify trust disclaimers amber color and heading:
   ```bash
   grep -n "FEF3C7\|D97706\|TRUST.*LIMITATIONS" src/client/components/record/TrustDisclaimersSection.tsx && echo "DISCLAIMER_DESIGN_OK"
   ```

4. Verify no dangerouslySetInnerHTML usage (XSS prevention):
   ```bash
   grep -rn "dangerouslySetInnerHTML" src/client/components/record/ src/client/pages/RecordPage.tsx && echo "XSS_RISK_FOUND" || echo "NO_DANGEROUS_HTML_OK"
   ```

5. Verify artifact links use target=_blank with rel=noopener:
   ```bash
   grep -n "target.*_blank\|rel.*noopener" src/client/components/record/ArtifactLinksSection.tsx && echo "ARTIFACT_LINK_SAFETY_OK"
   ```

6. Verify onEngagementRequest hook is exported from NextActionPanel:
   ```bash
   grep -n "onEngagementRequest\|OnEngagementRequest" src/client/components/record/NextActionPanel.tsx && echo "ENGAGEMENT_HOOK_OK"
   ```

7. Run Playwright tests (requires running dev server with seeded DB):
   ```bash
   npx playwright test e2e/record-page.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
   ```

8. Verify breadcrumb wires to /catalog (Navigation Map requirement):
   ```bash
   grep -n "/catalog\|Back to Catalog" src/client/pages/RecordPage.tsx && echo "BREADCRUMB_OK"
   ```
</verification>

<success_criteria>
- `/records/{id}` for a PUBLISHED record renders: title, maturity badge, review status badge, community/validated-reuse badges (conditional), owner, last_reviewed_date, mission area tags
- Perspective Toggle (role=tablist) is always visible; both "Executive View" and "Technical View" tabs present; active tab has aria-selected="true"
- Executive View sections render in correct order per UX Mockup: Mission Problem, Executive Perspective, Decision Recommendation, Outcome Summary, Key Findings, Trust & Limitations, Next Actions, Artifacts
- Technical View sections render in correct order: Mission Problem, What Was Explored, Technical Details (placeholder if null), Security Findings (warning if null), Performance Findings, Reuse Guidance, Key Findings, Outcome Summary, Trust & Limitations, Next Actions, Technical Artifacts
- Trust & Limitations section uses amber background (#FEF3C7), renders all trust_disclaimers[] from API response as bullet list; never suppressed; system-generated (not curator-overridable)
- All 4 trust disclaimer trigger conditions render correctly when conditions are met: EXPERIMENT_POC/PROTOTYPE_PILOT maturity, PUBLISHED state, COMMUNITY source_type, VALIDATED_FOR_REUSE review status
- Artifact links have target=_blank, rel="noopener noreferrer", aria-label "(opens in new tab)", sorted by display_order
- Next-Action panel renders only engagement options present on the record; correct buttons for all 4 types; primary CTAs match perspective (Executive: REQUEST_BRIEFING/REQUEST_DEMO primary; Technical: REQUEST_TECHNICAL_GUIDANCE primary)
- ?view= URL param updated on toggle (no page reload); loading ?view=technical opens Technical View directly
- Breadcrumb "← Back to Catalog" navigates to /catalog
- /records/{nonexistent-id} renders NotFoundPage with "not found" message and "Return to Catalog" link
- All Playwright tests in e2e/record-page.spec.ts pass (0 failing, 0 skipped)
- Dev server binds to 0.0.0.0:3000 (Pivota Preview compatible); no X-Frame-Options DENY/SAMEORIGIN headers
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/11-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (React vs TechArch SSR conflict documented; perspective toggle URL sync; trust disclaimer rendering approach; engagement hook for Wave 5; test seed endpoint gating)
- Integration contract summary for Wave 5 (engagement modal onEngagementRequest hook) and Wave 7 (trust disclaimer end-to-end validation)
</output>
