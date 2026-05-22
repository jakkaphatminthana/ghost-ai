"use client";

import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      connectionMode={ConnectionMode.Loose}
      fitView
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        maskColor="rgba(0,0,0,0.6)"
        nodeColor="var(--border-subtle)"
      />
    </ReactFlow>
  );
}