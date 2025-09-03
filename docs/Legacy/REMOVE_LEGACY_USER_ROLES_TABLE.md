# Removing Legacy `user_roles` Table - Migration Guide

## 📋 Overview

This document outlines the systematic approach to remove the legacy `user_roles` table and fully migrate to the `user_profiles` table as the single source of truth for user roles and permissions.

## 🎯 Current State

### **Active Dependencies on `user_roles` Table:**

#### **Code Dependencies:**
- `src/hooks/useUserRoles.ts` - Checks `user_roles` first, then falls back to `user_profiles`
- `src/app/admin/users/components/RoleAssignmentModal.tsx` - Creates entries in both tables
- Database views and functions still reference the table

#### **Database Dependencies:**
- `user_role_summary` view joins both tables
- `get_user_roles()` function queries `user_roles`
- `has_admin_access()` function checks both tables
- RLS policies exist for `user_roles` table

#### **Data Dependencies:**
- Existing users may have roles only in `user_roles` table
- Migration scripts reference the table
- Helper functions provide backward compatibility

---

## 🚀 Migration Phases

### **Phase 1: Code Updates (Required)**

#### **1.1 Update `useUserRoles.ts` Hook**

**File:** `src/hooks/useUserRoles.ts`

**Current Code:**
```typescript
// Try user_roles table first (new system)
const { data: roleData, error: roleError } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', role);

if (!roleError && roleData && roleData.length > 0) {
  return true;
}

// Fallback to user_profiles table (legacy system)
const { data: profileData, error: profileError } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', role);
```

**Updated Code:**
```typescript
// Use only user_profiles table (primary system)
const { data: profileData, error: profileError } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', role);

if (!profileError && profileData && profileData.length > 0) {
  return true;
}

return false;
```

**Changes Required:**
- Remove all `user_roles` table queries
- Update comments to reflect `user_profiles` as primary system
- Remove fallback logic
- Update error handling

#### **1.2 Update `RoleAssignmentModal.tsx`**

**File:** `src/app/admin/users/components/RoleAssignmentModal.tsx`

**Current Code:**
```typescript
// If it's a coach role, also create user_roles entries
if (selectedRole === 'coach' || selectedRole === 'head_coach') {
  const { error: rolesError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: selectedRole,
      assigned_categories: []
    });

  if (rolesError) {
    console.warn('Could not create user_roles entry:', rolesError);
  }
}
```

**Updated Code:**
```typescript
// Remove this entire block - only user_profiles is needed
// The user_profiles table already handles all role assignments
```

**Changes Required:**
- Remove the entire `user_roles` insertion block
- Update comments to reflect single-table approach
- Remove related error handling

#### **1.3 Update Database Functions**

**File:** `scripts/building-app/create_user_roles_system.sql`

**Functions to Update:**
1. `get_user_roles(user_uuid UUID)`
2. `has_admin_access(user_uuid UUID)`
3. `user_role_summary` view

**Updated `get_user_roles` Function:**
```sql
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT up.role
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Updated `has_admin_access` Function:**
```sql
CREATE OR REPLACE FUNCTION has_admin_access(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = user_uuid 
        AND up.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Updated `user_role_summary` View:**
```sql
CREATE OR REPLACE VIEW user_role_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(
        up.full_name,
        u.raw_user_meta_data->>'full_name',
        u.email
    ) as full_name,
    up.role as profile_role,
    COALESCE(array_agg(DISTINCT up.role) FILTER (WHERE up.role IS NOT NULL), '{}') as roles,
    COALESCE(up.assigned_categories, '{}') as assigned_categories,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
    COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN categories c ON c.id = ANY(up.assigned_categories)
GROUP BY u.id, u.email, up.full_name, u.raw_user_meta_data, up.role, up.assigned_categories;
```

---

### **Phase 2: Data Migration (Required)**

#### **2.1 Create Migration Script**

**File:** `scripts/migrate-user-roles-to-profiles.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateUserRolesToProfiles() {
  console.log('🔄 Starting migration from user_roles to user_profiles...');
  
  try {
    // 1. Get all users with roles in user_roles table
    const { data: userRoles, error: fetchError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        created_by
      `);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Found ${userRoles.length} role entries to migrate`);

    // 2. Check which users already have profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role');

    if (profilesError) {
      throw profilesError;
    }

    const existingUserIds = new Set(existingProfiles.map(p => p.user_id));
    console.log(`📋 Found ${existingUserIds.size} existing user profiles`);

    // 3. Migrate roles for users without profiles
    const usersToMigrate = userRoles.filter(ur => !existingUserIds.has(ur.user_id));
    console.log(`🔄 Migrating ${usersToMigrate.length} users without profiles`);

    for (const userRole of usersToMigrate) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userRole.user_id,
          role: userRole.role,
          assigned_categories: userRole.role === 'coach' ? [] : null,
          created_at: userRole.created_at,
          created_by: userRole.created_by
        });

      if (insertError) {
        console.error(`❌ Error migrating user ${userRole.user_id}:`, insertError);
      } else {
        console.log(`✅ Migrated user ${userRole.user_id} with role ${userRole.role}`);
      }
    }

    // 4. Handle users with both user_roles and user_profiles
    const usersWithBoth = userRoles.filter(ur => existingUserIds.has(ur.user_id));
    console.log(`⚠️  Found ${usersWithBoth.length} users with roles in both tables`);

    for (const userRole of usersWithBoth) {
      const existingProfile = existingProfiles.find(p => p.user_id === userRole.user_id);
      
      if (existingProfile.role !== userRole.role) {
        console.log(`🔄 Updating role for user ${userRole.user_id}: ${existingProfile.role} → ${userRole.role}`);
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            role: userRole.role,
            assigned_categories: userRole.role === 'coach' ? [] : null
          })
          .eq('user_id', userRole.user_id);

        if (updateError) {
          console.error(`❌ Error updating user ${userRole.user_id}:`, updateError);
        } else {
          console.log(`✅ Updated user ${userRole.user_id} role to ${userRole.role}`);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserRolesToProfiles();
```

#### **2.2 Data Validation Script**

**File:** `scripts/validate-migration.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateMigration() {
  console.log('🔍 Validating migration results...');
  
  try {
    // 1. Count users in both tables
    const { count: userRolesCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    const { count: userProfilesCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 user_roles table: ${userRolesCount} entries`);
    console.log(`📊 user_profiles table: ${userProfilesCount} entries`);

    // 2. Check for users with roles in user_roles but not in user_profiles
    const { data: orphanedRoles, error: orphanError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .not('user_id', 'in', `(SELECT user_id FROM user_profiles)`);

    if (orphanError) {
      throw orphanError;
    }

    if (orphanedRoles.length > 0) {
      console.log(`⚠️  Found ${orphanedRoles.length} orphaned roles in user_roles table:`);
      orphanedRoles.forEach(role => {
        console.log(`   - User ${role.user_id}: ${role.role}`);
      });
    } else {
      console.log('✅ No orphaned roles found');
    }

    // 3. Check role distribution
    const { data: roleDistribution, error: roleError } = await supabase
      .from('user_profiles')
      .select('role')
      .not('role', 'is', null);

    if (roleError) {
      throw roleError;
    }

    const roleCounts = roleDistribution.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Role distribution in user_profiles:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} users`);
    });

    console.log('✅ Validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation
validateMigration();
```

---

### **Phase 3: Testing (Required)**

#### **3.1 Functional Testing Checklist**

**Role Management:**
- [ ] Create new user with admin role
- [ ] Create new user with coach role + categories
- [ ] Create new user with head_coach role + categories
- [ ] Create new user with member role
- [ ] Edit existing user roles
- [ ] Delete user roles
- [ ] Assign categories to coaches

**Access Control:**
- [ ] Admin users can access admin portal
- [ ] Coach users can access coach portal
- [ ] Users without roles are blocked
- [ ] Middleware correctly checks user_profiles
- [ ] RLS policies work correctly

**Data Integrity:**
- [ ] All users have roles in user_profiles
- [ ] No orphaned data in user_roles
- [ ] Category assignments work correctly
- [ ] User role summary view works
- [ ] Database functions return correct data

#### **3.2 Test Script**

**File:** `scripts/test-role-system.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRoleSystem() {
  console.log('🧪 Testing role system functionality...');
  
  try {
    // Test 1: Check if user_role_summary view works
    console.log('🔍 Testing user_role_summary view...');
    const { data: summaryData, error: summaryError } = await supabase
      .from('user_role_summary')
      .select('*')
      .limit(5);

    if (summaryError) {
      throw summaryError;
    }
    console.log(`✅ user_role_summary view works: ${summaryData.length} records`);

    // Test 2: Check if get_user_roles function works
    console.log('🔍 Testing get_user_roles function...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_user_roles', { user_uuid: summaryData[0]?.user_id });

    if (functionError) {
      throw functionError;
    }
    console.log(`✅ get_user_roles function works: ${functionData.length} roles`);

    // Test 3: Check if has_admin_access function works
    console.log('🔍 Testing has_admin_access function...');
    const { data: adminData, error: adminError } = await supabase
      .rpc('has_admin_access', { user_uuid: summaryData[0]?.user_id });

    if (adminError) {
      throw adminError;
    }
    console.log(`✅ has_admin_access function works: ${adminData}`);

    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testRoleSystem();
```

---

### **Phase 4: Cleanup (Optional)**

#### **4.1 Remove Legacy Code**

**Files to Clean Up:**
- Remove `user_roles` references from documentation
- Update database comments
- Remove unused migration scripts
- Clean up test files

#### **4.2 Drop Legacy Database Objects**

**SQL Script:** `scripts/cleanup-legacy-user-roles.sql`

```sql
-- Drop RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_role;

-- Drop the table
DROP TABLE IF EXISTS user_roles;

-- Update comments
COMMENT ON TABLE user_profiles IS 'Primary user role and profile storage';
COMMENT ON FUNCTION get_user_roles(UUID) IS 'Get all roles for a specific user from user_profiles';
COMMENT ON FUNCTION has_admin_access(UUID) IS 'Check if user has admin access via user_profiles';
```

---

## 📋 Migration Checklist

### **Pre-Migration:**
- [ ] Backup database
- [ ] Test migration script on staging environment
- [ ] Verify all code changes are deployed
- [ ] Schedule maintenance window

### **Migration:**
- [ ] Run data migration script
- [ ] Run validation script
- [ ] Run test script
- [ ] Verify all functionality works
- [ ] Monitor application for errors

### **Post-Migration:**
- [ ] Update documentation
- [ ] Remove legacy code
- [ ] Drop legacy database objects
- [ ] Clean up migration scripts
- [ ] Notify team of completion

---

## ⚠️ Rollback Plan

If issues are discovered after migration:

1. **Immediate Rollback:**
   ```sql
   -- Restore user_roles table from backup
   -- Revert code changes
   -- Restart application
   ```

2. **Data Recovery:**
   ```sql
   -- Restore user_roles data from backup
   -- Verify data integrity
   -- Test functionality
   ```

3. **Investigation:**
   - Identify root cause of issues
   - Fix problems in staging
   - Plan new migration attempt

---

## 📞 Support

If you encounter issues during migration:

1. Check the application logs for errors
2. Verify database connectivity
3. Test individual components
4. Contact the development team

**Remember:** This is a significant database schema change. Take your time, test thoroughly, and have a rollback plan ready!
