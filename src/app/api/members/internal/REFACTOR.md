# Refactor Status: `GET /api/members/internal`

> Last validated: 2026-03-02

---

## Summary

| Area | Status |
|---|---|
| `route.ts` | ✅ Done |
| `getMembersInternal` query function | ✅ Done |
| `getMembersExternal` query function | ✅ Done |
| Zod validator `membersInternal.ts` | ✅ Done |
| `GetMembersOptions` type cleanup | ✅ Done |
| Zod→options key mapping (`categoryId`) | ✅ Fixed |
| `memberFunctions` type in `GetMembersOptions` | ✅ Fixed — uses `MemberFunction` enum |
| `getMembersOnLoan` view name | ✅ Fixed — `members_on_loan` in constants |
| `getMembersAll` `QueryContext` alignment | ⚠️ Low — inconsistency |
| `function` filter wiring | ⚠️ TODO — disabled in route.ts (see note) |

---

## ✅ Completed

### `route.ts`
- Uses `NextRequest`
- Uses `withAuth` — no manual auth check
- Uses `successResponse` / `errorResponse` — no raw `NextResponse.json()`
- Zod validation via `MembersInternalQuerySchema.safeParse()`
- Explicitly maps `category_id` → `categoryId` before calling query
- No inline query logic
- No TS errors

### `queries.ts` — view functions
All three typed member functions query their respective views and follow `QueryContext`/`buildMembersViewQuery` pattern:

- `getMembersInternal` → `members_internal` → `MemberInternal[]` ✅
- `getMembersExternal` → `members_external` → `MemberExternal[]` ✅
- `getMembersOnLoan` → `members_on_loan` ✅ (constants.ts fixed)

### `types.ts` — `GetMembersOptions` + `MemberFunctionJoin`
- Broken flags (`isInternal`, `isExternal`, `onLoan`) removed
- `memberFunctions?: MemberFunction` now correctly typed as the enum from `@/enums`
- Local join interface renamed from `MemberFunction` → `MemberFunctionJoin` to remove collision

### `src/lib/validators/membersInternal.ts`
Zod schema with full coercion and validation:
- `page` / `limit` — `z.coerce.number()` with bounds
- `sex` — `z.nativeEnum(Genders)`
- `category_id` — `z.string().uuid()`
- `function` — `z.nativeEnum(MemberFunction)`

### `buildMembersViewQuery` helper
Shared query builder in `src/queries/members/queryHelpers.ts` — eliminates boilerplate
across internal/external/on-loan query functions.

---

## ⚠️ Remaining

### `function` filter not wired end-to-end

**File:** `route.ts` — `function` from Zod is not mapped to `memberFunctions` in the query call:

```ts
// Currently in route.ts:
categoryId: parsed.data.category_id,
// memberFunctions: parsed.data.function  ← disabled, TODO
```

Reason: `functions` column on the view stores multiple values (array/JSONB). Filtering via
`.contains('functions', [memberFunctions])` needs verification against the actual view schema.
Not blocking — category filter works; function filter was never wired in the hook either.

**Fix when ready:** Verify view schema, then add:
```ts
memberFunctions: parsed.data.function,
```

---

### `getMembersAll` takes `SupabaseClient` instead of `QueryContext`

`getMembersAll` is the only member query still taking `SupabaseClient` directly. Not blocking —
it's used for generic cross-type queries (dropdowns) without an API route. Align when that route is added.