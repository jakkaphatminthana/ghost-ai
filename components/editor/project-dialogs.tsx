"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DialogType, MockProject } from "@/hooks/use-project-dialogs";

interface ProjectDialogsProps {
  dialogType: DialogType;
  activeProject: MockProject | null;
  nameInput: string;
  setNameInput: (value: string) => void;
  slug: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirmCreate: () => void;
  onConfirmRename: () => void;
  onConfirmDelete: () => void;
}

export function ProjectDialogs({
  dialogType,
  activeProject,
  nameInput,
  setNameInput,
  slug,
  isLoading,
  onClose,
  onConfirmCreate,
  onConfirmRename,
  onConfirmDelete,
}: ProjectDialogsProps) {
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogType === "rename") {
      const timeoutId = setTimeout(() => renameInputRef.current?.focus(), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [dialogType]);

  return (
    <>
      {/* Create Project */}
      <Dialog
        open={dialogType === "create"}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent
          className="rounded-3xl bg-bg-elevated border-border-default max-w-sm"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Create Project
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="My Project"
              value={nameInput}
              onChange={(e) =>
                setNameInput((e.target as HTMLInputElement).value)
              }
              autoFocus
            />
            <p className="text-xs text-text-muted font-mono">
              {slug ? (
                <>
                  <span className="text-text-faint">ghost.ai/</span>
                  <span className="text-text-secondary">{slug}</span>
                </>
              ) : (
                <span className="text-text-faint">
                  ghost.ai/your-project-name
                </span>
              )}
            </p>
          </div>

          <DialogFooter className="bg-transparent border-t-0 mx-0 mb-0 p-0 mt-2">
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="text-text-muted hover:text-text-primary"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              onClick={onConfirmCreate}
              disabled={isLoading || !nameInput.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project */}
      <Dialog
        open={dialogType === "rename"}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent
          className="rounded-3xl bg-bg-elevated border-border-default max-w-sm"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Rename Project
            </DialogTitle>
            {activeProject && (
              <DialogDescription className="text-text-muted">
                Rename &ldquo;{activeProject.name}&rdquo;
              </DialogDescription>
            )}
          </DialogHeader>

          <Input
            ref={renameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim() && !isLoading)
                onConfirmRename();
            }}
          />

          <DialogFooter className="bg-transparent border-t-0 mx-0 mb-0 p-0 mt-2">
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="text-text-muted hover:text-text-primary"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              onClick={onConfirmRename}
              disabled={isLoading || !nameInput.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project */}
      <Dialog
        open={dialogType === "delete"}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent
          className="rounded-3xl bg-bg-elevated border-border-default max-w-sm"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Delete Project
            </DialogTitle>
            {activeProject && (
              <DialogDescription className="text-text-muted">
                Are you sure you want to delete &ldquo;{activeProject.name}
                &rdquo;? This action cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>

          <DialogFooter className="bg-transparent border-t-0 mx-0 mb-0 p-0 mt-2">
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="text-text-muted hover:text-text-primary"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
