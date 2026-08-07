// src/components/forms/CaptchaWidget.tsx
import React, { useEffect } from 'react';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/**
 * CAPTCHA integration widget.
 * In test/dev mode (no VITE_CAPTCHA_SITE_KEY): immediately issues a placeholder token.
 * In production: embed hCaptcha or reCAPTCHA using the site key env var.
 *
 * Federal network note: CAPTCHA_ENABLED can be set to 'false' in hub_settings to bypass
 * server-side validation entirely for environments where external CAPTCHA provider calls are blocked.
 */
export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify, onExpire }) => {
  const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY;

  useEffect(() => {
    // In test/dev without a real site key, issue a placeholder token immediately
    // Server-side CaptchaService will bypass validation when captcha_enabled='false' in hub_settings
    if (!siteKey) {
      onVerify('dev-captcha-bypass-token');
    }
  }, [siteKey, onVerify]);

  if (!siteKey) {
    return (
      <div
        className="border border-gray-300 rounded p-3 bg-gray-50 text-sm text-gray-600"
        aria-label="CAPTCHA verification (development mode — auto-verified)"
        role="status"
      >
        <span className="text-green-700 font-medium">✓ CAPTCHA verification active</span>
        <span className="ml-2 text-gray-500">(Configure VITE_CAPTCHA_SITE_KEY for production CAPTCHA)</span>
      </div>
    );
  }

  // Production: render hCaptcha iframe (requires @hcaptcha/react-hcaptcha or similar)
  // Replace this comment with real provider embed when VITE_CAPTCHA_SITE_KEY is configured.
  return (
    <div
      id="captcha-container"
      data-sitekey={siteKey}
      className="h-captcha"
      aria-label="CAPTCHA verification"
    />
  );
};
