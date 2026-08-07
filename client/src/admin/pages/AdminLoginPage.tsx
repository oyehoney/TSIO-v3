// AdminLoginPage.tsx — Login gate at /admin/login
// Shows "Sign in with Microsoft" button that navigates to GET /auth/login (OIDC redirect).
// Displays 403 message when ?error=access_denied is present.

import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const isAccessDenied = errorParam === 'access_denied';

  // Set page title
  useEffect(() => {
    document.title = 'Administration — TSIO Innovation Hub';
  }, []);

  const handleSignIn = () => {
    window.location.href = '/auth/login';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '40px 48px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo / branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1E40AF',
              marginBottom: '8px',
            }}
          >
            TSIO Innovation Hub
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>Administration Interface</div>
        </div>

        {/* Access denied error banner */}
        {isAccessDenied && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#991B1B',
              fontSize: '14px',
            }}
          >
            <strong>Access Denied.</strong> You do not have permission to access the administration
            interface. Your account is not assigned the CURATOR role. Contact your administrator
            if you believe this is an error.
          </div>
        )}

        {/* Generic error banner for other errors */}
        {errorParam && !isAccessDenied && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#991B1B',
              fontSize: '14px',
            }}
          >
            Authentication error: {errorParam}. Please try again.
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: '#0078D4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#006ABC')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0078D4')}
        >
          {/* Microsoft logo SVG */}
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          Sign in with Microsoft
        </button>

        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#9CA3AF',
          }}
        >
          Access is restricted to authorized TSIO I&R personnel with CURATOR role.
        </div>
      </div>
    </div>
  );
}
