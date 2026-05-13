"use client";

import { useState, useCallback } from "react";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  owned: boolean;
}

export const MOCK_PROJECTS: MockProject[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", owned: true },
  { id: "2", name: "Auth Service", slug: "auth-service", owned: true },
  { id: "3", name: "Shared Design System", slug: "shared-design-system", owned: false },
];

export type DialogType = "create" | "rename" | "delete" | null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useProjectDialogs() {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [activeProject, setActiveProject] = useState<MockProject | null>(null);
  const [nameInput, setNameInput] = useState("");
  const isLoading = false;

  const openCreate = useCallback(() => {
    setNameInput("");
    setActiveProject(null);
    setDialogType("create");
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setActiveProject(project);
    setNameInput(project.name);
    setDialogType("rename");
  }, []);

  const openDelete = useCallback((project: MockProject) => {
    setActiveProject(project);
    setDialogType("delete");
  }, []);

  const closeDialog = useCallback(() => {
    setDialogType(null);
    setActiveProject(null);
    setNameInput("");
  }, []);

  const handleCreate = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleRename = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleDelete = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  return {
    dialogType,
    activeProject,
    nameInput,
    setNameInput,
    slug: toSlug(nameInput),
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  };
}