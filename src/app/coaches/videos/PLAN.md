# Videos Page — Fix Plan

> Last updated: 2026-03-04
> Branch: `members-refactor`

---

## Fix Status

| # | Severity | Issue | Status |
|---|---|---|---|
| 1 | **Critical** | Mutation endpoints used `withAdminAuth()` — coaches blocked from all mutations | ✅ Done |
| 2 | **Critical** | `useFetchVideos()` returned ALL videos system-wide | ✅ Done |
| 3 | **High** | Duplicate `assignedCategories` state / `useUserRoles()` / `useAuth()` boilerplate | ✅ Done |
| 4 | **High** | Modal state used raw `useState` instead of `useModalWithItem<Video>` | ✅ Done |
| 5 | **High** | `onPageChange` not passed to `VideoPageLayout` | ✅ Done |
| 6 | **Medium** | `VideoPageLayout` interface had dead props | ✅ Done |
| 7 | **Medium** | `accessControlMessage` condition was inverted | ✅ Done |
| 8 | **Low** | `categoryLoading` destructured but never used as guard | ✅ Done |
| 9 | **Low** | Loading skeleton inlined in `page.tsx` | ✅ Done |
| 10 | **High** | `formModal` declared and opened but never rendered — edit is silently broken | ⬜ Todo |
| 11 | **High** | `paginatedVideos` not used — all videos passed to `VideoGrid`, pagination shows wrong items | ⬜ Todo |
| 12 | **Low** | Duplicate skeleton — both `VideoPageLayout` and `VideoGrid` have the same guard | ⬜ Todo |

---

## Completed Fixes (summary)

| Fix | What was done |
|---|---|
| 1 | `coachWritable?: boolean` in `EntityConfig`; `hasCategoryAccess()` in `coachAuth.ts`; POST/PUT/PATCH/DELETE route handlers branch on flag with role + category check; regular `supabase` client used (not admin) |
| 2 | `useFetchVideos(categoryIds?)` sends `?category_ids=`; GET route extracts param → `arrayFilters`; `arrayFilters` added to `GetEntitiesOptions`; `getAllVideos` chains `.in()` before await |
| 3 | Removed: `assignedCategories` state, `useUserRoles()`, `useAuth()`, `fetchAssignedCategories`, `useEffect`. Now: `const {availableCategories} = useCoachCategory()` |
| 4 | `formModal = useModalWithItem<Video>()` + `deleteModal = useModalWithItem<Video>()` replace 4 raw `useState` hooks |
| 5 | `onPageChange={setCurrentPage}` passed to `<VideoPageLayout>`; `VideoPageLayout` already forwarded it to `VideoGrid` |
| 6 | `VideoPageLayoutProps` interface stripped of `onAddVideo`, `error`, `onFiltersChange`, `onFormSubmit`, `isFormModalOpen`, `editingVideo`, `onCloseModals`; `VideoFilters` import removed; `page.tsx` call site cleaned accordingly |
| 7 | `accessControlMessage` condition corrected to `!hasAssignedCategories ? ... : null` |
| 8 | `categoryLoading` no longer destructured; `VideoPageLayout` handles loading skeleton internally; `PageContainer isLoading={loading}` provides top-level indicator |
| 9 | Skeleton moved into `VideoPageLayout` (early return at line 70 when `loading && isEmpty(videos)`) |

---

## Remaining Fixes

---

### ⬜ Fix 10 — Edit modal is silently broken (High)

**File:** `src/app/coaches/videos/page.tsx`

**Problem:** `formModal = useModalWithItem<Video>()` is declared (line 20) and `formModal.openWith(video)` is called in `openEditModal` (line 49–51), but `formModal.isOpen` and `formModal.selectedItem` are **never used** in the JSX. No `VideoFormModal` (or equivalent) is rendered anywhere in `page.tsx`. Clicking edit on a video updates hook state but nothing appears on screen.

The `createVideo` / `updateVideo` calls and `handleCreateVideo` / `handleUpdateVideo` functions were removed from the page in the cleanup, along with the form modal rendering. This means create is also gone — there is no "Add video" button or form.

**What needs to happen:** Render a `VideoFormModal` (or whatever the form component is called) using `formModal.isOpen`, `formModal.selectedItem`, and `formModal.closeAndClear`. Reinstate `handleCreateVideo` / `handleUpdateVideo` and wire them to the modal's submit handler.

```tsx
// In JSX, alongside <DeleteConfirmationModal>:
<VideoFormModal
  isOpen={formModal.isOpen}
  video={formModal.selectedItem}          // null = create mode
  categories={availableCategories}
  clubs={clubs}
  seasons={seasons}
  onClose={formModal.closeAndClear}
  onSubmit={formModal.isEditMode ? handleUpdateVideo : handleCreateVideo}
/>
```

Also reinstate an "Add video" button — either via a prop passed to `VideoPageLayout` (if the button lives in the header) or rendered directly in `page.tsx` above `<PageContainer>`.

> Note: Confirm the exact component name for the form modal — search `src/components/features/videos/` for a form/modal component.

---

### ⬜ Fix 11 — Pagination shows wrong items (High)

**File:** `src/app/coaches/videos/page.tsx`, line 34

**Problem:** `useVideoFiltering` returns `paginatedVideos` (the sliced subset for the current page) but `page.tsx` destructures only `{filters, totalPages, totalCount}` and passes the raw `videos` (full array) to `VideoPageLayout`. `VideoGrid` renders every item in the array it receives, so all videos appear on every page regardless of `currentPage`.

**Current:**
```typescript
const {filters, totalPages, totalCount} = useVideoFiltering({
  videos,
  itemsPerPage,
  currentPage,
});
// ...
<VideoPageLayout videos={videos} ...>
```

**Fix:** Destructure `paginatedVideos` and pass it instead:
```typescript
const {filters, paginatedVideos, totalPages, totalCount} = useVideoFiltering({
  videos,
  itemsPerPage,
  currentPage,
});
// ...
<VideoPageLayout videos={paginatedVideos} ...>
```

---

### ⬜ Fix 12 — Duplicate loading skeleton (Low)

**Files:** `src/components/features/videos/VideoPageLayout.tsx:70` and `src/components/features/videos/VideoGrid.tsx:41`

**Problem:** Both components independently guard with `if (loading && isEmpty/length===0) return <skeleton>`. Since `VideoPageLayout`'s guard triggers first (it's a parent), `VideoGrid`'s skeleton is dead code.

**Fix — Option A (preferred):** Remove the skeleton early-return from `VideoPageLayout` (lines 70–87) and let `VideoGrid` own it exclusively. `VideoGrid` uses the HeroUI `<Skeleton>` component; the `VideoPageLayout` version uses a plain `div` with `animate-pulse` — the `VideoGrid` version is the better one.

**Fix — Option B:** Remove the skeleton from `VideoGrid` and keep it in `VideoPageLayout`, so the layout component can include the heading above the skeleton cards.

---

## Summary of All Changes

| File | Changes | Status |
|---|---|---|
| `src/app/api/entities/config.ts` | `coachWritable?: boolean` in `EntityConfig` interface | ✅ |
| `src/utils/supabase/coachAuth.ts` | `hasCategoryAccess()` added | ✅ |
| `src/app/api/entities/[entity]/route.ts` | POST branches on `coachWritable`; `category_ids` → `arrayFilters` in GET | ✅ |
| `src/app/api/entities/[entity]/[id]/route.ts` | PUT/PATCH/DELETE branch on `coachWritable` | ✅ |
| `src/queries/shared/types.ts` | `arrayFilters?: Record<string, string[]>` in `GetEntitiesOptions` | ✅ |
| `src/hooks/entities/video/data/useFetchVideos.ts` | Sends `?category_ids=`; accepts `categoryIds?` arg | ✅ |
| `src/queries/videos/queries.ts` | Chains `.in()` for `arrayFilters` entries | ✅ |
| `src/components/features/videos/VideoPageLayout.tsx` | Interface cleaned; skeleton added; dead imports removed | ✅ |
| `src/app/coaches/videos/page.tsx` | `useModalWithItem`, `useCoachCategory`, `useFetchVideos(ids)`, `onPageChange`, skeleton removed, inverted condition fixed | ✅ |
| `src/app/coaches/videos/page.tsx` | Reinstate form modal render + create/update handlers; use `paginatedVideos` | ⬜ |
| `src/components/features/videos/VideoPageLayout.tsx` | Remove duplicate skeleton (keep in `VideoGrid` only) | ⬜ |

---

## Out of Scope (Track Separately)

- **RLS policies** — Database-level enforcement; requires a migration
- **Server-side pagination** — Replace client-side once server filtering is stable
- **TanStack Query cache invalidation** — Stale data after mutations
