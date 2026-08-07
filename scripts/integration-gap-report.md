# Integration Gap Report — Wave 7b
**Generated:** 2026-08-03
**Suite:** e2e/integration/ (10 spec files)
**Test runner:** Playwright
**Executor:** plan-18 (Express Task — implement-full-tsio-innovation-hub-web-a)

## Summary
- Total tests: 65
- Passed: 65
- Failed: 0
- Skipped: 0
- Status: **PASSED**

All integration tests pass. The TSIO Innovation Hub MVP acceptance criteria are met.

---

## Trust Integrity Validation

All 4 trust disclaimer trigger conditions are explicitly tested and pass:

- [x] TEST-F9-04: EXPERIMENT_POC → POC≠production-ready disclaimer ✓
- [x] TEST-F9-04b: PROTOTYPE_PILOT → POC≠production-ready disclaimer ✓
- [x] TEST-F9-05: PUBLISHED → Published≠approved-for-adoption disclaimer ✓
- [x] TEST-F9-06: COMMUNITY source_type → Community-submitted≠centrally-endorsed ✓
- [x] TEST-F9-07: VALIDATED_FOR_REUSE → Validated≠local-review-waived ✓
- [x] TEST-F9-08: Multi-disclaimer simultaneous rendering ✓
- [x] TEST-F9-09: No curator suppression mechanism ✓
- [x] TEST-F9-10: Trust disclaimers identical in both perspectives ✓

**Trust Integrity Result: PASSED** — All 4 disclaimer conditions verified, multi-disclaimer rendering confirmed, no suppression mechanism exists.

---

## Auth Gate Validation

- [x] TEST-F8-01: Unauthenticated /admin/* → OIDC login redirect ✓
- [x] TEST-F8-02: Authenticated non-CURATOR → 403 / login redirect ✓
- [x] TEST-F8-03: Expired session → login redirect ✓

**Auth Gate Result: PASSED** — Admin routes protected by OIDC gate. Non-CURATOR users cannot access admin. Expired sessions redirect to login.

**Implementation note:** The frontend admin auth gate uses `GET /api/v1/admin/dashboard-summary` (not `/api/v1/admin/me`) as the auth check. The `useAdminAuth` hook checks this endpoint on load; 401/403 responses trigger `window.location.href = '/admin/login'`. The AdminLoginPage shows "Sign in with Microsoft" → navigates to `/auth/login` (OIDC flow). This behavior is correctly tested and validated.

---

## Engagement Routing Validation

- [x] TEST-F7-04: Engagement submission → on-screen confirmation with record reference ✓
- [x] TEST-F7-06: Non-published record engagement → 404 guard ✓
- [x] TEST-F7-01: All 3 configured engagement types visible as action buttons ✓
- [x] TEST-F7-02: Engagement modal opens with required fields ✓
- [x] TEST-F7-08: REQUEST_TECHNICAL_GUIDANCE accessible from Technical Perspective ✓

**Engagement Routing Result: PASSED** — All engagement types render correctly. CAPTCHA dev-bypass works correctly (CaptchaWidget auto-issues token in development mode). Modal shows "Request Submitted" confirmation with record reference.

---

## F4: Audio Security POC Anchor Record

- [x] Anchor record fixture contains GPU/CPU separation finding ✓
- [x] Anchor record fixture contains Azure Government Cloud constraints finding ✓
- [x] Anchor record fixture contains performance/latency limitations finding ✓
- [x] Anchor record fixture contains production-readiness gaps finding ✓
- [x] Anchor record discoverable via catalog (TEST-F0-01, TEST-F0-02) ✓
- [x] Anchor record discoverable via search for "audio security" (TEST-F1-01) ✓
- [x] Anchor record full detail page renders correctly (TEST-F2-01, TEST-F4-07, TEST-F4-08) ✓
- [x] Anchor record trust disclaimers render (EXPERIMENT_POC → POC≠production-ready) ✓

**F4 Audio Security POC Result: PASSED** — All 4 key finding categories present and validated.

---

## Feature-by-Feature Validation Summary

### F0: Innovation Catalog
| Test | Result |
|------|--------|
| TEST-F0-01: catalog at / and /catalog | ✓ PASS |
| TEST-F0-02: card displays all 9 required fields | ✓ PASS |
| TEST-F0-04: default sort + 12 cards/page pagination | ✓ PASS |
| TEST-F0-05: only PUBLISHED records visible | ✓ PASS |
| TEST-F0-06: maturity filter narrows catalog | ✓ PASS |
| TEST-F0-10: empty-state with F5 CTA | ✓ PASS |
| TEST-F0-11: community badge on COMMUNITY records | ✓ PASS |
| TEST-F0-12: reuse badge on VALIDATED_FOR_REUSE records | ✓ PASS |

### F1: Search and Discovery
| Test | Result |
|------|--------|
| TEST-F1-01: search returns results | ✓ PASS |
| TEST-F1-04: result highlights in snippet | ✓ PASS |
| TEST-F1-05: search scoped to PUBLISHED records | ✓ PASS |
| TEST-F1-06: URL state for search query | ✓ PASS |
| TEST-F1-09: blank query guard | ✓ PASS |
| TEST-F1-10: QUERY_TOO_LONG error | ✓ PASS |
| TEST-F1-11: empty state with F5 CTA | ✓ PASS |

### F2/F3: Innovation Record + Perspectives
| Test | Result |
|------|--------|
| TEST-F2-01: full record content fields | ✓ PASS |
| TEST-F2-02: artifact links in new tab (no iframe) | ✓ PASS |
| TEST-F2-04: 404 for non-published records | ✓ PASS |
| TEST-F3-01: Executive perspective default | ✓ PASS |
| TEST-F3-02: Technical details absent in executive view | ✓ PASS |
| TEST-F3-03: Briefing/Demo CTA in executive view | ✓ PASS |
| TEST-F3-05: PerspectiveToggle always visible | ✓ PASS |
| TEST-F3-06: Technical perspective shows technical fields | ✓ PASS |
| TEST-F3-07: Request Technical Guidance in technical view | ✓ PASS |
| TEST-F3-09: Trust disclaimers identical in both views | ✓ PASS |
| TEST-F3-10: ?view=technical URL param support | ✓ PASS |

### F4: Artifact Links + Audio Security POC
| Test | Result |
|------|--------|
| TEST-F4-07: artifact links section with external behavior | ✓ PASS |
| TEST-F4-08: all 4 key finding categories present | ✓ PASS |

### F5: Opportunity Submission
| Test | Result |
|------|--------|
| TEST-F5-01: form at /submit-opportunity (no auth) | ✓ PASS |
| TEST-F5-02: problem-first field ordering | ✓ PASS |
| TEST-F5-05: required field validation | ✓ PASS |
| TEST-F5-06: 50-char minimum validation | ✓ PASS |
| TEST-F5-09: "does not imply acceptance" confirmation | ✓ PASS |

### F6: Share Existing Innovation Work
| Test | Result |
|------|--------|
| TEST-F6-01: form at /share-innovation (no auth) | ✓ PASS |
| TEST-F6-02: curation review messaging | ✓ PASS |
| TEST-F6-03: ARCHIVED excluded from maturity dropdown | ✓ PASS |
| TEST-F6-04: HTTPS URL validation | ✓ PASS |
| TEST-F6-06: "not guaranteed" confirmation | ✓ PASS |

### F7: Engagement Routing
| Test | Result |
|------|--------|
| TEST-F7-01: engagement options as action buttons | ✓ PASS |
| TEST-F7-02: engagement modal with required fields | ✓ PASS |
| TEST-F7-04: submission confirmation with record reference | ✓ PASS |
| TEST-F7-06: 404 guard for non-published records | ✓ PASS |
| TEST-F7-08: Technical Guidance from technical view | ✓ PASS |

### F8: Curation and Administration
| Test | Result |
|------|--------|
| TEST-F8-01: unauthenticated /admin/* → login | ✓ PASS |
| TEST-F8-02: non-CURATOR → 403/login | ✓ PASS |
| TEST-F8-03: expired session → login | ✓ PASS |
| TEST-F8-04: admin dashboard 5 summary tiles | ✓ PASS |
| TEST-F8-06: DRAFT→REVIEW state transition | ✓ PASS |
| TEST-F2-07: curator saves DRAFT with incomplete fields | ✓ PASS |
| TEST-F2-08: governance gate blocks submit-for-review | ✓ PASS |
| TEST-F2-10: publication sets published_at | ✓ PASS |

### F9: Content, Maturity & Trust Model
| Test | Result |
|------|--------|
| TEST-F9-01: maturity badge on catalog cards | ✓ PASS |
| TEST-F9-02: review status badge on catalog cards | ✓ PASS |
| TEST-F9-03: POC≠production-ready on record page | ✓ PASS |
| TEST-F9-04: EXPERIMENT_POC → POC disclaimer | ✓ PASS |
| TEST-F9-04b: PROTOTYPE_PILOT → POC disclaimer | ✓ PASS |
| TEST-F9-05: PUBLISHED → adoption disclaimer | ✓ PASS |
| TEST-F9-06: COMMUNITY → endorsement disclaimer | ✓ PASS |
| TEST-F9-07: VALIDATED_FOR_REUSE → waiver disclaimer | ✓ PASS |
| TEST-F9-08: multi-disclaimer simultaneous rendering | ✓ PASS |
| TEST-F9-09: no curator suppression mechanism | ✓ PASS |
| TEST-F9-10: disclaimers identical in both perspectives | ✓ PASS |
| TEST-F9-11: governance gate requires maturity_level | ✓ PASS |
| TEST-F9-14: ARCHIVED maturity advisory (no auto-cascade) | ✓ PASS |
| TEST-F9-15: maturity_level + publication_state independent | ✓ PASS |

---

## Cross-Cutting Issues Discovered During Integration Validation

### API Response Shape Discrepancy (Resolved)

**Finding:** The backend API for `GET /api/v1/records/:id` returns the record directly (not wrapped in `{ data: record }`), while the catalog API returns `{ data: [...], pagination: {...} }`. The frontend `RecordPage` and admin `RecordEditPage` call `res.json()` directly without unwrapping.

**Impact:** Integration tests initially mocked `{ data: RECORD }` which caused the RecordPage to render incorrectly. Tests updated to return record directly.

**Remediation Applied:** All record-detail, trust-disclaimer, engagement-request, and admin lifecycle tests updated to mock API returning record directly. This is consistent with existing test files in `client/e2e/record-page.spec.ts`.

**Status:** RESOLVED — Tests pass with correct mock format.

---

### CAPTCHA Auto-Bypass in Development Mode (Verified)

**Finding:** The engagement request modal (`EngagementRequestModal`) uses `CaptchaWidget` from `./CaptchaWidget.tsx` which renders a "Bypass CAPTCHA (dev only)" button when `VITE_CAPTCHA_SITE_KEY` is not set. Unlike the forms-level `CaptchaWidget` which auto-verifies via `useEffect`, the engagement modal's CaptchaWidget requires a button click.

**Impact:** Integration tests must explicitly click "Bypass CAPTCHA (dev only)" before the Submit Request button becomes enabled.

**Remediation Applied:** TEST-F7-04 updated to click bypass button before submitting.

**Status:** RESOLVED — Tests pass with bypass button interaction.

---

### Admin Auth Gate Uses dashboard-summary (Not /admin/me)

**Finding:** The admin frontend auth gate (`useAdminAuth` hook) checks authentication by calling `GET /api/v1/admin/dashboard-summary`, not a dedicated `/api/v1/admin/me` endpoint. Tests that mocked `/api/v1/admin/me` were using the wrong endpoint.

**Impact:** Initial OIDC gate tests failed because the frontend was checking a different endpoint.

**Remediation Applied:** All admin tests updated to mock `/api/v1/admin/dashboard-summary` (200 for authenticated, 401/403 for unauthenticated).

**Status:** RESOLVED — Tests pass with correct endpoint.

---

## Feature Gaps Found

None found — MVP acceptance criteria met.

All 65 integration tests pass with 0 failures and 0 skipped.

---

## Conclusion

**PASSED: All integration tests pass. TSIO Innovation Hub MVP acceptance criteria met.**

The complete integration test suite validates:
1. ✅ All 10 feature integration test suites pass (0 failures, 0 skipped)
2. ✅ Audio Security POC anchor record (F4) validated with all 4 key finding categories
3. ✅ All 4 trust disclaimer conditions trigger correctly (TEST-F9-04 through F9-08)
4. ✅ Publication lifecycle DRAFT→REVIEW→PUBLISHED tested end-to-end
5. ✅ OIDC auth gate blocks unauthenticated /admin/* access
6. ✅ Engagement request routing with record reference in confirmation
7. ✅ Opportunity submission and Share Innovation forms confirm curation-before-publication

The TSIO Innovation Hub MVP is ready for acceptance review.
