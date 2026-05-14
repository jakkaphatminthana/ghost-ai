"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/lib/data/projects";

interface EditorHomeProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function EditorHome({ ownedProjects, sharedProjects }: EditorHomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    dialogType,
    activeProject,
    nameInput,
    setNameInput,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions();

  return (
    <div className="flex h-screen flex-col bg-bg-base text-text-primary overflow-hidden">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="relative flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreateProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />

        <main className="flex h-full flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-lg font-medium text-text-primary">
              Create a project or open an existing one
            </h1>
            <p className="text-sm text-text-muted">
              Start a new architecture workspace, or choose a project from the sidebar.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </main>
      </div>

      <ProjectDialogs
        dialogType={dialogType}
        activeProject={activeProject}
        nameInput={nameInput}
        setNameInput={setNameInput}
        roomId={roomId}
        isLoading={isLoading}
        onClose={closeDialog}
        onConfirmCreate={handleCreate}
        onConfirmRename={handleRename}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}