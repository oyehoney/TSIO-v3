## Accessibility Notes

**Standard:** WCAG 2.1 AA — Required for Federal government deployment (PRD §8 Non-Functional Requirements)

---

### Color Contrast

| Element | Foreground | Background | Minimum Ratio | Verification |
|---------|-----------|------------|---------------|-------------|
| Body text | `#111827` | `#FFFFFF` | 4.5:1 | Must verify |
| Maturity badge text (Idea — Gray) | `#FFFFFF` | `#6B7280` | 4.5:1 | Verify — gray may need darkening |
| Maturity badge text (Experiment — Amber) | `#FFFFFF` | `#D97706` | 4.5:1 | Verify; white on amber may need adjustment |
| Maturity badge text (Prototype — Orange) | `#FFFFFF` | `#EA580C` | 4.5:1 | Verify |
| Maturity badge text (Production — Green) | `#FFFFFF` | `#16A34A` | 4.5:1 | Verify |
| Maturity badge text (Archived — Dark Gray) | `#FFFFFF` | `#374151` | 4.5:1 | Should pass |
| Trust & Limitations section text | `#92400E` | `#FEF3C7` | 4.5:1 | Must verify amber-on-amber |
| State chips (DRAFT) | `#374151` | `#E5E7EB` | 4.5:1 | Should pass |
| State chips (IN REVIEW) | `#1E40AF` | `#DBEAFE` | 4.5:1 | Verify |
| State chips (PUBLISHED) | `#166534` | `#DCFCE7` | 4.5:1 | Verify |
| Error messages | `#DC2626` | `#FFFFFF` | 4.5:1 | Verify |
| Links (default) | `#1D4ED8` | `#FFFFFF` | 4.5:1 | Should pass |
| Disabled button text | `#6B7280` | `#F3F4F6` | 4.5:1 | Verify — disabled states may need care |

**Rule:** Color is NEVER the sole differentiator. All maturity badges display a text label in addition to color. All status chips display a text label. Error states use icons AND text in addition to border color.

---

### Keyboard Navigation

All interactive elements must be reachable and operable with keyboard only.

| Element | Keyboard Behavior |
|---------|-------------------|
| Global navigation links | Tab to reach; Enter to activate |
| Search bar | Tab to reach; Enter to submit |
| Catalog cards | Tab to "View Record →" link; Enter to navigate |
| Filter checkboxes | Tab to reach; Space to toggle |
| Perspective toggle tabs | Tab to tab control; Arrow keys to switch tabs; Enter/Space to activate |
| Engagement buttons (Next-Action panel) | Tab to each button; Enter/Space to open modal |
| Modal (Engagement Request) | Focus trapped within modal; Tab cycles through modal fields; Escape to close |
| Admin record form fields | Tab through fields in logical order; matching visual order |
| Dropdown selects | Tab to reach; Arrow keys to navigate options; Enter to select |
| Checklist items (admin) | Not interactive (display only); no tab stop needed |
| "Submit for Review" / "Publish" buttons | Tab to reach; Enter to activate; blocked with explanation if not available |
| Artifact link [×] remove (admin) | Tab to reach; Enter to remove; confirmation if needed |
| Sort dropdown | Tab to reach; standard select keyboard behavior |

**Tab order:** Tab order must match visual reading order (top-to-bottom, left-to-right for LTR layout). No positive tabindex values that break natural order.

---

### Screen Reader Considerations

#### Page Structure

- Every page has a single `<h1>` that identifies the page (e.g., "Innovation Catalog", "Audio Security Proof of Concept", "Submit a Mission Problem")
- Heading hierarchy is logical: `<h1>` → `<h2>` for section headings → `<h3>` for sub-sections
- Navigation landmark regions: `<header>` (site header), `<nav>` (main navigation), `<main>` (main content), `<aside>` (filter panel), `<footer>` (site footer)
- Skip link: "Skip to main content" is the first focusable element on every page (visually hidden until focused)

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

#### Innovation Catalog

- Catalog card grid uses a `<ul>` with each card as `<li>`
- Each card's "View Record →" link has a unique accessible name: `aria-label="View record: Audio Security Proof of Concept"`
- Maturity badges: `<span class="badge">Experiment / POC</span>` — text label always present; color is supplementary
- Review status badges: same pattern
- Filter panel: `<form role="search">` or `<form aria-label="Filter records">` with `<fieldset>` + `<legend>` per filter group
- Result count: live region — `<div aria-live="polite" aria-atomic="true">Showing 8 of 14 records</div>`

#### Search Results

- Search bar: `<input type="search" aria-label="Search innovation records">` (not `aria-label="Search"` — too generic)
- Query echo heading: `<h2>Search results for: "[query]"</h2>`
- Result count: aria-live region
- Query term highlights: `<mark>audio</mark>` for highlighted terms (accessible by default)
- Empty state CTA: descriptive link text ("Submit a mission problem for I&R consideration") — not "click here"

#### Innovation Record — Perspective Toggle

- Toggle implemented as ARIA tab control:
```html
<div role="tablist" aria-label="Record perspective">
  <button role="tab" aria-selected="true" aria-controls="executive-panel">Executive View</button>
  <button role="tab" aria-selected="false" aria-controls="technical-panel">Technical View</button>
</div>
<div id="executive-panel" role="tabpanel" tabindex="0">...</div>
<div id="technical-panel" role="tabpanel" tabindex="-1" hidden>...</div>
```

#### Trust & Limitations Section

- Section has `<h2>Trust &amp; Limitations</h2>` heading
- Rendered as `<section aria-label="Trust and Limitations">` so it is navigable as a landmark region
- Each disclaimer is a separate `<p>` within the section

#### Engagement Modal

- `role="dialog"` with `aria-modal="true"` and `aria-labelledby="modal-title"`
- When modal opens, focus moves to first field (requestor name)
- Background content: `aria-hidden="true"` while modal is open
- Confirmation state: `role="alert"` on confirmation message so it is announced immediately

#### Forms — Opportunity and Contribution Submission

- Each field: `<label for="field-id">` linked to `<input id="field-id">`
- Required fields: `aria-required="true"` AND visible asterisk `*` with legend "Required fields are marked with *"
- Character counters: `aria-describedby` links textarea to counter element
- Error messages: `aria-describedby` links field to its error element; error elements use `role="alert"` when revealed
- Error summary at top of form: `role="alert"` with links to each errored field

#### Admin — Record Edit Form

- Form sections use `<fieldset>` + `<legend>` to group related fields
- Inline governance definitions (maturity/review status): tooltip/expand pattern with `aria-expanded` and `aria-describedby`
- Pre-publication checklist: `<ul aria-label="Publication readiness checklist">` with each item showing ✅ or ❌ plus text
- Auto-save notification: `aria-live="polite"` region for "Saved" announcements
- Error notifications (publication gate): `role="alert"` for immediate announcement

---

### Images and Icons

- All icons used for engagement indicators (📋 Demo, 💬 Adoption, 🔧 Technical Guidance) must have text labels alongside them — icons alone are not accessible
- No meaningful information conveyed by images without alt text
- Decorative images: `alt=""` to suppress screen reader announcement
- External link icon (↗): `aria-hidden="true"` on the icon; accessible name of link includes "(opens in new tab)"

---

### Motion and Animation

- No autoplay animations or videos
- Transitions for filter updates and modal open/close: duration < 200ms; can be suppressed with `prefers-reduced-motion` media query
- Skeleton loading states use CSS animation; suppressed under `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton, .fade-transition { animation: none; transition: none; }
}
```

---

### ARIA Landmarks Summary

| Region | Landmark Role | Present On |
|--------|---------------|-----------|
| Site header (logo + nav) | `<header>` | All pages |
| Main navigation | `<nav aria-label="Main">` | All pages |
| Admin navigation | `<nav aria-label="Admin">` | All admin pages |
| Filter panel | `<aside aria-label="Filter records">` | Catalog, Search |
| Main content | `<main id="main-content">` | All pages |
| Site footer | `<footer>` | All pages |
| Engagement modal | `role="dialog"` | Innovation Record |
| Form sections | `<section>` with heading | Forms |

---

### Testing Checklist (Prior to Launch)

- [ ] All pages tested with keyboard-only navigation (no mouse)
- [ ] All pages tested with NVDA + Chrome and VoiceOver + Safari
- [ ] Color contrast verified with automated tool (Lighthouse, axe) and manual review of badge colors
- [ ] All form fields have visible, programmatically associated labels
- [ ] All error messages are reachable by screen reader (role="alert" or aria-live)
- [ ] Modal focus trap verified
- [ ] Skip link verified functional
- [ ] Perspective toggle tab control keyboard behavior verified
- [ ] Artifact links verified: all open in new tab with accessible label
- [ ] Trust & Limitations section verified as navigable landmark
- [ ] Publication checklist (admin) verified as screen-reader-readable
- [ ] Maturity badges verified: text label always present (no color-only badges)
- [ ] prefers-reduced-motion query verified active

---

*End of Y2-accessibility.md*
