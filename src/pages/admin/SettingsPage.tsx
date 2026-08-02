/**
 * SettingsPage.tsx — Admin page at /admin/settings.
 *
 * Hub settings management — primarily engagement routing email configuration.
 * Client-side validation before API call: non-blank + valid email format.
 *
 * API:
 *   GET /api/v1/admin/settings   — load current settings on mount
 *   PUT /api/v1/admin/settings   — save updated settings
 *
 * Validation regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ (same pattern as backend SubmissionService)
 * Success toast: "Routing email updated. Future notifications will be sent to [email]."
 * Inline errors for: blank (VALIDATION_ERROR) and invalid format (INVALID_EMAIL)
 *
 * Per UX-Mockup Screen-11 and US-7.3 acceptance criteria.
 * F7: Engagement Routing — SettingsPage routing email config
 *
 * Note: Canonical implementation also lives at src/admin/pages/SettingsPage.tsx.
 * This file satisfies the plan-16 artifact contract at src/pages/admin/.
 */

import React, { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HubSetting {
  setting_key: string;
  setting_value: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Email validation regex — same pattern as backend SubmissionService */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Generic admin API fetch — uses session cookie (HttpOnly) set by OIDC auth ──

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin', // send session cookie
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
    throw Object.assign(new Error(body?.error?.message || `API error ${res.status}`), {
      code: body?.error?.code,
    });
  }
  return res.json() as Promise<T>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#16A34A',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontWeight: 600,
        zIndex: 1000,
        maxWidth: '460px',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [routingEmail, setRoutingEmail] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // On mount: GET /api/v1/admin/settings → find engagement_routing_email → populate input
  const loadSettings = useCallback(async () => {
    try {
      const response = await adminFetch<{ data: HubSetting[] }>('/api/v1/admin/settings');
      const setting = response.data.find(s => s.setting_key === 'engagement_routing_email');
      if (setting) setRoutingEmail(setting.setting_value);
    } catch (err) {
      setLoadError('Unable to load settings. Please refresh the page.');
      console.error('Failed to load settings:', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Client-side validation — called before API (non-blank + valid email format)
  const validate = (): boolean => {
    if (!routingEmail.trim()) {
      setFieldError('Routing email cannot be blank.');
      return false;
    }
    if (!EMAIL_REGEX.test(routingEmail.trim())) {
      setFieldError('Please enter a valid email address.');
      return false;
    }
    setFieldError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return; // Client-side validation — don't call API if invalid

    setSaving(true);
    setFieldError(null);
    try {
      // PUT /api/v1/admin/settings with { settings: [{ setting_key, setting_value }] }
      await adminFetch<{ data: HubSetting[] }>('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings: [
            { setting_key: 'engagement_routing_email', setting_value: routingEmail.trim() },
          ],
        }),
      });
      // Success toast per Screen-11: "Routing email updated. Future notifications will be sent to [email]."
      setToast(`Routing email updated. Future notifications will be sent to ${routingEmail.trim()}.`);
    } catch (err) {
      const apiError = err as { code?: string; message?: string };
      if (apiError.code === 'INVALID_EMAIL') {
        setFieldError('Please enter a valid email address.');
      } else if (apiError.code === 'VALIDATION_ERROR') {
        setFieldError('Routing email cannot be blank.');
      } else {
        setFieldError(apiError.message || 'Failed to save settings. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${fieldError ? '#FCA5A5' : '#D1D5DB'}`,
    borderRadius: '6px',
    fontSize: '0.9375rem',
    color: '#111827',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ padding: '0', maxWidth: '640px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Hub Settings
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
          Configure operational settings for the TSIO Innovation Hub.
        </p>
      </div>

      {/* Load error */}
      {loadError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.875rem', marginBottom: '24px' }}>
          {loadError}
        </div>
      )}

      {/* Engagement Routing section — per Screen-11 layout */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Engagement Routing
          </h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="routing-email"
            style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}
          >
            Routing Email Address
          </label>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 12px', lineHeight: 1.5 }}>
            All engagement requests and submission notifications are sent to this address.
            This field can be updated without a code deployment.
          </p>
          <input
            id="routing-email"
            type="email"
            value={routingEmail}
            onChange={e => {
              setRoutingEmail(e.target.value);
              if (fieldError) setFieldError(null); // Clear inline error on input change
            }}
            placeholder="e.g. AOml_TSO_IRB_Team@ao.uscourts.gov"
            style={inputStyle}
            aria-describedby={fieldError ? 'routing-email-error' : 'routing-email-hint'}
            aria-invalid={!!fieldError}
          />
          {!fieldError && (
            <p id="routing-email-hint" style={{ fontSize: '0.8rem', color: '#6B7280', margin: '6px 0 0' }}>
              Must be a valid email address. Cannot be blank.
            </p>
          )}
          {fieldError && (
            <p id="routing-email-error" role="alert" style={{ fontSize: '0.8rem', color: '#DC2626', margin: '6px 0 0', fontWeight: 500 }}>
              {fieldError}
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            backgroundColor: saving ? '#93C5FD' : '#1D4ED8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Routing Email'}
        </button>
      </section>

      {/* About section — per Screen-11 */}
      <section
        style={{
          padding: '20px',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          About
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 4px', fontWeight: 600 }}>
          TSIO Innovation Hub — Administration Interface
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: '0 0 2px' }}>
          Administrative Office of the U.S. Courts
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
          TSIO Innovation &amp; Research Branch
        </p>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SettingsPage;
