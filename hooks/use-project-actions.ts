"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Project } from "@/lib/data/projects";

export type { Project };
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

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = toSlug(nameInput.trim());
  const roomId = slug ? `${slug}-${suffix}` : "";

  const openCreate = useCallback(() => {
    setSuffix(randomSuffix());
    setNameInput("");
    setActiveProject(null);
    setDialogType("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setActiveProject(project);
    setNameInput(project.name);
    setDialogType("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setActiveProject(project);
    setDialogType("delete");
  }, []);

  const closeDialog = useCallback(() => {
    setDialogType(null);
    setActiveProject(null);
    setNameInput("");
  }, []);

  const handleCreate = useCallback(async () => {
    if (!nameInput.trim() || !suffix) return;
    const id = `${toSlug(nameInput.trim())}-${suffix}`;
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim(), id }),
      });
      if (!res.ok) throw new Error("Create failed");
      setDialogType(null);
      setNameInput("");
      router.push(`/editor/${id}`);
    } finally {
      setIsLoading(false);
    }
  }, [nameInput, suffix, router]);

  const handleRename = useCallback(async () => {
    if (!activeProject || !nameInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (!res.ok) throw new Error("Rename failed");
      setDialogType(null);
      setActiveProject(null);
      setNameInput("");
      startTransition(() => router.refresh());
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, nameInput, router, startTransition]);

  const handleDelete = useCallback(async () => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      await fetch(`/api/projects/${activeProject.id}`, { method: "DELETE" });
      setDialogType(null);
      setActiveProject(null);
      if (pathname === `/editor/${activeProject.id}`) {
        router.push("/editor");
      } else {
        startTransition(() => router.refresh());
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, pathname, router, startTransition]);

  return {
    dialogType,
    activeProject,
    nameInput,
    setNameInput,
    roomId,
    isLoading: isLoading || isPending,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  };
}