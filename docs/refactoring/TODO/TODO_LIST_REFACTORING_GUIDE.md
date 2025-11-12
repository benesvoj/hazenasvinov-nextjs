# ToDoList Component Refactoring Guide

## Overview
This document provides a comprehensive guide for refactoring the ToDoList feature to follow the standard layered architecture used throughout the codebase.

**Status:** Ready for implementation
**Date:** 2025-11-11
**Related Files:**
- `src/components/features/admin/ToDoList.tsx`
- `src/components/features/admin/TodoListItem.tsx`
- `src/app/admin/components/modals/TodoModal.tsx`
- `src/hooks/entities/todo/data/useFetchTodos.ts` ✅ (prepared)
- `src/hooks/entities/todo/state/useTodoForm.ts` ✅ (prepared)
- `src/hooks/entities/todo/state/useTodos.ts` ⚠️ (needs refactoring)
- `src/app/api/todos/route.ts` ✅ (completed)
- `src/app/api/todos/[id]/route.ts` ✅ (completed)

---

## Current Architecture Issues

### 1. **Monolithic useTodos Hook**
The current `useTodos` hook (src/hooks/entities/todo/state/useTodos.ts:53-288) violates separation of concerns:

**Problems:**
- ❌ Mixes data fetching with state management
- ❌ Contains direct Supabase calls alongside API route calls (inconsistent)
- ❌ Handles filtering, statistics, CRUD operations, and form state all in one place
- ❌ Tightly couples business logic with UI state
- ❌ Direct Supabase call in `loadTodos()` (line 97-129)
- ❌ Direct Supabase call in `updateTodoStatus()` (line 209-232)
- ❌ API calls in `addTodo()`, `updateTodo()`, `deleteTodo()` (inconsistent approach)

### 2. **Type Mismatches**
- `useTodoForm` returns `TodoFormData` (without id, created_at, updated_at)
- `TodoModal` expects `TodoItem` (with all fields)
- Parent component has to manually map between types

### 3. **Missing Proper Data Layer**
- New `useFetchTodos` hook exists but isn't integrated
- Some operations bypass API routes and use direct Supabase calls
- No centralized data fetching strategy

---

## Target Architecture

Following the standard layered architecture seen in other entities (categories, members, etc.):

```
hooks/entities/todo/
├── data/                           # DATA LAYER
│   └── useFetchTodos.ts           # ✅ Fetch todos from API (prepared)
│
├── state/                          # STATE LAYER
│   ├── useTodoForm.ts             # ✅ Form state management (prepared)
│   └── useTodos.ts                # ⚠️ Main state orchestration (needs refactoring)
│
└── business/                       # BUSINESS LAYER (optional)
    └── useTodoFiltering.ts        # Future: Complex filtering logic
```

### Separation of Concerns

#### **Data Layer** (`useFetchTodos`)
**Responsibility:** Communication with API, data fetching
```typescript
// Location: hooks/entities/todo/data/useFetchTodos.ts
export function useFetchTodos() {
  // ✅ Fetch data via API routes
  // ✅ Handle loading states
  // ✅ Handle errors with toast notifications
  // ✅ Provide refetch capability
  // ❌ NO business logic
  // ❌ NO filtering
  // ❌ NO form state
}
```

#### **State Layer** (`useTodoForm`)
**Responsibility:** Form state and validation
```typescript
// Location: hooks/entities/todo/state/useTodoForm.ts
export function useTodoForm() {
  // ✅ Manage form data
  // ✅ Validate form inputs
  // ✅ Handle add/edit modes
  // ✅ Reset form state
  // ❌ NO data fetching
  // ❌ NO CRUD operations
}
```

#### **State Layer** (`useTodos`)
**Responsibility:** State orchestration and CRUD operations
```typescript
// Location: hooks/entities/todo/state/useTodos.ts
export function useTodos(userEmail?: string) {
  // ✅ Use useFetchTodos for data
  // ✅ Filtering logic
  // ✅ Statistics calculation
  // ✅ CRUD operations (via API)
  // ✅ State management
  // ❌ NO direct Supabase calls
  // ❌ NO form state (use useTodoForm separately)
}
```

---

## Refactoring Steps

### Step 1: Create Enhanced useFetchTodos Hook

**File:** `src/hooks/entities/todo/data/useFetchTodos.ts`

**Current Issues:**
- Missing dependency array for fetchData (line 28)
- Should not call fetchData on mount automatically (let parent control)

**Improvements Needed:**
```typescript
'use client';

import {useCallback, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {TodoItem} from "@/types";

export function useFetchTodos() {
  const [data, setData] = useState<TodoItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(API_ROUTES.todos.root);
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to fetch todos');
      }

      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      showToast.danger('Failed to fetch todos');
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
```

### Step 2: Enhance useTodoForm Hook

**File:** `src/hooks/entities/todo/state/useTodoForm.ts`

**Current Issues:**
- Type mismatch with TodoModal (expects TodoItem, not TodoFormData)
- Missing setFormData function

**Improvements Needed:**
```typescript
'use client';

import {useCallback, useState} from "react";

import {ModalMode, TodoCategories, TodoPriorities, TodoStatuses} from "@/enums";
import {TodoFormData, TodoItem} from "@/types";

const initialFormData: TodoFormData = {
  title: '',
  description: '',
  priority: TodoPriorities.MEDIUM,
  status: TodoStatuses.TODO,
  category: TodoCategories.IMPROVEMENT,
  due_date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
  user_email: '',
  assigned_to: '',
  created_by: ''
}

export const useTodoForm = () => {
  const [formData, setFormData] = useState<TodoFormData>(initialFormData);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedTodo(null);
    setFormData(initialFormData);
  }, []);

  const openEditMode = useCallback((item: TodoItem) => {
    setModalMode(ModalMode.EDIT);
    setSelectedTodo(item);
    const {id, created_at, updated_at, ...editableFields} = item;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedTodo(null);
    setModalMode(ModalMode.ADD);
  }, []);

  const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push('Title is mandatory');
    }
    if (!formData.description?.trim()) {
      errors.push('Description is mandatory');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [formData]);

  return {
    // State
    formData,
    setFormData,        // ADD THIS - needed by TodoModal
    selectedTodo,
    modalMode,
    // Actions
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  };
}
```

### Step 3: Refactor useTodos Hook

**File:** `src/hooks/entities/todo/state/useTodos.ts`

**Key Changes:**
1. Remove direct Supabase calls
2. Use useFetchTodos for data fetching
3. Remove form state management (use useTodoForm separately)
4. Use API routes consistently for all CRUD operations
5. Simplify to focus on state orchestration

**New Implementation:**
```typescript
'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {showToast} from '@/components';
import {TodoFilter, TodoPriorities, TodoStatuses} from '@/enums';
import {API_ROUTES} from "@/lib";
import {TodoInsert, TodoItem, TodoStats, TodoUpdate} from '@/types';
import {useFetchTodos} from '../data/useFetchTodos';

export interface UseTodosReturn {
  // State
  todos: TodoItem[];
  todosLoading: boolean;
  todoFilter: TodoFilter;
  filteredTodos: TodoItem[];
  todoStats: TodoStats;

  // Actions
  setTodoFilter: (filter: TodoFilter) => void;

  // CRUD operations
  loadTodos: () => Promise<void>;
  createTodo: (data: TodoInsert) => Promise<boolean>;
  updateTodo: (id: string, updates: TodoUpdate) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<boolean>;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;
}

export const useTodos = (): UseTodosReturn => {
  // Data layer
  const {data, loading, refetch} = useFetchTodos();

  // State
  const [todoFilter, setTodoFilter] = useState<TodoFilter>(TodoFilter.TODO);
  const [isOperating, setIsOperating] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Memoized todos (fallback to empty array)
  const todos = useMemo(() => data || [], [data]);

  // Filter todos based on current filter
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      switch (todoFilter) {
        case TodoFilter.TODO:
          return todo.status === TodoStatuses.TODO;
        case TodoFilter.IN_PROGRESS:
          return todo.status === TodoStatuses.IN_PROGRESS;
        case TodoFilter.DONE:
          return todo.status === TodoStatuses.DONE;
        case TodoFilter.HIGH_PRIORITY:
          return (
            (todo.priority === TodoPriorities.HIGH ||
             todo.priority === TodoPriorities.URGENT) &&
            todo.status !== TodoStatuses.DONE
          );
        case TodoFilter.ALL:
        default:
          return true;
      }
    });
  }, [todos, todoFilter]);

  // Calculate statistics
  const todoStats: TodoStats = useMemo(() => ({
    total: todos.length,
    todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
    inProgress: todos.filter((t) => t.status === TodoStatuses.IN_PROGRESS).length,
    done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
    highPriority: todos.filter(
      (t) =>
        (t.priority === TodoPriorities.HIGH ||
         t.priority === TodoPriorities.URGENT) &&
        t.status !== TodoStatuses.DONE
    ).length,
  }), [todos]);

  // Load todos
  const loadTodos = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Create todo
  const createTodo = useCallback(async (data: TodoInsert): Promise<boolean> => {
    try {
      setIsOperating(true);

      const res = await fetch(API_ROUTES.todos.root, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to create todo');
      }

      showToast.success('Todo created successfully!');
      await refetch();
      return true;
    } catch (error) {
      console.error('Error creating todo:', error);
      showToast.danger('Failed to create todo');
      return false;
    } finally {
      setIsOperating(false);
    }
  }, [refetch]);

  // Update todo
  const updateTodo = useCallback(
    async (id: string, updates: TodoUpdate): Promise<boolean> => {
      try {
        setIsOperating(true);

        const res = await fetch(API_ROUTES.todos.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updates),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to update todo');
        }

        showToast.success('Todo updated successfully!');
        await refetch();
        return true;
      } catch (error) {
        console.error('Error updating todo:', error);
        showToast.danger('Failed to update todo');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [refetch]
  );

  // Delete todo
  const deleteTodo = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsOperating(true);

        const res = await fetch(API_ROUTES.todos.byId(id), {
          method: 'DELETE',
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to delete todo');
        }

        showToast.success('Todo deleted successfully!');
        await refetch();
        return true;
      } catch (error) {
        console.error('Error deleting todo:', error);
        showToast.danger('Failed to delete todo');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [refetch]
  );

  // Update todo status
  const updateTodoStatus = useCallback(
    async (id: string, status: TodoStatuses): Promise<boolean> => {
      try {
        setIsOperating(true);

        const res = await fetch(API_ROUTES.todos.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({status}),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to update status');
        }

        showToast.success(`Todo marked as ${status}!`);
        await refetch();
        return true;
      } catch (error) {
        console.error('Error updating todo status:', error);
        showToast.danger('Failed to update todo status');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [refetch]
  );

  return {
    // State
    todos,
    todosLoading: loading || isOperating,
    todoFilter,
    filteredTodos,
    todoStats,

    // Actions
    setTodoFilter,

    // CRUD operations
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
  };
};
```

### Step 4: Update TodoModal Component

**File:** `src/app/admin/components/modals/TodoModal.tsx`

**Changes Needed:**
- Accept `TodoFormData` instead of `TodoItem` for form data
- Update prop types

**Updated Implementation:**
```typescript
import {Input, Select, SelectItem, Textarea, Button} from '@heroui/react';

import {TodoFormData, TodoModalProps} from '@/types/entities/todo/data/todo';

import {UnifiedModal} from '@/components';
import {getTodoCategoriesOptions, getTodoPrioritiesOptions, ModalMode} from '@/enums';
import {translations} from '@/lib';

export const TodoModal = ({
  isOpen,
  onSubmit,
  onClose,
  todoFormData,
  setTodoFormData,
  mode,
}: TodoModalProps) => {
  const tAction = translations.action;
  const tTodoModal = translations.common.todoModal;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? tTodoModal.titleEdit : tTodoModal.titleAdd;

  return (
    <UnifiedModal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose}>
            {tAction.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit}>
            {isEditMode ? tAction.save : tAction.add}
          </Button>
        </div>
      }
    >
      <Input
        label={tTodoModal.title}
        aria-label={tTodoModal.title}
        value={todoFormData.title}
        onChange={(e) => setTodoFormData({...todoFormData, title: e.target.value})}
        isRequired
        placeholder={tTodoModal.titlePlaceholder}
      />
      <Textarea
        label={tTodoModal.description}
        aria-label={tTodoModal.description}
        value={todoFormData.description || ''}
        onChange={(e) => setTodoFormData({...todoFormData, description: e.target.value})}
        placeholder={tTodoModal.descriptionPlaceholder}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={tTodoModal.priority}
          placeholder={tTodoModal.priorityPlaceholder}
          aria-label={tTodoModal.priority}
          selectedKeys={todoFormData.priority ? [todoFormData.priority] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as TodoFormData['priority'];
            if (selectedKey) {
              setTodoFormData({
                ...todoFormData,
                priority: selectedKey,
              });
            }
          }}
        >
          {getTodoPrioritiesOptions().map(({value, label}) => (
            <SelectItem key={value}>{label}</SelectItem>
          ))}
        </Select>
        <Select
          label={tTodoModal.category}
          placeholder={tTodoModal.categoryPlaceholder}
          aria-label={tTodoModal.category}
          selectedKeys={todoFormData.category ? [todoFormData.category] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as TodoFormData['category'];
            if (selectedKey) {
              setTodoFormData({
                ...todoFormData,
                category: selectedKey,
              });
            }
          }}
        >
          {getTodoCategoriesOptions().map(({value, label}) => (
            <SelectItem key={value}>{label}</SelectItem>
          ))}
        </Select>
        <Input
          label={tTodoModal.dueDate}
          aria-label={tTodoModal.dueDate}
          type="date"
          isRequired
          value={todoFormData.due_date || ''}
          onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
        />
      </div>
    </UnifiedModal>
  );
};
```

### Step 5: Update Type Definitions

**File:** `src/types/entities/todo/data/todo.ts`

**Changes:**
```typescript
import {ModalMode, TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {TodoSchema} from "@/types";

export interface TodoItem extends TodoSchema {
  priority: TodoPriorities;
  status: TodoStatuses;
  category: TodoCategories;
}

export type TodoFormData = Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>;

export interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoFormData: TodoFormData;  // CHANGED from TodoItem
  setTodoFormData: (todoFormData: TodoFormData) => void;  // CHANGED from TodoItem
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

export interface ToDoListProps {
  todos: TodoItem[];
  todosLoading: boolean;
  handleAddTodo: () => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;  // CHANGED return type
  deleteTodo: (id: string) => Promise<boolean>;  // CHANGED return type
  handleEditTodo: (todo: TodoItem) => void;
  currentFilter?: string;
}

export interface TodoListItemProps {
  todo: TodoItem;
  handleEditTodo: (todo: TodoItem) => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;  // CHANGED return type
  deleteTodo: (id: string) => Promise<boolean>;  // CHANGED return type
}
```

### Step 6: Update Admin Page

**File:** `src/app/admin/page.tsx`

**Key Changes:**
- Separate useTodos and useTodoForm hooks
- Use new createTodo instead of addTodo
- Handle async operations properly
- Pass TodoFormData to TodoModal

**Updated Implementation:**
```typescript
'use client';

import {useState, useEffect} from 'react';
import {redirect} from 'next/navigation';

import {useUser} from '@/contexts/UserContext';
import {
  ToDoList,
  CommentsZone,
  AdminContainer,
  LoadingSpinner,
  DeleteConfirmationModal,
} from '@/components';
import {ModalMode, TodoStatuses} from '@/enums';
import {useTodos, useComments, useTodoForm} from '@/hooks';
import {Comment, TodoItem, TodoInsert} from '@/types';

import {TodoModal, TodoStatsCards, CommentModal} from './components';

interface DeleteItem {
  type: 'todo' | 'comment';
  id: string;
  title: string;
}

export default function AdminDashboard() {
  const {user, userProfile, loading, isAuthenticated, isAdmin} = useUser();

  // Use separated hooks
  const todos = useTodos();
  const todoForm = useTodoForm();

  const comments = useComments(user?.email);

  // Todo modal state
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

  // Comment modal state
  const [commentModalMode, setCommentModalMode] = useState<ModalMode>(ModalMode.ADD);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect('/login');
      return;
    }

    if (!loading && isAuthenticated && !isAdmin) {
      redirect('/login?error=no_admin_access');
      return;
    }

    if (!loading && isAuthenticated && isAdmin) {
      // Load data after user is confirmed
      todos.loadTodos();
      comments.loadComments();
    }
  }, [loading, isAuthenticated, isAdmin]);

  // ============ Comment Handlers ============

  const handleAddCommentOpen = () => {
    setCommentModalMode(ModalMode.ADD);
    comments.handleAddComment();
    setIsCommentModalOpen(true);
  };

  const handleEditCommentOpen = (comment: Comment) => {
    setCommentModalMode(ModalMode.EDIT);
    comments.handleEditComment(comment);
    setIsCommentModalOpen(true);
  };

  const handleCommentModalClose = () => {
    setIsCommentModalOpen(false);
    comments.resetCommentForm();
  };

  const handleCommentSubmit = async () => {
    if (commentModalMode === ModalMode.ADD) {
      await comments.addComment(user?.email);
    } else {
      if (!comments.selectedComment) return;
      const {id, author, user_email, created_at, ...updateData} = comments.commentFormData;
      await comments.updateComment(comments.selectedComment.id, updateData);
    }
    handleCommentModalClose();
  };

  // ============ Todo Handlers ============

  const handleAddTodoOpen = () => {
    todoForm.openAddMode();
    setIsTodoModalOpen(true);
  };

  const handleEditTodoOpen = (todo: TodoItem) => {
    todoForm.openEditMode(todo);
    setIsTodoModalOpen(true);
  };

  const handleTodoModalClose = () => {
    setIsTodoModalOpen(false);
    todoForm.resetForm();
  };

  const handleTodoSubmit = async () => {
    // Validate form
    const {valid, errors} = todoForm.validateForm();
    if (!valid) {
      errors.forEach(error => showToast.danger(error));
      return;
    }

    let success = false;

    if (todoForm.modalMode === ModalMode.ADD) {
      // Create new todo
      const insertData: TodoInsert = {
        ...todoForm.formData,
        user_email: user?.email || '',
        created_by: user?.email || '',
      };
      success = await todos.createTodo(insertData);
    } else {
      // Update existing todo
      if (!todoForm.selectedTodo) return;
      success = await todos.updateTodo(
        todoForm.selectedTodo.id,
        todoForm.formData
      );
    }

    if (success) {
      handleTodoModalClose();
    }
  };

  // ============ Delete Handlers ============

  const handleDeleteClick = (type: 'todo' | 'comment', id: string, title: string) => {
    setDeleteItem({type, id, title});
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    let success = false;
    if (deleteItem.type === 'todo') {
      success = await todos.deleteTodo(deleteItem.id);
    } else {
      success = await comments.deleteComment(deleteItem.id);
    }

    if (success) {
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteItem(null);
  };

  // ============ Render ============

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <AdminContainer>
      <TodoStatsCards todos={todos} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-4">
        <ToDoList
          todos={todos.filteredTodos}
          todosLoading={todos.todosLoading}
          handleAddTodo={handleAddTodoOpen}
          updateTodoStatus={todos.updateTodoStatus}
          deleteTodo={async (id: string) => {
            const todo = todos.todos.find((t) => t.id === id);
            handleDeleteClick('todo', id, todo?.title || 'Todo');
            return true; // Delete confirmation modal will handle actual deletion
          }}
          handleEditTodo={handleEditTodoOpen}
          currentFilter={todos.todoFilter}
        />

        <CommentsZone
          comments={comments.comments}
          commentsLoading={comments.commentsLoading}
          handleAddComment={handleAddCommentOpen}
          handleEditComment={handleEditCommentOpen}
          deleteComment={(id: string) => {
            const comment = comments.comments.find((c) => c.id === id);
            handleDeleteClick(
              'comment',
              id,
              comment?.content?.substring(0, 50) + '...' || 'Comment'
            );
          }}
          onAddCommentOpen={handleAddCommentOpen}
        />
      </div>

      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={handleTodoModalClose}
        todoFormData={todoForm.formData}
        setTodoFormData={todoForm.setFormData}
        onSubmit={handleTodoSubmit}
        mode={todoForm.modalMode}
      />

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={handleCommentModalClose}
        onSubmit={handleCommentSubmit}
        commentFormData={comments.commentFormData}
        setCommentFormData={comments.setCommentFormData}
        mode={commentModalMode}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteItem?.type === 'todo' ? 'Todo' : 'Comment'}`}
        message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
      />
    </AdminContainer>
  );
}
```

### Step 7: Update ToDoList Component (if needed)

**File:** `src/components/features/admin/ToDoList.tsx`

The component is already well-structured as a presentational component. No changes needed unless async handlers need special treatment.

### Step 8: Update TodoListItem Component (if needed)

**File:** `src/components/features/admin/TodoListItem.tsx`

Update to handle async operations if needed:

```typescript
// In the actions array, ensure async handlers work properly
actions={[
  {
    label: tAction.edit,
    onClick: () => handleEditTodo(todo),
    variant: 'light',
    buttonType: ActionTypes.UPDATE,
    isIconOnly: true,
    isDisabled: todo.status !== TodoStatuses.TODO,
  },
  {
    label: tAction.statusTransition,
    buttonType: ActionTypes.STATUS_TRANSITION,
    statusTransition: {
      currentStatus: todo.status,
      onStatusChange: async (id: string, status: TodoStatuses) => {
        await updateTodoStatus(id, status);
      },
      itemId: todo.id,
    },
  },
  {
    label: tAction.delete,
    onClick: async () => await deleteTodo(todo.id),
    variant: 'light',
    buttonType: ActionTypes.DELETE,
    color: 'danger',
    isIconOnly: true,
    isDisabled: todo.status !== TodoStatuses.TODO,
  },
]}
```

---

## Benefits of Refactored Architecture

### 1. **Separation of Concerns**
- ✅ Data fetching isolated in `useFetchTodos`
- ✅ Form state isolated in `useTodoForm`
- ✅ Business logic and state orchestration in `useTodos`

### 2. **Consistency**
- ✅ All API calls go through API routes (no direct Supabase calls)
- ✅ Follows the same pattern as other entities in the codebase
- ✅ Predictable hook behavior

### 3. **Maintainability**
- ✅ Each hook has a single, clear responsibility
- ✅ Easy to test each layer independently
- ✅ Easy to modify data fetching without touching business logic
- ✅ Easy to modify form behavior without touching CRUD operations

### 4. **Reusability**
- ✅ `useFetchTodos` can be used anywhere todos need to be fetched
- ✅ `useTodoForm` can be used in other contexts (e.g., quick-add forms)
- ✅ `useTodos` provides clean API for todo management

### 5. **Type Safety**
- ✅ Clear type boundaries between layers
- ✅ TodoFormData vs TodoItem distinction is clear
- ✅ No type casting or workarounds needed

---

## Migration Checklist

- [ ] **Step 1:** Update `useFetchTodos` with improvements
- [ ] **Step 2:** Update `useTodoForm` with setFormData
- [ ] **Step 3:** Refactor `useTodos` to use layered architecture
- [ ] **Step 4:** Update `TodoModal` to accept TodoFormData
- [ ] **Step 5:** Update type definitions in `todo.ts`
- [ ] **Step 6:** Refactor `AdminDashboard` page to use separated hooks
- [ ] **Step 7:** Test todo creation flow
- [ ] **Step 8:** Test todo editing flow
- [ ] **Step 9:** Test todo deletion flow
- [ ] **Step 10:** Test todo status updates
- [ ] **Step 11:** Test filtering and statistics
- [ ] **Step 12:** Test loading states
- [ ] **Step 13:** Test error handling
- [ ] **Step 14:** Remove old code and clean up
- [ ] **Step 15:** Update any other components using todo hooks

---

## Testing Strategy

### Unit Tests
1. **useFetchTodos**
   - Test successful fetch
   - Test error handling
   - Test loading states
   - Test refetch functionality

2. **useTodoForm**
   - Test form initialization
   - Test add mode
   - Test edit mode
   - Test validation
   - Test reset functionality

3. **useTodos**
   - Test CRUD operations
   - Test filtering logic
   - Test statistics calculation
   - Test error handling

### Integration Tests
1. Test full todo creation flow
2. Test full todo editing flow
3. Test full todo deletion flow
4. Test status transitions
5. Test filter changes
6. Test modal interactions

---

## API Routes Reference

### GET /api/todos
**Purpose:** Fetch all todos
**Auth:** Required (withAuth)
**Response:** `{data: TodoItem[]}`

### POST /api/todos
**Purpose:** Create new todo
**Auth:** Admin required (withAdminAuth)
**Body:** `TodoInsert`
**Response:** `{data: TodoItem}`

### GET /api/todos/[id]
**Purpose:** Fetch single todo
**Auth:** Required (withAuth)
**Response:** `{data: TodoItem}`

### PATCH /api/todos/[id]
**Purpose:** Update todo
**Auth:** Admin required (withAdminAuth)
**Body:** `TodoUpdate`
**Response:** `{data: TodoItem}`

### DELETE /api/todos/[id]
**Purpose:** Delete todo
**Auth:** Admin required (withAdminAuth)
**Response:** `{success: true}`

---

## Common Patterns in Codebase

Based on analysis of other entities (categories, members, seasons, clubs):

### Data Layer Pattern
```typescript
// hooks/entities/{entity}/data/useFetch{Entities}.ts
export function useFetch{Entities}() {
  const [data, setData] = useState<Entity[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    // Fetch via API_ROUTES
  }, []);

  return { data, loading, refetch: fetchData };
}
```

### State Layer Pattern
```typescript
// hooks/entities/{entity}/state/use{Entity}Form.ts
export function use{Entity}Form() {
  const [formData, setFormData] = useState<EntityFormData>(initialFormData);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => { /* ... */ }, []);
  const openEditMode = useCallback((item: Entity) => { /* ... */ }, []);
  const resetForm = useCallback(() => { /* ... */ }, []);
  const validateForm = useCallback(() => { /* ... */ }, [formData]);

  return { formData, setFormData, selectedEntity, modalMode, openAddMode, openEditMode, resetForm, validateForm };
}
```

### State Orchestration Pattern
```typescript
// hooks/entities/{entity}/state/use{Entities}.ts
export function use{Entities}() {
  const {data, loading, refetch} = useFetch{Entities}();

  // Local state for operations
  // Filtering logic
  // Statistics
  // CRUD operations via API routes

  return { entities, loading, create, update, delete, /* ... */ };
}
```

---

## Conclusion

This refactoring brings the Todo feature in line with the standard architecture used throughout the codebase. The separation of concerns makes the code more maintainable, testable, and reusable. The clear boundaries between data fetching, form state, and business logic reduce cognitive load and make future changes easier to implement.

**Next Steps:**
1. Follow the migration checklist in order
2. Test each step thoroughly before proceeding
3. Update any documentation or comments
4. Consider applying this pattern to other features that need refactoring

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Author:** Claude Code
**Status:** Ready for Implementation