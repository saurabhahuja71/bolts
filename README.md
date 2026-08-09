# opencode-ai

An open-source AI coding agent written in **TypeScript + Bun**. Terminal-first with a modern TUI.

> 🚧 **Under active development** — Phase 2 (Scaffolding) in progress.

## Features

- 🖥️ **Terminal-first** — Modern TUI built with Ink (React for CLI)
- 🔌 **Model-agnostic** — OpenAI, Anthropic, Google, OpenRouter, Ollama
- 🔄 **Full agent loop** — plan → use tools → observe → repeat
- 🛠️ **Powerful tools** — read/write/edit files, shell, search, git
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

# Typecheck
bun run typecheck

# Run tests
bun test
```

## Requirements

- [Bun](https://bun.sh) >= 1.0

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