import {ModalMode, TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriorities;
  status: TodoStatuses;
  category: TodoCategories;
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_email: string;
}

export interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoFormData: TodoItem;
  setTodoFormData: (todoFormData: TodoItem) => void;
  onSubmit: () => void;
  mode: ModalMode;
}

export interface TodoStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
}
