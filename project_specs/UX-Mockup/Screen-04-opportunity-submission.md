### Screen 04: Opportunity Submission Form

**Route:** `/submit-opportunity`
**Purpose:** Allow stakeholders to submit a mission problem for I&R consideration without authentication; problem-first framing; explicit non-commitment messaging
**User Stories:** US-5.1, US-5.2
**Personas:** PER-01 (Margaret), PER-02 (David)

#### Layout — Form

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
│ [Catalog] [Submit a Mission Problem] [Share Your Innovation Work]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ← Back to Catalog                                                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Submit a Mission Problem                                   │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  Help the I&R team understand the mission challenges       │   │
│  │  your court or organization is facing. Submissions are     │   │
│  │  reviewed by the I&R team for future consideration.        │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ℹ  Submitting this form does not imply acceptance   │  │   │
│  │  │     of the opportunity into the I&R portfolio or a   │  │   │
│  │  │     commitment to begin a project or establish a      │  │   │
│  │  │     timeline.                                         │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — DESCRIBE THE PROBLEM —                                  │   │
│  │                                                             │   │
│  │  Describe the mission problem you are facing *            │   │
│  │  Focus on the challenge, not a proposed solution.         │   │
│  │  What is difficult or impossible today? Who is affected?  │   │
│  │                                      (50–3000 chars)      │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 3000                                                  │   │
│  │                                                             │   │
│  │  Mission Area *                                           │   │
│  │  Select the primary mission area this problem affects.    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  [Select mission area ▼]                            │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Urgency Context (optional)                               │   │
│  │  Is there a decision deadline or event driving urgency?   │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Known Constraints (optional)                             │   │
│  │  Budget, policy, technical, or operational constraints    │   │
│  │  the I&R team should be aware of.                         │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR CONTACT INFORMATION —                              │   │
│  │                                                             │   │
│  │  Submitting Office *                                      │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Name *                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Title (optional)                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Your Email Address *                                     │   │
│  │  A confirmation may be sent to this address.              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  [CAPTCHA / reCAPTCHA widget]                        │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  * Required fields                                        │   │
│  │                                                             │   │
│  │              [Submit Mission Problem]                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation Page

**Route:** `/submit-opportunity/confirmation`

```
┌─────────────────────────────────────────────────────────────────────┐
│ TSIO INNOVATION HUB                    [Search ________] [🔍]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                      ✅                                     │   │
│  │                                                             │   │
│  │  Your submission has been received.                        │   │
│  │                                                             │   │
│  │  Thank you for taking the time to describe this mission    │   │
│  │  problem. Your input helps I&R prioritize future           │   │
│  │  exploration.                                              │   │
│  │                                                             │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │  Important: This submission does not imply acceptance      │   │
│  │  of the opportunity into the I&R portfolio or a           │   │
│  │  commitment to begin a project or establish a timeline.   │   │
│  │                                                             │   │
│  │  The I&R curation team will review your submission.       │   │
│  │  If I&R pursues this opportunity, the submitting          │   │
│  │  contact may be engaged for additional context.           │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │                                                             │   │
│  │  A confirmation may have been sent to the email           │   │
│  │  address you provided.                                    │   │
│  │                                                             │   │
│  │              [Return to Innovation Catalog]               │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Non-commitment notice (ℹ box) | Top of form — before all fields |
| Primary | Problem description (required, large textarea) | First field group — problem-first ordering |
| Primary | Mission area (required) | Second field — context for routing |
| Secondary | Urgency context (optional) | Middle |
| Secondary | Known constraints (optional) | Middle |
| Secondary | Contact information fields | Second section — separate from problem |
| Tertiary | CAPTCHA, submit button | Bottom |

#### Field Ordering Rationale

The form uses **problem-first ordering**: the mission problem description is the very first field, before any contact information. This signals to the submitter that the I&R team wants to understand the problem, not just log a contact. Contact information comes second to reduce cognitive load and avoid making the form feel like a registration form.

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Empty form; info notice visible | Non-commitment language visible from page load |
| In-progress | Fields filled; character counter active | Running count on description field |
| Validation error | Inline error per field; red border; error summary at top | "Please fix the following errors: …" |
| Submitting | Button shows spinner; "Submitting…"; form inputs disabled | Screen reader: "Submitting your mission problem…" |
| Success | Navigates to confirmation page | Confirmation with explicit non-commitment language |
| Server error | Error banner at form top | "Unable to submit at this time. Please try again or contact the I&R team directly." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Problem description textarea | Textarea | Required; 50–3000 chars; live character count |
| Mission area dropdown | Select | Required; enumerated mission areas |
| Urgency, constraints textareas | Textarea | Optional |
| Office, name, title, email inputs | Text/email input | Office, name, email required |
| CAPTCHA widget | Third-party | Must complete before submit enabled |
| Submit button | Primary button | Validates all fields; submits on pass |
| "← Back to Catalog" | Link | Returns to `/catalog` |
| "Return to Innovation Catalog" (confirmation) | Primary button | Navigates to `/catalog` |

---

*End of Screen-04-opportunity-submission.md*
