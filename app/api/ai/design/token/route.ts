import { auth } from "@trigger.dev/sdk/v3";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

interface TokenBody {
  runId: string;
}

export async function POST(request: Request) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: TokenBody;
  try {
    body = (await request.json()) as TokenBody;
  } catch {
    return Response.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const { runId } = body;
  if (typeof runId !== "string" || !runId.trim()) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  let taskRun: { userId: string; projectId: string } | null;
  try {
    taskRun = await prisma.taskRun.findUnique({
      where: { runId: runId.trim() },
      select: { userId: true, projectId: true },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!taskRun) return Response.json({ error: "Not found" }, { status: 404 });
  if (taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const access = await getProjectAccess(taskRun.projectId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let token: string;
  try {
    token = await auth.createPublicToken({
      scopes: { read: { runs: runId.trim() } },
      expirationTime: "1h",
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to create token" }, { status: 500 });
  }

  return Response.json({ token });
}
