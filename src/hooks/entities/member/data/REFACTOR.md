# Refactor Plan: `useFetchMembersInternal`

> Based on current file state as of 2026-03-02.
> **No code changes made.**

---

## Current State — Quick Assessment

| Item | Status |
|---|---|
| Filter types (`Genders`, `MemberFunction` enums) | ✅ Already done |
| Options interface renamed to `MembersInternalOptions` | ✅ Already done |
| Response shape reading | ❌ Broken — reads wrong keys |
| Debounce | ❌ Inline `setTimeout`, should use `useDebounce` |
| Request cancellation | ❌ No `AbortController` |
| Error check order | ❌ `result.error` before `response.ok` |
| `isInitialMount` ref | ❌ Fragile, unnecessary |
| `searchRef` / `filtersRef` pattern | ❌ Workaround for stale closures |
| `filterString` memo workaround | ❌ Unnecessary with `useDebounce` |

---

## Issue 1 — Response shape mismatch (Critical)

### What the API now returns

`successResponse({ items: result.data, total: result.count })` wraps into:

```json
{
  "data": {
    "items": [ ...MemberInternal objects... ],
    "total": 42
  },
  "error": null
}
```

### What the hook currently reads

```ts
// Line 88 — reads result.data as the array
result.data.map((schema: MembersInternalSchema) => convertToInternalMemberWithPayment(schema))
// result.data is { items, total } — .map() does not exist on an object → runtime error

// Line 92 — reads result.pagination which no longer exists
setPagination(result.pagination || {page, limit, total: null});
// result.pagination is undefined → always falls back to {page, limit, total: null}
// total is NEVER set from the API response
```

### Fix

```ts
// Step 1 — read items array
setData(
  (result.data.items as MembersInternalSchema[]).map(convertToInternalMemberWithPayment)
);

// Step 2 — read total from data, build pagination from local page/limit args
setPagination({ page, limit, total: result.data.total ?? null });
```

---

## Issue 2 — Error check order

### Current (line 83–85)

```ts
if (result.error) {
  throw new Error(result.error);
}
```

This checks the JSON body before checking `response.ok`. Problems:
- A 401, 403, or 500 with no JSON body silently succeeds (`result.error` is `undefined`)
- A network error before JSON parse causes an unhandled exception path

### Fix — check HTTP status first

```ts
if (!response.ok) {
  throw new Error(result.error || 'Failed to load members');
}
```

Also add AbortError guard (see Issue 4):

```ts
} catch (err) {
  if (err instanceof Error && err.name === 'AbortError') return;
  const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
  setError(errorMessage);
  showToast.danger(errorMessage);
}
```

---

## Issue 3 — Inline debounce + `isInitialMount` + ref workarounds

### Current pattern — 4 interconnected problems

**Problem A — `fetchData` has no deps (line 100):**
```ts
const fetchData = useCallback(async (page: number, limit: number) => {
  // reads searchRef.current and filtersRef.current
}, []); // No dependencies - uses refs instead
```
`fetchData` can never see updated `search`/`filter` values directly — it reads them via refs as a workaround for the stale closure problem.

**Problem B — `searchRef` / `filtersRef` (lines 47–53):**
```ts
const searchRef = useRef(initialSearch);
const filtersRef = useRef(initialFilters);
searchRef.current = initialSearch;  // mutated on every render
filtersRef.current = initialFilters;
```
These exist solely because `fetchData` can't have `search`/`filters` as deps (would create infinite loops without proper memoization).

**Problem C — `isInitialMount` (lines 47, 103–108):**
```ts
const isInitialMount = useRef(true);
// ...
useEffect(() => {
  if (enabled && isInitialMount.current) {
    isInitialMount.current = false;
    fetchData(initialPage, initialLimit);
  }
}, [enabled, initialPage, initialLimit, fetchData]);
```
Prevents the second `useEffect` from firing on mount. Breaks in React 18 StrictMode (double-invoke runs the initial effect twice, setting `isInitialMount.current = false` on the first run, so the second run sees `false` and skips).

**Problem D — `filterString` memo workaround (lines 111–115):**
```ts
const filterString = useMemo(
  () => JSON.stringify(initialFilters),
  [initialFilters.sex, initialFilters.category_id, initialFilters.function]
);
```
Exists to create a stable string from the `filters` object for the second `useEffect` dependency. Necessary only because filters can't go directly into deps without risking reference instability.

### Root cause — all four problems come from one decision

`fetchData` captures `search` and `filters` via refs instead of as closure variables. This is the old pattern. `useDebounce` resolves it cleanly.

### Fix — replace with `useDebounce`

`useDebounce` from `@/hooks/shared/useDebounce` debounces a value and returns a stable scalar. The debounced scalars can safely be `useEffect` dependencies.

```ts
import {useDebounce} from '@/hooks/shared/useDebounce';

const debouncedSearch = useDebounce(search, 300);
const debouncedSex    = useDebounce(filters.sex, 300);
const debouncedCatId  = useDebounce(filters.category_id, 300);
const debouncedFn     = useDebounce(filters.function, 300);
```

`fetchData` now captures these as closure values and declares them as deps:

```ts
const fetchData = useCallback(async (page: number, limit: number) => {
  // builds URL using debouncedSearch, debouncedSex, etc. directly — no refs
}, [debouncedSearch, debouncedSex, debouncedCatId, debouncedFn]);
// fetchData re-creates only when a debounced value changes (max once per 300ms)
```

Single `useEffect` drives all fetches — no `isInitialMount`, no `filterString`, no separate initial/change effects:

```ts
useEffect(() => {
  if (!enabled) return;
  fetchData(1, pagination.limit); // reset to page 1 on any search/filter change
}, [enabled, fetchData, pagination.limit]);
// fetchData is the stable dep — it changes only when debounced values change
```

**What gets removed:**
- `isInitialMount` ref — gone
- `searchRef` — gone
- `filtersRef` — gone
- `filterString` memo — gone
- `useMemo` import — gone
- Two separate `useEffect` blocks → one

---

## Issue 4 — No `AbortController`

### Current

```ts
const response = await fetch(url.toString()); // no abort signal
```

If the component unmounts while a request is in flight, `setData` / `setLoading` / `setError` are called on an unmounted component.

When search/filter changes trigger a new fetch before the previous one completes, both responses race to set state — the slower response can overwrite the faster one.

### Fix

```ts
const abortControllerRef = useRef<AbortController | null>(null);

const fetchData = useCallback(async (page: number, limit: number) => {
  // Cancel any in-flight request before starting a new one
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  const response = await fetch(url.toString(), {
    signal: abortControllerRef.current.signal,
  });
  // ...
}, [...]);

// Cancel on unmount
useEffect(() => {
  return () => abortControllerRef.current?.abort();
}, []);
```

The AbortError guard in the catch block (see Issue 2) ensures aborted requests don't set error state.

---

## Issue 5 — `loading` initial state

### Current (line 38)

```ts
const [loading, setLoading] = useState(true);
```

`loading` starts as `true` regardless of `enabled`. If a consumer passes `enabled: false`, the UI still shows a loading spinner on mount until some state change occurs.

### Fix

```ts
const [loading, setLoading] = useState(enabled);
// true if auto-fetch will happen, false if disabled
```

---

## Refactored Structure — Overview

### Imports — what changes

```ts
// Remove:
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
//              ^^^^^^^ useMemo removed  ^^^^ useRef kept for AbortController only

// Add:
import {useDebounce} from '@/hooks/shared/useDebounce';
```

### State — no change

```ts
const [data, setData] = useState<MemberInternal[]>([]);
const [loading, setLoading] = useState(enabled);   // ← fix: was true
const [error, setError] = useState<string | null>(null);
const [pagination, setPagination] = useState<PaginationInfo>({...});
```

### Refs — reduced from 3 to 1

```ts
// Remove: isInitialMount, searchRef, filtersRef
// Keep:
const abortControllerRef = useRef<AbortController | null>(null);
```

### Debounced values — new

```ts
const debouncedSearch = useDebounce(search, 300);
const debouncedSex    = useDebounce(filters.sex, 300);
const debouncedCatId  = useDebounce(filters.category_id, 300);
const debouncedFn     = useDebounce(filters.function, 300);
```

### `fetchData` — deps fixed, response reading fixed

```ts
const fetchData = useCallback(async (page: number, limit: number) => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();
  setLoading(true);
  setError(null);

  try {
    const url = new URL(API_ROUTES.members.internal, window.location.origin);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', limit.toString());
    if (debouncedSearch)  url.searchParams.set('search', debouncedSearch);
    if (debouncedSex)     url.searchParams.set('sex', debouncedSex);
    if (debouncedCatId)   url.searchParams.set('category_id', debouncedCatId);
    if (debouncedFn)      url.searchParams.set('function', debouncedFn);

    const response = await fetch(url.toString(), {
      signal: abortControllerRef.current.signal,
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Failed to load members');  // ← fix

    setData(
      (result.data.items as MembersInternalSchema[]).map(convertToInternalMemberWithPayment)  // ← fix
    );
    setPagination({ page, limit, total: result.data.total ?? null });  // ← fix

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return;  // ← new
    const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
    setError(errorMessage);
    showToast.danger(errorMessage);
  } finally {
    setLoading(false);
  }
}, [debouncedSearch, debouncedSex, debouncedCatId, debouncedFn]);  // ← fix: was []
```

### Effects — 2 effects instead of 3, no workarounds

```ts
// Effect 1 — drive fetches (replaces both previous useEffects + isInitialMount logic)
useEffect(() => {
  if (!enabled) return;
  fetchData(1, pagination.limit);
}, [enabled, fetchData, pagination.limit]);
// fetchData changes only when debounced values change → natural debouncing

// Effect 2 — cleanup on unmount (new)
useEffect(() => {
  return () => abortControllerRef.current?.abort();
}, []);
```

### Public API — no change

```ts
return { data, loading, error, pagination, refresh, goToPage, changePageSize };
```

---

## Files to Change

| File | Change |
|---|---|
| `useFetchMembersInternal.ts` | All issues above — single file change |

No consumer changes needed — public API is identical.