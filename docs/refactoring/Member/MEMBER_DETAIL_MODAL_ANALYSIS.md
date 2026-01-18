# Member Detail Modal - Issues & Improvements

## Overview

Analysis of `MemberDetailModal` and `MemberInfoTab` components to identify errors and suggest improvements for creating a unified member modal that replaces `MemberFormModal`.

**Date:** 2025-10-21
**Status:** 🔴 **Needs Refactoring**

---

## Current Issues

### 🔴 Critical Issues

#### 1. MemberInfoTab - Missing setFormData Prop
**File:** `src/app/admin/members/components/MemberInfoTab.tsx`

**Problem:**
```typescript
// Line 11-15: Interface requires setFormData
interface MemberInfoTabProps {
  formData: BaseMember | null;
  setFormData: (data: BaseMember) => void; // ← Required!
  categories: Category[];
  isEditMode?: boolean;
}

// Line 41: But MemberDetailModal doesn't pass it!
<MemberInfoTab formData={member} categories={categories}/>
//             ↑ Missing setFormData and isEditMode!
```

**Impact:**
- All input fields in MemberInfoTab will throw errors when trying to call `setFormData`
- TypeScript error: Property 'setFormData' is missing

---

#### 2. MemberDetailModal - Incorrect Props Interface
**File:** `src/app/admin/members/components/MemberDetailModal.tsx`

**Problem:**
```typescript
// Lines 14-20: Props interface doesn't match usage
interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;  // ← What should this do?
  member: BaseMember | null;
  isEditMode?: boolean;  // ← Never set!
}

// Line 43: Payments tab disabled when NOT in edit mode
<Tab key="payments" title="Členské poplatky" disabled={!isEditMode}>
  <MemberPaymentsTab member={member}/>
</Tab>
```

**Issues:**
- `onSubmit` is passed but never explained - what should it submit?
- `isEditMode` is never set to `true` - payments tab always disabled
- No state management for form data
- No way to save changes

---

#### 3. Missing State Management

**Problem:**
The modal has NO state management for edited form data!

```typescript
// ❌ CURRENT - No state, no way to track changes
<MemberInfoTab formData={member} categories={categories}/>

// ✅ NEEDED - State to track edits
const [formData, setFormData] = useState(member);
<MemberInfoTab formData={formData} setFormData={setFormData} />
```

---

### ⚠️ Medium Issues

#### 4. No Mode Switching

**Problem:** No way to switch between view/edit modes

**Current behavior:**
- Always in view mode (no setFormData)
- Payments tab always disabled
- Can't edit member info

**Needed:**
```typescript
const [isEditMode, setIsEditMode] = useState(false);

// View mode: Show info, can't edit
// Edit mode: Allow editing, show save button
```

---

#### 5. Inconsistent Component Usage

**Problem:** Two modals for same purpose:
- `MemberFormModal` - For add/edit
- `MemberDetailModal` - For view (supposed to replace FormModal)

**Current duplication:**
```
MemberFormModal (182 lines)
  - Has form fields
  - Has state management
  - Works for add/edit

MemberDetailModal (49 lines)
  - Has tabs (Info, Payments)
  - Missing state management
  - Broken for editing

MemberInfoTab (177 lines)
  - Has same form fields as MemberFormModal
  - Expects setFormData but doesn't receive it
```

---

### 🟡 Minor Issues

#### 6. Hardcoded Czech Text

```typescript
// MemberDetailModal.tsx line 43
<Tab key="payments" title="Členské poplatky" disabled={!isEditMode}>

// Should use translations:
<Tab key="payments" title={t.tabs.payments} disabled={!isEditMode}>
```

#### 7. Unused onSubmit Prop

```typescript
// Line 17, 34: onSubmit passed but never used
onSubmit: () => void;
// ...
onPress={onSubmit}  // What does this do?
```

#### 8. Missing Validation

No form validation for required fields when saving.

---

## Comparison: MemberFormModal vs MemberDetailModal

| Feature | MemberFormModal | MemberDetailModal |
|---------|----------------|-------------------|
| **State Management** | ✅ Yes | ❌ No |
| **Form Fields** | ✅ Works | ❌ Broken |
| **Add Mode** | ✅ Yes | ❌ No |
| **Edit Mode** | ✅ Yes | ❌ Broken |
| **View Mode** | ❌ No | ✅ Yes (sort of) |
| **Payments Tab** | ❌ No | ✅ Yes |
| **Tabs** | ❌ No | ✅ Yes (Info, Payments) |
| **Save Function** | ✅ Yes | ❌ No |
| **Props Correctly Passed** | ✅ Yes | ❌ No |

---

## Recommended Solution

### Option 1: Fix MemberDetailModal (Recommended)

Make `MemberDetailModal` a true unified modal that handles **view, add, and edit** modes.

#### Required Changes:

1. **Add Mode State**
```typescript
export default function MemberDetailModal({
  isOpen,
  onClose,
  onSubmit,
  member,
  mode = 'view', // 'view' | 'add' | 'edit'
}: MemberDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(mode === 'edit' || mode === 'add');
  const [formData, setFormData] = useState<BaseMember>(
    member || getDefaultMember()
  );
}
```

2. **Pass Props to MemberInfoTab**
```typescript
<Tab key="info" title="Informace">
  <MemberInfoTab
    formData={formData}
    setFormData={setFormData} // ✅ NOW PROVIDED
    categories={categories}
    isEditMode={isEditMode}   // ✅ NOW PROVIDED
  />
</Tab>
```

3. **Add Edit Toggle Button**
```typescript
// In view mode, show "Edit" button
{!isEditMode && mode === 'view' && (
  <Button onPress={() => setIsEditMode(true)}>
    Edit Member
  </Button>
)}

// In edit mode, show "Cancel" button
{isEditMode && (
  <Button onPress={() => {
    setIsEditMode(false);
    setFormData(member); // Reset changes
  }}>
    Cancel
  </Button>
)}
```

4. **Enable Payments Tab Properly**
```typescript
<Tab
  key="payments"
  title={t.tabs.payments}
  disabled={mode === 'add'} // Only disable for new members
>
  <MemberPaymentsTab member={formData} />
</Tab>
```

5. **Handle Save**
```typescript
const handleSave = async () => {
  if (mode === 'add') {
    await createMember(formData);
  } else {
    await updateMember(formData);
  }
  onSubmit(); // Callback to parent
  onClose();
};
```

---

### Option 2: Keep Both Modals (Not Recommended)

Keep `MemberFormModal` for add/edit, use `MemberDetailModal` only for view.

**Cons:**
- Code duplication
- Two modals doing similar things
- Confusing for developers
- More maintenance

---

## Detailed Implementation Plan

### Step 1: Update MemberDetailModal Interface

```typescript
type MemberModalMode = 'view' | 'add' | 'edit';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void; // Called after successful save
  member?: BaseMember | null; // Optional for add mode
  mode: MemberModalMode;
}
```

### Step 2: Add State Management

```typescript
export default function MemberDetailModal({
  isOpen,
  onClose,
  onSubmit,
  member,
  mode,
}: MemberDetailModalProps) {
  const {categories} = useAppData();

  // Determine if in edit mode
  const [isEditMode, setIsEditMode] = useState(
    mode === 'add' || mode === 'edit'
  );

  // Default member for add mode
  const getDefaultMember = (): BaseMember => ({
    id: '',
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: null,
    sex: Genders.MALE,
    category_id: '',
    functions: [],
    created_at: '',
    updated_at: '',
    is_active: true,
  });

  // Form state
  const [formData, setFormData] = useState<BaseMember>(
    member || getDefaultMember()
  );

  // Reset when member changes
  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData(getDefaultMember());
    }
    setIsEditMode(mode === 'add' || mode === 'edit');
  }, [member, mode]);

  // Handle save
  const handleSave = async () => {
    try {
      if (mode === 'add') {
        await createMember(formData);
      } else {
        await updateMember(formData);
      }
      onSubmit(); // Trigger refresh in parent
      onClose();
    } catch (error) {
      console.error('Failed to save member:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (mode === 'view') {
      setIsEditMode(false);
      setFormData(member!);
    } else {
      onClose();
    }
  };

  // ...rest of component
}
```

### Step 3: Update Modal Title & Actions

```typescript
// Dynamic title
const getTitle = () => {
  if (mode === 'add') return t.modals.addMember;
  if (isEditMode) return t.modals.editMember;
  return `${formData.registration_number} - ${formData.name} ${formData.surname}`;
};

// Dynamic footer
const getFooterActions = () => {
  if (mode === 'view' && !isEditMode) {
    return (
      <Button onPress={() => setIsEditMode(true)}>
        Edit Member
      </Button>
    );
  }

  if (isEditMode) {
    return (
      <>
        <Button variant="light" onPress={handleCancel}>
          Cancel
        </Button>
        <Button color="primary" onPress={handleSave}>
          Save
        </Button>
      </>
    );
  }

  return null;
};

return (
  <UnifiedModal
    isOpen={isOpen}
    onClose={onClose}
    size="4xl"
    title={getTitle()}
    footer={getFooterActions()} // Custom footer
  >
    {/* Tabs */}
  </UnifiedModal>
);
```

### Step 4: Fix MemberInfoTab Rendering

```typescript
<Tab key="info" title={t.tabs.info}>
  <MemberInfoTab
    formData={formData}
    setFormData={setFormData} // ✅ Provided
    categories={categories}
    isEditMode={isEditMode}   // ✅ Provided
  />
</Tab>

<Tab
  key="payments"
  title={t.tabs.payments}
  disabled={mode === 'add'} // Only disable for new members
>
  {mode !== 'add' && (
    <MemberPaymentsTab member={formData} />
  )}
</Tab>
```

### Step 5: Update Page Usage

```typescript
// In page.tsx.backup

// Add mode
const openAddWithModal = () => {
  detailModal.onOpen(); // Use detail modal instead of form modal
  setModalMode('add');
};

// Edit mode
const openEditInternal = (member: MemberInternal) => {
  setSelectedMember(member);
  setModalMode('edit');
  detailModal.onOpen();
};

// View mode
const openDetailInternal = (member: MemberInternal) => {
  setSelectedMember(member);
  setModalMode('view');
  detailModal.onOpen();
};

// Render
<MemberDetailModal
  isOpen={detailModal.isOpen}
  onClose={detailModal.onClose}
  onSubmit={refreshInternal}
  member={selectedMember}
  mode={modalMode}
/>
```

---

## Benefits of Unified Modal

### 1. Single Source of Truth
- One modal handles all member operations
- No code duplication
- Easier to maintain

### 2. Better UX
- Can view then edit without closing modal
- Switch between info and payments seamlessly
- Consistent interface

### 3. Cleaner Code
- Remove `MemberFormModal` entirely
- Reduce number of components
- Clearer responsibility

---

## Migration Path

### Phase 1: Fix MemberDetailModal
1. Add state management
2. Pass props to MemberInfoTab
3. Add mode support
4. Test view/edit/add modes

### Phase 2: Update Page.tsx
1. Use MemberDetailModal for all operations
2. Remove MemberFormModal imports
3. Update handlers

### Phase 3: Cleanup
1. Delete MemberFormModal.tsx
2. Update tests
3. Update documentation

---

## Testing Checklist

After implementing changes:

- [ ] **View Mode**
  - [ ] Opens with member data
  - [ ] Fields are read-only
  - [ ] Can switch to payments tab
  - [ ] "Edit" button visible

- [ ] **Edit Mode (from View)**
  - [ ] Click "Edit" enables fields
  - [ ] Can modify member info
  - [ ] "Save" and "Cancel" buttons visible
  - [ ] Cancel restores original data
  - [ ] Save updates member

- [ ] **Add Mode**
  - [ ] Opens with empty form
  - [ ] All fields editable
  - [ ] Payments tab disabled
  - [ ] Save creates new member

- [ ] **Validation**
  - [ ] Required fields validated
  - [ ] Can't save without name/surname
  - [ ] Category filtered by sex

- [ ] **State Management**
  - [ ] Changes tracked correctly
  - [ ] Cancel reverts changes
  - [ ] Save persists changes

---

## Code Example: Fixed MemberDetailModal

```typescript
'use client';

import React, {useEffect, useState} from 'react';
import {Tab, Tabs, Button} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {useAppData} from '@/contexts';
import {BaseMember, Genders} from '@/types';
import {useMembers} from '@/hooks';

import MemberInfoTab from './MemberInfoTab';
import MemberPaymentsTab from './MemberPaymentsTab';

type MemberModalMode = 'view' | 'add' | 'edit';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  member?: BaseMember | null;
  mode: MemberModalMode;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  onSubmit,
  member,
  mode,
}: MemberDetailModalProps) {
  const {categories} = useAppData();
  const {createMember, updateMember} = useMembers();

  const [isEditMode, setIsEditMode] = useState(
    mode === 'add' || mode === 'edit'
  );

  const getDefaultMember = (): BaseMember => ({
    id: '',
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: null,
    sex: Genders.MALE,
    category_id: '',
    functions: [],
    created_at: '',
    updated_at: '',
    is_active: true,
  });

  const [formData, setFormData] = useState<BaseMember>(
    member || getDefaultMember()
  );

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData(getDefaultMember());
    }
    setIsEditMode(mode === 'add' || mode === 'edit');
  }, [member, mode, isOpen]);

  const handleSave = async () => {
    try {
      if (mode === 'add') {
        await createMember({
          name: formData.name,
          surname: formData.surname,
          registration_number: formData.registration_number,
          date_of_birth: formData.date_of_birth || undefined,
          sex: formData.sex,
          functions: formData.functions,
        }, formData.category_id);
      } else {
        await updateMember({
          id: formData.id,
          name: formData.name,
          surname: formData.surname,
          registration_number: formData.registration_number,
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          functions: formData.functions,
          category_id: formData.category_id,
        });
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to save member:', error);
    }
  };

  const handleCancel = () => {
    if (mode === 'view') {
      setIsEditMode(false);
      if (member) setFormData(member);
    } else {
      onClose();
    }
  };

  const getTitle = () => {
    if (mode === 'add') return 'Přidat člena';
    if (isEditMode) return 'Upravit člena';
    return `${formData.registration_number} - ${formData.name} ${formData.surname}`;
  };

  if (!formData && mode !== 'add') {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      title={getTitle()}
      isFooterWithActions={false}
    >
      <div className="space-y-4">
        <Tabs aria-label="Member details">
          <Tab key="info" title="Informace">
            <MemberInfoTab
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              isEditMode={isEditMode}
            />
          </Tab>
          <Tab
            key="payments"
            title="Členské poplatky"
            disabled={mode === 'add'}
          >
            {mode !== 'add' && <MemberPaymentsTab member={formData} />}
          </Tab>
        </Tabs>

        {/* Custom Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {mode === 'view' && !isEditMode && (
            <Button
              color="primary"
              onPress={() => setIsEditMode(true)}
            >
              Upravit
            </Button>
          )}

          {isEditMode && (
            <>
              <Button
                variant="light"
                onPress={handleCancel}
              >
                Zrušit
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
              >
                Uložit
              </Button>
            </>
          )}
        </div>
      </div>
    </UnifiedModal>
  );
}
```

---

**Analysis Date:** 2025-10-21
**Priority:** 🔴 High - Modal is broken and can't be used for editing
**Estimated Effort:** 4-6 hours
**Impact:** High - Core CRUD functionality
