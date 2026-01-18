# Automatic User Profile Creation - Implementation Guide

## Overview

This document describes the implementation of automatic user profile creation in the TJ Sokol Svinov system. The system now automatically creates user profiles when users sign up, eliminating the need for manual profile creation.

## Problem Solved

Previously, users who signed up through the system would be created in `auth.users` but would not have a corresponding profile in the `user_profiles` table. This caused login failures and prevented access to both admin and coach portals.

## Solution Implemented

### 1. Database Trigger
- **File**: `scripts/building-app/create_auto_profile_trigger.sql`
- **Purpose**: Automatically creates user profiles when new users are inserted into `auth.users`
- **Trigger**: `on_auth_user_created` fires after INSERT on `auth.users`

### 2. Safe Profile Functions
- **`get_user_profile_safe(user_uuid)`**: Ensures a user has a profile, creating one if missing
- **`user_has_profile(user_uuid)`**: Checks if a user has a profile
- **`handle_new_user()`**: Trigger function that creates profiles for new users

### 3. Application Updates
- **Signup Flow**: Updated to ensure profile creation
- **Auth Callback**: Added profile creation fallback
- **Middleware**: Added profile creation fallback
- **Login Page**: Added profile creation fallback

## Files Modified

### Database Scripts
- `scripts/building-app/create_auto_profile_trigger.sql` - Main trigger and functions
- `scripts/setup-auto-profile-creation.js` - Setup script
- `scripts/fix-vojtechbe-immediate.js` - Immediate fix for vojtechbe@gmail.com
- `scripts/test-auto-profile-creation.js` - Testing script

### Application Code
- `src/utils/supabase/actions.ts` - Updated signup function
- `src/app/auth/callback/page.tsx.backup` - Added profile creation fallback
- `src/proxy.ts` - Added profile creation fallback
- `src/app/login/page.tsx.backup` - Added profile creation fallback

## How It Works

### New User Signup Flow
```mermaid
graph TD
    A[User Signs Up] --> B[supabase.auth.signUp()]
    B --> C[User Created in auth.users]
    C --> D[Trigger Fires]
    D --> E[Profile Created in user_profiles]
    E --> F[User Can Access Portals]
    
    G[Signup Function] --> H[get_user_profile_safe()]
    H --> I[Profile Ensured]
    I --> F
```

### Existing User Login Flow
```mermaid
graph TD
    A[User Logs In] --> B[Check Profile Exists]
    B --> C{Profile Found?}
    C -->|Yes| D[Continue Login]
    C -->|No| E[get_user_profile_safe()]
    E --> F[Profile Created]
    F --> D
    D --> G[User Can Access Portals]
```

## Setup Instructions

### 1. Run the Database Script
```bash
# Go to Supabase Dashboard > SQL Editor
# Copy and paste the contents of:
scripts/building-app/create_auto_profile_trigger.sql
# Run the script
```

### 2. Test the Implementation
```bash
# Test the functions
node scripts/test-auto-profile-creation.js

# Setup everything
node scripts/setup-auto-profile-creation.js
```

### 3. Fix vojtechbe@gmail.com
```bash
# Immediate fix
node scripts/fix-vojtechbe-immediate.js
```

## Database Functions

### `handle_new_user()`
- **Trigger**: Fires after INSERT on `auth.users`
- **Action**: Creates user profile with 'member' role
- **Security**: SECURITY DEFINER

### `get_user_profile_safe(user_uuid)`
- **Purpose**: Ensures user has a profile
- **Action**: Creates profile if missing, returns existing if present
- **Usage**: Called from application code as fallback

### `user_has_profile(user_uuid)`
- **Purpose**: Checks if user has a profile
- **Returns**: Boolean
- **Usage**: Utility function for checking profile existence

## Security Considerations

1. **RLS Policies**: All functions respect existing RLS policies
2. **SECURITY DEFINER**: Functions run with elevated privileges
3. **Default Role**: New users get 'member' role by default
4. **Admin Override**: Admins can still assign roles through the admin panel

## Testing

### Test New User Signup
1. Create a new user through the signup form
2. Verify profile is created automatically
3. Check that user can log in immediately

### Test Existing User
1. Log in with vojtechbe@gmail.com
2. Verify profile is created if missing
3. Check that user can access portals

### Test Functions
```sql
-- Test user_has_profile
SELECT user_has_profile('user-uuid-here');

-- Test get_user_profile_safe
SELECT * FROM get_user_profile_safe('user-uuid-here');
```

## Troubleshooting

### Profile Not Created
1. Check if trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
2. Check if functions exist: `SELECT * FROM information_schema.routines WHERE routine_name IN ('handle_new_user', 'get_user_profile_safe', 'user_has_profile');`
3. Run the SQL script manually

### vojtechbe@gmail.com Still Can't Login
1. Get user ID from Supabase Dashboard > Authentication > Users
2. Run the SQL commands provided in the fix script
3. Verify profile exists: `SELECT * FROM user_profiles WHERE user_id = 'user-id-here';`

### Functions Not Found
1. Ensure SQL script was run successfully
2. Check Supabase logs for errors
3. Verify function permissions

## Benefits

1. **Automatic**: No manual intervention required
2. **Backward Compatible**: Existing users get profiles when they log in
3. **Secure**: Respects existing security policies
4. **Fallback**: Multiple layers of profile creation
5. **Default Role**: New users get appropriate default role

## Future Enhancements

1. **Role Assignment**: Could be enhanced to assign roles based on email domain
2. **Profile Customization**: Could add more default profile fields
3. **Notifications**: Could notify admins of new user signups
4. **Audit Logging**: Could log profile creation events

## Conclusion

The automatic profile creation system ensures that all users can access the portals immediately after signup, while maintaining security and backward compatibility. The implementation includes multiple fallback mechanisms to handle edge cases and existing users.
