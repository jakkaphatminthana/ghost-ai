import type { LiveList } from "@liveblocks/client";
import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "./types/canvas";
import type { ChatMessage } from "./types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
      aiChat: LiveList<ChatMessage>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: {
      type: "ai-status";
      status: "start" | "processing" | "complete" | "error";
      message: string;
    };

    ThreadMetadata: Record<never, never>;

    RoomInfo: Record<never, never>;
  }
}

