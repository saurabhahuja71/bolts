import type { Tool } from "./types";
import { ToolError } from "../utils/errors";
import type { ToolContext } from "../types";

/**
 * Registry for all available tools.
 * Tools are registered by name and can be looked up for execution.
 */
export class ToolRegistry {
  private tools = new Map<string, Tool>();

  /** Register a tool. */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new ToolError(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  /** Register multiple tools at once. */
  registerAll(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** Get a tool by name. */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** Check if a tool exists. */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** List all registered tool names. */
  listNames(): string[] {
    return [...this.tools.keys()];
  }

  /** Get all registered tools. */
  list(): Tool[] {
    return [...this.tools.values()];
  }

  /**
   * Execute a tool by name.
   * Validates input against the tool's Zod schema, then executes.
   */
  async execute(name: string, input: unknown, ctx: ToolContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolError(`Unknown tool: ${name}`);
    }

    // Validate input against the tool's schema
    const parsed = tool.inputSchema.safeParse(input);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new ToolError(`Invalid input for tool '${name}':\n${issues}`);
    }

    // Check permission
    if (tool.requiresPermission && (ctx.permissionMode === "ask" || ctx.permissionMode === "plan")) {
      const allowed = await ctx.requestPermission(name, parsed.data);
      if (!allowed) {
        throw new ToolError(`Permission denied for tool: ${name}`);
      }
    }

    // Execute
    return tool.execute(parsed.data, ctx);
  }

  /** Convert tools to the format expected by the AI SDK. */
  toAISDK() {
    const result: Record<string, unknown> = {};
    for (const tool of this.tools.values()) {
      result[tool.name] = {
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (input: unknown, options: { toolCallId: string }) => {
          const ctx: ToolContext = {
            cwd: process.cwd(),
            sessionId: options.toolCallId,
            permissionMode: "auto",
            requestPermission: async () => true,
            logger: {
              info: () => {},
              warn: () => {},
              error: () => {},
            },
          };
          return tool.execute(input as never, ctx);
        },
      };
    }
    return result;
  }
}
