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
      // Cast through unknown: Liveblocks' onConnect uses addEdge(connection, [])
      // without merging defaultEdgeOptions, so edges drawn by the user land in
      // storage without a data field. The static type does not reflect this.
      const lbData = lbEdge.get("data") as unknown as
        | { set(k: string, v: unknown): void }
        | undefined;
      const lbEdgeRaw = lbEdge as unknown as { set(k: string, v: unknown): void };
      if (lbData && typeof lbData.set === "function") {
        lbData.set("label", label);
      } else {
        lbEdgeRaw.set("data", { label });
      }
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
    setEditing(false);
    updateLabel(draft);
  }, [draft, updateLabel]);

  const cancel = useCallback(() => setEditing(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    },
    [commit, cancel]
  );

  const edgeColor = selected ? "var(--text-primary)" : "var(--text-faint)";

  const label = data?.label;
  const showHint = selected && !label && !editing;

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
              onBlur={() => { if (editing) commit(); }}
              onKeyDown={handleKeyDown}
              size={Math.max(draft.length + 2, 6)}
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