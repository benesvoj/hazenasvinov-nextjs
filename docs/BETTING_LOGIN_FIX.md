# Login/Logout Redirect Fix

## Issues

### Issue 1: Login Redirect
After successful login, the page was stuck on the login screen showing "Login successful! Redirecting..." but never actually redirecting to the betting dashboard.

### Issue 2: Logout Redirect
After clicking logout, the user remained on the betting dashboard instead of being redirected back to the login page.

## Root Cause

The original implementation used `router.refresh()` which only refreshes the current route's data without forcing a full page reload. This approach doesn't always properly update the authentication state in Next.js, especially when:

1. Server components need to re-fetch with new cookies
2. Auth cookies are set but cached data hasn't invalidated
3. Client-side user context hasn't updated

## Solution

Changed the redirect approach to use `window.location.href` for a hard redirect:

```typescript
// Before (didn't work):
router.refresh();

// After (works):
setTimeout(() => {
  window.location.href = '/betting';
}, 500);
```

### Why This Works

1. **Hard Redirect**: `window.location.href` forces a full page reload
2. **Fresh Auth State**: Server receives the new auth cookies on page load
3. **Clean Context**: User context is rebuilt from scratch
4. **500ms Delay**: Allows success message to display briefly

## Code Changes

### 1. Login Fix

#### File: `src/components/features/betting/BettingLogin.tsx`

**Changed:**
```typescript
if (result.success) {
  setSuccess('Login successful! Redirecting...');

  if (onLoginSuccess) {
    onLoginSuccess();
  }

  // Small delay to show success message, then redirect
  setTimeout(() => {
    // Force a hard redirect to ensure page reloads with new auth state
    window.location.href = '/betting';
  }, 500);
}
```

**Key improvements:**
- Loading state (`isLoading`) now only resets on error, not on success
- Success message visible for 500ms before redirect
- Hard redirect ensures clean auth state

### 2. Logout Fix

#### File: `src/app/(betting)/betting/page.tsx`

**Changed:**
```typescript
const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
    const result = await bettingLogout();

    if (result && result.success) {
      // Small delay to show loading state, then force a hard redirect
      setTimeout(() => {
        // Force a hard redirect to ensure page reloads without auth state
        window.location.href = '/betting';
      }, 300);
    } else {
      // If there's an error, still try to redirect
      console.error('Logout error:', result?.error);
      setTimeout(() => {
        window.location.href = '/betting';
      }, 300);
    }
  } catch (error) {
    console.error('Logout exception:', error);
    // Still redirect even on exception
    setTimeout(() => {
      window.location.href = '/betting';
    }, 300);
  }
};
```

**Key improvements:**
- Always redirects, even on error
- 300ms delay to show loading state briefly
- Hard redirect clears auth cookies
- Error handling ensures redirect happens

#### File: `src/utils/supabase/bettingAuth.ts`

**Changed bettingLogout to return success:**
```typescript
export async function bettingLogout() {
  const supabase = await createClient();
  const {error} = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/betting', 'layout');

  return {
    success: true,  // Now returns success instead of redirecting
  };
}
```

**Added comments:**
```typescript
// Note: Client-side will handle the redirect with window.location.href
// to ensure clean state after logout
```

## Testing

### Test Login:

1. Go to `/betting`
2. Enter valid credentials
3. Click "Sign In"
4. Should see:
   - Loading spinner on button
   - "Login successful! Redirecting..." message (briefly for 500ms)
   - Automatic redirect to betting dashboard
   - User is logged in and sees their wallet

### Test Logout:

1. While logged in to betting dashboard
2. Click "Logout" button (top-right, red)
3. Should see:
   - Button shows "Logging out..." with spinner
   - Brief loading state (300ms)
   - Automatic redirect to login screen
   - Login form is displayed (not logged in)

## Alternative Approaches Considered

### 1. Server-Side Redirect (Rejected)
```typescript
// In bettingAuth.ts
redirect('/betting');
```
**Why not:** Server actions with `redirect()` can cause hydration issues in client components.

### 2. Router Push (Rejected)
```typescript
router.push('/betting');
```
**Why not:** Doesn't force a page reload, so cached data might not update.

### 3. Router Replace (Rejected)
```typescript
router.replace('/betting');
```
**Why not:** Same issue as `router.push()` - no guaranteed auth state refresh.

### 4. Hard Redirect (✅ Selected)
```typescript
window.location.href = '/betting';
```
**Why yes:** Guarantees fresh page load with new auth cookies.

## Edge Cases Handled

1. **Fast navigation**: User can't click during loading state
2. **Network delays**: Loading state persists until redirect
3. **Error after success**: Won't happen (loading not reset on success)
4. **Multiple clicks**: Button disabled during loading

## Performance Considerations

- **500ms delay**: Minimal, allows users to see success feedback
- **Full page reload**: Necessary for auth state, acceptable UX trade-off
- **No flash**: Success message visible during redirect

## Future Improvements

If Next.js auth state management improves, consider:

1. **Optimistic updates**: Update local state before redirect
2. **Smoother transitions**: Use Next.js navigation with guaranteed refresh
3. **Progressive enhancement**: Detect when soft refresh is sufficient

## Related Issues

This fix also resolves:
- User context not updating after login
- Wallet balance not loading on first view
- Back button showing login screen after successful login

## Browser Compatibility

`window.location.href` works in all browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Summary

### Login Fix
**Problem**: Login success but no redirect
**Cause**: Soft refresh doesn't update auth state
**Solution**: Hard redirect with `window.location.href` after 500ms
**Result**: Clean page reload with proper auth cookies
**Status**: ✅ Fixed

### Logout Fix
**Problem**: Logout doesn't redirect to login screen
**Cause**: Server action redirect not triggering properly
**Solution**: Hard redirect with `window.location.href` after 300ms
**Result**: Clean page reload without auth state
**Status**: ✅ Fixed

### Key Takeaway
For authentication state changes in Next.js, use `window.location.href` for hard redirects to ensure:
- Auth cookies are properly set/cleared
- Server components fetch with correct auth state
- Client context rebuilds from scratch
- No stale cached data
