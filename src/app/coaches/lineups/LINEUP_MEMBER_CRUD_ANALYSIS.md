# Lineup Member CRUD — Analysis & Refactor Plan

## Problem Statement

The hook `useCategoryLineupMember` that manages adding, editing, and removing members from lineups is broken. It uses raw `fetch` calls to custom API endpoints that are partially **not implemented** (PATCH/DELETE return 501), bypasses the existing query/mutation layer, and shows English toast messages in a Czech UI.

---

## Database Model

```
category_lineups (core table)
  ├── category_id → categories
  ├── season_id → seasons
  ├── name, description, ...
  └── ← category_lineup_members (relation table)
        ├── lineup_id → category_lineups
        ├── member_id → members
        ├── position, jersey_number, is_captain, is_vice_captain
        ├── added_by, is_active
```

Both are straightforward tables. `category_lineups` already uses the generic entities API correctly. Only `category_lineup_members` was broken.

---

## Previous Architecture (BROKEN)

```
Component (LineupMembers.tsx / page.tsx)
  ↓
useCategoryLineupMember() — raw fetch, English toasts, no query layer
  ↓
Custom nested API routes:
  GET    /api/categories/{id}/lineups/{lineupId}/members            ✅ works (with member JOIN)
  POST   /api/categories/{id}/lineups/{lineupId}/members            ✅ works
  PATCH  /api/categories/{id}/lineups/{lineupId}/members/{memberId} ❌ returns 501
  DELETE /api/categories/{id}/lineups/{lineupId}/members/{memberId} ❌ returns 501
```

```
useFetchCategoryLineupMembers() — manual fetch hook
  ↓
Custom GET /api/categories/{id}/lineups/{lineupId}/members
  ↓
Direct supabase query with member JOIN (inline, not using query layer)
```

**Result:** Create worked. Update and delete failed at runtime with 501. Fetch worked but bypassed query layer.

---

## Target Architecture

```
Component (LineupMembers.tsx / page.tsx)
  ↓
useCategoryLineupMembers() — createCRUDHook factory (consistent with all entities)
  ↓
Generic entities API: /api/entities/category_lineup_members
  ↓
Query layer: src/queries/categoryLineupMembers/ (queries.ts + mutations.ts)
  ↓
Supabase
```

```
useFetchCategoryLineupMembers() — createDataFetchHook factory
  ↓
Generic entities API: /api/entities/category_lineup_members?lineupId=xxx
  ↓
Query layer: getAllCategoryLineupMembers() with member JOIN in select
  ↓
Supabase
```

### Why generic entities API is the right choice

Both `clubCategories` and `memberAttendance` already solve the same problem — relation tables with JOINs:

- `memberAttendance/queries.ts` uses `select: '*, member:members(id, name, surname, category_id)'`
- `clubCategories/queries.ts` uses `select: '*, club:clubs(...), category:categories(...)'`

The generic entities API serves these via the query layer config. `category_lineup_members` needs the same pattern.

### How `added_by` is handled

The `added_by` field (user who added the member) is set client-side using `useUser()` context which provides `user.id`. The component includes it in the create payload. This is consistent with how other entities handle user-associated fields.

---

## Refactor Plan

### Phase 1: Query Layer — Add member JOIN ✅ DONE

**File:** `src/queries/categoryLineupMembers/queries.ts`

Updated `getAllCategoryLineupMembers` to include member details in the select, following `memberAttendance` pattern:

```typescript
const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
  select: '*, members!inner(id, name, surname, registration_number, category_id)',
  sorting: options?.sorting,
  pagination: options?.pagination,
  filters: options?.filters,
});
```

**Verified:** Trailing comma in select string was removed (would have caused Supabase query error).

### Phase 2: Entity Config — Wire mutations + coachWritable ✅ DONE

**File:** `src/app/api/entities/config.ts`

Added `create`, `update`, `delete` to `category_lineup_members` query layer and set `coachWritable: true`:

```typescript
category_lineup_members: {
  tableName: categoryLineupMembersQueries.DB_TABLE,
  sortBy: [{column: 'jersey_number', ascending: true}],
  requiresAdmin: false,
  coachWritable: true,
  filters: [
    {paramName: 'categoryId', dbColumn: 'category_id'},
    {paramName: 'lineupId', dbColumn: 'lineup_id'},
  ],
  queryLayer: {
    getAll: categoryLineupMembersQueries.getAllCategoryLineupMembers,
    getById: categoryLineupMembersQueries.getCategoryLineupMemberById,
    create: categoryLineupMembersQueries.createCategoryLineupMember,
    update: categoryLineupMembersQueries.updateCategoryLineupMember,
    delete: categoryLineupMembersQueries.deleteCategoryLineupMember,
  },
},
```

**Verified:** `coachWritable: true` was missing and added — without it, only admins could write.

### Phase 3: Translations — Add Czech CRUD messages ✅ DONE

**File:** `src/lib/translations/lineupMember.ts`

Added to `responseMessages`:
```typescript
createSuccess: 'Člen soupisky úspěšně přidán',
updateSuccess: 'Člen soupisky úspěšně aktualizován',
deleteSuccess: 'Člen soupisky úspěšně odebrán',
createError: 'Chyba při přidávání člena soupisky',
updateError: 'Chyba při aktualizaci člena soupisky',
deleteError: 'Chyba při odebírání člena soupisky',
errorMessage: 'Nastala chyba. Zkuste to prosím znovu.',
```

### Phase 4: New CRUD Hook ✅ DONE

**New file:** `src/hooks/entities/category-lineup-members/state/useCategoryLineupMembers.ts`

Factory-based hook following `useCategoryLineups` pattern:

```typescript
export function useCategoryLineupMembers() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    BaseCategoryLineupMember,
    CreateCategoryLineupMember
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: { /* Czech translations */ },
  })();

  return {
    loading, setLoading, error,
    createCategoryLineupMember: create,
    updateCategoryLineupMember: update,
    deleteCategoryLineupMember: deleteItem,
  };
}
```

### Phase 5: New Fetch Hook ✅ DONE

**New file:** `src/hooks/entities/category-lineup-members/data/useFetchCategoryLineupMembers.ts`

Parameterized factory hook that passes `categoryId` and `lineupId` as query params:

```typescript
export function useFetchCategoryLineupMembers(params: { categoryId: string; lineupId: string }) {
  return createDataFetchHook<CategoryLineupMemberWithMember, { categoryId: string, lineupId: string }>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        categoryId: params.categoryId,
        lineupId: params.lineupId,
      });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.lineupMembers.responseMessages.errorMessage,
    fetchOnMount: true,
  })(params);
}
```

---

### Phase 6: Update Consumers ⬜ TODO

**File: `src/app/coaches/lineups/components/LineupMembers.tsx`**

- Replace `useCategoryLineupMember()` → `useCategoryLineupMembers()`
- Replace `useFetchCategoryLineupMembers(categoryId, lineupId)` → new factory hook with `{categoryId, lineupId}` params
- In `handleAddMember`: include `lineup_id`, `added_by: user.id`, `is_active: true` in data payload
- Remove `handleEditMember` and UPDATE action from columns (no edit modal exists)
- Fix `functions` column to show both captain and vice-captain

**File: `src/app/coaches/lineups/page.tsx`**

- Replace `useCategoryLineupMember()` → `useCategoryLineupMembers()`
- Update `removeLineupMember` call: change from `(categoryId, lineupId, id)` to `deleteCategoryLineupMember(id)`

### Phase 7: Cleanup ⬜ TODO

| Action | File |
|--------|------|
| Delete | `src/hooks/entities/category/state/useCategoryLineupMember.ts` (broken, replaced) |
| Delete | `src/hooks/entities/category/data/useFetchCategoryLineupMembers.ts` (manual, replaced) |
| Delete | `src/hooks/entities/category/data/useFetchCategoryLIneupMembersFactory.ts` (typo, incomplete) |
| Deprecate (mark for future removal) | `src/app/api/categories/[id]/lineups/[lineupId]/members/route.ts` |
| Deprecate (mark for future removal) | `src/app/api/categories/[id]/lineups/[lineupId]/members/[memberId]/route.ts` |
| Regenerate | `src/hooks/index.ts` (barrel) |

---

## Additional Issues (to fix in Phase 6)

### 1. `handleEditMember` in `LineupMembers.tsx` is non-functional
- UPDATE action calls `handleEditMember(member)` which PATCHes member with its own current data (no-op)
- No edit form/modal exists
- **Action:** Remove UPDATE action for now, implement edit modal later

### 2. `functions` column only shows Captain
`LineupMembers.tsx` renders only `is_captain` chip. Missing `is_vice_captain`.

### 3. Custom API routes become dead code
After migration, these files will have no consumers:
- `src/app/api/categories/[id]/lineups/[lineupId]/members/route.ts`
- `src/app/api/categories/[id]/lineups/[lineupId]/members/[memberId]/route.ts`

---

## Execution Order

| Step | Phase | Status | Description |
|------|-------|--------|-------------|
| 1 | Phase 1 | ✅ DONE | Add member JOIN to query layer |
| 2 | Phase 2 | ✅ DONE | Wire mutations + coachWritable into entity config |
| 3 | Phase 3 | ✅ DONE | Add Czech translations |
| 4 | Phase 4 | ✅ DONE | Create new CRUD hook (factory) |
| 5 | Phase 5 | ✅ DONE | Create new fetch hook (factory) |
| 6 | Phase 6 | ⬜ TODO | Update consumers (LineupMembers.tsx, page.tsx) |
| 7 | Phase 7 | ⬜ TODO | Delete old files, regenerate barrels |

---

## Verification Checklist

After refactor, verify:

- [ ] Lineup members table loads with member names (GET via generic API with JOIN)
- [ ] Add member to lineup works (POST via generic API, `added_by` from `useUser()`)
- [ ] Remove member from lineup works (DELETE via generic API)
- [ ] Toast messages are in Czech
- [ ] No console errors
- [ ] Old custom routes have no remaining imports
- [ ] `npm run tsc` passes
- [ ] `npm run lint` passes