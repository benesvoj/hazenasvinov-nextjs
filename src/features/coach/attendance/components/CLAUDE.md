# Attendance Components

## Purpose

UI components for the attendance section: training session management (list, create/edit modal, generator, status dialog), attendance recording table, and statistics views.

## Files

| File | Lines | Status | Translations |
|---|---|---|---|
| `index.ts` | 9 | Active | N/A |
| `TrainingSessionList.tsx` | 145 | Clean | Yes |
| `TrainingSessionModal.tsx` | 192 | Clean | Yes |
| `TrainingSessionGenerator.tsx` | 310 | **Functional** — refactored | Yes |
| `TrainingSessionStatusDialog.tsx` | 131 | Active | Yes (partial — `statusOptions` hardcoded) |
| `TrainingSessionStatusBadge.tsx` | 40 | Clean | Yes (via `enumHelpers`) |
| `AttendanceRecordingTable.tsx` | 130 | Active | Yes (has `any` type) |
| `AttendanceStatisticsLazy.tsx` | 192 | Active | Yes (partial — one English string) |
| `AttendanceChart.tsx` | 112 | Active | Yes (partial — legend percentages hardcoded) |
| `SummarySessionCard.tsx` | 18 | Clean | N/A |
| `AttendanceTrendsChart.tsx` | 10 | **Empty stub** | N/A |
| `InsightsPanel.tsx` | 7 | **Empty stub** | N/A |
| `MemberPerformanceTable.tsx` | 7 | **Empty stub** | N/A |
| `RecommendationsPanel.tsx` | 7 | **Placeholder stub** | N/A |

**Deleted (previous refactoring):** `AttendanceModal.tsx`, `AttendanceStatistics.tsx`, `SummaryCards.tsx`

**Clean components (no issues):** `TrainingSessionList`, `TrainingSessionModal`, `TrainingSessionGenerator`, `TrainingSessionStatusBadge`, `SummarySessionCard`

---

## Remaining Issues

### 1. Hardcoded strings (4 components — minor)

Most components have been migrated to translations. A few remnants remain:

| Component | Issue |
|---|---|
| `TrainingSessionStatusDialog.tsx` | `statusOptions` array has hardcoded Czech labels/descriptions (`"Naplánován"`, `"Proveden"`, `"Zrušen"`). Should derive from enum + translations like `TrainingSessionStatusBadge` does. |
| `AttendanceStatisticsLazy.tsx` | `"Insights"` (line 123) — English string, should be Czech translation |
| `AttendanceChart.tsx` | Legend labels `"80%+"`, `"60-79%"`, `"<60%"` — arguably not translatable, but worth reviewing |
| `TrainingSessionGenerator.tsx` | ~~Default value `"Trénink"`~~ — **RESOLVED**, uses `translations.trainingSessions.titleShort` |

### 2. `any` types (1 active component + 4 stubs)

| File | Location | Proper type |
|---|---|---|
| `AttendanceRecordingTable.tsx` | `selectedSession: any` | `string \| null` |
| All 4 stubs | Props typed as `any` | N/A (stubs — fix when implementing or delete) |

### 3. ~~Non-functional TrainingSessionGenerator~~ — RESOLVED

Refactored with bulk API endpoint (`POST /api/training-sessions/bulk`), dedicated `useBulkCreateTrainingSessions` hook, and extracted `generateSessionDates` utility. No more direct Supabase, no `any` types. See `TRAINING_SESSION_GENERATOR_REFACTOR.md` for full details and 5 minor remaining issues.

### 4. Empty stub components (4 files)

Imported by `AttendanceStatisticsLazy` but render nothing:

- `AttendanceTrendsChart.tsx` — props `any`, returns empty fragment
- `InsightsPanel.tsx` — props `any`, returns empty fragment
- `MemberPerformanceTable.tsx` — props `any`, returns empty fragment
- `RecommendationsPanel.tsx` — returns `<div>Recommendations Panel</div>`

---

## Refactoring Plan

### Step 1: Decide on statistics stubs

The 4 stubs are imported by `AttendanceStatisticsLazy`. Two options:

**Option A: Remove stubs and simplify `AttendanceStatisticsLazy`**
- Delete the 4 stub files
- Remove the tabs in `AttendanceStatisticsLazy` that reference them
- Keep only the working summary cards and chart sections
- Simplest — ship what works, add features when needed

**Option B: Implement the stubs**
- Data is already fetched by `useFetchAttendanceStatistics`
- `MemberPerformanceTable` — member name, present/absent/late counts, percentage
- `AttendanceTrendsChart` — extend `AttendanceChart` with date range selection
- `InsightsPanel` — render insights array from statistics data
- `RecommendationsPanel` — render recommendations array

---

### Step 2: Fix remaining hardcoded strings

| Component | Fix |
|---|---|
| `TrainingSessionStatusDialog` | Derive `statusOptions` from `TrainingSessionStatusEnum` + translations (same pattern as `TrainingSessionStatusBadge` uses `trainingSessionStatusOptions`) |
| `AttendanceStatisticsLazy` | Replace `"Insights"` with translation key |
| `TrainingSessionGenerator` | Replace `"Trénink"` default with translation |

---

### Step 3: Fix `any` types

- `AttendanceRecordingTable.tsx`: `selectedSession: any` → `string | null`
- ~~`TrainingSessionGenerator.tsx`: `item: any`, `membersData: any`~~ — **RESOLVED** (no `any` types after refactor)

---

### ~~Step 4: Fix TrainingSessionGenerator~~ — RESOLVED

Fully refactored. See `TRAINING_SESSION_GENERATOR_REFACTOR.md` for implementation details and 5 minor remaining issues (unused import, misleading variable name, `err: any` in hook, hardcoded errorCount, unused error state).

---

### Suggested priority

| Priority | Step | Effort | Impact |
|---|---|---|---|
| 1 | Step 1 (decide stubs) | Low–Medium | Clarifies scope, removes dead code |
| 2 | Step 2 (hardcoded strings) | Low | Consistency |
| 3 | Step 3 (any types) | Low | Type safety |
| ~~4~~ | ~~Step 4 (generator)~~ | ~~High~~ | ~~DONE~~ |