"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";

function ControlButton({
  onClick,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
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
    </div>
  );
}
