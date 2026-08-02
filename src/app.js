'use strict';
const express = require('express');
const { Pool } = require('pg');
const { getDb } = require('./db');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/**
 * Create Express app.
 * @param {{ sessionMiddleware?: function, db?: object }} [options]
 *   - sessionMiddleware: optional custom session middleware for testing
 *   - db: optional pre-configured Knex instance (for testing)
 */
function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  // Inject Knex db instance onto req for record routes
  app.use((req, _res, next) => {
    req.db = options.db || getDb();
    next();
  });

  // Session middleware — use provided test middleware or default no-op
  if (options.sessionMiddleware) {
    app.use(options.sessionMiddleware);
  } else {
    // Default: no session (unauthenticated)
    app.use((req, _res, next) => {
      if (!req.session) req.session = {};
      next();
    });
  }

  // Map req.session.user → req.user so requireCurator/requireAdmin work consistently.
  // In production, authenticateOidc does this mapping. In tests, session middleware
  // sets req.session.user and this middleware propagates it to req.user.
  app.use((req, _res, next) => {
    if (req.session && req.session.user) {
      req.user = req.session.user;
    }
    next();
  });

  // Health check — returns 200 with DB ping
  app.get('/healthz', async (req, res) => {
    try {
      await getPool().query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'error', message: err.message });
    }
  });

  // API v1 routes
  const catalogRouter = require('./routes/catalog');
  app.use('/api/v1/catalog', catalogRouter(getPool));

  // Record routes (Wave 2c — Plan 05)
  const recordRouter = require('./handlers/recordHandler');
  app.use('/api/v1', recordRouter);

  // Submission routes (Wave 3b — Plan 07)
  const submissionsRouter = require('./routes/submissions');
  app.use('/api/v1', submissionsRouter);

  // Engagement routes (Wave 3c — Plan 08)
  const engagementRouter = require('./routes/engagement.routes');
  app.use('/api/v1', engagementRouter);

  // Settings routes (Wave 3c — Plan 08)
  const settingsRouter = require('./routes/settings.routes');
  app.use('/api/v1', settingsRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
  });

  return app;
}

module.exports = { createApp, getPool };
