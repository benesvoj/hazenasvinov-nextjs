# Match Hooks

This folder contains all hooks related to **match management** and **match data operations**.

## Structure

The match hooks are organized into three main categories:

### 📁 `data/` - Data Fetching
Hooks responsible for fetching match data from the database or API.
- Direct database queries
- API communication
- Data retrieval operations

### 📁 `state/` - State Management  
Hooks responsible for managing match data state and caching.
- React Query integration
- Caching strategies
- Performance optimization

### 📁 `business/` - Business Logic
Hooks implementing complex business rules and domain logic.
- Statistical calculations
- Business rule implementation
- Cross-entity operations

## Quick Start

```typescript
import { 
  useFetchMatches,           // Data fetching
  useCachedMatches,          // State management
  useHeadToHeadMatches       // Business logic
} from '@/hooks';

// Fetch matches
const { data: matches } = useFetchMatches({
  categoryId: 'category-123',
  seasonId: 'season-456'
});

// Cached matches
const { data: cachedMatches } = useCachedMatches({
  categoryId: 'category-123',
  ownClubOnly: true
});

// Head-to-head analysis
const { data: headToHead } = useHeadToHeadMatches({
  categoryId: 'category-123',
  opponentTeamId: 'team-456'
});
```

## Hook Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Data** | Fetch data from sources | `useFetchMatches`, `useOwnClubMatches` |
| **State** | Manage data state | `useCachedMatches`, `useOptimizedMatches` |
| **Business** | Implement business logic | `useHeadToHeadMatches`, `useMatchMetadata` |

## Best Practices

1. **Use data hooks** for initial data fetching
2. **Use state hooks** for cached/optimized data
3. **Use business hooks** for complex calculations
4. **Combine hooks** for complex scenarios
5. **Check individual READMEs** for specific usage patterns

## Related Hooks

- **Shared Queries**: `@/hooks/shared/queries/useMatchQueries` - React Query based match operations
- **Team Hooks**: `@/hooks/entities/team/` - Team-related operations
- **Category Hooks**: `@/hooks/entities/category/` - Category management
