# Shared Layout Components

## Purpose

Shared components that form the coaches portal shell: sidebar, top bar, and their state management context. These wrap all coach portal pages (except login).

## Files

| File | Responsibility |
|---|---|
| `CoachesSidebar.tsx` | Thin wrapper — connects `CoachesSidebarContext` to `UnifiedSidebar` (variant="coach") |
| `CoachesSidebarContext.tsx` | Context provider for sidebar state: `isCollapsed`, `isMobileOpen`, `isMobile`. Persists collapse state in localStorage |
| `CoachesTopBar.tsx` | Dynamic page title/description based on current pathname. Maps routes to Czech translations. Shows user profile and sidebar toggle buttons |
| `index.ts` | Barrel exports |

## Data Flow

```
CoachesSidebarProvider (wraps all coach pages)
├── State: isCollapsed (persisted in localStorage)
├── State: isMobileOpen (transient)
├── State: isMobile (computed from window width, breakpoint: 1024px)
│
├── CoachesSidebar
│   └── UnifiedSidebar(variant="coach", routes=coachesRoutes)
│
└── CoachesTopBar
    ├── pathname → coachesRoutes lookup → Czech title + description
    ├── Sidebar toggle buttons
    └── User profile display (from useUser())
```

## Category Filtering

These components do **not** currently handle category filtering. The sidebar shows navigation routes; it does not display or filter by categories. Category selection is handled per-page, leading to significant code duplication and UX issues (selection resets on navigation).

## Issues & Technical Debt

### High (Architecture)

1. **No shared category context** — Each page independently implements ~40 lines of category selection boilerplate (get assigned → filter → auto-select → manage state). This is the single biggest source of code duplication in the coaches portal. Navigating between pages resets the selection.

### Low

2. **Route title lookup is string-based** — `CoachesTopBar` matches pathname against `coachesRoutes` array. If a route is renamed or restructured, the title lookup may silently fail (shows fallback "Coach Portal").

3. **Sidebar collapse state could conflict** — localStorage key `'coaches-sidebar-collapsed'` is hardcoded. If multiple coach portals or variants existed, they'd share the same state.

## Improvement Proposals

### Primary: Create `CoachCategoryContext` (new file in this directory)

This is the **highest-impact improvement** for the coaches portal. Create a new context that lives in the layout alongside `CoachesSidebarProvider`:

```typescript
// CoachCategoryContext.tsx
interface CoachCategoryContextType {
  availableCategories: Category[];   // Pre-filtered: assigned for coaches, all for admins
  selectedCategory: string;          // Persists across page navigations
  setSelectedCategory: (id: string) => void;
  selectedSeason: string;
  setSelectedSeason: (id: string) => void;
  isLoading: boolean;
  isAdmin: boolean;
}
```

**Responsibilities this context absorbs:**
- Reading `userCategories` from `UserContext`
- Filtering available categories (intersection with active categories)
- Admin simulation mode (localStorage check) — centralized, no more per-page reads
- Auto-selecting first category when only one is assigned
- Managing `selectedSeason` with active season auto-selection

**Layout integration:**
```
CoachesSidebarProvider
  └── CoachCategoryProvider (NEW)
      ├── CoachesSidebar (can display current category)
      ├── CoachesTopBar (can show category switcher dropdown/tabs)
      └── {children}
```

**Important:** This context is a UX and code-quality improvement. It does NOT replace server-side access control. See the root `CLAUDE.md` for the full layered security architecture.

**Pages after this change** — each page simplifies from:
```typescript
// BEFORE: ~40 lines of category boilerplate per page
const { userCategories, isAdmin } = useUser();
const { categories } = useAppData();
const [selectedCategory, setSelectedCategory] = useState('');
const [adminSimulationCategories, setAdminSimulationCategories] = useState([]);
// ... useEffect for simulation, useEffect for auto-select, useMemo for filtering ...
```
to:
```typescript
// AFTER: one line
const { selectedCategory, availableCategories } = useCoachCategory();
```

### Secondary: Show category in sidebar or top bar

Once the context exists, add a category switcher UI to `CoachesTopBar` or the sidebar. This gives coaches a persistent, visible indication of which category they're viewing — consistent across all pages instead of each page rendering its own tabs/dropdown.