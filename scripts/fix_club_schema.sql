-- Fix Club Schema and Migrate Data from Teams
-- This script adds missing fields to clubs table and migrates data from teams
--
-- Column mapping from teams table to clubs table:
-- teams.logo_url -> clubs.logo_url
-- teams.home_venue -> clubs.venue  
-- teams.website -> clubs.web
-- teams.email -> clubs.email
-- teams.phone -> clubs.phone
-- teams.contact_person -> clubs.contact_person
-- teams.short_name -> clubs.short_name (use existing short_name from teams)
-- teams.city -> clubs.city (use existing city from teams)
-- Note: teams table doesn't have address or description columns
--
-- Short name extraction logic:
-- 1. PRIORITY: Use existing short_name from teams table if available
-- 2. FALLBACK: Intelligent extraction from club name:
--    - Single word names: use as-is
--    - Club prefixes (FC, SK, TJ, FK, AC, SC, AS, US, SS, KS, MS, ZS, VS, PS, TS, JS, HS, LS, NS, RS, WS, YS, ZS): extract prefix
--    - Multi-word names: create acronym from first letters
--    - Other cases: use first word

-- 1. Add missing fields to clubs table
DO $$ 
BEGIN
    -- Add venue field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'venue') THEN
        ALTER TABLE clubs ADD COLUMN venue TEXT;
        RAISE NOTICE 'Added venue column to clubs table';
    END IF;
    
    -- Add web field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'web') THEN
        ALTER TABLE clubs ADD COLUMN web TEXT;
        RAISE NOTICE 'Added web column to clubs table';
    END IF;
    
    -- Add email field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'email') THEN
        ALTER TABLE clubs ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to clubs table';
    END IF;
    
    -- Add phone field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'phone') THEN
        ALTER TABLE clubs ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to clubs table';
    END IF;
    
    -- Add address field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'address') THEN
        ALTER TABLE clubs ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to clubs table';
    END IF;
    
    -- Add description field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'description') THEN
        ALTER TABLE clubs ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to clubs table';
    END IF;
    
    -- Add contact_person field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'contact_person') THEN
        ALTER TABLE clubs ADD COLUMN contact_person TEXT;
        RAISE NOTICE 'Added contact_person column to clubs table';
    END IF;
END $$;

-- 2. Check what fields currently exist in teams table that should be in clubs
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('logo_url', 'home_venue', 'website', 'email', 'phone', 'contact_person', 'short_name', 'city')
ORDER BY column_name;

-- 3. Create a mapping table for team to club migration
CREATE TABLE IF NOT EXISTS team_club_mapping AS
SELECT DISTINCT 
    t.id as team_id,
    t.name as team_name,
    t.logo_url,
    t.home_venue as venue,
    t.website as web,
    t.email,
    t.phone,
    -- Note: address and description columns don't exist in teams table
    NULL as address,
    NULL as description,
    t.contact_person,
    t.short_name,
    t.city,
    -- Extract club name from team name (assuming format like "Club Name A", "Club Name B")
    CASE 
        WHEN t.name ~ ' [A-Z]$' THEN 
            SUBSTRING(t.name FROM 1 FOR POSITION(' ' IN REVERSE(t.name)) - 1)
        ELSE t.name
    END as extracted_club_name
FROM teams t
WHERE t.is_active = true
AND (t.logo_url IS NOT NULL OR t.home_venue IS NOT NULL OR t.website IS NOT NULL 
     OR t.email IS NOT NULL OR t.phone IS NOT NULL OR t.contact_person IS NOT NULL 
     OR t.short_name IS NOT NULL OR t.city IS NOT NULL);

-- 4. Show what we found
SELECT * FROM team_club_mapping;

-- 4.5. Clear existing clubs data to avoid conflicts
-- Note: We need to clear tables in the correct order due to foreign key constraints:
-- 1. club_teams (no constraints to clubs)
-- 2. standings (has club_id foreign key to clubs)
-- 3. teams (has club_id foreign key to clubs)
-- 4. clubs (can now be safely deleted)
DO $$ 
BEGIN
    -- First, clear existing club_teams relationships if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'club_teams') THEN
        DELETE FROM club_teams;
        RAISE NOTICE 'Cleared existing club_teams data';
    END IF;
    
    -- Clear standings table if it exists (has foreign key to clubs)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'standings') THEN
        DELETE FROM standings;
        RAISE NOTICE 'Cleared existing standings data';
    END IF;
    
    -- Reset club_id in teams table if column exists (must be done BEFORE deleting clubs)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'club_id') THEN
        UPDATE teams SET club_id = NULL;
        RAISE NOTICE 'Reset club_id in teams table';
    ELSE
        RAISE NOTICE 'club_id column does not exist in teams table yet';
    END IF;
    
    -- Now it's safe to clear existing clubs data
    DELETE FROM clubs;
    RAISE NOTICE 'Cleared existing clubs data';
END $$;

-- 5. Create clubs from unique club names found in teams
-- First, ensure the clubs table exists and has the right structure
DO $$ 
BEGIN
    -- Create clubs table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clubs') THEN
        CREATE TABLE clubs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT,
            logo_url TEXT,
            city TEXT,
            founded_year INTEGER,
            venue TEXT,
            web TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            description TEXT,
            contact_person TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created clubs table';
    END IF;
    
    -- Add unique constraint on clubs.name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clubs_name_unique' 
        AND conrelid = 'clubs'::regclass
    ) THEN
        ALTER TABLE clubs ADD CONSTRAINT clubs_name_unique UNIQUE (name);
        RAISE NOTICE 'Added unique constraint on clubs.name';
    END IF;
END $$;

-- Now insert clubs, handling duplicates manually
INSERT INTO clubs (name, short_name, logo_url, venue, web, email, phone, address, description, contact_person, city, is_active)
SELECT DISTINCT
    extracted_club_name as name,
    -- Use existing short_name from teams, fallback to intelligent extraction if not available
    COALESCE(
        (SELECT short_name FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.short_name IS NOT NULL LIMIT 1),
        CASE 
            -- If it's a single word, use it as is
            WHEN extracted_club_name !~ ' ' THEN extracted_club_name
            -- If it starts with "FC", "SK", "TJ", etc., extract the first part
            WHEN extracted_club_name ~ '^(FC|SK|TJ|FK|AC|SC|AS|US|SS|KS|MS|ZS|VS|PS|TS|JS|HS|KS|LS|NS|RS|WS|YS|ZS) ' THEN
                SUBSTRING(extracted_club_name FROM 1 FOR POSITION(' ' IN extracted_club_name) - 1)
            -- If it's a multi-word name, try to create an acronym
            WHEN extracted_club_name ~ '^[A-Z][a-z]+ [A-Z][a-z]+' THEN
                UPPER(SUBSTRING(extracted_club_name FROM 1 FOR 1) || 
                       SUBSTRING(extracted_club_name FROM POSITION(' ' IN extracted_club_name) + 1 FOR 1))
            -- If it starts with a word, use the first word
            WHEN extracted_club_name ~ '^[A-Za-z]+' THEN 
                SUBSTRING(extracted_club_name FROM 1 FOR POSITION(' ' IN extracted_club_name) - 1)
            -- Fallback to the original name
            ELSE extracted_club_name
        END
    ) as short_name,
    -- Use the first occurrence of each field for the club
    (SELECT logo_url FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.logo_url IS NOT NULL LIMIT 1) as logo_url,
    (SELECT venue FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.venue IS NOT NULL LIMIT 1) as venue,
    (SELECT web FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.web IS NOT NULL LIMIT 1) as web,
    (SELECT email FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.email IS NOT NULL LIMIT 1) as email,
    (SELECT phone FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.phone IS NOT NULL LIMIT 1) as phone,
    -- address and description are NULL since they don't exist in teams table
    NULL as address,
    NULL as description,
    (SELECT contact_person FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.contact_person IS NOT NULL LIMIT 1) as contact_person,
    -- Use existing city from teams, fallback to default if not available
    COALESCE(
        (SELECT city FROM team_club_mapping tcm2 WHERE tcm2.extracted_club_name = tcm.extracted_club_name AND tcm2.city IS NOT NULL LIMIT 1),
        'Unknown'
    ) as city,
    true as is_active
FROM team_club_mapping tcm;

-- 6. Create club_teams relationships
-- First, ensure the club_teams table exists
DO $$ 
BEGIN
    -- Create club_teams table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'club_teams') THEN
        CREATE TABLE club_teams (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
            team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            team_suffix TEXT NOT NULL DEFAULT 'A',
            is_primary BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created club_teams table';
    END IF;
    
    -- Add unique constraint on club_teams(club_id, team_id) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'club_teams_club_id_team_id_unique' 
        AND conrelid = 'club_teams'::regclass
    ) THEN
        ALTER TABLE club_teams ADD CONSTRAINT club_teams_club_id_team_id_unique UNIQUE (club_id, team_id);
        RAISE NOTICE 'Added unique constraint on club_teams(club_id, team_id)';
    END IF;
END $$;

-- Now insert club_teams relationships, handling duplicates manually
INSERT INTO club_teams (club_id, team_id, team_suffix, is_primary)
SELECT 
    c.id as club_id,
    tcm.team_id,
    CASE 
        WHEN tcm.team_name ~ ' [A-Z]$' THEN 
            SUBSTRING(tcm.team_name FROM ' [A-Z]$')
        ELSE 'A'
    END as team_suffix,
    CASE 
        WHEN tcm.team_name ~ ' [A-Z]$' AND SUBSTRING(tcm.team_name FROM ' [A-Z]$') = ' A' THEN true
        ELSE false
    END as is_primary
FROM team_club_mapping tcm
JOIN clubs c ON c.name = tcm.extracted_club_name
WHERE NOT EXISTS (
    SELECT 1 FROM club_teams ct WHERE ct.club_id = c.id AND ct.team_id = tcm.team_id
);

-- 7. Update teams table to reference clubs
-- First, ensure teams table has club_id column
DO $$ 
BEGIN
    -- Add club_id column to teams table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'club_id') THEN
        ALTER TABLE teams ADD COLUMN club_id UUID REFERENCES clubs(id);
        RAISE NOTICE 'Added club_id column to teams table';
    END IF;
END $$;

-- Now update teams table to reference clubs
UPDATE teams 
SET club_id = ct.club_id
FROM club_teams ct
WHERE teams.id = ct.team_id;

-- 8. Show the results
SELECT 
    c.name as club_name,
    c.short_name,
    c.city,
    c.venue,
    c.web,
    c.logo_url,
    COUNT(ct.team_id) as team_count
FROM clubs c
LEFT JOIN club_teams ct ON c.id = ct.club_id
GROUP BY c.id, c.name, c.short_name, c.city, c.venue, c.web, c.logo_url
ORDER BY c.name;

-- 8.5. Show short name extraction examples
SELECT 
    name as original_name,
    short_name as extracted_short_name,
    CASE 
        WHEN name !~ ' ' THEN 'Single word'
        WHEN name ~ '^(FC|SK|TJ|FK|AC|SC|AS|US|SS|KS|MS|ZS|VS|PS|TS|JS|HS|KS|LS|NS|RS|WS|YS|ZS) ' THEN 'Club prefix'
        WHEN name ~ '^[A-Z][a-z]+ [A-Z][a-z]+' THEN 'Acronym created'
        WHEN name ~ '^[A-Za-z]+' THEN 'First word'
        ELSE 'Fallback'
    END as extraction_method
FROM clubs
ORDER BY name;

-- 9. Show teams with their new club relationships
SELECT 
    t.name as team_name,
    c.name as club_name,
    ct.team_suffix,
    ct.is_primary
FROM teams t
JOIN club_teams ct ON t.id = ct.team_id
JOIN clubs c ON ct.club_id = c.id
ORDER BY c.name, ct.team_suffix;

-- 10. Ensure standings table has club_id column
DO $$ 
BEGIN
    -- Add club_id column to standings table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standings' AND column_name = 'club_id') THEN
        ALTER TABLE standings ADD COLUMN club_id UUID REFERENCES clubs(id);
        RAISE NOTICE 'Added club_id column to standings table';
    END IF;
END $$;

-- 11. Clean up - drop the mapping table
DROP TABLE IF EXISTS team_club_mapping;
