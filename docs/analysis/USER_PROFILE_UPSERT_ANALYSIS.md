# User Profile System Analysis: Upsert Error & Schema Review

## Executive Summary

This document analyzes the PostgreSQL error `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification` encountered when upserting user profile data, and provides recommendations for schema improvements and process optimization.

---

## 1. Error Analysis

### 1.1 The Error

```json
{
  "code": "42P10",
  "details": null,
  "hint": null,
  "message": "there is no unique or exclusion constraint matching the ON CONFLICT specification"
}
```

### 1.2 Root Cause

**Mismatch between application code and database schema:**

| Component | ON CONFLICT Specification | Actual Constraint |
|-----------|---------------------------|-------------------|
| `RoleAssignmentModal.tsx:86` | `onConflict: 'user_id,role'` | `UNIQUE(user_id)` |
| `UserFormModal.tsx:152` | `onConflict: 'user_id,role'` | `UNIQUE(user_id)` |

The application expects a **composite unique constraint** on `(user_id, role)` to allow multiple roles per user, but the database only has a **single-column unique constraint** on `(user_id)`.

### 1.3 Code Locations Causing the Error

**File: `src/app/admin/users/components/RoleAssignmentModal.tsx` (lines 81-91)**
```typescript
const {error: profileError} = await supabase.from('user_profiles').upsert(
  {
    user_id: userId,
    role: role,
    assigned_categories: categories,
  },
  {
    onConflict: 'user_id,role',  // ❌ No matching constraint exists
    ignoreDuplicates: false,
  }
);
```

**File: `src/app/admin/users/components/UserFormModal.tsx` (lines 147-157)**
```typescript
const {error} = await supabase.from('user_profiles').upsert(
  {
    user_id: userId,
    role: role,
    assigned_categories: categories,
  },
  {
    onConflict: 'user_id,role',  // ❌ No matching constraint exists
    ignoreDuplicates: false,
  }
);
```

---

## 2. Current Database Schema

### 2.1 user_profiles Table

```sql
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'head_coach', 'member')),
    club_id UUID REFERENCES clubs(id),
    assigned_categories UUID[] DEFAULT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id)  -- ⚠️ This constraint causes the issue
);
```

### 2.2 Current Constraints

| Constraint Name | Type | Columns | Impact |
|-----------------|------|---------|--------|
| `user_profiles_pkey` | PRIMARY KEY | `id` | Standard PK |
| `user_profiles_user_id_key` | UNIQUE | `user_id` | **Prevents multiple roles per user** |
| `user_profiles_role_check` | CHECK | `role` | Validates role values |

### 2.3 Available Roles

```typescript
export enum UserRoles {
  ADMIN = 'admin',
  COACH = 'coach',
  HEAD_COACH = 'head_coach',
  MEMBER = 'member',
}
```

**Note:** The original request mentioned "blogger" role, but this is not implemented in the current system.

---

## 3. Schema Analysis & Issues

### 3.1 Issue 1: Constraint Mismatch (Critical)

**Problem:** The `UNIQUE(user_id)` constraint prevents users from having multiple roles.

**Business Impact:**
- A user cannot be both `admin` and `coach`
- Head coaches cannot also have admin privileges
- The application UI allows adding multiple roles, but the database rejects them

### 3.2 Issue 2: Category Assignment Model

**Current Implementation:** `assigned_categories UUID[]` (array column)

**Pros:**
- Simple, single-table design
- Fast reads (no JOINs needed)
- Easy to query with PostgreSQL array operators

**Cons:**
- No referential integrity to categories table
- Can't track who assigned which category or when
- Hard to query "all coaches for category X" efficiently
- Array indexes (GIN) are less efficient than B-tree indexes

### 3.3 Issue 3: Role Management Flexibility

**Current Implementation:** Single `role` TEXT column with CHECK constraint

**Limitations:**
- One role per profile record
- Adding a new role requires ALTER TABLE
- No role hierarchy or inheritance

### 3.4 Issue 4: Dual Table System (Legacy Debt)

The codebase has both:
- `user_profiles` table (primary)
- `user_roles` table (legacy)

This creates confusion and potential data inconsistency.

---

## 4. Recommended Solutions

### 4.1 Immediate Fix: Update Database Constraint

**Option A: Allow Multiple Roles per User (Recommended)**

Run the following SQL migration:

```sql
-- Step 1: Drop the old constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- Step 2: Add composite unique constraint
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_role_key
UNIQUE (user_id, role);

-- Step 3: Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
ON user_profiles(user_id);
```

**Option B: Single Role per User**

If business logic requires one role per user, update the application code:

```typescript
// In RoleAssignmentModal.tsx and UserFormModal.tsx
const {error} = await supabase.from('user_profiles').upsert(
  {
    user_id: userId,
    role: role,
    assigned_categories: categories,
  },
  {
    onConflict: 'user_id',  // Changed from 'user_id,role'
    ignoreDuplicates: false,
  }
);
```

### 4.2 Schema Improvement: Category Assignment

**Recommended: Hybrid Approach**

Keep `assigned_categories UUID[]` for quick access, but add a join table for detailed tracking:

```sql
-- Join table for detailed tracking
CREATE TABLE coach_category_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),

    UNIQUE(user_profile_id, category_id)
);

-- Trigger to sync with user_profiles.assigned_categories
CREATE OR REPLACE FUNCTION sync_assigned_categories()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET assigned_categories = (
        SELECT COALESCE(array_agg(category_id), '{}')
        FROM coach_category_assignments
        WHERE user_profile_id = COALESCE(NEW.user_profile_id, OLD.user_profile_id)
    )
    WHERE id = COALESCE(NEW.user_profile_id, OLD.user_profile_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_categories_on_change
AFTER INSERT OR UPDATE OR DELETE ON coach_category_assignments
FOR EACH ROW EXECUTE FUNCTION sync_assigned_categories();
```

### 4.3 Role Management Improvement

**For Future Extensibility: Normalize Roles**

```sql
-- Role definitions table
CREATE TABLE role_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO role_definitions (name, display_name, description) VALUES
    ('admin', 'Administrator', 'Full system access'),
    ('head_coach', 'Hlavní trenér', 'Team management and coach oversight'),
    ('coach', 'Trenér', 'Category-specific coaching access'),
    ('member', 'Člen', 'Basic member access'),
    ('blogger', 'Blogger', 'Content creation access');

-- Update user_profiles to reference role_definitions
ALTER TABLE user_profiles
ADD COLUMN role_id UUID REFERENCES role_definitions(id);

-- Migrate existing data
UPDATE user_profiles up
SET role_id = rd.id
FROM role_definitions rd
WHERE up.role = rd.name;
```

---

## 5. Implementation Plan

### Phase 1: Immediate Fix (Critical)

**Priority:** HIGH | **Effort:** 1 hour

1. **Backup data:**
   ```sql
   CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;
   ```

2. **Check for duplicates:**
   ```sql
   SELECT user_id, role, COUNT(*)
   FROM user_profiles
   GROUP BY user_id, role
   HAVING COUNT(*) > 1;
   ```

3. **Apply constraint fix:**
   ```sql
   ALTER TABLE user_profiles
   DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

   ALTER TABLE user_profiles
   ADD CONSTRAINT user_profiles_user_id_role_key
   UNIQUE (user_id, role);
   ```

4. **Test upsert operations**

### Phase 2: Code Cleanup (Medium)

**Priority:** MEDIUM | **Effort:** 4 hours

1. Remove duplicate role assignment logic
2. Consolidate `useUserRoles` hook to use single upsert pattern
3. Add proper error handling and validation
4. Update TypeScript types to match schema

### Phase 3: Schema Optimization (Low)

**Priority:** LOW | **Effort:** 2-3 days

1. Implement `coach_category_assignments` table
2. Add sync trigger
3. Migrate existing data
4. Update application to use new structure
5. Add proper RLS policies

---

## 6. Best Practices for Upsert Operations

### 6.1 Always Verify Constraints Exist

```typescript
// Good: Check constraint exists before relying on it
const { data: constraints } = await supabase.rpc('get_table_constraints', {
  table_name: 'user_profiles'
});

if (!constraints.includes('user_profiles_user_id_role_key')) {
  throw new Error('Required constraint missing');
}
```

### 6.2 Use Explicit Column Selection

```typescript
// Good: Specify exactly which columns to update on conflict
const { error } = await supabase
  .from('user_profiles')
  .upsert({
    user_id: userId,
    role: role,
    assigned_categories: categories,
    updated_at: new Date().toISOString(),
  })
  .onConflict('user_id,role')
  .select();  // Return the result for verification
```

### 6.3 Handle Upsert Errors Gracefully

```typescript
try {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profileData, { onConflict: 'user_id,role' });

  if (error) {
    if (error.code === '42P10') {
      // Constraint mismatch - fall back to insert/update pattern
      return await fallbackInsertUpdate(profileData);
    }
    throw error;
  }
  return data;
} catch (err) {
  console.error('Profile upsert failed:', err);
  showToast.danger('Failed to save profile');
}
```

### 6.4 Validate Before Upsert

```typescript
// Good: Validate data before database operation
function validateProfileData(data: ProfileData): ValidationResult {
  const errors: string[] = [];

  if (!data.user_id) errors.push('user_id is required');
  if (!VALID_ROLES.includes(data.role)) errors.push('Invalid role');
  if (data.role === 'coach' && !data.assigned_categories?.length) {
    errors.push('Coaches must have at least one category');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 7. Security Considerations

### 7.1 RLS Policies

Ensure proper Row Level Security policies exist:

```sql
-- Only admins can modify user_profiles
CREATE POLICY "Admins can manage all profiles"
ON user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### 7.2 Role Validation

Always validate role changes server-side:

```typescript
// API route: Only admins can assign admin role
if (newRole === 'admin' && !currentUser.isAdmin) {
  throw new Error('Unauthorized: Only admins can assign admin role');
}
```

---

## 8. Testing Checklist

- [ ] Upsert new user profile succeeds
- [ ] Upsert existing user profile updates correctly
- [ ] Multiple roles for same user work (if Option A chosen)
- [ ] Role change preserves assigned_categories
- [ ] Category assignment updates work
- [ ] Deleting user cascades to user_profiles
- [ ] RLS policies enforce proper access control
- [ ] Error handling shows user-friendly messages

---

## 9. Files to Update

| File | Change Required |
|------|-----------------|
| `scripts/migrations/fix_user_profiles_constraint.sql` | New migration file |
| `src/app/admin/users/components/RoleAssignmentModal.tsx` | Add error handling |
| `src/app/admin/users/components/UserFormModal.tsx` | Add error handling |
| `src/hooks/entities/user/useUserRoles.ts` | Consolidate upsert logic |
| `src/types/database/supabase.ts` | Regenerate after migration |

---

## 10. Conclusion

The upsert error is caused by a **mismatch between the application's expected constraint (`user_id, role`) and the actual database constraint (`user_id`)**.

**Recommended immediate action:** Apply the database migration to add the composite unique constraint, allowing users to have multiple roles with different category assignments.

**Long-term recommendation:** Implement the normalized role and category assignment tables for better data integrity, auditability, and query performance.
