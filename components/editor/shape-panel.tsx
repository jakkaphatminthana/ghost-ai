"use client";

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";

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

function handleDragStart(e: React.DragEvent, payload: ShapeDragPayload) {
  e.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function ShapePanel() {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-elevated px-3 py-2 shadow-lg">
      {SHAPE_CONFIG.map(({ shape, icon: Icon, label, width, height }) => (
        <button
          key={shape}
          title={label}
          draggable
          onDragStart={(e) => handleDragStart(e, { shape, width, height })}
          className="flex h-9 w-9 cursor-grab items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-secondary active:cursor-grabbing"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}