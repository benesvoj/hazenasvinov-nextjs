# Coaches Video System Setup

## Overview

The coaches video system allows coaches to manage videos for categories they are assigned to. This provides category-based access control where coaches can only view, create, edit, and delete videos for their assigned categories.

## Features

### ✅ Implemented Features

- **Category-based Access Control**: Coaches can only access videos for their assigned categories
- **Video Management**: Create, edit, delete videos with YouTube integration
- **Filtering**: Filter videos by category, club, season, and active status
- **Search**: Search videos by title and description
- **Protected Routes**: Access control using `ProtectedCoachRoute` component
- **Responsive UI**: Two-column modal layout for better UX

### 🔄 Access Control Flow

1. **Authentication**: Coach must be logged in with `coach` or `head_coach` role
2. **Category Assignment**: Coach must have `assigned_categories` in their user profile
3. **Video Filtering**: Only videos from assigned categories are shown
4. **Form Restrictions**: Video form only shows assigned categories

## Database Schema

### User Profiles Table Updates

```sql
-- Add assigned_categories column
ALTER TABLE user_profiles 
ADD COLUMN assigned_categories UUID[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX idx_user_profiles_assigned_categories 
ON user_profiles USING GIN (assigned_categories);
```

## Setup Instructions

### 1. Database Setup

Run the setup script to add the required database fields:

```bash
npm run setup:coach-category
```

Or manually execute the SQL in Supabase Dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/add_assigned_categories_simple.sql`
3. Execute the SQL

### 2. Assign Categories to Coaches

After setup, assign categories to coaches:

```sql
-- Example: Assign category to a coach
UPDATE user_profiles 
SET assigned_categories = ARRAY[
  (SELECT id FROM categories WHERE code = 'men'),
  (SELECT id FROM categories WHERE code = 'women')
]
WHERE role = 'coach' AND user_id = 'your-user-id-here';
```

### 3. Access the Coaches Portal

1. Navigate to `/coaches/login`
2. Login with coach credentials
3. Go to Dashboard → Videos
4. Or directly access `/coaches/videos`

## File Structure

```
src/app/coaches/
├── videos/
│   └── page.tsx                 # Main coaches videos page
├── dashboard/
│   └── page.tsx                 # Updated with videos link
└── login/
    └── page.tsx                 # Coach login page

src/app/admin/videos/components/
├── VideoFormModal.tsx           # Updated to support availableCategories
└── VideoCard.tsx                # Reused for coaches

scripts/
├── add_assigned_categories_to_user_profiles.sql
└── setup-coach-categories.js

docs/
└── COACHES_VIDEOS_SETUP.md      # This file
```

## Key Components

### CoachesVideosPage

- **Location**: `src/app/coaches/videos/page.tsx`
- **Features**:
  - Fetches coach's assigned categories from `user_profiles.assigned_categories`
  - Filters videos by assigned categories only
  - Shows access control message if no categories assigned
  - Uses green theme for coaches portal
  - Protected by `ProtectedCoachRoute`

### VideoFormModal Updates

- **New Prop**: `availableCategories?: Category[]`
- **Behavior**: 
  - If `availableCategories` provided (coaches), only show those categories
  - If not provided (admin), show all categories
  - Automatically fetches categories/seasons when modal opens

### ProtectedCoachRoute

- **Location**: `src/components/ProtectedCoachRoute.tsx`
- **Checks**:
  - User is authenticated
  - User has `coach` or `head_coach` role
  - Shows loading/error states appropriately

## Usage Examples

### Assigning Categories to a Coach

```sql
-- Get coach user ID
SELECT id, user_id, role FROM user_profiles WHERE role = 'coach';

-- Assign category
UPDATE user_profiles 
SET assigned_categories = ARRAY[
  (SELECT id FROM categories WHERE code = 'men'),
  (SELECT id FROM categories WHERE code = 'women'),
  (SELECT id FROM categories WHERE code = 'juniorBoys')
]
WHERE user_id = 'coach-user-id-here';
```

### Checking Coach's Assigned Categories

```sql
SELECT 
  up.user_id,
  up.role,
  up.assigned_categories,
  c.name as category_name
FROM user_profiles up
LEFT JOIN categories c ON c.id = ANY(up.assigned_categories)
WHERE up.role IN ('coach', 'head_coach');
```

## Security Considerations

### Access Control

1. **Route Protection**: All coach routes protected by `ProtectedCoachRoute`
2. **Database Level**: Videos filtered by `assigned_categories` array
3. **Form Level**: Only assigned categories shown in video form
4. **API Level**: Supabase RLS policies should be configured

### Recommended RLS Policies

```sql
-- Example RLS policy for videos table
CREATE POLICY "Coaches can view assigned category videos" ON videos
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Admin can see all
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ) OR
      -- Coach can see assigned category
      category_id = ANY(
        SELECT assigned_categories FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('coach', 'head_coach')
      )
    )
  );
```

## Troubleshooting

### Common Issues

1. **"Žádné přiřazené kategorie" Message**
   - **Cause**: Coach has no categories in `assigned_categories` field
   - **Solution**: Assign categories using SQL update

2. **Empty Video List**
   - **Cause**: No videos exist for assigned categories
   - **Solution**: Create videos or check category assignments

3. **Form Shows No Categories**
   - **Cause**: `availableCategories` not passed or empty
   - **Solution**: Check category assignment in database

4. **Access Denied**
   - **Cause**: User not authenticated or wrong role
   - **Solution**: Check user profile and authentication

### Debug Steps

1. **Check User Profile**:
   ```sql
   SELECT * FROM user_profiles WHERE user_id = 'your-user-id';
   ```

2. **Check Assigned Categories**:
   ```sql
   SELECT assigned_categories FROM user_profiles 
   WHERE user_id = 'your-user-id' AND role IN ('coach', 'head_coach');
   ```

3. **Check Available Videos**:
   ```sql
   SELECT * FROM videos WHERE category_id = ANY(
     SELECT assigned_categories FROM user_profiles 
     WHERE user_id = 'your-user-id'
   );
   ```

## Future Enhancements

### Planned Features

- **Bulk Category Assignment**: Admin interface to assign categories to coaches
- **Video Analytics**: Track video views and engagement
- **Video Comments**: Allow coaches to add notes to videos
- **Video Sharing**: Share videos with specific teams or players
- **Video Playlists**: Organize videos into playlists by topic

### Technical Improvements

- **Caching**: Cache assigned categories to reduce database queries
- **Real-time Updates**: Update video list when categories change
- **Advanced Filtering**: Filter by video duration, upload date, etc.
- **Video Thumbnails**: Generate custom thumbnails for better preview

## Support

For issues or questions:

1. Check this documentation
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify database setup and category assignments
5. Contact system administrator for access issues
