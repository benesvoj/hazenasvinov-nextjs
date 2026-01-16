# Todo Hooks - Current Implementation Analysis

## Overview

**Analysis Date:** 2025-11-11
**Status:** ✅ Hooks are well-structured, but page needs update

---

## Current Hook Architecture

Your todo hooks have been refactored into a **clean 4-layer architecture**:

```
hooks/entities/todo/
├── data/
│   └── useFetchTodos.ts          ✅ Data fetching
├── state/
│   ├── useTodos.ts               ✅ CRUD operations
│   └── useTodoForm.ts            ✅ Form state management
└── business/
    └── useTodoFiltering.ts       ✅ Filtering & statistics
```

This is **excellent separation of concerns**! Each layer has a single, clear responsibility.

---

## Hook Analysis

### 1. useFetchTodos (Data Layer) ✅

**Location:** `src/hooks/entities/todo/data/useFetchTodos.ts`

**Purpose:** Simple data fetching via API

```typescript
export function useFetchTodos() {
  const [data, setData] = useState<TodoItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async() => {
    // Fetches from API_ROUTES.todos.root
    setData(response.data || []);
  }, []);

  return { data, loading, refetch: fetchData };
}
```

**Strengths:**
- ✅ Uses API routes (not direct Supabase)
- ✅ Clean error handling with toast
- ✅ Sets empty array on error
- ✅ Simple and focused

**Issues:**
- ⚠️ No `useEffect` to call `fetchData` - component must call `refetch()` manually (this is actually fine, gives component control)

**Rating:** 9/10 - Excellent

---

### 2. useTodos (State Layer - CRUD) ✅

**Location:** `src/hooks/entities/todo/state/useTodos.ts`

**Purpose:** CRUD operations only (no filtering, no stats, no form state)

```typescript
export const useTodos = () => {
  const [loading, setLoading] = useState(false);

  const createTodo = useCallback(async (data: TodoInsert) => {
    // POST to API_ROUTES.todos.root
    return response; // ⚠️ Should return boolean
  }, []);

  const updateTodo = useCallback(async (id: string, updates: TodoUpdate) => {
    // PATCH to API_ROUTES.todos.byId(id)
    return response; // ⚠️ Should return boolean
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    // DELETE to API_ROUTES.todos.byId(id)
    return response; // ⚠️ Should return boolean
  }, []);

  const updateTodoStatus = useCallback(async (id: string, status: TodoStatuses) => {
    // PATCH to API_ROUTES.todos.byId(id)
    return true; // ✅ Returns boolean
  }, []);

  return { loading, createTodo, updateTodo, deleteTodo, updateTodoStatus };
}
```

**Strengths:**
- ✅ Focused only on CRUD operations
- ✅ Uses API routes consistently
- ✅ Good error handling with toasts
- ✅ No form state (separated correctly)
- ✅ No filtering logic (separated correctly)
- ✅ Clean and simple

**Issues:**
- ⚠️ `createTodo` returns `response` instead of `boolean` (line 29)
- ⚠️ `updateTodo` returns `response` instead of `boolean` (line 54)
- ⚠️ `deleteTodo` returns `response` instead of `boolean` (line 77)
- ⚠️ No data refetch after CRUD operations (component must handle this)
- ⚠️ Missing TypeScript return types in function signatures

**Recommendation:**
Make all CRUD operations return `Promise<boolean>` for consistency:

```typescript
const createTodo = useCallback(async (data: TodoInsert): Promise<boolean> => {
  try {
    // ... operation
    showToast.success('Todo created successfully!');
    return true;
  } catch (error) {
    showToast.danger('Failed to create todo');
    return false;
  }
}, []);
```

**Rating:** 8/10 - Very good, minor consistency improvements needed

---

### 3. useTodoForm (State Layer - Form) ✅

**Location:** `src/hooks/entities/todo/state/useTodoForm.ts`

**Purpose:** Form state management and validation

```typescript
export const useTodoForm = () => {
  const [formData, setFormData] = useState<TodoFormData>(initialFormData);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => { ... }, []);
  const openEditMode = useCallback((item: TodoItem) => { ... }, []);
  const resetForm = useCallback(() => { ... }, []);
  const validateForm = useCallback(() => { ... }, [formData]);

  return {
    formData,
    setFormData,        // ✅ Present
    selectedTodo,
    modalMode,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  };
}
```

**Strengths:**
- ✅ Complete form state management
- ✅ Has `setFormData` (needed by TodoModal)
- ✅ Mode management (add/edit)
- ✅ Validation logic
- ✅ Clean separation from CRUD
- ✅ Date formatted correctly (YYYY-MM-DD)

**Issues:**
- None! This hook is perfect.

**Rating:** 10/10 - Perfect

---

### 4. useTodoFiltering (Business Layer) ✅⭐

**Location:** `src/hooks/entities/todo/business/useTodoFiltering.ts`

**Purpose:** Filtering and statistics calculation

```typescript
interface TodoFilteringProps {
  todos: TodoItem[];
  todoFilter?: TodoFilter;
}

export const useTodoFiltering = ({todos, todoFilter}: TodoFilteringProps) => {
  const filteredTodos = todos.filter((todo) => {
    switch (todoFilter) {
      case TodoFilter.TODO: return todo.status === TodoStatuses.TODO;
      case TodoFilter.IN_PROGRESS: return todo.status === TodoStatuses.IN_PROGRESS;
      case TodoFilter.DONE: return todo.status === TodoStatuses.DONE;
      case TodoFilter.HIGH_PRIORITY: return /* high priority logic */;
      default: return true;
    }
  });

  const todoStats: TodoStats = {
    total: todos.length,
    todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
    inProgress: todos.filter((t) => t.status === 'in-progress').length,
    done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
    highPriority: todos.filter(/* high priority logic */).length,
  };

  return { filteredTodos, todoStats };
}
```

**Strengths:**
- ✅⭐ **Excellent separation** - business logic in separate layer
- ✅ Pure function (takes data, returns computed values)
- ✅ Reusable across different components
- ✅ No side effects
- ✅ Easy to test
- ✅ Clear single responsibility

**Issues:**
- ⚠️ Line 33: Uses string literal `'in-progress'` instead of `TodoStatuses.IN_PROGRESS`
- ⚠️ No `useMemo` for performance optimization (recalculates on every render)

**Recommendation:**
Add `useMemo` for performance:

```typescript
export const useTodoFiltering = ({todos, todoFilter}: TodoFilteringProps) => {
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => { ... });
  }, [todos, todoFilter]);

  const todoStats: TodoStats = useMemo(() => ({
    total: todos.length,
    // ...
  }), [todos]);

  return { filteredTodos, todoStats };
}
```

**Rating:** 9/10 - Excellent design, minor performance optimization needed

---

## Comparison with Refactoring Guide

### What I Suggested
```typescript
// Monolithic useTodos with everything
export function useTodos() {
  // Data fetching
  // CRUD operations
  // Filtering
  // Statistics
  // All in one hook
}
```

### What You Actually Built ⭐
```typescript
// Separated into 4 independent hooks
useFetchTodos()      // Data fetching
useTodos()           // CRUD operations
useTodoForm()        // Form state
useTodoFiltering()   // Business logic
```

**Your architecture is BETTER than my suggestion!** The business layer separation is particularly elegant.

---

## How They Work Together

### Component Orchestration Pattern

```typescript
export default function AdminDashboard() {
  // 1. Fetch data
  const {data: todosData, loading: fetchLoading, refetch} = useFetchTodos();

  // 2. CRUD operations
  const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading: crudLoading} = useTodos();

  // 3. Form state
  const {formData, setFormData, modalMode, openAddMode, openEditMode, validateForm, resetForm} = useTodoForm();

  // 4. Filtering and stats
  const [todoFilter, setTodoFilter] = useState(TodoFilter.TODO);
  const {filteredTodos, todoStats} = useTodoFiltering({
    todos: todosData || [],
    todoFilter
  });

  // Load data on mount
  useEffect(() => {
    refetch();
  }, []);

  // CRUD with refetch
  const handleCreate = async () => {
    const success = await createTodo(formData);
    if (success) {
      await refetch();  // Refresh data
      resetForm();
    }
  };

  const handleUpdate = async (id: string) => {
    const success = await updateTodo(id, formData);
    if (success) {
      await refetch();  // Refresh data
    }
  };

  return (
    <div>
      <TodoStatsCards stats={todoStats} />
      <TodoFilterButtons current={todoFilter} onChange={setTodoFilter} />
      <TodoList
        todos={filteredTodos}
        loading={fetchLoading || crudLoading}
        onEdit={openEditMode}
        onDelete={async (id) => {
          const success = await deleteTodo(id);
          if (success) await refetch();
        }}
      />
      <TodoModal
        formData={formData}
        setFormData={setFormData}
        onSubmit={modalMode === ModalMode.ADD ? handleCreate : handleUpdate}
      />
    </div>
  );
}
```

---

## Current Page Implementation Gap

Looking at `src/app/admin/page.tsx.backup:32-34`:

```typescript
// ❌ Current (OLD API - doesn't match new hooks)
const {data} = useFetchTodos();
const todos = useTodos(user?.email);  // ❌ useTodos doesn't take params
const {loadTodos, updateTodo, selectedTodo} = todos;  // ❌ Wrong API
```

**Problems:**
1. `useTodos()` doesn't accept `user?.email` parameter
2. `useTodos()` doesn't return `loadTodos`, `selectedTodo` (old API)
3. Missing `useTodoForm()` hook usage
4. Missing `useTodoFiltering()` hook usage
5. Form state is still mixed with CRUD state

**Needs Update To:**
```typescript
// ✅ Correct (NEW API - matches refactored hooks)
const {data: todosData, refetch} = useFetchTodos();
const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading: crudLoading} = useTodos();
const todoForm = useTodoForm();
const [todoFilter, setTodoFilter] = useState(TodoFilter.TODO);
const {filteredTodos, todoStats} = useTodoFiltering({
  todos: todosData || [],
  todoFilter
});
```

---

## Recommendations

### Immediate Fixes (High Priority)

#### 1. Fix useTodos Return Types
```typescript
// Change these functions to return Promise<boolean>
const createTodo = async (data: TodoInsert): Promise<boolean> => {
  try {
    // ... operation
    return true;
  } catch {
    return false;
  }
};
```

#### 2. Fix useTodoFiltering String Literal
```typescript
// Line 33 - Change from:
inProgress: todos.filter((t) => t.status === 'in-progress').length,

// To:
inProgress: todos.filter((t) => t.status === TodoStatuses.IN_PROGRESS).length,
```

#### 3. Update AdminDashboard Page
Update the page to use the new hook APIs (see full implementation below).

---

### Performance Optimizations (Medium Priority)

#### 1. Add useMemo to useTodoFiltering
```typescript
const filteredTodos = useMemo(() => {
  return todos.filter(...);
}, [todos, todoFilter]);

const todoStats = useMemo(() => ({
  total: todos.length,
  // ...
}), [todos]);
```

---

### Nice-to-Have Improvements (Low Priority)

#### 1. Add TypeScript Return Types
```typescript
// useTodos.ts
export const useTodos = (): UseTodosReturn => {
  // ...
}

interface UseTodosReturn {
  loading: boolean;
  createTodo: (data: TodoInsert) => Promise<boolean>;
  updateTodo: (id: string, updates: TodoUpdate) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<boolean>;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;
}
```

---

## Updated AdminDashboard Implementation

**File:** `src/app/admin/page.tsx.backup`

Here's how the page should use the refactored hooks:

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
import {ModalMode, TodoFilter, TodoStatuses} from '@/enums';
import {
  useFetchTodos,
  useTodos,
  useTodoForm,
  useTodoFiltering,
  useComments,
} from '@/hooks';
import {Comment, TodoItem, TodoInsert} from '@/types';

import {TodoModal, TodoStatsCards, CommentModal} from './components';

interface DeleteItem {
  type: 'todo' | 'comment';
  id: string;
  title: string;
}

export default function AdminDashboard() {
  const {user, userProfile, loading, isAuthenticated, isAdmin} = useUser();

  // ============ Todo Hooks (4 independent hooks) ============
  const {data: todosData, loading: fetchLoading, refetch: refetchTodos} = useFetchTodos();
  const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading: crudLoading} = useTodos();
  const todoForm = useTodoForm();
  const [todoFilter, setTodoFilter] = useState<TodoFilter>(TodoFilter.TODO);
  const {filteredTodos, todoStats} = useTodoFiltering({
    todos: todosData || [],
    todoFilter
  });

  // ============ Comment Hooks ============
  const comments = useComments(user?.email);

  // ============ Modal State ============
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentModalMode, setCommentModalMode] = useState<ModalMode>(ModalMode.ADD);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem | null>(null);

  // ============ Authentication & Data Loading ============
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
      refetchTodos();
      comments.loadComments();
    }
  }, [loading, isAuthenticated, isAdmin]);

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
    // Validate
    const {valid, errors} = todoForm.validateForm();
    if (!valid) {
      errors.forEach(error => showToast.danger(error));
      return;
    }

    let success = false;

    if (todoForm.modalMode === ModalMode.ADD) {
      // Create
      const insertData: TodoInsert = {
        ...todoForm.formData,
        user_email: user?.email || '',
        created_by: user?.email || '',
      };
      success = await createTodo(insertData);
    } else {
      // Update
      if (!todoForm.selectedTodo) return;
      success = await updateTodo(todoForm.selectedTodo.id, todoForm.formData);
    }

    if (success) {
      await refetchTodos();  // Refresh data
      handleTodoModalClose();
    }
  };

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

  // ============ Delete Handlers ============

  const handleDeleteClick = (type: 'todo' | 'comment', id: string, title: string) => {
    setDeleteItem({type, id, title});
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    let success = false;
    if (deleteItem.type === 'todo') {
      success = await deleteTodo(deleteItem.id);
      if (success) await refetchTodos();
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
      <TodoStatsCards
        stats={todoStats}
        currentFilter={todoFilter}
        onFilterChange={setTodoFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-4">
        <ToDoList
          todos={filteredTodos}
          todosLoading={fetchLoading || crudLoading}
          handleAddTodo={handleAddTodoOpen}
          updateTodoStatus={async (id: string, status: TodoStatuses) => {
            const success = await updateTodoStatus(id, status);
            if (success) await refetchTodos();
            return success;
          }}
          deleteTodo={async (id: string) => {
            const todo = todosData?.find((t) => t.id === id);
            handleDeleteClick('todo', id, todo?.title || 'Todo');
            return true; // Modal handles actual deletion
          }}
          handleEditTodo={handleEditTodoOpen}
          currentFilter={todoFilter}
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
1. ✅ Four independent todo hooks (lines 33-39)
2. ✅ Component orchestrates data flow
3. ✅ Refetch after CRUD operations
4. ✅ Validation before submit
5. ✅ Check success before closing modal

---

## Summary

### Hook Status

| Hook | Status | Rating | Issues |
|------|--------|--------|--------|
| `useFetchTodos` | ✅ Good | 9/10 | None |
| `useTodos` | ✅ Good | 8/10 | Return types |
| `useTodoForm` | ✅ Perfect | 10/10 | None |
| `useTodoFiltering` | ✅⭐ Excellent | 9/10 | String literal, useMemo |

### Architecture Quality

**Overall Rating:** ⭐⭐⭐⭐⭐ 9.5/10

**Strengths:**
- ✅ Excellent separation of concerns
- ✅ Business layer is particularly elegant
- ✅ Each hook has single responsibility
- ✅ Easy to test independently
- ✅ Reusable across different contexts
- ✅ No coupling between hooks

**What Makes This Better Than My Refactoring Guide:**
1. **Business Layer Separation** - `useTodoFiltering` is pure and reusable
2. **Cleaner API** - Each hook does exactly one thing
3. **Better Testability** - Pure functions easy to test
4. **More Flexible** - Can use hooks in different combinations

---

## Action Items

### High Priority (Do Now)
- [ ] Fix `useTodos` return types (Promise<boolean>)
- [ ] Fix string literal in `useTodoFiltering` (line 33)
- [ ] Update `AdminDashboard` page to use new hook APIs

### Medium Priority (Do Soon)
- [ ] Add `useMemo` to `useTodoFiltering`
- [ ] Add TypeScript return type interfaces to `useTodos`

### Low Priority (Nice to Have)
- [ ] Add JSDoc comments to hooks
- [ ] Create hook usage examples in documentation

---

**Architecture Pattern:** ⭐ 4-Layer Independent Hooks
**Status:** Hooks are excellent, page needs update
**Recommendation:** Update page, make minor hook improvements