import { tasks, runs } from "@trigger.dev/sdk/v3";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignBody {
  prompt: string;
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

  const { prompt, projectId } = body;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
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
      roomId: access.id,
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
    // Compensate: cancel the queued run so it doesn't run without a DB record.
    await runs.cancel(runId).catch((cancelErr) => {
      console.error("Failed to cancel orphaned run after DB write failure", runId, cancelErr);
    });
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return Response.json({ runId }, { status: 201 });
}
