export interface TodoItem {
  id: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

class TodoStore {
  private todos: TodoItem[] = [];
  private nextId = 1;
  add(description: string): TodoItem { const todo = { id: String(this.nextId++), description: description.trim(), completed: false, createdAt: new Date() }; this.todos.push(todo); return todo; }
  get(id: string): TodoItem | undefined { return this.todos.find((todo) => todo.id === id); }
  complete(id: string): boolean { const todo = this.get(id); if (!todo) return false; todo.completed = true; return true; }
  update(id: string, description: string): boolean { const todo = this.get(id); if (!todo || !description.trim()) return false; todo.description = description.trim(); return true; }
  items(): TodoItem[] { return [...this.todos]; }
  openCount(): number { return this.todos.filter((todo) => !todo.completed).length; }
  clear(): void { this.todos = []; this.nextId = 1; }
}

export const todoStore = new TodoStore();
