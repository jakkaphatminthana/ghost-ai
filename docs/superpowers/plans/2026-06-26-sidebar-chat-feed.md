# Sidebar Chat Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time collaborative room chat to the AI sidebar using a Liveblocks `LiveList` as the `ai-chat` feed, keeping it fully separate from the existing `ai-status-feed` broadcast events.

**Architecture:** Chat messages are stored as a `LiveList<ChatMessage>` in Liveblocks room Storage (`aiChat` key), which provides real-time sync and persistence across sessions for all room participants. The AI sidebar gains a new "Chat" tab that subscribes to this storage, renders messages in order with sender/timestamp/content, and lets users send new messages via `useMutation`. Messages are validated with a Zod schema before rendering.

**Tech Stack:** Liveblocks (`@liveblocks/react`, `@liveblocks/client`), Zod v4, React, Tailwind CSS, shadcn/ui, TypeScript strict mode.

## Global Constraints

- No hardcoded hex values or raw Tailwind color classes like `zinc-*` — use CSS custom property tokens (`bg-base`, `text-text-primary`, `bg-bg-elevated`, etc.)
- Border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards
- `"use client"` only when browser interactivity, hooks, or real-time state is needed
- TypeScript strict mode — no `any`
- Do not mix `aiChat` with `ai-status-feed` (room broadcast events)
- Do not add AI-generated replies or trigger backend AI tasks
- `npm run build` must pass

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `types/tasks.ts` | Modify | Add `ChatMessageSchema` (Zod), `ChatMessage` type, `parseChatMessage` helper |
| `liveblocks.config.ts` | Modify | Add `aiChat: LiveList<ChatMessage>` to the `Storage` type |
| `components/editor/canvas-room.tsx` | Modify | Initialize `aiChat: new LiveList([])` in `initialStorage` |
| `components/editor/ai-sidebar.tsx` | Modify | Add "Chat" tab: subscribe to `aiChat`, render messages, send via `useMutation`, error state |

---

### Task 1: Add ChatMessage Zod schema to `types/tasks.ts`

**Files:**
- Modify: `types/tasks.ts`

**Interfaces:**
- Produces: `ChatMessageSchema`, `ChatMessage` (type), `parseChatMessage(unknown): ChatMessage | null`

- [ ] **Step 1: Add Zod import and ChatMessage schema**

Open `types/tasks.ts`. Append the following after the existing exports:

```typescript
import { z } from "zod";

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.literal("user"),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export function parseChatMessage(value: unknown): ChatMessage | null {
  const result = ChatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
```

Full updated `types/tasks.ts`:

```typescript
import { z } from "zod";

export const AI_STATUS_VALUES = [
  "start",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusValue = (typeof AI_STATUS_VALUES)[number];

export interface AiStatusPayload {
  status: AiStatusValue;
  text?: string;
}

export function isAiStatusPayload(value: unknown): value is AiStatusPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!AI_STATUS_VALUES.includes(v.status as AiStatusValue)) return false;
  if (v.text !== undefined && typeof v.text !== "string") return false;
  return true;
}

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.literal("user"),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export function parseChatMessage(value: unknown): ChatMessage | null {
  const result = ChatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jakkaphat.m/knownlege/ghost-ai && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `types/tasks.ts`.

- [ ] **Step 3: Commit**

```bash
git add types/tasks.ts
git commit -m "feat: add ChatMessage Zod schema and parseChatMessage helper"
```

---

### Task 2: Extend Liveblocks Storage type and initialize aiChat

**Files:**
- Modify: `liveblocks.config.ts`
- Modify: `components/editor/canvas-room.tsx`

**Interfaces:**
- Consumes: `ChatMessage` from `types/tasks.ts`
- Produces: `Storage.aiChat` typed as `LiveList<ChatMessage>`, initialized to empty list in `RoomProvider`

- [ ] **Step 1: Extend Storage type in `liveblocks.config.ts`**

Current file content:

```typescript
import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "./types/canvas";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };
    // ...rest
  }
}
```

Replace with:

```typescript
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
```

- [ ] **Step 2: Initialize `aiChat` in `canvas-room.tsx`**

Current `initialStorage` in `canvas-room.tsx`:

```typescript
initialStorage={() => ({
  flow: new LiveObject({
    nodes: new LiveMap(),
    edges: new LiveMap(),
  }),
})}
```

Add `LiveList` import and `aiChat` to `initialStorage`. Full updated file:

```typescript
"use client";

import { Component, type ReactNode } from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
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
            aiChat: new LiveList([]),
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/jakkaphat.m/knownlege/ghost-ai && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `aiChat` or `LiveList`.

- [ ] **Step 4: Commit**

```bash
git add liveblocks.config.ts components/editor/canvas-room.tsx
git commit -m "feat: add aiChat LiveList to Liveblocks Storage type and initialize in RoomProvider"
```

---

### Task 3: Add Chat tab to AI sidebar

**Files:**
- Modify: `components/editor/ai-sidebar.tsx`

**Interfaces:**
- Consumes: `ChatMessage`, `parseChatMessage` from `types/tasks.ts`
- Consumes: `useStorage`, `useMutation` from `@liveblocks/react`
- Produces: "Chat" tab in AI sidebar with real-time message feed and send input

- [ ] **Step 1: Add imports for Liveblocks hooks and ChatMessage**

At the top of `ai-sidebar.tsx`, add:

```typescript
import { useStorage, useMutation } from "@liveblocks/react";
import { parseChatMessage, type ChatMessage } from "@/types/tasks";
```

These go alongside the existing imports.

- [ ] **Step 2: Add `useSelf` to get current user info**

`useSelf` is already available from `@liveblocks/react`. Add to the `AISidebar` component body (alongside existing hooks):

```typescript
import { useStorage, useMutation, useSelf } from "@liveblocks/react";
```

Inside `AISidebar`:
```typescript
const self = useSelf();
```

- [ ] **Step 3: Subscribe to `aiChat` storage**

Inside `AISidebar`, after the existing state declarations:

```typescript
const rawMessages = useStorage((root) => root.aiChat.toImmutable());
const chatMessages: ChatMessage[] = (rawMessages ?? [])
  .map((m) => parseChatMessage(m))
  .filter((m): m is ChatMessage => m !== null);
```

- [ ] **Step 4: Add `sendChatMessage` mutation and `chatError` state**

Add state for the chat input and error:

```typescript
const [chatInput, setChatInput] = useState("");
const [chatError, setChatError] = useState<string | null>(null);
const chatInputRef = useRef<HTMLTextAreaElement>(null);
const chatEndRef = useRef<HTMLDivElement>(null);
```

Add the mutation (at component scope, not inside JSX):

```typescript
const sendChatMessage = useMutation(({ storage }, message: ChatMessage) => {
  storage.get("aiChat").push(message);
}, []);
```

Add the send handler:

```typescript
async function handleChatSend() {
  const text = chatInput.trim();
  if (!text) return;

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    sender: self?.info.name ?? "User",
    role: "user",
    content: text,
    timestamp: Date.now(),
  };

  try {
    sendChatMessage(message);
    setChatInput("");
    setChatError(null);
  } catch {
    setChatError("Failed to send message. Please try again.");
  }
}

function handleChatKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChatSend();
  }
}
```

- [ ] **Step 5: Add auto-scroll effect for chat tab**

```typescript
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chatMessages]);
```

- [ ] **Step 6: Add "Chat" tab to the TabsList**

In the JSX, find the `<TabsList>` block and add a third trigger:

```tsx
<TabsList className="w-full bg-bg-elevated">
  <TabsTrigger
    value="architect"
    className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
  >
    AI Architect
  </TabsTrigger>
  <TabsTrigger
    value="chat"
    className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
  >
    Chat
  </TabsTrigger>
  <TabsTrigger
    value="specs"
    className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
  >
    Specs
  </TabsTrigger>
</TabsList>
```

- [ ] **Step 7: Add the Chat TabsContent**

Insert the following `<TabsContent value="chat">` block between the "AI Architect" and "Specs" tab contents:

```tsx
{/* Chat */}
<TabsContent value="chat" className="flex flex-col overflow-hidden">
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {chatMessages.length === 0 ? (
      <div className="flex flex-col items-center gap-3 pt-8 px-2 text-center">
        <p className="text-sm font-medium text-text-primary">Room Chat</p>
        <p className="text-xs text-text-muted">
          Send messages to everyone in this room
        </p>
      </div>
    ) : (
      <>
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-text-secondary">
                {msg.sender}
              </span>
              <span className="text-xs text-text-faint">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="rounded-xl bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary">
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </>
    )}
  </div>

  {chatError && (
    <div className="shrink-0 px-3 pb-1">
      <p className="text-xs text-state-error">{chatError}</p>
    </div>
  )}

  <div className="shrink-0 border-t border-border-default p-3">
    <div className="flex items-end gap-2">
      <Textarea
        ref={chatInputRef}
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={handleChatKeyDown}
        placeholder="Message the room…"
        className="flex-1 min-h-18 max-h-40 resize-none overflow-y-auto bg-bg-elevated border-border-default text-text-primary placeholder:text-text-faint focus-visible:border-accent-ai focus-visible:ring-accent-ai/20"
      />
      <Button
        size="icon"
        onClick={handleChatSend}
        disabled={!chatInput.trim()}
        className="h-9 w-9 shrink-0 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </div>
</TabsContent>
```

- [ ] **Step 8: Full updated `ai-sidebar.tsx`**

Replace the entire file with the following content:

```typescript
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, Download, FileText, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import { useEventListener, useMutation, useSelf, useStorage } from "@liveblocks/react";
import { isAiStatusPayload, parseChatMessage, type AiStatusPayload, type ChatMessage } from "@/types/tasks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

interface RunSession {
  runId: string;
  token: string;
}

export function AISidebar({ isOpen, onClose, projectId, roomId }: AISidebarProps) {
  // AI Architect tab state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [runSession, setRunSession] = useState<RunSession | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusPayload | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat tab state
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Current user info
  const self = useSelf();

  // Subscribe to ai-chat feed from Liveblocks Storage
  const rawMessages = useStorage((root) => root.aiChat.toImmutable());
  const chatMessages: ChatMessage[] = (rawMessages ?? [])
    .map((m) => parseChatMessage(m))
    .filter((m): m is ChatMessage => m !== null);

  // Mutation to push a new message into the aiChat LiveList
  const sendChatMessage = useMutation(({ storage }, message: ChatMessage) => {
    storage.get("aiChat").push(message);
  }, []);

  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    const payload: AiStatusPayload = {
      status: event.status,
      text: event.message || undefined,
    };
    if (!isAiStatusPayload(payload)) return;

    setAiStatus(payload);

    if (payload.status === "start" || payload.status === "processing") {
      setIsGenerating(true);
    }

    if (payload.status === "complete" || payload.status === "error") {
      setIsGenerating(false);
      setAiStatus(null);
    }
  });

  const { run } = useRealtimeRun<typeof designAgentTask>(runSession?.runId, {
    accessToken: runSession?.token,
    enabled: !!runSession,
    stopOnCompletion: true,
  });

  useEffect(() => {
    if (!run) return;

    const terminal = ["COMPLETED", "FAILED", "CRASHED", "CANCELED", "TIMED_OUT", "SYSTEM_FAILURE", "EXPIRED"];
    if (!terminal.includes(run.status)) return;

    if (run.status === "COMPLETED") {
      const output = run.output as { summary: string } | undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: output?.summary ?? "Design complete! Check the canvas.",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong generating the design. Please try again.",
        },
      ]);
    }

    setRunSession(null);
    setIsGenerating(false);
  }, [run?.status]);

  // Auto-scroll AI Architect messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Auto-scroll chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setInput("");
    setIsGenerating(true);

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      });

      if (!designRes.ok) {
        throw new Error("Failed to start design generation");
      }

      const { runId } = (await designRes.json()) as { runId: string };

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get run token");
      }

      const { token } = (await tokenRes.json()) as { token: string };
      setRunSession({ runId, token });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Failed to start the design agent. Please try again.",
        },
      ]);
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChip(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  function handleChatSend() {
    const text = chatInput.trim();
    if (!text) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: self?.info.name ?? "User",
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    try {
      sendChatMessage(message);
      setChatInput("");
      setChatError(null);
    } catch {
      setChatError("Failed to send message. Please try again.");
    }
  }

  function handleChatKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  }

  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={[
        "fixed right-0 top-0 z-40 flex h-full w-80 flex-col",
        "bg-bg-surface/95 border-l border-border-default shadow-2xl backdrop-blur-sm",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-default px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/20">
          <Bot className="h-4 w-4 text-accent-ai-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight">AI Workspace</p>
          <p className="text-xs text-text-muted leading-tight">Collaborate with Ghost AI</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="h-7 w-7 shrink-0 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 pt-3">
          <TabsList className="w-full bg-bg-elevated">
            <TabsTrigger
              value="architect"
              className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 text-text-muted data-active:bg-accent-ai data-active:text-white"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect */}
        <TabsContent value="architect" className="flex flex-col overflow-hidden">
          {isGenerating && (
            <div className="shrink-0 flex items-center gap-2 border-b border-border-subtle bg-accent-ai/10 px-4 py-2">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-ai" />
              <span className="truncate text-xs text-accent-ai-text">
                {aiStatus?.text ?? "AI is working…"}
              </span>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isGenerating ? (
              <EmptyState onChipClick={handleChip} />
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-accent-primary-dim border-2 border-accent-primary/50 text-text-primary"
                          : "bg-bg-elevated border border-border-default text-accent-ai-text",
                      ].join(" ")}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl bg-bg-elevated border border-border-default px-3 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-ai animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-ai animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-ai animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="shrink-0 border-t border-border-default p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI…"
                disabled={isGenerating}
                className="flex-1 min-h-18 max-h-40 resize-none overflow-y-auto bg-bg-elevated border-border-default text-text-primary placeholder:text-text-faint focus-visible:border-accent-ai focus-visible:ring-accent-ai/20 disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="h-9 w-9 shrink-0 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
              >
                {isGenerating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-8 px-2 text-center">
                <p className="text-sm font-medium text-text-primary">Room Chat</p>
                <p className="text-xs text-text-muted">
                  Send messages to everyone in this room
                </p>
              </div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-text-secondary">
                        {msg.sender}
                      </span>
                      <span className="text-xs text-text-faint">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="rounded-xl bg-bg-elevated border border-border-default px-3 py-2 text-sm text-text-primary">
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {chatError && (
            <div className="shrink-0 px-3 pb-1">
              <p className="text-xs text-state-error">{chatError}</p>
            </div>
          )}

          <div className="shrink-0 border-t border-border-default p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Message the room…"
                className="flex-1 min-h-18 max-h-40 resize-none overflow-y-auto bg-bg-elevated border-border-default text-text-primary placeholder:text-text-faint focus-visible:border-accent-ai focus-visible:ring-accent-ai/20"
              />
              <Button
                size="icon"
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className="h-9 w-9 shrink-0 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs */}
        <TabsContent value="specs" className="overflow-y-auto">
          <div className="p-4 space-y-4">
            <Button className="w-full bg-accent-ai text-white hover:bg-accent-ai/90">
              Generate Spec
            </Button>

            <div className="rounded-2xl border border-border-default bg-bg-elevated p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
                  <FileText className="h-4 w-4 text-accent-ai-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">E-Commerce Architecture</p>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    Microservices spec with product catalog, cart, payment gateway, and order
                    management services.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="gap-1.5 text-xs text-text-faint"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function EmptyState({ onChipClick }: { onChipClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 pt-8 px-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-ai/10">
        <Bot className="h-7 w-7 text-accent-ai-text" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">Ghost AI Architect</p>
        <p className="mt-1 text-xs text-text-muted">
          Describe your system and let AI design the architecture
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onChipClick(prompt)}
            className="rounded-xl bg-bg-subtle px-3 py-2 text-left text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify TypeScript**

```bash
cd /Users/jakkaphat.m/knownlege/ghost-ai && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 10: Run build**

```bash
cd /Users/jakkaphat.m/knownlege/ghost-ai && npm run build 2>&1 | tail -20
```

Expected: build passes with no errors.

- [ ] **Step 11: Manual verification**

Start the dev server:
```bash
npm run dev
```

Check:
1. Open a project workspace — AI sidebar opens, "Chat" tab is visible between "AI Architect" and "Specs"
2. Click "Chat" tab — empty state shows "Room Chat" message
3. Type a message and press Enter (or Send) — message appears in the feed with sender name and timestamp
4. Open the same room in a second browser tab — both tabs show the message in real-time
5. Send a message from the second tab — first tab updates instantly
6. Verify the "AI Architect" tab still works as before (no regressions)
7. Verify the `ai-chat` storage key does not appear in the AI Architect or Specs tabs

- [ ] **Step 12: Update progress tracker**

In `context/progress-tracker.md`:
- Move Feature 25 from `## In Progress` to `## Completed` with summary
- Update `## Next Up`

- [ ] **Step 13: Commit**

```bash
git add components/editor/ai-sidebar.tsx context/progress-tracker.md
git commit -m "feat: add real-time Chat tab to AI sidebar using Liveblocks aiChat LiveList"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| Create `ai-chat` Liveblocks feed, room-scoped | Task 2 — `aiChat: LiveList<ChatMessage>` in Storage |
| Keep separate from `ai-status-feed` | aiChat uses Storage; ai-status uses broadcastEvent — no mixing |
| Subscribe to `ai-chat` in sidebar chat area | Task 3 — `useStorage((root) => root.aiChat.toImmutable())` |
| Render messages in order | Task 3 — LiveList preserves insertion order |
| Show sender, timestamp, message content | Task 3 — Chat tab renders all three fields |
| Consistent sidebar styling / Tailwind / shadcn | Task 3 — reuses same Textarea, Button, color tokens |
| Users can send to `ai-chat` | Task 3 — `useMutation` pushes to LiveList |
| Clear input after send | Task 3 — `setChatInput("")` after `sendChatMessage` |
| Error state if sending fails | Task 3 — `chatError` state shown above input |
| Zod schema in `types/tasks.ts` | Task 1 — `ChatMessageSchema` |
| Schema includes sender, role, content, timestamp | Task 1 — all four fields in schema |
| Validate before rendering | Task 3 — `parseChatMessage` filters invalid messages |
| No AI replies, no backend AI tasks | ✓ — scope-limited to user messages only |
| `npm run build` passes | Task 3, Step 10 |
