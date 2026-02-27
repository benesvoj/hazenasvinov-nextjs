# AdminContainer vs PageContainer — Merge Analysis

## Current State

### AdminContainer (`src/components/features/admin/AdminContainer.tsx`)

Feature-rich container used by **18 admin pages**.

| Feature | Implementation |
|---|---|
| Tab support | HeroUI `<Tabs>` with per-tab actions and filters |
| Action bar | `AdminActions` — responsive, desktop buttons + mobile dropdown |
| Filter bar | `AdminFilters` — `UnifiedCard` wrapper |
| Page header | `AdminHeader` — title, description, icon |
| Loading state | `<LoadingSpinner />` replacing full content |
| Error state | ✗ Not supported |
| Under-construction state | ✗ Not supported |

Sub-components: `AdminActions`, `AdminFilters`, `AdminHeader`, `AdminContent`

### PageContainer (`src/components/ui/containers/PageContainer.tsx`)

Thin wrapper used by **8+ coach portal pages**.

| Feature | Implementation |
|---|---|
| Tab support | ✗ Not supported |
| Action bar | ✗ Not supported |
| Filter bar | ✗ Not supported |
| Page header | ✗ Not supported |
| Loading state | `<LoadingSpinner />` replacing children |
| Error state | ✓ `<Alert color="danger">` |
| Under-construction state | ✓ `<Alert color="warning">` |

---

## Overlap

The **only overlap** is the loading spinner. Both components show `<LoadingSpinner />` when a loading flag is true. Everything else is either exclusive to AdminContainer (tabs, actions, filters, header) or exclusive to PageContainer (error, under-construction).

---

## Visual Differences

| | AdminContainer | PageContainer |
|---|---|---|
| Root div spacing | `space-y-4` | `space-y-2 sm:space-y-6` |
| Top margin | ✗ None | `mt-4 sm:mt-20` |
| Width | `w-full` | `w-full` |

**The `mt-4 sm:mt-20` in PageContainer is a layout concern**, not a container concern — it compensates for coach portal layout not providing page-level top spacing. Ideally this belongs in the coach portal layout wrapper, not in the container.

---

## How Coach Portal Pages Use PageContainer Today

| Page | `isLoading` | `isError` | `isUnderConstruction` | Manual Tabs Inside |
|---|---|---|---|---|
| `dashboard/page.tsx` | ✓ Yes | ✗ No | ✗ No | ✓ Category tabs (conditional) |
| `matches/page.tsx` | ✓ Yes | ✗ No | ✗ No | ✓ 4 content tabs |
| `attendance/page.tsx` | ✓ Internal | ✗ No | ✗ No | ✓ 3 content tabs |
| `lineups/page.tsx` | ✗ No | ✗ No | ✗ No | ✓ Category tabs |
| `members/page.tsx` | ✗ No | ✗ No | ✗ No | ✗ No |
| `videos/page.tsx` | ✗ No | ✗ No | ✗ No | ✗ No |

Key observations:
- No coach page currently passes `isError` or `isUnderConstruction`
- 4 coach pages manage their own `<Tabs>` inside PageContainer — they get no help from AdminContainer's tab system
- The coach pages with tabs (attendance, matches, lineups) also need per-tab actions but currently wire them manually inside tab content

---

## Verdict: Do Not Merge — Extend Instead

A full merge into one component is not recommended. The APIs serve different purposes and combining them would produce a bloated component with many optional props that are never used together.

**The right approach is Option B: extend AdminContainer to cover coach portal needs.**

### What to add to AdminContainer

1. **`isError?: boolean`** — show `<Alert color="danger">` below content when true (matches PageContainer behaviour)
2. **`isUnderConstruction?: boolean`** — show `<Alert color="warning">` above content when true

These two additions let AdminContainer fully replace PageContainer. PageContainer can then be deleted.

### What to move out of PageContainer

The `mt-4 sm:mt-20` top margin belongs in the **coach portal layout** (`src/app/coaches/layout.tsx` or the `ProtectedCoachRoute` wrapper), not in a container component. Move it there and remove it from PageContainer as part of this change.

### Migration

1. Add `isError` and `isUnderConstruction` props to `AdminContainerProps`
2. Add the two alert renders to `AdminContainer.tsx`
3. Move `mt-4 sm:mt-20` from `PageContainer` into the coach portal layout
4. Replace all `<PageContainer>` usages with `<AdminContainer>`, mapping props
5. Delete `PageContainer.tsx` and its barrel export

### Opportunity: coach pages that manage tabs manually

Attendance, matches, and lineups currently use raw HeroUI `<Tabs>` inside PageContainer. After migration to AdminContainer these pages could optionally adopt AdminContainer's `tabs` prop — giving them the responsive action bar per tab for free. This is not required for the migration but is the natural next step.

---

## Coach Portal Benefit

Concrete improvements coach pages gain from AdminContainer:

| Feature | Impact |
|---|---|
| Responsive action bar | "Add session", "Generate lineup" buttons automatically collapse to mobile dropdown |
| Per-tab filters | Search/filter UI can live at tab level, not hardcoded inside tab content |
| Per-tab actions | Each tab declares its own action set — no `activeTab === '...' ? showButton : null` conditionals |
| Loading state | Same as PageContainer — no regression |

---

## Risk Assessment

| Risk | Severity | Note |
|---|---|---|
| Visual regression from spacing change | Low | Remove `mt-4 sm:mt-20` from container, add it to coach layout — net effect identical |
| AdminContainer used in coach portal (semantics) | Low | Name is misleading but can be addressed by renaming to `AppContainer` or `PageShell` later |
| Coach pages with complex tab state (attendance) | Medium | These pages have heavy internal state — migrating to AdminContainer tabs requires refactoring internal `useState` to match `activeTab`/`onTabChange` pattern |

---

## Implementation Order

| Step | Action | Complexity |
|---|---|---|
| 1 | Add `isError`, `isUnderConstruction` to AdminContainer | Trivial |
| 2 | Move `mt-4 sm:mt-20` to coach portal layout | Small |
| 3 | Migrate simple pages: members, videos | Quick |
| 4 | Migrate pages with loading: dashboard, matches | Quick |
| 5 | Delete PageContainer | After all usages replaced |
| 6 | (Optional) Migrate tabbed pages: attendance, lineups | Complex — separate task |