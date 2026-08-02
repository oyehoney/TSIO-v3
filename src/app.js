'use strict';
const express = require('express');
const path = require('path');
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

  // EJS view engine for server-side rendered pages (Wave 4 — CatalogPage)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Serve static assets (CSS, client-side JS, images)
  app.use(express.static(path.join(__dirname, '..', 'public')));

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

  // Web (EJS) routes for public-facing pages — Wave 4 CatalogPage
  // Mount BEFORE API routes so / and /catalog are handled before the 404 fallback
  const webRouter = require('./routes/web');
  app.use('/', webRouter(getPool));

  // Search API v1 — GET /api/v1/search (TypeScript service, loaded via ts-node or compiled dist)
  // The SearchHandler/SearchService are TypeScript; require via ts-node/register if available.
  // Falls back gracefully: if ts-node is not registered, the search API endpoint returns 503.
  try {
    // ts-node/register must be called before requiring .ts files
    if (!process.__ts_node_registered) {
      try {
        require('ts-node').register({ transpileOnly: true });
        process.__ts_node_registered = true;
      } catch (_tsNodeErr) {
        // ts-node not available — search API will return 503 SEARCH_UNAVAILABLE
      }
    }
    const { searchRouter } = require('./routes/search');
    app.use('/api/v1/search', searchRouter);
  } catch (searchRouteErr) {
    // If search route fails to load (no ts-node, no compiled output), register
    // a 503 fallback so the search page gracefully shows unavailability.
    app.get('/api/v1/search', (_req, res) => {
      res.status(503).json({
        error: { code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable.' },
      });
    });
    console.warn('[app] Search API route not loaded:', searchRouteErr && searchRouteErr.message);
  }

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

  // Test-seed routes — ONLY registered in non-production environments
  // Security: T-11-07 — test harness endpoints must NEVER be active in production.
  // The Wave 7 integration plan should add a production smoke test that asserts
  // /api/v1/test-seed/published-record returns 404 in the production build.
  if (process.env.NODE_ENV !== 'production') {
    const testSeedRouter = require('./routes/testSeed');
    app.use('/api/v1/test-seed', testSeedRouter);
  }

  // 404 handler — return JSON for /api/* paths, HTML for browser paths
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
    }
    // Browser 404 — render a placeholder page
    try {
      return res.status(404).render('placeholder', { pageTitle: 'Page Not Found' });
    } catch (_renderErr) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } });
    }
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    }
    try {
      return res.status(500).render('placeholder', { pageTitle: 'Server Error' });
    } catch (_renderErr) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    }
  });

  return app;
}

module.exports = { createApp, getPool };
