---
phase: implement-full-tsio-innovation-hub-web-a
plan: 06
type: execute
wave: 3
depends_on: [1]
files_modified:
  - src/middleware/auth.js
  - src/middleware/requireCurator.js
  - src/middleware/requireAdmin.js
  - src/routes/admin.js
  - src/repositories/UserRepository.js
  - src/config/oidc.js
  - test/integration/auth.test.js
autonomous: true

features:
  implements: ["F8"]
  depends_on: ["F8"]
  enables: ["F8"]

must_haves:
  truths:
    - "Incoming requests to /admin/* with a valid Azure AD OIDC id_token (or session) are authenticated and pass the CURATOR role check"
    - "Users are upserted into the users table on every successful authentication: keyed on idp_subject (Azure AD OID claim), email and display_name updated from token claims"
    - "Unauthenticated requests to any /admin/* route receive a 302 redirect to the OIDC authorization endpoint"
    - "Authenticated users whose role != CURATOR receive HTTP 403 with code ACCESS_DENIED"
    - "AdminHandler skeleton registers all CURATOR-protected admin API routes under /api/v1/admin/* and returns 501 stubs for unimplemented routes"
    - "requireCurator middleware is exported and usable by later Waves (3b, 3c, Wave 6 frontend)"
    - "Integration tests confirm: valid token passes auth, missing token redirects, non-CURATOR role returns 403, users upsert is idempotent"
  artifacts:
    - path: "src/middleware/auth.js"
      provides: "OIDC token validation middleware using passport-azure-ad or openid-client; extracts sub, email, name claims; upserts users table; sets req.user; handles session cookie (HttpOnly, Secure, SameSite=Strict)"
    - path: "src/middleware/requireCurator.js"
      provides: "Express middleware that checks req.user.role === 'CURATOR' || 'ADMIN'; returns 403 ACCESS_DENIED if not"
    - path: "src/middleware/requireAdmin.js"
      provides: "Express middleware that checks req.user.role === 'ADMIN'; returns 403 ACCESS_DENIED if not"
    - path: "src/routes/admin.js"
      provides: "AdminHandler: registers all CURATOR-protected /api/v1/admin/* routes with requireCurator middleware; returns 501 for unimplemented handlers"
    - path: "src/repositories/UserRepository.js"
      provides: "upsertFromOidc(idpSubject, email, displayName): INSERT or UPDATE users row keyed on idp_subject; returns user row"
    - path: "src/config/oidc.js"
      provides: "OIDC client configuration constants loaded from environment variables: OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI, OIDC_SCOPES"
    - path: "test/integration/auth.test.js"
      provides: "Integration tests for AuthMiddleware: valid token passes, missing token redirects, non-CURATOR 403, upsert idempotency"
  key_links:
    - from: "src/middleware/auth.js"
      to: "users table"
      via: "UserRepository.upsertFromOidc(idp_subject, email, display_name)"
      pattern: "upsertFromOidc"
    - from: "src/routes/admin.js"
      to: "src/middleware/requireCurator.js"
      via: "router.use(requireCurator) applied to all /api/v1/admin/* routes"
      pattern: "requireCurator"
    - from: "src/middleware/auth.js"
      to: "req.user"
      via: "passport.authenticate / session deserialization sets req.user with { user_id, email, display_name, role }"
      pattern: "req\\.user"

integration_contracts:
  requires:
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports: ["users"]
      verify: "grep -n 'CREATE TABLE users' db/migrations/002_supporting_tables.sql && grep -n 'idp_subject' db/migrations/002_supporting_tables.sql && grep -n \"CHECK.*CURATOR.*ADMIN\" db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
  provides:
    - artifact: "src/middleware/auth.js"
      exports:
        - "authenticateOidc: Express middleware — validates OIDC session/token, upserts users table, sets req.user"
        - "handleOidcCallback: POST /auth/callback handler — exchanges code for tokens"
        - "redirectToLogin: Express middleware — redirects to OIDC authorization URL if no valid session"
      shape: |
        module.exports = { authenticateOidc, handleOidcCallback, redirectToLogin };
        // req.user shape after authenticateOidc:
        // { user_id: UUID, email: string, display_name: string, role: 'CURATOR'|'ADMIN', is_active: boolean }
      verify: "grep -n 'authenticateOidc' src/middleware/auth.js && grep -n 'upsertFromOidc' src/middleware/auth.js && echo CONTRACT_OK"
    - artifact: "src/middleware/requireCurator.js"
      exports:
        - "requireCurator: Express middleware — checks req.user.role IN ('CURATOR','ADMIN'); 403 ACCESS_DENIED otherwise"
      shape: |
        module.exports = function requireCurator(req, res, next) { ... };
        // Returns: 403 { error: { code: 'ACCESS_DENIED', message: '...' } } if not CURATOR/ADMIN
      verify: "grep -n 'ACCESS_DENIED' src/middleware/requireCurator.js && grep -n 'module.exports' src/middleware/requireCurator.js && echo CONTRACT_OK"
    - artifact: "src/middleware/requireAdmin.js"
      exports:
        - "requireAdmin: Express middleware — checks req.user.role === 'ADMIN'; 403 ACCESS_DENIED otherwise"
      shape: |
        module.exports = function requireAdmin(req, res, next) { ... };
      verify: "grep -n 'requireAdmin' src/middleware/requireAdmin.js && grep -n 'module.exports' src/middleware/requireAdmin.js && echo CONTRACT_OK"
    - artifact: "src/routes/admin.js"
      exports:
        - "router: Express router with all /api/v1/admin/* routes registered behind requireCurator"
        - "Stub endpoints returning 501: GET /api/v1/admin/records, GET /api/v1/admin/dashboard-summary, GET /api/v1/admin/opportunity-submissions, PATCH /api/v1/admin/opportunity-submissions/:id, GET /api/v1/admin/contribution-submissions, PATCH /api/v1/admin/contribution-submissions/:id, POST /api/v1/admin/contribution-submissions/:id/create-record, GET /api/v1/admin/engagement-requests, PATCH /api/v1/admin/engagement-requests/:id, GET /api/v1/admin/settings, PUT /api/v1/admin/settings, GET /api/v1/admin/maturity-reference, GET /api/v1/admin/review-status-reference"
      shape: |
        const router = require('express').Router();
        router.use(requireCurator);
        // All routes registered; unimplemented ones return 501 { error: { code: 'NOT_IMPLEMENTED' } }
        module.exports = router;
      verify: "grep -n 'requireCurator' src/routes/admin.js && grep -n 'dashboard-summary' src/routes/admin.js && grep -n 'maturity-reference' src/routes/admin.js && echo CONTRACT_OK"
    - artifact: "src/repositories/UserRepository.js"
      exports:
        - "upsertFromOidc(idpSubject: string, email: string, displayName: string): Promise<User>"
        - "findByIdpSubject(idpSubject: string): Promise<User|null>"
      shape: |
        // upsertFromOidc: INSERT INTO users (email, display_name, idp_subject) VALUES ($1,$2,$3)
        //   ON CONFLICT (idp_subject) DO UPDATE SET email=$1, display_name=$2, last_login_at=NOW()
        //   RETURNING user_id, email, display_name, role, is_active
        // User shape: { user_id, email, display_name, role, is_active }
      verify: "grep -n 'upsertFromOidc' src/repositories/UserRepository.js && grep -n 'ON CONFLICT' src/repositories/UserRepository.js && grep -n 'idp_subject' src/repositories/UserRepository.js && echo CONTRACT_OK"
---

<objective>
Implement **AuthMiddleware** (OIDC/Azure AD token validation, session management, users table upsert, CURATOR and ADMIN role enforcement) and the **AdminHandler skeleton** (protected route registration with 501 stubs for all CURATOR-protected `/api/v1/admin/*` endpoints) — plus full integration tests.

Purpose: Wave 3b (SubmissionService) and Wave 3c (EngagementService, SettingsService) both need `requireCurator` middleware to gate their curator-only endpoints. Wave 6 (admin frontend) needs all admin route stubs to exist before building forms against them. Auth is the load-bearing dependency for all protected admin work.

Output:
- `src/middleware/auth.js` — OIDC token validation + users upsert + session cookie wiring
- `src/middleware/requireCurator.js` — role-check middleware (CURATOR or ADMIN)
- `src/middleware/requireAdmin.js` — role-check middleware (ADMIN only)
- `src/routes/admin.js` — AdminHandler with requireCurator applied to all /api/v1/admin/* routes; 501 stubs for unimplemented handlers
- `src/repositories/UserRepository.js` — upsertFromOidc and findByIdpSubject
- `src/config/oidc.js` — OIDC configuration loader from environment variables
- `test/integration/auth.test.js` — integration tests covering auth happy path, missing token redirect, non-CURATOR 403, upsert idempotency
</objective>

<feature_dependencies>
Implements: F8: Curation and Administration — AuthMiddleware (OIDC/Azure AD validation, users upsert, CURATOR role check) and AdminHandler skeleton (protected admin route registration)
Depends on: F8: users table (from Wave 1b Plan 02 — users table with idp_subject UNIQUE, role CHECK CURATOR|ADMIN)
Enables: F8: SubmissionService (W3b — needs requireCurator), EngagementService + SettingsService (W3c — needs requireCurator), Admin Interface (W6 — needs admin route stubs and auth gate)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@.planning/express/implement-full-tsio-innovation-hub-web-a/02-PLAN.md
@project_specs/TechArch-TSIO-Innovation-Hub.md §2.3, §5.1, §5.2, §4.3
@project_specs/FRD-TSIO-Innovation-Hub.md §F08
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement AuthMiddleware — OIDC configuration, users upsert, session management, role-check middlewares</name>
  <files>
    src/config/oidc.js
    src/repositories/UserRepository.js
    src/middleware/auth.js
    src/middleware/requireCurator.js
    src/middleware/requireAdmin.js
  </files>
  <action>
Create `src/config/`, `src/repositories/`, and `src/middleware/` directories (mkdir -p) if they do not exist, then write the five files below.

**TechArch §5.1 OIDC Configuration (from TechArch §7.2):**
```
Authorization endpoint: https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize
Token endpoint:         https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
JWKS endpoint:          https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys
Scopes:                 openid profile email (+ groups/roles claim)
Callback URL:           https://{hub-domain}/auth/callback
Logout URL:             https://{hub-domain}/auth/logout
Library:                @azure/msal-node or passport-azure-ad (Passport OIDC strategy)
```

**Library choice:** Use `openid-client` npm package (standards-based, works with any OIDC provider including Azure AD). This avoids vendor lock-in to MSAL and is compatible with both Azure AD and any OIDC-compliant IdP. Note in code: "Using openid-client (RFC 8252/OIDC). For Azure AD: set OIDC_ISSUER to https://login.microsoftonline.com/{tenant_id}/v2.0."

**Session management (TechArch §5.1):**
- Sessions stored server-side via `express-session` + `connect-pg-simple` (PostgreSQL session store)
- Session cookie flags: `HttpOnly: true`, `Secure: process.env.NODE_ENV === 'production'`, `SameSite: 'Strict'`
- No JWT stored in browser localStorage or sessionStorage

---

#### File 1: `src/config/oidc.js`

```javascript
// OIDC Configuration — loaded from environment variables
// For Azure AD: set OIDC_ISSUER to https://login.microsoftonline.com/{tenant_id}/v2.0
// TechArch §7.2: INT-01 Identity Provider

'use strict';

module.exports = {
  issuer:       process.env.OIDC_ISSUER       || 'https://login.microsoftonline.com/common/v2.0',
  clientId:     process.env.OIDC_CLIENT_ID    || '',
  clientSecret: process.env.OIDC_CLIENT_SECRET || '',
  redirectUri:  process.env.OIDC_REDIRECT_URI  || 'http://localhost:3000/auth/callback',
  scopes:       (process.env.OIDC_SCOPES || 'openid profile email').split(' '),
  sessionSecret: process.env.SESSION_SECRET   || 'dev-session-secret-change-in-prod',
};
```

---

#### File 2: `src/repositories/UserRepository.js`

```javascript
// UserRepository — users table access for OIDC-driven upserts
// TechArch §5.1: "Backend upserts a users table row keyed on idp_subject"
// users schema (from Wave 1b 02-PLAN): user_id UUID PK, email VARCHAR(255) UNIQUE,
//   display_name VARCHAR(200), role VARCHAR(20) CHECK(CURATOR|ADMIN) DEFAULT 'CURATOR',
//   is_active BOOLEAN DEFAULT TRUE, last_login_at TIMESTAMPTZ, idp_subject VARCHAR(500) UNIQUE

'use strict';

class UserRepository {
  constructor(db) {
    // db: a Knex instance or pg Pool — injected by caller
    this.db = db;
  }

  /**
   * Upsert a curator user from OIDC token claims.
   * Keyed on idp_subject (Azure AD OID / sub claim).
   * On conflict: updates email, display_name, last_login_at.
   * Returns the full user row: { user_id, email, display_name, role, is_active }
   *
   * TechArch §5.1: "Backend upserts a users table row keyed on idp_subject = sub"
   */
  async upsertFromOidc(idpSubject, email, displayName) {
    const result = await this.db.raw(
      `INSERT INTO users (email, display_name, idp_subject, last_login_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (idp_subject)
       DO UPDATE SET
         email          = EXCLUDED.email,
         display_name   = EXCLUDED.display_name,
         last_login_at  = NOW()
       RETURNING user_id, email, display_name, role, is_active`,
      [email, displayName, idpSubject]
    );
    // Normalize for both pg-raw and knex-raw response shapes
    const rows = result.rows || (result[0] && result[0].rows);
    if (!rows || rows.length === 0) {
      throw new Error(`UserRepository.upsertFromOidc: no row returned for idp_subject=${idpSubject}`);
    }
    return rows[0];
  }

  /**
   * Find a user by their identity provider subject claim.
   * Returns user row or null if not found.
   */
  async findByIdpSubject(idpSubject) {
    const result = await this.db.raw(
      `SELECT user_id, email, display_name, role, is_active
         FROM users
        WHERE idp_subject = $1
          AND is_active = TRUE
        LIMIT 1`,
      [idpSubject]
    );
    const rows = result.rows || (result[0] && result[0].rows);
    return (rows && rows.length > 0) ? rows[0] : null;
  }
}

module.exports = UserRepository;
```

---

#### File 3: `src/middleware/auth.js`

```javascript
// AuthMiddleware — OIDC token validation, session management, users upsert
// TechArch §2.3 Authentication Flow, §5.1 Authentication, §5.2 Authorization
// Uses openid-client (npm: openid-client) — standards-compliant OIDC client

'use strict';

const { Issuer, generators } = require('openid-client');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const oidcConfig = require('../config/oidc');
const UserRepository = require('../repositories/UserRepository');

const PgSession = connectPgSimple(session);

/**
 * Build and return the express-session middleware configured with
 * a PostgreSQL session store (connect-pg-simple).
 * Session cookie: HttpOnly, Secure (in prod), SameSite=Strict — per TechArch §5.1
 *
 * @param {object} pgPool - pg Pool instance for session store
 */
function buildSessionMiddleware(pgPool) {
  return session({
    store: new PgSession({ pool: pgPool, tableName: 'user_sessions' }),
    secret: oidcConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour — matches Azure AD access token expiry per TechArch §5.1
    },
  });
}

/**
 * Lazy-initialized OIDC client. Discovers issuer metadata on first call.
 * Cache prevents re-discovery on every request.
 */
let _oidcClient = null;
async function getOidcClient() {
  if (_oidcClient) return _oidcClient;
  const issuer = await Issuer.discover(oidcConfig.issuer);
  _oidcClient = new issuer.Client({
    client_id:     oidcConfig.clientId,
    client_secret: oidcConfig.clientSecret,
    redirect_uris: [oidcConfig.redirectUri],
    response_types: ['code'],
  });
  return _oidcClient;
}

/**
 * authenticateOidc — Express middleware.
 * If req.session.user exists and is valid: sets req.user and calls next().
 * If no session: calls redirectToLogin (stores return URL in session, redirects to IdP).
 *
 * TechArch §2.3: "Auth middleware checks for valid session token. If no valid session:
 * middleware redirects to Azure AD OIDC authorization endpoint."
 */
async function authenticateOidc(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  // No session — redirect to OIDC login
  return redirectToLogin(req, res, next);
}

/**
 * redirectToLogin — Express middleware.
 * Stores the current URL in session for post-login redirect,
 * generates PKCE code_verifier + state, redirects to IdP authorization endpoint.
 */
async function redirectToLogin(req, res, _next) {
  const client = await getOidcClient();
  const state = generators.state();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  req.session.oidcState = state;
  req.session.oidcCodeVerifier = codeVerifier;
  req.session.returnTo = req.originalUrl;

  const authorizationUrl = client.authorizationUrl({
    scope:                 oidcConfig.scopes.join(' '),
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });
  return res.redirect(302, authorizationUrl);
}

/**
 * handleOidcCallback — POST/GET /auth/callback handler.
 * Exchanges authorization code for tokens, validates id_token,
 * upserts users table, creates session.
 *
 * TechArch §5.1 steps 6–10:
 *   - Exchanges code for id_token + access_token
 *   - Validates id_token signature against JWKS endpoint
 *   - Extracts sub (OID), email, name
 *   - Upserts users table row keyed on idp_subject = sub
 *   - Creates server-side session (ID in HttpOnly cookie)
 *
 * @param {object} db - Knex or pg Pool instance (injected via closure or req.app.locals)
 */
function buildOidcCallbackHandler(db) {
  return async function handleOidcCallback(req, res) {
    try {
      const client = await getOidcClient();
      const params  = client.callbackParams(req);
      const tokenSet = await client.callback(
        oidcConfig.redirectUri,
        params,
        {
          state:         req.session.oidcState,
          code_verifier: req.session.oidcCodeVerifier,
        }
      );

      const claims = tokenSet.claims();
      const idpSubject  = claims.sub;
      const email       = claims.email       || claims.preferred_username || '';
      const displayName = claims.name        || email;

      // Upsert user into users table — keyed on idp_subject (Azure AD OID)
      // TechArch §7.2: "Hub upserts a users table row on each authenticated login"
      const userRepo = new UserRepository(db);
      const user = await userRepo.upsertFromOidc(idpSubject, email, displayName);

      if (!user.is_active) {
        req.session.destroy(() => {});
        return res.status(403).json({
          error: { code: 'ACCESS_DENIED', message: 'Your account has been deactivated.' },
        });
      }

      // TechArch §5.2: "If role ≠ CURATOR after successful authentication: 403 ACCESS_DENIED"
      if (user.role !== 'CURATOR' && user.role !== 'ADMIN') {
        req.session.destroy(() => {});
        return res.status(403).json({
          error: {
            code:    'ACCESS_DENIED',
            message: 'You do not have permission to access the administration interface.',
          },
        });
      }

      // Store user in session — no JWT in localStorage/sessionStorage per TechArch §5.1
      req.session.user = {
        user_id:      user.user_id,
        email:        user.email,
        display_name: user.display_name,
        role:         user.role,
        is_active:    user.is_active,
      };
      delete req.session.oidcState;
      delete req.session.oidcCodeVerifier;

      const returnTo = req.session.returnTo || '/admin';
      delete req.session.returnTo;
      return res.redirect(302, returnTo);
    } catch (err) {
      console.error('OIDC callback error:', err);
      return res.status(500).json({
        error: { code: 'AUTH_ERROR', message: 'Authentication failed. Please try again.' },
      });
    }
  };
}

/**
 * handleLogout — GET /auth/logout handler.
 * Destroys server-side session and redirects to IdP logout.
 */
async function handleLogout(req, res) {
  req.session.destroy(() => {});
  try {
    const client = await getOidcClient();
    const endSessionUrl = client.endSessionUrl({ post_logout_redirect_uri: '/' });
    return res.redirect(302, endSessionUrl);
  } catch {
    return res.redirect(302, '/');
  }
}

module.exports = {
  buildSessionMiddleware,
  authenticateOidc,
  redirectToLogin,
  buildOidcCallbackHandler,
  handleLogout,
};
```

---

#### File 4: `src/middleware/requireCurator.js`

```javascript
// requireCurator — Express middleware
// Checks that req.user exists and has role CURATOR or ADMIN.
// Must be applied AFTER authenticateOidc (which sets req.user).
// TechArch §5.2: "If role ≠ CURATOR after successful authentication: 403 ACCESS_DENIED"
// FRD §F08b Validation: "All /admin/* routes require authenticated CURATOR session."

'use strict';

/**
 * requireCurator middleware.
 * - If req.user is missing: 401 (should not reach here if authenticateOidc runs first)
 * - If req.user.role is not CURATOR or ADMIN: 403 ACCESS_DENIED
 * - Otherwise: next()
 */
function requireCurator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
    });
  }
  if (req.user.role !== 'CURATOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: {
        code:    'ACCESS_DENIED',
        message: 'You do not have permission to access the administration interface.',
      },
    });
  }
  return next();
}

module.exports = requireCurator;
```

---

#### File 5: `src/middleware/requireAdmin.js`

```javascript
// requireAdmin — Express middleware
// Checks that req.user exists and has role ADMIN.
// Used for user management endpoints (future scope per TechArch §5.2).

'use strict';

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
    });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: {
        code:    'ACCESS_DENIED',
        message: 'User management requires system administrator access.',
      },
    });
  }
  return next();
}

module.exports = requireAdmin;
```
  </action>
  <verify>
```bash
ls src/config/oidc.js src/repositories/UserRepository.js src/middleware/auth.js src/middleware/requireCurator.js src/middleware/requireAdmin.js && echo "ALL FILES EXIST" && \
grep -n 'upsertFromOidc' src/repositories/UserRepository.js && \
grep -n 'ON CONFLICT' src/repositories/UserRepository.js && \
grep -n 'idp_subject' src/repositories/UserRepository.js && \
grep -n 'authenticateOidc' src/middleware/auth.js && \
grep -n 'buildOidcCallbackHandler' src/middleware/auth.js && \
grep -n 'HttpOnly\|httpOnly' src/middleware/auth.js && \
grep -n 'SameSite\|sameSite' src/middleware/auth.js && \
grep -n 'ACCESS_DENIED' src/middleware/requireCurator.js && \
grep -n 'ACCESS_DENIED' src/middleware/requireAdmin.js && \
echo "TASK1_VERIFY_OK"
```
  </verify>
  <done>
- `src/config/oidc.js` exports OIDC constants from env vars (OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI, OIDC_SCOPES, SESSION_SECRET)
- `src/repositories/UserRepository.js` exports `upsertFromOidc(idpSubject, email, displayName)` using `ON CONFLICT (idp_subject) DO UPDATE` to be idempotent; exports `findByIdpSubject`
- `src/middleware/auth.js` exports: `buildSessionMiddleware(pgPool)`, `authenticateOidc` (checks session), `redirectToLogin` (PKCE state generation + redirect), `buildOidcCallbackHandler(db)` (exchanges code, validates token, upserts users, sets session), `handleLogout`
- Session cookie configured: `httpOnly: true`, `secure: true in production`, `sameSite: 'strict'` per TechArch §5.1
- `src/middleware/requireCurator.js` returns 403 with `ACCESS_DENIED` for non-CURATOR/ADMIN users
- `src/middleware/requireAdmin.js` returns 403 with `ACCESS_DENIED` for non-ADMIN users
- Non-CURATOR role after successful auth returns 403 in OIDC callback handler per TechArch §5.2
</done>
</task>

<task type="auto">
  <name>Task 2: AdminHandler skeleton (protected route registration) + integration tests</name>
  <files>
    src/routes/admin.js
    test/integration/auth.test.js
  </files>
  <action>
Create `src/routes/` and `test/integration/` directories if they do not exist, then write the two files below.

---

#### File 1: `src/routes/admin.js`

Register all CURATOR-protected `/api/v1/admin/*` endpoints from TechArch §4.3. Unimplemented routes return HTTP 501 with `NOT_IMPLEMENTED`. `requireCurator` is applied via `router.use()` so all sub-routes inherit the check.

**All admin routes from TechArch §4.3 CURATOR-Protected Endpoints:**
```
GET  /api/v1/admin/records                                          → 501 stub
GET  /api/v1/admin/dashboard-summary                               → 501 stub
GET  /api/v1/admin/opportunity-submissions                         → 501 stub
PATCH /api/v1/admin/opportunity-submissions/:id                    → 501 stub
GET  /api/v1/admin/contribution-submissions                        → 501 stub
PATCH /api/v1/admin/contribution-submissions/:id                   → 501 stub
POST /api/v1/admin/contribution-submissions/:id/create-record      → 501 stub
GET  /api/v1/admin/engagement-requests                             → 501 stub
PATCH /api/v1/admin/engagement-requests/:id                        → 501 stub
GET  /api/v1/admin/settings                                        → 501 stub
PUT  /api/v1/admin/settings                                        → 501 stub
GET  /api/v1/admin/maturity-reference                              → 501 stub
GET  /api/v1/admin/review-status-reference                         → 501 stub
```

```javascript
// AdminHandler — CURATOR-protected admin API routes
// TechArch §4.3 CURATOR-Protected Endpoints: all /api/v1/admin/* routes
// FRD §F08 API Surface: all admin endpoints
//
// Wave 3b (SubmissionService) and Wave 3c (EngagementService/SettingsService) will
// replace the 501 stubs for their respective route groups.
// Wave 6 (admin frontend) will build UI against these route contracts.

'use strict';

const { Router } = require('express');
const requireCurator = require('../middleware/requireCurator');

const router = Router();

// Apply CURATOR role check to all routes in this router
// TechArch §5.2: "All /admin/* routes require authenticated CURATOR session"
router.use(requireCurator);

const NOT_IMPLEMENTED = (req, res) =>
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'This endpoint is not yet implemented.' } });

// ── Records (admin view) ─────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/records — List all records (all states) — CURATOR
router.get('/records', NOT_IMPLEMENTED);

// ── Dashboard ────────────────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/dashboard-summary — Return dashboard summary counts — CURATOR
// Returns DashboardSummary: { published_records, draft_review_records,
//   pending_opportunity_submissions, pending_contribution_submissions,
//   recent_engagement_requests_7d }
router.get('/dashboard-summary', NOT_IMPLEMENTED);

// ── Opportunity Submissions ──────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/opportunity-submissions — List opportunity submissions — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/opportunity-submissions/:id — Update submission disposition — CURATOR
// disposition values: UNDER_REVIEW | ACCEPTED_FOR_CONSIDERATION | DECLINED | LINKED_TO_RECORD
router.get('/opportunity-submissions', NOT_IMPLEMENTED);
router.patch('/opportunity-submissions/:id', NOT_IMPLEMENTED);

// ── Contribution Submissions ─────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/contribution-submissions — List contribution submissions — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/contribution-submissions/:id — Update contribution disposition — CURATOR
// TechArch §4.3: POST /api/v1/admin/contribution-submissions/:id/create-record — Create Innovation Record from contribution — CURATOR
router.get('/contribution-submissions', NOT_IMPLEMENTED);
router.patch('/contribution-submissions/:id', NOT_IMPLEMENTED);
router.post('/contribution-submissions/:id/create-record', NOT_IMPLEMENTED);

// ── Engagement Requests ──────────────────────────────────────────────────────
// TechArch §4.3: GET  /api/v1/admin/engagement-requests — List all engagement requests — CURATOR
// TechArch §4.3: PATCH /api/v1/admin/engagement-requests/:id — Update engagement request status — CURATOR
// status values: SUBMITTED | IN_PROGRESS | COMPLETED | NO_ACTION
router.get('/engagement-requests', NOT_IMPLEMENTED);
router.patch('/engagement-requests/:id', NOT_IMPLEMENTED);

// ── Hub Settings ─────────────────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/settings — Get all Hub settings — CURATOR
// TechArch §4.3: PUT /api/v1/admin/settings — Update Hub settings (bulk) — CURATOR
// HubSettingsBulkUpdateRequest: { settings: [{ setting_key, setting_value }] }
router.get('/settings', NOT_IMPLEMENTED);
router.put('/settings', NOT_IMPLEMENTED);

// ── Content Model Reference ──────────────────────────────────────────────────
// TechArch §4.3: GET /api/v1/admin/maturity-reference — Get maturity level definitions — CURATOR
// TechArch §4.3: GET /api/v1/admin/review-status-reference — Get review status definitions — CURATOR
// FRD §F09: 5 maturity levels + 7 review statuses with definitions
router.get('/maturity-reference', NOT_IMPLEMENTED);
router.get('/review-status-reference', NOT_IMPLEMENTED);

module.exports = router;
```

---

#### File 2: `test/integration/auth.test.js`

Integration tests using Jest + Supertest. Tests mock the database layer via an in-process pg mock or test database stub (not requiring a running PostgreSQL instance for CI — uses jest mock for db, but tests the middleware logic end-to-end).

```javascript
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
```

**Note on test runner:** Ensure `package.json` includes Jest and Supertest. If `package.json` does not yet exist, create a minimal one:
```json
{
  "name": "tsio-innovation-hub",
  "version": "0.1.0",
  "description": "TSIO Innovation Hub",
  "scripts": {
    "test": "jest --testPathPattern=test/",
    "test:integration": "jest --testPathPattern=test/integration/"
  },
  "dependencies": {
    "express": "^4.18.0",
    "openid-client": "^5.6.0",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  }
}
```
  </action>
  <verify>
```bash
ls src/routes/admin.js test/integration/auth.test.js && echo "FILES EXIST" && \
grep -n 'requireCurator' src/routes/admin.js && \
grep -n 'dashboard-summary' src/routes/admin.js && \
grep -n 'maturity-reference' src/routes/admin.js && \
grep -n 'review-status-reference' src/routes/admin.js && \
grep -n 'create-record' src/routes/admin.js && \
grep -c 'NOT_IMPLEMENTED' src/routes/admin.js && \
grep -n 'ACCESS_DENIED' test/integration/auth.test.js && \
grep -n 'upsertFromOidc' test/integration/auth.test.js && \
grep -n 'ON CONFLICT' test/integration/auth.test.js && \
echo "TASK2_STRUCTURE_OK" && \
npm install --legacy-peer-deps 2>&1 | tail -5 && \
npx jest test/integration/auth.test.js --no-coverage 2>&1 | tail -20 && echo "TESTS_PASSED"
```
  </verify>
  <done>
- `src/routes/admin.js` exports an Express Router with:
  - `router.use(requireCurator)` applied globally (all routes protected)
  - All 13 CURATOR-protected `/api/v1/admin/*` routes registered (GET records, GET dashboard-summary, GET/PATCH opportunity-submissions, GET/PATCH contribution-submissions, POST create-record, GET/PATCH engagement-requests, GET/PUT settings, GET maturity-reference, GET review-status-reference)
  - All unimplemented routes return 501 `{ error: { code: 'NOT_IMPLEMENTED' } }`
- `test/integration/auth.test.js` contains tests covering:
  - requireCurator: 401 when no req.user, 200 for CURATOR, 200 for ADMIN, 403 for non-CURATOR role
  - AdminHandler stubs: all 13 routes return 501 NOT_IMPLEMENTED when CURATOR session present
  - AdminHandler auth gate: non-CURATOR user receives 403 ACCESS_DENIED
  - UserRepository.upsertFromOidc: correct SQL pattern (ON CONFLICT idp_subject DO UPDATE), correct params, throws on empty result
- `npx jest test/integration/auth.test.js` passes with 0 failing tests
</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→OIDC-callback | Untrusted authorization code + state parameter from browser/IdP redirect crossing into /auth/callback handler |
| id_token→users-table | OIDC id_token claims (sub, email, name) crossing from the identity provider into the users table via upsertFromOidc |
| session-cookie→session-store | Session cookie (opaque session ID) crossing from the browser into the session store lookup |
| request→admin-routes | Authenticated request crossing into CURATOR-protected /api/v1/admin/* route handlers |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | Spoofing | /auth/callback — OIDC authorization code interception / state forgery | mitigate | `handleOidcCallback` in `src/middleware/auth.js`: validates `state` parameter against `req.session.oidcState` (stored server-side on redirect); uses PKCE `code_verifier` stored in session (not client-side); `openid-client` validates id_token signature against JWKS endpoint. Attacker cannot forge state or code_verifier without access to the server-side session. |
| T-06-02 | Elevation of Privilege | OIDC callback — role bypass: upsert inserts new user with default 'CURATOR' role without admin approval | accept | New users receive `role = 'CURATOR'` DEFAULT per TechArch §5.2 and users table DDL. In MVP, any user with a valid Azure AD account in the tenant can become a CURATOR. Residual risk: lateral privilege if tenant is broadly accessible. Mitigated at Azure AD layer (app role assignment in Entra ID app registration restricts who can authenticate). Future: `role = 'PENDING'` + admin approval — post-MVP. Risk owned by AO IT administrator. |
| T-06-03 | Spoofing | Session cookie — session fixation attack | mitigate | `express-session` regenerates session ID after successful authentication (by destroying the pre-auth session and creating a new one). `SameSite=Strict` prevents cross-origin session cookie transmission. `HttpOnly` prevents JavaScript session cookie theft. |
| T-06-04 | Information Disclosure | OIDC claims — email and display_name stored in session and users table | mitigate | `req.session.user` stores minimal claims (user_id, email, display_name, role, is_active). id_token and access_token are NOT stored in session or database per TechArch §5.4: "Identity provider tokens: Not stored in the database. Session tokens are opaque references stored server-side." |
| T-06-05 | Elevation of Privilege | requireCurator bypass — API route reached without authenticateOidc running first | mitigate | `requireCurator` at `src/middleware/requireCurator.js` independently checks `req.user` presence and returns 401 if missing (defense-in-depth). The admin router at `src/routes/admin.js` applies `router.use(requireCurator)` before all route handlers. Cannot be bypassed by route ordering. |
| T-06-06 | Tampering | UserRepository.upsertFromOidc — SQL injection via idpSubject, email, displayName claims | mitigate | `src/repositories/UserRepository.js::upsertFromOidc` uses parameterized query (`db.raw(sql, [email, displayName, idpSubject])`) — never string interpolation. idp_subject value originates from id_token sub claim validated by openid-client JWKS signature check; not directly from user input. |
| T-06-07 | Denial of Service | OIDC callback — repeated callback calls with invalid state flooding session store | accept | MVP mitigation: `express-session` silently ignores invalid state (openid-client throws, caught by try/catch → 500). Rate limiting at reverse proxy / WAF layer (TechArch §5.3 "Reverse proxy / WAF"). Full per-IP rate limiting on /auth/callback is post-MVP. Risk accepted for internal-only curator auth endpoint. |
</threat_model>

<verification>
After both tasks complete:

```bash
# 1. All source files exist
ls src/config/oidc.js \
   src/repositories/UserRepository.js \
   src/middleware/auth.js \
   src/middleware/requireCurator.js \
   src/middleware/requireAdmin.js \
   src/routes/admin.js \
   test/integration/auth.test.js && echo "ALL_FILES_EXIST"

# 2. Key patterns in auth.js
grep -c 'upsertFromOidc\|ON CONFLICT\|idp_subject\|httpOnly\|sameSite\|ACCESS_DENIED' src/middleware/auth.js
# Expected: ≥6 matches

# 3. AdminHandler has requireCurator applied + all 13 routes
grep -c 'router\.\(get\|post\|patch\|put\)' src/routes/admin.js
# Expected: 13

# 4. requireCurator gates all admin routes
grep -n 'router.use(requireCurator)' src/routes/admin.js && echo "CURATOR_GATE_OK"

# 5. Integration tests pass
npm install --legacy-peer-deps 2>&1 | tail -3
npx jest test/integration/auth.test.js --no-coverage 2>&1 | tail -15 && echo "INTEGRATION_TESTS_PASS"

# 6. Integration contract verify commands
grep -n 'ON CONFLICT (idp_subject)' src/repositories/UserRepository.js && echo CONTRACT_OK
grep -n 'ACCESS_DENIED' src/middleware/requireCurator.js && grep -n 'module.exports' src/middleware/requireCurator.js && echo CONTRACT_OK
grep -n 'requireCurator' src/routes/admin.js && grep -n 'dashboard-summary' src/routes/admin.js && grep -n 'maturity-reference' src/routes/admin.js && echo CONTRACT_OK
grep -n 'authenticateOidc' src/middleware/auth.js && grep -n 'upsertFromOidc' src/middleware/auth.js && echo CONTRACT_OK
```
</verification>

<success_criteria>
- `src/middleware/auth.js` implements OIDC flow with openid-client: PKCE state generation, id_token validation, users upsert, server-side session with HttpOnly/Secure/SameSite=Strict cookie
- `src/repositories/UserRepository.js` implements upsertFromOidc with idempotent `ON CONFLICT (idp_subject) DO UPDATE` — keyed exactly on `idp_subject` per TechArch §5.1 and Wave 1b users table schema
- `src/middleware/requireCurator.js` returns HTTP 403 `ACCESS_DENIED` for non-CURATOR/ADMIN users per TechArch §5.2
- `src/routes/admin.js` registers all 13 CURATOR-protected `/api/v1/admin/*` routes from TechArch §4.3 behind `router.use(requireCurator)`; all return 501 `NOT_IMPLEMENTED` until Wave 3b/3c implement them
- `test/integration/auth.test.js` passes with Jest + Supertest: requireCurator tests (401, 200 CURATOR, 200 ADMIN, 403 non-CURATOR), AdminHandler 501 stubs for all 13 routes, 403 gate for non-CURATOR, UserRepository upsert SQL pattern and idempotency
- Wave 3b and 3c plans can import `requireCurator` from `src/middleware/requireCurator.js` and mount their routes behind it
- Wave 6 frontend plans can rely on all 13 admin route paths being registered and returning consistent JSON error shapes
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/06-SUMMARY.md` with:
- Tasks completed
- Files created
- Auth design decisions (openid-client library choice, PKCE implementation, session cookie flags)
- Integration contracts provided to Wave 3b, 3c, and Wave 6
- Any deviations from TechArch noted (none expected)
</output>
