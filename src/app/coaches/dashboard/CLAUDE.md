# Dashboard Section

## Purpose

Overview page for coaches showing quick stats and upcoming information: birthdays, top scorers, yellow/red card leaders, and a match schedule with the ability to record results. Serves as the landing page after login.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Master page — category selection tabs, error boundary, layout grid |
| `components/BirthdayCard.tsx` | Upcoming birthdays for selected category (next 3) |
| `components/TopScorersCard.tsx` | Top 5 goal scorers via `usePlayerStats(categoryId)` |
| `components/YellowCardsCard.tsx` | Top 5 yellow card recipients via `usePlayerStats(categoryId)` |
| `components/RedCardsCard.tsx` | Top 5 red card recipients with breakdown by type |
| `components/index.ts` | Barrel exports |

## Data Flow

```
page.tsx
├── useUser() → user context, error boundary
├── useFetchCategories() → all categories
├── useUserRoles().getCurrentUserCategories() → assigned categories
├── availableCategories = filter(all, assigned)
│
├── Category tabs (if multiple)
│
├── Grid layout:
│   ├── BirthdayCard(categoryId)
│   │   └── useUpcomingBirthdays(3, true, categoryId)
│   ├── TopScorersCard(categoryId)
│   │   └── usePlayerStats(categoryId) → topScorers
│   ├── YellowCardsCard(categoryId)
│   │   └── usePlayerStats(categoryId) → yellowCardPlayers
│   ├── RedCardsCard(categoryId)
│   │   └── usePlayerStats(categoryId) → redCardPlayers
│   └── MatchSchedule(selectedCategoryId, showOnlyAssignedCategories=true)
│       └── Upcoming matches with "Record result" button
│
└── CoachMatchResultFlow modal (shared with matches page)
```

## Category Filtering

- Standard pattern: `getCurrentUserCategories()` → filter → tabs → pass to children
- All dashboard cards receive `selectedCategory` as prop and scope their queries
- `usePlayerStats()` hook properly validates category access via `getCurrentUserCategories()` internally
- `MatchSchedule` receives both `selectedCategoryId` and `showOnlyAssignedCategories={true}`

## Issues & Technical Debt

### Medium

1. **No loading state while categories are fetching** — First render may show empty content before categories load and auto-select.

2. **Category auto-selection happens asynchronously** (in `useEffect`) — Can cause an initial render with no category selected, leading to a flash of "no data" state.

3. **`showOnlyAssignedCategories={true}` on `MatchSchedule` is redundant** — Since `selectedCategoryId` already filters to an assigned category, this prop adds no value. However, `MatchSchedule` may also be used in other contexts where it matters.

4. **Error boundary in page component** — If `useUser()` throws, the page shows an error message. The error handling is functional but the message could be more actionable (e.g., suggest re-login).

### Low

5. **Magic numbers** — Top scorers shows 5 items, birthdays show 3 — these should be named constants.

6. **`usePlayerStats` is called 3 times** (by TopScorers, YellowCards, RedCards) with the same `categoryId` — TanStack Query deduplicates identical requests, so this is fine functionally, but the data could also be fetched once and passed down.

## Improvement Proposals

1. **Add a loading skeleton** while categories are being fetched and auto-selected.

2. **Extract category/season filter logic** into a shared `useCategorySeasonFilter()` hook — identical pattern to matches, lineups, attendance.

3. **Consider pre-fetching dashboard data** — Since this is the landing page, data could be prefetched during navigation to improve perceived performance.

4. **Extract magic numbers** into named constants (e.g., `BIRTHDAY_DISPLAY_COUNT = 3`, `TOP_PLAYERS_COUNT = 5`).