# Implementation Plan: GenderSelect & GenderFilter

## Why

Gender selection appears in 5+ places with two inconsistent patterns:

| Problem | Where |
|---|---|
| Raw HeroUI `Select` instead of project `Choice` | `BulkEditModal`, `CreateMemberModal` (×2) |
| Hardcoded plural labels "Muži"/"Ženy" (should be "Muž"/"Žena") | `MembersListFilters` |
| Dead code bug — stray `Choice` block with undefined `formData`/`setFormData` | `MembersListFilters` lines 103–115 |
| `Genders.EMPTY` sentinel leak into component code | `MembersListFilters` |

Two focused components solve all of these.

---

## Components in This Folder

```
src/components/ui/client/gender/
├── GenderSelect.tsx          ← Step 1
├── GenderFilter.tsx          ← Step 2
└── __tests__/
    ├── GenderSelect.test.tsx ← Step 6
    └── GenderFilter.test.tsx ← Step 6
```

---

## Step 1 — `GenderSelect.tsx` (form, required)

**Use case:** assigning a member's sex in a form. Always has a value.

```tsx
'use client';

import {Choice} from '@/components/ui/client/choice/Choice';
import {Genders} from '@/enums';
import {translations} from '@/lib/translations';

interface GenderSelectProps {
  value: Genders.MALE | Genders.FEMALE;
  onChange: (value: Genders.MALE | Genders.FEMALE) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isDisabled?: boolean;
}

const ITEMS = [
  {key: Genders.MALE,   label: translations.common.gender.male},
  {key: Genders.FEMALE, label: translations.common.gender.female},
];

export const GenderSelect = ({value, onChange, size, className, isDisabled}: GenderSelectProps) => (
  <Choice
    disallowEmptySelection
    value={value}
    onChange={(v) => onChange(v as Genders.MALE | Genders.FEMALE)}
    items={ITEMS}
    label={translations.members.modals.memberForm.sex}
    isRequired
    size={size}
    className={className}
    isDisabled={isDisabled}
  />
);
```

**Reuses:**
- `Choice` — `src/components/ui/client/choice/Choice.tsx`
- `Genders` — `src/enums/genders.ts`
- `translations.common.gender.{male,female}` — Czech labels ("Muž", "Žena")
- `translations.members.modals.memberForm.sex` — field label ("Pohlaví")

---

## Step 2 — `GenderFilter.tsx` (table filter, optional)

**Use case:** optional gender filter. `null` = "all genders" (no filter active).

```tsx
'use client';

import {Choice} from '@/components/ui/client/choice/Choice';
import {Genders} from '@/enums';
import {translations} from '@/lib/translations';

interface GenderFilterProps {
  value: Genders.MALE | Genders.FEMALE | null;
  onChange: (value: Genders.MALE | Genders.FEMALE | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ITEMS = [
  {key: Genders.MALE,   label: translations.common.gender.male},
  {key: Genders.FEMALE, label: translations.common.gender.female},
];

export const GenderFilter = ({value, onChange, size, className}: GenderFilterProps) => (
  <Choice
    value={value}
    onChange={(v) => onChange(v as Genders.MALE | Genders.FEMALE | null)}
    items={ITEMS}
    placeholder={translations.common.gender.allGenders}
    ariaLabel={translations.members.table.columns.gender}
    size={size}
    className={className}
  />
);
```

`null` from `Choice`'s nullable mode maps naturally to "no filter selected". No `Genders.EMPTY` sentinel leaks out of the component.

---

## Step 3 — Add translation key

**File:** `src/lib/translations/common.ts`

Add to the `gender` object:
```ts
allGenders: 'Všechna pohlaví',
```

---

## Step 4 — Run `/generate-barrels`

Regenerates `src/components/ui/client/index.ts` to export both components.

---

## Step 5 — Replace all usages

### `MembersListFilters.tsx` (fix bug + use `GenderFilter`)
**File:** `src/app/admin/members/components/MembersListFilters.tsx`
- Remove dead `Choice` block at lines 103–115 (references non-existent `formData`/`setFormData`)
- Replace inline `Select` sex filter with `<GenderFilter>`
- Map `Genders.EMPTY` ↔ `null` at the call site in `onChange`

### `MemberInfoForm.tsx` (use `GenderSelect`)
**File:** `src/components/shared/members/modals/MemberInfoForm.tsx`
- Replace the `Choice` sex block with `<GenderSelect>`
- Remove `genderItems` local variable (no longer needed)
- Preserve `onChange` side-effect: `category_id: ''` when sex changes

### `BulkEditModal.tsx` (use `GenderFilter` — optional field)
**File:** `src/app/admin/members/components/BulkEditModal.tsx`
- Replace inline `Select` sex block with `<GenderFilter>` (field is optional = "leave unchanged")
- Preserve `onChange` side-effect: clear `category` when sex changes
- Remove raw HeroUI `Select` + `SelectItem` imports if no longer used

### `CreateMemberModal.tsx` ×2 (use `GenderSelect`)
**Files:**
- `src/app/coaches/lineups/components/CreateMemberModal.tsx`
- `src/app/admin/matches/components/CreateMemberModal.tsx`
- Replace inline gender select with `<GenderSelect>`

---

## Step 6 — Tests

**Pattern:** follow `src/components/ui/client/checkbox/__tests__/Checkbox.test.tsx`
- Mock `@heroui/react` Select via `vi.mock`
- Capture callbacks to trigger without DOM simulation

### `GenderSelect.test.tsx`
- Renders with "Pohlaví" label
- Shows "Muž" and "Žena" options
- Forwards `value` as selected key
- Calls `onChange` with correct `Genders` enum value
- Forwards `isDisabled`, `size`, `className`

### `GenderFilter.test.tsx`
- Renders placeholder "Všechna pohlaví" when value is `null`
- Shows "Muž" and "Žena" options
- Calls `onChange` with `Genders.MALE`/`Genders.FEMALE` on selection
- Calls `onChange(null)` when selection is cleared

---

## Files Summary

| File | Action |
|---|---|
| `src/components/ui/client/gender/GenderSelect.tsx` | **Create** |
| `src/components/ui/client/gender/GenderFilter.tsx` | **Create** |
| `src/components/ui/client/gender/__tests__/GenderSelect.test.tsx` | **Create** |
| `src/components/ui/client/gender/__tests__/GenderFilter.test.tsx` | **Create** |
| `src/lib/translations/common.ts` | Add `allGenders` key |
| `src/components/ui/client/index.ts` | Auto-updated by `/generate-barrels` |
| `src/app/admin/members/components/MembersListFilters.tsx` | Fix dead-code bug + use `GenderFilter` |
| `src/components/shared/members/modals/MemberInfoForm.tsx` | Use `GenderSelect` |
| `src/app/admin/members/components/BulkEditModal.tsx` | Use `GenderFilter` |
| `src/app/coaches/lineups/components/CreateMemberModal.tsx` | Use `GenderSelect` |
| `src/app/admin/matches/components/CreateMemberModal.tsx` | Use `GenderSelect` |

---

## Verification

1. `npm run tsc` — no type errors
2. `npm run lint` — no lint errors
3. `nx run hazenasvinov-nextjs:test` — all tests pass including new gender tests
4. Manual smoke: gender filter shows "Všechna pohlaví" placeholder, clears correctly
5. Manual smoke: member form gender select shows "Muž"/"Žena", clears category on change
6. Manual smoke: bulk edit modal gender optional, category clears when sex changes