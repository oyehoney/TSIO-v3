## Interaction Patterns

### Pattern 01: Catalog Card Click → Record

**When to use:** Any time a catalog card or search result is the entry point to a record
**Behavior:**
- Entire card is clickable (not just the "View Record →" text link)
- Card has hover state: subtle shadow elevation; background lightens
- Focus state: visible outline (3px, `#1D4ED8` blue) for keyboard users
- Card click navigates to `/records/{id}`; "View Record →" link is the accessible anchor
- Back navigation preserves scroll position on catalog/search return

**Examples:** Innovation Catalog (Screen 00), Search Results (Screen 01)

---

### Pattern 02: Perspective Toggle (Tab Pair)

**When to use:** Innovation Record page — switching between Executive and Technical views
**Behavior:**
- Implemented as ARIA tab control: `role="tablist"`, each option `role="tab"`, content area `role="tabpanel"`
- Active tab: underlined + bold; `aria-selected="true"`
- Inactive tab: default weight; `aria-selected="false"`
- Tab switch re-renders content area; no page reload
- URL updates with `?view=executive` or `?view=technical` (pushState or replaceState)
- Both tabs always visible; cannot be conditionally hidden
- Keyboard: Arrow keys navigate between tabs; Enter/Space activates

**Examples:** Innovation Record (Screen 02)

---

### Pattern 03: Filter Panel — Live Filtering

**When to use:** Catalog and Search Results pages
**Behavior:**
- Filter checkboxes trigger re-query immediately on change (no submit button)
- For performance, debounce rapid sequential changes by 150ms before executing query
- URL updated with filter state on each change (shareable/bookmarkable URLs)
- "Active filters" summary bar appears above results when any filter is active
- Each active filter chip includes a "×" dismiss button to remove that single filter
- "Clear all filters" button removes all filters at once
- Result count updates as filters change; aria-live region for screen reader announcement

**Examples:** Innovation Catalog (Screen 00), Search Results (Screen 01)

---

### Pattern 04: Inline Form Validation

**When to use:** All public-facing forms (Engagement Modal, Opportunity Submission, Contribution Submission) and admin forms (Record Create/Edit)
**Behavior:**
- Validation occurs on field blur (not on keystroke) for required field presence
- Validation occurs on keystroke for character count limits (live counter shown)
- On form submit, all fields are validated before submission attempt
- Error messages appear inline below the field with `role="alert"` for screen readers
- Error summary appears at top of form on submit failure: "Please correct the highlighted fields" with anchor links to each error field
- Submit button disabled while form is submitting (loading state)
- Error borders: red (`#DC2626`); Success borders: green (`#16A34A`) on previously-errored fields

**Error message pattern:**
```
  ┌─────────────────────────────────────────────────────────┐
  │ Your Name *                                             │
  │ ┌─────────────────────────────────────────────────┐    │
  │ │                                                 │    │
  │ └─────────────────────────────────────────────────┘    │
  │ ⛔  Name is required.                                  │
  └─────────────────────────────────────────────────────────┘
```

**Examples:** Engagement Modal (Screen 03), Opportunity Submission (Screen 04), Contribution Submission (Screen 05), Record Edit (Screen 07)

---

### Pattern 05: Modal — Focus Trap and Dismiss

**When to use:** Engagement Request Modal; any destructive-action confirmation modals
**Behavior:**
- On modal open: focus moves to first interactive element inside modal
- Focus is trapped within modal while open (Tab cycles within modal)
- Close button [✕] appears in top-right corner
- Pressing Escape closes modal
- Clicking overlay background closes modal (for non-destructive modals)
- On modal close: focus returns to the element that triggered it
- Modal uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title
- Background page is `aria-hidden="true"` while modal is open

**Examples:** Engagement Request (Screen 03), Edit Published Record warning (Screen 07), Archive confirmation

---

### Pattern 06: Toast Notifications

**When to use:** Brief success or information messages that don't require user action
**Behavior:**
- Position: bottom-right corner of viewport
- Auto-dismiss: 5 seconds
- Close button (×) for manual dismiss
- Success toast: green left border, checkmark icon
- Error toast: red left border, warning icon
- Screen reader: `role="status"` (for success) or `role="alert"` (for errors)
- Multiple toasts stack vertically

```
  ┌────────────────────────────────────────┐
  │  ✅  Disposition saved.           [×] │
  └────────────────────────────────────────┘
```

**Examples:** Admin screens — save operations, status updates

---

### Pattern 07: Pre-Publication Checklist

**When to use:** Admin Record Create/Edit form (Screen 07)
**Behavior:**
- Always visible in collapsed form at top of record edit page
- Can be expanded/collapsed (defaults to expanded when any field is missing)
- Each pub-required field shows ✅ (complete) or ❌ (missing)
- Count of missing fields shown: "N fields required before publishing"
- "Submit for Review" button is enabled only when all pub-required fields are present
- On attempt to submit with missing fields, checklist scrolls into view and pulses

---

### Pattern 08: Auto-save Draft

**When to use:** Admin Record Create/Edit (DRAFT and REVIEW states)
**Behavior:**
- Auto-save triggers 3 seconds after last keystroke in any field
- Visual indicator in footer: "Saving…" → "Saved [time]"
- Explicit "Save Draft" button always available for manual save
- Auto-save does not change publication state
- If auto-save fails: show persistent warning "Auto-save failed. Use Save Draft to preserve your work."
- Screen reader: announce "Draft saved" via aria-live when auto-save completes

---

### Pattern 09: External Link Behavior

**When to use:** All artifact links, SharePoint links, GitHub links on public record pages
**Behavior:**
- All external links open in a new tab: `target="_blank" rel="noopener noreferrer"`
- Link labels include artifact type: "Architecture Diagram — SharePoint"
- Each link includes visually and programmatically accessible "(opens in new tab)" indication
- `aria-label`: "[Link label] (opens in new tab)"
- External link icon (↗) rendered after link text
- Hub does not embed, iframe, or cache external content

---

### Pattern 10: Publication State Transitions

**When to use:** Admin Record state management
**Behavior:**

Valid transitions:
```
DRAFT → REVIEW          (Submit for Review — requires pub-required fields)
REVIEW → PUBLISHED      (Publish — governance gate re-validates)
REVIEW → DRAFT          (Return to Draft — no validation required)
PUBLISHED → REVIEW      (Edit — requires confirmation modal)
PUBLISHED → SUPERSEDED  (Supersede — requires linked record ID)
PUBLISHED → ARCHIVED    (Archive — requires confirmation)
SUPERSEDED → ARCHIVED   (Archive)
```

Invalid transitions: All others return error "This state transition is not permitted. Current state: [X]. Allowed transitions: [list]."

Each transition generates an audit log entry.

---

*End of Y0-patterns.md*
