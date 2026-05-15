"use client";

import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  projectName?: string;
  isAiSidebarOpen?: boolean;
  onAiSidebarToggle?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  projectName,
  isAiSidebarOpen,
  onAiSidebarToggle,
}: EditorNavbarProps) {
  return (
    <header className="h-12 flex items-center px-3 bg-bg-surface border-b border-border-default shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        {projectName && (
          <span className="text-sm font-medium text-text-primary">{projectName}</span>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {onAiSidebarToggle && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAiSidebarToggle}
              aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
              aria-expanded={isAiSidebarOpen}
              className="h-8 w-8 text-text-muted hover:text-accent-ai-text hover:bg-bg-elevated"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  );
}