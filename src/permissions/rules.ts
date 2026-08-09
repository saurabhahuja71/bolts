import type { ShellRules } from "../types";

/**
 * Match a command against a simple shell-rule pattern.
 * Supported forms:
 * - exact text: `bun test`
 * - prefix wildcard: `git *`
 * - suffix wildcard: `* --help`
 * - contains wildcard: `*rm -rf*`
 * - regex: `/^bun (test|run typecheck)$/`
 */
export function matchesRule(command: string, pattern: string): boolean {
  if (pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2) {
    return new RegExp(pattern.slice(1, -1)).test(command);
  }

  if (!pattern.includes("*")) return command.trim() === pattern.trim();

  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`).test(command.trim());
}

export function isDeniedCommand(command: string, rules?: ShellRules): boolean {
  return rules?.deny?.some((pattern) => matchesRule(command, pattern)) ?? false;
}

export function isAllowedCommand(command: string, rules?: ShellRules): boolean {
  if (!rules?.allow?.length) return true;
  return rules.allow.some((pattern) => matchesRule(command, pattern));
}