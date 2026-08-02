// Integration tests for AuthMiddleware and AdminHandler
// TechArch §5.1, §5.2, FRD §F08b Validation
// Stack: Jest + Supertest (per TechArch §6.2: Jest + Supertest for integration tests)

'use strict';

const request  = require('supertest');
const express  = require('express');

// ── Shared mock user shapes ──────────────────────────────────────────────────
const MOCK_CURATOR = {
  user_id:      'test-user-uuid-001',
  email:        'curator@ao.uscourts.gov',
  display_name: 'Test Curator',
  role:         'CURATOR',
  is_active:    true,
};

const MOCK_ADMIN = {
  user_id:      'test-user-uuid-002',
  email:        'admin@ao.uscourts.gov',
  display_name: 'Test Admin',
  role:         'ADMIN',
  is_active:    true,
};

const MOCK_NO_ROLE_USER = {
  user_id:      'test-user-uuid-003',
  email:        'norole@ao.uscourts.gov',
  display_name: 'No Role User',
  role:         'VIEWER',     // invalid role — not CURATOR or ADMIN
  is_active:    true,
};

// ── Test: requireCurator middleware ──────────────────────────────────────────
describe('requireCurator middleware', () => {
  let app;
  const requireCurator = require('../../src/middleware/requireCurator');

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Simulate a route that uses requireCurator
    app.get('/protected', requireCurator, (req, res) => res.status(200).json({ ok: true }));
  });

  it('returns 401 when req.user is not set', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('allows CURATOR role through', async () => {
    // Inject req.user via a pre-middleware
    app.use((req, _res, next) => { req.user = MOCK_CURATOR; next(); });
    // Re-register route after user injection (for this test only — use a fresh app)
    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use((req, _res, next) => { req.user = MOCK_CURATOR; next(); });
    freshApp.get('/protected', requireCurator, (req, res) => res.status(200).json({ ok: true }));
    const res = await request(freshApp).get('/protected');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('allows ADMIN role through', async () => {
    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use((req, _res, next) => { req.user = MOCK_ADMIN; next(); });
    freshApp.get('/protected', requireCurator, (req, res) => res.status(200).json({ ok: true }));
    const res = await request(freshApp).get('/protected');
    expect(res.status).toBe(200);
  });

  it('returns 403 ACCESS_DENIED for non-CURATOR role', async () => {
    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use((req, _res, next) => { req.user = MOCK_NO_ROLE_USER; next(); });
    freshApp.get('/protected', requireCurator, (req, res) => res.status(200).json({ ok: true }));
    const res = await request(freshApp).get('/protected');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_DENIED');
  });
});

// ── Test: AdminHandler route registration and 501 stubs ──────────────────────
describe('AdminHandler route stubs', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Inject CURATOR user so requireCurator passes
    app.use((req, _res, next) => { req.user = MOCK_CURATOR; next(); });
    const adminRouter = require('../../src/routes/admin');
    app.use('/api/v1/admin', adminRouter);
  });

  const stubRoutes = [
    ['GET',   '/api/v1/admin/records'],
    ['GET',   '/api/v1/admin/dashboard-summary'],
    ['GET',   '/api/v1/admin/opportunity-submissions'],
    ['PATCH', '/api/v1/admin/opportunity-submissions/test-id'],
    ['GET',   '/api/v1/admin/contribution-submissions'],
    ['PATCH', '/api/v1/admin/contribution-submissions/test-id'],
    ['POST',  '/api/v1/admin/contribution-submissions/test-id/create-record'],
    ['GET',   '/api/v1/admin/engagement-requests'],
    ['PATCH', '/api/v1/admin/engagement-requests/test-id'],
    ['GET',   '/api/v1/admin/settings'],
    ['PUT',   '/api/v1/admin/settings'],
    ['GET',   '/api/v1/admin/maturity-reference'],
    ['GET',   '/api/v1/admin/review-status-reference'],
  ];

  it.each(stubRoutes)('%s %s returns 501 NOT_IMPLEMENTED', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path).set('Content-Type', 'application/json');
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('returns 403 ACCESS_DENIED for non-CURATOR user on any admin route', async () => {
    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use((req, _res, next) => { req.user = MOCK_NO_ROLE_USER; next(); });
    const adminRouter = require('../../src/routes/admin');
    freshApp.use('/api/v1/admin', adminRouter);
    const res = await request(freshApp).get('/api/v1/admin/records');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_DENIED');
  });
});

// ── Test: UserRepository.upsertFromOidc idempotency ──────────────────────────
describe('UserRepository.upsertFromOidc', () => {
  const UserRepository = require('../../src/repositories/UserRepository');

  it('executes INSERT ON CONFLICT DO UPDATE with correct params', async () => {
    // Mock db with .raw that captures calls
    const rawCalls = [];
    const mockDb = {
      raw: jest.fn((sql, params) => {
        rawCalls.push({ sql, params });
        return Promise.resolve({
          rows: [{
            user_id:      'mock-uuid',
            email:        params[0],
            display_name: params[1],
            role:         'CURATOR',
            is_active:    true,
          }],
        });
      }),
    };

    const repo = new UserRepository(mockDb);
    const user = await repo.upsertFromOidc('oid-123', 'test@ao.uscourts.gov', 'Test User');

    // Assert the SQL uses ON CONFLICT on idp_subject
    expect(mockDb.raw).toHaveBeenCalledTimes(1);
    const [sql, params] = mockDb.raw.mock.calls[0];
    expect(sql).toMatch(/ON CONFLICT \(idp_subject\)/i);
    expect(sql).toMatch(/DO UPDATE SET/i);
    expect(params).toEqual(['test@ao.uscourts.gov', 'Test User', 'oid-123']);
    expect(user.user_id).toBe('mock-uuid');
    expect(user.role).toBe('CURATOR');
  });

  it('throws if database returns no rows', async () => {
    const mockDb = {
      raw: jest.fn(() => Promise.resolve({ rows: [] })),
    };
    const repo = new UserRepository(mockDb);
    await expect(repo.upsertFromOidc('oid-empty', 'e@e.com', 'E')).rejects.toThrow();
  });
});
