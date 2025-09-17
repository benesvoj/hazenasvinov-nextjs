-- Add optional relationship between videos and matches
-- This allows videos to be linked to specific matches and vice versa

-- Add match_id column to videos table (optional foreign key)
ALTER TABLE videos 
ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Add video_id column to matches table (optional foreign key) 
ALTER TABLE matches
ADD COLUMN video_id UUID REFERENCES videos(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_videos_match_id ON videos(match_id);
CREATE INDEX idx_matches_video_id ON matches(video_id);

-- Add comments for documentation
COMMENT ON COLUMN videos.match_id IS 'Optional reference to related match';
COMMENT ON COLUMN matches.video_id IS 'Optional reference to related video';

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('videos', 'matches') 
  AND column_name IN ('match_id', 'video_id')
ORDER BY table_name, column_name;
