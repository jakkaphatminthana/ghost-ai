import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const access = await getProjectAccess(projectId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ specs });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
