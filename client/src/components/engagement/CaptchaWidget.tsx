// src/components/engagement/CaptchaWidget.tsx
// Wraps reCAPTCHA v2 (or hCaptcha) widget.
// Fallback dev-bypass when VITE_CAPTCHA_SITE_KEY is not set — visible warning label with bypass button.
//
// NOTE: Do NOT use invisible reCAPTCHA v3 — the UX mockup shows a visible challenge widget
// ("CAPTCHA / reCAPTCHA widget"). Use reCAPTCHA v2 checkbox ("I'm not a robot") or hCaptcha.
//
// Note: This is a Vite/React app, so env vars use VITE_ prefix (not NEXT_PUBLIC_).

import React from 'react';

export interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function CaptchaWidget({ onVerify, onExpire: _onExpire }: CaptchaWidgetProps): JSX.Element {
  // In a Vite app, environment variables are accessed via import.meta.env
  // VITE_CAPTCHA_SITE_KEY is the Vite equivalent of NEXT_PUBLIC_CAPTCHA_SITE_KEY
  const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY ?? '';

  // Dev/test bypass: renders when no site key is configured.
  // Clearly marked so it is never confused with production behavior.
  if (!siteKey) {
    return (
      <div
        role="region"
        aria-label="CAPTCHA verification"
        style={{
          border: '1px dashed #D97706',
          borderRadius: '4px',
          padding: '12px',
          backgroundColor: '#FEF3C7',
          fontSize: '14px',
          color: '#92400E',
        }}
      >
        <strong>[DEV] CAPTCHA not configured.</strong> Click to bypass for local development only.
        <br />
        <button
          type="button"
          onClick={() => onVerify('dev-bypass-token')}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            border: '1px solid #D97706',
            borderRadius: '4px',
            background: '#FFFBEB',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Bypass CAPTCHA (dev only)
        </button>
      </div>
    );
  }

  // Production: render hCaptcha or reCAPTCHA container.
  // Replace with actual provider embed (e.g., @hcaptcha/react-hcaptcha) when
  // VITE_CAPTCHA_SITE_KEY is configured for production.
  return (
    <div
      role="region"
      aria-label="CAPTCHA verification"
      id="captcha-container"
      data-sitekey={siteKey}
      className="h-captcha"
    />
  );
}
