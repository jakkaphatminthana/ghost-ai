# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05: Prisma Schema & Data Layer

## Current Goal

- Add Project/ProjectCollaborator models, Prisma client singleton, and first migration.

## Completed

- 01-design-system: shadcn/ui configured with Tailwind v4, all 7 UI primitive components added, lucide-react installed, dark theme CSS variables set in globals.css, lib/utils.ts cn() helper in place.
- 02-editor: `EditorNavbar` and `ProjectSidebar` built. Navbar has sidebar toggle with PanelLeftOpen/PanelLeftClose icons. Sidebar is a fixed overlay that slides in from the left with tabs (My Projects / Shared), empty placeholder states, and a New Project button. `app/page.tsx` wired up to demo both components.
- 03-auth: Clerk wired in. `ClerkProvider` with dark theme in root layout. `proxy.ts` protects all routes except `/`, `/sign-in`, `/sign-up`. Two-panel sign-in/sign-up pages. `/` redirects to `/editor` or `/sign-in` based on auth. `UserButton` in editor navbar. `npm run build` passes.
- 04-project-dialogs: Editor home screen with heading, description, and New Project button. `useProjectDialogs` hook manages dialog/form/loading state. Create dialog with live slug preview, Rename dialog with prefilled input/auto-focus/Enter-to-submit, Delete dialog with destructive confirm. Sidebar wired with per-item Rename/Delete actions (owned only), mobile backdrop scrim. All wired through `EditorPage`. TypeScript and lint clean.
- 05-prisma: `prisma/models/project.prisma` with `Project` + `ProjectCollaborator` models, enums, relations, and indexes. `lib/prisma.ts` cached singleton branching on `prisma+postgres://` (Accelerate) vs direct `@prisma/adapter-pg`. Multi-file schema via `prisma.config.ts` directory mode. Migration `init_project_models` applied. `npm run build` passes.

## In Progress

- None.

## Next Up

- 06: Editor canvas / React Flow integration.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Multi-file Prisma schema: `prisma.config.ts` points `schema` to the `prisma/` directory; Prisma recursively merges all `*.prisma` files. Generator + datasource live in `schema.prisma`; models live in `prisma/models/`.
- `lib/prisma.ts` uses `ReturnType<typeof createClient>` to unify the Accelerate-extended and plain client types under one cached global.

## Session Notes

- Add context needed to resume work in the next session.
