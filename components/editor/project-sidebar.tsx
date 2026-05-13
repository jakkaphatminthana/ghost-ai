"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 flex h-full w-72 flex-col",
        "bg-bg-surface border-r border-border-default",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-border-default">
        <span className="text-sm font-medium text-text-primary">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden">
        <div className="px-3 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-projects" className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-text-muted">No projects yet.</p>
        </TabsContent>

        <TabsContent value="shared" className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-text-muted">No shared projects yet.</p>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 p-3 border-t border-border-default">
        <Button variant="outline" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}