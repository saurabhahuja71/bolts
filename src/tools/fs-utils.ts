import { isAbsolute, relative, resolve } from "node:path";
import { ToolError } from "../utils/errors";

/** Resolve a user-provided path and ensure it stays inside the project root. */
export function resolveProjectPath(cwd: string, requestedPath = "."): string {
  const root = resolve(cwd);
  const target = resolve(root, requestedPath);
  const rel = relative(root, target);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new ToolError(`Path escapes project root: ${requestedPath}`);
  }

  return target;
}