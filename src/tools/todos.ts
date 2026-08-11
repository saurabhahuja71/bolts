import { z } from "zod";
import type { Tool } from "./types";
import { todoStore } from "../todos/store";

export const todoTools: Tool[] = [
  { name: "add_todo", description: "Add a task to the live todo list.", inputSchema: z.object({ description: z.string().min(1) }), execute: async (input) => ({ success: true, output: `added todo ${todoStore.add(input.description).id}: ${input.description.trim()}` }) },
  { name: "complete_todo", description: "Mark a todo as complete.", inputSchema: z.object({ todoId: z.string() }), execute: async (input) => ({ success: todoStore.complete(input.todoId), output: `completed todo ${input.todoId}` }) },
  { name: "update_todo", description: "Update a todo description.", inputSchema: z.object({ todoId: z.string(), description: z.string().min(1) }), execute: async (input) => ({ success: todoStore.update(input.todoId, input.description), output: `updated todo ${input.todoId}` }) },
  { name: "list_todos", description: "List current todos.", inputSchema: z.object({}), execute: async () => ({ success: true, output: todoStore.items().map((todo) => `${todo.completed ? "[x]" : "[ ]"} ${todo.id}. ${todo.description}`).join("\n") || "(no todos)" }) },
];
