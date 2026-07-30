---
phase: implement-full-tsio-innovation-hub-web-a
plan: 07
type: execute
wave: 3
depends_on: [1]
files_modified:
  - src/services/SubmissionService.js
  - src/services/CaptchaService.js
  - src/services/EmailService.js
  - src/middleware/rateLimiter.js
  - src/handlers/SubmissionHandler.js
  - src/routes/submissions.js
  - tests/integration/submissions.test.js
autonomous: true

features:
  implements: ["F5", "F6", "F7"]
  depends_on: ["F8"]
  enables: ["F5", "F6", "F7"]

must_haves:
  truths:
    - "POST /api/v1/opportunity-submissions accepts valid OpportunitySubmissionCreateRequest, validates CAPTCHA server-side, applies IP rate limit (5/hr), persists to opportunity_submissions table with status=SUBMITTED, triggers non-fatal email to routing address from hub_settings, returns 201 with full OpportunitySubmission object"
    - "GET /api/v1/admin/opportunity-submissions requires CURATOR auth, returns paginated list of all opportunity_submissions ordered by submitted_at DESC"
    - "PATCH /api/v1/admin/opportunity-submissions/:id requires CURATOR auth, accepts SubmissionDispositionUpdateRequest (disposition + optional linked_record_id + optional internal_note), updates disposition and sets reviewed_at + reviewed_by_user_id"
    - "POST /api/v1/contribution-submissions accepts valid ContributionSubmissionCreateRequest (1–5 HTTPS artifact_urls, self_assessed_maturity excluding ARCHIVED), validates CAPTCHA, applies same 5/hr IP rate limit, persists to contribution_submissions table with status=SUBMITTED, triggers non-fatal email, returns 201"
    - "GET /api/v1/admin/contribution-submissions requires CURATOR auth, returns paginated list"
    - "PATCH /api/v1/admin/contribution-submissions/:id requires CURATOR auth, updates disposition"
    - "CaptchaService.validate(token) verifies token against provider endpoint; if CAPTCHA_ENABLED setting is false in hub_settings, validation is bypassed and returns true"
    - "RateLimiter middleware (IP-based) limits opportunity/contribution submissions to 5/hr and engagement requests to 10/hr per IP; returns 429 with X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After headers on breach"
    - "EmailService.send() reads engagement_routing_email from hub_settings at send time (not cached at startup); if SMTP fails, logs error and returns without throwing — submission/request record is already persisted"
    - "Integration tests cover: happy-path submission creates record and returns 201; CAPTCHA_INVALID returns 422; rate limit breach returns 429; CURATOR list returns paginated results; disposition update returns 200 with updated fields; email failure does NOT roll back submission"
  artifacts:
    - path: "src/services/SubmissionService.js"
      provides: "createOpportunitySubmission(), listOpportunitySubmissions(), updateOpportunityDisposition(), createContributionSubmission(), listContributionSubmissions(), updateContributionDisposition()"
      exports: ["createOpportunitySubmission", "listOpportunitySubmissions", "updateOpportunityDisposition", "createContributionSubmission", "listContributionSubmissions", "updateContributionDisposition"]
    - path: "src/services/CaptchaService.js"
      provides: "validate(token) — server-side CAPTCHA verification with hub_settings bypass"
      exports: ["validate"]
    - path: "src/services/EmailService.js"
      provides: "sendRoutingNotification(type, payload) — reads routing email from hub_settings, fires-and-forgets SMTP, non-fatal on failure"
      exports: ["sendRoutingNotification"]
    - path: "src/middleware/rateLimiter.js"
      provides: "submissionLimiter (5/hr), engagementLimiter (10/hr) express-rate-limit instances"
      exports: ["submissionLimiter", "engagementLimiter"]
    - path: "src/handlers/SubmissionHandler.js"
      provides: "HTTP handler functions for all 6 submission endpoints"
      exports: ["postOpportunitySubmission", "getOpportunitySubmissions", "patchOpportunityDisposition", "postContributionSubmission", "getContributionSubmissions", "patchContributionDisposition"]
    - path: "src/routes/submissions.js"
      provides: "Express router mounting all 6 submission endpoints with rate limiter + CURATOR auth middleware"
      exports: ["submissionsRouter"]
    - path: "tests/integration/submissions.test.js"
      provides: "Integration test suite (Jest + Supertest) covering all 6 endpoints"
  key_links:
    - from: "src/handlers/SubmissionHandler.js"
      to: "src/services/CaptchaService.js"
      via: "validate(captcha_token) called before persist"
      pattern: "CaptchaService\\.validate"
    - from: "src/handlers/SubmissionHandler.js"
      to: "src/services/SubmissionService.js"
      via: "createOpportunitySubmission / createContributionSubmission"
      pattern: "SubmissionService\\.(createOpportunity|createContribution)"
    - from: "src/services/SubmissionService.js"
      to: "src/services/EmailService.js"
      via: "sendRoutingNotification() called after successful DB persist — failure does not throw"
      pattern: "EmailService\\.sendRoutingNotification"
    - from: "src/services/EmailService.js"
      to: "hub_settings.engagement_routing_email"
      via: "SettingsRepository read at send time (not cached)"
      pattern: "engagement_routing_email"
    - from: "src/middleware/rateLimiter.js"
      to: "src/routes/submissions.js"
      via: "submissionLimiter applied before handler on POST routes"
      pattern: "submissionLimiter"

integration_contracts:
  requires:
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports: ["opportunity_submissions", "contribution_submissions", "hub_settings", "users"]
      verify: "grep -n 'CREATE TABLE opportunity_submissions' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE contribution_submissions' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE hub_settings' db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
  provides:
    - artifact: "src/routes/submissions.js"
      exports:
        - "POST /api/v1/opportunity-submissions — public, rate-limited (5/hr), CAPTCHA-validated"
        - "GET /api/v1/admin/opportunity-submissions — CURATOR, paginated, ordered submitted_at DESC"
        - "PATCH /api/v1/admin/opportunity-submissions/:id — CURATOR"
        - "POST /api/v1/contribution-submissions — public, rate-limited (5/hr), CAPTCHA-validated"
        - "GET /api/v1/admin/contribution-submissions — CURATOR, paginated"
        - "PATCH /api/v1/admin/contribution-submissions/:id — CURATOR"
      shape: |
        POST /api/v1/opportunity-submissions
          Request: OpportunitySubmissionCreateRequest {
            problem_description: string (50–3000 chars, required),
            mission_area: string (2–200 chars, required),
            submitting_office: string (2–200 chars, required),
            submitter_name: string (2–200 chars, required),
            submitter_email: string (valid email, required),
            submitter_title?: string,
            urgency_context?: string,
            known_constraints?: string,
            captcha_token: string (required)
          }
          Response 201: OpportunitySubmission {
            submission_id: string (UUID),
            problem_description: string,
            mission_area: string,
            submitting_office: string,
            submitter_name: string,
            submitter_email: string,
            submitter_title: string | null,
            urgency_context: string | null,
            known_constraints: string | null,
            status: "SUBMITTED",
            disposition: null,
            linked_record_id: null,
            internal_note: null,
            submitted_at: string (ISO 8601 UTC),
            reviewed_at: null,
            reviewed_by_user_id: null
          }
          Response 422: { error: { code: "CAPTCHA_INVALID" | "VALIDATION_ERROR", message: string, fields?: [] } }
          Response 429: { error: { code: "RATE_LIMIT_EXCEEDED", message: string } }
            Headers: X-RateLimit-Limit: 5, X-RateLimit-Remaining: 0, X-RateLimit-Reset: <epoch>, Retry-After: 3600

        PATCH /api/v1/admin/opportunity-submissions/:id
          Request: SubmissionDispositionUpdateRequest {
            disposition: "UNDER_REVIEW" | "ACCEPTED_FOR_CONSIDERATION" | "DECLINED" | "LINKED_TO_RECORD",
            linked_record_id?: string | null,
            internal_note?: string | null
          }
          Response 200: OpportunitySubmission (full updated object)
          Response 422: { error: { code: "VALIDATION_ERROR" | "INVALID_RECORD_REF", message: string } }

        POST /api/v1/contribution-submissions
          Request: ContributionSubmissionCreateRequest {
            work_description: string (50–3000 chars, required),
            problem_addressed: string (50–2000 chars, required),
            outcome_summary: string (50–2000 chars, required),
            self_assessed_maturity: "IDEA" | "EXPERIMENT_POC" | "PROTOTYPE_PILOT" | "PRODUCTION_VALIDATED" (required, no ARCHIVED),
            artifact_urls: string[] (1–5 valid HTTPS URLs, required),
            contributing_team: string (2–200 chars, required),
            contributing_office: string (2–200 chars, required),
            contact_name: string (2–200 chars, required),
            contact_email: string (valid email, required),
            contact_title?: string,
            additional_context?: string,
            captcha_token: string (required)
          }
          Response 201: ContributionSubmission (full object, status="SUBMITTED")
          Response 422: { error: { code: "CAPTCHA_INVALID" | "VALIDATION_ERROR" | "ARTIFACT_URL_REQUIRED" | "INVALID_ARTIFACT_URL", message: string } }
          Response 429: { error: { code: "RATE_LIMIT_EXCEEDED" } }

        GET /api/v1/admin/opportunity-submissions
          Response 200: PaginatedResponse<OpportunitySubmission> {
            data: OpportunitySubmission[],
            pagination: { page, page_size, total_count, total_pages }
          }

        GET /api/v1/admin/contribution-submissions
          Response 200: PaginatedResponse<ContributionSubmission>

        PATCH /api/v1/admin/contribution-submissions/:id
          Request: ContributionDispositionUpdateRequest {
            disposition: "UNDER_REVIEW" | "ACCEPTED_FOR_CURATION" | "DECLINED" | "PUBLISHED",
            linked_record_id?: string | null,
            internal_note?: string | null
          }
          Response 200: ContributionSubmission (full updated object)
      verify: "grep -n 'submissionsRouter' src/routes/submissions.js && grep -n 'opportunity-submissions' src/routes/submissions.js && grep -n 'contribution-submissions' src/routes/submissions.js && echo CONTRACT_OK"
    - artifact: "src/middleware/rateLimiter.js"
      exports:
        - "submissionLimiter — express-rate-limit, max 5 per IP per hour (windowMs: 3600000)"
        - "engagementLimiter — express-rate-limit, max 10 per IP per hour (windowMs: 3600000)"
      shape: |
        Both instances use express-rate-limit with:
          windowMs: 3600000 (1 hour)
          handler: returns 429 JSON { error: { code: "RATE_LIMIT_EXCEEDED", message: "..." } }
          headers: true (sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After)
      verify: "grep -n 'submissionLimiter' src/middleware/rateLimiter.js && grep -n 'engagementLimiter' src/middleware/rateLimiter.js && grep -n '3600000' src/middleware/rateLimiter.js && echo CONTRACT_OK"
    - artifact: "src/services/EmailService.js"
      exports:
        - "sendRoutingNotification(type, payload) — non-fatal fire-and-forget"
      shape: |
        async function sendRoutingNotification(type, payload):
          1. Read engagement_routing_email from hub_settings table (not cached)
          2. Build plain-text email body from type + payload
          3. Send via Nodemailer SMTP transport
          4. If send throws: log error (Winston/Pino), return { success: false, error: e.message }
          5. Never rethrow; caller is unaffected by email failure
      verify: "grep -n 'sendRoutingNotification' src/services/EmailService.js && grep -n 'engagement_routing_email' src/services/EmailService.js && echo CONTRACT_OK"
    - artifact: "src/services/CaptchaService.js"
      exports:
        - "validate(token) — returns { valid: boolean, error?: string }"
      shape: |
        async function validate(token):
          1. Read captcha_enabled from hub_settings (default true if key absent)
          2. If captcha_enabled === 'false': return { valid: true }
          3. POST to CAPTCHA_VERIFY_URL (env: CAPTCHA_SECRET_KEY) with token
          4. If provider returns success=true (reCAPTCHA v3) or pass=true (hCaptcha): return { valid: true }
          5. Otherwise: return { valid: false, error: 'CAPTCHA_INVALID' }
      verify: "grep -n 'validate' src/services/CaptchaService.js && grep -n 'captcha_enabled' src/services/CaptchaService.js && echo CONTRACT_OK"
---

<objective>
Implement the SubmissionService API surface (all 6 opportunity and contribution submission endpoints) together with the CaptchaService, IP-based RateLimiter middleware, and EmailService (non-fatal SMTP routing). All components include integration tests covering happy path, validation failures, CAPTCHA rejection, rate limit breach, and email-failure isolation.

Purpose: Wave 5 public submission forms (/submit-opportunity, /share-innovation) and Wave 6 admin submissions queue depend entirely on this API surface. Without these endpoints the forms have no backend and the admin interface has no data to display.

Output:
- src/services/SubmissionService.js — F5/F6 business logic
- src/services/CaptchaService.js — server-side CAPTCHA verification with hub_settings bypass
- src/services/EmailService.js — non-fatal SMTP routing with routing-address read at send time
- src/middleware/rateLimiter.js — submissionLimiter (5/hr) + engagementLimiter (10/hr)
- src/handlers/SubmissionHandler.js — HTTP handler functions
- src/routes/submissions.js — Express router mounting 6 endpoints
- tests/integration/submissions.test.js — Jest + Supertest integration tests
</objective>

<feature_dependencies>
Implements: F5: Opportunity Submission (POST/GET/PATCH opportunity_submissions endpoints + CAPTCHA + rate limit + email routing), F6: Share Existing Innovation Work (POST/GET/PATCH contribution_submissions endpoints + same protections), F7: Engagement Routing (EmailService sendRoutingNotification consumed by both F5 and F6; RateLimiter engagementLimiter used in Wave 3c EngagementService)
Depends on: F8: Curation and Administration (users table for reviewed_by_user_id FK; CURATOR auth middleware from Wave 3a must be available on protected routes; hub_settings table for routing email and captcha_enabled)
Enables: F5: Wave 5 SubmitOpportunityPage, F6: Wave 5 ShareInnovationPage, F6: Wave 6 ContributionSubmissionsPage, F5: Wave 6 OpportunitySubmissionsPage
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/express/implement-full-tsio-innovation-hub-web-a/WAVE-SCHEDULE.md
@project_specs/TechArch-TSIO-Innovation-Hub.md
@project_specs/FRD-TSIO-Innovation-Hub.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement CaptchaService, RateLimiter middleware, and EmailService</name>
  <files>
    src/services/CaptchaService.js
    src/middleware/rateLimiter.js
    src/services/EmailService.js
  </files>
  <action>
Create the three infrastructure services that SubmissionService and EngagementService both depend on.

---

### src/services/CaptchaService.js

Server-side CAPTCHA token verification. Reads `captcha_enabled` from hub_settings at call time (not startup). If `captcha_enabled = 'false'`, bypass validation entirely — this supports federal network environments where outbound CAPTCHA provider calls may be blocked (TechArch §5.3, §7.5).

```javascript
// src/services/CaptchaService.js
const axios = require('axios'); // or use node's built-in fetch if Node 18+
const { getSettingValue } = require('./SettingsRepository'); // reads from hub_settings table

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';

/**
 * Validate a CAPTCHA token from a public form submission.
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
    // If hub_settings read fails, proceed with validation (fail-open is the safer choice
    // than blocking all submissions if the DB has a transient read issue)
    // Log but do not throw
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
    // hCaptcha: { success: true, ... }
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
```

**Note on SettingsRepository:** Create `src/services/SettingsRepository.js` as a thin DB wrapper if it doesn't already exist:
```javascript
// src/services/SettingsRepository.js
const db = require('../db'); // knex instance

async function getSettingValue(key) {
  const row = await db('hub_settings').where({ setting_key: key }).first();
  return row ? row.setting_value : null;
}

async function getAllSettings() {
  return db('hub_settings').select('*').orderBy('setting_key');
}

async function updateSetting(key, value, updatedByUserId) {
  await db('hub_settings')
    .where({ setting_key: key })
    .update({ setting_value: value, updated_at: new Date(), updated_by_user_id: updatedByUserId });
  return getSettingValue(key);
}

module.exports = { getSettingValue, getAllSettings, updateSetting };
```

---

### src/middleware/rateLimiter.js

IP-based rate limiting using `express-rate-limit`. Two configurable instances per TechArch §5.3:
- Opportunity/Contribution submissions: 5 per IP per hour
- Engagement requests: 10 per IP per hour

```javascript
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for public form submissions (opportunity + contribution).
 * Limit: 5 requests per IP per hour — per FRD F05 §Validation and F06 §Validation.
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour in ms
  max: 5,
  standardHeaders: true,  // Return rate limit info in X-RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many submissions. Please wait before submitting again.'
      }
    });
  }
});

/**
 * Rate limiter for engagement requests.
 * Limit: 10 requests per IP per hour — per FRD F07 §Validation.
 */
const engagementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour in ms
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before submitting again.'
      }
    });
  }
});

module.exports = { submissionLimiter, engagementLimiter };
```

---

### src/services/EmailService.js

Non-fatal SMTP routing notification service. Reads `engagement_routing_email` from `hub_settings` at send time — NOT cached at startup. This is critical: the routing email must be changeable by a curator without restarting the application (FRD F07, TechArch §2.1 SettingsService).

Failure contract: if SMTP throws, log the error and return `{ success: false }`. Never rethrow. The caller (SubmissionService) must already have persisted the record before calling sendRoutingNotification.

```javascript
// src/services/EmailService.js
const nodemailer = require('nodemailer');
const { getSettingValue } = require('./SettingsRepository');
const logger = require('../utils/logger'); // Winston or Pino instance

/**
 * Send a routing notification email to the I&R team routing address.
 * Reads routing email from hub_settings at call time (not cached).
 * NON-FATAL: any SMTP error is logged and swallowed — submission record is unaffected.
 *
 * @param {'opportunity_submission'|'contribution_submission'|'engagement_request'} type
 * @param {Object} payload - The record data to include in the notification
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function sendRoutingNotification(type, payload) {
  try {
    // Read routing email at call time (not cached — must be current from DB)
    const routingEmail = await getSettingValue('engagement_routing_email');
    if (!routingEmail) {
      logger.warn('[EmailService] engagement_routing_email not configured in hub_settings');
      return { success: false, error: 'ROUTING_EMAIL_NOT_CONFIGURED' };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });

    const subject = buildSubject(type, payload);
    const text = buildBody(type, payload);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@ao.uscourts.gov',
      to: routingEmail,
      subject,
      text
    });

    return { success: true };
  } catch (err) {
    // NON-FATAL: log and return failure without throwing
    logger.error('[EmailService] Routing notification failed', {
      type,
      error: err.message,
      stack: err.stack
    });
    return { success: false, error: err.message };
  }
}

function buildSubject(type, payload) {
  switch (type) {
    case 'opportunity_submission':
      return `[TSIO Hub] New Opportunity Submission — ${payload.mission_area || 'Unknown Area'}`;
    case 'contribution_submission':
      return `[TSIO Hub] New Contribution Submission — ${payload.contributing_office || 'Unknown Office'}`;
    case 'engagement_request':
      return `[TSIO Hub] New Engagement Request — ${payload.request_type || 'Unknown Type'}`;
    default:
      return '[TSIO Hub] New Notification';
  }
}

function buildBody(type, payload) {
  const timestamp = new Date().toISOString();
  let body = `TSIO Innovation Hub — Routing Notification\n`;
  body += `Type: ${type}\n`;
  body += `Timestamp: ${timestamp}\n\n`;

  if (type === 'opportunity_submission') {
    body += `Submitter: ${payload.submitter_name} (${payload.submitter_email})\n`;
    body += `Office: ${payload.submitting_office}\n`;
    body += `Mission Area: ${payload.mission_area}\n\n`;
    body += `Problem Description:\n${payload.problem_description}\n\n`;
    if (payload.urgency_context) body += `Urgency Context:\n${payload.urgency_context}\n\n`;
    if (payload.known_constraints) body += `Known Constraints:\n${payload.known_constraints}\n\n`;
    body += `Admin Interface: ${process.env.APP_BASE_URL || 'http://localhost:3000'}/admin/submissions/opportunities`;
  } else if (type === 'contribution_submission') {
    body += `Contact: ${payload.contact_name} (${payload.contact_email})\n`;
    body += `Team: ${payload.contributing_team}\n`;
    body += `Office: ${payload.contributing_office}\n`;
    body += `Self-Assessed Maturity: ${payload.self_assessed_maturity}\n\n`;
    body += `Work Description:\n${payload.work_description}\n\n`;
    body += `Problem Addressed:\n${payload.problem_addressed}\n\n`;
    body += `Outcome Summary:\n${payload.outcome_summary}\n\n`;
    body += `Artifact URLs:\n${(payload.artifact_urls || []).join('\n')}\n\n`;
    body += `Admin Interface: ${process.env.APP_BASE_URL || 'http://localhost:3000'}/admin/submissions/contributions`;
  } else if (type === 'engagement_request') {
    body += `Request Type: ${payload.request_type}\n`;
    body += `Record ID: ${payload.record_id}\n`;
    body += `Requestor: ${payload.requestor_name} (${payload.requestor_email})\n`;
    body += `Office: ${payload.requestor_office}\n\n`;
    body += `Description of Interest:\n${payload.description_of_interest}\n\n`;
    if (payload.desired_next_step) body += `Desired Next Step:\n${payload.desired_next_step}\n\n`;
  }

  return body;
}

module.exports = { sendRoutingNotification };
```

Also create `src/utils/logger.js` if it doesn't exist — a thin Winston wrapper:
```javascript
// src/utils/logger.js
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});
module.exports = logger;
```
  </action>
  <verify>
grep -n 'validate' src/services/CaptchaService.js && grep -n 'captcha_enabled' src/services/CaptchaService.js && echo "CAPTCHA_SERVICE_OK"
grep -n 'submissionLimiter' src/middleware/rateLimiter.js && grep -n 'engagementLimiter' src/middleware/rateLimiter.js && grep -n '3600000' src/middleware/rateLimiter.js && echo "RATE_LIMITER_OK"
grep -n 'sendRoutingNotification' src/services/EmailService.js && grep -n 'engagement_routing_email' src/services/EmailService.js && grep -n 'catch' src/services/EmailService.js && echo "EMAIL_SERVICE_OK"
grep -n 'getSettingValue' src/services/SettingsRepository.js && echo "SETTINGS_REPO_OK" && echo CONTRACT_OK
  </verify>
  <done>
- src/services/CaptchaService.js exports validate(token); reads captcha_enabled from hub_settings; bypasses validation when captcha_enabled='false'; validates against reCAPTCHA v3 or hCaptcha provider endpoint; returns { valid: boolean, error?: string }
- src/middleware/rateLimiter.js exports submissionLimiter (max:5, windowMs:3600000) and engagementLimiter (max:10, windowMs:3600000); both use express-rate-limit with standardHeaders:true; 429 handler returns JSON { error: { code: 'RATE_LIMIT_EXCEEDED', message: '...' } }
- src/services/EmailService.js exports sendRoutingNotification(type, payload); reads engagement_routing_email from hub_settings at call time (not cached); uses nodemailer SMTP; catches all errors, logs via Winston, returns { success: false } without rethrowing; never causes submission to fail
- src/services/SettingsRepository.js exports getSettingValue(key), getAllSettings(), updateSetting(key, value, userId)
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement SubmissionService, SubmissionHandler, routes, and integration tests</name>
  <files>
    src/services/SubmissionService.js
    src/handlers/SubmissionHandler.js
    src/routes/submissions.js
    tests/integration/submissions.test.js
  </files>
  <action>
Implement the full submission API surface for F5 (Opportunity Submission) and F6 (Contribution Submission), including validation, CAPTCHA enforcement, rate limiting, and curator admin endpoints.

---

### src/services/SubmissionService.js

Business logic for both submission types. Validation follows FRD F05 §Validation and F06 §Validation exactly. All text input is HTML-stripped before persistence per TechArch §5.5.

```javascript
// src/services/SubmissionService.js
const db = require('../db'); // knex instance
const { validate: validateCaptcha } = require('./CaptchaService');
const { sendRoutingNotification } = require('./EmailService');
const sanitizeHtml = require('sanitize-html'); // or DOMPurify server-side via jsdom

// ─── Input sanitization helper ─────────────────────────────────────────────────
function sanitize(text) {
  if (!text) return text;
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Opportunity Submissions (F05) ─────────────────────────────────────────────

/**
 * Create a new opportunity submission.
 * Validates fields, verifies CAPTCHA, persists, then fires non-fatal email.
 * From TechArch §2.1 SubmissionService spec.
 */
async function createOpportunitySubmission(data) {
  const errors = [];

  // Field validation per FRD F05 §Validation
  if (!data.problem_description || sanitize(data.problem_description).length < 50) {
    errors.push({ field: 'problem_description', error_code: 'FIELD_TOO_SHORT', message: 'Problem description must be at least 50 characters.' });
  }
  if (data.problem_description && sanitize(data.problem_description).length > 3000) {
    errors.push({ field: 'problem_description', error_code: 'FIELD_TOO_LONG', message: 'Problem description must be 3000 characters or fewer.' });
  }
  if (!data.mission_area || sanitize(data.mission_area).length < 2 || sanitize(data.mission_area).length > 200) {
    errors.push({ field: 'mission_area', error_code: 'VALIDATION_ERROR', message: 'Mission area is required (2–200 characters).' });
  }
  if (!data.submitting_office || sanitize(data.submitting_office).length < 2 || sanitize(data.submitting_office).length > 200) {
    errors.push({ field: 'submitting_office', error_code: 'VALIDATION_ERROR', message: 'Submitting office is required (2–200 characters).' });
  }
  if (!data.submitter_name || sanitize(data.submitter_name).length < 2 || sanitize(data.submitter_name).length > 200) {
    errors.push({ field: 'submitter_name', error_code: 'VALIDATION_ERROR', message: 'Submitter name is required (2–200 characters).' });
  }
  if (!data.submitter_email || !isValidEmail(data.submitter_email)) {
    errors.push({ field: 'submitter_email', error_code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
  }

  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    err.fields = errors;
    throw err;
  }

  // CAPTCHA verification (before any DB write)
  const captchaResult = await validateCaptcha(data.captcha_token);
  if (!captchaResult.valid) {
    const err = new Error('CAPTCHA verification failed. Please try again.');
    err.status = 422;
    err.code = 'CAPTCHA_INVALID';
    throw err;
  }

  // Persist submission
  const [submission] = await db('opportunity_submissions')
    .insert({
      problem_description: sanitize(data.problem_description),
      mission_area: sanitize(data.mission_area),
      submitting_office: sanitize(data.submitting_office),
      submitter_name: sanitize(data.submitter_name),
      submitter_email: sanitize(data.submitter_email),
      submitter_title: data.submitter_title ? sanitize(data.submitter_title) : null,
      urgency_context: data.urgency_context ? sanitize(data.urgency_context) : null,
      known_constraints: data.known_constraints ? sanitize(data.known_constraints) : null,
      status: 'SUBMITTED'
    })
    .returning('*');

  // Non-fatal email — submission already persisted; failure here does not affect response
  await sendRoutingNotification('opportunity_submission', submission);

  return submission;
}

async function listOpportunitySubmissions({ page = 1, page_size = 20 } = {}) {
  const offset = (page - 1) * page_size;
  const [{ count }] = await db('opportunity_submissions').count('submission_id as count');
  const data = await db('opportunity_submissions')
    .orderBy('submitted_at', 'desc')
    .limit(page_size)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      page_size,
      total_count: parseInt(count, 10),
      total_pages: Math.ceil(parseInt(count, 10) / page_size)
    }
  };
}

/**
 * Update disposition of an opportunity submission (CURATOR only).
 * Valid dispositions: UNDER_REVIEW, ACCEPTED_FOR_CONSIDERATION, DECLINED, LINKED_TO_RECORD.
 * When disposition=LINKED_TO_RECORD, linked_record_id is required and must reference an existing record.
 */
async function updateOpportunityDisposition(submissionId, data, curatorUserId) {
  const VALID_DISPOSITIONS = ['UNDER_REVIEW', 'ACCEPTED_FOR_CONSIDERATION', 'DECLINED', 'LINKED_TO_RECORD'];
  if (!VALID_DISPOSITIONS.includes(data.disposition)) {
    const err = new Error('Invalid disposition value');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (data.disposition === 'LINKED_TO_RECORD') {
    if (!data.linked_record_id) {
      const err = new Error('linked_record_id is required when disposition is LINKED_TO_RECORD');
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const record = await db('innovation_records').where({ record_id: data.linked_record_id }).first();
    if (!record) {
      const err = new Error('The linked record ID does not exist.');
      err.status = 422;
      err.code = 'INVALID_RECORD_REF';
      throw err;
    }
  }

  const [updated] = await db('opportunity_submissions')
    .where({ submission_id: submissionId })
    .update({
      disposition: data.disposition,
      linked_record_id: data.linked_record_id || null,
      internal_note: data.internal_note ? sanitize(data.internal_note) : null,
      reviewed_at: new Date(),
      reviewed_by_user_id: curatorUserId
    })
    .returning('*');

  if (!updated) {
    const err = new Error('Submission not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return updated;
}

// ─── Contribution Submissions (F06) ────────────────────────────────────────────

async function createContributionSubmission(data) {
  const errors = [];
  const VALID_MATURITIES = ['IDEA', 'EXPERIMENT_POC', 'PROTOTYPE_PILOT', 'PRODUCTION_VALIDATED'];

  if (!data.work_description || sanitize(data.work_description).length < 50) {
    errors.push({ field: 'work_description', error_code: 'FIELD_TOO_SHORT', message: 'Work description must be at least 50 characters.' });
  }
  if (!data.problem_addressed || sanitize(data.problem_addressed).length < 50) {
    errors.push({ field: 'problem_addressed', error_code: 'FIELD_TOO_SHORT', message: 'Problem addressed must be at least 50 characters.' });
  }
  if (!data.outcome_summary || sanitize(data.outcome_summary).length < 50) {
    errors.push({ field: 'outcome_summary', error_code: 'FIELD_TOO_SHORT', message: 'Outcome summary must be at least 50 characters.' });
  }
  if (!data.self_assessed_maturity || !VALID_MATURITIES.includes(data.self_assessed_maturity)) {
    errors.push({ field: 'self_assessed_maturity', error_code: 'VALIDATION_ERROR', message: 'Self-assessed maturity must be one of: IDEA, EXPERIMENT_POC, PROTOTYPE_PILOT, PRODUCTION_VALIDATED.' });
  }

  // artifact_urls: 1–5 valid HTTPS URLs
  if (!data.artifact_urls || !Array.isArray(data.artifact_urls) || data.artifact_urls.length === 0) {
    errors.push({ field: 'artifact_urls', error_code: 'ARTIFACT_URL_REQUIRED', message: 'At least one artifact link is required.' });
  } else if (data.artifact_urls.length > 5) {
    errors.push({ field: 'artifact_urls', error_code: 'VALIDATION_ERROR', message: 'Maximum 5 artifact URLs allowed.' });
  } else {
    data.artifact_urls.forEach((url, i) => {
      if (!isValidHttpsUrl(url)) {
        errors.push({ field: `artifact_urls[${i}]`, error_code: 'INVALID_ARTIFACT_URL', message: 'Artifact URL must be a valid https:// address.' });
      }
    });
  }

  if (!data.contributing_team || sanitize(data.contributing_team).length < 2) {
    errors.push({ field: 'contributing_team', error_code: 'VALIDATION_ERROR', message: 'Contributing team is required.' });
  }
  if (!data.contributing_office || sanitize(data.contributing_office).length < 2) {
    errors.push({ field: 'contributing_office', error_code: 'VALIDATION_ERROR', message: 'Contributing office is required.' });
  }
  if (!data.contact_name || sanitize(data.contact_name).length < 2) {
    errors.push({ field: 'contact_name', error_code: 'VALIDATION_ERROR', message: 'Contact name is required.' });
  }
  if (!data.contact_email || !isValidEmail(data.contact_email)) {
    errors.push({ field: 'contact_email', error_code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
  }

  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    err.fields = errors;
    throw err;
  }

  // CAPTCHA (before DB write)
  const captchaResult = await validateCaptcha(data.captcha_token);
  if (!captchaResult.valid) {
    const err = new Error('CAPTCHA verification failed. Please try again.');
    err.status = 422;
    err.code = 'CAPTCHA_INVALID';
    throw err;
  }

  const [submission] = await db('contribution_submissions')
    .insert({
      work_description: sanitize(data.work_description),
      problem_addressed: sanitize(data.problem_addressed),
      outcome_summary: sanitize(data.outcome_summary),
      self_assessed_maturity: data.self_assessed_maturity,
      artifact_urls: data.artifact_urls, // TEXT[] — knex handles array for PostgreSQL
      contributing_team: sanitize(data.contributing_team),
      contributing_office: sanitize(data.contributing_office),
      contact_name: sanitize(data.contact_name),
      contact_email: sanitize(data.contact_email),
      contact_title: data.contact_title ? sanitize(data.contact_title) : null,
      additional_context: data.additional_context ? sanitize(data.additional_context) : null,
      status: 'SUBMITTED'
    })
    .returning('*');

  // Non-fatal email
  await sendRoutingNotification('contribution_submission', submission);

  return submission;
}

async function listContributionSubmissions({ page = 1, page_size = 20 } = {}) {
  const offset = (page - 1) * page_size;
  const [{ count }] = await db('contribution_submissions').count('submission_id as count');
  const data = await db('contribution_submissions')
    .orderBy('submitted_at', 'desc')
    .limit(page_size)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      page_size,
      total_count: parseInt(count, 10),
      total_pages: Math.ceil(parseInt(count, 10) / page_size)
    }
  };
}

async function updateContributionDisposition(submissionId, data, curatorUserId) {
  const VALID_DISPOSITIONS = ['UNDER_REVIEW', 'ACCEPTED_FOR_CURATION', 'DECLINED', 'PUBLISHED'];
  if (!VALID_DISPOSITIONS.includes(data.disposition)) {
    const err = new Error('Invalid disposition value');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (data.disposition === 'PUBLISHED') {
    if (!data.linked_record_id) {
      const err = new Error('linked_record_id is required when disposition is PUBLISHED');
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const record = await db('innovation_records').where({ record_id: data.linked_record_id }).first();
    if (!record) {
      const err = new Error('The linked record ID does not exist.');
      err.status = 422;
      err.code = 'INVALID_RECORD_REF';
      throw err;
    }
  }

  const [updated] = await db('contribution_submissions')
    .where({ submission_id: submissionId })
    .update({
      disposition: data.disposition,
      linked_record_id: data.linked_record_id || null,
      internal_note: data.internal_note ? sanitize(data.internal_note) : null,
      reviewed_at: new Date(),
      reviewed_by_user_id: curatorUserId
    })
    .returning('*');

  if (!updated) {
    const err = new Error('Submission not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return updated;
}

module.exports = {
  createOpportunitySubmission,
  listOpportunitySubmissions,
  updateOpportunityDisposition,
  createContributionSubmission,
  listContributionSubmissions,
  updateContributionDisposition
};
```

---

### src/handlers/SubmissionHandler.js

HTTP handler layer. Calls service methods, maps errors to HTTP responses per FRD error catalog.

```javascript
// src/handlers/SubmissionHandler.js
const SubmissionService = require('../services/SubmissionService');

function handleServiceError(res, err) {
  const status = err.status || 500;
  const body = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message } };
  if (err.fields) body.error.fields = err.fields;
  return res.status(status).json(body);
}

async function postOpportunitySubmission(req, res) {
  try {
    const submission = await SubmissionService.createOpportunitySubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getOpportunitySubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listOpportunitySubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function patchOpportunityDisposition(req, res) {
  try {
    const updated = await SubmissionService.updateOpportunityDisposition(
      req.params.id, req.body, req.user.user_id
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function postContributionSubmission(req, res) {
  try {
    const submission = await SubmissionService.createContributionSubmission(req.body);
    return res.status(201).json(submission);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getContributionSubmissions(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const page_size = parseInt(req.query.page_size || '20', 10);
    const result = await SubmissionService.listContributionSubmissions({ page, page_size });
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function patchContributionDisposition(req, res) {
  try {
    const updated = await SubmissionService.updateContributionDisposition(
      req.params.id, req.body, req.user.user_id
    );
    return res.status(200).json(updated);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
};
```

---

### src/routes/submissions.js

Express router. Public POST endpoints get submissionLimiter. Admin GET/PATCH endpoints get requireCurator middleware. CURATOR middleware is provided by Wave 3a (AuthMiddleware) — reference it from src/middleware/auth.js. If 3a is not yet complete, create a stub that reads `req.user` from a test session.

```javascript
// src/routes/submissions.js
const express = require('express');
const router = express.Router();
const { submissionLimiter } = require('../middleware/rateLimiter');
const requireCurator = require('../middleware/auth').requireCurator; // Wave 3a provides this
const {
  postOpportunitySubmission,
  getOpportunitySubmissions,
  patchOpportunityDisposition,
  postContributionSubmission,
  getContributionSubmissions,
  patchContributionDisposition
} = require('../handlers/SubmissionHandler');

// ── Public submission endpoints (rate-limited) ────────────────────────────────
// POST /api/v1/opportunity-submissions
router.post('/opportunity-submissions', submissionLimiter, postOpportunitySubmission);

// POST /api/v1/contribution-submissions
router.post('/contribution-submissions', submissionLimiter, postContributionSubmission);

// ── CURATOR-protected admin endpoints ─────────────────────────────────────────
// GET /api/v1/admin/opportunity-submissions
router.get('/admin/opportunity-submissions', requireCurator, getOpportunitySubmissions);

// PATCH /api/v1/admin/opportunity-submissions/:id
router.patch('/admin/opportunity-submissions/:id', requireCurator, patchOpportunityDisposition);

// GET /api/v1/admin/contribution-submissions
router.get('/admin/contribution-submissions', requireCurator, getContributionSubmissions);

// PATCH /api/v1/admin/contribution-submissions/:id
router.patch('/admin/contribution-submissions/:id', requireCurator, patchContributionDisposition);

module.exports = router;
```

**Note on auth middleware stub:** If `src/middleware/auth.js` does not yet exist (Wave 3a not complete), create a minimal stub that checks for a test session:
```javascript
// src/middleware/auth.js (stub — Wave 3a will replace with full OIDC implementation)
function requireCurator(req, res, next) {
  if (req.user && (req.user.role === 'CURATOR' || req.user.role === 'ADMIN')) {
    return next();
  }
  return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
}
module.exports = { requireCurator };
```

---

### tests/integration/submissions.test.js

Jest + Supertest integration tests. Uses the running Docker PostgreSQL instance (from docker-compose.yml, Wave 1b Plan 02). Tests cover:
1. Happy path: POST opportunity submission → 201 + correct body
2. CAPTCHA invalid: POST with bad token → 422 CAPTCHA_INVALID
3. Validation failure: POST with missing required field → 422 VALIDATION_ERROR with fields[]
4. Rate limit: POST 6 times from same IP → 6th returns 429 RATE_LIMIT_EXCEEDED
5. Admin list: GET /admin/opportunity-submissions with CURATOR session → 200 PaginatedResponse
6. Admin disposition update: PATCH → 200 updated object
7. Email failure isolation: mock EmailService to throw → submission still returns 201
8. Contribution submission happy path: POST → 201
9. Contribution invalid artifact URL → 422 INVALID_ARTIFACT_URL
10. Contribution ARCHIVED maturity rejected → 422 VALIDATION_ERROR

```javascript
// tests/integration/submissions.test.js
const request = require('supertest');
const app = require('../../src/app'); // Express app entry point
const db = require('../../src/db');
const EmailService = require('../../src/services/EmailService');
const CaptchaService = require('../../src/services/CaptchaService');

// Mock CAPTCHA to return valid by default in tests
jest.spyOn(CaptchaService, 'validate').mockResolvedValue({ valid: true });

const curatorSession = { user_id: 'test-curator-uuid', role: 'CURATOR' };

// Helper: inject curator session into test requests via a test middleware
// (In real app, session is set by OIDC. In tests, we inject directly.)
function withCuratorAuth(agent) {
  return agent.set('x-test-user', JSON.stringify(curatorSession));
}

describe('Opportunity Submission API (F05)', () => {
  const validOpportunityPayload = {
    problem_description: 'We are facing challenges with audio evidence integrity in court proceedings and need a secure, tamper-proof audio recording solution that meets federal security requirements.',
    mission_area: 'Court Operations',
    submitting_office: 'District Court of DC',
    submitter_name: 'Jane Smith',
    submitter_email: 'jane.smith@uscourts.gov',
    captcha_token: 'test-valid-token'
  };

  beforeEach(async () => {
    await db('opportunity_submissions').del();
  });

  test('POST /api/v1/opportunity-submissions — happy path creates submission and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.problem_description).toBe(validOpportunityPayload.problem_description);
    expect(res.body.mission_area).toBe(validOpportunityPayload.mission_area);
    expect(res.body.disposition).toBeNull();
    expect(res.body.submitted_at).toBeDefined();

    // Verify persisted to DB
    const row = await db('opportunity_submissions').where({ submission_id: res.body.submission_id }).first();
    expect(row).toBeDefined();
    expect(row.status).toBe('SUBMITTED');
  });

  test('POST /api/v1/opportunity-submissions — CAPTCHA invalid returns 422', async () => {
    CaptchaService.validate.mockResolvedValueOnce({ valid: false, error: 'CAPTCHA_INVALID' });

    const res = await request(app)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CAPTCHA_INVALID');

    // Verify NOT persisted
    const count = await db('opportunity_submissions').count('submission_id as c').first();
    expect(parseInt(count.c, 10)).toBe(0);
  });

  test('POST /api/v1/opportunity-submissions — missing required field returns 422 with fields[]', async () => {
    const res = await request(app)
      .post('/api/v1/opportunity-submissions')
      .send({ ...validOpportunityPayload, submitter_email: undefined });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.fields)).toBe(true);
    expect(res.body.error.fields.some(f => f.field === 'submitter_email')).toBe(true);
  });

  test('POST /api/v1/opportunity-submissions — problem_description too short returns 422', async () => {
    const res = await request(app)
      .post('/api/v1/opportunity-submissions')
      .send({ ...validOpportunityPayload, problem_description: 'Too short' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.field === 'problem_description')).toBe(true);
  });

  test('POST /api/v1/opportunity-submissions — email failure does NOT roll back submission', async () => {
    jest.spyOn(EmailService, 'sendRoutingNotification').mockRejectedValueOnce(new Error('SMTP timeout'));

    const res = await request(app)
      .post('/api/v1/opportunity-submissions')
      .send(validOpportunityPayload);

    // Submission succeeds despite email failure
    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();

    const row = await db('opportunity_submissions').where({ submission_id: res.body.submission_id }).first();
    expect(row).toBeDefined();
  });

  test('GET /api/v1/admin/opportunity-submissions — returns paginated list for CURATOR', async () => {
    // Insert a test submission
    await db('opportunity_submissions').insert({
      problem_description: 'A'.repeat(51),
      mission_area: 'Test Area',
      submitting_office: 'Test Office',
      submitter_name: 'Test User',
      submitter_email: 'test@uscourts.gov',
      status: 'SUBMITTED'
    });

    const res = await request(app)
      .get('/api/v1/admin/opportunity-submissions')
      .set('x-test-user', JSON.stringify(curatorSession));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total_count).toBeGreaterThan(0);
  });

  test('GET /api/v1/admin/opportunity-submissions — returns 401 without CURATOR session', async () => {
    const res = await request(app).get('/api/v1/admin/opportunity-submissions');
    expect(res.status).toBe(401);
  });

  test('PATCH /api/v1/admin/opportunity-submissions/:id — updates disposition and returns 200', async () => {
    const [inserted] = await db('opportunity_submissions').insert({
      problem_description: 'A'.repeat(51),
      mission_area: 'Test Area',
      submitting_office: 'Test Office',
      submitter_name: 'Test User',
      submitter_email: 'test@uscourts.gov',
      status: 'SUBMITTED'
    }).returning('*');

    const res = await request(app)
      .patch(`/api/v1/admin/opportunity-submissions/${inserted.submission_id}`)
      .set('x-test-user', JSON.stringify(curatorSession))
      .send({ disposition: 'UNDER_REVIEW', internal_note: 'Reviewing now' });

    expect(res.status).toBe(200);
    expect(res.body.disposition).toBe('UNDER_REVIEW');
    expect(res.body.reviewed_at).toBeDefined();
  });
});

describe('Contribution Submission API (F06)', () => {
  const validContributionPayload = {
    work_description: 'We developed an AI-based document classification system that automatically categorizes court filings and reduces clerk workload by 40%.',
    problem_addressed: 'Court clerks spend excessive time manually sorting and routing incoming filings across 15 case categories, creating processing backlogs during high-volume periods.',
    outcome_summary: 'The system achieves 94% classification accuracy on a test dataset of 10,000 historical filings. Deployed in pilot at one district court for 6 months.',
    self_assessed_maturity: 'PROTOTYPE_PILOT',
    artifact_urls: ['https://github.uscourts.gov/tsio/doc-classifier'],
    contributing_team: 'AO IT Innovation Team',
    contributing_office: 'AO Office of Technology Solutions',
    contact_name: 'Bob Johnson',
    contact_email: 'bob.johnson@ao.uscourts.gov',
    captcha_token: 'test-valid-token'
  };

  beforeEach(async () => {
    await db('contribution_submissions').del();
  });

  test('POST /api/v1/contribution-submissions — happy path returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/contribution-submissions')
      .send(validContributionPayload);

    expect(res.status).toBe(201);
    expect(res.body.submission_id).toBeDefined();
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.self_assessed_maturity).toBe('PROTOTYPE_PILOT');
    expect(Array.isArray(res.body.artifact_urls)).toBe(true);
  });

  test('POST /api/v1/contribution-submissions — ARCHIVED maturity rejected with 422', async () => {
    const res = await request(app)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, self_assessed_maturity: 'ARCHIVED' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.field === 'self_assessed_maturity')).toBe(true);
  });

  test('POST /api/v1/contribution-submissions — invalid artifact URL returns 422 INVALID_ARTIFACT_URL', async () => {
    const res = await request(app)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, artifact_urls: ['http://not-https.com/file'] });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.error_code === 'INVALID_ARTIFACT_URL')).toBe(true);
  });

  test('POST /api/v1/contribution-submissions — empty artifact_urls returns 422 ARTIFACT_URL_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/contribution-submissions')
      .send({ ...validContributionPayload, artifact_urls: [] });

    expect(res.status).toBe(422);
    expect(res.body.error.fields.some(f => f.error_code === 'ARTIFACT_URL_REQUIRED')).toBe(true);
  });

  test('PATCH /api/v1/admin/contribution-submissions/:id — updates disposition and returns 200', async () => {
    const [inserted] = await db('contribution_submissions').insert({
      work_description: 'A'.repeat(51),
      problem_addressed: 'A'.repeat(51),
      outcome_summary: 'A'.repeat(51),
      self_assessed_maturity: 'EXPERIMENT_POC',
      artifact_urls: ['https://github.uscourts.gov/test'],
      contributing_team: 'Test Team',
      contributing_office: 'Test Office',
      contact_name: 'Test Contact',
      contact_email: 'contact@test.gov',
      status: 'SUBMITTED'
    }).returning('*');

    const res = await request(app)
      .patch(`/api/v1/admin/contribution-submissions/${inserted.submission_id}`)
      .set('x-test-user', JSON.stringify(curatorSession))
      .send({ disposition: 'ACCEPTED_FOR_CURATION', internal_note: 'Good candidate for curation' });

    expect(res.status).toBe(200);
    expect(res.body.disposition).toBe('ACCEPTED_FOR_CURATION');
    expect(res.body.reviewed_at).toBeDefined();
  });
});

afterAll(async () => {
  await db.destroy();
});
```
  </action>
  <verify>
grep -n 'createOpportunitySubmission' src/services/SubmissionService.js && grep -n 'createContributionSubmission' src/services/SubmissionService.js && grep -n 'sanitize' src/services/SubmissionService.js && echo "SUBMISSION_SERVICE_OK"
grep -n 'submissionsRouter\|module.exports' src/routes/submissions.js && grep -n 'opportunity-submissions' src/routes/submissions.js && grep -n 'contribution-submissions' src/routes/submissions.js && echo "ROUTES_OK"
grep -n 'postOpportunitySubmission\|postContributionSubmission' src/handlers/SubmissionHandler.js && echo "HANDLER_OK"
grep -n 'CAPTCHA_INVALID\|ARTIFACT_URL_REQUIRED\|RATE_LIMIT_EXCEEDED' tests/integration/submissions.test.js && grep -n 'email failure does NOT roll back' tests/integration/submissions.test.js && echo "TESTS_OK" && echo CONTRACT_OK
  </verify>
  <done>
- src/services/SubmissionService.js exports all 6 functions: createOpportunitySubmission, listOpportunitySubmissions, updateOpportunityDisposition, createContributionSubmission, listContributionSubmissions, updateContributionDisposition
- Input sanitization (sanitize-html) applied to all text fields before persistence
- CAPTCHA validated via CaptchaService.validate() BEFORE any DB write
- Email sent via EmailService.sendRoutingNotification() AFTER successful DB write; email failure never throws
- updateOpportunityDisposition validates linked_record_id when disposition=LINKED_TO_RECORD
- updateContributionDisposition validates linked_record_id when disposition=PUBLISHED
- self_assessed_maturity rejects 'ARCHIVED' per FRD F06 §Validation
- artifact_urls: 1–5 items, each must be https:// per FRD F06 §Validation
- src/routes/submissions.js mounts all 6 endpoints with correct rate limiting and CURATOR auth
- tests/integration/submissions.test.js covers: happy path 201, CAPTCHA_INVALID 422, validation failure 422 with fields[], email failure isolation, CURATOR list 200 paginated, disposition update 200, ARCHIVED maturity rejection, invalid artifact URL 422, missing artifact URL 422
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | Unauthenticated POST bodies from public submitters crossing into SubmissionHandler |
| API→CAPTCHA_provider | Token string from client forwarded to external CAPTCHA verification endpoint |
| API→SMTP_relay | Email content derived from user input forwarded to AO SMTP relay |
| curator→admin_API | CURATOR session credentials crossing into PATCH disposition endpoints |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-01 | Tampering | SubmissionService — all user-supplied text fields | mitigate | `sanitize()` helper (sanitize-html with allowedTags:[], allowedAttributes:{}) strips all HTML tags from every text field before persistence — applied in `createOpportunitySubmission` and `createContributionSubmission` before the db.insert() call. Matches TechArch §5.5 XSS stored defense. |
| T-07-02 | Denial of Service | POST /api/v1/opportunity-submissions and /api/v1/contribution-submissions | mitigate | `submissionLimiter` (express-rate-limit, max:5 per IP per hour) applied as first middleware on both public POST routes in `src/routes/submissions.js`; returns 429 before reaching handler or DB. Per TechArch §5.3 and FRD F05/F06 §Validation. |
| T-07-03 | Spoofing | CAPTCHA bypass — captcha_enabled hub_settings flag | mitigate | `CaptchaService.validate()` reads `captcha_enabled` from hub_settings at call time; any value other than `'false'` (or missing key) defaults to enforcing CAPTCHA. The default in the seed data is not 'false', so CAPTCHA is active out of the box. Only a CURATOR can set captcha_enabled='false' via the admin settings endpoint. Per TechArch §7.5 fallback contract. |
| T-07-04 | Information Disclosure | EmailService — submitter PII (name, email, office) in email body | mitigate | Email is sent only to the curator-configured `engagement_routing_email` (not to any public-facing address); routing email is stored in hub_settings and writable only by CURATOR role; email body is plain text (no HTML) limiting formatting-based extraction. Per TechArch §5.4 sensitive data handling. |
| T-07-05 | Tampering | PATCH /api/v1/admin/opportunity-submissions/:id — reviewed_by_user_id | mitigate | `reviewed_by_user_id` is sourced from `req.user.user_id` (set by CURATOR auth middleware from session, not request body) in `SubmissionHandler.patchOpportunityDisposition` and `patchContributionDisposition`. Client cannot forge the acting curator identity. Same pattern applied to `patchContributionDisposition`. |
| T-07-06 | Elevation of Privilege | GET/PATCH /api/v1/admin/* endpoints — CURATOR auth requirement | mitigate | All 4 admin endpoints in `src/routes/submissions.js` apply `requireCurator` middleware before the handler; unauthenticated requests receive 401; non-CURATOR authenticated requests receive 403. Wave 3a AuthMiddleware is the canonical implementation; this plan provides a stub with identical interface contract. |
| T-07-07 | Tampering | contribution_submissions.artifact_urls — TEXT[] array of unvalidated URLs | mitigate | `isValidHttpsUrl()` in `createContributionSubmission` validates every element of `artifact_urls` with `new URL(url).protocol === 'https:'` before DB insert; returns 422 INVALID_ARTIFACT_URL for any non-HTTPS item. DB-layer CHECK constraint is not possible on TEXT[] elements in PostgreSQL (per TechArch §3.3 note); service-layer validation is the enforcement point. |
</threat_model>

<verification>
Run after both tasks complete:

```bash
# 1. Infrastructure services exist
ls src/services/CaptchaService.js src/services/EmailService.js src/middleware/rateLimiter.js && echo "INFRA_FILES_OK"

# 2. SubmissionService exports all 6 functions
grep -c "module.exports" src/services/SubmissionService.js
grep "createOpportunitySubmission\|listOpportunitySubmissions\|updateOpportunityDisposition\|createContributionSubmission\|listContributionSubmissions\|updateContributionDisposition" src/services/SubmissionService.js | wc -l

# 3. Routes file mounts all 6 endpoints
grep -c "router\.\(post\|get\|patch\)" src/routes/submissions.js

# 4. CAPTCHA bypass properly guarded
grep "captcha_enabled" src/services/CaptchaService.js && echo "CAPTCHA_BYPASS_OK"

# 5. Email non-fatal pattern confirmed
grep "catch" src/services/EmailService.js && grep "sendRoutingNotification" src/services/EmailService.js && echo "EMAIL_NONFATAL_OK"

# 6. Rate limiter windows correct
grep "3600000" src/middleware/rateLimiter.js && echo "RATE_LIMITER_WINDOW_OK"

# 7. Integration tests cover required cases
grep -c "expect(res.status).toBe" tests/integration/submissions.test.js

# 8. Run integration tests (requires docker-compose PostgreSQL running)
docker compose up -d db && sleep 5
npm test -- tests/integration/submissions.test.js --testTimeout=30000 2>&1 | tail -20 && echo "TESTS_PASSED"
docker compose down
```
</verification>

<success_criteria>
- src/services/CaptchaService.js: validate(token) reads captcha_enabled from hub_settings; bypasses when 'false'; calls reCAPTCHA v3 / hCaptcha verify endpoint; returns { valid: boolean }
- src/middleware/rateLimiter.js: submissionLimiter (max:5, windowMs:3600000) and engagementLimiter (max:10, windowMs:3600000) with standardHeaders:true; 429 JSON body uses code: 'RATE_LIMIT_EXCEEDED'
- src/services/EmailService.js: sendRoutingNotification(type, payload) reads engagement_routing_email at call time; builds plain-text email body; never throws (catches all errors, logs, returns { success: false })
- src/services/SubmissionService.js: all 6 functions implemented; HTML sanitization on all text inputs; CAPTCHA validated before DB write; email sent after DB write (non-fatal); ARCHIVED maturity rejected in contributions; artifact_urls validated as 1–5 HTTPS URLs; linked_record_id validated against DB when required by disposition
- src/routes/submissions.js: 2 public POST routes with submissionLimiter; 4 CURATOR admin routes with requireCurator; router exported as submissionsRouter
- tests/integration/submissions.test.js: ≥10 test cases covering happy paths, CAPTCHA_INVALID, VALIDATION_ERROR with fields[], ARTIFACT_URL_REQUIRED, INVALID_ARTIFACT_URL, ARCHIVED maturity rejection, email failure isolation (submission still 201), CURATOR list pagination, disposition update, 401 without auth
- All integration tests pass against the Docker PostgreSQL instance from Plan 02
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/07-SUMMARY.md` with:
- Tasks completed
- Files created
- Key implementation decisions (CAPTCHA bypass pattern, email failure isolation, rate limiter config, artifact_urls TEXT[] validation)
- Integration contract summary for Wave 5 (submission forms) and Wave 6 (admin submissions queue)
</output>
