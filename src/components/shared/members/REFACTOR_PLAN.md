# Member Table System — Refactoring Plan

## Problem Map

| # | Problem | Status | Affects |
|---|---|---|---|
| 1 | `MemberFilters` type defined in two files | ✅ Fixed | `memberFilters.ts` now single source |
| 2 | `categoryMap` computation duplicated in 4 places | ✅ Fixed in admin | `MembersExternalTab`, `MembersOnLoanTab` still pending |
| 3 | `useMemberModals` used `useDisclosure()` directly | ✅ Fixed | Hook + admin page caller clean |
| 4 | Modal components lived in `/admin/members/components/` | ✅ Fixed | Moved to `shared/members/modals/` |
| 5 | Admin page TypeScript errors | ✅ Fixed — zero errors | `admin/members/page.tsx` |
| 6 | `MembersInternalSection` type errors | ✅ Fixed — no-op fallbacks in place | `MembersInternalSection.tsx` |
| 7 | `MembersInternalSection` not wired in admin page | ✅ Fixed | `MembersInternalTab` now dead |
| 8 | `useFetchMembersInternal` called twice in admin | ✅ Fixed — renamed to `allMembersForStats` | Stats fetch intent now clear |
| 9 | `MemberTableTab` has unused action handler props | ✅ Fixed — props removed | `MemberTableTab.tsx` |
| 10 | Coach portal broken — no modals, no category filter | ✅ Fixed | `coaches/members/page.tsx` fully rewritten |
| 11 | Hook constraint blocks `useMemberModals<MemberInternal>()` | ✅ Fixed — constraint loosened to `{id: string or null}` | `useMemberModals.ts` |
| 12 | `onEdit` prop in `MembersInternalSection` is dead | ✅ Moot — prop is actively used by admin page | `MembersInternalSection.tsx` |
| 13 | `deleteModal.onClose()` should be `closeAndClear()` | ✅ Fixed | `handleDeleteMember` calls `closeAndClear()` |
| 14 | Dead `MemberFunction` import | ✅ Fixed | Removed from `admin/members/page.tsx` |
| 15 | `MemberFormModal` and `MemberDetailModal` are duplicates | ✅ Fixed — replaced by `MemberModal` + `MemberInfoForm` | Both files deleted |
| 16 | `MembersInternalTab.tsx` is now a dead file | ✅ Fixed — deleted | File and barrel export removed |
| 17 | Coach page had dead `useFetchMembersInternal()` call | ✅ Fixed — removed | `coaches/members/page.tsx` |
| 18 | `onSuccess={refreshKey}` passed number instead of callback | ✅ Fixed | `coaches/members/page.tsx` line 108 |
| 19 | `MemberModal` missing `key` prop in coach portal | ✅ Fixed — `key={memberModal.selectedItem?.id ?? 'new'}` | `coaches/members/page.tsx` |
| 20 | `handleMemberSuccess` duplicated between admin and coach portal | ✅ Fixed — extracted to `useMemberSave` | Coach portal uses hook; admin portal pending (#21) |
| 21 | Admin page still has inline `handleMemberSuccess` — not using `useMemberSave` | ❌ Pending | `admin/members/page.tsx` |
| 22 | `categories={categoriesData}` missing null fallback in coach portal | ❌ Pending | `coaches/members/page.tsx` line 65 |

---

## Target Architecture (Current)

```
src/components/shared/members/
├── MemberTableTab.tsx              ✅ Clean — unused action props removed
├── config/
│   ├── memberTableColumns.ts       ← keep
│   └── memberCellRenderers.tsx     ← keep
├── hooks/
│   └── useCategoryMap.ts           ✅ EXISTS
├── modals/
│   ├── MemberModal.tsx             ✅ EXISTS (replaced MemberFormModal + MemberDetailModal)
│   ├── MemberInfoForm.tsx          ✅ EXISTS (replaced MemberInfoTab + inline fields)
│   ├── MemberPaymentsTab.tsx       ✅ keep
│   ├── PaymentFormModal.tsx        ✅ keep
│   └── index.ts
├── MembersInternalSection.tsx      ✅ EXISTS, wired in admin page and coach portal
└── index.ts

src/hooks/entities/member/business/
├── useMemberModals.ts              ✅ EXISTS
├── useMemberSave.ts                ✅ EXISTS — used in coach portal, pending in admin
└── ...
```

---

## Remaining Issues

### Issue #21: Admin page not using `useMemberSave`

**File:** `admin/members/page.tsx`

`handleMemberSuccess` (lines 100–139) is still inline. It does the same create/update logic as `useMemberSave`, plus tab-aware refresh at the end.

```typescript
// Replace:
const handleMemberSuccess = async (data: Member) => { ... };

// With:
const { handleSave: handleMemberSuccess } = useMemberSave(memberModal, () => {
  if (activeTab === 'members-internal') refreshInternal();
  else if (activeTab === 'members-external') refreshExternal();
  else if (activeTab === 'members-on-loan') refreshOnLoan();
});
```

After this, remove the `createMember` / `updateMember` imports from the admin page (they move into the hook). Keep `deleteMember`.

### Issue #22: `categories` null fallback missing in coach portal

**File:** `coaches/members/page.tsx` line 65

`MemberModal` declares `categories: Category[]` (not nullable). `MemberInfoForm` calls `.filter()` on it directly — passing `null` throws at runtime if `AppDataContext` hasn't loaded yet.

```tsx
// Current (unsafe):
categories={categoriesData}

// Fix:
categories={categoriesData || []}
```

---

## Execution Order

| Order | Step | Status |
|---|---|---|
| 1–20 | All original steps + coach portal bugs | ✅ Done |
| 21 | Wire `useMemberSave` in admin page | ❌ Pending |
| 22 | Add `|| []` fallback on coach portal `MemberModal` | ❌ Pending |

Both are unblocked and independent.

---

## What Stays Admin-Only

| Component | Reason |
|---|---|
| `BulkEditModal.tsx` | Bulk operations not available to coaches |
| `MembersStatisticTab.tsx` | Admin dashboard feature |
| `MembersCsvImport.tsx` | Admin import feature |
| `MembersListFilters.tsx` | Move to shared when coach portal needs filters |
| `MembersExternalTab.tsx` | No coach portal equivalent yet |
| `MembersOnLoanTab.tsx` | No coach portal equivalent yet |

---

## Out of Scope

- Server-side category authorization (Layers 3 + 4 — see coaches CLAUDE.md)
- RLS policies for member table
- Apply `useCategoryMap` to `MembersExternalTab`, `MembersOnLoanTab` (same fix, defer until those files are touched)
- Search/filter UI in coach portal
- "Mark as inactive" action in coach portal
- Statistics tab in coach portal
- External/on-loan tabs in coach portal