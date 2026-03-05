# Member Modal Unification — Analysis & Refactoring Plan

## 1. Current State: Component Inventory

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
| **Form state** | `useState<MemberMetadaFormData>` (note: typo in type name) |
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

## 3. Type Inconsistencies

| Type | Used by | Fields | Issues |
|---|---|---|---|
| `Member` | MemberModal | Full DB row + enums | Includes `id`, `created_at`, `updated_at` — wrong for creation forms |
| `MemberFormData` | Matches CreateMemberModal | 5 basic fields | Clean, purpose-built for creation |
| `MemberMetadaFormData` | Lineups CreateMemberModal | 20+ fields | Typo in name ("Metada"), `functions` is `string` not `MemberFunction[]` |
| `UpdateMemberData` | useMembers hook | Partial member | Correct pattern for updates |

---

## 4. Anti-Patterns Found

### Critical
1. **Direct Supabase calls** in `coaches/lineups/CreateMemberModal.tsx` (lines 90-104) — bypasses API routes, has no auth validation, violates QueryContext pattern
2. **Duplicated form reset logic** — same 20-field object written 3 times in the lineups component (initial state, submit reset, close reset)

### High
3. **Inconsistent callback signatures** — `onSuccess(Member)` vs `onMemberCreated(string)` vs `onMemberCreated({id, name, ...})`
4. **No validation in MemberModal** — relies entirely on parent, no field-level errors
5. **`MemberMetadaFormData` typo** — propagated across types and code

### Medium
6. **Modal component mismatch** — some use `UnifiedModal`, newer code uses `Dialog` — project is migrating to `Dialog`
7. **Form state uses full `Member` type** in MemberModal — creates confusion between create (no id) and edit (has id) modes
8. **No shared form sections** — the card-based UI in lineups CreateMemberModal is not reusable

---

## 5. Proposed Architecture

### Target: Single `MemberFormModal` component

```
src/components/shared/members/
├── modals/
│   ├── MemberFormModal.tsx          ← NEW: replaces all 3 create/edit modals
│   ├── sections/
│   │   ├── BasicInfoSection.tsx     ← core member fields (name, surname, reg#, dob, gender, category, functions)
│   │   ├── ContactSection.tsx       ← phone, email, address
│   │   ├── ParentSection.tsx        ← parent/guardian info
│   │   ├── MedicalSection.tsx       ← medical notes, allergies, emergency contact
│   │   └── AdditionalSection.tsx    ← preferred position, jersey/shoe size, notes
│   ├── MemberPaymentsTab.tsx        ← keep as-is (used in edit mode tab)
│   ├── PaymentFormModal.tsx         ← keep as-is
│   └── index.ts
├── config/
│   └── memberFormConfig.ts          ← NEW: section visibility config per use-case
├── hooks/
│   ├── useCategoryMap.ts            ← keep
│   └── useMemberForm.ts            ← NEW: form state + validation + submit logic
├── MemberTableTab.tsx               ← keep
├── MembersInternalSection.tsx       ← keep
└── REFACTOR_PLAN.md                 ← keep (update status)
```

### MemberFormModal — Props Design

```typescript
interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = create mode, Member = edit mode */
  member: Member | null;
  /** Which form sections to show */
  sections?: MemberFormSections;
  /** Available categories (required when showing category picker) */
  categories?: Category[];
  /** Pre-set category (e.g., when creating from lineup context) */
  defaultCategoryId?: string;
  /** Called after successful create/update */
  onSuccess: (member: Member) => void;
  /** Show payments tab in edit mode */
  showPaymentsTab?: boolean;
}

interface MemberFormSections {
  basic: boolean;       // always true
  contact: boolean;     // default: false
  parent: boolean;      // default: false
  medical: boolean;     // default: false
  additional: boolean;  // default: false
}
```

### Section Presets

```typescript
// Quick creation (matches context) — just basic fields
const QUICK_CREATE: MemberFormSections = {
  basic: true, contact: false, parent: false, medical: false, additional: false
};

// Full creation (lineups context) — all sections
const FULL_CREATE: MemberFormSections = {
  basic: true, contact: true, parent: true, medical: true, additional: true
};

// Full edit (admin context) — all sections + payments tab
const FULL_EDIT: MemberFormSections = {
  basic: true, contact: true, parent: true, medical: true, additional: true
};
```

### useMemberForm Hook

```typescript
function useMemberForm(member: Member | null) {
  // Returns:
  // - formData (typed correctly for create vs edit)
  // - updateField(field, value) with auto error clearing
  // - errors (field-level validation)
  // - isLoading
  // - handleSubmit() — calls useMembers().createMember or updateMember
  //                     + useMemberMetadata() for metadata fields
  // - reset()
}
```

---

## 6. Migration Plan

### Phase 1: Create new shared components (no breaking changes)

| Step | Action | Files |
|---|---|---|
| 1.1 | Fix `MemberMetadaFormData` typo → `MemberMetadataFormData` | `types/entities/member/data/memberMetadata.ts` + all imports |
| 1.2 | Create `useMemberForm` hook | `shared/members/hooks/useMemberForm.ts` |
| 1.3 | Create form section components | `shared/members/modals/sections/*.tsx` |
| 1.4 | Create `MemberFormModal` | `shared/members/modals/MemberFormModal.tsx` |
| 1.5 | Add section presets to config | `shared/members/config/memberFormConfig.ts` |
| 1.6 | Run `/generate-barrels` | barrel files |

### Phase 2: Migrate consumers (one at a time)

| Step | Replace | With | Risk |
|---|---|---|---|
| 2.1 | `shared/members/modals/MemberModal.tsx` + `MemberInfoForm.tsx` | `MemberFormModal` with `FULL_EDIT` sections | Medium — used in admin + coach members pages |
| 2.2 | `admin/matches/CreateMemberModal.tsx` | `MemberFormModal` with `QUICK_CREATE` sections | Low — isolated usage |
| 2.3 | `coaches/lineups/CreateMemberModal.tsx` | `MemberFormModal` with `FULL_CREATE` sections | High — also used by AddMemberModal, has direct DB calls |
| 2.4 | Update `coaches/lineups/AddMemberModal.tsx` | Point embedded create to new `MemberFormModal` | Low — callback adapter |

### Phase 3: Cleanup

| Step | Action |
|---|---|
| 3.1 | Delete old `MemberInfoForm.tsx` |
| 3.2 | Delete old `MemberModal.tsx` |
| 3.3 | Delete `coaches/lineups/CreateMemberModal.tsx` |
| 3.4 | Delete `admin/matches/CreateMemberModal.tsx` |
| 3.5 | Remove `MemberMetadaFormData` type (replace with `MemberFormModal` internal state) |
| 3.6 | Run `/generate-barrels` |
| 3.7 | Verify `npm run tsc && npm run lint` |

---

## 7. Dialog vs UnifiedModal Decision

The project is migrating from `UnifiedModal` to `Dialog`. Key differences:

| | UnifiedModal | Dialog |
|---|---|---|
| Footer | `isFooterWithActions` + `onPress` | `onSubmit` |
| Danger | Not supported | `dangerAction` prop |
| Custom footer | `footer` prop | Not supported |
| Heading | Custom `Heading` + `hSize` | Uses `Heading size={2}` |
| classNames | Hardcoded | Mergeable (recently fixed) |

**Recommendation:** Build `MemberFormModal` on `Dialog` since it's the target pattern. The payments tab needs a tabbed layout inside the Dialog body — this works fine since Dialog accepts `children`.

---

## 8. Risks & Mitigations

### Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| `onSuccess` callback signature change breaks consumers | High | Medium | Keep same `(member: Member) => void` signature as current MemberModal |
| Metadata save fails after member create succeeds | High | Low | Wrap in transaction-like logic: if metadata fails, show error but don't roll back member |
| Section visibility adds complexity | Medium | Low | Default to `QUICK_CREATE` — sections are additive, not subtractive |
| AddMemberModal integration breaks | Medium | Medium | Test lineup flow end-to-end after migration |
| Payments tab regression | Medium | Low | No changes to MemberPaymentsTab — just re-mount inside new modal |

### Negatives / Trade-offs

1. **More abstraction** — Section-based form is more complex than individual components. However, the alternative (3 separate components that drift apart) is worse.
2. **Larger single component** — `MemberFormModal` will be ~150-200 lines. Mitigated by extracting sections into sub-components.
3. **Migration effort** — Touching 4+ pages that use member modals. Each migration should be a separate commit for easy rollback.
4. **`useMemberForm` hook complexity** — Needs to handle both create (no metadata) and create+metadata flows. Keep it focused: form state + validation only, let the hook call `useMembers` and `useMemberMetadata` internally.

---

## 9. What NOT to Change

- `BulkEditModal` — different purpose (bulk operations), keep separate
- `MemberPaymentsTab` / `PaymentFormModal` — working well, just re-mount in new modal
- `MembersInternalSection` / `MemberTableTab` — table display, unrelated
- `useMemberModals` / `useMemberSave` hooks — keep, update to work with new modal
- API routes and `useMembers` hook — no changes needed, new form just calls existing methods

---

## 10. Success Criteria

- [ ] Single `MemberFormModal` component handles all member create/edit flows
- [ ] No direct Supabase calls in any modal component
- [ ] Field-level validation via `useMembers` hook pattern
- [ ] Card-based section UI preserved from lineups CreateMemberModal
- [ ] All current functionality preserved (lineups callback, matches callback, admin edit+payments)
- [ ] `npm run tsc` and `npm run lint` pass
- [ ] Existing tests still pass
- [ ] `MemberMetadaFormData` typo fixed everywhere