import { redirect } from "next/navigation";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { getOwnedProjects, getSharedProjects } from "@/lib/data/projects";
import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const { roomId } = await params;

  const identity = await getClerkIdentity();
  if (!identity) redirect("/sign-in");

  const { userId, email } = identity;

  const project = await getProjectAccess(roomId, userId, email);
  if (!project) return <AccessDenied />;

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(userId),
    email ? getSharedProjects(email) : Promise.resolve([]),
  ]);

  return (
    <WorkspaceShell
      projectName={project.name}
      activeProjectId={roomId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}