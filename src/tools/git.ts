import { spawn } from "node:child_process";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";

/** Run a git command and capture output. */
function runGit(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("git", args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });

    child.on("error", (err) => {
      resolve({ code: 1, stdout: "", stderr: err.message });
    });
  });
}

const statusSchema = z.object({});

/** Show git status. */
export const gitStatusTool: Tool = {
  name: "git_status",
  description: "Show the current git status (modified, staged, untracked files).",
  inputSchema: statusSchema,
  execute: async (_input: z.infer<typeof statusSchema>, ctx) => {
    const { code, stdout, stderr } = await runGit(["status", "--short"], ctx.cwd);
    if (code !== 0) {
      return { success: false, error: stderr || "git status failed" };
    }
    return {
      success: true,
      output: truncateOutput(stdout || "(clean working tree)"),
    };
  },
};

const diffSchema = z.object({
  staged: z.boolean().optional().describe("Show staged changes (default: false)"),
});

/** Show git diff. */
export const gitDiffTool: Tool = {
  name: "git_diff",
  description: "Show the diff of changes in the working tree.",
  inputSchema: diffSchema,
  execute: async (input: z.infer<typeof diffSchema>, ctx) => {
    const args = ["diff"];
    if (input.staged) args.push("--cached");
    const { code, stdout, stderr } = await runGit(args, ctx.cwd);
    if (code !== 0) {
      return { success: false, error: stderr || "git diff failed" };
    }
    return {
      success: true,
      output: truncateOutput(stdout || "(no changes)"),
    };
  },
};

const commitSchema = z.object({
  message: z.string().describe("Commit message"),
});

/** Create a git commit. */
export const gitCommitTool: Tool = {
  name: "git_commit",
  description: "Create a git commit with the given message. Stages all changes first.",
  inputSchema: commitSchema,
  requiresPermission: true,
  execute: async (input: z.infer<typeof commitSchema>, ctx) => {
    // Stage all changes
    const addResult = await runGit(["add", "-A"], ctx.cwd);
    if (addResult.code !== 0) {
      return { success: false, error: addResult.stderr || "git add failed" };
    }

    // Commit
    const commitResult = await runGit(["commit", "-m", input.message], ctx.cwd);
    if (commitResult.code !== 0) {
      return { success: false, error: commitResult.stderr || "git commit failed" };
    }

    return {
      success: true,
      output: truncateOutput(commitResult.stdout),
    };
  },
};