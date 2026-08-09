import { z } from "zod";

/**
 * Environment variable schema for opencode-ai.
 * All env vars are optional; config file + CLI flags take precedence.
 */
const envSchema = z.object({
  OPENCODE_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "fatal"])
    .optional(),
  OPENCODE_DATA_DIR: z.string().optional(),
  OPENCODE_CONFIG_PATH: z.string().optional(),
  OPENCODE_PROVIDER: z
    .enum(["openai", "anthropic", "google", "openrouter", "ollama"])
    .optional(),
  OPENCODE_MODEL: z.string().optional(),
  OPENCODE_API_KEY: z.string().optional(),
  OPENCODE_BASE_URL: z.string().url().optional(),
  OPENCODE_TEMPERATURE: z.coerce.number().min(0).max(2).optional(),
  OPENCODE_MAX_STEPS: z.coerce.number().int().min(1).max(100).optional(),
  OPENCODE_MAX_RETRIES: z.coerce.number().int().min(0).max(10).optional(),
  OPENCODE_PERMISSION_MODE: z.enum(["auto", "ask", "plan"]).optional(),
  OPENCODE_SYSTEM_PROMPT: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Returns a typed, validated object.
 */
export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

/** Get a single env var with a fallback. */
export function getEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}