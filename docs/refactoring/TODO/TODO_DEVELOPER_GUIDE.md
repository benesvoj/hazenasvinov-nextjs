# Todo Feature - Developer Guide

## 🎯 Quick Start

This guide helps you work with the TODO feature. Read this if you need to:
- Add todo functionality to a new page
- Modify existing todo behavior
- Fix bugs
- Add new features

---

## 📖 Table of Contents

1. [Basic Usage](#basic-usage)
2. [Hook Reference](#hook-reference)
3. [Common Patterns](#common-patterns)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

---

## Basic Usage

### Scenario 1: Display Read-Only Todo List

```typescript
'use client';

import {useFetchTodos} from '@/hooks';
import {LoadingSpinner} from '@/components';

export default function MyPage() {
  const {data: todos, loading} = useFetchTodos();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {todos?.map(todo => (
        <div key={todo.id}>
          <h3>{todo.title}</h3>
          <p>{todo.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### Scenario 2: Display Todo List with Filtering

```typescript
'use client';

import {useState} from 'react';
import {useFetchTodos, useTodoFiltering} from '@/hooks';
import {TodoFilter} from '@/enums';

export default function MyPage() {
  const {data: todos, loading} = useFetchTodos();
  const [filter, setFilter] = useState(TodoFilter.ALL);
  const {filteredTodos, todoStats} = useTodoFiltering({
    todos: todos || [],
    todoFilter: filter
  });

  return (
    <div>
      {/* Filter buttons */}
      <button onClick={() => setFilter(TodoFilter.TODO)}>
        Todo ({todoStats.todo})
      </button>
      <button onClick={() => setFilter(TodoFilter.IN_PROGRESS)}>
        In Progress ({todoStats.inProgress})
      </button>
      <button onClick={() => setFilter(TodoFilter.DONE)}>
        Done ({todoStats.done})
      </button>

      {/* Todo list */}
      {filteredTodos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

---

### Scenario 3: Full CRUD Todo Management

```typescript
'use client';

import {useState} from 'react';
import {
  useFetchTodos,
  useTodos,
  useTodoForm,
  useTodoFiltering
} from '@/hooks';
import {TodoFilter, TodoStatuses, ModalMode} from '@/enums';
import {TodoInsert} from '@/types';

export default function MyPage() {
  // Data fetching
  const {data: todos, loading, refetch} = useFetchTodos();

  // CRUD operations
  const {createTodo, updateTodo, deleteTodo, updateTodoStatus} = useTodos();

  // Form management
  const todoForm = useTodoForm();

  // Filtering
  const [filter, setFilter] = useState(TodoFilter.ALL);
  const {filteredTodos, todoStats} = useTodoFiltering({
    todos: todos || [],
    todoFilter: filter
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add todo
  const handleAdd = () => {
    todoForm.openAddMode();
    setIsModalOpen(true);
  };

  // Edit todo
  const handleEdit = (todo: TodoItem) => {
    todoForm.openEditMode(todo);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    const {valid, errors} = todoForm.validateForm();
    if (!valid) {
      errors.forEach(err => console.error(err));
      return;
    }

    let success = false;
    if (todoForm.modalMode === ModalMode.ADD) {
      const data: TodoInsert = {
        ...todoForm.formData,
        user_email: 'user@example.com',
        created_by: 'user@example.com',
      };
      success = await createTodo(data);
    } else {
      if (todoForm.selectedTodo) {
        success = await updateTodo(todoForm.selectedTodo.id, todoForm.formData);
      }
    }

    if (success) {
      await refetch();
      setIsModalOpen(false);
      todoForm.resetForm();
    }
  };

  // Delete todo
  const handleDelete = async (id: string) => {
    const success = await deleteTodo(id);
    if (success) await refetch();
  };

  // Update status
  const handleStatusChange = async (id: string, status: TodoStatuses) => {
    const success = await updateTodoStatus(id, status);
    if (success) await refetch();
  };

  return (
    <div>
      <button onClick={handleAdd}>Add Todo</button>

      {filteredTodos.map(todo => (
        <div key={todo.id}>
          <h3>{todo.title}</h3>
          <button onClick={() => handleEdit(todo)}>Edit</button>
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
          <button onClick={() => handleStatusChange(todo.id, TodoStatuses.DONE)}>
            Mark Done
          </button>
        </div>
      ))}

      {/* Your modal component */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <input
            value={todoForm.formData.title}
            onChange={e => todoForm.setFormData({
              ...todoForm.formData,
              title: e.target.value
            })}
          />
          <button onClick={handleSubmit}>Submit</button>
        </Modal>
      )}
    </div>
  );
}
```

---

## Hook Reference

### `useFetchTodos()`

**Purpose**: Fetch todos from API

**Returns**:
```typescript
{
  data: TodoItem[] | null;    // Todos array or null
  loading: boolean;           // Loading state
  refetch: () => Promise<void>;  // Manual refetch function
}
```

**Usage**:
```typescript
const {data, loading, refetch} = useFetchTodos();

// Initial load happens automatically
// Manual refetch after CRUD:
await refetch();
```

**Notes**:
- Fetches on mount (no need to call refetch initially)
- Returns `null` initially, then `TodoItem[]`
- Handles errors with toast notifications
- Does NOT auto-refetch after CRUD (you must call refetch manually)

---

### `useTodos()`

**Purpose**: CRUD operations

**Returns**:
```typescript
{
  loading: boolean;
  createTodo: (data: TodoInsert) => Promise<boolean>;
  updateTodo: (id: string, updates: TodoUpdate) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<boolean>;
  updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;
}
```

**Usage**:
```typescript
const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading} = useTodos();

// Create
const success = await createTodo({
  title: 'My Todo',
  description: 'Description',
  priority: TodoPriorities.MEDIUM,
  status: TodoStatuses.TODO,
  category: TodoCategories.IMPROVEMENT,
  due_date: '2025-12-31',
  user_email: 'user@example.com',
  created_by: 'user@example.com',
});

// Update
const success = await updateTodo('todo-id', {
  title: 'Updated Title',
  priority: TodoPriorities.HIGH,
});

// Delete
const success = await deleteTodo('todo-id');

// Update status
const success = await updateTodoStatus('todo-id', TodoStatuses.DONE);
```

**Notes**:
- All operations return `Promise<boolean>` (true = success, false = failure)
- Shows toast notifications automatically
- Requires admin authentication (enforced by API)
- Does NOT refetch data (you must call refetch from useFetchTodos)

---

### `useTodoForm()`

**Purpose**: Form state management

**Returns**:
```typescript
{
  // State
  formData: TodoFormData;
  setFormData: (data: TodoFormData) => void;
  selectedTodo: TodoItem | null;
  modalMode: ModalMode;

  // Actions
  openAddMode: () => void;
  openEditMode: (item: TodoItem) => void;
  resetForm: () => void;
  validateForm: () => {valid: boolean; errors: string[]};
}
```

**Usage**:
```typescript
const todoForm = useTodoForm();

// Open add mode
todoForm.openAddMode();

// Open edit mode
todoForm.openEditMode(todoItem);

// Update form data
todoForm.setFormData({
  ...todoForm.formData,
  title: 'New Title'
});

// Validate
const {valid, errors} = todoForm.validateForm();
if (!valid) {
  errors.forEach(err => console.error(err));
}

// Reset
todoForm.resetForm();
```

**Validation Rules**:
- `title` is required (non-empty)
- `description` is required (non-empty)

**Default Values**:
```typescript
{
  title: '',
  description: '',
  priority: TodoPriorities.MEDIUM,
  status: TodoStatuses.TODO,
  category: TodoCategories.IMPROVEMENT,
  due_date: new Date().toISOString().split('T')[0],
  user_email: '',
  assigned_to: '',
  created_by: ''
}
```

---

### `useTodoFiltering({todos, todoFilter})`

**Purpose**: Filter and compute statistics

**Parameters**:
```typescript
{
  todos: TodoItem[];           // Array of todos to filter
  todoFilter?: TodoFilter;     // Filter to apply (optional)
}
```

**Returns**:
```typescript
{
  filteredTodos: TodoItem[];   // Filtered array
  todoStats: {
    total: number;             // Total count
    todo: number;              // Count with status=TODO
    inProgress: number;        // Count with status=IN_PROGRESS
    done: number;              // Count with status=DONE
    highPriority: number;      // Count with HIGH/URGENT priority (not done)
  }
}
```

**Usage**:
```typescript
const {filteredTodos, todoStats} = useTodoFiltering({
  todos: todosData || [],
  todoFilter: TodoFilter.TODO
});
```

**Filter Options**:
- `TodoFilter.ALL` - All todos
- `TodoFilter.TODO` - Only status === TODO
- `TodoFilter.IN_PROGRESS` - Only status === IN_PROGRESS
- `TodoFilter.DONE` - Only status === DONE
- `TodoFilter.HIGH_PRIORITY` - Only HIGH/URGENT priority (not done)

**Notes**:
- Pure function - no side effects
- Memoized for performance
- Can be used with any todo array (not tied to useFetchTodos)

---

## Common Patterns

### Pattern 1: Optimistic Updates

```typescript
// ❌ Bad: Wait for server response
const handleStatusChange = async (id: string, status: TodoStatuses) => {
  await updateTodoStatus(id, status);
  await refetch();  // User waits for server
};

// ✅ Good: Update UI immediately
const handleStatusChange = async (id: string, status: TodoStatuses) => {
  // Update local state immediately
  const updatedTodos = todos.map(todo =>
    todo.id === id ? {...todo, status} : todo
  );
  setLocalTodos(updatedTodos);

  // Update server in background
  const success = await updateTodoStatus(id, status);
  if (!success) {
    // Rollback on failure
    setLocalTodos(todos);
    await refetch();
  }
};
```

---

### Pattern 2: Batch Operations

```typescript
const handleBulkDelete = async (ids: string[]) => {
  const promises = ids.map(id => deleteTodo(id));
  const results = await Promise.all(promises);

  const allSuccess = results.every(r => r === true);
  if (allSuccess) {
    await refetch();
  }
};
```

---

### Pattern 3: Conditional Filtering

```typescript
const {filteredTodos} = useTodoFiltering({
  todos: todos || [],
  todoFilter: userIsAdmin ? TodoFilter.ALL : TodoFilter.TODO
});
```

---

### Pattern 4: Search + Filter

```typescript
const [searchTerm, setSearchTerm] = useState('');
const {filteredTodos} = useTodoFiltering({
  todos: todos || [],
  todoFilter: filter
});

const searchedTodos = filteredTodos.filter(todo =>
  todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  todo.description.toLowerCase().includes(searchTerm.toLowerCase())
);
```

---

## Troubleshooting

### Issue: Todos not updating after CRUD operation

**Cause**: Forgot to call `refetch()`

**Solution**:
```typescript
const success = await createTodo(data);
if (success) {
  await refetch();  // ✅ Don't forget this!
}
```

---

### Issue: Form validation not working

**Cause**: Not checking validation before submit

**Solution**:
```typescript
const handleSubmit = async () => {
  const {valid, errors} = todoForm.validateForm();  // ✅ Validate first
  if (!valid) {
    errors.forEach(err => showToast.danger(err));
    return;  // ✅ Stop if invalid
  }

  // Continue with submit...
};
```

---

### Issue: Stats not updating

**Cause**: Not passing updated todos to `useTodoFiltering`

**Solution**:
```typescript
// ❌ Bad: Using stale data
const {todoStats} = useTodoFiltering({
  todos: oldTodos,
  todoFilter: filter
});

// ✅ Good: Using fresh data
const {data: todos} = useFetchTodos();
const {todoStats} = useTodoFiltering({
  todos: todos || [],  // ✅ Fresh data
  todoFilter: filter
});
```

---

### Issue: Filter not working

**Cause**: Wrong filter enum value

**Solution**:
```typescript
// ❌ Bad: Using string
setTodoFilter('todo');

// ✅ Good: Using enum
setTodoFilter(TodoFilter.TODO);
```

---

### Issue: "Cannot read property 'map' of undefined"

**Cause**: Todos is `null` initially

**Solution**:
```typescript
// ❌ Bad: Assumes todos exists
{todos.map(todo => ...)}

// ✅ Good: Handle null case
{todos?.map(todo => ...) || <p>No todos</p>}

// ✅ Better: Use filteredTodos (always an array)
const {filteredTodos} = useTodoFiltering({
  todos: todos || [],  // Convert null to []
  todoFilter: filter
});
{filteredTodos.map(todo => ...)}
```

---

## Best Practices

### 1. Always Use Enums

```typescript
// ❌ Bad: Magic strings
todo.status === 'todo'
todo.priority === 'high'

// ✅ Good: Type-safe enums
todo.status === TodoStatuses.TODO
todo.priority === TodoPriorities.HIGH
```

---

### 2. Handle Loading States

```typescript
const {data: todos, loading} = useFetchTodos();
const {loading: crudLoading} = useTodos();

if (loading || crudLoading) {
  return <LoadingSpinner />;
}
```

---

### 3. Always Validate Forms

```typescript
const {valid, errors} = todoForm.validateForm();
if (!valid) {
  errors.forEach(err => showToast.danger(err));
  return;
}
```

---

### 4. Refetch After CRUD

```typescript
const success = await createTodo(data);
if (success) {
  await refetch();  // ✅ Always refetch
}
```

---

### 5. Use TypeScript Types

```typescript
import {TodoItem, TodoInsert, TodoUpdate} from '@/types';

// ✅ Type-safe operations
const data: TodoInsert = { /* ... */ };
const success = await createTodo(data);
```

---

### 6. Keep Components Simple

```typescript
// ❌ Bad: Component does everything
function TodoPage() {
  // 500 lines of logic
}

// ✅ Good: Break into smaller components
function TodoPage() {
  return (
    <>
      <TodoStats stats={todoStats} />
      <TodoFilters filter={filter} onFilterChange={setFilter} />
      <TodoList todos={filteredTodos} />
    </>
  );
}
```

---

### 7. Handle Edge Cases

```typescript
// Empty state
if (todos?.length === 0) {
  return <EmptyState />;
}

// Error state
if (error) {
  return <ErrorMessage />;
}

// Loading state
if (loading) {
  return <LoadingSpinner />;
}
```

---

## API Reference

### Endpoints

```
GET    /api/todos           - Get all todos
POST   /api/todos           - Create todo (admin only)
GET    /api/todos/:id       - Get todo by ID
PATCH  /api/todos/:id       - Update todo (admin only)
DELETE /api/todos/:id       - Delete todo (admin only)
```

### Authentication

- `GET` endpoints: Requires any authenticated user
- `POST`, `PATCH`, `DELETE`: Requires admin user

---

## Examples from Codebase

### Example 1: AdminDashboard Page
**File**: `src/app/admin/page.tsx.backup`

Full example of CRUD todo management with filtering, modals, and delete confirmation.

### Example 2: TodoStatsCards
**File**: `src/app/admin/components/dashboard/TodoStatsCards.tsx`

Example of displaying statistics with clickable filter cards.

### Example 3: ToDoList
**File**: `src/components/features/admin/ToDoList.tsx`

Example of displaying todos with pagination and sorting.

---

## Quick Command Reference

### Add todo functionality to existing page:

1. Import hooks:
```typescript
import {useFetchTodos, useTodos, useTodoForm, useTodoFiltering} from '@/hooks';
```

2. Use hooks in component:
```typescript
const {data, refetch} = useFetchTodos();
const {createTodo} = useTodos();
```

3. Add UI:
```typescript
{data?.map(todo => <div key={todo.id}>{todo.title}</div>)}
```

---

## Getting Help

1. Check `TODO_REFACTORING_COMPLETION.md` for architecture overview
2. Check `TODO_ARCHITECTURE_FINAL.md` for detailed architecture
3. Review `src/app/admin/page.tsx.backup` for complete example
4. Check hook source code in `src/hooks/entities/todo/`

---

**Last Updated**: 2025-11-11
**Maintainer**: Development Team