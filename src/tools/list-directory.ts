import { readdir, stat } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { z } from "zod";
import type { Tool } from "./types";
import { truncateOutput } from "./types";

const inputSchema = z.object({
  path: z.string().optional().describe("Directory to list (relative to cwd, default: cwd)"),
  depth: z.number().int().min(1).max(3).optional().describe("Recursion depth (default: 1)"),
});

/** List files and directories in a directory. */
export const listDirectoryTool: Tool = {
  name: "list_directory",
  description: "List files and directories in a directory. Shows file sizes and types.",
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>, ctx) => {
    const dirPath = resolve(ctx.cwd, input.path ?? ".");
    const maxDepth = input.depth ?? 1;

    async function walk(dir: string, depth: number): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const lines: string[] = [];

      for (const entry of entries) {
        // Skip hidden files and node_modules
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

        const fullPath = join(dir, entry.name);
        const relPath = relative(ctx.cwd, fullPath);

        if (entry.isDirectory()) {
          lines.push(`📁 ${relPath}/`);
          if (depth < maxDepth) {
            const sub = await walk(fullPath, depth + 1);
            lines.push(...sub.map((l) => `  ${l}`));
          }
        } else {
          const s = await stat(fullPath);
          const size = formatSize(s.size);
          lines.push(`📄 ${relPath} (${size})`);
        }
      }

      return lines;
    }

    try {
      const lines = await walk(dirPath, 1);
      const header = `Directory: ${relative(ctx.cwd, dirPath) || "."} (${lines.length} entries)`;
      return {
        success: true,
        output: truncateOutput(`${header}\n${lines.join("\n")}`),
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to list directory: ${(err as Error).message}`,
      };
    }
  },
};

/** Format a byte count into a human-readable size. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}