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
 * - onEngagementRequest stub (Wave 5 wires the modal here)
 *
 * Security:
 * - T-11-01: All text rendered as React children (never dangerouslySetInnerHTML)
 * - T-11-02: 404 from API → renders NotFoundPage with no record data
 * - T-11-03: ?view= param validated against allowlist ('executive' | 'technical')
 * - T-11-04: :id passed to backend fetch; backend validates UUID + PUBLISHED state
 * - T-11-06: trust_disclaimers rendered from API response (server-computed, never frontend-computed)
 *
 * Wave 5 integration: Replace onEngagementRequest prop with actual modal trigger.
 * Export: onEngagementRequest type so Wave 5 (W5-b) can wire the engagement modal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type {
  InnovationRecord,
  PerspectiveView,
  OnEngagementRequest,
  EngagementOptionType,
} from '../types/record';
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

/**
 * Wave 5 will replace this stub with the actual modal trigger.
 * T-11-07: This noop is only used in development — Wave 5 wires the real handler.
 * TODO Wave 5 (W5-b): wire engagement request modal here
 */
const noop: OnEngagementRequest = (_type: EngagementOptionType, _record: InnovationRecord) => {
  // TODO Wave 5 (W5-b): wire engagement request modal here
  console.warn('onEngagementRequest: engagement modal not yet connected (Wave 5)');
};

interface RecordPageProps {
  onEngagementRequest?: OnEngagementRequest;
}

export const RecordPage: React.FC<RecordPageProps> = ({
  onEngagementRequest = noop,
}) => {
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

      {/* Next-Action Panel — Wave 5 wires engagement modal to onEngagementRequest */}
      <NextActionPanel
        engagement_options={record.engagement_options}
        record={record}
        view={view}
        onEngagementRequest={onEngagementRequest}
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
    </main>
  );
};
