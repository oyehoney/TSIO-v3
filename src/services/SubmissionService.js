'use strict';
const { getDb } = require('../db');
const { validate: validateCaptcha } = require('./CaptchaService');
const { sendRoutingNotification } = require('./EmailService');
const sanitizeHtml = require('sanitize-html');

// ─── Input sanitization helper ─────────────────────────────────────────────────
function sanitize(text) {
  if (!text) return text;
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Opportunity Submissions (F05) ─────────────────────────────────────────────

/**
 * Create a new opportunity submission.
 * Validates fields, verifies CAPTCHA, persists, then fires non-fatal email.
 */
async function createOpportunitySubmission(data) {
  const db = getDb();
  const errors = [];

  // Field validation per FRD F05 §Validation
  const problemDesc = data.problem_description ? sanitize(data.problem_description) : '';
  if (!problemDesc || problemDesc.length < 50) {
    errors.push({ field: 'problem_description', error_code: 'FIELD_TOO_SHORT', message: 'Problem description must be at least 50 characters.' });
  } else if (problemDesc.length > 3000) {
    errors.push({ field: 'problem_description', error_code: 'FIELD_TOO_LONG', message: 'Problem description must be 3000 characters or fewer.' });
  }

  const missionArea = data.mission_area ? sanitize(data.mission_area) : '';
  if (!missionArea || missionArea.length < 2 || missionArea.length > 200) {
    errors.push({ field: 'mission_area', error_code: 'VALIDATION_ERROR', message: 'Mission area is required (2–200 characters).' });
  }

  const submittingOffice = data.submitting_office ? sanitize(data.submitting_office) : '';
  if (!submittingOffice || submittingOffice.length < 2 || submittingOffice.length > 200) {
    errors.push({ field: 'submitting_office', error_code: 'VALIDATION_ERROR', message: 'Submitting office is required (2–200 characters).' });
  }

  const submitterName = data.submitter_name ? sanitize(data.submitter_name) : '';
  if (!submitterName || submitterName.length < 2 || submitterName.length > 200) {
    errors.push({ field: 'submitter_name', error_code: 'VALIDATION_ERROR', message: 'Submitter name is required (2–200 characters).' });
  }

  if (!data.submitter_email || !isValidEmail(data.submitter_email)) {
    errors.push({ field: 'submitter_email', error_code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
  }

  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    err.fields = errors;
    throw err;
  }

  // CAPTCHA verification (before any DB write)
  const captchaResult = await validateCaptcha(data.captcha_token);
  if (!captchaResult.valid) {
    const err = new Error('CAPTCHA verification failed. Please try again.');
    err.status = 422;
    err.code = 'CAPTCHA_INVALID';
    throw err;
  }

  // Persist submission
  const [submission] = await db('opportunity_submissions')
    .insert({
      problem_description: sanitize(data.problem_description),
      mission_area: sanitize(data.mission_area),
      submitting_office: sanitize(data.submitting_office),
      submitter_name: sanitize(data.submitter_name),
      submitter_email: sanitize(data.submitter_email),
      submitter_title: data.submitter_title ? sanitize(data.submitter_title) : null,
      urgency_context: data.urgency_context ? sanitize(data.urgency_context) : null,
      known_constraints: data.known_constraints ? sanitize(data.known_constraints) : null,
      status: 'SUBMITTED'
    })
    .returning('*');

  // Non-fatal email — submission already persisted; failure here does not affect response
  await sendRoutingNotification('opportunity_submission', submission).catch(() => {});

  return submission;
}

async function listOpportunitySubmissions({ page = 1, page_size = 20 } = {}) {
  const db = getDb();
  const offset = (page - 1) * page_size;
  const [{ count }] = await db('opportunity_submissions').count('submission_id as count');
  const data = await db('opportunity_submissions')
    .orderBy('submitted_at', 'desc')
    .limit(page_size)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      page_size,
      total_count: parseInt(count, 10),
      total_pages: Math.ceil(parseInt(count, 10) / page_size)
    }
  };
}

/**
 * Update disposition of an opportunity submission (CURATOR only).
 * Valid dispositions: UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD.
 */
async function updateOpportunityDisposition(submissionId, data, curatorUserId) {
  const db = getDb();
  const VALID_DISPOSITIONS = ['UNDER_REVIEW', 'ACCEPTED_FOR_CONSIDERATION', 'DECLINED', 'LINKED_TO_RECORD'];
  if (!VALID_DISPOSITIONS.includes(data.disposition)) {
    const err = new Error('Invalid disposition value');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (data.disposition === 'LINKED_TO_RECORD') {
    if (!data.linked_record_id) {
      const err = new Error('linked_record_id is required when disposition is LINKED_TO_RECORD');
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const record = await db('innovation_records').where({ record_id: data.linked_record_id }).first();
    if (!record) {
      const err = new Error('The linked record ID does not exist.');
      err.status = 422;
      err.code = 'INVALID_RECORD_REF';
      throw err;
    }
  }

  const [updated] = await db('opportunity_submissions')
    .where({ submission_id: submissionId })
    .update({
      disposition: data.disposition,
      linked_record_id: data.linked_record_id || null,
      internal_note: data.internal_note ? sanitize(data.internal_note) : null,
      reviewed_at: new Date(),
      reviewed_by_user_id: curatorUserId
    })
    .returning('*');

  if (!updated) {
    const err = new Error('Submission not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return updated;
}

// ─── Contribution Submissions (F06) ────────────────────────────────────────────

async function createContributionSubmission(data) {
  const db = getDb();
  const errors = [];
  const VALID_MATURITIES = ['IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'];

  const workDesc = data.work_description ? sanitize(data.work_description) : '';
  if (!workDesc || workDesc.length < 50) {
    errors.push({ field: 'work_description', error_code: 'FIELD_TOO_SHORT', message: 'Work description must be at least 50 characters.' });
  } else if (workDesc.length > 3000) {
    errors.push({ field: 'work_description', error_code: 'FIELD_TOO_LONG', message: 'Work description must be 3000 characters or fewer.' });
  }

  const problemAddressed = data.problem_addressed ? sanitize(data.problem_addressed) : '';
  if (!problemAddressed || problemAddressed.length < 50) {
    errors.push({ field: 'problem_addressed', error_code: 'FIELD_TOO_SHORT', message: 'Problem addressed must be at least 50 characters.' });
  } else if (problemAddressed.length > 2000) {
    errors.push({ field: 'problem_addressed', error_code: 'FIELD_TOO_LONG', message: 'Problem addressed must be 2000 characters or fewer.' });
  }

  const outcomeSummary = data.outcome_summary ? sanitize(data.outcome_summary) : '';
  if (!outcomeSummary || outcomeSummary.length < 50) {
    errors.push({ field: 'outcome_summary', error_code: 'FIELD_TOO_SHORT', message: 'Outcome summary must be at least 50 characters.' });
  } else if (outcomeSummary.length > 2000) {
    errors.push({ field: 'outcome_summary', error_code: 'FIELD_TOO_LONG', message: 'Outcome summary must be 2000 characters or fewer.' });
  }

  if (!data.self_assessed_maturity || !VALID_MATURITIES.includes(data.self_assessed_maturity)) {
    errors.push({ field: 'self_assessed_maturity', error_code: 'VALIDATION_ERROR', message: 'Self-assessed maturity must be one of: IDEA, EXPERIMENT_POC, PROTOTYPE_PILOT, PRODUCTION_VALIDATED.' });
  }

  // artifact_urls: 1–5 valid HTTPS URLs
  if (!data.artifact_urls || !Array.isArray(data.artifact_urls) || data.artifact_urls.length === 0) {
    errors.push({ field: 'artifact_urls', error_code: 'ARTIFACT_URL_REQUIRED', message: 'At least one artifact link is required.' });
  } else if (data.artifact_urls.length > 5) {
    errors.push({ field: 'artifact_urls', error_code: 'VALIDATION_ERROR', message: 'Maximum 5 artifact URLs allowed.' });
  } else {
    data.artifact_urls.forEach((url, i) => {
      if (!isValidHttpsUrl(url)) {
        errors.push({ field: `artifact_urls[${i}]`, error_code: 'INVALID_ARTIFACT_URL', message: 'Artifact URL must be a valid https:// address.' });
      }
    });
  }

  const contributingTeam = data.contributing_team ? sanitize(data.contributing_team) : '';
  if (!contributingTeam || contributingTeam.length < 2) {
    errors.push({ field: 'contributing_team', error_code: 'VALIDATION_ERROR', message: 'Contributing team is required.' });
  }

  const contributingOffice = data.contributing_office ? sanitize(data.contributing_office) : '';
  if (!contributingOffice || contributingOffice.length < 2) {
    errors.push({ field: 'contributing_office', error_code: 'VALIDATION_ERROR', message: 'Contributing office is required.' });
  }

  const contactName = data.contact_name ? sanitize(data.contact_name) : '';
  if (!contactName || contactName.length < 2) {
    errors.push({ field: 'contact_name', error_code: 'VALIDATION_ERROR', message: 'Contact name is required.' });
  }

  if (!data.contact_email || !isValidEmail(data.contact_email)) {
    errors.push({ field: 'contact_email', error_code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
  }

  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    err.fields = errors;
    throw err;
  }

  // CAPTCHA (before DB write)
  const captchaResult = await validateCaptcha(data.captcha_token);
  if (!captchaResult.valid) {
    const err = new Error('CAPTCHA verification failed. Please try again.');
    err.status = 422;
    err.code = 'CAPTCHA_INVALID';
    throw err;
  }

  const [submission] = await db('contribution_submissions')
    .insert({
      work_description: sanitize(data.work_description),
      problem_addressed: sanitize(data.problem_addressed),
      outcome_summary: sanitize(data.outcome_summary),
      self_assessed_maturity: data.self_assessed_maturity,
      artifact_urls: data.artifact_urls, // TEXT[] — knex handles array for PostgreSQL
      contributing_team: sanitize(data.contributing_team),
      contributing_office: sanitize(data.contributing_office),
      contact_name: sanitize(data.contact_name),
      contact_email: sanitize(data.contact_email),
      contact_title: data.contact_title ? sanitize(data.contact_title) : null,
      additional_context: data.additional_context ? sanitize(data.additional_context) : null,
      status: 'SUBMITTED'
    })
    .returning('*');

  // Non-fatal email
  await sendRoutingNotification('contribution_submission', submission).catch(() => {});

  return submission;
}

async function listContributionSubmissions({ page = 1, page_size = 20 } = {}) {
  const db = getDb();
  const offset = (page - 1) * page_size;
  const [{ count }] = await db('contribution_submissions').count('submission_id as count');
  const data = await db('contribution_submissions')
    .orderBy('submitted_at', 'desc')
    .limit(page_size)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      page_size,
      total_count: parseInt(count, 10),
      total_pages: Math.ceil(parseInt(count, 10) / page_size)
    }
  };
}

async function updateContributionDisposition(submissionId, data, curatorUserId) {
  const db = getDb();
  const VALID_DISPOSITIONS = ['UNDER_REVIEW', 'ACCEPTED_FOR_CURATION', 'DECLINED', 'PUBLISHED'];
  if (!VALID_DISPOSITIONS.includes(data.disposition)) {
    const err = new Error('Invalid disposition value');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (data.disposition === 'PUBLISHED') {
    if (!data.linked_record_id) {
      const err = new Error('linked_record_id is required when disposition is PUBLISHED');
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const record = await db('innovation_records').where({ record_id: data.linked_record_id }).first();
    if (!record) {
      const err = new Error('The linked record ID does not exist.');
      err.status = 422;
      err.code = 'INVALID_RECORD_REF';
      throw err;
    }
  }

  const [updated] = await db('contribution_submissions')
    .where({ submission_id: submissionId })
    .update({
      status: data.disposition, // contribution_submissions uses 'status' column for disposition lifecycle
      linked_record_id: data.linked_record_id || null,
      internal_note: data.internal_note ? sanitize(data.internal_note) : null,
      reviewed_at: new Date(),
      reviewed_by_user_id: curatorUserId
    })
    .returning('*');

  if (!updated) {
    const err = new Error('Submission not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return updated;
}

module.exports = {
  createOpportunitySubmission,
  listOpportunitySubmissions,
  updateOpportunityDisposition,
  createContributionSubmission,
  listContributionSubmissions,
  updateContributionDisposition
};
