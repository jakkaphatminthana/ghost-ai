import { tasks } from "@trigger.dev/sdk/v3";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignBody {
  prompt: string;
  roomId: string;
  projectId: string;
}

export async function POST(request: Request) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: DesignBody;
  try {
    body = (await request.json()) as DesignBody;
  } catch {
    return Response.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const { prompt, roomId, projectId } = body;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }
  if (typeof roomId !== "string" || !roomId.trim()) {
    return Response.json({ error: "roomId is required" }, { status: 400 });
  }
  if (typeof projectId !== "string" || !projectId.trim()) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  const access = await getProjectAccess(projectId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: prompt.trim(),
      roomId: roomId.trim(),
    });
    runId = handle.id;
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to trigger task" }, { status: 500 });
  }

  try {
    await prisma.taskRun.create({
      data: { runId, projectId, userId: identity.userId },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return Response.json({ runId }, { status: 201 });
}
