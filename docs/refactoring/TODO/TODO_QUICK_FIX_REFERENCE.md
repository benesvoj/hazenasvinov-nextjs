# Todo Quick Fix Reference

## What Needs to Be Fixed

### Current useTodos Issues

Looking at `src/hooks/entities/todo/state/useTodos.ts`:

#### ❌ Issue 1: Direct Supabase Call in loadTodos (Lines 76-98)
```typescript
// CURRENT (WRONG)
const loadTodos = useCallback(async () => {
  const supabase = createClient();  // ❌ Direct Supabase
  const {data, error} = await supabase
    .from('todos')
    .select('*')
    .order('created_at', {ascending: false});
}, []);
```

```typescript
// FIX (CORRECT)
const loadTodos = useCallback(async () => {
  const res = await fetch(API_ROUTES.todos.root);  // ✅ Use API
  const response = await res.json();
  setTodos(response.data || []);
}, []);
```

---

#### ❌ Issue 2: Direct Supabase Call in updateTodoStatus (Lines 187-194)
```typescript
// CURRENT (WRONG)
const updateTodoStatus = useCallback(async (id: string, status: string) => {
  const supabase = createClient();  // ❌ Direct Supabase
  const {error} = await supabase.from('todos').update({status}).eq('id', id);
  setTimeout(() => loadTodos(), 100);  // ❌ Timeout hack
}, [loadTodos]);
```

```typescript
// FIX (CORRECT)
const updateTodoStatus = useCallback(async (id: string, status: TodoStatuses): Promise<boolean> => {
  const res = await fetch(API_ROUTES.todos.byId(id), {  // ✅ Use API
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({status}),
  });
  const response = await res.json();

  if (!res.ok || response.error) {
    showToast.danger('Failed to update status');
    return false;
  }

  await loadTodos();  // ✅ No timeout, direct await
  return true;
}, [loadTodos]);
```

---

#### ❌ Issue 3: Missing Import (Line 76)
```typescript
// CURRENT (WRONG)
const supabase = createClient();  // ❌ Not imported
```

```typescript
// FIX (CORRECT)
// Remove this - we're using API routes, not Supabase directly
```

---

#### ❌ Issue 4: Form State in Wrong Hook (Lines 34-35, 210-234)
```typescript
// CURRENT (WRONG)
const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
const [todoFormData, setTodoFormData] = useState<TodoItem>(getDefaultTodoFormData());

const resetTodoForm = useCallback(() => { ... });
const handleAddTodo = useCallback(() => { ... });
const handleEditTodo = useCallback((todo: TodoItem) => { ... });

return {
  // ...
  selectedTodo,        // ❌ Form state
  todoFormData,        // ❌ Form state
  setSelectedTodo,     // ❌ Form action
  setTodoFormData,     // ❌ Form action
  handleAddTodo,       // ❌ Form action
  handleEditTodo,      // ❌ Form action
  resetTodoForm,       // ❌ Form action
};
```

```typescript
// FIX (CORRECT)
// Remove all form state - use useTodoForm instead

return {
  todos,
  todosLoading,
  todoFilter,
  filteredTodos,
  todoStats,
  setTodoFilter,
  loadTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  updateTodoStatus,
};
```

---

#### ❌ Issue 5: No Return Values (Lines 23-26)
```typescript
// CURRENT (WRONG)
createTodo: () => Promise<void>;    // ❌ Can't tell if succeeded
updateTodo: (...) => Promise<void>;
deleteTodo: (...) => Promise<void>;
```

```typescript
// FIX (CORRECT)
createTodo: (data: TodoInsert) => Promise<boolean>;    // ✅ Returns success
updateTodo: (id: string, updates: TodoUpdate) => Promise<boolean>;
deleteTodo: (id: string) => Promise<boolean>;
updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;
```

---

#### ❌ Issue 6: No Data Refetch After CRUD (Lines 107-181)
```typescript
// CURRENT (WRONG)
const createTodo = useCallback(async (data: TodoInsert) => {
  const res = await fetch(API_ROUTES.todos.root, {...});
  showToast.success('Todo added successfully!');
  return response;  // ❌ Doesn't refetch
}, []);
```

```typescript
// FIX (CORRECT)
const createTodo = useCallback(async (data: TodoInsert): Promise<boolean> => {
  try {
    const res = await fetch(API_ROUTES.todos.root, {...});
    if (!res.ok) return false;

    showToast.success('Todo created successfully!');
    await loadTodos();  // ✅ Refetch after create
    return true;
  } catch (error) {
    showToast.danger('Failed to create todo');
    return false;
  }
}, [loadTodos]);  // ✅ Add dependency
```

---

#### ❌ Issue 7: Missing getDefaultTodoFormData Function (Line 35)
```typescript
// CURRENT (WRONG)
const [todoFormData, setTodoFormData] = useState<TodoItem>(getDefaultTodoFormData());
// ❌ Function doesn't exist in file
```

```typescript
// FIX (CORRECT)
// Remove this state entirely - use useTodoForm hook instead
```

---

#### ❌ Issue 8: Not Using useMemo (Lines 41-70)
```typescript
// CURRENT (WRONG)
const filteredTodos = todos.filter((todo) => { ... });  // ❌ Recalculates every render
const todoStats: TodoStats = { ... };                   // ❌ Recalculates every render
```

```typescript
// FIX (CORRECT)
const filteredTodos = useMemo(() => {
  return todos.filter((todo) => { ... });
}, [todos, todoFilter]);  // ✅ Only recalculates when deps change

const todoStats: TodoStats = useMemo(() => ({
  total: todos.length,
  // ...
}), [todos]);  // ✅ Only recalculates when todos change
```

---

## Complete Fixed useTodos Hook

See `docs/refactoring/TODO_LIST_REFACTORING_GUIDE_CORRECTED.md` Step 3 for the complete implementation.

---

## Files to Change

### 1. useTodos.ts (Major Changes)
- Remove direct Supabase calls
- Remove form state
- Add return values (Promise<boolean>)
- Add refetch after CRUD
- Add useMemo for performance
- Fix imports

### 2. useTodoForm.ts (Minor)
- Add `setFormData` to return object

### 3. useFetchTodos.ts (Minor)
- Add error response check
- Remove auto-fetch useEffect

### 4. page.tsx.backup (Moderate)
- Use three independent hooks
- Add validation before submit
- Check success before closing modal
- Import showToast

### 5. todo.ts (Minor)
- Change TodoModalProps to use TodoFormData
- Change return types to Promise<boolean>

### 6. TodoModal.tsx (Minor)
- Import TodoFormData instead of TodoItem
- Handle optional fields

---

## Quick Test Checklist

After making changes:
1. ✅ Create a todo - should show success toast and refresh list
2. ✅ Edit a todo - should show success toast and refresh list
3. ✅ Delete a todo - should show success toast and refresh list
4. ✅ Change status - should show success toast and refresh list
5. ✅ Filter todos - should work correctly
6. ✅ Check statistics - should update correctly
7. ✅ Open dev tools - no console errors
8. ✅ Check network tab - all requests go to /api/todos

---

## Files That DON'T Need Changes

- ✅ `ToDoList.tsx` - Already correct
- ✅ `TodoListItem.tsx` - Already correct
- ✅ `API routes` - Already correct
- ✅ `TodoStatsCards.tsx` - Already correct

---

## Key Architectural Points

### ✅ DO
- Keep hooks independent (don't call other custom hooks)
- Use API routes for all data access
- Return success/failure from CRUD operations
- Refetch data after mutations
- Let component orchestrate between hooks

### ❌ DON'T
- Call useFetchTodos from useTodos
- Use direct Supabase calls in hooks
- Mix form state with data state
- Return void from CRUD operations
- Use setTimeout hacks for data consistency

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-11-11
**See Full Guide:** `TODO_LIST_REFACTORING_GUIDE_CORRECTED.md`