import type { z } from "zod";
import type { ToolContext } from "../types";

/** A tool definition with a Zod schema. */
export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  requiresPermission?: boolean;
  execute: (input: any, ctx: ToolContext) => Promise<unknown>;
}

/** Result of a tool execution, formatted for the LLM. */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  truncated?: boolean;
}

/** Maximum output size for tool results (in characters). */
export const MAX_TOOL_OUTPUT = 10_000;

/** Truncate a string to a maximum length, adding a truncation notice. */
export function truncateOutput(text: string, max = MAX_TOOL_OUTPUT): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n... [truncated: ${text.length - max} more characters]`;
}

/** Format a tool result for the LLM. */
export function formatToolResult(result: ToolResult): string {
  if (!result.success) {
    return `Error: ${result.error ?? "Unknown error"}`;
  }
  return result.output;
}