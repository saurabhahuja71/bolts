import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { configSchema, type Config, type ProviderName } from "./schema";
import { ConfigError } from "../utils/errors";
import { loadEnv } from "../utils/env";

/** Default config file names to look for. */
const CONFIG_FILENAMES = ["opencode.json", ".opencode/config.json"];

/**
 * Find config file paths in merge order.
 * Priority: defaults < global config < project config < env path / CLI path < env vars < CLI flags.
 */
export function findConfigPaths(cliPath?: string): string[] {
  const paths: string[] = [];

  // Global config (~/.config/opencode/config.json)
  const globalPath = join(homedir(), ".config", "opencode", "config.json");
  if (existsSync(globalPath)) paths.push(globalPath);

  const envPath = process.env.OPENCODE_CONFIG_PATH;

  // Project config (cwd). Later files override earlier files.
  for (const name of CONFIG_FILENAMES) {
    const p = join(process.cwd(), name);
    if (existsSync(p)) paths.push(p);
  }

  if (envPath && existsSync(envPath)) paths.push(envPath);
  if (cliPath) paths.push(cliPath);

  return [...new Set(paths)];
}

/** Backward-compatible helper that returns the highest-priority config path. */
export function findConfigPath(cliPath?: string): string | undefined {
  return findConfigPaths(cliPath).at(-1);
}

/**
 * Load and validate configuration.
 * Merges: defaults < config file < environment variables < CLI flags.
 */
export function loadConfig(options: {
  configPath?: string;
  cliOverrides?: Partial<Config>;
} = {}): Config {
  const { configPath, cliOverrides } = options;

  // 1. Start with defaults
  let config: Config = configSchema.parse({});

  // 2. Merge config files
  for (const foundPath of findConfigPaths(configPath)) {
    try {
      const raw = readFileSync(foundPath, "utf-8");
      const parsed = JSON.parse(raw);
      config = configSchema.parse({ ...config, ...parsed });
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new ConfigError(`Invalid JSON in config file: ${foundPath}`, err);
      }
      throw err;
    }
  }

  // 3. Merge environment variables
  const env = loadEnv();
  const envOverrides: Partial<Config> = {};
  if (env.OPENCODE_PROVIDER) envOverrides.provider = env.OPENCODE_PROVIDER;
  if (env.OPENCODE_MODEL) envOverrides.model = env.OPENCODE_MODEL;
  if (env.OPENCODE_API_KEY) envOverrides.apiKey = env.OPENCODE_API_KEY;
  if (env.OPENCODE_BASE_URL) envOverrides.baseUrl = env.OPENCODE_BASE_URL;
  if (env.OPENCODE_TEMPERATURE !== undefined) envOverrides.temperature = env.OPENCODE_TEMPERATURE;
  if (env.OPENCODE_MAX_STEPS !== undefined) envOverrides.maxSteps = env.OPENCODE_MAX_STEPS;
  if (env.OPENCODE_MAX_RETRIES !== undefined) envOverrides.maxRetries = env.OPENCODE_MAX_RETRIES;
  if (env.OPENCODE_PERMISSION_MODE) envOverrides.permissionMode = env.OPENCODE_PERMISSION_MODE;
  if (env.OPENCODE_SYSTEM_PROMPT) envOverrides.systemPrompt = env.OPENCODE_SYSTEM_PROMPT;
  if (env.OPENCODE_DATA_DIR) envOverrides.dataDir = env.OPENCODE_DATA_DIR;

  config = configSchema.parse({ ...config, ...envOverrides });

  if (env.OPENAI_API_KEY && config.provider === "openai") {
    config.apiKey = env.OPENAI_API_KEY;
  }
  if (env.ANTHROPIC_API_KEY && config.provider === "anthropic") {
    config.apiKey = env.ANTHROPIC_API_KEY;
  }
  if (env.GOOGLE_GENERATIVE_AI_API_KEY && config.provider === "google") {
    config.apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  }
  if (env.OPENROUTER_API_KEY && config.provider === "openrouter") {
    config.apiKey = env.OPENROUTER_API_KEY;
  }
  if (env.OLLAMA_BASE_URL && config.provider === "ollama") {
    config.baseUrl = env.OLLAMA_BASE_URL;
  }

  config = applyProviderProfile(config);

  // 4. Merge CLI overrides (highest priority)
  if (cliOverrides) {
    config = configSchema.parse({ ...config, ...cliOverrides });
    config = applyProviderProfile(config);
  }

  return config;
}

function applyProviderProfile(config: Config): Config {
  const profile = config.providers?.[config.provider as ProviderName];
  if (!profile) return config;

  return configSchema.parse({
    ...config,
    ...(profile.model ? { model: profile.model } : {}),
    ...(profile.apiKey ? { apiKey: profile.apiKey } : {}),
    ...(profile.baseUrl ? { baseUrl: profile.baseUrl } : {}),
    ...(profile.temperature !== undefined ? { temperature: profile.temperature } : {}),
  });
}