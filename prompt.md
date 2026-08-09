Phase 1: Project Planning & Architecture
You are a senior TypeScript architect. Design a complete architecture for an open-source AI coding agent written in TypeScript + Bun.

Requirements:
- Terminal-first (TUI) with optional desktop and VS Code extension later
- Model-agnostic (support OpenAI, Anthropic, Google, local models via Ollama, OpenRouter, etc.)
- Full agent loop: plan → use tools → observe → repeat
- Tools: read/write/edit files, run shell commands, list directory, search codebase, git operations
- Session management with persistent history (SQLite)
- Permission system (ask before destructive actions)
- Streaming responses
- Multi-session support
- Configuration via JSON + environment variables

Output:
1. High-level architecture diagram (text)
2. Recommended folder structure
3. Key packages (Bun, Vercel AI SDK or alternative, Ink or Blessed for TUI, Drizzle/SQLite, Zod, etc.)
4. Core data models (Session, Message, ToolCall, etc.)
5. Decision log: why TypeScript + Bun over Node, why this stack

Phase 2: Project Scaffolding

Create a production-ready TypeScript project for an AI coding agent using Bun.

Requirements:
- Use Bun as runtime and package manager
- TypeScript with strict mode
- ESM only
- Proper project structure based on this architecture: [paste architecture from Phase 1]
- Include:
  - package.json with scripts (dev, build, start, test, typecheck)
  - tsconfig.json (strict)
  - .gitignore
  - README.md skeleton
  - Basic CLI entry point (bin)
  - Environment variable handling with Zod
  - Logging with a clean logger
- Install recommended dependencies
- Make it runnable with `bun run dev`



Phase 3: Core Agent Loop + LLM Integration
Implement the core agent loop in TypeScript using the Vercel AI SDK (or LangChain.js if preferred).

Features needed:
- Model-agnostic provider system (OpenAI, Anthropic, Google, OpenRouter, Ollama)
- Streaming text + tool calls
- Tool calling with proper Zod schemas
- Agent loop that continues until the model decides to stop or max steps reached
- System prompt that makes the agent act as a coding agent
- Message history management
- Error handling and retries

Create:
1. Provider factory
2. Agent class with run() method
3. Basic tool definitions (placeholder for now)
4. Example usage that can chat with a model and use tools


Phase 4: Tool System
Build a robust, typed tool system for the AI coding agent.

Required tools:
1. read_file
2. write_file
3. edit_file (search & replace or patch)
4. list_directory
5. run_shell_command (with timeout and output capture)
6. search_codebase (simple grep or ripgrep)
7. git_status / git_diff / git_commit (optional but recommended)

Requirements:
- Every tool must have a Zod schema
- Tools should be permission-aware (some require user confirmation)
- Safe defaults (no automatic destructive actions)
- Proper error handling and result formatting for the LLM
- Tools should work relative to the project root
- Support for large file handling (truncate if needed)

Implement the ToolRegistry and register all tools.



Phase 5: Terminal UI (TUI)
Create a modern Terminal UI for the AI coding agent using Ink (React for CLI) or a lightweight alternative.

Requirements:
- Chat interface with streaming responses
- Show tool calls in real-time (with status: running / success / error)
- Input box with history (up/down arrows)
- Support for multi-line input
- Ability to interrupt the agent (Ctrl+C)
- Clear visual distinction between user, assistant, and tool messages
- Loading indicators
- Session selector or new session command
- Responsive and clean design (no excessive colors)

Make the TUI the main entry point when running the CLI.


Phase 6: Session & Persistence
Implement persistent session management using SQLite + Drizzle ORM (or better-sqlite3).

Features:
- Create / list / switch / delete sessions
- Store full conversation history (messages + tool calls + results)
- Resume a previous session
- Auto-save after every turn
- Export session as Markdown or JSON
- Optional: shareable session links later

Schema should support:
- Sessions
- Messages
- Tool calls
- Metadata (model used, cost estimate, timestamps)

Phase 7: Configuration & Permissions
Build a flexible configuration and permission system.

Requirements:
- Config file: opencode.json or .opencode/config.json
- Support environment variables and CLI flags
- Model selection and provider API keys
- Permission levels:
  - auto (full autonomy)
  - ask (confirm destructive tools)
  - plan (only plan, no execution)
- Allowlist / denylist for shell commands
- Project-specific vs global config
- Zod validation for the entire config

Make it easy for users to switch models and control agent behavior.

Phase 8: Advanced Features
Add these advanced features one by one:

1. LSP integration (diagnostics after edits)
2. Multi-agent / parallel sessions
3. Repo map / codebase indexing for better context
4. Cost tracking and token usage display
5. Custom system prompts / agent personas
6. MCP (Model Context Protocol) support
7. Git-aware operations (auto-commit option)
8. Diff preview before applying edits


Phase 9: Testing & Quality

Set up a solid testing strategy for the TypeScript AI coding agent.

- Unit tests for tools and agent loop (Vitest)
- Integration tests that mock LLM responses
- Snapshot testing for tool outputs
- Type-safe mocks
- Test fixtures for different scenarios (bug fix, feature implementation, refactor)
- CI-ready test setup


Phase 10: Packaging & Distribution
Prepare the project for distribution:

1. Build a single executable with Bun
2. Publish to npm as `opencode-ai` (or your name)
3. Create install script (curl | bash)
4. Homebrew formula (optional)
5. Proper versioning and changelog
6. Binary releases for macOS, Linux, Windows
7. Clear installation instructions in README


Phase 11: Documentation & Polish
Write excellent documentation and polish the project:

- Comprehensive README with quick start, features, and examples
- Architecture overview
- Configuration reference
- Tool reference
- Contributing guide
- Examples of good system prompts
- Troubleshooting section


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
