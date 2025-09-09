-- Add optional relationship between blog_posts and matches
-- This allows posts to be linked to specific matches and vice versa

-- Add match_id column to blog_posts table (optional foreign key)
ALTER TABLE blog_posts 
ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Add post_id column to matches table (optional foreign key) 
ALTER TABLE matches
ADD COLUMN post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_blog_posts_match_id ON blog_posts(match_id);
CREATE INDEX idx_matches_post_id ON matches(post_id);

-- Add comments for documentation
COMMENT ON COLUMN blog_posts.match_id IS 'Optional reference to related match';
COMMENT ON COLUMN matches.post_id IS 'Optional reference to related blog post';

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('blog_posts', 'matches') 
  AND column_name IN ('match_id', 'post_id')
ORDER BY table_name, column_name;
