import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";

const inputSchema = z.object({
  host: z.string().min(1).describe("SSH config alias, for example podman8 or podman9"),
  command: z.string().min(1).describe("Literal command to execute remotely"),
  timeout: z.number().int().min(1).max(120_000).optional(),
});

/** Execute remote work through the user's SSH config, never through local shell. */
export const sshExecuteTool: Tool = {
  name: "ssh_execute",
  description: "Execute a literal command on a remote SSH config alias and return raw stdout/stderr. Use for all remote work.",
  inputSchema,
  requiresPermission: true,
  execute: async (input: z.infer<typeof inputSchema>) => new Promise((resolve) => {
    const timeoutMs = input.timeout ?? 30_000;
    const sshConfig = process.env.SSH_CONFIG_PATH ?? `${process.env.HOME ?? ""}/.ssh/config`;
    const configArgs = sshConfig && existsSync(sshConfig) ? ["-F", sshConfig] : [];
    const child = spawn("ssh", ["-T", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", ...configArgs, input.host, input.command], { env: { ...process.env, FORCE_COLOR: "0" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      const output = stdout + (stderr ? `\n[stderr]\n${stderr}` : "");
      resolve({ success: !timedOut && code === 0, output: truncateOutput(output || "(no output)"), error: timedOut ? `Command timed out after ${timeoutMs}ms` : code !== 0 ? `SSH exit code: ${code}` : undefined });
    });
    child.on("error", (err) => { clearTimeout(timer); resolve({ success: false, output: "", error: `Failed to execute ssh: ${err.message}` }); });
  }),
};
