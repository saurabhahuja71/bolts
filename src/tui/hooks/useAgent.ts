import { useCallback, useRef, useState } from "react";
import { Agent } from "../../agent";
import type { AgentEvent, Message, ToolCall } from "../../types";

/** A message displayed in the TUI, with optional streaming state. */
export interface UIMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  streaming?: boolean;
  toolCalls?: ToolCall[];
  createdAt: Date;
}

/** State exposed by the useAgent hook. */
export interface UseAgentState {
  messages: UIMessage[];
  isRunning: boolean;
  currentStep: number;
  maxSteps: number;
  error?: string;
  send: (input: string) => Promise<void>;
  interrupt: () => void;
  clear: () => void;
}

/**
 * React hook that bridges the Agent class to the TUI.
 * Maintains UI message state and streams agent events into it.
 */
export function useAgent(agent: Agent): UseAgentState {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  // Track the assistant message currently being streamed
  const streamingRef = useRef<UIMessage | null>(null);
  const interruptRef = useRef(false);

  const send = useCallback(
    async (input: string) => {
      if (!input.trim() || isRunning) return;

      interruptRef.current = false;
      setIsRunning(true);
      setError(undefined);

      // Add the user message
      const userMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Reset streaming assistant message
      streamingRef.current = null;

      // Wire up the event callback
      agent.onEvent = (event: AgentEvent) => {
        switch (event.type) {
          case "text": {
            if (!streamingRef.current) {
              streamingRef.current = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
                streaming: true,
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, streamingRef.current!]);
            }
            streamingRef.current.content += event.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingRef.current!.id
                  ? { ...m, content: streamingRef.current!.content }
                  : m,
              ),
            );
            break;
          }
          case "tool_start": {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "tool",
                content: "",
                toolCalls: [event.toolCall],
                createdAt: new Date(),
              },
            ]);
            break;
          }
          case "tool_end": {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.toolCalls?.some((tc) => tc.id === event.toolCall.id)) {
                  return {
                    ...m,
                    toolCalls: m.toolCalls.map((tc) =>
                      tc.id === event.toolCall.id ? event.toolCall : tc,
                    ),
                  };
                }
                return m;
              }),
            );
            break;
          }
          case "step": {
            setCurrentStep(event.step);
            setMaxSteps(event.maxSteps);
            break;
          }
          case "error": {
            setError(event.error);
            break;
          }
          case "done": {
            if (streamingRef.current) {
              streamingRef.current.streaming = false;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingRef.current!.id
                    ? { ...m, streaming: false }
                    : m,
                ),
              );
            }
            break;
          }
        }
      };

      try {
        await agent.run(input);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsRunning(false);
        setCurrentStep(0);
        setMaxSteps(0);
      }
    },
    [agent, isRunning],
  );

  const interrupt = useCallback(() => {
    interruptRef.current = true;
    setIsRunning(false);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(undefined);
  }, []);

  return { messages, isRunning, currentStep, maxSteps, error, send, interrupt, clear };
}