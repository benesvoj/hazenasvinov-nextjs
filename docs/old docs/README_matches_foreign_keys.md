# Fixing Matches Foreign Key Constraints

## Problem
The `matches` table has `home_team_id` and `away_team_id` columns that should reference the new `club_category_teams` table, but the migration is failing because:

1. The `club_category_teams` table is empty
2. The old `teams` table IDs don't match the new `club_category_teams` table IDs
3. Foreign key constraints can't be added until all data is properly migrated

## Solution
Use the complete fix script that handles the entire migration process:

### Option 1: Use the Complete Script (Recommended)
```sql
-- Run this script in your Supabase SQL Editor
\i scripts/fix_matches_foreign_keys_complete.sql
```

This script will:
1. **Populate** the `club_category_teams` table with proper data structure
2. **Migrate** team IDs from old `teams` table to new `club_category_teams` table
3. **Add** foreign key constraints to ensure data integrity
4. **Verify** the migration was successful

### Option 2: Step-by-Step Approach
If you prefer to run the steps separately:

1. **First, investigate the current state:**
   ```sql
   \i scripts/investigate_club_structure.sql
   ```

2. **Fix any missing club_categories:**
   ```sql
   \i scripts/fix_missing_club_categories.sql
   ```

3. **Then, populate the table:**
   ```sql
   \i scripts/populate_club_category_teams.sql
   ```

4. **Finally, run the original migration:**
   ```sql
   \i scripts/update_matches_foreign_keys.sql
   ```

## What the Scripts Do

### `investigate_club_structure.sql`
- **Diagnostic script** to understand the current state
- Shows which clubs have categories and which are missing
- Helps identify what needs to be fixed

### `fix_missing_club_categories.sql`
- **Creates missing club_categories** for clubs that don't have them
- Ensures all clubs have at least one category entry
- Populates missing `club_category_teams` entries

### `fix_matches_foreign_keys_complete.sql`
- **Complete solution** that handles everything in one script
- **Step 1**: Creates `club_categories` entries if they don't exist
- **Step 2**: Populates `club_category_teams` with team entries (A, B, C, etc.)
- **Step 3**: Migrates existing match data to use new team IDs
- **Step 4**: Adds foreign key constraints and verifies success

### `populate_club_category_teams.sql`
- Only handles the population step
- Useful if you want to run the population separately

### `update_matches_foreign_keys.sql`
- The original migration script
- Only works after `club_category_teams` is populated

## Expected Output
When successful, you should see:
```
=== STEP 1: POPULATING CLUB_CATEGORY_TEAMS ===
Starting population of club_category_teams table...
Current state:
  - Total clubs: 20
  - Total club_categories: 20
  - Total club_category_teams: 20
  - Total teams: 20

=== STEP 2: MIGRATING TEAM IDS ===
Starting data migration to preserve all match data...
✅ All matches successfully migrated to new team structure

=== STEP 3: ADDING FOREIGN KEY CONSTRAINTS ===
Added matches_home_team_id_fkey constraint to club_category_teams
Added matches_away_team_id_fkey constraint to club_category_teams

=== STEP 4: FINAL VERIFICATION ===
✅ matches_home_team_id_fkey constraint exists
✅ matches_away_team_id_fkey constraint exists
Matches with invalid home_team_id: 0
Matches with invalid away_team_id: 0
=== MIGRATION COMPLETED SUCCESSFULLY ===
```

## Troubleshooting

### If you get "No seasons or categories found" error:
Make sure you have at least one season and one category in your database:
```sql
-- Check existing data
SELECT * FROM seasons LIMIT 5;
SELECT * FROM categories LIMIT 5;

-- Create basic data if needed
INSERT INTO seasons (name, start_date, end_date, is_active) 
VALUES ('2024/2025', '2024-09-01', '2025-06-30', true);

INSERT INTO categories (code, name, is_active) 
VALUES ('men', 'Muži', true);
```

### If only some clubs have teams:
Run the diagnostic script first to see what's missing:
```sql
\i scripts/investigate_club_structure.sql
```

Then fix any missing club_categories:
```sql
\i scripts/fix_missing_club_categories.sql
```

### If migration still fails:
Check the debug output to see which teams couldn't be migrated. The issue might be:
- Club names don't match exactly between `teams` and `clubs` tables
- Team suffixes aren't being extracted correctly
- Missing club entries for some teams

## After Migration
Once successful, your `matches` table will have proper foreign key constraints:
- `home_team_id` → `club_category_teams(id)`
- `away_team_id` → `club_category_teams(id)`

This ensures data integrity and allows the application to properly display team information using the new club-based structure.
