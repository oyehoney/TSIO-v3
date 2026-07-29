### Screen 05: Contribution Submission Form

**Route:** `/share-innovation`
**Purpose:** Allow teams outside I&R to submit existing innovation work through a governed contribution pathway; explicit curation-before-publication messaging
**User Stories:** US-6.1, US-6.2
**Persona:** Marcus Webb (PER-04)

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
│  │  Share Your Innovation Work                                 │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  Has your court or team done innovation work that could    │   │
│  │  benefit the broader Judiciary? Submit it here for I&R    │   │
│  │  curation review.                                          │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ℹ  Submissions enter I&R curation review.           │  │   │
│  │  │     Publication is not guaranteed.                   │  │   │
│  │  │     If published, your team will be credited.        │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — ABOUT THE WORK —                                        │   │
│  │                                                             │   │
│  │  Describe the mission problem your team addressed *       │   │
│  │  What challenge were you solving? Who is affected?        │   │
│  │                                     (50–2000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 2000                                                  │   │
│  │                                                             │   │
│  │  Describe what your team built or explored *              │   │
│  │  What approach, technology, or method did you use?        │   │
│  │                                     (50–3000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 3000                                                  │   │
│  │                                                             │   │
│  │  Outcome Summary *                                        │   │
│  │  What were the results? Include limitations or gaps.      │   │
│  │                                     (50–2000 chars)       │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  0 / 2000                                                  │   │
│  │                                                             │   │
│  │  What stage is this work at? *                            │   │
│  │  Your honest assessment of current maturity.              │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  ○ Idea (problem identified, no exploration yet)    │  │   │
│  │  │  ○ Experiment / POC (feasibility explored)          │  │   │
│  │  │  ○ Prototype / Pilot (working model tested)         │  │   │
│  │  │  ○ Production / Validated (deployed and operating)  │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  Note: Final maturity level is assigned by I&R curators.  │   │
│  │                                                             │   │
│  │  Artifact Links *                                         │   │
│  │  Provide links to documentation, diagrams, code, or       │   │
│  │  recordings that support your submission. (1–5 URLs)      │   │
│  │  All URLs must begin with https://                        │   │
│  │                                                             │   │
│  │  Artifact URL 1 *                                         │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  https://                                           │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Artifact URL 2 (optional)                               │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │  https://                                           │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  [+ Add another artifact URL] (up to 5 total)            │   │
│  │                                                             │   │
│  │  Additional Context (optional)                            │   │
│  │  Anything else I&R should know about this work.          │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR TEAM —                                             │   │
│  │                                                             │   │
│  │  Contributing Team Name *                                 │   │
│  │  This is how your team will be credited if published.     │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contributing Office *                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  — YOUR CONTACT INFORMATION —                              │   │
│  │                                                             │   │
│  │  Contact Name *                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contact Title (optional)                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  Contact Email Address *                                  │   │
│  │  A confirmation may be sent to this address. A curator   │   │
│  │  may reach out before publication.                        │   │
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
│  │              [Submit Innovation Work]                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Layout — Confirmation Page

**Route:** `/share-innovation/confirmation`

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        ✅                                   │   │
│  │                                                             │   │
│  │  Your submission has been received.                        │   │
│  │                                                             │   │
│  │  The I&R team will review your submission for potential    │   │
│  │  curation. Here is what happens next:                      │   │
│  │                                                             │   │
│  │  1. I&R curators review your materials                    │   │
│  │  2. A curator may contact you for additional context      │   │
│  │  3. If accepted, a curator will create and enrich a       │   │
│  │     structured Innovation Record                          │   │
│  │  4. You will be contacted before any record is published  │   │
│  │                                                             │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │  This submission does not guarantee publication.          │   │
│  │  If your work is published, your team will receive        │   │
│  │  named attribution.                                       │   │
│  │  ─────────────────────────────────────────────────         │   │
│  │                                                             │   │
│  │              [Return to Innovation Catalog]               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Governance notice (curation required, not auto-published) | Top of form — always visible |
| Primary | Problem description (required) | First content field |
| Primary | Work description (required) | Second content field |
| Primary | Outcome summary (required) | Third content field |
| Primary | Maturity self-assessment (required) | Helps curator but acknowledged as self-assessed |
| Primary | At least one artifact URL (required) | Content section |
| Secondary | Additional artifact URLs (optional, up to 5) | Expandable in same section |
| Secondary | Team and contact information | Second group |
| Tertiary | Additional context (optional), CAPTCHA, submit | Bottom |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Empty form; governance notice visible | N/A |
| Validation error | Inline errors per field | Error summary at top: "Please correct the highlighted fields." |
| Submitting | Button spinner; inputs disabled | "Submitting…" |
| Success | Confirmation page | Process steps listed; attribution messaging |
| Rate limited (>5/IP/hour) | Error at form top | "Too many submissions from this location. Please try again later." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Problem / work / outcome textareas | Textarea | Required; char count shown |
| Maturity radio buttons | Radio group | One selection; no "Archived" option |
| Artifact URL inputs | Text (URL) | Required for first; optional for 2–5; validated as https:// |
| "+ Add another artifact URL" | Button | Reveals next URL field up to 5 |
| Team / contact inputs | Text / email | Required fields validated |
| CAPTCHA | Widget | Required before submit |
| Submit button | Primary button | Full validation on submit |

---

*End of Screen-05-contribution-submission.md*
