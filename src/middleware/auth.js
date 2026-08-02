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
