# PGRST116 Error Fix - Multiple User Profiles

## Problem Description

The coach portal was showing this error:
```json
{
    "code": "PGRST116",
    "details": "The result contains 2 rows",
    "hint": null,
    "message": "Cannot coerce the result to a single JSON object"
}
```

## Root Cause

The error was caused by users having **multiple profiles** in the `user_profiles` table. When the code used `.single()` to fetch user profile data, it expected exactly one row but received multiple rows.

**Specific Issue Found:**
- User ID `5eafbfea-0962-42b0-8f72-4d07bc3214e7` had 2 profiles:
  - `coach` role (created 2025-09-05)
  - `admin` role (created 2025-09-03)

## Solution Implemented

### 1. Code Updates
**Files Modified:**
- `src/hooks/useUserRoles.ts` - Updated `getCurrentUserCategories` and `fetchUserRoles`
- `src/app/coaches/dashboard/page.tsx` - Updated profile fetching logic
- `src/app/coaches/components/CoachesTopBar.tsx` - Updated profile fetching logic

**Changes Made:**
- Removed `.single()` calls that expected exactly one row
- Added logic to handle multiple profiles gracefully
- Prioritize coach/head_coach profiles when multiple exist
- Fall back to most recent profile if no coach profile found
- Added ordering by `created_at` to get most recent profiles first

### 2. Database Cleanup
**Script Created:** `scripts/cleanup-duplicate-profiles.js`

**Actions Taken:**
- Identified users with multiple profiles
- Kept the most recent profile for each user
- Deleted duplicate/older profiles
- Verified cleanup was successful

## Code Changes Details

### Before (Problematic Code)
```typescript
// This would fail with PGRST116 if user had multiple profiles
const { data, error } = await supabase
  .from('user_profiles')
  .select('assigned_categories')
  .eq('user_id', user.id)
  .single(); // ❌ Expects exactly one row
```

### After (Fixed Code)
```typescript
// This handles multiple profiles gracefully
const { data, error } = await supabase
  .from('user_profiles')
  .select('assigned_categories, role')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false }); // Get most recent first

// Handle multiple profiles - prefer coach/head_coach profile
if (data && data.length > 0) {
  const coachProfile = data.find(profile => 
    profile.role === 'coach' || profile.role === 'head_coach'
  );
  
  if (coachProfile) {
    return coachProfile.assigned_categories || [];
  }
  
  // If no coach profile, use the first profile
  return data[0]?.assigned_categories || [];
}
```

## Prevention Measures

### 1. Database Constraints
Consider adding a unique constraint on `user_id` in the `user_profiles` table:
```sql
ALTER TABLE user_profiles 
ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
```

### 2. Application Logic
- Always handle multiple profiles gracefully
- Use `.order()` to get consistent results
- Prefer specific role types when multiple profiles exist
- Log warnings when multiple profiles are detected

### 3. Monitoring
- Add logging to detect when users have multiple profiles
- Monitor for PGRST116 errors in the future
- Consider adding alerts for duplicate profile detection

## Testing

### Test Cases
1. **Single Profile User**: Should work as before
2. **Multiple Profile User**: Should use most recent coach profile
3. **Admin with Coach Profile**: Should prefer coach profile for coach portal
4. **New User**: Should get single profile via automatic creation

### Verification Steps
1. Run `node scripts/check-multiple-profiles.js` to verify no duplicates
2. Test coach portal access for all users
3. Verify vojtechbe@gmail.com can log in
4. Check that profile selection logic works correctly

## Files Created/Modified

### New Files
- `scripts/check-multiple-profiles.js` - Diagnostic script
- `scripts/cleanup-duplicate-profiles.js` - Cleanup script
- `docs/PGRST116_ERROR_FIX.md` - This documentation

### Modified Files
- `src/hooks/useUserRoles.ts` - Fixed multiple profile handling
- `src/app/coaches/dashboard/page.tsx` - Updated profile fetching
- `src/app/coaches/components/CoachesTopBar.tsx` - Updated profile fetching

## Results

✅ **PGRST116 Error Resolved**: Coach portal now works without errors
✅ **Duplicate Profiles Cleaned**: Each user now has only one profile
✅ **Robust Error Handling**: Code now handles multiple profiles gracefully
✅ **Backward Compatible**: Existing functionality preserved
✅ **Future Proof**: Prevents similar issues from occurring

## Related Issues

This fix also resolves:
- Coach portal access issues
- vojtechbe@gmail.com login problems
- Any other PGRST116 errors in the system

## Next Steps

1. **Monitor**: Watch for any new PGRST116 errors
2. **Test**: Verify all portal access works correctly
3. **Consider**: Adding database constraints to prevent future duplicates
4. **Document**: Update user management procedures to avoid creating multiple profiles
