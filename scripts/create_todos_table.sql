-- Create todos table
-- Run this in your Supabase SQL Editor

CREATE TABLE todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    category VARCHAR(20) DEFAULT 'improvement' CHECK (category IN ('feature', 'bug', 'improvement', 'technical')),
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    user_email VARCHAR(255) NOT NULL
);

-- Add comments to document the table
COMMENT ON TABLE todos IS 'Todo items for project management';
COMMENT ON COLUMN todos.title IS 'Title of the todo item';
COMMENT ON COLUMN todos.description IS 'Detailed description of the todo item';
COMMENT ON COLUMN todos.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN todos.status IS 'Current status: todo, in-progress, done';
COMMENT ON COLUMN todos.category IS 'Category: feature, bug, improvement, technical';
COMMENT ON COLUMN todos.assigned_to IS 'Person assigned to this todo';
COMMENT ON COLUMN todos.due_date IS 'Due date for the todo item';
COMMENT ON COLUMN todos.created_by IS 'User who created the todo item';
COMMENT ON COLUMN todos.user_email IS 'Email of the user who created the todo item';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

-- Add trigger for updated_at
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO todos (title, description, priority, status, category, assigned_to, due_date, user_email) VALUES
('Implement Advanced Statistics Dashboard', 'Create detailed analytics for player and team performance', 'high', 'todo', 'feature', 'Development Team', '2024-01-15', 'admin@hazenasvinov.cz'),
('Fix Mobile Responsiveness Issues', 'Address layout problems on smaller screens', 'medium', 'in-progress', 'bug', 'Frontend Team', '2024-01-10', 'admin@hazenasvinov.cz'),
('Add Email Notification System', 'Implement automated match reminders and result notifications', 'high', 'todo', 'feature', 'Backend Team', '2024-01-20', 'admin@hazenasvinov.cz'),
('Optimize Database Queries', 'Improve performance of standings calculations', 'medium', 'done', 'improvement', 'Database Team', '2024-12-15', 'admin@hazenasvinov.cz'),
('Add Multi-language Support', 'Implement internationalization for multiple languages', 'low', 'todo', 'feature', 'Frontend Team', '2024-02-01', 'admin@hazenasvinov.cz'),
('Security Audit', 'Conduct comprehensive security review of the application', 'urgent', 'todo', 'technical', 'Security Team', '2024-01-05', 'admin@hazenasvinov.cz'),
('Performance Optimization', 'Optimize application loading times and responsiveness', 'high', 'in-progress', 'improvement', 'Backend Team', '2024-01-25', 'admin@hazenasvinov.cz'),
('User Documentation', 'Create comprehensive user guides and documentation', 'medium', 'todo', 'improvement', 'Documentation Team', '2024-01-30', 'admin@hazenasvinov.cz');
