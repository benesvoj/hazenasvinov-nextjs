# User Profiles RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.user_profiles` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `user_profiles` table was created without Row Level Security (RLS) enabled, which is a **critical security risk** because:

1. **No Access Control**: Any authenticated user can read/write all user profile data
2. **Role Exposure**: User roles and permissions are visible to all users
3. **Data Integrity**: Users might modify other users' profiles or roles
4. **Privilege Escalation**: Users could potentially change their own roles
5. **Compliance Issues**: Sensitive user data is not properly protected

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Create Strict RLS Policies

Since `user_profiles` contains sensitive user role information, we need strict access control:

#### User Access Policies
```sql
-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        -- Prevent users from changing their own role
        role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
    );
```

#### Admin Access Policies
```sql
-- Policy 3: Allow admins to read all user profiles
CREATE POLICY "Admins can read all user profiles" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 4: Allow admins to insert new user profiles
CREATE POLICY "Admins can insert user profiles" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 5: Allow admins to update any user profile
CREATE POLICY "Admins can update any user profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 6: Allow admins to delete user profiles
CREATE POLICY "Admins can delete user profiles" ON user_profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );
```

### 3. Grant Appropriate Permissions

```sql
-- Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
```

## 📋 How to Apply the Fix

### Option 1: Automated Script (Recommended)

1. **Set up environment variables** in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the automated script**:
   ```bash
   cd scripts
   node fix-user-profiles-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_user_profiles_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read all user profiles
- ❌ Users could modify other users' profiles
- ❌ Users could potentially change their own roles
- ❌ No access control on sensitive operations
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Users can only access their own profile data
- ✅ Users cannot modify other users' profiles
- ✅ Users cannot change their own roles
- ✅ Admins have full access for user management
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `user_profiles` table contains sensitive user information:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `user_id` | UUID | Reference to auth.users | Own profile only |
| `role` | VARCHAR | User role (admin, coach, etc.) | Own profile only |
| `assigned_categories` | UUID[] | Categories assigned to coach | Own profile only |
| `created_at` | TIMESTAMP | Record creation time | Own profile only |
| `updated_at` | TIMESTAMP | Record update time | Own profile only |
| `created_by` | UUID | Who created this profile | Own profile only |

## 🔍 Data Access Patterns

### User Access (Own Profile Only)
- ✅ Read their own profile data
- ✅ Update their own profile (except role)
- ❌ Cannot read other users' profiles
- ❌ Cannot modify other users' profiles
- ❌ Cannot change their own role

### Admin Access (Full Access)
- ✅ Read all user profiles
- ✅ Create new user profiles
- ✅ Update any user profile
- ✅ Delete user profiles
- ✅ Change user roles

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the user_profiles table
3. **Policies are created** and working correctly
4. **Users can only access their own profile**
5. **Admins can access all profiles**
6. **Role changes are restricted to admins**
7. **No functionality is broken** in the application

## 📝 Notes

- This table contains sensitive user role information
- Access is strictly controlled with RLS policies
- Users cannot escalate their own privileges
- Admins have full access for user management
- The table is critical for the application's security model

**Important**: This security fix is **critical** for protecting user data and should be applied immediately.
