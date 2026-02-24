# Attendance Section

## Purpose

Manages training session attendance for coaches. Coaches create/generate training sessions per category and season, then record per-member attendance with four statuses: Present, Absent, Late, Excused. Includes a statistics tab with trends and member performance.

## Files

| File | Lines | Responsibility |
|---|---|---|
| `page.tsx` | ~373 | Master orchestrator — state, modals, data fetching |
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

## Current State

The page has been through two major refactoring rounds and is now at ~373 lines (down from ~572). ESLint clean.

**Completed refactoring:**
- Uses `useCoachCategory()` for category/season state (no per-page boilerplate)
- Uses `useModalWithItem<BaseTrainingSession>()` / `useModalWithItem<string>()` / `useModal()` from `src/hooks/shared/useModals.ts`
- Extracted `resolveMemberIds` as a `useCallback` to DRY member ID resolution
- No direct Supabase client usage — all data through hooks
- No `alert()` calls — uses `showToast`
- No `any` types in modal state (typed via `useModalWithItem<T>`)
- No `setTimeout` hacks — `openEmpty()` handles create mode
- All user-facing strings use translations from `@/lib/translations`

## Data Flow

```
page.tsx
├── useCoachCategory() → selectedCategory, selectedSeason, availableCategories
├── useAppData() → seasons[], members[]
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

## Modal State Pattern

```typescript
const sessionModal = useModalWithItem<BaseTrainingSession>();  // create + edit
const deleteModal = useModalWithItem<string>();                // delete by ID
const statusDialog = useModalWithItem<BaseTrainingSession>();  // status change
const generatorModal = useModal();                             // simple open/close
```

---

## Next Refactoring Steps

### Step 1: Close modals after successful async operations

**Problem:** Two handlers don't close their modals after success:

1. `handleSessionSubmit` (line 127) — after creating/updating a session, `sessionModal.closeAndClear()` is never called. The `TrainingSessionModal` component does NOT auto-close after `onSubmit`.

2. `confirmDeleteSession` (line 167) — after deleting a session, `deleteModal.closeAndClear()` is never called. `DeleteConfirmationModal` does NOT auto-close after `onConfirm`.

Note: `handleStatusUpdate` is fine — `TrainingSessionStatusDialog` calls `onClose()` internally after `onConfirm`.

**Fix:**
```typescript
// handleSessionSubmit — add at end of try block (before catch):
sessionModal.closeAndClear();

// confirmDeleteSession — add after refetchSessions():
deleteModal.closeAndClear();
```

---

### Step 2: Fix `as any` cast on Tabs `onSelectionChange`

**Problem:** Line 292 uses `key as any`:
```typescript
onSelectionChange={(key) => setActiveTab(key as any)}
```

**Fix:** Cast to the union type:
```typescript
onSelectionChange={(key) => setActiveTab(key as 'attendance' | 'statistics')}
```

---

### Step 3: Fix prop name typo `onStatusChnage`

**Problem:** `TrainingSessionList.tsx` has a typo in its prop name: `onStatusChnage` (should be `onStatusChange`). This requires changing:

| File | What to change |
|---|---|
| `components/TrainingSessionList.tsx` line 19 | Interface definition: `onStatusChnage` → `onStatusChange` |
| `components/TrainingSessionList.tsx` line 31 | Destructuring: `onStatusChnage` → `onStatusChange` |
| `components/TrainingSessionList.tsx` line 104 | Usage: `onStatusChnage(session)` → `onStatusChange(session)` |
| `page.tsx` line 302 | Prop: `onStatusChnage={...}` → `onStatusChange={...}` |

---

## Remaining Issues & Technical Debt

### Critical

1. **No backend authorization on category access** — API routes for training sessions and attendance accept any `categoryId` without verifying the coach is assigned. (Server-side concern — see root `CLAUDE.md` Layers 3-4.)

2. **No RLS policies** on `training_sessions` or `member_attendance` tables.

3. **Training session generator is non-functional** — Creation logic in `TrainingSessionGenerator.tsx` is commented out.

### Medium

4. **Attendance statistics endpoint** (`/api/attendance/statistics`) lacks category authorization (server-side concern).

### Low

5. **5 empty stub components** — `AttendanceTrendsChart`, `SummaryCards`, `InsightsPanel`, `MemberPerformanceTable`, `RecommendationsPanel` should be implemented or removed.

6. **`AttendanceModal.tsx`** — Legacy component, candidate for removal.