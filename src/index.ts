#!/usr/bin/env bun
/**
 * opencode-ai — CLI entry point.
 * An open-source AI coding agent written in TypeScript + Bun.
 */
import { Command } from "commander";
import { loadConfig } from "./config";
import { logger } from "./utils/logger";
import { formatError } from "./utils/errors";
import { Agent } from "./agent";
import { createDefaultRegistry } from "./tools";
import type { AgentEvent } from "./types";

const program = new Command();

program
  .name("opencode")
  .description("An open-source AI coding agent for the terminal")
  .version("0.1.0");

program
  .option("-c, --config <path>", "path to config file")
  .option("-m, --model <model>", "model to use")
  .option("-p, --provider <provider>", "provider to use")
  .option("--permission <mode>", "permission mode: auto, ask, allow, plan")
  .option("-d, --debug", "enable debug logging");

program
  .command("chat")
  .description("Start an interactive chat session")
  .option("-s, --session <id>", "resume a session by ID")
  .action(async (opts) => {
    try {
      const permissionMode =
        opts.permission === "auto" || opts.permission === "ask" || opts.permission === "allow" || opts.permission === "plan"
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
      const { startTUI } = await import("./tui/app");
      startTUI();
    } catch (err) {
      console.error(`Error: ${formatError(err)}`);
      process.exit(1);
    }
  });

program
  .command("exec <prompt>")
  .description("Run one task headlessly with tools enabled")
  .option("-d, --debug", "print tool calls and results to stderr")
  .action(async (prompt, opts, command) => {
    try {
      const root = command.parent?.opts() ?? program.opts();
      const permission = ["auto", "ask", "allow", "plan"].includes(root.permission) ? root.permission : undefined;
      const config = loadConfig({
        cliOverrides: {
          ...(root.model ? { model: root.model } : {}),
          ...(root.provider ? { provider: root.provider } : {}),
          ...(permission ? { permissionMode: permission } : {}),
        },
      });
      const agent = new Agent(config, createDefaultRegistry(), (event: AgentEvent) => {
        const showTools = opts.debug || process.env.BOLTS_RAW_TOOL_OUTPUT !== "0";
        if (!showTools) return;
        if (event.type === "tool_start") console.error(`[tool:start] ${event.toolCall.name} ${JSON.stringify(event.toolCall.input)}`);
        if (event.type === "tool_end") {
          console.error(`[tool:end] ${event.toolCall.name} ${event.toolCall.status}`);
          const output = event.toolCall.output;
          if (typeof output === "string") console.log(output);
          else if (output !== undefined) console.log(JSON.stringify(output));
        }
        if (event.type === "error") console.error(`[agent:error] ${event.error}`);
      });
      await agent.run(prompt);
    } catch (err) {
      console.error(`Error: ${formatError(err)}`);
      process.exitCode = 1;
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

// Treat a bare prompt as a headless task, matching the dedicated launcher
// behavior and avoiding Commander interpreting the prompt as an unknown command.
const argv = [...process.argv];
if (argv.length > 2 && !["chat", "exec", "sessions", "config"].includes(argv[2] ?? "") && !argv[2]?.startsWith("-")) {
  argv.splice(2, 0, "exec");
}

// If no command is given, default to chat.
if (argv.length <= 2) argv.push("chat");
program.parse(argv);
