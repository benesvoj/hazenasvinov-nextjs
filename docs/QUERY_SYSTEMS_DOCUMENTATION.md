# Query Systems Documentation

This document provides a comprehensive overview of all query systems and builders used in the codebase for match-related database operations.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Query System Architecture](#query-system-architecture)
3. [Phase 1: Original Query System](#phase-1-original-query-system)
4. [Phase 2: Query Builder System](#phase-2-query-builder-system)
5. [Phase 3: Hook Integration](#phase-3-hook-integration)
6. [Phase 4: React Query Caching](#phase-4-react-query-caching)
7. [Phase 5: Optimized Query System](#phase-5-optimized-query-system)
8. [Usage Examples](#usage-examples)
9. [Migration Guide](#migration-guide)
10. [Performance Considerations](#performance-considerations)

## 🎯 Overview

The codebase implements a multi-layered query system for match data, designed to provide flexibility, performance, and maintainability. The system evolved through 5 phases, each building upon the previous one.

## 🏗️ Query System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  React Components (MatchSchedule, CategoryMatches, etc.)   │
├─────────────────────────────────────────────────────────────┤
│  React Hooks (usePublicMatches, useOwnClubMatches, etc.)   │
├─────────────────────────────────────────────────────────────┤
│  Query Services (matchQueries, optimizedMatchQueries)      │
├─────────────────────────────────────────────────────────────┤
│  Query Builders (MatchQueryBuilder)                        │
├─────────────────────────────────────────────────────────────┤
│  Database Layer (Supabase/PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Phase 1: Original Query System

**File**: `src/services/matchQueries.ts`

### Purpose
Centralized service for all match-related database queries.

### Key Functions
- `getMatchesBasic(options)` - Basic match queries
- `getMatchesWithTeams(options)` - Matches with team details
- `getMatchesSeasonal(categoryId, seasonId, options)` - Seasonal match queries
- `getOwnClubMatches(categoryId, seasonId, options)` - Own club matches
- `getMatchesByCategory(categoryId, options)` - Category-specific matches

### Features
- ✅ Centralized query logic
- ✅ Consistent error handling
- ✅ TypeScript interfaces
- ✅ Team suffix logic
- ✅ Data transformation

### Example Usage
```typescript
import { getMatchesWithTeams } from '@/services/matchQueries';

const result = await getMatchesWithTeams({
  categoryId: 'cat-123',
  seasonId: 'season-456',
  includeTeamDetails: true
});
```

## 🛠️ Phase 2: Query Builder System

**File**: `src/utils/matchQueryBuilder.ts`

### Purpose
Fluent API for building complex match queries with method chaining.

### Key Components
- `MatchQueryBuilder` class
- `MatchQueryBuilderOptions` interface
- `createMatchQuery()` factory function
- `MatchQueries` convenience object

### Features
- ✅ Fluent API with method chaining
- ✅ Granular filtering options
- ✅ Flexible data inclusion
- ✅ Sorting and pagination
- ✅ Team suffix logic (recently added)
- ✅ Type-safe options

### Example Usage
```typescript
import { createMatchQuery, MatchQueries } from '@/utils/matchQueryBuilder';

// Method chaining
const query = createMatchQuery()
  .category('cat-123')
  .season('season-456')
  .upcomingOnly()
  .includeTeamDetails()
  .sortBy('date')
  .limit(10);

const result = await query.execute();

// Convenience functions
const ownClubMatches = await MatchQueries.ownClub('cat-123', 'season-456');
const publicMatches = await MatchQueries.public('cat-123');
```

### Available Methods
```typescript
// Filtering
.category(categoryId)
.season(seasonId)
.status(status)
.matchweek(matchweek)
.dateFrom(date)
.dateTo(date)
.teamId(teamId)
.ownClubOnly()
.upcomingOnly()
.completedOnly()

// Data inclusion
.includeTeamDetails()
.includeCategory()
.includeSeason()
.includeStandings()

// Sorting & Pagination
.sortBy(field)
.sortOrder(order)
.limit(count)
.offset(count)
```

## 🔗 Phase 3: Hook Integration

**Files**: `src/hooks/useFetchMatches.ts`, `src/hooks/usePublicMatches.ts`, `src/hooks/useOwnClubMatches.ts`

### Purpose
React hooks that integrate with the query systems for component usage.

### Key Hooks
- `useFetchMatches(categoryId, seasonId, options)` - General match fetching
- `usePublicMatches(categoryId)` - Public match display
- `useOwnClubMatches(categoryId, seasonId)` - Own club matches
- `useCategoryPageData(categorySlug, options)` - Category page data

### Features
- ✅ React state management
- ✅ Loading and error states
- ✅ Automatic data fetching
- ✅ Seasonal data structure
- ✅ TypeScript interfaces

### Example Usage
```typescript
import { usePublicMatches } from '@/hooks/usePublicMatches';

function MatchComponent({ categoryId }) {
  const { matches, loading, error } = usePublicMatches(categoryId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {matches.map(match => (
        <div key={match.id}>{match.home_team.name} vs {match.away_team.name}</div>
      ))}
    </div>
  );
}
```

## ⚡ Phase 4: React Query Caching

**Files**: `src/lib/queryClient.ts`, `src/components/providers/QueryProvider.tsx`, `src/hooks/useOptimizedMatches.ts`

### Purpose
Implement intelligent caching with React Query for improved performance and user experience.

### Key Components
- `QueryClient` configuration
- `QueryProvider` component
- `useOptimizedMatches` hooks
- Query key management
- Cache invalidation

### Features
- ✅ Intelligent caching with TTL
- ✅ Query deduplication
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Cache invalidation
- ✅ Performance monitoring

### Example Usage
```typescript
import { useOptimizedOwnClubMatches } from '@/hooks/useOptimizedMatches';

function OptimizedMatchComponent({ categoryId, seasonId }) {
  const { matches, loading, error, refetch } = useOptimizedOwnClubMatches(
    categoryId, 
    seasonId
  );
  
  // Data is automatically cached and deduplicated
  // Refetch when needed
  const handleRefresh = () => refetch();
  
  return (
    <div>
      {matches?.allMatches?.map(match => (
        <div key={match.id}>{match.home_team.name} vs {match.away_team.name}</div>
      ))}
    </div>
  );
}
```

## 🚀 Phase 5: Optimized Query System

**File**: `src/services/optimizedMatchQueries.ts`

### Purpose
High-performance query system with advanced optimizations and database-level improvements.

### Key Functions
- `getMatchesBasicOptimized(options)` - Optimized basic queries
- `getMatchesWithTeamsOptimized(options)` - Optimized team queries
- `getMatchesSeasonalOptimized(categoryId, seasonId, options)` - Optimized seasonal queries
- `getOwnClubMatchesOptimized(categoryId, seasonId, options)` - Optimized own club queries
- `getClubTeamCounts(categoryId, seasonId)` - Team counting for suffix logic

### Features
- ✅ LRU caching with TTL
- ✅ Query deduplication
- ✅ Materialized views
- ✅ Database indexing
- ✅ Performance monitoring
- ✅ Team suffix logic
- ✅ Batch querying
- ✅ Preloading

### Example Usage
```typescript
import { getMatchesWithTeamsOptimized } from '@/services/optimizedMatchQueries';

const result = await getMatchesWithTeamsOptimized({
  categoryId: 'cat-123',
  seasonId: 'season-456',
  includeTeamDetails: true
});
```

## 📚 Usage Examples

### Basic Match Query
```typescript
// Using original service
import { getMatchesBasic } from '@/services/matchQueries';
const matches = await getMatchesBasic({ categoryId: 'cat-123' });

// Using query builder
import { createMatchQuery } from '@/utils/matchQueryBuilder';
const matches = await createMatchQuery().category('cat-123').execute();

// Using optimized service
import { getMatchesBasicOptimized } from '@/services/optimizedMatchQueries';
const matches = await getMatchesBasicOptimized({ categoryId: 'cat-123' });
```

### Complex Query with Filters
```typescript
import { createMatchQuery } from '@/utils/matchQueryBuilder';

const query = createMatchQuery()
  .category('cat-123')
  .season('season-456')
  .upcomingOnly()
  .includeTeamDetails()
  .sortBy('date')
  .limit(20);

const result = await query.execute();
```

### React Hook Usage
```typescript
import { usePublicMatches } from '@/hooks/usePublicMatches';

function MatchList({ categoryId }) {
  const { matches, loading, error } = usePublicMatches(categoryId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {matches.map(match => (
        <MatchRow key={match.id} match={match} />
      ))}
    </div>
  );
}
```

## 🔄 Migration Guide

### From Direct Supabase Queries
```typescript
// Old way
const { data, error } = await supabase
  .from('matches')
  .select('*')
  .eq('category_id', categoryId);

// New way
import { getMatchesBasic } from '@/services/matchQueries';
const { data, error } = await getMatchesBasic({ categoryId });
```

### From Original Service to Query Builder
```typescript
// Old way
import { getMatchesWithTeams } from '@/services/matchQueries';
const result = await getMatchesWithTeams({ categoryId, seasonId });

// New way
import { createMatchQuery } from '@/utils/matchQueryBuilder';
const result = await createMatchQuery()
  .category(categoryId)
  .season(seasonId)
  .includeTeamDetails()
  .execute();
```

### From Query Builder to Optimized Service
```typescript
// Old way
import { createMatchQuery } from '@/utils/matchQueryBuilder';
const result = await createMatchQuery().category(categoryId).execute();

// New way
import { getMatchesBasicOptimized } from '@/services/optimizedMatchQueries';
const result = await getMatchesBasicOptimized({ categoryId });
```

## ⚡ Performance Considerations

### Caching Strategy
- **L1 Cache**: LRU cache with TTL (5-60 minutes)
- **L2 Cache**: React Query cache (configurable)
- **L3 Cache**: Database materialized views

### Query Optimization
- **Deduplication**: Prevents duplicate concurrent requests
- **Batching**: Combines multiple queries efficiently
- **Preloading**: Loads critical data proactively
- **Indexing**: Database-level performance improvements

### Memory Management
- **LRU Eviction**: Automatically removes least recently used data
- **TTL Expiration**: Data expires based on time
- **Size Limits**: Configurable cache size limits

### Monitoring
- **Performance Metrics**: Query execution times
- **Cache Hit Rates**: Cache effectiveness
- **Error Tracking**: Query failure monitoring
- **Memory Usage**: Cache memory consumption

## 🎯 Best Practices

### 1. Choose the Right System
- **Simple queries**: Use original service
- **Complex queries**: Use query builder
- **High performance**: Use optimized service
- **React components**: Use hooks

### 2. Cache Strategy
- **Frequently accessed data**: Use optimized service
- **Real-time data**: Use original service
- **Large datasets**: Use pagination
- **User-specific data**: Use React Query

### 3. Error Handling
- **Always check for errors**: `if (error) return <ErrorComponent />`
- **Provide fallbacks**: Show loading states
- **Log errors**: Use console.error for debugging
- **User feedback**: Display meaningful error messages

### 4. Performance
- **Use optimized service**: For high-traffic queries
- **Implement pagination**: For large datasets
- **Cache appropriately**: Based on data freshness needs
- **Monitor performance**: Use performance monitoring tools

## 🔍 Troubleshooting

### Common Issues
1. **Missing team suffixes**: Ensure `getClubTeamCounts` is called
2. **Cache not updating**: Check cache invalidation
3. **Performance issues**: Use optimized service
4. **Type errors**: Check interface definitions

### Debug Tools
- **Console logs**: Built-in debugging
- **Performance monitor**: Real-time metrics
- **React Query DevTools**: Cache inspection
- **Database logs**: Query execution analysis

## 📈 Future Improvements

### Planned Features
- **GraphQL integration**: More flexible querying
- **Real-time updates**: WebSocket integration
- **Advanced caching**: Redis integration
- **Query analytics**: Usage tracking
- **Auto-optimization**: Dynamic query optimization

### Performance Targets
- **Query time**: < 100ms for cached queries
- **Cache hit rate**: > 80% for frequently accessed data
- **Memory usage**: < 50MB for cache
- **Error rate**: < 1% for all queries

---

This documentation provides a comprehensive guide to all query systems in the codebase. For specific implementation details, refer to the individual source files mentioned in each section.
