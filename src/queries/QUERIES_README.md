# Query Layer

## Overview

The **Query Layer** is the **only place** where direct database access happens. All Supabase queries must go through this layer to maintain consistency, testability, and security.

## Purpose

- 🎯 Centralize all database operations
- 🎯 Provide consistent error handling
- 🎯 Enable easy testing and mocking
- 🎯 Apply business logic before database operations
- 🎯 Transform database types to application types

## Structure

```
queries/{entity}/
├── constants.ts    # DB_TABLE name, ENTITY names
├── queries.ts      # Read operations (SELECT)
├── mutations.ts    # Write operations (INSERT, UPDATE, DELETE)
└── index.ts        # Re-exports all functions
```

### Example: Videos Query Layer

```
queries/videos/
├── constants.ts    # export const DB_TABLE = 'videos';
├── queries.ts      # getAllVideos(), getVideoById()
├── mutations.ts    # createVideo(), updateVideo(), deleteVideo()
└── index.ts        # export * from './queries'; ...
```

## File Responsibilities

### constants.ts
```typescript
/**
 * Database table name - must match Supabase table
 */
export const DB_TABLE = 'videos';

/**
 * Entity names for error messages and logging
 */
export const ENTITY = {
  singular: 'Video',
  plural: 'Videos'
};
```

### queries.ts (Read Operations)
```typescript
import {buildSelectQuery} from '@/queries';
import {QueryContext, QueryOptions, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from './constants';
import {VideoSchema} from '@/types';

/**
 * Get all videos with optional filtering and pagination
 */
export async function getAllVideos(
  ctx: QueryContext,
  options?: QueryOptions
): Promise<QueryResult<VideoSchema[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, options);
    const {data, error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as VideoSchema[], error: null};
  } catch (err: any) {
    console.error(`Error in getAll${ENTITY.plural}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Get single video by ID
 */
export async function getVideoById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<VideoSchema>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as VideoSchema, error: null};
  } catch (err: any) {
    console.error(`Error in get${ENTITY.singular}ById:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
```

### mutations.ts (Write Operations)
```typescript
import {buildInsertQuery, buildUpdateQuery, buildDeleteQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from './constants';
import {VideoSchema, VideoInsert} from '@/types';

/**
 * Create a new video
 */
export async function createVideo(
  ctx: QueryContext,
  data: VideoInsert
): Promise<QueryResult<VideoSchema>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: item, error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: item as VideoSchema, error: null};
  } catch (err: any) {
    console.error(`Error in create${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Update existing video
 */
export async function updateVideo(
  ctx: QueryContext,
  id: string,
  data: Partial<VideoInsert>
): Promise<QueryResult<VideoSchema>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: item, error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: item as VideoSchema, error: null};
  } catch (err: any) {
    console.error(`Error in update${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Delete video
 */
export async function deleteVideo(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
    const {error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: {success: true}, error: null};
  } catch (err: any) {
    console.error(`Error in delete${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
```

### index.ts
```typescript
export * from './constants';
export * from './queries';
export * from './mutations';
```

## Query Layer Types

### QueryContext
```typescript
interface QueryContext {
  supabase: SupabaseClient;  // Supabase client instance
}
```

### QueryResult
```typescript
interface QueryResult<T> {
  data: T | null;     // Data on success, null on error
  error: string | null; // Error message on failure, null on success
}
```

### QueryOptions
```typescript
interface QueryOptions {
  sorting?: {column: string; ascending: boolean}[];
  pagination?: {page: number; limit: number};
}
```

## Helper Functions

### buildSelectQuery
```typescript
// Builds a SELECT query with optional sorting and pagination
const query = buildSelectQuery(supabase, 'videos', {
  sorting: [{column: 'created_at', ascending: false}],
  pagination: {page: 1, limit: 20}
});
```

### buildInsertQuery
```typescript
// Builds an INSERT query
const query = buildInsertQuery(supabase, 'videos', {
  title: 'New Video',
  youtube_url: 'https://...'
});
```

### buildUpdateQuery
```typescript
// Builds an UPDATE query
const query = buildUpdateQuery(supabase, 'videos', 'video-id', {
  title: 'Updated Title'
});
```

### buildDeleteQuery
```typescript
// Builds a DELETE query
const query = buildDeleteQuery(supabase, 'videos', 'video-id');
```

## Registration in API Config

After creating query layer functions, register them in the API config:

```typescript
// src/app/api/entities/config.ts
import * as videoQueries from '@/queries/videos';

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  videos: {
    tableName: 'videos',
    sortBy: [{column: 'recording_date', ascending: false}],
    requiresAdmin: false,
    queryLayer: {
      getAll: videoQueries.getAllVideos,
      getById: videoQueries.getVideoById,
      create: videoQueries.createVideo,
      update: videoQueries.updateVideo,
      delete: videoQueries.deleteVideo,
    },
  },
};
```

## Best Practices

### 1. Always Return QueryResult
```typescript
// ✅ Good - consistent return type
export async function getVideos(
  ctx: QueryContext
): Promise<QueryResult<VideoSchema[]>> {
  const {data, error} = await ctx.supabase.from('videos').select('*');

  if (error) return {data: null, error: error.message};
  return {data: data as VideoSchema[], error: null};
}

// ❌ Bad - throws errors
export async function getVideos(ctx: QueryContext) {
  const {data, error} = await ctx.supabase.from('videos').select('*');
  if (error) throw error;  // ❌ Don't throw
  return data;
}
```

### 2. Use Try-Catch for Safety
```typescript
export async function getAllVideos(
  ctx: QueryContext
): Promise<QueryResult<VideoSchema[]>> {
  try {
    const {data, error} = await ctx.supabase.from('videos').select('*');

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as VideoSchema[], error: null};
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
```

### 3. Log Errors for Debugging
```typescript
if (error) {
  console.error(`Error in get${ENTITY.singular}ById:`, error);
  return {data: null, error: error.message};
}
```

### 4. Type Cast Database Results
```typescript
// ✅ Good - explicit type casting
return {data: data as VideoSchema[], error: null};

// ❌ Bad - no type casting
return {data, error: null};
```

## Complex Queries

### Queries with Joins
```typescript
export async function getVideosWithRelations(
  ctx: QueryContext
): Promise<QueryResult<Video[]>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select(`
        *,
        category:categories(id, name, code),
        clubs(id, name, short_name),
        seasons(id, name, start_date, end_date)
      `);

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as Video[], error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}
```

### Queries with Filters
```typescript
export async function getActiveVideos(
  ctx: QueryContext,
  categoryId?: string
): Promise<QueryResult<VideoSchema[]>> {
  try {
    let query = ctx.supabase
      .from(DB_TABLE)
      .select('*')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const {data, error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as VideoSchema[], error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}
```

## AI Guidelines

When working with the query layer:

1. **NEVER bypass the query layer** - all database access must go through here
2. **Use helper functions** (buildSelectQuery, buildInsertQuery, etc.)
3. **Always return QueryResult** type
4. **Always use try-catch** for error handling
5. **Log errors** with descriptive messages
6. **Type cast** database results
7. **Register in config** after creating query functions
8. **Follow naming conventions**: get{Entity}, create{Entity}, update{Entity}, delete{Entity}

## Creating a New Query Layer

### Quick Template

```typescript
// constants.ts
export const DB_TABLE = 'new_entities';
export const ENTITY = {singular: 'NewEntity', plural: 'NewEntities'};

// queries.ts
import {buildSelectQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE} from './constants';
import {NewEntitySchema} from '@/types';

export async function getAllNewEntities(
  ctx: QueryContext,
  options?: QueryOptions
): Promise<QueryResult<NewEntitySchema[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, options);
    const {data, error} = await query;
    if (error) return {data: null, error: error.message};
    return {data: data as NewEntitySchema[], error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}

export async function getNewEntityById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<NewEntitySchema>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) return {data: null, error: error.message};
    return {data: data as NewEntitySchema, error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}

// mutations.ts
import {buildInsertQuery, buildUpdateQuery, buildDeleteQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE} from './constants';
import {NewEntitySchema, NewEntityInsert} from '@/types';

export async function createNewEntity(
  ctx: QueryContext,
  data: NewEntityInsert
): Promise<QueryResult<NewEntitySchema>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: item, error} = await query;
    if (error) return {data: null, error: error.message};
    return {data: item as NewEntitySchema, error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}

export async function updateNewEntity(
  ctx: QueryContext,
  id: string,
  data: Partial<NewEntityInsert>
): Promise<QueryResult<NewEntitySchema>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: item, error} = await query;
    if (error) return {data: null, error: error.message};
    return {data: item as NewEntitySchema, error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}

export async function deleteNewEntity(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
    const {error} = await query;
    if (error) return {data: null, error: error.message};
    return {data: {success: true}, error: null};
  } catch (err: any) {
    return {data: null, error: err.message};
  }
}

// index.ts
export * from './constants';
export * from './queries';
export * from './mutations';
```

## Rules

### ✅ DO:
- Use QueryContext for Supabase client
- Return QueryResult<T> from all functions
- Use try-catch for error handling
- Log errors with console.error
- Type cast results: `data as VideoSchema[]`
- Use helper functions when possible
- Keep functions pure and testable

### ❌ DON'T:
- Throw errors (return them in QueryResult)
- Access Supabase from components/hooks
- Put business logic here (belongs in business hooks)
- Create direct Supabase clients
- Skip error handling
- Forget to type cast results

## Testing Query Functions

```typescript
// __tests__/videoQueries.test.ts
describe('getAllVideos', () => {
  it('should return videos on success', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [{id: '1', title: 'Test'}],
        error: null
      })
    };

    const result = await getAllVideos({supabase: mockSupabase});

    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: {message: 'Database error'}
      })
    };

    const result = await getAllVideos({supabase: mockSupabase});

    expect(result.data).toBeNull();
    expect(result.error).toBe('Database error');
  });
});
```

## Related Documentation

- [Layered Architecture](../../docs/architecture/LAYERED_ARCHITECTURE.md)
- [Development Guidelines](../../docs/DEVELOPMENT_GUIDELINES.md)
- [API Routes](../../docs/API_ROUTES_GENERATOR.md)

## Questions?

- **"Can I query Supabase from a component?"** → No, use query layer
- **"Can I query Supabase from a hook?"** → No, use query layer through API
- **"Where do I put filtering logic?"** → Business hooks, not query layer
- **"Should I throw errors?"** → No, return them in QueryResult
