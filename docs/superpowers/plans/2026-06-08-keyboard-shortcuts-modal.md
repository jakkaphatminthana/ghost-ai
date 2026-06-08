# Keyboard Shortcuts Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a keyboard icon button to the canvas controls panel that opens a modal listing all canvas keyboard shortcuts, with a Mac/Windows OS toggle that auto-detects the user's platform.

**Architecture:** Create a new `KeyboardShortcutsModal` component using shadcn `Dialog`. Add a `Keyboard` icon `ControlButton` to `CanvasControls` with local `isShortcutsOpen` state. Shortcut data lives as a static typed array inside the modal file — no external state or hooks needed.

**Tech Stack:** React, shadcn/ui Dialog, Lucide React, Tailwind CSS (project design tokens)

---

## File Map

| Action | File |
|---|---|
| Create | `components/editor/keyboard-shortcuts-modal.tsx` |
| Modify | `components/editor/canvas-controls.tsx` |

---

### Task 1: Create `KeyboardShortcutsModal` component

**Files:**
- Create: `components/editor/keyboard-shortcuts-modal.tsx`

- [ ] **Step 1: Create the file with shortcut data and sub-components**

Create `components/editor/keyboard-shortcuts-modal.tsx` with this exact content:

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OS = "mac" | "win";

interface Shortcut {
  action: string;
  mac: string[];
  win: string[];
}

interface ShortcutGroup {
  label: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Navigation",
    shortcuts: [
      { action: "Zoom in", mac: ["+", "="], win: ["+", "="] },
      { action: "Zoom out", mac: ["-"], win: ["-"] },
      { action: "Pan canvas", mac: ["Space", "Drag"], win: ["Space", "Drag"] },
      { action: "Scroll to zoom", mac: ["Scroll"], win: ["Scroll"] },
    ],
  },
  {
    label: "Selection",
    shortcuts: [
      { action: "Multi-select", mac: ["Shift", "Click"], win: ["Shift", "Click"] },
      { action: "Drag select", mac: ["Shift", "Drag"], win: ["Shift", "Drag"] },
    ],
  },
  {
    label: "Edit",
    shortcuts: [
      { action: "Delete selected", mac: ["Delete"], win: ["Delete"] },
      { action: "Undo", mac: ["⌘", "Z"], win: ["Ctrl", "Z"] },
      { action: "Redo", mac: ["⌘", "Shift", "Z"], win: ["Ctrl", "Shift", "Z"] },
    ],
  },
];

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center rounded-xl border border-border-default bg-bg-subtle px-1.5 py-0.5 font-mono text-xs text-text-secondary">
      {label}
    </kbd>
  );
}

function ShortcutRow({ shortcut, os }: { shortcut: Shortcut; os: OS }) {
  const keys = os === "mac" ? shortcut.mac : shortcut.win;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-secondary">{shortcut.action}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <KeyBadge key={i} label={k} />
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  const [os, setOs] = useState<OS>("mac");

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      !navigator.platform.toLowerCase().includes("mac")
    ) {
      setOs("win");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border-default bg-bg-surface">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-text-primary">
              Keyboard Shortcuts
            </DialogTitle>
            <div className="flex items-center rounded-xl border border-border-default bg-bg-subtle p-0.5">
              <button
                type="button"
                onClick={() => setOs("mac")}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  os === "mac"
                    ? "bg-accent-primary-dim text-accent-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Mac
              </button>
              <button
                type="button"
                onClick={() => setOs("win")}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  os === "win"
                    ? "bg-accent-primary-dim text-accent-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Windows
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-xs uppercase tracking-wider text-text-muted">
                {group.label}
              </p>
              <div className="divide-y divide-border-subtle">
                {group.shortcuts.map((s) => (
                  <ShortcutRow key={s.action} shortcut={s} os={os} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify the file was created**

Run: `ls components/editor/keyboard-shortcuts-modal.tsx`
Expected: file listed with no error

---

### Task 2: Add the trigger button to `CanvasControls`

**Files:**
- Modify: `components/editor/canvas-controls.tsx`

Current file content for reference:

```tsx
"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";

function ControlButton({ ... }) { ... }

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-elevated px-3 py-2 shadow-lg">
      ...
      <ControlButton onClick={undo} ...><Undo2 /></ControlButton>
      <ControlButton onClick={redo} ...><Redo2 /></ControlButton>
    </div>
  );
}
```

- [ ] **Step 1: Update imports in `canvas-controls.tsx`**

Replace the existing import block:

```tsx
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
```

With:

```tsx
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Keyboard } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { useState } from "react";
import { KeyboardShortcutsModal } from "@/components/editor/keyboard-shortcuts-modal";
```

- [ ] **Step 2: Add state and new button + modal to `CanvasControls`**

Replace the entire `CanvasControls` function body:

```tsx
export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-elevated px-3 py-2 shadow-lg">
        <ControlButton
          onClick={() => zoomOut({ duration: 200 })}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          onClick={() => fitView({ duration: 300 })}
          title="Fit view"
        >
          <Maximize2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton onClick={() => zoomIn({ duration: 200 })} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </ControlButton>
        <div className="mx-1 h-5 w-px bg-border-default" />
        <ControlButton onClick={undo} disabled={!canUndo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton onClick={redo} disabled={!canRedo} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ControlButton>
        <div className="mx-1 h-5 w-px bg-border-default" />
        <ControlButton
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </ControlButton>
      </div>

      <KeyboardShortcutsModal
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Start the dev server and manually verify**

Run: `npm run dev`

Open the canvas in a browser, then verify:
1. Bottom-left control bar shows a `Keyboard` icon button after the Redo divider
2. Clicking it opens the modal titled "Keyboard Shortcuts"
3. Mac/Windows toggle is visible in the header
4. Toggle switches key labels: `⌘ Z` ↔ `Ctrl Z`, etc.
5. OS auto-detected correctly on first open
6. Pressing `Escape` or clicking outside closes the modal

- [ ] **Step 5: Commit**

```bash
git add components/editor/keyboard-shortcuts-modal.tsx components/editor/canvas-controls.tsx
git commit -m "feat: add keyboard shortcuts modal to canvas controls"
```
