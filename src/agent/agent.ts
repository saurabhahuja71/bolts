import { streamText, type LanguageModel, type ToolSet } from "ai";
import { createModel } from "./providers";
import { getSystemPrompt } from "./prompts";
import { ToolRegistry } from "../tools";
import type { AgentConfig, AgentEvent, AgentEventCallback, Message, ToolCall } from "../types";
import { AgentError } from "../utils/errors";
import { randomUUID } from "node:crypto";
import { PermissionManager } from "../permissions/manager";

/**
 * The Agent class orchestrates the full agent loop:
 * plan → use tools → observe → repeat.
 */
export class Agent {
  private model: LanguageModel;
  private registry: ToolRegistry;
  private config: AgentConfig;
  private messages: Message[] = [];
  public onEvent?: AgentEventCallback;
  private permissions: PermissionManager;
  private permissionRequester?: (toolName: string, input: unknown) => Promise<boolean>;

  constructor(config: AgentConfig, registry: ToolRegistry, onEvent?: AgentEventCallback) {
    this.config = config;
    this.registry = registry;
    this.onEvent = onEvent;
    this.permissions = new PermissionManager({ mode: config.permissionMode, shellRules: config.shellRules, requester: async (request) => this.permissionRequester ? this.permissionRequester(request.toolName, request.input) : false });
    this.model = createModel(config as never);
  }

  /** Get the current message history. */
  getHistory(): Message[] {
    return this.messages;
  }

  /** Set the message history (e.g., when resuming a session). */
  setHistory(messages: Message[]): void {
    this.messages = messages;
  }

  /** Add a user message to the history. */
  addUserMessage(content: string): Message {
    const message: Message = {
      id: randomUUID(),
      sessionId: this.config.cwd,
      role: "user",
      content,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  /** Emit an event to the callback. */
  private emit(event: AgentEvent): void {
    this.onEvent?.(event);
  }

  /**
   * Run the agent loop for a single user message.
   * Continues until the model stops or max steps is reached.
   */
  async run(userInput: string): Promise<Message> {
    this.addUserMessage(userInput);

    const systemPrompt = getSystemPrompt(this.config.permissionMode, this.config.systemPrompt);

    // Convert tools to AI SDK format
    const tools: ToolSet = {};
    for (const tool of this.registry.list()) {
      tools[tool.name] = {
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (input: unknown) => {
          const toolCall: ToolCall = {
            id: randomUUID(),
            messageId: "",
            name: tool.name,
            input: (input ?? {}) as Record<string, unknown>,
            status: "running",
            createdAt: new Date(),
          };
          this.emit({ type: "tool_start", toolCall });

          const start = Date.now();
          try {
            const result = await this.registry.execute(tool.name, input, {
              cwd: this.config.cwd,
              sessionId: this.config.cwd,
              permissionMode: this.permissions.currentMode,
              requestPermission: async (toolName, permissionInput) => {
                await this.permissions.assertAllowed({ toolName, input: permissionInput, destructive: true });
                return true;
              },
              logger: {
                info: () => {},
                warn: () => {},
                error: () => {},
              },
            });
            toolCall.status = "success";
            toolCall.output = result;
            toolCall.durationMs = Date.now() - start;
            this.emit({ type: "tool_end", toolCall });
            return result;
          } catch (err) {
            toolCall.status = "error";
            toolCall.output = { error: (err as Error).message };
            toolCall.durationMs = Date.now() - start;
            this.emit({ type: "tool_end", toolCall });
            return { error: (err as Error).message };
          }
        },
      };
    }

    // Convert message history to AI SDK format
    const history = this.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullResponse = "";
    const step = 1;
    this.emit({ type: "step", step, maxSteps: this.config.maxSteps });

    try {
      // Let the AI SDK own the multi-step protocol. It preserves native
      // assistant/tool/tool-result messages; manually appending tool output
      // as assistant JSON causes models to print tool results as prose.
      const result = streamText({
        model: this.model,
        system: systemPrompt,
        messages: history as never,
        tools,
        temperature: this.config.temperature,
        maxSteps: this.config.maxSteps,
      });
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        this.emit({ type: "text", content: chunk });
      }
      if (process.env.BOLTS_DIAGNOSTICS === "1") {
        const steps = await result.steps;
        console.error(`[bolts:diagnostic] steps=${JSON.stringify(steps.map((step) => ({
          finishReason: step.finishReason,
          text: step.text,
          toolCalls: step.toolCalls,
          toolResults: step.toolResults,
        })))} `);
      }
    } catch (err) {
      this.emit({ type: "error", error: (err as Error).message });
      throw new AgentError(`Agent loop failed at step ${step}: ${(err as Error).message}`);
    }

    // Create the assistant message
    const assistantMessage: Message = {
      id: randomUUID(),
      sessionId: this.config.cwd,
      role: "assistant",
      content: fullResponse,
      createdAt: new Date(),
    };
    this.messages.push(assistantMessage);
    this.emit({ type: "done", message: assistantMessage });

    return assistantMessage;
  }

  setPermissionMode(mode: AgentConfig["permissionMode"]): void { this.config.permissionMode = mode; this.permissions.setMode(mode); }
  getPermissionMode(): AgentConfig["permissionMode"] { return this.permissions.currentMode; }
  setPermissionRequester(requester: (toolName: string, input: unknown) => Promise<boolean>): void { this.permissionRequester = requester; }
}
