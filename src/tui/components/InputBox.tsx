import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";

interface InputBoxProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onShortcut?: (shortcut: string) => void;
  onInterrupt?: () => void;
}

/**
 * Multi-line input box with history navigation (up/down arrows).
 * Enter submits, Shift+Enter adds a newline.
 */
export function InputBox({ onSubmit, disabled, placeholder, onShortcut, onInterrupt }: InputBoxProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistoryIndex] = useState(-1);
  const inputRef = useRef("");

  // Keep a ref so useInput can read the latest value
  inputRef.current = value;

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === "c") { onInterrupt?.(); return; }
    if (key.ctrl && key.shift && input) {
      const shortcut = input.toLowerCase();
      if (["p", "m", "t", "i"].includes(shortcut)) { onShortcut?.(shortcut); return; }
    }
    if (disabled) return;

    // Submit on Enter (without shift)
    if (key.return && !key.shift) {
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
        setHistory((prev) => [trimmed, ...prev]);
        setHistoryIndex(-1);
        setValue("");
      }
      return;
    }

    // Newline on Shift+Enter
    if (key.return && key.shift) {
      setValue((prev) => prev + "\n");
      return;
    }

    // History navigation
    if (key.upArrow) {
      setHistoryIndex((prev) => {
        const next = prev + 1;
        if (next >= history.length) return prev;
        setValue(history[next] ?? "");
        return next;
      });
      return;
    }

    if (key.downArrow) {
      setHistoryIndex((prev) => {
        const next = prev - 1;
        if (next < -1) return prev;
        setValue(next === -1 ? "" : history[next] ?? "");
        return next;
      });
      return;
    }

    // Backspace
    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    // Regular character input
    if (input) {
      setValue((prev) => prev + input);
    }
  });

  // Reset input when disabled state changes (e.g., after submit)
  useEffect(() => {
    if (!disabled && value === "") {
      // no-op
    }
  }, [disabled, value]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>
          ❯{" "}
        </Text>
        <Text>{value}</Text>
        <Text color="gray" dimColor>
          ▍
        </Text>
      </Box>
      <Box>
        <Text color="gray" dimColor>
          {placeholder ?? "Type a message. Enter to send, Shift+Enter for newline, ↑/↓ for history."}
        </Text>
      </Box>
    </Box>
  );
}
