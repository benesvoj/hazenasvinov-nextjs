# API Handling Architecture: Custom Factories vs. Libraries

## TL;DR Recommendation

**For your specific situation:** Switch to **React Query (TanStack Query)** fully and deprecate your custom factories.

**Why?**
- ✅ You already have it installed and partially using it
- ✅ Solves your current build issues
- ✅ Industry standard, well-maintained
- ✅ Better features than your custom solution
- ✅ Less code to maintain (delete ~1000 lines)

---

## Current State Analysis

### What You Have Now: Hybrid Approach (❌ Problematic)

You're using **BOTH**:

1. **Custom Factory Hooks** (~40+ entities)
   - `createDataFetchHook` - for GET requests
   - `createCRUDHook` - for POST/PUT/DELETE
   - `createFormHook` - for form state

2. **React Query** (5-10 hooks)
   - Attendance statistics
   - Betting features
   - Match queries

**This is causing:**
- ❌ Inconsistency (two patterns for same thing)
- ❌ Build failures (factory module-level execution)
- ❌ More code to maintain
- ❌ Missing React Query features (caching, background refetch, etc.)
- ❌ Confusion for developers

---

## Option Comparison

### Your Custom Factories

**Current Implementation:**
```typescript
// Factory creates hook at module-level
export const useFetchMembers = createDataFetchHook({
  endpoint: '/api/members',
  entityName: 'members',
  errorMessage: 'Failed to fetch',
});

// Usage
const {data, loading, error, refetch} = useFetchMembers();
```

**Pros:**
- ✅ Consistent pattern across your codebase
- ✅ Simple API for developers
- ✅ You built it, you understand it
- ✅ Customized to your needs

**Cons:**
- ❌ Module-level execution causes Next.js 16 build failures
- ❌ No automatic caching
- ❌ No background refetching
- ❌ No stale-while-revalidate
- ❌ No optimistic updates
- ❌ No request deduplication
- ❌ Manual loading state management
- ❌ ~1000+ lines of code to maintain
- ❌ Reinventing the wheel
- ❌ Missing TypeScript features (advanced generics)

---

### React Query (TanStack Query) ⭐ RECOMMENDED

**What You'd Write:**
```typescript
// No factory needed!
export function useFetchMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage (same!)
const {data, isLoading, error, refetch} = useFetchMembers();
```

**Pros:**
- ✅ Battle-tested (used by thousands of apps)
- ✅ Automatic caching & synchronization
- ✅ Background refetching
- ✅ Request deduplication
- ✅ Optimistic updates
- ✅ Infinite queries
- ✅ Pagination support
- ✅ DevTools included
- ✅ TypeScript-first
- ✅ Works perfectly with Next.js 16
- ✅ Active maintenance & community
- ✅ Delete 1000+ lines of your code
- ✅ Better DX (Developer Experience)

**Cons:**
- ❌ Learning curve (1-2 days)
- ❌ Migration effort (2-3 days)
- ❌ Different API than your factories

**Your Situation:**
- ✅ Already installed!
- ✅ Already using it in 10+ places
- ✅ Just need to migrate remaining hooks

---

### RTK Query (Redux Toolkit Query)

**What You'd Write:**
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const membersApi = createApi({
  reducerPath: 'membersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getMembers: builder.query({
      query: () => '/members',
    }),
    createMember: builder.mutation({
      query: (data) => ({
        url: '/members',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Usage
const {data, isLoading, error} = useGetMembersQuery();
```

**Pros:**
- ✅ Built on Redux (if you use Redux)
- ✅ Automatic caching
- ✅ Code generation available
- ✅ Good TypeScript support
- ✅ Optimistic updates

**Cons:**
- ❌ Requires Redux setup
- ❌ More boilerplate than React Query
- ❌ Heavier bundle size
- ❌ You don't use Redux currently
- ❌ Steeper learning curve
- ❌ Overkill for your needs

**Verdict:** Not recommended for your project (you don't have Redux)

---

### SWR (Vercel)

**What You'd Write:**
```typescript
export function useFetchMembers() {
  return useSWR('/api/members', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  });
}
```

**Pros:**
- ✅ Very simple API
- ✅ Automatic caching
- ✅ Made by Vercel (Next.js team)
- ✅ Lightweight

**Cons:**
- ❌ Less features than React Query
- ❌ Smaller ecosystem
- ❌ No mutations (need separate library)
- ❌ You already have React Query

**Verdict:** Good, but React Query is more feature-complete

---

## Direct Comparison Table

| Feature | Your Factories | React Query | RTK Query | SWR |
|---------|----------------|-------------|-----------|-----|
| **Automatic Caching** | ❌ Manual | ✅ Yes | ✅ Yes | ✅ Yes |
| **Background Refetch** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Request Dedup** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Optimistic Updates** | ❌ Manual | ✅ Built-in | ✅ Built-in | ⚠️ Manual |
| **DevTools** | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Basic |
| **Mutations** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Separate lib |
| **TypeScript** | ⚠️ Basic | ✅ Excellent | ✅ Good | ✅ Good |
| **Bundle Size** | ~3KB | ~13KB | ~45KB | ~4KB |
| **Next.js 16 Compat** | ❌ Issues | ✅ Perfect | ✅ Good | ✅ Good |
| **Learning Curve** | Low | Medium | High | Low |
| **Maintenance** | 😰 You | 😎 Community | 😎 Redux team | 😎 Vercel |
| **Lines of Code** | ~1000+ | ~200-300 | ~400-500 | ~200-300 |

---

## Migration Analysis

### Current Factory Usage
```bash
createDataFetchHook: ~35 usages
createCRUDHook: ~25 usages
createFormHook: ~30 usages
Custom hooks: ~50+

Total: ~140 hooks
```

### Migration Effort to React Query

**Easy Migrations** (~70% of hooks):
- `createDataFetchHook` → `useQuery` (1:1 mapping)
- Simple CRUD → `useMutation` (straightforward)

**Medium Effort** (~20% of hooks):
- Complex CRUD with callbacks
- Hooks with side effects
- Dependent queries

**Hard Migrations** (~10% of hooks):
- Form state management (keep `createFormHook` or use react-hook-form)
- Business logic hooks (these are fine as-is)
- Multi-step operations

**Estimated Time:**
- Planning: 1 day
- Migration: 3-5 days (can be done incrementally)
- Testing: 2 days
- Total: 1-2 weeks (but can be incremental!)

---

## Recommended Approach

### Phase 1: Standardize on React Query (HIGHEST PRIORITY)

**Why React Query?**
1. You already have it (no new dependency)
2. Already using it successfully (betting, attendance stats)
3. Solves your build issues
4. Industry standard
5. Better features than your factories
6. Great documentation & community

**Action Plan:**
```typescript
// 1. Create migration helper
// src/hooks/factories/migrateToReactQuery.md

// 2. Migrate one entity at a time
// Week 1: Videos (simple)
// Week 2: Members (complex)
// Week 3: Categories
// etc.

// 3. Keep factories temporarily
// Delete after migration complete
```

### Phase 2: Decide on Form Management

**Options:**
1. **Keep `createFormHook`** (it's working fine)
2. **Migrate to react-hook-form** (industry standard)
3. **Use Tanstack Form** (new, pairs well with React Query)

**Recommendation:** Keep `createFormHook` for now, revisit later

### Phase 3: Business Logic Hooks

**These are FINE as-is:**
- `useVideoFiltering` ✅
- `useBlogPostFiltering` ✅
- `useMemberMetadata` ✅
- `useStrategyPreparation` ✅

**Why?** They handle UI logic, not API calls. This is correct separation of concerns.

---

## Code Examples

### Before (Your Factory):
```typescript
// src/hooks/entities/video/data/useFetchVideos.ts
export const useFetchVideos = createDataFetchHook<VideoSchema>({
  endpoint: API_ROUTES.entities.root('videos'),
  entityName: 'videos',
  errorMessage: 'Failed to fetch videos',
});

// Component
const {data: videos, loading, error, refetch} = useFetchVideos();
```

### After (React Query):
```typescript
// src/hooks/entities/video/data/useFetchVideos.ts
export function useFetchVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.entities.root('videos'));
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch videos');
      }
      const result = await res.json();
      return result.data as VideoSchema[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns
  });
}

// Component (almost same!)
const {data: videos, isLoading, error, refetch} = useFetchVideos();
//                        ↑ only change
```

**Migration diff:** ~10 lines of code per hook

---

## Benefits You'd Get from React Query

### 1. Automatic Caching
```typescript
// First render
const {data} = useFetchVideos(); // Fetches from API

// Second render (different component)
const {data} = useFetchVideos(); // Uses cache! No network call

// After 5 minutes
const {data} = useFetchVideos(); // Refetches automatically
```

### 2. Background Sync
```typescript
// User switches tabs, comes back
// React Query automatically refetches to ensure fresh data
```

### 3. Optimistic Updates
```typescript
const {mutate} = useMutation({
  mutationFn: createVideo,
  onMutate: async (newVideo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['videos']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['videos']);

    // Optimistically update
    queryClient.setQueryData(['videos'], (old) => [...old, newVideo]);

    return {previous};
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['videos'], context.previous);
  },
});
```

### 4. Request Deduplication
```typescript
// 5 components call this simultaneously
const {data} = useFetchVideos();

// Only 1 network request made!
// All 5 components share the same data
```

### 5. Powerful DevTools
- See all queries & their status
- Inspect cache
- Trigger refetches
- Mock data
- Time-travel debugging

---

## Migration Strategy

### Incremental Approach (RECOMMENDED)

**Don't migrate everything at once!** Do it incrementally:

```typescript
// Week 1: Migrate one entity (Videos)
src/hooks/entities/video/
  data/useFetchVideos.ts    // createDataFetchHook → useQuery
  state/useVideos.ts         // createCRUDHook → useMutation

// Week 2: Migrate another (Members)
src/hooks/entities/member/
  data/useFetchMembers.ts
  state/useMembers.ts

// etc.
```

**Advantages:**
- Test each migration thoroughly
- Easy to rollback if issues
- Team can learn gradually
- Features keep shipping

### Migration Template

Create a template for consistent migrations:

```typescript
// Template: GET requests (createDataFetchHook → useQuery)
export function useFetch[Entity]() {
  return useQuery({
    queryKey: ['entity-name'],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.entities.root('entity'));
      if (!res.ok) throw new Error('Failed to fetch');
      const {data} = await res.json();
      return data as EntitySchema[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Template: Mutations (createCRUDHook → useMutation)
export function use[Entity]Mutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (data: EntityInsert) => {
      const res = await fetch(API_ROUTES.entities.root('entity'), {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['entity-name']);
      showToast.success('Created successfully!');
    },
  });

  return {create, update, deleteItem};
}
```

---

## Concrete Next Steps

### Option A: Migrate to React Query (RECOMMENDED)

**Week 1:**
1. Create migration guide (1 day)
2. Migrate 2-3 simple entities (2 days)
3. Test thoroughly (1 day)
4. Document learnings (1 day)

**Week 2-3:**
5. Migrate remaining entities (5 days)
6. Update tests (2 days)
7. Delete factories (1 day)
8. Final testing (2 days)

**Result:**
- ✅ Build works
- ✅ Better caching
- ✅ Less code to maintain
- ✅ Industry standard

**Effort:** 2-3 weeks (but incremental!)

---

### Option B: Fix Factories (NOT RECOMMENDED)

**Required Changes:**
```typescript
// Change from module-level creation
export const useFetchMembers = createDataFetchHook({...});

// To lazy creation
export function useFetchMembers() {
  return useMemo(
    () => createDataFetchHook({...})(),
    []
  );
}
```

**Effort:** 1-2 days (50+ files)

**Why NOT recommended:**
- Still custom code to maintain
- Still missing React Query features
- Doesn't solve underlying architecture issue
- Temporary fix

---

### Option C: Keep Status Quo (NOT RECOMMENDED)

Accept the build failure and:
- Use `npm run dev` only
- Deploy to Vercel (might work)
- Hope Next.js fixes it

**Why NOT recommended:**
- Can't build locally
- Can't verify production builds
- Risky for deployments
- Technical debt grows

---

## RTK Query vs. React Query Comparison

**For Your Needs:**

| Aspect | RTK Query | React Query |
|--------|-----------|-------------|
| **Redux Required?** | Yes (deal-breaker for you) | No |
| **Bundle Size** | ~45KB | ~13KB |
| **Learning Curve** | Steep | Medium |
| **Your Current Usage** | 0% | 10% already |
| **Next.js Support** | Good | Excellent |
| **Verdict** | ❌ Overkill | ✅ Perfect fit |

**RTK Query is great IF:**
- You already use Redux
- You need normalized cache
- You have very complex state management

**React Query is better IF:**
- No Redux (your case!)
- RESTful APIs (your case!)
- Want simplicity (your case!)

---

## My Professional Recommendation

### Short Term (This Week)
1. **Accept build failure** for now
2. **Use `npm run dev`** for development
3. **Plan React Query migration**
4. **Create migration guide**

### Medium Term (Next 2-3 Weeks)
1. **Migrate to React Query incrementally**
   - Start with simple entities (videos, comments)
   - Do 2-3 entities per week
   - Test thoroughly after each

2. **Delete factories** as entities migrate
3. **Update documentation** for team

### Long Term (Next Month+)
1. **Complete migration**
2. **Delete all factory code**
3. **Add React Query best practices**
4. **Build works perfectly**

---

## Cost-Benefit Analysis

### Keeping Factories
**Cost:**
- 1000+ lines of code to maintain
- Build failures to debug
- Missing features
- Technical debt

**Benefit:**
- Familiarity
- No migration work (short-term)

### Migrating to React Query
**Cost:**
- 2-3 weeks migration effort
- Learning curve
- Update all components

**Benefit:**
- Build works
- Better performance
- Industry standard
- Less maintenance
- More features
- Better DX
- Community support

**ROI:** High (pays off in 1-2 months)

---

## Example Migration (Videos)

### Before (Factory):
```typescript
// useFetchVideos.ts (factory)
export const useFetchVideos = createDataFetchHook<VideoSchema>({
  endpoint: API_ROUTES.entities.root('videos'),
  entityName: 'videos',
  errorMessage: 'Failed to fetch videos',
});

// useVideos.ts (CRUD)
const _useVideos = createCRUDHook<VideoSchema, VideoInsert>({
  baseEndpoint: API_ROUTES.entities.root('videos'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('videos', id),
  entityName: 'videos',
  messages: {...},
});
```

### After (React Query):
```typescript
// queries/videos.ts
export function useFetchVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: () => fetchVideos(),
  });
}

export function useVideoMutations() {
  const queryClient = useQueryClient();

  const createVideo = useMutation({
    mutationFn: (data: VideoInsert) => createVideoAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['videos']);
      showToast.success('Video created!');
    },
  });

  return {createVideo, updateVideo, deleteVideo};
}

// services/videos.ts (API layer)
async function fetchVideos() {
  const res = await fetch(API_ROUTES.entities.root('videos'));
  if (!res.ok) throw new Error('Failed');
  return res.json().then(r => r.data);
}
```

**Benefits:**
- Clearer separation (queries vs. API calls)
- Better testability
- More control
- Standard patterns

---

## Conclusion

**Honest Assessment:**

Your custom factories were a **good learning exercise** and work well for simple cases. But they have **fundamental limitations**:

1. Architecture issues (module-level execution)
2. Missing critical features (caching, background sync)
3. Maintenance burden (you own all the code)
4. Compatibility issues (Next.js 16)

**React Query is the right choice because:**

1. ✅ You already use it (partially)
2. ✅ Industry proven (100K+ GitHub stars)
3. ✅ Solves your build issues
4. ✅ Better features out of the box
5. ✅ Less code to maintain
6. ✅ Perfect Next.js integration
7. ✅ Active development & support

**Migration Path:**
- Incremental (2-3 entities per week)
- Low risk (test each migration)
- High value (better app, less maintenance)

---

## Questions?

1. **Want me to create a migration guide?**
2. **Should I migrate one entity as an example?**
3. **Any specific concerns about React Query?**

**My take:** Bite the bullet, migrate to React Query. Your future self will thank you. 🚀

---

**Status:** Analysis Complete
**Recommendation:** Migrate to React Query incrementally
**Effort:** 2-3 weeks
**Value:** High
