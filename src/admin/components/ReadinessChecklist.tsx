/**
 * ReadinessChecklist.tsx — Publication readiness checklist per UX-Mockup Screen 07.
 *
 * Shows green ✅ or red ❌ for each of 17 pub-required fields.
 * Exports getMissingPubRequiredFields(record) for GovernanceGate error display.
 *
 * Pub-required fields (17 total per UX-Mockup):
 *   1. Title
 *   2. Problem Statement
 *   3. What Was Explored
 *   4. Outcome Summary
 *   5. Key Findings (1+)
 *   6. Maturity Level
 *   7. Review Status
 *   8. Executive Perspective Text
 *   9. Executive Recommendation
 *  10. Reuse Potential
 *  11. Owner Name + Office
 *  12. Contributing Office
 *  13. Source Type
 *  14. Mission Area Tags (1+)
 *  15. Artifact Links (1+)
 *  16. Engagement Options (1+)
 *  17. Last-Reviewed Date
 *
 * F9: Content, Maturity & Trust Model — publication readiness
 * F8: Curation and Administration — GovernanceGate integration
 */

import React from 'react';

export interface ArtifactLink {
  label: string;
  url: string;
  source_type: string;
}

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
  artifact_links?: ArtifactLink[];
  engagement_options?: string[];
  last_reviewed_date?: string;
  publication_state?: string;
  record_id?: string;
  created_at?: string;
}

interface ChecklistField {
  key: string;
  label: string;
  check: (record: Partial<RecordFormValues>) => boolean;
}

const PUB_REQUIRED_FIELDS: ChecklistField[] = [
  {
    key: 'title',
    label: 'Title',
    check: r => !!r.title && r.title.trim().length >= 5,
  },
  {
    key: 'problem_statement',
    label: 'Problem Statement',
    check: r => !!r.problem_statement && r.problem_statement.trim().length >= 50,
  },
  {
    key: 'what_was_explored',
    label: 'What Was Explored',
    check: r => !!r.what_was_explored && r.what_was_explored.trim().length >= 50,
  },
  {
    key: 'outcome_summary',
    label: 'Outcome Summary',
    check: r => !!r.outcome_summary && r.outcome_summary.trim().length >= 50,
  },
  {
    key: 'key_findings',
    label: 'Key Findings (1+)',
    check: r => Array.isArray(r.key_findings) && r.key_findings.filter(f => f.trim()).length >= 1,
  },
  {
    key: 'maturity_level',
    label: 'Maturity Level',
    check: r => !!r.maturity_level && r.maturity_level.trim().length > 0,
  },
  {
    key: 'review_status',
    label: 'Review Status',
    check: r => !!r.review_status && r.review_status.trim().length > 0,
  },
  {
    key: 'executive_perspective_text',
    label: 'Executive Perspective Text',
    check: r => !!r.executive_perspective_text && r.executive_perspective_text.trim().length >= 50,
  },
  {
    key: 'executive_recommendation',
    label: 'Executive Recommendation',
    check: r => !!r.executive_recommendation && r.executive_recommendation.trim().length >= 50,
  },
  {
    key: 'reuse_potential',
    label: 'Reuse Potential',
    check: r => !!r.reuse_potential && r.reuse_potential.trim().length > 0,
  },
  {
    key: 'owner_name_office',
    label: 'Owner Name + Office',
    check: r =>
      !!r.owner_name && r.owner_name.trim().length > 0 &&
      !!r.owner_office && r.owner_office.trim().length > 0,
  },
  {
    key: 'contributing_office',
    label: 'Contributing Office',
    check: r => !!r.contributing_office && r.contributing_office.trim().length > 0,
  },
  {
    key: 'source_type',
    label: 'Source Type',
    check: r => !!r.source_type && r.source_type.trim().length > 0,
  },
  {
    key: 'mission_area_tags',
    label: 'Mission Area Tags (1+)',
    check: r => Array.isArray(r.mission_area_tags) && r.mission_area_tags.filter(t => t.trim()).length >= 1,
  },
  {
    key: 'artifact_links',
    label: 'Artifact Links (1+)',
    check: r => Array.isArray(r.artifact_links) && r.artifact_links.filter(l => l.url.trim()).length >= 1,
  },
  {
    key: 'engagement_options',
    label: 'Engagement Options (1+)',
    check: r => Array.isArray(r.engagement_options) && r.engagement_options.length >= 1,
  },
  {
    key: 'last_reviewed_date',
    label: 'Last-Reviewed Date',
    check: r => !!r.last_reviewed_date && r.last_reviewed_date.trim().length > 0,
  },
];

/**
 * getMissingPubRequiredFields — Returns array of missing field labels.
 * Used by GovernanceGate error display in RecordEditPage.
 */
export function getMissingPubRequiredFields(record: Partial<RecordFormValues>): string[] {
  return PUB_REQUIRED_FIELDS
    .filter(f => !f.check(record))
    .map(f => f.label);
}

interface ReadinessChecklistProps {
  record: Partial<RecordFormValues>;
  collapsed?: boolean;
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ record, collapsed = false }) => {
  const results = PUB_REQUIRED_FIELDS.map(f => ({
    label: f.label,
    pass: f.check(record),
  }));
  const passingCount = results.filter(r => r.pass).length;
  const missingCount = results.filter(r => !r.pass).length;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      data-testid="readiness-checklist"
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: missingCount === 0 ? '#DCFCE7' : '#FEF2F2',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: missingCount === 0 ? '#166534' : '#991B1B',
          }}
        >
          Publication Readiness
        </span>
        <span style={{ fontSize: '0.75rem', color: missingCount === 0 ? '#166534' : '#991B1B', fontWeight: 600 }}>
          {passingCount}/{results.length}
        </span>
      </div>

      {/* Checklist items */}
      {!collapsed && (
        <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
          {results.map(({ label, pass }) => (
            <li
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 16px',
                fontSize: '0.8rem',
                color: pass ? '#374151' : '#991B1B',
              }}
            >
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{pass ? '✅' : '❌'}</span>
              {label}
              {!pass && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#B91C1C', fontWeight: 600 }}>
                  REQUIRED
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Summary footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #F3F4F6',
          backgroundColor: '#F9FAFB',
          fontSize: '0.75rem',
          color: missingCount === 0 ? '#166534' : '#991B1B',
          fontWeight: 600,
        }}
      >
        {missingCount === 0
          ? '✓ All required fields complete'
          : `${missingCount} field${missingCount === 1 ? '' : 's'} required before publishing`}
      </div>
    </div>
  );
};

export default ReadinessChecklist;
