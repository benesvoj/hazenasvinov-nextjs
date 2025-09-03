-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to columns
COMMENT ON COLUMN blog_posts.id IS 'Unique identifier for the blog post';
COMMENT ON COLUMN blog_posts.title IS 'Title of the blog post';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly slug for the blog post';
COMMENT ON COLUMN blog_posts.content IS 'Full content of the blog post';
COMMENT ON COLUMN blog_posts.excerpt IS 'Short excerpt/summary of the blog post';
COMMENT ON COLUMN blog_posts.author_id IS 'ID of the user who created the post';
COMMENT ON COLUMN blog_posts.status IS 'Current status: draft, published, or archived';
COMMENT ON COLUMN blog_posts.published_at IS 'Timestamp when the post was published';
COMMENT ON COLUMN blog_posts.tags IS 'Array of tags for categorizing the post';
COMMENT ON COLUMN blog_posts.created_at IS 'Timestamp when the post was created';
COMMENT ON COLUMN blog_posts.updated_at IS 'Timestamp when the post was last updated';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for reading published posts (public)
CREATE POLICY "Published posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Policy for reading own posts (authors can see their own posts regardless of status)
CREATE POLICY "Users can view their own posts" ON blog_posts
    FOR SELECT USING (auth.uid() = author_id);

-- Policy for inserting posts (authenticated users can create posts)
CREATE POLICY "Authenticated users can create posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating posts (authors can update their own posts)
CREATE POLICY "Users can update their own posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Policy for deleting posts (authors can delete their own posts)
CREATE POLICY "Users can delete their own posts" ON blog_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Policy for admin users (can do everything)
CREATE POLICY "Admin users have full access" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@hazenasvinov.cz',
                'vojtech.benes@hazenasvinov.cz'
            )
        )
    );

-- Insert sample data (optional)
INSERT INTO blog_posts (title, slug, content, excerpt, author_id, status, tags) VALUES
(
    'Vítejte na našich nových webových stránkách',
    'vitejte-na-nasich-novych-webovych-strankach',
    'Vážení příznivci házené, máme radost, že vám můžeme představit naše nové webové stránky. Tyto stránky budou sloužit jako centrální místo pro všechny informace o našem klubu, zápasech, výsledcích a novinkách.',
    'Představujeme vám naše nové webové stránky, které budou sloužit jako centrální místo pro všechny informace o klubu.',
    (SELECT id FROM auth.users LIMIT 1),
    'published',
    ARRAY['web', 'novinky', 'klub']
),
(
    'Začátek nové sezóny 2024/2025',
    'zacatek-nove-sezony-2024-2025',
    'Nová sezóna je tu a s ní přichází nové výzvy a cíle. Naše týmy se připravují na soutěže a doufáme v úspěšné výsledky.',
    'Nová sezóna je tu a s ní přichází nové výzvy a cíle pro všechny naše týmy.',
    (SELECT id FROM auth.users LIMIT 1),
    'published',
    ARRAY['sezóna', 'soutěže', 'týmy']
) ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT SELECT ON blog_posts TO anon;
