# Member Table System — Refactoring Plan

## Problem Map

| # | Problem | Status | Affects |
|---|---|---|---|
| 1 | `MemberFilters` type defined in two files | ✅ Fixed | `memberFilters.ts` now single source |
| 2 | `categoryMap` computation duplicated in 4 places | ✅ Fixed in admin | `MembersExternalTab`, `MembersOnLoanTab`, `CoachesMembersPage` still pending |
| 3 | `useMemberModals` used `useDisclosure()` directly | ✅ Fixed | Hook + admin page caller clean |
| 4 | Modal components lived in `/admin/members/components/` | ✅ Fixed | Moved to `shared/members/modals/` |
| 5 | Admin page TypeScript errors | ✅ Fixed — zero errors | `admin/members/page.tsx` |
| 6 | `MembersInternalSection` type errors | ✅ Fixed — no-op fallbacks in place | `MembersInternalSection.tsx` |
| 7 | `MembersInternalSection` not wired in admin page | ❌ Pending | `MembersInternalTab` still used |
| 8 | `useFetchMembersInternal` called twice in admin | ❌ Pending | Stats fetch + tab fetch |
| 9 | `MemberTableTab` has unused action handler props | ❌ Pending | All table usages |
| 10 | Coach portal broken — no modals, no category filter | ❌ Pending | `coaches/members/page.tsx` |
| 11 | Hook constraint blocks `useMemberModals<MemberInternal>()` | ❌ Pending — blocker for coach portal | `useMemberModals.ts` |
| 12 | `onEdit` prop in `MembersInternalSection` is dead | ❌ Pending | `MembersInternalSection.tsx` |
| 13 | `deleteModal.onClose()` should be `closeAndClear()` | ❌ Pending | `admin/members/page.tsx:156` |
| 14 | Dead `MemberFunction` import | ❌ Low | `admin/members/page.tsx:23` |
| 15 | `MemberFormModal` and `MemberDetailModal` are duplicates | ❌ New — see analysis below | Both files + all callers |

---

## Analysis: `MemberFormModal` vs `MemberDetailModal` — Why Two Modals?

### What each does

**`MemberFormModal`** (`modals/MemberFormModal.tsx`):
- Flat single-section modal (no tabs)
- Contains: registration_number, name, surname, date_of_birth, sex, category (filtered by sex), functions
- Props: `formData: Member`, `setFormData`, `categories`, `sexOptions`, `isEditMode?`
- Currently used only in **add mode** in the admin page (`modals.addModal.isOpen`)
- `isEditMode` prop exists but the admin page never passes `true`

**`MemberDetailModal`** (`modals/MemberDetailModal.tsx`):
- Large (4xl) tabbed modal
- Tab 1 "Info": renders `MemberInfoTab` — **identical form fields to `MemberFormModal`**
- Tab 2 "Poplatky": renders `MemberPaymentsTab` — disabled in ADD mode
- Props: `formData: Member`, `setFormData`, `mode: ModalMode`, `categoriesData`
- Contains internal `handleSave` that calls `createMember()` directly for ADD mode
- Currently used only in **edit mode** in the admin page (`modals.detailModal.isOpen`, always `mode={ModalMode.EDIT}`)

**`MemberInfoTab`** (`modals/MemberInfoTab.tsx`):
- The inner form used inside `MemberDetailModal`
- Contains the **same fields as `MemberFormModal`** with minor differences:
  - Imports `genderOptions` directly (vs `MemberFormModal` taking `sexOptions` as prop)
  - Accepts `formData: Member | null` (nullable) vs `MemberFormModal`'s non-null `formData: Member`

### The duplication in detail

The category filtering logic is copy-pasted verbatim in both `MemberFormModal` and `MemberInfoTab`:
```typescript
// Duplicated in both files:
categories.filter((category) => {
  if (formData.sex === Genders.MALE) {
    return category.gender === Genders.MALE || category.gender === Genders.MIXED;
  } else if (formData.sex === Genders.FEMALE) {
    return category.gender === Genders.FEMALE || category.gender === Genders.MIXED;
  }
  return false;
})
```

All six form fields (registration_number, name, surname, date_of_birth, sex, category, functions) are implemented twice.

### Additional problems

1. **`MemberDetailModal` owns CRUD directly** — it imports `useMembers()` and calls `createMember()` internally for ADD mode. This violates the pattern where pages own CRUD and pass handlers down. It also creates a risk of double-create if a parent also calls `handleAddMember` when `onSubmit` fires.

2. **`mode: ModalMode` is redundant** — the admin page always passes `ModalMode.EDIT`. The `ModalMode.ADD` branch inside `MemberDetailModal` is never exercised by any current caller.

3. **`isEditMode` on `MemberFormModal` is redundant** — the admin page always passes `isEditMode={false}`. The edit branch is unused.

4. **Inconsistent `genderOptions` sourcing** — `MemberFormModal` takes `sexOptions` as a prop, `MemberInfoTab` imports `genderOptions` from `@/utils` directly.

### Recommendation: Consolidate into `MemberModal`

Replace both components (and `MemberInfoTab`) with a single `MemberModal`:

```typescript
// src/components/shared/members/modals/MemberModal.tsx
interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;        // null = add mode, object = edit mode
  categories: Category[];
  onSuccess: (data: Member) => Promise<void>;  // parent owns CRUD
}

export default function MemberModal({ isOpen, onClose, member, categories, onSuccess }) {
  const isEditMode = member !== null;
  const [formData, setFormData] = useState<Member>(member ?? MEMBER_INITIAL_DATA);

  // Reset form when member changes (modal re-opens with different member)
  useEffect(() => {
    setFormData(member ?? MEMBER_INITIAL_DATA);
  }, [member]);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      onPress={() => onSuccess(formData)}
      size={isEditMode ? '4xl' : '2xl'}
      title={isEditMode
        ? `${member.registration_number} - ${member.name} ${member.surname}`
        : translations.members.modals.addMember
      }
      isFooterWithActions
    >
      {isEditMode ? (
        <Tabs>
          <Tab key="info" title={translations.members.modals.tabs.info}>
            <MemberInfoForm formData={formData} setFormData={setFormData} categories={categories} />
          </Tab>
          <Tab key="payments" title={translations.members.modals.tabs.membershipFees}>
            <MemberPaymentsTab member={member} />
          </Tab>
        </Tabs>
      ) : (
        <MemberInfoForm formData={formData} setFormData={setFormData} categories={categories} />
      )}
    </UnifiedModal>
  );
}
```

Where `MemberInfoForm` is the extracted, deduplicated form fields (replaces both `MemberFormModal`'s inline fields and `MemberInfoTab`).

### Impact of consolidation

**Files deleted:** `MemberFormModal.tsx`, `MemberDetailModal.tsx`, `MemberInfoTab.tsx`

**Files created:** `MemberModal.tsx`, `MemberInfoForm.tsx`

**Admin page changes:**
```typescript
// Before — two separate modals:
const modals = useMemberModals<BaseMember>();
// addModal → MemberFormModal (isEditMode=false)
// detailModal → MemberDetailModal (mode=ModalMode.EDIT)

// After — one modal:
const memberModal = useModalWithItem<Member>();
// memberModal.openEmpty() → add mode (member=null)
// memberModal.openWith(member) → edit mode (member=object)

<MemberModal
  isOpen={memberModal.isOpen}
  onClose={memberModal.closeAndClear}
  member={memberModal.selectedItem}   // null = add, object = edit
  categories={categoriesData || []}
  onSuccess={async (data) => {
    if (memberModal.isEditMode) await updateMember({ id: data.id!, ...data });
    else await createMember(data, data.category_id ?? undefined);
    memberModal.closeAndClear();
    refreshInternal();
  }}
/>
```

`formData` state in the page is removed — form state moves inside `MemberModal`.

---

## Target Architecture (Updated)

```
src/components/shared/members/
├── MemberTableTab.tsx              ← keep (needs prop cleanup — Step 8)
├── config/
│   ├── memberTableColumns.ts       ← keep
│   └── memberCellRenderers.tsx     ← keep
├── hooks/
│   └── useCategoryMap.ts           ← ✅ EXISTS
├── modals/
│   ├── MemberModal.tsx             ← NEW — replaces MemberFormModal + MemberDetailModal
│   ├── MemberInfoForm.tsx          ← NEW — replaces MemberInfoTab + inline fields in MemberFormModal
│   ├── MemberPaymentsTab.tsx       ← ✅ keep
│   ├── PaymentFormModal.tsx        ← ✅ keep
│   └── index.ts
│   (deleted: MemberFormModal.tsx, MemberDetailModal.tsx, MemberInfoTab.tsx)
├── MembersInternalSection.tsx      ← ✅ EXISTS, clean, needs `onEdit` prop removed
└── index.ts
```

---

## Step-by-Step Status

### Steps 1–4 — ✅ DONE

Type consolidation, `useCategoryMap`, hook refactor, modal moves all complete.

---

### Step 5: Wire `MembersInternalSection` into admin page — ❌ PENDING

Replace `MembersInternalTab` usage in admin `page.tsx` with `MembersInternalSection` directly.

Before wiring, fix `onEdit` dead prop in `MembersInternalSection` (remove from props interface, column config maps `UPDATE` to `onDetail` not `onEdit`).

Also fix `onSelectionChange` prop type: `MemberTableTab` calls the callback with `Set<string>` despite declaring `Selection`. Pass a wrapper:
```typescript
onSelectionChange={(keys) => setSelectedMembers(keys as unknown as Set<string>)}
```

---

### Step 6 (NEW — highest priority): Consolidate `MemberModal` — ✅ DONE

**Created:** `MemberInfoForm.tsx`, `MemberModal.tsx`
**Deleted:** `MemberFormModal.tsx`, `MemberDetailModal.tsx`, `MemberInfoTab.tsx`
**Admin page:** Uses single `memberModal = useModalWithItem<Member>()`, `formData` state removed from page, `handleMemberSuccess` replaces `handleAddMember` + `handleUpdateMember`.
**`showPaymentsTab` prop:** Defaults `true`; admin passes `showPaymentsTab={activeTab === 'members-internal'}` so external/on-loan edit does not show payments tab.
**Also fixed:** `coaches/members/page.tsx` and `MembersInternalTab.tsx` had wrong `onDetail` prop name — corrected to `onEdit`.

---

### Step 7: Fix admin page remaining issues — ❌ PENDING

After Step 6:

**Issue 13** — `deleteModal.onClose()` → `deleteModal.closeAndClear()` (line 156)

**Issue 14** — Remove dead `MemberFunction` import (line 23)

**Issue 15** — Remove `// TODO: hooks` comment (line 1)

---

### Step 8: Fix double-fetch — ❌ PENDING

Admin page still has unfiltered `useFetchMembersInternal()` at line 72 (for stats) plus `MembersInternalSection`'s own internal fetch. Rename the stats fetch for clarity:
```typescript
const { data: allMembersForStats } = useFetchMembersInternal({ limit: 1000 });
```

---

### Step 9: Fix hook constraint — ❌ PENDING (blocker for coach portal)

Change `useMemberModals.ts` line 4:
```typescript
// From:
export const useMemberModals = <T extends BaseMember = Member>() => {
// To:
export const useMemberModals = <T extends { id: string | null }>() => {
```

---

### Step 10: Fix coach portal — ❌ PENDING (blocked by Steps 5, 6, 9)

Rewrite `coaches/members/page.tsx`:
- `useCoachCategory()` for `selectedCategory`
- `MembersInternalSection` with `categoryId={selectedCategory}`
- Single `memberModal = useModalWithItem<MemberInternal>()` → `<MemberModal>`
- `PaymentFormModal` for payments
- `DeleteConfirmationModal` for delete
- Search/filter UI using `MemberTableFilters`

---

### Step 11: Clean `MemberTableTab` props — ❌ PENDING (last)

Remove unused `onPayment`, `openEdit`, `openDelete`, `openDetail` props. Change `onSelectionChange` from `(keys: Selection) => void` to `(keys: Set<string>) => void` — matches what the component actually calls.

---

## Execution Order

| Order | Step | Status | Blocked by |
|---|---|---|---|
| 1–4 | Type, hooks, modals foundation | ✅ Done | — |
| 5 | Wire `MembersInternalSection`, remove `onEdit` dead prop | ❌ | — |
| 6 | Consolidate `MemberModal` (new — high priority) | ✅ Done | — |
| 7 | Admin page minor fixes (13, 14, 15) | ❌ | 6 ✅ |
| 8 | Double-fetch cleanup | ❌ | 5 |
| 9 | Loosen hook constraint | ❌ | — |
| 10 | Fix coach portal | ❌ | 5, 6 ✅, 9 |
| 11 | Clean `MemberTableTab` props | ❌ | 5, 10 |

Steps 5, 6, and 9 have no dependencies and can be done in parallel.

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
- "Mark as inactive" action in coach portal
- Statistics tab in coach portal
- External/on-loan tabs in coach portal
- Apply `useCategoryMap` to `MembersExternalTab`, `MembersOnLoanTab` (same fix, defer until those files are touched)
