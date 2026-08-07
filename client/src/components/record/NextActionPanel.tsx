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
