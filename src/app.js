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

function createApp() {
  const app = express();
  app.use(express.json());

  // Inject Knex db instance onto req for record routes
  app.use((req, _res, next) => {
    req.db = getDb();
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
