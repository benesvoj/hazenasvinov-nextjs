# AppDataContext Refactoring Analysis

**Date**: 2025-11-10
**Status**: Analysis & Recommendations
**Priority**: High - Architectural Improvement

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Problems Identified](#problems-identified)
4. [Existing Architecture Pattern](#existing-architecture-pattern)
5. [Refactoring Strategy](#refactoring-strategy)
6. [Implementation Plan](#implementation-plan)
7. [Benefits](#benefits)
8. [Migration Guide](#migration-guide)

---

## Executive Summary

The `AppDataContext` is currently bypassing the established API layer architecture by directly calling Supabase from the client. This creates several issues:

- **Security**: Client-side Supabase calls expose database structure
- **Inconsistency**: Seasons, Categories, and Clubs use API routes, but AppDataContext bypasses them
- **Maintainability**: Duplicated data fetching logic across the codebase
- **Caching**: Custom cache implementation in context when API layer should handle this

**Recommendation**: Refactor AppDataContext to use existing API routes through the established hooks layer pattern.

---

## Current State Analysis

### File Location
```
src/contexts/AppDataContext.tsx (362 lines)
```

### Current Implementation

```typescript
// ❌ CURRENT: Direct Supabase access from client
const fetchSeasons = useCallback(async (): Promise<Season[]> => {
  return getCachedData('seasons', async () => {
    const {data, error} = await supabase
      .from('seasons')
      .select('id, name, start_date, end_date, is_active, is_closed')
      .order('start_date', {ascending: false})
      .limit(50);

    if (error) throw error;
    return data || [];
  });
}, [supabase]);
```

### Context Responsibilities

The `AppDataContext` currently manages:

1. **Data Fetching** - Seasons, Categories, Members, Clubs
2. **Caching** - 5-minute cache with timestamps and request deduplication
3. **Loading States** - Individual and global loading states
4. **Error Handling** - Individual and global error states
5. **Refresh Actions** - Individual and global refresh methods
6. **Computed Properties** - `activeSeason`, `sortedSeasons`

### Usage

Used in **10+ pages** including:
- `/app/coaches/attendance/page.tsx.backup`
- `/app/coaches/videos/page.tsx.backup`
- `/app/coaches/members/page.tsx.backup`
- `/app/admin/members/page.tsx.backup`
- `/app/admin/categories/components/CategoryFeesTab.tsx`
- And more...

---

## Problems Identified

### 1. Architecture Violation

**Issue**: Bypasses established API layer
```
Current Flow:
Client Component → AppDataContext → Supabase (Direct)

Should Be:
Client Component → Hook (data layer) → API Route → Supabase
```

### 2. Security Concerns

- Exposes database schema to client
- Row Level Security (RLS) must be perfectly configured
- No server-side validation or data sanitization
- Authentication happens on client side

### 3. Code Duplication

**Seasons Example**:
```typescript
// ❌ In AppDataContext (Lines 118-129)
const {data, error} = await supabase
  .from('seasons')
  .select('id, name, start_date, end_date, is_active, is_closed')
  .order('start_date', {ascending: false})
  .limit(50);

// ✅ In API Route (src/app/api/seasons/route.ts:9-12)
const {data, error} = await supabase
  .from('seasons')
  .select('*')
  .order('start_date', {ascending: false});

// ✅ Already has fetch hook (src/hooks/entities/season/data/useFetchSeasons.ts)
const res = await fetch(API_ROUTES.seasons.root);
```

### 4. Inconsistent Data Layer

| Entity     | API Route | Fetch Hook Uses API | AppDataContext Uses API |
|------------|-----------|---------------------|-------------------------|
| Seasons    | ✅        | ✅                  | ❌ (Direct Supabase)    |
| Categories | ✅        | ✅                  | ❌ (Direct Supabase)    |
| Clubs      | ✅        | ✅                  | ❌ (Direct Supabase)    |
| Members    | ✅        | ❌ (Direct Supabase)| ❌ (Direct Supabase)    |

### 5. Over-Engineering

- Custom caching with `requestCache` Map (174 lines just for caching)
- Manual cache invalidation
- Manual request deduplication
- This should be handled by:
  - React Query / SWR (recommended)
  - Next.js caching
  - API route-level caching

### 6. Limited Query Capability

The context always fetches ALL data with fixed filters:
```typescript
// Categories: Always filters by is_active = true
.eq('is_active', true)

// Clubs: Always filters by is_active = true
.eq('is_active', true)
```

Pages may need different filters, but context forces these constraints.

---

## Existing Architecture Pattern

Your codebase follows a **3-Layer Architecture**:

```
src/hooks/entities/{entity}/
├── data/          # Data fetching hooks (API calls)
│   ├── useFetchSeasons.ts
│   ├── useFetchCategories.ts
│   └── useFetchClubs.ts
│
├── business/      # Business logic (optional)
│   └── useSeasonCalculations.ts
│
└── state/         # State management
    ├── useSeasons.ts       # Combines data + state
    └── useSeasonForm.ts    # Form state
```

### Example: Season Entity

#### 1. API Route (`src/app/api/seasons/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('seasons')
      .select('*')
      .order('start_date', {ascending: false});

    if (error) throw error;
    return successResponse(data);
  })
}
```

#### 2. Data Hook (`src/hooks/entities/season/data/useFetchSeasons.ts`)
```typescript
export function useFetchSeasons() {
  const [data, setData] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    const res = await fetch(API_ROUTES.seasons.root);
    const response = await res.json();
    setData(response.data || []);
  }

  useEffect(() => { fetchData(); }, []);

  return { data, loading, error, refetch: fetchData };
}
```

#### 3. State Hook (`src/hooks/entities/season/state/useSeasons.ts`)
```typescript
// Combines fetching + state management + business logic
export function useSeasons() {
  const { data, loading, error, refetch } = useFetchSeasons();

  const activeSeason = useMemo(
    () => data.find(s => s.is_active) || null,
    [data]
  );

  return { seasons: data, activeSeason, loading, error, refetch };
}
```

---

## Refactoring Strategy

### Phase 1: Create Proper Data Hooks ✅

**Already Exists:**
- ✅ `useFetchSeasons` - Uses API route
- ✅ `useFetchCategories` - Uses API route
- ✅ `useFetchClubs` - Uses API route

**Needs Fix:**
- ❌ `useFetchMembers` - Currently uses direct Supabase, should use API route

### Phase 2: Create State Management Hooks

**Status Update:**
- ✅ `useSeasons` - Already exists and follows the correct pattern!
- ⚠️ `useCategories` - EXISTS but is a **CRUD/mutation hook**, not a data management hook
- ⚠️ `useMembers` - EXISTS but is a **CRUD/mutation hook**, not a data management hook
- ⚠️ `useClubs` - EXISTS but is a **CRUD/mutation hook**, not a data management hook

**Important:** The existing `useCategories`, `useMembers`, and `useClubs` hooks provide CRUD operations (create/update/delete), but we need data fetching hooks that combine `useFetchX` with computed properties.

**Options:**
1. **Option A**: Create new hooks with different names (e.g., `useCategoriesData`, `useMembersData`, `useClubsData`)
2. **Option B**: Extend existing hooks to include both CRUD operations AND data fetching
3. **Option C**: Keep using `useFetchX` hooks directly in AppDataContext

**Recommended: Option C** - Use `useFetchX` hooks directly since they already provide what we need, and keep mutation hooks separate.

### Phase 3: Refactor AppDataContext

Transform `AppDataContext` from a **data fetcher** to a **state aggregator**:

**BEFORE** (Current):
```typescript
// ❌ Context fetches data directly from Supabase
export function AppDataProvider({children}: {children: React.ReactNode}) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const supabase = useMemo(() => createClient(), []);

  const fetchSeasons = async () => {
    const {data} = await supabase.from('seasons').select('*');
    setSeasons(data);
  };

  return <AppDataContext.Provider value={{seasons}} />;
}
```

**AFTER** (Proposed):
```typescript
// ✅ Context consumes existing hooks (single source of truth)
export function AppDataProvider({children}: {children: React.ReactNode}) {
  const seasonsState = useSeasons();        // Uses API route
  const categoriesState = useCategories();  // Uses API route
  const membersState = useMembers();        // Uses API route
  const clubsState = useClubs();            // Uses API route

  return (
    <AppDataContext.Provider
      value={{
        seasons: seasonsState,
        categories: categoriesState,
        members: membersState,
        clubs: clubsState,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
```

### Phase 4: Update Consumers

Update components to use the new context shape:

**BEFORE**:
```typescript
const { seasons, loading, refreshSeasons } = useAppData();
```

**AFTER**:
```typescript
const { seasons } = useAppData();
const { data, loading, refetch } = seasons;
```

---

## Implementation Plan

### Step 1: Fix `useFetchMembers` Hook

**File**: `src/hooks/entities/member/data/useFetchMembers.ts`

```typescript
// Current (Line 18-24): Direct Supabase call
const supabase = createClient();
const {data, error} = await supabase
  .from('members')
  .select('*')
  .order('surname', {ascending: true});

// Change to:
const res = await fetch(API_ROUTES.members.root);
const response = await res.json();
if (!res.ok) throw new Error(response.error);
setMembers(response.data || []);
```

### Step 2: Create Data Management Hooks (with computed properties)

**Note**: `useCategories`, `useMembers`, and `useClubs` already exist as CRUD/mutation hooks. We'll use the fetch hooks directly and add computed properties in the context.

#### 2.1 ✅ `useSeasons` State Hook (Already Exists!)

**File**: `src/hooks/entities/season/state/useSeasons.ts`

Already implemented correctly! Combines `useFetchSeasons` with computed properties like `activeSeason` and `sortedSeasons`.

#### 2.2 Alternative Approach: Use Fetch Hooks Directly

Since the mutation hooks (`useCategories`, `useMembers`, `useClubs`) already exist, we have two options:

**Option A**: Create wrapper hooks with different names
- `useCategoriesData` - wraps `useFetchCategories` + adds computed properties
- `useMembersData` - wraps `useFetchMembers` + adds computed properties
- `useClubsData` - wraps `useFetchClubs` + adds computed properties

**Option B (Recommended)**: Use `useFetchX` hooks directly in AppDataContext and add computed properties there:

```typescript
// In AppDataContext
const { data: categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useFetchCategories();

const activeCategories = useMemo(
  () => categories.filter(c => c.is_active),
  [categories]
);
```

This approach:
- Avoids naming conflicts with existing mutation hooks
- Keeps data fetching separate from mutations
- Allows both mutation hooks and data hooks to coexist
- Reduces the number of new files needed

### Step 3: Refactor AppDataContext

**File**: `src/contexts/AppDataContext.tsx`

<details>
<summary><b>See Full Refactored Implementation (Click to expand)</b></summary>

```typescript
'use client';

import React, {createContext, useContext, useMemo} from 'react';

import {
  useSeasons,
  useFetchCategories,
  useFetchMembers,
  useFetchClubs
} from '@/hooks';
import {Season, Category, Member, Club} from '@/types';

// Type for each entity's state
interface EntityState<T> {
  data: T[];
  loading: boolean;
  error: string | Error | null;
  refetch: () => Promise<void> | void;
}

interface SeasonsState extends EntityState<Season> {
  activeSeason: Season | null;
  sortedSeasons: Season[];
}

interface CategoriesState extends EntityState<Category> {
  activeCategories: Category[];
}

interface MembersState extends EntityState<Member> {
  sortedMembers: Member[];
}

interface ClubsState extends EntityState<Club> {}

interface AppDataContextType {
  seasons: SeasonsState;
  categories: CategoriesState;
  members: MembersState;
  clubs: ClubsState;

  // Global states
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({children}: {children: React.ReactNode}) {
  // Use existing hooks - single source of truth!
  // useSeasons already combines fetch + state management
  const seasonsHook = useSeasons();

  // For other entities, use fetch hooks directly since mutation hooks exist separately
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useFetchCategories();

  const {
    members: membersData,
    loading: membersLoading,
    error: membersError,
    fetchMembers: refetchMembers
  } = useFetchMembers();

  const {
    data: clubsData,
    loading: clubsLoading,
    errors: clubsError,
    refetch: refetchClubs
  } = useFetchClubs();

  // Computed properties for categories
  const activeCategories = useMemo(
    () => categoriesData.filter((c: Category) => c.is_active),
    [categoriesData]
  );

  // Computed properties for members
  const sortedMembers = useMemo(
    () => [...membersData].sort((a, b) =>
      `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`)
    ),
    [membersData]
  );

  // Global loading state
  const loading = useMemo(() =>
    seasonsHook.loading ||
    categoriesLoading ||
    membersLoading ||
    clubsLoading,
    [seasonsHook.loading, categoriesLoading, membersLoading, clubsLoading]
  );

  // Global error state
  const error = useMemo(() => {
    const errors = [
      seasonsHook.error,
      categoriesError,
      membersError,
      clubsError,
    ].filter(Boolean);

    return errors.length > 0
      ? errors.map(e => e instanceof Error ? e.message : e).join('; ')
      : null;
  }, [seasonsHook.error, categoriesError, membersError, clubsError]);

  // Global refresh
  const refreshAll = async () => {
    await Promise.all([
      seasonsHook.refetch(),
      refetchCategories(),
      refetchMembers(),
      refetchClubs(),
    ]);
  };

  const value: AppDataContextType = {
    seasons: {
      data: seasonsHook.seasons,
      loading: seasonsHook.loading,
      error: seasonsHook.error,
      refetch: seasonsHook.refetch,
      activeSeason: seasonsHook.activeSeason,
      sortedSeasons: seasonsHook.sortedSeasons,
    },
    categories: {
      data: categoriesData,
      loading: categoriesLoading,
      error: categoriesError,
      refetch: refetchCategories,
      activeCategories,
    },
    members: {
      data: membersData,
      loading: membersLoading,
      error: membersError,
      refetch: refetchMembers,
      sortedMembers,
    },
    clubs: {
      data: clubsData,
      loading: clubsLoading,
      error: clubsError,
      refetch: refetchClubs,
    },
    loading,
    error,
    refreshAll,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// Custom hook to use app data context
export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
```

**Result**:
- Reduced from **362 lines** to **~120 lines** (67% reduction)
- Removed 174 lines of custom caching code
- No more direct Supabase calls
- Single source of truth via hooks

</details>

### Step 4: Update Component Usage

Components need minor updates to access nested state:

#### 4.1 Simple Migration

**BEFORE**:
```typescript
const {
  seasons,
  seasonsLoading,
  seasonsError,
  refreshSeasons
} = useAppData();
```

**AFTER (Option 1)**: Nested access
```typescript
const { seasons } = useAppData();
const {
  data: seasonsList,
  loading,
  error,
  refetch
} = seasons;
```

**AFTER (Option 2)**: Destructure directly
```typescript
const {
  seasons: { data: seasonsList, loading, error, refetch }
} = useAppData();
```

#### 4.2 Accessing Computed Properties

**BEFORE**:
```typescript
const { activeSeason, sortedSeasons } = useAppData();
```

**AFTER**:
```typescript
const { seasons: { activeSeason, sortedSeasons } } = useAppData();
```

#### 4.3 Component Example Update

**File**: `src/app/coaches/attendance/page.tsx.backup:22`

```typescript
// BEFORE
const { categories, seasons } = useAppData();

// AFTER
const {
  categories: { data: categories },
  seasons: { data: seasons }
} = useAppData();
```

### Step 5: Update Hook Exports

**File**: `src/hooks/index.ts`

Add new state hooks:
```typescript
// Entity state hooks
export * from './entities/season/state/useSeasons';
export * from './entities/category/state/useCategories';
export * from './entities/member/state/useMembers';
export * from './entities/club/state/useClubs';
```

---

## Benefits

### 1. Security
- ✅ All database access goes through authenticated API routes
- ✅ Server-side validation and sanitization
- ✅ No exposure of database schema to client
- ✅ Consistent authentication/authorization

### 2. Maintainability
- ✅ Single source of truth for data fetching
- ✅ DRY principle: No duplicated query logic
- ✅ Easier to modify queries (change in one place: API route)
- ✅ Type-safe API routes via `API_ROUTES` constants

### 3. Consistency
- ✅ All entities follow the same pattern
- ✅ Predictable hook API across the app
- ✅ Easier onboarding for new developers

### 4. Performance
- ✅ Remove 174 lines of custom caching code
- ✅ Leverage Next.js built-in caching
- ✅ Easy to add React Query for advanced caching
- ✅ Better request deduplication via browser cache

### 5. Flexibility
- ✅ API routes can support multiple query patterns
- ✅ Easy to add filters, pagination, sorting
- ✅ Components can use hooks directly (not forced into context)
- ✅ Can add optimistic updates, infinite scroll, etc.

### 6. Testability
- ✅ Mock API routes instead of Supabase client
- ✅ Test hooks independently
- ✅ Test API routes with integration tests

---

## Migration Guide

### Phase 1: Preparation (1-2 hours)

1. ✅ Verify all API routes exist
   - Seasons: `/api/seasons` ✅
   - Categories: `/api/categories` ✅
   - Members: `/api/members` ✅
   - Clubs: `/api/clubs` ✅

2. ✅ Verify fetch hooks exist
   - `useFetchSeasons` ✅
   - `useFetchCategories` ✅
   - `useFetchMembers` ✅ (needs fix)
   - `useFetchClubs` ✅

### Phase 2: Fix Members Hook (30 min)

**File**: `src/hooks/entities/member/data/useFetchMembers.ts:18-24`

Change from Supabase direct call to API route call.

### Phase 3: Handle State Management Hooks (30 min - 1 hour)

**Status:**
- `src/hooks/entities/season/state/useSeasons.ts` ✅ (already exists and works correctly!)
- `src/hooks/entities/category/state/useCategories.ts` ✅ (exists but is CRUD/mutation hook)
- `src/hooks/entities/member/state/useMembers.ts` ✅ (exists but is CRUD/mutation hook)
- `src/hooks/entities/club/state/useClubs.ts` ✅ (exists but is CRUD/mutation hook)

**Decision Required:** Choose one approach:

**Option A**: Use `useFetchX` hooks directly in AppDataContext
- No new files needed
- Keep mutation hooks separate
- Add computed properties directly in context
- **Recommended for speed**

**Option B**: Create new data management hooks with different names
- Create `useCategoriesData`, `useMembersData`, `useClubsData`
- Follow the same pattern as `useSeasons`
- Keep mutation hooks unchanged
- **Recommended for consistency**

### Phase 4: Refactor Context (1 hour)

Replace `src/contexts/AppDataContext.tsx` with new implementation.

### Phase 5: Update Components (2-3 hours)

Update 10+ components that use `useAppData()`:

**Create a codemod or search/replace:**
```bash
# Find all usages
rg "useAppData" --type tsx --type ts

# Common patterns to update:
seasons → seasons.data
categories → categories.data
members → members.data
clubs → clubs.data
seasonsLoading → seasons.loading
refreshSeasons → seasons.refetch
```

### Phase 6: Testing (1-2 hours)

1. Test each page that uses `useAppData`
2. Verify data loads correctly
3. Verify refresh actions work
4. Check loading states
5. Check error handling

### Phase 7: Cleanup (30 min)

1. Remove unused imports (`createClient` from Supabase)
2. Remove custom cache implementation
3. Update documentation

**Total Estimated Time: 8-10 hours**

---

## Additional Recommendations

### 1. Consider React Query

For even better data fetching, consider migrating to **React Query** or **SWR**:

```typescript
// With React Query
export function useFetchSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.seasons.root);
      const data = await res.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Benefits**:
- Automatic caching
- Request deduplication
- Background refetching
- Optimistic updates
- Infinite scrolling support

### 2. Add Zod Validation

Validate API responses to catch type mismatches:

```typescript
import {z} from 'zod';
import {seasonSchema} from '@/types';

const response = await fetch(API_ROUTES.seasons.root);
const data = await response.json();
const validated = z.array(seasonSchema).parse(data.data);
```

### 3. Error Boundaries

Add error boundaries for better error handling:

```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <AppDataProvider>
    {children}
  </AppDataProvider>
</ErrorBoundary>
```

---

## Questions & Considerations

### Q: Will this break existing functionality?
**A**: No, if we maintain the same API shape. Components will need minor updates to access nested properties.

### Q: What about performance?
**A**: Should improve or stay the same. Removes custom caching overhead and leverages Next.js/browser caching.

### Q: Can we do this incrementally?
**A**: Yes! Can refactor one entity at a time:
1. Start with Seasons (easiest, already has everything)
2. Then Categories
3. Then Clubs
4. Finally Members

### Q: What about backwards compatibility?
**A**: Create a compatibility layer:

```typescript
// Old API (deprecated)
export function useAppDataLegacy() {
  const context = useAppData();
  return {
    seasons: context.seasons.data,
    seasonsLoading: context.seasons.loading,
    refreshSeasons: context.seasons.refetch,
    // ... rest
  };
}
```

---

## Conclusion

The current `AppDataContext` implementation bypasses your well-structured API layer and creates maintenance, security, and consistency issues. By refactoring it to use existing hooks and API routes, you'll:

- ✅ Improve security
- ✅ Reduce code by ~67%
- ✅ Achieve consistency across the codebase
- ✅ Make the system more maintainable
- ✅ Enable better caching strategies
- ✅ Follow Next.js best practices

**Recommendation**: Proceed with refactoring in phases, starting with the most isolated entities first.

---

**Next Steps**:
1. Review and approve this document
2. Create implementation tickets
3. Start with Phase 1-2 (Members hook fix)
4. Test thoroughly
5. Roll out gradually
