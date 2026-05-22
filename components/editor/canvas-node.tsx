"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((c) => c.fill === data.color)?.text ?? "#EDEDED";

  return (
    <div
      style={{
        background: data.color,
        color: textColor,
        width: "100%",
        height: "100%",
        borderColor: selected
          ? "var(--accent-primary)"
          : "var(--border-subtle)",
      }}
      className="flex items-center justify-center rounded-xl border px-3 py-2"
    >
      <span className="select-none break-words text-center text-sm font-medium leading-tight">
        {data.label}
      </span>

      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}