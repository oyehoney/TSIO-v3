'use strict';

/**
 * recordService.js
 *
 * Orchestration layer for Innovation Record CRUD and lifecycle operations.
 * Delegates to: repositories, publicationLifecycleService, governanceGateService,
 *               trustDisclaimerService, auditService.
 *
 * Per FRD F02b and TechArch §1.4, §5.6.
 *
 * SECURITY:
 * - changed_by_user_id always comes from session (userId param), never from request body.
 * - Trust disclaimers computed server-side on every GET response (never trusted from client).
 * - Governance gate always enforced server-side before REVIEW→PUBLISHED (T-05-05).
 */

const innovationRecordRepository = require('../repositories/innovationRecordRepository');
const keyFindingRepository = require('../repositories/keyFindingRepository');
const artifactLinkRepository = require('../repositories/artifactLinkRepository');
const tagRepository = require('../repositories/tagRepository');
const engagementOptionsRepository = require('../repositories/engagementOptionsRepository');
const auditLogRepository = require('../repositories/auditLogRepository');

const lifecycle = require('./publicationLifecycleService');
const governanceGate = require('./governanceGateService');
const trustDisclaimer = require('./trustDisclaimerService');
const auditService = require('./auditService');

// ─── Label Maps ──────────────────────────────────────────────────────────────
// Human-readable labels per FRD §Shared Terminology and TechArch §4.2

const MATURITY_LABELS = {
  IDEA: 'Idea',
  EXPERIMENT_POC: 'Experiment / POC',
  PROTOTYPE_PILOT: 'Prototype / Pilot',
  PRODUCTION_VALIDATED: 'Production / Validated Pattern',
  ARCHIVED: 'Archived',
};

const REVIEW_STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  CURATED: 'Curated',
  TECHNICALLY_REVIEWED: 'Technically Reviewed',
  SECURITY_REVIEWED: 'Security Reviewed',
  POLICY_REVIEWED: 'Policy Reviewed',
  VALIDATED_FOR_REUSE: 'Validated for Reuse',
  SUPERSEDED_RETIRED: 'Superseded / Retired',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Enrich a record with computed/derived fields for API response:
 * - maturity_label, review_status_label
 * - trust_disclaimers (computed server-side by TrustDisclaimerService)
 * - is_validated_for_reuse, is_community_contributed
 *
 * @param {Object} record - Record with relations (key_findings, artifact_links, etc.)
 * @returns {Object} Enriched record
 */
function enrichRecord(record) {
  return {
    ...record,
    maturity_label: MATURITY_LABELS[record.maturity_level] || record.maturity_level,
    review_status_label: REVIEW_STATUS_LABELS[record.review_status] || record.review_status,
    trust_disclaimers: trustDisclaimer.getDisclaimers(record),
    is_validated_for_reuse: record.review_status === 'VALIDATED_FOR_REUSE',
    is_community_contributed: record.source_type === 'COMMUNITY',
  };
}

/**
 * Validate artifact link URLs (must start with https://).
 * Per TechArch §7.6: Hub never fetches URLs — they are stored as display strings only.
 *
 * @param {Array} links - artifact_links array
 * @throws {{ code: 'INVALID_ARTIFACT_URL', status: 422 }}
 */
function validateArtifactLinkUrls(links) {
  if (!links || links.length === 0) return;
  for (let i = 0; i < links.length; i++) {
    if (!links[i].url || !links[i].url.startsWith('https://')) {
      throw {
        code: 'INVALID_ARTIFACT_URL',
        message: `artifact_links[${i}].url must start with https://`,
        status: 422,
      };
    }
  }
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Create a new Innovation Record in DRAFT state.
 *
 * @param {import('knex').Knex} db
 * @param {Object} fields - Scalar fields + optionally: key_findings, artifact_links,
 *   mission_area_tags, technology_area_tags, engagement_options
 * @param {string} userId - Authenticated curator's user_id (from session)
 * @returns {Promise<Object>} InnovationRecord with relations and computed fields
 */
async function createRecord(db, fields, userId) {
  const {
    key_findings,
    artifact_links,
    mission_area_tags,
    technology_area_tags,
    engagement_options,
    ...scalarFields
  } = fields;

  // Validate artifact URLs before insert
  if (artifact_links) {
    validateArtifactLinkUrls(artifact_links);
  }

  // Insert the record in DRAFT state
  const scalarData = {
    ...scalarFields,
    publication_state: 'DRAFT',
    created_by_user_id: userId,
    updated_by_user_id: userId,
  };

  const record = await innovationRecordRepository.create(db, scalarData);
  const recordId = record.record_id;

  // Insert child relations if provided
  if (key_findings && key_findings.length > 0) {
    await keyFindingRepository.replaceForRecord(db, recordId, key_findings);
  }

  if (artifact_links && artifact_links.length > 0) {
    await artifactLinkRepository.replaceForRecord(db, recordId, artifact_links);
  }

  if ((mission_area_tags && mission_area_tags.length > 0) || (technology_area_tags && technology_area_tags.length > 0)) {
    await tagRepository.replaceForRecord(db, recordId, {
      mission_area_tags: mission_area_tags || [],
      technology_area_tags: technology_area_tags || [],
    });
  }

  if (engagement_options && engagement_options.length > 0) {
    await engagementOptionsRepository.replaceForRecord(db, recordId, engagement_options);
  }

  // Log RECORD_CREATED audit entry
  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'RECORD_CREATED',
    field_changed: null,
    old_value: null,
    new_value: null,
    state_transition: null,
  });

  // Return assembled record with relations and computed fields
  const fullRecord = await innovationRecordRepository.findByIdWithRelations(db, recordId);
  return enrichRecord(fullRecord);
}

/**
 * Get an Innovation Record by ID.
 * PUBLIC role: only PUBLISHED records visible (404 for others — no info disclosure).
 * CURATOR role: all states visible.
 *
 * Per TechArch §5.6 and threat T-05-01: returns 404 (not 403) for non-published records
 * when accessed by PUBLIC role — avoids disclosing record existence.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {'PUBLIC'|'CURATOR'|'ADMIN'} role - Role from session
 * @returns {Promise<Object>} InnovationRecord with trust_disclaimers
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 */
async function getRecord(db, recordId, role) {
  const record = await innovationRecordRepository.findByIdWithRelations(db, recordId);

  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  // PUBLIC role may only see PUBLISHED records
  if (role !== 'CURATOR' && role !== 'ADMIN' && record.publication_state !== 'PUBLISHED') {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  return enrichRecord(record);
}

/**
 * Update mutable fields on an Innovation Record.
 *
 * PUBLISHED state requires X-Confirm-Edit: true header (passed as confirmEdit = true).
 * Confirmed edit of PUBLISHED record re-queues it to REVIEW state first.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {Object} fields - Fields to update (scalar + arrays)
 * @param {string} userId - Authenticated curator's user_id (from session)
 * @param {boolean} confirmEdit - True if X-Confirm-Edit: true header was present
 * @returns {Promise<Object>} Updated InnovationRecord
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'EDIT_REQUIRES_CONFIRMATION', status: 409 }}
 */
async function updateRecord(db, recordId, fields, userId, confirmEdit) {
  const existing = await innovationRecordRepository.findById(db, recordId);
  if (!existing) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  // PUBLISHED state gating
  if (existing.publication_state === 'PUBLISHED' && !confirmEdit) {
    throw {
      code: 'EDIT_REQUIRES_CONFIRMATION',
      message: 'Editing a PUBLISHED record requires X-Confirm-Edit: true header.',
      status: 409,
    };
  }

  // Confirmed edit of PUBLISHED record: re-queue to REVIEW first
  if (existing.publication_state === 'PUBLISHED' && confirmEdit) {
    // Transition PUBLISHED → REVIEW
    await innovationRecordRepository.update(db, recordId, {
      publication_state: 'REVIEW',
      updated_by_user_id: userId,
    });

    await auditService.logEvent(db, {
      record_id: recordId,
      changed_by_user_id: userId,
      event_type: 'STATE_TRANSITION',
      state_transition: 'PUBLISHED->REVIEW',
    });
  }

  // Validate artifact URLs if provided
  if (fields.artifact_links) {
    validateArtifactLinkUrls(fields.artifact_links);
  }

  const {
    key_findings,
    artifact_links,
    mission_area_tags,
    technology_area_tags,
    engagement_options,
    ...scalarFields
  } = fields;

  // Log FIELD_EDIT audit entries for changed scalar fields
  for (const [fieldName, newValue] of Object.entries(scalarFields)) {
    const oldValue = existing[fieldName];
    if (oldValue !== newValue) {
      await auditService.logEvent(db, {
        record_id: recordId,
        changed_by_user_id: userId,
        event_type: 'FIELD_EDIT',
        field_changed: fieldName,
        old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
        new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
        state_transition: null,
      });
    }
  }

  // Update scalar fields
  if (Object.keys(scalarFields).length > 0) {
    await innovationRecordRepository.update(db, recordId, {
      ...scalarFields,
      updated_by_user_id: userId,
    });
  } else if (!scalarFields.updated_by_user_id) {
    // Ensure updated_by is set even for array-only updates
    await innovationRecordRepository.update(db, recordId, { updated_by_user_id: userId });
  }

  // Update array relations if provided
  if (key_findings !== undefined) {
    await keyFindingRepository.replaceForRecord(db, recordId, key_findings);
  }

  if (artifact_links !== undefined) {
    await artifactLinkRepository.replaceForRecord(db, recordId, artifact_links);
  }

  if (mission_area_tags !== undefined || technology_area_tags !== undefined) {
    // Fetch existing tags to merge if only one type is provided
    const existingTags = await tagRepository.findByRecordId(db, recordId);
    await tagRepository.replaceForRecord(db, recordId, {
      mission_area_tags: mission_area_tags !== undefined ? mission_area_tags : existingTags.mission_area_tags,
      technology_area_tags: technology_area_tags !== undefined ? technology_area_tags : existingTags.technology_area_tags,
    });
  }

  if (engagement_options !== undefined) {
    await engagementOptionsRepository.replaceForRecord(db, recordId, engagement_options);
  }

  const fullRecord = await innovationRecordRepository.findByIdWithRelations(db, recordId);
  return enrichRecord(fullRecord);
}

/**
 * Submit a record for review (DRAFT → REVIEW).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string} userId
 * @returns {Promise<{ record_id: string, publication_state: string }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'INVALID_STATE_TRANSITION', status: 422 }}
 */
async function submitForReview(db, recordId, userId) {
  const record = await innovationRecordRepository.findById(db, recordId);
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  // Validates state machine — throws INVALID_STATE_TRANSITION if not DRAFT
  lifecycle.transition(record.publication_state, 'submit-review');

  await innovationRecordRepository.update(db, recordId, {
    publication_state: 'REVIEW',
    updated_by_user_id: userId,
  });

  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'STATE_TRANSITION',
    state_transition: 'DRAFT->REVIEW',
  });

  return { record_id: recordId, publication_state: 'REVIEW' };
}

/**
 * Publish a record (REVIEW → PUBLISHED).
 * Runs GovernanceGate validation before any state change.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string} userId
 * @returns {Promise<{ record_id: string, publication_state: string, published_at: string }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'INVALID_STATE_TRANSITION', status: 422 }}
 * @throws {{ code: 'PUBLICATION_GATE_FAILED', status: 422, fields: string[] }}
 */
async function publishRecord(db, recordId, userId) {
  const record = await innovationRecordRepository.findByIdWithRelations(db, recordId);
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  // State machine validation — throws INVALID_STATE_TRANSITION if not REVIEW
  lifecycle.transition(record.publication_state, 'publish');

  // Governance gate validation (server-side, always enforced per TechArch §5.6 T-05-05)
  const gateResult = governanceGate.validate(record);
  if (!gateResult.valid) {
    throw {
      code: 'PUBLICATION_GATE_FAILED',
      message: 'Record is missing required fields for publication.',
      fields: gateResult.blocking_fields,
      status: 422,
    };
  }

  const publishedAt = new Date().toISOString();

  await innovationRecordRepository.update(db, recordId, {
    publication_state: 'PUBLISHED',
    published_at: publishedAt,
    updated_by_user_id: userId,
  });

  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'STATE_TRANSITION',
    state_transition: 'REVIEW->PUBLISHED',
  });

  return { record_id: recordId, publication_state: 'PUBLISHED', published_at: publishedAt };
}

/**
 * Supersede a published record (PUBLISHED → SUPERSEDED).
 * Requires a valid superseded_by_record_id referencing an existing record.
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string} supersededByRecordId - UUID of the record that supersedes this one
 * @param {string} userId
 * @returns {Promise<{ record_id: string, publication_state: string }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'INVALID_STATE_TRANSITION', status: 422 }}
 * @throws {{ code: 'INVALID_SUPERSEDES_REF', status: 422 }}
 */
async function supersedeRecord(db, recordId, supersededByRecordId, userId) {
  const record = await innovationRecordRepository.findById(db, recordId);
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  // State machine validation — throws INVALID_STATE_TRANSITION if not PUBLISHED
  lifecycle.transition(record.publication_state, 'supersede');

  // Validate the superseded_by_record_id references an existing record
  const supersedingRecord = await innovationRecordRepository.findById(db, supersededByRecordId);
  if (!supersedingRecord) {
    throw {
      code: 'INVALID_SUPERSEDES_REF',
      message: `superseded_by_record_id '${supersededByRecordId}' does not reference an existing record.`,
      status: 422,
    };
  }

  await innovationRecordRepository.update(db, recordId, {
    publication_state: 'SUPERSEDED',
    superseded_by_record_id: supersededByRecordId,
    updated_by_user_id: userId,
  });

  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'STATE_TRANSITION',
    state_transition: 'PUBLISHED->SUPERSEDED',
  });

  return { record_id: recordId, publication_state: 'SUPERSEDED' };
}

/**
 * Archive a record (PUBLISHED → ARCHIVED or SUPERSEDED → ARCHIVED).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string} userId
 * @returns {Promise<{ record_id: string, publication_state: string }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'INVALID_STATE_TRANSITION', status: 422 }}
 */
async function archiveRecord(db, recordId, userId) {
  const record = await innovationRecordRepository.findById(db, recordId);
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  const previousState = record.publication_state;

  // State machine validation — throws INVALID_STATE_TRANSITION if not PUBLISHED or SUPERSEDED
  lifecycle.transition(previousState, 'archive');

  await innovationRecordRepository.update(db, recordId, {
    publication_state: 'ARCHIVED',
    updated_by_user_id: userId,
  });

  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'STATE_TRANSITION',
    state_transition: `${previousState}->ARCHIVED`,
  });

  return { record_id: recordId, publication_state: 'ARCHIVED' };
}

/**
 * Hard-delete a DRAFT record.
 * Only DRAFT records may be deleted (lifecycle canDelete gate).
 * Audit entry is written BEFORE the hard-delete (for traceability).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {string} userId
 * @returns {Promise<{ deleted: true }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 * @throws {{ code: 'DELETE_NOT_PERMITTED', status: 409 }}
 */
async function deleteRecord(db, recordId, userId) {
  const record = await innovationRecordRepository.findById(db, recordId);
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  if (!lifecycle.canDelete(record.publication_state)) {
    throw {
      code: 'DELETE_NOT_PERMITTED',
      message: `Records in ${record.publication_state} state cannot be deleted. Only DRAFT records may be hard-deleted.`,
      status: 409,
    };
  }

  // Write audit entry BEFORE hard-delete (record still exists in DB at this point)
  await auditService.logEvent(db, {
    record_id: recordId,
    changed_by_user_id: userId,
    event_type: 'RECORD_DELETED',
    state_transition: null,
  });

  await innovationRecordRepository.hardDelete(db, recordId);

  return { deleted: true };
}

/**
 * Get paginated audit history for a record (CURATOR-only endpoint).
 *
 * @param {import('knex').Knex} db
 * @param {string} recordId
 * @param {{ page?: number, pageSize?: number }} pagination
 * @returns {Promise<{ data: Object[], total: number, page: number, pageSize: number, totalPages: number }>}
 * @throws {{ code: 'RECORD_NOT_FOUND', status: 404 }}
 */
async function getAuditHistory(db, recordId, pagination = {}) {
  // Verify record exists (use includeDeleted to allow audit history even after soft-delete if needed)
  const record = await innovationRecordRepository.findById(db, recordId, { includeDeleted: true });
  if (!record) {
    throw { code: 'RECORD_NOT_FOUND', message: 'Record not found.', status: 404 };
  }

  return auditLogRepository.findByRecordId(db, recordId, pagination);
}

module.exports = {
  createRecord,
  getRecord,
  updateRecord,
  submitForReview,
  publishRecord,
  supersedeRecord,
  archiveRecord,
  deleteRecord,
  getAuditHistory,
  MATURITY_LABELS,
  REVIEW_STATUS_LABELS,
};
