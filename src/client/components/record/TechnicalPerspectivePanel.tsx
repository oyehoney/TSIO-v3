/**
 * TechnicalPerspectivePanel.tsx — Technical view perspective panel.
 *
 * Per UX Mockup Screen 02 §Layout — Technical View.
 *
 * Sections rendered in UX Mockup order:
 * 1. MISSION PROBLEM (problem_statement)
 * 2. WHAT WAS EXPLORED (what_was_explored)
 * 3. TECHNICAL DETAILS (technical_perspective_text — placeholder if null/empty)
 * 4. SECURITY FINDINGS (security_findings — warning if null: "Security review has NOT been completed")
 * 5. PERFORMANCE FINDINGS (performance_findings) — conditional
 * 6. REUSE GUIDANCE (reuse_guidance) — conditional
 * 7. KEY FINDINGS (key_findings[]) — conditional
 * 8. OUTCOME SUMMARY (outcome_summary)
 * 9. Technology area tags
 *
 * Security: T-11-01 — all fields rendered as React text children, never via
 * dangerouslySetInnerHTML.
 */

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
          &#9888; Security review has NOT been completed for this record. Local security assessment
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
            <span key={tag} className="tag tag--technology">&#127991; {tag}</span>
          ))}
        </div>
      </section>
    )}
  </div>
);
