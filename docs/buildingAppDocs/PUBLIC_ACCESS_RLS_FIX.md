# Public Access RLS Fix

## 🚨 Issue

**Problem**: After implementing security fixes with Row Level Security (RLS), visitor pages can no longer access data because the RLS policies only allow **authenticated users** to read data, but visitors are **anonymous** (not authenticated).

**Impact**: 
- ❌ Visitor pages show no matches
- ❌ Visitor pages show no clubs
- ❌ Public data is not accessible to anonymous users
- ❌ Poor user experience for website visitors

## 🔍 Root Cause Analysis

The security fixes we implemented created RLS policies like:
```sql
CREATE POLICY "Allow authenticated users to read clubs" ON clubs
    FOR SELECT 
    USING ((SELECT auth.role()) = 'authenticated');
```

**Problem**: These policies only allow **authenticated users** to read data, but:
- **Visitor pages** are accessed by **anonymous users** (not authenticated)
- **Public data** (matches, clubs, standings) should be visible to everyone
- **Security** should only restrict **write operations**, not **public read access**

## 🛠️ Solution

### 1. Create Public Read Access Policies

Replace authenticated-only policies with public read access policies:

```sql
-- Before (Restrictive)
CREATE POLICY "Allow authenticated users to read clubs" ON clubs
    FOR SELECT 
    USING ((SELECT auth.role()) = 'authenticated');

-- After (Public Access)
CREATE POLICY "Allow public read access to clubs" ON clubs
    FOR SELECT 
    USING (true);
```

### 2. Grant Anonymous Role Permissions

Grant SELECT permissions to the `anon` role:

```sql
GRANT SELECT ON clubs TO anon;
GRANT SELECT ON matches TO anon;
GRANT SELECT ON teams TO anon;
GRANT SELECT ON standings TO anon;
-- ... and other public tables
```

### 3. Maintain Security for Write Operations

Keep write access restricted to authenticated users and admins:

```sql
-- Write access remains secure
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
   node fix-public-access-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_public_access_rls.sql`
3. **Execute the SQL script**
4. **Verify** visitor pages work correctly

## 🔒 Security Model

### Public Read Access (Anonymous Users)
- ✅ **Matches**: View match results and schedules
- ✅ **Clubs**: View club information and logos
- ✅ **Teams**: View team names and details
- ✅ **Standings**: View league tables and rankings
- ✅ **Categories**: View competition categories
- ✅ **Seasons**: View season information

### Authenticated User Access
- ✅ **All public data**: Same as anonymous users
- ✅ **User-specific data**: Own profile, own posts, etc.
- ✅ **Limited write access**: Based on user roles

### Admin-Only Access
- ✅ **All data**: Full read/write access
- ✅ **Data management**: Create, update, delete records
- ✅ **System configuration**: Manage categories, seasons, etc.

## 📊 Tables Affected

| Table | Public Read | Authenticated Write | Admin Write |
|-------|-------------|-------------------|-------------|
| `clubs` | ✅ | ❌ | ✅ |
| `matches` | ✅ | ❌ | ✅ |
| `teams` | ✅ | ❌ | ✅ |
| `standings` | ✅ | ❌ | ✅ |
| `categories` | ✅ | ❌ | ✅ |
| `seasons` | ✅ | ❌ | ✅ |
| `club_teams` | ✅ | ❌ | ✅ |
| `club_categories` | ✅ | ❌ | ✅ |
| `club_category_teams` | ✅ | ❌ | ✅ |
| `category_seasons` | ✅ | ❌ | ✅ |

## 🧪 Verification

After applying the fix, verify:

1. **Visitor pages load correctly** with matches and clubs visible
2. **Anonymous users can view** all public data
3. **Write access remains secure** (admin-only)
4. **No security warnings** in Supabase Dashboard
5. **Public pages work** without authentication
6. **Admin functionality** still works correctly

## 📝 Notes

- **Public data** (matches, clubs, standings) should be visible to everyone
- **Security** is maintained by restricting **write operations** to admins
- **Anonymous users** can read public data but cannot modify anything
- **Authenticated users** have the same read access plus their own data
- **Admins** have full access for data management

**Important**: This fix restores public access while maintaining security for write operations.
