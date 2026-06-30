"use client";

import { startTransition, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, Download, FileText, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import type { generateSpecTask } from "@/trigger/generate-spec";
import { useEventListener, useMutation, useSelf, useStorage } from "@liveblocks/react";
import {
  isAiStatusPayload,
  parseChatMessage,
  type AiStatusPayload,
  type ChatMessage,
} from "@/types/tasks";
import ReactMarkdown from "react-markdown";

interface ProjectSpec {
  id: string;
  createdAt: string;
  filePath: string;
}

interface RunSession {
  runId: string;
  token: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CRASHED",
  "CANCELED",
  "TIMED_OUT",
  "SYSTEM_FAILURE",
  "EXPIRED",
];

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

export function AISidebar({ isOpen, onClose, projectId, roomId }: AISidebarProps) {
  // --- AI Architect state ---
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [runSession, setRunSession] = useState<RunSession | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatusPayload | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Chat state ---
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Specs state ---
  const [specs, setSpecs] = useState<ProjectSpec[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [specRunSession, setSpecRunSession] = useState<RunSession | null>(null);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const self = useSelf();
  const canvasFlow = useStorage((root) => root.flow);

  // Shared ai-chat feed from Liveblocks Storage, split by channel
  const rawMessages = useStorage((root) => root.aiChat);
  const allMessages: ChatMessage[] = (rawMessages ?? [])
    .map((m) => parseChatMessage(m))
    .filter((m): m is ChatMessage => m !== null);
  const architectMessages = allMessages.filter((m) => m.channel === "architect");
  const chatMessages = allMessages.filter((m) => m.channel === "chat");

  const pushToAiChat = useMutation(({ storage }, message: ChatMessage) => {
    storage.get("aiChat").push(message);
  }, []);

  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    if (!isAiStatusPayload(event)) return;

    setAiStatus(event);

    if (event.status === "start" || event.status === "processing") {
      setIsGenerating(true);
    }
    if (event.status === "complete" || event.status === "error") {
      setIsGenerating(false);
      setAiStatus(null);
    }
  });

  // Design run realtime tracking
  const { run: designRun } = useRealtimeRun<typeof designAgentTask>(runSession?.runId, {
    accessToken: runSession?.token,
    enabled: !!runSession,
    stopOnCompletion: true,
  });

  // Spec run realtime tracking
  const { run: specRun } = useRealtimeRun<typeof generateSpecTask>(specRunSession?.runId, {
    accessToken: specRunSession?.token,
    enabled: !!specRunSession,
    stopOnCompletion: true,
  });

  const designRunStatus = designRun?.status;
  useEffect(() => {
    if (!designRunStatus || !TERMINAL_STATUSES.includes(designRunStatus)) return;
    startTransition(() => {
      setRunSession(null);
      setIsGenerating(false);
    });
  }, [designRunStatus]);

  const specRunStatus = specRun?.status;
  useEffect(() => {
    if (!specRunStatus || !TERMINAL_STATUSES.includes(specRunStatus)) return;
    startTransition(() => {
      setSpecRunSession(null);
      setIsGeneratingSpec(false);
    });
    if (specRunStatus === "COMPLETED") fetchSpecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specRunStatus]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [architectMessages, isGenerating]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load specs once on mount
  useEffect(() => {
    fetchSpecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ---------- Spec helpers ----------

  async function fetchSpecs() {
    setSpecsLoading(true);
    setSpecsError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { specs: ProjectSpec[] };
      setSpecs(data.specs);
    } catch {
      setSpecsError("Failed to load specs.");
    } finally {
      setSpecsLoading(false);
    }
  }

  async function handleGenerateSpec() {
    if (isGeneratingSpec) return;
    setIsGeneratingSpec(true);

    const nodes = canvasFlow?.nodes ? Object.values(canvasFlow.nodes) : [];
    const edges = canvasFlow?.edges ? Object.values(canvasFlow.edges) : [];
    const chatHistory = architectMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let runId: string;
    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges }),
      });
      if (!res.ok) throw new Error("trigger failed");
      ({ runId } = (await res.json()) as { runId: string });
    } catch {
      setIsGeneratingSpec(false);
      return;
    }

    try {
      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (tokenRes.ok) {
        const { token } = (await tokenRes.json()) as { token: string };
        setSpecRunSession({ runId, token });
      }
    } catch {
      // Task is running; no realtime tracking but spec will still be saved.
    }
  }

  async function handlePreview(specId: string) {
    setPreviewSpecId(specId);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${specId}/download`);
      if (!res.ok) throw new Error("fetch failed");
      setPreviewContent(await res.text());
    } catch {
      setPreviewContent(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleDownload(specId: string) {
    const a = document.createElement("a");
    a.href = `/api/projects/${projectId}/specs/${specId}/download`;
    a.download = `spec-${specId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---------- Design helpers ----------

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput("");
    setIsGenerating(true);

    pushToAiChat({
      id: crypto.randomUUID(),
      sender: self?.info.name ?? "You",
      role: "user",
      content: text,
      timestamp: Date.now(),
      channel: "architect",
    });

    let runId: string;
    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      });
      if (!designRes.ok) throw new Error("Failed to start design generation");
      ({ runId } = (await designRes.json()) as { runId: string });
    } catch {
      pushToAiChat({
        id: crypto.randomUUID(),
        sender: "Ghost AI",
        role: "assistant",
        content: "Failed to start the design agent. Please try again.",
        timestamp: Date.now(),
        channel: "architect",
      });
      setIsGenerating(false);
      return;
    }

    try {
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!tokenRes.ok) throw new Error("token failed");
      const { token } = (await tokenRes.json()) as { token: string };
      setRunSession({ runId, token });
    } catch {
      // No realtime subscription; ai-status events will clear isGenerating.
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
      channel: "chat",
    };

    try {
      pushToAiChat(message);
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

  const isRunActive = !!runSession || isGenerating;

  return (
    <>
      {/* Spec preview modal */}
      <Dialog
        open={previewSpecId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewSpecId(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-3xl h-[80vh] flex flex-col gap-0 p-0 bg-bg-surface border-border-default rounded-3xl overflow-hidden"
        >
          <DialogHeader className="shrink-0 px-6 py-4 border-b border-border-default">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FileText className="h-4 w-4 text-accent-ai-text" />
              Technical Specification
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-ai border-t-transparent" />
              </div>
            ) : previewContent ? (
              <div className="prose prose-invert prose-sm max-w-none text-text-secondary [&_h1]:text-text-primary [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-text-primary [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-text-secondary [&_h3]:text-xs [&_h3]:font-medium [&_code]:bg-bg-elevated [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-lg [&_code]:text-accent-ai-text [&_pre]:bg-bg-elevated [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_a]:text-accent-primary [&_strong]:text-text-primary [&_ul]:space-y-1 [&_ol]:space-y-1">
                <ReactMarkdown>{previewContent}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-text-faint text-center pt-12">
                Failed to load spec content.
              </p>
            )}
          </div>

          <div className="shrink-0 flex justify-end px-6 py-4 border-t border-border-default">
            <Button
              onClick={() => previewSpecId && handleDownload(previewSpecId)}
              className="gap-2 bg-accent-ai text-white hover:bg-accent-ai/90"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {architectMessages.length === 0 && !isGenerating ? (
                <EmptyState onChipClick={handleChip} />
              ) : (
                <>
                  {architectMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          msg.role === "user"
                            ? "bg-accent-green text-white"
                            : "bg-bg-elevated border border-border-default text-text-secondary",
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

            <div className="shrink-0 border-t border-border-default p-3 space-y-2">
              {isRunActive && (
                <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-green" />
                  <span className="truncate text-xs text-text-muted">
                    {aiStatus?.text ?? "AI is working…"}
                  </span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Ghost AI…"
                  disabled={isGenerating}
                  className="flex-1 min-h-18 max-h-40 resize-none overflow-y-auto bg-bg-elevated border-border-default text-text-primary placeholder:text-text-faint focus-visible:border-accent-green focus-visible:ring-accent-green/20 disabled:opacity-50"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating}
                  className="h-9 w-9 shrink-0 bg-accent-green text-white hover:bg-accent-green/90 disabled:opacity-40"
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
                      <div
                        className={[
                          "rounded-xl px-3 py-2 text-sm",
                          msg.role === "assistant"
                            ? "bg-bg-elevated border border-border-default text-accent-ai-text"
                            : "bg-bg-elevated border border-border-default text-text-primary",
                        ].join(" ")}
                      >
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
          <TabsContent value="specs" className="flex flex-col overflow-hidden">
            <div className="shrink-0 flex gap-2 p-3 border-b border-border-default">
              <Button
                className="flex-1 bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-50"
                disabled={isGeneratingSpec}
                onClick={handleGenerateSpec}
              >
                {isGeneratingSpec ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating…
                  </span>
                ) : (
                  "Generate Spec"
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchSpecs}
                disabled={specsLoading}
                aria-label="Refresh specs"
                className="h-9 w-9 shrink-0 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
              >
                <RefreshCw className={`h-4 w-4 ${specsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {specsError ? (
                <p className="pt-4 text-center text-xs text-state-error">{specsError}</p>
              ) : specsLoading && specs.length === 0 ? (
                <div className="flex justify-center pt-8">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ai border-t-transparent" />
                </div>
              ) : specs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 pt-8 px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-subtle">
                    <FileText className="h-5 w-5 text-accent-ai-text" />
                  </div>
                  <p className="text-xs text-text-muted">
                    No specs yet. Generate one from your canvas.
                  </p>
                </div>
              ) : (
                specs.map((spec) => (
                  <SpecItem
                    key={spec.id}
                    spec={spec}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}

interface SpecItemProps {
  spec: ProjectSpec;
  onPreview: (id: string) => void;
  onDownload: (id: string) => void;
}

function SpecItem({ spec, onPreview, onDownload }: SpecItemProps) {
  const date = new Date(spec.createdAt);
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      role="button"
      tabIndex={0}
      className="group rounded-xl border border-border-default bg-bg-elevated p-3 cursor-pointer hover:border-border-subtle transition-colors"
      onClick={() => onPreview(spec.id)}
      onKeyDown={(e) => e.key === "Enter" && onPreview(spec.id)}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-subtle mt-0.5">
          <FileText className="h-3.5 w-3.5 text-accent-ai-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary">Technical Specification</p>
          <p className="text-xs text-text-faint">
            {label} · {time}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(spec.id);
          }}
          className="h-6 gap-1 px-2 text-xs text-text-faint hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
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
