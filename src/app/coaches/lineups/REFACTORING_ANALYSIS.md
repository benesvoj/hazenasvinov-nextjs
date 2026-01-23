# CoachesLineupsPage - Refactoring Analysis & Implementation Plan

**Date:** 2025-11-06 (Updated)
**File:** `src/app/coaches/lineups/page.tsx.backup`
**Current Status:** ⚠️ Has TypeScript errors - code is incomplete
**Lines of Code:** 512 (Target: <250)

---

## 📊 Executive Summary

This page manages category lineups (team rosters) and their members. It allows coaches to:
- Create/edit/delete lineups
- Add/edit/remove members from lineups
- Assign positions, jersey numbers, and roles (captain, vice-captain)

**Current State:**
- ⚠️ TypeScript compilation errors - page doesn't work
- ✅ Hook architecture is correct (data fetching separated from CRUD)
- ✅ All CRUD operations exist in hooks
- ❌ Page implementation has bugs in how it uses the hooks
- ⚠️ Component is too large (512 lines, target <250)

---

## 🏗️ Architecture Review (CORRECT)

### Current Hook Architecture ✅

The codebase correctly separates concerns:

**Data Layer** (Read/Fetch operations)
```typescript
useFetchCategoryLineups(categoryId, seasonId)
  - Fetches lineups for a category/season
  - Returns: {data, loading, error, refetch}
  - No mutations

useFetchCategoryLineupMembers(categoryId, lineupId)
  - Fetches members in a lineup
  - Returns: {data, loading, error, refetch}
  - No mutations

useFetchCategories()
  - Fetches all categories
  - Returns: {data, loading, error, refetch}
```

**Business/State Layer** (Write/CRUD operations)
```typescript
useCategoryLineups()
  - createLineup(data)
  - updateLineup(categoryId, lineupId, data)
  - deleteLineup(categoryId, lineupId)
  - Returns: {lineups, loading, error, createLineup, updateLineup, deleteLineup}

useCategoryLineupMember()
  - createLineupMember(categoryId, lineupId, data)
  - updateLineupMember(categoryId, lineupId, memberId, data)
  - removeLineupMember(categoryId, lineupId, memberId)
  - Returns: {createLineupMember, updateLineupMember, removeLineupMember, error}
```

**This architecture is CORRECT and should NOT be changed.**

The hooks follow clean separation:
- **Fetching hooks** are responsible for data retrieval
- **CRUD hooks** are responsible for mutations
- Each hook has a single, clear responsibility

---

## 🔴 CRITICAL BUGS (TypeScript Errors)

### Bug 1: `deleteLineup` Missing Required Parameter
**Location:** Line 165
**Severity:** 🔴 CRITICAL - TypeScript error, runtime failure
**Error:** `TS2554: Expected 2 arguments, but got 1`

**Current Code:**
```typescript
const handleDeleteLineup = async (lineupId: string) => {
    if (confirm('Opravdu chcete smazat tento soupisku?')) {
        try {
            await deleteLineup(lineupId);  // ❌ Missing categoryId parameter
            if (selectedLineup === lineupId) {
                setSelectedLineup('');
            }
        } catch (err) {
            console.error('Error deleting lineup:', err);
        }
    }
};
```

**Hook Signature:**
```typescript
// From useCategoryLineups hook
deleteLineup: (categoryId: string, id: string) => Promise<void>
```

**Fix:**
```typescript
const handleDeleteLineup = async (lineupId: string) => {
    if (confirm('Opravdu chcete smazat tento soupisku?')) {
        try {
            await deleteLineup(selectedCategory, lineupId);  // ✅ Add selectedCategory
            if (selectedLineup === lineupId) {
                setSelectedLineup('');
            }
            await refetch(); // Refresh the list
        } catch (err) {
            console.error('Error deleting lineup:', err);
        }
    }
};
```

---

### Bug 2: `openEditMode` Wrong Parameters
**Location:** Line 176
**Severity:** 🔴 CRITICAL - TypeScript error
**Error:** `TS2345: Argument of type 'CategoryLineupMember' is not assignable to parameter of type 'CategoryLineupFormData'`

**Current Code:**
```typescript
const handleDeleteClick = (lineupId: string, lineupMember: CategoryLineupMember) => {
    openEditMode(lineupId, lineupMember);  // ❌ Wrong type for second parameter
    onDeleteModalOpen();
};
```

**`openEditMode` Signature:**
```typescript
// From useCategoryLineupForm hook
openEditMode: (lineupId: string, formData: CategoryLineupFormData) => void
```

**Issue:** This function seems to be confused. It's called `handleDeleteClick` but uses `openEditMode`.

**Fix Option 1: If this is for deleting a member**
```typescript
const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

const handleDeleteMemberClick = (memberId: string) => {
    setMemberToDelete(memberId);
    onDeleteModalOpen();
};

const handleConfirmDeleteMember = async () => {
    if (memberToDelete && selectedCategory && selectedLineup) {
        try {
            await removeLineupMember(selectedCategory, selectedLineup, memberToDelete);
            await fetchLineupMembers(); // Refresh
            onDeleteModalClose();
            setMemberToDelete(null);
        } catch (err) {
            console.error('Error removing member:', err);
        }
    }
};
```

**Fix Option 2: If this is for editing a lineup (rename function)**
```typescript
const handleEditLineupClick = (lineup: CategoryLineup) => {
    openEditMode(lineup.id);
    setFormData({
        name: lineup.name,
        description: lineup.description || '',
        category_id: lineup.category_id,
        season_id: lineup.season_id,
        created_by: lineup.created_by,
        is_active: lineup.is_active,
    });
    onLineupModalOpen();
};
```

---

### Bug 3: Undefined Variables
**Location:** Lines 181-182
**Severity:** 🔴 CRITICAL - TypeScript error, runtime failure
**Error:**
- `TS2304: Cannot find name 'selected'`
- `memberId` is undefined

**Current Code:**
```typescript
const handleConfirmDelete = async () => {
    if (selected) {                    // ❌ 'selected' doesn't exist
        await removeLineupMember(memberId);  // ❌ 'memberId' doesn't exist
        await refetch();
        onDeleteModalClose();
        resetForm();
    }
};
```

**Fix:**
```typescript
// Add state to track which member to delete
const [memberToDelete, setMemberToDelete] = useState<{
    memberId: string;
    categoryId: string;
    lineupId: string;
} | null>(null);

// Update delete click handler
const handleDeleteMemberClick = (member: CategoryLineupMemberWithMember) => {
    setMemberToDelete({
        memberId: member.id,
        categoryId: selectedCategory,
        lineupId: selectedLineup,
    });
    onDeleteModalOpen();
};

// Fix confirm delete
const handleConfirmDeleteMember = async () => {
    if (memberToDelete) {
        try {
            await removeLineupMember(
                memberToDelete.categoryId,
                memberToDelete.lineupId,
                memberToDelete.memberId
            );
            await fetchLineupMembers(); // Refresh member list
            onDeleteModalClose();
            setMemberToDelete(null);
        } catch (err) {
            console.error('Error removing member:', err);
        }
    }
};
```

---

## 🟡 ARCHITECTURAL OBSERVATIONS

### Observation 1: Hook Architecture is Correct ✅

**Previous Analysis Was Wrong:** I initially suggested merging data fetching and CRUD operations into unified hooks. This was incorrect.

**Current Architecture is Good:**
```typescript
// ✅ CORRECT - Keep this pattern
const {data: lineups, refetch} = useFetchCategoryLineups(selectedCategory, selectedSeason);
const {createLineup, updateLineup, deleteLineup} = useCategoryLineups();
```

**Why This is Good:**
1. **Single Responsibility** - Each hook does one thing
2. **Reusability** - Fetching can be used without CRUD, CRUD without fetching
3. **Testability** - Easy to mock and test separately
4. **Performance** - Can optimize fetching independent of mutations
5. **Flexibility** - Can refetch from multiple sources

**Do NOT change this architecture.**

---

### Observation 2: Unused State in Hooks

Both `useCategoryLineups` and `useCategoryLineupMember` maintain internal state (`lineups`, `lineupMembers`) but **this state is never used** by the page.

**Example:**
```typescript
// In useCategoryLineups.ts
const [lineups, setLineups] = useState<CategoryLineup[]>([]);

// ...in createLineup
setLineups((prev) => [...prev, response.data]); // ✅ Updates internal state

return {
    lineups,  // ⚠️ But page.tsx.backup never uses this!
    // ...
};
```

**Page uses:**
```typescript
const {data: lineups} = useFetchCategoryLineups(...);  // From fetch hook
const {createLineup} = useCategoryLineups();           // From CRUD hook
// Never uses 'lineups' from useCategoryLineups()
```

**Impact:**
- Wasted memory (duplicate state)
- Potential confusion about source of truth
- Extra re-renders

**Fix Options:**

**Option A: Remove unused state from CRUD hooks** (Recommended)
```typescript
// In useCategoryLineups.ts
export function useCategoryLineups() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Remove: const [lineups, setLineups] = useState<CategoryLineup[]>([]);

    const createLineup = useCallback(async (data: CreateCategoryLineup) => {
        // ... implementation
        // Remove: setLineups((prev) => [...prev, response.data]);
        // Just return response, let caller refetch
    }, []);

    return {
        loading,
        error,
        createLineup,
        updateLineup,
        deleteLineup,
        // Remove: lineups
    };
}
```

**Option B: Keep state but add automatic refetch**
```typescript
// Pass refetch function to CRUD hook
const {refetch} = useFetchCategoryLineups(selectedCategory, selectedSeason);
const {createLineup} = useCategoryLineups(refetch);

// In hook, call refetch after mutation
const createLineup = useCallback(async (data) => {
    // ... create
    await refetchFn?.(); // Refetch data
}, [refetchFn]);
```

**Recommendation: Option A** - CRUD hooks should not maintain their own data state when using separate fetch hooks.

---

### Observation 3: Type Safety Issues

**Lines with `any` types:** 0 ✅

The page has been improved - all `any` types have been replaced with proper types:
```typescript
const handleEditLineup = (lineup: CategoryLineup) => {  // ✅ Properly typed
```

**However:** There are some TypeScript errors that need to be fixed (see Critical Bugs above).

---

## 📋 REFACTORING ROADMAP

### Phase 1: Fix Critical Bugs (Priority: 🔴 Immediate - 1 hour)

**Goal:** Make the page compile and work correctly

- [ ] **Task 1.1:** Fix `deleteLineup` call (line 165)
  - Add `selectedCategory` as first parameter
  - Add `refetch()` after successful delete

- [ ] **Task 1.2:** Fix delete member functionality (lines 175-187)
  - Add `memberToDelete` state
  - Create proper `handleDeleteMemberClick` function
  - Fix `handleConfirmDeleteMember` to use state and correct parameters

- [ ] **Task 1.3:** Review and test all CRUD operations
  - Create lineup ✓
  - Edit lineup ✓
  - Delete lineup → Fix and test
  - Add member ✓
  - Edit member → Verify works
  - Remove member → Fix and test

**Deliverable:** Page compiles with zero TypeScript errors, all features work

---

### Phase 2: Clean Up Hook State (Priority: 🟡 High - 2 hours)

**Goal:** Remove unused state from CRUD hooks

- [ ] **Task 2.1:** Update `useCategoryLineups` hook
  - Remove internal `lineups` state
  - Remove `setLineups` calls
  - Keep only: `loading`, `error`, CRUD functions

- [ ] **Task 2.2:** Update `useCategoryLineupMember` hook
  - Remove internal `lineupMembers` state
  - Remove `setLineupMembers` calls
  - Keep only: `loading`, `error`, CRUD functions

- [ ] **Task 2.3:** Update page.tsx.backup if needed
  - Ensure page only uses data from fetch hooks
  - Add manual `refetch()` calls after mutations if needed

**Deliverable:** Cleaner hooks with no duplicate state

---

### Phase 3: Component Extraction (Priority: 🟡 Medium - 8 hours)

**Goal:** Reduce page.tsx.backup from 512 to <250 lines

#### 3.1 Extract Category/Season Selector
- [ ] Create `components/CategorySeasonSelector.tsx`
- [ ] Props: `{categories, selectedCategory, onCategoryChange, userCategories}`
- [ ] Extract conditional rendering logic

#### 3.2 Extract Lineups Panel
- [ ] Create `components/LineupsPanel/index.tsx`
- [ ] Create `components/LineupsPanel/LineupCard.tsx`
- [ ] Extract lines for lineup list rendering
- [ ] Props: `{lineups, selectedLineup, onSelect, onEdit, onDelete, onAdd, loading}`

#### 3.3 Extract Members Table
- [ ] Create `components/LineupMembersTable/index.tsx`
- [ ] Create `components/LineupMembersTable/MemberRow.tsx`
- [ ] Extract member table rendering
- [ ] Props: `{members, onAddMember, onEditMember, onRemoveMember, loading}`

#### 3.4 Extract Delete Confirmation Modal
- [ ] Create reusable `components/ConfirmDeleteModal.tsx`
- [ ] Replace current delete modal usage

**Expected Structure:**
```
src/app/coaches/lineups/
├── page.tsx.backup (< 250 lines - orchestrator only)
├── components/
│   ├── CategorySeasonSelector.tsx
│   ├── LineupsPanel/
│   │   ├── index.tsx
│   │   ├── LineupCard.tsx
│   │   └── LineupsList.tsx
│   ├── LineupMembersTable/
│   │   ├── index.tsx
│   │   ├── MemberRow.tsx
│   │   └── MembersTable.tsx
│   ├── AddMemberModal.tsx (existing)
│   ├── EditMemberModal.tsx (if needed)
│   ├── CreateMemberModal.tsx (existing)
│   ├── LineupModal.tsx (existing)
│   └── ConfirmDeleteModal.tsx (new)
└── helpers/
    └── helpers.ts (existing)
```

**Deliverable:** Clean, maintainable component structure

---

### Phase 4: Polish & Testing (Priority: 🟢 Low - 4 hours)

- [ ] **Task 4.1:** Add comprehensive error handling
  - Wrap page in error boundary
  - Add error states to all operations
  - Show user-friendly error messages

- [ ] **Task 4.2:** Add loading states
  - Disable buttons during operations
  - Show spinners on long operations
  - Prevent double-submissions

- [ ] **Task 4.3:** Add optimistic updates (optional)
  - Update UI immediately on actions
  - Revert on error
  - Better UX

- [ ] **Task 4.4:** Write tests
  - Unit tests for hooks
  - Integration tests for page
  - E2E tests for critical flows

**Deliverable:** Production-ready, tested page

---

## 🎯 IMPLEMENTATION CHECKLIST

### Immediate (Today - Must Do)
- [ ] Fix `deleteLineup(lineupId)` → `deleteLineup(selectedCategory, lineupId)`
- [ ] Add `memberToDelete` state
- [ ] Fix `handleDeleteMemberClick` and `handleConfirmDeleteMember`
- [ ] Test all CRUD operations manually
- [ ] Verify page compiles with zero errors

### This Week (High Priority)
- [ ] Remove unused state from `useCategoryLineups`
- [ ] Remove unused state from `useCategoryLineupMember`
- [ ] Add `refetch()` calls after mutations
- [ ] Extract `CategorySeasonSelector` component
- [ ] Extract `LineupsPanel` component

### Next Week (Medium Priority)
- [ ] Extract `LineupMembersTable` component
- [ ] Create `ConfirmDeleteModal` component
- [ ] Add comprehensive error handling
- [ ] Add loading states to all buttons
- [ ] Review and refactor any remaining issues

### Future (Nice to Have)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add optimistic updates
- [ ] Performance audit
- [ ] Accessibility audit

---

## 📊 Progress Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| TypeScript errors | 0 | 3 | 🔴 Must fix |
| Lines of code | <250 | 512 | 🔴 51% over |
| `any` types | 0 | 0 | ✅ Done |
| Hook architecture | Correct | ✅ Correct | ✅ Good |
| Unused state | 0 | 2 hooks | 🟡 Can improve |
| Component extraction | 100% | 0% | 🔴 Not started |
| Test coverage | >70% | 0% | 🔴 Not started |

---

## 🚀 Quick Wins (Priority Order)

1. **🔴 Fix `deleteLineup` parameter** (5 min)
   - Just add `selectedCategory` parameter
   - Immediate fix, high impact

2. **🔴 Fix delete member state** (30 min)
   - Add `memberToDelete` state
   - Fix handler functions
   - Complete the feature

3. **🟡 Remove unused hook state** (1 hour)
   - Clean up `useCategoryLineups`
   - Clean up `useCategoryLineupMember`
   - Better performance, cleaner code

4. **🟡 Extract `LineupsPanel`** (2 hours)
   - Good practice for component extraction
   - Reduces main component size significantly

5. **🟢 Extract remaining components** (4 hours)
   - Complete the component extraction
   - Hit target of <250 lines

---

## 📚 Related Documentation

- [Hook Architecture Guide](../../../../docs/refactoring/coaches/COACHES_PAGES_REFACTORING_GUIDE.md)
- [API Routes](../../../api/categories/[id]/lineups/)
- [Type Definitions](../../../../types/entities/category/)
- [README](./README.md) - Quick reference for this page

---

## 🔄 Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-06 | Analysis | Initial analysis created |
| 2025-11-06 | Analysis | Updated based on actual file state - corrected hook architecture understanding |

---

**Next Review:** After Phase 1 completion (fix critical bugs)
**Status:** 🔴 TypeScript errors - page doesn't work, needs immediate fix
