'use client';

import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {TodoCategories, TodoPriorities, TodoStatuses, TodoFilter} from '@/enums';
import {TodoItem, TodoStats} from '@/types';

export interface UseTodosReturn {
  // State
  todos: TodoItem[];
  todosLoading: boolean;
  todoFilter: TodoFilter;
  filteredTodos: TodoItem[];
  todoStats: TodoStats;
  selectedTodo: TodoItem | null;
  todoFormData: TodoItem;

  // Actions
  setTodoFilter: (filter: TodoFilter) => void;
  setSelectedTodo: (todo: TodoItem | null) => void;
  setTodoFormData: (data: TodoItem) => void;

  // CRUD operations
  loadTodos: () => Promise<void>;
  addTodo: () => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  updateTodoStatus: (id: string, status: string) => Promise<void>;

  // Form handlers
  handleAddTodo: () => void;
  handleEditTodo: (todo: TodoItem) => void;
  resetTodoForm: () => void;
}

const getDefaultTodoFormData = (): TodoItem => ({
  title: '',
  description: '',
  priority: TodoPriorities.MEDIUM,
  status: TodoStatuses.TODO,
  category: TodoCategories.IMPROVEMENT,
  due_date: '',
  id: '',
  created_at: '',
  updated_at: '',
  user_email: '',
});

export const useTodos = (userEmail?: string): UseTodosReturn => {
  // State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [todoFilter, setTodoFilter] = useState<TodoFilter>(TodoFilter.TODO);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [todoFormData, setTodoFormData] = useState<TodoItem>(getDefaultTodoFormData());

  // Filter todos based on current filter
  const filteredTodos = todos.filter((todo) => {
    switch (todoFilter) {
      case TodoFilter.TODO:
        return todo.status === TodoStatuses.TODO;
      case 'in-progress':
        return todo.status === TodoStatuses.IN_PROGRESS;
      case TodoFilter.DONE:
        return todo.status === TodoStatuses.DONE;
      case 'high-priority':
        return (
          (todo.priority === TodoPriorities.HIGH || todo.priority === TodoPriorities.URGENT) &&
          todo.status !== TodoStatuses.DONE
        );
      default:
        return true;
    }
  });

  // Calculate statistics
  const todoStats: TodoStats = {
    total: todos.length,
    todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
    inProgress: todos.filter((t) => t.status === 'in-progress').length,
    done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
    highPriority: todos.filter(
      (t) =>
        (t.priority === TodoPriorities.HIGH || t.priority === TodoPriorities.URGENT) &&
        t.status !== TodoStatuses.DONE
    ).length,
  };

  // Load todos from database
  const loadTodos = useCallback(async () => {
    try {
      setTodosLoading(true);
      const supabase = createClient();

      // First check if the todos table exists
      const {data: tableCheck, error: tableError} = await supabase
        .from('todos')
        .select('id')
        .limit(1);

      if (tableError) {
        if (tableError.message && tableError.message.includes('relation "todos" does not exist')) {
          setTodos([]);
          return;
        }
        throw tableError;
      }

      const {data, error} = await supabase
        .from('todos')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Error loading todos:', error);
      setTodos([]);
    } finally {
      setTodosLoading(false);
    }
  }, []);

  // Add new todo
  const addTodo = useCallback(async () => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('todos').insert({
        title: todoFormData.title,
        description: todoFormData.description,
        priority: todoFormData.priority,
        status: todoFormData.status,
        category: todoFormData.category,
        due_date: todoFormData.due_date || null,
        user_email: userEmail || 'unknown@hazenasvinov.cz',
      });

      if (error) {
        if (error.message.includes('relation "todos" does not exist')) {
          return;
        }
        throw error;
      }

      await loadTodos();
      showToast.success('Todo added successfully!');
    } catch (error: any) {
      console.error('Error adding todo:', error);
      showToast.danger('Failed to add todo');
    }
  }, [todoFormData, userEmail, loadTodos]);

  // Update existing todo
  const updateTodo = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('todos').update(updates).eq('id', id);

        if (error) throw error;

        await loadTodos();
        showToast.success('Todo updated successfully!');
      } catch (error: any) {
        console.error('Error updating todo:', error);
        showToast.danger('Failed to update todo');
      }
    },
    [loadTodos]
  );

  // Delete todo
  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('todos').delete().eq('id', id);

        if (error) throw error;

        await loadTodos();
        showToast.success('Todo deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting todo:', error);
        showToast.danger('Failed to delete todo');
      }
    },
    [loadTodos]
  );

  // Update todo status
  const updateTodoStatus = useCallback(
    async (id: string, status: string) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('todos').update({status}).eq('id', id);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        showToast.success(`Todo marked as ${status}!`);

        // Force reload todos with a small delay to ensure database consistency
        setTimeout(() => {
          loadTodos();
        }, 100);
      } catch (error: any) {
        console.error('Error updating todo status:', error);
        showToast.danger('Failed to update todo status');
      }
    },
    [loadTodos]
  );

  // Reset form to default values
  const resetTodoForm = useCallback(() => {
    setTodoFormData(getDefaultTodoFormData());
  }, []);

  // Handle add todo button click
  const handleAddTodo = useCallback(() => {
    resetTodoForm();
  }, [resetTodoForm]);

  // Handle edit todo button click
  const handleEditTodo = useCallback((todo: TodoItem) => {
    setSelectedTodo(todo);
    setTodoFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      due_date: todo.due_date || '',
      id: todo.id,
      created_at: todo.created_at,
      updated_at: todo.updated_at,
      user_email: todo.user_email,
    });
  }, []);

  return {
    // State
    todos,
    todosLoading,
    todoFilter,
    filteredTodos,
    todoStats,
    selectedTodo,
    todoFormData,

    // Actions
    setTodoFilter,
    setSelectedTodo,
    setTodoFormData,

    // CRUD operations
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    updateTodoStatus,

    // Form handlers
    handleAddTodo,
    handleEditTodo,
    resetTodoForm,
  };
};
