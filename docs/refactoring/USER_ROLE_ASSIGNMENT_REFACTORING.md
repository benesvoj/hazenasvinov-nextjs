# User Role Assignment Refactoring Plan

## Executive Summary

This document outlines the refactoring plan to consolidate duplicate user role assignment logic, improve error handling, add validation, and update TypeScript types. **Updated to use dynamic role definitions from the `role_definitions` database table via `useFetchRoleDefinitions` hook.**

---

## 1. Current State Analysis

### 1.1 Identified Issues

| Issue | Location | Description |
|-------|----------|-------------|
| **Duplicate Logic** | 3 files | Role assignment logic duplicated in `useUserRoles.ts`, `RoleAssignmentModal.tsx`, and `UserFormModal.tsx` |
| **Inconsistent Patterns** | Multiple | Hook uses check-then-insert/update, modals use upsert |
| **Constraint Mismatch** | Modals | `onConflict: 'user_id,role'` doesn't match DB constraint `UNIQUE(user_id)` |
| **Missing Validation** | All | No validation for role values or category requirements |
| **Scattered Error Handling** | All | Each file has its own error handling approach |
| **Hardcoded Roles** | Multiple | `VALID_ROLES`, `ROLE_OPTIONS` constants prevent dynamic role management |

### 1.2 Current Implementation Locations

**File 1: `src/hooks/entities/user/useUserRoles.ts` (271 lines)**
- Uses check-then-insert/update pattern (lines 81-135)
- Multiple methods: `assignRoles`, `assignCoachCategories`, `assignUserRoles`
- Fetches using API endpoint `/api/user-roles`

**File 2: `src/app/admin/users/components/RoleAssignmentModal.tsx` (174 lines)**
- Has own `assignRoleToDatabase()` method (lines 73-105)
- Uses `onConflict: 'user_id,role'` (invalid constraint)
- **Hardcoded `ROLE_OPTIONS` array**

**File 3: `src/app/admin/users/components/UserFormModal.tsx` (480 lines)**
- Has own `addRoleToDatabase()` method (lines 142-172)
- Has own `loadUserProfiles()` method (lines 97-117)
- Uses `onConflict: 'user_id,role'` (invalid constraint)
- **Uses `ROLE_OPTIONS` from constants**

### 1.3 Hardcoded Role Constants (To Be Removed)

**`src/constants/roleOptions.ts`:**
```typescript
// @deprecated - Will be replaced by dynamic role_definitions
export const ROLE_OPTIONS = [
  {value: 'admin', label: 'Admin'},
  {value: 'head_coach', label: 'Hlavni trener'},
  {value: 'coach', label: 'Trener'},
  {value: 'member', label: 'Clen'},
];
```

**`src/types/shared/userRoles.ts`:**
```typescript
// @deprecated - Will be replaced by dynamic validation
export const VALID_ROLES = ['admin', 'coach', 'head_coach', 'member'] as const;
export const ROLES_REQUIRING_CATEGORIES: UserRoleType[] = ['coach', 'head_coach'];
```

---

## 2. New Dynamic Role System

### 2.1 Database Schema

**Table: `role_definitions`**
```sql
CREATE TABLE role_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- e.g., 'admin', 'coach'
  display_name TEXT NOT NULL,          -- e.g., 'Administrator', 'Trener'
  description TEXT,                    -- Role description for UI
  is_active BOOLEAN DEFAULT true,      -- Soft delete / disable roles
  permissions JSONB DEFAULT '{}',      -- Extensible permissions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table: `user_profiles` (updated)**
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                  -- Legacy: role name (backward compat)
  role_id UUID REFERENCES role_definitions(id), -- New: FK to role_definitions
  assigned_categories UUID[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 2.2 RoleDefinitionSchema Type

**File: `src/types/entities/roleDefinition/schema/roleDefinitionsSchema.ts`**
```typescript
export interface RoleDefinitionSchema {
  id: string;
  name: string;                    // Unique role identifier
  display_name: string;            // Human-readable name
  description: string | null;      // Optional description
  is_active: boolean | null;       // Active/inactive status
  permissions: Json | null;        // Extensible permissions JSON
  created_at: string | null;
}
```

### 2.3 Existing Hook: `useFetchRoleDefinitions`

**File: `src/hooks/entities/roleDefinition/data/useFetchRoleDefinitions.ts`**
```typescript
import {translations} from "@/lib/translations/index";
import {createDataFetchHook} from "@/hooks";
import {API_ROUTES} from "@/lib";
import {DB_TABLE, ENTITY} from "@/queries/roleDefinitions";
import {RoleDefinitionSchema} from "@/types";

const useBaseFetchRoleDefinitions = createDataFetchHook<RoleDefinitionSchema>({
  endpoint: API_ROUTES.entities.root(DB_TABLE),
  entityName: ENTITY.plural,
  errorMessage: translations.admin.roleDefinitions.responseMessages.fetchFailed,
});

export function useFetchRoleDefinitions() {
  const {data, loading, error, refetch} = useBaseFetchRoleDefinitions();
  return { data, loading, error, refetch };
}
```

---

## 3. Refactoring Strategy

### 3.1 Goals

1. **Dynamic Roles**: Fetch roles from `role_definitions` table instead of hardcoded constants
2. **Single Source of Truth**: All role operations go through `useUserRoles` hook
3. **Consistent Pattern**: Use upsert with correct constraint (`user_id` only)
4. **Dynamic Validation**: Validate against fetched role definitions
5. **Centralized Error Handling**: Unified error handling in hook
6. **Type Safety**: Strong TypeScript types throughout
7. **Deprecate Constants**: Remove `VALID_ROLES`, `ROLE_OPTIONS`

### 3.2 Architecture After Refactoring

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Components                                   │
│  ┌─────────────────────┐         ┌─────────────────────────────────────┐ │
│  │ RoleAssignmentModal │         │         UserFormModal               │ │
│  │  (uses dynamic      │         │  (uses dynamic role list)           │ │
│  │   role list)        │         │                                     │ │
│  └──────────┬──────────┘         └─────────────────┬───────────────────┘ │
│             │                                      │                     │
│             └────────────────┬─────────────────────┘                     │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                       useUserRoles Hook                              │ │
│  │  - upsertUserProfile(roleId, roleName)                              │ │
│  │  - deleteUserProfile()                                              │ │
│  │  - fetchUserProfiles()                                              │ │
│  │  - validateRoleAssignment(roleDefinitions)  <── Dynamic validation  │ │
│  │  - roleRequiresCategories(roleDefinition)   <── From permissions    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│              ┌───────────────┼───────────────┐                           │
│              ▼               ▼               ▼                           │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────────┐          │
│  │useFetchRole     │  │  Supabase   │  │     API Routes      │          │
│  │Definitions      │  │   Client    │  │  /api/user-roles    │          │
│  │(role_definitions│  │(user_       │  │                     │          │
│  │  table)         │  │ profiles)   │  │                     │          │
│  └─────────────────┘  └─────────────┘  └─────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Steps

### Step 1: Database Migration - Add `requires_categories` to Permissions

Before code changes, update existing role definitions to include category requirements:

```sql
-- Update role_definitions to include requires_categories in permissions
UPDATE role_definitions
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'),
  '{requires_categories}',
  'true'
)
WHERE name IN ('coach', 'head_coach');

UPDATE role_definitions
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'),
  '{requires_categories}',
  'false'
)
WHERE name IN ('admin', 'member');
```

### Step 2: Update Types

**File: `src/types/shared/userRoles.ts`**

```typescript
import { RoleDefinitionSchema } from '@/types';

// ============================================================================
// DEPRECATED CONSTANTS - To be removed after migration
// ============================================================================

/**
 * @deprecated Use useFetchRoleDefinitions() hook instead.
 * These constants are kept temporarily for backward compatibility.
 */
export const VALID_ROLES = ['admin', 'coach', 'head_coach', 'member'] as const;

/**
 * @deprecated Use roleRequiresCategories(roleDefinition) instead.
 * Category requirements are now stored in role_definitions.permissions.
 */
export const ROLES_REQUIRING_CATEGORIES = ['coach', 'head_coach'];

// ============================================================================
// NEW DYNAMIC TYPES
// ============================================================================

/** Role permissions stored in role_definitions.permissions JSON */
export interface RolePermissions {
  requires_categories?: boolean;
  can_manage_users?: boolean;
  can_view_all_categories?: boolean;
  [key: string]: boolean | string | number | undefined;
}

/** Extended role definition with typed permissions */
export interface RoleDefinitionWithPermissions extends Omit<RoleDefinitionSchema, 'permissions'> {
  permissions: RolePermissions | null;
}

/** User role type - now dynamic, based on role_definitions.name */
export type UserRoleType = string;

/** Legacy user role interface */
export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by?: string;
}

/** Coach category assignment (legacy) */
export interface CoachCategory {
  id: string;
  user_id: string;
  category_id: string;
  created_at: string;
  created_by?: string;
}

/** User profile from database */
export interface UserProfile {
  id: string;
  user_id: string;
  role: string;                      // Role name (backward compat)
  role_id: string | null;            // FK to role_definitions
  assigned_categories: string[] | null;
  full_name?: string | null;
  club_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

/** Summary of user roles for admin view */
export interface UserRoleSummary {
  user_id: string;
  profile_role: string;
  roles: string[];
  assigned_categories: string[];
  assigned_category_names: string[];
  assigned_category_codes: string[];
  email?: string;
  full_name?: string;
}

/** Input for role assignment */
export interface RoleAssignment {
  userId: string;
  roles: string[];
  categories: string[];
}

/** Input for upserting a user profile */
export interface UpsertUserProfileInput {
  userId: string;
  roleId: string;                    // UUID from role_definitions
  roleName: string;                  // Role name for backward compat
  assignedCategories: string[] | null;
}

/** Result from role operations */
export interface RoleOperationResult {
  success: boolean;
  error?: string;
  data?: UserProfile;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a role requires category assignment.
 * Uses permissions.requires_categories from role_definitions.
 */
export function roleRequiresCategories(
  roleDefinition: RoleDefinitionWithPermissions | RoleDefinitionSchema | null
): boolean {
  if (!roleDefinition) return false;

  const permissions = roleDefinition.permissions as RolePermissions | null;
  return permissions?.requires_categories === true;
}

/**
 * Check if a role name is valid against fetched role definitions.
 */
export function isValidRole(
  roleName: string,
  roleDefinitions: RoleDefinitionSchema[]
): boolean {
  return roleDefinitions.some(
    (rd) => rd.name === roleName && rd.is_active !== false
  );
}

/**
 * Get role definition by name.
 */
export function getRoleByName(
  roleName: string,
  roleDefinitions: RoleDefinitionSchema[]
): RoleDefinitionSchema | undefined {
  return roleDefinitions.find((rd) => rd.name === roleName);
}

/**
 * Get role definition by ID.
 */
export function getRoleById(
  roleId: string,
  roleDefinitions: RoleDefinitionSchema[]
): RoleDefinitionSchema | undefined {
  return roleDefinitions.find((rd) => rd.id === roleId);
}
```

### Step 3: Update useUserRoles Hook

**File: `src/hooks/entities/user/useUserRoles.ts`**

```typescript
'use client';
import {useState, useCallback, useRef, useMemo} from 'react';

import {useUser} from '@/contexts';
import {useSupabaseClient, useFetchRoleDefinitions} from '@/hooks';
import {
  UserRoleSummary,
  UserProfile,
  UpsertUserProfileInput,
  RoleOperationResult,
  ValidationResult,
  RoleDefinitionSchema,
  roleRequiresCategories,
  isValidRole,
  getRoleByName,
  getRoleById,
} from '@/types';
import {showToast} from '@/components';

export function useUserRoles() {
  const [userRoleSummaries, setUserRoleSummaries] = useState<UserRoleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const {user, userProfile, userRoles, userCategories} = useUser();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;

  // Fetch role definitions dynamically
  const {
    data: roleDefinitions,
    loading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useFetchRoleDefinitions();

  // Filter to only active roles
  const activeRoles = useMemo(() => {
    return (roleDefinitions || []).filter((rd) => rd.is_active !== false);
  }, [roleDefinitions]);

  // Validate role assignment before upsert
  const validateRoleAssignment = useCallback(
    (input: UpsertUserProfileInput): ValidationResult => {
      const errors: string[] = [];

      if (!input.userId) {
        errors.push('User ID is required');
      }

      if (!input.roleId) {
        errors.push('Role ID is required');
      }

      // Validate role exists and is active
      const roleDef = getRoleById(input.roleId, roleDefinitions || []);
      if (!roleDef) {
        errors.push(`Role with ID "${input.roleId}" not found`);
      } else if (roleDef.is_active === false) {
        errors.push(`Role "${roleDef.display_name}" is inactive`);
      }

      // Check category requirements
      if (roleDef && roleRequiresCategories(roleDef)) {
        if (!input.assignedCategories || input.assignedCategories.length === 0) {
          errors.push(`Role "${roleDef.display_name}" requires at least one category assignment`);
        }
      }

      return {valid: errors.length === 0, errors};
    },
    [roleDefinitions]
  );

  // Upsert user profile (single source of truth for role assignment)
  const upsertUserProfile = useCallback(
    async (input: UpsertUserProfileInput): Promise<RoleOperationResult> => {
      const validation = validateRoleAssignment(input);
      if (!validation.valid) {
        const errorMessage = validation.errors.join('; ');
        setError(errorMessage);
        return {success: false, error: errorMessage};
      }

      setLoading(true);
      setError(null);

      try {
        const {
          data: {user: currentUser},
        } = await supabaseRef.current.auth.getUser();

        // Use upsert with correct constraint (user_id only)
        const {data, error: upsertError} = await supabaseRef.current
          .from('user_profiles')
          .upsert(
            {
              user_id: input.userId,
              role: input.roleName,              // Backward compat
              role_id: input.roleId,             // New FK reference
              assigned_categories: input.assignedCategories,
              updated_at: new Date().toISOString(),
              created_by: currentUser?.id,
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (upsertError) {
          throw upsertError;
        }

        return {success: true, data: data as UserProfile};
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
        console.error('Error upserting user profile:', err);
        setError(errorMessage);
        return {success: false, error: errorMessage};
      } finally {
        setLoading(false);
      }
    },
    [validateRoleAssignment]
  );

  // Fetch profiles for a specific user
  const fetchUserProfiles = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const {data, error} = await supabaseRef.current
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {ascending: false});

      if (error) throw error;
      return (data || []) as UserProfile[];
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      throw err;
    }
  }, []);

  // Delete a user profile
  const deleteUserProfile = useCallback(
    async (profileId: string): Promise<RoleOperationResult> => {
      setLoading(true);
      setError(null);

      try {
        const {error: deleteError} = await supabaseRef.current
          .from('user_profiles')
          .delete()
          .eq('id', profileId);

        if (deleteError) throw deleteError;

        return {success: true};
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
        console.error('Error deleting user profile:', err);
        setError(errorMessage);
        return {success: false, error: errorMessage};
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch all user role summaries
  const fetchUserRoleSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user-roles');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user roles');
      }

      const {data} = await response.json();
      setUserRoleSummaries(data || []);
    } catch (err) {
      console.error('Error fetching user role summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if current user has a specific role (by name)
  const hasRole = useCallback(
    async (roleName: string): Promise<boolean> => {
      try {
        if (!user) return false;
        if (userProfile?.role === roleName) return true;
        return userRoles.some((r) => r.role === roleName);
      } catch (err) {
        console.error('Error checking user role:', err);
        return false;
      }
    },
    [user, userProfile, userRoles]
  );

  // Get current user's assigned categories
  const getCurrentUserCategories = useCallback(async (): Promise<string[]> => {
    try {
      if (!user) return [];

      // Check admin simulation mode
      if (typeof window !== 'undefined') {
        const simulationData = localStorage.getItem('adminCategorySimulation');
        if (simulationData) {
          try {
            const {selectedCategories} = JSON.parse(simulationData);
            if (selectedCategories?.length > 0) {
              return selectedCategories;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      return userCategories;
    } catch (err) {
      console.error('Error fetching current user category:', err);
      return [];
    }
  }, [user, userCategories]);

  // Check if a role requires categories (dynamic)
  const checkRoleRequiresCategories = useCallback(
    (roleIdOrName: string): boolean => {
      const roleDef =
        getRoleById(roleIdOrName, roleDefinitions || []) ||
        getRoleByName(roleIdOrName, roleDefinitions || []);
      return roleRequiresCategories(roleDef || null);
    },
    [roleDefinitions]
  );

  return {
    // State
    userRoleSummaries,
    loading: loading || rolesLoading,
    error: error || rolesError,

    // Role definitions (dynamic)
    roleDefinitions: activeRoles,
    rolesLoading,
    refetchRoles,

    // Core operations
    upsertUserProfile,
    deleteUserProfile,
    fetchUserProfiles,
    validateRoleAssignment,

    // Existing operations
    fetchUserRoleSummaries,
    hasRole,
    getCurrentUserCategories,

    // UserContext data
    userRoles,
    coachCategories: userCategories,

    // Utilities (dynamic)
    checkRoleRequiresCategories,
    getRoleByName: (name: string) => getRoleByName(name, roleDefinitions || []),
    getRoleById: (id: string) => getRoleById(id, roleDefinitions || []),
    isValidRole: (name: string) => isValidRole(name, roleDefinitions || []),
  };
}
```

### Step 4: Update RoleAssignmentModal

**File: `src/app/admin/users/components/RoleAssignmentModal.tsx`**

```typescript
'use client';

import React, {useState} from 'react';
import {Radio, RadioGroup, Skeleton} from '@heroui/react';

import {useModal} from '@/hooks/shared/useModals';
import {useUserRoles} from '@/hooks';
import {UnifiedModal} from '@/components/ui/modals';
import {showToast} from '@/components';
import {RoleDefinitionSchema} from '@/types';

import {CategorySelectionModal} from './CategorySelectionModal';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onRoleAssigned: () => void;
}

export default function RoleAssignmentModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onRoleAssigned,
}: RoleAssignmentModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<RoleDefinitionSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryModal = useModal();
  const {
    roleDefinitions,
    rolesLoading,
    upsertUserProfile,
    loading,
    checkRoleRequiresCategories,
    getRoleById,
  } = useUserRoles();

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      setError('Prosim vyberte roli');
      return;
    }

    const selectedRole = getRoleById(selectedRoleId);
    if (!selectedRole) {
      setError('Vybrana role nebyla nalezena');
      return;
    }

    // If role requires category, show category selection modal
    if (checkRoleRequiresCategories(selectedRoleId)) {
      setPendingRole(selectedRole);
      categoryModal.onOpen();
      return;
    }

    // For roles that don't require category, assign directly
    await assignRole(selectedRole, null);
  };

  const assignRole = async (role: RoleDefinitionSchema, categories: string[] | null) => {
    setError(null);

    const result = await upsertUserProfile({
      userId,
      roleId: role.id,
      roleName: role.name,
      assignedCategories: categories,
    });

    if (result.success) {
      showToast.success('Role byla uspesne prirazena!');
      onRoleAssigned();
      onClose();
      setSelectedRoleId('');
    } else {
      setError(result.error || 'Chyba pri prirazovani role');
    }
  };

  const handleCategoryConfirm = async (categories: string[]) => {
    if (!pendingRole) return;
    await assignRole(pendingRole, categories);
    categoryModal.onClose();
    setPendingRole(null);
  };

  const handleClose = () => {
    setSelectedRoleId('');
    setError(null);
    onClose();
  };

  return (
    <>
      <UnifiedModal
        isFooterWithActions
        isOpen={isOpen}
        onClose={handleClose}
        onPress={handleAssignRole}
        isDisabled={!selectedRoleId || loading}
        title="Prirazeni role uzivateli"
        size="md"
        placement="center"
        backdrop="blur"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Uzivatel: <span className="font-medium">{userEmail}</span>
          </p>
          <p className="text-sm text-gray-500">
            Vyberte roli pro tohoto uzivatele. Bez prirazene role nebude mit pristup k aplikaci.
          </p>
        </div>

        {rolesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : (
          <RadioGroup
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            className="gap-3"
          >
            {roleDefinitions.map((role) => (
              <Radio
                key={role.id}
                value={role.id}
                className="p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <div className="font-medium">{role.display_name}</div>
                  {role.description && (
                    <div className="text-sm text-gray-500">{role.description}</div>
                  )}
                </div>
              </Radio>
            ))}
          </RadioGroup>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Poznamka: Pokud preskocite, uzivatel nebude mit pristup k aplikaci, dokud mu nebude
          prirazena role.
        </p>
      </UnifiedModal>

      <CategorySelectionModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.onClose}
        onConfirm={handleCategoryConfirm}
        isLoading={loading}
      />
    </>
  );
}
```

### Step 5: Update UserFormModal

**File: `src/app/admin/users/components/UserFormModal.tsx`**

Key changes (partial - showing role-related updates):

```typescript
'use client';

import React, {useEffect, useState} from 'react';
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  // ... other imports
} from '@heroui/react';

import {PlusIcon, TrashIcon} from '@heroicons/react/24/outline';
import {useModal} from '@/hooks/shared/useModals';
import {showToast} from '@/components/ui/feedback/Toast';
import {useUserRoles, useFetchCategories} from '@/hooks';
import {RoleDefinitionSchema, UserProfile} from '@/types';
import {CategorySelectionModal} from './CategorySelectionModal';
import {getRoleBadgeColor} from '../helpers/getRoleBadgeColorHelper';

// ... interfaces remain the same

export default function UserFormModal({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit,
  onSuccess,
}: UserFormModalProps) {
  // ... existing state

  // Role management state
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [pendingRole, setPendingRole] = useState<RoleDefinitionSchema | null>(null);

  const categoryModal = useModal();
  const {data: categories} = useFetchCategories();

  // Use dynamic role hook
  const {
    roleDefinitions,
    rolesLoading,
    upsertUserProfile,
    deleteUserProfile,
    fetchUserProfiles,
    loading: roleLoading,
    checkRoleRequiresCategories,
    getRoleById,
    getRoleByName,
  } = useUserRoles();

  // Load user profiles
  const loadProfiles = async (userId: string) => {
    if (!userId) return;
    setProfilesLoading(true);
    try {
      const profiles = await fetchUserProfiles(userId);
      setUserProfiles(profiles);
    } catch (error: any) {
      showToast.danger(`Chyba pri nacitani profilu: ${error.message}`);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Add new role
  const handleAddRole = async () => {
    if (!selectedRoleId || !selectedUser) return;

    const role = getRoleById(selectedRoleId);
    if (!role) return;

    // If role requires category, show category selection modal
    if (checkRoleRequiresCategories(selectedRoleId)) {
      setPendingRole(role);
      categoryModal.onOpen();
      return;
    }

    // For roles that don't require category, add directly
    await addRole(role, null);
  };

  // Add role to database using hook
  const addRole = async (role: RoleDefinitionSchema, categories: string[] | null) => {
    if (!selectedUser) return;

    const result = await upsertUserProfile({
      userId: selectedUser.id,
      roleId: role.id,
      roleName: role.name,
      assignedCategories: categories,
    });

    if (result.success) {
      showToast.success('Role byla uspesne pridana!');
      setSelectedRoleId('');
      loadProfiles(selectedUser.id);
    } else {
      showToast.danger(`Chyba pri pridavani role: ${result.error}`);
    }
  };

  // Delete role using hook
  const handleDeleteRole = async (profileId: string) => {
    if (!selectedUser) return;

    const result = await deleteUserProfile(profileId);

    if (result.success) {
      showToast.success('Role byla uspesne smazana!');
      loadProfiles(selectedUser.id);
    } else {
      showToast.danger(`Chyba pri mazani role: ${result.error}`);
    }
  };

  // Get role display name from role_definitions
  const getRoleLabel = (roleName: string): string => {
    const role = getRoleByName(roleName);
    return role?.display_name || roleName;
  };

  // Handle category selection
  const handleCategoryModalConfirm = async (categories: string[]) => {
    if (!pendingRole || !selectedUser) return;

    try {
      await addRole(pendingRole, categories);
      categoryModal.onClose();
      setPendingRole(null);
    } catch (error) {
      console.error('Error in category selection confirm:', error);
    }
  };

  // ... existing useEffects

  const RolesTab = () => {
    return (
      <>
        {selectedUser ? (
          <div className="space-y-4">
            {/* Add new role section */}
            <div className="flex gap-2 items-end">
              {rolesLoading ? (
                <Skeleton className="h-14 flex-1 rounded-lg" />
              ) : (
                <Select
                  label="Nova role"
                  placeholder="Vyberte roli"
                  selectedKeys={selectedRoleId ? [selectedRoleId] : []}
                  onSelectionChange={(keys) => {
                    const roleId = Array.from(keys)[0] as string;
                    setSelectedRoleId(roleId);
                  }}
                  items={roleDefinitions}
                  className="flex-1"
                >
                  {(role) => (
                    <SelectItem key={role.id} textValue={role.display_name}>
                      <div className="flex flex-col">
                        <span>{role.display_name}</span>
                        {role.description && (
                          <span className="text-xs text-gray-500">{role.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  )}
                </Select>
              )}
              <Button
                color="primary"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={handleAddRole}
                isDisabled={!selectedRoleId || roleLoading}
              >
                Pridat
              </Button>
            </div>

            {/* Roles table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Prirazene role</h4>
              <Table aria-label="User roles table">
                <TableHeader>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>KATEGORIE</TableColumn>
                  <TableColumn>VYTVORENO</TableColumn>
                  <TableColumn>AKCE</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={profilesLoading}
                  loadingContent="Nacitani profilu..."
                  emptyContent="Zadne profily nenalezeny"
                >
                  {userProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <Badge color={getRoleBadgeColor(profile.role)} variant="flat">
                          {getRoleLabel(profile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {profile.assigned_categories && profile.assigned_categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.assigned_categories.slice(0, 2).map((catId) => {
                              const category = categories.find((c) => c.id === catId);
                              return (
                                <Badge key={catId} size="sm" variant="flat" color="secondary">
                                  {category?.name || catId}
                                </Badge>
                              );
                            })}
                            {profile.assigned_categories.length > 2 && (
                              <Badge size="sm" variant="flat" color="default">
                                +{profile.assigned_categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Zadne</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(profile.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDeleteRole(profile.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Pro spravu roli nejprve vytvorte uzivatele.</p>
          </div>
        )}
      </>
    );
  };

  // ... rest of component (BasicTab, return statement)

  return (
    <>
      {/* Modal content */}
      <CategorySelectionModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.onClose}
        onConfirm={handleCategoryModalConfirm}
      />
    </>
  );
}
```

---

## 5. Files to Deprecate/Remove

### Constants to Remove

| File | Status | Action |
|------|--------|--------|
| `src/constants/roleOptions.ts` | Deprecated | Remove after migration complete |

### Types to Deprecate

| Constant | Location | Replacement |
|----------|----------|-------------|
| `VALID_ROLES` | `src/types/shared/userRoles.ts` | `useFetchRoleDefinitions()` |
| `ROLE_OPTIONS` | `src/constants/roleOptions.ts` | `useFetchRoleDefinitions()` |
| `ROLES_REQUIRING_CATEGORIES` | `src/types/shared/userRoles.ts` | `roleRequiresCategories(roleDef)` |

---

## 6. Testing Checklist

### Unit Tests

- [ ] `validateRoleAssignment()` validates against dynamic role definitions
- [ ] `validateRoleAssignment()` requires categories based on `permissions.requires_categories`
- [ ] `validateRoleAssignment()` rejects inactive roles (`is_active: false`)
- [ ] `upsertUserProfile()` saves both `role` and `role_id`
- [ ] `checkRoleRequiresCategories()` reads from permissions JSON
- [ ] `getRoleById()` and `getRoleByName()` work correctly
- [ ] Error handling returns proper error messages

### Integration Tests

- [ ] RoleAssignmentModal displays roles from `role_definitions` table
- [ ] RoleAssignmentModal shows loading skeleton while fetching roles
- [ ] RoleAssignmentModal opens category modal based on `permissions.requires_categories`
- [ ] UserFormModal Select shows dynamic role list with descriptions
- [ ] UserFormModal displays correct `display_name` in roles table
- [ ] Adding new role to `role_definitions` appears in UI without code changes
- [ ] Deactivating role (`is_active: false`) hides it from selection

### E2E Tests

- [ ] Complete flow: Add new role definition -> Assign to user -> Verify access
- [ ] Complete flow: Deactivate role -> Verify not available for assignment
- [ ] Complete flow: Update role permissions -> Verify category modal behavior changes
- [ ] Category selection modal works correctly for dynamic roles
- [ ] Toast notifications appear for all operations

### Database Tests

- [ ] `role_definitions` table has correct initial data
- [ ] `permissions` JSON properly stores `requires_categories`
- [ ] `user_profiles.role_id` FK constraint works correctly
- [ ] Backward compatibility: `user_profiles.role` (string) still works

---

## 7. Migration Steps

### Pre-Migration Checklist

- [ ] Backup `user_profiles` and `role_definitions` tables
- [ ] Verify `role_definitions` table exists with proper schema
- [ ] Populate `role_definitions` with initial roles
- [ ] Add `requires_categories` to permissions JSON for coach/head_coach
- [ ] Test in development environment first

### Database Migration

```sql
-- 1. Ensure role_definitions has required roles
INSERT INTO role_definitions (name, display_name, description, is_active, permissions)
VALUES
  ('admin', 'Administrator', 'Plny pristup ke vsem funkcim', true, '{"requires_categories": false, "can_manage_users": true}'),
  ('head_coach', 'Hlavni trener', 'Pristup k trenerským funkcim a sprave tymu', true, '{"requires_categories": true}'),
  ('coach', 'Trener', 'Pristup k trenerským funkcim', true, '{"requires_categories": true}'),
  ('member', 'Clen', 'Zakladni pristup pro cleny', true, '{"requires_categories": false}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- 2. Backfill role_id in user_profiles
UPDATE user_profiles up
SET role_id = rd.id
FROM role_definitions rd
WHERE up.role = rd.name AND up.role_id IS NULL;
```

### Code Migration Order

1. **Database Migration**
   - Run SQL to populate `role_definitions`
   - Add `requires_categories` to permissions
   - Backfill `role_id` in `user_profiles`

2. **Update Types** (`src/types/shared/userRoles.ts`)
   - Add new types and utility functions
   - Mark old constants as `@deprecated`

3. **Update Hook** (`src/hooks/entities/user/useUserRoles.ts`)
   - Integrate `useFetchRoleDefinitions`
   - Add dynamic validation
   - Update upsert to save `role_id`

4. **Update RoleAssignmentModal**
   - Remove hardcoded `ROLE_OPTIONS`
   - Use `roleDefinitions` from hook
   - Add loading states

5. **Update UserFormModal**
   - Remove `ROLE_OPTIONS` import
   - Use dynamic role list
   - Update role display to use `display_name`

6. **Cleanup** (after testing)
   - Remove `src/constants/roleOptions.ts`
   - Remove deprecated constants from types
   - Update any remaining hardcoded role references

### Rollback Plan

If issues occur:
1. Revert code changes
2. Database remains compatible (both `role` and `role_id` are stored)
3. Old code can still read `role` string field

---

## 8. Files to Update

| File | Action | Priority |
|------|--------|----------|
| `role_definitions` table | Add permissions with requires_categories | High |
| `user_profiles` table | Backfill role_id | High |
| `src/types/shared/userRoles.ts` | Add dynamic types, deprecate constants | High |
| `src/hooks/entities/user/useUserRoles.ts` | Integrate useFetchRoleDefinitions | High |
| `src/app/admin/users/components/RoleAssignmentModal.tsx` | Use dynamic roles | High |
| `src/app/admin/users/components/UserFormModal.tsx` | Use dynamic roles | High |
| `src/constants/roleOptions.ts` | Delete after migration | Low |
| `src/hooks/index.ts` | Ensure useFetchRoleDefinitions exported | Medium |

---

## 9. Benefits After Refactoring

1. **Dynamic Roles**: Add/modify roles via database without code changes
2. **Single Source of Truth**: Roles defined in `role_definitions` table
3. **Flexible Permissions**: JSON `permissions` field for extensible configuration
4. **Better Maintainability**: No hardcoded constants to update
5. **Consistent UI**: All components display same role names from database
6. **Type Safety**: Strong TypeScript types with utility functions
7. **Easy Extension**: Add new roles (e.g., 'blogger') via database insert
8. **Audit Trail**: `role_definitions` tracks when roles were created

---

## 10. Estimated Effort

| Task | Effort |
|------|--------|
| Database Migration (role_definitions setup) | 1 hour |
| Update Types | 45 min |
| Refactor useUserRoles Hook | 2 hours |
| Update RoleAssignmentModal | 1.5 hours |
| Update UserFormModal | 2 hours |
| Testing | 3 hours |
| Cleanup deprecated code | 30 min |
| **Total** | **~11 hours** |

---

## 11. Conclusion

This updated refactoring plan transitions from hardcoded role constants to a fully dynamic role system driven by the `role_definitions` database table. Key changes include:

- **Dynamic fetching** via `useFetchRoleDefinitions` hook
- **Permissions JSON** for flexible role configuration (including `requires_categories`)
- **Dual storage** (`role` + `role_id`) for backward compatibility
- **Deprecation path** for removing hardcoded constants

**Recommended next steps**:
1. Run database migration to populate `role_definitions` with permissions
2. Update types with deprecation notices
3. Implement hook changes with dynamic validation
4. Update UI components to use dynamic role list
5. Test thoroughly before removing deprecated constants
