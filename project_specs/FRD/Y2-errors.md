---

## Y2: Cross-Feature Error Catalog

This document catalogs all error codes used across the TSIO Innovation Hub. Error responses follow the standard envelope defined in `Y1-api.md`:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": ["field_name"]   // present only for validation errors
  }
}
```

---

### HTTP Status Code Reference

| HTTP Status | Meaning in This System |
|-------------|------------------------|
| 200 | Success (including empty result sets — these are not errors) |
| 201 | Resource created successfully |
| 302 | Redirect (authentication flow) |
| 400 | Malformed request (bad syntax, missing required parameters) |
| 403 | Authenticated but not authorized (wrong role or insufficient permission) |
| 404 | Resource not found or not accessible to the requester's role |
| 409 | Conflict — the request cannot be applied in the current state |
| 422 | Unprocessable entity — request is well-formed but violates business rules or validation |
| 429 | Rate limit exceeded |
| 503 | Service temporarily unavailable |

---

### Error Code Catalog

#### Authentication & Authorization

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `ACCESS_DENIED` | 403 | F08 | Authenticated user does not have CURATOR role | Contact system administrator to request access |
| `SESSION_EXPIRED` | 302 | F08 | Session token has expired | Re-authenticate via identity provider |

---

#### Records (F02)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `RECORD_NOT_FOUND` | 404 | F00, F02, F03, F07 | Record does not exist, is not published (PUBLIC), or has been deleted | Verify the record ID; check if the record has been archived |
| `RECORD_UNAVAILABLE` | 503 | F02 | Record store temporarily unreachable | Retry after a brief delay |
| `PUBLICATION_GATE_FAILED` | 422 | F02, F08 | Curator attempted to publish with missing required fields | Review and complete all listed required fields |
| `INVALID_STATE_TRANSITION` | 422 | F02, F08 | State transition not allowed from current publication state | Check the publication lifecycle diagram; follow valid transitions |
| `EDIT_REQUIRES_CONFIRMATION` | 409 | F02, F08 | Curator attempted to edit a PUBLISHED record without confirming the resulting state change | Re-submit with a confirmation flag or use the admin interface confirmation dialog |
| `INVALID_SUPERSEDES_REF` | 422 | F02, F08 | `superseded_by_record_id` references a non-existent record | Provide a valid existing record ID |
| `DELETE_NOT_PERMITTED` | 422 | F08 | Curator attempted to delete a non-DRAFT record | Archive the record instead; only DRAFT records may be deleted |
| `KEY_FINDINGS_REQUIRED` | 422 | F02 | `key_findings` array is empty | Add at least one key finding |
| `INVALID_REVIEW_DATE` | 422 | F02 | `last_reviewed_date` is in the future | Set a date on or before today |
| `INVALID_ARTIFACT_URL` | 422 | F02, F04, F06 | Artifact URL is not a valid `https://` absolute URL | Provide a valid HTTPS URL |
| `INVALID_ENUM_VALUE` | 422 | F02, F09 | Field value is not a valid member of the required enum set | Use one of the defined enum values |

---

#### Search & Catalog (F00, F01)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `CATALOG_UNAVAILABLE` | 503 | F00 | Catalog data store temporarily unavailable | Retry after a brief delay |
| `SEARCH_UNAVAILABLE` | 503 | F01 | Search index service temporarily unavailable | Try browsing the catalog; retry search after a brief delay |
| `QUERY_TOO_LONG` | 400 | F01 | Query string exceeds 500 characters | Shorten the query to 500 characters or fewer |

---

#### Submissions (F05, F06)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `SUBMISSION_UNAVAILABLE` | 503 | F05, F06 | Submission service temporarily unavailable | Retry after a brief delay; contact I&R team directly if persistent |
| `CAPTCHA_INVALID` | 422 | F05, F06, F07 | CAPTCHA token is missing, expired, or invalid | Reload the page and complete the CAPTCHA again |
| `RATE_LIMIT_EXCEEDED` | 429 | F05, F06, F07 | Submission rate limit (5/hour for submissions, 10/hour for engagement) exceeded for this IP | Wait before submitting again |
| `ARTIFACT_URL_REQUIRED` | 422 | F06 | No artifact URLs provided on contribution submission | Include at least one valid artifact URL |
| `SUBMISSION_NOT_ACCEPTED` | 422 | F06 | Curator attempted to create a record from a submission not yet in ACCEPTED_FOR_CURATION state | Update submission disposition to ACCEPTED_FOR_CURATION first |
| `FIELD_TOO_SHORT` | 422 | F05, F06 | A text field did not meet the minimum character length | Provide more detail; see the field's minimum length requirement |

---

#### Engagement Routing (F07)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `ENGAGEMENT_UNAVAILABLE` | 503 | F07 | Engagement request service temporarily unavailable | Retry after a brief delay |
| `INVALID_ENGAGEMENT_TYPE` | 422 | F07 | Requested engagement type is not configured for the target record | Select an available engagement option from the Next-Action panel |

---

#### Settings (F07, F08)

| Error Code | HTTP Status | Feature | Trigger | Retry Guidance |
|-----------|-------------|---------|---------|----------------|
| `INVALID_EMAIL` | 422 | F05, F06, F07, F08 | Email address field does not match a valid email format | Provide a properly formatted email address |
| `INVALID_RECORD_REF` | 422 | F08 | A linked record ID references a non-existent Innovation Record | Provide a valid existing record ID |
| `ADMIN_UNAVAILABLE` | 503 | F08 | Admin data service temporarily unavailable | Retry after a brief delay |

---

### Validation Error Format

When multiple field validation errors occur simultaneously, all are returned together:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "fields": [
      {
        "field": "problem_statement",
        "error_code": "FIELD_TOO_SHORT",
        "message": "Problem statement must be at least 50 characters."
      },
      {
        "field": "submitter_email",
        "error_code": "INVALID_EMAIL",
        "message": "Please enter a valid email address."
      }
    ]
  }
}
```

---

### Error Retry Guidance Summary

| HTTP Status | Client Behavior |
|-------------|-----------------|
| 400 | Fix the request before retrying. Do not retry unchanged. |
| 403 | Do not retry. Contact administrator for access. |
| 404 | Do not retry with same parameters. Resource does not exist or is inaccessible. |
| 409 | Re-submit with required confirmation or resolve the conflict first. |
| 422 | Fix the validation errors in the request body before retrying. |
| 429 | Wait and retry after the specified or implied delay. |
| 503 | Retry with exponential backoff. If persistent after 5 minutes, contact the I&R team. |

---

*End of Y2-errors.md — continues in Y3-integrations.md*
