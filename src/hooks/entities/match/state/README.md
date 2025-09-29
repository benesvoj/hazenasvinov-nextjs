# Match State Hooks

This folder contains hooks responsible for **state management** and **caching** of match data.

## Purpose
These hooks manage the state of match data, including caching, optimization, and state persistence.

## Hooks

### Caching & Optimization
- **`useCachedMatches`** - Cached version of match fetching with React Query
- **`useOptimizedMatches`** - Optimized match data with performance improvements
- **`useMatchVideos`** - State management for match-related videos

## Usage Pattern
```typescript
import { useCachedMatches, useOptimizedMatches } from '@/hooks';

// Cached matches with automatic refetching
const { data: matches, isLoading, error } = useCachedMatches({
  categoryId: 'category-123',
  seasonId: 'season-456',
  ownClubOnly: true
});

// Optimized matches for better performance
const { data: optimizedMatches } = useOptimizedMatches({
  categoryId: 'category-123',
  includeTeamDetails: true
});
```

## Key Features
- ✅ React Query integration
- ✅ Automatic caching and invalidation
- ✅ Performance optimization
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Error retry logic
