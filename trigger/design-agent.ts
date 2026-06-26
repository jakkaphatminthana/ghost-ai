import { logger, task } from "@trigger.dev/sdk/v3";

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    logger.log("Design agent triggered", { payload, ctx });
    return { prompt: payload.prompt, roomId: payload.roomId };
  },
});
