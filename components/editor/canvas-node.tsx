"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, NodeShape } from "@/types/canvas";

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

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((c) => c.fill === data.color)?.text ?? "#EDEDED";
  const borderColor = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ShapeBody shape={data.shape} color={data.color} borderColor={borderColor} />
      <div
        className="pointer-events-none flex items-center justify-center"
        style={{ position: "absolute", inset: 0, color: textColor }}
      >
        <span className="select-none wrap-break-word px-3 text-center text-sm font-medium leading-tight">
          {data.label}
        </span>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
} 