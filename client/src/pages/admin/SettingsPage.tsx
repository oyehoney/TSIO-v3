// src/pages/admin/SettingsPage.tsx
// Admin page: Hub Settings — US-7.3 (F7/F8)
// Route: /admin/settings
// Curator-only — requires OIDC session cookie (sent via credentials: 'same-origin')

import React, { useEffect, useId, useState } from 'react';

// ── Email validation regex (same as backend SubmissionService) ────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── API fetch wrapper ──────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const apiErr = body as { error?: { code?: string; message?: string } };
    throw Object.assign(
      new Error(apiErr?.error?.message || `API error ${res.status}`),
      { code: apiErr?.error?.code, status: res.status }
    );
  }
  return res.json() as Promise<T>;
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-green-700 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm" role="status">
      <span>✓</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────

export function SettingsPage() {
  const emailInputId = useId();
  const [routingEmail, setRoutingEmail] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load current routing email on mount
  useEffect(() => {
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await adminFetch<{ data: Array<{ setting_key: string; setting_value: string }> }>(
          '/api/v1/admin/settings'
        );
        const emailSetting = data.data.find(s => s.setting_key === 'engagement_routing_email');
        const val = emailSetting?.setting_value ?? '';
        setRoutingEmail(val);
        setInputValue(val);
      } catch {
        setLoadError('Unable to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setFieldError(null);

    // Client-side validation — do NOT call API if invalid
    if (!inputValue.trim()) {
      setFieldError('Routing email cannot be blank.');
      return;
    }
    if (!EMAIL_REGEX.test(inputValue.trim())) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      await adminFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings: [{ setting_key: 'engagement_routing_email', setting_value: inputValue.trim() }],
        }),
      });
      setRoutingEmail(inputValue.trim());
      setToast(`Routing email updated. Future notifications will be sent to ${inputValue.trim()}.`);
    } catch (err) {
      const typedErr = err as { code?: string };
      if (typedErr?.code === 'INVALID_EMAIL') {
        setFieldError('Please enter a valid email address.');
      } else if (typedErr?.code === 'VALIDATION_ERROR') {
        setFieldError('Routing email cannot be blank.');
      } else {
        setFieldError(err instanceof Error ? err.message : 'Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading settings…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hub Settings</h1>
      </div>

      {/* ENGAGEMENT ROUTING section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Engagement Routing</h2>
        </div>

        <div className="px-6 py-5">
          <label
            htmlFor={emailInputId}
            className="block text-sm font-semibold text-gray-800 mb-1"
          >
            Routing Email Address
          </label>
          <p className="text-sm text-gray-500 mb-3">
            All engagement requests and submission notifications are sent to this address.<br />
            <span className="font-medium text-gray-700">This field can be updated without a code deployment.</span>
          </p>

          <input
            id={emailInputId}
            type="email"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setFieldError(null); }}
            placeholder="e.g. team@uscourts.gov"
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              fieldError ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            aria-describedby={fieldError ? `${emailInputId}-error` : `${emailInputId}-hint`}
            aria-label="Routing Email Address"
          />

          {fieldError ? (
            <p id={`${emailInputId}-error`} className="mt-1 text-xs text-red-600 font-medium" role="alert">
              {fieldError}
            </p>
          ) : (
            <p id={`${emailInputId}-hint`} className="mt-1 text-xs text-gray-400">
              Must be a valid email address. Cannot be blank.
            </p>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save Routing Email'}
            </button>

            {routingEmail && inputValue !== routingEmail && !fieldError && (
              <button
                onClick={() => { setInputValue(routingEmail); setFieldError(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ABOUT section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">About</h2>
        </div>
        <div className="px-6 py-5 text-sm text-gray-600 space-y-1">
          <p>TSIO Innovation Hub — Administration Interface</p>
          <p>Administrative Office of the U.S. Courts</p>
          <p>TSIO Innovation &amp; Research Branch</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
