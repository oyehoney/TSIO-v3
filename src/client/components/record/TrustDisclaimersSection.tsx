/**
 * TrustDisclaimersSection.tsx — Amber callout box for trust disclaimers.
 *
 * Per UX Mockup Screen 02 §Trust & Limitations Section Design.
 * Security: T-11-06 — trust_disclaimers are server-computed; this component
 * only renders the string array from the API. The frontend has no suppression logic.
 *
 * Renders only when disclaimers.length > 0 (returns null if empty).
 * Positioned BEFORE the Next-Action panel in both views.
 *
 * Color spec (from must_haves.artifacts.provides):
 *   background: #FEF3C7 (light amber)
 *   left border: #D97706 (amber-600)
 *   heading color: #92400E (amber-800)
 *   text color: #78350F (amber-900)
 */

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
        &#9888; TRUST &amp; LIMITATIONS
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
