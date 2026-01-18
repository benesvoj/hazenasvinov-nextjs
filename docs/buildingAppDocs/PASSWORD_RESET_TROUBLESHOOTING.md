# Password Reset Troubleshooting Guide

## Problem: Email Link Redirects to Landing Page

If password reset email links are redirecting to the landing page instead of the password reset page, here are the steps to diagnose and fix the issue.

## Root Cause Analysis

The issue occurs because Supabase Auth's email confirmation flow doesn't automatically pass the `redirectTo` parameter to the auth confirm route. The system needs to handle different email types properly.

## Solution Implemented

### 1. Updated Auth Confirm Route

The `/src/app/auth/confirm/route.ts` has been updated to handle different email types:

```typescript
if (type === 'recovery') {
    // Password reset - redirect to reset-password page
    redirect('/reset-password')
} else if (type === 'signup') {
    // User invitation - redirect to set-password page
    redirect('/set-password')
} else {
    // Other types - use the next parameter or default to home
    redirect(next)
}
```

### 2. Updated Reset Password Page

The `/src/app/reset-password/page.tsx.backup` has been updated to work with the new flow:

- Removed requirement for `access_token` in URL parameters
- Users are now authenticated when they reach the page (via auth/confirm route)
- Page works correctly when redirected from auth confirm route

### 3. Supabase Configuration Required

You need to configure the following in your Supabase Dashboard:

#### A. Allowed Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/confirm` (for development)
   - `https://yourdomain.com/auth/confirm` (for production)
   - `http://localhost:3000/reset-password` (for development)
   - `https://yourdomain.com/reset-password` (for production)
   - `http://localhost:3000/set-password` (for development)
   - `https://yourdomain.com/set-password` (for production)

#### B. Site URL Configuration
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your domain:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

## Testing the Fix

### 1. Test Password Reset Flow
1. Go to login page
2. Click "Forgot password" or use admin panel
3. Enter a valid email address
4. Check email and click the reset link
5. Verify you're redirected to `/reset-password` page

### 2. Test User Invitation Flow
1. Go to admin panel
2. Create a new user invitation
3. Check email and click the invitation link
4. Verify you're redirected to `/set-password` page

## Common Issues and Solutions

### Issue 1: Still Redirecting to Landing Page
**Cause**: Supabase redirect URLs not configured
**Solution**: Add the required URLs to Supabase Dashboard → Authentication → URL Configuration

### Issue 2: "Invalid redirect URL" Error
**Cause**: URL not in allowed list
**Solution**: Add the exact URL to allowed redirect URLs in Supabase

### Issue 3: Token Expired Error
**Cause**: Link clicked after expiration (usually 1 hour)
**Solution**: Request a new password reset email

### Issue 4: Email Not Received
**Cause**: Email in spam folder or incorrect email address
**Solution**: Check spam folder, verify email address

## Debugging Steps

### 1. Check Console Logs
Look for these logs in your browser console:
```
Sending password reset email to: user@example.com
Redirect URL: http://localhost:3000/reset-password
```

### 2. Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Look for authentication events
3. Check for any errors in the password reset flow

### 3. Test with Different Email Clients
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail

### 4. Check Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Click the password reset link
4. Check the redirect chain

## Email Template Configuration

### 1. Supabase Email Templates
1. Go to **Authentication** → **Email Templates**
2. Select **Reset password** template
3. Ensure the link uses `{{ .ConfirmationURL }}`
4. Save changes

### 2. Custom Email Templates
If using custom templates, ensure they include:
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

## Production Deployment

### 1. Update Environment Variables
Ensure your production environment has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### 2. Update Supabase Configuration
1. Add production URLs to allowed redirect URLs
2. Update site URL to production domain
3. Test the complete flow in production

## Monitoring

### 1. Set Up Logging
Monitor these events:
- Password reset requests
- Email delivery success/failure
- Redirect success/failure
- User completion rates

### 2. User Feedback
- Monitor support requests related to password reset
- Track user completion rates
- Identify common failure points

## Future Improvements

### 1. Enhanced Error Handling
- Better error messages for users
- Automatic retry mechanisms
- Fallback options

### 2. Analytics
- Track password reset success rates
- Monitor email delivery rates
- Identify optimization opportunities

### 3. Security Enhancements
- Rate limiting for password reset requests
- Additional verification steps
- Audit logging

## Support

If you continue to experience issues:

1. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
2. **Review Documentation**: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
3. **Contact Support**: admin@hazenasvinov.cz
4. **Check Logs**: Review both application and Supabase logs

## Conclusion

The password reset flow should now work correctly with the updated auth confirm route. The key is ensuring proper Supabase configuration and handling different email types appropriately.
