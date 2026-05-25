# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 14: Node Editing

## Current Goal

- Add node resizing and inline label editing to canvas nodes.

## Completed

- 01-design-system: shadcn/ui configured with Tailwind v4, all 7 UI primitive components added, lucide-react installed, dark theme CSS variables set in globals.css, lib/utils.ts cn() helper in place.
- 02-editor: `EditorNavbar` and `ProjectSidebar` built. Navbar has sidebar toggle with PanelLeftOpen/PanelLeftClose icons. Sidebar is a fixed overlay that slides in from the left with tabs (My Projects / Shared), empty placeholder states, and a New Project button. `app/page.tsx` wired up to demo both components.
- 03-auth: Clerk wired in. `ClerkProvider` with dark theme in root layout. `proxy.ts` protects all routes except `/`, `/sign-in`, `/sign-up`. Two-panel sign-in/sign-up pages. `/` redirects to `/editor` or `/sign-in` based on auth. `UserButton` in editor navbar. `npm run build` passes.
- 04-project-dialogs: Editor home screen with heading, description, and New Project button. `useProjectDialogs` hook manages dialog/form/loading state. Create dialog with live slug preview, Rename dialog with prefilled input/auto-focus/Enter-to-submit, Delete dialog with destructive confirm. Sidebar wired with per-item Rename/Delete actions (owned only), mobile backdrop scrim. All wired through `EditorPage`. TypeScript and lint clean.
- 05-prisma: `prisma/models/project.prisma` with `Project` + `ProjectCollaborator` models, enums, relations, and indexes. `lib/prisma.ts` cached singleton branching on `prisma+postgres://` (Accelerate) vs direct `@prisma/adapter-pg`. Multi-file schema via `prisma.config.ts` directory mode. Migration `init_project_models` applied. `npm run build` passes.
- 06-project-apis: `GET/POST /api/projects` and `PATCH/DELETE /api/projects/[projectId]` route handlers. Auth enforced via Clerk `auth()`. Owner-only checks on rename/delete. 401 for unauthenticated, 403 for non-owner mutations.
- 07-wire-editor-home: `app/editor/page.tsx` converted to server component; fetches owned + shared projects via `lib/data/projects.ts`. `hooks/use-project-actions.ts` manages create/rename/delete with real API calls and navigation. `EditorHome` client wrapper wires sidebar and dialogs to real data. Create dialog shows room ID preview (`slug-suffix`). Post-rename refreshes; post-delete redirects to `/editor` if active workspace, otherwise refreshes. `npm run build` passes.
- 08-editor-workspace-shell: `app/editor/[roomId]/page.tsx` server component with auth redirect and `AccessDenied` for missing/unauthorized projects. `lib/project-access.ts` exposes `getClerkIdentity` and `getProjectAccess` helpers. `components/editor/access-denied.tsx` centered lock-icon page with back link. `EditorNavbar` extended with optional `projectName`, share button, and AI sidebar toggle. `ProjectSidebar` extended with `activeProjectId` prop for room highlighting. `WorkspaceShell` client wrapper with canvas placeholder and collapsible AI sidebar placeholder. `npm run build` passes.
- 09-share-dialog: Share dialog added. Owners can invite/remove collaborators by email; collaborator list enriched with Clerk display name and avatar, falling back to initials. Collaborators see read-only list. Copy link button with "Copied!" feedback. API routes: `GET/POST /api/projects/[projectId]/collaborators`, `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]`. `getProjectAccess` now returns `isOwner`. `npm run build` passes.
- 10-liveblocks-setup: `liveblocks.config.ts` typed with `Presence` (cursor + isThinking) and `UserMeta` (name, avatar, color). `lib/liveblocks.ts` exports cached `Liveblocks` node client and `getUserColor` deterministic color helper. `POST /api/liveblocks-auth` verifies Clerk auth + project access, ensures room exists via `getOrCreateRoom`/`updateRoom`, and returns an ID-token session with name, avatar, and cursor color. `npm run build` passes.
- 11-base-canvas: `types/canvas.ts` defines `CanvasNodeData`, `CanvasNode`, `CanvasEdge`, `NODE_COLORS`, `NODE_SHAPES`. `liveblocks.config.ts` Storage typed as `{ flow: LiveblocksFlow<CanvasNode, CanvasEdge> }`. `canvas-room.tsx` wraps `LiveblocksProvider` + `RoomProvider` with initial presence/storage, `ClientSideSuspense` loading state, and class-based error fallback. `canvas-flow.tsx` uses `useLiveblocksFlow` with suspense, renders `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, and dot-pattern `Background`. Canvas placeholder replaced in `workspace-shell.tsx`. `npm run build` passes.
- 12-shape-panel: `canvas-node.tsx` custom node renderer (bordered rectangle, centered label, 4 handles). `shape-panel.tsx` floating pill toolbar with 6 draggable shape buttons (rectangle, diamond, circle, pill, cylinder, hexagon) and `application/ghost-shape` drag payload. `canvas-flow.tsx` wrapped in `ReactFlowProvider`; inner component uses `useReactFlow` for `screenToFlowPosition` and drops via `onNodesChange([{ type: "add", item }])`. `npm run build` passes.
- 13-node-shape: `canvas-node.tsx` replaced with proper shape rendering — rectangle/pill/circle via CSS border-radius, diamond/hexagon/cylinder via inline SVG with `vectorEffect="non-scaling-stroke"`. `shape-panel.tsx` extended with ghost drag preview: suppresses browser default ghost via transparent GIF, tracks cursor via document `dragover`, renders a fixed-position portal following the cursor. `npm run build` passes.
- 14-node-editing: `canvas-node.tsx` extended with `NodeResizer` (subtle 7px handles, accent-primary color, 80×40 minimum) and inline label editing — double-click opens a transparent textarea overlay, label updates via `useMutation` directly into Liveblocks storage, closes on blur or Escape, pointer/mouse events stopped on the textarea to prevent canvas drag. Placeholder text shown in `--text-faint` when label is empty. `npm run build` passes.

## In Progress

- None.

## Next Up

- Feature 15: TBD

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Multi-file Prisma schema: `prisma.config.ts` points `schema` to the `prisma/` directory; Prisma recursively merges all `*.prisma` files. Generator + datasource live in `schema.prisma`; models live in `prisma/models/`.
- `lib/prisma.ts` uses `ReturnType<typeof createClient>` to unify the Accelerate-extended and plain client types under one cached global.

## Session Notes

- Add context needed to resume work in the next session.
