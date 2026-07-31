'use strict';
const express = require('express');
const sanitizeHtml = require('sanitize-html');
const recordService = require('../services/recordService');
const router = express.Router();

const ERROR_STATUS_MAP = {
  RECORD_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 422,
  PUBLICATION_GATE_FAILED: 422,
  EDIT_REQUIRES_CONFIRMATION: 409,
  DELETE_NOT_PERMITTED: 409,
  INVALID_SUPERSEDES_REF: 422,
  INVALID_ARTIFACT_URL: 422,
};

function handleError(err, res) {
  if (err && err.code && ERROR_STATUS_MAP[err.code] !== undefined) {
    const status = err.status || ERROR_STATUS_MAP[err.code] || 500;
    const errorBody = { error: { code: err.code, message: err.message || err.code } };
    if (err.fields) {
      errorBody.error.fields = err.fields.map((f) =>
        typeof f === 'string'
          ? { field: f, error_code: 'REQUIRED', message: `Field '${f}' is required for publication.` }
          : f
      );
    }
    return res.status(status).json(errorBody);
  }
  console.error('Unhandled service error:', err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}

function requireCurator(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }
  const { role } = req.session.user;
  if (role !== 'CURATOR' && role !== 'ADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'CURATOR or ADMIN role required.' } });
  }
  next();
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const sanitized = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') return sanitizeHtml(item, { allowedTags: [], allowedAttributes: {} });
        if (typeof item === 'object' && item !== null) return sanitizeBody(item);
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// GET /records/:id — PUBLIC accessible
router.get('/records/:id', async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  let role = 'PUBLIC';
  if (req.session && req.session.user) {
    const userRole = req.session.user.role;
    if (userRole === 'CURATOR' || userRole === 'ADMIN') role = 'CURATOR';
  }
  try {
    const record = await recordService.getRecord(db, id, role);
    return res.status(200).json(record);
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /records — CURATOR only
router.post('/records', requireCurator, async (req, res) => {
  const { db } = req;
  const userId = req.session.user.user_id;
  const fields = sanitizeBody(req.body);
  try {
    const record = await recordService.createRecord(db, fields, userId);
    return res.status(201).json(record);
  } catch (err) {
    return handleError(err, res);
  }
});

// PATCH /records/:id — CURATOR only, reads X-Confirm-Edit header
router.patch('/records/:id', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  const confirmEdit = req.headers['x-confirm-edit'] === 'true';
  const fields = sanitizeBody(req.body);
  try {
    const record = await recordService.updateRecord(db, id, fields, userId, confirmEdit);
    return res.status(200).json(record);
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /records/:id/submit-review — CURATOR only
router.post('/records/:id/submit-review', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  try {
    const result = await recordService.submitForReview(db, id, userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /records/:id/publish — CURATOR only
router.post('/records/:id/publish', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  try {
    const result = await recordService.publishRecord(db, id, userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /records/:id/supersede — CURATOR only
router.post('/records/:id/supersede', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  const { superseded_by_record_id } = req.body || {};
  if (!superseded_by_record_id) {
    return res.status(422).json({ error: { code: 'INVALID_SUPERSEDES_REF', message: 'superseded_by_record_id is required in request body.' } });
  }
  try {
    const result = await recordService.supersedeRecord(db, id, superseded_by_record_id, userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

// POST /records/:id/archive — CURATOR only
router.post('/records/:id/archive', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  try {
    const result = await recordService.archiveRecord(db, id, userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

// DELETE /records/:id — CURATOR only, DRAFT only
router.delete('/records/:id', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const userId = req.session.user.user_id;
  try {
    await recordService.deleteRecord(db, id, userId);
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
});

// GET /records/:id/audit — CURATOR only
router.get('/records/:id/audit', requireCurator, async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 20;
  try {
    const result = await recordService.getAuditHistory(db, id, { page, pageSize });
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
});

module.exports = router;
