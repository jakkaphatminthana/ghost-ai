"use client";

import { Component, type ReactNode } from "react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";
import { CanvasFlow } from "@/components/editor/canvas-flow";
import { AISidebar } from "@/components/editor/ai-sidebar";

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-text-muted">Failed to connect to canvas.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CanvasRoomProps {
  roomId: string;
  projectId: string;
  isTemplatesOpen: boolean;
  onTemplatesClose: () => void;
  isAiSidebarOpen: boolean;
  onAiSidebarClose: () => void;
}

export function CanvasRoom({
  roomId,
  projectId,
  isTemplatesOpen,
  onTemplatesClose,
  isAiSidebarOpen,
  onAiSidebarClose,
}: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
          initialStorage={() => ({
            flow: new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            }),
          })}
        >
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">Loading canvas…</p>
              </div>
            }
          >
            <CanvasFlow
              projectId={projectId}
              isTemplatesOpen={isTemplatesOpen}
              onTemplatesClose={onTemplatesClose}
            />
          </ClientSideSuspense>

          <AISidebar
            isOpen={isAiSidebarOpen}
            onClose={onAiSidebarClose}
            projectId={projectId}
            roomId={roomId}
          />
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}
