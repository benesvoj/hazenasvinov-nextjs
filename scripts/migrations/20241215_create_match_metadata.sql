-- Migration: Create match_metadata table for flexible match metadata storage
-- Date: 2024-12-15
-- Description: Replaces single match_photo_url and coach_note fields with flexible metadata system

-- Create match_metadata table
CREATE TABLE IF NOT EXISTS match_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  metadata_type VARCHAR(50) NOT NULL CHECK (metadata_type IN ('photo', 'note', 'video', 'document', 'lineup')),
  content TEXT, -- For notes, descriptions
  file_url TEXT, -- For photos, videos, documents
  file_name TEXT, -- Original filename
  file_size INTEGER, -- File size in bytes
  mime_type VARCHAR(100), -- MIME type for files
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- For additional structured data
  is_primary BOOLEAN DEFAULT FALSE -- For marking primary photo/note
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_metadata_match_id ON match_metadata(match_id);
CREATE INDEX IF NOT EXISTS idx_match_metadata_type ON match_metadata(metadata_type);
CREATE INDEX IF NOT EXISTS idx_match_metadata_created_at ON match_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_match_metadata_is_primary ON match_metadata(is_primary);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_match_metadata_match_type ON match_metadata(match_id, metadata_type);

-- Add RLS policies
ALTER TABLE match_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view metadata for matches they have access to
CREATE POLICY "Users can view match metadata for accessible matches" ON match_metadata
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- Policy: Users can insert metadata for matches they have access to
CREATE POLICY "Users can insert match metadata for accessible matches" ON match_metadata
  FOR INSERT WITH CHECK (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    ) AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Policy: Users can update metadata they created
CREATE POLICY "Users can update their own match metadata" ON match_metadata
  FOR UPDATE USING (
    created_by = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- Policy: Users can delete metadata they created
CREATE POLICY "Users can delete their own match metadata" ON match_metadata
  FOR DELETE USING (
    created_by = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN club_categories cc ON m.category_id = cc.category_id
      WHERE cc.club_id IN (
        SELECT club_id FROM user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
      )
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_match_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_metadata_updated_at
  BEFORE UPDATE ON match_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_match_metadata_updated_at();

-- Add comment
COMMENT ON TABLE match_metadata IS 'Flexible metadata storage for matches including photos, notes, videos, documents, and lineups';
COMMENT ON COLUMN match_metadata.metadata_type IS 'Type of metadata: photo, note, video, document, lineup';
COMMENT ON COLUMN match_metadata.content IS 'Text content for notes and descriptions';
COMMENT ON COLUMN match_metadata.file_url IS 'URL to file in storage for photos, videos, documents';
COMMENT ON COLUMN match_metadata.metadata IS 'Additional structured data as JSON';
COMMENT ON COLUMN match_metadata.is_primary IS 'Whether this is the primary item of this type for the match';
