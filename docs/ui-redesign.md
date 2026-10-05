# Light workspace redesign

A single grayscale design across the React employee workspace and Django administration. The supplied `#F3F4F8`–`#101223` palette is used for the canvas, text, controls, and restrained neumorphic shadows.

## Screens

All screenshots use synthetic review data.

- [Overview](ui/overview.png)
- [Clients](ui/clients.png)
- [Vacation](ui/vacation.png)
- [Vacation approvals](ui/vacation-management.png)
- [Report editor on desktop](ui/report-desktop.png)
- [Report editor on a phone](ui/report-mobile.png)
- [Sign in](ui/sign-in.png)
- [Django administration](ui/admin.png)

![Overview](ui/overview.png)

## What changed

- Sidebar and mobile navigation drawer for the workspace; Reports restores full-width top navigation. Navigation shares the same role permissions, preload behavior, pressed active states and skip link. The drawer retains focus containment, Escape dismissal and focus restoration.
- New overview, sign-in, settings and report-entry layouts. Clients, sales, vacation, employees, payroll and access/error states share the same palette, typography, spacing and controls.
- Reports uses an Excel-style grid with one row per entry, faint dividers and a completely white body. Only column headers have a gray background; hover and editing leave rows white. Flat input cells and quiet Delete icons remove repeated underlines and raised boxes. Hover reveals a subtle control edge; the active cell has a dark outline and a small marker at its row index. Short, single-line headings retain their full accessible names and hover descriptions. The date and save feedback share one compact toolbar group, with a readable date and no duplicate navbar date. The entry count excludes unused blank rows. Add New Entry focuses and reveals the first field of the existing blank row, or creates one when needed. Toolbar feedback confirms All changes saved only after server acknowledgement; waiting, saving, removal, failures and recovered drafts remain distinct. A near-white page and soft neumorphic depth frame the white work surface. The Status column is removed: row-index icons show unsaved changes, a rotating saving indicator, a briefly drawn saved checkmark, a failed save or a recovered draft, with full accessible labels and hover descriptions. The index stays visible during horizontal scrolling. Desktop rows remain 37px tall; the fixture shows 17 complete entries at 1440 × 900 and 14 at 1366 × 768, with all columns visible. At 390 × 844, ten complete entries fit with 44px touch inputs. Individual Save buttons are removed; one always-available Save All stays at the bottom beside Add New Entry, outside the scrolling table. A single sticky header and contained horizontal scrolling keep every field in one row on narrow screens. Long text expands only while editing, then returns to a single-line preview. Stable row identity, background autosave and draft recovery remain intact.
- Suggestions support arrows, Enter and Escape, without interfering with Chinese input composition. Report suggestions float above the scrolling table and open upward when needed, so the last row is usable. Ordinary arrows keep their normal editing behavior; Alt+Arrow navigates report rows.
- Compact loading indicators, small row-index save animations, light notifications and short press/focus transitions. Save All stays enabled and steady while writes run. Report notifications appear in a bounded stack at the upper right so failed-save messages cannot cover the bottom Save All button. Reduced-motion preferences disable the row-icon animations. No animation library or runtime dependency was added.
- Overview's daily reports, weekly samples and new client orders share the Clients page's moving loading track, including mobile views and initial component loading. Each indicator names the section being loaded. Desktop table headings remain visible, and cached data stays on screen during background refreshes. Reduced-motion preferences stop the loading motion.
- Clients uses a white directory with compact search and salesperson filters, quiet metadata and the newest visit first. Earlier visits expand on demand with a short height transition and keyboard support. Visit notes are readable, selectable text rather than cramped pills. Search supports names and districts, clear controls reset filters, and pagination stays within the available results. Salespeople continue to see only their own clients.
- Vacation uses compact labeled date fields, a visible annual leave summary, a smaller signature surface and one clear submission action. Switching between full and half days keeps the selected starting date. Pending and History filters show counts; request cards share readable dates, text/icon status badges and expandable signatures. Approvals show feedback only on the active action, preserve the selected filter and restore focus after a request leaves the queue. Failed requests retain entered dates and signatures for retry. The latest leave calculation wins when dates change quickly; submission waits for that calculation. Vacation forms and lists use the shared loading track.
- Payroll and employee edits have associated labels. Dense dashboard tables retain mobile card views and keyboard-scrollable desktop regions.
- Matching Django administration theme through a small template override and static stylesheet. Native admin forms and permission checks remain in place.

## Verification

- 50 frontend tests passed, including report save/cache/recovery regressions, keyboard/composition checks, Add New Entry focus without duplicate blank rows, accurate entry counts and truthful toolbar feedback. Four vacation regressions cover stale calculations, clearing dates, waiting for the latest calculation before submission and retaining dates/signatures after a failed request. Save workflows use the single bottom Save All button.
- Production TypeScript/Vite build and lint of changed frontend components, pages, design files and hooks passed.
- Django system checks passed; report suite: 14 passed and 1 PostgreSQL-only concurrency test skipped in local SQLite.
- Chromium smoke checks used isolated API fixtures across desktop (1440px), phone (390px), narrow phone (320px) and landscape (844px) layouts. No page-level horizontal overflow or uncaught React errors in the checked screens, including expanded sales, payroll editing and employee editing.
- A slow report write retained the enabled Save All button, showed local-save/sync status immediately, then confirmed Saved without duplicating the write.
- Automated axe WCAG A/AA scans found no violations in the 15 tested route/interaction states. This is an automated check, not a claim of complete accessibility certification.
- Native mobile dialog focus containment/restoration, password visibility and reduced-motion behavior passed browser checks.
- Overview loading was checked on desktop, 390px and 320px phones, and the clerk's three-column daily report view. All three sections use the same moving track as Clients, with matching lazy-component fallbacks, retained desktop headings and separate loading labels. Independent daily/weekly responses, date/week navigation, cached rows during background refreshes and reduced motion passed. Four loading-state axe scans found no violations, and the checked layouts had no page overflow or uncaught browser errors.
- Clients and Vacation were checked at 1440px, 844px, 390px and 320px widths with employee and manager fixtures. Desktop/phone checks cover owner and salesperson filters, trimmed name/district search, clear filters, pagination, long text, keyboard-operated visit history, reduced motion, full/half/sick leave, date addition/removal and focus, weekend counts, signatures and resize, slow/failed submission with retry, approvals/rejections, request cache updates and focus restoration. Loading, empty, initial form loading and load-error retry states also passed. Cached clients and vacation requests remain visible during background refreshes and refresh failures, with successful retries. Thirty-six axe scans found no violations, with no page overflow or uncaught browser errors in the checked states.
- The report grid was checked at 1440 × 900, 1366 × 768, 1920 × 1080, 844 × 900, 390 × 844, 320 × 800 and 844 × 390. All inputs stay in one table row, the heading row and row-index column remain sticky, and horizontal overflow is contained in the table. The 12-column grid has white body cells and gray column headers, including while a field is focused. Seven layout and three report interaction/empty/error states passed axe scans after entrance animations settled, with no violations. Flat idle controls, unclipped single-line headings, readable date labels, entry counts, Add New Entry focus/scrolling and blank-row reuse passed browser checks. Toolbar confirmation waits for the server during slow saves. Unsaved/saving/saved/error icon transitions, continuous rotation only during pending writes, saved checkmark animation and disabled icon motion under reduced-motion preferences were checked. Long-text expansion/collapse, bottom-row suggestions, keyboard scrolling, native checkbox/select keyboard input, navigation between report/sidebar layouts and slow/failed save/retry behavior passed. Repeated failures across four rows leave Save All clickable on desktop and phone. The compact landscape navbar keeps the 844 × 390 view within the screen height.
- Django admin dashboard, user list, change form and login rendered from an isolated test database and were checked at desktop/phone widths; no page overflow or JavaScript errors.

## Release

The frontend includes the report autosave work; retain those backend/API changes when deploying. Build and deploy the React frontend as usual. Deploy the Django template/static files, run `python manage.py collectstatic --noinput`, and restart the backend to apply the template directory setting. No new database migration is introduced by the visual redesign.

Implementation guidelines and the complete palette are in [the design system guide](../frontend/employee/src/design-system/README.md).
