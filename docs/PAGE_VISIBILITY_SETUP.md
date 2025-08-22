# Page Visibility System Setup

This document describes how to set up and use the new page visibility system in the club admin portal.

## Overview

The page visibility system allows administrators to control which pages are visible to visitors on the public website. This includes:
- Hiding/showing specific pages
- Reordering pages in navigation
- Grouping pages by categories
- Managing page descriptions

## Database Setup

### 1. Create the page_visibility table

Run the SQL script to create the necessary database table:

```bash
# Connect to your Supabase database and run:
\i scripts/create_page_visibility_table.sql
```

This will create:
- `page_visibility` table with all necessary columns
- Default page configurations for all existing routes
- Proper indexes and security policies

### 2. Table Structure

The `page_visibility` table contains:
- `id`: Unique identifier
- `page_key`: Internal key (e.g., 'home', 'blog')
- `page_title`: Display title (e.g., 'Úvod', 'Novinky')
- `page_route`: URL path (e.g., '/', '/blog')
- `page_description`: Description of the page content
- `is_visible`: Whether the page is visible to visitors
- `sort_order`: Order in navigation (lower numbers appear first)
- `category`: Page grouping ('main', 'categories', 'info', 'admin')
- `is_active`: Whether the page configuration is active

## Features

### Admin Portal

The page visibility management is available in the Club Config section under the "Stránky klubu" tab. Here you can:

1. **Toggle Visibility**: Use switches to show/hide pages
2. **Reorder Pages**: Change the sort order using number inputs
3. **View Categories**: Pages are grouped by category for better organization
4. **Real-time Updates**: Changes are saved immediately to the database

### Page Categories

Pages are automatically grouped into categories:

- **Hlavní stránky** (Main pages): Home, Categories, Blog, Matches, Photo Gallery
- **Kategorie týmů** (Team categories): All age group pages
- **Informační stránky** (Info pages): Chronicle, Downloads, Contact, About, Celebration
- **Administrace** (Admin): Login page

### Dynamic Navigation

The website navigation now automatically:
- Shows only visible pages
- Respects the configured sort order
- Groups category pages under a "Kategorie" dropdown
- Falls back to static routes if the database is unavailable

## API Endpoints

### GET /api/page-visibility
Returns all page visibility settings (admin use)

### PUT /api/page-visibility
Updates page visibility and sort order (admin use)

## Usage Examples

### Hiding a Page
1. Go to Admin → Club Config → Stránky klubu
2. Find the page you want to hide
3. Toggle the visibility switch to "Skryté"
4. The page will immediately disappear from public navigation

### Reordering Pages
1. In the same interface, locate the page
2. Change the number in the sort order input
3. The page will move to the new position in navigation

### Adding New Pages
To add new pages to the system:
1. Insert a new record into the `page_visibility` table
2. Set appropriate category and sort order
3. The page will automatically appear in the admin interface

## Migration from Static Routes

The system maintains backward compatibility:
- If the database is unavailable, it falls back to static routes
- All existing routes are preserved
- No changes needed to existing page components

## Security

- Page visibility data is publicly readable (needed for navigation)
- Only authenticated users can modify visibility settings
- Row-level security is enabled on the table

## Troubleshooting

### Pages Not Showing
- Check if `is_visible` is true in the database
- Verify `is_active` is true
- Ensure the page route exists in your Next.js app

### Navigation Order Issues
- Check `sort_order` values in the database
- Lower numbers appear first
- Refresh the page after making changes

### Database Connection Issues
- The system will fall back to static routes
- Check Supabase connection settings
- Verify RLS policies are correct

## Future Enhancements

Potential improvements for the system:
- Bulk visibility operations
- Page templates and presets
- A/B testing for page visibility
- Analytics integration for hidden pages
- Scheduled visibility changes
