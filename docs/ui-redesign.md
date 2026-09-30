# Light workspace redesign

A single grayscale design across the React employee workspace and Django administration. The supplied `#F3F4F8`–`#101223` palette is used for the canvas, text, controls, and restrained neumorphic shadows.

## Screens

All screenshots use synthetic review data.

- [Overview](ui/overview.png)
- [Report editor on desktop](ui/report-desktop.png)
- [Report editor on a phone](ui/report-mobile.png)
- [Sign in](ui/sign-in.png)
- [Django administration](ui/admin.png)

![Overview](ui/overview.png)

## What changed

- One sidebar and mobile navigation drawer across all routes, including Reports. Clear active states, 44px navigation controls, keyboard focus containment, Escape dismissal, restored focus, and a skip link.
- New overview, sign-in, settings and report-entry layouts. Clients, sales, vacation, employees, payroll and access/error states share the same palette, typography, spacing and controls.
- Reports use a responsive field grid instead of a horizontally scrolling form table. Stable row identity, uninterrupted typing, background autosave, recovery and always-available Save/Save All remain intact.
- Suggestions support arrows, Enter and Escape, without interfering with Chinese input composition. Ordinary arrows keep their normal editing behavior; Alt+Arrow navigates report rows.
- Compact loading indicators, static save feedback, light notifications and short press/focus transitions. Reduced-motion preferences are honored. No animation library or runtime dependency was added.
- Vacation starts with one clearly labeled blank date, followed by signature and submission. Payroll and employee edits have associated labels. Dense dashboard tables retain mobile card views and keyboard-scrollable desktop regions.
- Matching Django administration theme through a small template override and static stylesheet. Native admin forms and permission checks remain in place.

## Verification

- 46 frontend tests passed, including existing report save/cache/recovery regressions and new keyboard/composition checks.
- Production TypeScript/Vite build and lint of changed frontend components, pages, design files and hooks passed.
- Django system checks passed; report suite: 14 passed and 1 PostgreSQL-only concurrency test skipped in local SQLite.
- Chromium smoke checks used isolated API fixtures across desktop (1440px), phone (390px), narrow phone (320px) and landscape (844px) layouts. No page-level horizontal overflow or uncaught React errors in the checked screens, including expanded sales, payroll editing and employee editing.
- A slow report write retained the enabled Save button, showed local-save/sync status immediately, then confirmed Saved without duplicating the write.
- Automated axe WCAG A/AA scans found no violations in the 15 tested route/interaction states. This is an automated check, not a claim of complete accessibility certification.
- Native mobile dialog focus containment/restoration, password visibility and reduced-motion behavior passed browser checks.
- Django admin dashboard, user list, change form and login rendered from an isolated test database and were checked at desktop/phone widths; no page overflow or JavaScript errors.

## Release

The frontend includes the report autosave work; retain those backend/API changes when deploying. Build and deploy the React frontend as usual. Deploy the Django template/static files, run `python manage.py collectstatic --noinput`, and restart the backend to apply the template directory setting. No new database migration is introduced by the visual redesign.

Implementation guidelines and the complete palette are in [the design system guide](../frontend/employee/src/design-system/README.md).
