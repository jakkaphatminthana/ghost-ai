# Handoff: Feature 23 – Design Agent Logic (Ready to Commit)

**Date:** 2026-06-26  
**Project:** ghost-ai  
**Branch:** `dev`  
**Status:** Implementation complete, build passes, progress tracker updated. Ready to commit — stopped before `git add` to handoff first.

---

## What Needs to Happen Next

**Just commit.** All code is done and verified. Run:

```bash
git add context/feature-specs/23-design-agent-logic.md \
        context/progress-tracker.md \
        liveblocks.config.ts \
        trigger/design-agent.ts \
        components/editor/ai-sidebar.tsx \
        components/editor/workspace-shell.tsx \
        package.json \
        pnpm-lock.yaml

git commit -m "feat: ai :: implement design agent logic with Gemini and Liveblocks

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## What Was Done

Feature 23 (Design Agent Logic) is fully implemented. Spec: `context/feature-specs/23-design-agent-logic.md`.

### Files Changed

| File | Change |
|---|---|
| `liveblocks.config.ts` | Added `RoomEvent` type: `{ type: "ai-status"; status: "start" \| "processing" \| "complete" \| "error"; message: string }` |
| `trigger/design-agent.ts` | Full implementation — Gemini via `@ai-sdk/google` (`gemini-2.0-flash`), `generateObject` with Zod schema, Liveblocks `setPresence` + `broadcastEvent` + `mutateStorage`, error handling, presence cleanup |
| `components/editor/ai-sidebar.tsx` | Wired `handleSend` → `POST /api/ai/design` → `POST /api/ai/design/token` → `useRealtimeRun`. Bounce-dot loading indicator. Disabled while generating. Auto-scroll. |
| `components/editor/workspace-shell.tsx` | Passes `projectId={activeProjectId}` and `roomId={activeProjectId}` to `<AISidebar>` |
| `context/progress-tracker.md` | Phase set to 23, Feature 23 added to Completed, In Progress cleared, Next Up set to 24 |
| `package.json` / `pnpm-lock.yaml` | `zod@^4.4.3` added as direct dependency. All AI SDK / Trigger.dev peer deps now resolved against zod v4. |

### Key Design Decisions

- **AI presence** (`thinking: true`): `liveblocks.setPresence(roomId, { userId: "ai-agent", data: { cursor: null, thinking: true }, userInfo: { name: "Ghost AI", color: "#6457f9" }, ttl: 30 })`. Appears in `PresenceAvatars` for all connected users. Cleared with `ttl: 2` on completion/error.
- **Canvas mutation**: `liveblocks.mutateStorage` from `@liveblocks/node`. Node `data` is a nested `LiveObject({ label, color, shape })` (matches `LiveblocksFlow` CRDT structure). `position` is stored as a plain JSON atomic. Edges don't need `markerEnd` — `defaultEdgeOptions` in `canvas-flow.tsx` adds arrows client-side.
- **Status broadcast**: `liveblocks.broadcastEvent` sends `ai-status` events to the room. `AISidebar` (outside `RoomProvider`) doesn't listen — canvas mutations are real-time for all, presence avatar is visible to all, triggering user sees chat status via `useRealtimeRun`.
- **Gemini schema**: Zod v4 `DesignSchema` — `nodes[]`, `edges[]`, `summary`, optional `deleteNodeIds[]`/`deleteEdgeIds[]`. `colorIndex` (0–7) → `NODE_COLORS`. Shape validated against `NODE_SHAPES`, fallback to `"rectangle"`.

### Build

`npm run build` passes clean.

### IDE Warning (False Positive)

IDE may show `Module '"@trigger.dev/sdk"' has no exported member 'tasks'` on `app/api/ai/design/route.ts`. The file correctly imports from `"@trigger.dev/sdk/v3"` — build proves it. Do `Cmd+Shift+P → TypeScript: Restart TS Server` to clear it.

---

## Remaining Scope (Not in Feature 23)

- Add a thinking pulse on `PresenceAvatars` when `other.presence.thinking === true`
- Add `useEventListener` inside `CanvasRoom` for `ai-status` broadcast events → canvas-level toast for all users

---

## Suggested Skills

- `superpowers:finishing-a-development-branch` — after the commit
- `trigger-agents` — if revisiting the task logic
- `liveblocks-best-practices` — if adding the canvas toast
