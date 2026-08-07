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
