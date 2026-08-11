import { z } from "zod";

/** Permission modes for tool execution. */
export const permissionModeSchema = z.enum(["auto", "ask", "allow", "plan"]);

export const providerNameSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "openrouter",
  "ollama",
  "sglang",
]);

/** Provider configuration. */
export const providerConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/** Shell command allow/deny rules. */
export const shellRulesSchema = z.object({
  allow: z.array(z.string()).optional(),
  deny: z.array(z.string()).optional(),
});

export const diagnosticsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  command: z.string().default("bun run typecheck"),
});

export const repoMapConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxFiles: z.number().int().min(10).max(10_000).default(500),
});

export const costTrackingSchema = z.object({
  enabled: z.boolean().default(true),
  promptTokenUsdPer1K: z.number().min(0).default(0),
  completionTokenUsdPer1K: z.number().min(0).default(0),
});

export const gitConfigSchema = z.object({
  autoCommit: z.boolean().default(false),
  commitMessageTemplate: z.string().default("opencode-ai: {summary}"),
});

export const mcpServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export const mcpConfigSchema = z.object({
  servers: z.record(mcpServerSchema).default({}),
});

/** Full opencode-ai configuration. */
export const configSchema = z.object({
  provider: providerNameSchema.default("openai"),
  model: z.string().default("gpt-4o"),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxSteps: z.number().int().min(1).max(100).default(20),
  maxRetries: z.number().int().min(0).max(10).default(2),
  permissionMode: permissionModeSchema.default("ask"),
  systemPrompt: z.string().optional(),
  persona: z.string().optional(),
  cwd: z.string().default(process.cwd()),
  dataDir: z.string().optional(),
  maxToolOutput: z.number().int().min(1_000).max(100_000).default(10_000),
  diffPreview: z.boolean().default(true),
  theme: z.enum(["light", "dark"]).default("light"),
  shellRules: shellRulesSchema.optional(),
  providers: z.record(z.string(), providerConfigSchema).optional(),
  diagnostics: diagnosticsConfigSchema.default({}),
  repoMap: repoMapConfigSchema.default({}),
  costTracking: costTrackingSchema.default({}),
  git: gitConfigSchema.default({}),
  mcp: mcpConfigSchema.default({}),
  personas: z.record(z.string()).optional(),
});

export type Config = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type ShellRules = z.infer<typeof shellRulesSchema>;
export type PermissionMode = z.infer<typeof permissionModeSchema>;
export type ProviderName = z.infer<typeof providerNameSchema>;
