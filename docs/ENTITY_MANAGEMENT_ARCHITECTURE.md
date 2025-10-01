# Entity Management Architecture Guide

## Overview

This guide establishes consistent patterns for managing entities across the application. The goal is to eliminate confusion between API routes, hooks, and action files.

## Architecture Principles

### 1. **Single Source of Truth**
Each entity should have ONE primary hook that handles all CRUD operations.

### 2. **Consistent Patterns**
All entities should follow the same structure and naming conventions.

### 3. **Clear Separation of Concerns**
- **Hooks**: Business logic and state management
- **API Routes**: Server-side operations (when needed)
- **Types**: Data contracts and interfaces
- **Components**: UI logic only

## Standard Entity Structure

```
src/hooks/entities/{entity-name}/
├── use{EntityName}.ts          # Main CRUD hook (REQUIRED)
├── data/
│   └── useFetch{EntityName}.ts # Data fetching only (optional)
├── state/
│   └── use{EntityName}State.ts # Complex state management (optional)
└── business/
    └── use{EntityName}Logic.ts # Business logic (optional)
```

## Hook Patterns

### Primary CRUD Hook (Required)

Every entity MUST have a primary CRUD hook following this pattern:

```typescript
// src/hooks/entities/{entity}/use{Entity}.ts
export interface Use{Entity}Filters {
  searchTerm?: string;
  // ... other filters
}

export interface Create{Entity}Data {
  // ... required fields
}

export interface Update{Entity}Data extends Create{Entity}Data {
  id: string;
}

export function use{Entity}(filters?: Use{Entity}Filters) {
  const [data, setData] = useState<{Entity}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD operations
  const create{Entity} = useCallback(async (data: Create{Entity}Data) => {
    // Implementation
  }, []);

  const update{Entity} = useCallback(async (data: Update{Entity}Data) => {
    // Implementation
  }, []);

  const delete{Entity} = useCallback(async (id: string) => {
    // Implementation
  }, []);

  const fetch{Entity}s = useCallback(async () => {
    // Implementation
  }, []);

  return {
    // Data
    {entity}s: getFiltered{Entity}s(),
    
    // State
    loading,
    error,
    
    // Actions
    create{Entity},
    update{Entity},
    delete{Entity},
    fetch{Entity}s,
    
    // Utilities
    clearError: () => setError(null),
  };
}
```

## What NOT to Do

### ❌ Don't Create Action Files
```typescript
// ❌ WRONG - Don't create files like this
src/app/admin/actions/updateCategory.ts
src/app/admin/actions/createUser.ts
```

### ❌ Don't Mix Patterns
```typescript
// ❌ WRONG - Don't have both API routes AND direct Supabase calls
src/app/api/categories/route.ts  // API route
src/hooks/useCategories.ts       // Direct Supabase calls
```

### ❌ Don't Use Wrong Types
```typescript
// ❌ WRONG - Don't use generic types in action files
export async function updateCategory({id, name, description, route}: Category) {
  // This should be in a hook with proper types
}
```

## Migration Checklist

When cleaning up an entity, follow this checklist:

- [ ] **Remove action files** - Delete any files in `/admin/actions/`
- [ ] **Create primary hook** - Ensure there's a clean CRUD hook
- [ ] **Update components** - Use the hook instead of direct API calls
- [ ] **Fix types** - Use proper TypeScript interfaces
- [ ] **Remove redundant API routes** - Keep only if needed for server-side operations
- [ ] **Update exports** - Add to hooks index
- [ ] **Test functionality** - Ensure all CRUD operations work

## Examples

### ✅ Good: Club Categories
```typescript
// Clean hook with proper types
export function useClubCategories(filters?: UseClubCategoriesFilters) {
  // All CRUD operations in one place
  const createClubCategory = useCallback(async (data: CreateClubCategoryData) => {
    // Implementation
  }, []);

  return {
    clubCategories: getFilteredClubCategories(),
    loading,
    error,
    createClubCategory,
    updateClubCategory,
    deleteClubCategory,
    fetchClubCategories,
    clearError,
  };
}
```

### ✅ Good: Categories (New)
```typescript
// Clean hook following the same pattern
export function useCategories(filters?: UseCategoriesFilters) {
  // Same pattern as club categories
}
```

### ❌ Bad: Old Categories Pattern
```typescript
// ❌ Complex state management hook
export function useCategories(): UseCategoriesResult {
  // Too many responsibilities
  // Complex form management
  // Mixed concerns
}

// ❌ Separate action file
export async function updateCategory({id, name, description, route}: Category) {
  // Wrong types, wrong location
}
```

## API Routes Guidelines

API routes should ONLY be used for:
- Server-side operations that can't be done client-side
- External API integrations
- Complex business logic that needs server execution
- Authentication/authorization checks

**DO NOT** create API routes that just wrap Supabase calls - use hooks instead.

## Benefits of This Architecture

1. **Consistency**: All entities follow the same pattern
2. **Maintainability**: Easy to find and modify entity logic
3. **Type Safety**: Proper TypeScript support throughout
4. **Testability**: Hooks can be tested independently
5. **Reusability**: Hooks can be used across multiple components
6. **Performance**: Optimized data fetching and caching

## Next Steps

1. **Audit existing entities** - Check which ones need cleanup
2. **Create migration plan** - Prioritize by usage and complexity
3. **Migrate one by one** - Don't try to fix everything at once
4. **Update documentation** - Keep this guide updated
5. **Train team** - Ensure everyone follows the patterns

## Entity Status

| Entity | Status | Primary Hook | Notes |
|--------|--------|--------------|-------|
| Club Categories | ✅ Complete | `useClubCategories` | Clean implementation |
| Categories | ✅ Complete | `useCategories` | New clean implementation |
| Clubs | ❌ Needs work | `useClubs` | Only has basic fetch |
| Members | ❌ Needs work | `useMembers` | Complex state management |
| Seasons | ❌ Needs work | `useSeasons` | Mixed patterns |
| Users | ❌ Needs work | `useUsers` | API routes + hooks |

This architecture ensures consistency, maintainability, and clarity across the entire application.
