# Entity Hooks

## Overview

This directory contains **all hooks related to entities** in the application. Hooks are organized by entity and then by responsibility following a strict three-layer structure.

## Directory Structure

```
hooks/entities/{entity}/
├── data/          # Data fetching hooks
│   ├── useFetch{Entity}.ts
│   └── useFetch{Entity}ById.ts
├── state/         # State management hooks
│   ├── use{Entity}Form.ts
│   └── use{Entity}s.ts (CRUD operations)
└── business/      # Business logic hooks
    ├── use{Entity}Filtering.ts
    ├── use{Entity}Analytics.ts
    └── use{Entity}Validation.ts
```

## Layer Responsibilities

### Data Layer (`data/`)
**Purpose**: Fetch data from API with loading and error states

**Naming**: `useFetch{Entity}`, `useFetch{Entity}ById`, `useFetch{Entity}{Context}`

**Factory**: `createDataFetchHook`

**Example**:
```typescript
// data/useRecordings.ts
export const useRecordings = createDataFetchHook<VideoSchema>({
  endpoint: API_ROUTES.entities.root('videos'),
  entityName: 'videos',
  errorMessage: 'Failed to fetch videos',
});
```

**When to use**:
- ✅ Fetching lists of entities
- ✅ Fetching single entities
- ✅ Any GET operation

**When NOT to use**:
- ❌ Filtering or transforming data (use business layer)
- ❌ Form state management (use state layer)
- ❌ Write operations (use state layer)

### State Layer (`state/`)
**Purpose**: Manage component state and coordinate CRUD operations

**Naming**: `use{Entity}Form`, `use{Entity}s`, `use{Entity}Selection`

**Factories**: `createFormHook`, `createCRUDHook`

**Example**:
```typescript
// state/useRecordingForm.ts
export const useRecordingForm = createFormHook<VideoSchema, VideoFormData>({
  initialFormData: { /* ... */ },
  validationRules: [ /* ... */ ],
});

// state/useRecordingsCrud.ts
export function useRecordingsCrud() {
  const {create, update, deleteItem} = createCRUDHook<VideoSchema, VideoInsert>({
    baseEndpoint: API_ROUTES.entities.root('videos'),
    entityName: 'videos',
    messages: { /* ... */ },
  });

  return {createVideo: create, updateVideo: update, deleteVideo: deleteItem};
}
```

**When to use**:
- ✅ Form state management
- ✅ Create/Update/Delete operations
- ✅ Modal state
- ✅ Selection state

**When NOT to use**:
- ❌ Data fetching (use data layer)
- ❌ Complex calculations (use business layer)
- ❌ Direct database access (use query layer)

### Business Layer (`business/`)
**Purpose**: Implement business logic, filtering, calculations

**Naming**: `use{Entity}{Purpose}` (e.g., `useRecordingFilter`, `useVideoAnalytics`)

**Factory**: Usually custom implementation

**Example**:
```typescript
// business/useRecordingFilter.ts
export const useRecordingFilter = ({videos, itemsPerPage, currentPage}) => {
  const [filters, setFilters] = useState<RecordingFilters>({});

  const {paginatedVideos, totalPages} = useMemo(() => {
    // Apply filtering logic
    let filtered = videos;

    if (filters.search) {
      filtered = filtered.filter(/* ... */);
    }

    // Apply pagination
    const paginated = filtered.slice(startIndex, endIndex);

    return {paginatedVideos: paginated, totalPages: /* ... */};
  }, [videos, filters, currentPage]);

  return {filters, setFilters, paginatedVideos, totalPages};
};
```

**When to use**:
- ✅ Filtering and sorting
- ✅ Calculations and aggregations
- ✅ Data transformations
- ✅ Business rule validations

**When NOT to use**:
- ❌ UI state management (use state layer)
- ❌ Data fetching (use data layer)
- ❌ Database operations (use query layer)

## Related Documentation

- [Layered Architecture](../../docs/architecture/LAYERED_ARCHITECTURE.md)
- [Factory Patterns](../../docs/architecture/FACTORY_PATTERNS.md)
- [Development Guidelines](../../docs/DEVELOPMENT_GUIDELINES.md)
