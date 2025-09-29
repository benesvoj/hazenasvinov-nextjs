# Club Categories RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.club_categories` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `club_categories` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all club-category data
2. **Data Integrity**: Users might modify club-category relationships
3. **Configuration Exposure**: Club participation settings might be accessible to unauthorized users
4. **Compliance Issues**: Database tables should have proper access controls

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the club_categories table
ALTER TABLE club_categories ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `club_categories` contains public club-category configuration data, we need balanced access control:

#### Public Read Access (Club-Category Relationships)
```sql
-- Policy 1: Allow all authenticated users to read club_categories data
CREATE POLICY "Allow authenticated users to read club_categories" ON club_categories
    FOR SELECT
    TO authenticated
    USING (true);
```

#### Admin Write Access (Configuration Management)
```sql
-- Policy 2: Allow admins to insert new club_categories relationships
CREATE POLICY "Allow admins to insert club_categories" ON club_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update club_categories relationships
CREATE POLICY "Allow admins to update club_categories" ON club_categories
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

-- Policy 4: Allow admins to delete club_categories relationships
CREATE POLICY "Allow admins to delete club_categories" ON club_categories
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
GRANT SELECT ON club_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON club_categories TO authenticated;
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
   node fix-club-category-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_club_categories_rls.sql`
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
- ✅ Public read access for club-category relationships
- ✅ Admin-only write access for data integrity
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `club_categories` table contains club-category configuration data:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `club_id` | UUID | Reference to clubs table | Public |
| `category_id` | UUID | Reference to categories table | Public |
| `season_id` | UUID | Reference to seasons table | Public |
| `max_teams` | INTEGER | Maximum teams for this club in this category | Public |
| `is_active` | BOOLEAN | Whether this relationship is active | Public |
| `created_at` | TIMESTAMP | Creation time | Public |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View club-category relationships
- ✅ See which clubs participate in which categories
- ✅ Access maximum team limits and active status
- ✅ View creation timestamps

### Write Access (Admins Only)
- ✅ Create new club-category relationships
- ✅ Update club participation settings
- ✅ Delete club-category relationships
- ✅ Modify maximum team limits

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the club_categories table
3. **Policies are created** and working correctly
4. **Public read access works** for club-category data
5. **Admin write access works** for configuration management
6. **No functionality is broken** in the application

## 📝 Notes

- This table contains public club-category configuration data
- Read access is safe for all authenticated users
- Write access is restricted to admins for data integrity
- The table is a junction table linking clubs, categories, and seasons
- Club participation settings are public information needed by the application

**Important**: This security fix is important for maintaining proper access controls and should be applied immediately.
