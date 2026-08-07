'use strict';
const axios = require('axios');
const { getSettingValue } = require('./SettingsRepository');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';

/**
 * Validate a CAPTCHA token from a public form submission.
 * Reads captcha_enabled from hub_settings at call time (not cached).
 * If captcha_enabled='false', bypass validation entirely — supports federal
 * network environments where outbound CAPTCHA provider calls may be blocked.
 *
 * @param {string} token - The captcha_token from the request body
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
async function validate(token) {
  // Step 1: Check hub_settings for captcha_enabled bypass
  let captchaEnabled = true;
  try {
    const setting = await getSettingValue('captcha_enabled');
    if (setting === 'false') {
      captchaEnabled = false;
    }
  } catch (err) {
    // If hub_settings read fails, proceed with validation (fail-open is safer
    // than blocking all submissions if DB has a transient read issue).
    // Log but do not throw.
  }

  if (!captchaEnabled) {
    return { valid: true };
  }

  if (!token) {
    return { valid: false, error: 'CAPTCHA_INVALID' };
  }

  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  if (!secretKey) {
    // CAPTCHA not configured — treat same as disabled
    return { valid: true };
  }

  try {
    // Support both reCAPTCHA v3 and hCaptcha (same API shape)
    const verifyUrl = process.env.CAPTCHA_PROVIDER === 'hcaptcha'
      ? HCAPTCHA_VERIFY_URL
      : RECAPTCHA_VERIFY_URL;

    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await axios.post(verifyUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000
    });

    // reCAPTCHA v3: { success: true, score: 0.9, ... }
    // hCaptcha:    { success: true, ... }
    if (response.data && response.data.success === true) {
      return { valid: true };
    }
    return { valid: false, error: 'CAPTCHA_INVALID' };
  } catch (err) {
    // Network error reaching CAPTCHA provider — treat as invalid to be safe
    return { valid: false, error: 'CAPTCHA_INVALID' };
  }
}

module.exports = { validate };
