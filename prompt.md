Phase 1: Project Planning & Architecture ✅
You are a senior TypeScript architect. Design a complete architecture for an open-source AI coding agent written in TypeScript + Bun.

Requirements:
* Terminal-first (TUI) with optional desktop and VS Code extension later
* Model‑agnostic (support OpenAI, Anthropic, Google, local models via Ollama, OpenRouter, etc.)
* Full agent loop: plan → use tools → observe → repeat
* Tools: read/write/edit files, run shell commands, list directory, search codebase, git operations
* Session management with persistent history (SQLite)
* Permission system (ask before destructive actions)
* Streaming responses
* Multi‑session support
* Configuration via JSON + environment variables

Output:
1. High‑level architecture diagram (text)
2. Recommended folder structure
3. Key packages (Bun, Vercel AI SDK or alternative, Ink or Blessed for TUI, Drizzle/SQLite, Zod, etc.)
4. Core data models (Session, Message, ToolCall, etc.)
5. Decision log: why TypeScript + Bun over Node, why this stack

Phase 2: Project Scaffolding ✅

Create a production‑ready TypeScript project for an AI coding agent using Bun.

Requirements:
* Use Bun as runtime and package manager
* TypeScript with strict mode
* ESM only
* Proper project structure based on the architecture above
* Include:
  - `package.json` with scripts (dev, build, start, test, typecheck)
  - `tsconfig.json` (strict)
  - `.gitignore`
  - `README.md` skeleton
  - Basic CLI entry point (bin)
  - Environment variable handling with Zod
  - Logging with a clean logger
* Install recommended dependencies
* Make it runnable with `bun run dev`



Phase 3: Core Agent Loop + LLM Integration ✅
Implemented the core agent loop using the Vercel AI SDK.

Features provided:
* Model‑agnostic provider system (OpenAI, Anthropic, Google, OpenRouter, Ollama)
* Streaming text + tool calls
* Tool calling with Zod schemas
* Loop that runs until the model stops or max steps are hit
* System prompts for coding‑agent behavior
* Message history management
* Robust error handling and retries

Artifacts:
1. Provider factory (`src/agent/providers/factory.ts`)
2. `Agent` class with `run()` (`src/agent/agent.ts`)
3. Tool definitions are registered via `ToolRegistry`
4. Example CLI entry point (`src/index.ts`)


Phase 4: Tool System ✅
Implemented a fully typed tool system with permission awareness.

Provided tools:
1. `read_file`
2. `write_file`
3. `edit_file`
4. `list_directory`
5. `run_shell_command`
6. `search_codebase`
7. `git_status`, `git_diff`, `git_commit`

All tools have Zod input schemas, respect the `PermissionManager`, and truncate large outputs.
`ToolRegistry` (`src/tools/registry.ts`) registers and exposes them to the AI SDK.



Phase 5: Terminal UI (TUI) ✅
Implemented a functional TUI entry point (`src/tui/app.tsx`) and wired it into the CLI (`src/index.ts`). The chat UI now displays messages, streams assistant responses, and handles tool call updates.


Phase 6: Session & Persistence ⬜
Database schema (`src/db/schema.ts`) is present, but session management commands and persistence hooks are not yet wired into the CLI/TUI.
Phase 7: Configuration & Permissions ✅
Implemented via `src/config` (schema, loader, env helpers) and `PermissionManager` (`src/permissions`).
Supports config files, env vars, CLI overrides, permission modes, and shell command rules.
Make it easy for users to switch models and control agent behavior.

Phase 8: Advanced Features ⬜
Only a few foundations are in place (cost tracking config, diagnostics config). LSP, repo‑map indexing, multi‑agent support, MCP, auto‑commit, and diff preview are still to be implemented.


Phase 9: Testing & Quality ⬜
No test suite has been added yet. `vitest` is listed as a devDependency but no test files exist.


Phase 10: Packaging & Distribution ✅
Build script (`scripts/build.ts`) compiles to a standalone executable. Packaging scripts and README placeholders are present.


Phase 11: Documentation & Polish ⬜
`README.md` and `ARCHITECTURE.md` exist, but a full contributing guide, detailed tool reference, and troubleshooting sections are still missing.


Bonus: Master Prompt (All-in-One Kickoff)
I want to build a high-quality open-source AI coding agent in TypeScript + Bun, similar to OpenCode.

Please act as my senior engineer and guide me through the entire development process phase by phase. Start with Phase 1 (Architecture) and wait for my confirmation before moving to the next phase.

Key goals:
- Terminal-first with excellent TUI
- Fully model-agnostic
- Strong typing everywhere
- Safe tool execution with permissions
- Persistent sessions
- Production-ready code quality
