"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import type { NodeShape } from "@/types/canvas";

// ─── SVG preview ─────────────────────────────────────────────────────────────

const PREVIEW_W = 340;
const PREVIEW_H = 200;
const PREVIEW_PAD = 14;

function previewCoords(nodes: CanvasTemplate["nodes"]) {
  const xs = nodes.flatMap((nd) => [nd.position.x, nd.position.x + (nd.width ?? 140)]);
  const ys = nodes.flatMap((nd) => [nd.position.y, nd.position.y + (nd.height ?? 48)]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const bw = Math.max(...xs) - minX;
  const bh = Math.max(...ys) - minY;
  const scale = Math.min(
    (PREVIEW_W - PREVIEW_PAD * 2) / (bw || 1),
    (PREVIEW_H - PREVIEW_PAD * 2) / (bh || 1)
  );
  const offsetX = PREVIEW_PAD + ((PREVIEW_W - PREVIEW_PAD * 2) - bw * scale) / 2;
  const offsetY = PREVIEW_PAD + ((PREVIEW_H - PREVIEW_PAD * 2) - bh * scale) / 2;
  return {
    tx: (x: number) => (x - minX) * scale + offsetX,
    ty: (y: number) => (y - minY) * scale + offsetY,
    scale,
  };
}

function PreviewShape({
  x,
  y,
  w,
  h,
  shape,
  fill,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: NodeShape;
  fill: string;
}) {
  switch (shape) {
    case "rectangle":
      return <rect x={x} y={y} width={w} height={h} fill={fill} rx={3} />;
    case "pill":
      return <rect x={x} y={y} width={w} height={h} fill={fill} rx={h / 2} />;
    case "circle": {
      const r = Math.min(w, h) / 2;
      return <circle cx={x + w / 2} cy={y + h / 2} r={r} fill={fill} />;
    }
    case "diamond": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      return (
        <polygon
          points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
          fill={fill}
        />
      );
    }
    case "hexagon": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const pts = [0, 60, 120, 180, 240, 300]
        .map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return `${cx + (w / 2) * Math.cos(rad)},${cy + (h / 2) * Math.sin(rad)}`;
        })
        .join(" ");
      return <polygon points={pts} fill={fill} />;
    }
    case "cylinder": {
      const ry = h * 0.2;
      return (
        <>
          <rect x={x} y={y + ry} width={w} height={h - ry} fill={fill} />
          <ellipse cx={x + w / 2} cy={y + ry} rx={w / 2} ry={ry} fill={fill} />
          <ellipse
            cx={x + w / 2}
            cy={y + ry}
            rx={w / 2}
            ry={ry}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.5}
          />
        </>
      );
    }
  }
}

function TemplatePreview({ nodes, edges }: Pick<CanvasTemplate, "nodes" | "edges">) {
  const { tx, ty, scale } = previewCoords(nodes);

  const centers = new Map<string, { x: number; y: number }>();
  for (const nd of nodes) {
    const w = (nd.width ?? 140) * scale;
    const h = (nd.height ?? 48) * scale;
    centers.set(nd.id, {
      x: tx(nd.position.x) + w / 2,
      y: ty(nd.position.y) + h / 2,
    });
  }

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="block w-full"
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      style={{ background: "var(--bg-base)" }}
    >
      {edges.map((ed) => {
        const s = centers.get(ed.source);
        const t = centers.get(ed.target);
        if (!s || !t) return null;
        return (
          <line
            key={ed.id}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((nd) => {
        const x = tx(nd.position.x);
        const y = ty(nd.position.y);
        const w = (nd.width ?? 140) * scale;
        const h = (nd.height ?? 48) * scale;
        return (
          <PreviewShape
            key={nd.id}
            x={x}
            y={y}
            w={w}
            h={h}
            shape={nd.data.shape}
            fill={nd.data.color}
          />
        );
      })}
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
  templates: CanvasTemplate[];
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
  templates,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl bg-bg-surface border-border-default rounded-3xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-8 pt-7 pb-5">
          <DialogTitle className="text-xl font-semibold text-text-primary">
            Import Template
          </DialogTitle>
          <p className="text-sm text-text-muted mt-1">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be
            replaced — use{" "}
            <kbd className="inline-flex items-center rounded border border-border-subtle bg-bg-elevated px-1 py-0.5 text-xs font-mono text-text-secondary">
              ⌘Z
            </kbd>{" "}
            to undo.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] px-8 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex flex-col rounded-2xl bg-bg-elevated border border-border-default overflow-hidden"
              >
                <div className="overflow-hidden border-b border-border-default">
                  <TemplatePreview nodes={tpl.nodes} edges={tpl.edges} />
                </div>

                <div className="flex flex-col flex-1 gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-text-primary">{tpl.name}</span>
                    <span className="text-xs text-text-muted leading-relaxed">
                      {tpl.description}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-subtle hover:border-border-default transition-colors mt-auto"
                    onClick={() => {
                      onImport(tpl);
                      onOpenChange(false);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}