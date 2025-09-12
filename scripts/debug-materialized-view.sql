-- Debug script to check the materialized view status

-- 1. Check if the materialized view exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'own_club_matches'
) as view_exists;

-- 2. Check the columns in the materialized view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'own_club_matches' 
ORDER BY ordinal_position;

-- 3. Check if there's any data in the materialized view
SELECT COUNT(*) as row_count FROM own_club_matches;

-- 4. Check a sample record to see what columns are available
SELECT * FROM own_club_matches LIMIT 1;

-- 5. Check if category columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'own_club_matches' 
    AND column_name = 'category_name'
  ) THEN 'YES' ELSE 'NO' END as has_category_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'own_club_matches' 
    AND column_name = 'category_id_full'
  ) THEN 'YES' ELSE 'NO' END as has_category_id_full;
