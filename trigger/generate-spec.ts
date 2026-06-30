import { logger, task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { getLiveblocks } from "@/lib/liveblocks";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const NodeSchema = z.object({
  id: z.string(),
  data: z.object({
    label: z.string(),
    color: z.string().optional(),
    shape: z.string().optional(),
  }),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
});

const ChatMessageInputSchema = z.object({
  sender: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number().optional(),
});

const GenerateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageInputSchema),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

type GenerateSpecPayload = z.infer<typeof GenerateSpecPayloadSchema>;
type Node = z.infer<typeof NodeSchema>;
type Edge = z.infer<typeof EdgeSchema>;
type ChatMessageInput = z.infer<typeof ChatMessageInputSchema>;

const SYSTEM_PROMPT = `You are Ghost AI, an expert software architect. Given a system design canvas (nodes and edges) and conversation history, generate a detailed technical specification in Markdown.

Structure the spec with these sections:
# Technical Specification: [System Name]

## Overview
Brief description of the system and its purpose.

## Architecture
Overall architecture pattern and key design decisions.

## Components
For each node/service: its role, responsibilities, and key interfaces.

## Data Flow
How data moves through the system based on the connections between components.

## Technical Decisions
Key architectural trade-offs and their rationale.

## Implementation Notes
Constraints, assumptions, or considerations for implementation.

Be specific, technical, and actionable. Derive the system name from the components present. Use the conversation history for additional context about requirements and intent.`;

export const generateSpecTask = task({
  id: "generate-spec",
  maxDuration: 300,
  // Spec generation is not idempotent at the broadcast layer — retries would
  // emit duplicate status events.
  retry: { maxAttempts: 1 },

  run: async (rawPayload: unknown) => {
    const parsed = GenerateSpecPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      logger.error("Invalid payload", { errors: parsed.error.issues });
      throw new Error(`Invalid payload: ${parsed.error.message}`);
    }

    const payload: GenerateSpecPayload = parsed.data;
    const liveblocks = getLiveblocks();
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

    // Broadcast start
    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "start",
      text: "Ghost AI is generating the technical specification…",
    });

    logger.log("Generating spec", {
      projectId: payload.projectId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      chatHistoryLength: payload.chatHistory.length,
    });

    const canvasDescription = formatCanvas(payload.nodes, payload.edges);
    const chatContext = formatChatHistory(payload.chatHistory);

    let spec: string;
    try {
      const result = await generateText({
        model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate a technical specification for this system design.\n\n## Canvas\n${canvasDescription}\n\n## Conversation History\n${chatContext}`,
          },
        ],
      });
      spec = result.text;
    } catch (err) {
      logger.error("Groq generation failed", { err });
      await liveblocks.broadcastEvent(payload.roomId, {
        type: "ai-status",
        status: "error",
        text: "Failed to generate specification. Please try again.",
      });
      throw err;
    }

    let specId: string;
    try {
      const blob = await put(
        `specs/${payload.projectId}/${Date.now()}.md`,
        spec,
        { access: "private", contentType: "text/markdown", addRandomSuffix: true }
      );
      const record = await prisma.projectSpec.create({
        data: { projectId: payload.projectId, filePath: blob.url },
        select: { id: true },
      });
      specId = record.id;
    } catch (err) {
      logger.error("Failed to persist spec", { err });
      await liveblocks.broadcastEvent(payload.roomId, {
        type: "ai-status",
        status: "error",
        text: "Spec generated but could not be saved. Please try again.",
      });
      throw err;
    }

    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "complete",
      text: "Technical specification generated.",
    });

    logger.log("Spec generation complete", {
      projectId: payload.projectId,
      specLength: spec.length,
      specId,
    });

    return { spec, specId };
  },
});

function formatCanvas(nodes: Node[], edges: Edge[]): string {
  const nodeIndex = new Map(nodes.map((n) => [n.id, n]));

  const nodeLines = nodes.map(
    (n) => `- ${n.data.label} (id: ${n.id}${n.data.shape ? `, shape: ${n.data.shape}` : ""})`
  );

  const edgeLines = edges.map((e) => {
    const sourceLabel = nodeIndex.get(e.source)?.data.label ?? e.source;
    const targetLabel = nodeIndex.get(e.target)?.data.label ?? e.target;
    const label = e.data?.label ? ` [${e.data.label}]` : "";
    return `- ${sourceLabel} → ${targetLabel}${label}`;
  });

  const parts = ["### Nodes", ...nodeLines];
  if (edgeLines.length > 0) {
    parts.push("", "### Connections", ...edgeLines);
  }
  return parts.join("\n");
}

function formatChatHistory(messages: ChatMessageInput[]): string {
  if (messages.length === 0) return "(no conversation history)";
  return messages
    .map((m) => `**${m.role === "user" ? "User" : "AI"}**: ${m.content}`)
    .join("\n\n");
}
