# Coaches Members Page — Analysis & Improvement Plan

> Date: 2026-03-03
> Files analysed: `page.tsx`, `MembersInternalSection.tsx`, `MemberTableTab.tsx`, `UnifiedTable.tsx`, `useFetchMembersInternal.ts`, `buildMembersViewQuery`, `route.ts`, `MembersInternalQuerySchema`, `MemberModal.tsx`, `MemberInfoForm.tsx`, `CoachCategoryContext.tsx`

---

## 1. Current State Summary

| Feature | Status |
|---|---|
| Search (name / surname / reg. number) | ✅ Wired correctly to API, debounced |
| Category filtering (coach portal) | ⚠️ Broken on initial load (race condition) |
| Active-only checkbox | ❌ Completely non-functional |
| Member creation — category list | ❌ Shows ALL categories, not coach-assigned ones |
| Member creation — gender field | ✅ Present and works |
| Pagination — page navigation | ❌ Hook limit (25) and table rowsPerPage (10) out of sync |
| Pagination — configurable page size | ❌ `changePageSize` exists in hook but never exposed |

---

## 2. Search

### Current implementation

```
page.tsx → searchTerm state
    → MembersInternalSection (searchTerm prop)
        → useFetchMembersInternal({ search: searchTerm })
            → hook: debouncedSearch (300ms) → ?search=...
                → route.ts Zod: z.string().min(1).optional()
                    → buildMembersViewQuery:
                        .or(`name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`)
```

### Findings

- ✅ All three fields (name, surname, registration_number) are searched with `ilike` (case-insensitive).
- ✅ 300ms debounce in the hook prevents excessive API calls while typing.
- ✅ Zod schema: `z.string().min(1).optional()` — an empty string sent by the client is rejected (status 400). However, the hook's `if (debouncedSearch)` guard ensures empty strings are **never sent**, so the Zod rejection is a safety net, not a first line.
- ✅ `handleSearchChange` with `useCallback((...) => setSearchTerm(...), [])` is correct — stable reference, no memory leak.

### Issues

None critical. No improvements needed here beyond cosmetic (placeholder text, clear button).

---

## 3. Category Filtering

### Current implementation

```
CoachCategoryContext → selectedCategory (auto-selected first assigned category)
                     → availableCategories (filtered to assigned)

page.tsx:
  const { selectedCategory, availableCategories } = useCoachCategory();
  const [selectedCategoryId, setSelectedCategoryId] = useState(selectedCategory || '');
  // ↑ initialized ONCE on first render

  <Select
    selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
    onSelectionChange={(keys) => setSelectedCategoryId(Array.from(keys)[0] as string)}
  >
    {availableCategories.map(...)}
  </Select>

  <MembersInternalSection categoryId={selectedCategoryId} />
```

### Issue 1 — Race condition: category filter empty on initial load (High)

`useState(selectedCategory || '')` initialises from the context value at **first render**. The context (`CoachCategoryContext`) loads asynchronously — it depends on `useAppData()` which fetches categories on mount. On the first render, `selectedCategory` is `''` (context not ready yet). `selectedCategoryId` is therefore `''` and no category filter is applied.

By the time the context finishes loading and `selectedCategory` becomes the correct UUID, `useState` does NOT re-initialise — React only uses the initial value argument on the first render. The coach sees **all members across all categories** until they manually pick one from the Select.

**Fix:** Either use `useEffect` to sync `selectedCategoryId` when context resolves, or drive the Select directly from `useCoachCategory().selectedCategory` and call `setSelectedCategory()` from the context on change (no local duplicate state needed).

### Issue 2 — Select not auto-hidden for single-category coaches (Low)

When a coach is assigned to exactly one category, showing a category Select with one item is pointless noise. The attendance page hides the Select (or auto-selects) when only one category is available. Members page should follow the same pattern.

### Issue 3 — Local state disconnected from context (Low)

`selectedCategoryId` is a local copy of the context's `selectedCategory`. If the user switches pages, the local copy resets. The context was designed to persist the selection across navigation — but the local `useState` bypasses that persistence.

---

## 4. Active-Only Checkbox

### Current implementation

```tsx
const [isActiveOnly, setIsActiveOnly] = useState<boolean>(true);

<Checkbox isSelected={isActiveOnly}>
  {translations.common.labels.isActive}
</Checkbox>
```

### Findings — completely broken in three ways

**Bug 1 — No onChange handler:** The `<Checkbox>` renders with `isSelected={isActiveOnly}` but has no `onValueChange` or `onChange` prop. Clicking the checkbox has no effect; the state never changes. The component is visually interactive but functionally inert.

**Bug 2 — State not passed to section:** Even if the checkbox updated `isActiveOnly`, the value is never passed to `MembersInternalSection`. The section doesn't accept an `activeOnly` prop.

**Bug 3 — Hook doesn't support it:** `useFetchMembersInternal`'s `MembersInternalOptions` interface has no `activeOnly` field, so there is no URL param path either. The database query helper (`buildMembersViewQuery`) **does** support `activeOnly` — `GetMembersOptions.activeOnly` applies `.eq('is_active', true)` — but it's never activated through the hook.

**Result:** The checkbox defaults to `true` (visually checked), but the list always returns both active and inactive members.

### Fix path

The fix requires wiring through all three layers:
1. Add `onChange` to the checkbox: `onValueChange={setIsActiveOnly}`
2. Add `activeOnly?: boolean` to `MembersInternalOptions` and `MembersInternalSectionProps`
3. Pass `activeOnly` from hook options to `buildMembersViewQuery` call via the route

---

## 5. Member Creation Flow

### Current implementation

```tsx
// page.tsx
const { categories: { data: categoriesData } } = useAppData();  // ALL categories

<MemberModal
  categories={categoriesData || []}  // ← ALL categories passed
  ...
/>
```

```tsx
// MemberInfoForm.tsx — filters by gender match
categories.filter((category) => {
  if (formData.sex === Genders.MALE) return category.gender === Genders.MALE || category.gender === Genders.MIXED;
  if (formData.sex === Genders.FEMALE) return category.gender === Genders.FEMALE || category.gender === Genders.MIXED;
  return false;
})
```

### Issue — Coach can assign a member to any category (High)

`MemberModal` receives `categoriesData` from `useAppData()` — the full list of all active categories, not filtered to the coach's assigned categories. `MemberInfoForm` filters this list by gender compatibility, but not by assignment.

A coach with `availableCategories = [{ id: 'cat-A' }]` can create a member and assign them to `cat-B`, `cat-C`, or any other category that matches the gender.

**Fix:** Pass `availableCategories` from `useCoachCategory()` instead of `categoriesData` to `MemberModal`. Since `MemberInfoForm` already filters by gender inside, the combined effect would be: categories that are both assigned to the coach AND match the selected gender.

### Gender field — no issues

- ✅ `<Select>` is present, uses `genderOptions` from `@/utils`
- ✅ `isRequired` set
- ✅ Changing gender correctly resets `category_id` to prevent stale selection
- ✅ Category Select is disabled until gender is chosen (`isDisabled={!formData.sex}`)

### Minor: `as unknown as Member` cast in edit handler (Low)

```tsx
onEdit={(member) => memberModal.openWith(member as unknown as Member)}
```

`member` is `MemberInternal` (payment view schema). `memberModal` holds `Member` (base table type). The cast discards `MemberInternal`-specific fields. In edit mode, `MemberInfoForm` only uses base `Member` fields (no payment fields), so this doesn't cause visible data loss in the form. But the cast is fragile — if form fields are extended, the dropped fields won't be pre-populated.

---

## 6. Pagination

### Where page size is set

| Location | Value | Purpose |
|---|---|---|
| `useFetchMembersInternal` — `initialLimit = 25` | 25 | Rows fetched per API call |
| `MembersInternalSection` — `rowsPerPage={10}` | 10 | Rows shown per page in the table |
| `MembersInternalQuerySchema` — `limit.max(100)` | max 100 | Server-side Zod constraint |
| `MemberTableTab` — prop default `rowsPerPage = 25` | 25 | Default if caller doesn't pass it |
| `buildMembersViewQuery` — `limit = 100` | 100 | Default in query helper (overridden by options) |

### Critical bug — API limit and table rowsPerPage are out of sync

`MembersInternalSection` passes `rowsPerPage={10}` to `MemberTableTab`. `MemberTableTab` calculates:

```ts
const totalPages = Math.ceil(pagination.total / rowsPerPage);
// e.g., 100 members: Math.ceil(100 / 10) = 10 pages shown in UI
```

But `useFetchMembersInternal` fetches **25** rows per API call (`initialLimit = 25`). When the user clicks page 4, `goToPage(4)` calls:

```ts
fetchData(4, pagination.limit)  // pagination.limit = 25
// → API: ?page=4&limit=25 → returns members 76–100
```

The user expected to see members 31–40 (page 4 × 10 rows), but the API returned members 76–100 (page 4 × 25 rows). The two pagination systems are using different page-size denominators.

**This is the root cause of unexpected results when switching pages.** The data shown on "page N" of the table doesn't correspond to what the user expects.

A secondary symptom: `UnifiedTable` in server-pagination mode renders all rows in `data` as-is (no client-side slicing). With 25 rows returned but `rowsPerPage=10`, all 25 rows are rendered in the table, not 10. The `rowsPerPage` prop in server mode is only used to calculate `totalPages` — it doesn't slice the data.

### `changePageSize` is dead code in the UI

`useFetchMembersInternal` exports `changePageSize(newLimit)`. This correctly resets to page 1 and refetches with the new limit. But nothing in the component tree calls it — there is no dropdown, no selector, no UI element.

### How difficult is it to add configurable page size?

The hook already supports it. The infrastructure is in place. The changes needed are:

1. Add a `pageSize` state to the caller (`MembersInternalSection` or `page.tsx`)
2. Pass `limit={pageSize}` to `useFetchMembersInternal`
3. Pass `rowsPerPage={pageSize}` to `MemberTableTab` (so UI and API page size match)
4. Render a HeroUI `Select` with size options (10, 25, 50) and call `changePageSize` on change

The hard part is that `limit` is currently `initialLimit` — it only applies on mount. The hook would need to handle `limit` changes either by re-initializing or by wiring `changePageSize` to a state that propagates back in.

---

## 7. Root Cause of `{"error":"\""}` When Switching Pages

From static analysis, the most likely trigger is a Zod validation failure caused by an unexpected query parameter value reaching the route. Three candidates:

**Candidate A — `search` sent as empty string:** Zod schema has `z.string().min(1).optional()`. If `search=''` reaches the API, Zod rejects it with `{ search: ["String must contain at least 1 character(s)"] }`. Stringified: `'{"search":["String must contain at least 1 character(s)"]}'`. The UI displays this JSON string as the error message. However, the hook's `if (debouncedSearch)` guard should prevent this.

**Candidate B — `category_id` sent as non-UUID:** If `selectedCategoryId` is a non-UUID string (e.g., `'all'`, a placeholder, or an empty string that bypasses the `if (debouncedCatId)` guard), Zod rejects with `{ category_id: ["Invalid uuid"] }`.

**Candidate C — Response JSON shape mismatch on error:** The hook reads `result.data.items`. If the response is an error body `{ error: "...", data: null }` and `!response.ok` check fires AFTER `setData` runs, it would throw on `null.map(...)`. The hook's current order is `await response.json()` → check `!response.ok` → read `result.data.items`, so this should not happen.

**Most actionable fix:** Change `errorResponse(JSON.stringify(parsed.error.flatten().fieldErrors), 400)` to return a structured error object that the hook can parse and display more meaningfully, rather than a JSON-within-JSON string.

---

## 8. Step-by-Step Improvement Plan

### Step 1 — Fix the pagination mismatch (Critical)

**Problem:** `rowsPerPage=10` in `MembersInternalSection`, but `initialLimit=25` in the hook.

**Fix:** Make `MembersInternalSection` drive both values from the same source.

- Add a `pageSize` state (default 25) to `MembersInternalSection` or expose it as a prop from `page.tsx`
- Pass `limit={pageSize}` into `useFetchMembersInternal`
- Pass `rowsPerPage={pageSize}` into `MemberTableTab`
- Wire `changePageSize` from the hook to a `<Select>` with options `[10, 25, 50]`

After this fix, what the API fetches and what the table displays are always aligned.

**Rationale:** The hook already has `changePageSize` and the Zod schema allows up to 100. Zero new infrastructure needed.

### Step 2 — Fix the Active-Only checkbox (High)

**Problem:** Three-layer disconnect — no onChange, state not passed, hook doesn't support it.

**Fix (3 sub-steps):**
1. `page.tsx`: add `onValueChange={setIsActiveOnly}` to `<Checkbox>`
2. Add `activeOnly?: boolean` to `MembersInternalSectionProps` and pass `activeOnly={isActiveOnly}`
3. In `MembersInternalSection`, pass `activeOnly` to `useFetchMembersInternal` via a new `activeOnly` option
4. In `useFetchMembersInternal`, add `activeOnly` to `MembersInternalOptions`, debounce it, and send `?active_only=true` when set
5. In `route.ts`, add `active_only: z.coerce.boolean().optional()` to the Zod schema and map it to `activeOnly` before calling `getMembersInternal`

**Rationale:** The `buildMembersViewQuery` already has the implementation. This is only wiring.

### Step 3 — Fix category initialisation race condition (High)

**Problem:** `useState(selectedCategory || '')` captures `''` at first render; context loads later.

**Option A (preferred):** Remove the local `selectedCategoryId` state. Drive the `<Select>` directly via `useCoachCategory()`:
```tsx
const { selectedCategory, setSelectedCategory, availableCategories } = useCoachCategory();

<Select
  selectedKeys={selectedCategory ? [selectedCategory] : []}
  onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
>
```
Pass `categoryId={selectedCategory}` to `MembersInternalSection`. Selection persists across pages automatically.

**Option B (local fix only):** Add a `useEffect` to sync when context resolves:
```tsx
useEffect(() => {
  if (selectedCategory && !selectedCategoryId) {
    setSelectedCategoryId(selectedCategory);
  }
}, [selectedCategory]);
```
This is a workaround. Option A is cleaner and aligns with the `CoachCategoryContext` design intent.

### Step 4 — Fix member creation category list (High)

**Problem:** `categories={categoriesData || []}` passes ALL categories to `MemberModal`.

**Fix:**
```tsx
// Replace:
categories={categoriesData || []}

// With:
categories={availableCategories}
```
`availableCategories` comes from `useCoachCategory()` (already imported). It's pre-filtered to the coach's assigned categories. `MemberInfoForm`'s existing gender filter is then applied on top.

**Rationale:** Without this fix, a coach can place new members into categories they don't manage.

### Step 5 — Add configurable page size UI (Medium)

Once Step 1 is done (pageSize state unified), add a `<Select>` for page size in the toolbar `UnifiedCard` in `page.tsx`:

```tsx
<Select
  label={translations.members.table.filters.pageSize}
  selectedKeys={[String(pageSize)]}
  onSelectionChange={(keys) => setPageSize(Number(Array.from(keys)[0]))}
  size="sm"
>
  <SelectItem key="10">10</SelectItem>
  <SelectItem key="25">25</SelectItem>
  <SelectItem key="50">50</SelectItem>
</Select>
```

`pageSize` state lives in `page.tsx` and is passed as a prop to `MembersInternalSection`, which passes it as both `limit` to the hook and `rowsPerPage` to `MemberTableTab`.

**Note:** Zod schema has `max(100)`. Values 10/25/50 are all within bounds.

### Step 6 — Hide category Select for single-category coaches (Low)

```tsx
{availableCategories.length > 1 && (
  <Select ...>
    {availableCategories.map(...)}
  </Select>
)}
```

Follows the attendance page pattern.

### Step 7 — Improve Zod error display (Low)

Change the Zod error path in `route.ts` from double-encoded JSON-in-JSON to a readable string:

```ts
// Current:
return errorResponse(JSON.stringify(parsed.error.flatten().fieldErrors), 400);

// Improved:
const fieldErrors = parsed.error.flatten().fieldErrors;
const firstMessage = Object.values(fieldErrors).flat()[0] ?? 'Invalid request parameters';
return errorResponse(firstMessage, 400);
```

This produces `{"error":"String must contain at least 1 character(s)"}` instead of `{"error":"{\"search\":[\"String must contain...\"]}"}`, which `showToast.danger` can display directly without confusing the user.

---

## 9. Component Responsibility After Fixes

```
page.tsx (orchestrator)
├── State: pageSize, searchTerm, isActiveOnly
├── Category/Season from useCoachCategory() (no local duplicate)
├── Toolbar UnifiedCard:
│   ├── <Input> → searchTerm
│   ├── <Select> → category (from context, hidden if single)
│   ├── <Checkbox> → isActiveOnly  ← fixed
│   ├── <Select> → pageSize  ← new
│   └── <Button> → memberModal.openWith()
│
└── MembersInternalSection
    Props: categoryId, searchTerm, activeOnly, pageSize  ← expanded
    └── useFetchMembersInternal({ search, filters, activeOnly, limit: pageSize })
        └── MemberTableTab(rowsPerPage={pageSize})  ← aligned

MemberModal
└── categories={availableCategories}  ← fixed: coach's categories only
    └── MemberInfoForm: filter by gender (existing logic intact)
```

---

## 10. Out of Scope (Future)

- **Sex / function filter UI** — `useFetchMembersInternal` supports `sex` and `function` filters but no UI exists. These are medium-priority, separate from the critical fixes above.
- **Backend category authorization** — API route does not verify the coach has access to the requested `category_id`. This is a Layer 3 security concern (see root `CLAUDE.md`).
- **`MembersInternalSection` → generic `MemberTableWithModals`** — Refactor opportunity to share modal wiring between coach and admin portals (see `members/CLAUDE.md` Step 6).