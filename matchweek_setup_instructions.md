# Matchweek Feature Setup

## Database Setup Required

The matchweek feature requires a database column to be added. Please run the following SQL in your Supabase SQL Editor:

### Step 1: Add the matchweek column

```sql
-- Add matchweek column to matches table
ALTER TABLE matches 
ADD COLUMN matchweek INTEGER;

-- Add a comment to document the column
COMMENT ON COLUMN matches.matchweek IS 'Match week/round number for organizing matches in competitions';

-- Optional: Add an index for better performance when filtering by matchweek
CREATE INDEX IF NOT EXISTS idx_matches_matchweek ON matches(matchweek);
```

### Step 2: Verify the column was added

You can verify the column was added by running:

```sql
-- Check if the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'matchweek';
```

## What This Fixes

The error you're seeing (`Error updating match: {}`) is likely because the `matchweek` column doesn't exist in your database yet. After running the SQL above, the matchweek feature will work properly.

## Features Available After Setup

✅ **Add Matchweek**: When creating new matches, you can specify the round number  
✅ **Edit Matchweek**: Existing matches can be updated with round information  
✅ **Grouped Display**: Matches are automatically grouped by matchweek in the admin interface  
✅ **Smart Sorting**: Rounds are displayed in numerical order  
✅ **Fallback Handling**: Matches without matchweek are grouped under "Bez kola"  

## Temporary Workaround

If you need to use the edit functionality immediately, the code has been updated to handle missing matchweek columns gracefully. The matchweek field will be ignored until the database column is added.

## Testing

After adding the column:
1. Try editing an existing match
2. Add a matchweek number
3. Save the changes
4. Verify the match appears in the correct group in the admin interface
