import { prisma } from "@/lib/prisma";

export interface Project {
  id: string;
  name: string;
  owned: boolean;
}

export async function getOwnedProjects(userId: string): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ ...r, owned: true }));
}

export async function getSharedProjects(email: string): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { collaborators: { some: { email } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ ...r, owned: false }));
}