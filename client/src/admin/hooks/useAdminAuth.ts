// useAdminAuth.ts — Auth guard hook for admin pages.
// Checks for session by calling GET /api/v1/admin/dashboard-summary (a CURATOR-only endpoint).
// If 401/403 or any error, redirects to /admin/login.
//
// Dev/preview bypass: when VITE_DEV_AUTH_BYPASS=true the session check is skipped
// and authenticated is returned as true immediately. The backend must also have
// DEV_AUTH_BYPASS=true set to accept requests without a real OIDC session.

import { useEffect, useState } from 'react';

// Vite replaces import.meta.env.VITE_* at build time.
// Falls back to false if the variable is not set.
const DEV_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

export function useAdminAuth() {
  const [checking, setChecking] = useState(!DEV_BYPASS);
  const [authenticated, setAuthenticated] = useState(DEV_BYPASS);

  useEffect(() => {
    if (DEV_BYPASS) {
      // Bypass mode: skip session check, grant access immediately.
      // Backend devAuthBypass middleware provides the synthetic CURATOR session.
      return;
    }

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
