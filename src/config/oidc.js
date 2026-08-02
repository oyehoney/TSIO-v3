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
