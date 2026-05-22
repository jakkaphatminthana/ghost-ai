"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasRoom } from "@/components/editor/canvas-room";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/lib/data/projects";

interface WorkspaceShellProps {
  projectName: string;
  activeProjectId: string;
  isOwner: boolean;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceShell({
  projectName,
  activeProjectId,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
        projectName={projectName}
        onShareClick={() => setIsShareOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((prev) => !prev)}
      />

      <div className="relative flex-1 overflow-hidden flex">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={activeProjectId}
          onCreateProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />

        <main className="flex-1 overflow-hidden">
          <CanvasRoom roomId={activeProjectId} />
        </main>

        {isAiSidebarOpen && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-border-default bg-bg-surface">
            <div className="flex h-12 shrink-0 items-center border-b border-border-default px-4">
              <span className="text-sm font-medium text-text-primary">AI Assistant</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-text-muted">AI chat coming soon</p>
            </div>
          </aside>
        )}
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

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={activeProjectId}
        projectName={projectName}
        isOwner={isOwner}
      />
    </div>
  );
}