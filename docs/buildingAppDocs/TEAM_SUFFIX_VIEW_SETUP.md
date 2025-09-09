# Team Suffix Helper View Setup

## Overview

The `team_suffix_helper` view is a database view that solves the team suffix logic problem by providing category-aware team counts directly at the database level.

## Problem Solved

**Before**: When displaying matches from "all categories", the team suffix logic was counting teams across all categories, causing incorrect suffixes to be displayed.

**After**: The view provides per-category team counts, ensuring correct suffix logic regardless of whether a specific category or all categories are selected.

## What the View Provides

```sql
SELECT * FROM team_suffix_helper WHERE team_id = 'some-team-id';
```

**Columns:**
- `team_id`: Team identifier
- `team_suffix`: Team suffix (A, B, C, etc.)
- `club_category_id`: Club-category relationship ID
- `category_id`: Category identifier
- `club_id`: Club identifier
- `club_name`: Club name
- `club_short_name`: Club short name
- `club_logo_url`: Club logo URL
- `is_own_club`: Whether this is the user's own club
- `category_code`: Category code (e.g., "men", "women")
- `category_name`: Category name (e.g., "Muži", "Ženy")
- `team_count_in_category`: **Key field** - How many teams this club has in this specific category

## Setup

### Option 1: Automated Setup (Recommended)

```bash
npm run setup:team-suffix-view
```

### Option 2: Manual Setup

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL from `scripts/create_team_suffix_view.sql`

## Usage Examples

### Get Team Information with Suffix Logic

```sql
-- Get all teams for a specific club in a specific category
SELECT * FROM team_suffix_helper 
WHERE club_id = 'club-uuid' AND category_id = 'category-uuid';

-- Get team details for suffix logic
SELECT 
    team_id,
    team_suffix,
    club_name,
    category_name,
    team_count_in_category,
    CASE 
        WHEN team_count_in_category > 1 THEN CONCAT(club_name, ' ', team_suffix)
        ELSE club_name
    END as display_name
FROM team_suffix_helper 
WHERE team_id = 'team-uuid';
```

### Integration with Matches Query

```sql
-- Get matches with proper team suffix logic
SELECT 
    m.*,
    home_team.team_id as home_team_id,
    home_team.display_name as home_team_name,
    away_team.team_id as away_team_id,
    away_team.display_name as away_team_name
FROM matches m
JOIN team_suffix_helper home_team ON m.home_team_id = home_team.team_id
JOIN team_suffix_helper away_team ON m.away_team_id = away_team.team_id
WHERE m.category_id = 'category-uuid';
```

## Benefits

1. **🎯 Category-Aware**: Team counts are always per-category, never global
2. **🚀 Performance**: Pre-calculated counts at database level
3. **🧹 Clean Code**: No complex filtering logic needed in application
4. **🔄 Consistent**: Same logic across all parts of the application
5. **📊 Accurate**: Real-time data from the database

## Next Steps

After setting up this view, the application can be updated to:

1. **Replace complex team counting logic** with simple queries to this view
2. **Simplify the `usePublicMatches` hook** by using the view directly
3. **Make suffix logic consistent** across all components
4. **Improve performance** by reducing application-level data processing

## Troubleshooting

### View Not Created
- Check that you have the necessary permissions in Supabase
- Ensure all referenced tables exist and are accessible
- Run the SQL manually in Supabase SQL Editor

### Performance Issues
- Views cannot have indexes in PostgreSQL
- Ensure underlying tables have appropriate indexes:
  - `club_category_teams(id, club_category_id)`
  - `club_categories(id, club_id, category_id)`
  - `clubs(id, is_active)`
  - `categories(id, code)`
- Monitor query performance in Supabase dashboard

### Data Not Updating
- The view automatically reflects changes to underlying tables
- No manual refresh needed
- Check that the underlying data is being updated correctly
