import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LiveObject, LiveMap } from "@liveblocks/node";
import type { LsonObject } from "@liveblocks/node";
import { z } from "zod";
import { getLiveblocks } from "@/lib/liveblocks";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import type { NodeShape } from "@/types/canvas";

const AI_USER_ID = "ai-agent";
const AI_USER_INFO = { name: "Ghost AI", avatar: "", color: "#6457f9" };

const DesignSchema = z.object({
  summary: z.string().describe("One sentence describing the generated design, for the chat response"),
  nodes: z.array(
    z.object({
      id: z.string().describe("Unique node ID, e.g. 'node-api-gateway'"),
      label: z.string().describe("Short display label"),
      shape: z
        .enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"])
        .describe(
          "rectangle=service/component, diamond=decision/gateway, circle=event/endpoint, pill=process/queue, cylinder=database/storage, hexagon=external/boundary"
        ),
      colorIndex: z
        .number()
        .int()
        .min(0)
        .max(7)
        .describe(
          "Palette index: 0=neutral, 1=blue, 2=purple, 3=orange, 4=red, 5=pink, 6=green, 7=teal"
        ),
      x: z.number().describe("X position on canvas"),
      y: z.number().describe("Y position on canvas"),
      width: z.number().describe("Width in pixels, typically 120–180"),
      height: z.number().describe("Height in pixels, typically 50–70"),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string().describe("Unique edge ID, e.g. 'edge-1'"),
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      label: z.string().optional().describe("Short optional label on the edge"),
    })
  ),
  deleteNodeIds: z
    .array(z.string())
    .optional()
    .describe("IDs of existing nodes to remove before adding the new ones"),
  deleteEdgeIds: z
    .array(z.string())
    .optional()
    .describe("IDs of existing edges to remove before adding the new ones"),
});

const SYSTEM_PROMPT = `You are Ghost AI, an expert system architect that generates visual canvas designs.

Canvas rules:
- Nodes use these shapes: rectangle (services/components), pill (queues/processes), cylinder (databases/storage), hexagon (external systems), circle (events/endpoints), diamond (decisions/gateways)
- Color palette by role: 0=neutral (default), 1=blue (APIs/services), 2=purple (AI/ML), 3=orange (queues/async), 4=red (security/auth), 5=pink (UI/frontend), 6=green (databases/storage), 7=teal (external/3rd party)
- Layout: arrange left-to-right or top-to-bottom following data flow. Start nodes around x=100, y=100. Use 220px horizontal spacing, 150px vertical spacing.
- Node sizes: rectangle/pill 150×60, cylinder 120×70, hexagon 130×65, circle 80×80, diamond 110×70
- Generate IDs using kebab-case based on the node's role, e.g. "node-api-gateway", "node-user-db"
- Edge IDs: "edge-{source-suffix}-{target-suffix}"

When the user already has nodes on the canvas:
- Extend the existing design unless they ask you to replace it
- Use deleteNodeIds/deleteEdgeIds only when the user asks to replace or redo the design
- Place new nodes so they don't overlap existing ones

Generate a clean, professional architecture diagram. Be specific about node labels.`;

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,

  run: async (payload: DesignAgentPayload) => {
    const liveblocks = getLiveblocks();
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });

    // 1. Set AI presence: thinking
    await liveblocks.setPresence(payload.roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, thinking: true },
      userInfo: AI_USER_INFO,
      ttl: 30,
    });

    // 2. Broadcast start
    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "start",
      message: "Ghost AI is designing your architecture…",
    });

    // 3. Read current canvas state
    let currentNodes: Record<string, unknown> = {};
    let currentEdges: Record<string, unknown> = {};
    try {
      const storage = await liveblocks.getStorageDocument(payload.roomId, "json");
      const flow = storage as { flow?: { nodes?: Record<string, unknown>; edges?: Record<string, unknown> } };
      currentNodes = flow.flow?.nodes ?? {};
      currentEdges = flow.flow?.edges ?? {};
    } catch (err) {
      logger.warn("Could not read current canvas state", { err });
    }

    // 4. Generate design with Gemini
    logger.log("Generating design", { prompt: payload.prompt });

    let design: z.infer<typeof DesignSchema>;
    try {
      const result = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: DesignSchema,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              prompt: payload.prompt,
              existingNodes: Object.values(currentNodes),
              existingEdges: Object.values(currentEdges),
            }),
          },
        ],
      });
      design = result.object;
    } catch (err) {
      logger.error("Gemini generation failed", { err });

      await liveblocks.broadcastEvent(payload.roomId, {
        type: "ai-status",
        status: "error",
        message: "Failed to generate design. Please try again.",
      });
      await liveblocks.setPresence(payload.roomId, {
        userId: AI_USER_ID,
        data: { cursor: null, thinking: false },
        userInfo: AI_USER_INFO,
        ttl: 2,
      });
      throw err;
    }

    // 5. Validate shapes and color indices against allowed values
    const validatedNodes = design.nodes.map((node) => {
      const shape: NodeShape = (NODE_SHAPES as readonly string[]).includes(node.shape)
        ? node.shape
        : "rectangle";
      const colorIndex = Math.max(0, Math.min(7, node.colorIndex));
      return { ...node, shape, colorIndex };
    });

    // 6. Broadcast: applying to canvas
    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "processing",
      message: "Applying design to canvas…",
    });

    // 7. Mutate Liveblocks storage
    try {
      await liveblocks.mutateStorage(payload.roomId, ({ root }) => {
        // Ensure flow storage exists
        if (!root.get("flow")) {
          root.set(
            "flow",
            new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            })
          );
        }

        const flow = root.get("flow") as LiveObject<{
          nodes: LiveMap<string, LiveObject<LsonObject>>;
          edges: LiveMap<string, LiveObject<LsonObject>>;
        }>;
        const nodes = flow.get("nodes");
        const edges = flow.get("edges");

        // Delete requested nodes/edges
        for (const id of design.deleteNodeIds ?? []) nodes.delete(id);
        for (const id of design.deleteEdgeIds ?? []) edges.delete(id);

        // Add/replace nodes
        for (const node of validatedNodes) {
          const color = NODE_COLORS[node.colorIndex] ?? NODE_COLORS[0];
          nodes.set(
            node.id,
            new LiveObject({
              id: node.id,
              type: "canvasNode",
              position: { x: node.x, y: node.y },
              data: new LiveObject({
                label: node.label,
                color: color.fill,
                shape: node.shape,
              }),
              width: node.width,
              height: node.height,
              selected: false,
              dragging: false,
            })
          );
        }

        // Add/replace edges
        for (const edge of design.edges) {
          edges.set(
            edge.id,
            new LiveObject({
              id: edge.id,
              type: "canvasEdge",
              source: edge.source,
              target: edge.target,
              data: new LiveObject({ label: edge.label ?? "" }),
              selected: false,
            })
          );
        }
      });
    } catch (err) {
      logger.error("Storage mutation failed", { err });

      await liveblocks.broadcastEvent(payload.roomId, {
        type: "ai-status",
        status: "error",
        message: "Design was generated but failed to apply to canvas.",
      });
      await liveblocks.setPresence(payload.roomId, {
        userId: AI_USER_ID,
        data: { cursor: null, thinking: false },
        userInfo: AI_USER_INFO,
        ttl: 2,
      });
      throw err;
    }

    // 8. Broadcast complete
    await liveblocks.broadcastEvent(payload.roomId, {
      type: "ai-status",
      status: "complete",
      message: design.summary,
    });

    // 9. Clear AI presence
    await liveblocks.setPresence(payload.roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, thinking: false },
      userInfo: AI_USER_INFO,
      ttl: 2,
    });

    logger.log("Design agent complete", {
      nodeCount: design.nodes.length,
      edgeCount: design.edges.length,
    });

    return {
      summary: design.summary,
      nodeCount: design.nodes.length,
      edgeCount: design.edges.length,
    };
  },
});
