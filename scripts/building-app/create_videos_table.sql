-- Create videos table
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

-- Add comments
COMMENT ON TABLE videos IS 'Videos uploaded to YouTube for different categories';
COMMENT ON COLUMN videos.title IS 'Title of the video';
COMMENT ON COLUMN videos.description IS 'Optional description of the video';
COMMENT ON COLUMN videos.youtube_url IS 'Full YouTube URL of the video';
COMMENT ON COLUMN videos.youtube_id IS 'YouTube video ID extracted from URL';
COMMENT ON COLUMN videos.category_id IS 'Category this video belongs to';
COMMENT ON COLUMN videos.club_id IS 'Club this video is related to (optional)';
COMMENT ON COLUMN videos.recording_date IS 'Date when the video was recorded (optional)';
COMMENT ON COLUMN videos.season_id IS 'Season this video belongs to (optional)';
COMMENT ON COLUMN videos.thumbnail_url IS 'YouTube thumbnail URL';
COMMENT ON COLUMN videos.duration IS 'Video duration (if available)';
COMMENT ON COLUMN videos.is_active IS 'Whether the video is active and visible';
COMMENT ON COLUMN videos.created_by IS 'User who created the video';
COMMENT ON COLUMN videos.updated_by IS 'User who last updated the video';
