# Members Section

## Purpose

Displays a table of all internal club members that coaches can view and manage. Provides access to member details, payment tracking, editing, and deletion.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Single-file page — member table with modals for CRUD and payment management |

## Data Flow

```
page.tsx
├── useFetchMembersInternal() → all members (no category filter)
├── useAppData().categories.data → all categories (for name display)
├── useMemberModals() → modal state management
│
├── categoryMap = Record<id, name> (for cell rendering)
│
└── Table renders all members
    ├── Category column: displays category name from categoryMap
    ├── Payment modal
    ├── Edit modal
    ├── Delete modal
    └── Detail modal
```

## Category Filtering

**This page does NOT filter by category.** All members across all categories are displayed regardless of the coach's assigned categories.

This is a significant access control gap — a coach assigned to "Men A" can see all members from "Women", "Juniors", etc.

## Issues & Technical Debt

### Critical

1. **No category-based filtering** — `useFetchMembersInternal()` returns all members without any category restriction. Coaches see members from categories they are not assigned to.

2. **No backend authorization** — The `/api/members/internal` endpoint accepts an optional `category_id` parameter but the page doesn't use it, and the API doesn't enforce it based on the coach's assignments.

### Medium

3. **Category data includes inactive categories** — `useAppData().categories.data` may include inactive categories in the name mapping. Should use `activeCategories` or filter explicitly.

4. **All CRUD operations available** — Coaches can edit and delete members from any category. There's no restriction on which members a coach can modify.

### Low

5. **Single-file implementation** — The page is relatively self-contained, but could benefit from extracting the table configuration and cell renderers.

## Improvement Proposals

1. **Add category-based member filtering** — Pass the coach's assigned category IDs to `useFetchMembersInternal()` and use the existing `category_id` filter parameter. If the coach has multiple categories, either:
   - Filter to all assigned categories (show members from any assigned category)
   - Add a category selector (consistent with other pages)

2. **Add server-side authorization** — The API should enforce that coaches can only query members from their assigned categories. Add a `hasCategoryAccess` check.

3. **Restrict mutation permissions** — Coaches should only be able to edit/delete members that belong to their assigned categories. Consider making some operations admin-only.

4. **Add RLS policies** to the members table for category-based access control.

5. **Filter inactive categories** from the display mapping — use `activeCategories` instead of `categories.data`.