# Member Modal Unification — Analysis & Refactoring Plan

**Last updated:** 2026-03-10 (Phase 2 complete, Phase 3.1 done, 3.3 in progress with bugs)

## 1. Component Inventory (Before Refactor)

There are **4 separate components** that create or edit members, each with different field sets, patterns, and quality levels.

### A. `shared/members/modals/MemberModal.tsx` + `MemberInfoForm.tsx`

| | |
|---|---|
| **Used in** | Admin members page, Coach members page |
| **Operations** | Create + Edit |
| **Modal** | `UnifiedModal` |
| **Fields** | 7 basic: registration_number, name, surname, date_of_birth, sex, category_id, functions |
| **Form state** | `useState<Member>` — uses full `Member` type (has `id`, `is_active`, timestamps) |
| **Data ops** | None — parent passes `onSuccess(formData)` callback |
| **Validation** | None (relies on parent) |
| **Quality** | Good structure, but missing metadata fields and inline validation |
| **Status** | **Still exists** — not yet replaced |

### B. `coaches/lineups/components/CreateMemberModal.tsx`

| | |
|---|---|
| **Used in** | Coach lineups page (embedded in LineupMemberAssignDialog) |
| **Operations** | Create only |
| **Modal** | `Dialog` |
| **Fields** | **20+ fields** in 5 Card sections: basic, contact, parent/guardian, medical, additional |
| **Form state** | `useState<MemberMetadataFormData>` |
| **Data ops** | **Direct Supabase `.insert()` call** + `useMemberMetadata().createMemberMetadata()` |
| **Validation** | Manual `if (!formData.name)` checks |
| **Quality** | Best UI/UX (card sections, comprehensive fields) but worst code quality (direct DB calls, duplicated reset logic, violates query pattern) |
| **Status** | **Still exists** — not yet replaced |

### C. `admin/matches/components/CreateMemberModal.tsx`

| | |
|---|---|
| **Used in** | Admin matches page |
| **Operations** | Create only |
| **Modal** | `UnifiedModal` |
| **Fields** | 5 basic: registration_number, surname, name, date_of_birth, gender |
| **Form state** | `useState<MemberFormData>` |
| **Data ops** | `useMembers().createMember()` — proper hook pattern |
| **Validation** | Field-level errors via `useMembers()` hook |
| **Quality** | Best pattern adherence — uses proper hook, field errors, translation strings |
| **Status** | **Still exists** — not yet replaced |

### D. `admin/members/components/BulkEditModal.tsx`

| | |
|---|---|
| **Used in** | Admin members page |
| **Operations** | Bulk edit only (different purpose) |
| **Modal** | Raw HeroUI `Modal` (not UnifiedModal) |
| **Fields** | 3: gender, category, functions |
| **Quality** | Out of scope — different use case, but should migrate to Dialog |

---

## 2. Field Coverage Comparison

| Field | MemberModal | Lineups Create | Matches Create | MemberFormModal (new) | In DB |
|---|---|---|---|---|---|
| name | x | x | x | x | members |
| surname | x | x | x | x | members |
| registration_number | x | x | x | x | members |
| date_of_birth | x | x | x | x | members |
| sex/gender | x | x | x | x | members |
| category_id | x | - | - | x | members |
| functions | x (chips) | x (single string) | x (array) | x (single → array cast) | members |
| is_active | - | - | - | - | members |
| phone | - | x | - | x (if sections.contact) | member_metadata |
| email | - | x | - | x (if sections.contact) | member_metadata |
| address | - | x | - | x (if sections.contact) | member_metadata |
| parent_name | - | x | - | x (if sections.parent) | member_metadata |
| parent_phone | - | x | - | x (if sections.parent) | member_metadata |
| parent_email | - | x | - | x (if sections.parent) | member_metadata |
| medical_notes | - | x | - | x (if sections.medical) | member_metadata |
| allergies | - | x | - | x (if sections.medical) | member_metadata |
| emergency_contact_name | - | x | - | x (if sections.medical) | member_metadata |
| emergency_contact_phone | - | x | - | x (if sections.medical) | member_metadata |
| notes | - | x | - | x (if sections.additional) | member_metadata |
| preferred_position | - | x | - | x (if sections.additional) | member_metadata |
| jersey_size | - | x | - | x (if sections.additional) | member_metadata |
| shoe_size | - | x | - | x (if sections.additional) | member_metadata |

---

## 3. Anti-Patterns Found

### Critical
1. ~~**Direct Supabase calls** in `coaches/lineups/CreateMemberModal.tsx`~~ — will be replaced when migration happens
2. ~~**Duplicated form reset logic** — same 20-field object written 3 times~~ — centralized in `initialFormData`

### High
3. **Inconsistent callback signatures** — `onSuccess(Member)` vs `onMemberCreated(string)` vs `onMemberCreated({id, name, ...})` — new `MemberFormModal` unifies to `onSuccess(Member)`
4. ~~**No validation in MemberModal**~~ — `useMemberForm` now validates via `createFormHook`
5. ~~**`MemberMetadaFormData` typo**~~ — **FIXED** (renamed to `MemberMetadataFormData`)

### Medium
6. ~~**Modal component mismatch**~~ — new `MemberFormModal` uses `Dialog`
7. ~~**Form state uses full `Member` type**~~ — `useMemberForm` uses `MemberMetadataFormData` (form-only type)
8. ~~**No shared form sections**~~ — **FIXED** (card-based sections extracted)

---

## 4. Current Architecture

### File Structure

```
src/components/shared/members/
|-- modals/
|   |-- MemberFormModal.tsx          <-- DONE: Dialog + Tabs + sections + payments tab
|   |-- sections/
|   |   |-- BasicInfoSection.tsx     <-- DONE: name, surname, reg#, dob, gender, category_id
|   |   |-- ContactSection.tsx       <-- DONE: phone, email, address
|   |   |-- ParentSection.tsx        <-- DONE: parent/guardian info
|   |   |-- MedicalSection.tsx       <-- DONE: medical notes, allergies, emergency contact
|   |   |-- AdditionalSection.tsx    <-- DONE: preferred position, jersey/shoe size, notes
|   |   +-- index.ts                 <-- DONE: barrel exports
|   |-- config/
|   |   +-- memberFormConfig.ts      <-- DONE: QUICK_CREATE, FULL_CREATE, FULL_EDIT presets
|   |-- MemberModal.tsx              <-- OLD: to be replaced by MemberFormModal
|   |-- MemberInfoForm.tsx           <-- OLD: to be replaced by sections
|   |-- MemberPaymentsTab.tsx        <-- KEEP: used in edit mode payments tab
|   |-- PaymentFormModal.tsx         <-- KEEP: payment CRUD
|   +-- index.ts                     <-- AUTO-GENERATED: exports both old and new

src/types/entities/member/state/
+-- memberFormModal.ts               <-- DONE: MemberFormModalProps, MemberFormSections

src/hooks/entities/member/state/
|-- useMembers.ts                    <-- KEEP: CRUD operations
+-- useMemberForm.ts                 <-- DONE: createFormHook + useMembers + useMemberMetadata
```

### What's Done

| Component | Status | Notes |
|---|---|---|
| `BasicInfoSection.tsx` | DONE | Uses `ContentCard`, colored title, category picker via `Choice` |
| `ContactSection.tsx` | DONE | Uses `ContentCard` with `Grid` |
| `ParentSection.tsx` | DONE | Uses `ContentCard` |
| `MedicalSection.tsx` | DONE | Uses `ContentCard` |
| `AdditionalSection.tsx` | DONE | Uses `ContentCard` |
| `sections/index.ts` | DONE | Barrel exports |
| `memberFormConfig.ts` | DONE | 3 presets: `QUICK_CREATE`, `FULL_CREATE`, `FULL_EDIT` |
| `memberFormModal.ts` (types) | DONE | `MemberFormModalProps`, `MemberFormSections` |
| `useMemberForm.ts` | **DONE** | `createFormHook` factory + `useMembers` + `useMemberMetadata`, create/edit metadata, `category_id` extracted from metadata, returns `Member` |
| `MemberFormModal.tsx` | **DONE** | `member` prop drives mode via `useEffect`, `onSuccess`/`onClose` bridged, Czech title, Tabs with payments, categories wired |

### What's Remaining

1. **`defaultCategoryId` prop** — Defined in `MemberFormModalProps` but not wired. Should pre-fill `category_id` in `initialFormData` when creating from a category context (e.g. lineups).
2. **`MemberPaymentsTab` type compatibility** — Tab expects `member: BaseMember` but `MemberFormModal` receives `member: Member | null`. Works at runtime (Member extends BaseMember) but may need explicit cast during migration.
3. **Consumer migration** — All 4 consumers still use old modals (Phase 3 not started).

### Section Presets (`modals/config/memberFormConfig.ts`)

```typescript
QUICK_CREATE  = { basic: true,  contact: false, parent: false, medical: false, additional: false }
FULL_CREATE   = { basic: true,  contact: true,  parent: true,  medical: true,  additional: true  }
FULL_EDIT     = { basic: true,  contact: true,  parent: true,  medical: true,  additional: true  }
```

### Props Design (`types/entities/member/state/memberFormModal.ts`)

```typescript
interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;              // null = create, Member = edit
  sections?: MemberFormSections;      // default: QUICK_CREATE
  categories?: Category[];
  defaultCategoryId?: string;         // NOT YET WIRED
  onSuccess: (member: Member) => void;
  showPaymentsTab?: boolean;
}
```

### Mode Detection Pattern

```
member prop (from parent via useModalWithItem)
  └─ null  → useEffect calls openAddMode() → ModalMode.ADD → createMember + createMemberMetadata
  └─ Member → useEffect calls openEditMode(member) → ModalMode.EDIT → updateMember + updateMemberMetadata
```

No separate `mode` prop needed — `member !== null` drives everything.

---

## 5. Migration Plan

### Phase 1: Create new shared components (no breaking changes)

| Step | Action | Status |
|---|---|---|
| 1.1 | Fix `MemberMetadaFormData` typo → `MemberMetadataFormData` | **DONE** |
| 1.2 | Create form section components (`sections/*.tsx`) | **DONE** |
| 1.3 | Add section presets to config (`memberFormConfig.ts`) | **DONE** |
| 1.4 | Add types for MemberFormModal (`memberFormModal.ts`) | **DONE** |
| 1.5 | Create `MemberFormModal` shell | **DONE** |
| 1.6 | Implement `useMemberForm` hook | **DONE** |
| 1.7 | Fix Heading `twMerge` for section colors | **DONE** |
| 1.8 | Run `/generate-barrels` | **DONE** |

### Phase 2: Complete MemberFormModal (before migrating consumers)

| Step | Action | Status |
|---|---|---|
| 2.1 | Implement `useMemberForm` — form state, validation, `handleSubmit`, create/edit metadata | **DONE** |
| 2.2 | Wire `useMemberForm` into `MemberFormModal` — `updateFormData`, `member` prop drives mode via `useEffect` | **DONE** |
| 2.3 | Section visibility — conditionally renders based on `sections` prop (default: `QUICK_CREATE`) | **DONE** |
| 2.4 | Payments tab — `MemberPaymentsTab` in edit mode when `showPaymentsTab` is true, inside `Tabs` | **DONE** |
| 2.5 | `onSubmit` bridge — async wrapper calls `handleSubmit()` → `onSuccess(member)` → `onClose()` | **DONE** |
| 2.6 | Categories — `BasicInfoSection` receives `categories` prop, renders `Choice` picker | **DONE** |
| 2.7 | Wire `defaultCategoryId` — pre-fill `category_id` in form when creating from category context | **PENDING** |

### Phase 3: Migrate consumers (one at a time)

| Step | Replace | With | Risk | Status |
|---|---|---|---|---|
| 3.1 | `shared/members/modals/MemberModal.tsx` + `MemberInfoForm.tsx` | `MemberFormModal` with `FULL_EDIT` sections | — | **DONE** — admin + coach members pages already use `MemberFormModal`. Old `MemberModal` is orphaned (0 imports). |
| 3.2 | `admin/matches/CreateMemberModal.tsx` | `MemberFormModal` with `QUICK_CREATE` sections | Medium — used by `UnifiedPlayerManager` | **PENDING** — callback signature differs: old returns `{id, name, surname, registration_number}`, new returns `Member`. Also needs `categoryId` + `clubId` support. |
| 3.3 | `coaches/lineups/CreateMemberModal.tsx` | `MemberFormModal` with `FULL_CREATE` sections | Medium — old modal still wired to buttons | **IN PROGRESS** — both old `CreateMemberModal` and new `MemberFormModal` are rendered in `LineupMemberAssignDialog`. Old is wired to buttons, new has broken callback. |
| 3.4 | Consolidate `LineupMemberAssignDialog.tsx` | Remove old `CreateMemberModal`, fix `MemberFormModal` wiring | Medium | **PENDING** — blocked by 3.3 bugs (see below) |

#### Known Bugs in Phase 3

**LineupMemberAssignDialog.tsx:**

1. **Broken callback (line 306):** `onSuccess={() => handleMemberCreated}` returns a function reference instead of calling it. Should be:
   ```tsx
   onSuccess={(member) => { handleMemberCreated(member.id); setIsMemberFormModalOpen(false); }}
   ```

2. **Dual modal rendering:** Both old `CreateMemberModal` (lines 54-70) and new `MemberFormModal` (lines 303-310) are rendered simultaneously. The "Přidat nového člena" buttons open the **old** modal. Need to:
   - Remove old `CreateMemberModal` import and rendering
   - Wire buttons to open `MemberFormModal` instead
   - Fix callback as above

**UnifiedPlayerManager.tsx (for 3.2):**

3. **Callback signature mismatch:** Old `CreateMemberModal` calls `onMemberCreated({id, name, surname, registration_number})`. New `MemberFormModal` calls `onSuccess(member: Member)`. Consumer needs adapter.

4. **`clubId` not supported:** Old modal passes `clubId` to create member-club relationship. `useMemberForm` currently doesn't handle `clubId` — `createMember` in `useMembers` accepts it as 3rd arg but `useMemberForm.handleSubmit` doesn't pass it.

### Phase 4: Cleanup

| Step | Action | Status |
|---|---|---|
| 4.1 | Delete old `MemberInfoForm.tsx` | **READY** — 0 imports, orphaned |
| 4.2 | Delete old `MemberModal.tsx` | **READY** — 0 imports, deprecated, orphaned |
| 4.3 | Delete `coaches/lineups/CreateMemberModal.tsx` | **PENDING** — blocked by 3.3/3.4 |
| 4.4 | Delete `admin/matches/CreateMemberModal.tsx` | **PENDING** — blocked by 3.2 |
| 4.5 | Run `/generate-barrels` | **PENDING** |
| 4.6 | Verify `npm run tsc && npm run lint` | **PENDING** |

---

## 6. Dialog vs UnifiedModal Decision

`MemberFormModal` uses `Dialog` (the target pattern). Key differences:

| | UnifiedModal | Dialog |
|---|---|---|
| Footer | `isFooterWithActions` + `onPress` | `onSubmit` |
| Danger | Not supported | `dangerAction` prop |
| Custom footer | `footer` prop | Not supported |
| Heading | Custom `Heading` + `hSize` | Uses `Heading size={2}` |
| classNames | Hardcoded | Mergeable (fixed with `twMerge`) |

---

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| `onSuccess` callback signature change breaks consumers | High | Medium | Keep same `(member: Member) => void` signature as current MemberModal |
| Metadata save fails after member create succeeds | High | Low | Wrap in transaction-like logic: if metadata fails, show error but don't roll back member |
| Section visibility adds complexity | Medium | Low | Default to `QUICK_CREATE` — sections are additive, not subtractive |
| LineupMemberAssignDialog integration breaks | Medium | Medium | Test lineup flow end-to-end after migration |
| Payments tab regression | Medium | Low | No changes to MemberPaymentsTab — just re-mount inside new modal |

### Trade-offs

1. **More abstraction** — Section-based form is more complex than individual components. However, the alternative (3 separate components that drift apart) is worse.
2. **Larger single component** — `MemberFormModal` is ~112 lines (sections extracted). Acceptable.
3. **Migration effort** — Touching 4+ pages that use member modals. Each migration should be a separate commit for easy rollback.
4. **`useMemberForm` hook complexity** — Handles both create and edit with metadata. Uses `createFormHook` for form state + `useMembers`/`useMemberMetadata` for data ops.

---

## 8. What NOT to Change

- `BulkEditModal` — different purpose (bulk operations), keep separate
- `MemberPaymentsTab` / `PaymentFormModal` — working well, re-mounted inside new modal's Tabs
- `MembersInternalSection` / `MemberTableTab` — table display, unrelated
- `useMemberModals` / `useMemberSave` hooks — keep, update to work with new modal
- API routes and `useMembers` hook — no changes needed, new form just calls existing methods

---

## 9. Bonus Fixes Done During Refactor

| Fix | File | Details |
|---|---|---|
| `MemberMetadaFormData` typo | `types/entities/member/data/memberMetadata.ts` + 8 files | Renamed to `MemberMetadataFormData` |
| Heading conflicting `font-bold` | `components/ui/heading/Heading.tsx` | Removed dead `alternative` prop that always added `font-bold` over size-specific weight |
| Heading color override broken | `components/ui/heading/Heading.tsx` | Added `twMerge` — `className="text-green-700"` now properly overrides default `text-gray-900` |
| Dialog `classNames` not mergeable | `components/ui/dialog/Dialog.tsx` | Spread `props.classNames` and merge `base`/`wrapper` with defaults |
| `category_id` added to `MemberMetadataFormData` | `types/entities/member/data/memberMetadata.ts` | Form type now includes `category_id` for unified create/edit |

---

## 10. Success Criteria

- [x] Single `MemberFormModal` component handles create/edit flows
- [ ] No direct Supabase calls in any modal component (blocked by 3.2: UnifiedPlayerManager + 3.3: LineupMemberAssignDialog)
- [x] Field-level validation via `useMemberForm` hook (uses `createFormHook` validation rules)
- [x] Card-based section UI preserved (using `ContentCard` + `Heading` with colored titles)
- [x] Section visibility controlled by presets (`QUICK_CREATE`, `FULL_CREATE`, `FULL_EDIT`)
- [ ] All current functionality preserved (lineups callback, matches callback, admin edit+payments)
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Existing tests still pass
- [x] `MemberMetadaFormData` typo fixed everywhere
- [x] `Heading` component uses `twMerge` for clean class resolution
- [x] Form section components extracted and working
- [x] Section presets configured
- [x] Types defined for `MemberFormModalProps` and `MemberFormSections`
- [x] Barrel exports are current
- [x] `useMemberForm` hook implemented with `createFormHook` factory
- [x] `MemberFormModal` wired to hook with `member` prop driving mode
- [x] `onSuccess` / `onClose` bridged through async `onSubmit` wrapper
- [x] Categories wired into `BasicInfoSection` with `Choice` picker
- [x] Payments tab rendered in edit mode via `Tabs` + `showPaymentsTab`
- [x] `category_id` excluded from metadata fields in `useMemberForm` destructuring

---

## 11. Next Steps (Recommended Order)

1. **Delete orphaned files** (Phase 4.1 + 4.2) — `MemberModal.tsx` and `MemberInfoForm.tsx` have 0 imports. Safe to delete now + regenerate barrels.

2. **Fix LineupMemberAssignDialog** (Phase 3.3 + 3.4):
   - Fix broken `onSuccess` callback (function reference bug on line 306)
   - Remove old `CreateMemberModal` import and rendering
   - Wire "Přidat nového člena" buttons to open `MemberFormModal`
   - Wire `defaultCategoryId` from selected category context

3. **Wire `defaultCategoryId`** (Phase 2.7) — Pre-fill `category_id` in form when creating from category context. Needed for lineups flow.

4. **Add `clubId` support to `useMemberForm`** — Pass `clubId` as 3rd arg to `createMember` in `handleSubmit`. Needed for `UnifiedPlayerManager` migration (Phase 3.2).

5. **Migrate `UnifiedPlayerManager`** (Phase 3.2) — Replace `admin/matches/CreateMemberModal` with `MemberFormModal`. Adapt callback from `onMemberCreated({id,name,...})` to `onSuccess(Member)`.

6. **Final cleanup** (Phase 4.3–4.6) — Delete remaining old files, regenerate barrels, verify build.