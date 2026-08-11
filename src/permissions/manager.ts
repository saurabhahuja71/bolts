import type { PermissionMode, ShellRules } from "../types";
import { PermissionError } from "../utils/errors";
import { isAllowedCommand, isDeniedCommand } from "./rules";

export interface PermissionRequest {
  toolName: string;
  input: unknown;
  description?: string;
  preview?: string;
}

export type PermissionRequester = (request: PermissionRequest) => Promise<boolean>;

export interface PermissionManagerOptions {
  mode: PermissionMode;
  shellRules?: ShellRules;
  requester?: PermissionRequester;
}

/** Central policy engine for destructive tools and shell command rules. */
export class PermissionManager {
  private mode: PermissionMode;
  private readonly shellRules?: ShellRules;
  private readonly requester?: PermissionRequester;

  constructor(options: PermissionManagerOptions) {
    this.mode = options.mode;
    this.shellRules = options.shellRules;
    this.requester = options.requester;
  }

  get currentMode(): PermissionMode { return this.mode; }
  setMode(mode: PermissionMode): void { this.mode = mode; }

  async assertAllowed(request: PermissionRequest & { destructive?: boolean }): Promise<void> {
    if (request.toolName === "run_shell_command") {
      this.assertShellCommandAllowed(String((request.input as { command?: unknown }).command ?? ""));
    }

    if (!request.destructive) return;

    if (this.mode === "plan") {
      throw new PermissionError(
        `Permission mode is 'plan'; refusing to execute destructive tool '${request.toolName}'.`,
      );
    }

    if (this.mode === "auto" || this.mode === "allow") return;

    const allowed = await (this.requester?.(request) ?? Promise.resolve(false));
    if (!allowed) throw new PermissionError(`Permission denied for tool '${request.toolName}'.`);
  }

  private assertShellCommandAllowed(command: string): void {
    if (isDeniedCommand(command, this.shellRules)) {
      throw new PermissionError(`Shell command denied by configuration: ${command}`);
    }

    if (this.mode === "auto" && !isAllowedCommand(command, this.shellRules)) {
      throw new PermissionError(
        `Shell command is not in the allowlist and permission mode is 'auto': ${command}`,
      );
    }
  }
}
