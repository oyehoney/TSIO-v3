/**
 * ExecutivePerspectivePanel.tsx — Executive view perspective panel.
 *
 * Per UX Mockup Screen 02 §Layout — Executive View.
 *
 * Sections rendered in UX Mockup order:
 * 1. MISSION PROBLEM (problem_statement)
 * 2. EXECUTIVE PERSPECTIVE (executive_perspective_text) — conditional
 * 3. DECISION RECOMMENDATION (executive_recommendation) — conditional
 * 4. OUTCOME SUMMARY (outcome_summary)
 * 5. KEY FINDINGS (key_findings[]) — conditional
 * 6. Maturity/review meta line
 *
 * Security: T-11-01 — all fields rendered as React text children, never via
 * dangerouslySetInnerHTML. React automatically escapes HTML entities in JSX
 * text interpolation.
 */

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
        <strong>Maturity:</strong> {record.maturity_label} &nbsp;&middot;&nbsp;{' '}
        <strong>Review Status:</strong> {record.review_status_label} &nbsp;&middot;&nbsp;{' '}
        <strong>Reuse Potential:</strong> {record.reuse_potential}
      </p>
    </section>
  </div>
);
