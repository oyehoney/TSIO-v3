## Responsive Considerations

The TSIO Innovation Hub is a **web-first, desktop-primary** platform. Mobile-native apps are explicitly out of scope (PRD §11). However, the public-facing interface must be usable on tablet and mobile for stakeholders who may access the Hub from a mobile browser. The admin interface is designed for desktop use.

### Breakpoints

| Breakpoint | Range | Target device |
|---|---|---|
| Desktop | ≥ 1024px | Government-issued desktop/laptop — primary |
| Tablet | 768px – 1023px | Tablet browser |
| Mobile | < 768px | Mobile browser — supported but not primary |

---

### Desktop (≥ 1024px) — Primary Design Target

All wireframes in this document represent the desktop layout.

**Catalog:**
- 3-column card grid
- Filter panel: left sidebar (fixed width ~240px)
- Full filter panel visible without toggle

**Search Results:**
- Filter panel: left sidebar
- Results: full-width list cards with summary snippets

**Innovation Record:**
- Single-column content with full-width sections
- Perspective toggle at top of content area
- Trust & Limitations section full-width with amber background
- Next-Action panel: horizontal row of buttons

**Admin — Record Edit:**
- Two-column layout optional: checklist sticky right sidebar; form content left column
- Or: checklist pinned to top; form scrolls below

---

### Tablet (768px – 1023px)

**Catalog:**
- 2-column card grid
- Filter panel collapses to "Filter" toggle button above results
- Filter panel expands as an overlay drawer when toggle is clicked

```
┌─────────────────────────────────────────────┐
│ TSIO HUB         [Search ___] [🔍]          │
│ [Catalog] [Submit Problem] [Share Work]     │
├─────────────────────────────────────────────┤
│ [▼ Filters (2 active)]  Sort: [Recent ▼]   │
│ Showing 8 records                           │
│                                             │
│ ┌──────────────┐ ┌──────────────┐          │
│ │  CARD        │ │  CARD        │          │
│ │              │ │              │          │
│ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐ ┌──────────────┐          │
│ │  CARD        │ │  CARD        │          │
│ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────┘
```

**Search Results:**
- Filter panel collapses to drawer on tablet
- Results list full-width

**Innovation Record:**
- All sections stack single-column (same as desktop, just narrower)
- Perspective toggle remains at top; both tabs visible
- Next-Action buttons stack vertically or wrap to 2-across

**Admin Interface:**
- Sidebar collapses to hamburger/drawer on tablet
- Admin is designed for desktop; tablet is supported but may require scrolling

---

### Mobile (< 768px)

**Navigation:**
```
┌──────────────────────────────────────┐
│ TSIO INNOVATION HUB        [☰ Menu] │
└──────────────────────────────────────┘
```
- Global search accessible from hamburger menu or persistent search icon
- Top navigation collapses to hamburger menu drawer
- "Submit a Mission Problem" and "Share Your Innovation Work" accessible from menu

**Catalog:**
- 1-column card grid
- Filters accessible via full-screen drawer triggered by "Filter" button
- Each card shows: title, maturity badge, short summary, engagement indicators
- Tags truncated with "+N more" on cards (expandable on click)

```
┌──────────────────────────────────┐
│ TSIO INNOVATION HUB    [☰] [🔍] │
├──────────────────────────────────┤
│ Innovation Catalog               │
│ [▼ Filter]  Sort: [Recent ▼]    │
│ 14 records                       │
│ ┌──────────────────────────────┐ │
│ │  [Experiment/POC ●] [Curated]│ │
│ │                              │ │
│ │  Audio Security POC          │ │
│ │                              │ │
│ │  Explores GPU/CPU separation │ │
│ │  for courtroom recordings…   │ │
│ │                              │ │
│ │  🏷 Cybersecurity +2         │ │
│ │  📋 Demo Available           │ │
│ │                  [View →]    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Innovation Record:**
- Perspective toggle spans full width; both tabs visible
- All sections single-column, full-width
- Trust & Limitations section full-width amber box
- Next-Action buttons stack vertically (full-width buttons)
- Artifact links listed with visible external link labels

**Opportunity / Contribution Forms:**
- Single-column layout
- All fields full-width
- Character counter always visible below textarea
- Submit button full-width at bottom

**Admin Interface:**
- Admin interface is designed for desktop use; mobile access is not a primary use case
- If accessed on mobile: single-column layout, sidebar hidden (hamburger menu)
- Not optimized for mobile data entry; curators should use desktop for record authoring

---

### Minimum Touch Target Sizes (WCAG 2.1 AA)

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44 × 44px |
| Links | 44px height (inline links: sufficient line-height) |
| Checkboxes / radio buttons | 44 × 44px touch area (visual indicator may be smaller) |
| Perspective toggle tabs | 44px height minimum |
| Filter chips dismiss (×) | 44 × 44px touch area |

---

*End of Y1-responsive.md*
