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

  // Current user info for chat sender name
  const self = useSelf();

  // Subscribe to ai-chat feed from Liveblocks Storage
  const rawMessages = useStorage((root) => root.aiChat);
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
