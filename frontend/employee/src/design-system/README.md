# Lafarge light workspace

The live theme is `theme.css`, imported once through `src/index.css`. Tailwind v4 reads its `@theme` block; the old v3 configuration is no longer a competing source of colors or animations.

## Palette and depth

The supplied grayscale reference defines these colors:

| Step | Color     | Use                                  |
| ---- | --------- | ------------------------------------ |
| 100  | `#F3F4F8` | Canvas, raised cards, inset controls |
| 200  | `#D2D4DA` | Dividers and soft shadows            |
| 300  | `#B3B5BD` | Control boundaries                   |
| 400  | `#9496A1` | Decorative details                   |
| 500  | `#777986` | Decorative details                   |
| 600  | `#5B5D6B` | Supporting text                      |
| 700  | `#404252` | Labels, focus outlines               |
| 800  | `#282A3A` | Main text and primary actions        |
| 900  | `#101223` | Strongest emphasis                   |

White highlights and translucent versions of the palette create soft depth. Use `.surface` for a raised section and the shared input styles for inset fields. Do not nest multiple raised shells around the same section. Shadows supplement visible control edges; they are never the only focus or state indicator. Status has a text label, either visible or accessible, alongside its visual indicator.

## Components

- `PageHeader`: page title, description, optional actions.
- `Layout`, `Sidebar`, `Navbar`, `WorkspaceNavigation`: shared role-based links in a sidebar on workspace pages and a full-width top navbar on Reports. The mobile workspace drawer uses a native modal dialog with Escape, focus containment, backdrop dismissal and focus restoration.
- `.button`, `.button-primary`, `.button-quiet`, `.icon-button`: consistent 44px actions. Dense report rows use 28px desktop Delete controls and restore 44px targets on touch screens.
- `TableRegion`: real table semantics with a labeled, keyboard-scrollable region. The dashboard also retains its mobile card views.
- `PasswordField`: visible label, browser password-manager hints, show/hide control.
- `AutoCompleteInput`: focused-only suggestions, listbox/combobox relationships, arrows, Enter, Escape and composition-safe keyboard handling.
- `LoadingSpinner`: the shared moving loading track used by Clients and all three Overview sections, with a named live status for each section. `TableLoadingRow` keeps desktop table headings visible while data loads; mobile views and Overview lazy-component fallbacks use the same indicator. Cached rows remain visible during background refreshes. Reduced-motion preferences make the track stationary. Editors stay mounted during report saves.
- `Toast`: a light notification; dismissal pauses while hovered or focused. On Reports, a bounded upper-right stack keeps the bottom Save All button accessible. No 50ms React progress timer.

Reports keeps every field in one Excel-style grid row at every width. The table body, row indices, editing cells and Delete buttons are white; only the column header background is gray. Faint dividers define the grid; idle inputs and Delete icons have no individual shadows or underlines. Hover reveals a subtle edge, while editing shows a strong active-cell outline and a thin marker on the row index without changing its white background. Short single-line headings retain full accessible names and hover descriptions. The near-white page, medium-weight labels, soft neumorphic shadows and inset date control keep the work surface calm. Group readable date navigation with save feedback; avoid duplicating the date in the navbar. Count actual entries rather than unused blank rows. Add New Entry focuses and reveals the existing blank row, or creates one when needed. All changes saved requires confirmed server saves for this date; waiting, syncing, removal, errors and recovered drafts have separate feedback. The Status column is removed. Icons beside the row numbers distinguish unsaved changes, saving, confirmed saved, failed saves, recovered drafts and blank new rows, with full accessible labels and hover descriptions. The row-index column stays visible during horizontal scrolling. Freed column space goes to wider fields. Checkboxes and selects retain native keyboard behavior. The table uses one sticky header, 37px desktop rows and keyboard-scrollable overflow on narrow screens. Date navigation stays above the table; Add New Entry and the sole Save All button stay below it. Individual Save buttons are removed. Report textareas show one compact line and expand only during editing; other rows stay dense. Touch inputs, date arrows and Delete targets remain 44px outside the compact landscape layout. Report suggestion lists render in a floating portal to avoid scroll-container clipping. Save All remains available while saves run or fail. Draft recovery, UUID deduplication, queued revisions and confirmed cache updates are inherited from the report-save branch.

## Motion

Press: 100ms and a 1px translation. Color/focus feedback: 140ms. Toast/drawer entrances: 160–180ms with small movement. Row-index indicators rotate during pending saves/deletes and draw the confirmed saved checkmark in 180ms. Save All stays steady and enabled. No decorative stagger or bounce. `prefers-reduced-motion` disables the row-icon animations and removes other nonessential motion, including programmatic sales-section scrolling.

The Django admin has the matching palette in `backend/employee/static/admin/css/lafarge-theme.css`, loaded by a small `admin/base_site.html` override. Its forms, permissions and endpoints continue to use Django's built-in implementation. Deploy the backend templates and run `collectstatic` when releasing that part of the redesign.
