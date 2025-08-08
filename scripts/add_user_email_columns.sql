-- Add user_email columns to existing tables
-- Run this in your Supabase SQL Editor

-- Add user_email column to todos table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'user_email'
    ) THEN
        ALTER TABLE todos ADD COLUMN user_email VARCHAR(255) NOT NULL DEFAULT 'admin@hazenasvinov.cz';
    END IF;
END $$;

-- Add user_email column to comments table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'user_email'
    ) THEN
        ALTER TABLE comments ADD COLUMN user_email VARCHAR(255) NOT NULL DEFAULT 'admin@hazenasvinov.cz';
    END IF;
END $$;

-- Update existing todos to have user_email
UPDATE todos SET user_email = 'admin@hazenasvinov.cz' WHERE user_email IS NULL OR user_email = '';

-- Update existing comments to have user_email
UPDATE comments SET user_email = 'admin@hazenasvinov.cz' WHERE user_email IS NULL OR user_email = '';

-- Add comments to document the columns
COMMENT ON COLUMN todos.user_email IS 'Email of the user who created the todo item';
COMMENT ON COLUMN comments.user_email IS 'Email of the user who created the comment';
