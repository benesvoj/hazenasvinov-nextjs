# Factory Patterns

## Overview

This codebase uses **factory patterns** to generate hooks with consistent behavior. Instead of writing repetitive boilerplate code for each entity, we use factory functions that create customized hooks.

## Benefits

- ✅ **Consistency**: All entities follow the same patterns
- ✅ **Less Boilerplate**: Write configuration, not implementation
- ✅ **Maintainability**: Fix bugs in one place
- ✅ **Type Safety**: Strongly typed with generics
- ✅ **Testability**: Factories can be tested once

## Available Factories

### 1. `createDataFetchHook` - Data Fetching

**Purpose**: Create hooks that fetch data from API endpoints with loading and error states.

**Location**: `src/hooks/factories/createDataFetchHook.ts`

**When to Use**:
- Fetching lists of entities
- Fetching single entities by ID
- Any GET operation

**Configuration**:
```typescript
interface DataFetchHookConfig {
  endpoint: string;              // API endpoint to fetch from
  entityName: string;            // Entity name for error messages
  errorMessage: string;          // Error message on failure
  fetchOnMount?: boolean;        // Auto-fetch on mount (default: true)
  showErrorToast?: boolean;      // Show error toast (default: true)
}
```

**Returns**:
```typescript
interface DataFetchHookResult<T> {
  data: T[];                     // Fetched data
  loading: boolean;              // Loading state
  error: string | null;          // Error message
  refetch: () => Promise<void>;  // Refetch function
}
```

**Example Usage**:
```typescript
// src/hooks/entities/video/data/useFetchVideos.ts
import {createDataFetchHook} from "@/hooks/factories";
import {API_ROUTES} from "@/lib";
import {VideoSchema} from "@/types";

export const useFetchVideos = createDataFetchHook<VideoSchema>({
  endpoint: API_ROUTES.entities.root('videos'),
  entityName: 'videos',
  errorMessage: 'Failed to fetch videos',
});

// Usage in component
const {data: videos, loading, error, refetch} = useFetchVideos();
```

**Generated Hook Behavior**:
- ✅ Automatically fetches on mount
- ✅ Manages loading state
- ✅ Handles errors with toasts
- ✅ Provides refetch function
- ✅ Cancels pending requests on unmount

---

### 2. `createFormHook` - Form State Management

**Purpose**: Create hooks that manage form state, validation, and modes (add/edit).

**Location**: `src/hooks/factories/createFormHook.ts`

**When to Use**:
- Creating forms with validation
- Managing add/edit modes
- Handling form submission

**Configuration**:
```typescript
interface FormHookConfig<TEntity, TFormData> {
  initialFormData: TFormData;               // Initial form state
  validationRules: ValidationRule<TFormData>[]; // Validation rules
  excludeFields?: string[];                 // Fields to exclude in edit mode
}

interface ValidationRule<T> {
  field: keyof T;
  message: string;
  validator?: (value: any) => boolean;      // Custom validator
}
```

**Returns**:
```typescript
interface FormHookResult<TEntity, TFormData> {
  formData: TFormData;                      // Current form data
  selectedItem: TEntity | null;             // Selected item in edit mode
  modalMode: ModalMode;                     // ADD or EDIT
  setFormData: (data: TFormData) => void;   // Set form data
  updateFormData: (updates: Partial<TFormData>) => void; // Partial update
  openAddMode: () => void;                  // Switch to add mode
  openEditMode: (item: TEntity) => void;    // Switch to edit mode
  resetForm: () => void;                    // Reset to initial state
  validateForm: () => {valid: boolean; errors: string[]}; // Validate
}
```

**Example Usage**:
```typescript
// src/hooks/entities/video/state/useVideoForm.ts
import {createFormHook} from "@/hooks/factories";
import {VideoSchema, VideoFormData} from "@/types";

export const useVideoForm = createFormHook<VideoSchema, VideoFormData>({
  initialFormData: {
    title: '',
    description: '',
    youtube_url: '',
    category_id: '',
    club_id: '',
    recording_date: '',
    season_id: '',
    is_active: true,
  },
  validationRules: [
    {field: 'youtube_url', message: 'YouTube URL is required'},
    {field: 'title', message: 'Title is required'},
    {field: 'category_id', message: 'Category is required'},
  ],
});

// Usage in component
const {
  formData,
  setFormData,
  modalMode,
  validateForm,
  openAddMode,
  openEditMode,
  resetForm
} = useVideoForm();
```

**Generated Hook Behavior**:
- ✅ Manages form state with React.useState
- ✅ Validates fields on submit
- ✅ Shows validation errors as toasts
- ✅ Handles add/edit modes
- ✅ Auto-populates form in edit mode
- ✅ Excludes read-only fields

---

### 3. `createCRUDHook` - CRUD Operations

**Purpose**: Create hooks that perform Create, Update, Delete operations via API.

**Location**: `src/hooks/factories/createCRUDHook.ts`

**When to Use**:
- Creating new records
- Updating existing records
- Deleting records

**Configuration**:
```typescript
interface CRUDHookConfig {
  baseEndpoint: string;           // API endpoint for collection
  byIdEndpoint: (id: string) => string; // API endpoint for single item
  entityName: string;             // Entity name for messages
  messages: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    createError: string;
    updateError: string;
    deleteError: string;
  };
}
```

**Returns**:
```typescript
interface CRUDHookResult<TEntity, TInsert> {
  loading: boolean;
  error: string | null;
  create: (data: TInsert) => Promise<TEntity | null>;
  update: (id: string, data: Partial<TInsert>) => Promise<TEntity | null>;
  deleteItem: (id: string) => Promise<boolean>;
}
```

**Example Usage**:
```typescript
// src/hooks/entities/video/state/useVideos.ts
import {createCRUDHook} from "@/hooks/factories";
import {API_ROUTES} from "@/lib";
import {VideoSchema, VideoInsert} from "@/types";

const _useVideos = createCRUDHook<VideoSchema, VideoInsert>({
  baseEndpoint: API_ROUTES.entities.root('videos'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('videos', id),
  entityName: 'videos',
  messages: {
    createSuccess: 'Video created successfully',
    updateSuccess: 'Video updated successfully',
    deleteSuccess: 'Video deleted successfully',
    createError: 'Failed to create video',
    updateError: 'Failed to update video',
    deleteError: 'Failed to delete video',
  },
});

export function useVideos() {
  const {create, update, deleteItem, loading} = _useVideos();

  return {
    createVideo: create,
    updateVideo: update,
    deleteVideo: deleteItem,
    loading,
  };
}

// Usage in component
const {createVideo, updateVideo, deleteVideo, loading} = useVideos();
await createVideo({title: 'New Video', youtube_url: '...'});
```

**Generated Hook Behavior**:
- ✅ Manages loading state during operations
- ✅ Shows success/error toasts
- ✅ Returns created/updated data
- ✅ Handles API errors gracefully

---

## Factory Usage Patterns

### Pattern 1: Simple Entity CRUD

For a basic entity with simple CRUD operations:

```typescript
// 1. Data fetching
export const useFetchEntities = createDataFetchHook<EntitySchema>({
  endpoint: API_ROUTES.entities.root('entities'),
  entityName: 'entities',
  errorMessage: 'Failed to fetch entities',
});

// 2. Form management
export const useEntityForm = createFormHook<EntitySchema, EntityFormData>({
  initialFormData: { /* ... */ },
  validationRules: [ /* ... */ ],
});

// 3. CRUD operations
export const useEntities = () => {
  const {create, update, deleteItem} = createCRUDHook<EntitySchema, EntityInsert>({
    baseEndpoint: API_ROUTES.entities.root('entities'),
    byIdEndpoint: (id) => API_ROUTES.entities.byId('entities', id),
    entityName: 'entities',
    messages: { /* ... */ },
  });

  return {createEntity: create, updateEntity: update, deleteEntity: deleteItem};
};
```

### Pattern 2: Custom Business Logic Extension

When you need custom logic beyond the factory:

```typescript
// Use factory for base functionality
const useBaseForm = createFormHook<VideoSchema, VideoFormData>({
  initialFormData: { /* ... */ },
  validationRules: [ /* ... */ ],
});

// Extend with custom logic
export function useVideoFormWithYouTubeValidation() {
  const baseForm = useBaseForm();

  const validateYouTubeUrl = useCallback((url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return regex.test(url);
  }, []);

  const customValidateForm = useCallback(() => {
    const baseValidation = baseForm.validateForm();

    if (!validateYouTubeUrl(baseForm.formData.youtube_url)) {
      return {
        valid: false,
        errors: [...baseValidation.errors, 'Invalid YouTube URL format']
      };
    }

    return baseValidation;
  }, [baseForm, validateYouTubeUrl]);

  return {
    ...baseForm,
    validateForm: customValidateForm,
  };
}
```

### Pattern 3: Wrapper for Better API

Sometimes you want to provide a cleaner API:

```typescript
// Internal factory usage
const _useCRUD = createCRUDHook<VideoSchema, VideoInsert>({ /* ... */ });

// Public wrapper with better naming
export function useVideos() {
  const {loading, error, create, update, deleteItem} = _useCRUD();

  return {
    loading,
    error,
    createVideo: create,
    updateVideo: update,
    deleteVideo: deleteItem,
  };
}
```

---

## When NOT to Use Factories

### Don't Use Factories When:

1. **Highly Custom Logic**: Entity has unique behavior that doesn't fit the pattern
2. **Complex Validations**: Need multi-field cross-validation
3. **Special API Handling**: Non-standard API responses
4. **Performance Critical**: Need fine-grained control over re-renders

### Example: Custom Hook Instead of Factory

```typescript
// ❌ Don't force into factory if it doesn't fit
export function useComplexVideoAnalytics(videoId: string) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Complex logic with multiple API calls
    const fetchAnalytics = async () => {
      const views = await fetchViews(videoId);
      const engagement = await fetchEngagement(videoId);
      const demographics = await fetchDemographics(videoId);

      setAnalytics({
        views,
        engagement,
        demographics,
        score: calculateComplexScore(views, engagement, demographics)
      });
    };

    fetchAnalytics();
  }, [videoId]);

  return {analytics, loading};
}
```

---

## Creating a New Factory

If you identify a repeated pattern, create a new factory:

### Steps:

1. **Identify the Pattern**: Find 3+ similar implementations
2. **Extract Configuration**: What varies between implementations?
3. **Define Interfaces**: Config interface and result interface
4. **Implement Factory**: Create the factory function
5. **Document**: Add to this file with examples
6. **Migrate**: Update existing code to use factory

### Example: Creating a Pagination Factory

```typescript
// src/hooks/factories/createPaginationHook.ts

export interface PaginationConfig {
  itemsPerPage: number;
  defaultPage?: number;
}

export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

export function createPaginationHook<T>(config: PaginationConfig) {
  return function usePagination(data: T[]): PaginationResult<T> {
    const [currentPage, setCurrentPage] = useState(config.defaultPage || 1);

    const totalPages = Math.ceil(data.length / config.itemsPerPage);
    const startIndex = (currentPage - 1) * config.itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + config.itemsPerPage);

    return {
      currentPage,
      totalPages,
      paginatedData,
      goToPage: setCurrentPage,
      nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
      previousPage: () => setCurrentPage(p => Math.max(p - 1, 1)),
    };
  };
}

// Usage
export const useVideoPagination = createPaginationHook<VideoSchema>({
  itemsPerPage: 20,
  defaultPage: 1,
});
```

---

## AI Guidelines for Factories

When working with this codebase:

1. **Always check if a factory exists** before writing custom logic
2. **Use factories for standard operations** (CRUD, forms, data fetching)
3. **Extend factories** when you need custom behavior
4. **Don't force-fit** complex logic into factories
5. **Propose new factories** when you see repeated patterns
6. **Follow naming conventions**: `use{Entity}{Purpose}` for generated hooks

## Testing Factories

Factories should be tested once at the factory level:

```typescript
// __tests__/createDataFetchHook.test.ts
describe('createDataFetchHook', () => {
  it('should fetch data on mount', async () => {
    const useFetchTest = createDataFetchHook({
      endpoint: '/api/test',
      entityName: 'test',
      errorMessage: 'Failed',
    });

    const {result} = renderHook(() => useFetchTest());

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });
});
```

Then individual hooks don't need separate tests unless they have custom logic.

---

## Related Documentation

- [Layered Architecture](./LAYERED_ARCHITECTURE.md) - Where factories fit in the architecture
- [Development Guidelines](../DEVELOPMENT_GUIDELINES.md) - How to use factories when building features
- [Hook Organization](../../src/hooks/entities/README.md) - Hook directory structure

## Questions?

- **"Should I use a factory?"** → If similar code exists elsewhere, yes
- **"Which factory should I use?"** → Match the responsibility (data/state/CRUD)
- **"Can I customize factory output?"** → Yes, wrap or extend it
- **"Factory doesn't fit my needs?"** → Write a custom hook instead
