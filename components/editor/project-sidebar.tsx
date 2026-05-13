"use client";

import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MOCK_PROJECTS, type MockProject } from "@/hooks/use-project-dialogs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: MockProject) => void;
  onDeleteProject: (project: MockProject) => void;
}

function ProjectItem({
  project,
  onRename,
  onDelete,
}: {
  project: MockProject;
  onRename: (project: MockProject) => void;
  onDelete: (project: MockProject) => void;
}) {
  return (
    <div tabIndex={0} className="group relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-bg-elevated focus-within:bg-bg-elevated transition-colors cursor-default outline-none">
      <span className="flex-1 truncate text-sm text-text-secondary">{project.name}</span>
      {project.owned && (
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6 text-text-faint hover:text-text-primary hover:bg-bg-subtle"
            onClick={() => onRename(project)}
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6 text-text-faint hover:text-state-error hover:bg-bg-subtle"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const myProjects = MOCK_PROJECTS.filter((p) => p.owned);
  const sharedProjects = MOCK_PROJECTS.filter((p) => !p.owned);

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
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
            aria-label="Close sidebar"
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

          <TabsContent value="my-projects" className="flex-1 overflow-y-auto p-2">
            {myProjects.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">No projects yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {myProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-y-auto p-2">
            {sharedProjects.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-muted">No shared projects yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="shrink-0 p-3 border-t border-border-default">
          <Button className="w-full gap-2" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}