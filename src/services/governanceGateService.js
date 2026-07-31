'use strict';

/**
 * governanceGateService.js
 *
 * Pub-required field validation before REVIEW → PUBLISHED transition.
 * Per FRD F02b §Validation and TechArch §5.6 rule 3.
 *
 * The governance gate is ALWAYS enforced server-side in recordService.publishRecord().
 * Frontend publication controls (Wave 6) are convenience only — they do not gate publication.
 *
 * validate() never throws. It returns { valid: true } or { valid: false, blocking_fields: string[] }.
 * The caller (recordService) is responsible for throwing the 422 PUBLICATION_GATE_FAILED error.
 */

/**
 * Scalar pub-required field names. All must be non-null and non-empty strings.
 * Source: FRD F02b §Publication Requirements
 */
const PUB_REQUIRED_FIELDS = [
  'title',
  'problem_statement',
  'what_was_explored',
  'outcome_summary',
  'maturity_level',
  'review_status',
  'reuse_potential',
  'source_type',
  'owner_name',
  'owner_office',
  'contributing_office',
  'last_reviewed_date',
  'executive_perspective_text',
  'executive_recommendation',
];

/**
 * Array fields with minimum item counts required for publication.
 */
const PUB_REQUIRED_ARRAYS = {
  key_findings: 1,
  artifact_links: 1,
  engagement_options: 1,
  mission_area_tags: 1,
};

/**
 * Valid artifact_type enum values (from DB CHECK constraint in 001_core_content_tables.sql).
 */
const VALID_ARTIFACT_TYPES = ['DOCUMENT', 'CODE_REPOSITORY', 'VIDEO', 'DIAGRAM', 'OTHER'];

/**
 * Validate all pub-required fields before REVIEW → PUBLISHED transition.
 *
 * @param {Object} record - Full record object including resolved relations
 *   (key_findings: string[], artifact_links: Array, mission_area_tags: string[],
 *    technology_area_tags: string[], engagement_options: string[])
 * @returns {{ valid: true } | { valid: false, blocking_fields: string[] }}
 */
function validate(record) {
  const blockingFields = [];

  // ─── Scalar field presence checks ────────────────────────────────────────
  for (const field of PUB_REQUIRED_FIELDS) {
    const value = record[field];
    if (value === null || value === undefined || value === '') {
      blockingFields.push(field);
    }
  }

  // ─── Field-level validation rules (FRD F02b) ──────────────────────────
  // title: 5–200 chars
  if (record.title && (record.title.length < 5 || record.title.length > 200)) {
    if (!blockingFields.includes('title')) blockingFields.push('title_length');
  }

  // problem_statement: 50–5000 chars
  if (record.problem_statement) {
    if (record.problem_statement.length < 50 || record.problem_statement.length > 5000) {
      if (!blockingFields.includes('problem_statement')) blockingFields.push('problem_statement_length');
    }
  }

  // what_was_explored: 50–5000 chars
  if (record.what_was_explored) {
    if (record.what_was_explored.length < 50 || record.what_was_explored.length > 5000) {
      if (!blockingFields.includes('what_was_explored')) blockingFields.push('what_was_explored_length');
    }
  }

  // outcome_summary: 50–3000 chars
  if (record.outcome_summary) {
    if (record.outcome_summary.length < 50 || record.outcome_summary.length > 3000) {
      if (!blockingFields.includes('outcome_summary')) blockingFields.push('outcome_summary_length');
    }
  }

  // executive_perspective_text: 50–3000 chars
  if (record.executive_perspective_text) {
    if (record.executive_perspective_text.length < 50 || record.executive_perspective_text.length > 3000) {
      if (!blockingFields.includes('executive_perspective_text')) blockingFields.push('executive_perspective_text_length');
    }
  }

  // executive_recommendation: 50–1000 chars
  if (record.executive_recommendation) {
    if (record.executive_recommendation.length < 50 || record.executive_recommendation.length > 1000) {
      if (!blockingFields.includes('executive_recommendation')) blockingFields.push('executive_recommendation_length');
    }
  }

  // last_reviewed_date: must not be in the future
  if (record.last_reviewed_date) {
    const reviewDate = new Date(record.last_reviewed_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reviewDate > today) {
      blockingFields.push('last_reviewed_date_future');
    }
  }

  // ─── Array field validation ───────────────────────────────────────────
  // key_findings: min 1, each item 10–1000 chars
  const keyFindings = Array.isArray(record.key_findings) ? record.key_findings : [];
  if (keyFindings.length < PUB_REQUIRED_ARRAYS.key_findings) {
    blockingFields.push('key_findings');
  } else {
    for (let i = 0; i < keyFindings.length; i++) {
      const text = typeof keyFindings[i] === 'string' ? keyFindings[i] : '';
      if (text.length < 10 || text.length > 1000) {
        blockingFields.push(`key_findings[${i}]_length`);
      }
    }
  }

  // artifact_links: min 1, each must have url starting with https://, label 2–200 chars, valid artifact_type
  const artifactLinks = Array.isArray(record.artifact_links) ? record.artifact_links : [];
  if (artifactLinks.length < PUB_REQUIRED_ARRAYS.artifact_links) {
    blockingFields.push('artifact_links');
  } else {
    for (let i = 0; i < artifactLinks.length; i++) {
      const link = artifactLinks[i];
      if (!link || typeof link !== 'object') {
        blockingFields.push(`artifact_links[${i}]_invalid`);
        continue;
      }
      if (!link.url || !link.url.startsWith('https://')) {
        blockingFields.push(`artifact_links[${i}]_url`);
      }
      if (!link.label || link.label.length < 2 || link.label.length > 200) {
        blockingFields.push(`artifact_links[${i}]_label`);
      }
      if (!link.artifact_type || !VALID_ARTIFACT_TYPES.includes(link.artifact_type)) {
        blockingFields.push(`artifact_links[${i}]_artifact_type`);
      }
    }
  }

  // engagement_options: min 1
  const engagementOptions = Array.isArray(record.engagement_options) ? record.engagement_options : [];
  if (engagementOptions.length < PUB_REQUIRED_ARRAYS.engagement_options) {
    blockingFields.push('engagement_options');
  }

  // mission_area_tags: min 1
  const missionAreaTags = Array.isArray(record.mission_area_tags) ? record.mission_area_tags : [];
  if (missionAreaTags.length < PUB_REQUIRED_ARRAYS.mission_area_tags) {
    blockingFields.push('mission_area_tags');
  }

  if (blockingFields.length > 0) {
    return { valid: false, blocking_fields: blockingFields };
  }
  return { valid: true };
}

module.exports = {
  PUB_REQUIRED_FIELDS,
  PUB_REQUIRED_ARRAYS,
  validate,
};
