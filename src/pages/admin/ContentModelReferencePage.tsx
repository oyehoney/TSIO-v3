/**
 * ContentModelReferencePage.tsx — Admin page at /admin/content-model.
 *
 * Read-only reference tables for all maturity levels and review statuses.
 * Falls back to hard-coded canonical constants if API returns 501 or any error.
 * No edit controls — explicitly read-only per Screen-12 mockup.
 *
 * API (optional — fails gracefully, including 501 NOT_IMPLEMENTED):
 *   GET /api/v1/admin/maturity-reference
 *   GET /api/v1/admin/review-status-reference
 *
 * Per UX-Mockup Screen-12 and US-8.3 acceptance criteria.
 * F9: Content, Maturity & Trust Model — ContentModelReferencePage
 *
 * Note: Canonical implementation also lives at src/admin/pages/ContentModelReferencePage.tsx.
 * This file satisfies the plan-16 artifact contract at src/pages/admin/.
 */

import React, { useState, useEffect } from 'react';

// ── Hard-coded canonical constants (F9 — compile-time constants) ───────────────
// These are the canonical values used everywhere in the system.
// "Definitions require a code change" — this is by design per Screen-12 mockup.
// If API returns 501 NOT_IMPLEMENTED or any error, fall back to these constants.

const MATURITY_LEVELS = [
  {
    value: 'IDEA',
    label: 'Idea',
    color: '#6B7280',
    colorLabel: 'Gray',
    definition: 'A problem or opportunity has been identified; no technical exploration has been conducted yet.',
  },
  {
    value: 'EXPERIMENT_POC',
    label: 'Experiment / POC',
    color: '#D97706',
    colorLabel: 'Amber',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
  },
  {
    value: 'PROTOTYPE_PILOT',
    label: 'Prototype / Pilot',
    color: '#EA580C',
    colorLabel: 'Orange',
    definition: 'A working model or limited deployment was built and tested in a realistic environment.',
  },
  {
    value: 'PRODUCTION_VALIDATED',
    label: 'Production / Validated Pattern',
    color: '#16A34A',
    colorLabel: 'Green',
    definition: 'Fully deployed and operational; or proven architectural pattern validated across multiple use cases.',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    color: '#374151',
    colorLabel: 'Dark Gray',
    definition: 'Work is no longer actively maintained; captured for institutional learning. Not recommended for adoption without re-evaluation.',
  },
] as const;

const REVIEW_STATUSES = [
  {
    value: 'SUBMITTED',
    label: 'Submitted',
    definition: 'Record is in the system; not yet curated or reviewed.',
  },
  {
    value: 'CURATED',
    label: 'Curated',
    definition: 'I&R curator has structured and enriched the record; it has not yet received external review.',
  },
  {
    value: 'TECHNICALLY_REVIEWED',
    label: 'Technically Reviewed',
    definition: 'I&R or AO technical team has assessed the technical approach and findings for accuracy.',
  },
  {
    value: 'SECURITY_REVIEWED',
    label: 'Security Reviewed',
    definition: 'Cybersecurity or ISSO review has been completed for this record.',
  },
  {
    value: 'POLICY_REVIEWED',
    label: 'Policy Reviewed',
    definition: 'Legal, privacy, or policy review has been completed.',
  },
  {
    value: 'VALIDATED_FOR_REUSE',
    label: 'Validated for Reuse',
    definition: 'All applicable I&R reviews have been completed. This status does not waive local security, policy, or operational review requirements before adoption.',
  },
  {
    value: 'SUPERSEDED_RETIRED',
    label: 'Superseded / Retired',
    definition: 'This record has been replaced by a newer record or retired; retained for institutional history.',
  },
] as const;

// ── Main page ─────────────────────────────────────────────────────────────────

export const ContentModelReferencePage: React.FC = () => {
  // State always initialized with hard-coded canonical values (graceful fallback)
  const [maturityData] = useState(MATURITY_LEVELS);
  const [reviewStatusData] = useState(REVIEW_STATUSES);

  // Attempt to fetch API data in parallel; on error (including 501) silently use hard-coded fallback.
  // Calls GET /api/v1/admin/maturity-reference and GET /api/v1/admin/review-status-reference.
  // Per Screen-12: "Definitions require a code change" — they ARE compile-time constants.
  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/maturity-reference', { credentials: 'same-origin' })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch('/api/v1/admin/review-status-reference', { credentials: 'same-origin' })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([_maturity, _reviewStatus]) => {
      // If API returns data in a future implementation, it would be applied here.
      // Currently hard-coded fallback is always used (canonical values match the DB enums).
      // When Wave 3c implements these endpoints, this can be updated to use API data.
    });
  }, []);

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#374151',
    verticalAlign: 'top',
    borderBottom: '1px solid #F3F4F6',
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Page header */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          Content Model Reference
        </h1>
        {/* Read-only notice — explicitly marked per Screen-12 */}
        <p
          className="read-only-notice"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#FEF9C3',
            border: '1px solid #FDE047',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#713F12',
            fontWeight: 500,
            marginBottom: '24px',
          }}
        >
          🔒 This reference is read-only. Definitions require a code change.
        </p>
      </div>

      {/* Maturity Levels table — 5 levels per F9 canonical definition */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          Maturity Levels
        </h2>
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Level</th>
                <th style={thStyle}>Label</th>
                <th style={thStyle}>Color</th>
                <th style={{ ...thStyle, width: '50%' }}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {maturityData.map((m, i) => (
                <tr key={m.value} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>
                      {/* ARCHIVED has no sequential number — represented as dash per Screen-12 */}
                      {m.value === 'ARCHIVED' ? '—' : i + 1}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {/* Colored dot + label — canonical color system per F9 */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: `${m.color}18`,
                        color: m.color,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: m.color,
                          flexShrink: 0,
                        }}
                      />
                      {m.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#6B7280' }}>
                    {m.colorLabel}
                  </td>
                  <td style={{ ...tdStyle, color: '#374151', lineHeight: 1.6 }}>
                    {m.definition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Review Statuses table — 7 statuses per F9 canonical definition */}
      <section>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          Review Statuses
        </h2>
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '30%' }}>Status</th>
                <th style={{ ...thStyle, width: '70%' }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {reviewStatusData.map((s, i) => (
                <tr key={s.value} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ ...tdStyle, borderBottom: i < reviewStatusData.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <strong style={{ color: '#111827' }}>{s.label}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px', fontFamily: 'monospace' }}>
                      {s.value}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, lineHeight: 1.6, borderBottom: i < reviewStatusData.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    {s.definition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ContentModelReferencePage;
