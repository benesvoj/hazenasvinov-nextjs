# Clubs RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.clubs` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `clubs` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all club data
2. **Data Integrity**: Users might modify club information and contact details
3. **Configuration Exposure**: Club settings might be accessible to unauthorized users
4. **Compliance Issues**: Database tables should have proper access controls

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the clubs table
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `clubs` contains public club information, we need balanced access control:

#### Public Read Access (Club Information)
```sql
-- Policy 1: Allow all authenticated users to read clubs data
CREATE POLICY "Allow authenticated users to read clubs" ON clubs
    FOR SELECT
    TO authenticated
    USING (true);
```

#### Admin Write Access (Club Management)
```sql
-- Policy 2: Allow admins to insert new clubs
CREATE POLICY "Allow admins to insert clubs" ON clubs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update clubs
CREATE POLICY "Allow admins to update clubs" ON clubs
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

-- Policy 4: Allow admins to delete clubs
CREATE POLICY "Allow admins to delete clubs" ON clubs
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
GRANT SELECT ON clubs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON clubs TO authenticated;
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
   node fix-clubs-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_clubs_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read/write all data
- ❌ No access control on club data
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Public read access for club information
- ✅ Admin-only write access for data integrity
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `clubs` table contains club information:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `name` | VARCHAR | Club name | Public |
| `short_name` | VARCHAR | Club short name | Public |
| `logo_url` | TEXT | Club logo URL | Public |
| `city` | VARCHAR | Club city | Public |
| `founded_year` | INTEGER | Year club was founded | Public |
| `is_active` | BOOLEAN | Whether club is active | Public |
| `created_at` | TIMESTAMP | Creation time | Public |
| `updated_at` | TIMESTAMP | Update time | Public |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View club names and information
- ✅ See club logos and contact details
- ✅ Access club cities and founding years
- ✅ View active/inactive status

### Write Access (Admins Only)
- ✅ Create new clubs
- ✅ Update club information
- ✅ Delete clubs
- ✅ Modify club settings and details

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the clubs table
3. **Policies are created** and working correctly
4. **Public read access works** for club data
5. **Admin write access works** for club management
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains public club information
- Read access is safe for all authenticated users
- Write access is restricted to admins for data integrity
- Club information is public data needed by the application
- Contact details and club settings are public information

**Important**: This security fix is important for maintaining proper access controls and should be applied immediately.
