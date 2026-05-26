"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { AISidebar } from "@/components/editor/ai-sidebar";
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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

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
        onTemplatesClick={() => setIsTemplatesOpen(true)}
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
          <CanvasRoom
            roomId={activeProjectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesClose={() => setIsTemplatesOpen(false)}
          />
        </main>

        <AISidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
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