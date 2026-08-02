/**
 * RecordPage.tsx — Innovation Record page route component.
 *
 * Route: /records/:id
 *
 * Owns:
 * - Fetching GET /api/v1/records/:id on mount using :id from React Router URL params
 * - Reading ?view= URL param for initial perspective (defaults to record.default_perspective)
 * - Updating ?view= URL param on toggle (via React Router setSearchParams — no page reload)
 * - Breadcrumb "← Back to Catalog" linking to /catalog
 * - Composing all sub-components in correct UX Mockup order
 * - EngagementRequestModal wired to NextActionPanel buttons (Wave 5 / W5-b)
 *
 * Security:
 * - T-11-01: All text rendered as React children (never dangerouslySetInnerHTML)
 * - T-11-02: 404 from API → renders NotFoundPage with no record data
 * - T-11-03: ?view= param validated against allowlist ('executive' | 'technical')
 * - T-11-04: :id passed to backend fetch; backend validates UUID + PUBLISHED state
 * - T-11-06: trust_disclaimers rendered from API response (server-computed, never frontend-computed)
 *
 * Wave 5 integration: EngagementRequestModal is mounted here and triggered by
 * onEngagementRequest passed to NextActionPanel. Modal state (which type, isOpen) is owned here.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type {
  InnovationRecord,
  PerspectiveView,
  EngagementOptionType,
} from '../types/record';
import { PerspectiveToggle } from '../components/record/PerspectiveToggle';
import { ExecutivePerspectivePanel } from '../components/record/ExecutivePerspectivePanel';
import { TechnicalPerspectivePanel } from '../components/record/TechnicalPerspectivePanel';
import { TrustDisclaimersSection } from '../components/record/TrustDisclaimersSection';
import { ArtifactLinksSection } from '../components/record/ArtifactLinksSection';
import { NextActionPanel } from '../components/record/NextActionPanel';
import { EngagementRequestModal } from '../components/engagement/EngagementRequestModal';
import type { EngagementType } from '../components/engagement/EngagementRequestModal';
import { NotFoundPage } from './NotFoundPage';

// Maturity badge color map per UX Mockup §Color System for Trust Signals
const MATURITY_BADGE_COLORS: Record<string, string> = {
  IDEA: '#6B7280',
  EXPERIMENT_POC: '#D97706',
  PROTOTYPE_PILOT: '#EA580C',
  PRODUCTION_VALIDATED: '#16A34A',
  ARCHIVED: '#374151',
};

// Map EngagementOptionType → EngagementType (modal type).
// SUBMIT_RELATED_PROBLEM is excluded from the modal (handled as link separately).
const OPTION_TO_ENGAGEMENT_TYPE: Partial<Record<EngagementOptionType, EngagementType>> = {
  REQUEST_DEMO: 'REQUEST_DEMO',
  REQUEST_ADOPTION_DISCUSSION: 'REQUEST_ADOPTION_DISCUSSION',
  REQUEST_TECHNICAL_GUIDANCE: 'REQUEST_TECHNICAL_GUIDANCE',
  REQUEST_BRIEFING: 'REQUEST_BRIEFING',
};

export const RecordPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [record, setRecord] = useState<InnovationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // T-11-03: Validate ?view= param against allowlist — any other value defaults to 'executive'
  const viewParam = searchParams.get('view');
  const [view, setView] = useState<PerspectiveView>(
    viewParam === 'technical' ? 'technical' : 'executive'
  );

  // Modal state — owned by RecordPage, passed to NextActionPanel and EngagementRequestModal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    engagementType: EngagementType | null;
  }>({ isOpen: false, engagementType: null });

  // Track which button triggered the modal so we can return focus on close (WCAG 2.1 AA)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);

    // T-11-04: :id passed to backend fetch; backend validates UUID + PUBLISHED state
    fetch(`/api/v1/records/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InnovationRecord = await res.json();
        setRecord(data);
        // Apply default_perspective from record if no URL ?view= param was specified
        if (!viewParam) {
          setView(data.default_perspective === 'TECHNICAL' ? 'technical' : 'executive');
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(
    (newView: PerspectiveView) => {
      setView(newView);
      // Update URL param without page reload (React Router replaceState)
      setSearchParams({ view: newView }, { replace: true });
    },
    [setSearchParams]
  );

  /**
   * Called when user clicks an engagement button in NextActionPanel.
   * Opens the EngagementRequestModal with the matching engagement type.
   * Captures the triggering button element to restore focus on close (WCAG 2.1 AA).
   *
   * Wave 5 (W5-b) — replaces the noop stub from Plan 11.
   */
  const handleEngagementRequest = useCallback(
    (optType: EngagementOptionType, _record: InnovationRecord, triggerEl?: HTMLButtonElement) => {
      const engagementType = OPTION_TO_ENGAGEMENT_TYPE[optType];
      if (!engagementType) {
        // SUBMIT_RELATED_PROBLEM and any unrecognized types are not modal-based
        return;
      }
      triggerButtonRef.current = triggerEl ?? null;
      setModalState({ isOpen: true, engagementType });
    },
    []
  );

  /**
   * Called when modal closes (× button, Cancel, Escape, or after confirmation Close).
   * Returns focus to the button that opened the modal (WCAG 2.1 AA).
   */
  const handleModalClose = useCallback(() => {
    setModalState({ isOpen: false, engagementType: null });
    // Return focus to the trigger button (WCAG 2.1 AA focus management)
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
      triggerButtonRef.current = null;
    }
  }, []);

  if (loading) {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Loading record&hellip;</p>
      </main>
    );
  }

  // T-11-02: 404 from API → renders NotFoundPage with no record data
  if (notFound || !record) {
    return <NotFoundPage />;
  }

  const badgeColor = MATURITY_BADGE_COLORS[record.maturity_level] ?? '#6B7280';

  return (
    <main className="record-page">
      {/* Breadcrumb — always present; links to /catalog per UX Navigation Map */}
      <nav aria-label="Breadcrumb" className="record-breadcrumb">
        <a href="/catalog">&#8592; Back to Catalog</a>
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
            <span className="validated-reuse-badge">Validated for Reuse &#10003;</span>
          )}
        </div>
        <div className="record-header-meta">
          <span>Owner: {record.owner_name}</span>
          {record.last_reviewed_date && (
            <span> &middot; Last reviewed: {record.last_reviewed_date}</span>
          )}
        </div>
        {/* Mission area tags */}
        {record.mission_area_tags.length > 0 && (
          <div className="tag-list" aria-label="Mission areas">
            {record.mission_area_tags.map((tag) => (
              <span key={tag} className="tag tag--mission">&#127991; {tag}</span>
            ))}
          </div>
        )}
      </header>

      {/* Perspective Toggle — always visible */}
      <PerspectiveToggle view={view} onToggle={handleToggle} />

      {/* Perspective Panels — only one rendered at a time */}
      {view === 'executive' ? (
        <ExecutivePerspectivePanel record={record} />
      ) : (
        <TechnicalPerspectivePanel record={record} />
      )}

      {/* Trust & Limitations — before Next-Action panel in both views, per UX Mockup */}
      {/* T-11-06: trust_disclaimers from API response; frontend never suppresses/recomputes */}
      <TrustDisclaimersSection disclaimers={record.trust_disclaimers} />

      {/* Next-Action Panel — engagement buttons wired to modal (Wave 5 / W5-b) */}
      <NextActionPanel
        engagement_options={record.engagement_options}
        record={record}
        view={view}
        onEngagementRequest={handleEngagementRequest}
      />

      {/* Artifact Links — view-specific heading per UX Mockup */}
      <ArtifactLinksSection
        links={record.artifact_links}
        heading={view === 'technical' ? 'TECHNICAL ARTIFACTS' : 'SOURCE DOCUMENTS & ARTIFACTS'}
      />

      {/* Record Footer */}
      <footer className="record-footer">
        <p>
          Owner: {record.owner_name} &middot; Contributing Office: {record.contributing_office}
        </p>
        {record.published_at && (
          <p>
            Published:{' '}
            {new Date(record.published_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        {record.last_reviewed_date && (
          <p>Last Reviewed: {record.last_reviewed_date}</p>
        )}
        <p className="record-id-display">Record ID: {record.record_id}</p>
      </footer>

      {/* Engagement Request Modal — portal overlay, not a new route */}
      {/* Mounted here so it can access record.title and record.record_id */}
      {modalState.isOpen && modalState.engagementType && (
        <EngagementRequestModal
          engagementType={modalState.engagementType}
          recordId={record.record_id}
          recordTitle={record.title}
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
        />
      )}
    </main>
  );
};
