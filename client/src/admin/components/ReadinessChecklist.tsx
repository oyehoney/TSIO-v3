// ReadinessChecklist.tsx — Publication readiness checklist per UX-Mockup Screen 07.
// Shows green ✅ or red ❌ for each pub-required field.
// Exports getMissingPubRequiredFields(record) for GovernanceGate error display.

import React from 'react';

export interface RecordFormValues {
  title?: string;
  short_summary?: string;
  problem_statement?: string;
  what_was_explored?: string;
  outcome_summary?: string;
  key_findings?: string[];
  maturity_level?: string;
  review_status?: string;
  reuse_potential?: string;
  source_type?: string;
  default_perspective?: string;
  executive_perspective_text?: string;
  executive_recommendation?: string;
  technical_perspective_text?: string;
  security_findings?: string;
  performance_findings?: string;
  reuse_guidance?: string;
  mission_area_tags?: string[];
  technology_area_tags?: string[];
  owner_name?: string;
  owner_office?: string;
  contributing_office?: string;
  contributor_attribution?: string;
  artifact_links?: { label: string; url: string; source_type: string }[];
  engagement_options?: string[];
  last_reviewed_date?: string;
  publication_state?: string;
  record_id?: string;
  created_at?: string;
  updated_at?: string;
}

// 17 pub-required fields per UX-Mockup
interface PubRequiredField {
  key: keyof RecordFormValues;
  label: string;
  check: (record: Partial<RecordFormValues>) => boolean;
}

const PUB_REQUIRED_FIELDS: PubRequiredField[] = [
  {
    key: 'title',
    label: 'Title',
    check: r => Boolean(r.title && r.title.trim().length >= 5),
  },
  {
    key: 'problem_statement',
    label: 'Problem Statement',
    check: r => Boolean(r.problem_statement && r.problem_statement.trim().length >= 50),
  },
  {
    key: 'what_was_explored',
    label: 'What Was Explored',
    check: r => Boolean(r.what_was_explored && r.what_was_explored.trim().length >= 50),
  },
  {
    key: 'outcome_summary',
    label: 'Outcome Summary',
    check: r => Boolean(r.outcome_summary && r.outcome_summary.trim().length >= 50),
  },
  {
    key: 'key_findings',
    label: 'Key Findings (1+)',
    check: r => Boolean(r.key_findings && r.key_findings.filter(f => f.trim()).length >= 1),
  },
  {
    key: 'maturity_level',
    label: 'Maturity Level',
    check: r => Boolean(r.maturity_level),
  },
  {
    key: 'review_status',
    label: 'Review Status',
    check: r => Boolean(r.review_status),
  },
  {
    key: 'executive_perspective_text',
    label: 'Executive Perspective Text',
    check: r => Boolean(r.executive_perspective_text && r.executive_perspective_text.trim().length >= 50),
  },
  {
    key: 'executive_recommendation',
    label: 'Executive Recommendation',
    check: r => Boolean(r.executive_recommendation && r.executive_recommendation.trim().length >= 50),
  },
  {
    key: 'reuse_potential',
    label: 'Reuse Potential',
    check: r => Boolean(r.reuse_potential),
  },
  {
    key: 'owner_name',
    label: 'Owner Name + Office',
    check: r => Boolean(r.owner_name && r.owner_name.trim() && r.owner_office && r.owner_office.trim()),
  },
  {
    key: 'contributing_office',
    label: 'Contributing Office',
    check: r => Boolean(r.contributing_office && r.contributing_office.trim()),
  },
  {
    key: 'source_type',
    label: 'Source Type',
    check: r => Boolean(r.source_type),
  },
  {
    key: 'mission_area_tags',
    label: 'Mission Area Tags (1+)',
    check: r => Boolean(r.mission_area_tags && r.mission_area_tags.filter(t => t.trim()).length >= 1),
  },
  {
    key: 'artifact_links',
    label: 'Artifact Links (1+)',
    check: r => Boolean(r.artifact_links && r.artifact_links.length >= 1),
  },
  {
    key: 'engagement_options',
    label: 'Engagement Options (1+)',
    check: r => Boolean(r.engagement_options && r.engagement_options.length >= 1),
  },
  {
    key: 'last_reviewed_date',
    label: 'Last-Reviewed Date',
    check: r => Boolean(r.last_reviewed_date && r.last_reviewed_date.trim()),
  },
];

/**
 * Returns array of labels for missing pub-required fields.
 * Used by GovernanceGate error display.
 */
export function getMissingPubRequiredFields(record: Partial<RecordFormValues>): string[] {
  return PUB_REQUIRED_FIELDS
    .filter(field => !field.check(record))
    .map(field => field.label);
}

interface ReadinessChecklistProps {
  record: Partial<RecordFormValues>;
}

export function ReadinessChecklist({ record }: ReadinessChecklistProps) {
  const results = PUB_REQUIRED_FIELDS.map(field => ({
    label: field.label,
    passed: field.check(record),
  }));

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;

  return (
    <div
      style={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#374151',
          margin: '0 0 12px',
        }}
      >
        Publication Readiness
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
        {results.map(({ label, passed }) => (
          <li
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 0',
              fontSize: '13px',
              color: passed ? '#166534' : '#991B1B',
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{passed ? '✅' : '❌'}</span>
            <span>{label}</span>
            {!passed && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#EF4444',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                REQUIRED
              </span>
            )}
          </li>
        ))}
      </ul>
      {failCount > 0 && (
        <div
          style={{
            fontSize: '12px',
            color: '#EF4444',
            fontWeight: 600,
            borderTop: '1px solid #F3F4F6',
            paddingTop: '8px',
          }}
        >
          {failCount} field{failCount !== 1 ? 's' : ''} required before publishing
        </div>
      )}
      {failCount === 0 && (
        <div
          style={{
            fontSize: '12px',
            color: '#166534',
            fontWeight: 600,
            borderTop: '1px solid #F3F4F6',
            paddingTop: '8px',
          }}
        >
          ✅ All required fields complete — ready to publish
        </div>
      )}
    </div>
  );
}
