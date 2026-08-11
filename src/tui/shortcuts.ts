/**
 * Resolve shortcuts in a way that works with terminals that do not preserve
 * Shift when it is combined with Ctrl. Ink exposes those combinations as the
 * ordinary control character in many terminals.
 */
export type InputKey = {
  ctrl?: boolean;
  shift?: boolean;
  tab?: boolean;
  meta?: boolean;
};

export function resolveShortcut(input: string, key: InputKey): string | undefined {
  const value = input.toLowerCase();

  // Alt-based bindings avoid Ctrl+P/Ctrl+I being intercepted by VS Code or
  // interpreted by the terminal before Ink receives the keystroke.
  if (key.meta && ["p", "m", "t", "i"].includes(value)) return value;
  if (key.meta && value === "q") return "q";

  // Keep the requested Ctrl+Shift bindings when the terminal reports them.
  if (key.ctrl && key.shift && ["p", "m", "t", "i"].includes(value)) return value;

  // Terminal-safe fallbacks. Ctrl+Shift+M is commonly indistinguishable from
  // Enter, so Ctrl+O is the mode toggle fallback.
  if (key.ctrl && value === "p") return "p";
  if (key.ctrl && value === "o") return "m";
  if (key.ctrl && value === "t") return "t";

  // Ctrl+I is commonly parsed by terminals as the Tab key.
  if (key.tab && input === "\t") return "i";
  if (key.ctrl && value === "i") return "i";

  // Some terminal keyboard protocols encode Ctrl+Shift+M as Ctrl+M.
  if (key.ctrl && value === "m") return "m";

  if (key.ctrl && value === "q") return "q";

  return undefined;
}
