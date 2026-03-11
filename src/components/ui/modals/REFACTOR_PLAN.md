# UnifiedModal — Usage Analysis & Refactor Plan

## Overview

**40 usages** found across the codebase (excluding 2 dead references).

---

## Key Findings

### 1. Custom footer duplicates `isFooterWithActions` (12 modals)

12 modals use a custom `footer` prop to render Cancel + Save/Add buttons — the **exact same pattern** that `isFooterWithActions` already handles. This creates duplicated logic and inconsistent button styling.

**Affected modals:**

| Modal | Path | Notes |
|---|---|---|
| AddMatchModal | `admin/matches/components/` | Custom footer with Cancel + Add |
| LineupModal | `coaches/lineups/components/` | Custom footer with Cancel + Save/Add |
| CommentModal | `admin/components/modals/` | Custom footer with Cancel + Add/Save |
| TodoModal | `admin/components/modals/` | Custom footer with Cancel + Add/Save |
| ClubFormModal | `admin/clubs/components/` | Custom footer with Cancel + Save/Add |
| TrainingSessionModal | `coaches/attendance/components/` | Custom footer with Cancel + Create/Save |
| SeasonModal | `admin/seasons/components/` | Custom footer with Cancel + Save/Add |
| CommitteeModal | `admin/committees/components/` | Custom footer with Cancel + Save/Add |
| BlogPostModal | `admin/posts/components/` | Custom footer with Cancel + Create/Save |
| TrainingSessionGenerator | `coaches/attendance/components/` | Custom footer with Cancel + Create (conditional) |

**Exception (keep custom footer):**
- `VideoSelectionModal` — footer has count label + 2 buttons (non-standard layout)
- `MatchSelectionModal` — close-only footer
- `AddMemberModal` — more complex footer logic

**Refactor:** Migrate the 10 straightforward modals to use `isFooterWithActions` + `onPress` + `onPressButtonLabel` + `isDisabled` + `isLoading`.

---

### 2. Broken modal — missing footer

**`src/app/admin/clubs/[id]/page.tsx`** — inline edit modal passes `onSubmit` as prop (not a valid UnifiedModal prop). The modal has **no visible footer** — users cannot save.

**Fix:** Add `isFooterWithActions` + `onPress={handleUpdateClub}`.

---

### 3. Duplicate PaymentFormModal

Two nearly identical components:
- `src/app/admin/members/components/PaymentFormModal.tsx`
- `src/components/shared/members/modals/PaymentFormModal.tsx`

**Refactor:** Remove the admin duplicate, import from shared everywhere.

---

### 4. Hardcoded Czech strings instead of translations

Several modals use hardcoded Czech strings instead of the translation system:

| Modal | Hardcoded string |
|---|---|
| CreateExternalPlayerModal | `"Vytvořit externího hráče"` |
| CreateMemberModal (lineups) | `"Přidat nového člena"` |
| AddMemberModal | `"Přidat člena do soupisky"` |
| VideoSelectionModal | `"Vyberte video"`, `"Zavřít"` |
| MatchSelectionModal | `"Vyberte zápas"`, `"Zavřít"` |
| clubs/[id] inline modal | `"Upravit klub"` |
| LineupCoachEditModal | `` `Upravit trenéra: ${...}` `` |
| PaymentFormModal (both) | `"Upravit platbu"`, `"Přidat platbu"` |

**Refactor:** Move all to translation files.

---

### 5. Missing `isLoading` / `isDisabled` on custom footers

Modals using custom footers often lack consistent loading/disabled state handling that `isFooterWithActions` provides for free. Examples:

- `AddMatchModal` — no loading state on submit button
- `CommentModal` — no loading state
- `CommitteeModal` — no loading state
- `SeasonModal` — no loading state

Migrating to `isFooterWithActions` fixes this automatically.

---

### 6. Inconsistent children wrapper

Three patterns exist:
- `<div className="space-y-4">` — most common (good)
- `<div className="space-y-6">` — some modals
- No wrapper div — children placed directly (relies on body grid via `classNames`)

This is cosmetic and low-priority but worth noting.

---

## Refactor Plan

### Phase 1: Fix broken modal (Critical)

**File:** `src/app/admin/clubs/[id]/page.tsx`

Replace the broken inline modal:
```diff
  <UnifiedModal
    isOpen={modal.Edit.isOpen}
    onClose={modal.Edit.onClose}
    title="Upravit klub"
    size="lg"
-   onSubmit={handleUpdateClub}
+   isFooterWithActions
+   onPress={handleUpdateClub}
  >
```

---

### Phase 2: Migrate custom footers to `isFooterWithActions` (10 modals)

For each modal, remove the custom `footer` prop/variable and use the built-in pattern:

```diff
  <UnifiedModal
    isOpen={isOpen}
    onClose={onClose}
    title={modalTitle}
-   footer={footer}
+   isFooterWithActions
+   onPress={handleSubmit}
+   onPressButtonLabel={isEditMode ? translations.common.actions.save : translations.common.actions.add}
+   isDisabled={!isValid}
+   isLoading={isLoading}
  >
```

**Order of migration:**
1. [x] `CommentModal` — simplest (2 fields)
2. [x] `CommitteeModal` — simple (5 fields)
3. `SeasonModal` — simple (4 fields)
4. `LineupModal` — simple (2 fields)
5. `TodoModal` — medium (5 fields)
6. `ClubFormModal` — medium (many fields)
7. `AddMatchModal` — medium (6 fields)
8. `TrainingSessionModal` — medium (4 fields)
9. `BlogPostModal` — larger form
10. `TrainingSessionGenerator` — conditional footer (may need `isDisabled` logic for conditional visibility — verify `isOnlyCloseButton` can replace the conditional button display)

**Note on `TrainingSessionGenerator`:** The "Create" button only appears after preview is generated. This can be handled with `isOnlyCloseButton={!hasGeneratedSessions}` toggling between close-only and close+action modes.

---

### Phase 3: Add missing `onPressButtonLabel` support

Some modals need custom action button labels (not just "Uložit"):
- Add mode: `translations.common.actions.add` / `translations.common.actions.create`
- Edit mode: `translations.common.actions.save`

Verify that `translations.common.actions` has all needed labels. Add if missing:
- `add` — "Přidat"
- `create` — "Vytvořit"
- `save` — "Uložit"
- `send` — "Odeslat" (already used by PasswordResetModal)

---

### Phase 4: Deduplicate PaymentFormModal

1. Verify both versions are identical (or merge differences)
2. Keep `src/components/shared/members/modals/PaymentFormModal.tsx`
3. Delete `src/app/admin/members/components/PaymentFormModal.tsx`
4. Update imports in admin members page
5. Run `/generate-barrels`

---

### Phase 5: Move hardcoded strings to translations

Add missing translation keys to relevant files:
- `src/lib/translations/members.ts` — member modal titles
- `src/lib/translations/lineups.ts` or `lineupManager.ts` — lineup modal titles
- `src/lib/translations/videos.ts` — video selection strings
- `src/lib/translations/matches.ts` — match selection strings
- `src/lib/translations/clubs.ts` — club edit title
- `src/lib/translations/coachPortal.ts` — coach-specific strings
- `src/lib/translations/common.ts` — shared actions ("Zavřít", etc.)

Update the index barrel: `src/lib/translations/index.ts` if new files are added.

---

## Out of Scope (not recommended to change)

- **Modals with genuinely custom footers** (VideoSelectionModal, MatchSelectionModal, AddMemberModal, DeleteConfirmationModal) — their footer logic differs enough to warrant custom implementations
- **Children wrapper inconsistency** — cosmetic, not worth a sweeping change
- **`isOnlyCloseButton` usage** — only 1 modal uses it (LineupPlayerSelectionModal), pattern is fine

---

## Impact Summary

| Phase | Modals affected | Risk | Effort |
|---|---|---|---|
| 1. Fix broken modal | 1 | Low | ~5 min |
| 2. Migrate custom footers | 10 | Low-Medium | ~1-2 hours |
| 3. Button labels | 0 (translation files) | Low | ~15 min |
| 4. Deduplicate PaymentFormModal | 2 → 1 | Medium | ~30 min |
| 5. Hardcoded strings | ~10 | Low | ~30 min |

**Total: ~15 files changed, ~3 hours of work.**