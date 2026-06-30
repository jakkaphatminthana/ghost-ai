import { z } from "zod";

export const AI_STATUS_VALUES = [
  "start",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusValue = (typeof AI_STATUS_VALUES)[number];

export interface AiStatusPayload {
  status: AiStatusValue;
  text?: string;
}

export function isAiStatusPayload(value: unknown): value is AiStatusPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!AI_STATUS_VALUES.includes(v.status as AiStatusValue)) return false;
  if (v.text !== undefined && typeof v.text !== "string") return false;
  return true;
}

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string().min(1),
  timestamp: z.number(),
  channel: z.union([z.literal("architect"), z.literal("chat")]),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export function parseChatMessage(value: unknown): ChatMessage | null {
  const result = ChatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
