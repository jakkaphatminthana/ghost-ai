declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      isThinking: boolean;
    };

    Storage: Record<never, never>;

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: Record<never, never>;

    ThreadMetadata: Record<never, never>;

    RoomInfo: Record<never, never>;
  }
}

export {};
