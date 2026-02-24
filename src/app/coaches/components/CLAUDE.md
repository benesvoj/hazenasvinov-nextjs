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

These components do **not** handle category filtering. The sidebar shows navigation routes; it does not display or filter by categories. Category selection is handled per-page.

Note: Some projects implement category selection in the sidebar itself (as a global filter). This could be a future improvement — see proposal below.

## Issues & Technical Debt

### Low

1. **No category context in sidebar** — Each page independently implements category selection (tabs or dropdown). There's no global "selected category" state shared across pages. Navigating between pages resets the category selection.

2. **Route title lookup is string-based** — `CoachesTopBar` matches pathname against `coachesRoutes` array. If a route is renamed or restructured, the title lookup may silently fail (shows fallback "Coach Portal").

3. **Sidebar collapse state could conflict** — localStorage key `'coaches-sidebar-collapsed'` is hardcoded. If multiple coach portals or variants existed, they'd share the same state.

## Improvement Proposals

1. **Add a global "selected category" to the sidebar context** — Instead of each page managing its own category selection, store `selectedCategory` in `CoachesSidebarContext`. This would:
   - Persist category selection across page navigations
   - Eliminate duplicated category selection logic in every page
   - Allow the sidebar to display the current category
   - Reduce per-page complexity significantly

2. **Show assigned categories in the sidebar** — Add a category switcher (dropdown or pills) in the sidebar or top bar. This gives coaches a persistent, visible indication of which category they're viewing.

3. **Extract `useCategorySeasonFilter()` hook** — Even without a global context, the repeated pattern of "get assigned categories → filter → auto-select → track state" should be a shared hook used by all pages.