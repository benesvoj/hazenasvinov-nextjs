# Lineups Section

## Purpose

Manages team lineups per category and season. Coaches create lineups, add/remove members, and assign positions and jersey numbers. Each category can have multiple lineups per season.

## Files

| File | Responsibility |
|---|---|
| `error.tsx` | Master page — category/season selection via tabs, lineup CRUD orchestration |
| `components/LineupsList.tsx` | Lists lineups for selected category/season with add/edit/delete |
| `components/LineupMembers.tsx` | Displays members in selected lineup with add/edit/delete |
| `components/LineupModal.tsx` | Create/edit lineup form (name, description) |
| `components/AddMemberModal.tsx` | Add member to lineup with duplicate prevention |
| `components/CreateMemberModal.tsx` | Create new member directly from lineup context |
| `components/index.ts` | Barrel exports |
| `helpers/helpers.ts` | Shared utility functions |
| `README.md` | Existing documentation |
| `REFACTORING_ANALYSIS.md` | Existing refactoring notes |

## Data Flow

```
error.tsx
├── useFetchSeasons() → all seasons
├── useFetchCategories() → all categories
├── useUserRoles().getCurrentUserCategories() → assigned categories
├── useFetchCategoryLineups({categoryId, seasonId}) → lineups
├── useCategoryLineups() → lineup CRUD mutations
├── useCategoryLineupMember() → member CRUD mutations
├── useFetchCategoryLineupMembers(categoryId, lineupId) → members in lineup
│
├── Category tabs (if multiple assigned)
│   └── Tab click → setSelectedCategory → refetch lineups
│
├── Left column: LineupsList
│   ├── Click lineup → setSelectedLineup → fetch members
│   ├── "Add" → LineupModal (create)
│   ├── "Edit" → LineupModal (edit)
│   └── "Delete" → confirmation modal
│
└── Right column: LineupMembers
    ├── "Add member" → AddMemberModal
    ├── "Edit member" → AddMemberModal (edit mode)
    └── "Remove member" → confirmation
```

## Category Filtering

- Uses `useUserRoles().getCurrentUserCategories()` to get assigned categories
- Tab-based UI when coach has multiple categories (only visible if `userCategories.length > 1`)
- Auto-selects first category if only one assigned
- `useFetchCategoryLineups()` receives `selectedCategory` — only fetches lineups for that category
- **Client-side only** — no backend validation that coach owns the category

## Issues & Technical Debt

### Critical

1. **No backend category authorization** — `useFetchCategoryLineups()` and `useFetchCategoryLineupMembers()` pass `categoryId` to the API without server-side verification. A coach could access lineups from unauthorized categories via direct API calls.

2. **Lineup mutation endpoints lack category validation** — `useCategoryLineups()` (create/update/delete) and `useCategoryLineupMember()` (add/remove) accept operations without verifying the coach has access to the target category.

### High

3. **Race condition risk** — If a coach changes category while a `removeLineupMember` operation is in flight, the `selectedCategory` may have changed before the deletion completes. Operations should capture the category at invocation time.

4. **No optimistic updates** — Modal operations wait for server response before reflecting changes. This creates a sluggish UX, especially on slower connections.

### Medium

5. **Page needs refactoring** — Acknowledged by TODO comment in code. State management for lineup selection, modals, and category/season is all in a single component.

6. **Missing form validation** — Some modals lack proper validation before submission.

### Low

7. **`AddMemberModal` duplicate prevention** — Correctly prevents duplicate members and jersey numbers, but error messages could be more descriptive.

## Improvement Proposals

### Security (Layers 3 + 4 — see root CLAUDE.md)

1. **Add server-side category authorization** to all lineup API routes — verify coach is assigned to the `category_id` before allowing read/write operations.

2. **Add RLS policies** to `category_lineups` and `category_lineup_members` tables.

### Client Architecture (Layer 2 — CoachCategoryContext)

3. **Adopt `CoachCategoryContext`** (see `components/CLAUDE.md`) — Replace per-page category/season selection with `const { selectedCategory, selectedSeason } = useCoachCategory()`. This eliminates the duplicated tab rendering and auto-selection logic. The context also fixes the race condition issue (#3 above) since `selectedCategory` is stable in context rather than local state that can change mid-operation.

4. **Refactor `error.tsx`** — After context adoption, extract remaining lineup-specific state (selectedLineup, modals) into `useLineupsPage()` hook.

### Code Quality

5. **Add optimistic updates** — Use TanStack Query's optimistic update pattern for lineup and member mutations.

6. **Capture category at operation time** — Mutation callbacks should close over the current `selectedCategory` value rather than reading it from state at execution time. (Partially solved by context — context value is more stable than per-page state.)