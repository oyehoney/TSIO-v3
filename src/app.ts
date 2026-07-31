// TSIO Innovation Hub — Express application entry point
// Wires DB connection (Knex), middleware, and routes

import express from 'express';
import knex from 'knex';
import { searchRouter } from './routes/search';

const app = express();

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Test-only middleware ──────────────────────────────────────────────────────
// Reads X-Test-Role header and sets req.user.role for integration tests
// MUST be inactive in production — gated on NODE_ENV === 'test' (T-04-06)
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    const testRole = req.headers['x-test-role'];
    if (testRole === 'CURATOR' || testRole === 'ADMIN') {
      (req as any).user = { role: testRole };
    }
    next();
  });
}

// ─── Database connection (Knex) ───────────────────────────────────────────────
// DATABASE_URL uses service name db:5432 in docker-compose; localhost in local dev
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const db = knex({
  client: 'pg',
  connection: databaseUrl,
  pool: { min: 2, max: 10 },
});

// Expose DB instance via app.get('db') for use in handlers
app.set('db', db);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Search API — F1: Search and Discovery
app.use('/api/v1/search', searchRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

export { app, db };
export default app;
