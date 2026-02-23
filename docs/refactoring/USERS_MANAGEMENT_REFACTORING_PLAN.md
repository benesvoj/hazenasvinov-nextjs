# Users Management Refactoring Plan

> **Status**: Draft
> **Created**: 2026-01-29
> **Author**: Claude Code
> **Related Files**: `src/app/admin/users/`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Implementation Plan](#4-implementation-plan)
5. [File Changes](#5-file-changes)
6. [Migration Strategy](#6-migration-strategy)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Executive Summary

### Goals

1. **Separate concerns**: Extract API logic from UI components into dedicated hooks
2. **Fix modal control**: Enable parent component to control modals (fix broken "Add User" action)
3. **Improve maintainability**: Reduce `UsersTab` from 460+ lines to ~150 lines
4. **Enable testability**: Make API logic testable in isolation

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| UsersPage refactoring | API route changes |
| UsersTab simplification | Database schema changes |
| New `useUserManagement` hook | Authentication changes |
| Modal control restructuring | Other admin pages |

---

## 2. Current Architecture Analysis

### 2.1 Component Structure

```
src/app/admin/users/
├── page.tsx                    # UsersPage - main page component
└── components/
    ├── UsersTab.tsx            # Table + API logic + Modals (460+ lines)
    ├── UserFormModal.tsx       # Form modal with role management
    ├── PasswordResetModal.tsx  # Password reset confirmation
    ├── RoleAssignmentModal.tsx # Role assignment after user creation
    ├── CategorySelectionModal.tsx
    └── LoginLogsTab.tsx
```

### 2.2 Current Data Flow

```
UsersPage
│
├── useFetchUsers() ──────────────────────────┐
│   └── Returns: users, loginLogs, loading... │
│                                             │
├── useModal() ─── NOT USED                   │
│                                             │
├── AdminContainer                            │
│   ├── actions: [{ onClick: () => {} }] ◄── BROKEN (empty handler)
│   │
│   └── UsersTab
│       ├── useModals('add', 'edit', 'passwordReset')
│       │
│       ├── API Calls (inline):
│       │   ├── handleSubmit()        → POST /api/manage-users
│       │   ├── handleToggleUserStatus() → POST /api/manage-users
│       │   └── handlePasswordReset() → POST /api/reset-password ◄── 404 ERROR
│       │
│       ├── State Management:
│       │   ├── selectedUser
│       │   ├── showRoleAssignment
│       │   ├── newlyCreatedUser
│       │   └── passwordResetEmail
│       │
│       └── Modals:
│           ├── UserFormModal
│           ├── PasswordResetModal
│           └── RoleAssignmentModal
```

### 2.3 Identified Problems

| # | Problem | Location | Impact |
|---|---------|----------|--------|
| 1 | Empty onClick handler | `page.tsx:67-68` | "Add User" button does nothing |
| 2 | API logic in UI component | `UsersTab.tsx:57-185` | Untestable, not reusable |
| 3 | Duplicate "Add User" buttons | Parent action + Child CardHeader | Confusing UX |
| 4 | Wrong API endpoint | `UsersTab.tsx:161` | `/api/reset-password` returns 404 |
| 5 | Mixed responsibilities | `UsersTab.tsx` | 460+ lines, hard to maintain |
| 6 | Repeated error handling | Lines 99-124, 148-153, 179-184 | Code duplication |
| 7 | Single loading state | All actions share one state | Poor UX feedback |

### 2.4 API Endpoints Used

| Action | Current Endpoint | Status |
|--------|------------------|--------|
| Create/Update User | `POST /api/manage-users` | ✅ Works |
| Toggle Block | `POST /api/manage-users` | ✅ Works |
| Password Reset | `POST /api/reset-password` | ❌ 404 Error |

**Note**: Password reset should use `/api/auth/reset-password` or `/api/auth/simple-reset-password`

---

## 3. Target Architecture

### 3.1 New Component Structure

```
src/app/admin/users/
├── page.tsx                    # UsersPage - orchestrates everything
└── components/
    ├── UsersTab.tsx            # Pure display component (~150 lines)
    ├── UserFormModal.tsx       # Form modal (unchanged internally)
    ├── PasswordResetModal.tsx  # Password reset confirmation
    ├── RoleAssignmentModal.tsx # Role assignment
    ├── CategorySelectionModal.tsx
    └── LoginLogsTab.tsx

src/hooks/admin/
└── useUserManagement.ts        # NEW: All user CRUD operations
```

### 3.2 Target Data Flow

```
UsersPage
│
├── useFetchUsers()
│   └── Returns: users, loginLogs, loading, fetchUsers...
│
├── useUserManagement() ◄── NEW HOOK
│   └── Returns: createUser, updateUser, toggleBlock, resetPassword,
│                isCreating, isUpdating, isResettingPassword, error
│
├── useModals('form', 'passwordReset', 'roleAssignment')
│   └── Modal state management
│
├── Local State:
│   ├── selectedUser
│   └── passwordResetEmail
│
├── AdminContainer
│   ├── actions: [{ onClick: handleOpenAddModal }] ◄── WORKING
│   │
│   └── UsersTab (Pure Display)
│       ├── Props: users, onEdit, onResetPassword, onToggleBlock
│       └── Renders: Table only, no API calls, no modals
│
├── UserFormModal (controlled by page)
│   ├── Props: isOpen, onClose, selectedUser, onSubmit
│   └── onSubmit calls useUserManagement().createUser/updateUser
│
├── PasswordResetModal (controlled by page)
│   └── onSubmit calls useUserManagement().resetPassword
│
└── RoleAssignmentModal (controlled by page)
```

### 3.3 Responsibility Matrix

| Component | Responsibilities | Does NOT do |
|-----------|------------------|-------------|
| **UsersPage** | Orchestration, modal state, data coordination | API calls, table rendering |
| **UsersTab** | Table rendering, cell formatting | API calls, modal management, state |
| **useUserManagement** | All API calls, loading states, error handling | UI rendering, toasts |
| **UserFormModal** | Form UI, validation display | Direct API calls |
| **Modals** | UI presentation | Business logic |

---

## 4. Implementation Plan

### Phase 1: Create `useUserManagement` Hook

**File**: `src/hooks/admin/useUserManagement.ts`

#### 1.1 Hook Interface

```typescript
interface UseUserManagementReturn {
  // Actions
  createUser: (userData: CreateUserData) => Promise<CreateUserResult>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<UpdateUserResult>;
  toggleUserBlock: (userId: string) => Promise<OperationResult>;
  resetPassword: (email: string) => Promise<OperationResult>;

  // Loading states (per action)
  isCreating: boolean;
  isUpdating: boolean;
  isTogglingBlock: boolean;
  isResettingPassword: boolean;

  // Computed
  isLoading: boolean; // Any action in progress

  // Error state
  error: string | null;
  clearError: () => void;
}
```

#### 1.2 Type Definitions

```typescript
interface CreateUserData {
  email: string;
  full_name: string;
  phone?: string;
  bio?: string;
  position?: string;
}

interface UpdateUserData extends Partial<CreateUserData> {}

interface CreateUserResult {
  success: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

interface UpdateUserResult {
  success: boolean;
  error?: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}
```

#### 1.3 Implementation Steps

1. Create file `src/hooks/admin/useUserManagement.ts`
2. Implement `createUser` function (extract from `UsersTab.tsx:57-125`)
3. Implement `updateUser` function (same source, `isEdit` branch)
4. Implement `toggleUserBlock` function (extract from `UsersTab.tsx:128-154`)
5. Implement `resetPassword` function (extract from `UsersTab.tsx:157-185`)
   - **Fix endpoint**: Use `/api/auth/reset-password` instead of `/api/reset-password`
6. Add individual loading states for each action
7. Add error handling with `error` state
8. Export hook from `src/hooks/index.ts`

---

### Phase 2: Refactor UsersPage

**File**: `src/app/admin/users/page.tsx`

#### 2.1 Add New State and Hooks

```typescript
// Existing
const { users, loading, fetchUsers, ... } = useFetchUsers(...);

// NEW: User management operations
const {
  createUser,
  updateUser,
  toggleUserBlock,
  resetPassword,
  isCreating,
  isUpdating,
  isResettingPassword,
} = useUserManagement();

// NEW: Modal state
const modals = useModals('form', 'passwordReset', 'roleAssignment');

// NEW: Local state
const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
const [passwordResetEmail, setPasswordResetEmail] = useState('');
const [newlyCreatedUser, setNewlyCreatedUser] = useState<{id: string; email: string} | null>(null);
```

#### 2.2 Add Handler Functions

```typescript
// Open modal for adding new user
const handleOpenAddModal = () => {
  setSelectedUser(null);
  modals.form.onOpen();
};

// Open modal for editing user
const handleOpenEditModal = (user: SupabaseUser) => {
  setSelectedUser(user);
  modals.form.onOpen();
};

// Open password reset modal
const handleOpenPasswordResetModal = (user: SupabaseUser) => {
  setPasswordResetEmail(user.email || '');
  modals.passwordReset.onOpen();
};

// Handle form submission
const handleFormSubmit = async (formData: UserFormData) => {
  if (selectedUser) {
    const result = await updateUser(selectedUser.id, formData);
    if (result.success) {
      showToast.success('Uživatel byl úspěšně aktualizován!');
      modals.form.onClose();
      fetchUsers();
    } else {
      showToast.danger(result.error || 'Nepodařilo se aktualizovat uživatele');
    }
  } else {
    const result = await createUser(formData);
    if (result.success && result.userId && result.userEmail) {
      showToast.success('Pozvánka byla úspěšně odeslána!');
      modals.form.onClose();
      setNewlyCreatedUser({ id: result.userId, email: result.userEmail });
      modals.roleAssignment.onOpen();
    } else {
      showToast.danger(result.error || 'Nepodařilo se vytvořit uživatele');
    }
  }
};

// Handle toggle block
const handleToggleBlock = async (user: SupabaseUser) => {
  const result = await toggleUserBlock(user.id);
  if (result.success) {
    fetchUsers();
  } else {
    showToast.danger(result.error || 'Nepodařilo se změnit stav uživatele');
  }
};

// Handle password reset
const handlePasswordReset = async () => {
  const result = await resetPassword(passwordResetEmail);
  if (result.success) {
    showToast.success('Email pro obnovení hesla byl odeslán');
    modals.passwordReset.onClose();
  } else {
    showToast.danger(result.error || 'Nepodařilo se odeslat email');
  }
};
```

#### 2.3 Update AdminContainer Actions

```typescript
<AdminContainer
  tabs={[
    {
      key: 'users',
      title: translations.admin.users.tabs.users,
      content: (
        <UsersTab
          users={users}
          loading={loading}
          onEdit={handleOpenEditModal}
          onResetPassword={handleOpenPasswordResetModal}
          onToggleBlock={handleToggleBlock}
        />
      ),
      actions: [
        {
          label: translations.admin.users.actions.addUser,
          onClick: handleOpenAddModal,  // ◄── NOW WORKS
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ],
    },
    // ... loginLogs tab
  ]}
/>
```

#### 2.4 Add Modals to Page

```tsx
return (
  <>
    <AdminContainer ... />

    {/* User Form Modal */}
    <UserFormModal
      isOpen={modals.form.isOpen}
      onOpenChange={modals.form.onOpenChange}
      selectedUser={selectedUser}
      onSubmit={handleFormSubmit}
      isSubmitting={isCreating || isUpdating}
    />

    {/* Password Reset Modal */}
    <PasswordResetModal
      isOpen={modals.passwordReset.isOpen}
      onClose={modals.passwordReset.onClose}
      onSubmit={handlePasswordReset}
      passwordResetEmail={passwordResetEmail}
      isSubmitting={isResettingPassword}
    />

    {/* Role Assignment Modal */}
    {newlyCreatedUser && (
      <RoleAssignmentModal
        isOpen={modals.roleAssignment.isOpen}
        onClose={() => {
          modals.roleAssignment.onClose();
          setNewlyCreatedUser(null);
          fetchUsers();
        }}
        userId={newlyCreatedUser.id}
        userEmail={newlyCreatedUser.email}
        onRoleAssigned={() => {
          modals.roleAssignment.onClose();
          setNewlyCreatedUser(null);
          showToast.success('Role byla úspěšně přiřazena!');
          fetchUsers();
        }}
      />
    )}
  </>
);
```

---

### Phase 3: Simplify UsersTab

**File**: `src/app/admin/users/components/UsersTab.tsx`

#### 3.1 New Props Interface

```typescript
interface UsersTabProps {
  users: SupabaseUser[];
  loading: boolean;
  onEdit: (user: SupabaseUser) => void;
  onResetPassword: (user: SupabaseUser) => void;
  onToggleBlock: (user: SupabaseUser) => void;
}
```

#### 3.2 Remove from UsersTab

- [ ] Remove `useModals` hook
- [ ] Remove all `useState` for modal state
- [ ] Remove `handleAddUser` function
- [ ] Remove `handleEditUser` function
- [ ] Remove `handleSubmit` function (API call)
- [ ] Remove `handleToggleUserStatus` function (API call)
- [ ] Remove `handlePasswordReset` function (API call)
- [ ] Remove `openPasswordModal` function
- [ ] Remove all modal components (`UserFormModal`, `PasswordResetModal`, `RoleAssignmentModal`)
- [ ] Remove CardHeader with "Add User" button

#### 3.3 Keep in UsersTab

- [ ] Table rendering (`UnifiedTable`)
- [ ] `renderCells` function
- [ ] `columns` definition (update action handlers to use props)
- [ ] `getUserStatusBadge` helper
- [ ] Loading spinner

#### 3.4 Updated Columns Definition

```typescript
const columns = [
  { key: 'user', label: translations.admin.users.table.columns.user },
  { key: 'contact', label: translations.admin.users.table.columns.contact },
  { key: 'status', label: translations.admin.users.table.columns.status },
  { key: 'createdAt', label: translations.admin.users.table.columns.createdAt },
  {
    key: 'actions',
    label: translations.common.table.columns.actions,
    isActionColumn: true,
    actions: [
      {
        type: ActionTypes.UPDATE,
        onPress: onEdit,  // ◄── From props
        title: translations.common.table.actions.update
      },
      {
        type: ActionTypes.PASSWORD_RESET,
        onPress: onResetPassword,  // ◄── From props
        title: translations.admin.users.table.actions.passwordReset,
      },
      {
        type: ActionTypes.BLOCKED,
        onPress: onToggleBlock,  // ◄── From props
        title: translations.admin.users.table.actions.blocked,
      },
    ],
  },
];
```

---

### Phase 4: Fix Password Reset Endpoint

**Issue**: Current code calls `/api/reset-password` which returns 404

**Solution**: Update to use correct endpoint

```typescript
// In useUserManagement.ts
const resetPassword = async (email: string): Promise<OperationResult> => {
  try {
    setIsResettingPassword(true);

    const response = await fetch('/api/auth/reset-password', {  // ◄── CORRECT ENDPOINT
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send password reset');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    setIsResettingPassword(false);
  }
};
```

---

## 5. File Changes

### 5.1 New Files

| File | Purpose |
|------|---------|
| `src/hooks/admin/useUserManagement.ts` | User CRUD operations hook |
| `src/types/admin/userManagement.ts` | Type definitions (optional, can be in hook file) |

### 5.2 Modified Files

| File | Changes |
|------|---------|
| `src/app/admin/users/page.tsx` | Add hook usage, modal state, handlers, render modals |
| `src/app/admin/users/components/UsersTab.tsx` | Remove API logic, modals; add callback props |
| `src/hooks/index.ts` | Export new hook |

### 5.3 Files to Verify

| File | Check |
|------|-------|
| `src/app/api/auth/reset-password/route.ts` | Ensure endpoint exists and works |
| `src/app/api/manage-users/route.ts` | Verify current implementation |

---

## 6. Migration Strategy

### 6.1 Step-by-Step Migration

```
Step 1: Create useUserManagement hook
        ├── No breaking changes
        └── Can be tested in isolation

Step 2: Update UsersPage
        ├── Add new hook
        ├── Add modal state
        ├── Add handlers
        └── Keep UsersTab unchanged (still works)

Step 3: Update UsersTab props
        ├── Add new props interface
        ├── Update column actions
        └── Remove internal state/handlers

Step 4: Move modals to UsersPage
        ├── Remove from UsersTab
        └── Add to UsersPage render

Step 5: Clean up UsersTab
        ├── Remove unused imports
        └── Remove CardHeader button

Step 6: Test everything
        └── Verify all actions work
```

### 6.2 Rollback Plan

Each step is independently reversible:
- Hook can be removed if unused
- UsersTab can keep old implementation until page is ready
- Modals can be moved back if issues arise

---

## 7. Testing Checklist

### 7.1 Functional Tests

- [ ] **Add User Flow**
  - [ ] Click "Add User" in AdminContainer header
  - [ ] Modal opens with empty form
  - [ ] Submit creates user
  - [ ] Role assignment modal appears
  - [ ] User appears in list after role assigned

- [ ] **Edit User Flow**
  - [ ] Click edit action on table row
  - [ ] Modal opens with user data
  - [ ] Changes are saved
  - [ ] List updates

- [ ] **Password Reset Flow**
  - [ ] Click password reset action
  - [ ] Confirmation modal appears
  - [ ] Email is sent (no 404)
  - [ ] Success toast shown

- [ ] **Block/Unblock Flow**
  - [ ] Click block action
  - [ ] User status changes
  - [ ] Badge updates in table

### 7.2 Edge Cases

- [ ] Network error during create
- [ ] Network error during update
- [ ] Empty form submission
- [ ] Modal close without saving
- [ ] Multiple rapid clicks

### 7.3 UI/UX Tests

- [ ] Loading spinners appear during operations
- [ ] Error messages display correctly
- [ ] Success toasts appear
- [ ] Modal transitions are smooth
- [ ] Table updates after operations

---

## Appendix A: Code Snippets

### A.1 Complete useUserManagement Hook

```typescript
// src/hooks/admin/useUserManagement.ts
'use client';

import { useCallback, useState } from 'react';

interface CreateUserData {
  email: string;
  full_name: string;
  phone?: string;
  bio?: string;
  position?: string;
}

interface CreateUserResult {
  success: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

export function useUserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (userData: CreateUserData): Promise<CreateUserResult> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      return {
        success: true,
        userId: data.userId,
        userEmail: data.userEmail,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateUser = useCallback(async (
    userId: string,
    userData: Partial<CreateUserData>
  ): Promise<OperationResult> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId,
          userData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const toggleUserBlock = useCallback(async (userId: string): Promise<OperationResult> => {
    try {
      setIsTogglingBlock(true);
      setError(null);

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleBlock',
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsTogglingBlock(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<OperationResult> => {
    try {
      setIsResettingPassword(true);
      setError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsResettingPassword(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Actions
    createUser,
    updateUser,
    toggleUserBlock,
    resetPassword,

    // Loading states
    isCreating,
    isUpdating,
    isTogglingBlock,
    isResettingPassword,
    isLoading: isCreating || isUpdating || isTogglingBlock || isResettingPassword,

    // Error handling
    error,
    clearError,
  };
}
```

---

## Appendix B: Estimated Effort

| Phase | Estimated Time | Complexity |
|-------|----------------|------------|
| Phase 1: Create hook | 1-2 hours | Medium |
| Phase 2: Update UsersPage | 1-2 hours | Medium |
| Phase 3: Simplify UsersTab | 1 hour | Low |
| Phase 4: Fix endpoint | 15 minutes | Low |
| Testing | 1 hour | Low |
| **Total** | **4-6 hours** | |

---

## Appendix C: Future Improvements

After this refactoring, consider:

1. **Add optimistic updates**: Update UI immediately, revert on error
2. **Add caching**: Cache user list with React Query or SWR
3. **Add bulk operations**: Select multiple users for bulk actions
4. **Add search/filter**: Filter users in table
5. **Add pagination**: Handle large user lists
6. **Add audit logging**: Track who made what changes