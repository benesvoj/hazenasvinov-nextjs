# Coaches Pages Refactoring Guide

**Date:** 2025-11-05
**Scope:** `src/app/coaches/lineups/page.tsx` & `src/app/coaches/attendance/page.tsx`
**Goal:** Align with codebase standards and improve maintainability

---

## 📊 Analysis Summary

### Current State

| Issue | lineups/page.tsx | attendance/page.tsx | Severity |
|-------|------------------|---------------------|----------|
| Lines of code | 558 | 787 | 🔴 High |
| Direct DB calls in component | ✅ None | ✅ None (but has inline Supabase) | 🟡 Medium |
| Mixed layer concerns | ✅ Yes | ⚠️ Partial | 🔴 High |
| useEffect issues | ✅ Yes | ✅ Yes | 🔴 High |
| Any types used | ✅ Yes | ✅ Yes | 🟡 Medium |
| Component extraction | ❌ None | ⚠️ Some | 🔴 High |
| Error boundaries | ❌ None | ❌ None | 🟡 Medium |
| Duplicate logic | ✅ Yes | ✅ Yes | 🟡 Medium |

---

## 🔴 Critical Issues

### 1. **lineups/page.tsx: Mixed Hook Architecture**

**Location:** Lines 42, 60, 63-74

**Problem:**
```typescript
// ❌ Using both old business layer and new data layer hooks
const {data: categories, refetch: fetchCategories} = useFetchCategories(); // ✅ Data layer
const {lineupMembers, createLineup, updateLineup, ...} = useCategoryLineups(); // ❌ Business layer
const {data: lineups, refetch} = useFetchCategoryLineups(selectedCategory, selectedSeason); // ✅ Data layer
```

**Impact:** Inconsistent patterns, confusion about data sources, potential duplicate API calls

**References:**
- useCategoryLineups: `src/hooks/entities/category/business/useCategoryLineups.ts`
- useFetchCategoryLineups: `src/hooks/entities/category/data/useFetchCategoryLineups.ts`

---

### 2. **attendance/page.tsx: Inline Supabase Calls**

**Location:** Lines 238-274 in `handleSessionSubmit`

**Problem:**
```typescript
// ❌ Direct Supabase calls inside component event handler
const {createClient} = await import('@/utils/supabase/client');
const supabase = createClient();
const {data: lineupData, error: lineupError} = await supabase
  .from('category_lineups')
  .select('id')
  // ... more Supabase calls
```

**Impact:** Violates layer separation, hard to test, duplicates logic

---

### 3. **lineups/page.tsx: useEffect Dependency Issues**

**Location:** Lines 92-106

**Problem:**
```typescript
// ❌ Problematic dependencies causing re-renders
useEffect(() => {
  const fetchUserCategories = async () => {
    const categories = await getCurrentUserCategories();
    setUserCategories(categories);
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  };
  fetchUserCategories();
}, [getCurrentUserCategories, selectedCategory]); // 🔴 getCurrentUserCategories changes on every render
```

**Impact:** Infinite render loops, excessive API calls

**Fix:**
```typescript
// ✅ Run only once on mount
useEffect(() => {
  const fetchUserCategories = async () => {
    const categories = await getCurrentUserCategories();
    setUserCategories(categories);
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  };
  fetchUserCategories();
}, []); // Run once
```

---

### 4. **Both Pages: Large Monolithic Components**

**lineups/page.tsx:** 558 lines
**attendance/page.tsx:** 787 lines

**Impact:** Hard to understand, test, and maintain

---

## 🎯 Refactoring Goals

1. ✅ **Single Responsibility:** Each component/hook does one thing
2. ✅ **Layer Separation:** Data → Business → State → UI
3. ✅ **Reusability:** Extract common patterns
4. ✅ **Testability:** Pure functions, mockable dependencies
5. ✅ **Performance:** Reduce unnecessary renders
6. ✅ **Type Safety:** Remove `any` types

---

## 📋 Refactoring Roadmap

### Phase 1: Hook Standardization (Priority: 🔴 High)

#### 1.1 Fix `useFetchCategoryLineups` Hook

**File:** `src/hooks/entities/category/data/useFetchCategoryLineups.ts`

**Current Issue:**
```typescript
useEffect(() => {
  if (categoryId && seasonId) {
    fetchData();
  }
}, [categoryId, seasonId]); // ❌ Missing fetchData dependency
```

**Fix:**
```typescript
const fetchData = useCallback(async () => {
  if (!categoryId || !seasonId) return;
  // ... fetch logic
}, [categoryId, seasonId]);

useEffect(() => {
  void fetchData();
}, [fetchData]);
```

**Status:** ✅ Already fixed in `useFetchCategoryLineupMembers.ts`

---

#### 1.2 Create Unified Lineup Management Hook

**New File:** `src/hooks/entities/category/business/useLineupManagement.ts`

**Purpose:** Combine data fetching + business logic in one place

**API:**
```typescript
export function useLineupManagement(categoryId: string, seasonId: string) {
  // Data layer
  const {data: lineups, loading: lineupsLoading} = useFetchCategoryLineups(categoryId, seasonId);
  const [selectedLineup, setSelectedLineup] = useState<string>('');
  const {data: members, loading: membersLoading} = useFetchCategoryLineupMembers(
    selectedLineup,
    categoryId
  );

  // Business logic
  const createLineup = useCallback(async (data: CategoryLineupFormData) => {
    // Use API route
    const res = await fetch(API_ROUTES.categories.lineups(categoryId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // ... error handling
    // ... refetch data
  }, [categoryId]);

  return {
    // State
    lineups,
    selectedLineup,
    setSelectedLineup,
    members,
    // Loading states
    loading: lineupsLoading || membersLoading,
    // Actions
    createLineup,
    updateLineup,
    deleteLineup,
    addMember,
    removeMember,
  };
}
```

**Migration:**
- lineups/page.tsx: Replace `useCategoryLineups` + `useFetchCategoryLineups` with `useLineupManagement`

---

### Phase 2: Extract Common Logic (Priority: 🔴 High)

#### 2.1 Category Selection Hook

**New File:** `src/hooks/shared/useCategorySelection.ts`

**Purpose:** Reusable category selection logic (used in both pages)

**API:**
```typescript
interface UseCategorySelectionOptions {
  categories: Category[];
  userCategories: string[];
  isAdmin: boolean;
  autoSelectSingle?: boolean;
}

export function useCategorySelection(options: UseCategorySelectionOptions) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Get available categories based on user role
  const availableCategories = useMemo(() => {
    // Check admin simulation
    if (typeof window !== 'undefined') {
      const simulationData = localStorage.getItem('adminCategorySimulation');
      if (simulationData) {
        try {
          const {selectedCategories} = JSON.parse(simulationData);
          if (selectedCategories?.length > 0) {
            return selectedCategories
              .map((id: string) => options.categories.find((c) => c.id === id))
              .filter(Boolean);
          }
        } catch {}
      }
    }

    // Admin sees all, coaches see assigned
    if (options.isAdmin) {
      return options.categories;
    }

    return options.userCategories
      .map((id) => options.categories.find((c) => c.id === id))
      .filter(Boolean);
  }, [options.categories, options.userCategories, options.isAdmin]);

  // Auto-select if only one available
  useEffect(() => {
    if (options.autoSelectSingle && availableCategories.length === 1 && !selectedCategory) {
      setSelectedCategory(availableCategories[0]?.id || '');
    }
  }, [availableCategories, options.autoSelectSingle, selectedCategory]);

  return {
    selectedCategory,
    setSelectedCategory,
    availableCategories,
  };
}
```

**Migration:**
- lineups/page.tsx: Lines 85-106 → Use `useCategorySelection`
- attendance/page.tsx: Lines 88-155 → Use `useCategorySelection`

---

#### 2.2 Member Filtering Hook

**New File:** `src/hooks/entities/member/business/useMemberFiltering.ts`

**Purpose:** Filter members by category and lineup

**API:**
```typescript
export function useMemberFiltering(
  categoryId: string,
  lineupMembers: CategoryLineupMember[],
  allMembers: Member[]
) {
  return useMemo(() => {
    // Get members from lineup first
    const fromLineup = lineupMembers
      .map((lm) => lm.member)
      .filter(Boolean);

    // Fallback to category members
    if (fromLineup.length === 0) {
      return allMembers
        .filter((m) => m.category_id === categoryId)
        .sort((a, b) => {
          const surnameComp = (a.surname || '').localeCompare(b.surname || '');
          return surnameComp !== 0 ? surnameComp : (a.name || '').localeCompare(b.name || '');
        });
    }

    // Sort lineup members
    return fromLineup.sort((a, b) => {
      if (!a || !b) return 0;
      const surnameComp = (a.surname || '').localeCompare(b.surname || '');
      return surnameComp !== 0 ? surnameComp : (a.name || '').localeCompare(b.name || '');
    });
  }, [categoryId, lineupMembers, allMembers]);
}
```

**Migration:**
- lineups/page.tsx: Lines 246-250 → Use `useMemberFiltering`
- attendance/page.tsx: Lines 187-214 → Use `useMemberFiltering`

---

### Phase 3: Component Extraction (Priority: 🟡 Medium)

#### 3.1 lineups/page.tsx Component Structure

```
CoachesLineupsPage (Orchestrator)
├── CategorySeasonSelector (lines 263-281)
├── LineupsPanel (lines 286-364)
│   ├── LineupsList
│   └── LineupCard
├── LineupMembersPanel (lines 368-504)
│   ├── MembersList
│   └── MemberCard
├── LineupFormModal (lines 507-544)
└── AddMemberModal (existing)
```

**New Files:**
```
src/app/coaches/lineups/components/
  ├── CategorySeasonSelector.tsx
  ├── LineupsPanel/
  │   ├── index.tsx
  │   ├── LineupsList.tsx
  │   └── LineupCard.tsx
  ├── LineupMembersPanel/
  │   ├── index.tsx
  │   ├── MembersList.tsx
  │   └── MemberCard.tsx
  └── LineupFormModal.tsx
```

---

#### 3.2 attendance/page.tsx Component Structure

```
CoachesAttendancePage (Orchestrator)
├── AttendanceFilters (lines 447-509)
├── AttendanceStatistics (existing, lines 512-524)
├── TrainingSessionsPanel (lines 530-622)
│   ├── SessionsList
│   └── SessionCard
├── AttendanceRecordsPanel (lines 625-729)
│   ├── AttendanceTable
│   └── AttendanceRow
├── TrainingSessionModal (existing)
├── TrainingSessionGenerator (existing)
└── Modals (existing)
```

**New Files:**
```
src/app/coaches/attendance/components/
  ├── AttendanceFilters.tsx
  ├── TrainingSessionsPanel/
  │   ├── index.tsx
  │   ├── SessionsList.tsx
  │   └── SessionCard.tsx
  └── AttendanceRecordsPanel/
      ├── index.tsx
      ├── AttendanceTable.tsx
      └── AttendanceRow.tsx
```

---

### Phase 4: Type Safety Improvements (Priority: 🟡 Medium)

#### 4.1 Remove `any` Types

**lineups/page.tsx:**
- Line 52: `editingLineup: any` → `editingLineup: CategoryLineup | null`
- Line 169: `handleEditLineup = (lineup: any)` → `handleEditLineup = (lineup: CategoryLineup)`
- Line 216: `handleEditMember = (member: any)` → `handleEditMember = (member: CategoryLineupMember)`
- Line 274: `{userCategories.map((categoryId) => { const category = categories.find(...` → Create proper type

**attendance/page.tsx:**
- Line 45: `editingSession: any` → `editingSession: TrainingSession | null`
- Line 47: `sessionForStatusUpdate: any` → `sessionForStatusUpdate: TrainingSession | null`
- Line 269: `(item: any)` → Use proper type
- Line 309: `handleEditSession = (session: any)` → `handleEditSession = (session: TrainingSession)`
- Line 347: `handleOpenStatusDialog = (session: any)` → `handleOpenStatusDialog = (session: TrainingSession)`
- Line 460: `{availableCategories.map((category: any)` → Remove `: any`

---

#### 4.2 Create Missing Types

**New File:** `src/types/entities/category/business/lineup.ts`

```typescript
// Business layer types (extended from data layer)

export interface CategoryLineupWithMembers extends CategoryLineup {
  members: CategoryLineupMember[];
  memberCount: number;
}

export interface CategoryLineupMemberWithDetails extends CategoryLineupMember {
  member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
    category_id: string;
  };
}

export interface LineupFormState {
  mode: 'create' | 'edit';
  lineup: CategoryLineup | null;
  isOpen: boolean;
}
```

---

### Phase 5: Error Handling (Priority: 🟡 Medium)

#### 5.1 Add Error Boundaries

**New File:** `src/components/shared/ErrorBoundary.tsx`

```typescript
'use client';

import React, {Component, ReactNode} from 'react';
import {Button, Card, CardBody} from '@heroui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({hasError: false, error: null});
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="m-6">
          <CardBody>
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                Něco se pokazilo
              </h2>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'Neznámá chyba'}
              </p>
              <Button color="primary" onPress={this.handleReset}>
                Zkusit znovu
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
// Wrap both pages
export default function CoachesLineupsPage() {
  return (
    <ErrorBoundary>
      {/* ... existing content ... */}
    </ErrorBoundary>
  );
}
```

---

#### 5.2 Improve Error States

**Pattern:**
```typescript
// ❌ Current: Silent failures
try {
  await createLineup(lineupData);
  setIsLineupModalOpen(false);
} catch (err) {
  console.error('Error creating lineup:', err);
}

// ✅ Better: User feedback
try {
  await createLineup(lineupData);
  showToast.success('Soupiska byla vytvořena');
  setIsLineupModalOpen(false);
} catch (err) {
  showToast.danger(err instanceof Error ? err.message : 'Chyba při vytváření soupisky');
}
```

---

### Phase 6: Performance Optimization (Priority: 🟢 Low)

#### 6.1 Memoize Expensive Computations

**Pattern:**
```typescript
// ✅ Already good in attendance/page.tsx (lines 112-127, 186-214)
const availableCategories = useMemo(() => {
  // ... computation
}, [dependencies]);

const filteredMembers = useMemo(() => {
  // ... computation
}, [dependencies]);
```

---

#### 6.2 Lazy Load Modals

```typescript
// ❌ Current: All modals loaded upfront
import AddMemberModal from './components/AddMemberModal';
import {CreateMemberModal} from './components';

// ✅ Better: Load on demand
const AddMemberModal = lazy(() => import('./components/AddMemberModal'));
const CreateMemberModal = lazy(() => import('./components/CreateMemberModal'));

// Usage with Suspense
<Suspense fallback={<Spinner />}>
  <AddMemberModal {...props} />
</Suspense>
```

---

## 📝 Implementation Checklist

### Week 1: Critical Fixes
- [ ] Fix useEffect dependencies in lineups/page.tsx (lines 92-106)
- [ ] Fix useFetchCategoryLineups hook dependencies
- [ ] Create useLineupManagement hook
- [ ] Migrate lineups/page.tsx to use new hook

### Week 2: Extract Common Logic
- [ ] Create useCategorySelection hook
- [ ] Create useMemberFiltering hook
- [ ] Migrate both pages to use new hooks
- [ ] Remove duplicate code

### Week 3: Component Extraction (lineups)
- [ ] Extract CategorySeasonSelector
- [ ] Extract LineupsPanel + children
- [ ] Extract LineupMembersPanel + children
- [ ] Extract LineupFormModal

### Week 4: Component Extraction (attendance)
- [ ] Extract AttendanceFilters
- [ ] Extract TrainingSessionsPanel + children
- [ ] Extract AttendanceRecordsPanel + children

### Week 5: Type Safety & Error Handling
- [ ] Replace all `any` types
- [ ] Create missing TypeScript interfaces
- [ ] Add ErrorBoundary components
- [ ] Improve error feedback with toasts

### Week 6: Testing & Documentation
- [ ] Write unit tests for new hooks
- [ ] Write integration tests for pages
- [ ] Update documentation
- [ ] Performance audit

---

## 🎨 Code Standards Checklist

Use this checklist when creating new components/hooks:

### Hooks
- [ ] Named `use[Entity][Action]` (e.g., `useLineupManagement`)
- [ ] Placed in correct layer: `data/`, `business/`, or `state/`
- [ ] All callbacks wrapped in `useCallback`
- [ ] All computed values wrapped in `useMemo`
- [ ] useEffect dependencies are correct (no ESLint warnings)
- [ ] Returns consistent API shape
- [ ] Has TypeScript types for all parameters and return values
- [ ] No `any` types
- [ ] Handles loading and error states

### Components
- [ ] Named `[Entity][Feature]Component` (e.g., `LineupCard`)
- [ ] Single responsibility (< 200 lines)
- [ ] Props interface defined
- [ ] No direct data fetching (use hooks)
- [ ] No business logic (use hooks)
- [ ] Proper TypeScript types
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Responsive design

### Files
- [ ] Correct location in folder structure
- [ ] Exports at top of file
- [ ] Imports organized (React → External → Internal → Types)
- [ ] No unused imports
- [ ] README.md in complex directories

---

## 🔗 Related Documentation

- [Hook Layers Architecture](../buildingAppDocs/HOOKS_ARCHITECTURE.md)
- [Type System Guide](../refactoring/MEMBER_TYPE_SYSTEM_CLEANUP_PLAN.md)
- [API Routes Generator](../old%20docs/API_ROUTES_GENERATOR.md)
- [Error Handling Patterns](../buildingAppDocs/ERROR_HANDLING.md)

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| lineups/page.tsx lines | 558 | < 250 |
| attendance/page.tsx lines | 787 | < 300 |
| `any` types | 12 | 0 |
| Direct DB calls | 0 | 0 |
| useEffect issues | 3 | 0 |
| Component reusability | Low | High |
| Test coverage | 0% | > 70% |

---

## ⚠️ Migration Risks

1. **Breaking Changes:** Refactoring hooks may break other consumers
   - **Mitigation:** Search for all usages before changing

2. **Data Fetching Changes:** New hook architecture may cause different fetch patterns
   - **Mitigation:** Add integration tests to verify behavior

3. **User Experience:** Changes may introduce bugs
   - **Mitigation:** Thorough testing on staging environment

---

**Last Updated:** 2025-11-05
**Next Review:** After Phase 1 completion