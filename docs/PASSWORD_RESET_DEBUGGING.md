# Password Reset Debugging Guide

## 🔍 **Current Issue**

Users are being redirected to the error page (`/error`) when clicking password reset links from emails.

## 🛠️ **Debugging Steps**

### **1. Check Server Logs**

The auth confirm route now includes detailed logging. Check your server console for:

```
Auth confirm route called with: {
  token_hash: 'present' | 'missing',
  code: 'present' | 'missing', 
  token: 'present' | 'missing',
  type: 'recovery' | 'signup' | null,
  next: '/',
  fullUrl: 'https://...'
}
```

### **2. Verify Email Template Format**

The email template should use `{{ .ConfirmationURL }}` which generates a URL like:
```
https://nsyfksvtkjmyhvdmxqsi.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://www.hazenasvinov.cz
```

### **3. Check Supabase Configuration**

In your Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://www.hazenasvinov.cz
```

**Redirect URLs:**
```
https://www.hazenasvinov.cz/auth/confirm
https://www.hazenasvinov.cz/reset-password
https://www.hazenasvinov.cz/set-password
```

### **4. Test the Flow**

1. **Request password reset** from admin panel
2. **Check email** - verify the link format
3. **Click the link** - check server logs for debugging info
4. **Verify redirect** - should go to `/reset-password` not `/error`

## 🔧 **Common Issues & Solutions**

### **Issue 1: Missing Parameters**
**Error:** "Missing required parameters"
**Solution:** Check that the email link includes both token and type parameters

### **Issue 2: Supabase Verification Fails**
**Error:** "Auth verification failed"
**Solution:** 
- Verify Supabase environment variables
- Check if the token has expired
- Ensure the user exists in Supabase

### **Issue 3: Wrong Redirect URL**
**Error:** Redirects to homepage instead of reset-password
**Solution:** Check the `redirectTo` parameter in the reset password API call

## 📝 **Updated Files**

### **Email Templates**
- `email-templates/reset-password-template.html` - Uses `{{ .ConfirmationURL }}`
- `email-templates/reset-password-template.txt` - Uses `{{ .ConfirmationURL }}`

### **Auth Confirm Route**
- `src/app/auth/confirm/route.ts` - Added comprehensive logging and error handling

### **API Route**
- `src/app/api/reset-password/route.ts` - Uses correct redirect URL

## 🚀 **Next Steps**

1. **Update Supabase Email Templates** with the corrected versions
2. **Test the password reset flow** end-to-end
3. **Check server logs** for any remaining issues
4. **Remove debug logging** once the issue is resolved

## 📞 **If Still Not Working**

If the issue persists after following these steps:

1. **Check the exact URL** in the email
2. **Verify the token format** in server logs
3. **Test with a fresh password reset request**
4. **Check Supabase project settings** for any restrictions

The debugging logs will help identify exactly where the flow is failing.
