import type { z } from "zod";

export type JsonObject = Record<string, unknown>;

/** Role of a message in a conversation. */
export type Role = "user" | "assistant" | "system" | "tool";

/** Status of a tool call. */
export type ToolCallStatus = "running" | "success" | "error";

/** A session represents a persistent conversation. */
export interface Session {
  id: string;
  title: string;
  cwd: string;
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: JsonObject;
}

/** A message in a session. */
export interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  createdAt: Date;
  metadata?: JsonObject;
}

/** A tool invocation within a message. */
export interface ToolCall {
  id: string;
  messageId: string;
  name: string;
  input: JsonObject;
  output?: unknown;
  status: ToolCallStatus;
  durationMs?: number;
  createdAt: Date;
}

/** Permission modes for tool execution. */
export type PermissionMode = "auto" | "ask" | "allow" | "plan";

/** Shell command allow/deny configuration. */
export interface ShellRules {
  allow?: string[];
  deny?: string[];
}

/** Token/cost metadata returned by providers. */
export interface UsageMetadata {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/** Agent configuration. */
export interface AgentConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxSteps: number;
  maxRetries?: number;
  permissionMode: PermissionMode;
  systemPrompt?: string;
  persona?: string;
  cwd: string;
  dataDir?: string;
  shellRules?: ShellRules;
  maxToolOutput?: number;
  diffPreview?: boolean;
  theme?: "light" | "dark";
  diagnostics?: {
    enabled?: boolean;
    command?: string;
  };
  repoMap?: {
    enabled?: boolean;
    maxFiles?: number;
  };
  costTracking?: {
    enabled?: boolean;
    promptTokenUsdPer1K?: number;
    completionTokenUsdPer1K?: number;
  };
  git?: {
    autoCommit?: boolean;
    commitMessageTemplate?: string;
  };
  mcp?: {
    servers?: Record<string, McpServerConfig>;
  };
  personas?: Record<string, string>;
}

/** A tool definition with a Zod schema. */
export interface ToolDefinition<TInput extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: TInput;
  requiresPermission?: boolean;
  execute: (input: z.infer<TInput>, ctx: ToolContext) => Promise<unknown>;
}

/** Context passed to tool execution. */
export interface ToolContext {
  cwd: string;
  sessionId: string;
  messageId?: string;
  permissionMode: PermissionMode;
  shellRules?: ShellRules;
  maxToolOutput?: number;
  requestPermission: (
    toolName: string,
    input: unknown,
    details?: { description?: string; preview?: string },
  ) => Promise<boolean>;
  logger: {
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
  };
}

/** Result of a tool execution, formatted for the LLM. */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  truncated?: boolean;
}

/** Event emitted by the agent during execution. */
export type AgentEvent =
  | { type: "text"; content: string }
  | { type: "tool_start"; toolCall: ToolCall }
  | { type: "tool_end"; toolCall: ToolCall }
  | { type: "step"; step: number; maxSteps: number }
  | { type: "usage"; usage: UsageMetadata }
  | { type: "done"; message: Message }
  | { type: "aborted" }
  | { type: "error"; error: string };

/** Callback for streaming agent events. */
export type AgentEventCallback = (event: AgentEvent) => void;
