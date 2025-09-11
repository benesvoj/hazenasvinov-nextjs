# Coaches Portal Setup

## Overview

The Coaches Portal is a separate, secure interface for team coaches to manage their teams, view matches, and access team-specific information. It's completely separate from the admin portal and provides role-based access control.

## Features

### 🔐 **Authentication & Security**
- **Separate login**: `/coaches/login` - dedicated login page for coaches
- **Role-based access**: Only users with `coach` or `head_coach` roles can access
- **Protected routes**: All coach pages are protected with `ProtectedCoachRoute` component
- **Session management**: Secure authentication using Supabase Auth

### 🎯 **Portal Structure**
```
/coaches/
├── login/          # Coach login page
├── dashboard/      # Main coach dashboard
└── layout.tsx      # Portal layout
```

### 🛡️ **Security Components**
- `ProtectedCoachRoute` - Component that checks coach permissions
- Role validation in login process
- Automatic redirects for unauthorized users

## Database Requirements

### User Profiles Table
The portal requires a `user_profiles` table with the following structure:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'head_coach', 'member')),
  club_id UUID REFERENCES clubs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_club_id ON user_profiles(club_id);
```

### Required Roles
- `coach` - Regular team coach
- `head_coach` - Head coach with additional permissions

## Setup Instructions

### 1. **Database Setup**
Ensure the `user_profiles` table exists with proper structure and data.

### 2. **Create Coach Users**
```sql
-- Example: Create a coach user profile
INSERT INTO user_profiles (user_id, role, club_id)
VALUES (
  'user-uuid-from-auth', 
  'coach', 
  'club-uuid'
);
```

### 3. **Access the Portal**
- Navigate to `/coaches/login`
- Use coach credentials
- Access dashboard at `/coaches/dashboard`

## Portal Components

### **Login Page** (`/coaches/login`)
- **Design**: Green-themed, distinct from admin login
- **Features**: 
  - Email/password authentication
  - Role validation
  - Automatic redirect to dashboard
  - Links to admin portal and main site

### **Dashboard** (`/coaches/dashboard`)
- **Protected**: Only accessible to authenticated coaches
- **Features**:
  - User information display
  - Quick action cards (Teams, Matches, Statistics)
  - Responsive design
  - Sign out functionality

### **Protected Route Component**
- **Purpose**: Ensures only coaches can access protected pages
- **Features**:
  - Authentication check
  - Role validation
  - Loading states
  - Error handling
  - Automatic redirects

## Navigation Integration

### **Header Link**
- **Desktop**: Green button on the right side of header
- **Mobile**: Prominent link in mobile menu
- **Styling**: Distinct green theme to differentiate from admin

### **Access Points**
- Main navigation header
- Mobile menu
- Direct URL access

## User Experience

### **Login Flow**
1. User visits `/coaches/login`
2. Enters email/password
3. System validates credentials
4. System checks user role
5. If coach: redirect to `/coaches/dashboard`
6. If not coach: show error and sign out

### **Dashboard Experience**
1. **Welcome section** with personalized greeting
2. **Account information** card showing role and club
3. **Quick actions** for common tasks
4. **Navigation** to future features

## Future Enhancements

### **Phase 1** (Current)
- ✅ Basic authentication
- ✅ Dashboard structure
- ✅ Protected routes

### **Phase 2** (Planned)
- Team management interface
- Match viewing and management
- Player statistics
- Training schedules

### **Phase 3** (Future)
- Advanced analytics
- Communication tools
- Document management
- Mobile app integration

## Security Considerations

### **Access Control**
- **Role-based**: Only coach roles can access
- **Session-based**: Validates authentication on each request
- **Route protection**: All coach pages are protected

### **Data Isolation**
- Coaches can only see their club's data
- No access to admin functions
- Separate authentication from admin portal

### **Audit Trail**
- Login attempts are logged
- Failed access attempts are tracked
- User actions can be monitored

## Troubleshooting

### **Common Issues**

#### **"Uživatelský profil nebyl nalezen"**
- **Cause**: User exists in auth but not in user_profiles table
- **Solution**: Create user profile with appropriate role

#### **"Nemáte oprávnění pro přístup do trenérského portálu"**
- **Cause**: User role is not 'coach' or 'head_coach'
- **Solution**: Update user role in user_profiles table

#### **Login redirects to admin**
- **Cause**: User has admin role instead of coach role
- **Solution**: Ensure user has correct role in user_profiles

### **Debug Steps**
1. Check user authentication status
2. Verify user profile exists
3. Confirm user role is correct
4. Check club association
5. Review browser console for errors

## Testing

### **Test Scenarios**
1. **Valid coach login** - Should redirect to dashboard
2. **Invalid credentials** - Should show error message
3. **Non-coach user** - Should be denied access
4. **Missing profile** - Should show appropriate error
5. **Logout** - Should redirect to login page

### **Test Users**
Create test users with different roles:
- Regular coach
- Head coach
- Admin user (should be denied)
- Regular member (should be denied)

## Conclusion

The Coaches Portal provides a secure, dedicated interface for team coaches while maintaining separation from the admin portal. It's built with security, usability, and scalability in mind, providing a foundation for future coach-specific features.

The portal demonstrates best practices for:
- Role-based access control
- Protected routes
- User experience design
- Security implementation
- Component architecture
