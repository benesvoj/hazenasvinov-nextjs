# Mutation Helper - Memoized Pattern Implementation Plan

## Problem Summary

**What went wrong:** Module-level execution of `createMutationHelpers()` causes circular dependency

```typescript
// ❌ This executes when module is imported (causes circular dependency):
export const {create, update, delete} = createMutationHelpers({...});
```

**Solution:** Use memoized lazy initialization (creates helper only when first called)

---

## The Memoized Pattern

### How It Works

```typescript
// 1. Store helper instance at module scope (but don't create it yet)
let helpers: ReturnType<typeof createMutationHelpers<Season, SeasonInsert>> | null = null;

// 2. Lazy getter - creates helper only on first call
const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Season, SeasonInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// 3. Export functions that use the lazy helper
export const createSeason = (ctx: QueryContext, data: SeasonInsert) =>
  getHelpers().create(ctx, data);

export const updateSeason = (ctx: QueryContext, id: string, data: Partial<SeasonInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteSeason = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
```

**Key points:**
- ✅ Helper created only when first mutation is called (not at import time)
- ✅ Helper created once per module (memoized for efficiency)
- ✅ No circular dependencies
- ✅ Same API as before (callers don't need to change)

---

## Implementation Plan

### Step 1: Create Template (Copy-Paste Ready)

**Template for all mutation files:**

```typescript
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {DB_TABLE, ENTITY} from '@/queries/[ENTITY_FOLDER]';
import {QueryContext} from '@/queries/shared/types';
import {[EntityType], [EntityInsert]} from '@/types';

/**
 * CRUD mutations for [entity]
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<[EntityType], [EntityInsert]>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<[EntityType], [EntityInsert]>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const create[Entity] = (ctx: QueryContext, data: [EntityInsert]) =>
  getHelpers().create(ctx, data);

export const update[Entity] = (ctx: QueryContext, id: string, data: Partial<[EntityInsert]>) =>
  getHelpers().update(ctx, id, data);

export const delete[Entity] = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
```

---

### Step 2: Find & Replace Guide

For each mutation file, replace these placeholders:

| Placeholder | Example (Seasons) | Example (Videos) |
|-------------|-------------------|------------------|
| `[ENTITY_FOLDER]` | `seasons` | `videos` |
| `[entity]` | `seasons` | `videos` |
| `[Entity]` | `Season` | `Video` |
| `[EntityType]` | `Season` | `VideoSchema` |
| `[EntityInsert]` | `SeasonInsert` | `VideoInsert` |

**Quick method:**
1. Copy template
2. Use IDE find-replace (Cmd+H / Ctrl+H)
3. Replace all placeholders
4. Save

---

### Step 3: Concrete Examples

#### Example 1: Seasons

```typescript
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {DB_TABLE, ENTITY} from '@/queries/seasons';
import {QueryContext} from '@/queries/shared/types';
import {Season, SeasonInsert} from '@/types';

/**
 * CRUD mutations for seasons
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<Season, SeasonInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Season, SeasonInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createSeason = (ctx: QueryContext, data: SeasonInsert) =>
  getHelpers().create(ctx, data);

export const updateSeason = (ctx: QueryContext, id: string, data: Partial<SeasonInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteSeason = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
```

---

#### Example 2: Videos

```typescript
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {DB_TABLE, ENTITY} from '@/queries/videos';
import {QueryContext} from '@/queries/shared/types';
import {VideoSchema, VideoInsert} from '@/types';

/**
 * CRUD mutations for videos
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<VideoSchema, VideoInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<VideoSchema, VideoInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createVideo = (ctx: QueryContext, data: VideoInsert) =>
  getHelpers().create(ctx, data);

export const updateVideo = (ctx: QueryContext, id: string, data: Partial<VideoInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteVideo = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
```

---

### Step 4: Migration Checklist

**Files you need to update (13-15 files):**

- [ ] `src/queries/seasons/mutations.ts`
- [ ] `src/queries/videos/mutations.ts`
- [ ] `src/queries/committees/mutations.ts`
- [ ] `src/queries/categories/mutations.ts`
- [ ] `src/queries/todos/mutations.ts`
- [ ] `src/queries/grants/mutations.ts`
- [ ] `src/queries/comments/mutations.ts`
- [ ] `src/queries/clubs/mutations.ts`
- [ ] `src/queries/clubCategories/mutations.ts`
- [ ] `src/queries/blogPosts/mutations.ts`
- [ ] `src/queries/trainingSessions/mutations.ts`
- [ ] `src/queries/memberAttendance/mutations.ts`
- [ ] `src/queries/categoryLineups/mutations.ts`
- [ ] `src/queries/categoryLineupMembers/mutations.ts`
- [ ] Any others you migrated

---

### Step 5: Per-File Instructions

**For EACH file:**

1. **Open** `src/queries/[entity]/mutations.ts`

2. **Copy the template** from Step 1 above

3. **Find & Replace** placeholders:
   ```
   [ENTITY_FOLDER] → entity folder name (e.g., "seasons")
   [entity] → lowercase entity (e.g., "seasons")
   [Entity] → PascalCase entity (e.g., "Season")
   [EntityType] → Type name (check your imports - might be "Season" or "SeasonSchema")
   [EntityInsert] → Insert type (e.g., "SeasonInsert")
   ```

4. **Verify imports** match your file structure

5. **Save**

6. **Verify TypeScript:**
   ```bash
   npx tsc --noEmit 2>&1 | grep "[entity]/mutations"
   ```

**Time per file:** 3-5 minutes
**Total time:** 45-60 minutes for all 15

---

## Code Comparison

### Before (Module-Level - BROKEN):
```typescript
// ❌ Causes circular dependency
export const {create: createSeason, ...} = createMutationHelpers({...});
```

**Lines:** 19
**Issues:** Circular dependency, build fails

---

### After (Memoized - WORKING):
```typescript
// ✅ No circular dependency
let helpers: ReturnType<typeof createMutationHelpers<Season, SeasonInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Season, SeasonInsert>({...});
  }
  return helpers;
};

export const createSeason = (ctx, data) => getHelpers().create(ctx, data);
export const updateSeason = (ctx, id, data) => getHelpers().update(ctx, id, data);
export const deleteSeason = (ctx, id) => getHelpers().delete(ctx, id);
```

**Lines:** 30
**Issues:** None! ✅

---

### Original (Inline - SAFE BUT VERBOSE):
```typescript
// ✅ Works, but verbose
export async function createSeason(ctx, data) {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    // ... 15 lines of error handling
  } catch (err) {
    // ... 5 lines
  }
}
// Repeat for update and delete
```

**Lines:** 88
**Issues:** Code duplication

---

## Code Reduction

### With Memoized Pattern:
```
Before: 88 lines × 15 entities = 1,320 lines
After:  30 lines × 15 entities = 450 lines
Savings: 870 lines (66% reduction!)
```

**Plus:**
- ✅ Consistent error handling
- ✅ Easy to enhance all mutations at once
- ✅ Still type-safe
- ✅ Still worth it!

---

## Alternative: Different Approach (Code Generation)

Instead of runtime factory, use **build-time code generation**:

```typescript
// Generate mutation files from template
// scripts/generate-mutations.mjs

// Run once:
npm run generate:mutations

// Creates static 88-line files (no circular dependency)
// You never edit them manually
```

**This would:**
- ✅ No circular dependencies
- ✅ Explicit code (easy to debug)
- ✅ Automated (no manual duplication)
- ❌ Needs generator script (20 minutes to build)

---

## My Recommendation

**Use Option 2 (Memoized Pattern)** because:

1. ✅ **Still reduces code** (88 → 30 lines, 66% reduction)
2. ✅ **No circular dependencies** (lazy initialization)
3. ✅ **Quick to implement** (45-60 min for all files)
4. ✅ **No build scripts needed** (simpler than code generation)
5. ✅ **Type-safe** (TypeScript helps you)

---

## Step-by-Step Implementation

### Quick Start (Do First Entity Together):

**Let's fix seasons as example:**

1. Open `src/queries/seasons/mutations.ts`
2. Replace entire content with memoized template
3. Test build
4. If works, apply to remaining 14 entities

**Want me to:**
- **A)** Show you the exact code for seasons (you can copy-paste)?
- **B)** Fix all 15 files for you with the memoized pattern (10 minutes)?
- **C)** Create a different solution (code generation script)?

**Option B is fastest** - I'll fix them all with the memoized pattern and you get ~870 line reduction without the build issues.

What do you prefer?