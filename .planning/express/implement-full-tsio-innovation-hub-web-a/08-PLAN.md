---
phase: implement-full-tsio-innovation-hub-web-a
plan: 08
type: execute
wave: 3
depends_on: [1]
files_modified:
  - src/services/engagement.service.js
  - src/repositories/engagement.repository.js
  - src/handlers/engagement.handler.js
  - src/services/settings.service.js
  - src/repositories/settings.repository.js
  - src/handlers/settings.handler.js
  - src/routes/engagement.routes.js
  - src/routes/settings.routes.js
  - tests/integration/engagement.test.js
  - tests/integration/settings.test.js
autonomous: true

features:
  implements: ["F7", "F8"]
  depends_on: ["F5", "F6"]
  enables: ["F7", "F8"]

must_haves:
  truths:
    - "POST /api/v1/engagement-requests (PUBLIC) validates request_type is configured on the target record's record_engagement_options, validates target record publication_state = PUBLISHED, applies IP rate limit (10/hour), validates captcha_token server-side, inserts into engagement_requests table, triggers EmailService (non-fatal), returns 201 with EngagementRequest object"
    - "GET /api/v1/admin/engagement-requests (CURATOR) returns paginated list of engagement requests with optional filters (record_id, request_type, status, date range); PATCH /api/v1/admin/engagement-requests/{id} (CURATOR) updates status (SUBMITTED|IN_PROGRESS|COMPLETED|NO_ACTION) and optional curator_note"
    - "GET /api/v1/admin/settings (CURATOR) returns all hub_settings rows as array of HubSetting objects; PUT /api/v1/admin/settings (CURATOR) accepts HubSettingsBulkUpdateRequest, validates engagement_routing_email is non-blank valid email, writes updated key-value pairs to hub_settings table"
    - "EngagementService returns 404 RECORD_NOT_FOUND when record_id is non-published or non-existent; returns 422 INVALID_ENGAGEMENT_TYPE when request_type not in the target record's configured engagement_options"
    - "SettingsService validates email format for engagement_routing_email; invalid format returns 422 INVALID_EMAIL; blank value returns 422 VALIDATION_ERROR"
    - "Integration tests cover: engagement happy-path 201, record-not-published 404, type-not-configured 422, rate-limit 429, settings GET all, settings PATCH engagement_routing_email valid, settings PATCH invalid email 422"
  artifacts:
    - path: "src/services/engagement.service.js"
      provides: "EngagementService: createEngagementRequest, listEngagementRequests, updateEngagementRequestStatus"
      exports: ["createEngagementRequest", "listEngagementRequests", "updateEngagementRequestStatus"]
    - path: "src/services/settings.service.js"
      provides: "SettingsService: getAllSettings, updateSettings, getSettingByKey"
      exports: ["getAllSettings", "updateSettings", "getSettingByKey"]
    - path: "src/handlers/engagement.handler.js"
      provides: "EngagementHandler: POST /api/v1/engagement-requests, GET /api/v1/admin/engagement-requests, PATCH /api/v1/admin/engagement-requests/:id"
    - path: "src/handlers/settings.handler.js"
      provides: "SettingsHandler: GET /api/v1/admin/settings, PUT /api/v1/admin/settings"
    - path: "tests/integration/engagement.test.js"
      provides: "Integration tests for all engagement endpoints (happy path + error cases)"
    - path: "tests/integration/settings.test.js"
      provides: "Integration tests for all settings endpoints (happy path + error cases)"
  key_links:
    - from: "EngagementHandler POST /api/v1/engagement-requests"
      to: "record_engagement_options table"
      via: "EngagementRepository.getConfiguredOptions(record_id) — validates request_type is in the configured set"
      pattern: "getConfiguredOptions|record_engagement_options"
    - from: "EngagementHandler POST /api/v1/engagement-requests"
      to: "innovation_records.publication_state"
      via: "EngagementRepository.getRecordPublicationState(record_id) — must equal PUBLISHED"
      pattern: "publication_state.*PUBLISHED|getRecordPublicationState"
    - from: "SettingsService.updateSettings"
      to: "hub_settings table"
      via: "SettingsRepository.upsert(setting_key, setting_value) — key-value write"
      pattern: "hub_settings|SettingsRepository"
    - from: "EmailService"
      to: "SettingsService.getSettingByKey('engagement_routing_email')"
      via: "Read routing address at send time (not cached at startup) per TechArch §2.1"
      pattern: "engagement_routing_email|getSettingByKey"

integration_contracts:
  requires:
    - from_plan: "02"
      artifact: "db/migrations/002_supporting_tables.sql"
      exports: ["engagement_requests", "hub_settings"]
      verify: "grep -n 'CREATE TABLE engagement_requests' db/migrations/002_supporting_tables.sql && grep -n 'CREATE TABLE hub_settings' db/migrations/002_supporting_tables.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/migrations/001_core_content_tables.sql"
      exports: ["record_engagement_options", "innovation_records"]
      verify: "grep -n 'CREATE TABLE.*record_engagement_options' db/migrations/001_core_content_tables.sql && grep -n 'CREATE TABLE.*innovation_records' db/migrations/001_core_content_tables.sql && echo CONTRACT_OK"
  provides:
    - artifact: "src/services/engagement.service.js"
      exports: ["createEngagementRequest", "listEngagementRequests", "updateEngagementRequestStatus"]
      shape: |
        // POST /api/v1/engagement-requests — PUBLIC
        createEngagementRequest(body: EngagementRequestCreateRequest, ipAddress: string): Promise<EngagementRequest>
        // body: { request_type, record_id, requestor_name, requestor_email, requestor_office,
        //         requestor_title?, description_of_interest, desired_next_step?, captcha_token }
        // Returns: EngagementRequest { request_id, record_id, request_type, requestor_name, requestor_email,
        //          requestor_office, requestor_title, description_of_interest, desired_next_step,
        //          status: 'SUBMITTED', curator_note: null, submitted_at, updated_at, updated_by_user_id: null }
        // Throws: 404 RECORD_NOT_FOUND if record non-existent or publication_state != PUBLISHED
        // Throws: 422 INVALID_ENGAGEMENT_TYPE if request_type not in record_engagement_options for that record
        // Throws: 422 CAPTCHA_INVALID if captcha_token fails server-side validation
        // Throws: 429 RATE_LIMIT_EXCEEDED if IP exceeds 10/hour

        // GET /api/v1/admin/engagement-requests — CURATOR
        listEngagementRequests(filters: { record_id?, request_type?, status?, from_date?, to_date?, page?, page_size? }): Promise<PaginatedResponse<EngagementRequest>>

        // PATCH /api/v1/admin/engagement-requests/:request_id — CURATOR
        updateEngagementRequestStatus(request_id: string, body: EngagementRequestStatusUpdateRequest): Promise<EngagementRequest>
        // body: { status: EngagementRequestStatus, curator_note?: string | null }
        // status enum: SUBMITTED | IN_PROGRESS | COMPLETED | NO_ACTION
      verify: "grep -n 'createEngagementRequest' src/services/engagement.service.js && grep -n 'listEngagementRequests' src/services/engagement.service.js && grep -n 'updateEngagementRequestStatus' src/services/engagement.service.js && echo CONTRACT_OK"
    - artifact: "src/services/settings.service.js"
      exports: ["getAllSettings", "updateSettings", "getSettingByKey"]
      shape: |
        // GET /api/v1/admin/settings — CURATOR
        getAllSettings(): Promise<HubSetting[]>
        // Returns array of: { setting_key, setting_value, description, updated_at }

        // PUT /api/v1/admin/settings — CURATOR (bulk update)
        updateSettings(body: HubSettingsBulkUpdateRequest, updatedByUserId: string): Promise<HubSetting[]>
        // body: { settings: Array<{ setting_key: string, setting_value: string }> }
        // Validates: engagement_routing_email must be non-blank valid email
        // Validates: catalog_default_page_size must be integer 6-50
        // Returns: updated HubSetting[] for all keys in request

        // Used by EmailService at send time (not cached at startup)
        getSettingByKey(setting_key: string): Promise<string | null>
      verify: "grep -n 'getAllSettings' src/services/settings.service.js && grep -n 'updateSettings' src/services/settings.service.js && grep -n 'getSettingByKey' src/services/settings.service.js && echo CONTRACT_OK"
---

<objective>
Implement **EngagementService** (POST /api/v1/engagement-requests — public form handler with PUBLISHED-only guard and 4 engagement types; GET + PATCH /api/v1/admin/engagement-requests for curator activity log) and **SettingsService** (GET /api/v1/admin/settings, PUT /api/v1/admin/settings with configurable routing email validation), plus their repositories, HTTP handlers, routes, and integration tests.

Purpose: Wave 5 (frontend engagement modal) and Wave 6 (admin settings page, engagement activity page) both consume these endpoints. EngagementService is the core mechanism for F7 (Engagement Routing) — every "Request Demo / Request Adoption Discussion / Request Technical Guidance / Request Briefing" action on a record page writes to `engagement_requests` and fires the routing email. SettingsService is the operational control surface for F8 (Administration) — the routing email must be configurable without a code deployment.

Output:
- `src/services/engagement.service.js` — EngagementService with PUBLISHED guard, engagement-type guard, rate limiting, CAPTCHA validation, EmailService trigger
- `src/repositories/engagement.repository.js` — EngagementRepository: insert, list with filters, update status
- `src/handlers/engagement.handler.js` — HTTP handlers for the 3 engagement endpoints
- `src/routes/engagement.routes.js` — Route registration (public + CURATOR-gated)
- `src/services/settings.service.js` — SettingsService with email format validation
- `src/repositories/settings.repository.js` — SettingsRepository: getAll, getByKey, upsert
- `src/handlers/settings.handler.js` — HTTP handlers for GET and PUT settings endpoints
- `src/routes/settings.routes.js` — Route registration (CURATOR-gated)
- `tests/integration/engagement.test.js` — Integration tests covering happy path + all error cases
- `tests/integration/settings.test.js` — Integration tests covering happy path + email validation failure
</objective>

<feature_dependencies>
Implements: F7: Engagement Routing (engagement_requests CRUD — POST /api/v1/engagement-requests with PUBLISHED guard, 4 engagement types, configurable email routing via hub_settings; GET + PATCH /api/v1/admin/engagement-requests for curator activity log), F8: Curation and Administration (GET /api/v1/admin/settings, PUT /api/v1/admin/settings — hub_settings read/write including engagement_routing_email validation)
Depends on: Wave 1 DB schema — engagement_requests table (02-PLAN provides), hub_settings table with 4 seed rows (02-PLAN provides), record_engagement_options table (01-PLAN provides), innovation_records.publication_state (01-PLAN provides). Wave 3a AuthMiddleware (plan 06) for CURATOR route guards.
Enables: F7: Wave 5 engagement modal forms (W5-b), Wave 6 admin engagement activity page and settings page (W6-c)
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
  <name>Task 1: Implement EngagementService — repository, service, handler, routes, and integration tests</name>
  <files>
    src/repositories/engagement.repository.js
    src/services/engagement.service.js
    src/handlers/engagement.handler.js
    src/routes/engagement.routes.js
    tests/integration/engagement.test.js
  </files>
  <action>
Implement the full EngagementService stack. Ground every decision in FRD §F07 and TechArch §2.1 EngagementService spec. Flag any conflict rather than silently diverging.

---

### 1. `src/repositories/engagement.repository.js`

Provides parameterized database operations on `engagement_requests` and `record_engagement_options`. No raw SQL string interpolation — use parameterized queries or the project's ORM/query builder.

```javascript
// Key methods (implement all):

// Get configured engagement option types for a record
// SELECT option_type FROM record_engagement_options WHERE record_id = $1
async getConfiguredOptions(recordId)
// Returns: string[] of EngagementOptionType values (e.g. ['REQUEST_DEMO', 'REQUEST_BRIEFING'])

// Get record publication state (checks existence + PUBLISHED status)
// SELECT publication_state FROM innovation_records WHERE record_id = $1 AND deleted_at IS NULL
async getRecordPublicationState(recordId)
// Returns: string (publication_state) or null if not found

// Insert a new engagement request
// INSERT INTO engagement_requests (record_id, request_type, requestor_name, requestor_email,
//   requestor_office, requestor_title, description_of_interest, desired_next_step, status)
// VALUES ($1, $2, ...) RETURNING *
async insertEngagementRequest(data)
// data: { record_id, request_type, requestor_name, requestor_email, requestor_office,
//         requestor_title?, description_of_interest, desired_next_step? }
// Returns: full engagement_requests row

// List engagement requests with optional filters + pagination
// Filters: record_id, request_type, status, from_date (submitted_at >=), to_date (submitted_at <=)
// ORDER BY submitted_at DESC with LIMIT/OFFSET
async listEngagementRequests(filters, page, pageSize)
// Returns: { data: EngagementRequest[], total_count: number }

// Update engagement request status and optional curator_note
// UPDATE engagement_requests SET status = $1, curator_note = $2, updated_at = NOW(),
//   updated_by_user_id = $3 WHERE request_id = $4 RETURNING *
async updateEngagementRequestStatus(requestId, status, curatorNote, updatedByUserId)
// Returns: updated engagement_requests row or null if not found
```

---

### 2. `src/services/engagement.service.js`

Business logic layer. All guards enforced here (PUBLISHED check, type check, rate limit, CAPTCHA). EmailService trigger is non-fatal — catch errors, log them, do not roll back the persisted request.

```javascript
// createEngagementRequest(body, ipAddress)
// ─── Guards (in order) ────────────────────────────────────
// 1. Rate limit check: IP-based, 10 requests/hour per IP.
//    If exceeded: throw { status: 429, code: 'RATE_LIMIT_EXCEEDED',
//                         message: 'Too many requests. Please wait before submitting again.' }
//    Set response headers: X-RateLimit-Limit: 10, X-RateLimit-Remaining: 0,
//                          X-RateLimit-Reset: <epoch>, Retry-After: 3600
//
// 2. CAPTCHA validation: Call CaptchaService.verify(captcha_token).
//    If invalid: throw { status: 422, code: 'CAPTCHA_INVALID',
//                        message: 'CAPTCHA verification failed. Please try again.' }
//
// 3. Input validation (Zod or Joi schema):
//    - requestor_name: 2-200 chars, required
//    - requestor_email: valid email format, required
//    - requestor_office: 2-200 chars, required
//    - description_of_interest: 20-2000 chars, required
//    - request_type: must be one of EngagementOptionType values
//    - record_id: UUID format, required
//    HTML-strip all text fields before validation and persistence (sanitize-html or DOMPurify).
//
// 4. Record existence + PUBLISHED guard:
//    const state = await EngagementRepository.getRecordPublicationState(body.record_id)
//    if (!state) throw { status: 404, code: 'RECORD_NOT_FOUND',
//                        message: 'The requested record was not found.' }
//    if (state !== 'PUBLISHED') throw same 404 (PUBLIC users must not know non-published records exist)
//
// 5. Engagement type configured-on-record guard:
//    const configured = await EngagementRepository.getConfiguredOptions(body.record_id)
//    if (!configured.includes(body.request_type))
//      throw { status: 422, code: 'INVALID_ENGAGEMENT_TYPE',
//               message: 'This engagement option is not available for the selected record.' }
//    NOTE per FRD §F07 §Validation: "request_type must be one of the engagement options
//    configured for the target record. A requestor cannot request a type not configured."
//    ALSO per FRD §F02b §Inputs: engagement_options values are ONLY:
//    REQUEST_DEMO, REQUEST_ADOPTION_DISCUSSION, REQUEST_TECHNICAL_GUIDANCE, REQUEST_BRIEFING
//    (SUBMIT_RELATED_PROBLEM is in the DB schema for record_engagement_options option_type but
//     the public engagement form only supports the 4 direct engagement types per FRD §F07.)
//    NOTE: The DB CHECK constraint on engagement_requests.request_type INCLUDES
//    SUBMIT_RELATED_PROBLEM (from TechArch DDL). Accept it at DB layer but document that
//    the public API only exposes the 4 engagement types for form submission.
//
// ─── Persist ──────────────────────────────────────────────
//    const request = await EngagementRepository.insertEngagementRequest({ ...body (without captcha_token) })
//
// ─── Email (non-fatal) ────────────────────────────────────
//    try {
//      const routingEmail = await SettingsService.getSettingByKey('engagement_routing_email')
//      await EmailService.sendEngagementNotification(routingEmail, request, recordTitle)
//    } catch (err) {
//      logger.error('EmailService failed for engagement request', { request_id: request.request_id, err })
//      // Do NOT re-throw — per TechArch §2.1: "Failure is non-fatal: logs error,
//      // submission/request record remains persisted"
//    }
//
//    return request  // { request_id, record_id, request_type, ...requestor fields,
//                    //   status: 'SUBMITTED', curator_note: null, submitted_at, updated_at, ... }

// listEngagementRequests(filters) — CURATOR only (enforced at route level)
// Delegates to EngagementRepository.listEngagementRequests(filters, page, pageSize)
// Returns PaginatedResponse<EngagementRequest>

// updateEngagementRequestStatus(requestId, body, curatorUserId) — CURATOR only
// Validates status is valid EngagementRequestStatus: SUBMITTED|IN_PROGRESS|COMPLETED|NO_ACTION
// Calls EngagementRepository.updateEngagementRequestStatus(...)
// If not found: throw { status: 404, code: 'ENGAGEMENT_REQUEST_NOT_FOUND' }
// Returns updated EngagementRequest
```

---

### 3. `src/handlers/engagement.handler.js`

HTTP handlers. Map service results and errors to HTTP responses. Follow TechArch §4.1 error envelope:
`{ "error": { "code": "...", "message": "..." } }`

```javascript
// POST /api/v1/engagement-requests — PUBLIC (no auth required)
async function createEngagementRequest(req, res) {
  // Extract IP from req.ip or req.headers['x-forwarded-for'] (handle proxy headers)
  // Call EngagementService.createEngagementRequest(req.body, ipAddress)
  // On success: res.status(201).json(engagementRequest)
  // On error: map to appropriate HTTP status from error.status
  // Rate limit headers: set X-RateLimit-* headers on 429 response
}

// GET /api/v1/admin/engagement-requests — CURATOR (auth middleware applied at route level)
async function listEngagementRequests(req, res) {
  // Parse query params: record_id, request_type, status, from_date, to_date, page, page_size
  // Call EngagementService.listEngagementRequests(filters)
  // res.status(200).json(paginatedResult)  // { data: [...], pagination: { page, page_size, total_count, total_pages } }
}

// PATCH /api/v1/admin/engagement-requests/:request_id — CURATOR
async function updateEngagementRequestStatus(req, res) {
  // Call EngagementService.updateEngagementRequestStatus(req.params.request_id, req.body, req.user.user_id)
  // On success: res.status(200).json(updatedRequest)
  // On 404: res.status(404).json({ error: { code: 'ENGAGEMENT_REQUEST_NOT_FOUND', message: '...' } })
}
```

---

### 4. `src/routes/engagement.routes.js`

Wire routes. Apply auth middleware from Wave 3a (AuthMiddleware) on CURATOR endpoints.

```javascript
// router.post('/api/v1/engagement-requests', rateLimiter({ max: 10, windowMs: 3600000 }), createEngagementRequest)
// router.get('/api/v1/admin/engagement-requests', authMiddleware, requireCurator, listEngagementRequests)
// router.patch('/api/v1/admin/engagement-requests/:request_id', authMiddleware, requireCurator, updateEngagementRequestStatus)
```

NOTE: If AuthMiddleware from Wave 3a (plan 06) is not yet implemented, create a stub that reads a `X-Test-User-Id` header for testing and TODO-marks it for Wave 3a completion. Do NOT block this plan on auth.

---

### 5. `tests/integration/engagement.test.js`

Integration tests using Jest + Supertest (per TechArch §6.2 testing stack). Boot the app instance in-process against the test database.

**Required test cases** (cover happy path + all FRD error cases):

```javascript
// Test suite: POST /api/v1/engagement-requests

describe('POST /api/v1/engagement-requests', () => {
  // Setup: seed a test PUBLISHED innovation_record with REQUEST_DEMO configured
  //        in record_engagement_options

  test('201 — valid request for configured type on PUBLISHED record', async () => {
    // POST body: valid EngagementRequestCreateRequest for REQUEST_DEMO
    // Expect: 201, response matches EngagementRequest shape
    //   { request_id (UUID), record_id, request_type: 'REQUEST_DEMO', status: 'SUBMITTED',
    //     submitted_at (ISO string), requestor_name, requestor_email, requestor_office }
    // Verify: row exists in engagement_requests table
  })

  test('404 RECORD_NOT_FOUND — record does not exist', async () => {
    // POST with record_id = random UUID (non-existent)
    // Expect: 404, { error: { code: 'RECORD_NOT_FOUND' } }
  })

  test('404 RECORD_NOT_FOUND — record exists but is DRAFT (not PUBLISHED)', async () => {
    // Seed a DRAFT record, POST engagement request for it
    // Expect: 404 (public users must not know the record exists)
  })

  test('422 INVALID_ENGAGEMENT_TYPE — request_type not configured on record', async () => {
    // Seed record with only REQUEST_DEMO configured
    // POST with request_type: 'REQUEST_BRIEFING'
    // Expect: 422, { error: { code: 'INVALID_ENGAGEMENT_TYPE' } }
  })

  test('422 CAPTCHA_INVALID — invalid captcha token', async () => {
    // Mock CaptchaService to return invalid
    // Expect: 422, { error: { code: 'CAPTCHA_INVALID' } }
  })

  test('429 RATE_LIMIT_EXCEEDED — exceeds 10/hour from same IP', async () => {
    // Send 11 requests from the same IP (mock IP header)
    // Expect: 429 on 11th, with Retry-After header
  })
})

// Test suite: GET /api/v1/admin/engagement-requests (CURATOR)
describe('GET /api/v1/admin/engagement-requests', () => {
  test('200 — returns paginated list of engagement requests', async () => {
    // Seed 3 engagement requests, GET with page=1&page_size=10
    // Expect: 200, { data: [...], pagination: { total_count: 3, ... } }
  })

  test('200 — filter by record_id returns only that record\'s requests', async () => {
    // Seed 2 requests for record A, 1 for record B
    // GET ?record_id=<record_A_id>
    // Expect: 200, data.length = 2
  })
})

// Test suite: PATCH /api/v1/admin/engagement-requests/:id (CURATOR)
describe('PATCH /api/v1/admin/engagement-requests/:id', () => {
  test('200 — updates status to IN_PROGRESS with curator_note', async () => {
    // Seed SUBMITTED request, PATCH with { status: 'IN_PROGRESS', curator_note: 'Following up' }
    // Expect: 200, response.status = 'IN_PROGRESS', response.curator_note = 'Following up'
  })

  test('404 — non-existent request_id', async () => {
    // PATCH random UUID
    // Expect: 404
  })
})
```

NOTE on CAPTCHA in tests: Use environment variable `CAPTCHA_BYPASS_TOKEN` (set to a test value in .env.test) that CaptchaService accepts as valid without an outbound HTTP call. This avoids network dependency in CI.
  </action>
  <verify>
grep -n 'createEngagementRequest' src/services/engagement.service.js && grep -n 'listEngagementRequests' src/services/engagement.service.js && grep -n 'updateEngagementRequestStatus' src/services/engagement.service.js && echo "SERVICE_EXPORTS_OK"
grep -n 'RECORD_NOT_FOUND' src/services/engagement.service.js && grep -n 'INVALID_ENGAGEMENT_TYPE' src/services/engagement.service.js && grep -n 'CAPTCHA_INVALID' src/services/engagement.service.js && echo "ERROR_CODES_OK"
grep -n 'publication_state' src/repositories/engagement.repository.js && grep -n 'getConfiguredOptions' src/repositories/engagement.repository.js && echo "PUBLISHED_GUARD_WIRED"
grep -n "engagement_routing_email" src/services/engagement.service.js && echo "ROUTING_EMAIL_WIRED"
npx jest tests/integration/engagement.test.js --reporter=list 2>&1 | tail -20 && echo "ENGAGEMENT_TESTS_PASSED"
  </verify>
  <done>
- `src/repositories/engagement.repository.js` implements: getConfiguredOptions, getRecordPublicationState, insertEngagementRequest, listEngagementRequests (with filters), updateEngagementRequestStatus — all using parameterized queries
- `src/services/engagement.service.js` enforces in order: rate-limit (10/hr per IP), CAPTCHA validation, input validation (Zod/Joi), PUBLISHED guard (404 for non-existent or non-PUBLISHED), engagement-type guard (422 INVALID_ENGAGEMENT_TYPE)
- EmailService call is wrapped in try/catch — email failure does NOT roll back the persisted request
- `src/handlers/engagement.handler.js` maps service results to 201 (create), 200 (list/update), 404, 422, 429 HTTP responses with TechArch error envelope
- `src/routes/engagement.routes.js` registers: POST /api/v1/engagement-requests (public + rate limiter), GET + PATCH /api/v1/admin/engagement-requests (CURATOR-gated)
- `tests/integration/engagement.test.js` passes: 201 happy path (verifies DB row), 404 record-not-found, 404 record-not-published (DRAFT), 422 INVALID_ENGAGEMENT_TYPE, 422 CAPTCHA_INVALID, 429 rate-limit with Retry-After header, curator list (200 + filter by record_id), curator PATCH (200 status update, 404 not-found)
  </done>
</task>

<feature_dependencies>
Implements: F7: Engagement Routing (POST /api/v1/engagement-requests with PUBLISHED guard + 4 engagement types; GET + PATCH /api/v1/admin/engagement-requests curator activity log)
Depends on: Wave 1 engagement_requests table (02-PLAN), record_engagement_options table (01-PLAN), innovation_records publication_state (01-PLAN)
Enables: Wave 5 engagement modal (W5-b), Wave 6 admin engagement activity page (W6-c)
</feature_dependencies>

<task type="auto">
  <name>Task 2: Implement SettingsService — repository, service, handler, routes, and integration tests</name>
  <files>
    src/repositories/settings.repository.js
    src/services/settings.service.js
    src/handlers/settings.handler.js
    src/routes/settings.routes.js
    tests/integration/settings.test.js
  </files>
  <action>
Implement the full SettingsService stack. Ground every decision in FRD §F08 §Hub Settings and TechArch §2.1 SettingsService spec. The routing email address must be readable by EmailService at send time — not cached at application startup.

---

### DB schema reference (from Wave 1 02-PLAN provides):

```sql
-- hub_settings (from TechArch §3.2):
CREATE TABLE hub_settings (
    setting_key         VARCHAR(100)    PRIMARY KEY,
    setting_value       TEXT            NOT NULL,
    description         TEXT,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by_user_id  UUID            REFERENCES users(user_id)
);
-- Seeded with 4 rows (engagement_routing_email, contact_display_email,
--   catalog_default_page_size, default_perspective)
```

---

### TypeScript interfaces (TechArch §4.2) — implement equivalent JS shapes:

```javascript
// HubSetting response shape:
// { setting_key: string, setting_value: string, description: string | null, updated_at: string }

// HubSettingsBulkUpdateRequest body shape:
// { settings: Array<{ setting_key: string, setting_value: string }> }
```

---

### 1. `src/repositories/settings.repository.js`

```javascript
// SELECT * FROM hub_settings ORDER BY setting_key
async getAllSettings()
// Returns: HubSetting[]

// SELECT setting_value FROM hub_settings WHERE setting_key = $1
async getSettingByKey(settingKey)
// Returns: string | null

// UPDATE hub_settings SET setting_value = $1, updated_at = NOW(), updated_by_user_id = $2
//   WHERE setting_key = $3 RETURNING *
// INSERT INTO hub_settings ... ON CONFLICT (setting_key) DO UPDATE ... (upsert for future keys)
async upsertSetting(settingKey, settingValue, updatedByUserId)
// Returns: updated HubSetting row
```

---

### 2. `src/services/settings.service.js`

```javascript
// getAllSettings()
// Calls SettingsRepository.getAllSettings()
// Returns: HubSetting[]

// updateSettings(body, updatedByUserId)
// body: { settings: Array<{ setting_key, setting_value }> }
//
// Per-key validation rules (FRD §F08b §Validation + TechArch §2.1 SettingsService):
//   engagement_routing_email:
//     - Must be non-blank
//     - Must be valid email format (regex or validator library)
//     - If invalid: throw { status: 422, code: 'INVALID_EMAIL',
//                           message: 'Routing email must be a valid email address.' }
//     - If blank: throw { status: 422, code: 'VALIDATION_ERROR',
//                         message: 'Routing email must not be blank.' }
//   catalog_default_page_size:
//     - Must be integer 6-50
//     - If out of range: throw { status: 422, code: 'VALIDATION_ERROR',
//                                message: 'Page size must be between 6 and 50.' }
//   contact_display_email:
//     - If provided and non-blank, must be valid email format
//   default_perspective:
//     - If provided, must be 'EXECUTIVE' or 'TECHNICAL'
//   Other keys: pass through without additional validation (forward-compatible)
//
// After all per-key validation passes, call SettingsRepository.upsertSetting for each item
// Returns: HubSetting[] for all updated keys

// getSettingByKey(settingKey)
// Called by EmailService at send time (not cached at startup)
// Calls SettingsRepository.getSettingByKey(settingKey)
// Returns: string | null
```

---

### 3. `src/handlers/settings.handler.js`

```javascript
// GET /api/v1/admin/settings — CURATOR
async function getAllSettings(req, res) {
  // Call SettingsService.getAllSettings()
  // res.status(200).json({ data: settings })  // array of HubSetting objects
}

// PUT /api/v1/admin/settings — CURATOR (bulk update)
async function updateSettings(req, res) {
  // body: { settings: [{ setting_key, setting_value }, ...] }
  // Call SettingsService.updateSettings(req.body, req.user.user_id)
  // On success: res.status(200).json({ data: updatedSettings })
  // On 422: res.status(422).json({ error: { code, message } })
}
```

---

### 4. `src/routes/settings.routes.js`

```javascript
// router.get('/api/v1/admin/settings', authMiddleware, requireCurator, getAllSettings)
// router.put('/api/v1/admin/settings', authMiddleware, requireCurator, updateSettings)
```

NOTE: Same auth middleware stub note applies as in Task 1 (use Wave 3a stub if not yet implemented).

---

### 5. `tests/integration/settings.test.js`

```javascript
describe('GET /api/v1/admin/settings', () => {
  test('200 — returns all hub_settings rows including seeded values', async () => {
    // GET /api/v1/admin/settings (as CURATOR)
    // Expect: 200, response.data is array, includes entry with setting_key = 'engagement_routing_email'
    // and setting_value = 'AOml_TSO_IRB_Team@ao.uscourts.gov' (from Wave 1 seed)
  })
})

describe('PUT /api/v1/admin/settings', () => {
  test('200 — valid bulk update including valid routing email', async () => {
    // PUT { settings: [{ setting_key: 'engagement_routing_email', setting_value: 'new@example.gov' }] }
    // Expect: 200, returned setting_value = 'new@example.gov'
    // Verify: subsequent GET returns updated value
  })

  test('422 INVALID_EMAIL — engagement_routing_email with invalid format', async () => {
    // PUT { settings: [{ setting_key: 'engagement_routing_email', setting_value: 'not-an-email' }] }
    // Expect: 422, { error: { code: 'INVALID_EMAIL' } }
  })

  test('422 VALIDATION_ERROR — engagement_routing_email blank', async () => {
    // PUT { settings: [{ setting_key: 'engagement_routing_email', setting_value: '' }] }
    // Expect: 422, { error: { code: 'VALIDATION_ERROR' } }
  })

  test('422 VALIDATION_ERROR — catalog_default_page_size out of range', async () => {
    // PUT { settings: [{ setting_key: 'catalog_default_page_size', setting_value: '3' }] }
    // Expect: 422 (must be 6-50)
  })

  test('200 — other setting keys pass through without extra validation', async () => {
    // PUT { settings: [{ setting_key: 'contact_display_email', setting_value: 'contact@example.gov' }] }
    // Expect: 200
  })
})
```

Context boot test: ensure the first integration test file that runs includes a context-boot assertion confirming the app starts and the database connection is live (if not already included in an earlier Wave 3 plan). If the project already has one from W3a (plan 06), reference it rather than duplicate.
  </action>
  <verify>
grep -n 'getAllSettings' src/services/settings.service.js && grep -n 'updateSettings' src/services/settings.service.js && grep -n 'getSettingByKey' src/services/settings.service.js && echo "SERVICE_EXPORTS_OK"
grep -n 'INVALID_EMAIL' src/services/settings.service.js && grep -n 'engagement_routing_email' src/services/settings.service.js && echo "EMAIL_VALIDATION_OK"
grep -n 'getSettingByKey' src/repositories/settings.repository.js && echo "REPO_GET_BY_KEY_OK"
npx jest tests/integration/settings.test.js --reporter=list 2>&1 | tail -20 && echo "SETTINGS_TESTS_PASSED"
  </verify>
  <done>
- `src/repositories/settings.repository.js` implements: getAllSettings, getSettingByKey, upsertSetting — all parameterized
- `src/services/settings.service.js` validates engagement_routing_email (non-blank valid email, 422 INVALID_EMAIL or VALIDATION_ERROR on failure), catalog_default_page_size (integer 6–50, 422 on out-of-range), default_perspective (EXECUTIVE|TECHNICAL), other keys pass through
- `getSettingByKey` is exported so EmailService can call it at send time without caching (per TechArch §2.1)
- `src/handlers/settings.handler.js` maps GET → 200 array, PUT → 200 updated array, 422 on validation error — TechArch error envelope
- `src/routes/settings.routes.js` registers GET + PUT /api/v1/admin/settings (both CURATOR-gated)
- `tests/integration/settings.test.js` passes: GET returns seeded engagement_routing_email row, PUT valid email 200, PUT invalid email 422 INVALID_EMAIL, PUT blank email 422 VALIDATION_ERROR, PUT page_size out of range 422, PUT other key 200
  </done>
</task>

<feature_dependencies>
Implements: F7: Engagement Routing (SettingsService manages engagement_routing_email — configurable without code deployment, readable by EmailService at send time), F8: Curation and Administration (GET /api/v1/admin/settings, PUT /api/v1/admin/settings for curator settings management)
Depends on: Wave 1 hub_settings table with 4 seed rows (02-PLAN provides)
Enables: Wave 5 engagement email routing via EmailService consuming getSettingByKey, Wave 6 admin settings page (W6-c)
</feature_dependencies>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API (POST /api/v1/engagement-requests) | Untrusted PUBLIC requestor data (requestor PII, description text, captcha token) entering the engagement handler — unauthenticated endpoint |
| client→API (PUT /api/v1/admin/settings) | Authenticated CURATOR-supplied setting values entering the settings handler — changes routing email address without code deploy |
| API→EmailService | Routing email address read from hub_settings and passed to SMTP relay at send time |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-08-01 | Spoofing | POST /api/v1/engagement-requests — unauthenticated, no session required | mitigate | CAPTCHA server-side validation in `EngagementService.createEngagementRequest` before any DB write; IP rate limit (10/hour) via express-rate-limit on the route; both guards enforced in service layer, not just UI |
| T-08-02 | Tampering | engagement_requests — requestor-supplied text fields (description_of_interest, desired_next_step) | mitigate | All text fields HTML-stripped via sanitize-html/DOMPurify before validation and persistence in `EngagementService.createEngagementRequest`; parameterized INSERT in `EngagementRepository.insertEngagementRequest` (no string interpolation into SQL) |
| T-08-03 | Information Disclosure | POST /api/v1/engagement-requests — PUBLISHED guard must not reveal existence of DRAFT/non-published records | mitigate | `EngagementService.createEngagementRequest` returns 404 `RECORD_NOT_FOUND` for both non-existent and non-PUBLISHED records — identical response prevents enumeration of draft record IDs; guard implemented in `EngagementRepository.getRecordPublicationState` + service branch |
| T-08-04 | Elevation of Privilege | GET + PATCH /api/v1/admin/engagement-requests — must be CURATOR-only | mitigate | `authMiddleware` + `requireCurator` applied on both routes in `src/routes/engagement.routes.js`; unauthenticated requests return 401; non-CURATOR authenticated sessions return 403 `ACCESS_DENIED` per TechArch §5.2 |
| T-08-05 | Tampering | PUT /api/v1/admin/settings — engagement_routing_email can be set to an attacker-controlled address | mitigate | `SettingsService.updateSettings` validates email format (must match RFC 5321 pattern via validator library) and rejects blank values with 422 before persisting; `updated_by_user_id` FK records which curator made the change for audit accountability; CURATOR role required on the route |
| T-08-06 | Information Disclosure | GET /api/v1/admin/settings — returns hub_settings including routing email address | mitigate | Route requires CURATOR session (`authMiddleware` + `requireCurator`); hub_settings is never exposed on any PUBLIC endpoint; TechArch §5.4 explicitly lists routing email as CURATOR-only |
| T-08-07 | Denial of Service | POST /api/v1/engagement-requests — unauthenticated write endpoint susceptible to flooding | mitigate | express-rate-limit at 10/hour per IP returns 429 with Retry-After: 3600 header before hitting the DB; CAPTCHA also required per request; both limits enforced server-side independently |
</threat_model>

<verification>
After both tasks complete:

```bash
# 1. Verify all service exports exist
grep -n 'createEngagementRequest\|listEngagementRequests\|updateEngagementRequestStatus' src/services/engagement.service.js && echo "ENGAGEMENT_SERVICE_OK"
grep -n 'getAllSettings\|updateSettings\|getSettingByKey' src/services/settings.service.js && echo "SETTINGS_SERVICE_OK"

# 2. Verify PUBLISHED guard wired correctly
grep -n 'publication_state\|PUBLISHED' src/repositories/engagement.repository.js && echo "PUBLISHED_GUARD_OK"

# 3. Verify INVALID_ENGAGEMENT_TYPE guard exists
grep -n 'INVALID_ENGAGEMENT_TYPE' src/services/engagement.service.js && echo "TYPE_GUARD_OK"

# 4. Verify email validation in SettingsService
grep -n 'INVALID_EMAIL\|engagement_routing_email' src/services/settings.service.js && echo "EMAIL_VALIDATION_OK"

# 5. Verify routes registered with auth guards
grep -n 'authMiddleware\|requireCurator' src/routes/engagement.routes.js && echo "ENGAGEMENT_AUTH_GUARD_OK"
grep -n 'authMiddleware\|requireCurator' src/routes/settings.routes.js && echo "SETTINGS_AUTH_GUARD_OK"

# 6. Verify EmailService called non-fatally (wrapped in try/catch)
grep -n 'try\|catch' src/services/engagement.service.js | grep -A2 'EmailService\|sendEngagement' && echo "EMAIL_NON_FATAL_OK"

# 7. Run integration tests
npx jest tests/integration/engagement.test.js tests/integration/settings.test.js --reporter=list 2>&1 | tail -30 && echo "ALL_INTEGRATION_TESTS_PASSED"
```
</verification>

<success_criteria>
- `POST /api/v1/engagement-requests` (PUBLIC): validates PUBLISHED guard (404 for non-published/non-existent), validates request_type is configured on target record (422 INVALID_ENGAGEMENT_TYPE), validates CAPTCHA (422 CAPTCHA_INVALID), enforces rate limit 10/hour per IP (429 with Retry-After), inserts to engagement_requests, fires EmailService non-fatally, returns 201 EngagementRequest
- `GET /api/v1/admin/engagement-requests` (CURATOR): returns PaginatedResponse<EngagementRequest> with filters (record_id, request_type, status, date range), page/page_size
- `PATCH /api/v1/admin/engagement-requests/:id` (CURATOR): updates status and curator_note, returns updated EngagementRequest, 404 on missing ID
- `GET /api/v1/admin/settings` (CURATOR): returns all hub_settings rows including seeded engagement_routing_email
- `PUT /api/v1/admin/settings` (CURATOR): validates engagement_routing_email (non-blank, valid email), validates catalog_default_page_size (6–50), returns 422 with INVALID_EMAIL/VALIDATION_ERROR on failure, persists valid values and returns updated array
- `SettingsService.getSettingByKey` exported and usable by EmailService at send time (no startup caching)
- All curator admin routes return 401/403 to unauthenticated/non-CURATOR requests
- All integration tests pass: engagement (201, 404×2, 422×2, 429, list, PATCH) + settings (GET, PUT valid, PUT invalid email, PUT blank, PUT page_size, PUT other key)
</success_criteria>

<output>
After completion, create `.planning/express/implement-full-tsio-innovation-hub-web-a/08-SUMMARY.md` with:
- Tasks completed
- Files created
- Key service decisions (PUBLISHED guard behavior, email non-fatal pattern, routing email read-at-send-time)
- Integration contract summary for Wave 5 and Wave 6 frontend consumption
</output>
