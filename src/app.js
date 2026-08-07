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
  // Trust first proxy — required for express-rate-limit to read X-Forwarded-For
  // (used in production behind load balancer; also allows test IP isolation via X-Forwarded-For)
  app.set('trust proxy', 1);
  app.use(express.json());

  // Inject Knex db instance onto req for record routes
  app.use((req, _res, next) => {
    req.db = options.db || getDb();
    next();
  });

  // ── Session middleware ────────────────────────────────────────────────────────
  // In tests: use the injected sessionMiddleware (lightweight in-memory store).
  // In production: use PostgreSQL-backed express-session (connect-pg-simple).
  // TechArch §5.1: HttpOnly/Secure/SameSite=Strict session cookie; 1-hour TTL.
  if (options.sessionMiddleware) {
    app.use(options.sessionMiddleware);
  } else {
    const { buildSessionMiddleware } = require('./middleware/auth');
    app.use(buildSessionMiddleware(getPool()));
  }

  // ── Dev/preview auth bypass ──────────────────────────────────────────────────
  // When DEV_AUTH_BYPASS=true (non-production only), injects a synthetic CURATOR
  // session so all admin routes work without a real Azure AD configuration.
  // No-op in production regardless of the env var setting.
  const { devAuthBypass } = require('./middleware/devAuthBypass');
  app.use(devAuthBypass());

  // ── OIDC auth routes ──────────────────────────────────────────────────────────
  // GET  /auth/login    — initiates PKCE OIDC authorization redirect to Azure AD
  // GET  /auth/callback — exchanges authorization code for tokens, upserts users table, creates session
  // GET  /auth/logout   — destroys session, redirects to IdP end-session endpoint
  // TechArch §2.3 Authentication Flow, §5.1
  {
    const { redirectToLogin, buildOidcCallbackHandler, handleLogout } = require('./middleware/auth');
    app.get('/auth/login', redirectToLogin);
    app.get('/auth/callback', buildOidcCallbackHandler(getDb()));
    app.get('/auth/logout', handleLogout);
  }

  // Health check — returns 200 with DB ping
  app.get('/healthz', async (req, res) => {
    try {
      await getPool().query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'error', message: err.message });
    }
  });

  // ── API v1 routes ─────────────────────────────────────────────────────────────

  // Catalog routes — F0 Innovation Catalog (public)
  const catalogRouter = require('./routes/catalog');
  app.use('/api/v1/catalog', catalogRouter(getPool));

  // Record routes — F2 Innovation Record CRUD + lifecycle (CURATOR-gated write ops)
  const recordRouter = require('./handlers/recordHandler');
  app.use('/api/v1', recordRouter);

  // Submission routes — F5 Opportunity Submission + F6 Contribution Submission
  // Public POST endpoints + CURATOR-gated admin GET/PATCH endpoints
  const submissionsRouter = require('./routes/submissions');
  app.use('/api/v1', submissionsRouter);

  // Engagement routes — F7 Engagement Routing
  // Public POST endpoint + CURATOR-gated admin GET/PATCH endpoints
  const engagementRouter = require('./routes/engagement.routes');
  app.use('/api/v1', engagementRouter);

  // Settings routes — F8 Administration (hub_settings, all CURATOR-gated)
  const settingsRouter = require('./routes/settings.routes');
  app.use('/api/v1', settingsRouter);

  // Admin routes — F8 Administration: dashboard, records list, content model reference,
  // and create-record-from-contribution. All CURATOR-gated via admin router middleware.
  // NOTE: submissions/engagement/settings admin routes are handled by their own routers above;
  // this router adds the remaining admin-only endpoints.
  const adminRouter = require('./routes/admin');
  app.use('/api/v1/admin', adminRouter);

  // Test-seed routes (Playwright e2e test harness)
  // SECURITY: gated on NODE_ENV !== 'production' (T-11-07)
  if (process.env.NODE_ENV !== 'production') {
    const testSeedRouter = require('./routes/testSeed');
    app.use('/api/v1/test-seed', testSeedRouter);
  }

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
