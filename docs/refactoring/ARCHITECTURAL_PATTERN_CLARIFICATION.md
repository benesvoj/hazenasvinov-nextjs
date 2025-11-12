# Architectural Pattern Clarification

## ❌ Wrong Pattern vs ✅ Correct Pattern

### What Was Wrong in Original Guide

The original refactoring guide suggested that `useTodos` should call `useFetchTodos`:

```typescript
// ❌ WRONG - Hooks calling other custom hooks
export function useTodos() {
  const {data, loading, refetch} = useFetchTodos();  // ❌ BAD!

  // Use the data from useFetchTodos...
  return { ... };
}
```

**Why This Is Wrong:**
- Creates tight coupling between hooks
- Makes testing harder (need to mock useFetchTodos)
- Hides dependencies (not obvious what data source is used)
- Violates the independence principle

---

## ✅ Correct Pattern: Independent Hooks

### Your Codebase Pattern

Looking at `src/app/admin/page.tsx`:

```typescript
export default function AdminDashboard() {
  // ✅ CORRECT - Independent hooks orchestrated at component level
  const {data} = useFetchTodos();           // Standalone
  const todos = useTodos(user?.email);      // Standalone
  const todoForm = useTodoForm();           // Standalone

  // Component coordinates between them
}
```

**Why This Is Correct:**
- ✅ Each hook is independent and self-contained
- ✅ Component has full control over data flow
- ✅ Easy to test each hook in isolation
- ✅ Dependencies are explicit and visible
- ✅ Flexible - can use hooks separately or together

---

## The Two Hook Patterns

### Pattern A: Simple Data Hook (useFetchTodos)

**Purpose:** Simple data fetching for read-only scenarios

```typescript
export function useFetchTodos() {
  const [data, setData] = useState<TodoItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    // Fetch via API
    const res = await fetch(API_ROUTES.todos.root);
    const response = await res.json();
    setData(response.data || []);
  }, []);

  return { data, loading, refetch: fetchData };
}
```

**Use Cases:**
- Quick data display without CRUD operations
- Read-only todo lists
- Dashboard statistics
- Data export features

---

### Pattern B: State Management Hook (useTodos)

**Purpose:** Full state management with CRUD operations

```typescript
export function useTodos() {
  // ✅ Own internal state - NOT calling useFetchTodos
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Own loadTodos method
  const loadTodos = useCallback(async () => {
    const res = await fetch(API_ROUTES.todos.root);
    const response = await res.json();
    setTodos(response.data || []);
  }, []);

  // CRUD operations with automatic refetch
  const createTodo = useCallback(async (data) => {
    await fetch(API_ROUTES.todos.root, { method: 'POST', body: JSON.stringify(data) });
    await loadTodos();  // Refetch after create
    return true;
  }, [loadTodos]);

  // Filtering logic
  const filteredTodos = useMemo(() => {
    return todos.filter(...);
  }, [todos, filter]);

  // Statistics
  const stats = useMemo(() => ({
    total: todos.length,
    // ...
  }), [todos]);

  return {
    todos,
    loading,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    filteredTodos,
    stats,
  };
}
```

**Use Cases:**
- Admin pages with CRUD operations
- Todo management interfaces
- Any scenario needing filtering, statistics, and operations

---

## Component Orchestration Examples

### Example 1: Admin Page (Full CRUD)

```typescript
export default function AdminDashboard() {
  // Use the FULL STATE hook
  const todos = useTodos();
  const todoForm = useTodoForm();

  useEffect(() => {
    // Component controls when to load
    todos.loadTodos();
  }, []);

  const handleCreate = async () => {
    const success = await todos.createTodo(todoForm.formData);
    if (success) {
      todoForm.resetForm();
    }
  };

  return (
    <div>
      <TodoStats stats={todos.stats} />
      <TodoList todos={todos.filteredTodos} />
      <TodoModal form={todoForm} onSubmit={handleCreate} />
    </div>
  );
}
```

---

### Example 2: Public Dashboard (Read-Only)

```typescript
export default function PublicDashboard() {
  // Use the SIMPLE DATA hook
  const {data: todos, loading} = useFetchTodos();

  useEffect(() => {
    // Component controls when to load
    refetch();
  }, []);

  // No CRUD operations needed
  return (
    <div>
      <TodoList todos={todos} loading={loading} />
    </div>
  );
}
```

---

### Example 3: Combining Both (Advanced)

```typescript
export default function AdvancedPage() {
  // Use BOTH hooks independently
  const {data: publicTodos} = useFetchTodos();  // Public todos
  const myTodos = useTodos();                    // My todos with CRUD

  useEffect(() => {
    // Load different data sources
    publicTodos.refetch();
    myTodos.loadTodos();
  }, []);

  return (
    <div>
      <PublicSection todos={publicTodos} />
      <MySection
        todos={myTodos.filteredTodos}
        onCreate={myTodos.createTodo}
        onUpdate={myTodos.updateTodo}
      />
    </div>
  );
}
```

---

## Key Principles

### 1. Independence
**Each hook is self-contained and doesn't depend on other custom hooks**

```typescript
// ✅ GOOD
export function useTodos() {
  const [todos, setTodos] = useState([]);  // Own state
  // ... own logic
}

// ❌ BAD
export function useTodos() {
  const {data} = useFetchTodos();  // Depends on another hook
  // ... logic using data
}
```

---

### 2. Component Orchestration
**Component decides which hooks to use and how to combine them**

```typescript
// ✅ GOOD - Component coordinates
function MyComponent() {
  const data = useFetchTodos();
  const state = useTodos();
  const form = useTodoForm();

  // Component combines them
}

// ❌ BAD - Hook coordinates
function useTodos() {
  const data = useFetchTodos();  // Hook does the combining
  const form = useTodoForm();    // Hidden from component
}
```

---

### 3. Explicit Dependencies
**All dependencies should be visible at the component level**

```typescript
// ✅ GOOD - Clear dependencies
function MyComponent() {
  const todos = useTodos();        // I can see what hooks are used
  const form = useTodoForm();      // Dependencies are explicit

  // I control the flow
  const handleSubmit = () => {
    todos.createTodo(form.data);
  };
}

// ❌ BAD - Hidden dependencies
function MyComponent() {
  const todos = useTodos();  // What does this use internally? 🤷

  // Hidden dependencies, harder to understand
}
```

---

## When to Use Which Hook

### Use `useFetchTodos` When:
- ✅ You only need to display data (read-only)
- ✅ You don't need filtering or statistics
- ✅ You don't need CRUD operations
- ✅ You want a lightweight solution
- ✅ Component handles all business logic

### Use `useTodos` When:
- ✅ You need CRUD operations (create, update, delete)
- ✅ You need filtering or statistics
- ✅ You need complex state management
- ✅ You want the hook to handle business logic
- ✅ You're building an admin interface

### Use `useTodoForm` When:
- ✅ You need form state management
- ✅ You need form validation
- ✅ You need add/edit mode handling
- ✅ You want to separate form logic from data logic

---

## Comparison with Other Entities

### Categories (Follows Pattern ✅)
```typescript
// admin/categories/page.tsx
const {data: categories} = useFetchCategories();  // Independent
const categoryState = useCategories();             // Independent

// Component orchestrates
```

### Members (Follows Pattern ✅)
```typescript
// admin/members/page.tsx
const {data: members} = useFetchMembers();  // Independent
const memberForm = useMemberForm();         // Independent (inferred)

// Component orchestrates
```

### Todos (NOW Follows Pattern ✅)
```typescript
// admin/page.tsx
const {data} = useFetchTodos();   // Independent
const todos = useTodos();          // Independent
const todoForm = useTodoForm();    // Independent

// Component orchestrates
```

---

## Summary: What Changed

### Original Guide (WRONG ❌)
```typescript
// useTodos calls useFetchTodos
export function useTodos() {
  const {data, loading, refetch} = useFetchTodos();  // ❌ Coupling
  // ...
}

// Component only uses useTodos
function MyComponent() {
  const todos = useTodos();  // Hidden: uses useFetchTodos internally
}
```

### Corrected Guide (RIGHT ✅)
```typescript
// useTodos is independent
export function useTodos() {
  const [todos, setTodos] = useState([]);  // ✅ Own state

  const loadTodos = async () => {
    const res = await fetch(API_ROUTES.todos.root);
    setTodos(res.data);
  };
  // ...
}

// Component uses both independently
function MyComponent() {
  const {data} = useFetchTodos();  // ✅ Explicit
  const todos = useTodos();         // ✅ Explicit
  const form = useTodoForm();       // ✅ Explicit

  // Component orchestrates
}
```

---

## Testing Benefits

### Independent Hooks (Correct Pattern)

```typescript
// ✅ Easy to test each hook independently
describe('useTodos', () => {
  it('should load todos', async () => {
    const {result} = renderHook(() => useTodos());
    await act(() => result.current.loadTodos());
    expect(result.current.todos).toHaveLength(3);
  });
});

describe('useTodoForm', () => {
  it('should validate form', () => {
    const {result} = renderHook(() => useTodoForm());
    const {valid} = result.current.validateForm();
    expect(valid).toBe(false);
  });
});
```

### Coupled Hooks (Wrong Pattern)

```typescript
// ❌ Hard to test - need to mock dependencies
describe('useTodos', () => {
  it('should load todos', async () => {
    // ❌ Need to mock useFetchTodos
    jest.mock('../data/useFetchTodos');

    const {result} = renderHook(() => useTodos());
    // More complex setup...
  });
});
```

---

## Final Recommendations

1. **✅ Keep hooks independent** - No custom hook should call another custom hook
2. **✅ Component orchestrates** - Let the component coordinate between hooks
3. **✅ Explicit dependencies** - Make all data sources visible at component level
4. **✅ Single responsibility** - Each hook does one thing well
5. **✅ Prefer composition** - Use multiple small hooks over one large hook

---

**Pattern Type:** Independent Hooks with Component Orchestration
**Status:** Clarified and Corrected
**Applies To:** All entity hooks in the codebase