import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface ClerkIdentity {
  userId: string;
  email: string;
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  return { userId, email };
}

export async function getProjectAccess(
  projectId: string,
  userId: string,
  email: string
): Promise<{ id: string; name: string; isOwner: boolean } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: { select: { email: true } },
    },
  });

  if (!project) return null;

  const isOwner = project.ownerId === userId;
  const hasAccess =
    isOwner || project.collaborators.some((c) => c.email === email);

  if (!hasAccess) return null;

  return { id: project.id, name: project.name, isOwner };
}