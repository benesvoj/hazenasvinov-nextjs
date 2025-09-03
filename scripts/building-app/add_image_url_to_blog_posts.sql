-- Add image_url column to blog_posts table
-- This script adds support for blog post images

-- Check if column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'image_url'
    ) THEN
        -- Add the image_url column
        ALTER TABLE blog_posts 
        ADD COLUMN image_url TEXT;
        
        -- Add comment to document the column
        COMMENT ON COLUMN blog_posts.image_url IS 'URL of the blog post featured image';
        
        RAISE NOTICE 'Added image_url column to blog_posts table';
    ELSE
        RAISE NOTICE 'image_url column already exists in blog_posts table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name = 'image_url';

-- Show current table structure
\d blog_posts;
