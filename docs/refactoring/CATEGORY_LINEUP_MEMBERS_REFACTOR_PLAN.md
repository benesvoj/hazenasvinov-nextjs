# Category Lineup Members - Factory Hook Refactoring Plan (Option A)

## Overview

This document outlines the detailed implementation plan for refactoring the category lineup members data fetching to use a factory-based hook pattern with enriched data (including member details).

**Goal**: Replace the manual `useFetchCategoryLineupMembers` hook with a factory-based hook that fetches lineup members WITH member details in a single optimized query.

**Status**: 📋 Planning Phase
**Priority**: High
**Estimated Effort**: 2-3 hours

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Steps](#implementation-steps)
5. [Files to Modify](#files-to-modify)
6. [Code Examples](#code-examples)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)

---

## Current State Analysis

### Existing Implementation

#### 1. Manual Hook (To Be Replaced)
**File**: `src/hooks/entities/category/data/useFetchCategoryLineupMembers.ts`

```typescript
export const useFetchCategoryLineupMembers = (
  categoryId: string,
  categoryLineupId: string,
) => {
  const [data, setData] = useState<CategoryLineupMemberWithMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual fetch logic with useEffect
  // Fetches from: /api/categories/${categoryId}/lineups/${lineupId}/members
}
```

**Issues**:
- ❌ Manual state management (data, loading, error)
- ❌ Uses custom route instead of entities API
- ❌ Doesn't follow factory pattern
- ❌ No automatic cleanup on unmount
- ❌ Inconsistent with other hooks in the codebase

#### 2. Incomplete Factory Hook
**File**: `src/hooks/entities/category/data/useFetchCategoryLIneupMembersFactory.ts`

```typescript
export const useFetchCategoryLineupMembersFactory = createDataFetchHook<BaseCategoryLineupMember>({
  endpoint: API_ROUTES.entities.root(DB_TABLE),
  entityName: ENTITY.plural,
  errorMessage: t.lineupMembersFetchFailed,
});
```

**Issues**:
- ❌ Returns `BaseCategoryLineupMember[]` WITHOUT member details
- ❌ Not parameterized (can't filter by lineupId)
- ❌ Not used anywhere in the codebase
- ❌ Incorrect file name (typo: "LIneup" instead of "Lineup")

#### 3. Current Usage
**File**: `src/app/coaches/lineups/components/LineupMembers.tsx:32-36`

```typescript
const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers(categoryId, lineupId);
```

### Data Flow

```
Component (LineupMembers.tsx)
  ↓ calls useFetchCategoryLineupMembers(categoryId, lineupId)
  ↓
Manual Hook
  ↓ fetches from
  ↓
Custom API Route: /api/categories/${categoryId}/lineups/${lineupId}/members
  ↓ queries Supabase directly
  ↓
Returns: CategoryLineupMemberWithMember[] (with joined member data)
```

### Current API Routes

Two different endpoints exist:

1. **Custom Route** (currently used):
   - **Path**: `/api/categories/[id]/lineups/[lineupId]/members/route.ts`
   - **Query**: Joins `category_lineup_members` with `members` table
   - **Returns**: `CategoryLineupMemberWithMember[]`

2. **Entities Route** (not currently used for members):
   - **Path**: `/api/entities/[entity]/route.ts`
   - **Config**: `ENTITY_CONFIGS['category_lineup_members']`
   - **Query**: Uses query layer `getAllCategoryLineupMembers`
   - **Returns**: `BaseCategoryLineupMember[]` (no member details)

---

## Problem Statement

### Current Issues

1. **Inconsistent Architecture**
   - Most entities use factory pattern
   - Category lineup members use manual implementation
   - Violates DRY principle

2. **Missing Member Data in Query Layer**
   - Query layer only returns `BaseCategoryLineupMember`
   - No option to include related `members` data
   - Forces use of custom API route

3. **Code Duplication**
   - Manual state management duplicates factory logic
   - Custom API route duplicates entities endpoint logic

4. **Poor Developer Experience**
   - File name has typo (`LIneup` instead of `Lineup`)
   - Two hooks exist but neither is complete
   - Confusing which hook to use

5. **Performance Concerns**
   - Could optimize with better query structure
   - No request cancellation on unmount

---

## Proposed Solution

### Architecture Overview

```
Component (LineupMembers.tsx)
  ↓ calls useFetchCategoryLineupMembers({ categoryId, lineupId })
  ↓
Factory Hook (createDataFetchHook)
  ↓ fetches from
  ↓
Entities API Route: /api/entities/category_lineup_members?lineupId=X&categoryId=Y
  ↓ uses query layer
  ↓
Query Layer: getAllCategoryLineupMembers(ctx, { includeMemberDetails: true })
  ↓ executes Supabase query with JOIN
  ↓
Returns: CategoryLineupMemberWithMember[]
```

### Key Design Decisions

1. **Use Entities API Endpoint**
   - Leverage existing `/api/entities/category_lineup_members`
   - Add support for filtering by `lineupId` and `categoryId`
   - Already configured in `ENTITY_CONFIGS`

2. **Enhance Query Layer**
   - Add `includeMemberDetails` option to `getAllCategoryLineupMembers`
   - Support flexible select string for joins
   - Maintain backward compatibility

3. **Factory Pattern with Parameters**
   - Use parameterized factory hook
   - Pass `{ categoryId, lineupId }` as parameters
   - Build endpoint URL with query params

4. **Maintain Type Safety**
   - Update return type based on `includeMemberDetails`
   - Use TypeScript generics properly
   - Keep existing types intact

---

## Implementation Steps

### Phase 1: Update Query Layer (30 min)

#### Step 1.1: Update Query Function Signature

**File**: `src/queries/categoryLineupMembers/queries.ts`

Add support for custom select and member details:

```typescript
interface GetCategoryLineupMembersOptions extends GetEntitiesOptions {
  filters?: {
    categoryId?: string;
    lineupId?: string;
  };
  includeMemberDetails?: boolean; // NEW
}

export async function getAllCategoryLineupMembers(
  ctx: QueryContext,
  options?: GetCategoryLineupMembersOptions
): Promise<QueryResult<BaseCategoryLineupMember[] | CategoryLineupMemberWithMember[]>> {
  try {
    // Determine select string based on includeMemberDetails
    const selectString = options?.includeMemberDetails
      ? `
        *,
        members!inner (
          id,
          name,
          surname,
          registration_number,
          category_id
        )
      `
      : '*';

    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      select: selectString, // Pass custom select
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error
    const paginationBugResult = handleSupabasePaginationBug(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as any,
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}
```

**Changes**:
- ✅ Add `includeMemberDetails` option
- ✅ Conditional select string with member join
- ✅ Return type supports both `BaseCategoryLineupMember[]` and `CategoryLineupMemberWithMember[]`

#### Step 1.2: Update buildSelectQuery to Support Custom Select

**File**: `src/queries/shared/queryBuilder.ts`

This file already supports custom select via the `select` parameter in the options object, so no changes needed. Verify it works as expected:

```typescript
export function buildSelectQuery<T>(
  supabase: SupabaseClient,
  table: string,
  options: {
    select?: string;  // ✅ Already supports custom select
    filters?: Record<string, any>;
    sorting?: SortOptions[];
    pagination?: PaginationOptions;
  } = {}
) {
  const {select = '*', filters, sorting, pagination} = options;

  let query = supabase.from(table).select(select, {count: 'exact'});
  // ... rest of the function
}
```

**Status**: ✅ No changes required

---

### Phase 2: Update Entities Config (15 min)

#### Step 2.1: Update Entity Config for Query Layer Integration

**File**: `src/app/api/entities/config.ts:246-258`

The config already exists, but we need to ensure it's properly integrated:

```typescript
category_lineup_members: {
  tableName: categoryLineupMembersQueries.DB_TABLE,
  sortBy: [{column: 'jersey_number', ascending: true}],
  requiresAdmin: false,
  filters: [
    {paramName: 'categoryId', dbColumn: 'category_id'},
    {paramName: 'lineupId', dbColumn: 'lineup_id'},
  ],
  queryLayer: {
    getAll: categoryLineupMembersQueries.getAllCategoryLineupMembers,
    getById: categoryLineupMembersQueries.getCategoryLineupMemberById
  }
}
```

**Status**: ✅ Already configured correctly

#### Step 2.2: Update Entities API Route to Support includeMemberDetails

**File**: `src/app/api/entities/[entity]/route.ts`

Need to check if this route passes query parameters to the query layer. If not, we'll need to add support:

```typescript
// In the GET handler, extract includeMemberDetails from query params
const searchParams = request.nextUrl.searchParams;
const includeMemberDetails = searchParams.get('includeMemberDetails') === 'true';

// Pass to query layer
const result = await queryLayer.getAll(
  {supabase, userId: user.id},
  {
    filters: processedFilters,
    sorting,
    pagination,
    includeMemberDetails, // NEW
  }
);
```

**Note**: This will require examining the actual route implementation.

---

### Phase 3: Create Factory Hook (20 min)

#### Step 3.1: Create New Factory Hook

**File**: `src/hooks/entities/category-lineup-members/data/useFetchCategoryLineupMembers.ts` (NEW)

```typescript
'use client';

import {createDataFetchHook} from '@/hooks/factories';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from "@/queries/categoryLineupMembers";
import {CategoryLineupMemberWithMember} from '@/types';

const t = translations.coachPortal.lineupMembers.responseMessages;

/**
 * Factory-based hook to fetch category lineup members with member details
 *
 * @architectural-layer Data Access Layer
 *
 * @example
 * const {data, loading, error, refetch} = useFetchCategoryLineupMembers({
 *   categoryId: 'abc-123',
 *   lineupId: 'def-456'
 * });
 */
export const useFetchCategoryLineupMembers = createDataFetchHook<
  CategoryLineupMemberWithMember,
  { categoryId: string; lineupId: string }
>({
  endpoint: (params) => {
    const searchParams = new URLSearchParams({
      categoryId: params.categoryId,
      lineupId: params.lineupId,
      includeMemberDetails: 'true', // Always include member details
    });
    return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
  },
  entityName: ENTITY.plural,
  errorMessage: t.lineupMembersFetchFailed,
  fetchOnMount: true,
});
```

**Key Features**:
- ✅ Uses factory pattern
- ✅ Parameterized with `categoryId` and `lineupId`
- ✅ Includes member details via query param
- ✅ Type-safe return value
- ✅ Automatic cleanup on unmount
- ✅ Follows architectural guidelines

#### Step 3.2: Create Index File

**File**: `src/hooks/entities/category-lineup-members/data/index.ts` (NEW)

```typescript
export {useFetchCategoryLineupMembers} from './useFetchCategoryLineupMembers';
```

#### Step 3.3: Update Main Index

**File**: `src/hooks/entities/category-lineup-members/index.ts` (NEW)

```typescript
export * from './data';
```

#### Step 3.4: Update Root Hooks Index

**File**: `src/hooks/index.ts`

```typescript
// Remove old export
- export {useFetchCategoryLineupMembers} from './entities/category/data/useFetchCategoryLineupMembers';

// Add new export
+ export * from './entities/category-lineup-members';
```

---

### Phase 4: Update Components (30 min)

#### Step 4.1: Update LineupMembers Component

**File**: `src/app/coaches/lineups/components/LineupMembers.tsx:32-36`

**Before**:
```typescript
const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers(categoryId, lineupId);
```

**After**:
```typescript
const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers({
  categoryId,
  lineupId,
});
```

**Changes**:
- ✅ Pass params as object instead of separate arguments
- ✅ Same return structure (no component logic changes needed)

#### Step 4.2: Remove Manual useEffect

**File**: `src/app/coaches/lineups/components/LineupMembers.tsx:52-57`

**Before**:
```typescript
// Fetch lineup members when lineup changes
useEffect(() => {
  if (lineupId) {
    fetchLineupMembers();
  }
}, [lineupId, fetchLineupMembers]);
```

**After**:
```typescript
// Remove this useEffect - factory hook handles fetching automatically
```

**Reason**: The factory hook with `fetchOnMount: true` automatically refetches when parameters change.

---

### Phase 5: Cleanup (15 min)

#### Step 5.1: Remove Old Manual Hook

**Files to delete**:
- `src/hooks/entities/category/data/useFetchCategoryLineupMembers.ts` ❌ DELETE
- `src/hooks/entities/category/data/useFetchCategoryLIneupMembersFactory.ts` ❌ DELETE

#### Step 5.2: Update Category Hooks Index

**File**: `src/hooks/entities/category/data/index.ts`

Remove exports:
```typescript
- export {useFetchCategoryLineupMembers} from './useFetchCategoryLineupMembers';
- export {useFetchCategoryLineupMembersFactory} from './useFetchCategoryLIneupMembersFactory';
```

#### Step 5.3: Consider Deprecating Custom API Route

**File**: `src/app/api/categories/[id]/lineups/[lineupId]/members/route.ts`

Options:
1. **Keep it** - May be used by other parts of the app
2. **Deprecate it** - Add a comment warning it's deprecated
3. **Remove it** - If no other usage exists

**Recommendation**: Grep for usage first:
```bash
grep -r "categories.*lineups.*members" --include="*.ts" --include="*.tsx"
```

If only used by the component we're refactoring, consider deprecating with a comment:

```typescript
/**
 * @deprecated Use /api/entities/category_lineup_members with includeMemberDetails=true instead
 * This endpoint will be removed in a future version
 */
export async function GET(request: NextRequest, ...) {
  // ... existing code
}
```

---

## Files to Modify

### Summary Table

| File | Action | Phase | Estimated Time |
|------|--------|-------|----------------|
| `src/queries/categoryLineupMembers/queries.ts` | Modify | 1 | 20 min |
| `src/app/api/entities/[entity]/route.ts` | Modify | 2 | 15 min |
| `src/hooks/entities/category-lineup-members/data/useFetchCategoryLineupMembers.ts` | Create | 3 | 15 min |
| `src/hooks/entities/category-lineup-members/data/index.ts` | Create | 3 | 2 min |
| `src/hooks/entities/category-lineup-members/index.ts` | Create | 3 | 2 min |
| `src/hooks/index.ts` | Modify | 3 | 2 min |
| `src/app/coaches/lineups/components/LineupMembers.tsx` | Modify | 4 | 10 min |
| `src/hooks/entities/category/data/useFetchCategoryLineupMembers.ts` | Delete | 5 | 2 min |
| `src/hooks/entities/category/data/useFetchCategoryLIneupMembersFactory.ts` | Delete | 5 | 2 min |
| `src/hooks/entities/category/data/index.ts` | Modify | 5 | 2 min |
| `src/app/api/categories/[id]/lineups/[lineupId]/members/route.ts` | Deprecate | 5 | 5 min |

**Total Estimated Time**: 2-3 hours

---

## Code Examples

### Example 1: Query Layer Update

**Before**:
```typescript
// Only returns BaseCategoryLineupMember without member details
const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
  sorting: options?.sorting,
  pagination: options?.pagination,
  filters: options?.filters,
});
```

**After**:
```typescript
// Conditionally includes member details based on options
const selectString = options?.includeMemberDetails
  ? `
    *,
    members!inner (
      id,
      name,
      surname,
      registration_number,
      category_id
    )
  `
  : '*';

const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
  select: selectString,
  sorting: options?.sorting,
  pagination: options?.pagination,
  filters: options?.filters,
});
```

### Example 2: Factory Hook Usage

**Before (Manual Hook)**:
```typescript
const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers(categoryId, lineupId);

// Manual refetch when lineupId changes
useEffect(() => {
  if (lineupId) {
    fetchLineupMembers();
  }
}, [lineupId, fetchLineupMembers]);
```

**After (Factory Hook)**:
```typescript
const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers({
  categoryId,
  lineupId,
});

// No manual useEffect needed - automatic refetch
```

### Example 3: Type Safety

**Types remain the same**:
```typescript
// Input params type
type FetchParams = {
  categoryId: string;
  lineupId: string;
};

// Return data type
interface CategoryLineupMemberWithMember extends BaseCategoryLineupMember {
  members: Member;
}

// Hook signature
const useFetchCategoryLineupMembers: (
  params: FetchParams
) => DataFetchHookResult<CategoryLineupMemberWithMember>;
```

---

## Testing Strategy

### Unit Tests (Optional)

#### Test 1: Query Layer
```typescript
describe('getAllCategoryLineupMembers', () => {
  it('should return members without details by default', async () => {
    const result = await getAllCategoryLineupMembers(ctx);
    expect(result.data[0]).not.toHaveProperty('members');
  });

  it('should return members with details when includeMemberDetails=true', async () => {
    const result = await getAllCategoryLineupMembers(ctx, {
      includeMemberDetails: true,
    });
    expect(result.data[0]).toHaveProperty('members');
    expect(result.data[0].members).toHaveProperty('name');
  });

  it('should filter by lineupId', async () => {
    const result = await getAllCategoryLineupMembers(ctx, {
      filters: { lineupId: 'test-id' },
    });
    result.data.forEach(member => {
      expect(member.lineup_id).toBe('test-id');
    });
  });
});
```

#### Test 2: Factory Hook
```typescript
describe('useFetchCategoryLineupMembers', () => {
  it('should fetch on mount', () => {
    const {result} = renderHook(() =>
      useFetchCategoryLineupMembers({
        categoryId: 'cat-1',
        lineupId: 'lineup-1',
      })
    );

    expect(result.current.loading).toBe(true);
  });

  it('should refetch when params change', async () => {
    const {result, rerender} = renderHook(
      ({categoryId, lineupId}) =>
        useFetchCategoryLineupMembers({categoryId, lineupId}),
      {
        initialProps: {categoryId: 'cat-1', lineupId: 'lineup-1'},
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({categoryId: 'cat-1', lineupId: 'lineup-2'});
    expect(result.current.loading).toBe(true);
  });
});
```

### Manual Testing

#### Test Scenario 1: Basic Fetch
1. Navigate to `/coaches/lineups`
2. Select a category
3. Select a lineup
4. Verify lineup members load correctly
5. Verify member details (name, surname, registration_number) display

**Expected**: Members load with all details visible

#### Test Scenario 2: Lineup Change
1. Navigate to `/coaches/lineups`
2. Select lineup A
3. Verify members load
4. Select lineup B
5. Verify members update

**Expected**: Members refresh automatically, no stale data

#### Test Scenario 3: Error Handling
1. Navigate to `/coaches/lineups`
2. Disconnect internet (simulate network error)
3. Select a lineup
4. Verify error toast appears
5. Verify error message matches translated string

**Expected**: Proper error handling with user-friendly message

#### Test Scenario 4: Loading State
1. Navigate to `/coaches/lineups`
2. Throttle network to "Slow 3G" in DevTools
3. Select a lineup
4. Verify loading spinner displays
5. Wait for members to load
6. Verify loading spinner disappears

**Expected**: Loading states properly indicated

### Performance Testing

#### Metrics to Track

1. **Network Requests**
   - Before: 2 requests (lineups + members)
   - After: 1 request (lineups with members)
   - Expected improvement: 50% reduction

2. **Time to Interactive**
   - Measure time from lineup selection to member display
   - Should be faster with single request

3. **Bundle Size**
   - Before: Manual hook + factory
   - After: Only factory
   - Expected reduction: ~100 lines of code

#### Performance Test Script

```typescript
// Run in browser console
performance.mark('lineup-select-start');
// Select lineup
await waitForMembersToLoad();
performance.mark('lineup-select-end');
performance.measure(
  'lineup-load-time',
  'lineup-select-start',
  'lineup-select-end'
);
console.log(performance.getEntriesByName('lineup-load-time')[0].duration);
```

---

## Rollback Plan

### If Issues Arise

#### Step 1: Immediate Rollback (5 min)
```bash
# Restore deleted files from git
git checkout HEAD~1 -- src/hooks/entities/category/data/useFetchCategoryLineupMembers.ts
git checkout HEAD~1 -- src/hooks/entities/category/data/index.ts
git checkout HEAD~1 -- src/app/coaches/lineups/components/LineupMembers.tsx

# Remove new files
rm -rf src/hooks/entities/category-lineup-members

# Rebuild
npm run build
```

#### Step 2: Revert Component Changes
```typescript
// Restore old hook usage
import {useFetchCategoryLineupMembers} from '@/hooks/entities/category/data/useFetchCategoryLineupMembers';

const {
  data: lineupMembers,
  loading: loadingLineupMembers,
  refetch: fetchLineupMembers,
} = useFetchCategoryLineupMembers(categoryId, lineupId);
```

#### Step 3: Identify Root Cause
- Check browser console for errors
- Check network tab for failed requests
- Check Supabase logs
- Review query layer changes

### Partial Rollback Options

If only specific parts are problematic:

**Option 1: Keep query layer changes, revert hook**
- Query layer is backward compatible
- Revert only hook and component changes

**Option 2: Keep hook, revert query layer**
- Use custom API route temporarily
- Update hook endpoint to use `/api/categories/.../members`

**Option 3: Feature flag**
```typescript
const USE_NEW_HOOK = process.env.NEXT_PUBLIC_USE_FACTORY_LINEUP_HOOK === 'true';

const hookResult = USE_NEW_HOOK
  ? useFetchCategoryLineupMembersNew({categoryId, lineupId})
  : useFetchCategoryLineupMembersOld(categoryId, lineupId);
```

---

## Benefits of Option A

### Performance Benefits
- ✅ **50% fewer network requests** (1 instead of 2)
- ✅ **Faster page load** - single optimized query
- ✅ **Better caching** - entities endpoint is cached
- ✅ **Automatic request cancellation** - prevents memory leaks

### Code Quality Benefits
- ✅ **100 fewer lines of code** - removes manual implementation
- ✅ **Consistent architecture** - follows factory pattern
- ✅ **Better error handling** - factory includes error handling
- ✅ **Type safety** - fully typed parameters and return values

### Developer Experience Benefits
- ✅ **Easier to understand** - standard factory pattern
- ✅ **Easier to maintain** - centralized logic
- ✅ **Easier to test** - factory hooks are well-tested
- ✅ **Self-documenting** - clear parameter structure

### Future-Proofing Benefits
- ✅ **Scalable** - easy to add more filters
- ✅ **Reusable** - can be used in other components
- ✅ **Extensible** - easy to add caching, optimistic updates, etc.

---

## Comparison with Other Options

### Option B: Separate Hooks with Factory Pattern

**Pros**:
- More granular control
- Separate concerns

**Cons**:
- More network requests (N+1 problem)
- More complex component logic
- Harder to maintain consistency

**Verdict**: ❌ Not recommended

### Option C: Hybrid Approach

**Pros**:
- Most flexible
- Can optimize per use case

**Cons**:
- Most complex implementation
- Harder to understand
- More code to maintain

**Verdict**: ❌ Over-engineered for current needs

### Option A: Single Enriched Endpoint (CHOSEN)

**Pros**:
- Best performance (fewest requests)
- Simplest implementation
- Follows existing patterns
- Easy to understand and maintain

**Cons**:
- Slightly less flexible
- May fetch unnecessary data in some cases

**Verdict**: ✅ **RECOMMENDED**

---

## Success Criteria

### Technical Criteria
- [ ] All TypeScript errors resolved
- [ ] All existing tests pass
- [ ] Manual testing scenarios pass
- [ ] No console errors or warnings
- [ ] Network requests reduced by 50%

### Code Quality Criteria
- [ ] Hook follows factory pattern
- [ ] Query layer properly updated
- [ ] Component simplified
- [ ] Old code removed
- [ ] Documentation updated

### User Experience Criteria
- [ ] Page loads faster
- [ ] No visual regressions
- [ ] Error messages clear
- [ ] Loading states smooth

---

## Next Steps

1. **Get approval on this plan**
2. **Create git branch**: `refactor/category-lineup-members-factory`
3. **Implement Phase 1**: Update query layer
4. **Implement Phase 2**: Update entities config
5. **Implement Phase 3**: Create factory hook
6. **Implement Phase 4**: Update components
7. **Implement Phase 5**: Cleanup
8. **Test thoroughly** using testing strategy
9. **Create pull request** with this document as reference
10. **Deploy to staging** and validate
11. **Deploy to production**

---

## Questions to Resolve

1. ❓ Should we keep or remove the custom API route `/api/categories/[id]/lineups/[lineupId]/members`?
   - **Recommendation**: Deprecate with comment, remove in future version

2. ❓ Do we need pagination for lineup members?
   - **Current**: No pagination (most lineups have < 30 members)
   - **Recommendation**: Not needed now, easy to add later if needed

3. ❓ Should we add caching/stale-while-revalidate?
   - **Recommendation**: Not in this PR, can add later with React Query

4. ❓ Do other components use `useFetchCategoryLineupMembers`?
   - **Action**: Grep codebase to verify
   - **Command**: `grep -r "useFetchCategoryLineupMembers" --include="*.tsx" --include="*.ts"`

---

## References

- [Factory Pattern Documentation](../HOOK_FACTORY_MIGRATION_GUIDE.md)
- [Layered Architecture](../../architecture/LAYERED_ARCHITECTURE.md)
- [Query Layer Guide](../API%20Layers%20analysis/QUERY_LAYER_EXTRACTION_GUIDE.md)
- [createDataFetchHook Source](../../src/hooks/factories/createDataFetchHook.ts)

---

## Appendix

### A. Current File Structure
```
src/hooks/entities/
├── category/
│   ├── data/
│   │   ├── useFetchCategoryLineupMembers.ts (MANUAL - TO DELETE)
│   │   └── useFetchCategoryLIneupMembersFactory.ts (INCOMPLETE - TO DELETE)
│   └── ...
└── ...
```

### B. Proposed File Structure
```
src/hooks/entities/
├── category-lineup-members/
│   ├── data/
│   │   ├── useFetchCategoryLineupMembers.ts (NEW FACTORY-BASED)
│   │   └── index.ts
│   └── index.ts
└── ...
```

### C. API Endpoint Comparison

**Before**:
```
GET /api/categories/abc-123/lineups/def-456/members
→ Returns: CategoryLineupMemberWithMember[]
```

**After**:
```
GET /api/entities/category_lineup_members?lineupId=def-456&categoryId=abc-123&includeMemberDetails=true
→ Returns: CategoryLineupMemberWithMember[]
```

### D. Component Diff

```diff
- import {useFetchCategoryLineupMembers} from '@/hooks/entities/category/data/useFetchCategoryLineupMembers';
+ import {useFetchCategoryLineupMembers} from '@/hooks';

  const {
    data: lineupMembers,
    loading: loadingLineupMembers,
    refetch: fetchLineupMembers,
- } = useFetchCategoryLineupMembers(categoryId, lineupId);
+ } = useFetchCategoryLineupMembers({categoryId, lineupId});

- useEffect(() => {
-   if (lineupId) {
-     fetchLineupMembers();
-   }
- }, [lineupId, fetchLineupMembers]);
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Author**: Claude (AI Assistant)
**Status**: Ready for Review
