# Edge Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace default canvas edges with custom right-angle edges that have wide hit areas, dim/bright states, and inline collaborative label editing.

**Architecture:** Add a `canvas-edge.tsx` custom edge renderer that uses `getSmoothStepPath` for routing, `EdgeLabelRenderer` for label positioning, and `useMutation` for collaborative label updates. Wire `edgeTypes` and `defaultEdgeOptions` into `canvas-flow.tsx`. Update handles in `canvas-node.tsx` to all-source bidirectional with hover-reveal CSS.

**Tech Stack:** React Flow (`@xyflow/react`), Liveblocks (`@liveblocks/react`), TypeScript strict mode, Tailwind + CSS custom properties.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types/canvas.ts` | Add typed `CanvasEdgeData` interface |
| Modify | `app/globals.css` | Handle hover-reveal CSS |
| Modify | `components/editor/canvas-node.tsx` | Bidirectional source handles |
| Create | `components/editor/canvas-edge.tsx` | Custom edge renderer + label editing |
| Modify | `components/editor/canvas-flow.tsx` | Register edgeTypes + defaultEdgeOptions |
| Modify | `context/progress-tracker.md` | Update phase, in-progress, completed |

---

## Task 1: Update CanvasEdge type

**Files:**
- Modify: `types/canvas.ts`

- [ ] **Step 1: Add CanvasEdgeData interface and retype CanvasEdge**

Replace the `CanvasEdge` line in `types/canvas.ts`. Full file after change:

```typescript
import type { Node, Edge } from "@xyflow/react";

export type NodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: NodeShape;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const NODE_SHAPES: NodeShape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
];
```

- [ ] **Step 2: Commit**

```bash
git add types/canvas.ts
git commit -m "feat(canvas): add CanvasEdgeData type with optional label"
```

---

## Task 2: Add handle hover-reveal CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append handle CSS at bottom of globals.css**

Add this block after the closing `}` of `@layer base { ... }`:

```css
/* canvas handle hover reveal */
.react-flow__handle {
  opacity: 0;
  width: 10px !important;
  height: 10px !important;
  background: white !important;
  border: 2px solid #0d0d0f !important;
  border-radius: 50% !important;
  transition: opacity 0.15s ease;
}

.react-flow__node:hover .react-flow__handle {
  opacity: 1;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat(canvas): handle hover-reveal CSS"
```

---

## Task 3: Update handles in canvas-node.tsx

**Files:**
- Modify: `components/editor/canvas-node.tsx`

The current handles mix `type="target"` and `type="source"`. With `ConnectionMode.Loose` already enabled, making all four handles `type="source"` ensures any handle can initiate or receive a connection from any direction.

- [ ] **Step 1: Replace the four Handle elements at the bottom of CanvasNodeComponent**

Find this block (lines 282–285):
```tsx
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
```

Replace with:
```tsx
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
```

- [ ] **Step 2: Verify the import for Position is still present**

The import line should remain:
```typescript
import { Handle, Position, NodeResizer } from "@xyflow/react";
```

No change needed — confirm it's there.

- [ ] **Step 3: Commit**

```bash
git add components/editor/canvas-node.tsx
git commit -m "feat(canvas): bidirectional handles on all four sides"
```

---

## Task 4: Create canvas-edge.tsx

**Files:**
- Create: `components/editor/canvas-edge.tsx`

- [ ] **Step 1: Create the file with the full custom edge renderer**

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import type { CanvasEdge } from "@/types/canvas";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateLabel = useMutation(
    ({ storage }, label: string) => {
      const flow = storage.get("flow");
      if (!flow) return;
      const lbEdge = flow.get("edges").get(id);
      if (!lbEdge) return;
      const lbData = lbEdge.get("data") as unknown as {
        set(k: string, v: unknown): void;
      };
      lbData.set("label", label);
    },
    [id]
  );

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDraft(data?.label ?? "");
      setEditing(true);
    },
    [data?.label]
  );

  const commit = useCallback(() => {
    updateLabel(draft);
    setEditing(false);
  }, [draft, updateLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") commit();
    },
    [commit]
  );

  const edgeColor = selected
    ? "var(--text-primary)"
    : "rgba(240, 240, 244, 0.35)";

  const label = data?.label;
  const showHint = (selected || editing) && !label && !editing;

  return (
    <>
      {/* Wide transparent stroke for easier clicking */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          transition: "stroke 0.15s ease",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                outline: "none",
                minWidth: 40,
                width: `${Math.max((draft.length || 1) * 8, 40)}px`,
                fontFamily: "inherit",
              }}
            />
          ) : showHint ? (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                padding: "1px 6px",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              add label…
            </span>
          ) : label ? (
            <span
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
                borderRadius: 99,
                padding: "1px 8px",
                fontSize: 11,
                whiteSpace: "nowrap",
                userSelect: "none",
                cursor: "default",
              }}
            >
              {label}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/editor/canvas-edge.tsx
git commit -m "feat(canvas): custom edge renderer with right-angle routing and label editing"
```

---

## Task 5: Wire up edgeTypes and defaultEdgeOptions in canvas-flow.tsx

**Files:**
- Modify: `components/editor/canvas-flow.tsx`

- [ ] **Step 1: Add imports for MarkerType, CanvasEdgeComponent, and CanvasEdge type**

At the top of `canvas-flow.tsx`, update the imports:

```typescript
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
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge";
```

Also add `CanvasEdge` to the type import line:
```typescript
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
```

- [ ] **Step 2: Register edgeTypes and defaultEdgeOptions in CanvasFlowInner**

After the `const nodeTypes = { canvasNode: CanvasNodeComponent };` line, add:

```typescript
const edgeTypes = { canvasEdge: CanvasEdgeComponent };

const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(240,240,244,0.35)" },
} as const;
```

- [ ] **Step 3: Pass edgeTypes and defaultEdgeOptions to ReactFlow**

In the `<ReactFlow ... >` JSX, add the two new props:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add components/editor/canvas-flow.tsx
git commit -m "feat(canvas): register custom edge type and default edge options"
```

---

## Task 6: Build check + progress tracker update

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors.

If the build fails with a type error in `canvas-edge.tsx` related to `EdgeProps<CanvasEdge>`, check that the `CanvasEdge` generic is `Edge<CanvasEdgeData, "canvasEdge">` and that `EdgeProps` is imported from `@xyflow/react`.

If the build fails with "Property 'label' does not exist on type 'Record<string, unknown>'" in the edge component, confirm `CanvasEdgeData` has `label?: string` and `CanvasEdge` uses `CanvasEdgeData`.

- [ ] **Step 2: Update progress tracker**

In `context/progress-tracker.md`:

- Set `## Current Phase` to `Feature 16: Edge Behavior`
- Set `## Current Goal` to `Custom edge renderer with labels and handles`
- Move feature to `## Completed` with summary:
  `16-edge-behavior: Custom right-angle edges with hover hit area, dim/bright states, collaborative inline label editing, and hover-reveal bidirectional handles on all four node sides.`
- Update `## Next Up` to `Feature 17: TBD`

- [ ] **Step 3: Commit**

```bash
git add context/progress-tracker.md
git commit -m "chore: update progress tracker for feature 16"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Handles on top, right, bottom, left | Task 3 |
| Connect from any handle to any other | Task 3 (all-source + ConnectionMode.Loose already set) |
| Handles: small white dots with dark border | Task 2 (CSS) |
| Handles: hidden by default, fade in on hover | Task 2 (CSS) |
| New edges: light stroke with rounded ends | Task 4 (defaultEdgeOptions + BaseEdge style) |
| New edges: arrowhead at end | Task 4 (MarkerType.ArrowClosed in defaultEdgeOptions) |
| New edges: use custom canvas edge renderer | Task 4 (edgeTypes) |
| Right-angle routing | Task 4 (getSmoothStepPath in canvas-edge.tsx) |
| Edges dimmed at rest | Task 4 (opacity 0.35 color at rest) |
| Edges bright on hover/selected | Task 4 (selected → var(--text-primary)) |
| Wide hit area without visible thickness | Task 4 (transparent path strokeWidth=20) |
| Double-click edge to edit label | Task 4 (handleDoubleClick on EdgeLabelRenderer div) |
| EdgeLabelRenderer + getSmoothStepPath midpoint | Task 4 (labelX, labelY from getSmoothStepPath) |
| Input grows with label text | Task 4 (width: `${length * 8}px`) |
| Save on blur, Enter, Escape | Task 4 (onBlur → commit, handleKeyDown) |
| Saved labels as pill badges | Task 4 (label span with borderRadius 99) |
| Faint hint when active edge has no label | Task 4 (showHint → "add label…") |
| Prevent label clicks from panning canvas | Task 4 (nodrag nopan class + stopPropagation) |
| Labels update via collaborative edge data flow | Task 4 (useMutation → lbEdge.get("data").set("label")) |
| npm run build passes without type errors | Task 6 |

### Placeholder Scan

No TBDs, todos, or "implement later" phrases. Every step has complete code.

### Type Consistency

- `CanvasEdgeData.label` is `string | undefined` — referenced as `data?.label` everywhere. ✓
- `updateLabel(draft)` — `draft` is `string`, matches `useMutation` callback signature `(label: string)`. ✓
- `CanvasEdge` used as generic for `EdgeProps<CanvasEdge>` — `CanvasEdge` is `Edge<CanvasEdgeData, "canvasEdge">`. ✓
- `defaultEdgeOptions.type: "canvasEdge"` matches the key in `edgeTypes`. ✓