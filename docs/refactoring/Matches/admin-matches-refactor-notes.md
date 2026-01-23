# Admin Matches Page - Refactoring Analysis

**File:** `src/app/admin/matches/page.tsx`
**Analysis Date:** 2026-01-22
**Lines of Code:** ~1175

---

## 1. Main Responsibilities

The page serves as a comprehensive admin interface for managing sports matches with these core responsibilities:

| Responsibility | Description |
|----------------|-------------|
| **Match CRUD** | Create, read, update, delete individual matches |
| **Result Management** | Update match scores (full-time and halftime) |
| **Standings Calculation** | Generate/recalculate league standings |
| **Bulk Operations** | Update matchweek assignments in bulk |
| **Excel Import** | Import matches from spreadsheets |
| **Lineup Management** | Manage team lineups for matches |
| **Multi-category/season filtering** | Filter matches by category and season |
| **Matchweek Expansion UI** | Collapsible matchweek groupings |

---

## 2. Key State Variables and Side Effects

### 2.1 State Variables (18 total)

| Variable | Type | Purpose | Suspicious? |
|----------|------|---------|-------------|
| `error` | `string` | Generic error display | ⚠️ Single error state for entire page |
| `selectedCategory` | `string` | Currently selected category ID | ✅ |
| `selectedMatch` | `Match \| null` | Match being edited/acted on | ⚠️ Shared across multiple modals |
| `formData` | `AddMatchFormData` | Add match form state | ✅ |
| `resultData` | `object` | Result update form state | ✅ |
| `editData` | `EditMatchFormData` | Edit match form state | ✅ |
| `bulkUpdateData` | `object` | Bulk update form state | ✅ |
| `expandedMatchweeks` | `Set<string>` | UI expansion state | ✅ |
| `selectedSeason` | `string` | Currently selected season | ✅ |

### 2.2 Side Effects (useEffect hooks)

| Line | Dependencies | Purpose | Issue? |
|------|--------------|---------|--------|
| **202-206** | `[sortedSeasons, selectedSeason, activeSeason]` | Set default season | ⚠️ Can trigger infinite loop if `activeSeason` changes |
| **212-216** | `[fetchCategories, fetchTeams, fetchMembers]` | Initial data fetch | ✅ |
| **219-223** | `[categories, selectedCategory]` | Set default category | ⚠️ Same pattern as above |
| **226-230** | `[selectedCategory, fetchTeamCounts]` | Fetch team counts | ✅ |
| **233-237** | `[fetchStandings, selectedCategory, selectedSeason]` | Fetch standings | ✅ |

---

## 3. Database Write Locations

### 3.1 Direct Supabase Writes

| Location | Operation | Table | Method |
|----------|-----------|-------|--------|
| **Line 360** | INSERT | `matches` | `handleAddMatch()` |
| **Line 416-426** | UPDATE | `matches` | `handleUpdateResult()` |
| **Line 480-483** | DELETE | `matches` | `handleDeleteMatch()` |
| **Line 514** | DELETE | `matches` | `handleDeleteAllMatches()` |
| **Line 641** | UPDATE | `matches` | `handleUpdateMatch()` |
| **Line 767-773** | UPDATE | `matches` | `handleBulkUpdateMatchweek()` |

### 3.2 Indirect Writes (via utilities/hooks)

| Location | Function | Operation |
|----------|----------|-----------|
| **Line 251** | `calculateStandings()` | Writes to `standings` table |
| **Line 299** | `generateInitialStandings()` | Writes to `standings` table |
| **Line 435, 659** | `autoRecalculateStandings()` | Writes to `standings` table |
| **Line 811** | `importMatches()` | Bulk INSERT to `matches` |
| **Line 365, 431, etc.** | `refreshMaterializedViewWithCallback()` | Refreshes materialized view |

---

## 4. Create vs Edit Logic Comparison

### 4.1 Create Match (`handleAddMatch`, line 317-394)

```typescript
// Form state: formData
// Validation: Manual field checks (lines 324-333)
// Insert pattern:
const insertData = {
  category_id: selectedCategory,      // From filter state
  season_id: selectedSeason,          // From filter state
  date: formData.date,
  time: formData.time,
  ...
};
await supabase.from('matches').insert(insertData);
```

### 4.2 Edit Match (`handleUpdateMatch`, line 562-715)

```typescript
// Form state: editData (separate from formData!)
// Validation: Manual field checks (lines 576-594)
// Update pattern:
const updateData = {
  date: editData.date,
  time: editData.time,
  ...
};
await supabase.from('matches').update(updateData).eq('id', selectedMatch.id);
```

### 4.3 Key Differences & Issues

| Aspect | Create | Edit | Issue |
|--------|--------|------|-------|
| **Form state** | `formData` | `editData` | ⚠️ Two separate form states |
| **Category/Season source** | From filter state | Not updated (line 550) | ⚠️ Can't change match category |
| **Status** | Hardcoded `'upcoming'` | From `editData.status` | ✅ |
| **video_ids** | In `formData` | In `editData` but **never saved** | 🔴 Bug: videos never persisted on edit |
| **Form reset** | Lines 377-388 | Lines 681-696 | ✅ |

---

## 5. Suspicious or Non-idiomatic Patterns

### 5.1 🔴 Critical Issues

#### Issue 1: `selectedMatch` shared across multiple modals (Lines 63, 535-558, 997-1009)

```typescript
// Same state used by: AddResultModal, EditMatchModal, LineupManagerModal, MatchActionsModal, MatchProcessWizardModal
const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
```

**Impact**: Race condition if user clicks quickly between modals. One modal's data could bleed into another.

**Recommendation**: Use `useModalWithItem<Match>()` for each modal that needs match context.

#### Issue 2: `video_ids` never saved on edit (Lines 147, 598-639)

```typescript
// editData has video_ids field
video_ids: [],

// But updateData never includes it!
const updateData: any = {
  date: editData.date,
  // ...
  // NO video_ids!
};
```

**Impact**: Video associations are lost when editing a match.

**Fix**: Add `video_ids: editData.video_ids` to `updateData` object.

#### Issue 3: Redundant condition (Line 615)

```typescript
if (editData.match_number && editData.match_number) {  // Same condition twice!
  updateData.match_number = editData.match_number;
}
```

**Fix**: Remove duplicate condition.

### 5.2 ⚠️ Code Smells

#### Issue 4: Supabase client created at module level (Line 158)

```typescript
const supabase = createClient();  // Inside component but outside functions
```

**Impact**: Client is created once per render, which may not respect session changes.

**Recommendation**: Move inside functions or use a hook.

#### Issue 5: Type casting with `any` (Lines 335, 598, 731)

```typescript
const insertData: any = { ... };
const updateData: any = { ... };
```

**Impact**: Type safety is lost, bugs can slip through.

**Recommendation**: Create proper TypeScript interfaces for insert/update data.

#### Issue 6: Single `error` state for entire page (Line 61)

```typescript
const [error, setError] = useState('');
```

**Impact**: Can't show different errors for different operations simultaneously.

**Recommendation**: Use per-operation error states or error objects with keys.

#### Issue 7: Missing error boundaries for async operations

Multiple `try/catch` blocks that set error state but don't handle cleanup properly.

### 5.3 ⚡ Performance Issues

#### Issue 8: Multiple query invalidations (Lines 368-373, 457-462, etc.)

```typescript
await queryClient.invalidateQueries({ queryKey: ['matches', 'seasonal', ...] });
await queryClient.invalidateQueries({ queryKey: ['matches'] });
```

**Impact**: Double invalidation causes unnecessary refetches.

**Recommendation**: Consolidate into single invalidation or use more specific keys.

#### Issue 9: Full matches array created on every render (Lines 182-184)

```typescript
const matches = selectedCategoryId
  ? [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])]
  : [];
```

**Impact**: New array reference on every render, could cause unnecessary child re-renders.

**Recommendation**: Wrap in `useMemo`.

---

## 6. Root-Cause Analysis Summary

| Issue | Root Cause | Impact | Priority |
|-------|------------|--------|----------|
| Shared `selectedMatch` | Single state for multiple modals | Data corruption, wrong match edited | 🔴 High |
| Missing `video_ids` in update | Incomplete `updateData` construction | Data loss | 🔴 High |
| Redundant condition `&&` | Copy-paste error | Minor (works but confusing) | 🟡 Low |
| `any` type usage | Quick implementation | Type safety bypass | 🟡 Medium |
| Single error state | Simplified error handling | UX confusion | 🟡 Medium |
| Double query invalidation | Overly defensive caching | Performance | 🟡 Low |
| In-component array creation | Direct spread in render | Unnecessary re-renders | 🟡 Low |
| Category can't be changed on edit | `category_id` not in `updateData` | Feature limitation | 🟡 Medium |

---

## 7. Architectural Observations

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       MatchesAdminPage                          │
├─────────────────────────────────────────────────────────────────┤
│  Filters: selectedCategory, selectedSeason                      │
│           ↓                                                     │
│  Queries: useMatchesSeasonal, useFetchCategories, etc.         │
│           ↓                                                     │
│  State: formData, editData, resultData, selectedMatch          │
│           ↓                                                     │
│  Modals: 9+ modals using various combinations of state         │
│           ↓                                                     │
│  Handlers: handleAddMatch, handleUpdateMatch, etc.             │
│           ↓                                                     │
│  Supabase: Direct writes + utility functions                   │
│           ↓                                                     │
│  Cache: React Query invalidation                                │
└─────────────────────────────────────────────────────────────────┘
```

### Modal Inventory

| Modal | State Dependencies | Database Operations |
|-------|-------------------|---------------------|
| `AddMatchModal` | `formData`, filters | INSERT match |
| `AddResultModal` | `selectedMatch`, `resultData` | UPDATE match |
| `EditMatchModal` | `selectedMatch`, `editData` | UPDATE match |
| `BulkUpdateMatchweekModal` | `bulkUpdateData` | UPDATE matches (bulk) |
| `LineupManagerModal` | `selectedMatch`, `members` | External |
| `ExcelImportModal` | `categories`, `teams` | INSERT matches (bulk) |
| `DeleteConfirmationModal` | `deleteConfirm.selectedItem` | DELETE match |
| `MatchActionsModal` | `selectedMatch` | None (navigation) |
| `MatchProcessWizardModal` | `selectedMatch` | External |
| `DeleteConfirmationModal` (all) | `selectedSeason` | DELETE matches (bulk) |

---

## 8. Refactoring Recommendations

### Phase 1: Critical Bug Fixes
1. Add `video_ids` to `updateData` in `handleUpdateMatch`
2. Fix redundant `&&` condition on line 615
3. Replace shared `selectedMatch` with `useModalWithItem` pattern

### Phase 2: Type Safety
1. Create `MatchInsertData` interface
2. Create `MatchUpdateData` interface
3. Remove all `any` type casts

### Phase 3: State Consolidation
1. Consider `useReducer` for form states
2. Create unified modal management hook
3. Implement per-operation error handling

### Phase 4: Performance
1. Memoize `matches` array with `useMemo`
2. Consolidate query invalidations
3. Consider lazy loading for modals

### Phase 5: Code Organization
1. Extract handlers into custom hooks (e.g., `useMatchMutations`)
2. Move validation logic to utility functions
3. Create typed Supabase query builders

---

## 9. Related Files

- `src/app/admin/matches/components/AddMatchModal.tsx`
- `src/app/admin/matches/components/EditMatchModal.tsx`
- `src/app/admin/matches/components/AddResultModal.tsx`
- `src/app/admin/matches/components/CategoryMatches.tsx`
- `src/hooks/shared/queries/useMatchQueries.ts`
- `src/utils/autoStandingsRecalculation.ts`
- `src/utils/refreshMaterializedView.ts`
