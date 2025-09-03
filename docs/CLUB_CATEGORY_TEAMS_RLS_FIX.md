# Club Category Teams RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.club_category_teams` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `club_category_teams` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all team data
2. **Data Integrity**: Users might modify team information and suffixes
3. **Configuration Exposure**: Team assignments might be accessible to unauthorized users
4. **Compliance Issues**: Database tables should have proper access controls

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the club_category_teams table
ALTER TABLE club_category_teams ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `club_category_teams` contains public team data, we need balanced access control:

#### Public Read Access (Team Information)
```sql
-- Policy 1: Allow all authenticated users to read club_category_teams data
CREATE POLICY "Allow authenticated users to read club_category_teams" ON club_category_teams
    FOR SELECT
    TO authenticated
    USING (true);
```

#### Admin Write Access (Team Management)
```sql
-- Policy 2: Allow admins to insert new club_category_teams
CREATE POLICY "Allow admins to insert club_category_teams" ON club_category_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_category_teams
CREATE POLICY "Allow admins to update club_category_teams" ON club_category_teams
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

-- Policy 4: Allow admins to delete club_category_teams
CREATE POLICY "Allow admins to delete club_category_teams" ON club_category_teams
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
GRANT SELECT ON club_category_teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_category_teams TO authenticated;
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
   node fix-club-category-teams-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_club_category_teams_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read/write all data
- ❌ No access control on team data
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Public read access for team information
- ✅ Admin-only write access for data integrity
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `club_category_teams` table contains team information:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `club_category_id` | UUID | Reference to club_categories table | Public |
| `team_suffix` | TEXT | Team suffix (A, B, C, etc.) | Public |
| `is_active` | BOOLEAN | Whether this team is active | Public |
| `created_at` | TIMESTAMP | Creation time | Public |
| `updated_at` | TIMESTAMP | Update time | Public |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View team information and suffixes
- ✅ See which teams belong to which club-category combinations
- ✅ Access active/inactive status
- ✅ View creation and update timestamps

### Write Access (Admins Only)
- ✅ Create new team records
- ✅ Update team information and suffixes
- ✅ Delete team records
- ✅ Modify active/inactive status

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the club_category_teams table
3. **Policies are created** and working correctly
4. **Public read access works** for team data
5. **Admin write access works** for team management
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains public team information
- Read access is safe for all authenticated users
- Write access is restricted to admins for data integrity
- The table links teams to club-category combinations
- Team suffixes (A, B, C) are public information needed by the application

**Important**: This security fix is important for maintaining proper access controls and should be applied immediately.
