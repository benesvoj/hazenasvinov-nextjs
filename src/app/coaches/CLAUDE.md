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

### Modal State Management

All modal state in coach portal pages must use the shared hooks from `src/hooks/shared/useModals.ts`. **Do not** use raw `useState` for modal open/close/item tracking.

| Hook | When to use |
|---|---|
| `useModal()` | Simple open/close modal with no associated data (e.g., generator, confirmation) |
| `useModalWithItem<T>()` | Modal that operates on a specific item — edit, delete, status change. Provides `openWith(item)`, `openEmpty()`, `closeAndClear()`, `selectedItem`, `isEditMode` |
| `useModals('Add', 'Edit', 'Delete')` | Multiple simple modals in one component (returns typed record) |

```typescript
// Example: attendance page modals
const sessionModal = useModalWithItem<BaseTrainingSession>();  // create + edit
const deleteModal = useModalWithItem<string>();                // delete by ID
const statusDialog = useModalWithItem<BaseTrainingSession>();  // status change
const generatorModal = useModal();                             // simple open/close

// Usage:
sessionModal.openWith(session);    // edit mode
sessionModal.openEmpty();          // create mode (selectedItem = null)
sessionModal.closeAndClear();      // close + clear item
sessionModal.isEditMode;           // true if opened with openWith()
deleteModal.selectedItem;          // the item passed to openWith()
```

### Category Data Sources

| Context | What it provides |
|---|---|
| `UserContext` (`useUser()`) | `userCategories: string[]` — coach's assigned category IDs from `user_profiles.assigned_categories` |
| `AppDataContext` (`useAppData()`) | `categories.data` — all categories; `categories.activeCategories` — active subset |
| `useUserRoles().getCurrentUserCategories()` | Assigned categories with admin simulation support (checks localStorage override first) |

### Category Selection Pattern (Current — Duplicated Per-Page)

Most pages currently follow a three-step pattern **independently**:

1. **Get assigned categories** — from `useUser().userCategories` or `useUserRoles().getCurrentUserCategories()`
2. **Filter available categories** — intersect assigned with all active categories (admins see all)
3. **Auto-select** — if coach has only one category, auto-select it; otherwise show tabs/dropdown

This logic is duplicated in dashboard, attendance, matches, lineups, and videos pages (~40 lines each). Navigating between pages **resets the category selection**.

### Recommended Architecture: Layered Approach

The fix requires **two independent layers** — a client-side context for clean code/UX AND server-side enforcement for security. Neither replaces the other.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: DATABASE (RLS policies)                           │
│  Last line of defense. Enforces access even if API is       │
│  bypassed. Coaches can only read/write rows where           │
│  category_id is in their assigned_categories.               │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: API ROUTES (hasCategoryAccess middleware)          │
│  Returns 403 if coach requests unauthorized category.       │
│  Applied to all coach-facing endpoints.                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: CoachCategoryContext (NEW)                         │
│  Single source of truth for availableCategories,            │
│  selectedCategory, selectedSeason. Persists selection       │
│  across page navigations. Centralizes admin simulation.     │
│  Eliminates ~40 lines of duplicated logic per page.         │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: PAGE COMPONENTS                                   │
│  Consume context via useCoachCategory(). Only render        │
│  page-specific content. No category logic.                  │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: CoachCategoryContext (Client-Side — UX & Code Quality)

New context to be placed in the coaches layout, wrapping all protected pages:

```typescript
// src/app/coaches/components/CoachCategoryContext.tsx
interface CoachCategoryContextType {
  availableCategories: Category[];   // Pre-filtered to assigned (or all for admins)
  selectedCategory: string;          // Current selection, persists across pages
  setSelectedCategory: (id: string) => void;
  selectedSeason: string;            // Current season selection
  setSelectedSeason: (id: string) => void;
  isLoading: boolean;                // True while categories are being resolved
  isAdmin: boolean;                  // Whether user sees all categories
}
```

**What this solves:**
- Eliminates duplicated category/season selection logic in 5+ pages
- Persists category selection when navigating between pages
- Centralizes admin simulation logic (no more per-page localStorage reads)
- Pages reduce from ~40 lines of boilerplate to `const { selectedCategory } = useCoachCategory()`

**What this does NOT solve:**
- Security — a context is client-side; it cannot prevent direct API calls with unauthorized `categoryId`

### Layer 3: API Authorization (Server-Side — Security)

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

// Usage in API routes:
export const GET = withAuth(async (request, supabase, user) => {
  const categoryId = request.nextUrl.searchParams.get('categoryId');
  if (categoryId && !(await hasCategoryAccess(supabase, user.id, categoryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... proceed with query
});
```

### Layer 4: RLS Policies (Database — Last Line of Defense)

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

Apply to: `category_lineups`, `training_sessions`, `member_attendance`, `matches` (write), `coach_cards`

### Updated Layout Structure (After Implementation)

```
layout.tsx
├── Login path (/coaches/login) → renders children directly
└── Protected path (all others)
    └── ProtectedCoachRoute
        └── CoachesSidebarProvider (sidebar state)
            └── CoachCategoryProvider (NEW — category/season state)
                ├── CoachesSidebar (can show current category)
                ├── CoachesTopBar (can show category switcher)
                └── {children} (pages consume useCoachCategory())
```

## Critical Finding: Category Access Control Gaps

### Current State

Category-based access control is **enforced only on the client side** (Layer 1 only). The UI correctly hides unauthorized categories from dropdowns and tabs, but:

- **API routes accept any `categoryId` parameter** without verifying the requesting coach is assigned to that category
- **No RLS policies** exist on key tables (`category_lineups`, `training_sessions`, `member_attendance`, `coach_cards`)
- **Mutation endpoints** (match result recording, attendance recording, lineup CRUD) do not validate category ownership

A `CoachCategoryContext` alone would NOT fix these issues — it improves code quality and UX but is still client-side. **Server-side enforcement (Layers 3 + 4) is required.**

### Risk Assessment

| Threat | Severity | Vector | Fixed by Context? | Fixed by API auth? | Fixed by RLS? |
|---|---|---|---|---|---|
| Coach reads data from unassigned category | **High** | Direct API call | No | **Yes** | **Yes** |
| Coach modifies data in unassigned category | **Critical** | Direct API mutation | No | **Yes** | **Yes** |
| Coach publishes card to unassigned category | **Medium** | Direct PATCH | No | **Yes** | **Yes** |
| Category resets on page navigation | **Low** | Normal usage | **Yes** | No | No |
| Duplicated boilerplate across pages | **Low** | Code debt | **Yes** | No | No |
| Admin simulation logic scattered | **Low** | Code debt | **Yes** | No | No |

### Implementation Priority

1. **CoachCategoryContext** (Layer 2) — Immediate code quality win, enables cleaner page refactors
2. **`hasCategoryAccess` middleware** (Layer 3) — Security fix for all API routes
3. **RLS policies** (Layer 4) — Database-level defense
4. **Validate `published_categories`** server-side in coach card PATCH — ensure subset of `assigned_categories`

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

**Recommendation**: When implementing `CoachCategoryContext` (Layer 2), absorb the admin simulation logic into it. The context should check simulation mode internally, so no page ever reads localStorage directly. This becomes the single source of truth for "which categories does the current user have access to?"