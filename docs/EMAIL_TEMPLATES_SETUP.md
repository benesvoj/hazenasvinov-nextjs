# Email Templates Setup

This document explains how to set up custom email templates for user invitations in the TJ Sokol Svinov system.

## Overview

The system uses Supabase Auth for user management and invitations. By default, Supabase sends basic email templates, but we can customize these to match our club's branding and provide a better user experience.

## Email Templates

We have created professional email templates for both user invitations and password reset functionality:

### User Invitation Templates

#### 1. HTML Template (`email-templates/invite-user-template.html`)
- Modern, responsive design
- Club branding with colors and styling
- Clear call-to-action button
- Mobile-friendly layout
- Professional appearance

#### 2. Plain Text Template (`email-templates/invite-user-template.txt`)
- Fallback for email clients that don't support HTML
- Clean, readable format
- All essential information included

### Password Reset Templates

#### 3. HTML Template (`email-templates/reset-password-template.html`)
- Security-focused design with red color scheme
- Clear instructions for password reset
- Security warnings and best practices
- Professional appearance with club branding

#### 4. Plain Text Template (`email-templates/reset-password-template.txt`)
- Fallback for email clients that don't support HTML
- Clean, readable format
- All essential security information included

## Implementation in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication → Email Templates

2. **Configure Invite User Template**
   - Select "Invite user" template
   - Replace the default template with our custom HTML template
   - Save the changes

3. **Configure Password Reset Template**
   - Select "Reset password" template
   - Replace the default template with our custom HTML template
   - Save the changes

4. **Configure Plain Text Versions**
   - In the same section, configure the plain text versions for both templates
   - Use our plain text templates

### Method 2: Supabase CLI (Advanced)

If you prefer to manage templates via CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Update email templates
supabase functions deploy
```

### Method 3: API Configuration

You can also configure templates programmatically using the Supabase Management API:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Update email template
await supabase.auth.admin.updateUser({
  // Template configuration
})
```

## Template Variables

The templates use the following Supabase Auth variables:

### User Invitation Templates
- `{{ .Email }}` - Recipient's email address
- `{{ .ConfirmationURL }}` - Link to accept the invitation
- `{{ .SiteURL }}` - Your site's base URL

### Password Reset Templates
- `{{ .Email }}` - Recipient's email address
- `{{ .ConfirmationURL }}` - Link to reset password
- `{{ .SiteURL }}` - Your site's base URL

## User Flow After Invitation

When users click the invitation link, they will:

1. **Email Confirmation**: Supabase verifies the invitation token
2. **Redirect to Set Password**: Users are redirected to `/set-password` page
3. **Password Setup**: Users set their password with security requirements
4. **Automatic Login**: Users are automatically logged in after password setup
5. **Role-Based Redirect**: Users are redirected based on their role:
   - **Coaches** → `/coaches/dashboard`
   - **Other users** → `/admin`
   - **Fallback** → `/admin` (if role cannot be determined)

## Password Reset Flow

When users request a password reset, they will:

1. **Request Reset**: User enters email on login page or admin panel
2. **Email Sent**: System sends password reset email with secure link
3. **Click Link**: User clicks the reset link in the email
4. **Redirect to Reset Page**: User is redirected to `/reset-password` page
5. **Set New Password**: User sets new password with security requirements
6. **Automatic Login**: User is automatically logged in after password reset
7. **Redirect to Login**: User is redirected to login page to sign in with new password

## Customization

### Colors and Branding
The HTML template uses a blue color scheme that matches the club's identity:
- Primary blue: `#1e3a8a` (header background)
- Secondary blue: `#3b82f6` (gradient)
- Success green: `#059669` (CTA button)

### Content Customization
You can modify the following sections:
- Club description
- Feature list
- Contact information
- Security notice

### Responsive Design
The template is fully responsive and will display correctly on:
- Desktop computers
- Tablets
- Mobile phones
- Various email clients

## Testing

### Test the Templates
1. Create a test user invitation
2. Check the email in different clients:
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile email apps

### Email Client Compatibility
The templates are tested for compatibility with:
- ✅ Gmail (web and mobile)
- ✅ Outlook (web and desktop)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Thunderbird

## Security Considerations

### Link Expiration
- Invitation links expire after 24 hours by default
- This can be configured in Supabase Auth settings

### Email Validation
- Supabase automatically validates email addresses
- Invalid emails will not receive invitations

### Rate Limiting
- Supabase has built-in rate limiting for email sending
- Prevents spam and abuse

## Monitoring

### Email Delivery
Monitor email delivery through:
- Supabase Dashboard → Authentication → Users
- Check for failed deliveries
- Monitor bounce rates

### User Engagement
Track user engagement:
- Click-through rates on invitation links
- Time to complete registration
- Support requests related to invitations

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Check Supabase Auth configuration
   - Verify SMTP settings
   - Check rate limits

2. **Templates not rendering correctly**
   - Test in multiple email clients
   - Check for HTML validation errors
   - Verify CSS compatibility

3. **Links not working**
   - Check site URL configuration
   - Verify redirect URLs
   - Test in different browsers

### Support

For issues with email templates:
- Check Supabase documentation
- Contact system administrator
- Review email delivery logs

## Future Enhancements

### Planned Improvements
- [ ] Multi-language support
- [ ] A/B testing for templates
- [ ] Advanced personalization
- [ ] Analytics integration

### Additional Templates
Consider creating templates for:
- Password reset emails
- Welcome emails
- Account confirmation
- Security notifications

## Maintenance

### Regular Updates
- Review templates quarterly
- Update contact information as needed
- Test with new email clients
- Monitor user feedback

### Version Control
- Keep templates in version control
- Document changes
- Test before deploying
- Maintain backup versions
