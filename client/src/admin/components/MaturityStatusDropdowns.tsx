// MaturityStatusDropdowns.tsx
// Maturity Level and Review Status dropdowns with inline definitions for RecordEditPage.
// UX Mockup Screen 07 Governance & Classification section:
//   [Experiment / POC ▼]
//   ℹ  Experiment / POC: A targeted exploration was conducted to test feasibility...
//   [View all maturity definitions →]
// Per US-9.3: definitions shown inline to guide consistent curator assignment.
// Per US-9.3 AC: ARCHIVED maturity on Published record → advisory to also archive pub state.
// Hard-coded definitions: a code change is required to update them (per TechArch §5.6 rule 2).

import React from 'react';

// Maturity level definitions from FRD §Shared Terminology + TechArch §4.2 MaturityLevelDefinition
export const MATURITY_DEFINITIONS: Record<string, { label: string; definition: string; colorClass: string }> = {
  IDEA: {
    label: 'Idea',
    definition: 'A concept or hypothesis has been identified and documented; no exploration has been conducted yet.',
    colorClass: 'text-gray-600',
  },
  EXPERIMENT_POC: {
    label: 'Experiment / POC',
    definition: 'A targeted exploration was conducted to test feasibility; results may be positive, negative, or inconclusive.',
    colorClass: 'text-amber-600',
  },
  PROTOTYPE_PILOT: {
    label: 'Prototype / Pilot',
    definition: 'A working prototype or limited pilot was developed and tested in a representative environment.',
    colorClass: 'text-orange-600',
  },
  PRODUCTION_VALIDATED: {
    label: 'Production / Validated Pattern',
    definition: 'The effort has been deployed in a production environment or validated as a repeatable pattern with demonstrated results.',
    colorClass: 'text-green-700',
  },
  ARCHIVED: {
    label: 'Archived',
    definition: 'The innovation effort is no longer active. Results are preserved for institutional learning.',
    colorClass: 'text-gray-500',
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
  const showArchivedAdvisory =
    value === 'ARCHIVED' && publicationState === 'PUBLISHED';

  return (
    <div className="mb-4">
      <label htmlFor="maturity-level" className="block text-sm font-medium text-gray-700 mb-1">
        Maturity Level <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="maturity-level"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'maturity-error' : 'maturity-definition'}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        <option value="">— Select maturity level —</option>
        {Object.entries(MATURITY_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="maturity-error" className="mt-1 text-xs text-red-600" role="alert">{error}</p>
      )}

      {selectedDef && (
        <div id="maturity-definition" className="mt-1 flex items-start gap-1 text-xs text-gray-600">
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div className="mt-1">
        <a
          href="/admin/content-model"
          className="text-xs text-blue-600 hover:underline"
          aria-label="View all maturity definitions"
        >
          View all maturity definitions →
        </a>
      </div>

      {/* US-9.3 AC: ARCHIVED maturity on Published record → advisory */}
      {showArchivedAdvisory && (
        <div
          role="note"
          className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800"
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

  return (
    <div className="mb-4">
      <label htmlFor="review-status" className="block text-sm font-medium text-gray-700 mb-1">
        Review Status <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <select
        id="review-status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-describedby={error ? 'review-status-error' : 'review-status-definition'}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        <option value="">— Select review status —</option>
        {Object.entries(REVIEW_STATUS_DEFINITIONS).map(([key, def]) => (
          <option key={key} value={key}>{def.label}</option>
        ))}
      </select>

      {error && (
        <p id="review-status-error" className="mt-1 text-xs text-red-600" role="alert">{error}</p>
      )}

      {selectedDef && (
        <div id="review-status-definition" className="mt-1 flex items-start gap-1 text-xs text-gray-600">
          <span aria-hidden="true">ℹ</span>
          <span>
            <strong>{selectedDef.label}:</strong> {selectedDef.definition}
          </span>
        </div>
      )}

      <div className="mt-1">
        <a
          href="/admin/content-model"
          className="text-xs text-blue-600 hover:underline"
        >
          View all review status definitions →
        </a>
      </div>
    </div>
  );
}
