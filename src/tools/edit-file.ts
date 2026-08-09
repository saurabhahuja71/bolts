import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { z } from "zod";
import type { Tool } from "./types";
import { ToolError } from "../utils/errors";

const inputSchema = z.object({
  path: z.string().describe("Path to the file to edit (relative to cwd)"),
  search: z.string().describe("Exact text to search for in the file"),
  replace: z.string().describe("Text to replace the search text with"),
  replaceAll: z.boolean().optional().describe("Replace all occurrences (default: false)"),
});

/**
 * Edit a file using search & replace.
 * Requires permission (destructive action).
 */
export const editFileTool: Tool = {
  name: "edit_file",
  description: "Edit a file by searching for exact text and replacing it. Use for targeted edits.",
  inputSchema,
  requiresPermission: true,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const filePath = resolve(ctx.cwd, input.path);

    try {
      const content = await readFile(filePath, "utf-8");

      if (!content.includes(input.search)) {
        throw new ToolError(
          `Search text not found in ${relative(ctx.cwd, filePath)}. ` +
            "The text must match exactly, including whitespace.",
        );
      }

      const occurrences = content.split(input.search).length - 1;
      const newContent = input.replaceAll
        ? content.split(input.search).join(input.replace)
        : content.replace(input.search, input.replace);

      await writeFile(filePath, newContent, "utf-8");

      return {
        success: true,
        output: `Edited ${relative(ctx.cwd, filePath)}: replaced ${occurrences} occurrence(s)`,
      };
    } catch (err) {
      if (err instanceof ToolError) throw err;
      return {
        success: false,
        error: `Failed to edit file: ${(err as Error).message}`,
      };
    }
  },
};