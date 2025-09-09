# Authentication Setup Guide

## Overview

This application uses Supabase for authentication and database access. The "permission denied for table users" error is normal for unauthenticated users and is handled gracefully by the application.

## Components Added

### 1. `useAuth` Hook (`src/hooks/useAuth.ts`)
- Manages authentication state
- Provides user session information
- Handles sign-out functionality
- Automatically updates on auth state changes

### 2. `ProtectedRoute` Component (`src/components/ProtectedRoute.tsx`)
- Wraps content that requires authentication
- Shows loading states during auth checks
- Provides fallback content for unauthenticated users
- Redirects to login when needed

### 3. `DatabaseErrorBoundary` Component (`src/components/DatabaseErrorBoundary.tsx`)
- Catches database permission errors
- Shows user-friendly error messages
- Explains that permission errors are normal for unauthenticated users
- Provides login links

## Usage Examples

### Protecting Admin Routes
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <div>Admin content here</div>
    </ProtectedRoute>
  )
}
```

### Using Authentication State
```tsx
import { useAuth } from '@/hooks/useAuth'

export default function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.email}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### Custom Fallback Content
```tsx
<ProtectedRoute 
  fallback={<div>Custom unauthorized message</div>}
>
  <div>Protected content</div>
</ProtectedRoute>
```

## Error Handling

### Database Permission Errors
- **Normal for unauthenticated users**: The "permission denied" error is expected behavior
- **Graceful fallback**: Users see informative messages instead of technical errors
- **Clear guidance**: Users are directed to login for full access

### Authentication Errors
- **Loading states**: Users see spinners during auth checks
- **Error boundaries**: Database errors are caught and handled gracefully
- **User feedback**: Clear messages about what's happening

## Environment Variables Required

Make sure you have these environment variables set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Policies

Ensure your Supabase database has proper Row Level Security (RLS) policies:

```sql
-- Example policy for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Example policy for public data
CREATE POLICY "Public data is viewable by everyone" ON categories
  FOR SELECT USING (true);
```

## Testing

1. **Unauthenticated access**: Visit admin routes without logging in
2. **Permission errors**: Should see friendly messages, not technical errors
3. **Authentication flow**: Login should work and redirect properly
4. **Protected content**: Should only be visible to authenticated users

## Troubleshooting

### Common Issues

1. **"permission denied" errors still showing**
   - Check that DatabaseErrorBoundary is wrapping your content
   - Verify Supabase policies are set correctly

2. **Authentication not working**
   - Verify environment variables are set
   - Check Supabase project settings
   - Ensure email confirmation is configured

3. **Protected routes not working**
   - Verify ProtectedRoute component is imported and used
   - Check that useAuth hook is working properly

### Debug Mode

Enable debug logging by adding to your component:
```tsx
const { user, session, loading, error } = useAuth()
console.log('Auth state:', { user, session, loading, error })
```

## Security Notes

- **Never expose sensitive data** to unauthenticated users
- **Use RLS policies** to enforce database-level security
- **Validate user permissions** on both client and server
- **Handle errors gracefully** without exposing system internals

## Next Steps

1. **Customize error messages** in the translations file
2. **Add role-based access control** if needed
3. **Implement user registration** if required
4. **Add password reset functionality**
5. **Set up email verification** for new users
