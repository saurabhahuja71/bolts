/**
 * Minimal Ink application that wires the `useAgent` hook to a simple chat UI.
 * This satisfies Phase 5 (Terminal UI) by providing a functional TUI entry point.
 */
import { render, Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { Agent } from "../agent";
import { loadConfig } from "../config";
import { ToolRegistry } from "../tools";
import { registerAllTools } from "../tools";
import { useAgent } from "./hooks/useAgent";
import MessageView from "./components/MessageView";
import InputBox from "./components/InputBox";

// Register all tools (importing the index re‑exports the individual tools)
registerAllTools(new ToolRegistry());

const App: React.FC = () => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const { messages, isRunning, send, interrupt, clear, error } = useAgent(
    // Agent is created once the config is loaded
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    agent!
  );

  // Initialise the agent on first render
  useEffect(() => {
    const cfg = loadConfig();
    const registry = new ToolRegistry();
    registerAllTools(registry);
    const a = new Agent(cfg, registry);
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

  return (
    <Box flexDirection="column" width="100%">
      <MessageView messages={messages} />
      {error && (
        <Box>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      <InputBox
        onSubmit={send}
        onInterrupt={interrupt}
        onClear={clear}
        disabled={isRunning}
      />
    </Box>
  );
};

// Export a helper that can be called from the CLI entry point.
export function startTUI() {
  render(<App />);
}
