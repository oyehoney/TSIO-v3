/**
 * AdminLoginPage.tsx — OIDC login redirect gate at /admin/login.
 *
 * Shows "Sign in with Microsoft" button → navigates to GET /auth/login.
 * Displays 403 message when ?error=access_denied is present in URL.
 * Page title: "Administration — TSIO Innovation Hub"
 *
 * F8: Curation and Administration — US-8.1 AC (OIDC login, 403 display)
 * T-14-05: Frontend only navigates to /auth/login — all OIDC state/PKCE is server-side.
 */

import React, { useEffect } from 'react';

export const AdminLoginPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const hasError = params.get('error') === 'access_denied';

  useEffect(() => {
    document.title = 'Administration — TSIO Innovation Hub';
  }, []);

  const handleSignIn = () => {
    // Navigate to server-side OIDC initiation endpoint
    // Server-side builds the authorization URL with PKCE — we never touch tokens (T-14-05)
    window.location.href = '/auth/login';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '48px 40px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo / branding */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            TSIO Innovation Hub
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '8px 0 0' }}>
            Administration
          </h1>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '16px 0 32px' }}>
          Sign in with your government Microsoft account to access the administration interface.
        </p>

        {/* Access denied error banner */}
        {hasError && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <p style={{ color: '#991B1B', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
              You do not have permission to access the administration interface.
            </p>
            <p style={{ color: '#B91C1C', fontSize: '0.8rem', margin: '6px 0 0' }}>
              Your account was authenticated successfully, but does not have the CURATOR role required
              for administration access. Contact your system administrator.
            </p>
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px 24px',
            backgroundColor: '#0078D4', // Microsoft blue
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#106EBE')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0078D4')}
        >
          {/* Microsoft logo icon (simplified) */}
          <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>

        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '24px' }}>
          Government Microsoft accounts only. Access requires CURATOR role.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
