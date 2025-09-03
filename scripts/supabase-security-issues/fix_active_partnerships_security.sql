-- Fix active_partnerships SECURITY DEFINER security warning
-- This script ensures the active_partnerships view is properly secured

-- 1. Drop the existing view if it exists
DROP VIEW IF EXISTS active_partnerships;

-- 2. Recreate the view without SECURITY DEFINER
-- This view only exposes public partnership information for active partnerships
CREATE OR REPLACE VIEW active_partnerships AS
SELECT 
    'main_partner' as partner_type,
    id,
    name,
    level,
    start_date,
    end_date,
    status,
    created_at
FROM main_partners 
WHERE status = 'active'

UNION ALL

SELECT 
    'business_partner' as partner_type,
    id,
    name,
    partnership_type as level,
    start_date,
    NULL as end_date,
    status,
    created_at
FROM business_partners 
WHERE status = 'active'

UNION ALL

SELECT 
    'media_partner' as partner_type,
    id,
    name,
    media_type as level,
    start_date,
    NULL as end_date,
    status,
    created_at
FROM media_partners 
WHERE status = 'active';

-- 3. Grant appropriate permissions
-- This view contains only public partnership information, so it's safe for authenticated users
GRANT SELECT ON active_partnerships TO authenticated;

-- 4. Add comment explaining the view's purpose
COMMENT ON VIEW active_partnerships IS 'Active partnerships from all partner types - safe for all authenticated users';

-- 5. Verify the view was created without SECURITY DEFINER
-- This query will show if the view has SECURITY DEFINER (it shouldn't)
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'active_partnerships' 
AND schemaname = 'public';
