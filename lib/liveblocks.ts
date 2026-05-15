import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#7986CB",
  "#4FC3F7",
  "#4DD0E1",
  "#4DB6AC",
  "#81C784",
  "#FFD54F",
  "#FF8A65",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

declare global {
  // eslint-disable-next-line no-var
  var _liveblocks: Liveblocks | undefined;
}

export function getLiveblocks(): Liveblocks {
  if (!globalThis._liveblocks) {
    globalThis._liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    });
  }
  return globalThis._liveblocks;
}