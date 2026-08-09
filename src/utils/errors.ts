/**
 * Custom error types for opencode-ai.
 */

/** Base error class for all opencode-ai errors. */
export class OpenCodeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "OpenCodeError";
  }
}

/** Configuration-related errors (invalid config, missing API key, etc.). */
export class ConfigError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIG_ERROR", details);
    this.name = "ConfigError";
  }
}

/** Provider-related errors (API failures, rate limits, etc.). */
export class ProviderError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "PROVIDER_ERROR", details);
    this.name = "ProviderError";
  }
}

/** Tool execution errors. */
export class ToolError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "TOOL_ERROR", details);
    this.name = "ToolError";
  }
}

/** Permission errors (user denied a tool call). */
export class PermissionError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "PERMISSION_ERROR", details);
    this.name = "PermissionError";
  }
}

/** Session/database errors. */
export class SessionError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "SESSION_ERROR", details);
    this.name = "SessionError";
  }
}

/** Agent loop errors (max steps reached, etc.). */
export class AgentError extends OpenCodeError {
  constructor(message: string, details?: unknown) {
    super(message, "AGENT_ERROR", details);
    this.name = "AgentError";
  }
}

/** Format an unknown error into a readable string. */
export function formatError(err: unknown): string {
  if (err instanceof OpenCodeError) {
    return `${err.name} [${err.code}]: ${err.message}`;
  }
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}