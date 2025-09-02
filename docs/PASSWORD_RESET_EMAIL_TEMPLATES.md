# Password Reset Email Templates

## Overview

Professional email templates for password reset functionality in the TJ Sokol Svinov system. These templates provide a secure, user-friendly experience for users who need to reset their passwords.

## Templates Created

### 1. HTML Template (`email-templates/reset-password-template.html`)
- **Security-focused design** with red color scheme
- **Professional layout** with club branding
- **Clear call-to-action** button for password reset
- **Security warnings** and best practices
- **Mobile-responsive** design
- **Czech language** content

### 2. Plain Text Template (`email-templates/reset-password-template.txt`)
- **Fallback version** for email clients that don't support HTML
- **Clean, readable format** with clear sections
- **All essential information** included
- **Security warnings** prominently displayed

## Key Features

### Security Focus
- **Red color scheme** to indicate security-related action
- **Clear security warnings** about link expiration
- **Instructions** for what to do if user didn't request reset
- **Best practices** for password security

### User Experience
- **Clear instructions** on what happens next
- **Professional appearance** with club branding
- **Mobile-friendly** design
- **Accessible** content structure

### Club Branding
- **TJ Sokol Svinov** header and footer
- **Club colors** and styling
- **Professional appearance** consistent with invitation templates
- **Contact information** for support

## Template Variables

The templates use the following Supabase Auth variables:

- `{{ .Email }}` - Recipient's email address
- `{{ .ConfirmationURL }}` - Secure link to reset password
- `{{ .SiteURL }}` - Your website URL

## Password Reset Flow

1. **User Request**: User requests password reset via login page or admin panel
2. **Email Sent**: System sends password reset email using Supabase Auth
3. **User Clicks Link**: User clicks the secure reset link in email
4. **Redirect to Reset Page**: User is redirected to `/reset-password` page
5. **Set New Password**: User sets new password with security requirements
6. **Success**: User is redirected to login page with new password

## Implementation

### Supabase Dashboard Setup

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication → Email Templates

2. **Configure Password Reset Template**
   - Select "Reset password" template
   - Replace HTML content with `email-templates/reset-password-template.html`
   - Replace plain text content with `email-templates/reset-password-template.txt`
   - Save changes

### Testing

1. **Test Password Reset Flow**:
   - Go to login page
   - Click "Forgot password" or use admin panel
   - Enter a valid email address
   - Check received email for proper formatting

2. **Test Different Email Clients**:
   - Gmail (web and mobile)
   - Outlook (web and desktop)
   - Apple Mail
   - Other email clients

## Security Considerations

### Link Expiration
- Password reset links expire after 1 hour by default
- Users must request new link if expired
- Clear messaging about link expiration

### User Verification
- Only the email owner can reset the password
- No indication if email exists in system (security best practice)
- Clear instructions for users who didn't request reset

### Best Practices
- Users are warned not to share the reset link
- Clear instructions for secure password creation
- Contact information for support if needed

## Customization Options

### Colors and Branding
- **Primary Red**: `#dc2626` (header background)
- **Secondary Red**: `#ef4444` (gradient and buttons)
- **Club Branding**: TJ Sokol Svinov colors and styling

### Content Customization
- **Security Messages**: Can be updated for different security policies
- **Contact Information**: Update support email and website
- **Club Information**: Modify club description and details

### Styling Options
- **Responsive Design**: Already optimized for mobile devices
- **Email Client Compatibility**: Tested with major email clients
- **Accessibility**: Proper contrast and readable fonts

## Troubleshooting

### Common Issues

1. **Email Not Received**
   - Check spam/junk folder
   - Verify email address is correct
   - Check Supabase Auth configuration

2. **Link Not Working**
   - Verify link hasn't expired (1 hour limit)
   - Check for URL encoding issues
   - Ensure proper redirect URL configuration

3. **Template Not Rendering**
   - Test in multiple email clients
   - Check for HTML validation errors
   - Verify CSS compatibility

### Support

For issues with password reset templates:
- Check Supabase documentation
- Contact system administrator
- Review email delivery logs

## Maintenance

### Regular Updates
- **Review templates** quarterly for content updates
- **Test functionality** monthly
- **Update contact information** as needed
- **Monitor user feedback** for improvements

### Version Control
- **Keep templates** in version control
- **Document changes** and updates
- **Test before deploying** changes
- **Maintain backup versions**

## Future Enhancements

### Potential Improvements
- [ ] Multi-language support
- [ ] Advanced personalization
- [ ] Analytics integration
- [ ] A/B testing for templates
- [ ] Custom branding per user role

### Additional Templates
- [ ] Account confirmation emails
- [ ] Security notifications
- [ ] Login attempt alerts
- [ ] Account lockout notifications

## Conclusion

These password reset email templates provide a secure, professional experience for users who need to reset their passwords. The templates are ready to use and can be easily customized to meet specific needs while maintaining security best practices.
