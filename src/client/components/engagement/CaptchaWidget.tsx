/**
 * CaptchaWidget.tsx — CAPTCHA widget wrapper.
 *
 * Wraps reCAPTCHA v2 visible checkbox widget.
 * When CAPTCHA_SITE_KEY is available (injected via window.__ENV), renders the real widget.
 * Otherwise, renders a dev-bypass button clearly marked for local development only.
 *
 * NOTE: Uses reCAPTCHA v2 checkbox ("I'm not a robot") — visible challenge per UX mockup.
 * Do NOT use invisible reCAPTCHA v3.
 *
 * Security: T-13-05 — dev bypass only renders when no site key is present.
 * In production, window.__ENV.CAPTCHA_SITE_KEY MUST be set. Server validates tokens
 * against the real CAPTCHA provider independently of client-side state.
 *
 * Feature: F7 — Engagement Routing
 */

import React, { useEffect, useRef } from 'react';

// Window-injected environment (set by Express template: window.__ENV = { ... })
// This avoids needing @types/node in the browser-targeted tsconfig.
declare global {
  interface Window {
    __ENV?: Record<string, string>;
    // reCAPTCHA API injected by the reCAPTCHA script
    grecaptcha?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}

export interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Resolve CAPTCHA site key from runtime environment.
 * Checks window.__ENV (Express-injected), then falls back to empty string (dev bypass).
 */
function resolveSiteKey(): string {
  if (typeof window === 'undefined') return '';
  const env = window.__ENV;
  return (
    env?.CAPTCHA_SITE_KEY ??
    env?.NEXT_PUBLIC_CAPTCHA_SITE_KEY ??
    env?.VITE_CAPTCHA_SITE_KEY ??
    ''
  );
}

/**
 * InlineReCAPTCHA: renders reCAPTCHA v2 using the global grecaptcha API injected by
 * the reCAPTCHA script tag (https://www.google.com/recaptcha/api.js).
 * Only rendered when a siteKey is available.
 */
function InlineReCAPTCHA({
  siteKey,
  onVerify,
  onExpire,
}: {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Wait for grecaptcha API to be available, then render the widget
    const tryRender = () => {
      if (!containerRef.current || !window.grecaptcha) return false;
      if (widgetIdRef.current !== null) return true; // already rendered
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
      });
      return true;
    };

    if (!tryRender()) {
      // Poll until the reCAPTCHA script is loaded
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [siteKey, onVerify, onExpire]);

  return <div ref={containerRef} />;
}

export function CaptchaWidget({ onVerify, onExpire }: CaptchaWidgetProps): JSX.Element {
  const siteKey = resolveSiteKey();

  // Dev/test bypass: renders when no site key is configured.
  // Clearly marked so it is never confused with production behavior.
  // T-13-05: dev bypass never reaches the real CAPTCHA provider endpoint.
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

  // Production: render inline reCAPTCHA v2 via the grecaptcha global API.
  // Requires the reCAPTCHA script tag to be included in the page HTML:
  //   <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  return (
    <div role="region" aria-label="CAPTCHA verification">
      <InlineReCAPTCHA siteKey={siteKey} onVerify={onVerify} onExpire={onExpire} />
    </div>
  );
}
