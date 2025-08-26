-- Fix script to add missing max_teams column to club_categories table
-- Run this if the main migration script failed or was incomplete

-- Check if max_teams column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'club_categories' AND column_name = 'max_teams') THEN
        ALTER TABLE club_categories ADD COLUMN max_teams INTEGER DEFAULT 1;
        RAISE NOTICE 'Added max_teams column to club_categories table';
    ELSE
        RAISE NOTICE 'max_teams column already exists in club_categories table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'club_categories' 
ORDER BY ordinal_position;

-- Update existing records to have max_teams = 1 if they don't have it
UPDATE club_categories SET max_teams = 1 WHERE max_teams IS NULL;

-- Recreate the view that was failing
DROP VIEW IF EXISTS club_category_details;
CREATE OR REPLACE VIEW club_category_details AS
SELECT 
    cc.id,
    c.name as club_name,
    c.short_name as club_short_name,
    cat.name as category_name,
    s.name as season_name,
    cc.max_teams,
    cc.is_active,
    COUNT(ct.team_id) as current_teams
FROM club_categories cc
JOIN clubs c ON cc.club_id = c.id
JOIN categories cat ON cc.category_id = cat.id
JOIN seasons s ON cc.season_id = cc.season_id
LEFT JOIN club_teams ct ON c.id = ct.club_id
GROUP BY cc.id, c.name, c.short_name, cat.name, s.name, cc.max_teams, cc.is_active;

-- Test the view
SELECT * FROM club_category_details LIMIT 5;
