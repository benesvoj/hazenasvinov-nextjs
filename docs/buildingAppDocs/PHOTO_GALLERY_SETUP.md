# Photo Gallery Setup Instructions

This document provides instructions for setting up the photo gallery management system in the admin portal.

## Database Setup

### 1. Run the Database Schema Script

Execute the SQL script to create the necessary database tables:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f scripts/setup_photo_gallery.sql
```

Or run it directly in the Supabase SQL editor.

### 2. Verify Tables Created

The script will create:
- `photo_albums` table for managing photo albums
- `photos` table for storing photo metadata
- Proper indexes and RLS policies
- Sample album for testing

## Features

### Album Management
- ✅ Create new photo albums
- ✅ Edit album details (title, description, visibility)
- ✅ Set album sort order
- ✅ Toggle public/private visibility
- ✅ Delete albums (cascades to photos)

### Photo Management
- ✅ Upload multiple photos to albums
- ✅ Edit photo metadata (title, description)
- ✅ Set photo sort order within albums
- ✅ Mark photos as featured
- ✅ Delete individual photos
- ✅ Drag & drop reordering

### File Storage
- ✅ Automatic upload to Supabase storage
- ✅ Image dimension detection
- ✅ File size and type validation
- ✅ Organized file structure: `photo-gallery/{albumId}/{filename}`

## Usage

### 1. Access Photo Gallery

Navigate to **Admin → Fotogalerie** in the admin portal.

### 2. Create Albums

1. Click **"Nové album"** button
2. Fill in album details:
   - Title (required)
   - Description (optional)
   - Sort order
   - Public/private visibility
3. Click **"Vytvořit album"**

### 3. Upload Photos

1. Select an album from the dropdown
2. Click **"Nahrát fotky"** button
3. Select multiple image files
4. Review selected files
5. Click **"Nahrát X fotografií"**
6. Monitor upload progress

### 4. Manage Photos

- **Edit**: Click edit icon on photo
- **Delete**: Click delete icon on photo
- **Reorder**: Use up/down arrows on photos
- **Featured**: Toggle featured status in edit modal

## File Structure

```
src/app/admin/photo-gallery/
├── page.tsx.backup                 # Main photo gallery page
├── components/
│   ├── AlbumsTab.tsx        # Albums management tab
│   ├── PhotosTab.tsx        # Photos management tab
│   ├── AlbumFormModal.tsx   # Album create/edit modal
│   ├── PhotoFormModal.tsx   # Photo create/edit modal
│   └── PhotoUploadModal.tsx # Bulk photo upload modal
```

## Database Schema

### photo_albums Table
```sql
- id: UUID (Primary Key)
- title: VARCHAR(255) NOT NULL
- description: TEXT
- cover_photo_url: TEXT
- is_public: BOOLEAN DEFAULT true
- sort_order: INTEGER DEFAULT 0
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (References auth.users)
```

### photos Table
```sql
- id: UUID (Primary Key)
- album_id: UUID (References photo_albums)
- title: VARCHAR(255)
- description: TEXT
- file_path: TEXT NOT NULL
- file_url: TEXT NOT NULL
- file_size: INTEGER
- mime_type: VARCHAR(100)
- width: INTEGER
- height: INTEGER
- sort_order: INTEGER DEFAULT 0
- is_featured: BOOLEAN DEFAULT false
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- uploaded_by: UUID (References auth.users)
```

## Storage Configuration

The system uses the existing `club-assets` storage bucket with:
- File size limit: 5MB
- Supported formats: JPG, PNG, WebP, GIF
- Organized structure: `photo-gallery/{albumId}/{filename}`

## Security Features

- Row Level Security (RLS) enabled
- Public albums visible to everyone
- Private albums only visible to authenticated users
- Only authenticated users can create/edit/delete
- Automatic cleanup of storage files when photos are deleted

## Troubleshooting

### Common Issues

1. **Upload fails**: Check file size (max 5MB) and format
2. **Photos not showing**: Verify RLS policies are active
3. **Storage errors**: Ensure storage bucket exists and policies are correct

### Debug Commands

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('photo_albums', 'photos');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('photo_albums', 'photos');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'club-assets';
```

## Future Enhancements

- [ ] Photo cropping and resizing
- [ ] Bulk photo editing
- [ ] Album templates
- [ ] Photo watermarks
- [ ] Advanced search and filtering
- [ ] Photo sharing and social media integration
- [ ] Mobile-optimized upload interface
