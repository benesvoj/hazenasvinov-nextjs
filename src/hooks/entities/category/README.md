# Category Hooks

This folder contains all hooks related to **category management** and **category data operations**.

## Structure

The category hooks are organized into three main categories:

### 📁 `data/` - Data Fetching
Hooks responsible for fetching category data from the database or API.
- Direct API queries
- Data retrieval operations
- Blog post fetching

### 📁 `state/` - State Management  
Hooks responsible for managing category data state and CRUD operations.
- Complete CRUD operations
- Form data management
- Season management

### 📁 `business/` - Business Logic
Hooks implementing complex business rules and domain logic.
- Lineup management
- Page data composition
- Cross-entity operations

## Quick Start

```typescript
import {
  useCategories,            // Data fetching
  useCategoryLineups         // Business logic
} from '@/hooks';

// Fetch categories
const { data: categories, loading } = useFetchCategories();

// Manage categories (CRUD)
const { createCategory, updateCategory, deleteCategory } = useCategories();

// Handle lineups
const { createLineup, updateLineup } = useCategoryLineups(categoryId);
```

## Hook Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Data** | Fetch data from sources | `useFetchCategories`, `useFetchCategoryPosts` |
| **State** | Manage data state | `useCategories` (CRUD operations) |
| **Business** | Implement business logic | `useCategoryLineups`, `useCategoryPageData` |

## Best Practices

1. **Use data hooks** for initial data fetching
2. **Use state hooks** for CRUD operations and form management
3. **Use business hooks** for complex operations and data composition
4. **Combine hooks** for complex category management scenarios
5. **Check individual READMEs** for specific usage patterns

## Related Hooks

- **Match Hooks**: `@/hooks/entities/match/` - Match-related operations
- **Team Hooks**: `@/hooks/entities/team/` - Team management
- **Season Hooks**: `@/hooks/entities/season/` - Season management
