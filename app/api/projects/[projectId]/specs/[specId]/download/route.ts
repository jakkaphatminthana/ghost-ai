import { get } from "@vercel/blob";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, specId } = await params;

  const access = await getProjectAccess(projectId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let spec: { projectId: string; filePath: string } | null;
  try {
    spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { projectId: true, filePath: true },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!spec) return Response.json({ error: "Not found" }, { status: 404 });
  if (spec.projectId !== projectId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let blob: Awaited<ReturnType<typeof get>>;
  try {
    blob = await get(spec.filePath, { access: "private" });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!blob?.stream) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
