# Keyboard Shortcuts Modal — Design Spec

**Date:** 2026-06-08
**Status:** Approved

---

## Overview

Add a keyboard icon button to the `CanvasControls` panel (bottom-left of canvas). Clicking it opens a modal that lists all canvas keyboard shortcuts, with a Mac/Windows toggle that auto-detects the user's OS on open.

---

## Trigger Button

- Icon: `Keyboard` from Lucide React (stroke, `h-4 w-4`)
- Placed in `CanvasControls` after the Undo/Redo divider, preceded by another `<div>` divider
- Uses the existing `ControlButton` component with `title="Keyboard shortcuts"`
- Clicking sets local `isShortcutsOpen` state to `true`

---

## Modal

Built with shadcn/ui `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` — consistent with `StarterTemplatesModal` and `ShareDialog`.

### OS Toggle

- Two-button toggle: `Mac` | `Windows`
- Default determined at mount via `navigator.platform.toLowerCase().includes("mac")`
- Switching toggle swaps key labels in-place (no page reload, no network call)
- Toggle placed inline with the dialog title, right-aligned

### Shortcut List

Grouped into three sections. Each row: **Action label** on the left, **key badge(s)** on the right.

Key badges: small `<kbd>`-styled spans — `bg-bg-subtle border border-border-default rounded-xl px-1.5 py-0.5 text-xs font-mono text-text-secondary`

#### Navigation

| Action | Mac | Windows |
|---|---|---|
| Zoom in | `+` / `=` | `+` / `=` |
| Zoom out | `-` | `-` |
| Pan canvas | `Space` + Drag | `Space` + Drag |
| Scroll to zoom | Scroll | Scroll |

#### Selection

| Action | Mac | Windows |
|---|---|---|
| Multi-select | `Shift` + Click | `Shift` + Click |
| Multi-drag select | `Shift` + Drag | `Shift` + Drag |

#### Edit

| Action | Mac | Windows |
|---|---|---|
| Delete selected | `Delete` | `Delete` |
| Undo | `⌘` `Z` | `Ctrl` `Z` |
| Redo | `⌘` `Shift` `Z` | `Ctrl` `Shift` `Z` |

> Note: Windows also accepts `Ctrl+Y` for Redo (already handled in `useKeyboardShortcuts`). Not shown in the modal to keep it simple — `Ctrl Shift Z` is the canonical cross-platform form.

---

## Components

### New: `components/editor/keyboard-shortcuts-modal.tsx`

- `"use client"`
- Props: `open: boolean`, `onOpenChange: (open: boolean) => void`
- Internal state: `os: "mac" | "win"` — initialized from `navigator.platform` in a `useEffect` (SSR-safe, defaults to `"mac"`)
- Renders shadcn `Dialog` with the shortcut table
- Shortcut data is a static typed array inside the file — no external state or hooks

### Modified: `components/editor/canvas-controls.tsx`

- Import `KeyboardShortcutsModal` and `Keyboard` from Lucide
- Add `isShortcutsOpen` local state (`useState(false)`)
- Add a divider + `ControlButton` with `Keyboard` icon after Undo/Redo
- Render `<KeyboardShortcutsModal open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />` at the end of the returned JSX

---

## Visual Style

Follows existing patterns:
- Modal: `rounded-3xl`, `bg-bg-surface`, backdrop blur — same as `StarterTemplatesModal`
- Section headers: `text-xs text-text-muted uppercase tracking-wider`
- Row text: `text-sm text-text-secondary`
- Key badges: `kbd`-styled, `bg-bg-subtle border-border-default rounded-xl font-mono text-xs`
- Toggle: two `<button>` elements styled as a pill toggle using `bg-bg-subtle` / `bg-accent-dim text-accent-primary`

---

## Out of Scope

- Customizable shortcuts
- Persisting OS preference across sessions
- Animating key badge transitions on toggle
