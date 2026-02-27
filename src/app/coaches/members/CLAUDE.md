# Members Section

## Purpose

Displays a table of all internal club members that coaches can view and manage. Provides access to member details, payment tracking, editing, and deletion.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Single-file page — member table with modal state wiring |

## Data Flow

```
page.tsx
├── useFetchMembersInternal() → paginated members (no category/search filter passed)
├── useAppData().categories.data → all categories (for name display)
├── useMemberModals<BaseMember>() → modal state management
│
├── categoryMap = Record<id, name> (for cell rendering)
│
└── MemberTableTab<MemberInternal>
    ├── Category column: displays category name from categoryMap
    ├── getInternalMemberColumns → action buttons (Payment, Delete, Detail)
    ├── renderInternalMemberCell → cell rendering
    └── ⚠️ NO MODAL COMPONENTS RENDERED ← root cause of all broken actions
```

---

## Critical Bug: Broken Actions (Root Cause)

**Every coach action is broken.** Clicking Payment, Edit, Delete, or Detail does nothing visible.

### Root Cause 1: Modal components missing from JSX

`useMemberModals` manages modal *state* (open/close flags, selected member), but the actual modal *components* (`<MemberPaymentModal>`, `<MemberEditModal>`, `<MemberDeleteModal>`, `<MemberDetailModal>`) are **never rendered** in the page's return statement.

The page JSX is:

```tsx
return (
  <PageContainer>
    <MemberTableTab ... />
  </PageContainer>
);
// ← no modals here
```

The modal state opens (e.g., `openPaymentInternal(member)` runs), but since no modal component is mounted, nothing shows. Compare with the admin members page — it renders each modal component after the table.

**Fix:** Add all four modal components to the JSX, passing `isOpen`, `onClose`, and `member` from `useMemberModals`.

### Root Cause 2: Type mismatch — `useMemberModals<BaseMember>` vs `MemberInternal`

`MemberInternal` extends `MembersInternalSchema` (a view schema with payment fields).
`BaseMember` is a **separate interface** (member table fields only).

They are not related by inheritance. `MemberInternal` is cast `as BaseMember` in the four wrappers:

```typescript
const openEditInternal = (member: MemberInternal) =>
  openEditBase(member as BaseMember, 'internal');  // ← forced cast
```

The hook stores `selectedMember: BaseMember | null`. When the modal form tries to initialize from `selectedMember`, it only sees `BaseMember` fields — the cast discards `MemberInternal`-specific fields (payment status, payment amounts).

**Fix:** Use `useMemberModals<MemberInternal>()` directly — the hook is generic `<T extends BaseMember>` so this is valid. Remove the four cast wrappers.

### Root Cause 3: Missing `onEdit` in column config

`getInternalMemberColumns` accepts `{ onPayment, onDelete, onDetail }` but the page does not pass an `onEdit` handler — nor does the column config include an edit action by default. Edit button is absent from the table.

**Fix:** Pass `onEdit: openEditInternal` to `getInternalMemberColumns` (verify the handler exists in the config type).

---

## Missing Features (per requirements)

### 1. Category filtering (broken access control)

`useFetchMembersInternal()` accepts a `category_id` filter but the page passes nothing. All members across all categories are shown.

**Fix (Option A — recommended):** Pass `selectedCategory` from `useCoachCategory()` as the `category_id` filter. Coach sees only members in the currently selected category.

**Fix (Option B):** Use `availableCategories` from `useCoachCategory()` to show members from all assigned categories. Requires API support for multi-category filter (not currently implemented).

### 2. Search / filter UI

`useFetchMembersInternal()` supports:
- `search` (name/surname with 300ms debounce)
- `sex` filter
- `category_id` filter
- `function` filter

None of these are exposed in the page UI. The hook exposes the setters — the page just needs to wire up input components.

### 3. Create new member

No "add member" button exists. `useMemberModals` includes `openAdd()` and the hook manages an add modal state. A `<Button>` triggering `openAdd()` + the `<MemberAddModal>` component need to be rendered.

### 4. Mark as inactive

No "mark as inactive" action. This is typically an edit operation (setting `is_active = false`). Could be added as a dedicated column action or exposed via the detail/edit modal.

### 5. Pagination controls

`useFetchMembersInternal()` has full pagination support (`goToPage`, `changePageSize`, `totalCount`, `currentPage`). `MemberTableTab` also has internal pagination at 25 items/page. However the page only passes `data` — it's unclear which pagination is active. Verify `MemberTableTab` internal pagination is wired or pass the hook's pagination controls explicitly.

---

## Generic Component Opportunity

`MemberTableTab` is already generic (`<T>`). The column config functions (`getInternalMemberColumns`, `getExternalMemberColumns`, `getOnLoanMemberColumns`) and cell renderers (`renderInternalMemberCell`, etc.) are already shared.

The **page-level wiring** (modal state → column actions → modal JSX) is what differs between portals. The recommended pattern:

```
src/components/shared/members/
├── MemberTableTab.tsx             ← generic table (already exists)
├── config/
│   ├── memberTableColumns.ts      ← column configs (already exists)
│   └── memberCellRenderers.tsx    ← cell renderers (already exists)
└── MemberTableWithModals.tsx      ← NEW: generic table + modal state + modal JSX
    Accepts: memberType, fetchHook, categoryId?
    Renders: MemberTableTab + all 4 modals wired correctly
```

Admin portal and coach portal both use `MemberTableWithModals` with different props (different category restriction, different allowed actions).

---

## Implementation Plan

### Step 1: Fix broken actions (critical)

1. Change `useMemberModals<BaseMember>` → `useMemberModals<MemberInternal>`
2. Remove the four `as BaseMember` cast wrappers — pass handlers directly
3. Add all four modal components to the page JSX (copy pattern from admin members page)
4. Add `onEdit` handler to `getInternalMemberColumns` call

### Step 2: Adopt `CoachCategoryContext`

5. Import `useCoachCategory()` and pass `selectedCategory` to `useFetchMembersInternal()`
6. Show category dropdown when coach has multiple assigned categories (same pattern as attendance page)

### Step 3: Add create button

7. Add a "New member" button wired to `useMemberModals().openAdd()`
8. Render `<MemberAddModal>` in JSX

### Step 4: Add filter UI

9. Wire `useFetchMembersInternal()` search/sex/function setters to input components
10. Add a search input and optional filter dropdowns (sex, function)

### Step 5: Pagination

11. Verify which pagination is active (hook vs MemberTableTab internal)
12. Expose `goToPage` and `currentPage` / `totalCount` to the user if not already shown

### Step 6 (Future): Extract generic component

13. Create `MemberTableWithModals.tsx` shared component
14. Refactor coach and admin members pages to use it

---

## Issues & Technical Debt

### Critical

1. **Broken actions** — Modal components not rendered; type cast `as BaseMember` discards payment fields. (See detailed analysis above.)

### High

2. **No category-based filtering** — Coaches see members from all categories. `useFetchMembersInternal()` supports `category_id` filter but it's unused.

3. **No backend authorization** — `/api/members/internal` endpoint accepts an optional `category_id` parameter but the API doesn't enforce it based on the coach's assignments. (Server-side concern — see root `CLAUDE.md` Layers 3-4.)

### Medium

4. **No search/filter UI** — Filters are supported by the hook but not exposed.

5. **No create member action** — Requirements include creating new members; not implemented.

6. **No "mark as inactive" action** — Required but not implemented.

7. **Category data includes inactive categories** — `useAppData().categories.data` includes inactive categories in the name mapping. Should use `activeCategories`.

### Low

8. **Code duplication** — Modal wiring pattern is duplicated from the admin members page. Opportunity to extract `MemberTableWithModals` shared component.
