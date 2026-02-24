# Coaches Section Overview

## Purpose

The `/coaches` section is the **coach portal** — a protected area where authenticated coaches manage their teams. It provides tools for attendance tracking, lineup management, match recording, member overview, video library, meeting minutes, statistics, and personal profile management.

All user-facing strings are in **Czech**. The portal is guarded by `ProtectedCoachRoute` and requires an authenticated user with a coach role.

## Section Inventory

| Route | Page | Status | Category Filtering |
|---|---|---|---|
| `/coaches/dashboard` | Dashboard overview | Active | Per-category tabs |
| `/coaches/attendance` | Training attendance | Active | Category dropdown |
| `/coaches/matches` | Match management | Active | Per-category tabs |
| `/coaches/lineups` | Lineup management | Active | Per-category tabs |
| `/coaches/members` | Member list | Active | **None** (shows all) |
| `/coaches/videos` | Video library | Active | Category dropdown |
| `/coaches/statistics` | Statistics | Placeholder | N/A |
| `/coaches/meeting-minutes` | Meeting minutes | Active | **None** |
| `/coaches/profile` | Coach card editor | Active | Category checkboxes (publishing) |
| `/coaches/login` | Login redirect | Active | N/A |

## Architecture

### Layout Structure

```
layout.tsx
├── Login path (/coaches/login) → renders children directly
└── Protected path (all others)
    └── ProtectedCoachRoute
        └── CoachesSidebarProvider (sidebar state context)
            ├── CoachesSidebar (variant="coach", wraps UnifiedSidebar)
            ├── CoachesTopBar (dynamic title from route definitions)
            └── {children} (page content)
```

### Shared Components

- **`CoachesSidebar.tsx`** — Thin wrapper connecting `CoachesSidebarContext` to `UnifiedSidebar`
- **`CoachesSidebarContext.tsx`** — Manages sidebar collapse/mobile state with localStorage persistence
- **`CoachesTopBar.tsx`** — Dynamic page title/description based on current pathname, user profile display
- **`routes/routes.ts`** — Navigation route definitions with Czech labels and Heroicon references

### Category Data Sources

| Context | What it provides |
|---|---|
| `UserContext` (`useUser()`) | `userCategories: string[]` — coach's assigned category IDs from `user_profiles.assigned_categories` |
| `AppDataContext` (`useAppData()`) | `categories.data` — all categories; `categories.activeCategories` — active subset |
| `useUserRoles().getCurrentUserCategories()` | Assigned categories with admin simulation support (checks localStorage override first) |

### Category Selection Pattern (Used Across Pages)

Most pages follow a three-step pattern:

1. **Get assigned categories** — from `useUser().userCategories` or `useUserRoles().getCurrentUserCategories()`
2. **Filter available categories** — intersect assigned with all active categories (admins see all)
3. **Auto-select** — if coach has only one category, auto-select it; otherwise show tabs/dropdown

```
Database (user_profiles.assigned_categories)
  → UserContext (userCategories)
    → Page component (availableCategories = filter)
      → UI (dropdown/tabs, limited to available)
        → Data hooks (pass selectedCategory as param)
          → API (filters by categoryId in query)
```

## Critical Finding: Category Access Control Gaps

### Current State

Category-based access control is **enforced only on the client side**. The UI correctly hides unauthorized categories from dropdowns and tabs, but:

- **API routes accept any `categoryId` parameter** without verifying the requesting coach is assigned to that category
- **No RLS policies** exist on key tables (`category_lineups`, `training_sessions`, `member_attendance`, `coach_cards`)
- **Mutation endpoints** (match result recording, attendance recording, lineup CRUD) do not validate category ownership

### Risk Assessment

| Threat | Severity | Vector |
|---|---|---|
| Coach reads data from unassigned category | **High** | Direct API call with unauthorized `categoryId` |
| Coach modifies data in unassigned category | **Critical** | Direct API call to mutation endpoint |
| Coach publishes card to unassigned category | **Medium** | Direct PATCH to `/api/coach-cards/[id]` with arbitrary `published_categories` |
| Admin simulation data in localStorage | **Low** | Only affects admin users; browser-only |

### Recommended Fixes

1. **Add category authorization middleware** — Create a reusable helper:
   ```typescript
   // src/utils/supabase/categoryAuth.ts
   export async function hasCategoryAccess(
     supabase: SupabaseClient,
     userId: string,
     categoryId: string
   ): Promise<boolean> {
     const { data } = await supabase
       .from('user_profiles')
       .select('assigned_categories')
       .eq('user_id', userId)
       .single();
     return data?.assigned_categories?.includes(categoryId) ?? false;
   }
   ```

2. **Add RLS policies** to `category_lineups`, `training_sessions`, `member_attendance`:
   ```sql
   CREATE POLICY "Coaches see assigned categories only"
     ON public.category_lineups FOR SELECT
     USING (
       category_id = ANY(
         (SELECT assigned_categories FROM user_profiles
          WHERE user_id = auth.uid())
       )
     );
   ```

3. **Validate `published_categories`** server-side in coach card PATCH endpoint — ensure it's a subset of `assigned_categories`

4. **Add category checks to all coach API routes** — especially mutation endpoints for matches, attendance, lineups

## Per-Section Documentation

Detailed analysis and improvement proposals for each section:

- [`attendance/CLAUDE.md`](./attendance/CLAUDE.md) — Attendance tracking (17 components, critical complexity)
- [`matches/CLAUDE.md`](./matches/CLAUDE.md) — Match management and strategy
- [`lineups/CLAUDE.md`](./lineups/CLAUDE.md) — Lineup management
- [`dashboard/CLAUDE.md`](./dashboard/CLAUDE.md) — Dashboard overview
- [`members/CLAUDE.md`](./members/CLAUDE.md) — Member list
- [`videos/CLAUDE.md`](./videos/CLAUDE.md) — Video library
- [`meeting-minutes/CLAUDE.md`](./meeting-minutes/CLAUDE.md) — Meeting minutes
- [`profile/CLAUDE.md`](./profile/CLAUDE.md) — Coach card editor (existing)
- [`components/CLAUDE.md`](./components/CLAUDE.md) — Shared layout components
- [`login/CLAUDE.md`](./login/CLAUDE.md) — Login redirect

## Admin Category Simulation

Admins can test the coach portal with specific category assignments via `AdminCategorySimulationContext`:

- Data stored in localStorage key `'adminCategorySimulation'` as `{ selectedCategories: string[] }`
- `getCurrentUserCategories()` checks localStorage first, then falls back to real `userCategories`
- **Issue**: This logic is duplicated in several page components instead of being centralized — some pages read localStorage directly, others use the hook

**Recommendation**: Centralize all simulation logic in `getCurrentUserCategories()` and remove per-page localStorage reads.