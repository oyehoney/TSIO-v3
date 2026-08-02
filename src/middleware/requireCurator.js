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
