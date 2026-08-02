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
