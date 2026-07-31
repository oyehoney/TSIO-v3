'use strict';

/**
 * trustDisclaimerService.js
 *
 * Derives trust disclaimer texts from Innovation Record field values.
 * Per FRD F02b §Validation and TechArch §5.6 rule 2.
 *
 * SECURITY: Disclaimer texts are hard-coded in source — not configurable at runtime.
 * Per TechArch §5.6 rule 2: "A code change and release is required to update disclaimer language."
 * This is intentional — trust disclaimers must not be settable by curators or admins.
 *
 * All 4 trigger conditions are evaluated simultaneously.
 * A record can trigger all 4 disclaimers at once (they are not mutually exclusive).
 *
 * getDisclaimers() is a pure function — no I/O, no side effects.
 * Called by recordService.getRecord() on every record response.
 */

/**
 * Hard-coded disclaimer texts (non-configurable per TechArch §5.6).
 * Keys correspond to trigger condition names for traceability.
 */
const DISCLAIMER_TEXTS = {
  POC_NOT_PRODUCTION_READY:
    'This record describes a proof-of-concept or pilot effort. Proof-of-concept status does not imply production readiness or organizational endorsement for deployment.',

  PUBLISHED_NOT_APPROVED_FOR_ADOPTION:
    'Publication on this Hub does not constitute approval for adoption. Stakeholders should conduct appropriate local review before adopting any innovation work.',

  COMMUNITY_NOT_CENTRALLY_ENDORSED:
    'This record was contributed by a team outside I&R. Community-submitted content has not been centrally validated by the TSIO Innovation & Research team.',

  VALIDATED_REUSE_NOT_LOCAL_REVIEW_WAIVED:
    'A "Validated for Reuse" review status does not waive the requirement for local review, security assessment, or policy approval before adoption in your jurisdiction.',
};

/**
 * Evaluate all 4 trigger conditions and return applicable disclaimer texts.
 *
 * Trigger conditions (hard-coded, non-configurable per TechArch §5.6):
 *
 * 1. EXPERIMENT_POC / PROTOTYPE_PILOT maturity_level
 *    → POC ≠ production-ready disclaimer
 *
 * 2. publication_state === 'PUBLISHED'
 *    → Published ≠ approved for adoption disclaimer
 *
 * 3. source_type === 'COMMUNITY'
 *    → Community-submitted ≠ centrally endorsed disclaimer
 *
 * 4. review_status === 'VALIDATED_FOR_REUSE'
 *    → Validated for Reuse ≠ local review waived disclaimer
 *
 * @param {Object} record - Innovation record object with maturity_level,
 *   publication_state, source_type, review_status fields.
 * @returns {string[]} Array of applicable disclaimer texts (may be empty, may have 1–4 items).
 */
function getDisclaimers(record) {
  if (!record || typeof record !== 'object') {
    return [];
  }

  const disclaimers = [];

  // Trigger 1: POC / Pilot maturity level
  if (
    record.maturity_level === 'EXPERIMENT_POC' ||
    record.maturity_level === 'PROTOTYPE_PILOT'
  ) {
    disclaimers.push(DISCLAIMER_TEXTS.POC_NOT_PRODUCTION_READY);
  }

  // Trigger 2: Published record
  if (record.publication_state === 'PUBLISHED') {
    disclaimers.push(DISCLAIMER_TEXTS.PUBLISHED_NOT_APPROVED_FOR_ADOPTION);
  }

  // Trigger 3: Community-submitted record
  if (record.source_type === 'COMMUNITY') {
    disclaimers.push(DISCLAIMER_TEXTS.COMMUNITY_NOT_CENTRALLY_ENDORSED);
  }

  // Trigger 4: Validated for Reuse review status
  if (record.review_status === 'VALIDATED_FOR_REUSE') {
    disclaimers.push(DISCLAIMER_TEXTS.VALIDATED_REUSE_NOT_LOCAL_REVIEW_WAIVED);
  }

  return disclaimers;
}

module.exports = {
  DISCLAIMER_TEXTS,
  getDisclaimers,
};
