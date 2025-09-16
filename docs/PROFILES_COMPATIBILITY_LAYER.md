# Profiles Compatibility Layer

This document describes the profiles compatibility layer that maps `user_profiles` to a `profiles` table for better compatibility and easier migration.

## 📋 Overview

The profiles compatibility layer provides a seamless mapping between the existing `user_profiles` table and a new `profiles` table that includes additional fields from `auth.users`. This allows for:

- **Backward compatibility** with existing code
- **Enhanced data access** with additional user information
- **Automatic synchronization** between tables
- **Future migration** to a unified profiles system

## 🏗️ Architecture

### Tables

#### `user_profiles` (Source Table)
- **Purpose**: Primary user profile and role storage
- **Fields**: `id`, `user_id`, `role`, `club_id`, `assigned_categories`, `created_at`, `updated_at`
- **Usage**: Core application logic, RLS policies, role-based access control

#### `profiles` (Compatibility Table)
- **Purpose**: Enhanced user profile with additional fields
- **Fields**: All `user_profiles` fields plus:
  - `email` - User's email address
  - `display_name` - User's full name or email
  - `phone` - User's phone number
  - `bio` - User's bio
  - `position` - User's position
  - `is_blocked` - Whether user is blocked
- **Usage**: Enhanced user interfaces, reporting, data analysis

### Synchronization

#### Triggers
- **`user_profiles_sync_trigger`**: Automatically syncs changes from `user_profiles` to `profiles`
- **Operations**: INSERT, UPDATE, DELETE
- **Scope**: Row-level synchronization

#### Functions
- **`sync_profiles_from_user_profiles()`**: Initial sync and manual refresh
- **`populate_profiles_from_auth_users()`**: Populate additional fields from `auth.users`

## 🔧 Usage

### Basic Usage

```sql
-- Use profiles table instead of user_profiles
SELECT * FROM profiles WHERE role = 'admin';

-- Get user with additional information
SELECT 
  user_id,
  email,
  display_name,
  role,
  assigned_categories
FROM profiles 
WHERE user_id = 'user-uuid';
```

### Client-Side Usage

```typescript
// Get all profiles with additional fields
const { data: profiles, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'coach');

// Update profile (will sync to user_profiles)
const { error } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('user_id', userId);
```

### Manual Synchronization

```sql
-- Sync all profiles from user_profiles
SELECT * FROM sync_profiles_from_user_profiles();

-- Populate additional fields from auth.users
SELECT populate_profiles_from_auth_users();
```

## 🛡️ Security

### RLS Policies

The `profiles` table has the same RLS policies as `user_profiles`:

- **Users can view their own profile**: `user_id = auth.uid()`
- **Users can update their own profile**: `user_id = auth.uid()`
- **Admins can view all profiles**: Based on admin role in `user_profiles`
- **Admins can manage all profiles**: Based on admin role in `user_profiles`
- **Service role bypass**: Full access for service operations

### Data Integrity

- **Foreign key constraints**: `user_id` references `auth.users(id)`
- **Unique constraints**: One profile per user
- **Check constraints**: Valid role values
- **Automatic synchronization**: Triggers ensure data consistency

## 📊 Performance

### Indexes

```sql
-- Primary indexes
CREATE INDEX profiles_user_id_idx ON profiles (user_id);
CREATE INDEX profiles_role_idx ON profiles (role);
CREATE INDEX profiles_club_id_idx ON profiles (club_id);
CREATE INDEX profiles_email_idx ON profiles (email);
```

### Query Optimization

- **Use `profiles` for read operations** with additional fields
- **Use `user_profiles` for write operations** (triggers handle sync)
- **Batch operations** when possible
- **Consider materialized views** for complex reporting

## 🔄 Migration Strategy

### Phase 1: Setup (Completed)
- ✅ Create `profiles` table
- ✅ Set up triggers and functions
- ✅ Populate initial data
- ✅ Test synchronization

### Phase 2: Gradual Migration
- 🔄 Update read operations to use `profiles`
- 🔄 Update UI components to use additional fields
- 🔄 Test all functionality

### Phase 3: Full Migration
- ⏳ Update all write operations to use `profiles`
- ⏳ Remove `user_profiles` table
- ⏳ Rename `profiles` to `user_profiles`

## 🚀 Benefits

### For Developers
- **Enhanced data access** with additional user fields
- **Simplified queries** with all user data in one table
- **Better type safety** with comprehensive user objects
- **Easier testing** with unified data structure

### For Users
- **Richer user profiles** with additional information
- **Better user experience** with more data available
- **Consistent data** across all interfaces

### For System
- **Backward compatibility** with existing code
- **Automatic synchronization** prevents data drift
- **Future-proof** architecture for enhancements

## 🔍 Monitoring

### Health Checks

```sql
-- Check synchronization status
SELECT 
  (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM user_profiles up 
   LEFT JOIN profiles p ON up.user_id = p.user_id 
   WHERE p.user_id IS NULL) as missing_profiles;

-- Check for data inconsistencies
SELECT 
  up.user_id,
  up.role as user_profiles_role,
  p.role as profiles_role
FROM user_profiles up
JOIN profiles p ON up.user_id = p.user_id
WHERE up.role != p.role;
```

### Maintenance

```sql
-- Refresh all profiles
SELECT * FROM sync_profiles_from_user_profiles();

-- Populate additional fields
SELECT populate_profiles_from_auth_users();
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing profiles**: Run `sync_profiles_from_user_profiles()`
2. **Missing additional fields**: Run `populate_profiles_from_auth_users()`
3. **Sync failures**: Check trigger functions and permissions
4. **RLS issues**: Verify policies and user roles

### Debug Queries

```sql
-- Check trigger status
SELECT * FROM pg_trigger WHERE tgname = 'user_profiles_sync_trigger';

-- Check function definitions
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name LIKE '%profiles%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📝 Scripts

### Setup Scripts
- `create_working_profiles_compatibility.js` - Creates the compatibility layer
- `populate_profiles_additional_fields.js` - Populates additional fields

### Maintenance Scripts
- `sync_profiles_from_user_profiles()` - SQL function for syncing
- `populate_profiles_from_auth_users()` - SQL function for populating

## 🎯 Next Steps

1. **Update UI components** to use `profiles` table
2. **Add additional fields** to user interfaces
3. **Implement user profile editing** with new fields
4. **Add profile search and filtering** capabilities
5. **Create user profile reports** and analytics

## 📚 Related Documentation

- [Database Tables Overview](DATABASE_TABLES_OVERVIEW.md)
- [User Roles System](USER_ROLES_SYSTEM.md)
- [RLS Policies](USER_PROFILES_RLS_FIX.md)
- [Authentication Setup](AUTHENTICATION_SETUP.md)
