# ToDoList Component Refactoring Guide (CORRECTED)

## Overview
This document provides the **corrected** refactoring guide following the actual architectural pattern used in your codebase: **independent hooks that don't call each other**.

**Status:** Ready for implementation
**Date:** 2025-11-11
**Pattern:** Independent hooks orchestrated at component level

---

## ❌ WRONG Pattern (from previous guide)

```typescript
// ❌ DON'T DO THIS - Hooks calling other hooks
export function useTodos() {
  const {data, loading, refetch} = useFetchTodos();  // ❌ Wrong!
  // ...
}
```

## ✅ CORRECT Pattern (your codebase)

```typescript
// ✅ Component orchestrates independent hooks
export default function AdminDashboard() {
  const {data} = useFetchTodos();           // Independent
  const todos = useTodos(user?.email);      // Independent
  const todoForm = useTodoForm();           // Independent

  // Component coordinates between them
}
```

---

## Architectural Principle

### **Each Hook is Standalone**
- `useFetchTodos` - Simple data fetching (read-only)
- `useTodos` - Complex state management with CRUD
- `useTodoForm` - Form state management

### **Component Orchestrates**
The component decides:
- Which hooks to use
- When to fetch data
- How to combine data from different sources

---

## Current Issues in useTodos

Looking at `src/hooks/entities/todo/state/useTodos.ts`:

### Issue 1: Direct Supabase Calls (Lines 76-98)
```typescript
const loadTodos = useCallback(async () => {
  const supabase = createClient();  // ❌ Direct Supabase
  const {data} = await supabase.from('todos').select('*')
}, []);
```
**Fix:** Use API route with fetch

### Issue 2: Direct Supabase Call (Lines 187-194)
```typescript
const updateTodoStatus = useCallback(async (id: string, status: string) => {
  const supabase = createClient();  // ❌ Direct Supabase
  const {error} = await supabase.from('todos').update({status})
}, [loadTodos]);
```
**Fix:** Use API route with fetch

### Issue 3: Missing Import (Line 76)
```typescript
const supabase = createClient();  // ❌ createClient not imported
```

### Issue 4: Form State in Wrong Hook (Lines 34-35, 210-234)
```typescript
const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
const [todoFormData, setTodoFormData] = useState<TodoItem>(getDefaultTodoFormData());

// ... later
const resetTodoForm = useCallback(() => { ... });
const handleAddTodo = useCallback(() => { ... });
const handleEditTodo = useCallback((todo: TodoItem) => { ... });
```
**Fix:** Remove form state (use `useTodoForm` separately)

### Issue 5: No Data Refetch After CRUD (Lines 107-181)
```typescript
const createTodo = useCallback(async (data: TodoInsert) => {
  // ... create todo
  showToast.success('Todo added successfully!');
  return response;  // ❌ Doesn't refetch data
}, []);
```
**Fix:** Call `loadTodos()` after successful operations

### Issue 6: No Return Values (Lines 23-26)
```typescript
createTodo: () => Promise<void>;    // ❌ Can't tell if succeeded
updateTodo: (...) => Promise<void>;
deleteTodo: (...) => Promise<void>;
```
**Fix:** Return `Promise<boolean>` to indicate success/failure

### Issue 7: Missing getDefaultTodoFormData (Line 35)
```typescript
const [todoFormData, setTodoFormData] = useState<TodoItem>(getDefaultTodoFormData());
// ❌ Function not defined in file
```

---

## Refactoring Steps

### Step 1: Fix useFetchTodos (Minor Improvements)

**File:** `src/hooks/entities/todo/data/useFetchTodos.ts`

**Changes:**
- Remove auto-fetch on mount (line 31-33) - let component control
- Add error response check
- Improve error handling

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
      setData([]);
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

**Key Changes:**
- ✅ Added response error check (line 19-21)
- ✅ Set empty array on error (line 26)
- ✅ Removed useEffect (let component control when to fetch)

---

### Step 2: Enhance useTodoForm

**File:** `src/hooks/entities/todo/state/useTodoForm.ts`

**Changes:**
- Add `setFormData` to return object
- Fix date formatting

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
  due_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
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
    setFormData,        // ✅ ADDED - needed by TodoModal
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

**Key Changes:**
- ✅ Added `setFormData` to return object (line 62)
- ✅ Fixed date format to YYYY-MM-DD (line 14)

---

### Step 3: Refactor useTodos (Main Changes)

**File:** `src/hooks/entities/todo/state/useTodos.ts`

**Complete Rewrite:**

```typescript
'use client';

import {useCallback, useMemo, useState} from 'react';

import {showToast} from '@/components';
import {TodoFilter, TodoPriorities, TodoStatuses} from '@/enums';
import {API_ROUTES} from "@/lib";
import {TodoInsert, TodoItem, TodoStats, TodoUpdate} from '@/types';

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
  // State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [todoFilter, setTodoFilter] = useState<TodoFilter>(TodoFilter.TODO);
  const [isOperating, setIsOperating] = useState(false);

  // Filter todos based on current filter (memoized)
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

  // Calculate statistics (memoized)
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

  // Load todos via API route
  const loadTodos = useCallback(async () => {
    try {
      setTodosLoading(true);

      const res = await fetch(API_ROUTES.todos.root);
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to load todos');
      }

      setTodos(response.data || []);
    } catch (error: any) {
      console.error('Error loading todos:', error);
      showToast.danger('Failed to load todos');
      setTodos([]);
    } finally {
      setTodosLoading(false);
    }
  }, []);

  // Create todo via API route
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
      await loadTodos(); // ✅ Refetch data
      return true;
    } catch (error) {
      console.error('Error creating todo:', error);
      showToast.danger('Failed to create todo');
      return false;
    } finally {
      setIsOperating(false);
    }
  }, [loadTodos]);

  // Update todo via API route
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
        await loadTodos(); // ✅ Refetch data
        return true;
      } catch (error) {
        console.error('Error updating todo:', error);
        showToast.danger('Failed to update todo');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [loadTodos]
  );

  // Delete todo via API route
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
        await loadTodos(); // ✅ Refetch data
        return true;
      } catch (error) {
        console.error('Error deleting todo:', error);
        showToast.danger('Failed to delete todo');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [loadTodos]
  );

  // Update todo status via API route
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
        await loadTodos(); // ✅ Refetch data
        return true;
      } catch (error) {
        console.error('Error updating todo status:', error);
        showToast.danger('Failed to update todo status');
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [loadTodos]
  );

  return {
    // State
    todos,
    todosLoading: todosLoading || isOperating,
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

**Key Changes:**
1. ✅ Removed direct Supabase calls - all use API routes via fetch
2. ✅ Removed form state (lines 34-35, 210-234 deleted)
3. ✅ Removed form handlers (handleAddTodo, handleEditTodo, resetTodoForm)
4. ✅ Added `useMemo` for filteredTodos and todoStats (performance)
5. ✅ All CRUD operations return `Promise<boolean>`
6. ✅ All CRUD operations call `loadTodos()` after success
7. ✅ Added `isOperating` state for operation loading state
8. ✅ Changed `todosLoading` initial state to `false` (component controls when to load)
9. ✅ Removed unused state variables (line 37-38)
10. ✅ Fixed import (removed `createClient`)
11. ✅ Removed missing `getDefaultTodoFormData` function

---

### Step 4: Update Type Definitions

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
  todoFormData: TodoFormData;  // ✅ CHANGED from TodoItem
  setTodoFormData: (todoFormData: TodoFormData) => void;  // ✅ CHANGED from TodoItem
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
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;  // ✅ CHANGED return type
  deleteTodo: (id: string) => Promise<boolean>;  // ✅ CHANGED return type
  handleEditTodo: (todo: TodoItem) => void;
  currentFilter?: string;
}

export interface TodoListItemProps {
  todo: TodoItem;
  handleEditTodo: (todo: TodoItem) => void;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;  // ✅ CHANGED return type
  deleteTodo: (id: string) => Promise<boolean>;  // ✅ CHANGED return type
}
```

**Key Changes:**
- ✅ `TodoModalProps.todoFormData` changed to `TodoFormData` (line 13)
- ✅ `TodoModalProps.setTodoFormData` accepts `TodoFormData` (line 14)
- ✅ `ToDoListProps.updateTodoStatus` returns `Promise<boolean>` (line 30)
- ✅ `ToDoListProps.deleteTodo` returns `Promise<boolean>` (line 31)
- ✅ `TodoListItemProps.updateTodoStatus` returns `Promise<boolean>` (line 40)
- ✅ `TodoListItemProps.deleteTodo` returns `Promise<boolean>` (line 41)

---

### Step 5: Update TodoModal Component

**File:** `src/app/admin/components/modals/TodoModal.tsx`

**Changes:**
- Accept `TodoFormData` instead of `TodoItem`
- Handle optional fields safely

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
        value={todoFormData.description || ''}  {/* ✅ Handle optional */}
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
          value={todoFormData.due_date || ''}  {/* ✅ Handle optional */}
          onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
        />
      </div>
    </UnifiedModal>
  );
};
```

**Key Changes:**
- ✅ Import `TodoFormData` instead of `TodoItem` (line 3)
- ✅ Handle optional description (line 51)
- ✅ Handle optional due_date (line 96)

---

### Step 6: Update Admin Page

**File:** `src/app/admin/page.tsx`

**Complete rewrite to use independent hooks:**

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
  showToast,
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

  // ✅ Independent hooks - no dependencies between them
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

  // Load data on mount (component controls when to load)
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
            return true; // Delete confirmation modal handles actual deletion
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

**Key Changes:**
1. ✅ Three independent hooks: `useTodos()`, `useTodoForm()`, `useComments()` (lines 30-32)
2. ✅ Component controls when to load data via `useEffect` (lines 46-62)
3. ✅ Form state comes from `todoForm`, not `todos` (lines 125, 231-233)
4. ✅ Validation before submit (lines 118-122)
5. ✅ Proper user_email and created_by assignment (lines 128-131)
6. ✅ Check success before closing modal (lines 143-145)
7. ✅ Import `showToast` (line 13)

---

### Step 7: Update TodoListItem (Minor)

**File:** `src/components/features/admin/TodoListItem.tsx`

No changes needed - component already accepts async handlers. The type changes will be handled automatically.

---

### Step 8: Update ToDoList (Minor)

**File:** `src/components/features/admin/ToDoList.tsx`

No changes needed - component is already a pure presentational component.

---

## Migration Checklist

- [ ] **Step 1:** Update `useFetchTodos` (remove useEffect)
- [ ] **Step 2:** Update `useTodoForm` (add setFormData)
- [ ] **Step 3:** Refactor `useTodos` (remove form state, fix Supabase calls, add returns)
- [ ] **Step 4:** Update type definitions (TodoFormData, Promise<boolean>)
- [ ] **Step 5:** Update `TodoModal` (accept TodoFormData)
- [ ] **Step 6:** Refactor `AdminDashboard` page (use independent hooks)
- [ ] **Step 7:** Test todo creation flow
- [ ] **Step 8:** Test todo editing flow
- [ ] **Step 9:** Test todo deletion flow
- [ ] **Step 10:** Test todo status updates
- [ ] **Step 11:** Test filtering and statistics
- [ ] **Step 12:** Test loading states
- [ ] **Step 13:** Test error handling
- [ ] **Step 14:** Verify no console errors/warnings
- [ ] **Step 15:** Clean up any unused imports

---

## Summary of Changes

### Files Modified
1. ✅ `useFetchTodos.ts` - Minor cleanup
2. ✅ `useTodoForm.ts` - Add setFormData
3. ✅ `useTodos.ts` - Major refactor (remove form state, fix API calls)
4. ✅ `todo.ts` - Update type definitions
5. ✅ `TodoModal.tsx` - Accept TodoFormData
6. ✅ `page.tsx` - Use independent hooks

### Files NOT Modified
- ✅ `ToDoList.tsx` - No changes
- ✅ `TodoListItem.tsx` - No changes
- ✅ API routes - No changes

---

## Benefits

1. **✅ Independence:** Each hook is standalone and testable
2. **✅ Consistency:** All API calls go through API routes (no direct Supabase)
3. **✅ Clarity:** Component orchestrates data flow explicitly
4. **✅ Flexibility:** Can use `useFetchTodos` for read-only scenarios
5. **✅ Type Safety:** Proper types with no casting needed
6. **✅ Maintainability:** Single responsibility per hook

---

## Testing Strategy

### Manual Testing Order
1. Create a new todo
2. Edit the todo
3. Change todo status
4. Delete the todo
5. Test filtering (all, todo, in-progress, done, high-priority)
6. Test validation (empty title, empty description)
7. Test loading states
8. Test error handling (disconnect network)

### Expected Results
- ✅ All CRUD operations work identically to before
- ✅ No console errors or warnings
- ✅ Loading states display correctly
- ✅ Toasts show for all operations
- ✅ Data refreshes after all CRUD operations
- ✅ Filtering works correctly
- ✅ Statistics update in real-time

---

**Document Version:** 2.0 (Corrected)
**Last Updated:** 2025-11-11
**Pattern:** Independent Hooks Orchestrated at Component Level
**Status:** Ready for Implementation