-- Check and fix database schema issues
-- Run this in your Supabase SQL Editor

-- Check if is_own_club column exists in teams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'is_own_club'
    ) THEN
        ALTER TABLE teams ADD COLUMN is_own_club BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_own_club column to teams table';
    ELSE
        RAISE NOTICE 'is_own_club column already exists in teams table';
    END IF;
END $$;

-- Check if logo_url column exists in teams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE teams ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column to teams table';
    ELSE
        RAISE NOTICE 'logo_url column already exists in teams table';
    END IF;
END $$;

-- Check if committee_id column exists in teams table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'committee_id'
    ) THEN
        ALTER TABLE teams ADD COLUMN committee_id UUID REFERENCES committees(id);
        RAISE NOTICE 'Added committee_id column to teams table';
    ELSE
        RAISE NOTICE 'committee_id column already exists in teams table';
    END IF;
END $$;

-- Check if committees table exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'committees'
    ) THEN
        CREATE TABLE committees (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            code VARCHAR(20) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created committees table';
    ELSE
        RAISE NOTICE 'committees table already exists';
    END IF;
END $$;

-- Check if there are any teams with is_own_club = true
SELECT COUNT(*) as own_club_count FROM teams WHERE is_own_club = true;

-- Check if there are any matches
SELECT COUNT(*) as matches_count FROM matches;

-- Check if there are any standings
SELECT COUNT(*) as standings_count FROM standings;

-- Check if there are any categories
SELECT COUNT(*) as categories_count FROM categories;

-- Check if there are any seasons
SELECT COUNT(*) as seasons_count FROM seasons;
