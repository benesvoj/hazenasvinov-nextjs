# Remaining Hooks to Fix - Quick Guide

## ✅ What's Already Fixed (Examples)

### Data Fetch Hooks (3 examples):
1. ✅ `useFetchCommittees` - Simple hook
2. ✅ `useFetchMembersAttendance` - Hook with parameters
3. ✅ `useFetchCategoryLineups` - Hook with multiple parameters

### CRUD Hooks (3 examples):
1. ✅ `useClubs` - CRUD wrapper pattern
2. ✅ `useCommittees` - CRUD wrapper pattern
3. ✅ `useRecordingsCrud` - CRUD wrapper pattern

---

## 🔧 Remaining 9 CRUD Hooks (Your Task)

### Files to Fix:
1. `src/hooks/entities/blog/state/useBlogPost.ts`
2. `src/hooks/entities/category-lineups/state/useCategoryLineups.ts`
3. `src/hooks/entities/category/state/useCategories.ts`
4. `src/hooks/entities/club-category/state/useClubCategories.ts`
5. `src/hooks/entities/comment/state/useComments.ts`
6. `src/hooks/entities/grant/state/useGrants.ts`
7. `src/hooks/entities/season/state/useSeasons.ts`
8. `src/hooks/entities/todo/state/useTodos.ts`
9. `src/hooks/entities/training-session/state/useTrainingSession.ts`

---

## The Pattern (Copy-Paste This)

### BEFORE (Module-Level - ❌ WRONG):
```typescript
const t = translations.admin.ENTITY.responseMessages;

const _useENTITY = createCRUDHook<EntityType, EntityInsert>({
  baseEndpoint: API_ROUTES.entities.root('table'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('table', id),
  entityName: 'entity',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});  // ← Factory executes when module loads!

export function useENTITY() {
  const {loading, error, create, update, deleteItem, setLoading} = _useENTITY();

  return {
    loading,
    error,
    createENTITY: create,
    updateENTITY: update,
    deleteENTITY: deleteItem,
    setLoading,
  };
}
```

### AFTER (Lazy Execution - ✅ CORRECT):
```typescript
const t = translations.admin.ENTITY.responseMessages;

export function useENTITY() {
  // Move factory call here ↓
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<EntityType, EntityInsert>({
    baseEndpoint: API_ROUTES.entities.root('table'),
    byIdEndpoint: (id) => API_ROUTES.entities.byId('table', id),
    entityName: 'entity',
    messages: {
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      createError: t.createError,
      updateError: t.updateError,
      deleteError: t.deleteError,
    },
  })();  // ← Add () at the end!

  return {
    loading,
    error,
    createENTITY: create,
    updateENTITY: update,
    deleteENTITY: deleteItem,
    setLoading,
  };
}
```

---

## Step-by-Step for Each File

### Step 1: Delete the `const _use...` line
Find this line and DELETE it:
```typescript
const _useGrantsgrants = createCRUDHook<Grant, GrantInsert>({
```

### Step 2: Move the factory config into the function
Cut everything from `createCRUDHook({` to `});`

Paste it after the destructuring in the exported function:
```typescript
export function useGrants() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<Grant, GrantInsert>({
    // ... all the config ...
  })();  // ← Don't forget ()!
```

### Step 3: Add `()` at the end
Make sure it ends with `})();` not just `});`

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting `()` at the end
```typescript
})  // ❌ WRONG - returns function, not hook result
}); // ❌ WRONG - returns function, not hook result
})(); // ✅ CORRECT - calls function, returns hook result
```

### ❌ Mistake 2: Leaving `const _use...` at module level
```typescript
const _useGrants = createCRUDHook({...});  // ❌ Still module-level!

export function useGrants() {
  const {loading, error, ...} = _useGrants();  // ❌ Still calling module-level factory
```

### ❌ Mistake 3: Not passing params for parameterized hooks
```typescript
// For hooks that take parameters:
export function useFetchLineups(params: {categoryId: string}) {
  return createDataFetchHook({...})();  // ❌ Missing (params) at end!
  return createDataFetchHook({...})(params);  // ✅ CORRECT!
}
```

---

## Quick Test After Each Fix

After fixing each file:
```bash
npx tsc --noEmit 2>&1 | grep "hooks/entities"
```

Should show fewer errors each time!

---

## Verification Script

When you think you're done:
```bash
# Should return NOTHING (or just comments):
grep -r "const _use.*= create" src/hooks/entities

# Should return NOTHING:
grep -rn "});" src/hooks/entities/*/data/useFetch*.ts | grep -v "})();"

# Should return NOTHING:
grep -rn "});" src/hooks/entities/*/state/use*.ts | grep -v "})();" | grep -v "return {"
```

---

## Time Estimate

- **Per file:** 1-2 minutes
- **9 files:** 10-15 minutes total

---

## Then Test Build

```bash
rm -rf .next
npm run build
```

**Expected:** Should get much further, possibly complete!

---

## What I Fixed (Your Examples):

### Data Fetch Hooks:
- ✅ useFetchCategories (added `()`)
- ✅ useFetchBlog (added `()`)
- ✅ useFetchClubs (added `()`)
- ✅ useFetchComments (added `()`)
- ✅ useFetchGrants (added `()`)
- ✅ useFetchSeasons (added `()`)
- ✅ useFetchClubCategories (added `()`)
- ✅ useFetchCategoryLIneupMembersFactory (added `()`)

### CRUD Hooks:
- ✅ useClubs (moved factory into function)
- ✅ useCommittees (moved factory into function)
- ✅ useRecordingsCrud (moved factory into function)

---

## Your Remaining Tasks (9 files):

**Just follow the pattern for these:**
1. useBlogPost
2. useCategoryLineups
3. useCategories
4. useClubCategories
5. useComments
6. useGrants
7. useSeasons
8. useTodos
9. useTrainingSession

**Each file:** Delete `const _use...`, move factory into function, add `()` at end.

---

**Ready? Open the first file and apply the pattern!** 🚀
