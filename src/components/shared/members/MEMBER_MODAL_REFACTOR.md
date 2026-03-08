# Member Modal Unification — Analysis & Refactoring Plan

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

### B. `coaches/lineups/components/CreateMemberModal.tsx`

| | |
|---|---|
| **Used in** | Coach lineups page (embedded in AddMemberModal) |
| **Operations** | Create only |
| **Modal** | `UnifiedModal` |
| **Fields** | **20+ fields** in 5 Card sections: basic, contact, parent/guardian, medical, additional |
| **Form state** | `useState<MemberMetadataFormData>` |
| **Data ops** | **Direct Supabase `.insert()` call** + `useMemberMetadata().createMemberMetadata()` |
| **Validation** | Manual `if (!formData.name)` checks |
| **Quality** | Best UI/UX (card sections, comprehensive fields) but worst code quality (direct DB calls, duplicated reset logic, violates query pattern) |

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

| Field | MemberModal | Lineups Create | Matches Create | In DB |
|---|---|---|---|---|
| name | x | x | x | members |
| surname | x | x | x | members |
| registration_number | x | x | x | members |
| date_of_birth | x | x | x | members |
| sex/gender | x | x | x | members |
| category_id | x | - | - | members |
| functions | x (chips) | x (single string) | x (array) | members |
| is_active | - | - | - | members |
| phone | - | x | - | member_metadata |
| email | - | x | - | member_metadata |
| address | - | x | - | member_metadata |
| parent_name | - | x | - | member_metadata |
| parent_phone | - | x | - | member_metadata |
| parent_email | - | x | - | member_metadata |
| medical_notes | - | x | - | member_metadata |
| allergies | - | x | - | member_metadata |
| emergency_contact_name | - | x | - | member_metadata |
| emergency_contact_phone | - | x | - | member_metadata |
| notes | - | x | - | member_metadata |
| preferred_position | - | x | - | member_metadata |
| jersey_size | - | x | - | member_metadata |
| shoe_size | - | x | - | member_metadata |

**Key insight:** Only the Lineups CreateMemberModal has metadata fields. The other components only handle core `members` table fields.

---

## 3. Anti-Patterns Found (Pre-Refactor)

### Critical
1. ~~**Direct Supabase calls** in `coaches/lineups/CreateMemberModal.tsx`~~ — will be replaced
2. ~~**Duplicated form reset logic** — same 20-field object written 3 times~~ — centralized in `INITIAL_FORM_DATA`

### High
3. **Inconsistent callback signatures** — `onSuccess(Member)` vs `onMemberCreated(string)` vs `onMemberCreated({id, name, ...})`
4. **No validation in MemberModal** — relies entirely on parent, no field-level errors
5. ~~**`MemberMetadaFormData` typo**~~ — **FIXED** (renamed to `MemberMetadataFormData`)

### Medium
6. ~~**Modal component mismatch**~~ — new `MemberFormModal` uses `Dialog`
7. **Form state uses full `Member` type** in MemberModal — creates confusion between create (no id) and edit (has id) modes
8. ~~**No shared form sections**~~ — **FIXED** (card-based sections extracted)

---

## 4. Current Architecture

### File Structure

```
src/components/shared/members/
|-- modals/
|   |-- MemberFormModal.tsx          <-- NEW (WIP): replaces all 3 create/edit modals
|   |-- sections/
|   |   |-- BasicInfoSection.tsx     <-- DONE: name, surname, reg#, dob, gender
|   |   |-- ContactSection.tsx       <-- DONE: phone, email, address
|   |   |-- ParentSection.tsx        <-- DONE: parent/guardian info
|   |   |-- MedicalSection.tsx       <-- DONE: medical notes, allergies, emergency contact
|   |   |-- AdditionalSection.tsx    <-- DONE: preferred position, jersey/shoe size, notes
|   |   +-- index.ts                 <-- DONE: barrel exports
|   |-- config/
|   |   +-- memberFormConfig.ts      <-- DONE: QUICK_CREATE, FULL_CREATE, FULL_EDIT presets
|   |-- types/
|   |   +-- memberFormModal.ts       <-- DONE: MemberFormModalProps, MemberFormSections
|   |-- MemberModal.tsx              <-- OLD: to be replaced by MemberFormModal
|   |-- MemberInfoForm.tsx           <-- OLD: to be replaced by sections
|   |-- MemberPaymentsTab.tsx        <-- KEEP: used in edit mode tab
|   |-- PaymentFormModal.tsx         <-- KEEP: payment CRUD
|   +-- index.ts
|-- config/
|   |-- memberTableColumns.ts
|   +-- memberCellRenderers.tsx
|-- hooks/
|   +-- useCategoryMap.ts            <-- KEEP (UI-specific helper)
|-- MemberTableTab.tsx               <-- KEEP
|-- MembersInternalSection.tsx       <-- KEEP
+-- REFACTOR_PLAN.md                 <-- existing table refactor plan

src/hooks/entities/member/state/
|-- useMembers.ts                    <-- KEEP: CRUD operations
+-- useMemberForm.ts                 <-- NEW (WIP): form state + validation + submit
```

### Section Presets (`modals/config/memberFormConfig.ts`)

```typescript
QUICK_CREATE  = { basic: true,  contact: false, parent: false, medical: false, additional: false }
FULL_CREATE   = { basic: true,  contact: true,  parent: true,  medical: true,  additional: true  }
FULL_EDIT     = { basic: true,  contact: true,  parent: true,  medical: true,  additional: true  }
```

### Props Design (`modals/types/memberFormModal.ts`)

```typescript
interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;              // null = create, Member = edit
  sections?: MemberFormSections;
  categories?: Category[];
  defaultCategoryId?: string;
  onSuccess: (member: Member) => void;
  showPaymentsTab?: boolean;
}
```

---

## 5. Migration Plan

### Phase 1: Create new shared components (no breaking changes)

| Step | Action | Files | Status |
|---|---|---|---|
| 1.1 | Fix `MemberMetadaFormData` typo -> `MemberMetadataFormData` | `types/entities/member/data/memberMetadata.ts` + all imports | DONE |
| 1.2 | Create form section components | `shared/members/modals/sections/*.tsx` | DONE |
| 1.3 | Add section presets to config | `shared/members/modals/config/memberFormConfig.ts` | DONE |
| 1.4 | Add types for MemberFormModal | `shared/members/modals/types/memberFormModal.ts` | DONE |
| 1.5 | Create `MemberFormModal` shell | `shared/members/modals/MemberFormModal.tsx` | WIP — renders sections, needs `useMemberForm` + section visibility + payments tab |
| 1.6 | Implement `useMemberForm` hook | `src/hooks/entities/member/state/useMemberForm.ts` | WIP — stub only, needs full implementation |
| 1.7 | Fix Heading `twMerge` for section colors | `src/components/ui/heading/Heading.tsx` | DONE |
| 1.8 | Run `/generate-barrels` | barrel files | PENDING |

### Phase 2: Complete MemberFormModal (before migrating consumers)

| Step | Action | Status |
|---|---|---|
| 2.1 | Implement `useMemberForm` — form state, `updateField`, validation, `handleSubmit` (calls `useMembers` + `useMemberMetadata`), `reset` | PENDING |
| 2.2 | Wire `useMemberForm` into `MemberFormModal` — replace inline `useState` + `handleInputChange` | PENDING |
| 2.3 | Add section visibility — conditionally render sections based on `sections` prop (default: `QUICK_CREATE`) | PENDING |
| 2.4 | Add payments tab — show `MemberPaymentsTab` in edit mode when `showPaymentsTab` is true | PENDING |
| 2.5 | Fix `MemberFormModal` `onSubmit` type — `Dialog.onSubmit` is `() => void`, wire through `useMemberForm.handleSubmit` | PENDING |

### Phase 3: Migrate consumers (one at a time)

| Step | Replace | With | Risk | Status |
|---|---|---|---|---|
| 3.1 | `shared/members/modals/MemberModal.tsx` + `MemberInfoForm.tsx` | `MemberFormModal` with `FULL_EDIT` sections | Medium — used in admin + coach members pages | PENDING |
| 3.2 | `admin/matches/CreateMemberModal.tsx` | `MemberFormModal` with `QUICK_CREATE` sections | Low — isolated usage | PENDING |
| 3.3 | `coaches/lineups/CreateMemberModal.tsx` | `MemberFormModal` with `FULL_CREATE` sections | High — also used by AddMemberModal, has direct DB calls | PENDING |
| 3.4 | Update `coaches/lineups/AddMemberModal.tsx` | Point embedded create to new `MemberFormModal` | Low — callback adapter | PENDING |

### Phase 4: Cleanup

| Step | Action | Status |
|---|---|---|
| 4.1 | Delete old `MemberInfoForm.tsx` | PENDING |
| 4.2 | Delete old `MemberModal.tsx` | PENDING |
| 4.3 | Delete `coaches/lineups/CreateMemberModal.tsx` | PENDING |
| 4.4 | Delete `admin/matches/CreateMemberModal.tsx` | PENDING |
| 4.5 | Run `/generate-barrels` | PENDING |
| 4.6 | Verify `npm run tsc && npm run lint` | PENDING |

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
| AddMemberModal integration breaks | Medium | Medium | Test lineup flow end-to-end after migration |
| Payments tab regression | Medium | Low | No changes to MemberPaymentsTab — just re-mount inside new modal |

### Trade-offs

1. **More abstraction** — Section-based form is more complex than individual components. However, the alternative (3 separate components that drift apart) is worse.
2. **Larger single component** — `MemberFormModal` will be ~80-100 lines (sections extracted). Acceptable.
3. **Migration effort** — Touching 4+ pages that use member modals. Each migration should be a separate commit for easy rollback.
4. **`useMemberForm` hook complexity** — Needs to handle both create (no metadata) and create+metadata flows. Keep it focused: form state + validation only, let the hook call `useMembers` and `useMemberMetadata` internally.

---

## 8. What NOT to Change

- `BulkEditModal` — different purpose (bulk operations), keep separate
- `MemberPaymentsTab` / `PaymentFormModal` — working well, just re-mount in new modal
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

---

## 10. Success Criteria

- [ ] Single `MemberFormModal` component handles all member create/edit flows
- [ ] No direct Supabase calls in any modal component
- [ ] Field-level validation via `useMemberForm` hook
- [ ] Card-based section UI preserved (using `UnifiedCard` + `Heading` with colored titles)
- [ ] Section visibility controlled by presets (`QUICK_CREATE`, `FULL_CREATE`, `FULL_EDIT`)
- [ ] All current functionality preserved (lineups callback, matches callback, admin edit+payments)
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Existing tests still pass
- [x] `MemberMetadaFormData` typo fixed everywhere
- [x] `Heading` component uses `twMerge` for clean class resolution