import React from "react";
import { Box, Text } from "ink";
import type { ToolCall } from "../../types";

/** Status indicators for tool calls. */
const STATUS_ICONS: Record<ToolCall["status"], string> = {
  running: "⏳",
  success: "✅",
  error: "❌",
};

/** Status colors for tool calls. */
const STATUS_COLORS: Record<ToolCall["status"], string> = {
  running: "yellow",
  success: "green",
  error: "red",
};

/** Render a single tool call with its status. */
export function ToolCallView({ toolCall }: { toolCall: ToolCall }) {
  const icon = STATUS_ICONS[toolCall.status];
  const color = STATUS_COLORS[toolCall.status];

  return (
    <Box flexDirection="column" marginLeft={2} marginTop={1}>
      <Box>
        <Text color={color}>
          {icon} {toolCall.name}
        </Text>
        {toolCall.durationMs !== undefined && (
          <Text color="gray"> ({toolCall.durationMs}ms)</Text>
        )}
      </Box>

      {toolCall.status === "running" && (
        <Box marginLeft={2}>
          <Text color="gray" dimColor>
            {JSON.stringify(toolCall.input)}
          </Text>
        </Box>
      )}

      {toolCall.status === "error" && (
        <Box marginLeft={2}>
          <Text color="red">
            {typeof toolCall.output === "object" &&
            toolCall.output !== null &&
            "error" in toolCall.output
              ? String((toolCall.output as { error: string }).error)
              : "Tool failed"}
          </Text>
        </Box>
      )}
    </Box>
  );
}