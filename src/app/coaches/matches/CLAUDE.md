# Matches Section

## Purpose

Central hub for coach match management. Displays upcoming matches, recent results, standings, and statistics with tabbed navigation. Coaches can record match results (scores, photos, notes) and access strategy/preparation information for upcoming opponents.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Master page — category/season selection, tab navigation, match selection |
| `components/UpcomingMatchesCard.tsx` | List of upcoming matches with "Record result" button |
| `components/RecentResultsCard.tsx` | List of completed matches sorted by date |
| `components/RecentMatchDetails.tsx` | Detailed match view — photos, notes, lineup, documents |
| `components/CoachMatchResultFlow.tsx` | 3-step modal: scores → photo → notes. Updates match, uploads media, adds metadata |
| `components/StrategyPreparationZone.tsx` | Tabbed tactical preparation for selected upcoming match |
| `components/StrategyTabWithInfo.tsx` | Match info tab in strategy zone |
| `components/StrategyTabWithVideos.tsx` | Opponent video analysis tab |
| `components/StrategyTabWithPreviousMatches.tsx` | Previous matches against opponent |
| `components/StrategyTabWithHeadToHead.tsx` | Head-to-head statistics |
| `components/MatchStatisticsZone.tsx` | Team and player stats (overview, players, matches tabs) |
| `components/HeadToHeadStatistics.tsx` | H2H stats display |
| `components/OpponentMatchStatistics.tsx` | Opponent team statistics |
| `components/CompactVideoList.tsx` | Compact video list for strategy tab |
| `components/index.ts` | Barrel exports |

## Data Flow

```
page.tsx
├── useFetchSeasons() + useSeasonFiltering() → active season
├── useFetchCategories() → all categories
├── useUserRoles().getCurrentUserCategories() → assigned categories
├── availableCategories = filter(all, assigned)
├── useOptimizedOwnClubMatches(categoryId, seasonId) → all/upcoming/recent
├── useStandings() → standings for category
│
├── Tab: Upcoming → UpcomingMatchesCard
│   ├── Click match → StrategyPreparationZone (right panel)
│   └── "Record result" → CoachMatchResultFlow (modal)
│
├── Tab: Recent → RecentResultsCard
│   └── Click match → RecentMatchDetails (right panel)
│
├── Tab: Standings → standings table
│
└── Tab: Statistics → MatchStatisticsZone
    └── useMatchLineupStats(completedMatches) → player stats
```

## Category Filtering

- Categories filtered to assigned ones via `useUserRoles().getCurrentUserCategories()`
- Tab-based UI when multiple categories available
- `useOptimizedOwnClubMatches()` and `useStandings()` both receive `selectedCategory`
- `usePlayerStats()` in `MatchStatisticsZone` properly validates category access via `getCurrentUserCategories()`

## Issues & Technical Debt

### Critical

1. **`CoachMatchResultFlow` has no category validation** — Updates `matches` table via `supabase.from('matches').update().eq('id', match.id)` without checking if `match.category_id` is in the coach's assigned categories. A coach could record results for matches in unauthorized categories if they obtain the match object.

2. **Match metadata operations lack category validation** — `useAddMatchMetadata()`, `useDeleteMatchMetadata()`, `useSetPrimaryMatchMetadata()` accept any match ID without verifying category ownership. Photos, notes, and documents can be added to any match.

### High

3. **Try-catch around `useUserRoles()`** (lines ~48-55) — Defensive pattern suggests the provider may not always be available. This should be investigated and fixed at the provider level rather than caught per-page.

4. **No backend category authorization** on match data queries — `useOptimizedOwnClubMatches()` passes `categoryId` as a filter parameter, but the API does not verify the coach has access.

### Medium

5. **Inline state management** — `selectedMatch`, `resultFlowMatch`, `activeTab`, `selectedCategory`, `assignedCategoryIds` all managed as individual `useState` calls. Could be consolidated into a reducer or custom hook.

6. **`CoachMatchResultFlow` auto-recalculates standings** via `autoRecalculateStandings()` — This is a heavy operation triggered on every result submission. Consider debouncing or making it async with user feedback.

7. **`RecentMatchDetails`** is a complex component managing photos, notes, lineup data, and documents — could be split into sub-components.

## Improvement Proposals

### Security (Layers 3 + 4 — see root CLAUDE.md)

1. **Add category validation to `CoachMatchResultFlow`** — Server-side: the match update API must verify `match.category_id` is in the coach's `assigned_categories` before allowing score updates. Client-side: check via context as an early guard.

2. **Add category validation to metadata mutation hooks** — All match metadata operations (photos, notes, documents) must verify category ownership server-side before executing.

3. **Add RLS policies** to `matches` and `match_metadata` tables restricting write access to coaches' assigned categories.

### Client Architecture (Layer 2 — CoachCategoryContext)

4. **Adopt `CoachCategoryContext`** (see `components/CLAUDE.md`) — Replace the per-page category selection logic with `const { selectedCategory } = useCoachCategory()`. This also fixes the `useUserRoles()` try-catch issue — the context handles category resolution in the layout, so pages never need to call `getCurrentUserCategories()` directly.

5. **Create `useMatchesPage()` hook** — After context adoption, consolidate remaining match-specific state (selectedMatch, resultFlowMatch, activeTab) into a single hook.

### Code Quality

6. **Split `RecentMatchDetails`** into focused sub-components: `MatchPhotos`, `MatchNotes`, `MatchLineup`, `MatchDocuments`.