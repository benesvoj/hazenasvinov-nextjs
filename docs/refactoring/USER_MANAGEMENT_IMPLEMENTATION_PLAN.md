# User Management System - Implementation Plan

> **Document Version:** 1.0
> **Created:** 2026-01-28
> **Status:** Planning Phase
> **Related:** [USER_ROLE_ASSIGNMENT_REFACTORING.md](./USER_ROLE_ASSIGNMENT_REFACTORING.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Key Recommendations](#3-key-recommendations)
4. [Detailed Implementation Plan](#4-detailed-implementation-plan)
5. [Database Migration Scripts](#5-database-migration-scripts)
6. [Testing Strategy](#6-testing-strategy)
7. [Rollback Plan](#7-rollback-plan)

---

## 1. Executive Summary

### 1.1 Problem Statement

The user management system has accumulated technical debt during migration from a legacy `user_roles` table to a new `user_profiles` system with dynamic `role_definitions`. This has resulted in:

- **Dual storage** of role data (both `role` text and `role_id` FK)
- **Legacy code** still being fetched but not written
- **Type inconsistencies** across the codebase
- **Critical bugs** in validation logic
- **Missing data integrity** constraints

### 1.2 Goals

| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | Fix critical validation bug | Role assignment works without errors |
| P1 | Complete migration from legacy system | Zero references to `user_roles` table |
| P2 | Strongly type permissions | No `Json` types in role definitions |
| P3 | Atomic user creation | Every user has a profile on creation |
| P4 | Add audit trail | All changes tracked with `created_by` |

### 1.3 Scope

**In Scope:**
- Fix bugs in `useUserRoles.ts`
- Remove legacy `user_roles` references
- Standardize types across codebase
- Add database constraints and audit columns
- Update `UserContext.tsx` to use only `user_profiles`

**Out of Scope:**
- Multiple roles per user (future enhancement)
- Granular permissions system (future enhancement)
- UI redesign

---

## 2. Current State Analysis

### 2.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT USER CREATION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Admin     │───▶│ UserForm    │───▶│   /api/     │───▶│  Supabase   │ │
│  │   clicks    │    │   Modal     │    │manage-users │    │   Auth      │ │
│  │  "Add User" │    │             │    │             │    │             │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘ │
│                                                                   │        │
│                                                                   ▼        │
│                                                           ┌─────────────┐  │
│                                                           │ auth.users  │  │
│                                                           │  (created)  │  │
│                                                           └──────┬──────┘  │
│                                                                  │         │
│                           ┌──────────────────────────────────────┘         │
│                           ▼                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│  │   Admin     │───▶│ RoleAssign  │───▶│useUserRoles │                    │
│  │   assigns   │    │   Modal     │    │  .upsert    │                    │
│  │    role     │    │             │    │UserProfile()│                    │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                    │
│                                               │                            │
│                                               ▼                            │
│                                        ┌─────────────┐                     │
│                                        │user_profiles│                     │
│                                        │  (created)  │                     │
│                                        └─────────────┘                     │
│                                                                            │
│  ⚠️ GAP: User exists in auth.users but NOT in user_profiles until         │
│         role is explicitly assigned                                        │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Inventory

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `src/hooks/entities/user/useUserRoles.ts` | 451 | Role operations hook | Validation bug (L62-64), dual storage |
| `src/contexts/UserContext.tsx` | ~400 | User state management | Legacy `user_roles` fetch, hardcoded types |
| `src/types/shared/userRoles.ts` | ~142 | Type definitions | Deprecated constants, inconsistent types |
| `src/app/admin/users/components/RoleAssignmentModal.tsx` | ~170 | Role assignment UI | Uses hook correctly now |
| `src/app/admin/users/components/UserFormModal.tsx` | ~480 | User edit form | Contains role management |
| `src/app/admin/users/components/CategorySelectionModal.tsx` | ~75 | Category picker | Works correctly |

### 2.3 Database Tables

```sql
-- PRIMARY: Dynamic role definitions
CREATE TABLE role_definitions (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- 'admin', 'coach', 'head_coach', 'member'
  display_name TEXT NOT NULL,       -- 'Administrator', 'Trenér'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',   -- {requires_categories: true, ...}
  created_at TIMESTAMPTZ
);

-- PRIMARY: User-role mapping (single role per user)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,               -- ⚠️ LEGACY: backward compat
  role_id UUID REFERENCES role_definitions(id), -- ✅ NEW: FK reference
  assigned_categories UUID[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  -- ❌ MISSING: created_by, updated_by audit columns
);

-- LEGACY: To be deprecated
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
```

### 2.4 Critical Bugs Identified

#### Bug #1: Validation Return Value (P0)

**Location:** `src/hooks/entities/user/useUserRoles.ts:62-64`

```typescript
// CURRENT (BUGGY)
return {
  valid: errors.length === 0,
  error  // ❌ Returns undefined - 'error' variable doesn't exist
};

// EXPECTED
return {
  valid: errors.length === 0,
  errors  // ✅ Returns the errors array
};
```

**Impact:** Validation always returns `error: undefined` even when there are validation errors.

#### Bug #2: Type Mismatch in UserContext

**Location:** `src/contexts/UserContext.tsx:21`

```typescript
// CURRENT (hardcoded)
role: 'admin' | 'coach' | 'head_coach' | 'member';

// EXPECTED (dynamic)
role: string;  // Or role_id with joined role_definitions
```

**Impact:** Adding new roles to database won't work without code changes.

---

## 3. Key Recommendations

### 3.1 Recommendation Matrix

| # | Recommendation | Priority | Effort | Risk | Dependencies |
|---|---------------|----------|--------|------|--------------|
| R1 | Fix validation bug | P0-Critical | Low | Low | None |
| R2 | Complete migration from legacy | P1-High | Medium | Medium | R1 |
| R3 | Strongly type permissions | P2-Medium | Medium | Low | R2 |
| R4 | Atomic user creation | P2-Medium | Medium | Medium | R2 |
| R5 | Add audit columns | P3-Low | Low | Low | R4 |
| R6 | Single source of truth | P1-High | Medium | Low | R1 |

### 3.2 Recommendation Details

#### R1: Fix Validation Bug

**Problem:** `validateRoleAssignment()` returns wrong value
**Solution:** Return `errors` array instead of undefined `error`
**Files:** `src/hooks/entities/user/useUserRoles.ts`

#### R2: Complete Migration from Legacy System

**Problem:** Code still references `user_roles` table
**Solution:** Remove all `user_roles` fetches and references
**Files:** `UserContext.tsx`, `useUserRoles.ts`, type files

#### R3: Strongly Type Permissions

**Problem:** Permissions stored as `Json` type
**Solution:** Create `RolePermissions` interface and use throughout
**Files:** Type definitions, hooks, components

#### R4: Atomic User Creation

**Problem:** Users can exist without profile
**Solution:** Create `user_profiles` entry during invitation
**Files:** `/api/manage-users/route.ts`, database trigger

#### R5: Add Audit Columns

**Problem:** No tracking of who made changes
**Solution:** Add `created_by`, `updated_by` to `user_profiles`
**Files:** Database migration, `useUserRoles.ts`

#### R6: Single Source of Truth

**Problem:** Multiple places handle role assignment
**Solution:** All operations through `useUserRoles` hook only
**Files:** Remove duplicate logic from modals

---

## 4. Detailed Implementation Plan

### Phase 1: Critical Bug Fixes (Day 1)

#### Task 1.1: Fix Validation Return Value

**File:** `src/hooks/entities/user/useUserRoles.ts`

**Current Code (Lines 61-65):**
```typescript
return {
  valid: errors.length === 0,
  error
};
```

**Fixed Code:**
```typescript
return {
  valid: errors.length === 0,
  errors: errors.length > 0 ? errors : undefined
};
```

**Also Update:** `ValidationResult` interface in `src/types/shared/userRoles.ts`

```typescript
// Current
export interface ValidationResult {
  valid: boolean;
  error?: string | null;
}

// Fixed
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
```

**Verification:**
1. Role assignment with missing data should show validation errors
2. Role assignment with valid data should succeed

---

#### Task 1.2: Update Error Handling in upsertUserProfile

**File:** `src/hooks/entities/user/useUserRoles.ts`

**Current Code (Lines 72-77):**
```typescript
const validation = validateRoleAssignment(input);
if (!validation.valid) {
  const errorMessage = validation.error;  // undefined!
  setError(errorMessage || 'Invalid role assignment');
  return {success: false, error: errorMessage};
}
```

**Fixed Code:**
```typescript
const validation = validateRoleAssignment(input);
if (!validation.valid) {
  const errorMessage = validation.errors?.join(', ') || 'Invalid role assignment';
  setError(errorMessage);
  return {success: false, error: errorMessage};
}
```

---

### Phase 2: Type Standardization (Days 2-3)

#### Task 2.1: Create RolePermissions Interface

**File:** `src/types/shared/userRoles.ts`

**Add:**
```typescript
/**
 * Strongly-typed role permissions
 * Replaces generic Json type from database schema
 */
export interface RolePermissions {
  /** Role requires category assignment (e.g., coach, head_coach) */
  requires_categories?: boolean;

  /** Can manage other users (admin only) */
  can_manage_users?: boolean;

  /** Can view all categories regardless of assignment */
  can_view_all_categories?: boolean;

  /** Future permissions can be added here */
  [key: string]: boolean | undefined;
}

/**
 * Role definition with typed permissions
 */
export interface RoleDefinitionTyped {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  permissions: RolePermissions;
  created_at: string | null;
}
```

---

#### Task 2.2: Update UserContext Types

**File:** `src/contexts/UserContext.tsx`

**Current (Lines 18-25):**
```typescript
export interface UserProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'coach' | 'head_coach' | 'member';  // Hardcoded!
  assigned_categories: string[];
  created_at: string;
  updated_at: string;
}
```

**Updated:**
```typescript
export interface UserProfile {
  id: string;
  user_id: string;
  role: string;           // Dynamic from database
  role_id: string | null; // FK to role_definitions
  assigned_categories: string[] | null;
  created_at: string;
  updated_at: string;
}
```

---

#### Task 2.3: Remove Deprecated Constants

**File:** `src/types/shared/userRoles.ts`

**Remove or comment out:**
```typescript
// @deprecated - Remove these after migration
// export const VALID_ROLES = ['admin', 'coach', 'head_coach', 'member'] as const;
// export type UserRoleType = (typeof VALID_ROLES)[number];
// export const ROLES_REQUIRING_CATEGORIES: UserRoleType[] = ['coach', 'head_coach'];
```

**Update all usages to use dynamic role definitions instead.**

---

### Phase 3: Remove Legacy Code (Days 4-5)

#### Task 3.1: Remove user_roles Fetch from UserContext

**File:** `src/contexts/UserContext.tsx`

**Remove the fetchRoles function that queries user_roles table:**

**Current (approximately lines 221-236):**
```typescript
// Fetch from legacy user_roles table
const fetchRoles = useCallback(async () => {
  // ... fetches from user_roles
}, []);
```

**Action:** Remove this function entirely. The `userProfile.role` from `user_profiles` is the source of truth.

---

#### Task 3.2: Update hasRole in useUserRoles

**File:** `src/hooks/entities/user/useUserRoles.ts`

**Current (Lines 351-368):**
```typescript
const hasRole = useCallback(async (role: 'admin' | 'coach'): Promise<boolean> => {
  try {
    if (!user) return false;

    // Check user_profiles table (primary system)
    if (userProfile?.role === role) {
      return true;
    }

    // Fallback: Check user_roles table (legacy system)
    return userRoles.some((r) => r.role === role);  // ❌ Remove this
  } catch (err) {
    console.error('Error checking user role:', err);
    return false;
  }
}, [user, userProfile, userRoles]);
```

**Updated:**
```typescript
const hasRole = useCallback((role: string): boolean => {
  if (!user || !userProfile) return false;
  return userProfile.role === role;
}, [user, userProfile]);
```

---

#### Task 3.3: Remove role Text Column Usage

**File:** `src/hooks/entities/user/useUserRoles.ts`

**Current upsert (Lines 88-104):**
```typescript
.upsert({
  user_id: input.userId,
  role: input.roleName,              // ❌ Legacy text field
  role_id: input.roleId,             // ✅ FK reference
  assigned_categories: input.assignedCategories,
  updated_at: new Date().toISOString(),
})
```

**Phase 3a - Keep both (backward compat):** No change yet
**Phase 3b - Remove text field:** After database migration

```typescript
// After removing role column from database
.upsert({
  user_id: input.userId,
  role_id: input.roleId,             // Only FK reference
  assigned_categories: input.assignedCategories,
  updated_at: new Date().toISOString(),
})
```

---

### Phase 4: Atomic User Creation (Days 6-7)

#### Task 4.1: Create Profile on User Invitation

**File:** `src/app/api/manage-users/route.ts`

**Current flow:**
1. `inviteUserByEmail()` creates user in `auth.users`
2. Return `userId` to client
3. Client opens RoleAssignmentModal
4. User clicks assign → creates `user_profiles` entry

**New flow:**
1. `inviteUserByEmail()` creates user in `auth.users`
2. **Immediately create `user_profiles` entry with default role**
3. Return `userId` to client
4. Client can optionally change role

**Add after user creation (approximately line 145):**
```typescript
// Create default user_profiles entry
const defaultRoleId = await getDefaultRoleId(); // 'member' role
const { error: profileError } = await supabaseAdmin
  .from('user_profiles')
  .insert({
    user_id: userId,
    role_id: defaultRoleId,
    role: 'member',  // Legacy compat
    assigned_categories: null,
  });

if (profileError) {
  console.error('Failed to create user profile:', profileError);
  // Don't fail the whole operation, profile can be created later
}
```

---

#### Task 4.2: Alternative - Database Trigger

**SQL Migration:**
```sql
-- Create trigger to auto-create user_profiles on auth.users insert
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get the 'member' role ID
  SELECT id INTO default_role_id
  FROM role_definitions
  WHERE name = 'member'
  LIMIT 1;

  -- Create profile with default role
  INSERT INTO user_profiles (user_id, role_id, role)
  VALUES (NEW.id, default_role_id, 'member')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

---

### Phase 5: Audit Trail (Day 8)

#### Task 5.1: Add Audit Columns to Database

**SQL Migration:**
```sql
-- Add audit columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create trigger for updated_by
CREATE OR REPLACE FUNCTION update_user_profiles_audit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_profiles_audit_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_audit();
```

---

#### Task 5.2: Update Hook to Include Audit Data

**File:** `src/hooks/entities/user/useUserRoles.ts`

**Update upsert to include created_by:**
```typescript
const { data: { user: currentUser } } = await supabaseRef.current.auth.getUser();

const { data, error: upsertError } = await supabaseRef.current
  .from('user_profiles')
  .upsert({
    user_id: input.userId,
    role_id: input.roleId,
    assigned_categories: input.assignedCategories,
    updated_at: new Date().toISOString(),
    // Audit fields (created_by only on insert, trigger handles updated_by)
  }, {
    onConflict: 'user_id',
    ignoreDuplicates: false,
  })
  .select()
  .single();
```

---

### Phase 6: Cleanup & Verification (Days 9-10)

#### Task 6.1: Remove Legacy user_roles References

**Search and remove all references:**

```bash
# Find all references to user_roles
grep -r "user_roles" --include="*.ts" --include="*.tsx" src/
```

**Expected files to update:**
- `src/contexts/UserContext.tsx` - Remove interface, fetch, state
- `src/hooks/entities/user/useUserRoles.ts` - Remove fallback checks
- `src/types/shared/userRoles.ts` - Remove legacy interfaces
- `src/types/database/supabase.ts` - Keep (auto-generated), but don't use

---

#### Task 6.2: Update Exports

**File:** `src/types/shared/userRoles.ts`

**Remove from exports:**
```typescript
// Remove these exports
export { VALID_ROLES, ROLES_REQUIRING_CATEGORIES };
export type { UserRole };  // Legacy type
```

**Keep exports:**
```typescript
export type {
  UserProfile,
  UserRoleSummary,
  RoleAssignment,
  RolePermissions,
  RoleDefinitionTyped,
  ValidationResult,
  UpsertUserProfileInput,
  RoleOperationResult,
};
```

---

## 5. Database Migration Scripts

### 5.1 Migration Order

| Order | Migration | Reversible | Risk |
|-------|-----------|------------|------|
| 1 | Add audit columns | Yes | Low |
| 2 | Create auto-profile trigger | Yes | Low |
| 3 | Backfill missing profiles | Yes | Medium |
| 4 | Remove role text column | **No** | High |
| 5 | Drop user_roles table | **No** | High |

### 5.2 Migration Scripts

#### Migration 1: Add Audit Columns
```sql
-- 001_add_audit_columns.sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
```

#### Migration 2: Auto-Profile Trigger
```sql
-- 002_auto_profile_trigger.sql
-- See Task 4.2 above
```

#### Migration 3: Backfill Missing Profiles
```sql
-- 003_backfill_profiles.sql
INSERT INTO user_profiles (user_id, role_id, role)
SELECT
  u.id,
  (SELECT id FROM role_definitions WHERE name = 'member'),
  'member'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.user_id = u.id
);
```

#### Migration 4: Remove Legacy Role Column (DANGEROUS)
```sql
-- 004_remove_role_column.sql
-- ⚠️ Only run after all code updated to use role_id
-- ⚠️ Backup data first!

-- First, ensure all profiles have role_id
UPDATE user_profiles p
SET role_id = rd.id
FROM role_definitions rd
WHERE p.role = rd.name
  AND p.role_id IS NULL;

-- Then drop the column
ALTER TABLE user_profiles DROP COLUMN role;
```

#### Migration 5: Drop Legacy Table (DANGEROUS)
```sql
-- 005_drop_user_roles.sql
-- ⚠️ Only run after verification period
-- ⚠️ Backup data first!

DROP TABLE IF EXISTS user_roles;
```

---

## 6. Testing Strategy

### 6.1 Test Cases

| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| T1 | Create user and verify profile created | Integration | P0 |
| T2 | Assign role and verify validation | Unit | P0 |
| T3 | Assign role requiring categories without categories | Unit | P0 |
| T4 | Change role and verify single profile | Integration | P1 |
| T5 | Check hasRole returns correct value | Unit | P1 |
| T6 | Verify audit columns populated | Integration | P2 |

### 6.2 Manual Testing Checklist

```markdown
## Pre-Migration Verification

- [ ] Current user creation works
- [ ] Role assignment works (existing flow)
- [ ] Category assignment works for coaches
- [ ] Admin can view all users with roles

## Post-Phase 1 (Bug Fixes)

- [ ] Validation errors display correctly
- [ ] Role assignment with missing role_id fails
- [ ] Role assignment with inactive role fails
- [ ] Coach role without categories shows error

## Post-Phase 3 (Legacy Removal)

- [ ] No console errors about user_roles
- [ ] hasRole() works without legacy fallback
- [ ] UserContext loads without user_roles fetch

## Post-Phase 4 (Atomic Creation)

- [ ] New user automatically has profile
- [ ] New user has 'member' role by default
- [ ] Can change role after creation
```

---

## 7. Rollback Plan

### 7.1 Phase Rollback Procedures

| Phase | Rollback Procedure | Time to Rollback |
|-------|-------------------|------------------|
| Phase 1 | Revert code changes (git) | 5 minutes |
| Phase 2 | Revert code changes (git) | 5 minutes |
| Phase 3 | Revert code changes (git) | 10 minutes |
| Phase 4 | Drop trigger, revert code | 15 minutes |
| Phase 5 | Revert code, restore columns | 30 minutes |

### 7.2 Database Rollback Scripts

```sql
-- Rollback Migration 1
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by;

-- Rollback Migration 2
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Rollback Migration 4 (requires backup)
ALTER TABLE user_profiles ADD COLUMN role TEXT;
UPDATE user_profiles p
SET role = rd.name
FROM role_definitions rd
WHERE p.role_id = rd.id;
```

### 7.3 Emergency Contacts

| Role | Action |
|------|--------|
| Developer | Revert git commits |
| DBA | Execute rollback SQL |
| DevOps | Redeploy previous version |

---

## Appendix A: File Change Summary

| File | Phase | Changes |
|------|-------|---------|
| `src/hooks/entities/user/useUserRoles.ts` | 1, 3 | Fix validation, remove legacy |
| `src/contexts/UserContext.tsx` | 2, 3 | Update types, remove user_roles |
| `src/types/shared/userRoles.ts` | 1, 2, 6 | Fix types, add interfaces |
| `src/app/api/manage-users/route.ts` | 4 | Auto-create profile |
| Database | 5 | Add columns, triggers |

---

## Appendix B: Dependency Graph

```
Phase 1 (Bug Fixes)
    │
    ├── No dependencies
    │
    ▼
Phase 2 (Types)
    │
    ├── Depends on: Phase 1 complete
    │
    ▼
Phase 3 (Legacy Removal)
    │
    ├── Depends on: Phase 2 complete
    │
    ▼
Phase 4 (Atomic Creation)        Phase 5 (Audit)
    │                                │
    ├── Depends on: Phase 3          ├── Depends on: Phase 4
    │                                │
    ▼                                ▼
Phase 6 (Cleanup)
    │
    ├── Depends on: Phase 4 & 5
    │
    ▼
    DONE
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| `user_profiles` | Primary table for user-role mapping (one role per user) |
| `user_roles` | Legacy table, deprecated, to be removed |
| `role_definitions` | Dynamic role configuration table |
| `assigned_categories` | Array of category UUIDs a user can access |
| `requires_categories` | Permission flag indicating role needs category assignment |

---

*Document maintained by: Development Team*
*Last updated: 2026-01-28*