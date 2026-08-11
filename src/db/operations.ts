/**
 * Basic CRUD helpers for the opencode‑ai SQLite store.
 * These are intentionally simple – they cover the minimal needs for Phase 6
 * (session creation, listing, and message persistence).
 */
import { db, sessions, messages } from "./index";
import { eq } from "drizzle-orm";

/** Create a new session and return its ID. */
export async function createSession(params: {
  title: string;
  cwd: string;
  model: string;
  provider: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(sessions)
    .values({
      id,
      title: params.title,
      cwd: params.cwd,
      model: params.model,
      provider: params.provider,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: null,
    })
    .run();
  return id;
}

/** List all stored sessions. */
export async function listSessions(): Promise<Array<any>> {
  const rows = await db.select().from(sessions).all();
  return rows;
}

/** Persist a message belonging to a session. */
export async function addMessage(params: {
  sessionId: string;
  role: string;
  content: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(messages)
    .values({
      id,
      sessionId: params.sessionId,
      role: params.role,
      content: params.content,
      createdAt: new Date(),
    })
    .run();
  return id;
}

/** Retrieve all messages for a session, ordered by creation. */
export async function getMessages(sessionId: string): Promise<Array<any>> {
  const rows = await db.select().from(messages).where(eq(messages.sessionId, sessionId)).all();
  return rows;
}
