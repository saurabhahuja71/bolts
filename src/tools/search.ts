import { spawn } from "node:child_process";
import { resolve, relative } from "node:path";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";

const inputSchema = z.object({
  pattern: z.string().describe("Search pattern (regex or plain text)"),
  path: z.string().optional().describe("Directory to search (relative to cwd, default: cwd)"),
  filePattern: z.string().optional().describe("File glob pattern to filter (e.g. '*.ts')"),
  maxResults: z.number().int().min(1).max(100).optional().describe("Max results (default: 20)"),
});

/**
 * Search the codebase for a pattern.
 * Uses ripgrep if available, falls back to grep.
 */
export const searchCodebaseTool: Tool = {
  name: "search_codebase",
  description: "Search the codebase for a text pattern. Returns matching lines with file and line numbers.",
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const searchPath = resolve(ctx.cwd, input.path ?? ".");
    const maxResults = input.maxResults ?? 20;

    return new Promise((resolvePromise) => {
      const args = [
        "--line-number",
        "--no-heading",
        "--max-count", String(maxResults),
        "--hidden",
        "--glob", "!node_modules/**",
        "--glob", "!.git/**",
        "--glob", "!dist/**",
        "--glob", "!build/**",
      ];

      if (input.filePattern) {
        args.push("--glob", input.filePattern);
      }

      args.push(input.pattern, searchPath);

      const child = spawn("rg", args, { env: { ...process.env, FORCE_COLOR: "0" } });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        // rg exits with 1 when no matches found
        if (code === 1) {
          resolvePromise({
            success: true,
            output: `No matches found for '${input.pattern}'`,
          });
          return;
        }

        if (code !== 0) {
          // Try fallback to grep
          runGrepFallback(input, searchPath, maxResults, resolvePromise);
          return;
        }

        const lines = stdout.trim().split("\n").slice(0, maxResults);
        const header = `Found ${lines.length} match(es) for '${input.pattern}' in ${relative(ctx.cwd, searchPath)}:`;
        resolvePromise({
          success: true,
          output: truncateOutput(`${header}\n${lines.join("\n")}`),
        });
      });

      child.on("error", () => {
        // rg not found, fallback to grep
        runGrepFallback(input, searchPath, maxResults, resolvePromise);
      });
    });
  },
};

/** Fallback to grep when ripgrep is not available. */
function runGrepFallback(
  input: { pattern: string; filePattern?: string },
  searchPath: string,
  maxResults: number,
  resolvePromise: (value: unknown) => void,
) {
  const args = [
    "-rn",
    "--include", input.filePattern ?? "*",
    "--exclude-dir", "node_modules",
    "--exclude-dir", ".git",
    "--exclude-dir", "dist",
    "--exclude-dir", "build",
    "-m", String(maxResults),
    input.pattern,
    searchPath,
  ];

  const child = spawn("grep", args, { env: { ...process.env, FORCE_COLOR: "0" } });

  let stdout = "";
  let stderr = "";

  child.stdout?.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("close", (code) => {
    if (code === 1) {
      resolvePromise({
        success: true,
        output: `No matches found for '${input.pattern}'`,
      });
      return;
    }

    if (code !== 0) {
      resolvePromise({
        success: false,
        error: `Search failed: ${stderr || "unknown error"}`,
      });
      return;
    }

    const lines = stdout.trim().split("\n").slice(0, maxResults);
    resolvePromise({
      success: true,
      output: truncateOutput(lines.join("\n")),
    });
  });

  child.on("error", (err) => {
    resolvePromise({
      success: false,
      error: `Search failed: ${err.message}`,
    });
  });
}