/**
 * NextActionPanel.tsx — Engagement buttons wired for Wave 5 modal integration.
 *
 * Per UX Mockup Screen 02 §NEXT ACTIONS and Screen 03 §Engagement Request Types.
 *
 * Renders only the engagement types present in `engagement_options` prop.
 * SUBMIT_RELATED_PROBLEM is NOT rendered as a button here — handled as a link to
 * /submit-opportunity separately.
 *
 * Primary CTA styling per view:
 *   Executive view: REQUEST_BRIEFING and REQUEST_DEMO are visually primary
 *   Technical view: REQUEST_TECHNICAL_GUIDANCE is visually primary
 *
 * Wave 5 (W5-b) replaces onEngagementRequest placeholder with the actual modal trigger.
 */

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
  REQUEST_BRIEFING: '\uD83D\uDCCB',       // 📋
  REQUEST_DEMO: '\uD83C\uDFAC',            // 🎬
  REQUEST_ADOPTION_DISCUSSION: '\uD83D\uDCAC', // 💬
  REQUEST_TECHNICAL_GUIDANCE: '\uD83D\uDD27', // 🔧
  SUBMIT_RELATED_PROBLEM: '\uD83D\uDCDD',  // 📝
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
          <a href="?view=technical">View Technical Details &#8594;</a>
        </div>
      )}
      {view === 'technical' && (
        <div className="perspective-crosslink">
          <a href="?view=executive">View Executive Summary &#8594;</a>
        </div>
      )}
    </section>
  );
};
