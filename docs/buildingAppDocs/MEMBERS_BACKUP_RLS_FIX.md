# Members Backup RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.members_backup` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `members_backup` table was created without Row Level Security (RLS) enabled, which is a **critical security risk** because:

1. **No Access Control**: Any authenticated user can read/write all backup member data
2. **Sensitive Data Exposure**: Member names, dates of birth, and personal information are visible to all users
3. **Data Integrity**: Users might modify or delete backup member data
4. **Privacy Violation**: Personal information is not properly protected
5. **Compliance Issues**: Sensitive backup data is not properly secured

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the members_backup table
ALTER TABLE members_backup ENABLE ROW LEVEL SECURITY;
```

### 2. Create Strict RLS Policies

Since `members_backup` contains highly sensitive member backup data, we need **strict admin-only access control**:

#### Admin-Only Access (All Operations)
```sql
-- Policy 1: Allow admins to read members_backup data
CREATE POLICY "Allow admins to read members_backup" ON members_backup
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 2: Allow admins to insert into members_backup
CREATE POLICY "Allow admins to insert members_backup" ON members_backup
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update members_backup
CREATE POLICY "Allow admins to update members_backup" ON members_backup
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

-- Policy 4: Allow admins to delete from members_backup
CREATE POLICY "Allow admins to delete members_backup" ON members_backup
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
GRANT SELECT ON members_backup TO authenticated;
GRANT INSERT, UPDATE, DELETE ON members_backup TO authenticated;
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
   node fix-members-backup-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_members_backup_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read all backup member data
- ❌ Users could modify or delete backup member data
- ❌ Sensitive personal information exposed to all users
- ❌ No access control on sensitive operations
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Admin-only access to backup member data
- ✅ Sensitive personal information protected
- ✅ No unauthorized access to member backup data
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `members_backup` table contains highly sensitive member backup data:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Admin only |
| `name` | VARCHAR | Member first name | Admin only |
| `surname` | VARCHAR | Member last name | Admin only |
| `date_of_birth` | DATE | Member date of birth | Admin only |
| `category_id` | UUID | Reference to categories | Admin only |
| `sex` | VARCHAR | Member gender | Admin only |
| `functions` | TEXT[] | Member functions/roles | Admin only |
| `created_at` | TIMESTAMP | Creation time | Admin only |
| `updated_at` | TIMESTAMP | Update time | Admin only |

## 🔍 Data Access Patterns

### Admin Access (Full Access)
- ✅ Read all backup member data
- ✅ Create new backup records
- ✅ Update backup member data
- ✅ Delete backup records
- ✅ Access all sensitive personal information

### User Access (No Access)
- ❌ Cannot read backup member data
- ❌ Cannot create backup records
- ❌ Cannot update backup member data
- ❌ Cannot delete backup records
- ❌ No access to sensitive personal information

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the members_backup table
3. **Policies are created** and working correctly
4. **Only admins can access backup data**
5. **Regular users cannot access backup data**
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains highly sensitive member backup data
- Access is strictly restricted to admins only
- Contains personal information (names, dates of birth, etc.)
- Backup data should be treated with the same security as production data
- The table is used for data migration and backup purposes

**Important**: This security fix is **critical** for protecting sensitive member data and should be applied immediately.
