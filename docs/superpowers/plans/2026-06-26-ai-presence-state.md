# AI Presence State (Feature 24) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared AI activity indicators — a real-time status feed in the AI sidebar (visible to all room participants), loading states on the chat input, and a thinking spinner on live cursor badges.

**Architecture:** Reuse the existing `RoomEvent` broadcast channel (`type: "ai-status"`) as the `ai-status-feed`. Move `AISidebar` inside the Liveblocks `RoomProvider` so it can call `useEventListener` for shared state. Cursor badges read `thinking` from the Liveblocks presence already set by the design agent.

**Tech Stack:** `@liveblocks/react` (`useEventListener`), TypeScript type guards, Tailwind CSS tokens from `globals.css`, Lucide icons.

## Global Constraints

- Dark theme only. Use CSS variable tokens (`bg-accent-ai/10`, `text-accent-ai-text`, `border-border-subtle`) — no raw hex or `zinc-*` classes.
- `rounded-xl` for small inline UI elements.
- Lucide stroke icons only: `h-4 w-4` inline, `h-5 w-5` for buttons.
- Strict TypeScript — no `any`.
- `useEventListener` from `@liveblocks/react` (not the suspense variant) — it's a side-effect listener, not a data hook.
- Do NOT add actual AI generation logic, trigger background tasks, or block/dim the whole sidebar.
- `npm run build` must pass at the end.

---

### Task 1: Feed payload schema

**Files:**
- Create: `types/tasks.ts`

**Interfaces:**
- Produces: `AiStatusValue`, `AiStatusPayload`, `isAiStatusPayload(value: unknown): value is AiStatusPayload` — consumed by Task 4.

- [ ] **Step 1: Create `types/tasks.ts`**

```ts
export const AI_STATUS_VALUES = [
  "start",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusValue = (typeof AI_STATUS_VALUES)[number];

export interface AiStatusPayload {
  status: AiStatusValue;
  text?: string;
}

export function isAiStatusPayload(value: unknown): value is AiStatusPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!AI_STATUS_VALUES.includes(v.status as AiStatusValue)) return false;
  if (v.text !== undefined && typeof v.text !== "string") return false;
  return true;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `types/tasks.ts`

---

### Task 2: Thinking indicator on live cursor badges

**Files:**
- Modify: `components/editor/live-cursors.tsx`

**Interfaces:**
- Consumes: `Presence.thinking: boolean` already declared in `liveblocks.config.ts`.
- Produces: cursor badge with optional spinner — no interface change.

Context: `LiveCursor` currently reads `name` and `color` from `useOther`. It is rendered inside `ClientSideSuspense` (via `canvas-flow.tsx`), so the suspense import from `@liveblocks/react/suspense` is correct and must stay.

- [ ] **Step 1: Add `thinking` to the `useOther` selector**

In `components/editor/live-cursors.tsx`, change:

```ts
const other = useOther(connectionId, (o) => ({
  name: o.info.name,
  color: o.info.color,
}));
```

to:

```ts
const other = useOther(connectionId, (o) => ({
  name: o.info.name,
  color: o.info.color,
  thinking: o.presence.thinking,
}));
```

- [ ] **Step 2: Add spinner to the name badge**

Replace the name badge `<div>`:

```tsx
<div
  className="mt-0.5 max-w-36 truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-white shadow-sm"
  style={{ backgroundColor: other.color }}
>
  {other.name}
</div>
```

with:

```tsx
<div
  className="mt-0.5 flex max-w-36 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-white shadow-sm"
  style={{ backgroundColor: other.color }}
>
  {other.thinking && (
    <span className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
  )}
  <span className="truncate">{other.name}</span>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 3: Relocate `AISidebar` inside the Liveblocks `RoomProvider`

**Files:**
- Modify: `components/editor/canvas-room.tsx` (add AI sidebar props, render `AISidebar` inside `RoomProvider`)
- Modify: `components/editor/workspace-shell.tsx` (pass new props to `CanvasRoom`, remove standalone `AISidebar`)

**Interfaces:**
- Consumes: `AISidebarProps` (`isOpen`, `onClose`, `projectId`, `roomId`) — already defined in `ai-sidebar.tsx`.
- Produces: `CanvasRoomProps` gains `isAiSidebarOpen: boolean` and `onAiSidebarClose: () => void`.

Why: `useEventListener` must be called inside a `RoomProvider`. `AISidebar` currently sits outside `RoomProvider` in `WorkspaceShell`. Moving it inside makes both `CanvasFlow` and `AISidebar` children of the same provider, enabling shared room event subscriptions.

- [ ] **Step 1: Update `canvas-room.tsx`**

Full replacement of `canvas-room.tsx`:

```tsx
"use client";

import { Component, type ReactNode } from "react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";
import { CanvasFlow } from "@/components/editor/canvas-flow";
import { AISidebar } from "@/components/editor/ai-sidebar";

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-text-muted">Failed to connect to canvas.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CanvasRoomProps {
  roomId: string;
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
  isAiSidebarOpen: boolean;
  onAiSidebarClose: () => void;
}

export function CanvasRoom({
  roomId,
  projectId,
  isTemplatesOpen,
  onTemplatesClose,
  isAiSidebarOpen,
  onAiSidebarClose,
}: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
          initialStorage={() => ({
            flow: new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            }),
          })}
        >
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">Loading canvas…</p>
              </div>
            }
          >
            <CanvasFlow
              projectId={projectId}
              isTemplatesOpen={isTemplatesOpen}
              onTemplatesClose={onTemplatesClose}
            />
          </ClientSideSuspense>

          <AISidebar
            isOpen={isAiSidebarOpen}
            onClose={onAiSidebarClose}
            projectId={projectId}
            roomId={roomId}
          />
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}
```

- [ ] **Step 2: Update `workspace-shell.tsx` — pass AI sidebar props to `CanvasRoom`, remove standalone `AISidebar`**

The diff:

1. Remove the `AISidebar` import.
2. In the JSX, remove the standalone `<AISidebar .../>` element.
3. Add `isAiSidebarOpen` and `onAiSidebarClose` props to `<CanvasRoom>`.

Full replacement of `workspace-shell.tsx`:

```tsx
"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasRoom } from "@/components/editor/canvas-room";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/lib/data/projects";

interface WorkspaceShellProps {
  projectName: string;
  activeProjectId: string;
  isOwner: boolean;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceShell({
  projectName,
  activeProjectId,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const {
    dialogType,
    activeProject,
    nameInput,
    setNameInput,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions();

  return (
    <div className="flex h-screen flex-col bg-bg-base text-text-primary overflow-hidden">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        projectName={projectName}
        onShareClick={() => setIsShareOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((prev) => !prev)}
        onTemplatesClick={() => setIsTemplatesOpen(true)}
      />

      <div className="relative flex-1 overflow-hidden flex">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={activeProjectId}
          onCreateProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />

        <main className="flex-1 overflow-hidden">
          <CanvasRoom
            roomId={activeProjectId}
            projectId={activeProjectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={() => setIsTemplatesOpen(false)}
            isAiSidebarOpen={isAiSidebarOpen}
            onAiSidebarClose={() => setIsAiSidebarOpen(false)}
          />
        </main>
      </div>

      <ProjectDialogs
        dialogType={dialogType}
        activeProject={activeProject}
        nameInput={nameInput}
        setNameInput={setNameInput}
        roomId={roomId}
        isLoading={isLoading}
        onClose={closeDialog}
        onConfirmCreate={handleCreate}
        onConfirmRename={handleRename}
        onConfirmDelete={handleDelete}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={activeProjectId}
        projectName={projectName}
        isOwner={isOwner}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 4: Subscribe to `ai-status-feed` and render shared status in sidebar

**Files:**
- Modify: `components/editor/ai-sidebar.tsx`

**Interfaces:**
- Consumes: `AiStatusPayload`, `isAiStatusPayload` from `@/types/tasks` (Task 1).
- Consumes: `useEventListener` from `@liveblocks/react` — callback receives `{ event: RoomEvent }` where `RoomEvent` is typed in `liveblocks.config.ts`.
- `AISidebar` is now inside `RoomProvider` (Task 3), so `useEventListener` is valid here.

Design:
- `aiStatus: AiStatusPayload | null` — tracks the latest event for the status strip.
- `useEventListener` drives `isGenerating` for ALL users (not just the initiator). `start` → `true`; `complete`/`error` → `false`.
- `useRealtimeRun` continues to handle adding the AI's reply message for the initiating user only. Non-initiating users see the status strip but not the chat message (chat is local-per-user).
- Status strip: thin colored bar above the scrollable chat area showing the latest `aiStatus.text`.
- Send button: shows a spinner instead of the Send icon while `isGenerating`.

- [ ] **Step 1: Add imports**

At the top of `components/editor/ai-sidebar.tsx`, add after the existing imports:

```ts
import { useEventListener } from "@liveblocks/react";
import { isAiStatusPayload, type AiStatusPayload } from "@/types/tasks";
```

- [ ] **Step 2: Add `aiStatus` state**

Inside the `AISidebar` function body, after the existing `useState` declarations:

```ts
const [aiStatus, setAiStatus] = useState<AiStatusPayload | null>(null);
```

- [ ] **Step 3: Add `useEventListener` subscription**

After the existing `useRealtimeRun` call and before the `useEffect` blocks:

```ts
useEventListener(({ event }) => {
  if (event.type !== "ai-status") return;
  const payload: AiStatusPayload = {
    status: event.status,
    text: event.message || undefined,
  };
  if (!isAiStatusPayload(payload)) return;

  setAiStatus(payload);

  if (payload.status === "start" || payload.status === "processing") {
    setIsGenerating(true);
  }

  if (payload.status === "complete" || payload.status === "error") {
    setIsGenerating(false);
    setAiStatus(null);
  }
});
```

- [ ] **Step 4: Add status strip inside `TabsContent value="architect"`**

Locate the `TabsContent value="architect"` element:

```tsx
<TabsContent value="architect" className="flex flex-col overflow-hidden">
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
```

Insert the status strip between the opening tag and the scrollable div:

```tsx
<TabsContent value="architect" className="flex flex-col overflow-hidden">
  {isGenerating && (
    <div className="shrink-0 flex items-center gap-2 border-b border-border-subtle bg-accent-ai/10 px-4 py-2">
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-ai" />
      <span className="truncate text-xs text-accent-ai-text">
        {aiStatus?.text ?? "AI is working…"}
      </span>
    </div>
  )}
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
```

- [ ] **Step 5: Replace Send icon with spinner when `isGenerating`**

Locate the send `Button`:

```tsx
<Button
  size="icon"
  onClick={handleSend}
  disabled={!input.trim() || isGenerating}
  className="h-9 w-9 shrink-0 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
>
  <Send className="h-4 w-4" />
</Button>
```

Replace with:

```tsx
<Button
  size="icon"
  onClick={handleSend}
  disabled={!input.trim() || isGenerating}
  className="h-9 w-9 shrink-0 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
>
  {isGenerating ? (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  ) : (
    <Send className="h-4 w-4" />
  )}
</Button>
```

- [ ] **Step 6: Remove unused `Send` import if needed**

Check if `Send` is still used elsewhere in the file. If only on the send button, it's still imported and used conditionally — no removal needed.

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 5: Build verification

**Files:**
- No changes — verification only.

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build completes with no TypeScript or Next.js errors. Any warnings about image sizes or similar are OK.

- [ ] **Step 2: Confirm spec checklist**

- [ ] Sidebar renders shared AI status from the `ai-status-feed` event stream (status strip visible for all room participants when `isGenerating`)
- [ ] Chat input and send button respond to active generation state (input disabled, spinner on button)
- [ ] Cursor badges read `thinking` from presence and show a spinner in the name badge
- [ ] Feed messages are validated through `isAiStatusPayload` before rendering
- [ ] `npm run build` passes
