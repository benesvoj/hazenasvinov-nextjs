# Todo Feature - Implementation Steps

## Quick Overview

Your todo hooks architecture is **excellent** (9.5/10). You just need to:
1. Fix some minor return types
2. Update the AdminDashboard page to use the new hook APIs

**Estimated Time:** 1-2 hours

---

## Step 1: Fix useTodos Return Types (15 min)

**File:** `src/hooks/entities/todo/state/useTodos.ts`

### Change 1: createTodo (Lines 13-36)

**Current:**
```typescript
const createTodo = useCallback(async (data: TodoInsert) => {
  try {
    setLoading(true);

    const res = await fetch(API_ROUTES.todos.root, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    })
    const response = await res.json();

    if (!res.ok || response.error) {
      throw new Error(response.error || 'Add todo failed');
    }

    showToast.success('Todo added successfully!');
    return response;  // ❌
  } catch (error) {
    console.error('Error adding todo:', error);
    showToast.danger('Failed to add todo');
  } finally {
    setLoading(false);
  }
}, []);
```

**Fix:**
```typescript
const createTodo = useCallback(async (data: TodoInsert): Promise<boolean> => {
  try {
    setLoading(true);

    const res = await fetch(API_ROUTES.todos.root, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    })
    const response = await res.json();

    if (!res.ok || response.error) {
      throw new Error(response.error || 'Add todo failed');
    }

    showToast.success('Todo added successfully!');
    return true;  // ✅
  } catch (error) {
    console.error('Error adding todo:', error);
    showToast.danger('Failed to add todo');
    return false;  // ✅
  } finally {
    setLoading(false);
  }
}, []);
```

### Change 2: updateTodo (Lines 38-61)

**Current:**
```typescript
const updateTodo = useCallback(
  async (id: string, updates: Partial<TodoUpdate>) => {
    try {
      setLoading(true);

      const res = await fetch(API_ROUTES.todos.byId(id), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updates),
      })
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Update failed');
      }
      showToast.success('Todo updated successfully!');
      return response;  // ❌
    } catch (error) {
      console.error('Error updating todo:', error);
      showToast.danger('Failed to update todo');
    } finally {
      setLoading(false);
    }
  }, []);
```

**Fix:**
```typescript
const updateTodo = useCallback(
  async (id: string, updates: Partial<TodoUpdate>): Promise<boolean> => {
    try {
      setLoading(true);

      const res = await fetch(API_ROUTES.todos.byId(id), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updates),
      })
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Update failed');
      }
      showToast.success('Todo updated successfully!');
      return true;  // ✅
    } catch (error) {
      console.error('Error updating todo:', error);
      showToast.danger('Failed to update todo');
      return false;  // ✅
    } finally {
      setLoading(false);
    }
  }, []);
```

### Change 3: deleteTodo (Lines 63-84)

**Current:**
```typescript
const deleteTodo = useCallback(
  async (id: string) => {
    try {
      setLoading(true);

      const res = await fetch(API_ROUTES.todos.byId(id), {
        method: 'DELETE',
      })
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Delete failed');
      }
      showToast.success('Todo deleted successfully!');
      return response;  // ❌
    } catch (error) {
      console.error('Error deleting todo:', error);
      showToast.danger('Failed to delete todo');
    } finally {
      setLoading(false);
    }
  }, []);
```

**Fix:**
```typescript
const deleteTodo = useCallback(
  async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      const res = await fetch(API_ROUTES.todos.byId(id), {
        method: 'DELETE',
      })
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Delete failed');
      }
      showToast.success('Todo deleted successfully!');
      return true;  // ✅
    } catch (error) {
      console.error('Error deleting todo:', error);
      showToast.danger('Failed to delete todo');
      return false;  // ✅
    } finally {
      setLoading(false);
    }
  }, []);
```

**✅ Step 1 Complete!** All CRUD operations now return `Promise<boolean>`.

---

## Step 2: Fix useTodoFiltering (5 min)

**File:** `src/hooks/entities/todo/business/useTodoFiltering.ts`

### Change 1: Fix String Literal (Line 33)

**Current:**
```typescript
const todoStats: TodoStats = {
  total: todos.length,
  todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
  inProgress: todos.filter((t) => t.status === 'in-progress').length,  // ❌
  done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
  highPriority: todos.filter(
    (t) =>
      (t.priority === TodoPriorities.HIGH || t.priority === TodoPriorities.URGENT) &&
      t.status !== TodoStatuses.DONE
  ).length,
};
```

**Fix:**
```typescript
const todoStats: TodoStats = {
  total: todos.length,
  todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
  inProgress: todos.filter((t) => t.status === TodoStatuses.IN_PROGRESS).length,  // ✅
  done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
  highPriority: todos.filter(
    (t) =>
      (t.priority === TodoPriorities.HIGH || t.priority === TodoPriorities.URGENT) &&
      t.status !== TodoStatuses.DONE
  ).length,
};
```

### Change 2: Add useMemo (Performance Optimization)

**Current:**
```typescript
import {TodoFilter, TodoPriorities, TodoStatuses} from "@/enums";
import {TodoItem, TodoStats} from "@/types";

interface TodoFilteringProps {
  todos: TodoItem[];
  todoFilter?: TodoFilter;
}

export const useTodoFiltering = ({todos, todoFilter}: TodoFilteringProps) => {
  // Filter todos based on current filter
  const filteredTodos = todos.filter((todo) => {
    // ... filter logic
  });

  const todoStats: TodoStats = {
    // ... stats logic
  };

  return {
    filteredTodos,
    todoStats,
  }
}
```

**Fix:**
```typescript
import {useMemo} from "react";  // ✅ Add import
import {TodoFilter, TodoPriorities, TodoStatuses} from "@/enums";
import {TodoItem, TodoStats} from "@/types";

interface TodoFilteringProps {
  todos: TodoItem[];
  todoFilter?: TodoFilter;
}

export const useTodoFiltering = ({todos, todoFilter}: TodoFilteringProps) => {
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
            (todo.priority === TodoPriorities.HIGH || todo.priority === TodoPriorities.URGENT) &&
            todo.status !== TodoStatuses.DONE
          );
        default:
          return true;
      }
    });
  }, [todos, todoFilter]);  // ✅ Only recalculates when these change

  const todoStats: TodoStats = useMemo(() => ({
    total: todos.length,
    todo: todos.filter((t) => t.status === TodoStatuses.TODO).length,
    inProgress: todos.filter((t) => t.status === TodoStatuses.IN_PROGRESS).length,
    done: todos.filter((t) => t.status === TodoStatuses.DONE).length,
    highPriority: todos.filter(
      (t) =>
        (t.priority === TodoPriorities.HIGH || t.priority === TodoPriorities.URGENT) &&
        t.status !== TodoStatuses.DONE
    ).length,
  }), [todos]);  // ✅ Only recalculates when todos change

  return {
    filteredTodos,
    todoStats,
  }
}
```

**✅ Step 2 Complete!** useTodoFiltering is now optimized and type-safe.

---

## Step 3: Update AdminDashboard Page (45 min)

**File:** `src/app/admin/page.tsx.backup`

This is the main change. The page needs to use the refactored hooks.

### Key Changes:

1. **Use 4 independent todo hooks** instead of old monolithic hook
2. **Add refetch after CRUD operations**
3. **Use todoForm for form state** instead of todos
4. **Add validation before submit**
5. **Check success before closing modal**

### Full Updated Implementation:

See the complete file in `docs/refactoring/TODO_HOOKS_CURRENT_ANALYSIS.md` under "Updated AdminDashboard Implementation" section.

**Key sections to change:**

#### A. Hook Initialization (Lines 31-39)

**Current:**
```typescript
// Use hooks
const {data} = useFetchTodos();
const todos = useTodos(user?.email);  // ❌ Wrong API
const {loadTodos, updateTodo, selectedTodo} = todos;
```

**Fix:**
```typescript
// ============ Todo Hooks (4 independent hooks) ============
const {data: todosData, loading: fetchLoading, refetch: refetchTodos} = useFetchTodos();
const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading: crudLoading} = useTodos();
const todoForm = useTodoForm();
const [todoFilter, setTodoFilter] = useState<TodoFilter>(TodoFilter.TODO);
const {filteredTodos, todoStats} = useTodoFiltering({
  todos: todosData || [],
  todoFilter
});
```

#### B. Data Loading (Lines 62-66)

**Current:**
```typescript
if (!loading && isAuthenticated && isAdmin) {
  loadTodos();
  loadComments();
}
```

**Fix:**
```typescript
if (!loading && isAuthenticated && isAdmin) {
  refetchTodos();  // ✅ Use refetch from useFetchTodos
  comments.loadComments();
}
```

#### C. Todo Modal Handlers

**Add these new handlers:**

```typescript
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
    await refetchTodos();  // ✅ Refresh data
    handleTodoModalClose();
  }
};
```

#### D. TodoStatsCards Props (Around line 169)

**Current:**
```typescript
<TodoStatsCards todos={todos} />
```

**Fix:**
```typescript
<TodoStatsCards
  stats={todoStats}
  currentFilter={todoFilter}
  onFilterChange={setTodoFilter}
/>
```

#### E. ToDoList Props (Around line 172)

**Current:**
```typescript
<ToDoList
  todos={todos.filteredTodos}
  todosLoading={todos.todosLoading}
  handleAddTodo={handleAddTodoOpen}
  updateTodoStatus={todos.updateTodoStatus}
  deleteTodo={(id: string) => {
    const todo = todos.todos.find((t) => t.id === id);
    handleDeleteClick('todo', id, todo?.title || 'Todo');
  }}
  handleEditTodo={handleEditTodoOpen}
  currentFilter={todos.todoFilter}
/>
```

**Fix:**
```typescript
<ToDoList
  todos={filteredTodos}
  todosLoading={fetchLoading || crudLoading}
  handleAddTodo={handleAddTodoOpen}
  updateTodoStatus={async (id: string, status: TodoStatuses) => {
    const success = await updateTodoStatus(id, status);
    if (success) await refetchTodos();  // ✅ Refetch
    return success;
  }}
  deleteTodo={async (id: string) => {
    const todo = todosData?.find((t) => t.id === id);
    handleDeleteClick('todo', id, todo?.title || 'Todo');
    return true;
  }}
  handleEditTodo={handleEditTodoOpen}
  currentFilter={todoFilter}
/>
```

#### F. TodoModal Props (Around line 202)

**Current:**
```typescript
<TodoModal
  isOpen={isTodoModalOpen}
  onClose={handleTodoModalClose}
  todoFormData={todos.todoFormData}       // ❌ Wrong
  setTodoFormData={todos.setTodoFormData} // ❌ Wrong
  onSubmit={handleTodoSubmit}
  mode={todoModalMode}
/>
```

**Fix:**
```typescript
<TodoModal
  isOpen={isTodoModalOpen}
  onClose={handleTodoModalClose}
  todoFormData={todoForm.formData}        // ✅ From todoForm
  setTodoFormData={todoForm.setFormData}  // ✅ From todoForm
  onSubmit={handleTodoSubmit}
  mode={todoForm.modalMode}               // ✅ From todoForm
/>
```

#### G. Delete Handler (Around line 107)

**Current:**
```typescript
const handleDeleteConfirm = async () => {
  if (!deleteItem) return;

  if (deleteItem.type === 'todo') {
    await todos.deleteTodo(deleteItem.id);
  } else {
    await comments.deleteComment(deleteItem.id);
  }

  setIsDeleteModalOpen(false);
  setDeleteItem(null);
};
```

**Fix:**
```typescript
const handleDeleteConfirm = async () => {
  if (!deleteItem) return;

  let success = false;
  if (deleteItem.type === 'todo') {
    success = await deleteTodo(deleteItem.id);
    if (success) await refetchTodos();  // ✅ Refetch
  } else {
    success = await comments.deleteComment(deleteItem.id);
  }

  if (success) {
    setIsDeleteModalOpen(false);
    setDeleteItem(null);
  }
};
```

#### H. Add Missing Import

**At the top of the file:**

```typescript
import {
  ToDoList,
  CommentsZone,
  AdminContainer,
  LoadingSpinner,
  DeleteConfirmationModal,
  showToast,  // ✅ Add this
} from '@/components';
import {ModalMode, TodoFilter, TodoStatuses} from '@/enums';  // ✅ Add TodoFilter
import {
  useFetchTodos,  // ✅ Add this
  useTodos,
  useTodoForm,    // ✅ Add this
  useTodoFiltering,  // ✅ Add this
  useComments,
} from '@/hooks';
```

**✅ Step 3 Complete!** AdminDashboard now uses the refactored hooks correctly.

---

## Step 4: Update Hook Exports (5 min)

**File:** `src/hooks/index.ts`

Make sure all hooks are exported:

```typescript
// Todo hooks
export { useFetchTodos } from './entities/todo/data/useFetchTodos';
export { useTodos } from './entities/todo/state/useTodos';
export { useTodoForm } from './entities/todo/state/useTodoForm';
export { useTodoFiltering } from './entities/todo/business/useTodoFiltering';
```

---

## Step 5: Test (30 min)

### Manual Testing Checklist

1. **Create Todo**
   - [ ] Click "Add Todo" button
   - [ ] Fill in form
   - [ ] Click "Save"
   - [ ] Verify toast appears
   - [ ] Verify list refreshes
   - [ ] Verify todo appears in list

2. **Edit Todo**
   - [ ] Click edit button on a todo
   - [ ] Modify fields
   - [ ] Click "Save"
   - [ ] Verify toast appears
   - [ ] Verify list refreshes
   - [ ] Verify changes appear

3. **Delete Todo**
   - [ ] Click delete button on a todo
   - [ ] Confirm deletion
   - [ ] Verify toast appears
   - [ ] Verify list refreshes
   - [ ] Verify todo removed

4. **Change Status**
   - [ ] Click status button on a todo
   - [ ] Verify toast appears
   - [ ] Verify list refreshes
   - [ ] Verify status updated

5. **Filter Todos**
   - [ ] Click "All" filter - see all todos
   - [ ] Click "Todo" filter - see only todo status
   - [ ] Click "In Progress" filter - see only in-progress
   - [ ] Click "Done" filter - see only done
   - [ ] Click "High Priority" filter - see urgent/high that aren't done

6. **Statistics**
   - [ ] Verify total count is correct
   - [ ] Verify "Todo" count is correct
   - [ ] Verify "In Progress" count is correct
   - [ ] Verify "Done" count is correct
   - [ ] Verify "High Priority" count is correct

7. **Loading States**
   - [ ] Loading spinner appears during data fetch
   - [ ] Loading state during CRUD operations
   - [ ] No flickering

8. **Error Handling**
   - [ ] Disconnect network
   - [ ] Try to create todo - see error toast
   - [ ] Try to update todo - see error toast
   - [ ] Reconnect network - verify recovery

9. **Console**
   - [ ] No console errors
   - [ ] No console warnings
   - [ ] No React warnings

---

## Quick Reference: What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **useTodos API** | `useTodos(email)` | `useTodos()` |
| **Data source** | `todos.filteredTodos` | `useTodoFiltering({todos, filter})` |
| **Form state** | `todos.todoFormData` | `todoForm.formData` |
| **CRUD returns** | `void` or `response` | `Promise<boolean>` |
| **Data refresh** | Automatic | Manual via `refetch()` |
| **Hook count** | 2 (fetch + todos) | 4 (fetch + todos + form + filtering) |

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

1. **Revert useTodos changes:**
   ```bash
   git checkout HEAD -- src/hooks/entities/todo/state/useTodos.ts
   ```

2. **Revert useTodoFiltering changes:**
   ```bash
   git checkout HEAD -- src/hooks/entities/todo/business/useTodoFiltering.ts
   ```

3. **Revert page changes:**
   ```bash
   git checkout HEAD -- src/app/admin/page.tsx.backup
   ```

---

## Success Criteria

✅ **You're done when:**
- All CRUD operations work
- Filtering works
- Statistics are correct
- No console errors
- All tests pass
- Loading states work
- Error handling works
- Code follows the new architecture

---

## Summary

**Total Time:** ~1-2 hours

| Step | Time | Difficulty | Status |
|------|------|-----------|--------|
| 1. Fix useTodos | 15 min | Easy | ⏳ |
| 2. Fix useTodoFiltering | 5 min | Easy | ⏳ |
| 3. Update AdminDashboard | 45 min | Medium | ⏳ |
| 4. Update exports | 5 min | Easy | ⏳ |
| 5. Test everything | 30 min | Medium | ⏳ |

**Your hooks are already excellent!** You just need to:
1. Make return types consistent
2. Update the page to use the new APIs
3. Test everything

---

**Need Help?** Check the full implementations in:
- `docs/refactoring/TODO_HOOKS_CURRENT_ANALYSIS.md`
- `docs/refactoring/TODO_ARCHITECTURE_FINAL.md`