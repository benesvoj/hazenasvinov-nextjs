# Unified Login System

## 🎯 **Overview**

The unified login system provides a single entry point for both admin and coach portal access, with a clean tabbed interface that allows users to switch between different login types.

## 🔧 **Features**

### **Tabbed Interface**
- **Admin Tab**: Blue theme with shield icon for administrative access
- **Coach Tab**: Green theme with graduation cap icon for coach access
- **Dynamic UI**: Header, colors, and descriptions change based on selected tab

### **Smart Authentication**
- **Admin Login**: Redirects to `/admin` dashboard
- **Coach Login**: Validates coach role and redirects to `/coaches/dashboard`
- **Role Validation**: Prevents unauthorized access to coach portal
- **Error Handling**: Clear error messages for different failure scenarios

### **URL Support**
- **Direct Access**: `/login` - defaults to admin tab
- **Coach Redirect**: `/login?tab=coach` - opens coach tab
- **Legacy Support**: `/coaches/login` redirects to unified login

## 📁 **File Structure**

```
src/app/login/
├── page.tsx          # Unified login page with tabs
├── layout.tsx        # Login page layout with gradient background

src/app/coaches/login/
└── page.tsx          # Redirect page to unified login
```

## 🎨 **UI Components**

### **Tab System**
- Uses HeroUI `Tabs` and `Tab` components
- Dynamic colors: `primary` for admin, `success` for coach
- Icons: `ShieldCheckIcon` for admin, `AcademicCapIcon` for coach

### **Form Elements**
- **Email Field**: With user icon and proper validation
- **Password Field**: With lock icon and show/hide toggle
- **Submit Button**: Dynamic color based on selected tab
- **Error Display**: Red alert box with clear messaging

### **Visual Design**
- **Admin Theme**: Blue gradient (`from-sky-600 to-blue-600`)
- **Coach Theme**: Green gradient (`from-green-600 to-emerald-600`)
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔄 **Authentication Flow**

### **Admin Login**
1. User selects "Admin" tab
2. Enters credentials
3. System validates with Supabase
4. Redirects to `/admin` dashboard

### **Coach Login**
1. User selects "Trenér" tab
2. Enters credentials
3. System validates with Supabase
4. Checks user profile for coach role
5. Redirects to `/coaches/dashboard` or shows error

## 🛠️ **Technical Details**

### **State Management**
- `activeTab`: Current selected tab ("admin" or "coach")
- `email`/`password`: Form input values
- `loading`: Loading state during authentication
- `error`: Error message display

### **URL Parameters**
- `?tab=coach`: Opens coach tab directly
- Legacy `/coaches/login` redirects to unified login

### **Error Handling**
- Invalid credentials
- Email not confirmed
- Too many requests
- Missing user profile
- Insufficient permissions

## 🚀 **Usage**

### **For Users**
1. Navigate to `/login`
2. Choose appropriate tab (Admin or Trenér)
3. Enter credentials
4. Click "Přihlásit se"

### **For Developers**
- All login logic is centralized in one component
- Easy to extend with additional tabs
- Consistent error handling and logging
- Responsive design patterns

## 🔗 **Related Files**

- `src/utils/loginLogger.ts` - Login attempt logging
- `src/utils/supabase/client.ts` - Supabase client
- `src/routes/routes.ts` - Route definitions
- `src/components/ProtectedRoute.tsx` - Route protection

## 📝 **Future Enhancements**

- Remember last selected tab
- Social login integration
- Two-factor authentication
- Password strength indicator
- Remember me functionality
