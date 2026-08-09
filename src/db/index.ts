/**
 * Simple Drizzle ORM setup using better-sqlite3.
 * The database file is created in the project root as `opencode.db`.
 * This file provides the `db` export that can be used throughout the codebase.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sessions, messages, toolCalls } from "./schema";

// Initialise the SQLite database (will create the file if it does not exist)
const sqlite = new Database("opencode.db");
export const db = drizzle(sqlite, { schema: { sessions, messages, toolCalls } });

// Export the tables for convenience when building queries elsewhere
export { sessions, messages, toolCalls };
