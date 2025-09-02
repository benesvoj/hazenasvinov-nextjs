# User Roles System

This document describes the user roles and permissions system implemented in the application.

## Overview

The system provides role-based access control with the following roles:

- **Admin**: Full access to both admin and coach portals
- **Coach**: Access only to coach portal with category-based restrictions

## Database Schema

### Tables

#### `user_roles`
Stores user role assignments.

```sql
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'coach')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);
```

#### `coach_categories`
Stores category assignments for coaches.

```sql
CREATE TABLE coach_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, category_id)
);
```

### Views

#### `user_role_summary`
Provides a comprehensive view of user roles and category assignments.

```sql
CREATE VIEW user_role_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(
        up.full_name,
        u.raw_user_meta_data->>'full_name',
        u.email
    ) as full_name,
    up.role as profile_role,
    array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
    array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL) as assigned_categories,
    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as assigned_category_names,
    array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL) as assigned_category_codes
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN coach_categories cc ON u.id = cc.user_id
LEFT JOIN categories c ON cc.category_id = c.id
GROUP BY u.id, u.email, up.full_name, u.raw_user_meta_data, up.role;
```

### Functions

#### `get_user_roles(user_uuid UUID)`
Returns all roles for a specific user.

#### `get_user_coach_categories(user_uuid UUID)`
Returns assigned categories for a coach.

#### `has_role(user_uuid UUID, role_name VARCHAR)`
Checks if a user has a specific role.

## Setup

### 1. Run the setup script

```bash
npm run setup:user-roles
```

### 2. Manual setup (if script fails)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/create_user_roles_system.sql`
4. Execute the SQL

### 3. Set up initial admin users

#### Option A: If you already have admin users in user_profiles

Run this script to assign admin roles to existing admin users:

```bash
npm run setup:initial-admin
```

This script will:
- Find all users with `role='admin'` in the `user_profiles` table
- Assign them the `admin` role in the new `user_roles` table
- Allow them to manage the role system going forward

#### Option B: If you need to create the first admin user

If you don't have any admin users yet, run this script first:

```bash
npm run create:first-admin
```

This script will:
- Find the first user in your `auth.users` table
- Create a `user_profiles` entry with `role='admin'` for that user
- Then you can run `npm run setup:initial-admin` to complete the setup

#### Option C: Fix incorrect admin user assignment

If you need to change which user is the admin, run this script:

```bash
npm run fix:admin-user
```

This script will:
- Remove admin role from the current admin user
- Assign admin role to the correct user (vojtechbe@gmail.com)
- Update both old and new role systems

## Usage

### Assigning Roles

Use the admin interface at `/admin/user-roles` to:

1. View all users and their current roles
2. Assign admin or coach roles to users
3. Assign categories to coaches
4. Remove roles and category assignments

### Role Assignment Logic

- **Admin role**: Grants full access to admin portal and coach portal
- **Coach role**: Grants access only to coach portal
- **Category assignments**: Coaches can only see/manage data for their assigned categories
- **Multiple roles**: Users can have both admin and coach roles

### Access Control

#### Admin Portal
- Requires `admin` role
- Full access to all features

#### Coach Portal
- Requires `coach` or `admin` role
- Category-based filtering for data access
- Limited to assigned categories only

### API Usage

#### Check user role
```typescript
import { useUserRoles } from '@/hooks';

const { hasRole } = useUserRoles();
const isAdmin = await hasRole('admin');
const isCoach = await hasRole('coach');
```

#### Get user's assigned categories
```typescript
const { getCurrentUserCategories } = useUserRoles();
const categories = await getCurrentUserCategories();
```

#### Assign roles to user
```typescript
const { assignUserRoles } = useUserRoles();
await assignUserRoles({
  userId: 'user-uuid',
  roles: ['admin', 'coach'],
  categories: ['category-uuid-1', 'category-uuid-2']
});
```

## Security

### Row Level Security (RLS)

- Users can only view their own roles
- Admins can manage all roles (uses `is_admin()` function to avoid recursion)
- Coaches can only view their own category assignments
- Admins can manage all category assignments

**Note**: The `is_admin()` function uses the existing `user_profiles.role` field to avoid infinite recursion in RLS policies.

### Authentication

- All role checks require authenticated users
- Role verification happens on both client and server side
- Protected routes automatically redirect unauthorized users

## Migration from Old System

The new system is designed to work alongside the existing `user_profiles.role` field for backward compatibility. The `user_role_summary` view includes both the old `profile_role` and new `roles` array.

### Migration Steps

1. Set up the new role system
2. Assign roles to existing users through the admin interface
3. Update authentication logic to use new role system
4. Eventually deprecate the old `user_profiles.role` field

## Troubleshooting

### Common Issues

1. **"User profile not found"**: Ensure the user exists in `auth.users` and has a corresponding `user_profiles` entry
2. **"Permission denied"**: Check RLS policies and user role assignments
3. **"Category access denied"**: Verify coach has been assigned to the specific category
4. **"Infinite recursion detected in policy"**: This was fixed by using the `is_admin()` function that references `user_profiles.role` instead of `user_roles.role`
5. **"new row violates row-level security policy"**: This was fixed by adding service role bypass and `has_admin_access()` function that checks both old and new role systems
6. **"new row violates check constraint 'check_assigned_categories_coach_only'"**: This was fixed by explicitly setting `assigned_categories` to `null` for admin users in the setup scripts

### Debugging

Enable debug logging in the browser console to see role checking results:

```typescript
console.log('User roles:', await getCurrentUserCategories());
console.log('Is admin:', await hasRole('admin'));
console.log('Is coach:', await hasRole('coach'));
```
