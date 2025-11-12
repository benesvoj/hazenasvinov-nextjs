import {ModalMode, TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {TodoSchema} from "@/types";

export interface TodoItem extends TodoSchema {
  priority: TodoPriorities;
  status: TodoStatuses;
  category: TodoCategories;
}

export type UpdateTodo = Partial<Omit<TodoSchema, 'id' | 'created_at' | 'updated_at'>>;

export type TodoFormData = Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>;

export interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoFormData: TodoFormData;
  setTodoFormData: (todoFormData: TodoFormData) => void;
  onSubmit: () => void;
  mode: ModalMode;
  isLoading?: boolean;
}

export interface TodoStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
}

export interface ToDoListProps {
  todos: TodoItem[];
  todosLoading: boolean;
  handleAddTodo: () => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => void;
  deleteTodo: (id: string) => void;
  handleEditTodo: (todo: TodoItem) => void;
}

export interface TodoListItemProps {
  todo: TodoItem;
  handleEditTodo: (todo: TodoItem) => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => void;
  deleteTodo: (id: string) => void;
}
