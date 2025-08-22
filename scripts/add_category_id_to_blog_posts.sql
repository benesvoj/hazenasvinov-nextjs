-- Add category_id column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);

-- Update existing posts based on their tags
-- This will map posts to categories based on tag matching

-- Example migration for common categories:
-- Update posts with "mladší žáci" tag to point to the "mladší žáci" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'youngerBoys' LIMIT 1)
WHERE tags && ARRAY['mladší žáci'] AND category_id IS NULL;

-- Update posts with "mladší žačky" tag to point to the "mladší žačky" category  
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'youngerGirls' LIMIT 1)
WHERE tags && ARRAY['mladší žačky'] AND category_id IS NULL;

-- Update posts with "starší žáci" tag to point to the "starší žáci" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'olderBoys' LIMIT 1)
WHERE tags && ARRAY['starší žáci'] AND category_id IS NULL;

-- Update posts with "starší žačky" tag to point to the "starší žačky" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'olderGirls' LIMIT 1)
WHERE tags && ARRAY['starší žačky'] AND category_id IS NULL;

-- Update posts with "muži" tag to point to the "muži" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'men' LIMIT 1)
WHERE tags && ARRAY['muži'] AND category_id IS NULL;

-- Update posts with "ženy" tag to point to the "ženy" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'women' LIMIT 1)
WHERE tags && ARRAY['ženy'] AND category_id IS NULL;

-- Update posts with "přípravka" tag to point to the "přípravka" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'prepKids' LIMIT 1)
WHERE tags && ARRAY['přípravka'] AND category_id IS NULL;

-- Update posts with "nejmladší" tag to point to the "nejmladší" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'youngestKids' LIMIT 1)
WHERE tags && ARRAY['nejmladší'] AND category_id IS NULL;

-- Update posts with "junior" tag to point to the "junior" category
UPDATE blog_posts 
SET category_id = (SELECT id FROM categories WHERE code = 'junior' LIMIT 1)
WHERE tags && ARRAY['junior'] AND category_id IS NULL;

-- Show migration results
SELECT 
  'Posts with category_id set' as status,
  COUNT(*) as count
FROM blog_posts 
WHERE category_id IS NOT NULL

UNION ALL

SELECT 
  'Posts without category_id' as status,
  COUNT(*) as count
FROM blog_posts 
WHERE category_id IS NULL;
