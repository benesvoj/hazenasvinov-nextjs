-- Add missing category_id columns to tables that don't have them
-- This script will add category_id columns to any tables that are missing them

-- Step 1: Add category_id to training_sessions if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'training_sessions' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE training_sessions ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_training_sessions_category_id ON training_sessions(category_id);
        RAISE NOTICE 'Added category_id column to training_sessions';
    ELSE
        RAISE NOTICE 'training_sessions already has category_id column';
    END IF;
END $$;

-- Step 2: Add category_id to category_lineup_members if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineup_members' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE category_lineup_members ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_category_lineup_members_category_id ON category_lineup_members(category_id);
        RAISE NOTICE 'Added category_id column to category_lineup_members';
    ELSE
        RAISE NOTICE 'category_lineup_members already has category_id column';
    END IF;
END $$;

-- Step 3: Add category_id to members if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE members ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_members_category_id ON members(category_id);
        RAISE NOTICE 'Added category_id column to members';
    ELSE
        RAISE NOTICE 'members already has category_id column';
    END IF;
END $$;

-- Step 4: Add category_id to matches if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'matches' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE matches ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_matches_category_id ON matches(category_id);
        RAISE NOTICE 'Added category_id column to matches';
    ELSE
        RAISE NOTICE 'matches already has category_id column';
    END IF;
END $$;

-- Step 5: Add category_id to standings if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'standings' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE standings ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_standings_category_id ON standings(category_id);
        RAISE NOTICE 'Added category_id column to standings';
    ELSE
        RAISE NOTICE 'standings already has category_id column';
    END IF;
END $$;

-- Step 6: Add category_id to blog_posts if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
        RAISE NOTICE 'Added category_id column to blog_posts';
    ELSE
        RAISE NOTICE 'blog_posts already has category_id column';
    END IF;
END $$;

-- Step 7: Add category_id to category_lineups if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'category_lineups' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE category_lineups ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_category_lineups_category_id ON category_lineups(category_id);
        RAISE NOTICE 'Added category_id column to category_lineups';
    ELSE
        RAISE NOTICE 'category_lineups already has category_id column';
    END IF;
END $$;

-- Step 8: Add category_id to club_categories if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'club_categories' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE club_categories ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_club_categories_category_id ON club_categories(category_id);
        RAISE NOTICE 'Added category_id column to club_categories';
    ELSE
        RAISE NOTICE 'club_categories already has category_id column';
    END IF;
END $$;

-- Step 9: Add category_id to club_teams if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'club_teams' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE club_teams ADD COLUMN category_id UUID REFERENCES categories(id);
        CREATE INDEX IF NOT EXISTS idx_club_teams_category_id ON club_teams(category_id);
        RAISE NOTICE 'Added category_id column to club_teams';
    ELSE
        RAISE NOTICE 'club_teams already has category_id column';
    END IF;
END $$;

-- Step 10: Final verification
DO $$ 
DECLARE
    table_name TEXT;
    has_category_id BOOLEAN;
    expected_tables TEXT[] := ARRAY[
        'training_sessions', 
        'category_lineup_members', 
        'members', 
        'matches', 
        'standings', 
        'blog_posts',
        'category_lineups',
        'club_categories',
        'club_teams'
    ];
    missing_tables TEXT[] := '{}';
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        -- Check if table exists and has category_id column
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_name
            AND column_name = 'category_id'
        ) INTO has_category_id;
        
        IF has_category_id THEN
            RAISE NOTICE '✅ % - HAS category_id column', table_name;
        ELSE
            RAISE NOTICE '❌ % - MISSING category_id column', table_name;
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Still missing category_id in: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '🎉 All tables now have category_id column!';
    END IF;
END $$;
