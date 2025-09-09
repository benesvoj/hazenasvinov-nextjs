# Blog Posts Management System Setup

This document describes how to set up the blog posts management system for the Hazena Svinov website.

## 🗄️ Database Setup

### 1. Run the SQL Script

Execute the `create_blog_posts_table.sql` script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create_blog_posts_table.sql
-- This will create the blog_posts table with all necessary columns, indexes, and RLS policies
```

### 2. Verify Table Creation

Check that the table was created successfully:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'blog_posts';

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'blog_posts';
```

## 🚀 Features

### Blog Post Management
- **Create**: Add new blog posts with title, content, excerpt, and tags
- **Edit**: Modify existing posts
- **Delete**: Remove posts with confirmation
- **Status Management**: Draft, Published, Archived states
- **Author Assignment**: Link posts to specific users
- **Tag System**: Categorize posts with multiple tags
- **Auto-slug Generation**: Automatic URL-friendly slugs from titles

### User Interface
- **Responsive Design**: Works on desktop and mobile
- **Search & Filter**: Find posts by content or status
- **Table View**: Clean overview of all posts
- **Modal Forms**: Intuitive add/edit interfaces
- **Status Badges**: Visual indicators for post states

### Security
- **Row Level Security (RLS)**: Database-level access control
- **User Permissions**: Authors can only edit their own posts
- **Admin Access**: Full access for admin users
- **Public Reading**: Published posts visible to everyone

## 📱 Usage

### Accessing the Blog Management
1. Navigate to `/admin/posts` in your admin interface
2. The page will appear in the admin sidebar under "Blog"

### Creating a New Post
1. Click "Nový článek" button
2. Fill in the required fields:
   - **Title**: Post title (auto-generates slug)
   - **Content**: Full post content
   - **Excerpt**: Short summary
   - **Author**: Select from available users
   - **Status**: Choose draft/published/archived
   - **Tags**: Comma-separated tags
3. Click "Vytvořit článek"

### Editing a Post
1. Click the edit (pencil) icon on any post row
2. Modify the fields as needed
3. Click "Uložit změny"

### Deleting a Post
1. Click the delete (trash) icon on any post row
2. Confirm deletion in the modal
3. Click "Smazat"

## 🔧 Configuration

### RLS Policies
The system includes several Row Level Security policies:

- **Public Reading**: Published posts visible to everyone
- **Author Access**: Users can view/edit/delete their own posts
- **Admin Access**: Full access for admin users
- **Creation**: Authenticated users can create posts

### Admin Users
To grant admin access, update the email addresses in the RLS policy:

```sql
-- Update the admin emails in the policy
CREATE POLICY "Admin users have full access" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'your-admin-email@domain.com',  -- Replace with actual admin emails
                'another-admin@domain.com'
            )
        )
    );
```

## 📊 Database Schema

### blog_posts Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(255) | Post title |
| `slug` | VARCHAR(255) | URL-friendly identifier |
| `content` | TEXT | Full post content |
| `excerpt` | TEXT | Short summary |
| `author_id` | UUID | Reference to auth.users |
| `status` | VARCHAR(20) | draft/published/archived |
| `published_at` | TIMESTAMP | Publication timestamp |
| `tags` | TEXT[] | Array of tags |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Indexes
- `slug` - For fast URL lookups
- `status` - For filtering by status
- `author_id` - For author-based queries
- `created_at` - For chronological ordering
- `published_at` - For publication date queries
- `tags` - GIN index for tag searches

## 🚨 Troubleshooting

### Common Issues

1. **"Table doesn't exist" error**
   - Ensure the SQL script ran successfully
   - Check if you're in the correct database schema

2. **Permission denied errors**
   - Verify RLS policies are active
   - Check user authentication status
   - Ensure admin emails are correctly configured

3. **Slug conflicts**
   - The system auto-generates unique slugs
   - If conflicts occur, manually edit the slug field

4. **Posts not appearing**
   - Check post status (draft posts are only visible to authors)
   - Verify RLS policies are working correctly

### Debug Queries

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'blog_posts';

-- Test user permissions
SELECT auth.uid(), auth.email();

-- Check existing posts
SELECT * FROM blog_posts LIMIT 5;
```

## 🔮 Future Enhancements

Potential improvements for the blog system:

- **Rich Text Editor**: WYSIWYG content editing
- **Image Uploads**: Support for post images
- **Categories**: Hierarchical post categorization
- **Comments**: User comments on posts
- **SEO Fields**: Meta descriptions, keywords
- **Scheduling**: Future publication dates
- **Analytics**: View counts, engagement metrics
- **API Endpoints**: REST API for external access

## 📞 Support

For issues or questions about the blog posts system:

1. Check the troubleshooting section above
2. Review the database schema and RLS policies
3. Check browser console for JavaScript errors
4. Verify Supabase connection and permissions

---

**Note**: This system integrates with the existing authentication and user management infrastructure. Ensure that users have proper authentication setup before using the blog features.
