# Category System Troubleshooting Guide

If you're seeing the error "Failed to fetch matches: {}", this guide will help you resolve it.

## Quick Diagnosis

Visit `/api/check-database` in your browser to see which database tables exist and their status.

## Common Issues & Solutions

### 1. **Missing Database Tables**

The category system requires these tables to exist:

#### Required Tables:
- ✅ `categories` - Category definitions
- ✅ `seasons` - Season information  
- ✅ `matches` - Match data
- ⚠️ `team_standings` - Optional, for standings table

### 2. **Missing Categories Table**

**Error**: "Category not found" or "categories table doesn't exist"

**Solution**: Create the categories table:

```sql
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(100),
    gender VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample category
INSERT INTO categories (code, name, description, age_group, gender, sort_order) VALUES
    ('men', 'Muži', '1.liga mužů, SM oblast', '18+', 'male', 1),
    ('women', 'Ženy', 'Oblastní liga žen, SM oblast', '18+', 'female', 2),
    ('junior-boys', 'Dorostenci', 'Junioři 15-18 let, SM oblast', '15-18', 'male', 3),
    ('junior-girls', 'Dorostenky', 'Juniorky 15-18 let, SM oblast', '15-18', 'female', 4);
```

### 3. **Missing Seasons Table**

**Error**: "Active season not found" or "seasons table doesn't exist"

**Solution**: Create the seasons table:

```sql
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a sample active season
INSERT INTO seasons (name, is_active) VALUES
    ('2024/2025', true);
```

### 4. **Missing Teams Table**

**Error**: "Teams table does not exist" or "No team data available"

**Solution**: Create the teams table:

```sql
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    city VARCHAR(255),
    logo_url TEXT,
    is_own_club BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert your club team
INSERT INTO teams (name, short_name, city, is_own_club) 
VALUES ('TJ Sokol Svinov', 'Svinov', 'Ostrava', true)
ON CONFLICT (name) DO NOTHING;
```

### 5. **Missing Matches Table**

**Error**: "Matches table does not exist" or "Failed to fetch matches"

**Solution**: Create the teams and matches tables:

```sql
-- Run this in your Supabase SQL Editor

-- First, create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    city VARCHAR(255),
    logo_url TEXT,
    is_own_club BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Then create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    time TIME,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    venue VARCHAR(255),
    competition VARCHAR(255),
    status VARCHAR(50) DEFAULT 'upcoming',
    home_score INTEGER,
    away_score INTEGER,
    matchweek INTEGER,
    match_number INTEGER,
    category_id UUID REFERENCES categories(id),
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert your club team
INSERT INTO teams (name, short_name, city, is_own_club) 
VALUES ('TJ Sokol Svinov', 'Svinov', 'Ostrava', true)
ON CONFLICT (name) DO NOTHING;

-- Insert a sample match with your club
INSERT INTO matches (date, time, venue, competition, status, home_team_id, away_team_id, category_id, season_id) 
SELECT 
    '2024-09-15 16:00:00',
    '16:00:00',
    'Sportovní hala Svinov',
    '1. liga mužů',
    'upcoming',
    t.id,
    (SELECT id FROM teams WHERE name = 'Sparta Praha' LIMIT 1),
    c.id,
    s.id
FROM teams t, seasons s, categories c 
WHERE t.is_own_club = true 
  AND s.is_active = true 
  AND c.code = 'men'
LIMIT 1;
```

### 5. **Missing Team Standings Table (Optional)**

**Error**: Standings table shows fallback message

**Solution**: Create the team_standings table:

```sql
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS team_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) NOT NULL,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step-by-Step Setup

### 1. **Check Current Status**
Visit `/api/check-database` to see what's missing.

### 2. **Create Missing Tables**
Run the SQL commands above for any missing tables.

### 3. **Add Sample Data**
Insert at least:
- One team marked as your own club (`is_own_club = true`)
- One category (e.g., 'men')
- One active season
- One match where your club is playing (either home or away)

### 4. **Test the System**
Visit `/categories/men` to see if it works.

## Debug Information

The category page now includes a debug component that shows:
- 🔍 What data was found
- ❌ Any errors that occurred
- 📊 Database query results
- 💡 Troubleshooting tips

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Still Having Issues?

1. **Check browser console** for detailed error logs
2. **Visit `/api/check-database`** for database status
3. **Verify Supabase connection** in your dashboard
4. **Check RLS policies** if tables exist but queries fail

## Quick Test

Try this simple test in your Supabase SQL Editor:

```sql
-- Test if basic tables exist
SELECT 
    'category' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'category') as exists
UNION ALL
SELECT 
    'seasons' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'seasons') as exists
UNION ALL
SELECT 
    'matches' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'matches') as exists;
```

This will show you exactly which tables are missing.
