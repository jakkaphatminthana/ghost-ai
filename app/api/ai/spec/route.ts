import { tasks, runs } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { getClerkIdentity, getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { generateSpecTask } from "@/trigger/generate-spec";

const SpecRequestSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  chatHistory: z.array(z.unknown()),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

export async function POST(request: Request) {
  const identity = await getClerkIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const parsed = SpecRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // roomId is the projectId in this app; resolve and verify access here
  // so the task never receives an unverified client-supplied projectId.
  const access = await getProjectAccess(roomId, identity.userId, identity.email);
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const projectId = access.id;

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      projectId,
      roomId,
      chatHistory,
      nodes,
      edges,
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
