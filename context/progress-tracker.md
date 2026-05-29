# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Feature 21: Canvas Autosave

## Current Goal

Add autosave and loading for the collaborative canvas so project state is persisted. Canvas JSON stored in Vercel Blob; blob URL stored on the Prisma project record (`canvasJsonPath`).

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
- 15-node-color-toolbar: `ColorSwatch` and `ColorToolbar` components added to `canvas-node.tsx`. Toolbar floats 8px above selected nodes via `position: absolute; bottom: calc(100% + 8px)`. Shows 8 swatches (one per `NODE_COLORS` pair); active swatch gets a text-color ring, hover shows a tight glow (`${text}33` box-shadow). Swatch click calls `useMutation` to set `data.color` in Liveblocks storage; text color is derived from the pair automatically. Mouse/pointer events stopped on toolbar to prevent canvas drag. `npm run build` passes.
- 16-edge-behavior: `CanvasEdgeComponent` in `canvas-edge.tsx` — right-angle routing via `getSmoothStepPath`, wide transparent hit area (20px), thin visible stroke dimmed at rest (`var(--text-faint)`) / bright when selected (`var(--text-primary)`), `MarkerType.ArrowClosed` arrowhead, `EdgeLabelRenderer` + path midpoint for label position, inline label editing (grows with text, save on blur/Enter, cancel on Escape), pill badges for saved labels, faint "add label…" hint when edge is selected and empty, collaborative updates via `useMutation`. All 4 handles made `type="source"` bidirectional with CSS hover-reveal. `npm run build` passes.
- 17-canvas-ergonomics: `CanvasControls` component in `canvas-controls.tsx` — pill-shaped bar at bottom-left with zoom out/fit view/zoom in (animated via duration option) and undo/redo (disabled+dimmed when unavailable) using Liveblocks `useUndo`/`useRedo`/`useCanUndo`/`useCanRedo`. `useKeyboardShortcuts` hook in `hooks/useKeyboardShortcuts.ts` listens on `window` for `+`/`=` zoom in, `-` zoom out, `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` and `Cmd/Ctrl+Y` redo; skips editable targets. Wired into `canvas-flow.tsx`. `npm run build` passes.
- 18-starter-templates: `CANVAS_TEMPLATES` with microservices, CI/CD pipeline, and event-driven templates in `starter-templates.ts`. `StarterTemplatesModal` dialog with 3-column card grid, SVG previews (bounding-box scaled, no React Flow), name/description, and full-width Import button. Import handler in `CanvasFlowInner` replaces all nodes/edges via `onNodesChange`/`onEdgesChange` then calls `fitView`. Navbar "Import" button (Upload icon) in `EditorNavbar`. State threaded through `WorkspaceShell → CanvasRoom → CanvasFlow`. `npm run build` passes.
- 19-presence-avatars-cursors: `PresenceAvatars` in canvas `Panel position="top-right"` — filters `useOthers` excluding current Clerk user, overlapping avatar stack (up to 5) with +N overflow, divider only when collaborators exist, Clerk `UserButton` at end. `LiveCursor` custom component for `@liveblocks/react-flow` `<Cursors>` — colored SVG pointer + name badge using `other.info.color`. Presence type updated: `isThinking` → `thinking`. `npm run build` passes.
- 20-ai-sidebar-shell: `AISidebar` extracted into `ai-sidebar.tsx` — floating `fixed right-0` with `translate-x-full`/`translate-x-0` slide animation. Header with Bot icon, "AI Workspace" title, subtitle, close button. Two tabs (AI Architect / Specs) using Base UI Tabs with `bg-accent-ai` active styling. AI Architect tab: empty state with 3 starter chips, scrollable chat (user right-aligned `bg-accent-primary-dim`, assistant left-aligned `bg-bg-elevated`), auto-resizing textarea (72–160px), Send button. Specs tab: Generate Spec button and static demo card with FileText icon, title, snippet, disabled Download. Placeholder in `workspace-shell.tsx` replaced. `npm run build` passes.
- 21-canvas-autosave: `@vercel/blob` installed. `PUT/GET /api/projects/[projectId]/canvas` routes upload canvas JSON to Vercel Blob and store the URL in `project.canvasJsonPath`. `useCanvasAutosave` hook debounces saves (2 s) and tracks `idle | saving | saved | error` status. `CanvasFlowInner` loads saved canvas on mount if the Liveblocks room is empty; shows a floating save-status Panel (top-left). `projectId` threaded through `CanvasRoom` → `CanvasFlow`. `npm run build` passes.

## In Progress

- None.

## Next Up

- Feature 22 (TBD)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Multi-file Prisma schema: `prisma.config.ts` points `schema` to the `prisma/` directory; Prisma recursively merges all `*.prisma` files. Generator + datasource live in `schema.prisma`; models live in `prisma/models/`.
- `lib/prisma.ts` uses `ReturnType<typeof createClient>` to unify the Accelerate-extended and plain client types under one cached global.

## Session Notes

- Add context needed to resume work in the next session.
