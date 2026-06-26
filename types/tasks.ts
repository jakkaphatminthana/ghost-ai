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
