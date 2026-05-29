# Canvas Autosave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and restore collaborative canvas state using Vercel Blob for JSON storage and Prisma for the blob URL reference (`canvasJsonPath`).

**Architecture:** Canvas nodes and edges are serialized to JSON and uploaded to Vercel Blob on a 2-second debounce after every change. The blob URL is stored on the Prisma project record using the existing `canvasJsonPath` field. On load, if the Liveblocks room is empty and a saved blob URL exists, the saved state is fetched and loaded into the room. If the room already has nodes or edges, the load is skipped to avoid overwriting active collaboration. Save status (idle/saving/saved/error) is shown as a floating indicator inside the canvas.

**Tech Stack:** `@vercel/blob`, Prisma (`canvasJsonPath` field already exists), Liveblocks (`useLiveblocksFlow`), React Flow Panels

---

### Task 1: Install @vercel/blob

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

Run: `npm install @vercel/blob`
Expected: `@vercel/blob` added to `dependencies` in `package.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @vercel/blob"
```

---

### Task 2: Create canvas save/load API routes

**Files:**
- Create: `app/api/projects/[projectId]/canvas/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { put } from '@vercel/blob'
import { getClerkIdentity, getProjectAccess } from '@/lib/project-access'
import { prisma } from '@/lib/prisma'
import type { CanvasNode, CanvasEdge } from '@/types/canvas'

interface CanvasBody {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body: CanvasBody
  try {
    body = (await request.json()) as CanvasBody
  } catch {
    return Response.json({ error: 'malformed JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return Response.json({ error: 'nodes and edges are required' }, { status: 400 })
  }

  let blobUrl: string
  try {
    const blob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify({ nodes: body.nodes, edges: body.edges }),
      { access: 'public', contentType: 'application/json', addRandomSuffix: false }
    )
    blobUrl = blob.url
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to upload canvas' }, { status: 500 })
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blobUrl },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return Response.json({ url: blobUrl })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity()
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  const access = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!access) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let project: { canvasJsonPath: string | null } | null
  try {
    project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { canvasJsonPath: true },
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  if (!project?.canvasJsonPath) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  let canvas: unknown
  try {
    const res = await fetch(project.canvasJsonPath)
    if (!res.ok) return Response.json({ error: 'Failed to fetch canvas' }, { status: 502 })
    canvas = await res.json()
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return Response.json(canvas)
}
```

- [ ] **Step 2: Verify TypeScript (quick check)**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add "app/api/projects/[projectId]/canvas/route.ts"
git commit -m "feat: add canvas save/load API routes"
```

---

### Task 3: Create autosave hook

**Files:**
- Create: `hooks/use-canvas-autosave.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client"

import { useEffect, useRef, useState } from 'react'
import type { CanvasNode, CanvasEdge } from '@/types/canvas'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  debounceMs = 2000
): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountRef = useRef(true)

  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes, edges }),
        })
        setSaveStatus(res.ok ? 'saved' : 'error')
      } catch {
        setSaveStatus('error')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [projectId, nodes, edges, debounceMs])

  return saveStatus
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-canvas-autosave.ts
git commit -m "feat: add useCanvasAutosave hook"
```

---

### Task 4: Integrate autosave and canvas load into canvas-flow.tsx

**Files:**
- Modify: `components/editor/canvas-flow.tsx`

Changes:
1. Add `projectId` prop to `CanvasFlow` and `CanvasFlowInner`.
2. Wire `useCanvasAutosave` with nodes/edges.
3. Add `useEffect` that loads saved canvas on first mount if room is empty.
4. Render a floating save-status Panel inside `ReactFlow`.

- [ ] **Step 1: Replace canvas-flow.tsx with updated version**

Full file content:

```typescript
"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";
import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  Panel,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo } from "@liveblocks/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import { CanvasNodeComponent } from "@/components/editor/canvas-node";
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge";
import { ShapePanel } from "@/components/editor/shape-panel";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { LiveCursor } from "@/components/editor/live-cursors";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

const nodeTypes = { canvasNode: CanvasNodeComponent };
const edgeTypes = { canvasEdge: CanvasEdgeComponent };
const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed },
} as const;

interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${crypto.randomUUID()}`;
}

const SAVE_STATUS_LABEL: Record<SaveStatus, string | null> = {
  idle: null,
  saving: "Saving…",
  saved: "Saved",
  error: "Error saving",
};

interface CanvasFlowProps {
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasFlow({ projectId, isTemplatesOpen, onTemplatesClose }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesClose={onTemplatesClose}
      />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({
  projectId,
  isTemplatesOpen,
  onTemplatesClose,
}: {
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const rfInstance = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = rfInstance;
  const undo = useUndo();
  const redo = useRedo();
  useKeyboardShortcuts({ rfInstance, undo, redo });

  const saveStatus = useCanvasAutosave(projectId, nodes, edges);

  const hasAttemptedLoadRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedLoadRef.current) return;
    hasAttemptedLoadRef.current = true;

    if (nodes.length > 0 || edges.length > 0) return;

    async function loadSavedCanvas() {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok) return;
        const data = (await res.json()) as { nodes: CanvasNode[]; edges: CanvasEdge[] };
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
        if (data.nodes.length === 0 && data.edges.length === 0) return;

        onNodesChange(data.nodes.map((nd) => ({ type: "add" as const, item: nd })));
        onEdgesChange(data.edges.map((ed) => ({ type: "add" as const, item: ed })));
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            rfInstance.fitView({ duration: 300 });
          });
        });
      } catch {
        // Room stays empty if load fails
      }
    }

    loadSavedCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImport = useCallback(
    (template: CanvasTemplate) => {
      onNodesChange([
        ...nodes.map((nd) => ({ type: "remove" as const, id: nd.id })),
        ...template.nodes.map((nd) => ({ type: "add" as const, item: nd })),
      ]);
      onEdgesChange([
        ...edges.map((ed) => ({ type: "remove" as const, id: ed.id })),
        ...template.edges.map((ed) => ({ type: "add" as const, item: ed })),
      ]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rfInstance.fitView({ duration: 300 });
        });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, rfInstance]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/ghost-shape");
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      if (
        !(NODE_SHAPES as readonly string[]).includes(payload.shape) ||
        !Number.isFinite(payload.width) ||
        !Number.isFinite(payload.height) ||
        payload.width <= 0 ||
        payload.height <= 0
      ) {
        return;
      }

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const position = {
        x: flowPos.x - payload.width / 2,
        y: flowPos.y - payload.height / 2,
      };

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: NODE_COLORS[0].fill,
          shape: payload.shape,
        },
        width: payload.width,
        height: payload.height,
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const statusLabel = SAVE_STATUS_LABEL[saveStatus];

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionMode={ConnectionMode.Loose}
      fitView
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
        maskColor="rgba(0,0,0,0.6)"
        nodeColor="var(--border-subtle)"
      />
      <Panel position="top-right" className="mt-2 mr-2">
        <PresenceAvatars />
      </Panel>
      {statusLabel && (
        <Panel position="top-left" className="mt-2 ml-2">
          <span
            className={`text-xs px-2 py-1 rounded-xl bg-bg-elevated ${
              saveStatus === "error" ? "text-state-error" : "text-text-muted"
            }`}
          >
            {statusLabel}
          </span>
        </Panel>
      )}
      <Panel position="bottom-left" className="mb-4 ml-4">
        <CanvasControls />
      </Panel>
      <Panel position="bottom-center" className="mb-4">
        <ShapePanel />
      </Panel>
      <Cursors components={{ Cursor: LiveCursor }} />
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={(open) => { if (!open) onTemplatesClose(); }}
        onImport={handleImport}
        templates={CANVAS_TEMPLATES}
      />
    </ReactFlow>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/canvas-flow.tsx
git commit -m "feat: wire autosave and canvas load into CanvasFlow"
```

---

### Task 5: Thread projectId through canvas-room.tsx and workspace-shell.tsx

**Files:**
- Modify: `components/editor/canvas-room.tsx`
- Modify: `components/editor/workspace-shell.tsx`

- [ ] **Step 1: Update canvas-room.tsx**

Add `projectId` to `CanvasRoomProps` and pass it down to `CanvasFlow`.

Change `CanvasRoomProps` interface from:
```typescript
interface CanvasRoomProps {
  roomId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}
```
to:
```typescript
interface CanvasRoomProps {
  roomId: string;
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}
```

Change function signature from:
```typescript
export function CanvasRoom({ roomId, isTemplatesOpen, onTemplatesClose }: CanvasRoomProps) {
```
to:
```typescript
export function CanvasRoom({ roomId, projectId, isTemplatesOpen, onTemplatesClose }: CanvasRoomProps) {
```

Change the `<CanvasFlow` usage from:
```typescript
            <CanvasFlow
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={onTemplatesClose}
          />
```
to:
```typescript
            <CanvasFlow
              projectId={projectId}
              isTemplatesOpen={isTemplatesOpen}
              onTemplatesClose={onTemplatesClose}
            />
```

- [ ] **Step 2: Update workspace-shell.tsx**

Change the `<CanvasRoom` usage from:
```typescript
          <CanvasRoom
            roomId={activeProjectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={() => setIsTemplatesOpen(false)}
          />
```
to:
```typescript
          <CanvasRoom
            roomId={activeProjectId}
            projectId={activeProjectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={() => setIsTemplatesOpen(false)}
          />
```

- [ ] **Step 3: Commit**

```bash
git add components/editor/canvas-room.tsx components/editor/workspace-shell.tsx
git commit -m "feat: thread projectId to CanvasFlow for autosave"
```

---

### Task 6: Verify build

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: build exits with code 0. No TypeScript or lint errors.

- [ ] **Step 2: Commit all remaining changes if needed**

If any build fixes were required, commit them before marking done.

---

## Checklist (from spec)

- [ ] `@vercel/blob` is installed.
- [ ] Project schema supports storing the canvas blob URL (`canvasJsonPath` field already existed).
- [ ] Save/load routes use Prisma for metadata and Vercel Blob for canvas JSON.
- [ ] Autosave hook debounces canvas saves (2 seconds).
- [ ] Editor shows save status (floating Panel top-left: "Saving…" / "Saved" / "Error saving").
- [ ] Saved canvas does not load if the room already has active nodes or edges.
- [ ] `npm run build` passes.
