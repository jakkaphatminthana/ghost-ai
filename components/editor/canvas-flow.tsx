"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";
import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  Panel,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo } from "@liveblocks/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import { CanvasNodeComponent } from "@/components/editor/canvas-node";
import { CanvasEdgeComponent } from "@/components/editor/canvas-edge";
import { ShapePanel } from "@/components/editor/shape-panel";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { LiveCursor } from "@/components/editor/live-cursors";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

const nodeTypes = { canvasNode: CanvasNodeComponent };

const edgeTypes = { canvasEdge: CanvasEdgeComponent };

const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed },
} as const;

interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${crypto.randomUUID()}`;
}

const SAVE_STATUS_LABEL: Record<SaveStatus, string | null> = {
  idle: null,
  saving: "Saving…",
  saved: "Saved",
  error: "Error saving",
};

interface CanvasFlowProps {
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasFlow({ projectId, isTemplatesOpen, onTemplatesClose }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesClose={onTemplatesClose}
      />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({
  projectId,
  isTemplatesOpen,
  onTemplatesClose,
}: {
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const rfInstance = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = rfInstance;
  const undo = useUndo();
  const redo = useRedo();
  useKeyboardShortcuts({ rfInstance, undo, redo });

  const saveStatus = useCanvasAutosave(projectId, nodes, edges);

  const hasAttemptedLoadRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedLoadRef.current) return;
    hasAttemptedLoadRef.current = true;

    if (nodes.length > 0 || edges.length > 0) return;

    async function loadSavedCanvas() {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok) return;
        const data = (await res.json()) as { nodes: CanvasNode[]; edges: CanvasEdge[] };
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
        if (data.nodes.length === 0 && data.edges.length === 0) return;

        onNodesChange(data.nodes.map((nd) => ({ type: "add" as const, item: nd })));
        onEdgesChange(data.edges.map((ed) => ({ type: "add" as const, item: ed })));
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            rfInstance.fitView({ duration: 300 });
          });
        });
      } catch {
        // Room stays empty if load fails
      }
    }

    loadSavedCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImport = useCallback(
    (template: CanvasTemplate) => {
      onNodesChange([
        ...nodes.map((nd) => ({ type: "remove" as const, id: nd.id })),
        ...template.nodes.map((nd) => ({ type: "add" as const, item: nd })),
      ]);
      onEdgesChange([
        ...edges.map((ed) => ({ type: "remove" as const, id: ed.id })),
        ...template.edges.map((ed) => ({ type: "add" as const, item: ed })),
      ]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rfInstance.fitView({ duration: 300 });
        });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, rfInstance]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/ghost-shape");
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      if (
        !(NODE_SHAPES as readonly string[]).includes(payload.shape) ||
        !Number.isFinite(payload.width) ||
        !Number.isFinite(payload.height) ||
        payload.width <= 0 ||
        payload.height <= 0
      ) {
        return;
      }

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const position = {
        x: flowPos.x - payload.width / 2,
        y: flowPos.y - payload.height / 2,
      };

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: NODE_COLORS[0].fill,
          shape: payload.shape,
        },
        width: payload.width,
        height: payload.height,
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const statusLabel = SAVE_STATUS_LABEL[saveStatus];

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionMode={ConnectionMode.Loose}
      fitView
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
        maskColor="rgba(0,0,0,0.6)"
        nodeColor="var(--border-subtle)"
      />
      <Panel position="top-right" className="mt-2 mr-2">
        <PresenceAvatars />
      </Panel>
      <Panel position="bottom-left" className="mb-4 ml-4">
        <CanvasControls />
      </Panel>
      <Panel position="bottom-center" className="mb-4">
        <div className="flex flex-col items-center gap-1.5">
          {statusLabel && (
            <span
              className={`text-xs px-2 py-1 rounded-xl bg-bg-elevated ${
                saveStatus === "error" ? "text-state-error" : "text-text-muted"
              }`}
            >
              {statusLabel}
            </span>
          )}
          <ShapePanel />
        </div>
      </Panel>
      <Cursors components={{ Cursor: LiveCursor }} />
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={(open) => { if (!open) onTemplatesClose(); }}
        onImport={handleImport}
        templates={CANVAS_TEMPLATES}
      />
    </ReactFlow>
  );
}
