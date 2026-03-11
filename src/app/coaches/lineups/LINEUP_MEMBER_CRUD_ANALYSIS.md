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
        ├── created_by, is_active, created_at, updated_at, updated_by
```

Both are straightforward tables. `category_lineups` already uses the generic entities API correctly. Only `category_lineup_members` was broken.

**Note:** `category_lineup_members` does NOT have a `category_id` column — category ownership is resolved through the parent `category_lineups` row via `lineup_id`.

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

## Target Architecture ✅ IMPLEMENTED

```
Component (LineupMembers.tsx / page.tsx)
  ↓
useCategoryLineupMembers() — createCRUDHook factory (consistent with all entities)
  ↓
Generic entities API: /api/entities/category_lineup_members
  ↓ (uses supabaseAdmin for mutations — bypasses RLS)
Query layer: src/queries/categoryLineupMembers/ (queries.ts + mutations.ts)
  ↓
Supabase
```

```
useFetchCategoryLineupMembers({lineupId}) — createDataFetchHook factory
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

### How `created_by` is handled

The `created_by` field (user who added the member) is set client-side using `useUser()` context which provides `user.id`. The component includes it in the create payload. This is consistent with how other entities handle user-associated fields.

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

### Phase 2: Entity Config — Wire mutations + coachWritable ✅ DONE

**File:** `src/app/api/entities/config.ts`

Added `create`, `update`, `delete` to `category_lineup_members` query layer, set `coachWritable: true`, and added `categoryResolver` for coach access checks:

```typescript
category_lineup_members: {
  tableName: categoryLineupMembersQueries.DB_TABLE,
  sortBy: [{column: 'jersey_number', ascending: true}],
  requiresAdmin: false,
  coachWritable: true,
  categoryResolver: async (supabase, body) => {
    if (!body.lineup_id) return null;
    const {data} = await supabase
      .from('category_lineups')
      .select('category_id')
      .eq('id', body.lineup_id)
      .single();
    return data?.category_id ?? null;
  },
  filters: [
    {paramName: 'lineupId', dbColumn: 'lineup_id'},
  ],
  queryLayer: { /* all CRUD operations */ },
},
```

**Also added `coachWritable: true` to `category_lineups`** — was missing, causing 403 for coaches on lineup create/edit/delete.

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

Factory-based hook following `useCategoryLineups` pattern.

### Phase 5: New Fetch Hook ✅ DONE

**New file:** `src/hooks/entities/category-lineup-members/data/useFetchCategoryLineupMembers.ts`

Parameterized factory hook that passes `lineupId` as query param:

```typescript
export function useFetchCategoryLineupMembers(params: {lineupId: string}) {
  return createDataFetchHook<CategoryLineupMemberWithMember, {lineupId: string}>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({ lineupId: params.lineupId });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.lineupMembers.responseMessages.errorMessage,
    fetchOnMount: true,
  })(params);
}
```

**Note:** Only `lineupId` is passed — `categoryId` was removed since `category_lineup_members` has no `category_id` column. Filtering by `lineup_id` is sufficient (each lineup belongs to one category).

### Phase 6: Update Consumers ✅ DONE

**File: `src/app/coaches/lineups/components/LineupMembers.tsx`**

- Replaced old hooks with `useCategoryLineupMembers()` and `useFetchCategoryLineupMembers({lineupId})`
- `handleAddMember` enriches modal data with `lineup_id`, `created_by: user.id`, `is_active: true`
- Removed `handleEditMember` and UPDATE action from columns (no edit modal exists)
- `functions` column now shows both captain and vice-captain chips
- Added `useUser()` for `created_by` field

**File: `src/app/coaches/lineups/page.tsx`**

- Removed `useCategoryLineupMember()` import entirely
- Delete modal simplified to `useModalWithItem<string>()` — only handles lineup deletion
- Member deletion is fully handled within `LineupMembers.tsx`

### Phase 7: Cleanup ⬜ TODO

| Action | File |
|--------|------|
| Delete | `src/hooks/entities/category/state/useCategoryLineupMember.ts` (broken, replaced) |
| Delete | `src/hooks/entities/category/data/useFetchCategoryLineupMembers.old.ts` (manual, replaced) |
| Delete | `src/hooks/entities/category/data/useFetchCategoryLIneupMembersFactory.ts` (typo, incomplete) |
| Deprecate (mark for future removal) | `src/app/api/categories/[id]/lineups/[lineupId]/members/route.ts` |
| Deprecate (mark for future removal) | `src/app/api/categories/[id]/lineups/[lineupId]/members/[memberId]/route.ts` |

---

## Bugs Found & Fixed During Refactor

### 1. Filter param name mismatch (fetch returned all members)
The entity config mapped `paramName: 'categoryId'` → `dbColumn: 'category_id'`, but `category_lineup_members` has no `category_id` column. The `categoryId` filter was silently ignored. Additionally, the hook was sending `lineup_id` as URL param but the config expected `lineupId`.
**Fix:** Removed `categoryId` filter from config. Hook now sends only `lineupId` matching the config's `paramName`.

### 2. RLS silently blocked delete (success toast but no deletion)
The `coachWritable` DELETE handler used the RLS-bound `supabase` client for the actual mutation. Supabase `.delete()` returns `{error: null}` even when RLS prevents deletion (0 rows affected).
**Fix:** All `coachWritable` mutation paths (POST, PATCH/PUT, DELETE) now use `supabaseAdmin` for the database operation. Auth is validated above via role/category checks.

### 3. Coach access check hardcoded `body.category_id` (400 on create)
The `coachWritable` POST handler required `body.category_id` for authorization. `category_lineup_members` doesn't have this column — category ownership is on the parent `category_lineups` row.
**Fix:** Added `categoryResolver` to `EntityConfig` — an async function that resolves `category_id` from the request body via parent lookup. Applied to POST, PUT/PATCH, and DELETE routes.

### 4. `category_lineups` missing `coachWritable: true` (403 on lineup edit)
Coaches got 403 Forbidden when creating/editing/deleting lineups because the entity config fell through to the admin-only path.
**Fix:** Added `coachWritable: true` to `category_lineups` config.

### 5. `added_at`/`added_by` columns renamed (standardization)
`category_lineup_members` used non-standard `added_at`/`added_by` columns. The `buildInsertQuery` factory adds `created_at` by default, causing "column not found" errors.
**Fix:** Migration `20260311_rename_added_at_to_created_at.sql` renames columns and adds `updated_at`/`updated_by`. Schema types regenerated.

### 6. `useMemberForm` circular dependency (build failure)
`useMemberForm.ts` called `createFormHook()` at module level while importing from the `@/hooks` barrel, which re-exports `useMemberForm` — circular dependency. `createFormHook` was `undefined` during module initialization.
**Fix:** Moved `createFormHook()` call inside the `useMemberForm()` function body. Import changed from `@/hooks` to `@/hooks/factories`.

### 7. Schema generator missing `Json` type (TS2552)
`split-db-types.js` copies field types from `supabase.ts` but doesn't import the `Json` type alias. Tables with `Json` columns (e.g. `role_definitions.permissions`) produced TS errors.
**Fix:** Generator now detects `Json` usage in fields and injects a local `type Json = ...` alias at the top of the generated file.

---

## Execution Order

| Step | Phase | Status | Description |
|------|-------|--------|-------------|
| 1 | Phase 1 | ✅ DONE | Add member JOIN to query layer |
| 2 | Phase 2 | ✅ DONE | Wire mutations + coachWritable + categoryResolver into entity config |
| 3 | Phase 3 | ✅ DONE | Add Czech translations |
| 4 | Phase 4 | ✅ DONE | Create new CRUD hook (factory) |
| 5 | Phase 5 | ✅ DONE | Create new fetch hook (factory, lineupId only) |
| 6 | Phase 6 | ✅ DONE | Update consumers (LineupMembers.tsx, page.tsx) |
| 7 | Phase 7 | ⬜ TODO | Delete old files, regenerate barrels |

---

## Verification Checklist

After refactor, verify:

- [x] Lineup members table loads with member names (GET via generic API with JOIN)
- [x] Add member to lineup works (POST via generic API, `created_by` from `useUser()`)
- [x] Remove member from lineup works (DELETE via generic API with `supabaseAdmin`)
- [x] Toast messages are in Czech
- [x] Works for both admin and coach roles
- [x] `npm run tsc` passes
- [ ] Old custom routes have no remaining imports
- [ ] `npm run lint` passes