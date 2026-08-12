import { ToolRegistry } from "./registry";
import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { editFileTool } from "./edit-file";
import { listDirectoryTool } from "./list-directory";
import { shellTool } from "./shell";
import { searchCodebaseTool } from "./search";
import { gitStatusTool, gitDiffTool, gitCommitTool } from "./git";
import { todoTools } from "./todos";
import { sshExecuteTool } from "./ssh-execute";

export { ToolRegistry } from "./registry";
export type { Tool, ToolResult } from "./types";
export { truncateOutput, formatToolResult, MAX_TOOL_OUTPUT } from "./types";

/** Create a registry with all default tools registered. */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.registerAll([
    readFileTool,
    writeFileTool,
    editFileTool,
    listDirectoryTool,
    shellTool,
    sshExecuteTool,
    searchCodebaseTool,
    gitStatusTool,
    gitDiffTool,
    gitCommitTool,
    ...todoTools,
  ]);
  return registry;
}
