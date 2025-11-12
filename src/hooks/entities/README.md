# Entity Hooks - Naming Conventions & Best Practices

This document defines the naming conventions and organizational structure for all entity hooks in the application.

## Table of Contents
- [Folder Structure](#folder-structure)
- [Naming Conventions](#naming-conventions)
- [Function Naming Inside Hooks](#function-naming-inside-hooks)
- [Quick Decision Tree](#quick-decision-tree)
- [Examples from Codebase](#examples-from-codebase)

---

## Folder Structure

All entity hooks are organized into three main categories:

```
hooks/entities/[entity]/
├── data/          # Data fetching (read-only)
├── state/         # State management & CRUD operations
└── business/      # Complex business logic
```

### `data/` - Data Fetching
**Purpose**: Read-only data fetching operations

- Direct API queries
- Data retrieval operations
- Returns `{data, loading, error}`
- **NO** mutations (create/update/delete)

### `state/` - State Management
**Purpose**: CRUD operations, form state, mutations

- Complete CRUD operations
- Form data management
- Local state orchestration
- Mutation operations

### `business/` - Business Logic
**Purpose**: Complex domain logic and cross-entity operations

- Lineup management
- Page data composition
- Complex calculations
- Multi-entity operations

---

## Naming Conventions

### 1. Data Fetching Hooks (`data/`)

**Pattern**: `useFetch[Entity][OptionalContext]`

**Examples**:
```typescript
// ✅ Good examples
useFetchCategories()           // Fetch all categories
useFetchCategory(id)           // Fetch single category
useFetchCategoryPosts(id)      // Fetch posts for a category
useFetchCategorySeasons(id)    // Fetch seasons for a category
useFetchActiveCategories()     // Fetch with specific filter

// ❌ Bad examples
useCategories()                // Unclear if it's fetch or CRUD
useGetCategories()             // Redundant "get" + "use"
useCategoriesData()            // Too generic
```

**Returns**:
```typescript
{
  data: T[],
  loading: boolean,
  error: Error | null
}
```

---

### 2. State Management Hooks (`state/`)

**Pattern**: `use[Entity][OptionalFeature]`

**Examples**:
```typescript
// ✅ CRUD operations hooks
useCategories()                    // Main CRUD hook (create, update, delete)
useCommittees()                    // Main CRUD hook
useMembers()                       // Main CRUD hook

// ✅ Specific operation hooks
useCategoryMutations()             // Only mutations (create/update/delete)
useCategoryForm()                  // Form state management
useCategoriesState()               // Complex state orchestration

// ✅ Specific feature hooks
useMemberPayments()                // Payment-specific operations
useCategoryMembershipFees()                  // Fee management
usePlayerLoans()                   // Loan management

// ❌ Bad examples
useCreateCategory()                // Too granular - combine into useCategories()
useUpdateCategory()                // Too granular - combine into useCategories()
useCategoryData()                  // Confusing - sounds like data fetching
useFetchAndUpdateCategory()        // Too verbose
```

**Naming based on complexity**:
- **Simple CRUD**: `use[Entity]()` - returns `{create, update, delete}`
- **With form state**: `use[Entity]Form()` - manages form data
- **Complex state**: `use[Entity]State()` - orchestrates multiple states
- **Specific feature**: `use[Entity][Feature]()` - e.g., `useMemberPayments()`

---

### 3. Business Logic Hooks (`business/`)

**Pattern**: `use[Entity][BusinessConcept]`

**Examples**:
```typescript
// ✅ Good examples
useCategoryLineups(categoryId)     // Lineup management logic
useCategoryPageData(categoryId)    // Compose data for category page
useMemberMetadata(memberId)        // Member metadata operations
useMemberClubRelationships(id)     // Relationship management
useAttendanceTracking(sessionId)   // Attendance business logic
useMembershipFeeCalculation()      // Fee calculation logic

// ✅ Cross-entity operations
useMatchStatistics(matchId)        // Calculate/aggregate stats
useSeasonStandings(seasonId)       // Complex standings calculation
usePlayerTransfers()               // Transfer logic across multiple entities

// ❌ Bad examples
useCategoryLogic()                 // Too generic
useLineups()                       // Missing entity context
useBusinessLogic()                 // Way too generic
useCategoryHelper()                // "Helper" is vague
```

**Pattern rules**:
- Always include entity: `use[Entity][BusinessConcept]`
- Use domain terminology: `Lineups`, `Standings`, `Transfers`
- Should imply complexity/orchestration

---

## Function Naming Inside Hooks

### CRUD Operations (in `state/` hooks)

**Standard pattern**: `[verb][Entity]`

```typescript
// ✅ Recommended naming
createCategory()      // Create new entity
updateCategory()      // Update existing entity
deleteCategory()      // Delete/remove entity
fetchCategories()     // Refetch data

// ✅ For relationships/collections
addMemberToLineup()        // Add to collection
removeMemberFromLineup()   // Remove from collection

// ❌ Avoid these
addCategory()              // Use "create" for new entities
insertCategory()           // Too database-specific
saveCategory()             // Ambiguous (create or update?)
handleCreateCategory()     // Unnecessary "handle" prefix in hooks
```

### Consistency Rules

1. **Create new entities**: `create[Entity]` (not `add[Entity]`)
2. **Add to relationship/collection**: `add[Entity]To[Target]`
3. **Update**: `update[Entity]`
4. **Delete**: `delete[Entity]` (can also use `remove[Entity]` for soft deletes)
5. **Refetch**: `fetch[Entity]` or `refetch[Entity]`

### Handler Functions (in React components)

**Pattern**: `handle[Action]`

```typescript
// ✅ In React components
const handleCategorySubmit = async () => {
  if (mode === 'create') {
    await createCategory(formData);
  } else {
    await updateCategory(selectedCategory.id, formData);
  }
};

const handleDeleteWithConfirmation = async () => {
  await deleteCategory(id);
  onClose();
};
```

---

## Quick Decision Tree

**Naming a new hook?**

1. **Does it only READ data?**
   - YES → `data/useFetch[Entity].ts`
   - NO → Go to step 2

2. **Does it have CRUD operations?**
   - YES → `state/use[Entity].ts` with `create/update/delete` functions
   - NO → Go to step 3

3. **Does it implement complex business logic?**
   - YES → `business/use[Entity][BusinessConcept].ts`

---

## Examples from Codebase

### Complete Hook Structure Example

```typescript
// ========================================
// data/useFetchCategories.ts
// ========================================
export function useFetchCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_ROUTES.categories.root);
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return {data, loading, error};
}

// ========================================
// state/useCategories.ts
// ========================================
export function useCategories(filters?: UseCategoriesFilters) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    // Fetch implementation
  }, []);

  const createCategory = useCallback(async (data: CategoryInsert) => {
    // Create implementation
    const res = await fetch(API_ROUTES.categories.root, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    // ... handle response
    await fetchCategories(); // Refetch after mutation
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<CategoryInsert>) => {
    // Update implementation
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    // Delete implementation
  }, [fetchCategories]);

  return {
    // Data
    categories,

    // State
    loading,
    error,

    // Actions
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,

    // Utilities
    clearError: () => setError(null),
  };
}

// ========================================
// state/useCategoryForm.ts
// ========================================
export function useCategoryForm(initialData?: Category) {
  const [formData, setFormData] = useState<Category>(initialData || defaultCategory);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialData || defaultCategory);
    setErrors({});
  }, [initialData]);

  return {
    formData,
    setFormData,
    errors,
    validate,
    resetForm,
  };
}

// ========================================
// business/useCategoryLineups.ts
// ========================================
export function useCategoryLineups(categoryId: string) {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(false);

  const createLineup = useCallback(async (data: LineupInsert) => {
    // Complex business logic for lineup creation
  }, [categoryId]);

  const updateLineup = useCallback(async (id: string, data: Partial<LineupInsert>) => {
    // Complex business logic for lineup updates
  }, [categoryId]);

  const addMemberToLineup = useCallback(async (lineupId: string, memberId: string) => {
    // Business logic for adding member to lineup
  }, [categoryId]);

  const removeMemberFromLineup = useCallback(async (lineupId: string, memberId: string) => {
    // Business logic for removing member from lineup
  }, [categoryId]);

  return {
    lineups,
    loading,
    createLineup,
    updateLineup,
    deleteLineup,
    addMemberToLineup,
    removeMemberFromLineup,
  };
}
```

---

## Convention Summary Table

| Folder | Prefix/Pattern | Returns | Example |
|--------|----------------|---------|---------|
| **data/** | `useFetch[Entity]` | `{data, loading, error}` | `useFetchCategories()` |
| **state/** | `use[Entity]` or `use[Entity][Feature]` | `{create, update, delete, ...state}` | `useCategories()`, `useCategoryForm()` |
| **business/** | `use[Entity][BusinessConcept]` | Domain-specific operations | `useCategoryLineups()` |

---

## Common Patterns in Our Codebase

### Current Hook Organization

| Entity | data/ | state/ | business/ |
|--------|-------|--------|-----------|
| **category** | `useFetchCategories`<br>`useFetchCategoryPosts` | `useCategories`<br>`useCategoryForm` | `useCategoryLineups`<br>`useCategoryPageData` |
| **member** | `useFetchMembers` | `useMembers`<br>`useMemberFunctions` | `useMemberMetadata`<br>`useMemberClubRelationships` |
| **committee** | `useFetchCommittees` | `useCommittees` | - |
| **match** | `useFetchMatches` | `useMatches` | `useMatchVideos`<br>`useMatchStatistics` |

---

## Best Practices

1. **Use data hooks** for initial data fetching (display-only pages)
2. **Use state hooks** for CRUD operations and form management (admin pages)
3. **Use business hooks** for complex operations and data composition
4. **Combine hooks** for complex scenarios
5. **Check individual READMEs** in each entity folder for specific usage patterns

---

## Migration Guide

If you have an existing hook that doesn't follow these conventions:

1. **Identify the hook's purpose**:
   - Read-only? → Move to `data/` and rename to `useFetch[Entity]`
   - Has CRUD? → Move to `state/` and rename to `use[Entity]`
   - Complex logic? → Move to `business/` and rename to `use[Entity][BusinessConcept]`

2. **Update function names inside the hook**:
   - `addCategory` → `createCategory`
   - `addCommittee` → `createCommittee`
   - Keep `addMemberToLineup` (relationship operation)

3. **Update all imports** in components using the hook

4. **Test thoroughly** after renaming

---

## Additional Resources

- See individual entity folders for specific examples
- Check `hooks/entities/category/README.md` for detailed category hook documentation
- Refer to TypeScript types in `@/types` for data structures

---

**Last Updated**: 2025-10-23
**Maintainer**: Development Team