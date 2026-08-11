/**
 * Minimal Ink application that wires the `useAgent` hook to a simple chat UI.
 * This satisfies Phase 5 (Terminal UI) by providing a functional TUI entry point.
 */
import { render, Box, Text } from "ink";
import React, { useEffect, useRef, useState } from "react";
import { useInput } from "ink";
import { Agent } from "../agent";
import { loadConfig } from "../config";
import { createDefaultRegistry } from "../tools";
import { useAgent } from "./hooks/useAgent";
import { MessageView } from "./components/MessageView";
import { InputBox } from "./components/InputBox";
import { todoStore } from "../todos/store";
import type { PermissionMode } from "../types";

function TodoPanel() {
  const todos = todoStore.items();
  return <Box flexDirection="column" width={38} marginLeft={2} borderStyle="round" borderColor="gray" paddingX={1}>
    <Text bold>Todos ({todoStore.openCount()} open)</Text>
    {todos.length === 0 ? <Text dimColor>(none)</Text> : todos.map((todo) => <Text key={todo.id} dimColor={todo.completed}>{todo.completed ? "[x]" : "[ ]"} {todo.id}. {todo.description}</Text>)}
  </Box>;
}

const App: React.FC = () => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const { messages, isRunning, send, interrupt, clear, error, todoVersion } = useAgent(
    // Agent is created once the config is loaded
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    agent!
  );
  const [mode, setMode] = useState<PermissionMode>("ask");
  const [todosVisible, setTodosVisible] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [permissionPrompt, setPermissionPrompt] = useState<{ tool: string; input: unknown } | null>(null);
  const [notice, setNotice] = useState("");
  const permissionResolver = useRef<((allowed: boolean) => void) | null>(null);

  // Initialise the agent on first render
  useEffect(() => {
    const cfg = loadConfig();
    const registry = createDefaultRegistry();
    const a = new Agent(cfg, registry);
    setMode(cfg.permissionMode);
    a.setPermissionRequester((tool, input) => new Promise<boolean>((resolve) => { permissionResolver.current = resolve; setPermissionPrompt({ tool, input }); }));
    setAgent(a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard against the brief moment before the agent is ready
  if (!agent) {
    return (
      <Box>
        <Text>Initializing…</Text>
      </Box>
    );
  }

  void todoVersion;
  const showCommands = () => setNotice("Commands: /help /model /mode ask|allow|plan /todo /queue /permissions /theme dark|light /mouse interactive|select /new /quit");
  const setPermissionMode = (next: PermissionMode) => { agent.setPermissionMode(next); setMode(next); };
  const cycleMode = () => { const modes: PermissionMode[] = ["ask", "allow", "plan"]; setPermissionMode(modes[(modes.indexOf(mode) + 1) % modes.length] ?? "ask"); };
  const submit = (input: string) => {
    const command = input.trim();
    if (command === "/help") { showCommands(); return; }
    if (command.startsWith("/mode ")) { const next = command.slice(6).trim() as PermissionMode; if (["ask", "allow", "plan"].includes(next)) setPermissionMode(next); return; }
    if (command === "/todo") { setTodosVisible((visible) => !visible); return; }
    if (command === "/model") { setNotice("Active model is configured by model/baseUrl settings."); return; }
    if (command === "/permissions") { setNotice("Permissions: use ASK for approval prompts, ALLOW to permit tools, or PLAN to block destructive tools."); return; }
    if (command === "/queue") { setNotice("No queued prompts."); return; }
    if (command === "/new") { clear(); setNotice("Started a new conversation."); return; }
    if (command === "/quit") { process.exit(0); }
    if (command === "/theme light" || command === "/theme dark") { setNotice(`Theme selected: ${command.slice(7)}`); return; }
    if (command === "/mouse interactive" || command === "/mouse select") { setInteractive(command.endsWith("interactive")); return; }
    void send(command);
  };
  const shortcut = (key: string) => {
    if (key === "p") showCommands();
    else if (key === "m") cycleMode();
    else if (key === "t") setTodosVisible((visible) => !visible);
    else if (key === "i") setInteractive((value) => !value);
  };
  useInput((input, key) => {
    if (!permissionPrompt) return;
    if (input.toLowerCase() === "y" || key.return) { permissionResolver.current?.(true); permissionResolver.current = null; setPermissionPrompt(null); }
    else if (input.toLowerCase() === "n" || key.escape) { permissionResolver.current?.(false); permissionResolver.current = null; setPermissionPrompt(null); }
  });

  return (
    <Box flexDirection="column" width="100%">
      <Box>
        <Box flexDirection="column" flexGrow={1}>
          {messages.map((m) => <MessageView key={m.id} message={m} />)}
          {notice && <Text color="magenta">{notice}</Text>}
          {error && <Text color="red">Error: {error}</Text>}
        </Box>
        {todosVisible && <TodoPanel />}
      </Box>
      <Text dimColor>Boltpy | Mode: {mode.toUpperCase()} | Cursor: {interactive ? "INTERACTIVE" : "SELECT"} {isRunning ? "| Processing…" : "| Ready"}</Text>
      {permissionPrompt && <Text color="yellow">Permission required for {permissionPrompt.tool}: {JSON.stringify(permissionPrompt.input)} — press Y to allow or N to deny</Text>}
      <InputBox onSubmit={submit} onShortcut={shortcut} onInterrupt={interrupt} disabled={Boolean(permissionPrompt)} placeholder="Enter send · Ctrl+Shift+P commands · Ctrl+Shift+M mode · Ctrl+Shift+T todos · Ctrl+Shift+I cursor · Ctrl+C cancel" />
    </Box>
  );
};

// Export a helper that can be called from the CLI entry point.
export function startTUI() {
  render(<App />);
}
