# Password Reset Fix - "Sorry, something went wrong" Error

## 🔍 **Issue Analysis**

The password reset link `https://www.hazenasvinov.cz/auth/confirm?token=065658&type=recovery` is showing "Sorry, something went wrong" instead of redirecting to the password reset page.

## 🛠️ **Root Cause & Fixes Applied**

### **1. Fixed Token Parameter Handling**
**Problem**: The auth confirm route was incorrectly using `token` as `token_hash` in the `verifyOtp` call.

**Fix**: Updated `src/app/auth/confirm/route.ts` to use the `token` parameter directly:
```typescript
// Before (incorrect)
const result = await supabase.auth.verifyOtp({
  type,
  token_hash: token,  // ❌ Wrong parameter
})

// After (correct)
const result = await supabase.auth.verifyOtp({
  type,
  token,  // ✅ Correct parameter
})
```

### **2. Fixed Environment Variable Reference**
**Problem**: The reset password API was looking for `NEXT_PUBLIC_SITE_URL` but the actual environment variable is `NEXT_PUBLIC_PRODUCTION_URL`.

**Fix**: Updated `src/app/api/reset-password/route.ts`:
```typescript
// Before
const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// After
const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
```

### **3. Enhanced Debugging & Logging**
**Added**: Comprehensive logging to help diagnose issues:
- Detailed parameter logging in auth confirm route
- Error details with user and session information
- Origin detection logging in reset password API

## 🔧 **Required Supabase Configuration**

### **1. Redirect URLs**
In your Supabase Dashboard → Authentication → URL Configuration, ensure these URLs are added to **Redirect URLs**:

```
https://www.hazenasvinov.cz/auth/confirm
https://www.hazenasvinov.cz/reset-password
https://www.hazenasvinov.cz/set-password
http://localhost:3000/auth/confirm
http://localhost:3000/reset-password
http://localhost:3000/set-password
```

### **2. Site URL**
Set **Site URL** to:
```
https://www.hazenasvinov.cz
```

### **3. Email Templates**
Ensure your password reset email template uses the correct format:
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

## 🧪 **Testing the Fix**

### **1. Test API Endpoint**
Visit: `https://www.hazenasvinov.cz/api/test-password-reset`
This will show you the detected origin and redirect URL.

### **2. Test Password Reset Flow**
1. Go to admin panel → Users
2. Click "Reset Password" for any user
3. Check the email link format
4. Click the link and verify it redirects to `/reset-password`

### **3. Check Server Logs**
Monitor your server logs for the detailed debugging information:
```
Auth confirm route called with: { token: 'present', type: 'recovery', ... }
Token verification result: { error: null, user: 'user-id', session: true }
Redirecting to reset-password page
```

## 📋 **Files Modified**

1. **`src/app/auth/confirm/route.ts`**
   - Fixed token parameter handling
   - Enhanced error logging and debugging

2. **`src/app/api/reset-password/route.ts`**
   - Fixed environment variable reference
   - Added origin detection logging

3. **`src/app/api/test-password-reset/route.ts`** (new)
   - Test endpoint for debugging password reset configuration

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Invalid token" Error**
**Cause**: Token has expired or is malformed
**Solution**: Request a new password reset email

### **Issue 2: Redirects to Error Page**
**Cause**: Missing or incorrect Supabase redirect URL configuration
**Solution**: Add the correct URLs to Supabase Dashboard

### **Issue 3: "Auth verification failed" Error**
**Cause**: Supabase environment variables or configuration issues
**Solution**: Check Supabase project settings and environment variables

## ✅ **Expected Behavior After Fix**

1. User requests password reset from admin panel
2. Email is sent with link: `https://www.hazenasvinov.cz/auth/confirm?token=...&type=recovery`
3. User clicks link → redirected to `/reset-password` page
4. User sets new password → redirected to login page

## 🔍 **Debugging Commands**

```bash
# Check environment variables
grep -i "production_url\|base_url" .env.local

# Test the API endpoint
curl https://www.hazenasvinov.cz/api/test-password-reset

# Check server logs for debugging info
# Look for "Auth confirm route called with" messages
```

The fix should resolve the "Sorry, something went wrong" error and properly redirect users to the password reset page.
