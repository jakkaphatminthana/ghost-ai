"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

const SHAPE_CONFIG: Array<{
  shape: NodeShape;
  icon: React.ElementType;
  label: string;
  width: number;
  height: number;
}> = [
  { shape: "rectangle", icon: RectangleHorizontal, label: "Rectangle", width: 200, height: 100 },
  { shape: "diamond", icon: Diamond, label: "Diamond", width: 160, height: 160 },
  { shape: "circle", icon: Circle, label: "Circle", width: 120, height: 120 },
  { shape: "pill", icon: Pill, label: "Pill", width: 180, height: 80 },
  { shape: "cylinder", icon: Cylinder, label: "Cylinder", width: 120, height: 140 },
  { shape: "hexagon", icon: Hexagon, label: "Hexagon", width: 140, height: 120 },
];

const GHOST_COLOR = NODE_COLORS[0].fill;
const GHOST_STROKE = "var(--accent-primary)";

function GhostShape({ shape }: { shape: NodeShape }) {
  const svgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
  };
  const shapeProps = {
    fill: GHOST_COLOR,
    stroke: GHOST_STROKE,
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  };

  if (shape === "rectangle") {
    return (
      <div
        className="absolute inset-0 rounded-xl"
        style={{ background: GHOST_COLOR, border: `1.5px solid ${GHOST_STROKE}` }}
      />
    );
  }

  if (shape === "pill" || shape === "circle") {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: GHOST_COLOR, border: `1.5px solid ${GHOST_STROKE}` }}
      />
    );
  }

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
      <rect x="3" y="18" width="94" height="65" fill={GHOST_COLOR} />
      <ellipse cx="50" cy="18" rx="47" ry="15" {...shapeProps} />
      <line x1="3" y1="18" x2="3" y2="83" stroke={GHOST_STROKE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <line x1="97" y1="18" x2="97" y2="83" stroke={GHOST_STROKE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function GhostPreview({
  shape,
  width,
  height,
  x,
  y,
}: ShapeDragPayload & { x: number; y: number }) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        pointerEvents: "none",
        opacity: 0.75,
        zIndex: 9999,
      }}
    >
      <GhostShape shape={shape} />
    </div>,
    document.body
  );
}

export function ShapePanel() {
  const [dragging, setDragging] = useState<ShapeDragPayload | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const isDragging = dragging !== null;

  useEffect(() => {
    if (!isDragging) return;
    const handler = (e: DragEvent) =>
      setDragPos({ x: e.clientX, y: e.clientY });
    document.addEventListener("dragover", handler);
    return () => document.removeEventListener("dragover", handler);
  }, [isDragging]);

  function handleDragStart(
    e: React.DragEvent,
    config: (typeof SHAPE_CONFIG)[number]
  ) {
    const payload: ShapeDragPayload = {
      shape: config.shape,
      width: config.width,
      height: config.height,
    };
    e.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";

    const img = new Image();
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);

    setDragPos({ x: e.clientX, y: e.clientY });
    setDragging(payload);
  }

  function handleDragEnd() {
    setDragging(null);
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-elevated px-3 py-2 shadow-lg">
        {SHAPE_CONFIG.map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.shape}
              title={config.label}
              draggable
              onDragStart={(e) => handleDragStart(e, config)}
              onDragEnd={handleDragEnd}
              className="flex h-9 w-9 cursor-grab items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-secondary active:cursor-grabbing"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      {dragging && (
        <GhostPreview
          shape={dragging.shape}
          width={dragging.width}
          height={dragging.height}
          x={dragPos.x}
          y={dragPos.y}
        />
      )}
    </>
  );
}