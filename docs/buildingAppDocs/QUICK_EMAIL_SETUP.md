# Quick Email Template Setup

## Current System
Your system uses Supabase Auth with `supabase.auth.admin.inviteUserByEmail()` in `/src/app/api/manage-users/route.ts`.

## Quick Implementation Steps

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### 2. Update Email Templates
1. **Invite User Template**:
   - Find the **"Invite user"** template
   - Replace the HTML content with `email-templates/invite-user-template.html`
   - Replace the plain text content with `email-templates/invite-user-template.txt`

2. **Password Reset Template**:
   - Find the **"Reset password"** template
   - Replace the HTML content with `email-templates/reset-password-template.html`
   - Replace the plain text content with `email-templates/reset-password-template.txt`

3. Click **Save** for both templates

### 3. Test the Templates
1. **Test User Invitation**:
   - Go to your admin panel
   - Create a new user invitation
   - Check the received email

2. **Test Password Reset**:
   - Go to login page
   - Click "Forgot password" or use admin panel
   - Enter an email address
   - Check the received password reset email

## Template Features

### User Invitation Templates
✅ **Professional Design** - Modern, responsive layout  
✅ **Club Branding** - TJ Sokol Svinov colors and logo  
✅ **Czech Language** - Properly localized content  
✅ **Clear CTA** - Prominent "Accept Invitation" button  
✅ **Security Info** - Clear instructions and warnings  
✅ **Mobile Friendly** - Works on all devices  
✅ **Fallback Text** - Plain text version included

### Password Reset Templates
✅ **Security Focused** - Red color scheme for security alerts  
✅ **Clear Instructions** - Step-by-step password reset process  
✅ **Security Warnings** - Important security information  
✅ **Professional Design** - Consistent with club branding  
✅ **Mobile Friendly** - Works on all devices  
✅ **Fallback Text** - Plain text version included  

## Variables Used
- `{{ .Email }}` - Recipient's email
- `{{ .ConfirmationURL }}` - Invitation link
- `{{ .SiteURL }}` - Your website URL

## No Code Changes Required
The templates work with your existing invitation system - no code modifications needed!

## New User Flow
After accepting an invitation, users will be redirected to `/set-password` where they can:
1. Set their password with security requirements
2. Get automatically redirected to the appropriate dashboard based on their role
3. Start using the system immediately

## Redirect Logic
- **Coaches** → `/coaches/dashboard`
- **Other users** → `/admin`
- **Fallback** → `/admin` (if role cannot be determined)
