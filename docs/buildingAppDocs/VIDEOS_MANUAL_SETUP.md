# Manual Videos Table Setup

## Quick Setup Instructions

If you're getting an error "Tabulka videí neexistuje" (Videos table does not exist), you need to create the videos table in your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to the SQL Editor

2. **Run the SQL Script**
   - Copy the contents of `scripts/create_videos_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Table**
   - Go to Table Editor
   - You should see the `videos` table listed

### Option 2: Using Environment Variables

If you have your environment variables set up:

```bash
npm run setup:video-table
```

### Option 3: Manual SQL Execution

**Option A: Full Setup (if all tables exist)**
Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Create video table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  recording_date DATE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_club_id ON videos(club_id);
CREATE INDEX IF NOT EXISTS idx_videos_season_id ON videos(season_id);
CREATE INDEX IF NOT EXISTS idx_videos_recording_date ON videos(recording_date);
CREATE INDEX IF NOT EXISTS idx_videos_is_active ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view videos" ON videos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert videos" ON videos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update videos" ON videos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete videos" ON videos
  FOR DELETE USING (auth.role() = 'authenticated');
```

**Option B: Minimal Setup (if clubs/seasons tables don't exist)**
If you get errors about missing clubs or seasons tables, use this minimal version:

```sql
-- Copy contents from scripts/create_videos_table_minimal.sql
-- This version doesn't require clubs or seasons tables to exist
```

## Troubleshooting

### Error: "relation 'videos' does not exist"
- **Solution**: Run the SQL script above in your Supabase SQL Editor

### Error: "relation 'categories' does not exist"
- **Solution**: Make sure the categories table exists first
- Check if you have the basic tables set up

### Error: "relation 'clubs' does not exist"
- **Solution**: Make sure the clubs table exists first
- The club_id field is optional, so you can comment it out if needed

### Error: "relation 'seasons' does not exist"
- **Solution**: Make sure the seasons table exists first
- The season_id field is optional, so you can comment it out if needed

### Error: "column seasons_1.year does not exist"
- **Solution**: The seasons table uses `name`, `start_date`, and `end_date` columns, not `year`
- This error has been fixed in the latest code

### Permission Errors
- **Solution**: Make sure you're running the SQL as a user with appropriate permissions
- Check your Supabase project settings

## Verification

After running the setup:

1. **Check the Table**
   - Go to Table Editor in Supabase
   - Verify the `videos` table exists
   - Check that all columns are present

2. **Test the Application**
   - Go to `/admin/videos` in your application
   - You should see the videos page without errors
   - Try adding a test video

3. **Check Console**
   - Open browser developer tools
   - Look for any remaining errors
   - The error message should be gone

## Next Steps

Once the table is created:

1. **Add Test Data** (Optional)
   - Use the "Přidat video" button to add a test video
   - Verify all fields work correctly

2. **Configure Permissions**
   - Check that your user has access to the videos table
   - Verify RLS policies are working

3. **Test Filtering**
   - Try the different filter options
   - Verify search functionality works

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection is working
3. Check that all required tables (categories, clubs, seasons) exist
4. Ensure your user has the correct permissions
