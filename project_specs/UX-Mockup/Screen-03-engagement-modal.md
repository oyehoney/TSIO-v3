### Screen 03: Engagement Request Modal

**Route:** Modal overlay on `/records/{record_id}`
**Purpose:** Allow stakeholders to request a briefing, demo, adoption discussion, or technical guidance — with the record reference pre-populated
**User Stories:** US-7.1, US-7.2
**Personas:** PER-01 (briefing/demo), PER-02 (adoption discussion), PER-03 (technical guidance)

#### Layout — Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Background: Innovation Record page — dimmed overlay]              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Request Technical Guidance                          [✕]    │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │                                                             │    │
│  │  You are requesting technical guidance for:               │    │
│  │  📋 Audio Security Proof of Concept                       │    │
│  │  (Pre-populated — cannot edit record reference)           │    │
│  │                                                             │    │
│  │  Your Name *                                              │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Your Office *                                            │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Your Email Address *                                     │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  Describe your interest or question *                     │    │
│  │  Help us understand your context so we can               │    │
│  │  respond appropriately.                (20–2000 chars)   │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  │                                                     │  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │  0 / 2000                                                 │    │
│  │                                                             │    │
│  │  Desired next step (optional)                             │    │
│  │  e.g., a call, a document review, a live demo             │    │
│  │  ┌─────────────────────────────────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────────────┐ │    │
│  │  │  [CAPTCHA / reCAPTCHA widget]                        │ │    │
│  │  └──────────────────────────────────────────────────────┘ │    │
│  │                                                             │    │
│  │  * Required fields                                        │    │
│  │                                                             │    │
│  │  [Cancel]                  [Submit Request]               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation State (replaces form content)

```
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Request Submitted                               [✕]        │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │                                                             │    │
│  │              ✅                                             │    │
│  │                                                             │    │
│  │  Your request has been sent to the I&R team.              │    │
│  │  Someone will follow up with you based on                 │    │
│  │  team availability.                                       │    │
│  │                                                             │    │
│  │  Request type: Technical Guidance                         │    │
│  │  Record: Audio Security Proof of Concept                  │    │
│  │  Submitted: July 29, 2026 at 2:14 PM                      │    │
│  │                                                             │    │
│  │                          [Close]                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Request type heading | Modal title |
| Primary | Pre-populated record reference | Below title — read-only |
| Primary | Required form fields (name, office, email, description) | Modal body |
| Secondary | Optional fields (desired next step) | Modal body below required |
| Secondary | CAPTCHA | Before submit button |
| Tertiary | Character count | Below description field |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (open) | Form with empty fields; record reference pre-filled | Focus placed on first field (Name) |
| Validation error | Inline error messages per field; red border | "Name is required." / "Description must be at least 20 characters." |
| Submitting | Submit button shows spinner; "Submitting…"; inputs disabled | Screen reader: "Submitting your request…" |
| Success | Form content replaced by confirmation message | ✅ confirmation with request details |
| Rate limited | Error message at form top | "Too many requests. Please try again later." |
| Server error | Error message at form top | "Unable to submit at this time. Please try again or contact the I&R team directly." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Modal close button [✕] | Button | Closes modal; focus returns to trigger button |
| Text inputs | Input fields | Standard text entry; validated on blur |
| Description textarea | Textarea | Character count shown; validated on blur |
| CAPTCHA widget | Third-party widget | Must complete before submit enabled |
| "Cancel" button | Button | Closes modal; no submission |
| "Submit Request" button | Primary button | Submits form; shows loading state |
| [Close] in confirmation | Button | Closes modal; returns focus to record page |

#### Engagement Request Types and Primary CTA Mapping

| Request Type | Trigger | Primary CTA (in Executive View) | Primary CTA (in Technical View) |
|---|---|---|---|
| REQUEST_BRIEFING | Configured on record | ✅ "Request a Briefing" — primary | Available |
| REQUEST_DEMO | Configured on record | ✅ "Request a Demo" — primary | Available |
| REQUEST_ADOPTION_DISCUSSION | Configured on record | Available | Available |
| REQUEST_TECHNICAL_GUIDANCE | Configured on record | Available | ✅ "Request Technical Guidance" — primary |
| SUBMIT_RELATED_PROBLEM | Configured on record | Available | Available |

**Note:** A stakeholder can only request an engagement type that has been configured for that record. If a type is not configured, its button is not shown.

---

*End of Screen-03-engagement-modal.md*
