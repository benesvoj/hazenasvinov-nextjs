# Auth Service Issue Resolution

## Issue Summary
**Date:** January 15, 2025  
**Problem:** "Database error granting user" during login and user creation failures  
**Root Cause:** Custom triggers on `auth.users` table interfering with Supabase Auth service  

## What Happened
The application experienced a critical Auth service failure where:
- Users couldn't log in (getting "Database error granting user")
- New user creation was failing with "unexpected_failure" 
- Session creation was completely broken

## Root Cause Discovery
After extensive debugging, we discovered that **custom triggers** on the `auth.users` table were causing the issue:

1. **`auth_users_refresh_trigger`** - Custom trigger for refreshing profiles
2. **`auth_users_sync_trigger`** - Custom trigger for syncing profiles
3. **Associated functions** - `sync_profiles_on_auth_users_change()` and `trigger_refresh_profiles_mv()`

## Solution
**Removed the problematic triggers:**
```sql
DROP TRIGGER IF EXISTS auth_users_refresh_trigger ON auth.users;
DROP TRIGGER IF EXISTS auth_users_sync_trigger ON auth.users;
DROP FUNCTION IF EXISTS sync_profiles_on_auth_users_change() CASCADE;
DROP FUNCTION IF EXISTS trigger_refresh_profiles_mv() CASCADE;
```

## Result
✅ **Immediate resolution** - Auth service fully restored  
✅ **Login functionality** - Working normally  
✅ **User creation** - Working normally  
✅ **Session creation** - Working normally  

## Key Learnings

### 1. Trigger Interference
Custom triggers on `auth.users` can interfere with Supabase's Auth service, even if they don't directly conflict with the core functionality.

### 2. What to Keep
- **`on_auth_user_created` trigger** - This is the main trigger that should remain
- **`user_profiles` table** - Still works for storing user profile data
- **RLS policies** - These don't interfere with Auth service

### 3. What to Avoid
- **Additional triggers on `auth.users`** - Can cause unexpected Auth service failures
- **Complex sync operations** - Should be handled outside of Auth triggers
- **Materialized view refreshes** - Should not be triggered by Auth events

## Prevention
1. **Minimal triggers on `auth.users`** - Only use the essential `on_auth_user_created` trigger
2. **Test Auth functionality** - Always test login/user creation after adding Auth-related triggers
3. **Monitor Auth service** - Watch for "Database error granting user" messages

## Files Modified
- `scripts/remove_auth_users_refresh_trigger.js` - Script to remove problematic triggers
- `docs/AUTH_SERVICE_ISSUE_RESOLUTION.md` - This documentation

## Additional Issue: PGRST200 Error

**Date:** January 15, 2025  
**Problem:** "Could not find a relationship between 'user_profiles' and 'clubs' in the schema cache"  
**Root Cause:** `UserContext.tsx` was trying to join `user_profiles` with `clubs` table, but the foreign key relationship didn't exist  

### Solution
1. **Fixed UserContext.tsx** - Removed the join query and fetch club name separately
2. **Created missing profiles** - Ensured all existing users have `user_profiles` entries
3. **Separated queries** - Club name is now fetched independently to avoid foreign key issues

### Files Modified
- `src/contexts/UserContext.tsx` - Fixed `fetchUserProfile` function
- `scripts/create_missing_profiles.js` - Created missing user profiles

## Additional Cleanup: Removed Unnecessary club_id

**Date:** January 15, 2025  
**Action:** Removed `club_id` field from `user_profiles` table as it was unnecessary and causing complications  
**Reason:** Users don't need to be directly associated with clubs - club relationships are handled through categories and teams  

### Changes Made
1. **Database Schema** - Removed `club_id` column from `user_profiles` and `profiles` tables
2. **UserContext.tsx** - Removed `club_id` and `club_name` from `UserProfile` interface and queries
3. **UserFormModal.tsx** - Removed `club_id` references
4. **Login page** - Removed `club_id` from profile queries

### Files Modified
- `scripts/remove_club_id_from_user_profiles.js` - Database cleanup script
- `src/contexts/UserContext.tsx` - Updated interface and queries
- `src/app/admin/users/components/UserFormModal.tsx` - Removed club_id references
- `src/app/login/page.tsx.backup` - Updated profile queries

## Status
✅ **FULLY RESOLVED** - Auth service and login functionality fully operational as of January 15, 2025
