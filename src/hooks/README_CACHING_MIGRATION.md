# Caching Migration Guide

This guide explains how to migrate from the old hooks to the new cached hooks using React Query.

## Overview

The new caching system provides:
- **Automatic caching** - Queries are cached and reused across components
- **Background updates** - Data is refreshed in the background
- **Optimistic updates** - UI updates immediately while mutations are in progress
- **Cache invalidation** - Automatic cache updates when data changes
- **Better performance** - Reduced database queries and faster UI updates

## Migration Steps

### 1. Replace Hook Imports

**Before:**
```typescript
import { useFetchMatches } from '@/hooks/useFetchMatches';
import { usePublicMatches } from '@/hooks/usePublicMatches';
import { useOwnClubMatches } from '@/hooks/useOwnClubMatches';
```

**After:**
```typescript
import { useCachedMatches } from '@/hooks/useCachedMatches';
import { useCachedPublicMatches } from '@/hooks/useCachedMatches';
import { useCachedOwnClubMatches } from '@/hooks/useCachedMatches';
```

### 2. Update Hook Usage

**Before:**
```typescript
const { matches, loading, error, refreshMatches } = useFetchMatches(
  categoryId,
  seasonId,
  { ownClubOnly: true, includeTeamDetails: true }
);
```

**After:**
```typescript
const { 
  matches, 
  loading, 
  error, 
  refreshMatches,
  isRefetching,
  isStale,
  isFetching 
} = useCachedMatches(
  categoryId,
  seasonId,
  { ownClubOnly: true, includeTeamDetails: true }
);
```

### 3. Use New Query Hooks for Advanced Features

For more advanced caching features, use the query hooks directly:

```typescript
import { 
  useMatchesWithTeams,
  useMatchesSeasonal,
  useMatchById,
  useCreateMatch,
  useUpdateMatch,
  useDeleteMatch,
  useOptimisticMatchUpdate
} from '@/hooks/queries/useMatchQueries';

// Fetch matches with specific filters
const { data, isLoading, error } = useMatchesWithTeams({
  categoryId: 'men',
  seasonId: '2024-25',
  ownClubOnly: true,
  includeTeamDetails: true,
});

// Fetch a single match
const { data: match } = useMatchById('match-id', {
  includeTeamDetails: true,
});

// Mutations with automatic cache invalidation
const createMatch = useCreateMatch();
const updateMatch = useUpdateMatch();
const deleteMatch = useDeleteMatch();

// Optimistic updates
const optimisticUpdate = useOptimisticMatchUpdate();
```

### 4. Cache Invalidation

Use the cache utilities for manual cache management:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { 
  invalidateAllMatches,
  invalidateMatchesByCategory,
  invalidateMatch,
  prefetchMatches
} from '@/lib/cacheUtils';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleMatchUpdate = async () => {
    // Update match in database
    await updateMatchInDatabase();
    
    // Invalidate specific match
    invalidateMatch(queryClient, matchId);
    
    // Or invalidate all matches
    invalidateAllMatches(queryClient);
  };

  const handlePrefetch = () => {
    // Prefetch matches for better UX
    prefetchMatches(queryClient, 'men', '2024-25');
  };
}
```

## Benefits

### Performance Improvements
- **Reduced API calls** - Data is cached and reused
- **Faster UI updates** - Cached data loads instantly
- **Background updates** - Data refreshes without blocking UI
- **Smart refetching** - Only refetches when necessary

### Developer Experience
- **Consistent API** - All hooks follow the same patterns
- **Type safety** - Full TypeScript support
- **DevTools** - React Query DevTools for debugging
- **Error handling** - Built-in retry and error states

### User Experience
- **Instant loading** - Cached data appears immediately
- **Optimistic updates** - UI updates before server confirmation
- **Offline support** - Cached data works offline
- **Background sync** - Data stays fresh automatically

## Configuration

### Query Client Settings

The query client is configured with sensible defaults:

```typescript
// Production settings
staleTime: 5 * 60 * 1000,    // 5 minutes
gcTime: 10 * 60 * 1000,       // 10 minutes
retry: 3,                     // Retry failed requests
refetchOnWindowFocus: false,  // Don't refetch on focus
refetchOnReconnect: true,     // Refetch on reconnect

// Development settings
staleTime: 30 * 1000,         // 30 seconds
gcTime: 2 * 60 * 1000,        // 2 minutes
refetchOnWindowFocus: true,   // Refetch on focus for development
```

### Custom Configuration

You can customize the query client in `src/lib/queryClient.ts`:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 20 * 60 * 1000,    // 20 minutes
      // ... other options
    },
  },
});
```

## Troubleshooting

### Common Issues

1. **Data not updating** - Check if cache invalidation is working
2. **Stale data** - Verify staleTime configuration
3. **Memory leaks** - Ensure proper cleanup in useEffect
4. **Type errors** - Make sure to import correct types

### Debug Tools

Use React Query DevTools to debug caching issues:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to your app (already included in QueryProvider)
<ReactQueryDevtools initialIsOpen={false} />
```

### Cache Inspection

```typescript
import { getCacheStats } from '@/lib/cacheUtils';

const stats = getCacheStats(queryClient);
console.log('Cache stats:', stats);
```

## Migration Checklist

- [ ] Install React Query dependencies
- [ ] Add QueryProvider to app layout
- [ ] Update hook imports
- [ ] Replace hook usage
- [ ] Test caching behavior
- [ ] Add cache invalidation where needed
- [ ] Configure query client settings
- [ ] Test optimistic updates
- [ ] Verify error handling
- [ ] Test offline behavior
