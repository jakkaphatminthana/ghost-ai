import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

interface KeyboardShortcutsOptions {
  rfInstance: ReactFlowInstance<CanvasNode, CanvasEdge>;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  rfInstance,
  undo,
  redo,
}: KeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (!isMod && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        rfInstance.zoomIn({ duration: 200 });
        return;
      }

      if (!isMod && e.key === "-") {
        e.preventDefault();
        rfInstance.zoomOut({ duration: 200 });
        return;
      }

      if (isMod && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
        return;
      }

      if (isMod && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
        return;
      }

      if (isMod && !e.shiftKey && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rfInstance, undo, redo]);
}