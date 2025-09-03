# Video Import Instructions

This document explains how to import video data from the HTML file into the database.

## Overview

The video import script parses the `docs/video-mens-html.md` file and imports all the YouTube videos into the database. It extracts match information, YouTube URLs, and organizes them by seasons and categories.

## Prerequisites

1. **Database Setup**: Make sure the following tables exist:
   - `videos` table
   - `categories` table (with at least a "Muži" category)
   - `seasons` table
   - `clubs` table (with Svinov club)

2. **Environment Variables**: Ensure `.env.local` contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Running the Import

### Option 1: Using npm script (Recommended)
```bash
npm run import:videos
```

### Option 2: Direct execution
```bash
node scripts/import-videos-simple.js
```

## What the Script Does

1. **Parses HTML File**: Reads `docs/video-mens-html.md` and extracts:
   - Match information (teams, date, result)
   - YouTube URLs
   - Season information
   - Category information

2. **Creates Video Records**: For each YouTube URL found:
   - Extracts YouTube ID
   - Generates thumbnail URL
   - Creates appropriate title (I. poločas, II. poločas, etc.)
   - Maps to correct category and season

3. **Database Import**: Inserts videos into the database with:
   - Title and description
   - YouTube URL and ID
   - Category ID (defaults to "Muži" category)
   - Club ID (Svinov club)
   - Recording date
   - Season ID (if season exists)
   - Thumbnail URL
   - Active status

## Sample Output

```
🚀 Starting video import...
📄 Parsed 45 videos from HTML

📋 Sample videos:
  1. TJ Sokol Svinov X Podlázky 18.5.2025 - I. poločas
  2. TJ Sokol Svinov X Podlázky 18.5.2025 - II. poločas
  3. Přeštice X Svinov 4.5.2025 - I. poločas

🏟️ Using club: TJ Sokol Svinov
🏆 Using category: Muži

✅ Imported: TJ Sokol Svinov X Podlázky 18.5.2025 - I. poločas
✅ Imported: TJ Sokol Svinov X Podlázky 18.5.2025 - II. poločas
⏭️ Skipped (exists): Přeštice X Svinov 4.5.2025 - I. poločas

📊 Import Summary:
✅ Success: 42
⏭️ Skipped: 3
❌ Errors: 0

🎉 Import completed!
```

## Features

- **Duplicate Prevention**: Skips videos that already exist (based on YouTube ID)
- **Error Handling**: Continues processing even if individual videos fail
- **Batch Processing**: Processes videos efficiently
- **Detailed Logging**: Shows progress and results for each video

## Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Check that `.env.local` exists and contains the required variables
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not the anon key

2. **"Svinov club not found"**
   - Make sure the clubs table has a club with "Svinov" in the name
   - Check that the club is marked as active (`is_active = true`)

3. **"Men's category not found"**
   - Make sure the categories table has a category with "Muži" or "Men" in the name
   - Check that the category is marked as active (`is_active = true`)

4. **"No videos found"**
   - Check that `docs/video-mens-html.md` exists and contains YouTube URLs
   - Verify the HTML format matches the expected pattern

### Manual Database Check

You can verify the import by checking the videos table:

```sql
SELECT 
  title,
  youtube_url,
  recording_date,
  created_at
FROM videos 
ORDER BY created_at DESC 
LIMIT 10;
```

## Advanced Usage

### Custom Configuration

You can modify the script to:
- Change the default category
- Use a different club
- Adjust the title format
- Add additional metadata

### Batch Import

For large datasets, the script processes videos in batches to avoid overwhelming the database.

## File Structure

```
scripts/
├── import-videos-simple.js     # Main import script
├── import-videos-from-html.js  # Advanced version with more features
docs/
├── video-mens-html.md          # Source HTML file
└── VIDEO_IMPORT_INSTRUCTIONS.md # This file
```

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your database setup and environment variables
3. Ensure the HTML file format is correct
4. Check that all required tables and data exist in the database
