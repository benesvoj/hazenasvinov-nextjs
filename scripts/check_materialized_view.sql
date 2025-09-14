-- Check the current state of the materialized view
-- Run this in your Supabase SQL Editor

-- 1. Check if the materialized view exists
SELECT 
  schemaname,
  matviewname,
  matviewowner,
  hasindexes,
  ispopulated,
  definition
FROM pg_matviews 
WHERE matviewname = 'own_club_matches';

-- 2. Check the materialized view status
SELECT 
  schemaname,
  matviewname,
  matviewowner,
  hasindexes,
  ispopulated
FROM pg_matviews 
WHERE matviewname = 'own_club_matches';

-- 2b. Check if we can get refresh time from system catalogs
SELECT 
  c.relname as view_name,
  c.reltuples as estimated_rows,
  c.relpages as pages,
  c.relkind as relation_type
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'own_club_matches' 
AND n.nspname = 'public';

-- 3. Compare data between matches table and materialized view
-- Check a specific match that was recently updated
SELECT 
  'matches' as source,
  id,
  status,
  home_score,
  away_score,
  updated_at
FROM matches 
WHERE id = 'a54629c4-402c-4965-8e01-e96093bfc932'
UNION ALL
SELECT 
  'own_club_matches' as source,
  id,
  status,
  home_score,
  away_score,
  updated_at
FROM own_club_matches 
WHERE id = 'a54629c4-402c-4965-8e01-e96093bfc932';

-- 4. Check if the RPC function exists
SELECT 
  proname,
  proargnames,
  prosrc
FROM pg_proc 
WHERE proname = 'refresh_materialized_view';

-- 5. Try to refresh the materialized view manually
REFRESH MATERIALIZED VIEW own_club_matches;

-- 6. Check the data again after refresh
SELECT 
  'own_club_matches_after_refresh' as source,
  id,
  status,
  home_score,
  away_score,
  updated_at
FROM own_club_matches 
WHERE id = 'a54629c4-402c-4965-8e01-e96093bfc932';
