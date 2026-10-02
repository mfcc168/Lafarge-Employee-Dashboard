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

White highlights and translucent versions of the palette create soft depth. Use `.surface` for a raised section and the shared input styles for inset fields. Do not nest multiple raised shells around the same section. Shadows supplement visible control edges; they are never the only focus or state indicator. Status always includes text and, where useful, a static icon.

## Components

- `PageHeader`: page title, description, optional actions.
- `Layout`, `Sidebar`, `Navbar`, `WorkspaceNavigation`: shared role-based links in a sidebar on workspace pages and a full-width top navbar on Reports. The mobile workspace drawer uses a native modal dialog with Escape, focus containment, backdrop dismissal and focus restoration.
- `.button`, `.button-primary`, `.button-quiet`, `.icon-button`: consistent 44px actions. Dense report rows use 32px desktop Save/Delete controls and restore 44px targets on touch screens.
- `TableRegion`: real table semantics with a labeled, keyboard-scrollable region. The dashboard also retains its mobile card views.
- `PasswordField`: visible label, browser password-manager hints, show/hide control.
- `AutoCompleteInput`: focused-only suggestions, listbox/combobox relationships, arrows, Enter, Escape and composition-safe keyboard handling.
- `LoadingSpinner`: a compact loading track instead of a full-viewport multi-ring spinner. Editors stay mounted during report saves.
- `Toast`: a light notification; dismissal pauses while hovered or focused. No 50ms React progress timer.

Reports keeps every field in one compact table row at every width. The table uses one sticky header, 67px desktop rows, keyboard-scrollable overflow on narrow screens, and fixed date/Add/Save All controls outside the table. Report textareas show two compact lines and expand only during editing; other rows stay dense. Report suggestion lists render in a floating portal to avoid scroll-container clipping. Save and Save All remain available while saves run. Draft recovery, UUID deduplication, queued revisions and confirmed cache updates are inherited from the report-save branch.

## Motion

Press: 100ms and a 1px translation. Color/focus feedback: 140ms. Toast/drawer entrances: 160–180ms with small movement. No decorative stagger, bounce or rotating controls. Loading is indeterminate only during real reads; saving feedback is static text. `prefers-reduced-motion` removes nonessential animation, including programmatic sales-section scrolling.

The Django admin has the matching palette in `backend/employee/static/admin/css/lafarge-theme.css`, loaded by a small `admin/base_site.html` override. Its forms, permissions and endpoints continue to use Django's built-in implementation. Deploy the backend templates and run `collectstatic` when releasing that part of the redesign.
