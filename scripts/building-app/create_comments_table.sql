-- Create comments table
-- Run this in your Supabase SQL Editor

CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'bug', 'feature', 'improvement')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to document the table
COMMENT ON TABLE comments IS 'Comments for project management and feedback';
COMMENT ON COLUMN comments.content IS 'The comment text content';
COMMENT ON COLUMN comments.author IS 'Author of the comment';
COMMENT ON COLUMN comments.user_email IS 'Email of the user who created the comment';
COMMENT ON COLUMN comments.type IS 'Type of comment: general, bug, feature, improvement';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_type ON comments(type);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);

-- Add trigger for updated_at
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO comments (content, author, type, user_email) VALUES
('Great work on the new dashboard layout! The zones are much more intuitive than tabs.', 'Development Team', 'improvement', 'admin@hazenasvinov.cz'),
('Found a bug in the mobile view - the todo cards are overlapping on small screens.', 'QA Team', 'bug', 'admin@hazenasvinov.cz'),
('Would be great to have a dark mode toggle for the admin interface.', 'Design Team', 'feature', 'admin@hazenasvinov.cz'),
('The database performance has improved significantly with the new indexes.', 'Backend Team', 'improvement', 'admin@hazenasvinov.cz'),
('Consider adding bulk operations for todos (select multiple and mark as done).', 'Product Manager', 'feature', 'admin@hazenasvinov.cz'),
('The release notes integration is working perfectly!', 'Frontend Team', 'general', 'admin@hazenasvinov.cz'),
('Need to implement user roles and permissions for theadmin panel.', 'Security Team', 'feature', 'admin@hazenasvinov.cz'),
('The comments system is a great addition for team collaboration.', 'Project Manager', 'improvement', 'admin@hazenasvinov.cz');
