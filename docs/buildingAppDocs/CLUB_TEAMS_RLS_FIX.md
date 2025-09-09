# Club Teams RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.club_teams` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `club_teams` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all data in the table
2. **Data Exposure**: Sensitive information might be accessible to unauthorized users
3. **Data Integrity**: Users might modify data they shouldn't have access to
4. **Compliance Issues**: Many security standards require RLS for public tables

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the club_teams table
ALTER TABLE club_teams ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `club_teams` contains public club-team relationship data, we'll create policies that:

- **Allow all authenticated users to read** (public information)
- **Allow only admins to write** (data integrity)

```sql
-- Policy 1: Allow all authenticated users to read club_teams data
CREATE POLICY "Allow authenticated users to read club_teams" ON club_teams
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow admins to insert new club_teams relationships
CREATE POLICY "Allow admins to insert club_teams" ON club_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_teams relationships
CREATE POLICY "Allow admins to update club_teams" ON club_teams
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

-- Policy 4: Allow admins to delete club_teams relationships
CREATE POLICY "Allow admins to delete club_teams" ON club_teams
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
GRANT SELECT ON club_teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_teams TO authenticated;
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
   node fix-club-teams-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_club_teams_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read/write all data
- ❌ No access control on sensitive operations
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Public read access for club-team relationships
- ✅ Admin-only write access for data integrity
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `club_teams` table contains club-team relationship data:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `club_id` | UUID | Reference to clubs table | Public |
| `team_id` | UUID | Reference to teams table | Public |
| `team_suffix` | TEXT | Team suffix (A, B, C, etc.) | Public |
| `is_primary` | BOOLEAN | Whether this is the primary team | Public |
| `created_at` | TIMESTAMP | Record creation time | Public |
| `updated_at` | TIMESTAMP | Record update time | Public |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View club-team relationships
- ✅ See which teams belong to which clubs
- ✅ Access team suffixes and primary team status
- ✅ View creation/update timestamps

### Write Access (Admins Only)
- ✅ Create new club-team relationships
- ✅ Update existing relationships
- ✅ Delete relationships
- ✅ Modify team suffixes and primary status

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the club_teams table
3. **Policies are created** and working correctly
4. **Read access works** for authenticated users
5. **Write access works** only for admins
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains public club-team relationship information
- Read access is safe for all authenticated users
- Write access is restricted to admins for data integrity
- RLS policies ensure proper access control
- The table is a junction table linking clubs and teams

**Important**: This security fix is important for maintaining proper access controls and should be applied immediately.
