# opencode-ai — Architecture

An open-source AI coding agent written in **TypeScript + Bun**, terminal-first with a modern TUI.

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Terminal (TUI)                            │
│                     Ink (React for CLI)                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│   │  Chat View   │  │  Input Box   │  │  Tool Call Status Panel  │  │
│   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└──────────┼─────────────────┼───────────────────────┼────────────────┘
           │                 │                       │
           ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Agent Core                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Agent Loop (plan→tool→observe→repeat)      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │ Provider │  │ Message  │  │ Tool     │  │ Permission   │  │  │
│  │  │ Factory  │  │ History  │  │ Registry │  │ Manager      │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────────────┬──────────────────────┘
                │                              │
                ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│      Tool System         │   │         Persistence (SQLite)         │
│  read/write/edit file    │   │  ┌────────┐ ┌────────┐ ┌──────────┐  │
│  shell / search / git    │   │  │Session │ │Message │ │ToolCall  │  │
│  (Zod schemas, perms)    │   │  └────────┘ └────────┘ └──────────┘  │
└──────────────────────────┘   └──────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        LLM Providers                                │
│  OpenAI │ Anthropic │ Google │ OpenRouter │ Ollama (local)          │
│              (Vercel AI SDK — model-agnostic)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Recommended Folder Structure

```
opencode-ai/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── docs/
│   ├── configuration.md
│   ├── tools.md
│   └── contributing.md
├── src/
│   ├── index.ts                 # CLI entry point (bin)
│   ├── config/
│   │   ├── schema.ts            # Zod config schema
│   │   ├── loader.ts            # JSON + env + CLI flag merging
│   │   └── index.ts
│   ├── agent/
│   │   ├── agent.ts             # Agent class with run()
│   │   ├── loop.ts              # Core agent loop
│   │   ├── prompts.ts           # System prompts / personas
│   │   └── providers/
│   │       ├── factory.ts       # Provider factory
│   │       └── index.ts
│   ├── tools/
│   │   ├── types.ts             # Tool types & interfaces
│   │   ├── registry.ts          # ToolRegistry
│   │   ├── read-file.ts
│   │   ├── write-file.ts
│   │   ├── edit-file.ts
│   │   ├── list-directory.ts
│   │   ├── shell.ts
│   │   ├── search.ts
│   │   └── git.ts
│   ├── tui/
│   │   ├── app.tsx              # Main Ink app
│   │   ├── components/
│   │   │   ├── ChatView.tsx
│   │   │   ├── InputBox.tsx
│   │   │   ├── ToolCallView.tsx
│   │   │   └── MessageView.tsx
│   │   └── hooks/
│   │       └── useAgent.ts
│   ├── db/
│   │   ├── index.ts             # DB connection
│   │   ├── schema.ts            # Drizzle schema
│   │   ├── sessions.ts          # Session repository
│   │   └── messages.ts          # Message repository
│   ├── permissions/
│   │   ├── manager.ts           # PermissionManager
│   │   └── rules.ts             # Allow/deny rules
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── env.ts
│   │   └── errors.ts
│   └── types/
│       └── index.ts             # Shared types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── scripts/
    └── build.ts
```

## 3. Key Packages

| Purpose            | Package                          | Why                                        |
|--------------------|----------------------------------|--------------------------------------------|
| Runtime            | `bun`                            | Fast, TS-native, single-binary builds      |
| LLM abstraction    | `ai` (Vercel AI SDK)             | Model-agnostic, streaming, tool calling    |
| Provider SDKs      | `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible` | First-party providers |
| TUI                | `ink` + `react`                  | React for CLI, streaming-friendly          |
| Validation         | `zod`                            | Type-safe schemas for tools & config       |
| ORM / DB           | `drizzle-orm` + `better-sqlite3` | Typed SQLite access                        |
| Logging            | `pino`                           | Fast structured logging                    |
| Testing            | `vitest`                         | Fast, TS-native test runner                |
| Diffing            | `diff`                           | Edit previews                              |
| CLI args           | `commander`                      | Robust flag parsing                        |

## 4. Core Data Models

```ts
interface Session {
  id: string;
  title: string;
  cwd: string;
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>; // cost, token usage
}

type Role = "user" | "assistant" | "system" | "tool";

interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  createdAt: Date;
}

interface ToolCall {
  id: string;
  messageId: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: "running" | "success" | "error";
  durationMs?: number;
  createdAt: Date;
}

interface AgentConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxSteps: number;
  permissionMode: "auto" | "ask" | "plan";
  systemPrompt?: string;
  cwd: string;
}
```

## 5. Decision Log

### Why TypeScript + Bun over Node?
- **Speed**: Bun's JavaScriptCore engine and native Zig runtime are significantly faster than Node for I/O-heavy agent workloads.
- **TypeScript native**: Bun runs `.ts` directly with no build step, simplifying dev loop (`bun run dev`).
- **Single binary**: `bun build --compile` produces a standalone executable for distribution (Phase 10).
- **Modern tooling**: Built-in test runner, package manager, and bundler reduce toolchain complexity.
- **Streaming**: Bun's `fetch` and WebSocket support are excellent for streaming LLM responses.

### Why Vercel AI SDK over LangChain.js?
- **Lighter weight**: AI SDK is a thin, provider-agnostic layer; LangChain is a heavy framework with a large API surface.
- **First-class streaming**: `streamText` and `streamObject` are simple and robust.
- **Tool calling**: Native Zod-schema tool definitions with automatic type inference.
- **Provider ecosystem**: First-party packages for OpenAI, Anthropic, Google, and OpenAI-compatible endpoints (OpenRouter, Ollama).

### Why Ink over Blessed?
- **React paradigm**: Component-based UI is easier to maintain and test.
- **Streaming-friendly**: Re-renders on state changes are natural for streaming text.
- **Modern**: Actively maintained, works well with Bun.

### Why Drizzle + better-sqlite3?
- **Type-safe**: Drizzle infers types from schema, eliminating runtime ORM errors.
- **Synchronous**: better-sqlite3 is synchronous, which is ideal for a local single-process agent.
- **Zero-config**: SQLite file-based persistence requires no server setup.