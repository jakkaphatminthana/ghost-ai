"use client";

import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import { CanvasNodeComponent } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";

const nodeTypes = { canvasNode: CanvasNodeComponent };

interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${crypto.randomUUID()}`;
}

export function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const { screenToFlowPosition } = useReactFlow();

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
      <Panel position="bottom-center" className="mb-4">
        <ShapePanel />
      </Panel>
    </ReactFlow>
  );
}