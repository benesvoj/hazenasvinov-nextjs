-- Add Many-to-Many Relationship between Matches and Videos
-- This allows multiple videos to be linked to a single match and vice versa

-- Remove the single video_id column from matches table
ALTER TABLE matches DROP COLUMN IF EXISTS video_id;

-- Remove the single match_id column from videos table  
ALTER TABLE videos DROP COLUMN IF EXISTS match_id;

-- Create junction table for match-video relationships
CREATE TABLE IF NOT EXISTS match_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, video_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_match_videos_match_id ON match_videos(match_id);
CREATE INDEX IF NOT EXISTS idx_match_videos_video_id ON match_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_match_videos_created_at ON match_videos(created_at);

-- Add comments for documentation
COMMENT ON TABLE match_videos IS 'Junction table for many-to-many relationship between matches and videos';
COMMENT ON COLUMN match_videos.match_id IS 'Reference to the match';
COMMENT ON COLUMN match_videos.video_id IS 'Reference to the video';
COMMENT ON COLUMN match_videos.created_at IS 'When the relationship was created';

-- Verify the changes
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'match_videos'
ORDER BY column_name;
