"use client";

import { useOther } from "@liveblocks/react/suspense";
import type { CursorsCursorProps } from "@liveblocks/react-flow";

export function LiveCursor({ connectionId }: CursorsCursorProps) {
  const other = useOther(connectionId, (o) => ({
    name: o.info.name,
    color: o.info.color,
    thinking: o.presence.thinking,
  }));

  if (!other) return null;

  return (
    <div
      className="pointer-events-none select-none"
      style={{ transform: "translate(-2px, -2px)" }}
    >
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 0L0 16L4 12L7 18L9.5 17L6.5 11L11 11Z"
          fill={other.color}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="mt-0.5 flex max-w-36 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-white shadow-sm"
        style={{ backgroundColor: other.color }}
      >
        {other.thinking && (
          <span className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span className="truncate">{other.name}</span>
      </div>
    </div>
  );
}
