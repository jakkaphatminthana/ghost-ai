"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, NodeShape } from "@/types/canvas";

const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 40;

interface ShapeBodyProps {
  shape: NodeShape;
  color: string;
  borderColor: string;
}

function ShapeBody({ shape, color, borderColor }: ShapeBodyProps) {
  const border = `1px solid ${borderColor}`;

  if (shape === "rectangle") {
    return (
      <div
        className="absolute inset-0 rounded-xl"
        style={{ background: color, border }}
      />
    );
  }

  if (shape === "pill" || shape === "circle") {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: color, border }}
      />
    );
  }

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
  };
  const shapeProps = {
    fill: color,
    stroke: borderColor,
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "diamond") {
    return (
      <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,2 98,50 50,98 2,50" {...shapeProps} />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg style={svgStyle} viewBox="0 0 100 87" preserveAspectRatio="none">
        <polygon points="27,2 73,2 97,43.5 73,85 27,85 3,43.5" {...shapeProps} />
      </svg>
    );
  }

  // cylinder
  return (
    <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
      <ellipse cx="50" cy="83" rx="47" ry="15" {...shapeProps} />
      <rect x="3" y="18" width="94" height="65" fill={color} />
      <ellipse cx="50" cy="18" rx="47" ry="15" {...shapeProps} />
      <line x1="3" y1="18" x2="3" y2="83" stroke={borderColor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <line x1="97" y1="18" x2="97" y2="83" stroke={borderColor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((c) => c.fill === data.color)?.text ?? "#EDEDED";
  const borderColor = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  const [editing, setEditing] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const pendingLabel = useRef(data.label);

  const updateLabel = useMutation(
    ({ storage }, newLabel: string) => {
      const flow = storage.get("flow");
      if (!flow) return;
      const lbNode = flow.get("nodes").get(id);
      if (!lbNode) return;
      const lbData = lbNode.get("data") as unknown as { set(k: string, v: unknown): void };
      lbData.set("label", newLabel);
    },
    [id]
  );

  useEffect(() => {
    if (!editing || !labelRef.current) return;
    const el = labelRef.current;
    el.textContent = pendingLabel.current;
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      pendingLabel.current = data.label;
      setEditing(true);
    },
    [data.label]
  );

  const stopEditing = useCallback(() => setEditing(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") stopEditing();
    },
    [stopEditing]
  );

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onDoubleClick={startEditing}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        lineStyle={{ borderColor: "var(--accent-primary)", opacity: 0.5 }}
        handleStyle={{
          background: "var(--bg-surface)",
          border: "1px solid var(--accent-primary)",
          width: 7,
          height: 7,
          borderRadius: 2,
        }}
      />
      <ShapeBody shape={data.shape} color={data.color} borderColor={borderColor} />

      {editing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            ref={labelRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateLabel(e.currentTarget.textContent ?? "")}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="pointer-events-auto w-full px-3 text-center text-sm font-medium leading-tight outline-none"
            style={{ color: textColor, wordBreak: "break-word" }}
          />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ color: textColor }}
        >
          {data.label ? (
            <span className="select-none wrap-break-word px-3 text-center text-sm font-medium leading-tight">
              {data.label}
            </span>
          ) : (
            <span
              className="select-none text-center text-sm font-medium leading-tight"
              style={{ color: "var(--text-faint)" }}
            >
              Label...
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}