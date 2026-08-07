import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { InnovationRecord, PerspectiveView, OnEngagementRequest, EngagementOptionType } from '../types/record';
import { PerspectiveToggle } from '../components/record/PerspectiveToggle';
import { ExecutivePerspectivePanel } from '../components/record/ExecutivePerspectivePanel';
import { TechnicalPerspectivePanel } from '../components/record/TechnicalPerspectivePanel';
import { TrustDisclaimersSection } from '../components/record/TrustDisclaimersSection';
import { ArtifactLinksSection } from '../components/record/ArtifactLinksSection';
import { NextActionPanel } from '../components/record/NextActionPanel';
import { NotFoundPage } from './NotFoundPage';
import { EngagementRequestModal } from '../components/engagement/EngagementRequestModal';
import type { EngagementType } from '../components/engagement/EngagementRequestModal';

// Maturity badge color map per UX Mockup §Color System for Trust Signals
const MATURITY_BADGE_COLORS: Record<string, string> = {
  IDEA: '#6B7280',
  EXPERIMENT_POC: '#D97706',
  PROTOTYPE_PILOT: '#EA580C',
  PRODUCTION_VALIDATED: '#16A34A',
  ARCHIVED: '#374151',
};

// Engagement options that map to EngagementType (excludes SUBMIT_RELATED_PROBLEM)
const ENGAGEMENT_TYPE_MAP: Partial<Record<EngagementOptionType, EngagementType>> = {
  REQUEST_DEMO: 'REQUEST_DEMO',
  REQUEST_ADOPTION_DISCUSSION: 'REQUEST_ADOPTION_DISCUSSION',
  REQUEST_TECHNICAL_GUIDANCE: 'REQUEST_TECHNICAL_GUIDANCE',
  REQUEST_BRIEFING: 'REQUEST_BRIEFING',
};

export const RecordPage: React.FC<{
  onEngagementRequest?: OnEngagementRequest;
}> = ({ onEngagementRequest }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [record, setRecord] = useState<InnovationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Engagement modal state (Wave 5b — EngagementRequestModal)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEngagementType, setModalEngagementType] = useState<EngagementType>('REQUEST_DEMO');
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

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

  // Handle engagement button clicks from NextActionPanel
  const handleEngagementRequest = useCallback((
    type: EngagementOptionType,
    _record: InnovationRecord,
  ) => {
    const engagementType = ENGAGEMENT_TYPE_MAP[type];
    if (engagementType) {
      // Capture the currently-focused trigger button for focus return (WCAG 2.1 AA)
      // document.activeElement is the button that was just clicked
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLButtonElement) {
        triggerButtonRef.current = activeEl;
      }
      setModalEngagementType(engagementType);
      setModalOpen(true);
    } else if (onEngagementRequest) {
      // Fall back to parent handler for types not handled by modal (e.g. SUBMIT_RELATED_PROBLEM)
      onEngagementRequest(type, _record);
    }
  }, [onEngagementRequest]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    // Return focus to the trigger button (WCAG 2.1 AA)
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
      triggerButtonRef.current = null;
    }
  }, []);

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
        onEngagementRequest={handleEngagementRequest}
      />

      {/* Engagement Request Modal (Wave 5b — F7 Engagement Routing) */}
      {record && (
        <EngagementRequestModal
          engagementType={modalEngagementType}
          recordId={record.record_id}
          recordTitle={record.title}
          isOpen={modalOpen}
          onClose={handleModalClose}
        />
      )}

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
