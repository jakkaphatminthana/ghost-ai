"use client";

import { useState } from "react";
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
          <KeyBadge key={`${k}-${i}`} label={k} />
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
  const [os, setOs] = useState<OS>(() => {
    if (typeof navigator === "undefined") return "mac";
    return navigator.platform.toLowerCase().startsWith("mac") ? "mac" : "win";
  });

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
                aria-pressed={os === "mac"}
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
                aria-pressed={os === "win"}
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
