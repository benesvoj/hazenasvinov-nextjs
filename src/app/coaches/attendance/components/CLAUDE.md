# Attendance Components

## Purpose

UI components for the attendance section: training session management (list, create/edit modal, generator, status dialog), attendance recording table, and statistics views.

## Files

| File | Lines | Status | Translations |
|---|---|---|---|
| `index.ts` | 11 | Active | N/A |
| `TrainingSessionList.tsx` | 145 | Clean | Yes |
| `TrainingSessionModal.tsx` | 196 | Active | **No** — hardcoded Czech |
| `TrainingSessionGenerator.tsx` | 455 | **Non-functional** | **No** — hardcoded Czech |
| `TrainingSessionStatusDialog.tsx` | 134 | Active | **No** — hardcoded Czech |
| `TrainingSessionStatusBadge.tsx` | 40 | Clean | Yes (via `enumHelpers`) |
| `AttendanceRecordingTable.tsx` | 154 | Active | **No** — hardcoded Czech |
| `AttendanceModal.tsx` | 171 | **Legacy** | **No** — hardcoded Czech |
| `AttendanceStatisticsLazy.tsx` | 192 | Active | **Partial** — English tab headers |
| `AttendanceStatistics.tsx` | 481 | **Redundant** | **No** — hardcoded Czech |
| `AttendanceChart.tsx` | 114 | Active | **No** — hardcoded Czech |
| `AttendanceTrendsChart.tsx` | 10 | **Empty stub** | N/A |
| `SummaryCards.tsx` | 7 | **Empty stub** | N/A |
| `SummarySessionCard.tsx` | 18 | Clean | N/A |
| `InsightsPanel.tsx` | 7 | **Empty stub** | N/A |
| `MemberPerformanceTable.tsx` | 7 | **Empty stub** | N/A |
| `RecommendationsPanel.tsx` | 7 | **Placeholder stub** | N/A |

**Clean components (no issues):** `TrainingSessionList`, `TrainingSessionStatusBadge`, `SummarySessionCard`

---

## Issue Summary

### 1. Hardcoded Czech strings (8 components)

Most components hardcode Czech strings instead of using `@/lib/translations`. This is the single biggest issue across the folder.

| Component | Hardcoded strings | Examples |
|---|---|---|
| `TrainingSessionModal.tsx` | ~12 | Field labels (`"Název tréninku"`, `"Datum"`, `"Místo"`), button labels (`"Zrušit"`, `"Uložit změny"`) |
| `TrainingSessionStatusDialog.tsx` | ~10 | Status labels/descriptions, `"Změnit stav tréninku"`, `"Důvod zrušení *"`, warning text |
| `AttendanceRecordingTable.tsx` | ~7 | Heading, button text, table headers (`"ČLEN"`, `"STATUS"`), empty/error states |
| `AttendanceChart.tsx` | ~6 | Chart title, legend labels, summary labels |
| `TrainingSessionGenerator.tsx` | ~15 | Day names, field labels, validation messages, button labels |
| `AttendanceStatisticsLazy.tsx` | 4 | English tab headers (`"Insights"`, `"Member Performance"`, `"Attendance Trends"`, `"Recommendations"`) |
| `AttendanceStatistics.tsx` | ~30+ | Extensive — all section headers, column headers, labels |
| `AttendanceModal.tsx` | ~8 | Table headers, member count heading, button labels |

### 2. Empty stub components (5 files)

These render nothing (`<> </>`) or placeholder text. They are imported by `AttendanceStatisticsLazy` but do nothing:

- `AttendanceTrendsChart.tsx` — props typed as `any`, returns empty fragment
- `SummaryCards.tsx` — props typed as `any`, returns empty fragment
- `InsightsPanel.tsx` — props typed as `any`, returns empty fragment
- `MemberPerformanceTable.tsx` — props typed as `any`, returns empty fragment
- `RecommendationsPanel.tsx` — returns `<div>Recommendations Panel</div>`

### 3. Non-functional TrainingSessionGenerator

Creation logic (lines 208-238) is commented out with a TODO. The "Create" button does nothing — `successCount` stays 0 and the function returns without creating sessions. Also uses direct Supabase client instead of mutation hooks.

### 4. Redundant statistics implementations

Two files serve similar purposes:
- `AttendanceStatisticsLazy.tsx` (192 lines) — uses `useFetchAttendanceStatistics` hook, composes stub components
- `AttendanceStatistics.tsx` (481 lines) — full standalone implementation with its own data handling via `onLoadAnalytics` callback

Only `AttendanceStatisticsLazy` is exported from `index.ts` and used by the page. `AttendanceStatistics` appears unused.

### 5. `any` types

| File | Location | Proper type |
|---|---|---|
| `AttendanceRecordingTable.tsx` | `selectedSession: any` | `string \| null` |
| `AttendanceModal.tsx` | `filteredMembers: any[]`, `attendanceRecords: any[]` | Proper entity types |
| `TrainingSessionGenerator.tsx` | `item: any` (line 98), `membersData: any` (line 193) | Proper entity types |
| All 5 stubs | Props typed as `any` | N/A (stubs) |

---

## Refactoring Plan

### Step 1: Delete dead code

Remove files that are unused or redundant. This clears noise before meaningful work.

| Action | File | Reason |
|---|---|---|
| Delete | `AttendanceModal.tsx` | Legacy, not exported in barrel, not used by page |
| Delete | `AttendanceStatistics.tsx` | Redundant with `AttendanceStatisticsLazy`, not exported in barrel |
| Delete | `SummaryCards.tsx` | Empty stub, not exported in barrel |

After deletion, regenerate barrels (`/generate-barrels`).

---

### Step 2: Decide on statistics stubs

The remaining stubs (`AttendanceTrendsChart`, `InsightsPanel`, `MemberPerformanceTable`, `RecommendationsPanel`) are imported by `AttendanceStatisticsLazy`. Two options:

**Option A: Remove stubs and simplify `AttendanceStatisticsLazy`**
- Remove the 4 stub files
- Remove the tabs in `AttendanceStatisticsLazy` that reference them (Insights, Member Performance, Trends, Recommendations)
- Keep only the working summary cards section
- Simplest approach — ship what works, add features when needed

**Option B: Implement the stubs**
- Implement each using data already fetched by `useFetchAttendanceStatistics`
- `MemberPerformanceTable` — table with member name, present/absent/late counts, percentage
- `AttendanceTrendsChart` — reuse/extend `AttendanceChart` with date range selection
- `InsightsPanel` — render insights array from statistics data
- `RecommendationsPanel` — render recommendations array from statistics data
- More work, but the data is already available

---

### Step 3: Move hardcoded strings to translations — `TrainingSessionModal`

Add translation keys under `translations.attendance.modal`:
```typescript
modal: {
  fields: {
    title: { label: '...', placeholder: '...' },
    description: { label: '...', placeholder: '...' },
    date: { label: '...' },
    time: { label: '...' },
    location: { label: '...', placeholder: '...' },
  },
  buttons: {
    cancel: '...',
    save: '...',
    create: '...',
  },
}
```

---

### Step 4: Move hardcoded strings to translations — `TrainingSessionStatusDialog`

Extract `statusOptions` labels/descriptions and dialog text to translations. Derive `statusOptions` from enum + translations (same pattern as `TrainingSessionStatusBadge` uses `trainingSessionStatusOptions`).

---

### Step 5: Move hardcoded strings to translations — `AttendanceRecordingTable`

Fix `any` type (`selectedSession: any` → `string | null`) at the same time.

---

### Step 6: Move hardcoded strings to translations — `AttendanceChart`

Chart title, legend labels, summary labels.

---

### Step 7: Move hardcoded strings to translations — `AttendanceStatisticsLazy`

Fix English tab headers → Czech translations.

---

### Step 8: Fix `TrainingSessionGenerator`

This is the largest task. Three sub-steps:
1. Re-enable creation logic using mutation hooks (replace direct Supabase client)
2. Move hardcoded Czech strings to translations (day names, field labels, validation messages)
3. Fix `any` types

---

### Suggested priority

| Priority | Steps | Effort | Impact |
|---|---|---|---|
| 1 | Step 1 (delete dead code) | Low | Reduces noise |
| 2 | Step 2 (decide stubs) | Low–Medium | Clarifies scope |
| 3 | Steps 3-7 (translations) | Medium | Consistency |
| 4 | Step 8 (generator) | High | Restores broken feature |