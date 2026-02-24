# Attendance Section

## Purpose

Manages training session attendance for coaches. Coaches create/generate training sessions per category and season, then record per-member attendance with four statuses: Present, Absent, Late, Excused. Includes a statistics tab with trends and member performance.

## Files

| File | Lines | Responsibility |
|---|---|---|
| `page.tsx` | ~572 | Master orchestrator — state, modals, data fetching, category/season selection |
| `components/TrainingSessionList.tsx` | ~140 | Lists sessions with selection, status change, edit, delete actions |
| `components/TrainingSessionModal.tsx` | ~195 | Create/edit session form (title, description, date, time, location) |
| `components/TrainingSessionGenerator.tsx` | ~454 | Bulk session generation by date range + weekdays |
| `components/TrainingSessionStatusDialog.tsx` | ~134 | Modal for changing session status (planned/done/cancelled) |
| `components/TrainingSessionStatusBadge.tsx` | ~40 | Visual status indicator chip |
| `components/AttendanceRecordingTable.tsx` | ~188 | Core recording UI — 4 status buttons per member |
| `components/AttendanceModal.tsx` | ~varies | Legacy attendance modal (not actively used) |
| `components/AttendanceStatisticsLazy.tsx` | ~varies | Lazy-loaded statistics wrapper, fetches `useFetchAttendanceStatistics` |
| `components/AttendanceStatistics.tsx` | ~480 | Full statistics view with tabs (Overview, Member Performance, Trends) |
| `components/AttendanceChart.tsx` | ~114 | Simple bar chart — last 14 days attendance trend |
| `components/AttendanceTrendsChart.tsx` | — | **Empty stub** |
| `components/SummaryCards.tsx` | — | **Empty stub** |
| `components/SummarySessionCard.tsx` | ~18 | Single metric display card (count/percentage) |
| `components/InsightsPanel.tsx` | — | **Empty stub** |
| `components/MemberPerformanceTable.tsx` | — | **Empty stub** |
| `components/RecommendationsPanel.tsx` | — | **Stub** — placeholder text only |
| `components/index.ts` | — | Barrel exports |

## Data Flow

```
page.tsx
├── useAppData() → seasons[], categories[], members[]
├── useUser() → userCategories[], isAdmin
├── Compute availableCategories (filter by assigned)
├── useFetchTrainingSessions({categoryId, seasonId})
│   └── GET /api/entities/training_sessions?categoryId=X&seasonId=Y
├── useFetchCategoryLineups({categoryId, seasonId})
├── useFetchCategoryLineupMembers(categoryId, lineupId)
│
├── User selects a session:
│   └── useFetchMembersAttendance({trainingSessionId})
│       └── GET /api/entities/member_attendance?trainingSessionId=X
│
├── User records attendance:
│   └── useAttendance().recordAttendance(memberId, sessionId, status)
│
└── User views statistics tab:
    └── useFetchAttendanceStatistics(categoryId, seasonId, days)
        └── GET /api/attendance/statistics → calls 3 Supabase RPCs
```

## Category Filtering

- `availableCategories` computed from intersection of `userCategories` and all active categories
- Admins see all categories; admin simulation mode checks localStorage
- `selectedCategory` constrains all data fetching (sessions, lineups, lineup members)
- **Client-side only** — API endpoints do not verify category authorization

## Issues & Technical Debt

### Critical

1. **No backend authorization on category access** — API routes for training sessions and attendance accept any `categoryId` without verifying the coach is assigned. A coach could craft API requests to read/write attendance data for unauthorized categories.

2. **No RLS policies** on `training_sessions` or `member_attendance` tables — database-level security absent.

3. **Training session generator is non-functional** — The session creation logic in `TrainingSessionGenerator.tsx` (lines ~208-238) is **commented out** with a TODO. The generator produces a preview but does not create sessions.

### High

4. **`page.tsx` is too large (~572 lines)** — Manages all state, modals, data fetching, and rendering in a single component. Should be split into custom hooks (`useAttendanceState`, `useCategoryFilter`, `useSessionModals`).

5. **Direct Supabase queries in page component** — Lines ~232-261 contain inline queries to fetch lineup members during session creation. This duplicates logic that exists in hooks and should be centralized.

6. **Admin simulation logic duplicated** — The page reads `localStorage.getItem('adminCategorySimulation')` directly instead of relying solely on `getCurrentUserCategories()`.

### Medium

7. **Multiple `setState` in `useEffect`** without proper dependency management — eslint-disable comments suppress React warnings (lines ~104-182).

8. **Missing error handling** — Several operations fail silently (e.g., `handleSessionSubmit`). Uses `alert()` in some places instead of consistent toast notifications.

9. **Attendance statistics endpoint** (`/api/attendance/statistics`) uses `withAuth()` but does not validate category access — coach can query statistics for any category.

### Low

10. **Prop name typo** — `TrainingSessionList.tsx` has `onStatusChnage` (should be `onStatusChange`).

11. **5 empty stub components** — `AttendanceTrendsChart`, `SummaryCards`, `InsightsPanel`, `MemberPerformanceTable`, `RecommendationsPanel` are placeholders that should either be implemented or removed.

12. **`AttendanceModal.tsx`** appears to be a legacy component not actively used — candidate for removal.

## Improvement Proposals

1. **Add server-side category authorization** to all attendance-related API routes. Use a `hasCategoryAccess(supabase, userId, categoryId)` check before executing queries.

2. **Add RLS policies** to `training_sessions` and `member_attendance` tables restricting access to coaches' assigned categories.

3. **Fix the training session generator** — uncomment and test the session creation logic, add proper error handling and success notifications.

4. **Refactor `page.tsx`** into smaller units:
   - `useAttendancePage()` — orchestrating hook for all page state
   - `useCategorySeasonFilter()` — reusable category/season selection (shared pattern across pages)
   - `useSessionModals()` — modal open/close/data state
   - Extract the two-column layout into a presentational component

5. **Centralize admin simulation** — remove localStorage reads from the page; rely solely on `getCurrentUserCategories()`.

6. **Implement or remove stub components** — the 5 empty stubs add confusion. Either implement the statistics sub-features or clean them up.

7. **Replace `alert()` with toast notifications** for consistent UX across the portal.