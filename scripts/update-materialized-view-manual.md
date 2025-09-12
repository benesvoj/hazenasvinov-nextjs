# Manual Materialized View Update

Since the direct PostgreSQL connection failed, you need to run this SQL script manually in the Supabase SQL editor.

## Steps:

1. **Go to Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the SQL Script**
   - Copy the contents of `scripts/update-own-club-matches-view.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

3. **Verify the Update**
   - Check that the materialized view was created successfully
   - Verify it includes category and season information

## Alternative: Use Application Code

If you prefer, you can also run this update programmatically using the application's Supabase client. The script is already prepared in `scripts/update-own-club-matches-view.sql`.

## What This Fixes

This update will resolve the console message:
> "Materialized view missing category information, falling back to regular query"

After running this script, the optimized queries will work properly and you should see better performance.
