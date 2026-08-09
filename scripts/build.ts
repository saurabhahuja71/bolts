/**
 * Build script for opencode-ai.
 * Compiles the TypeScript source into a standalone executable.
 */
import { $ } from "bun";

console.log("🔨 Building opencode-ai...");

// Clean dist
await $`rm -rf dist`.quiet();

// Compile TypeScript
console.log("  Compiling TypeScript...");
await $`bun build src/index.ts --outdir dist --target bun --format esm`.quiet();

// Make executable
await $`chmod +x dist/index.js`.quiet();

console.log("✅ Build complete. Run with: bun run start");