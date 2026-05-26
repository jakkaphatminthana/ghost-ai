# Starter Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a curated starter-template library so users can import a pre-built canvas diagram instead of starting from scratch.

**Architecture:** Template data lives in a static `starter-templates.ts` file using the existing `CanvasNode`/`CanvasEdge` types. A `StarterTemplatesModal` component (a shadcn `Dialog`) renders template cards with lightweight SVG previews — no React Flow instance needed. The modal renders *inside* `CanvasFlowInner` (inside the Liveblocks `RoomProvider`) so the import handler can call `onNodesChange`/`onEdgesChange` directly to replace all nodes and edges in collaborative storage. A `LayoutTemplate` button in the navbar triggers the modal via state threaded through `WorkspaceShell → CanvasRoom → CanvasFlow`.

**Tech Stack:** Next.js 16, TypeScript strict, React, Liveblocks (`@liveblocks/react-flow` `useLiveblocksFlow`), shadcn/ui `Dialog`, Tailwind CSS tokens, Lucide React icons, `@xyflow/react` `useReactFlow`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/editor/starter-templates.ts` | `CanvasTemplate` type, helper fns, `CANVAS_TEMPLATES` array |
| Create | `components/editor/starter-templates-modal.tsx` | Dialog, grid of cards, SVG previews, import button |
| Modify | `components/editor/canvas-flow.tsx` | Accept `isTemplatesOpen`/`onTemplatesClose` props, render modal, handle import |
| Modify | `components/editor/canvas-room.tsx` | Thread `isTemplatesOpen`/`onTemplatesClose` through to `CanvasFlow` |
| Modify | `components/editor/editor-navbar.tsx` | Add `onTemplatesClick` prop + `LayoutTemplate` button |
| Modify | `components/editor/workspace-shell.tsx` | `isTemplatesOpen` state, wire navbar + canvas-room |
| Modify | `context/progress-tracker.md` | Record Feature 18 completion |

---

## Task 1: Template data

**Files:**
- Create: `components/editor/starter-templates.ts`

- [ ] **Step 1: Create the file with `CanvasTemplate` type and helpers**

```typescript
import { MarkerType } from "@xyflow/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: NodeShape,
  colorIndex: number,
  width = 140,
  height = 48
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: NODE_COLORS[colorIndex].fill, shape },
    width,
    height,
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: label ? { label } : {},
  };
}
```

- [ ] **Step 2: Add the Microservices Architecture template**

```typescript
const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description: "API gateway routing to isolated services with a shared message bus and per-service databases.",
  nodes: [
    n("client",        "Client",              120,   0, "rectangle", 4, 120, 44),
    n("gateway",       "API Gateway",         100,  80, "hexagon",   1, 160, 56),
    n("auth",          "Auth Service",          0, 200, "rectangle", 2, 140, 48),
    n("user",          "User Service",        170, 200, "rectangle", 1, 140, 48),
    n("order",         "Order Service",       340, 200, "rectangle", 3, 140, 48),
    n("notify",        "Notification Svc",    510, 200, "rectangle", 7, 160, 48),
    n("bus",           "Message Bus",         340, 100, "pill",      5, 160, 40),
    n("userdb",        "Users DB",            170, 300, "cylinder",  0, 120, 52),
    n("orderdb",       "Orders DB",           340, 300, "cylinder",  0, 120, 52),
  ],
  edges: [
    e("c-g",   "client",  "gateway"),
    e("g-auth","gateway", "auth"),
    e("g-user","gateway", "user"),
    e("g-ord", "gateway", "order"),
    e("ord-b", "order",   "bus"),
    e("b-not", "bus",     "notify"),
    e("user-db","user",   "userdb"),
    e("ord-db","order",   "orderdb"),
  ],
};
```

- [ ] **Step 3: Add the CI/CD Pipeline template**

```typescript
const cicd: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description: "Source-to-production pipeline with build, test, artifact registry, staging, and smoke-test stages.",
  nodes: [
    n("repo",     "Source Repo",      0,   60, "rectangle", 1, 130, 48),
    n("build",    "Build",          160,   60, "rectangle", 6, 110, 48),
    n("test",     "Test Suite",     300,   60, "rectangle", 3, 120, 48),
    n("registry", "Artifact Registry", 450, 60, "cylinder",  1, 150, 52),
    n("staging",  "Staging Deploy", 630,   60, "rectangle", 7, 140, 48),
    n("smoke",    "Smoke Tests",    630,  150, "rectangle", 2, 130, 48),
    n("prod",     "Prod Deploy",    800,   60, "rectangle", 6, 130, 48),
  ],
  edges: [
    e("r-b",  "repo",     "build",    "push"),
    e("b-t",  "build",    "test"),
    e("t-r",  "test",     "registry", "pass"),
    e("r-s",  "registry", "staging"),
    e("s-sm", "staging",  "smoke"),
    e("sm-p", "smoke",    "prod",     "approved"),
  ],
};
```

- [ ] **Step 4: Add the Event-Driven System template**

```typescript
const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producers publish to an event bus; consumers process events asynchronously with a dead-letter queue for failures.",
  nodes: [
    n("p1",   "Producer A",       0,  80, "hexagon",   1, 130, 48),
    n("p2",   "Producer B",       0, 160, "hexagon",   3, 130, 48),
    n("bus",  "Event Bus",       190, 120, "pill",      2, 160, 48),
    n("c1",   "Consumer Group 1",360,  60, "rectangle", 7, 150, 48),
    n("c2",   "Consumer Group 2",360, 160, "rectangle", 6, 150, 48),
    n("dlq",  "Dead-Letter Queue",360, 260, "rectangle", 3, 160, 48),
    n("store","Storage",         550, 100, "cylinder",  0, 120, 52),
  ],
  edges: [
    e("p1-b", "p1",  "bus"),
    e("p2-b", "p2",  "bus"),
    e("b-c1", "bus", "c1"),
    e("b-c2", "bus", "c2"),
    e("b-dlq","bus", "dlq",   "failure"),
    e("c1-s", "c1",  "store"),
    e("c2-s", "c2",  "store"),
  ],
};
```

- [ ] **Step 5: Export the templates array**

```typescript
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicd,
  eventDriven,
];
```

---

## Task 2: Starter templates modal

**Files:**
- Create: `components/editor/starter-templates-modal.tsx`

- [ ] **Step 1: Create the file with imports, SVG helpers**

```typescript
"use client";

import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import type { NodeShape } from "@/types/canvas";

// ─── SVG preview ─────────────────────────────────────────────────────────────

const PREVIEW_W = 200;
const PREVIEW_H = 120;
const PREVIEW_PAD = 10;

function previewCoords(nodes: CanvasTemplate["nodes"]) {
  const xs = nodes.flatMap((nd) => [nd.position.x, nd.position.x + (nd.width ?? 140)]);
  const ys = nodes.flatMap((nd) => [nd.position.y, nd.position.y + (nd.height ?? 48)]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const bw = Math.max(...xs) - minX;
  const bh = Math.max(...ys) - minY;
  const scale = Math.min(
    (PREVIEW_W - PREVIEW_PAD * 2) / (bw || 1),
    (PREVIEW_H - PREVIEW_PAD * 2) / (bh || 1)
  );
  const offsetX = PREVIEW_PAD + ((PREVIEW_W - PREVIEW_PAD * 2) - bw * scale) / 2;
  const offsetY = PREVIEW_PAD + ((PREVIEW_H - PREVIEW_PAD * 2) - bh * scale) / 2;
  return {
    tx: (x: number) => (x - minX) * scale + offsetX,
    ty: (y: number) => (y - minY) * scale + offsetY,
    scale,
  };
}
```

- [ ] **Step 2: Add `PreviewShape` SVG component**

```typescript
function PreviewShape({
  x, y, w, h, shape, fill,
}: {
  x: number; y: number; w: number; h: number; shape: NodeShape; fill: string;
}) {
  switch (shape) {
    case "rectangle":
      return <rect x={x} y={y} width={w} height={h} fill={fill} rx={3} />;
    case "pill":
      return <rect x={x} y={y} width={w} height={h} fill={fill} rx={h / 2} />;
    case "circle": {
      const r = Math.min(w, h) / 2;
      return <circle cx={x + w / 2} cy={y + h / 2} r={r} fill={fill} />;
    }
    case "diamond": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      return (
        <polygon
          points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
          fill={fill}
        />
      );
    }
    case "hexagon": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const pts = [0, 60, 120, 180, 240, 300]
        .map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return `${cx + (w / 2) * Math.cos(rad)},${cy + (h / 2) * Math.sin(rad)}`;
        })
        .join(" ");
      return <polygon points={pts} fill={fill} />;
    }
    case "cylinder": {
      const ry = h * 0.2;
      return (
        <>
          <rect x={x} y={y + ry} width={w} height={h - ry} fill={fill} />
          <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} fill={fill} />
          <ellipse
            cx={x + w / 2}
            cy={y + ry}
            rx={w / 2}
            ry={ry}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.5}
          />
        </>
      );
    }
  }
}
```

- [ ] **Step 3: Add `TemplatePreview` component**

```typescript
function TemplatePreview({ nodes, edges }: Pick<CanvasTemplate, "nodes" | "edges">) {
  const { tx, ty, scale } = previewCoords(nodes);

  const centers = new Map<string, { x: number; y: number }>();
  for (const nd of nodes) {
    const w = (nd.width ?? 140) * scale;
    const h = (nd.height ?? 48) * scale;
    centers.set(nd.id, { x: tx(nd.position.x) + w / 2, y: ty(nd.position.y) + h / 2 });
  }

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="block rounded-xl overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {edges.map((ed) => {
        const s = centers.get(ed.source);
        const t = centers.get(ed.target);
        if (!s || !t) return null;
        return (
          <line
            key={ed.id}
            x1={s.x} y1={s.y}
            x2={t.x} y2={t.y}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((nd) => {
        const x = tx(nd.position.x);
        const y = ty(nd.position.y);
        const w = (nd.width ?? 140) * scale;
        const h = (nd.height ?? 48) * scale;
        return (
          <PreviewShape
            key={nd.id}
            x={x} y={y} w={w} h={h}
            shape={nd.data.shape}
            fill={nd.data.color}
          />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Add `StarterTemplatesModal` component and export it**

```typescript
interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
  templates: CanvasTemplate[];
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
  templates,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-bg-surface border-border-default rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-accent-primary" />
            <DialogTitle className="text-base font-semibold text-text-primary">
              Starter Templates
            </DialogTitle>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Import a pre-built architecture to start from. Your current canvas will be replaced.
          </p>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="grid grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col gap-3 rounded-2xl bg-bg-elevated border border-border-default p-4 hover:border-border-subtle transition-colors"
              >
                <div className="rounded-xl overflow-hidden border border-border-default">
                  <TemplatePreview nodes={tpl.nodes} edges={tpl.edges} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-text-primary">{tpl.name}</span>
                  <span className="text-xs text-text-muted leading-relaxed">{tpl.description}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-accent-primary-dim text-accent-primary border border-accent-primary/20 hover:bg-accent-primary hover:text-bg-base transition-colors"
                  onClick={() => {
                    onImport(tpl);
                    onOpenChange(false);
                  }}
                >
                  Import
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Task 3: Wire import into CanvasFlowInner

**Files:**
- Modify: `components/editor/canvas-flow.tsx`

The `CanvasFlow` (exported) and `CanvasFlowInner` components must accept `isTemplatesOpen` and `onTemplatesClose` props. The import handler uses the `onNodesChange`/`onEdgesChange` callbacks from `useLiveblocksFlow` — passing a combined array of remove + add changes — then calls `fitView` after a tick.

- [ ] **Step 1: Add imports for the new components at the top of `canvas-flow.tsx`**

After the existing imports, add:

```typescript
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
```

- [ ] **Step 2: Add props interface and update `CanvasFlow` signature**

Replace:
```typescript
export function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}
```

With:
```typescript
interface CanvasFlowProps {
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasFlow({ isTemplatesOpen, onTemplatesClose }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesClose={onTemplatesClose}
      />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 3: Add props to `CanvasFlowInner` and implement `handleImport`**

Replace the `function CanvasFlowInner()` declaration and the line `const rfInstance = ...` through the `useKeyboardShortcuts` call with the following (all other code in the function body stays as-is):

```typescript
function CanvasFlowInner({
  isTemplatesOpen,
  onTemplatesClose,
}: {
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
      setTimeout(() => {
        rfInstance.fitView({ duration: 300 });
      }, 50);
    },
    [nodes, edges, onNodesChange, onEdgesChange, rfInstance]
  );
```

- [ ] **Step 4: Render `StarterTemplatesModal` inside the `<ReactFlow>` return**

Inside the `return (` block of `CanvasFlowInner`, add the modal right before the closing `</ReactFlow>` tag (after the last `<Panel>` element):

```tsx
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={(open) => { if (!open) onTemplatesClose(); }}
        onImport={handleImport}
        templates={CANVAS_TEMPLATES}
      />
```

---

## Task 4: Thread props through CanvasRoom

**Files:**
- Modify: `components/editor/canvas-room.tsx`

- [ ] **Step 1: Add props to `CanvasRoomProps` and thread them through**

Replace:
```typescript
interface CanvasRoomProps {
  roomId: string;
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
```

With:
```typescript
interface CanvasRoomProps {
  roomId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasRoom({ roomId, isTemplatesOpen, onTemplatesClose }: CanvasRoomProps) {
```

- [ ] **Step 2: Pass the props to `CanvasFlow`**

Replace:
```tsx
          <CanvasFlow />
```

With:
```tsx
          <CanvasFlow
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={onTemplatesClose}
          />
```

---

## Task 5: Add `LayoutTemplate` button to EditorNavbar

**Files:**
- Modify: `components/editor/editor-navbar.tsx`

- [ ] **Step 1: Add `LayoutTemplate` to the Lucide import and new prop**

Replace the first line of the file:
```typescript
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";
```
With:
```typescript
import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";
```

Add `onTemplatesClick` to the props interface and destructuring:
```typescript
interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  projectName?: string;
  onShareClick?: () => void;
  isAiSidebarOpen?: boolean;
  onAiSidebarToggle?: () => void;
  onTemplatesClick?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  projectName,
  onShareClick,
  isAiSidebarOpen,
  onAiSidebarToggle,
  onTemplatesClick,
}: EditorNavbarProps) {
```

- [ ] **Step 2: Add the `LayoutTemplate` button in the right-side actions row**

In the `<div className="flex items-center gap-1">` section, insert the new button *before* the `{onShareClick && ...}` block:

```tsx
        {onTemplatesClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTemplatesClick}
            className="h-8 gap-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        )}
```

---

## Task 6: Wire state in WorkspaceShell

**Files:**
- Modify: `components/editor/workspace-shell.tsx`

- [ ] **Step 1: Add `isTemplatesOpen` state**

After the existing `const [isShareOpen, setIsShareOpen] = useState(false);` line, add:

```typescript
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
```

- [ ] **Step 2: Pass `onTemplatesClick` to `EditorNavbar`**

In the `<EditorNavbar ... />` JSX, add the prop:

```tsx
        onTemplatesClick={() => setIsTemplatesOpen(true)}
```

- [ ] **Step 3: Pass template open state to `CanvasRoom`**

Replace:
```tsx
          <CanvasRoom roomId={activeProjectId} />
```

With:
```tsx
          <CanvasRoom
            roomId={activeProjectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={() => setIsTemplatesOpen(false)}
          />
```

---

## Task 7: Update progress tracker and verify build

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Update `progress-tracker.md` — set phase and mark complete**

At the top of the file, set:
```
## Current Phase
Feature 18: Starter Templates

## Current Goal
Delivered.
```

Move the feature from `## In Progress` to `## Completed`:
```
- 18-starter-templates: `CANVAS_TEMPLATES` with microservices, CI/CD, and event-driven templates. `StarterTemplatesModal` with SVG card previews. Import replaces canvas via `onNodesChange`/`onEdgesChange`. Navbar "Templates" button in `EditorNavbar`. All wired through `WorkspaceShell → CanvasRoom → CanvasFlow`.
```

- [ ] **Step 2: Run build and confirm it passes**

```bash
npm run build
```

Expected: build completes with no TypeScript errors and no lint errors.

- [ ] **Step 3: Commit**

```bash
git add \
  components/editor/starter-templates.ts \
  components/editor/starter-templates-modal.tsx \
  components/editor/canvas-flow.tsx \
  components/editor/canvas-room.tsx \
  components/editor/editor-navbar.tsx \
  components/editor/workspace-shell.tsx \
  context/progress-tracker.md
git commit -m "feat: starter template library with SVG previews and canvas import"
```
