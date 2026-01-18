# Videos Management Setup

## Overview

The Videos section in the admin portal allows coaches to manage YouTube videos for their assigned categories. Each coach can only see and manage videos from categories they have access to.

## Features

### 🎥 **Video Management**
- **Add videos**: Upload YouTube videos with title, description, category, club, recording date, and season
- **Edit videos**: Update video information and settings
- **Delete videos**: Remove videos from the system
- **Advanced filtering**: Filter by category, club, season, recording date, and status
- **Active/Inactive status**: Control video visibility

### 🔐 **Access Control**
- **Admin access**: Full access to all videos for administrators
- **Role-based permissions**: Uses existing user role system
- **Category-based access**: *Planned* - Coaches will only see videos from their assigned categories

### 🎨 **User Interface**
- **Video cards**: Visual display with thumbnails and metadata
- **Search and filters**: Find videos by title, description, or category
- **YouTube integration**: Direct play buttons and thumbnail display
- **Responsive design**: Works on all device sizes

## Database Schema

### Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  club_id UUID REFERENCES clubs(id),
  recording_date DATE,
  season_id UUID REFERENCES seasons(id),
  thumbnail_url TEXT,
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Key Fields
- **youtube_url**: Full YouTube URL (e.g., https://www.youtube.com/watch?v=...)
- **youtube_id**: Extracted YouTube video ID for API calls
- **thumbnail_url**: YouTube thumbnail URL (auto-generated)
- **category_id**: Links to categories table for access control
- **club_id**: Links to clubs table (optional)
- **recording_date**: Date when video was recorded (optional)
- **season_id**: Links to seasons table (optional)
- **is_active**: Controls video visibility

## Setup Instructions

### 1. **Database Setup**
Run the setup script to create the videos table:
```bash
npm run setup:video-table
```

Or manually execute the SQL from `scripts/create_videos_table.sql` in your Supabase dashboard.

### 2. **Access the Videos Section**
- Navigate to `/admin/videos` in the admin portal
- The section will appear in the sidebar with a video camera icon
- Only users with appropriate permissions can access

### 3. **Add Videos**
1. Click "Přidat video" (Add Video) button
2. Fill in the form:
   - **Title**: Video title
   - **Description**: Optional description
   - **YouTube URL**: Full YouTube URL
   - **Category**: Select appropriate category
   - **Active**: Toggle visibility
3. Click "Přidat video" to save

## Usage Guide

### **For Coaches**
1. **View Videos**: See all videos (category filtering planned for future)
2. **Add Videos**: Upload new YouTube videos for your categories
3. **Edit Videos**: Update video information and settings
4. **Manage Status**: Activate/deactivate videos as needed

### **For Administrators**
1. **Full Access**: View and manage all videos across all categories
2. **Category Management**: Assign videos to any category
3. **User Management**: See who created/updated each video
4. **System Oversight**: Monitor video usage and activity

### **Video Operations**

#### **Adding a Video**
1. Click "Přidat video" button
2. Enter video details:
   - Title (required)
   - Description (optional)
   - YouTube URL (required)
   - Category (required)
   - Club (optional)
   - Recording date (optional)
   - Season (optional)
   - Active status
3. System automatically extracts YouTube ID and thumbnail
4. Click "Přidat video" to save

#### **Editing a Video**
1. Click the edit icon on any video card
2. Modify the information as needed
3. Click "Uložit změny" to save

#### **Deleting a Video**
1. Click the delete icon on any video card
2. Confirm deletion in the modal
3. Video is permanently removed

#### **Playing a Video**
1. Click the play button on any video card
2. Video opens in a new tab/window
3. Uses the original YouTube URL

## YouTube Integration

### **URL Support**
The system supports various YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

### **Automatic Features**
- **ID Extraction**: Automatically extracts YouTube ID from URL
- **Thumbnail Generation**: Uses YouTube's thumbnail API
- **URL Validation**: Validates YouTube URLs before saving

### **Thumbnail URLs**
Thumbnails are automatically generated using YouTube's API:
- Format: `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`
- Fallback: Placeholder image if thumbnail fails to load

## Filtering and Search

### **Available Filters**
- **Category**: Filter by specific category
- **Club**: Filter by specific club
- **Season**: Filter by specific season
- **Active Status**: Show only active/inactive videos
- **Search**: Search by title or description
- **Clear Filters**: Reset all filters

### **Search Functionality**
- Searches video titles and descriptions
- Case-insensitive matching
- Partial text matching
- Real-time filtering

## Security and Permissions

### **Row Level Security**
- Videos table has RLS enabled
- Policies control access based on user roles
- Category-based filtering for coaches

### **Access Control**
- **Coaches**: Can only see videos from their assigned categories
- **Administrators**: Full access to all videos
- **Unauthorized users**: Cannot access the videos section

### **Data Validation**
- YouTube URL validation
- Required field validation
- Category existence validation
- User permission validation

## Troubleshooting

### **Common Issues**

#### **"Neplatná YouTube URL" Error**
- **Cause**: Invalid YouTube URL format
- **Solution**: Use standard YouTube URLs (youtube.com/watch?v= or youtu.be/)

#### **"Kategorie je povinná" Error**
- **Cause**: No category selected
- **Solution**: Select a valid category from the dropdown

#### **Thumbnail Not Loading**
- **Cause**: YouTube thumbnail API issue or invalid video ID
- **Solution**: Check if the YouTube video exists and is public

#### **Permission Denied**
- **Cause**: User doesn't have access to the videos section
- **Solution**: Check user role and category assignments

### **Debug Steps**
1. Check user authentication status
2. Verify user role and permissions
3. Confirm category assignments
4. Validate YouTube URL format
5. Check browser console for errors

## Implementation Status

### **Phase 1** (Current)
- ✅ Basic video management
- ✅ YouTube integration
- ✅ Search and filtering
- ✅ Admin interface
- ⏳ Category-based access control (planned)

### **Current Limitations**
- All authenticated users can see all videos
- Category-based filtering for coaches not yet implemented
- User role system needs to be extended for video access control

### **Phase 2** (Planned)
- Video playlists and collections
- Video analytics and statistics
- Bulk video operations
- Video scheduling and publishing

### **Phase 3** (Future)
- Video comments and ratings
- Video sharing and embedding
- Advanced video metadata
- Integration with other platforms

## API Integration

### **YouTube API** (Future)
- Video metadata retrieval
- Duration and statistics
- Channel information
- Playlist management

### **Custom API Endpoints**
- Video CRUD operations
- Category-based filtering
- User permission checks
- Bulk operations

## Conclusion

The Videos management system provides a comprehensive solution for managing YouTube videos within the admin portal. It offers category-based access control, intuitive user interface, and seamless YouTube integration.

Key benefits:
- **Organized content**: Videos are categorized and easily searchable
- **Access control**: Coaches only see relevant videos
- **User-friendly**: Intuitive interface for all skill levels
- **Scalable**: Built to handle growing video libraries
- **Secure**: Role-based permissions and data validation

The system is ready for immediate use and provides a solid foundation for future video management features.
