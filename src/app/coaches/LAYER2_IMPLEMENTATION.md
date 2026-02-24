# Layer 2: CoachCategoryContext — Implementation Plan

## Goal

Create a single `CoachCategoryContext` that replaces ~40–75 lines of duplicated category/season selection boilerplate in 5 coach portal pages. The context lives in the layout and persists state across page navigations.

## Scope

**In scope:** Client-side category/season state management only.
**Out of scope:** Server-side access control (Layers 3 + 4 — see root CLAUDE.md).

---

## 1. Current State: What Each Page Duplicates

### Pattern extracted from all 5 pages:

```typescript
// 1. State declarations (~5 lines, every page)
const [selectedCategory, setSelectedCategory] = useState<string>('');
const [selectedSeason, setSelectedSeason] = useState<string>('');    // attendance, lineups
const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);

// 2. Data sources (~5 lines, every page — varies between useAppData/useFetchCategories/useUser)
const { categories } = useAppData();           // attendance
const { data: categories } = useFetchCategories(); // dashboard, matches
const { userCategories, isAdmin } = useUser();  // attendance
const { getCurrentUserCategories } = useUserRoles(); // all others

// 3. Admin simulation (attendance page only — 15 lines)
const [adminSimulationCategories, setAdminSimulationCategories] = useState<string[]>([]);
useEffect(() => {
  if (isAdmin && typeof window !== 'undefined') {
    const simulationData = localStorage.getItem('adminCategorySimulation');
    // ... parse and set
  }
}, [isAdmin]);

// 4. Available categories computation (~10 lines, every page)
const availableCategories = useMemo(() => {
  if (adminSimulationCategories.length > 0) { /* admin sim */ }
  else if (isAdmin) { return categories; }
  else { return userCategories.map(id => categories.find(c => c.id === id)).filter(Boolean); }
}, [deps]);

// 5. Auto-selection (~5 lines, every page)
useEffect(() => {
  if (availableCategories.length > 0 && !selectedCategory) {
    setSelectedCategory(availableCategories[0].id);
  }
}, [availableCategories, selectedCategory]);

// 6. Season initialization (~5 lines, attendance + lineups)
useEffect(() => {
  if (activeSeason && !selectedSeason) {
    setSelectedSeason(activeSeason.id);
  }
}, [activeSeason, selectedSeason]);

// 7. Fetch assigned categories on mount (~5 lines, dashboard + matches + videos)
useEffect(() => {
  if (getCurrentUserCategories) {
    getCurrentUserCategories().then(setAssignedCategoryIds);
  }
}, [getCurrentUserCategories]);
```

### Variations between pages:

| Page | Category Source | Season? | Admin Sim? | Available Computation |
|---|---|---|---|---|
| Dashboard | `useUserRoles().getCurrentUserCategories()` + `useFetchCategories()` | No | Via hook | `categories.filter(c => assigned.includes(c.id))` |
| Attendance | `useUser().userCategories` + `useAppData().categories` | Yes (`useAppData().activeSeason`) | Direct localStorage read | Complex: admin sim → isAdmin → userCategories |
| Matches | `useUserRoles().getCurrentUserCategories()` + `useFetchCategories()` | Yes (`useSeasonFiltering()`) | Via hook | `categories.filter(c => assigned.includes(c.id))` |
| Lineups | `useUserRoles().getCurrentUserCategories()` | Yes (`seasons.find(s => s.is_active)`) | Via hook | Direct `userCategories` array (no filter against active) |
| Videos | `useUserRoles().getCurrentUserCategories()` + `useAppData().categories` | No | Via hook | `categories.filter(c => assigned.includes(c.id))` |

---

## 2. New Files to Create

### File: `src/app/coaches/components/CoachCategoryContext.tsx`

```typescript
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {useAppData} from '@/contexts/AppDataContext';
import {useUser} from '@/contexts/UserContext';
import type {Category, Season} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoachCategoryContextType {
  /** Categories the current coach is allowed to see (filtered by assignment, or all for admins). */
  availableCategories: Category[];

  /** Currently selected category ID. Empty string until resolved. */
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;

  /** All seasons from AppDataContext (sorted, newest first). */
  availableSeasons: Season[];

  /** Currently selected season ID. Auto-initialized to the active season. */
  selectedSeason: string;
  setSelectedSeason: (id: string) => void;

  /** The active season object (convenience). */
  activeSeason: Season | null;

  /** True while assigned categories or initial data are being resolved. */
  isLoading: boolean;

  /** Whether the current user has admin role (sees all categories). */
  isAdmin: boolean;
}

const CoachCategoryContext = createContext<CoachCategoryContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CoachCategoryProviderProps {
  children: ReactNode;
}

export function CoachCategoryProvider({children}: CoachCategoryProviderProps) {
  // ---- Data sources -------------------------------------------------------
  const {userCategories, isAdmin} = useUser();
  const {
    categories: {data: allCategories, loading: categoriesLoading},
    seasons: {data: allSeasons, loading: seasonsLoading, activeSeason},
  } = useAppData();

  // ---- Local state --------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [resolvedAssigned, setResolvedAssigned] = useState<string[]>([]);
  const [assignedResolved, setAssignedResolved] = useState(false);

  // ---- Resolve assigned categories (including admin simulation) -----------
  //
  // Admin simulation is already handled inside `getCurrentUserCategories()`
  // in both UserContext and useUserRoles. We read `userCategories` from
  // UserContext which does NOT include admin simulation, so we also check
  // localStorage here to stay consistent with the current behaviour.
  //
  // Once admin simulation logic is fully centralized in UserContext, this
  // effect can be simplified to just `setResolvedAssigned(userCategories)`.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check admin simulation mode
    if (isAdmin) {
      const simulationData = localStorage.getItem('adminCategorySimulation');
      if (simulationData) {
        try {
          const {selectedCategories} = JSON.parse(simulationData);
          if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
            setResolvedAssigned(selectedCategories);
            setAssignedResolved(true);
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // 2. Use real assigned categories from UserContext
    setResolvedAssigned(isAdmin ? [] : userCategories);
    setAssignedResolved(true);
  }, [isAdmin, userCategories]);

  // Re-check when admin simulation changes (e.g. admin opens simulation dialog)
  // Listen for storage events so we react if another tab updates simulation.
  useEffect(() => {
    if (!isAdmin || typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'adminCategorySimulation') {
        const simulationData = e.newValue;
        if (simulationData) {
          try {
            const {selectedCategories} = JSON.parse(simulationData);
            if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
              setResolvedAssigned(selectedCategories);
              return;
            }
          } catch {
            // Ignore
          }
        }
        // Simulation cleared — reset to admin (all categories)
        setResolvedAssigned([]);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isAdmin]);

  // ---- Compute available categories ---------------------------------------
  const availableCategories = useMemo<Category[]>(() => {
    if (!assignedResolved || categoriesLoading) return [];

    // Admin with no simulation override → all categories
    if (isAdmin && resolvedAssigned.length === 0) {
      return allCategories;
    }

    // Coach (or admin in simulation mode) → only assigned
    return resolvedAssigned
      .map((id) => allCategories.find((c) => c.id === id))
      .filter((c): c is Category => c != null);
  }, [assignedResolved, categoriesLoading, isAdmin, resolvedAssigned, allCategories]);

  // ---- Auto-select category -----------------------------------------------
  useEffect(() => {
    if (availableCategories.length === 0) return;

    // If current selection is still valid, keep it
    if (selectedCategory && availableCategories.some((c) => c.id === selectedCategory)) {
      return;
    }

    // Auto-select: first available (or only one)
    setSelectedCategory(availableCategories[0].id);
  }, [availableCategories, selectedCategory]);

  // ---- Season: sorted list ------------------------------------------------
  const availableSeasons = useMemo(() => {
    return [...allSeasons].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  }, [allSeasons]);

  // ---- Auto-select season -------------------------------------------------
  useEffect(() => {
    if (selectedSeason) return;
    if (activeSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // ---- Loading state ------------------------------------------------------
  const isLoading = categoriesLoading || seasonsLoading || !assignedResolved;

  // ---- Stable setters (no unnecessary re-renders) -------------------------
  const stableSetCategory = useCallback((id: string) => {
    setSelectedCategory(id);
  }, []);

  const stableSetSeason = useCallback((id: string) => {
    setSelectedSeason(id);
  }, []);

  // ---- Context value ------------------------------------------------------
  const value = useMemo<CoachCategoryContextType>(
    () => ({
      availableCategories,
      selectedCategory,
      setSelectedCategory: stableSetCategory,
      availableSeasons,
      selectedSeason,
      setSelectedSeason: stableSetSeason,
      activeSeason,
      isLoading,
      isAdmin,
    }),
    [
      availableCategories,
      selectedCategory,
      stableSetCategory,
      availableSeasons,
      selectedSeason,
      stableSetSeason,
      activeSeason,
      isLoading,
      isAdmin,
    ],
  );

  return (
    <CoachCategoryContext.Provider value={value}>
      {children}
    </CoachCategoryContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCoachCategory(): CoachCategoryContextType {
  const ctx = useContext(CoachCategoryContext);
  if (!ctx) {
    throw new Error('useCoachCategory must be used within CoachCategoryProvider');
  }
  return ctx;
}
```

---

## 3. Layout Integration

### File to modify: `src/app/coaches/layout.tsx`

Add `CoachCategoryProvider` inside `CoachesSidebarProvider`, wrapping the content:

```diff
+ import {CoachCategoryProvider} from './components/CoachCategoryContext';

  // Inside CoachesLayoutContent, wrap the children:
  <CoachesSidebarProvider>
+   <CoachCategoryProvider>
      <CoachesSidebar />
      <div>
        <CoachesTopBar />
        <main>{children}</main>
      </div>
+   </CoachCategoryProvider>
  </CoachesSidebarProvider>
```

### File to modify: `src/app/coaches/components/index.ts`

Add barrel export:

```diff
+ export {CoachCategoryProvider, useCoachCategory} from './CoachCategoryContext';
```

---

## 4. Per-Page Migration Guide

### General pattern — what to REMOVE from each page:

```typescript
// DELETE all of these:
const [selectedCategory, setSelectedCategory] = useState<string>('');
const [selectedSeason, setSelectedSeason] = useState<string>('');
const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
const [adminSimulationCategories, setAdminSimulationCategories] = useState<string[]>([]);

const { data: categories } = useFetchCategories();   // if only used for filtering
const { getCurrentUserCategories } = useUserRoles();  // if only used for assignment
const { userCategories, isAdmin } = useUser();         // if only used for filtering

// DELETE all the useEffects that:
// - fetch assigned categories
// - read adminCategorySimulation from localStorage
// - compute availableCategories
// - auto-select first category
// - initialize selectedSeason from activeSeason

// DELETE the useMemo for availableCategories and effectiveSelectedCategory
```

### General pattern — what to ADD:

```typescript
import {useCoachCategory} from '../components/CoachCategoryContext';

// Single line replaces everything:
const {
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  selectedSeason,
  setSelectedSeason,
  activeSeason,
  isLoading,
  isAdmin,
} = useCoachCategory();
```

---

### 4.1 Dashboard (`/coaches/dashboard/page.tsx`)

**Remove (~40 lines):**
- `useState` for `selectedCategory`, `assignedCategoryIds`
- `useFetchCategories()` (only used for filtering)
- `useUserRoles().getCurrentUserCategories`
- `useMemo` for `availableCategories`
- 3 `useEffect` hooks (fetch categories, fetch assigned, auto-select)

**Replace with:**
```typescript
const {availableCategories, selectedCategory, setSelectedCategory, isLoading} = useCoachCategory();
```

**Keep:**
- Result flow modal state (`resultFlowMatch`, `isResultFlowOpen`)
- All dashboard card rendering
- Category tabs rendering (but reads from `availableCategories` + `setSelectedCategory`)

**Tab rendering after migration:**
```typescript
// Before: renders own tabs with own state
// After: same tabs, but reads/writes context
{availableCategories.length > 1 && (
  <Tabs
    selectedKey={selectedCategory}
    onSelectionChange={(key) => setSelectedCategory(key as string)}
  >
    {availableCategories.map((cat) => (
      <Tab key={cat.id} title={cat.name} />
    ))}
  </Tabs>
)}
```

---

### 4.2 Attendance (`/coaches/attendance/page.tsx`)

**Remove (~75 lines — largest reduction):**
- `useState` for `selectedCategory`, `selectedSeason`, `adminSimulationCategories`
- `useUser()` — only if used solely for `userCategories` and `isAdmin` (check other usages)
- Entire `useEffect` for admin simulation localStorage read (lines ~101-120)
- `useMemo` for `availableCategories` (lines ~128-143)
- `useMemo` for `effectiveSelectedCategory` (lines ~146-153)
- `useEffect` for `effectiveSelectedCategory` sync (lines ~155-160)
- `useEffect` for season initialization (lines ~176-182)

**Replace with:**
```typescript
const {
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  selectedSeason,
  setSelectedSeason,
  isLoading,
  isAdmin,
} = useCoachCategory();
```

**Keep:**
- `useAppData()` for `members` (used in attendance recording, not just filtering)
- All training session state and modals
- Attendance recording logic
- Tab switching (attendance vs statistics)
- The Select dropdown for category (but bind to context state)

**Category dropdown after migration:**
```typescript
<Select
  label="Kategorie"
  selectedKeys={selectedCategory ? [selectedCategory] : []}
  onSelectionChange={(keys) => {
    const key = Array.from(keys)[0] as string;
    if (key) setSelectedCategory(key);
  }}
  isDisabled={availableCategories.length <= 1}
>
  {availableCategories.map((cat) => (
    <SelectItem key={cat.id}>{cat.name}</SelectItem>
  ))}
</Select>
```

---

### 4.3 Matches (`/coaches/matches/page.tsx`)

**Remove (~40 lines):**
- `useState` for `selectedCategory`, `assignedCategoryIds`
- `useFetchCategories()` (only used for filtering)
- `useFetchSeasons()` + `useSeasonFiltering()` (season now from context)
- The try-catch around `useUserRoles()` (context handles this in layout)
- `availableCategories` filter computation
- 3 `useEffect` hooks (fetch categories/seasons, fetch assigned, auto-select)

**Replace with:**
```typescript
const {
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  activeSeason,
  isLoading,
} = useCoachCategory();

const selectedCategoryData = availableCategories.find((c) => c.id === selectedCategory);
```

**Keep:**
- `useOptimizedOwnClubMatches(selectedCategoryData?.id, activeSeason?.id)`
- `useStandings()` usage
- Match selection state, result flow modal, tab management
- All child component rendering

---

### 4.4 Lineups (`/coaches/lineups/page.tsx`)

**Remove (~50 lines):**
- `useState` for `selectedCategory`, `selectedSeason`, `userCategories`
- `useUserRoles().getCurrentUserCategories`
- `useEffect` for fetching user categories and auto-selecting
- `useEffect` for season initialization from `activeSeason`

**Replace with:**
```typescript
const {
  availableCategories,
  selectedCategory,
  setSelectedCategory,
  selectedSeason,
  setSelectedSeason,
  isLoading,
} = useCoachCategory();
```

**Keep:**
- `useState` for `selectedLineup`
- `useFetchCategoryLineups({categoryId: selectedCategory, seasonId: selectedSeason})`
- All lineup CRUD state and modals
- Member management

**Tab rendering after migration:**
```typescript
// Before: maps over `userCategories` (raw IDs), looks up names
// After: maps over `availableCategories` (full Category objects)
{availableCategories.length > 1 && (
  <Tabs
    selectedKey={selectedCategory}
    onSelectionChange={(key) => setSelectedCategory(key as string)}
  >
    {availableCategories.map((cat) => (
      <Tab key={cat.id} title={cat.name} />
    ))}
  </Tabs>
)}
```

---

### 4.5 Videos (`/coaches/videos/page.tsx`)

**Remove (~30 lines):**
- `useState` for `assignedCategories`
- `useUserRoles().getCurrentUserCategories`
- `fetchAssignedCategories` callback and its `useEffect`
- `availableCategories` filter computation

**Replace with:**
```typescript
const {availableCategories, selectedCategory, isLoading} = useCoachCategory();

// For the "no assigned categories" warning:
const hasAssignedCategories = availableCategories.length > 0;
```

**Keep:**
- `useFetchVideos()` (still fetches all — server-side filtering is Layer 3)
- `useVideoFiltering()` (client-side filter)
- All video CRUD modals, form state, pagination
- Category dropdown in filter bar (binds to `availableCategories`)

---

### 4.6 Members (`/coaches/members/page.tsx`)

**Currently:** No category filtering at all.

**After context adoption:**
```typescript
const {selectedCategory, availableCategories} = useCoachCategory();

// Option A: filter to selected category
const {data: membersInternalData} = useFetchMembersInternal({
  categoryId: selectedCategory,
});

// Option B: filter to all assigned categories
// (requires API change to accept multiple category IDs)
```

This page becomes the first to gain category filtering through context adoption.

---

### 4.7 Meeting Minutes (`/coaches/meeting-minutes/page.tsx`)

**Currently:** No category filtering. Uses shared `MeetingMinutesContainer` component.

**After context adoption (optional, depends on design decision):**
```typescript
const {selectedCategory} = useCoachCategory();
// Pass to MeetingMinutesContainer if category-scoped minutes are desired
```

---

### 4.8 Profile (`/coaches/profile/components/CoachCardEditor.tsx`)

**Currently:** Reads `userProfile?.assigned_categories` directly for the publishing checkboxes.

**After context adoption:**
```typescript
const {availableCategories} = useCoachCategory();
// Use availableCategories for the publishing checkbox group
// instead of manually filtering allCategories by assignedCategoryIds
```

---

## 5. Category Switcher UI (Optional Enhancement)

Once the context exists, a global category switcher can be added to `CoachesTopBar`:

```typescript
// In CoachesTopBar.tsx:
const {availableCategories, selectedCategory, setSelectedCategory} = useCoachCategory();

// Render in top bar (only if multiple categories):
{availableCategories.length > 1 && (
  <Tabs
    size="sm"
    variant="light"
    selectedKey={selectedCategory}
    onSelectionChange={(key) => setSelectedCategory(key as string)}
  >
    {availableCategories.map((cat) => (
      <Tab key={cat.id} title={cat.name} />
    ))}
  </Tabs>
)}
```

**Impact:** Pages no longer need to render their own category tabs/dropdowns. The selection is always visible and persists across navigations.

**Note:** Some pages (e.g., attendance) use a dropdown instead of tabs. If the top bar has tabs, these page-level dropdowns can be removed. If some pages need different UI (e.g., members showing "all assigned" instead of one category), they can override locally.

---

## 6. Testing Checklist

After implementation, verify:

- [ ] Dashboard loads with correct category pre-selected
- [ ] Navigating from Dashboard to Attendance preserves category selection
- [ ] Navigating from Attendance to Lineups preserves category selection
- [ ] Coach with 1 category: auto-selected, no tabs/dropdown shown
- [ ] Coach with 2+ categories: tabs visible, switching works
- [ ] Admin without simulation: sees all categories
- [ ] Admin with simulation: sees only simulated categories
- [ ] Admin simulation change (via dialog) updates the context reactively
- [ ] Season auto-selects to active season on first load
- [ ] Season persists across page navigations
- [ ] Changing season on attendance page reflects when navigating to lineups
- [ ] `isLoading` is true until categories and seasons resolve, preventing flash of empty content
- [ ] All existing page functionality works unchanged (attendance recording, match results, lineup CRUD, etc.)
- [ ] Pages that don't use season (dashboard, videos) are unaffected by season state

---

## 7. Migration Order

Recommended order (lowest risk first):

1. **Create `CoachCategoryContext.tsx`** and add provider to `layout.tsx`
2. **Migrate Dashboard** — simplest page, no season, no admin simulation
3. **Migrate Videos** — simple, no season
4. **Migrate Matches** — has season via `useSeasonFiltering`, removes try-catch hack
5. **Migrate Lineups** — has season, reconciles the "direct array" pattern
6. **Migrate Attendance** — most complex, has direct localStorage reads, most boilerplate to remove
7. **Add category filtering to Members** — first page to gain new functionality
8. **(Optional) Move tabs to CoachesTopBar** — global switcher UI

Each step is independently shippable and testable.

---

## 8. Edge Cases to Handle

### Coach with 0 assigned categories
- `availableCategories` = `[]`
- `selectedCategory` = `''`
- Pages should show a warning message (attendance and videos already do this)

### Admin simulation cleared mid-session
- Context listens for `storage` events
- Falls back to admin mode (all categories)
- `selectedCategory` may become invalid if it was a simulated category → auto-select logic re-runs

### Category removed from coach while session is active
- `userCategories` updates via UserContext refetch
- Context re-computes `availableCategories`
- If `selectedCategory` is no longer valid, auto-selects first available

### SSR / hydration
- Context uses `'use client'` directive
- localStorage reads are guarded by `typeof window !== 'undefined'`
- Initial render has `isLoading: true` until client-side resolution completes