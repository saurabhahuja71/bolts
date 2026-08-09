import React from "react";
import { Box, Text } from "ink";
import type { UIMessage } from "../hooks/useAgent";
import { ToolCallView } from "./ToolCallView";

/** Colors for each message role. */
const ROLE_COLORS: Record<UIMessage["role"], string> = {
  user: "cyan",
  assistant: "green",
  tool: "yellow",
  system: "magenta",
};

/** Labels for each message role. */
const ROLE_LABELS: Record<UIMessage["role"], string> = {
  user: "You",
  assistant: "Assistant",
  tool: "Tool",
  system: "System",
};

/** Render a single message in the chat. */
export function MessageView({ message }: { message: UIMessage }) {
  const color = ROLE_COLORS[message.role];
  const label = ROLE_LABELS[message.role];

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={color} bold>
          {label}
        </Text>
        {message.streaming && <Text color="gray"> (streaming…)</Text>}
      </Box>

      {message.content && (
        <Box marginLeft={2}>
          <Text>{message.content}</Text>
        </Box>
      )}

      {message.toolCalls?.map((tc) => (
        <ToolCallView key={tc.id} toolCall={tc} />
      ))}
    </Box>
  );
}