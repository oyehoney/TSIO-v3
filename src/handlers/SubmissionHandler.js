'use strict';
const SubmissionService = require('../services/SubmissionService');

function handleServiceError(res, err) {
  const status = err.status || 500;
  const body = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message } };
  if (err.fields) body.error.fields = err.fields;
  return res.status(status).json(body);
}

async function postOpportunitySubmission(req, res) {
  try {
    const submission = await SubmissionService.createOpportunitySubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getOpportunitySubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listOpportunitySubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function patchOpportunityDisposition(req, res) {
  try {
    const curatorUserId = req.session.user.user_id;
    const updated = await SubmissionService.updateOpportunityDisposition(
      req.params.id, req.body, curatorUserId
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function postContributionSubmission(req, res) {
  try {
    const submission = await SubmissionService.createContributionSubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getContributionSubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listContributionSubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function patchContributionDisposition(req, res) {
  try {
    const curatorUserId = req.session.user.user_id;
    const updated = await SubmissionService.updateContributionDisposition(
      req.params.id, req.body, curatorUserId
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
};
