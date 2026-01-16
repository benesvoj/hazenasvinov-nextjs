# Development Guidelines

> Quick reference for common development tasks in this codebase

## Table of Contents
- [Adding a New Entity](#adding-a-new-entity)
- [Adding a New Feature](#adding-a-new-feature)
- [Adding Filtering/Pagination](#adding-filteringpagination)
- [Performance Optimization](#performance-optimization)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Adding a New Entity

### Checklist
- [ ] Create database table and run migrations
- [ ] Generate TypeScript types
- [ ] Create query layer
- [ ] Create hooks (data/state/business)
- [ ] Register in API config
- [ ] Create admin page (if needed)

### Step-by-Step

#### 1. Database Setup
```sql
-- Create migration
CREATE TABLE new_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Generate Schema
```bash
npm run db:generate-schemas
```

This creates `src/types/entities/new-entity/schema/newEntitySchema.ts`

#### 3. Create Data Types
```typescript
// src/types/entities/new-entity/data/newEntity.ts
import {NewEntitySchema} from '../schema/newEntitySchema';

export interface NewEntity extends NewEntitySchema {
  // Add relations if needed
}

export interface NewEntityFormData {
  name: string;
  description: string | null;
}

export interface NewEntityFilters {
  search?: string;
}
```

#### 4. Generate Data Types
```bash
npm run generate:types
```

#### 5. Create Query Layer
```typescript
// src/queries/newEntities/constants.ts
export const DB_TABLE = 'new_entities';
export const ENTITY = {
  singular: 'NewEntity',
  plural: 'NewEntities'
};

// src/queries/newEntities/queries.ts
import {buildSelectQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE} from './constants';
import {NewEntitySchema} from '@/types';

export async function getAllNewEntities(
  ctx: QueryContext,
  options?: QueryOptions
): Promise<QueryResult<NewEntitySchema[]>> {
  const query = buildSelectQuery(ctx.supabase, DB_TABLE, options);
  const {data, error} = await query;

  if (error) return {data: null, error: error.message};
  return {data: data as NewEntitySchema[], error: null};
}

export async function getNewEntityById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<NewEntitySchema>> {
  const {data, error} = await ctx.supabase
    .from(DB_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) return {data: null, error: error.message};
  return {data: data as NewEntitySchema, error: null};
}

// src/queries/newEntities/mutations.ts
import {buildInsertQuery, buildUpdateQuery, buildDeleteQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE} from './constants';
import {NewEntitySchema, NewEntityInsert} from '@/types';

export async function createNewEntity(
  ctx: QueryContext,
  data: NewEntityInsert
): Promise<QueryResult<NewEntitySchema>> {
  const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
  const {data: item, error} = await query;

  if (error) return {data: null, error: error.message};
  return {data: item as NewEntitySchema, error: null};
}

export async function updateNewEntity(
  ctx: QueryContext,
  id: string,
  data: Partial<NewEntityInsert>
): Promise<QueryResult<NewEntitySchema>> {
  const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
  const {data: item, error} = await query;

  if (error) return {data: null, error: error.message};
  return {data: item as NewEntitySchema, error: null};
}

export async function deleteNewEntity(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
  const {error} = await query;

  if (error) return {data: null, error: error.message};
  return {data: {success: true}, error: null};
}

// src/queries/newEntities/index.ts
export * from './constants';
export * from './queries';
export * from './mutations';
```

#### 6. Register in API Config
```typescript
// src/app/api/entities/config.ts
import * as newEntityQueries from '@/queries/newEntities';

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  // ... existing configs
  new_entities: {
    tableName: 'new_entities',
    sortBy: [{column: 'name', ascending: true}],
    requiresAdmin: true,
    queryLayer: {
      getAll: newEntityQueries.getAllNewEntities,
      getById: newEntityQueries.getNewEntityById,
      create: newEntityQueries.createNewEntity,
      update: newEntityQueries.updateNewEntity,
      delete: newEntityQueries.deleteNewEntity,
    },
  },
};
```

#### 7. Create Hooks
```typescript
// src/hooks/entities/new-entity/data/useFetchNewEntities.ts
import {createDataFetchHook} from '@/hooks/factories';
import {API_ROUTES} from '@/lib';
import {NewEntitySchema} from '@/types';

export const useFetchNewEntities = createDataFetchHook<NewEntitySchema>({
  endpoint: API_ROUTES.entities.root('new_entities'),
  entityName: 'new_entities',
  errorMessage: 'Failed to fetch entities',
});

// src/hooks/entities/new-entity/state/useNewEntityForm.ts
import {createFormHook} from '@/hooks/factories';
import {NewEntitySchema, NewEntityFormData} from '@/types';

export const useNewEntityForm = createFormHook<NewEntitySchema, NewEntityFormData>({
  initialFormData: {
    name: '',
    description: '',
  },
  validationRules: [
    {field: 'name', message: 'Name is required'},
  ],
});

// src/hooks/entities/new-entity/state/useNewEntities.ts
import {createCRUDHook} from '@/hooks/factories';
import {API_ROUTES} from '@/lib';
import {NewEntitySchema, NewEntityInsert} from '@/types';

export function useNewEntities() {
  const {create, update, deleteItem, loading} = createCRUDHook<NewEntitySchema, NewEntityInsert>({
    baseEndpoint: API_ROUTES.entities.root('new_entities'),
    byIdEndpoint: (id) => API_ROUTES.entities.byId('new_entities', id),
    entityName: 'new_entities',
    messages: {
      createSuccess: 'Entity created',
      updateSuccess: 'Entity updated',
      deleteSuccess: 'Entity deleted',
      createError: 'Failed to create entity',
      updateError: 'Failed to update entity',
      deleteError: 'Failed to delete entity',
    },
  });

  return {
    createEntity: create,
    updateEntity: update,
    deleteEntity: deleteItem,
    loading,
  };
}

// src/hooks/entities/new-entity/index.ts
export * from './data/useFetchNewEntities';
export * from './state/useNewEntityForm';
export * from './state/useNewEntities';
```

#### 8. Create Admin Page (Optional)
```typescript
// src/app/admin/new-entities/page.tsx.backup
'use client';

import {useCallback, useState} from 'react';
import {
  AdminContainer,
  DeleteConfirmationModal,
} from '@/components';
import {useFetchNewEntities, useNewEntityForm, useNewEntities} from '@/hooks';

export default function NewEntitiesPage() {
  const {data: entities, loading, refetch} = useFetchNewEntities();
  const {formData, setFormData, validateForm, openEditMode, resetForm} = useNewEntityForm();
  const {createEntity, updateEntity, deleteEntity} = useNewEntities();

  const handleSubmit = useCallback(async () => {
    const {valid} = validateForm();
    if (!valid) return;

    await createEntity(formData);
    await refetch();
    resetForm();
  }, [formData, validateForm, createEntity, refetch, resetForm]);

  return (
    <AdminContainer>
      {/* Add your UI components here */}
    </AdminContainer>
  );
}
```

---

## Adding a New Feature

### Pattern: Add Filtering to Existing Entity

#### 1. Create Business Hook
```typescript
// src/hooks/entities/video/business/useVideoFiltering.ts
import {useMemo, useState} from 'react';
import {VideoSchema, VideoFilters} from '@/types';

export interface VideoFilteringProps {
  videos: VideoSchema[];
  itemsPerPage: number;
  currentPage: number;
}

export const useVideoFiltering = ({videos, itemsPerPage, currentPage}: VideoFilteringProps) => {
  const [filters, setFilters] = useState<VideoFilters>({});

  const {paginatedVideos, totalPages, totalCount} = useMemo(() => {
    // Apply filters
    let filtered = videos;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return {paginatedVideos: paginated, totalPages: pages, totalCount: total};
  }, [videos, filters, currentPage, itemsPerPage]);

  return {filters, setFilters, paginatedVideos, totalPages, totalCount};
};
```

#### 2. Use in Component
```typescript
export default function VideosPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const {data: videos, loading} = useFetchVideos();

  const {filters, setFilters, paginatedVideos, totalPages} = useVideoFiltering({
    videos,
    itemsPerPage: 20,
    currentPage,
  });

  return (
    <>
      <Filters filters={filters} onChange={setFilters} />
      <VideoGrid videos={paginatedVideos} loading={loading} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </>
  );
}
```

---

## Adding Filtering/Pagination

### Quick Template

```typescript
// 1. Create types
export interface EntityFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
}

// 2. Create filtering hook
export const useEntityFiltering = ({entities, itemsPerPage, currentPage}) => {
  const [filters, setFilters] = useState<EntityFilters>({});

  const {paginatedEntities, totalPages, totalCount} = useMemo(() => {
    let filtered = entities;

    // Apply each filter
    if (filters.search) {
      filtered = filtered.filter(/* ... */);
    }

    // Pagination
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const paginated = filtered.slice(start, end);

    return {paginatedEntities: paginated, totalPages: pages, totalCount: total};
  }, [entities, filters, currentPage, itemsPerPage]);

  return {filters, setFilters, paginatedEntities, totalPages, totalCount};
};

// 3. Use in component
const {paginatedEntities} = useEntityFiltering({
  entities: allEntities,
  itemsPerPage: 20,
  currentPage: 1,
});
```

---

## Performance Optimization

### 1. Memoize Components
```typescript
// Before
export function VideoCard({video}) {
  return <Card>{video.title}</Card>;
}

// After
export const VideoCard = memo(function VideoCard({video}) {
  return <Card>{video.title}</Card>;
});
```

### 2. Memoize Callbacks
```typescript
// Before
const handleEdit = (item) => {
  openEditMode(item);
  modal.onOpen();
};

// After
const handleEdit = useCallback((item) => {
  openEditMode(item);
  modal.onOpen();
}, [openEditMode, modal]);
```

### 3. Memoize Expensive Calculations
```typescript
// Before
const filtered = videos.filter(/* expensive filter */);

// After
const filtered = useMemo(() => {
  return videos.filter(/* expensive filter */);
}, [videos, filters]);
```

### 4. Add Pagination
```typescript
// Before - rendering all 1000 videos
<VideoGrid videos={allVideos} />

// After - rendering only 20 videos per page
const {paginatedVideos} = useVideoFiltering({
  videos: allVideos,
  itemsPerPage: 20,
  currentPage,
});
<VideoGrid videos={paginatedVideos} />
```

---

## Common Patterns

### Pattern: Form with Validation
```typescript
const {formData, setFormData, validateForm, resetForm} = useEntityForm();
const {createEntity} = useEntities();

const handleSubmit = async () => {
  const {valid, errors} = validateForm();
  if (!valid) {
    console.error('Validation errors:', errors);
    return;
  }

  await createEntity(formData);
  resetForm();
};
```

### Pattern: Modal with Add/Edit Modes
```typescript
const {formData, modalMode, openAddMode, openEditMode, resetForm} = useEntityForm();
const {createEntity, updateEntity} = useEntities();

const handleSubmit = async () => {
  if (modalMode === ModalMode.EDIT && selectedItem) {
    await updateEntity(selectedItem.id, formData);
  } else {
    await createEntity(formData);
  }
  resetForm();
  modal.onClose();
};
```

### Pattern: Optimistic Updates
```typescript
const {data: entities, refetch} = useFetchEntities();
const {deleteEntity} = useEntities();

const handleDelete = async (id: string) => {
  await deleteEntity(id);
  await refetch(); // Refresh the list
};
```

---

## Troubleshooting

### Issue: "Type not found"

**Solution**: Check exports
```typescript
// src/types/entities/video/index.ts
export * from './schema/videosSchema';
export * from './data/video';

// src/types/index.ts
export * from './entities/video';
```

### Issue: "Module not found"

**Solution**: Check imports
```typescript
// ✅ Correct
import {VideoSchema} from '@/types';

// ❌ Wrong
import {VideoSchema} from '@/types/entities/video/schema/videosSchema';
```

### Issue: "Property does not exist on type"

**Solution**: Use correct type
```typescript
// ❌ Wrong - VideoSchema doesn't have match
videos: VideoSchema[]

// ✅ Correct - VideoWithMatch has match
videos: VideoWithMatch[]
```

### Issue: "Hook re-renders too much"

**Solution**: Add memoization
```typescript
// Wrap expensive components in memo
export const VideoCard = memo(/* ... */);

// Memoize callbacks
const handleClick = useCallback(/* ... */, [deps]);

// Memoize computations
const filtered = useMemo(/* ... */, [deps]);
```

---

## Quick Reference: File Locations

```
src/
├── app/
│   ├── api/entities/[entity]/    # API routes
│   └── admin/{entity}/            # Admin pages
├── components/
│   └── features/{entity}/         # Entity-specific components
├── hooks/
│   └── entities/{entity}/         # Entity hooks
│       ├── data/                  # Data fetching
│       ├── state/                 # State management
│       └── business/              # Business logic
├── queries/{entity}/              # Query layer
│   ├── constants.ts
│   ├── queries.ts
│   ├── mutations.ts
│   └── index.ts
└── types/entities/{entity}/       # Types
    ├── schema/                    # Auto-generated
    ├── data/                      # Manual types
    └── index.ts
```

---

## Related Documentation

- [Layered Architecture](./architecture/LAYERED_ARCHITECTURE.md) - Architecture overview
- [Factory Patterns](./architecture/FACTORY_PATTERNS.md) - Reusable hook factories
- [Type Organization](./architecture/TYPE_ORGANIZATION.md) - Type structure
- [Hooks README](../src/hooks/entities/README.md) - Hook organization

---

## Need Help?

1. Check existing examples (videos, blogs, todos)
2. Read architecture documentation
3. Look for similar patterns in codebase
4. Ask before creating new patterns
