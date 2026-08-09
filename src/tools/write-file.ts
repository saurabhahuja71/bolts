import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { z } from "zod";
import type { Tool } from "./types";

const inputSchema = z.object({
  path: z.string().describe("Path to the file to write (relative to cwd)"),
  content: z.string().describe("Full content to write to the file"),
});

/**
 * Write content to a file.
 * Creates parent directories as needed.
 * Requires permission (destructive action).
 */
export const writeFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file. Creates parent directories as needed. Overwrites existing files.",
  inputSchema,
  requiresPermission: true,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const filePath = resolve(ctx.cwd, input.path);

    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, input.content, "utf-8");

      return {
        success: true,
        output: `Wrote ${input.content.length} characters to ${relative(ctx.cwd, filePath)}`,
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to write file: ${(err as Error).message}`,
      };
    }
  },
};