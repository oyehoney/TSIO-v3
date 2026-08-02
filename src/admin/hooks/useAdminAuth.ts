/**
 * useAdminAuth.ts — Auth guard hook for admin pages.
 *
 * Checks CURATOR session by calling GET /api/v1/admin/dashboard-summary.
 * If 401/403 or network error: redirects to /admin/login.
 *
 * This is a UX-layer defense-in-depth check (T-14-01). The actual auth
 * boundary is enforced server-side by requireCurator middleware (06-PLAN).
 */

import { useEffect, useState } from 'react';

export function useAdminAuth() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard-summary', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          window.location.href = '/admin/login';
        }
      })
      .catch(() => {
        window.location.href = '/admin/login';
      })
      .finally(() => setChecking(false));
  }, []);

  return { checking, authenticated };
}
