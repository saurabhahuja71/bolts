import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";
import { ToolError } from "../utils/errors";

const inputSchema = z.object({
  path: z.string().describe("Path to the file to read (relative to cwd)"),
  startLine: z.number().int().min(1).optional().describe("Line to start reading from (1-based)"),
  endLine: z.number().int().min(1).optional().describe("Line to stop reading at (inclusive)"),
});

/**
 * Read a file's contents.
 * Supports optional line ranges and truncates large files.
 */
export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file. Supports line ranges and truncates large files.",
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const filePath = resolve(ctx.cwd, input.path);

    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");

      const start = input.startLine ?? 1;
      const end = input.endLine ?? lines.length;

      if (start < 1 || end < start || end > lines.length) {
        throw new ToolError(
          `Invalid line range: ${start}-${end}. File has ${lines.length} lines.`,
        );
      }

      const selected = lines.slice(start - 1, end);
      const numbered = selected.map((line, i) => `${start + i} | ${line}`).join("\n");
      const header = `File: ${relative(ctx.cwd, filePath)} (${lines.length} lines)`;

      return {
        success: true,
        output: truncateOutput(`${header}\n${numbered}`),
      };
    } catch (err) {
      if (err instanceof ToolError) throw err;
      return {
        success: false,
        error: `Failed to read file: ${(err as Error).message}`,
      };
    }
  },
};