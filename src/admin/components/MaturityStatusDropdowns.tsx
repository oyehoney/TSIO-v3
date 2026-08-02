/**
 * MaturityStatusDropdowns.tsx
 *
 * Maturity Level and Review Status controlled dropdowns with inline definitions
 * and 'View all definitions →' links for RecordEditPage.
 *
 * UX Mockup Screen 07 Governance & Classification section:
 *   [Experiment / POC ▼]
 *   ℹ  Experiment / POC: A targeted exploration was conducted to test feasibility...
 *   [View all maturity definitions →]
 *
 * Per US-9.3 AC: "Maturity level is a required field for publication; curator selects
 * from a dropdown displaying all 5 options with their definitions shown inline."
 *
 * Per US-9.3 AC: When ARCHIVED maturity is selected on a Published record, shows advisory:
 * "Consider also archiving the publication state to remove this record from the public catalog."
 *
 * Hard-coded definitions per TechArch §5.6 rule 2 — a code change is required to update them.
 *
 * F9: Content, Maturity & Trust Model — inline governance definitions on RecordEditPage
 */

import React from 'react';

// Maturity level definitions from FRD §Shared Terminology + TechArch §4.2 MaturityLevelDefinition
export const MATURITY_DEFINITIONS: Record<string, { label: string; definition: string }> = {
  IDEA: {
    label: 'Idea',
    definition: 'A concept or hypothesis has been identified and documented; no exploration has been conducted yet.',
  },
  EXPERIMENT_POC: {
    label: 'Experiment / POC',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
  },
  PROTOTYPE_PILOT: {
    label: 'Prototype / Pilot',
    definition: 'A working prototype or limited pilot was developed and tested in a representative environment.',
  },
  PRODUCTION_VALIDATED: {
    label: 'Production / Validated Pattern',
    definition: 'The effort has been deployed in a production environment or validated as a repeatable pattern with demonstrated results.',
  },
  ARCHIVED: {
    label: 'Archived',
    definition: 'The innovation effort is no longer active. Results are preserved for institutional learning.',
  },
};

// Review status definitions from FRD §Shared Terminology + TechArch §4.2 ReviewStatusDefinition
export const REVIEW_STATUS_DEFINITIONS: Record<string, { label: string; definition: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    definition: 'The record has been submitted for I&R review; curation has not yet begun.',
  },
  CURATED: {
    label: 'Curated',
    definition: 'I&R curator has structured and enriched the record; not yet externally reviewed.',
  },
  TECHNICALLY_REVIEWED: {
    label: 'Technically Reviewed',
    definition: 'An I&R technical reviewer has assessed the technical approach, architecture, and findings.',
  },
  SECURITY_REVIEWED: {
    label: 'Security Reviewed',
    definition: 'A security review has been completed for this record.',
  },
  POLICY_REVIEWED: {
    label: 'Policy Reviewed',
    definition: 'A policy review has been completed for this record.',
  },
  VALIDATED_FOR_REUSE: {
    label: 'Validated for Reuse',
    definition: 'All applicable I&R reviews have been completed. Validated for Reuse does not waive local review before adoption.',
  },
  SUPERSEDED_RETIRED: {
    label: 'Superseded / Retired',
    definition: 'This review status is no longer current; the record has been superseded or retired.',
  },
};

interface MaturityLevelDropdownProps {
  value: string;
  onChange: (value: string) => void;
  publicationState?: string;
  disabled?: boolean;
  error?: string;
}

export function MaturityLevelDropdown({
  value,
  onChange,
  publicationState,
  disabled = false,
  error,
}: MaturityLevelDropdownProps) {
  const selectedDef = value ? MATURITY_DEFINITIONS[value] : null;
  const showArchivedAdvisory = value === 'ARCHIVED' && publicationState === 'PUBLISHED';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${error ? '#DC2626' : '#D1D5DB'}`,
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'default',
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        htmlFor="maturity-level"
        style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}
      >
        Maturity Level{' '}
        <span style={{ color: '#DC2626' }} aria-hidden="true">*</span>
      </label>
      <select
        id="maturity-level"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'maturity-error' : 'maturity-definition'}
        style={inputStyle}
      >
        <option value="">— Select maturity level —</option>
        {Object.entries(MATURITY_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="maturity-error" style={{ marginTop: '4px', fontSize: '0.75rem', color: '#DC2626' }} role="alert">
          {error}
        </p>
      )}

      {selectedDef && (
        <div
          id="maturity-definition"
          style={{
            marginTop: '6px',
            fontSize: '0.8rem',
            color: '#374151',
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '4px',
            padding: '8px 12px',
            display: 'flex',
            gap: '6px',
          }}
        >
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div style={{ marginTop: '4px' }}>
        <a
          href="/admin/content-model"
          style={{ fontSize: '0.75rem', color: '#1D4ED8', textDecoration: 'none' }}
          aria-label="View all maturity level definitions"
        >
          View all maturity definitions →
        </a>
      </div>

      {/* US-9.3 AC: ARCHIVED maturity on Published record → advisory */}
      {showArchivedAdvisory && (
        <div
          role="note"
          style={{
            marginTop: '8px',
            borderRadius: '6px',
            border: '1px solid #FDE68A',
            backgroundColor: '#FFFBEB',
            padding: '10px 12px',
            fontSize: '0.8rem',
            color: '#92400E',
          }}
          data-testid="archived-maturity-advisory"
        >
          <span aria-hidden="true">ℹ</span>{' '}
          Consider also archiving the publication state to remove this record from the public catalog.
        </div>
      )}
    </div>
  );
}

interface ReviewStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ReviewStatusDropdown({
  value,
  onChange,
  disabled = false,
  error,
}: ReviewStatusDropdownProps) {
  const selectedDef = value ? REVIEW_STATUS_DEFINITIONS[value] : null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${error ? '#DC2626' : '#D1D5DB'}`,
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'default',
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        htmlFor="review-status"
        style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}
      >
        Review Status{' '}
        <span style={{ color: '#DC2626' }} aria-hidden="true">*</span>
      </label>
      <select
        id="review-status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'review-status-error' : 'review-status-definition'}
        style={inputStyle}
      >
        <option value="">— Select review status —</option>
        {Object.entries(REVIEW_STATUS_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="review-status-error" style={{ marginTop: '4px', fontSize: '0.75rem', color: '#DC2626' }} role="alert">
          {error}
        </p>
      )}

      {selectedDef && (
        <div
          id="review-status-definition"
          style={{
            marginTop: '6px',
            fontSize: '0.8rem',
            color: '#374151',
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '4px',
            padding: '8px 12px',
            display: 'flex',
            gap: '6px',
          }}
        >
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div style={{ marginTop: '4px' }}>
        <a
          href="/admin/content-model"
          style={{ fontSize: '0.75rem', color: '#1D4ED8', textDecoration: 'none' }}
          aria-label="View all review status definitions"
        >
          View all review status definitions →
        </a>
      </div>
    </div>
  );
}

export default { MaturityLevelDropdown, ReviewStatusDropdown };
