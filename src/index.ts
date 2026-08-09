#!/usr/bin/env bun
/**
 * opencode-ai — CLI entry point.
 * An open-source AI coding agent written in TypeScript + Bun.
 */
import { Command } from "commander";
import { loadConfig } from "./config";
import { logger } from "./utils/logger";
import { formatError } from "./utils/errors";

const program = new Command();

program
  .name("opencode")
  .description("An open-source AI coding agent for the terminal")
  .version("0.1.0");

program
  .option("-c, --config <path>", "path to config file")
  .option("-m, --model <model>", "model to use")
  .option("-p, --provider <provider>", "provider to use")
  .option("--permission <mode>", "permission mode: auto, ask, plan")
  .option("-d, --debug", "enable debug logging");

program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-s, --session <id>", "resume a session by ID")
  .action(async (opts) => {
    try {
      const permissionMode =
        opts.permission === "auto" || opts.permission === "ask" || opts.permission === "plan"
          ? opts.permission
          : undefined;

      const config = loadConfig({
        configPath: opts.config,
        cliOverrides: {
          ...(opts.model ? { model: opts.model } : {}),
          ...(opts.provider ? { provider: opts.provider } : {}),
          ...(permissionMode ? { permissionMode } : {}),
        },
      });

      if (opts.debug) {
        logger.level = "debug";
      }

      logger.info(`Starting chat with ${config.provider}/${config.model}`);
      logger.info(`Working directory: ${config.cwd}`);

      // Launch the TUI (Phase 5)
      // Import locally to avoid circular dependencies during type‑checking.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { startTUI } = require("./tui/app");
      startTUI();
    } catch (err) {
      console.error(`Error: ${formatError(err)}`);
      process.exit(1);
    }
  });

program
  .command("sessions")
  .description("List all sessions")
  .action(async () => {
    // TODO: Implement session listing (Phase 6)
    console.log("Session management coming soon!");
  });

program
  .command("config")
  .description("Show current configuration")
  .action(async () => {
    try {
      const config = loadConfig();
      console.log(JSON.stringify(config, null, 2));
    } catch (err) {
      console.error(`Error: ${formatError(err)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no command given, default to chat
if (!process.argv.slice(2).length) {
  const [bin, script] = process.argv;
  program.parse([bin ?? "bun", script ?? "opencode", "chat"]);
}
