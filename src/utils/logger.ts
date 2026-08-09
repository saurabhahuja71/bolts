import pino from "pino";

/**
 * A clean, structured logger built on pino.
 * In TUI mode, logs are written to a file to avoid corrupting the UI.
 */
export function createLogger(options: { level?: string; file?: string } = {}) {
  const level = options.level ?? process.env.OPENCODE_LOG_LEVEL ?? "info";

  if (options.file) {
    return pino(
      { level, base: undefined },
      pino.destination({ dest: options.file, sync: false }),
    );
  }

  return pino({
    level,
    base: undefined,
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;

/** Shared logger instance for the CLI (non-TUI) path. */
export const logger = createLogger();