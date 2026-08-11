# opencode-ai / Bolts

An open-source AI coding agent written in **TypeScript + Bun**. Terminal-first with a modern TUI.

> TypeScript/Bun terminal agent with an Ink TUI. The feature set mirrors Boltpy while using the native TypeScript agent, tool registry, and provider adapters.

## Features

- 🖥️ **Terminal-first** — Modern TUI built with Ink (React for CLI)
- 🔌 **Model-agnostic** — OpenAI, Anthropic, Google, OpenRouter, Ollama, SGLang, and OpenAI-compatible endpoints
- 🔄 **Full agent loop** — plan → use tools → observe → repeat
- 🛠️ **Powerful tools** — read/write/edit files, shell, search, git, and HTTP-ready extension points
- ✅ **Live todos** — every submitted task gets a parent todo; `add_todo`, `complete_todo`, `update_todo`, and `list_todos` support subtasks
- 🔒 **Permission modes** — `ask`, `allow`, and `plan`, with inline `Y/N` approval for destructive tools
- ⌨️ **Keyboard-first TUI** — command palette, mode cycling, todo panel, interactive cursor mode, queue/cancel behavior
- 🧹 **Clean transcript** — tool-card noise is hidden by default while progress remains in the status line
- 🌤️ **Light theme default** — current mode, cursor mode, and processing state are visible in the status bar
- 💾 **Persistent sessions** — SQLite-backed history
- 🔐 **Permission system** — ask before destructive actions
- ⚡ **Streaming responses** — real-time output
- 📦 **Multi-session** — switch between conversations

## Quick Start

```bash
# Install dependencies
bun install

# Run the CLI
bun run dev

# Start the interactive chat command
bun run src/index.ts chat

# Typecheck
bun run typecheck

# Run tests
bun test
```

## Requirements

- [Bun](https://bun.sh) >= 1.0

## Commands and shortcuts

Chat commands:

```text
/help                         Show commands
/mode ask|allow|plan          Change permission mode
/todo                         Toggle the todo panel
/permissions                  List saved permissions
/theme light|dark             Select theme
/mouse interactive|select     Select cursor/mouse behavior
/queue                        Show queued prompts
/new                          Start a new conversation
/quit                         Exit
```

Keyboard shortcuts:

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+P` | Show commands |
| `Ctrl+Shift+M` | Cycle `ASK → ALLOW → PLAN` |
| `Ctrl+Shift+T` | Toggle todos |
| `Ctrl+Shift+I` | Toggle interactive cursor/native selection |
| `Ctrl+C` | Cancel the active task |
| `Ctrl+Q` | Quit |
| `Enter` | Send |
| `Shift+Enter` | Newline |

The command palette text is also available through `/help`. Prompts submitted while a task runs should be queued rather than discarded.

## Tools and permissions

The default registry includes `read_file`, `write_file`, `edit_file`, `list_directory`, `run_shell_command`, `search_codebase`, `git_status`, `git_diff`, `git_commit`, and todo tools. Read-only tools run in `ask` mode; destructive tools display an inline approval request. Press `Y` to allow or `N` to deny. `allow` permits tools for the session, while `plan` refuses destructive execution and asks the model to produce a plan.

For remote work, provide the literal SSH host, user, and command in the prompt. The agent should not try to execute a shell alias on the remote machine, and it should stop after a failed focused retry rather than looping through unrelated approaches.

## Providers

OpenAI-compatible services can be configured with `provider`, `model`, `apiKey`, and `baseUrl`. SGLang and Ollama use the same adapter path:

```json
{
  "provider": "sglang",
  "model": "Darwin-9B-Opus",
  "baseUrl": "http://127.0.0.1:30002/v1",
  "apiKey": "sglang",
  "permissionMode": "ask",
  "theme": "light"
}
```

Environment overrides include `OPENCODE_PROVIDER`, `OPENCODE_MODEL`, `OPENCODE_BASE_URL`, `OPENCODE_API_KEY`, `OPENCODE_PERMISSION_MODE`, and `OPENCODE_MAX_STEPS`.

## Configuration

Configuration is loaded from (in priority order):

1. CLI flags
2. Environment variables
3. `opencode.json` or `.opencode/config.json` (project)
4. `~/.config/opencode/config.json` (global)

See [docs/configuration.md](docs/configuration.md) for the full reference.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete architecture overview.

## License

MIT
