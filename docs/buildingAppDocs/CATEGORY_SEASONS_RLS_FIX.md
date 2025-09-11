# Category Seasons RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.category_seasons` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `category_seasons` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all category-season data
2. **Data Integrity**: Users might modify competition configuration data
3. **Configuration Exposure**: Competition settings might be accessible to unauthorized users
4. **Compliance Issues**: Database tables should have proper access controls

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the category_seasons table
ALTER TABLE category_seasons ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `category_seasons` contains public competition configuration data, we need balanced access control:

#### Public Read Access (Competition Configuration)
```sql
-- Policy 1: Allow all authenticated users to read category_seasons data
CREATE POLICY "Allow authenticated users to read category_seasons" ON category_seasons
    FOR SELECT
    TO authenticated
    USING (true);
```

#### Admin Write Access (Configuration Management)
```sql
-- Policy 2: Allow admins to insert new category_seasons relationships
CREATE POLICY "Allow admins to insert category_seasons" ON category_seasons
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update category_seasons relationships
CREATE POLICY "Allow admins to update category_seasons" ON category_seasons
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

-- Policy 4: Allow admins to delete category_seasons relationships
CREATE POLICY "Allow admins to delete category_seasons" ON category_seasons
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
GRANT SELECT ON category_seasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON category_seasons TO authenticated;
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
   node fix-category-seasons-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_category_seasons_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read/write all data
- ❌ No access control on configuration data
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Public read access for competition configuration
- ✅ Admin-only write access for data integrity
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `category_seasons` table contains competition configuration data:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `category_id` | UUID | Reference to categories table | Public |
| `season_id` | UUID | Reference to seasons table | Public |
| `matchweek_count` | INTEGER | Number of matchweeks | Public |
| `competition_type` | VARCHAR | Type of competition (league, cup, etc.) | Public |
| `team_count` | INTEGER | Expected number of teams | Public |
| `allow_team_duplicates` | BOOLEAN | Whether to allow A/B teams | Public |
| `is_active` | BOOLEAN | Whether this configuration is active | Public |
| `created_at` | TIMESTAMP | Creation time | Public |
| `updated_at` | TIMESTAMP | Update time | Public |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View category-season relationships
- ✅ See competition configuration (matchweeks, team counts, etc.)
- ✅ Access competition types and settings
- ✅ View active/inactive status

### Write Access (Admins Only)
- ✅ Create new category-season relationships
- ✅ Update competition configuration
- ✅ Delete category-season relationships
- ✅ Modify matchweek counts and team settings

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the category_seasons table
3. **Policies are created** and working correctly
4. **Public read access works** for competition data
5. **Admin write access works** for configuration management
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains public competition configuration data
- Read access is safe for all authenticated users
- Write access is restricted to admins for data integrity
- The table is a junction table linking categories and seasons
- Competition settings are public information needed by the application

**Important**: This security fix is important for maintaining proper access controls and should be applied immediately.
