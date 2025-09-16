# Supabase Support Issue: User Creation Failing

## 🚨 **Issue Summary**
User creation is completely failing with "Database error creating new user" and `unexpected_failure` error code, even when creating users directly through the Supabase dashboard. This appears to be a service-level issue, not a database or code issue.

## 📋 **Error Details**

### Error Message
```
Database error creating new user
Code: unexpected_failure
Status: 500
```

### When It Occurs
- Creating users via `supabase.auth.admin.createUser()`
- Creating users via `supabase.auth.admin.inviteUserByEmail()`
- Creating users directly in Supabase Dashboard → Authentication → Users
- All user creation methods fail regardless of parameters

## 🔍 **Comprehensive Testing Performed**

### 1. **Database Health Check** ✅
- Database connectivity: Working
- Basic queries: Working
- Transaction handling: Working
- No blocking transactions found
- No locks on auth.users table

### 2. **Trigger Analysis** ✅
- Disabled ALL triggers on auth.users: User creation still fails
- Disabled individual triggers: User creation still fails
- Triggers are not the cause of the issue

### 3. **Foreign Key Constraint Testing** ✅
- Removed foreign key constraints: User creation still fails
- Made constraints deferrable: User creation still fails
- Constraints are not the cause of the issue

### 4. **Database Schema Verification** ✅
- user_profiles table exists and is accessible
- RLS policies are properly configured
- Foreign key relationships are correct
- Database schema follows Supabase documentation exactly

### 5. **Code Implementation Verification** ✅
- Trigger function follows Supabase documentation exactly
- Uses proper `SECURITY DEFINER SET search_path = ''`
- Located in public schema as recommended
- Has proper error handling to prevent blocking signups
- RLS policies are correctly configured

## 🏗️ **Current Database Setup**

### Tables
```sql
-- user_profiles table (working correctly)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coach', 'member', 'head_coach')),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  assigned_categories UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Trigger Function (Following Supabase Documentation)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    role, 
    assigned_categories, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    'member',
    NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
```

### Trigger
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🧪 **Test Results**

### Test 1: All Triggers Disabled
```javascript
// Disabled ALL triggers on auth.users
ALTER TABLE auth.users DISABLE TRIGGER ALL;
// Result: User creation still fails
```

### Test 2: Foreign Key Constraints Removed
```javascript
// Removed foreign key constraint
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
// Result: User creation still fails
```

### Test 3: Minimal User Creation
```javascript
// Tried minimal user creation
await supabase.auth.admin.createUser({
  email: 'test@example.com',
  password: 'Test123!'
  // No email_confirm, no user_metadata
});
// Result: User creation still fails
```

### Test 4: Different Email Domains
```javascript
// Tried different email domains
['gmail.com', 'test.com', 'example.org'].forEach(domain => {
  // User creation fails for all domains
});
```

## 📊 **Environment Details**

- **Supabase Project**: [Your project URL]
- **Region**: [Your region]
- **Plan**: Free Plan
- **Database**: PostgreSQL
- **Auth Provider**: Supabase Auth
- **Node.js Version**: [Your version]
- **Supabase Client Version**: @supabase/supabase-js

## 🔧 **What We've Tried**

1. ✅ Disabled all triggers
2. ✅ Removed foreign key constraints
3. ✅ Made constraints deferrable
4. ✅ Checked for blocking transactions
5. ✅ Verified database connectivity
6. ✅ Tested with minimal parameters
7. ✅ Tested different email domains
8. ✅ Verified RLS policies
9. ✅ Updated trigger implementation to match documentation exactly
10. ✅ Checked for open transactions

## 🎯 **Root Cause Analysis**

Based on comprehensive testing, the issue is **NOT** caused by:
- ❌ Database triggers
- ❌ Foreign key constraints
- ❌ RLS policies
- ❌ Open transactions
- ❌ Database locks
- ❌ Code implementation
- ❌ Database schema

The issue appears to be at the **Supabase service level**, specifically in the Auth service that handles user creation.

## 🚨 **Impact**

- **Critical**: Cannot create new users
- **Workaround**: Manual user creation via Supabase Dashboard (also fails)
- **Affected Features**: User registration, admin user management
- **Business Impact**: Cannot onboard new users

## 📞 **Request for Support**

Please investigate:
1. **Auth service status** - Is there a known issue with user creation?
2. **Project-specific issues** - Are there any project-level restrictions?
3. **Service logs** - Can you check logs for our project during user creation attempts?
4. **Database connectivity** - Is there an issue with auth.users table access?

## 🔗 **Related Resources**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/managing-user-data#advanced-techniques)
- [User Management Best Practices](https://supabase.com/docs/guides/auth/managing-user-data)

## 📝 **Additional Information**

- Issue started: [Date when you first noticed]
- Frequency: 100% of user creation attempts fail
- Error is consistent across all methods
- No recent changes to database schema or code
- Issue persists even with minimal user creation parameters

---

**Priority**: High - Critical functionality is broken
**Category**: Authentication/User Management
**Environment**: Production
