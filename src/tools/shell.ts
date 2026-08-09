import { spawn } from "node:child_process";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";

const inputSchema = z.object({
  command: z.string().describe("Shell command to run"),
  timeout: z.number().int().min(1).max(120_000).optional().describe("Timeout in ms (default: 30000)"),
  cwd: z.string().optional().describe("Working directory (default: project root)"),
});

/**
 * Run a shell command with timeout and output capture.
 * Requires permission (can be destructive).
 */
export const shellTool: Tool = {
  name: "run_shell_command",
  description: "Run a shell command and capture its output. Use for tests, builds, and git operations.",
  inputSchema,
  requiresPermission: true,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const timeoutMs = input.timeout ?? 30_000;

    return new Promise((resolve) => {
      const child = spawn(input.command, {
        shell: true,
        cwd: input.cwd ? resolvePath(ctx.cwd, input.cwd) : ctx.cwd,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timer);

        if (timedOut) {
          resolve({
            success: false,
            error: `Command timed out after ${timeoutMs}ms`,
            output: truncateOutput(stdout),
          });
          return;
        }

        const output = stdout + (stderr ? `\n[stderr]\n${stderr}` : "");
        resolve({
          success: code === 0,
          output: truncateOutput(output || "(no output)"),
          error: code !== 0 ? `Exit code: ${code}` : undefined,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          error: `Failed to run command: ${err.message}`,
        });
      });
    });
  },
};

/** Resolve a path relative to the project root. */
function resolvePath(cwd: string, p: string): string {
  if (p.startsWith("/")) return p;
  return `${cwd}/${p}`;
}