"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Bot, Download, FileText, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: text },
    ]);
    setInput("");
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
            {messages.length === 0 ? (
              <EmptyState onChipClick={handleChip} />
            ) : (
              messages.map((msg) => (
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
              ))
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
                className="flex-1 min-h-[72px] max-h-[160px] resize-none overflow-y-auto bg-bg-elevated border-border-default text-text-primary placeholder:text-text-faint focus-visible:border-accent-ai focus-visible:ring-accent-ai/20"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
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