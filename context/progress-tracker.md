# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 04: Project Dialogs & Editor Home

## Current Goal

- Build the `/editor` home screen and add project dialogs/sidebar actions (mock data, no persistence).

## Completed

- 01-design-system: shadcn/ui configured with Tailwind v4, all 7 UI primitive components added, lucide-react installed, dark theme CSS variables set in globals.css, lib/utils.ts cn() helper in place.
- 02-editor: `EditorNavbar` and `ProjectSidebar` built. Navbar has sidebar toggle with PanelLeftOpen/PanelLeftClose icons. Sidebar is a fixed overlay that slides in from the left with tabs (My Projects / Shared), empty placeholder states, and a New Project button. `app/page.tsx` wired up to demo both components.
- 03-auth: Clerk wired in. `ClerkProvider` with dark theme in root layout. `proxy.ts` protects all routes except `/`, `/sign-in`, `/sign-up`. Two-panel sign-in/sign-up pages. `/` redirects to `/editor` or `/sign-in` based on auth. `UserButton` in editor navbar. `npm run build` passes.
- 04-project-dialogs: Editor home screen with heading, description, and New Project button. `useProjectDialogs` hook manages dialog/form/loading state. Create dialog with live slug preview, Rename dialog with prefilled input/auto-focus/Enter-to-submit, Delete dialog with destructive confirm. Sidebar wired with per-item Rename/Delete actions (owned only), mobile backdrop scrim. All wired through `EditorPage`. TypeScript and lint clean.

## In Progress

- None.

## Next Up

- 05: Editor canvas / React Flow integration.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
