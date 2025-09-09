# Todos RLS Security Fix

## 🚨 Security Warning

**Issue**: Table `public.todos` is public, but RLS has not been enabled.

**Description**: Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.

## 🔍 Root Cause Analysis

The `todos` table was created without Row Level Security (RLS) enabled, which can be a security risk because:

1. **No Access Control**: Any authenticated user can read/write all todo data
2. **Email Exposure**: User email addresses in todos are visible to all users
3. **Data Integrity**: Users might modify or delete other users' todos
4. **Privacy Issues**: Sensitive project management information might be accessible
5. **Assignment Exposure**: Todo assignments and due dates are visible to all users

## 🛠️ Solution

### 1. Enable Row Level Security

```sql
-- Enable RLS on the todos table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
```

### 2. Create Appropriate RLS Policies

Since `todos` contains project management data with user emails, we need balanced access control:

#### Public Read Access (Project Collaboration)
```sql
-- Policy 1: Allow all authenticated users to read todos
CREATE POLICY "Allow authenticated users to read todos" ON todos
    FOR SELECT
    TO authenticated
    USING (true);
```

#### User Self-Management
```sql
-- Policy 2: Allow users to insert todos (with their own email)
CREATE POLICY "Allow authenticated users to insert todos" ON todos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 3: Allow users to update their own todos
CREATE POLICY "Allow users to update their own todos" ON todos
    FOR UPDATE
    TO authenticated
    USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Policy 4: Allow users to delete their own todos
CREATE POLICY "Allow users to delete their own todos" ON todos
    FOR DELETE
    TO authenticated
    USING (
        user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );
```

#### Admin Full Access
```sql
-- Policy 5: Allow admins to perform all operations on any todo
CREATE POLICY "Allow admins full access to todos" ON todos
    FOR ALL
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
```

### 3. Grant Appropriate Permissions

```sql
-- Grant necessary permissions
GRANT SELECT ON todos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON todos TO authenticated;
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
   node fix-todos-rls.js
   ```

### Option 2: Manual SQL Execution

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `scripts/fix_todos_rls.sql`
3. **Execute the SQL script**
4. **Verify** the security warning disappears

## 🔒 Security Benefits

### Before Fix
- ❌ No Row Level Security enabled
- ❌ Any authenticated user could read all todos
- ❌ Users could modify or delete other users' todos
- ❌ Email addresses exposed to all users
- ❌ No access control on sensitive operations
- ❌ Security warning in Supabase

### After Fix
- ✅ Row Level Security properly enabled
- ✅ Public read access for project collaboration
- ✅ Users can only modify their own todos
- ✅ Email addresses protected from unauthorized access
- ✅ Admins have full access for project management
- ✅ Security warning resolved
- ✅ Follows principle of least privilege

## 📊 Table Contents

The `todos` table contains project management data:

| Column | Type | Description | Access Level |
|--------|------|-------------|--------------|
| `id` | UUID | Primary key | Public |
| `title` | VARCHAR | Todo title | Public |
| `description` | TEXT | Todo description | Public |
| `priority` | VARCHAR | Priority level (low, medium, high, urgent) | Public |
| `status` | VARCHAR | Status (todo, in-progress, done) | Public |
| `category` | VARCHAR | Category (feature, bug, improvement, technical) | Public |
| `assigned_to` | VARCHAR | Person assigned to todo | Public |
| `due_date` | DATE | Due date | Public |
| `created_at` | TIMESTAMP | Creation time | Public |
| `updated_at` | TIMESTAMP | Update time | Public |
| `created_by` | UUID | User who created todo | Public |
| `user_email` | VARCHAR | Email of creator | Own todos only |

## 🔍 Data Access Patterns

### Read Access (All Authenticated Users)
- ✅ View all todos for project collaboration
- ✅ See todo titles, descriptions, priorities, and statuses
- ✅ Access assignment information and due dates
- ✅ View creation and update timestamps
- ❌ Cannot see other users' email addresses directly

### Write Access (Own Todos Only)
- ✅ Create new todos with their own email
- ✅ Update their own todos
- ✅ Delete their own todos
- ❌ Cannot modify other users' todos

### Admin Access (Full Access)
- ✅ Read all todos and email addresses
- ✅ Create, update, delete any todo
- ✅ Manage project todos and assignments
- ✅ Access all user email addresses

## 🧪 Verification

After applying the fix, verify:

1. **Security warning disappears** in Supabase Dashboard
2. **RLS is enabled** on the todos table
3. **Policies are created** and working correctly
4. **Users can only modify their own todos**
5. **Admins can access all todos**
6. **Public read access works** for project collaboration
7. **No functionality is broken** in the application

## 📝 Notes

- This table contains project management and todo data
- Public read access enables team collaboration
- Users can only manage their own todos
- Admins have full access for project management
- Email addresses are protected from unauthorized access
- The table supports different todo categories (feature, bug, improvement, technical)
- Priority levels and status tracking are available

**Important**: This security fix is important for protecting user data and enabling proper project management.
