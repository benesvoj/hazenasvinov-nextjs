# Layered Architecture

## Overview

This codebase follows a **layered architecture pattern** that separates concerns into distinct layers. Each layer has specific responsibilities and communicates with adjacent layers through well-defined interfaces.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (UI Components)                     │
│  src/app/, src/components/                              │
│  - React components                                     │
│  - UI logic only, no business logic                     │
│  - Uses hooks from Business/State layers               │
└─────────────────────────────────────────────────────────┘
                         ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (Hooks)                           │
│  src/hooks/entities/{entity}/business/                  │
│  - Filtering, sorting, calculations                     │
│  - Business rules and validations                       │
│  - Transforms data for presentation                     │
└─────────────────────────────────────────────────────────┘
                         ↓ uses
┌─────────────────────────────────────────────────────────┐
│  State Management Layer (Hooks)                         │
│  src/hooks/entities/{entity}/state/                     │
│  - Form state management                                │
│  - CRUD operations                                      │
│  - UI state (modals, selections)                        │
└─────────────────────────────────────────────────────────┘
                         ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Data Access Layer (Hooks)                              │
│  src/hooks/entities/{entity}/data/                      │
│  - Data fetching (useFetch{Entity})                    │
│  - Caching and loading states                           │
│  - Uses Query Layer                                     │
└─────────────────────────────────────────────────────────┘
                         ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Query Layer (Database Operations)                      │
│  src/queries/{entity}/                                  │
│  - Direct database access                               │
│  - Query building and execution                         │
│  - Data transformation from DB to app types             │
└─────────────────────────────────────────────────────────┘
                         ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Database Layer (Supabase)                              │
│  - PostgreSQL database                                  │
│  - Row Level Security (RLS)                             │
│  - Database triggers and functions                      │
└─────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation Layer
**Location:** `src/app/`, `src/components/`

**Responsibilities:**
- Render UI components
- Handle user interactions (clicks, form inputs)
- Display data from hooks
- Manage local UI state (open/closed, hover states)

**Rules:**
- ❌ NO direct database access
- ❌ NO business logic calculations
- ❌ NO data fetching logic
- ✅ Only UI logic and event handlers
- ✅ Use hooks for data and business logic

**Example:**
```typescript
// ✅ CORRECT: Component uses hooks
export default function VideosPage() {
  const {data: videos, loading} = useFetchVideos();
  const {filters, setFilters, paginatedVideos} = useVideoFiltering({
    videos,
    itemsPerPage: 20,
    currentPage: 1
  });

  return <VideoGrid videos={paginatedVideos} loading={loading} />;
}

// ❌ WRONG: Business logic in component
export default function VideosPage() {
  const [videos, setVideos] = useState([]);

  // ❌ Don't do filtering in component
  const filtered = videos.filter(v => v.is_active);

  return <VideoGrid videos={filtered} />;
}
```

### 2. Business Logic Layer
**Location:** `src/hooks/entities/{entity}/business/`

**Responsibilities:**
- Implement business rules
- Filter, sort, and transform data
- Calculate derived values
- Validate business constraints

**Rules:**
- ✅ Pure business logic
- ✅ Reusable across components
- ✅ Testable in isolation
- ❌ NO direct database access
- ❌ NO UI-specific logic

**Example:**
```typescript
// src/hooks/entities/video/business/useVideoFiltering.ts
export const useVideoFiltering = ({videos, itemsPerPage, currentPage}) => {
  const [filters, setFilters] = useState<VideoFilters>({});

  const { paginatedVideos, totalPages, totalCount } = useMemo(() => {
    // Apply business logic: filtering
    let filtered = videos;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply business logic: pagination
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const paginated = filtered.slice(startIndex, endIndex);

    return { paginatedVideos: paginated, totalPages: pages, totalCount: total };
  }, [videos, filters, currentPage, itemsPerPage]);

  return { filters, setFilters, paginatedVideos, totalPages, totalCount };
};
```

### 3. State Management Layer
**Location:** `src/hooks/entities/{entity}/state/`

**Responsibilities:**
- Form state management
- CRUD operation coordination
- Modal and UI state
- Selection management

**Rules:**
- ✅ Uses factory patterns (`createFormHook`, `createCRUDHook`)
- ✅ Coordinates between data layer and presentation
- ✅ Manages temporary state
- ❌ NO direct database queries

**Example:**
```typescript
// src/hooks/entities/video/state/useVideoForm.ts
export const useVideoForm = createFormHook<VideoSchema, VideoFormData>({
  initialFormData: {
    title: '',
    description: '',
    youtube_url: '',
    // ...
  },
  validationRules: [
    {field: 'youtube_url', message: 'YouTube URL is required'},
    {field: 'title', message: 'Title is required'},
  ]
});

// src/hooks/entities/video/state/useVideos.ts
export function useVideos() {
  const {create, update, deleteItem} = createCRUDHook<VideoSchema, VideoInsert>({
    baseEndpoint: API_ROUTES.entities.root('videos'),
    entityName: 'videos',
    messages: { /* ... */ }
  });

  return {
    createVideo: create,
    updateVideo: update,
    deleteVideo: deleteItem,
  };
}
```

### 4. Data Access Layer
**Location:** `src/hooks/entities/{entity}/data/`

**Responsibilities:**
- Fetch data from API
- Manage loading and error states
- Cache data (via React Query or similar)
- Trigger refetches

**Rules:**
- ✅ Uses factory pattern (`createDataFetchHook`)
- ✅ Calls Query Layer through API routes
- ✅ Handles async operations
- ❌ NO business logic

**Example:**
```typescript
// src/hooks/entities/video/data/useFetchVideos.ts
export const useFetchVideos = createDataFetchHook<VideoSchema>({
  endpoint: API_ROUTES.entities.root('videos'),
  entityName: 'videos',
  errorMessage: 'Failed to fetch videos',
});

// Usage in component
const {data: videos, loading, error, refetch} = useFetchVideos();
```

### 5. Query Layer
**Location:** `src/queries/{entity}/`

**Responsibilities:**
- Build and execute database queries
- Transform database types to application types
- Handle complex joins and relations
- Centralize all database access

**Structure:**
```
queries/{entity}/
├── constants.ts    # DB_TABLE, ENTITY names
├── queries.ts      # Read operations (getAll, getById)
├── mutations.ts    # Write operations (create, update, delete)
└── index.ts        # Exports
```

**Rules:**
- ✅ ONLY place for direct Supabase access
- ✅ Use QueryContext for Supabase client
- ✅ Return QueryResult<T> type
- ✅ Handle errors gracefully
- ❌ NO business logic

**Example:**
```typescript
// src/queries/videos/queries.ts
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
    return {data: null, error: err.message};
  }
}
```

## Data Flow Example

Let's trace a complete flow for displaying filtered videos:

```typescript
// 1. USER ACTION: User clicks on Videos page
// → Browser navigates to /admin/videos

// 2. PRESENTATION LAYER: Component renders
// src/app/admin/videos/page.tsx
export default function VideosPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // 3. DATA ACCESS LAYER: Fetch all videos
  const {data: allVideos, loading} = useFetchVideos();
  //   └─> calls API route /api/entities/videos

  // 4. BUSINESS LOGIC LAYER: Filter and paginate
  const {filters, paginatedVideos} = useVideoFiltering({
    videos: allVideos,
    currentPage,
    itemsPerPage: 20
  });
  //   └─> applies filtering and pagination logic

  // 5. PRESENTATION LAYER: Render filtered data
  return <VideoGrid videos={paginatedVideos} loading={loading} />;
}

// Behind the scenes:
// API Route: /api/entities/videos/route.ts
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const config = ENTITY_CONFIGS['videos'];

    // 6. QUERY LAYER: Execute database query
    const result = await config.queryLayer.getAll({supabase});
    //   └─> queries.getAllVideos()
    //       └─> Supabase query execution

    return successResponse(result.data);
  });
}
```

## Communication Rules Between Layers

### ✅ Allowed Communication Patterns

```
Component → Business Hook → Data Hook → API → Query Layer → Database
Component → State Hook → API → Query Layer → Database
Component → Business Hook (for pure calculations)
```

### ❌ Forbidden Communication Patterns

```
Component → Direct Database ❌
Component → Query Layer ❌
Business Hook → Direct Database ❌
State Hook → Direct Database ❌
Component → Direct API calls (use hooks) ❌
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Business logic can be tested independently
3. **Reusability**: Hooks can be shared across components
4. **Maintainability**: Changes are localized to specific layers
5. **Type Safety**: Strong typing between layers
6. **Performance**: Easy to optimize with memoization at the right layer

## Migration from Old Pattern

If you find code that doesn't follow this pattern:

### Before (Direct Supabase in Component)
```typescript
// ❌ OLD PATTERN - Don't do this
export default function VideosPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const supabase = createClient();
      const {data} = await supabase.from('videos').select('*');
      setVideos(data);
    };
    fetchVideos();
  }, []);

  return <VideoGrid videos={videos} />;
}
```

### After (Layered Architecture)
```typescript
// ✅ NEW PATTERN - Use layered architecture
export default function VideosPage() {
  // Data Access Layer
  const {data: videos, loading} = useFetchVideos();

  // Business Logic Layer
  const {paginatedVideos} = useVideoFiltering({
    videos,
    currentPage: 1,
    itemsPerPage: 20
  });

  // Presentation Layer
  return <VideoGrid videos={paginatedVideos} loading={loading} />;
}
```

## AI Guidelines

When working with this codebase:

1. **Always identify the correct layer** for new functionality
2. **Check existing patterns** before creating new code
3. **Use factory patterns** when available
4. **Never bypass layers** - follow the flow
5. **Document** when creating new patterns
6. **Ask before** creating direct database access in components

## Related Documentation

- [Factory Patterns](./FACTORY_PATTERNS.md) - Reusable hook factories
- [Type Organization](./TYPE_ORGANIZATION.md) - How types are structured
- [Query Layer Pattern](./QUERY_LAYER_PATTERN.md) - Database access details
- [Development Guidelines](../DEVELOPMENT_GUIDELINES.md) - Quick reference

## Questions?

If you're unsure which layer to use:
- **"Where should filtering logic go?"** → Business Logic Layer
- **"Where should I fetch data?"** → Data Access Layer (using factory)
- **"Where should I manage form state?"** → State Management Layer (using factory)
- **"Where should I query the database?"** → Query Layer only
- **"Where should I display data?"** → Presentation Layer
